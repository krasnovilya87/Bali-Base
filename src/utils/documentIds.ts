export function documentIdFromTitle(title: string): string {
  const cleaned = title
    .trim()
    .replace(/\//g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 140);

  return cleaned || `listing-${Date.now()}`;
}

export function uniqueDocumentIdFromTitle(title: string, usedIds: Iterable<string>): string {
  const baseId = documentIdFromTitle(title);
  const used = new Set(usedIds);

  if (!used.has(baseId)) return baseId;

  let index = 2;
  let nextId = `${baseId} ${index}`;
  while (used.has(nextId)) {
    index += 1;
    nextId = `${baseId} ${index}`;
  }

  return nextId;
}
