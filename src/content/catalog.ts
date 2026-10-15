import catalogSource from "./catalog.json";
import publicMetadata from "./publicMetadata.json";

export interface CatalogArticle {
  readonly id: string;
  readonly catalogId: string;
  readonly kind: "knowledge" | "ai";
  readonly title: string;
  readonly summary: string;
  readonly domainSlug?: string;
  readonly slug: string;
  readonly estimatedMinutes: number;
  readonly href: string;
}

function toCatalogArticle(article: (typeof publicMetadata.articles)[number]): CatalogArticle {
  if (article.kind !== "knowledge" && article.kind !== "ai") throw new Error(`无效文章类型：${article.id}`);
  if (article.kind === "knowledge" && typeof article.domainSlug !== "string") throw new Error(`知识文章缺少专题：${article.id}`);
  return {
    id: article.id,
    catalogId: article.catalogId,
    kind: article.kind,
    title: article.title,
    summary: article.summary,
    ...(typeof article.domainSlug === "string" ? { domainSlug: article.domainSlug } : {}),
    slug: article.slug,
    estimatedMinutes: article.estimatedMinutes,
    href: article.href,
  };
}

export const publishedArticles: readonly CatalogArticle[] = publicMetadata.articles.map(toCatalogArticle);
const articlesByCatalogId = new Map<string, CatalogArticle>();
for (const article of publishedArticles) {
  if (articlesByCatalogId.has(article.catalogId)) throw new Error(`目录文章重复：${article.catalogId}`);
  articlesByCatalogId.set(article.catalogId, article);
}

export const knowledgeTopics = catalogSource.knowledge;
export const exerciseTopics = catalogSource.practice.map((topic) => {
  const published = publicMetadata.exercises.find((exercise) => exercise.id === topic.id);
  return { ...topic, title: published?.title ?? topic.title };
});
export const aiTopics = catalogSource.ai;

export const aiCategories = [
  { id: "foundation", title: "基础概念", ids: ["AI01", "AI04"] },
  { id: "workflow", title: "交付任务与协作流程", ids: ["AI02", "AI03", "AI05", "AI07", "AI08", "AI11"] },
  { id: "review", title: "审阅与验证", ids: ["AI09", "AI10", "AI16"] },
  { id: "boundaries", title: "约束与权限", ids: ["AI06", "AI15"] },
  { id: "tools", title: "工具与工作流演进", ids: ["AI12", "AI17", "AI19", "AI20"] },
  { id: "application", title: "应用工程与取舍", ids: ["AI13", "AI14", "AI18"] },
] as const;

export function findCatalogArticle(id: string): CatalogArticle | undefined {
  return articlesByCatalogId.get(id);
}

export function topicDepth(id: string): string {
  const order = Number(id.split("-")[1]);
  return order <= 2 ? "核心" : order <= 6 ? "进阶" : "拓展";
}
