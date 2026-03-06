import path from 'path';
import { fileURLToPath } from 'url';
import { FlagDef, FLAG_LIB, FLAG_ENTITIES, FLAG_SECTION, FLAG_DEST, FLAG_FORCE, FLAG_TPL, FLAG_HYDRATE, FLAG_ACTION, FLAG_ENTITY_SINGLE } from './args.js';
import { generateLibrary, addEntity } from './library.js';
import { enhanceModels } from './models.js';
import { enhanceFormHtml } from './forms.js';
import { extendEntity } from './extend.js';
import { getFilesAndFolders, printNestedTree } from './tree.js';
import { getOverwritePermission } from './cui.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SubcommandDef {
  name: string;
  aliases?: string[];
  description: string;
  flags: FlagDef[];
  examples?: string[];
  run: (flags: Record<string, string | boolean>) => Promise<void>;
}

export interface CommandDef {
  name: string;
  aliases?: string[];
  description: string;
  subcommands: SubcommandDef[];
  run?: (flags: Record<string, string | boolean>) => Promise<void>;
}

function resolveCommonFlags(flags: Record<string, string | boolean>) {
  const rawLib = flags.lib as string;
  const library = rawLib ? rawLib.toLowerCase() : rawLib;
  const entities = flags.entities ? (flags.entities as string).split(',') : [];
  const section = (flags.section as string) || 'admin';
  const dest = (flags.dest as string) || library || '';
  const destPath = path.join(process.cwd(), dest);
  const tplPath = (flags.tpl as string) || path.join(__dirname, 'template');
  const force = flags.force === true;
  return { library, entities, section, dest, destPath, tplPath, force };
}

export const COMMANDS: CommandDef[] = [
  {
    name: 'create',
    aliases: ['generate'],
    description: 'Scaffold a new Angular library with entities',
    subcommands: [
      {
        name: 'library',
        description: 'Scaffold a new Angular library with entities',
        flags: [FLAG_LIB, FLAG_ENTITIES, FLAG_SECTION, FLAG_DEST, FLAG_FORCE, FLAG_TPL],
        examples: [
          'cui create library --lib=Catalog --entities=Product,Category',
          'cui create library -l Catalog -e Product,Category -s admin',
        ],
        run: async (flags) => {
          const { library, entities, section, destPath, tplPath, force } = resolveCommonFlags(flags);
          if (force) await getOverwritePermission(destPath);
          await generateLibrary(section, library, entities, destPath, tplPath);
        },
      },
    ],
  },
  {
    name: 'add',
    description: 'Add entities to an existing library',
    subcommands: [
      {
        name: 'entity',
        description: 'Add entities to an existing library',
        flags: [FLAG_LIB, FLAG_ENTITIES, FLAG_SECTION, FLAG_DEST, FLAG_FORCE, FLAG_TPL],
        examples: [
          'cui add entity --lib=Catalog --entities=Brand',
          'cui add entity -l Catalog -e Brand,Variant',
        ],
        run: async (flags) => {
          const { library, entities, section, destPath, tplPath, force } = resolveCommonFlags(flags);
          if (force) await getOverwritePermission(destPath);
          await addEntity(section, library, entities, destPath, tplPath);
        },
      },
    ],
  },
  {
    name: 'update',
    description: 'Update model or form files',
    subcommands: [
      {
        name: 'model',
        description: 'Update model files with metadata',
        flags: [FLAG_LIB, FLAG_ENTITIES, FLAG_DEST, FLAG_FORCE, FLAG_HYDRATE],
        examples: [
          'cui update model --lib=Catalog --entities=Product',
          'cui update model -l Catalog -e Product --hydrate=fields',
        ],
        run: async (flags) => {
          const { entities, destPath, force } = resolveCommonFlags(flags);
          const hydrate = (flags.hydrate as string) || 'entity';
          if (force) await getOverwritePermission(destPath);
          enhanceModels(destPath, entities, hydrate);
        },
      },
      {
        name: 'form',
        description: 'Update form HTML templates',
        flags: [FLAG_LIB, FLAG_ENTITIES, FLAG_DEST, FLAG_FORCE],
        examples: [
          'cui update form --lib=Catalog --entities=Product',
          'cui update form -l Catalog -e Product,Category',
        ],
        run: async (flags) => {
          const { entities, destPath, force } = resolveCommonFlags(flags);
          if (force) await getOverwritePermission(destPath);
          enhanceFormHtml(destPath, entities);
        },
      },
    ],
  },
  {
    name: 'extend',
    description: 'Add custom actions to an existing entity',
    subcommands: [
      {
        name: 'entity',
        description: 'Add a custom action chain (HTTP + action + reducer + effect + sandbox)',
        flags: [FLAG_LIB, FLAG_ENTITY_SINGLE, FLAG_ACTION, FLAG_DEST],
        examples: [
          'cui extend entity --lib=care --entity=Visit --action=getOpenVisits',
          'cui extend entity -l care -e Visit -a getOpenVisits',
        ],
        run: async (flags) => {
          const library = (flags.lib as string).toLowerCase();
          const entity = flags.entity as string;
          const actionName = flags.action as string;
          const dest = (flags.dest as string) || library;
          const destPath = path.join(process.cwd(), dest);
          await extendEntity(destPath, entity, actionName);
        },
      },
    ],
  },
  {
    name: 'struct',
    description: 'Print directory tree structure',
    subcommands: [],
    run: async (flags) => {
      const dest = (flags.dest as string) || '';
      const tplPath = (flags.tpl as string) || path.join(__dirname, 'template');
      if (dest) {
        const destPath = path.join(process.cwd(), dest);
        const tree = getFilesAndFolders(destPath);
        printNestedTree(dest, tree);
      } else {
        const tree = getFilesAndFolders(tplPath);
        printNestedTree('template', tree);
      }
    },
  },
];
