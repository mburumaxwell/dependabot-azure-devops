export type VariableFinderFn = (name: string) => string | undefined | Promise<string | undefined>;

async function convertPlaceholder({
  input,
  variableFinder,
}: {
  input?: string;
  variableFinder: VariableFinderFn;
}): Promise<string | undefined> {
  if (!input) return undefined;

  const matches: RegExpExecArray[] = extractPlaceholder(input);
  let result = input;
  for (const match of matches) {
    const placeholder = match[0];
    const name = match[1]!;
    const value = (await variableFinder(name)) ?? placeholder;
    result = result.replace(placeholder, value);
  }
  return result;
}

function extractPlaceholder(input: string) {
  const matches: RegExpExecArray[] = [];
  const regexp: RegExp = /\$\{\{\s{0,10}([a-zA-Z_][a-zA-Z0-9._-]{0,99})\s{0,10}\}\}/;

  let searchInput = input;
  let offset = 0;

  while (searchInput.length > 0) {
    const match = searchInput.match(regexp);
    if (!match || match.index === undefined) break;

    // Adjust match index to account for previous slices
    const adjustedMatch = Object.assign([...match], {
      index: match.index + offset,
      input: input,
      groups: match.groups,
    }) as RegExpExecArray;

    matches.push(adjustedMatch);

    // Move past this match
    const nextStart = match.index + match[0].length;
    offset += nextStart;
    searchInput = searchInput.slice(nextStart);
  }

  return matches;
}

export { convertPlaceholder, extractPlaceholder };
