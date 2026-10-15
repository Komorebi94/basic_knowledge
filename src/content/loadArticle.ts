import type { Article, ArticleSection } from "./articles";

const knowledgeModules = import.meta.glob<Record<string, unknown>>("./knowledge/*.ts");
const aiModules = import.meta.glob<Record<string, unknown>>("./ai/*.ts");

function isSection(value: unknown): value is ArticleSection {
  if (!value || typeof value !== "object") return false;
  const section = value as Partial<ArticleSection>;
  return typeof section.id === "string" && typeof section.title === "string" && Array.isArray(section.paragraphs) && section.paragraphs.every((paragraph) => typeof paragraph === "string");
}

function isArticle(value: unknown): value is Article {
  if (!value || typeof value !== "object") return false;
  const article = value as Partial<Article>;
  return typeof article.id === "string"
    && (article.kind === "knowledge" || article.kind === "ai")
    && typeof article.slug === "string"
    && typeof article.title === "string"
    && typeof article.summary === "string"
    && Array.isArray(article.sections)
    && article.sections.every(isSection);
}

const cache = new Map<string, Promise<Article | undefined>>();

export function loadArticle(kind: Article["kind"], slug: string | undefined, domainSlug?: string): Promise<Article | undefined> {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return Promise.resolve(undefined);
  const key = `${kind}:${domainSlug ?? ""}:${slug}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const modules = kind === "ai" ? aiModules : knowledgeModules;
  const load = modules[`./${kind}/${slug}.ts`];
  if (!load) return Promise.resolve(undefined);
  const pending = load().then((mod) => {
    const article = Object.values(mod).find(isArticle);
    if (!article || article.kind !== kind || article.slug !== slug) return undefined;
    if (kind === "knowledge" && article.domainSlug !== domainSlug) return undefined;
    return article;
  });
  cache.set(key, pending);
  pending.catch(() => {
    cache.delete(key);
  });
  return pending;
}
