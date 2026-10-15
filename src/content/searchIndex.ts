import type { SearchDocument } from "../infrastructure/search/search";
import indexUrl from "./searchIndex.json?url";

function isStringList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSearchDocument(value: unknown): value is SearchDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<SearchDocument>;
  return (document.type === "domain" || document.type === "knowledge" || document.type === "ai" || document.type === "practice")
    && typeof document.id === "string"
    && typeof document.title === "string"
    && typeof document.summary === "string"
    && typeof document.body === "string"
    && typeof document.importance === "number"
    && typeof document.order === "number"
    && isStringList(document.aliases)
    && isStringList(document.tags)
    && isStringList(document.headings)
    && typeof document.href === "string"
    && document.href.startsWith("/")
    && !document.href.startsWith("//")
    && !document.href.includes("://");
}

let pending: Promise<readonly SearchDocument[]> | undefined;

export function loadSearchIndex(): Promise<readonly SearchDocument[]> {
  if (pending) return pending;
  const request = fetch(indexUrl).then(async (response) => {
    if (!response.ok) throw new Error("搜索索引载入失败");
    const payload: unknown = await response.json();
    if (!Array.isArray(payload) || payload.some((item) => !isSearchDocument(item))) throw new Error("搜索索引无效");
    return payload;
  });
  pending = request;
  request.catch(() => {
    if (pending === request) pending = undefined;
  });
  return request;
}
