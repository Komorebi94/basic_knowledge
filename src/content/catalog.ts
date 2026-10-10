import catalogSource from "./catalog.json";
import { articles } from "./articles";

export const knowledgeTopics = catalogSource.knowledge;
export const exerciseTopics = catalogSource.practice;
export const aiTopics = catalogSource.ai;

export const aiCategories = [
  { id: "foundation", title: "基础概念", ids: ["AI01", "AI04"] },
  { id: "workflow", title: "交付任务与协作流程", ids: ["AI02", "AI03", "AI05", "AI07", "AI08", "AI11"] },
  { id: "review", title: "审阅与验证", ids: ["AI09", "AI10", "AI16"] },
  { id: "boundaries", title: "约束与权限", ids: ["AI06", "AI15"] },
  { id: "tools", title: "工具与工作流演进", ids: ["AI12", "AI17", "AI19", "AI20"] },
  { id: "application", title: "应用工程与取舍", ids: ["AI13", "AI14", "AI18"] },
] as const;

export function findCatalogArticle(id: string) {
  return articles.find((article) => (article.catalogId ?? article.id) === id);
}

export function topicDepth(id: string): string {
  const order = Number(id.split("-")[1]);
  return order <= 2 ? "核心" : order <= 6 ? "进阶" : "拓展";
}
