import path from 'path';
import fs from 'fs-extra';
import { logInfo, logSuccess, logError } from './logger.js';
import { pascalCase, camelCase, kebabCase, pluralize } from './strings.js';
import { readFile, writeFile, addImportToContent } from './ast-helpers.js';

export async function extendEntity(destPath: string, entity: string, actionName: string) {
  const pascal = pascalCase(entity);
  const kebab = kebabCase(entity);
  const camel = camelCase(entity);
  const pluralKebab = kebabCase(pluralize(entity));
  const pluralPascal = pascalCase(pluralize(entity));
  const pluralCamel = camelCase(pluralize(entity));

  const libPath = path.join(destPath, 'src', 'lib');
  const actionsPath = path.join(libPath, 'store', kebab, 'actions.ts');
  const reducerPath = path.join(libPath, 'store', kebab, 'reducer.ts');
  const effectPath = path.join(libPath, 'store', kebab, 'effect.ts');
  const httpServicePath = path.join(libPath, 'shared', kebab, 'http.service.ts');

  // Find sandbox file (pattern: {library}.sandbox.ts)
  const sandboxPath = await findSandboxFile(libPath);

  // Validate all files exist
  for (const f of [actionsPath, reducerPath, effectPath, httpServicePath]) {
    if (!await fs.pathExists(f)) {
      logError(`File not found: ${f}`);
      return;
    }
  }

  // Detect mode: check if entity already has a real (uncommented) additionalActions
  const actionsContent = await readFile(actionsPath);
  const isFirstExtension = !hasUncommentedAdditionalActions(actionsContent);

  logInfo(`Extending ${pascal} with action: ${actionName} (${isFirstExtension ? 'first extension' : 'appending'})`);

  await extendHttpService(httpServicePath, pascal, actionName, pluralKebab, isFirstExtension);
  await extendActions(actionsPath, pascal, actionName, isFirstExtension);
  await extendReducer(reducerPath, pascal, actionName, pluralCamel, pluralPascal, isFirstExtension);
  await extendEffect(effectPath, pascal, actionName, isFirstExtension);

  if (sandboxPath) {
    await extendSandbox(sandboxPath, pascal, camel, actionName, isFirstExtension);
  } else {
    logInfo('Sandbox file not found — skipping sandbox extension.');
  }

  logSuccess(`Extension complete: ${pascal}.${actionName}`);
}

function hasUncommentedAdditionalActions(content: string): boolean {
  // Match "const additionalActions" that is NOT preceded by // on the same line
  const lines = content.split('\n');
  return lines.some(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('const additionalActions') ||
           trimmed.startsWith('export const additionalActions');
  });
}

async function findSandboxFile(libPath: string): Promise<string | null> {
  const entries = await fs.readdir(libPath);
  const sandbox = entries.find(e => e.endsWith('.sandbox.ts'));
  return sandbox ? path.join(libPath, sandbox) : null;
}

// ─── HTTP Service ───────────────────────────────────────────────────────────

