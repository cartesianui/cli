import { COLORS } from './logger.js';
import { CommandDef, SubcommandDef } from './commands.js';

const VERSION = '1.0.2';
const { bold, dim, cyan, reset } = COLORS;

export function showVersion(): void {
  console.log(`@cartesianui/cli v${VERSION}`);
}

export function showBanner(): void {
  console.log(`
${bold}@cartesianui/cli${reset} ${dim}v${VERSION}${reset}

${bold}Usage:${reset} cui <command> [subcommand] [flags]

${bold}Commands:${reset}
  ${cyan}create${reset} ${dim}(generate)${reset}  Scaffold a new Angular library with entities
  ${cyan}add${reset}               Add entities to an existing library
  ${cyan}update${reset}            Update model or form files
  ${cyan}extend${reset}            Add custom actions to an existing entity
  ${cyan}struct${reset}            Print directory tree structure

${dim}Run 'cui <command> --help' for details on a specific command.${reset}
`);
}

export function showCommandHelp(cmd: CommandDef): void {
  // If only one subcommand, show its full help directly
  if (cmd.subcommands.length === 1) {
    showSubcommandHelp(cmd, cmd.subcommands[0]);
    return;
  }

  const aliasStr = cmd.aliases?.length ? ` ${dim}(${cmd.aliases.join(', ')})${reset}` : '';
  console.log(`
${bold}Usage:${reset} cui ${cmd.name} <subcommand> [flags]${aliasStr}

${cmd.description}
`);

  if (cmd.subcommands.length > 0) {
    console.log(`${bold}Subcommands:${reset}`);
    const maxLen = Math.max(...cmd.subcommands.map(s => s.name.length));
    for (const sub of cmd.subcommands) {
      console.log(`  ${cyan}${sub.name.padEnd(maxLen + 2)}${reset}${sub.description}`);
    }
    console.log(`\n${dim}Run 'cui ${cmd.name} <subcommand> --help' for flag details.${reset}\n`);
  }
}

export function showSubcommandHelp(cmd: CommandDef, sub: SubcommandDef): void {
  console.log(`
${bold}Usage:${reset} cui ${cmd.name} ${sub.name} [flags]

${sub.description}
`);

  if (sub.flags.length > 0) {
    console.log(`${bold}Flags:${reset}`);
    const lines: { left: string; meta: string }[] = [];
    for (const flag of sub.flags) {
      const shortPart = flag.short ? `-${flag.short}, ` : '    ';
      const longPart = flag.boolean ? `--${flag.long}` : `--${flag.long}=<value>`;
      const reqStr = flag.required ? `${dim}(required)${reset}` : '';
      const defStr = flag.default ? `${dim}(default: ${flag.default})${reset}` : '';
      const meta = [flag.description, reqStr, defStr].filter(Boolean).join(' ');
      lines.push({ left: `  ${shortPart}${longPart}`, meta });
    }

    const maxLeft = Math.max(...lines.map(l => l.left.length));
    for (const line of lines) {
      console.log(`${line.left.padEnd(maxLeft + 4)}${line.meta}`);
    }
  }

  if (sub.examples?.length) {
    console.log(`\n${bold}Examples:${reset}`);
    for (const ex of sub.examples) {
      console.log(`  ${dim}${ex}${reset}`);
    }
  }

  console.log('');
}
