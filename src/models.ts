import fs from 'fs-extra';
import path from 'path';
import { kebabCase, readableCase } from './strings.js';
import { logInfo, logError } from './logger.js';
import { removeStubMarkers } from './ast-helpers.js';

export function getInterfaceNameFromFileName(fileName: string): string {
  // Remove extension
  const baseName = fileName.replace(/\.model\.ts$/, '');

  // Convert kebab-case or snake_case to PascalCase
  const pascal = baseName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return `I${pascal}`;
}

export function parseInterface(content, interfaceName) {
  const regex = new RegExp(`export interface ${interfaceName} {([\\s\\S]*?)}`, 'm');
  const match = content.match(regex);

  if (!match) {
    logError(`Interface ${interfaceName} not found`);
    return false;
  } else {
    const fieldsBlock = match[1];
    const fieldLines = fieldsBlock
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => line.includes(':'));

    const fieldNames = fieldLines.map((line) => {
        const [key] = line.split(':');
        return key.replace(/[?]/g, '').trim();
    });

    return fieldNames;
  }
}

//==========================================================================================
//                         Hydration: Fields Mode (static overrides)
//==========================================================================================

function generateDataTableCols(fields: string[]): string {
  const lines = fields.map(
    (f) => `      { key: '${f}', label: '${readableCase(f)}', opt: {} }`
  ).join(',\n');

  return `  static override get dataTableCols(): FieldDescriptor[] {\n    return [\n${lines}\n    ];\n  }`;
}

function generateFormFields(fields: string[]): string {
  const lines = fields
  .filter(f => f.trim().toLowerCase() !== 'id')
  .map(
    (f) => `    { key: '${f}', label: '${readableCase(f)}', opt: { validators: [Validators.required] } }`
  ).join(',\n');

  return `  static override formFields: FieldDescriptor[] = [\n${lines}\n  ];`;
}

function generateSearchFormFields(fields: string[]): string {
  const lines = fields
  .map(
    (f) => `      ${f}: { column: '${f}', operator: '=', value: null }`
  ).join(',\n');

  return `  static override get searchForm() {\n    return {\n${lines}\n    };\n  }`;
}

//==========================================================================================
//                         Hydration: Entity Decorator (@EntityMeta)
//==========================================================================================

function generateEntityMeta(fields: string[]): string {
  const nonIdFields = fields.filter(f => f.trim().toLowerCase() !== 'id');

  const listLines = fields.map(
    f => `    { key: '${f}', label: '${readableCase(f)}', opt: {} }`
  ).join(',\n');

  const formLines = nonIdFields.map(
    f => `    { key: '${f}', label: '${readableCase(f)}', opt: { validators: [Validators.required] } }`
  ).join(',\n');

  const searchLines = fields.map(
    f => `    ${f}: { column: '${f}', operator: '=', value: null }`
  ).join(',\n');

  return `@EntityMeta({
  list: [
${listLines}
  ],
  form: [
${formLines}
  ],
  search: {
${searchLines}
  }
})`;
}

//==========================================================================================
//                         Hydration: Attribute Decorators (@ListMeta, @FormMeta, @SearchMeta)
//==========================================================================================

function generateAttributeDecorators(fields: string[]): Map<string, string[]> {
  const decorators = new Map<string, string[]>();

  for (const f of fields) {
    const lines: string[] = [];
    lines.push(`  @ListMeta({ label: '${readableCase(f)}', opt: {} })`);
    if (f.trim().toLowerCase() !== 'id') {
      lines.push(`  @FormMeta({ label: '${readableCase(f)}', opt: { validators: [Validators.required] } })`);
    }
    lines.push(`  @SearchMeta({ column: '${f}', operator: '=', value: null })`);
    decorators.set(f, lines);
  }

  return decorators;
}

//==========================================================================================
//                         Hydration: Update Common Imports
//==========================================================================================

function updateCommonImports(content: string, hydrateMode: string): string {
  if (hydrateMode === 'entity') {
    return content.replace(
      /import\s*\{([^}]*)\}\s*from\s*'@cartesianui\/common'/,
      (match, imports) => {
        if (!imports.includes('EntityMeta')) {
          return match.replace(imports, imports.trimEnd() + ', EntityMeta');
        }
        return match;
      }
    );
  } else if (hydrateMode === 'attribute') {
    return content.replace(
      /import\s*\{([^}]*)\}\s*from\s*'@cartesianui\/common'/,
      (match, imports) => {
        const needed = ['ListMeta', 'FormMeta', 'SearchMeta'];
        const missing = needed.filter(n => !imports.includes(n));
        if (missing.length) {
          return match.replace(imports, imports.trimEnd() + ', ' + missing.join(', '));
        }
        return match;
      }
    );
  }
  return content;
}