async function extendHttpService(
  filePath: string, pascal: string, actionName: string, pluralKebab: string, isFirst: boolean
) {
  let content = await readFile(filePath);
  const kebabAction = kebabCase(actionName);

  // Add ICartesianResponse import if missing
  content = addImportToContent(content, '@cartesianui/core', ['ICartesianResponse']);

  if (isFirst) {
    // Replace empty extension type: export type I{Entity}HttpServiceExtension = {};
    const emptyTypeRegex = new RegExp(
      `export\\s+type\\s+I${pascal}HttpServiceExtension\\s*=\\s*\\{\\s*\\};`
    );
    const methodSig = `  ${actionName}: (id: string) => Observable<ICartesianResponse>;`;
    content = content.replace(
      emptyTypeRegex,
      `export type I${pascal}HttpServiceExtension = {\n${methodSig}\n};`
    );

    // Ensure IHttpService has 2nd type param
    const singleTypeRegex = new RegExp(
      `IHttpService<${pascal}>(?!\\s*,)`
    );
    if (singleTypeRegex.test(content)) {
      content = content.replace(
        singleTypeRegex,
        `IHttpService<${pascal}, I${pascal}HttpServiceExtension>`
      );
    }
  } else {
    // Append to existing extension type — find closing }; of the type
    const typeRegex = new RegExp(
      `(export\\s+type\\s+I${pascal}HttpServiceExtension\\s*=\\s*\\{[^}]*)(\\};)`
    );
    const methodSig = `  ${actionName}: (id: string) => Observable<ICartesianResponse>;\n`;
    content = content.replace(typeRegex, `$1${methodSig}$2`);
  }

  // Add HTTP method before class closing brace
  const httpMethod =
    `\n  @GET('/${pluralKebab}/{id}/${kebabAction}')` +
    `\n  public ${actionName}(@Path('id') id: string): Observable<any> {` +
    `\n    return null;` +
    `\n  }\n`;

  const lastBrace = content.lastIndexOf('}');
  if (lastBrace >= 0) {
    content = content.slice(0, lastBrace) + httpMethod + content.slice(lastBrace);
  }

  await writeFile(filePath, content);
  logSuccess(`  Updated: ${path.basename(filePath)} (HTTP service)`);
}

// ─── Actions ────────────────────────────────────────────────────────────────

async function extendActions(
  filePath: string, pascal: string, actionName: string, isFirst: boolean
) {
  let content = await readFile(filePath);
  const readableName = readableActionName(pascal, actionName);

  // Add ngrx imports
  content = addImportToContent(content, '@ngrx/store', ['createAction', 'props']);

  const triplet =
    `  ${actionName}: createAction('[${pascal}] ${readableName}', props<{ id: string }>()),\n` +
    `  ${actionName}Success: createAction('[${pascal}] ${readableName} Success', props<{ entity: ${pascal} }>()),\n` +
    `  ${actionName}Failure: createAction('[${pascal}] ${readableName} Failure', props<{ message: string; errors?: any }>()),`;

  if (isFirst) {
    // Insert additionalActions block + spread into export
    const exportRegex = new RegExp(
      `(export\\s+const\\s+${pascal}Actions\\s*=\\s*\\{\\s*\\n\\s*\\.\\.\\.actions,?)[^}]*(\\})`
    );
    content = content.replace(exportRegex,
      `const additionalActions = {\n${triplet}\n};\n\n` +
      `export const ${pascal}Actions = {\n  ...actions,\n  ...additionalActions,\n$2`
    );
  } else {
    // Append to existing additionalActions — find the closing of the object
    // Find last Failure action line in additionalActions
    const failurePattern = /Failure'[^)]*\)\s*\)\s*,?\s*\n/g;
    let lastMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;
    while ((match = failurePattern.exec(content)) !== null) {
      lastMatch = match;
    }

    if (lastMatch) {
      const insertIdx = lastMatch.index + lastMatch[0].length;
      content = content.slice(0, insertIdx) + triplet + '\n' + content.slice(insertIdx);
    }
  }

  await writeFile(filePath, content);
  logSuccess(`  Updated: ${path.basename(filePath)} (actions)`);
}

// ─── Reducer ────────────────────────────────────────────────────────────────

