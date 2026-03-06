export interface FlagDef {
  long: string;
  short?: string;
  description: string;
  required?: boolean;
  boolean?: boolean;
  default?: string;
}

export interface ParseResult {
  positional: string[];
  flags: Record<string, string | boolean>;
}

/**
 * Parse CLI arguments against flag definitions.
 * Supports: --key=value, --key value, -k=value, -k value, --bool
 */
export function parseArgs(argv: string[], flagDefs: FlagDef[]): ParseResult {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  // Apply defaults
  for (const def of flagDefs) {
    if (def.default !== undefined) {
      flags[def.long] = def.default;
    }
  }

  const findDef = (key: string): FlagDef | undefined => {
    // key could be long name or short alias
    return flagDefs.find(d => d.long === key || d.short === key);
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      // Long flag: --key=value or --key value or --bool
      const rest = arg.slice(2);
      const eqIdx = rest.indexOf('=');

      if (eqIdx >= 0) {
        // --key=value
        const key = rest.slice(0, eqIdx);
        const value = rest.slice(eqIdx + 1);
        const def = findDef(key);
        flags[def ? def.long : key] = value;
      } else {
        // --key or --key value
        const key = rest;
        const def = findDef(key);
        if (def?.boolean) {
          flags[def.long] = true;
        } else {
          // Peek next arg for value
          const next = argv[i + 1];
          if (next !== undefined && !next.startsWith('-')) {
            flags[def ? def.long : key] = next;
            i++;
          } else {
            // Boolean-like (no value provided)
            flags[def ? def.long : key] = true;
          }
        }
      }
    } else if (arg.startsWith('-') && arg.length >= 2) {
      // Short flag: -k=value or -k value or -k (bool)
      const rest = arg.slice(1);
      const eqIdx = rest.indexOf('=');

      if (eqIdx >= 0) {
        // -k=value
        const key = rest.slice(0, eqIdx);
        const value = rest.slice(eqIdx + 1);
        const def = findDef(key);
        flags[def ? def.long : key] = value;
      } else {
        // -k or -k value
        const key = rest;
        const def = findDef(key);
        if (def?.boolean) {
          flags[def.long] = true;
        } else {
          // Peek next arg for value
          const next = argv[i + 1];
          if (next !== undefined && !next.startsWith('-')) {
            flags[def ? def.long : key] = next;
            i++;
          } else {
            flags[def ? def.long : key] = true;
          }
        }
      }
    } else {
      positional.push(arg);
    }

    i++;
  }

  return { positional, flags };
}

// Common flag definitions shared across commands
export const FLAG_LIB: FlagDef = { long: 'lib', short: 'l', description: 'Library name', required: true };
export const FLAG_ENTITIES: FlagDef = { long: 'entities', short: 'e', description: 'Comma-separated entity names', required: true };
export const FLAG_SECTION: FlagDef = { long: 'section', short: 's', description: 'Section prefix', default: 'admin' };
export const FLAG_DEST: FlagDef = { long: 'dest', short: 'd', description: 'Destination path' };
export const FLAG_FORCE: FlagDef = { long: 'force', short: 'f', description: 'Skip git-clean check', boolean: true };
export const FLAG_TPL: FlagDef = { long: 'tpl', description: 'Custom template path' };
export const FLAG_HYDRATE: FlagDef = { long: 'hydrate', description: 'Hydration mode: entity | attribute | fields', default: 'entity' };
export const FLAG_HELP: FlagDef = { long: 'help', short: 'h', description: 'Show help', boolean: true };
export const FLAG_ACTION: FlagDef = { long: 'action', short: 'a', description: 'Custom action name (camelCase, e.g., getOpenVisits)', required: true };
export const FLAG_ENTITY_SINGLE: FlagDef = { long: 'entity', short: 'e', description: 'Entity name to extend', required: true };
