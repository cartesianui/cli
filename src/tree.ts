import fs from 'fs-extra';
import path from 'path';

export function getFilesAndFolders(dirPath) {
  const result = [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subItems = getFilesAndFolders(fullPath);
      result.push([entry.name, subItems]);
    } else if (entry.isFile()) {
      result.push(entry.name);
    }
  }

  return result;
}

export function printNestedTree(name, items, indent = '') {
  console.log(`${indent}${name}`);
  for (const item of items) {
    if (typeof item === 'string') {
      console.log(`${indent} - ${item}`);
    } else if (Array.isArray(item)) {
      const [dirName, subItems] = item;
      printNestedTree(` - ${dirName}`, subItems, indent + ' ');
    }
  }
}