async function extendReducer(
  filePath: string, pascal: string, actionName: string,
  pluralCamel: string, pluralPascal: string, isFirst: boolean
) {
  let content = await readFile(filePath);
  const requestProp = `${actionName}Request`;

  if (isFirst) {
    // Add imports
    content = addImportToContent(content, '@cartesianui/common', [
      'entityFeature', 'requestStarted', 'requestCompleted', 'requestFailed', 'RequestState', 'requestDefault'
    ]);
    content = addImportToContent(content, '@ngrx/store', ['createSelector']);

    // Find and extract the entityFeature call to get the feature key
    const featureRegex = new RegExp(
      `export\\s+const\\s+from${pascal}\\s*=\\s*entityFeature<${pascal}>\\s*\\(\\s*'([^']+)'\\s*,\\s*${pascal}Actions\\s*\\)\\s*;`
    );
    const featureMatch = content.match(featureRegex);
    const featureKey = featureMatch ? featureMatch[1] : pluralCamel;

    // Remove the old export line
    content = content.replace(featureRegex, '');

    // Clean up excessive blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    // Build the full extension block
    const extensionBlock =
`
export interface I${pascal}StateExtended {
  ${requestProp}: RequestState | undefined;
}

const stateExtension: I${pascal}StateExtended = {
  ${requestProp}: requestDefault
};

const baseFeature = entityFeature<${pascal}, I${pascal}StateExtended>('${featureKey}', ${pascal}Actions, stateExtension);

const originalReducer = baseFeature.reducer;

const customReducer = (state: any, action: any) => {
  let newState = originalReducer(state, action);

  switch (action.type) {
    case ${pascal}Actions.${actionName}.type:
      return { ...newState, ${requestProp}: { ...requestStarted } };

    case ${pascal}Actions.${actionName}Success.type:
      return { ...newState, ${requestProp}: { ...requestCompleted } };

    case ${pascal}Actions.${actionName}Failure.type:
      return { ...newState, ${requestProp}: { ...requestFailed } };

    default:
      return newState;
  }
};

const stateSelector = (baseFeature as any).select${pluralPascal}State;

const ${requestProp} = createSelector(stateSelector, (state: any) => state.${requestProp});

export const from${pascal} = {
  ...baseFeature,
  reducer: customReducer,
  ${requestProp}
};
`;

    // Append at the end
    content = content.trimEnd() + '\n' + extensionBlock;
  } else {
    // Subsequent extension — append to existing structures

    // 1. Add property to interface
    const interfaceRegex = new RegExp(`(interface\\s+I${pascal}StateExtended\\s*\\{[^}]*)(\\})`);
    content = content.replace(interfaceRegex, `$1  ${requestProp}: RequestState | undefined;\n$2`);

    // 2. Add default to stateExtension
    const stateExtRegex = new RegExp(`(const\\s+stateExtension[^{]*\\{[^}]*)(\\})`);
    content = content.replace(stateExtRegex, `$1  ${requestProp}: requestDefault\n$2`);

    // Fix potential missing comma in stateExtension (before newly added line)
    content = content.replace(
      new RegExp(`(requestDefault|undefined)(\\s*\\n\\s+${requestProp}:)`),
      '$1,$2'
    );

    // 3. Add switch cases before default:
    const switchCases =
      `    case ${pascal}Actions.${actionName}.type:\n` +
      `      return { ...newState, ${requestProp}: { ...requestStarted } };\n\n` +
      `    case ${pascal}Actions.${actionName}Success.type:\n` +
      `      return { ...newState, ${requestProp}: { ...requestCompleted } };\n\n` +
      `    case ${pascal}Actions.${actionName}Failure.type:\n` +
      `      return { ...newState, ${requestProp}: { ...requestFailed } };\n\n`;

    content = content.replace(/(\n\s*default:\s*\n)/, '\n' + switchCases + '$1');

    // 4. Add new selector before the export const from{Entity}
    const exportRegex = new RegExp(`(export\\s+const\\s+from${pascal}\\s*=\\s*\\{)`);
    const selectorLine = `const ${requestProp} = createSelector(stateSelector, (state: any) => state.${requestProp});\n\n`;
    content = content.replace(exportRegex, selectorLine + '$1');

    // 5. Add selector to export object — before closing };
    const exportObjRegex = new RegExp(`(export\\s+const\\s+from${pascal}\\s*=\\s*\\{[^}]*)(\\};?)`);
    content = content.replace(exportObjRegex, `$1  ${requestProp},\n$2`);

    // Fix potential missing comma before new selector in export
    content = content.replace(
      new RegExp(`(\\w+Request|customReducer)\\s*\\n(\\s+${requestProp},)`),
      '$1,\n$2'
    );
  }

  await writeFile(filePath, content);
  logSuccess(`  Updated: ${path.basename(filePath)} (reducer)`);
}

