#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let __destPath = '';
let __tplPath = '';

//==========================================================================================
//                                      HELPERS
//==========================================================================================

const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const ERROR_SYMBOL = `${RED}✖${RESET}`;

const COLORS = {
  reset: RESET,
  red: RED,
  green: GREEN,
  yellow: YELLOW,
  cyan: CYAN,
};


function logInfo(message: string) {
  console.info(`${COLORS.cyan}💡 ${message}${COLORS.reset}`);
}

function logSuccess(message: string) {
  console.info(`${COLORS.green}✅ ${message}${COLORS.reset}`);
}

function logWarning(message: string) {
  console.warn(`${COLORS.yellow}⚠️  ${message}${COLORS.reset}`);
}

function logError(message: string) {
  console.error(`${COLORS.red}❌ ${message}${COLORS.reset}`);
}

function logErrorSimple(message: string) {
  console.error(`${COLORS.red}${message}${COLORS.reset}`);
}


function exitWithError(message: string, usageLines: string[]) {
  logError(`${message}`);
  if (usageLines.length > 0) {
    logErrorSimple(`\n${BOLD}Usage:${RESET}`);
    usageLines.forEach(line => logErrorSimple(`  ${line}`));
  }
  logErrorSimple(''); // blank line
  process.exit(1);
}

function validateCommand(command?: string) {
  if (!command) {
    exitWithError(
      "Missing command.",
      ["cui <command> <subcommand?> [--lib=<library>] [--entities=<Entity1,Entity2,...>]"]
    );
  }
}

function validateSubCommand(command: string, subcommand: string | undefined, allowedCmds: string[]) {
  if (!subcommand || !allowedCmds.includes(subcommand)) {
    exitWithError(
      `Invalid or missing subcommand.`,
      [
        `cui ${command} <subcommand> --lib=<library> --entities=<Entity1,...>`,
        `Subcommand must be one of: ${allowedCmds.join(', ')}`
      ]
    );
  }
}

function validateLibrary(command: string, subcommand?: string, library?: string) {
  if (!library) {
    exitWithError(
      "Please provide a library name using --lib.",
      [`cui ${command} ${subcommand || '<subcommand>'} --lib=<library> --entities=<Entity1,...>`]
    );
  }
}

function validateEntities(command: string, subcommand: string | undefined, library: string | undefined, entities: string[], min = 1) {
  if (!entities || entities.length < min) {
    exitWithError(
      `Please provide at least ${min} ${min === 1 ? 'entity' : 'entities'}.`,
      [`cui ${command} ${subcommand || '<subcommand>'} --lib=${library || '<library>'} --entities=<Entity1,...>`]
    );
  }
}

function askConfirmation(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

// async function getOverwritePermission() {
//   logWarning(`This will add or update files in:\n → ${__destPath}`);

//   const confirmed = await askConfirmation('Do you want to continue?');
//   if (!confirmed) {
//     logError('Operation cancelled.');
//     process.exit(0);
//   }
// }

async function getOverwritePermission() {
  logWarning(`This will add or update files in:\n → ${__destPath}`);

  // Check if __destPath is a git repo
  let isGitRepo = false;
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: __destPath,
      stdio: "ignore",
    });
    isGitRepo = true;
  } catch (err) {
    isGitRepo = false;
  }

  if (isGitRepo) {
    // Check if repo is clean
    const status = execSync("git status --porcelain", { cwd: __destPath })
      .toString()
      .trim();

    if (status !== "") {
      logError("Git working directory is not clean.");
      logError("Please commit or stash your changes, then run the command again.");
      process.exit(1);
    }
  }

  // Ask user confirmation
  const confirmed = await askConfirmation("Do you want to continue?");
  if (!confirmed) {
    logError("Operation cancelled.");
    process.exit(0);
  }
}


//==========================================================================================
//                                      UTILS
//==========================================================================================
function pascalCase(str) {
  return str.replace(/(^\w|_\w)/g, match => match.replace('_', '').toUpperCase());
}

function kebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

function snakeCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')   // handle camelCase and PascalCase
    .replace(/[-\s]+/g, '_')                  // convert hyphens/spaces to underscores
    .toLowerCase();
}

function camelCase(str: string): string {
  return str
    // Add a space before any uppercase letters preceded by lowercase letters (handles PascalCase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Replace separators with space
    .replace(/[-_\s]+/g, ' ')
    // Lowercase the whole string
    .toLowerCase()
    // Capitalize letters after spaces and remove the spaces
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
}

function readableCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function pluralize(name: string): string {
  if (name.endsWith('y') && !/[aeiou]y$/i.test(name)) {
    return name.slice(0, -1) + 'ies'; // category → categories
  } else if (name.endsWith('s') || name.endsWith('x') || name.endsWith('z') || name.endsWith('ch') || name.endsWith('sh')) {
    return name + 'es'; // box → boxes, class → classes
  } else {
    return name + 's'; // product → products
  }
}

function insertAtClassEnd(classContent: string, appendContent: string): string {
  // Find the last closing curly brace and insert content before it
  return classContent.replace(/}\s*$/, `  ${appendContent}\n}`);
}

function insertStubRoutes(content: string, stubRouteSet, mode = 'append', commaPerLine = false): string {
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

function insertImportSectionBeforeFirstExportFunc(content: string, importSection: string) {
  return content.replace(/(?=^export function)/m, `${importSection}\n\n`);
}

function insertImportSectionBeforeFirstExportConst(content: string, importSection: string) {
  return content.replace(
    /^(?=export\s+const\s+)/m,
    `${importSection}\n\n`
  );
}

function formatMultiLineImport(identifiers, source) {
  return `import {\n  ${Array.from(identifiers).join(',\n  ')}\n} from '${source}';`;
}

function replaceEntityPlaceHolders(content, entity) {
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

// ------------------------------------------------------------------------------------------------------------
// ---------------------        PROVIDERS FILE FUNCTIONS             ------------------------------------------
// ------------------------------------------------------------------------------------------------------------
function injectIntoImportProvidersFrom(content: string, innerLines: string[]) {
  return content.replace(
    /(importProvidersFrom\s*\([\s\S]*?)(\n\s*\)\s*,)/m,
    (_, start, end) => {
      const indent = (start.match(/(\n\s*)[^\n]*$/)?.[1] ?? '\n      ');
      const injected = innerLines.map(line => `${indent}${line},`).join('');
      return `${start}${injected}${end}`;
    }
  );
}


function appendSharedProvidersAtEnd(content: string, providers: string[]) {
  if (!providers.length) return content;

  return content.replace(
    /(return makeEnvironmentProviders\(\s*\[\s*)([\s\S]*?)(\]\s*\)\s*;?)/m,
    (_, start, mid, end) => {
      const indent = (mid.match(/(\n\s*)[^\n]*$/)?.[1] ?? '\n    ');
      const injected = providers.map(p => `${indent}${p},`).join('');
      return `${start}${mid}${injected}${end}`;
    }
  );
}

// content: string,
// importSection: string,                 // e.g. `import { Foo } from 'x';`
// storeEffectSet: string[],              // e.g. ['UsersEffects','OrdersEffects']
// storeFeatureSet: string[],             // e.g. ['StoreModule.forFeature(usersFeature)']
// httpServiceSet: string[]               // e.g. ['provideUserApi()', 'provideOrderApi()']
export function transformProviders(
  content: string, importSection: string, storeEffectSet: string[], storeFeatureSet: string[], sharedSet: string[]): string {

  content = insertImportSectionBeforeFirstExportFunc(content, importSection);

  content = injectIntoImportProvidersFrom(content, [
    ...storeFeatureSet,
    storeEffectSet.length
      ? `EffectsModule.forFeature([${storeEffectSet.join(', ')}])`
      : ''
  ].filter(Boolean));

  content = appendSharedProvidersAtEnd(content, sharedSet);

  return content;
}

async function enhanceProviderFileWithEntities(moduleFilePath, entities) {
  let content = await fs.readFile(moduleFilePath, 'utf8');

  const importStatementSet = new Set();
  const importStoreSet = new Set();
  const importSharedSet = new Set();
  
  const storeEffectSet =  [];
  const storeFeatureSet =  [];
  const httpServiceSet = new Set();


  // const provideFromProvidersSet = new Set();
  // const providersSet = new Set();

  for (const entity of entities) {
    const pascalEntity = pascalCase(entity);
    const kebabEntity = kebabCase(entity);

    // for import statements
    const storeFeature = `from${pascalEntity}`;
    importStoreSet.add(storeFeature);
    importStoreSet.add(`${pascalEntity}Effects `);
    importSharedSet.add(`${pascalEntity}HttpService`);

    // to use in providers
    httpServiceSet.add(`${pascalEntity}HttpService`);
    storeEffectSet.push(`${pascalEntity}Effects`);
    storeFeatureSet.push(`StoreModule.forFeature(${storeFeature}.featureKey, ${storeFeature}.reducer)`);
  }

  const storeImports = formatMultiLineImport(importStoreSet, './store');
  importStatementSet.add(storeImports);

  const sharedImports = formatMultiLineImport(importSharedSet, './shared');
  importStatementSet.add(sharedImports);

  const combinedImportStatementSet = new Set([
    ...importStatementSet,
    // ...componentImportSet
  ]);

  // Inject imports before @NgModule
  const importSection = Array.from(combinedImportStatementSet).join('\n');

  const sharedSet = Array.from(httpServiceSet) as string[];

  content = transformProviders(content, importSection, storeEffectSet, storeFeatureSet, sharedSet)

  await fs.writeFile(moduleFilePath, content, 'utf8');
}

// ------------------------------------------------------------------------------------------------------------
// ---------------------        SANDBOX FILE  FUNCTIONS              ------------------------------------------
// ------------------------------------------------------------------------------------------------------------

async function enhanceSandboxFileUsingMicroStub(targetFilePath, stubFile, entities, mode = 'new') {

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
    
    stubContentSet.add(replaceEntityPlaceHolders(stubContent, entity))
  }

  const storeImport = formatMultiLineImport(storeSet, './store');
  const modelImport = formatMultiLineImport(modelSet, './models');

  importSet.add(storeImport);
  importSet.add(modelImport);

  // Inject imports before @Injectable()
  const importSection = Array.from(importSet).join('\n');
  content = content.replace(/(@Injectable())/, `${importSection}\n\n$1`);

  const stubSection = Array.from(stubContentSet).join('\n\n\n');

  content = insertAtClassEnd(content, stubSection.trim());

  await fs.writeFile(targetFilePath, content, 'utf8');
}

// ------------------------------------------------------------------------------------------------------------
// ---------------------        ROUTES FILE FUNCTIONS                ------------------------------------------
// ------------------------------------------------------------------------------------------------------------
async function enhanceRoutingFileUsingStub(targetFilePath, stubFile, entities, mode='new') {

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

//==========================================================================================
//                         Enhance Models  (Add Form & Datatable Fields)
//==========================================================================================

function getInterfaceNameFromFileName(fileName: string): string {
  // Remove extension
  const baseName = fileName.replace(/\.model\.ts$/, '');
  
  // Convert kebab-case or snake_case to PascalCase
  const pascalCase = baseName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return `I${pascalCase}`;
}

function parseInterface(content, interfaceName) {
  const regex = new RegExp(`export interface ${interfaceName} {([\\s\\S]*?)}`, 'm');
  const match = content.match(regex);

  if (!match) {
    //throw new Error(`Interface ${interfaceName} not found`);
    logError(`Interface ${interfaceName} not found`);
    return false;
  } else {
    const fieldsBlock = match[1];
    const fieldLines = fieldsBlock
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => line.includes(':'));

    const fieldNames = fieldLines.map((line) => {
        const [key] = line.split(':');
        return key.replace(/[?]/g, '').trim();
    });

    return fieldNames;
  }
  
}

function generateDataTableCols(fields: string[]): string {
  const lines = fields.map(
    (f) => `    { key: '${f}', label: '${readableCase(f)}', opt: {} }`
  ).join(',\n');

  return `static override get dataTableCols(): FieldDescriptor[] {\n  return [\n${lines}\n  ];\n}\n`;
}

function generateFormFields(fields: string[]): string {
  const lines = fields
  .filter(f => f.trim().toLowerCase() !== 'id')
  .map(
    (f) => `    { key: '${f}', label: '${readableCase(f)}', opt: { validators: [Validators.required] } }`
  ).join(',\n');

  return `static override formFields: FieldDescriptor[] = [\n${lines}\n  ];\n`;
}

function generateSearchFormFields(fields: string[]): string {
  const lines = fields
  .map(
    (f) => `   ${f}: { column: '${f}', operator: '=', value: null }`
  ).join(',\n');

  return `static override get searchForm() {\n   return {\n ${lines}\n }\n   };\n`;
}

async function enhanceModels(libraryName, entities) {
  
  const domainDir = path.join(__destPath, 'src', 'lib', 'models', 'domain');

  const files = await fs.promises.readdir(domainDir);

  const entityFiles = entities.map(e => `${kebabCase(e)}.model.ts`);

  for (const file of files) {
    if(entityFiles.includes(file)){
      const fullPath = path.join(domainDir, file);
      const stat = await fs.promises.stat(fullPath);

      if (stat.isFile() && file !== 'index.ts') { 
          let fileContent = await fs.promises.readFile(fullPath, 'utf8');

          const interfaceName = getInterfaceNameFromFileName(file);
          
          const fieldNames = parseInterface(fileContent, interfaceName);

          if(fieldNames) {
              logInfo(`<${interfaceName}> Generating dataTableCols.`);
              const dataTableCols = generateDataTableCols(fieldNames);

              logInfo(`<${interfaceName}> Generating formFields.`);
              const formFields = generateFormFields(fieldNames);

              logInfo(`<${interfaceName}> Generating formFields.`);
              const searchFormFields = generateSearchFormFields(fieldNames);

              // Output both
              // console.log('\n\n' + dataTableCols + '\n\n' + formFields + '\n');

              // Replace arrays in NgModule
              fileContent = fileContent.replace('/* LIST_VIEW_FIELDS */', dataTableCols);
              fileContent = fileContent.replace('/* FORM_FIELDS */', formFields);
              fileContent = fileContent.replace('/* SEARCH_FORM */', searchFormFields);

              
              await fs.promises.writeFile(fullPath, fileContent, 'utf8');
          }
      }
    }
  }
}

//==========================================================================================
//                         Enhance Forms HTML
//==========================================================================================

function generateFormHtml(fields: string[]): string {
  const cleanFields = fields.filter(f => f.trim().toLowerCase() !== 'id');
  const mid = Math.ceil(cleanFields.length / 2);

  const toFormGroup = (f: string) => `
                <div class="form-group">
                  <with-validation>
                    <label>${readableCase(f)}</label>
                    <input validate required formControlName="${f}" class="form-control" placeholder="${readableCase(f)}"/>
                  </with-validation>
                </div>`;

  const leftFields = cleanFields.slice(0, mid).map(toFormGroup).join("\n");
  const rightFields = cleanFields.slice(mid).map(toFormGroup).join("\n");

  return `
    <div class="row">
      <div class="col-md-6">
    ${leftFields}
      </div>
      <div class="col-md-6">
    ${rightFields}
      </div>
    </div>`;
}

function insertFormContent(formContent: string, createFormHtml: string): string {
  const placeholder = '<!-- FORM PLACE HOLDER -->';

  // Find placeholder indent
  const lines = formContent.split('\n');
  const placeholderLine = lines.find(line => line.includes(placeholder)) || '';
  const indentMatch = placeholderLine.match(/^(\s*)/);
  const baseIndent = indentMatch ? indentMatch[1] : '';

  // Normalize the inserted block indentation
  const htmlLines = createFormHtml.split('\n');

  // Find the minimum non-empty indent in the block
  const minIndent = Math.min(
    ...htmlLines
      .filter(line => line.trim())
      .map(line => (line.match(/^(\s*)/)?.[1].length ?? 0))
  );

  const normalizedHtml = htmlLines
    .map(line => line.slice(minIndent)) // remove extra indent
    .map(line => (line.trim() ? baseIndent + line : '')) // add base indent
    .join('\n');

  return formContent.replace(
    placeholder,
    `${normalizedHtml}\n${baseIndent}${placeholder}`
  );
}


async function enhanceFormHtml(libraryName, entities) {
  const uiDir = path.join(__destPath, 'src', 'lib', 'ui');
  const domainDir = path.join(__destPath, 'src', 'lib', 'models', 'domain');

  // Build full paths for form files
  const createFormFiles = entities.map(e =>
    path.join(uiDir, kebabCase(e), 'create', 'create.component.html')
  );
  const editFormFiles = entities.map(e =>
    path.join(uiDir, kebabCase(e), 'edit', 'edit.component.html')
  );

  // Build entity model file map
  const entityFiles = entities.reduce((map, e) => {
    map[kebabCase(e)] = path.join(domainDir, `${kebabCase(e)}.model.ts`);
    return map;
  }, {} as Record<string, string>);

  // Loop through create form files
  for (const formPath of createFormFiles) {
    try {
      const stat = await fs.promises.stat(formPath);

      if (stat.isFile()) {
        const entityName = path.basename(path.dirname(path.dirname(formPath))); // folder = entity name
        console.log(entityName);
        const modelFile = `${entityName}.model.ts`;
        const modelPath = entityFiles[entityName];

        // console.log(`Found create form: ${formPath}`);
        // console.log(`Corresponding model: ${modelPath}`);

        let modelContent = await fs.promises.readFile(modelPath, 'utf8');
        const interfaceName = getInterfaceNameFromFileName(modelFile);
        const fieldNames = parseInterface(modelContent, interfaceName);

        if(fieldNames) {
          logInfo(`<${interfaceName}> Generating Create Form Html.`);
          let formContent = await fs.promises.readFile(formPath, 'utf8');
          const createFormHtml = generateFormHtml(fieldNames);
          formContent = insertFormContent(formContent, createFormHtml);
          await fs.promises.writeFile(formPath, formContent, 'utf8');
        }
      }
    } catch {
      // form file doesn’t exist
    }
  }

  for (const formPath of editFormFiles) {
    try {
      const stat = await fs.promises.stat(formPath);

      if (stat.isFile()) {
        const entityName = path.basename(path.dirname(path.dirname(formPath))); // folder = entity name
        console.log(entityName);
        const modelFile = `${entityName}.model.ts`;
        const modelPath = entityFiles[entityName];

        // logInfo(`Found edit form: ${formPath}`);
        // logInfo(`Corresponding model: ${modelPath}`);

        let modelContent = await fs.promises.readFile(modelPath, 'utf8');
        const interfaceName = getInterfaceNameFromFileName(modelFile);
        const fieldNames = parseInterface(modelContent, interfaceName);

        if(fieldNames) {
          logInfo(`<${interfaceName}> Generating Edit Form Html.`);
          let formContent = await fs.promises.readFile(formPath, 'utf8');
          const editFormHtml = generateFormHtml(fieldNames);
          formContent = insertFormContent(formContent, editFormHtml);
          await fs.promises.writeFile(formPath, formContent, 'utf8');
        }
      }
    } catch {
      // form file doesn’t exist
    }
  }
}


// ------------------------------------------------------------------------------------------------------------
// ---------------------        COOMON FILE FUNCTIONS             ------------------------------------------
// ------------------------------------------------------------------------------------------------------------

async function enhanceIndexFile(dirPath, key?) {
  const exportSet = new Set();
  
  const indexFilePath = path.join(dirPath, 'index.ts');

  let content = '';
  if (await fs.pathExists(indexFilePath)) {
    content = await fs.readFile(indexFilePath, 'utf8');
  }

  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = await fs.stat(fullPath);

    if (stat.isFile() && file !== 'index.ts') {
      const isMatch = key ? file.endsWith(`.${key}.ts`) : true;
      if (isMatch) {
        const baseName = path.basename(file, '.ts');
        const exportLine = `export * from './${baseName}';`;
        if (!content.includes(exportLine)) {
          exportSet.add(exportLine);
        }
      }
    }
  }

  const exportSection = Array.from(exportSet).join('\n');

  content = `${content}\n\n${exportSection}`;
  await fs.writeFile(indexFilePath, content, 'utf8');
}

