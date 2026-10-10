export interface SearchDocument {
  id: string;
  type: "domain" | "knowledge" | "ai" | "practice";
  availability?: "catalog" | "readable";
  title: string;
  aliases: readonly string[];
  tags: readonly string[];
  headings: readonly string[];
  summary: string;
  body: string;
  importance: number;
  order: number;
  href: string;
}

export interface SearchMatch {
  document: SearchDocument;
  tier: 1 | 2 | 3 | 4 | 5;
}

export function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase();
}

function queryTokens(query: string): string[] {
  return query.match(/[\p{Script=Han}]+|[\p{Letter}\p{Number}]+/gu) ?? [];
}

function includesQuery(value: string, query: string, tokens: readonly string[]): boolean {
  const normalized = normalizeSearchText(value);
  return normalized.includes(query) || tokens.every((token) => normalized.includes(token));
}

function rank(document: SearchDocument, query: string, tokens: readonly string[]): SearchMatch["tier"] | null {
  const title = normalizeSearchText(document.title);
  if (title === query || normalizeSearchText(document.id) === query) return 1;
  if ([document.id, document.title, ...document.aliases].some((value) => includesQuery(value, query, tokens))) return 2;
  if ([...document.tags, ...document.headings].some((value) => includesQuery(value, query, tokens))) return 3;
  if (includesQuery(document.summary, query, tokens)) return 4;
  if (includesQuery(document.body, query, tokens)) return 5;
  return null;
}

export function searchDocuments(documents: readonly SearchDocument[], rawQuery: string): SearchMatch[] {
  const query = normalizeSearchText(rawQuery).slice(0, 80);
  const tokens = queryTokens(query);
  if (!query || tokens.length === 0) return [];

  return documents
    .map((document) => {
      const tier = rank(document, query, tokens);
      return tier === null ? null : { document, tier };
    })
    .filter((match): match is SearchMatch => match !== null)
    .sort((left, right) =>
      left.tier - right.tier ||
      right.document.importance - left.document.importance ||
      left.document.order - right.document.order ||
      left.document.id.localeCompare(right.document.id),
    );
}
