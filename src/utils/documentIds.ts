export function documentIdFromTitle(title: string): string {
  const cleaned = title
    .trim()
    .replace(/\//g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 128);

  return cleaned || `listing-${Date.now()}`;
}

export function uniqueDocumentIdFromTitle(title: string, usedIds: Iterable<string>): string {
  const baseId = documentIdFromTitle(title);
  const used = new Set(usedIds);

  if (!used.has(baseId)) return baseId;

  let index = 2;
  const withSuffix = (value: number) => {
    const suffix = ` ${value}`;
    return `${baseId.slice(0, 128 - suffix.length)}${suffix}`;
  };
  let nextId = withSuffix(index);
  while (used.has(nextId)) {
    index += 1;
    nextId = withSuffix(index);
  }

  return nextId;
}
