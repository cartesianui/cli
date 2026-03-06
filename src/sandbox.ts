import { pascalCase, camelCase } from './strings.js';
import { loadSourceFile, findClassExtending, buildImportLine, addImportToContent, readFile, writeFile } from './ast-helpers.js';

export async function enhanceSandboxFile(targetFilePath: string, entities: string[]) {
  let content = await readFile(targetFilePath);

  // Use AST to check which properties already exist
  const sourceFile = loadSourceFile(targetFilePath);
  const sandboxClass = findClassExtending(sourceFile, 'Sandbox');

  if (!sandboxClass) {
    throw new Error(`Could not find class extending Sandbox in ${targetFilePath}`);
  }

  const storeImports: string[] = [];
  const modelImports: string[] = [];
  const propertyBlocks: string[] = [];

  for (const entity of entities) {
    const pascalEntity = pascalCase(entity);
    const camelEntity = camelCase(entity);
    const selectorName = `from${pascalEntity}`;
    const actionsName = `${pascalEntity}Actions`;

    // Skip if property already exists
    if (sandboxClass.getProperty(camelEntity)) {
      continue;
    }

    storeImports.push(selectorName, actionsName);
    modelImports.push(pascalEntity);

    propertyBlocks.push(
      `  ${camelEntity} = new EntitySandbox<${pascalEntity}>(this.store, this.injector, {\n` +
      `    selectors: ${selectorName},\n` +
      `    actions: ${actionsName},\n` +
      `    model: ${pascalEntity}\n` +
      `  });`
    );
  }

  if (!propertyBlocks.length) {
    return;
  }

  // Add imports
  if (storeImports.length) {
    content = addImportToContent(content, './store', storeImports);
  }
  if (modelImports.length) {
    content = addImportToContent(content, './models', modelImports);
  }

  // Insert properties before the closing brace of the class
  const classBody = propertyBlocks.join('\n\n');
  // Find the last closing brace (class end)
  const lastBrace = content.lastIndexOf('}');
  if (lastBrace >= 0) {
    const before = content.slice(0, lastBrace).trimEnd();
    content = before + '\n\n' + classBody + '\n}\n';
  }

  await writeFile(targetFilePath, content);
}

// Backward-compatible alias (old signature accepted stubFile, now ignored)
export async function enhanceSandboxFileUsingMicroStub(targetFilePath: string, _stubFile: string, entities: string[], _mode = 'new') {
  return enhanceSandboxFile(targetFilePath, entities);
}
