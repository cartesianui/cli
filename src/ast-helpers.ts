import fs from 'fs-extra';
import { Project, SourceFile, SyntaxKind, ArrayLiteralExpression, Node } from 'ts-morph';

let project: Project | null = null;

export function getProject(): Project {
  if (!project) {
    project = new Project({
      useInMemoryFileSystem: false,
      compilerOptions: { allowJs: true }
    });
  }
  return project;
}

export function loadSourceFile(filePath: string): SourceFile {
  const proj = getProject();
  const existing = proj.getSourceFile(filePath);
  if (existing) {
    existing.refreshFromFileSystemSync();
    return existing;
  }
  return proj.addSourceFileAtPath(filePath);
}

export function findChildrenArray(sourceFile: SourceFile, varName: string): ArrayLiteralExpression | undefined {
  const decl = sourceFile.getVariableDeclaration(varName);
  if (!decl) return undefined;
  const init = decl.getInitializer();
  if (!init || !Node.isArrayLiteralExpression(init)) return undefined;

  for (const element of init.getElements()) {
    if (Node.isObjectLiteralExpression(element)) {
      const childrenProp = element.getProperty('children');
      if (childrenProp && Node.isPropertyAssignment(childrenProp)) {
        const childInit = childrenProp.getInitializer();
        if (childInit && Node.isArrayLiteralExpression(childInit)) {
          return childInit;
        }
      }
    }
  }
  return undefined;
}

export function findAllCallExpressions(sourceFile: SourceFile, funcName: string) {
  return sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => call.getExpression().getText() === funcName);
}

export function findClassExtending(sourceFile: SourceFile, baseClass: string) {
  return sourceFile.getClasses().find(c => {
    const ext = c.getExtends();
    return ext && ext.getText() === baseClass;
  });
}

export function arrayHasElement(arr: ArrayLiteralExpression, matchText: string): boolean {
  return arr.getElements().some(el => el.getText().includes(matchText));
}

// ─── Text-based file manipulation ───────────────────────────────────────────

export function removeStubMarkers(content: string): string {
  return content
    .replace(/^.*\/\* STUB_CONTENT \*\/.*\n?/gm, '')
    .replace(/^.*\/\* LIST_VIEW_FIELDS \*\/.*\n?/gm, '')
    .replace(/^.*\/\* FORM_FIELDS \*\/.*\n?/gm, '')
    .replace(/^.*\/\* SEARCH_FORM \*\/.*\n?/gm, '');
}

export function buildImportLine(namedImports: string[], moduleSpecifier: string): string {
  if (namedImports.length <= 2) {
    return `import { ${namedImports.join(', ')} } from '${moduleSpecifier}';`;
  }
  return `import {\n  ${namedImports.join(',\n  ')}\n} from '${moduleSpecifier}';`;
}

export function addImportToContent(content: string, moduleSpecifier: string, namedImports: string[]): string {
  if (!namedImports.length) return content;

  // Check if import from this module already exists
  const importRegex = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${escapeRegex(moduleSpecifier)}['"];?`, 'm');
  const match = content.match(importRegex);

  if (match) {
    // Merge into existing import
    const existingNames = match[1].split(',').map(n => n.trim()).filter(Boolean);
    const missing = namedImports.filter(n => !existingNames.includes(n));
    if (!missing.length) return content;

    const allNames = [...existingNames, ...missing];
    const newImport = buildImportLine(allNames, moduleSpecifier);
    return content.replace(importRegex, newImport);
  } else {
    // Add new import after the last existing import statement
    const newImport = buildImportLine(namedImports, moduleSpecifier);

    // Find the last line that ends an import (either single-line or closing `} from '...'`)
    const lines = content.split('\n');
    let lastImportLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.match(/^import\s.*from\s*['"]/) || trimmed.match(/}\s*from\s*['"]/)) {
        lastImportLineIdx = i;
      }
    }

    if (lastImportLineIdx >= 0) {
      lines.splice(lastImportLineIdx + 1, 0, newImport);
      return lines.join('\n');
    }
    return newImport + '\n' + content;
  }
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf8');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  return fs.writeFile(filePath, content, 'utf8');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
