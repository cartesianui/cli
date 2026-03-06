const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const UNDERLINE = "\x1b[4m";
const RESET = "\x1b[0m";
export const ERROR_SYMBOL = `${RED}✖${RESET}`;

export const COLORS = {
  reset: RESET,
  red: RED,
  green: GREEN,
  yellow: YELLOW,
  cyan: CYAN,
  blue: BLUE,
  magenta: MAGENTA,
  bold: BOLD,
  dim: DIM,
  underline: UNDERLINE,
};

export function logInfo(message: string) {
  console.info(`${COLORS.cyan}💡 ${message}${COLORS.reset}`);
}

export function logSuccess(message: string) {
  console.info(`${COLORS.green}✅ ${message}${COLORS.reset}`);
}

export function logWarning(message: string) {
  console.warn(`${COLORS.yellow}⚠️  ${message}${COLORS.reset}`);
}

export function logError(message: string) {
  console.error(`${COLORS.red}❌ ${message}${COLORS.reset}`);
}

export function logErrorSimple(message: string) {
  console.error(`${COLORS.red}${message}${COLORS.reset}`);
}

export function exitWithError(message: string, usageLines: string[]) {
  logError(`${message}`);
  if (usageLines.length > 0) {
    logErrorSimple(`\n${BOLD}Usage:${RESET}`);
    usageLines.forEach(line => logErrorSimple(`  ${line}`));
  }
  logErrorSimple(''); // blank line
  process.exit(1);
}
