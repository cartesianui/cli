import fs from 'fs-extra';
import path from 'path';

export async function enhanceIndexFile(
  dirPath: string,
  options?: { key?: string; recursive?: boolean }
) {
  const key = options?.key;
  const recursive = options?.recursive ?? false;

  const indexFilePath = path.join(dirPath, 'index.ts');

  let content = await fs.pathExists(indexFilePath)
    ? await fs.readFile(indexFilePath, 'utf8')
    : '';

  const filesToExport: string[] = [];

  async function scan(currentDir: string) {
    const files = await fs.readdir(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        if (recursive) {
          await scan(fullPath);
        }
        continue;
      }

      if (stat.isFile() && file !== 'index.ts') {
        const isMatch = key ? file.endsWith(`.${key}.ts`) : true;
        if (isMatch) filesToExport.push(fullPath);
      }
    }
  }

  // scan dirs
  await scan(dirPath);

  const exportLinesToAppend = filesToExport
    .map(f => {
      const rel = './' + path.relative(dirPath, f).replace(/\\/g, '/').replace('.ts', '');
      return `export * from '${rel}';`;
    })
    .filter(l => !content.includes(l));  // avoid duplicates

  if (exportLinesToAppend.length) {
    content += '\n\n' + exportLinesToAppend.join('\n');
    await fs.writeFile(indexFilePath, content, 'utf8');
  }
}