function injectEntityMetaDecorator(content: string, entityMetaBlock: string): string {
  // Insert @EntityMeta({...}) directly before `export class`
  return content.replace(
    /^(export class )/m,
    `${entityMetaBlock}\n$1`
  );
}

function injectAttributeDecorators(content: string, decoratorMap: Map<string, string[]>): string {
  // Find the class body so we only inject decorators on class properties, not interface members
  const classMatch = content.match(/^(export class \w+[^{]*\{)([\s\S]*)/m);
  if (!classMatch) return content;

  const beforeClass = content.slice(0, classMatch.index!);
  const classHeader = classMatch[1];
  let classBody = classMatch[2];

  for (const [field, decoratorLines] of decoratorMap) {
    // Match property declarations like: `  public fieldName: type;` or `  fieldName?: type;`
    const propRegex = new RegExp(`^(\\s*(?:public\\s+)?${field}[?]?\\s*[:;])`, 'm');
    const match = classBody.match(propRegex);
    if (match) {
      const decoratorBlock = '\n' + decoratorLines.join('\n') + '\n';
      classBody = classBody.replace(propRegex, `${decoratorBlock}$1`);
    }
  }

  return beforeClass + classHeader + classBody;
}

function removePlaceholderComments(content: string): string {
  return content
    .replace(/\s*\/\* LIST_VIEW_FIELDS \*\/\s*/g, '\n')
    .replace(/\s*\/\* FORM_FIELDS \*\/\s*/g, '\n')
    .replace(/\s*\/\* SEARCH_FORM \*\/\s*/g, '\n');
}

//==========================================================================================
//                         Main: enhanceModels
//==========================================================================================

export async function enhanceModels(destPath: string, entities, hydrateMode = 'fields') {

  const domainDir = path.join(destPath, 'src', 'lib', 'models', 'domain');

  const files = await fs.promises.readdir(domainDir);

  const entityFiles = entities.map(e => `${kebabCase(e)}.model.ts`);

  for (const file of files) {
    if(entityFiles.includes(file)){
      const fullPath = path.join(domainDir, file);
      const stat = await fs.promises.stat(fullPath);

      if (stat.isFile() && file !== 'index.ts') {
          let fileContent = await fs.promises.readFile(fullPath, 'utf8');

          const interfaceName = getInterfaceNameFromFileName(file);

          const fieldNames = parseInterface(fileContent, interfaceName);

          if(fieldNames) {
            logInfo(`<${interfaceName}> Hydrating model (mode: ${hydrateMode}).`);

            if (hydrateMode === 'entity') {
              // --- Entity Decorator Mode (@EntityMeta) ---
              const entityMeta = generateEntityMeta(fieldNames);
              fileContent = updateCommonImports(fileContent, 'entity');
              fileContent = injectEntityMetaDecorator(fileContent, entityMeta);
              fileContent = removePlaceholderComments(fileContent);

            } else if (hydrateMode === 'attribute') {
              // --- Attribute Decorator Mode (@ListMeta, @FormMeta, @SearchMeta) ---
              const decoratorMap = generateAttributeDecorators(fieldNames);
              fileContent = updateCommonImports(fileContent, 'attribute');
              fileContent = injectAttributeDecorators(fileContent, decoratorMap);
              fileContent = removePlaceholderComments(fileContent);

            } else {
              // --- Fields Mode (default, static overrides via text) ---
              fileContent = removeStubMarkers(fileContent);

              const dataTableCols = generateDataTableCols(fieldNames);
              const formFields = generateFormFields(fieldNames);
              const searchFormFields = generateSearchFormFields(fieldNames);

              // Insert all three blocks before the class closing brace
              const memberBlock = '\n' + dataTableCols + '\n\n' + formFields + '\n\n' + searchFormFields + '\n';
              const lastBrace = fileContent.lastIndexOf('}');
              if (lastBrace >= 0) {
                fileContent = fileContent.slice(0, lastBrace).trimEnd() + '\n' + memberBlock + '}\n';
              }
            }

            await fs.promises.writeFile(fullPath, fileContent, 'utf8');
          }
      }
    }
  }
}
