import { pascalCase, kebabCase, pluralize } from './strings.js';
import { loadSourceFile, findChildrenArray, arrayHasElement, removeStubMarkers, addImportToContent, readFile, writeFile } from './ast-helpers.js';

export async function enhanceRoutingFile(targetFilePath: string, entities: string[]) {
  let content = await readFile(targetFilePath);

  // Remove any leftover /* STUB_CONTENT */ markers (backward compat)
  content = removeStubMarkers(content);

  // Use AST to check which routes already exist
  const sourceFile = loadSourceFile(targetFilePath);
  const childrenArray = findChildrenArray(sourceFile, 'routes');
  if (!childrenArray) {
    throw new Error(`Could not find 'children' array in routes variable in ${targetFilePath}`);
  }

  const routeLines: string[] = [];
  const importLines: string[] = [];

  for (const entity of entities) {
    const pascalEntity = pascalCase(entity);
    const kebabEntity = kebabCase(entity);
    const pluralKebab = kebabCase(pluralize(entity));
    const componentName = `${pascalEntity}ListingComponent`;

    // Skip if route already exists
    if (arrayHasElement(childrenArray, `'${pluralKebab}'`)) {
      continue;
    }

    importLines.push(`import { ${componentName} } from './ui/${kebabEntity}/listing.component';`);
    routeLines.push(`      { path: '${pluralKebab}', component: ${componentName} }`);
  }

  if (!routeLines.length) {
    await writeFile(targetFilePath, content);
    return;
  }

  // Add imports before the export const routes line
  const importBlock = importLines.join('\n');
  content = content.replace(
    /^(export const routes)/m,
    `${importBlock}\n\n$1`
  );

  // Insert routes into children array
  // Find `children: [` and insert before its closing `]`
  const childrenMatch = content.match(/children:\s*\[([^\]]*)\]/s);
  if (childrenMatch && childrenMatch.index !== undefined) {
    const fullMatch = childrenMatch[0];
    const innerContent = childrenMatch[1].trim();
    const routeBlock = routeLines.join(',\n');

    let newChildren: string;
    if (innerContent) {
      // Existing routes — ensure trailing comma on last existing route
      const trimmedInner = innerContent.replace(/,?\s*$/, ',');
      newChildren = `children: [\n      ${trimmedInner}\n${routeBlock},\n    ]`;
    } else {
      // Empty children array
      newChildren = `children: [\n${routeBlock}\n    ]`;
    }

    content = content.slice(0, childrenMatch.index) + newChildren + content.slice(childrenMatch.index + fullMatch.length);
  }

  await writeFile(targetFilePath, content);
}

// Backward-compatible alias (old signature accepted stubFile, now ignored)
export async function enhanceRoutingFileUsingStub(targetFilePath: string, _stubFile: string, entities: string[], _mode = 'new') {
  return enhanceRoutingFile(targetFilePath, entities);
}
