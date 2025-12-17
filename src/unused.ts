function smartSplit(str) {
  const result = [];
  let current = '';
  let depthRound = 0; // ()
  let depthSquare = 0; // []
  let depthCurly = 0; // {}

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === ',' && depthRound === 0 && depthSquare === 0 && depthCurly === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;

      if (char === '(') depthRound++;
      if (char === ')') depthRound--;
      if (char === '[') depthSquare++;
      if (char === ']') depthSquare--;
      if (char === '{') depthCurly++;
      if (char === '}') depthCurly--;
    }
  }

  if (current.trim()) result.push(current.trim());
  return result;
}

function insertStubSection(fileContent: string, stubContent: string, stubPlaceHolder, mode = 'new'): string {

  const index = fileContent.indexOf(stubPlaceHolder);

  if (index === -1) {
    throw new Error('Stub place holder not found.');
  }

  // Determine the indentation level of the stub line
  const lines = fileContent.split('\n');
  const stubLine = lines.find(line => line.includes(stubPlaceHolder)) || '';
  const indentMatch = stubLine.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '';

  // Indent the stub content to match
  const indentedStubContent = stubContent
    .split('\n')
    .map(line => (line.trim() ? indent + line : '')) // maintain empty lines
    .join('\n');

  return fileContent.replace(stubPlaceHolder, `${indentedStubContent}\n${indent}${stubPlaceHolder}`);
}

function insertSandboxCtorContent(
  classContent: string,
  sandboxStatements: string
): string {
  // Match "super(injector);" and capture trailing whitespace/indent
  return classContent.replace(
    /(super\(injector\);\s*)/,
    `$1\n    ${sandboxStatements}\n`
  );
}

function insertBeforeConstructor(fileContent: string, stubContent: string): string {
  const ctorRegex = /(.*?)constructor\s*\(/m;
  const match = fileContent.match(ctorRegex);

  if (!match) {
    throw new Error('Constructor not found.');
  }

  const ctorIndex = match.index!;
  const beforeCtor = fileContent.substring(0, ctorIndex);
  const afterCtor = fileContent.substring(ctorIndex);

  // detect indentation level of constructor
  const ctorLine = fileContent.split('\n').find(l => l.includes('constructor')) || '';
  const indentMatch = ctorLine.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '';

  const indentedStub = stubContent
    .split('\n')
    .map(line => (line.trim() ? indent + line : ''))
    .join('\n');

  return beforeCtor + indentedStub + '\n' + afterCtor;
}

function insertInsideConstructor(fileContent: string, stubContent: string): string {
  const ctorRegex = /constructor\s*\([^)]*\)\s*{[\s\S]*?}/m;
  const match = fileContent.match(ctorRegex);

  if (!match) {
    throw new Error('Constructor not found.');
  }

  const ctorBlock = match[0];
  const ctorStart = match.index!;
  const ctorEnd = ctorStart + ctorBlock.length;

  // detect indentation level of constructor
  const ctorLine = fileContent.split('\n').find(l => l.includes('constructor')) || '';
  const indentMatch = ctorLine.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] + '  ' : '  '; // one level deeper

  const indentedStub = stubContent
    .split('\n')
    .map(line => (line.trim() ? indent + line : ''))
    .join('\n');

  // insert before the last closing brace of constructor
  const newCtorBlock = ctorBlock.replace(/}$/, `  ${indentedStub}\n${indent.slice(0, -2)}}`);

  return fileContent.slice(0, ctorStart) + newCtorBlock + fileContent.slice(ctorEnd);
}

function insertStubContentBeforeMarker(content: string, stubBlock: string): string {
  const marker = '/* STUB_CONTENT */';
  const index = content.indexOf(marker);
  if (index === -1) return content;

  const before = content.slice(0, index);
  const after = content.slice(index);

  // Add a newline if needed
  const insert = (before.endsWith('\n') ? '' : '\n') + stubBlock + '\n';

  return before + insert + after;
}

// function insertStubRoutes(content, stubRouteSet, mode = 'append') {
//   const lines = content.split('\n');
//   const stubIndex = lines.findIndex(line => line.includes('/* STUB_CONTENT */'));
//   if (stubIndex === -1) return content;

//   // Find the previous non-empty line (route)
//   let lastRouteIndex = stubIndex - 1;
//   while (lastRouteIndex >= 0 && lines[lastRouteIndex].trim() === '') {
//     lastRouteIndex--;
//   }

//   // Only add a comma to the last route if needed (and not in 'new' mode)
//   if (mode !== 'new' && lastRouteIndex >= 0) {
//     const lastLine = lines[lastRouteIndex];
//     if (!lastLine.trim().endsWith(',')) {
//       lines[lastRouteIndex] = lastLine.replace(/\s*$/, ','); // add comma at the end
//     }
//   }

//   // Get indentation from the stub comment line
//   const indentMatch = lines[stubIndex].match(/^(\s*)/);
//   const indent = indentMatch ? indentMatch[1] : '  ';

//   // Ensure each route is added as a proper line
//   const stubLines = Array.from(stubRouteSet as Set<string>)
//     .map(route => route.trim())
//     .filter(route => !!route)
//     .map(route => `${indent}${route}`);

//   // Insert stub lines before the STUB_CONTENT marker
//   lines.splice(stubIndex, 0, ...stubLines);

//   return lines.join('\n');
// }

