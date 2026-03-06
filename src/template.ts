import fs from 'fs-extra';
import path from 'path';
import { pascalCase, kebabCase } from './strings.js';
import { logInfo, logWarning, logSuccess } from './logger.js';
import { replaceEntityPlaceHolders, replaceInFile, walkAndReplace } from './placeholders.js';
import { enhanceIndexFile } from './index-file.js';

export async function copyEntityToLibrary(templateSrc, destSrc, entityName) {

  const kebab = kebabCase(entityName);
  const pascal = pascalCase(entityName);

  walkAndCopy(templateSrc, destSrc);

  const libPath = path.join(destSrc, 'lib')

  logInfo('Updating domain model export file content.');
  const domainModelDir = path.join(libPath, 'models', 'domain');
  await enhanceIndexFile(domainModelDir, { key: 'model' });

  logInfo('Updating form model export file content.');
  const searchModelDir = path.join(libPath, 'models', 'forms');
  await enhanceIndexFile(searchModelDir, { key: 'search' });

  logInfo('Updating shared export file content.');
  const sharedDir = path.join(libPath, 'shared');
  await enhanceIndexFile(sharedDir, { recursive: true });

  logInfo('Updating store export file content.');
  const storeDir = path.join(libPath, 'store');
  await enhanceIndexFile(storeDir, { recursive: true });

  function walkAndCopy(srcDir, targetDir) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      let srcPath = path.join(srcDir, entry.name);
      let relPath = path.relative(templateSrc, srcPath);

      // Only process files/folders with `_entity_` in their name/path
      if (!relPath.includes('_entity_') && entry.isFile()) continue;

      // Replace placeholders in relative path
      let replacedRelPath = relPath
        .replace(/_entity_/g, kebab)
        .replace(/_Entity_/g, pascal);

      let destPath = path.join(destSrc, replacedRelPath);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        walkAndCopy(srcPath, destPath); // recurse
      } else if (entry.isFile()) {
        const fileContent = fs.readFileSync(srcPath, 'utf-8');

        const replacedContent = replaceEntityPlaceHolders(fileContent, entityName);

        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, replacedContent);
        logSuccess(`Created: ${replacedRelPath}`);
      }
    }
  }
}

export function findEntityTemplates(dir) {
  const result = [];

  const walk = (currentPath) => {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const item of items) {
      // Skip the .git folder
      if (item.name === ".git") {
        continue;
      }

      const fullPath = path.join(currentPath, item.name);

      if (
        item.name.includes('_entity_')
         || item.name.includes('_Entity_')
      ) {
        result.push(fullPath);
      }

      if (item.isDirectory()) {
        walk(fullPath);
      }
    }
  };

  walk(dir);
  return result;
}

export async function copyTemplateContents(templateDir, destDir) {
  const entries = await fs.readdir(templateDir);

  for (const entry of entries) {
    if (entry === 'cui.ts') continue; // skip cui.ts

    const srcPath = path.join(templateDir, entry);
    const destPath = path.join(destDir, entry);
    await fs.copy(srcPath, destPath);
  }
}

export async function copyEntityTemplates(baseLibPath, entityTemplates, entityName) {
  const pascalEntity = pascalCase(entityName);
  const kebabEntity = kebabCase(entityName);

  for (const templatePath of entityTemplates) {
    const relative = path.relative(baseLibPath, templatePath);

    const replacedRelativePath = relative
      .replace(/_entity_/g, kebabEntity)
      .replace(/_Entity_/g, pascalEntity);

    const destPath = path.join(baseLibPath, replacedRelativePath);
    await fs.copy(templatePath, destPath);

    // Usage in your copyEntityTemplates function
    if ((await fs.stat(destPath)).isFile()) {
      await replaceInFile(destPath, entityName);
    } else {
      await walkAndReplace(destPath, entityName);
    }
  }
}

export async function removeEntityTemplates(entityTemplates) {
  for (const templatePath of entityTemplates) {
    try {
      const stat = await fs.stat(templatePath);

      if (stat.isDirectory()) {
        await fs.remove(templatePath); // removes directory and its contents
      } else if (stat.isFile()) {
        await fs.unlink(templatePath); // removes file
      }
    } catch (err) {
      logWarning(`Could not remove ${templatePath}: ${err.message}`);
    }
  }
}
