import { exitWithError } from './logger.js';

export function validateCommand(command?: string) {
  if (!command) {
    exitWithError(
      "Missing command.",
      ["cui <command> <subcommand?> [--lib=<library>] [--entities=<Entity1,Entity2,...>]"]
    );
  }
}

export function validateSubCommand(command: string, subcommand: string | undefined, allowedCmds: string[]) {
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

export function validateLibrary(command: string, subcommand?: string, library?: string) {
  if (!library) {
    exitWithError(
      "Please provide a library name using --lib.",
      [`cui ${command} ${subcommand || '<subcommand>'} --lib=<library> --entities=<Entity1,...>`]
    );
  }
}

export function validateEntities(command: string, subcommand: string | undefined, library: string | undefined, entities: string[], min = 1) {
  if (!entities || entities.length < min) {
    exitWithError(
      `Please provide at least ${min} ${min === 1 ? 'entity' : 'entities'}.`,
      [`cui ${command} ${subcommand || '<subcommand>'} --lib=${library || '<library>'} --entities=<Entity1,...>`]
    );
  }
}
