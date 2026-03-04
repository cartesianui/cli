import fs from 'fs-extra';
import { pascalCase, kebabCase } from './strings.js';
import { formatMultiLineImport, insertStubRoutes, insertImportSectionBeforeFirstExportConst } from './code-insert.js';
import { replaceEntityPlaceHolders } from './placeholders.js';

export async function enhanceRoutingFileUsingStub(targetFilePath, stubFile, entities, mode='new') {

  let content = await fs.readFile(targetFilePath, 'utf8');
  let stubContent = await fs.readFile(stubFile, 'utf8');

  const importSet = new Set();
  const componentImportSet = new Set();
  const stubContentSet = new Set();

  for (const entity of entities) {
    const pascalEntity = pascalCase(entity);
    const kebabEntity = kebabCase(entity);

    const listingComponent = `${pascalEntity}ListingComponent`;
    const listingImport = `import { ${listingComponent} } from './ui/${kebabEntity}/listing.component';`;
    componentImportSet.add(listingImport);

    let temp = replaceEntityPlaceHolders(stubContent, entity);

    stubContentSet.add(temp);;
  }

  const combinedImportSet = new Set([
    ...importSet,
    ...componentImportSet
  ]);

  // Inject imports before route declaration
  const importSection = Array.from(combinedImportSet).join('\n');

  content = insertImportSectionBeforeFirstExportConst(content, importSection);

  content = insertStubRoutes(content, stubContentSet, mode, true);

  await fs.writeFile(targetFilePath, content, 'utf8');
}