// ─── Effect ─────────────────────────────────────────────────────────────────

async function extendEffect(
  filePath: string, pascal: string, actionName: string, isFirst: boolean
) {
  let content = await readFile(filePath);

  // Add required imports
  content = addImportToContent(content, '@ngrx/effects', ['createEffect', 'ofType']);
  content = addImportToContent(content, 'rxjs', ['of', 'switchMap', 'map', 'catchError']);
  content = addImportToContent(content, '@cartesianui/core', ['ICartesianResponse']);
  content = addImportToContent(content, '../../shared', [`I${pascal}HttpServiceExtension`]);

  if (isFirst) {
    // Change EntityEffect<Entity> to EntityEffect<Entity, IEntityHttpServiceExtension>
    // (only if it has single type param — clean template already has 2 params)
    const singleTypeRegex = new RegExp(
      `EntityEffect<${pascal}>(?![,\\w])`
    );
    if (singleTypeRegex.test(content)) {
      content = content.replace(
        singleTypeRegex,
        `EntityEffect<${pascal}, I${pascal}HttpServiceExtension>`
      );
    }
  }

  // Build the effect member
  const effectBlock =
    `\n  ${actionName}$ = createEffect(() =>\n` +
    `    this.actions$.pipe(\n` +
    `      ofType(${pascal}Actions.${actionName}),\n` +
    `      map((action: any) => action),\n` +
    `      switchMap(({ id }) => {\n` +
    `        return this.httpService.${actionName}(id).pipe(\n` +
    `          map(({ data }: ICartesianResponse) => ${pascal}Actions.${actionName}Success({ entity: data })),\n` +
    `          catchError(({ errors, message }: ICartesianResponse) =>\n` +
    `            of(${pascal}Actions.${actionName}Failure({ errors, message }))\n` +
    `          )\n` +
    `        );\n` +
    `      })\n` +
    `    )\n` +
    `  );\n`;

  // Insert before class closing brace
  const lastBrace = content.lastIndexOf('}');
  if (lastBrace >= 0) {
    content = content.slice(0, lastBrace) + effectBlock + content.slice(lastBrace);
  }

  await writeFile(filePath, content);
  logSuccess(`  Updated: ${path.basename(filePath)} (effect)`);
}

// ─── Sandbox ────────────────────────────────────────────────────────────────

async function extendSandbox(
  filePath: string, pascal: string, camel: string, actionName: string, isFirst: boolean
) {
  let content = await readFile(filePath);
  const requestProp = `${actionName}Request`;
  const selectorName = `from${pascal}`;
  const actionsName = `${pascal}Actions`;

  // Add required imports
  content = addImportToContent(content, 'rxjs', ['Observable']);
  content = addImportToContent(content, '@angular/core', ['Signal']);
  content = addImportToContent(content, '@ngrx/store', ['select']);
  content = addImportToContent(content, '@angular/core/rxjs-interop', ['toSignal']);
  content = addImportToContent(content, '@cartesianui/common', ['RequestState']);
  content = addImportToContent(content, './store', [selectorName, actionsName]);

  // Build the property + dispatch blocks
  const propBlock =
    `\n  ${requestProp}$ = this.store.pipe(select(${selectorName}.${requestProp}));` +
    `\n  readonly ${requestProp} = toSignal(this.${requestProp}$, { initialValue: undefined });\n`;

  const dispatchBlock =
    `\n  ${actionName}(id: string): void {` +
    `\n    this.store.dispatch(${actionsName}.${actionName}({ id }));` +
    `\n  }\n`;

  // Insert before class closing brace
  const lastBrace = content.lastIndexOf('}');
  if (lastBrace >= 0) {
    const before = content.slice(0, lastBrace).trimEnd();
    content = before + '\n' + propBlock + dispatchBlock + '}\n';
  }

  await writeFile(filePath, content);
  logSuccess(`  Updated: ${path.basename(filePath)} (sandbox)`);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function readableActionName(pascal: string, actionName: string): string {
  // getOpenVisits → Get Open Visits
  return actionName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}