async function enhanceSandboxFileUsingStub(targetFilePath, stubFile, entities, mode = 'new') {

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
    
    let temp = replaceEntityPlaceHolders(stubContent, entity);
  
    stubContentSet.add(temp);;
  }

  const storeImport = formatMultiLineImport(storeSet, './store');
  const modelImport = formatMultiLineImport(modelSet, './models');

  importSet.add(storeImport);
  importSet.add(modelImport);

  // Inject imports before @Injectable()
  const importSection = Array.from(importSet).join('\n');
  content = content.replace(/(@Injectable())/, `${importSection}\n\n$1`);

  // Replace arrays in NgModule
  const stubSection = Array.from(stubContentSet).join('\n\n\n');
  // content = content.replace('/* STUB_CONTENT */', stubSection + '\n\n/* STUB_CONTENT */');

  const stubPlaceHolder = '/* STUB_CONTENT */';
  content = insertStubSection(content, stubSection.trim(), stubPlaceHolder, mode);

  await fs.writeFile(targetFilePath, content, 'utf8');
}

function formatSingleLineImport(identifiers, source) {
  `import { ${Array.from(identifiers).join(',\n ')} } from '${source}';`;
}

// ------------------------------------------------------------------------------------------------------------
// ---------------------        MODULE FILES FUNCTIONS               ------------------------------------------
// ------------------------------------------------------------------------------------------------------------
async function enhanceModuleFileWithEntities(moduleFilePath, entities) {
  let content = await fs.readFile(moduleFilePath, 'utf8');

  const importSet = new Set();
  const componentImportSet = new Set();
  const storeSet = new Set();
  const sharedSet = new Set();
  

  const ngModuleDeclarationSet = new Set();
  const ngModuleProviderSet = new Set();
  const ngModuleImportsEffect = [];
  const ngModuleImportsReducer = [];

  const entryComponentImportLine = `import { EntryComponent } from './entry.component';`
  if (!content.includes(entryComponentImportLine)) {
    componentImportSet.add(entryComponentImportLine);
  }

  ngModuleDeclarationSet.add(`EntryComponent`);

  for (const entity of entities) {
    const pascalEntity = pascalCase(entity);
    const kebabEntity = kebabCase(entity);

    const storeFeature = `from${pascalEntity}`;
    storeSet.add(storeFeature);
    storeSet.add(`${pascalEntity}Effects `);
    sharedSet.add(`${pascalEntity}HttpService`);

    //const listingComponent = `ListingComponent as ${pascalEntity}ListingComponent`;
    const listingComponent = `${pascalEntity}ListingComponent`;
    const listingImport = `import { ${listingComponent} } from './ui/${kebabEntity}/listing.component';`;
    const createFormImport = `import { ${pascalEntity}CreateComponent } from './ui/${kebabEntity}/create/create.component';`;
    const editFormImport = `import { ${pascalEntity}EditComponent } from './ui/${kebabEntity}/edit/edit.component';`;
    componentImportSet
      .add(listingImport)
      .add(createFormImport)
      .add(editFormImport);

    // Declarations, Providers, Imports, Exports
    ngModuleDeclarationSet
      .add(`${pascalEntity}ListingComponent`)
      .add(`${pascalEntity}CreateComponent`)
      .add(`${pascalEntity}EditComponent`);

    ngModuleProviderSet.add(`${pascalEntity}HttpService`);
    ngModuleImportsEffect.push(`${pascalEntity}Effects`);
    ngModuleImportsReducer.push(`StoreModule.forFeature(${storeFeature}.featureKey, ${storeFeature}.reducer)`);
  }

  const storeImport = formatMultiLineImport(storeSet, './store');
  importSet.add(storeImport);

  const sharedImport = formatMultiLineImport(sharedSet, './shared');
  importSet.add(sharedImport);

  const combinedImportSet = new Set([
    ...importSet,
    ...componentImportSet
  ]);

  // Inject imports before @NgModule
  const importSection = Array.from(combinedImportSet).join('\n');
  content = content.replace(/(@NgModule)/, `${importSection}\n\n$1`);

  // Replace arrays in NgModule
  content = patchNgModuleArray(content, 'declarations', Array.from(ngModuleDeclarationSet));
  content = patchNgModuleArray(content, 'providers', Array.from(ngModuleProviderSet));
  content = patchNgModuleArray(content, 'exports', Array.from(ngModuleDeclarationSet)); // Re-export listings
  content = patchNgModuleArray(content, 'imports', [...ngModuleImportsReducer]);
  content = patchNgModuleArray(content, 'imports', [`EffectsModule.forFeature([${ngModuleImportsEffect.join(', ')}])`]);

  await fs.writeFile(moduleFilePath, content, 'utf8');
}

function patchNgModuleArray(content, key, valuesToAdd) {
  const startRegex = new RegExp(`${key}:\\s*\\[`, 'm');
  const startMatch = startRegex.exec(content);
  if (!startMatch) return content;

  const startIdx = startMatch.index + startMatch[0].length;
  let endIdx = startIdx;
  let depth = 1;

  while (endIdx < content.length && depth > 0) {
    const char = content[endIdx];
    if (char === '[') depth++;
    else if (char === ']') depth--;
    endIdx++;
  }

  const innerContent = content.slice(startIdx, endIdx - 1);
  const existingItems = smartSplit(innerContent)
    .map(v => v.trim())
    .filter(Boolean);

  const existingSet = new Set(existingItems);
  for (const val of valuesToAdd) {
    if (!existingSet.has(val)) existingSet.add(val);
  }

  const updatedItems = Array.from(existingSet).join(',\n    ');
  const newArray = `${key}: [\n    ${updatedItems}\n  ]`;

  // Replace the whole old array
  const before = content.slice(0, startMatch.index);
  const after = content.slice(endIdx);
  return `${before}${newArray}${after}`;
}