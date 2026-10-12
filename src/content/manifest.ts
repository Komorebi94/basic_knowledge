import { articles, articleHref } from "./articles";
import { recallCards, reviewCases, p1AiIds } from "./learningContent";
import exercises from "./exerciseMetadata.json";
import retrievalStreamEvidence from "./ai/p1-retrieval-stream.json";
import collaborationCostEvidence from "./ai/p1-collaboration-cost.json";

export interface PublishedContent {
  readonly id: string;
  readonly catalogId: string;
  readonly kind: "knowledge" | "exercise" | "ai-guide" | "ai-template" | "ai-case";
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly domainId: string;
  readonly depth: "core" | "advanced" | "extension";
  readonly tags: readonly string[];
  readonly aliases: readonly string[];
  readonly estimatedMinutes: number;
  readonly status: "published";
  readonly revision: number;
  readonly updatedAt: string;
  readonly verifiedAt: string;
  readonly freshnessClass: "stable" | "practice" | "tool";
  readonly applicableVersions: readonly string[];
  readonly prerequisites: readonly string[];
  readonly relatedIds: readonly string[];
  readonly sources: readonly {
    title: string;
    url: string;
    publisher: string;
    publishedAt: string | null;
    checkedAt: string;
    claimScope: string;
  }[];
  readonly changeSummary: string;
  readonly href: string;
}

const templateIds = new Set(["AI02", "AI07", "AI08", "AI09", "AI11"]);
const supplementalPrerequisites: Readonly<Record<string, readonly string[]>> = {
  "K03-03": ["K03-01", "K03-02"],
  "K03-04": ["K03-02", "K03-03"],
  "K03-05": ["K03-02", "K03-03"],
  "K03-06": ["K03-01", "K03-04"],
  "K03-07": ["K01-07", "K03-01", "K03-05"],
  "K03-08": ["K03-04", "K03-06"],
  "K04-03": ["K01-02", "K04-01"],
  "K04-04": ["K01-01", "K02-02"],
  "K04-05": ["K04-02"],
  "K04-06": ["K02-05", "K04-04"],
  "K04-07": ["K04-04", "K04-06"],
  "K04-08": ["K04-03", "K02-02"],
  "K05-03": ["K05-02"],
  "K05-04": ["K05-03"],
  "K05-05": ["K05-02"],
  "K05-06": ["K04-02", "K05-02"],
  "K05-07": ["K05-03"],
  "K05-08": ["K05-02", "K05-03"],
  "K06-03": ["K06-01"],
  "K06-04": ["K06-02"],
  "K06-05": ["K06-02"],
  "K06-06": ["K02-05", "K06-02"],
  "K06-07": ["K02-05", "K06-02"],
  "K06-08": ["K06-02"],
  "K07-03": ["K07-01"],
  "K07-04": ["K07-01", "K07-03"],
  "K07-05": ["K07-01", "K07-02"],
  "K07-06": ["K07-01", "K07-02"],
  "K07-07": ["K07-04"],
  "K07-08": ["K07-01", "K04-02"],
};
const practiceSource = {
  title: "ECMAScript 语言规范",
  url: "https://tc39.es/ecma262/",
  publisher: "TC39",
  publishedAt: null,
  checkedAt: "2026-10-08",
  claimScope: "Promise、迭代、对象及集合语义；题目特定的数据域以题面为准。",
};

// Publication metadata is derived from reviewed repository content, never from personal backups.
export const contentManifest: readonly PublishedContent[] = [
  ...articles.map((article): PublishedContent => {
    const catalogId = article.catalogId ?? article.id;
    const exerciseIds = exercises.filter((exercise) => exercise.knowledgeIds.includes(catalogId)).map((exercise) => exercise.id);
    const unit = Number(catalogId.split("-")[1]);
    const evidence = [...retrievalStreamEvidence.evidence, ...collaborationCostEvidence.evidence].find(item => item.catalogId === catalogId);
    return {
      id: article.id,
      catalogId,
      kind: article.kind === "knowledge" ? "knowledge" : reviewCases.some((item) => item.catalogId === catalogId) ? "ai-case" : templateIds.has(catalogId) ? "ai-template" : "ai-guide",
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      domainId: article.kind === "knowledge" ? catalogId.split("-")[0] ?? catalogId : "ai",
      depth: article.kind === "ai" ? p1AiIds.includes(catalogId) ? "advanced" : "core" : unit <= 2 ? "core" : unit <= 6 ? "advanced" : "extension",
      tags: article.tags,
      aliases: article.aliases,
      estimatedMinutes: article.estimatedMinutes,
      status: "published",
      revision: 1,
      updatedAt: supplementalPrerequisites[catalogId] ? "2026-10-12" : p1AiIds.includes(catalogId) ? "2026-10-09" : "2026-10-08",
      verifiedAt: article.verifiedAt,
      freshnessClass: article.kind === "ai" ? ["AI04", "AI12"].includes(catalogId) ? "tool" : "practice" : "stable",
      applicableVersions: /^K03-0[3-8]$/.test(catalogId) ? ["TypeScript 6.0.3；strict、noUncheckedIndexedAccess；可选属性和模块额外条件见正文"] : /^K05-0[3-8]$/.test(catalogId) ? ["现代浏览器空白页；几何结果以 Chrome 实测为准，容器查询、层叠层与 Popover 需要相应实现"] : /^K06-0[3-8]$/.test(catalogId) ? ["现代浏览器 Fetch、URL、Blob 与 AbortController；协议选择是教学清单，不是一次抓包"] : catalogId === "K07-07" ? ["客户端包 React 19.3.0；服务器组件边界按 React 19 文档；示例不执行服务器组件"] : /^K07-0[3-8]$/.test(catalogId) ? ["React 19.3.0 文档中的可观察行为；示例是教学模型，空白页不挂载 React"] : evidence?.applicableVersions ?? ["通用；具体运行环境与框架条件见正文示例"],
      prerequisites: supplementalPrerequisites[catalogId] ?? [],
      relatedIds: exerciseIds,
      sources: article.sources.map((source) => ({
        ...source,
        publisher: new URL(source.url).hostname,
        publishedAt: null,
        checkedAt: article.verifiedAt,
        claimScope: evidence?.sources.find(item => item.url === source.url)?.claimScope ?? "正文中相关机制与 API 的参考资料；独立示例输出由仓库验证脚本核对。",
      })),
      changeSummary: "补齐教程、回忆卡片和关联练习。",
      href: articleHref(article),
    };
  }),
  ...exercises.map((exercise): PublishedContent => ({
    id: exercise.id, catalogId: exercise.id, kind: "exercise", slug: exercise.slug,
    title: exercise.title, summary: exercise.summary, domainId: "practice", depth: "core",
    tags: ["JavaScript", "行为验证"], aliases: [], estimatedMinutes: exercise.estimatedMinutes,
    status: "published", revision: exercise.revision, updatedAt: exercise.updatedAt, verifiedAt: exercise.verifiedAt,
    freshnessClass: "stable", applicableVersions: ["现代 JavaScript；时间用例使用虚拟时钟"],
    prerequisites: exercise.knowledgeIds, relatedIds: exercise.knowledgeIds,
    sources: [practiceSource], changeSummary: "补齐题面、分层提示、参考解析及行为用例。",
    href: `/practice/${exercise.slug}`,
  })),
];

export const publishedCardCount = recallCards.length;
