import fs from 'fs-extra';
import path from 'path';
import { pascalCase, kebabCase, camelCase, snakeCase, readableCase, pluralize } from './strings.js';

export function replaceEntityPlaceHolders(content, entity) {
  const pascalEntity = pascalCase(entity);
  const kebabEntity = kebabCase(entity);
  const camelEntity = camelCase(entity);
  const snakeEntity = snakeCase(entity);
  const readableEntity = readableCase(entity);

  const plurizeCamelEntity = camelCase(pluralize(entity));
  const plurizeKebabEntity = kebabCase(pluralize(entity));
  const plurziePascalEntity = pascalCase(pluralize(entity));

  // _T => Text
  // _P => Plurize
  content = content
      .replace(/_entity_/g, kebabEntity)
      .replace(/_entity-name_/g, kebabEntity)
      .replace(/_Pentity-name_/g, plurizeKebabEntity)

      .replace(/_entityName_/g, camelEntity)

      .replace(/_PentityName_/g, `${plurizeCamelEntity}`)
      .replace(/_entity_name_/g, snakeEntity)

      .replace(/_Entity_/g, pascalEntity)
      .replace(/_PEntity_/g, plurziePascalEntity)
      .replace(/_IEntity_/g, `I${pascalEntity}`)

      .replace(/_TEntity_/g, `${readableEntity}`);

  return content;
}

export async function replaceInFile(filePath, entity) {
  const stat = await fs.stat(filePath);
  if (stat.isFile()) {
    let content = await fs.readFile(filePath, 'utf8');

    content = replaceEntityPlaceHolders(content, entity);

    await fs.writeFile(filePath, content, 'utf8');
  }
}

export async function walkAndReplace(dir, entity) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    // Skip the .git folder
    if (entry.name === ".git") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkAndReplace(fullPath, entity);
    } else {
      await replaceInFile(fullPath, entity);
    }
  }
}

export async function replaceLibraryPlaceholders(destPath, libraryName) {
  const pascalLibrary = pascalCase(libraryName);

  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip the .git folder
      if (entry.name === ".git") {
        continue;
      }

      const oldPath = path.join(dir, entry.name);

      let newName = entry.name
        .replace(/_library_/g, libraryName)
        .replace(/_Library_/g, pascalLibrary);
      const newPath = path.join(dir, newName);

      if (oldPath !== newPath) await fs.rename(oldPath, newPath);

      if (entry.isDirectory()) {
        await walk(newPath);
      } else {
        let content = await fs.readFile(newPath, 'utf8');
        content = content
          .replace(/_library_/g, libraryName)
          .replace(/_Library_/g, pascalLibrary);
        await fs.writeFile(newPath, content, 'utf8');
      }
    }
  };

  await walk(destPath);
}

export async function replaceSectionPlaceholders(destPath, sectionName) {
  const pascalName = pascalCase(sectionName);

  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip the .git folder
      if (entry.name === ".git") {
        continue;
      }

      const filePath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(filePath);
      } else {
        let content = await fs.readFile(filePath, 'utf8');
        content = content
          .replace(/_section_/g, sectionName)
          .replace(/_Section_/g, pascalName);
        await fs.writeFile(filePath, content, 'utf8');
      }
    }
  };

  await walk(destPath);
}
