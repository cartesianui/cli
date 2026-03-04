import fs from 'fs-extra';
import { pascalCase, kebabCase } from './strings.js';
import { insertImportSectionBeforeFirstExportFunc, formatMultiLineImport } from './code-insert.js';

function injectIntoImportProvidersFrom(content: string, innerLines: string[]) {
  return content.replace(
    /(importProvidersFrom\s*\([\s\S]*?)(\n\s*\)\s*,)/m,
    (_, start, end) => {
      const indent = (start.match(/(\n\s*)[^\n]*$/)?.[1] ?? '\n      ');
      const injected = innerLines.map(line => `${indent}${line},`).join('');
      return `${start}${injected}${end}`;
    }
  );
}

export function appendSharedProvidersAtEnd(
  content: string,
  providers: string[]
): string {
  if (!providers.length) return content;

  return content.replace(
    /makeEnvironmentProviders\(\s*\[((?:\[[^\]]*\]|[^\]])*)\]\s*\)/gm,
    (m, inside) => {
      const lines = inside.split('\n');

      // find last non-empty real item line
      let i = lines.length - 1;
      while (i >= 0 && !lines[i].trim()) i--;

      // add comma if last real element has no comma
      if (i >= 0 && !lines[i].trim().endsWith(',')) {
        lines[i] = lines[i] + ',';
      }

      // get indentation from last line OR at least 2 spaces
      const indent = lines[i]?.match(/^\s*/)?.[0] ?? '  ';

      // append
      for (const p of providers) {
        lines.push(`${indent}${p},`);
      }

      // return without touching ANYTHING else
      return `makeEnvironmentProviders([${lines.join('\n')}])`;
    }
  );
}

function cleanupMakeEnvironmentProvidersFormatting(content: string) {

  // remove comma right after [
  content = content.replace(/\[\s*,/g, '[');

  // ensure space after comma before ]
  content = content.replace(/,\s*\]/g, ', ]');

  // ensure there is newline after top-level [
  content = content.replace(
    /(makeEnvironmentProviders\(\s*\[)(\S)/gm,
    (_m, a, b) => `${a}\n  ${b}`
  );

  // ensure newline before top-level ])
  content = content.replace(
    /(\S)(\]\s*\))/gm,
    (_m, a, b) => `${a}\n${b}`
  );

  // trim and indent top-level providers block
  content = content.replace(
    /makeEnvironmentProviders\(\s*\[((?:\[[^\]]*\]|[^\]])*)\]\s*\)/gms,
    (m, inside) => {
      const lines = inside
        .split('\n')
        .map(x => x.trimEnd())
        .filter((x, i) => !(i === 0 && x.trim() === '')) // remove empty first line
        .map(l => '  ' + l); // indent 2 spaces

      return `makeEnvironmentProviders([\n${lines.join('\n')}\n])`;
    }
  );

  // collapse multi-line EffectsModule.forFeature([...]) arrays to single line
  content = content.replace(
    /EffectsModule\.forFeature\(\[\s*([\s\S]*?)\s*\]\)/gm,
    (_m, inner) => {
      const trimmed = inner
        .split('\n')
        .map(l => l.trim())
        .filter(l => l) // remove empty lines
        .join(', '); // join with comma + space
      return `EffectsModule.forFeature([${trimmed}])`;
    }
  );

  return content;
}

export function transformProviders(
  content: string, importSection: string, storeEffectSet: string[], storeFeatureSet: string[], sharedSet: string[]): string {

  content = insertImportSectionBeforeFirstExportFunc(content, importSection);

  content = injectIntoImportProvidersFrom(content, [
    ...storeFeatureSet,
    storeEffectSet.length
      ? `EffectsModule.forFeature([${storeEffectSet.join(', ')}])`
      : ''
  ].filter(Boolean));

  content = appendSharedProvidersAtEnd(content, sharedSet);

  content = cleanupMakeEnvironmentProvidersFormatting(content);

  return content;
}

export async function enhanceProviderFileWithEntities(moduleFilePath, entities) {
  let content = await fs.readFile(moduleFilePath, 'utf8');

  const importStatementSet = new Set();
  const importStoreSet = new Set();
  const importSharedSet = new Set();

  const storeEffectSet =  [];
  const storeFeatureSet =  [];
  const httpServiceSet = new Set();

  for (const entity of entities) {
    const pascalEntity = pascalCase(entity);

    // for import statements
    const storeFeature = `from${pascalEntity}`;
    importStoreSet.add(storeFeature);
    importStoreSet.add(`${pascalEntity}Effects `);
    importSharedSet.add(`${pascalEntity}HttpService`);

    // to use in providers
    httpServiceSet.add(`${pascalEntity}HttpService`);
    storeEffectSet.push(`${pascalEntity}Effects`);
    storeFeatureSet.push(`StoreModule.forFeature(${storeFeature}.featureKey, ${storeFeature}.reducer)`);
  }

  const storeImports = formatMultiLineImport(importStoreSet, './store');
  importStatementSet.add(storeImports);

  const sharedImports = formatMultiLineImport(importSharedSet, './shared');
  importStatementSet.add(sharedImports);

  const combinedImportStatementSet = new Set([
    ...importStatementSet,
  ]);

  // Inject imports before @NgModule
  const importSection = Array.from(combinedImportStatementSet).join('\n');

  const sharedSet = Array.from(httpServiceSet) as string[];

  content = transformProviders(content, importSection, storeEffectSet, storeFeatureSet, sharedSet)

  await fs.writeFile(moduleFilePath, content, 'utf8');
}
