export function pascalCase(str: string): string {
  return str
    // Strip any `-`, `_`, or whitespace runs and capitalize the
    // character that follows. Handles single-word ("core"), snake_case
    // ("ledger_account"), kebab-case ("ledger-account"), and PascalCase
    // ("LedgerAccount") inputs uniformly.
    .replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
    // Ensure the first character is uppercase regardless of input casing.
    .replace(/^(.)/, c => c.toUpperCase());
}

export function kebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

export function snakeCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')   // handle camelCase and PascalCase
    .replace(/[-\s]+/g, '_')                  // convert hyphens/spaces to underscores
    .toLowerCase();
}

export function camelCase(str: string): string {
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

export function readableCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function pluralize(name: string): string {
  if (name.endsWith('y') && !/[aeiou]y$/i.test(name)) {
    return name.slice(0, -1) + 'ies'; // category → categories
  } else if (name.endsWith('s') || name.endsWith('x') || name.endsWith('z') || name.endsWith('ch') || name.endsWith('sh')) {
    return name + 'es'; // box → boxes, class → classes
  } else {
    return name + 's'; // product → products
  }
}
