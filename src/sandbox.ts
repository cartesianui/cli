import fs from 'fs-extra';
import { pascalCase } from './strings.js';
import { formatMultiLineImport, insertAtClassEnd } from './code-insert.js';
import { replaceEntityPlaceHolders } from './placeholders.js';

export async function enhanceSandboxFileUsingMicroStub(targetFilePath, stubFile, entities, mode = 'new') {

  let content = await fs.readFile(targetFilePath, 'utf8');
  let stubContent = await fs.readFile(stubFile, 'utf8');

  const importSet = new Set();
  const stubContentSet = new Set();

  const storeSet = new Set();
  const modelSet = new Set();

  for (const entity of entities) {
    const pascalEntity = pascalCase(entity);

    storeSet.add(`from${pascalEntity}`);
    storeSet.add(`${pascalEntity}Actions`);

    modelSet.add(`${pascalEntity}`);

    stubContentSet.add(replaceEntityPlaceHolders(stubContent, entity))
  }

  const storeImport = formatMultiLineImport(storeSet, './store');
  const modelImport = formatMultiLineImport(modelSet, './models');

  importSet.add(storeImport);
  importSet.add(modelImport);

  // Inject imports before @Injectable()
  const importSection = Array.from(importSet).join('\n');
  content = content.replace(/(@Injectable())/, `${importSection}\n\n$1`);

  const stubSection = Array.from(stubContentSet).join('\n\n\n');

  content = insertAtClassEnd(content, stubSection.trim());

  await fs.writeFile(targetFilePath, content, 'utf8');
}
