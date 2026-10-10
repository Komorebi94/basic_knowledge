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
      updatedAt: p1AiIds.includes(catalogId) ? "2026-10-09" : "2026-10-08",
      verifiedAt: article.verifiedAt,
      freshnessClass: article.kind === "ai" ? ["AI04", "AI12"].includes(catalogId) ? "tool" : "practice" : "stable",
      applicableVersions: evidence?.applicableVersions ?? ["通用；具体运行环境与框架条件见正文示例"],
      prerequisites: [],
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
