import { pascalCase } from './strings.js';
import { addImportToContent, readFile, writeFile } from './ast-helpers.js';

export async function enhanceProviderFileWithEntities(moduleFilePath: string, entities: string[]) {
  let content = await readFile(moduleFilePath);

  const storeImports: string[] = [];
  const sharedImports: string[] = [];
  const storeFeatureLines: string[] = [];
  const effectsList: string[] = [];
  const httpServices: string[] = [];

  for (const entity of entities) {
    const pascalEntity = pascalCase(entity);
    const selectorName = `from${pascalEntity}`;
    const effectsName = `${pascalEntity}Effects`;
    const httpServiceName = `${pascalEntity}HttpService`;

    storeImports.push(selectorName, effectsName);
    sharedImports.push(httpServiceName);

    // Check if already present (idempotency)
    if (!content.includes(`StoreModule.forFeature(${selectorName}.featureKey`)) {
      storeFeatureLines.push(`      StoreModule.forFeature(${selectorName}.featureKey, ${selectorName}.reducer)`);
    }
    if (!content.includes(effectsName)) {
      effectsList.push(effectsName);
    }
    if (!content.includes(httpServiceName)) {
      httpServices.push(httpServiceName);
    }
  }

  // Add import declarations
  if (storeImports.length) {
    content = addImportToContent(content, './store', storeImports);
  }
  if (sharedImports.length) {
    content = addImportToContent(content, './shared', sharedImports);
  }

  // ── 1. Inject StoreModule.forFeature(...) lines into importProvidersFrom ──
  if (storeFeatureLines.length) {
    const storeBlock = storeFeatureLines.join(',\n');
    content = content.replace(
      /(\/\/ Store Providers)/,
      `$1\n${storeBlock},`
    );
  }

  // ── 2. Add EffectsModule.forFeature([...]) after the last StoreModule.forFeature line ──
  if (effectsList.length) {
    const effectsLine = `      EffectsModule.forFeature([${effectsList.join(', ')}])`;
    if (content.includes('EffectsModule.forFeature')) {
      // Merge into existing
      content = content.replace(
        /EffectsModule\.forFeature\(\[([^\]]*)\]\)/,
        (_, inner) => {
          const existing = inner.split(',').map((s: string) => s.trim()).filter(Boolean);
          const newEffects = effectsList.filter(e => !existing.includes(e));
          const all = [...existing, ...newEffects];
          return `EffectsModule.forFeature([${all.join(', ')}])`;
        }
      );
    } else {
      // Insert after the last StoreModule.forFeature line
      const lines = content.split('\n');
      let lastStoreIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('StoreModule.forFeature')) lastStoreIdx = i;
      }
      if (lastStoreIdx >= 0) {
        lines.splice(lastStoreIdx + 1, 0, effectsLine);
        content = lines.join('\n');
      }
    }
  }

  // ── 3. Add HttpServices to Root function (empty array) ──
  if (httpServices.length) {
    content = content.replace(
      /(provide\w+Root\(\)[^{]*\{[\s\S]*?makeEnvironmentProviders\(\s*)\[([^\]]*)\]/m,
      (_, before, inner) => {
        const existing = inner.split(',').map((s: string) => s.trim()).filter(Boolean);
        const newServices = httpServices.filter(s => !existing.includes(s));
        const all = [...existing, ...newServices];
        return `${before}[${all.join(', ')}]`;
      }
    );
  }

  // ── 4. Add HttpServices after Sandbox in the Feature function ──
  if (httpServices.length) {
    const serviceLines = httpServices.map(s => `    ${s}`).join(',\n');
    content = content.replace(
      /(\s*)(\/\/ Shared Services)/,
      `\n${serviceLines},\n    $2`
    );
  }

  await writeFile(moduleFilePath, content);
}

// Deprecated: kept for backward compatibility
export function transformProviders(
  content: string, importSection: string, storeEffectSet: string[], storeFeatureSet: string[], sharedSet: string[]): string {
  return content;
}

// Deprecated: kept for backward compatibility
export function appendSharedProvidersAtEnd(content: string, providers: string[]): string {
  return content;
}
