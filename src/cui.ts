#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { execSync } from "child_process";

import { logWarning, logError } from './logger.js';
import { validateCommand, validateSubCommand, validateLibrary, validateEntities } from './validation.js';
import { generateLibrary, addEntity } from './library.js';
import { enhanceModels } from './models.js';
import { enhanceFormHtml } from './forms.js';
import { getFilesAndFolders, printNestedTree } from './tree.js';

// Re-export public API for external consumers
export { transformProviders, appendSharedProvidersAtEnd } from './providers.js';
export { enhanceIndexFile } from './index-file.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//==========================================================================================
//                                  Confirmation
//==========================================================================================

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

async function getOverwritePermission(destPath: string) {
  logWarning(`This will add or update files in:\n → ${destPath}`);

  // Check if destPath is a git repo
  let isGitRepo = false;
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: destPath,
      stdio: "ignore",
    });
    isGitRepo = true;
  } catch (err) {
    isGitRepo = false;
  }

  if (isGitRepo) {
    // Check if repo is clean
    const status = execSync("git status --porcelain", { cwd: destPath })
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
//                                  CLI Dispatch
//==========================================================================================

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
const section = flagMap.section || flagMap.s || 'admin';
const library = flagMap.lib || flagMap.l;
const entities = flagMap.entities?.split(',') || flagMap.e?.split(',') || [];
const dest = flagMap.dest || flagMap.d || library || '';
const force = flagMap.force || flagMap.f || false;
const hydrate = flagMap.hydrate || 'fields'; // fields | attribute | entity

// Destination path (relative to where user runs the CLI)
const destPath = path.join(process.cwd(), dest);

// Template path (inside CLI package)
const tplPath = flagMap.tpl || path.join(__dirname, 'template');

validateCommand(command);
switch (command) {
  case 'generate':
  case 'create':
    validateSubCommand(command, subcommand, ['library']);
    validateLibrary(command, subcommand, library);
    switch (subcommand) {
      case 'library':
          validateLibrary(command, subcommand, library);
          validateEntities(command, subcommand, library, entities);
          if (force) await getOverwritePermission(destPath);
          generateLibrary(section, library, entities, destPath, tplPath);
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
          if (force) await getOverwritePermission(destPath);
          enhanceModels(destPath, entities, hydrate);
        break;

      case 'form':
          validateEntities(command, subcommand, library, entities);
          if (force) await getOverwritePermission(destPath);
          enhanceFormHtml(destPath, entities);
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
          if (force) await getOverwritePermission(destPath);
          addEntity(section, library, entities, destPath, tplPath)
        break;

      default:
        logError(`Unknown sub command: ${command}`);
          process.exit(1);
        break;
    }
    break;

  case 'struct':
    let tree = null;
    if(dest) {
      tree = getFilesAndFolders(destPath);
      printNestedTree(dest, tree);
    } else {
      tree = getFilesAndFolders(tplPath);
       printNestedTree('template', tree);
    }
    break;

  default:
    logError(`Unknown command: ${command}`);
    process.exit(1);
}
