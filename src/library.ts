import path from 'path';
import { logInfo, logWarning, logSuccess, logError } from './logger.js';
import { replaceSectionPlaceholders, replaceLibraryPlaceholders } from './placeholders.js';
import { enhanceProviderFileWithEntities } from './providers.js';
import { enhanceSandboxFile } from './sandbox.js';
import { enhanceRoutingFile } from './routes.js';
import { enhanceIndexFile } from './index-file.js';
import { copyEntityToLibrary, copyTemplateContents, findEntityTemplates, copyEntityTemplates, removeEntityTemplates } from './template.js';

export async function addEntity(section, library, entities, destPath: string, tplPath: string) {

  const templateSrc = path.join(tplPath, 'src');
  const destSrc = path.join(destPath, 'src');

  // Loop through entities and call the function
  for (const entityName of entities) {
    logInfo(`Adding entity: ${entityName}`);
    copyEntityToLibrary(templateSrc, destSrc, entityName);
  }

  // Replace any section place holders
  await replaceSectionPlaceholders(destPath, section);

  // Replace any library place holders
  await replaceLibraryPlaceholders(destSrc, library);

  logInfo('Updating provider file content.');
  const providerFilePath = path.join(destSrc, 'lib', `${library}.providers.ts`);
  await enhanceProviderFileWithEntities(providerFilePath, entities);

  logInfo('Updating sandbox file content.');
  const sandboxFilePath = path.join(destSrc, 'lib', `${library}.sandbox.ts`);
  await enhanceSandboxFile(sandboxFilePath, entities);

  logInfo('Updating routes file content.');
  const routingFilePath = path.join(destSrc, 'lib', `${library}.routes.ts`);
  await enhanceRoutingFile(routingFilePath, entities);
}

export async function generateLibrary(sectionName, libraryName, entities, destPath: string, tplPath: string) {
  logInfo(`Generating library: ${libraryName}`);
  try {
    await copyTemplateContents(tplPath, destPath);
    logInfo(`Copied template to ${destPath}`);

    await replaceSectionPlaceholders(destPath, sectionName);

    await replaceLibraryPlaceholders(destPath, libraryName);

    const libPath = path.join(destPath, 'src', 'lib');
    const entityTemplates = findEntityTemplates(libPath);

    if (entityTemplates.length === 0) {
      logWarning('No _entity_ templates found.');
    }

    for (const entity of entities) {
      await copyEntityTemplates(libPath, entityTemplates, entity);
    }

    logInfo('Removing entity template files & folders.');
    await removeEntityTemplates(entityTemplates);

    logInfo('Generating domain model export file content.');
    const domainModelDir = path.join(libPath, 'models', 'domain');
    await enhanceIndexFile(domainModelDir, { key: 'model' });

    logInfo('Generating form model export file content.');
    const searchModelDir = path.join(libPath, 'models', 'forms');
    await enhanceIndexFile(searchModelDir, { key: 'search' });

    logInfo('Generating shared export file content.');
    const sharedDir = path.join(libPath, 'shared');
    await enhanceIndexFile(sharedDir, { recursive: true });

    logInfo('Generating store export file content.');
    const storeDir = path.join(libPath, 'store');
    await enhanceIndexFile(storeDir, { recursive: true });

    logInfo('Generating providers file content.');
    const providersFilePath = path.join(libPath, `${libraryName}.providers.ts`);
    await enhanceProviderFileWithEntities(providersFilePath, entities);

    logInfo('Generating sandbox file content.');
    const sandboxFilePath = path.join(libPath, `${libraryName}.sandbox.ts`);
    await enhanceSandboxFile(sandboxFilePath, entities);

    logInfo('Generating routes file content.');
    const routingFilePath = path.join(libPath, `${libraryName}.routes.ts`);
    await enhanceRoutingFile(routingFilePath, entities);

    logSuccess('Library generated successfully.');
  } catch (err) {
    logError(err);
  }
}
