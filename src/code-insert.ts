export function insertAtClassEnd(classContent: string, appendContent: string): string {
  // Find the last closing curly brace and insert content before it
  return classContent.replace(/}\s*$/, `  ${appendContent}\n}`);
}

export function insertStubRoutes(content: string, stubRouteSet, mode = 'append', commaPerLine = false): string {
  const lines = content.split('\n');
  const stubIndex = lines.findIndex(line => line.includes('/* STUB_CONTENT */'));
  if (stubIndex === -1) return content;

  // Find the previous non-empty line
  let lastRouteIndex = stubIndex - 1;
  while (lastRouteIndex >= 0 && lines[lastRouteIndex].trim() === '') {
    lastRouteIndex--;
  }

  // Add a comma to the last route if needed (and not in 'new' mode)
  if (mode !== 'new' && lastRouteIndex >= 0) {
    const lastLine = lines[lastRouteIndex];
    if (!lastLine.trim().endsWith(',')) {
      lines[lastRouteIndex] = lastLine.replace(/\s*$/, ',');
    }
  }

  // Get indentation from stub comment line
  const indentMatch = lines[stubIndex].match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '  ';

  // Build the stub lines
  const routes = Array.from(stubRouteSet as Set<string>)
    .map(route => route.trim())
    .filter(Boolean);

  const stubLines = routes.map(route => {
    const line = commaPerLine && !route.endsWith(',') ? `${route},` : route;
    return `${indent}${line}`;
  });

  // Insert stub lines before the stub marker
  lines.splice(stubIndex, 0, ...stubLines);

  return lines.join('\n');
}

export function insertImportSectionBeforeFirstExportFunc(content: string, importSection: string) {
  return content.replace(/(?=^export function)/m, `${importSection}\n\n`);
}

export function insertImportSectionBeforeFirstExportConst(content: string, importSection: string) {
  return content.replace(
    /^(?=export\s+const\s+)/m,
    `${importSection}\n\n`
  );
}

export function formatMultiLineImport(identifiers, source) {
  return `import {\n  ${Array.from(identifiers).join(',\n  ')}\n} from '${source}';`;
}