//==========================================================================================
//                         Add New Entity
//==========================================================================================

/**
 * 
 * templateRoot: path/to/temple/src 
 * destRoot: path/to/dest/src 
 * 
 */
async function copyEntityToLibrary(templateSrc, destSrc, entityName) {
  
  const kebab = kebabCase(entityName);
  const pascal = pascalCase(entityName);

  walkAndCopy(templateSrc, destSrc);

  const libPath = path.join(destSrc, 'lib')

  logInfo('Updating domain model export file content.');
  const domainModelDir = path.join(libPath, 'models', 'domain');
  await enhanceIndexFile(domainModelDir, 'model');

  logInfo('Updating form model export file content.');
  const searchModelDir = path.join(libPath, 'models', 'forms');
  await enhanceIndexFile(searchModelDir, 'search');
  
  logInfo('Updating shared export file content.');
  const sharedDir = path.join(libPath, 'shared');
  await enhanceIndexFile(sharedDir);

  logInfo('Updating store export file content.');
  const storeDir = path.join(libPath, 'store');
  await enhanceIndexFile(storeDir);

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

async function addEntity(library, entities) {
  
  const templateSrc = path.join(__tplPath, 'src');
  const destSrc = path.join(__destPath, 'src');

  // Loop through entities and call the function
  for (const entityName of entities) {
    logInfo(`Adding entity: ${entityName}`);
    // logInfo(`FROM entity: ${templateRoot}`);
    // logInfo(`TO entity: ${destRoot}`);
    copyEntityToLibrary(templateSrc, destSrc, entityName);
  }
  
  // Replace any library place holders
  await replaceLibraryPlaceholders(destSrc, library);

  logInfo('Updating provider file content.');
  const providerFilePath = path.join(destSrc, 'lib', `${library}.providers.ts`);
  await enhanceProviderFileWithEntities(providerFilePath, entities);

  logInfo('Updating sandbox file  content (min).');
  const sandboxFilePath = path.join(destSrc, 'lib', `${library}.sandbox.ts`);
  const microStubFile = entities.length > 1 ? 'sandbox.multi.stub' : 'sandbox.min.stub';
  const sandboxMicroStubFilePath = path.join(__tplPath, 'stub', microStubFile);
  await enhanceSandboxFileUsingMicroStub(sandboxFilePath, sandboxMicroStubFilePath, entities, 'append');

  logInfo('Updating routes file content.');
  const routingFilePath = path.join(destSrc, 'lib', `${library}.routes.ts`);
  const routingStubFile = entities.length > 1 ? 'routing.stub' : 'routing.stub';
  const routingStubFilePath = path.join(__tplPath, 'stub', routingStubFile);
  await enhanceRoutingFileUsingStub(routingFilePath, routingStubFilePath, entities, 'append');
}

//==========================================================================================
//                         Generate Library
//==========================================================================================

async function generateLibrary(libraryName, entities) {
  logInfo(`Generating library: ${libraryName}`);
  try {
    await copyTemplateContents(__tplPath, __destPath);
    logInfo(`Copied template to ${__destPath}`);

    await replaceLibraryPlaceholders(__destPath, libraryName);

    const libPath = path.join(__destPath, 'src', 'lib');
    const entityTemplates = findEntityTemplates(libPath);

    if (entityTemplates.length === 0) {
      logWarning('⚠️ No _entity_ templates found.');
    }

    for (const entity of entities) {
      await copyEntityTemplates(libPath, entityTemplates, entity);
    }

    logInfo('Removing entity template files & folders.');
    await removeEntityTemplates(entityTemplates);

    logInfo('Generating domain model export file content.');
    const domainModelDir = path.join(libPath, 'models', 'domain');
    await enhanceIndexFile(domainModelDir, 'model');

    logInfo('Generating form model export file content.');
    const searchModelDir = path.join(libPath, 'models', 'forms');
    await enhanceIndexFile(searchModelDir, 'search');
    
    logInfo('Generating shared export file content.');
    const sharedDir = path.join(libPath, 'shared');
    await enhanceIndexFile(sharedDir);

    logInfo('Generating store export file content.');
    const storeDir = path.join(libPath, 'store');
    await enhanceIndexFile(storeDir);
    
    logInfo('Generating providers file content.');
    const providersFilePath = path.join(libPath, `${libraryName}.providers.ts`);
    await enhanceProviderFileWithEntities(providersFilePath, entities);;

    logInfo('Generating sandbox file content (min).');
    const sandboxFilePath = path.join(libPath, `${library}.sandbox.ts`);
    const microStubFile = entities.length > 1 ? 'sandbox.min.stub' : 'sandbox.min.stub';
    const sandboxMicroStubFilePath = path.join(__tplPath, 'stub', microStubFile);
    await enhanceSandboxFileUsingMicroStub(sandboxFilePath, sandboxMicroStubFilePath, entities);

    logInfo('Generating routes file content.');
    const routingFilePath = path.join(libPath, `${libraryName}.routes.ts`);
    const routingStubFile = entities.length > 1 ? 'routing.stub' : 'routing.stub';
    const routingStubFilePath = path.join(__tplPath, 'stub', routingStubFile);
    await enhanceRoutingFileUsingStub(routingFilePath, routingStubFilePath, entities);

    logSuccess('Library generated successfully.');
  } catch (err) {
    logError(err);
  }
}

function findEntityTemplates(dir) {
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
         //|| item.name.includes('entity-endpoint')
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

async function replaceInFile(filePath, entity) {
  const stat = await fs.stat(filePath);
  if (stat.isFile()) {
    let content = await fs.readFile(filePath, 'utf8');

    content = replaceEntityPlaceHolders(content, entity);

    await fs.writeFile(filePath, content, 'utf8');
  }
}

async function walkAndReplace(dir, entity) {
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

async function copyTemplateContents(templateDir, destDir) {
  const entries = await fs.readdir(templateDir);
  
  for (const entry of entries) {
    if (entry === 'stub' || entry === 'cui.ts') continue; // skip stub folder & cui.ts
    
    const srcPath = path.join(templateDir, entry);
    const destPath = path.join(destDir, entry);
    await fs.copy(srcPath, destPath);
  }
}

async function copyEntityTemplates(baseLibPath, entityTemplates, entityName) {
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

async function removeEntityTemplates(entityTemplates) {
  for (const templatePath of entityTemplates) {
    try {
      const stat = await fs.stat(templatePath);

      if (stat.isDirectory()) {
        await fs.remove(templatePath); // removes directory and its contents
      } else if (stat.isFile()) {
        await fs.unlink(templatePath); // removes file
      }
    } catch (err) {
      logWarning(`⚠️ Could not remove ${templatePath}: ${err.message}`);
    }
  }
}

async function replaceLibraryPlaceholders(destPath, libraryName) {
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


//==========================================================================================
//                              Print Directory Structure
//==========================================================================================

function getFilesAndFolders(dirPath) {
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

function printNestedTree(name, items, indent = '') {
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


//==========================================================================================
//                                  CLI usage
//==========================================================================================


//const [, , command, library, ...entities] = process.argv;
//let [, , command, ...argv] = process.argv;

const args = process.argv.slice(2);

// Find the first flag (starts with "--") to split positional and named args
const firstFlagIndex = args.findIndex(arg => arg.startsWith('--'));
const positionalArgs = firstFlagIndex === -1 ? args : args.slice(0, firstFlagIndex);
const namedFlags = firstFlagIndex === -1 ? [] : args.slice(firstFlagIndex);

// Extract command and optional subcommand
const command = positionalArgs[0];
const subcommand = positionalArgs[1] || null;

// Parse named flags
const flagMap: Record<string, string> = {};
namedFlags.forEach(flag => {
  const [key, value] = flag.split('=');
  if (key.startsWith('--') && value) {
    flagMap[key.slice(2)] = value;
  }
});

// Extract specific named args
const library = flagMap.lib || flagMap.l;
const entities = flagMap.entities?.split(',') || flagMap.e?.split(',') || [];
const dest = flagMap.dest || flagMap.d || library || '';
const force = flagMap.force || flagMap.f || false;

// ✅ Destination path (relative to where user runs the CLI)
__destPath =  path.join(process.cwd(), dest);

// ✅ Template path (inside CLI package)
__tplPath = flagMap.tpl || path.join(__dirname, 'template');

// console.log({command, subcommand, library, entities });

validateCommand(command);
switch (command) {
  case 'generate':
    validateSubCommand(command, subcommand, ['library']);
    validateLibrary(command, subcommand, library);    
    switch (subcommand) {
      case 'library':
          validateLibrary(command, subcommand, library);
          validateEntities(command, subcommand, library, entities);
          if (force) await getOverwritePermission();
          generateLibrary(library, entities);
        break;
      
      default:
        logError(`Unknown sub command: ${command}`);
        process.exit(1);
        break;
    }

    break;

  case 'update':
    validateSubCommand(command, subcommand, ['model', 'form']);
    validateLibrary(command, subcommand, library);
    switch (subcommand) {
      case 'model':
          validateEntities(command, subcommand, library, entities);
          if (force) await getOverwritePermission();
          enhanceModels(library, entities);
        break;
      
      case 'form':
          validateEntities(command, subcommand, library, entities);
          if (force) await getOverwritePermission();
          enhanceFormHtml(library, entities);
        break;

      default:
        logError(`Unknown sub command: ${command}`);
          process.exit(1);
        break;
    }
    break;

  case 'add':
    validateSubCommand(command, subcommand, ['entity']);
    validateLibrary(command, subcommand, library);    
    switch (subcommand) {
      case 'entity':
          validateEntities(command, subcommand, library, entities);
          if (force) await getOverwritePermission();
          addEntity(library, entities)
        break;
      
      default:
        logError(`Unknown sub command: ${command}`);
          process.exit(1);
        break;
    }
    break;

  case 'struct':
    // validateLibrary(command, subcommand, library); 
    let tree = null;
    if(dest) {
      tree = getFilesAndFolders(__destPath);
      printNestedTree(dest, tree);
    } else {
      tree = getFilesAndFolders(__tplPath);
       printNestedTree('template', tree);
    }
    break;

  default:
    logError(`Unknown command: ${command}`);
    process.exit(1);
}
