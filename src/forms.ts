import fs from 'fs-extra';
import path from 'path';
import { kebabCase, readableCase } from './strings.js';
import { logInfo } from './logger.js';
import { getInterfaceNameFromFileName, parseInterface } from './models.js';

function generateFormHtml(fields: string[]): string {
  const cleanFields = fields.filter(f => f.trim().toLowerCase() !== 'id');
  const mid = Math.ceil(cleanFields.length / 2);

  const toFormGroup = (f: string) => `
                <div class="form-group">
                  <with-validation>
                    <label>${readableCase(f)}</label>
                    <input validate required formControlName="${f}" class="form-control" placeholder="${readableCase(f)}"/>
                  </with-validation>
                </div>`;

  const leftFields = cleanFields.slice(0, mid).map(toFormGroup).join("\n");
  const rightFields = cleanFields.slice(mid).map(toFormGroup).join("\n");

  return `
    <div class="row">
      <div class="col-md-6">
    ${leftFields}
      </div>
      <div class="col-md-6">
    ${rightFields}
      </div>
    </div>`;
}

function insertFormContent(formContent: string, createFormHtml: string): string {
  const placeholder = '<!-- FORM PLACE HOLDER -->';

  // Find placeholder indent
  const lines = formContent.split('\n');
  const placeholderLine = lines.find(line => line.includes(placeholder)) || '';
  const indentMatch = placeholderLine.match(/^(\s*)/);
  const baseIndent = indentMatch ? indentMatch[1] : '';

  // Normalize the inserted block indentation
  const htmlLines = createFormHtml.split('\n');

  // Find the minimum non-empty indent in the block
  const minIndent = Math.min(
    ...htmlLines
      .filter(line => line.trim())
      .map(line => (line.match(/^(\s*)/)?.[1].length ?? 0))
  );

  const normalizedHtml = htmlLines
    .map(line => line.slice(minIndent)) // remove extra indent
    .map(line => (line.trim() ? baseIndent + line : '')) // add base indent
    .join('\n');

  return formContent.replace(
    placeholder,
    `${normalizedHtml}\n${baseIndent}${placeholder}`
  );
}

export async function enhanceFormHtml(destPath: string, entities) {
  const uiDir = path.join(destPath, 'src', 'lib', 'ui');
  const domainDir = path.join(destPath, 'src', 'lib', 'models', 'domain');

  // Build full paths for form files
  const createFormFiles = entities.map(e =>
    path.join(uiDir, kebabCase(e), 'create', 'create.component.html')
  );
  const editFormFiles = entities.map(e =>
    path.join(uiDir, kebabCase(e), 'edit', 'edit.component.html')
  );

  // Build entity model file map
  const entityFiles = entities.reduce((map, e) => {
    map[kebabCase(e)] = path.join(domainDir, `${kebabCase(e)}.model.ts`);
    return map;
  }, {} as Record<string, string>);

  // Loop through create form files
  for (const formPath of createFormFiles) {
    try {
      const stat = await fs.promises.stat(formPath);

      if (stat.isFile()) {
        const entityName = path.basename(path.dirname(path.dirname(formPath))); // folder = entity name
        console.log(entityName);
        const modelFile = `${entityName}.model.ts`;
        const modelPath = entityFiles[entityName];

        let modelContent = await fs.promises.readFile(modelPath, 'utf8');
        const interfaceName = getInterfaceNameFromFileName(modelFile);
        const fieldNames = parseInterface(modelContent, interfaceName);

        if(fieldNames) {
          logInfo(`<${interfaceName}> Generating Create Form Html.`);
          let formContent = await fs.promises.readFile(formPath, 'utf8');
          const createFormHtml = generateFormHtml(fieldNames);
          formContent = insertFormContent(formContent, createFormHtml);
          await fs.promises.writeFile(formPath, formContent, 'utf8');
        }
      }
    } catch {
      // form file doesn't exist
    }
  }

  for (const formPath of editFormFiles) {
    try {
      const stat = await fs.promises.stat(formPath);

      if (stat.isFile()) {
        const entityName = path.basename(path.dirname(path.dirname(formPath))); // folder = entity name
        console.log(entityName);
        const modelFile = `${entityName}.model.ts`;
        const modelPath = entityFiles[entityName];

        let modelContent = await fs.promises.readFile(modelPath, 'utf8');
        const interfaceName = getInterfaceNameFromFileName(modelFile);
        const fieldNames = parseInterface(modelContent, interfaceName);

        if(fieldNames) {
          logInfo(`<${interfaceName}> Generating Edit Form Html.`);
          let formContent = await fs.promises.readFile(formPath, 'utf8');
          const editFormHtml = generateFormHtml(fieldNames);
          formContent = insertFormContent(formContent, editFormHtml);
          await fs.promises.writeFile(formPath, formContent, 'utf8');
        }
      }
    } catch {
      // form file doesn't exist
    }
  }
}
