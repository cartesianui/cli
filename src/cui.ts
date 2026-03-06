#!/usr/bin/env node
import readline from 'readline';
import { execSync } from 'child_process';

import { logWarning, logError } from './logger.js';
import { parseArgs, FLAG_DEST, FLAG_TPL, FLAG_HELP } from './args.js';
import { COMMANDS, CommandDef } from './commands.js';
import { showBanner, showVersion, showCommandHelp, showSubcommandHelp } from './help.js';

// Re-export public API for external consumers
export { transformProviders, appendSharedProvidersAtEnd } from './providers.js';
export { enhanceIndexFile } from './index-file.js';

//==========================================================================================
//                                  Confirmation
//==========================================================================================

function askConfirmation(message: string): Promise<boolean> {
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

export async function getOverwritePermission(destPath: string) {
  logWarning(`This will add or update files in:\n → ${destPath}`);

  // Check if destPath is a git repo
  let isGitRepo = false;
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: destPath,
      stdio: 'ignore',
    });
    isGitRepo = true;
  } catch (err) {
    isGitRepo = false;
  }

  if (isGitRepo) {
    const status = execSync('git status --porcelain', { cwd: destPath })
      .toString()
      .trim();

    if (status !== '') {
      logError('Git working directory is not clean.');
      logError('Please commit or stash your changes, then run the command again.');
      process.exit(1);
    }
  }

  const confirmed = await askConfirmation('Do you want to continue?');
  if (!confirmed) {
    logError('Operation cancelled.');
    process.exit(0);
  }
}

//==========================================================================================
//                                  CLI Dispatch
//==========================================================================================

async function main() {
  const argv = process.argv.slice(2);

  // Global: no args → show banner
  if (argv.length === 0) {
    showBanner();
    process.exit(0);
  }

  // Global --help / -h (only if first arg is a flag, not a command)
  if (argv[0] === '--help' || argv[0] === '-h') {
    showBanner();
    process.exit(0);
  }

  // Global --version / -v
  if (argv[0] === '--version' || argv[0] === '-v') {
    showVersion();
    process.exit(0);
  }

  // Find command
  const cmdName = argv[0];
  const cmd = COMMANDS.find(c => c.name === cmdName || c.aliases?.includes(cmdName));
  if (!cmd) {
    logError(`Unknown command: ${cmdName}`);
    showBanner();
    process.exit(1);
  }

  // Commands with no subcommands (struct)
  if (cmd.subcommands.length === 0 && cmd.run) {
    const { flags } = parseArgs(argv.slice(1), [FLAG_DEST, FLAG_TPL, FLAG_HELP]);
    if (flags.help) {
      console.log(`\nUsage: cui ${cmd.name} [flags]\n\n${cmd.description}\n`);
      process.exit(0);
    }
    await cmd.run(flags);
    return;
  }

  // Command-level help or missing subcommand
  const subName = argv[1];
  if (!subName || subName === '--help' || subName === '-h') {
    showCommandHelp(cmd);
    process.exit(subName ? 0 : 1);
  }

  // Find subcommand
  const sub = cmd.subcommands.find(s => s.name === subName || s.aliases?.includes(subName));
  if (!sub) {
    logError(`Unknown subcommand: ${subName}`);
    showCommandHelp(cmd);
    process.exit(1);
  }

  // Parse flags for this subcommand
  const allFlags = [...sub.flags, FLAG_HELP];
  const { flags } = parseArgs(argv.slice(2), allFlags);

  // Subcommand-level help
  if (flags.help) {
    showSubcommandHelp(cmd, sub);
    process.exit(0);
  }

  // Validate required flags
  for (const def of sub.flags) {
    if (def.required && !flags[def.long]) {
      logError(`Missing required flag: --${def.long}`);
      showSubcommandHelp(cmd, sub);
      process.exit(1);
    }
  }

  // Run
  await sub.run(flags);
}

main().catch((err) => {
  logError(err.message || err);
  process.exit(1);
});
