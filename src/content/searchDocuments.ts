import { knowledgeDomains } from "../features/knowledge/catalog";
import type { SearchDocument } from "../infrastructure/search/search";
import { articles, articleHref } from "./articles";
import { aiTopics, exerciseTopics, findCatalogArticle, knowledgeTopics } from "./catalog";
import exercises from "./exerciseMetadata.json";

const domains: SearchDocument[] = knowledgeDomains.map((domain, order) => ({
  id: domain.id, type: "domain", title: domain.title, aliases: [], tags: [],
  headings: [], summary: domain.summary, body: "", importance: 1, order,
  href: `/knowledge/${domain.slug}`, availability: "catalog",
}));

const plannedKnowledge: SearchDocument[] = knowledgeTopics.filter((topic) => !findCatalogArticle(topic.id)).map((topic, order) => {
  const domain = knowledgeDomains.find((item) => item.id === topic.domainId);
  if (!domain) throw new Error(`知识目录缺少专题：${topic.domainId}`);
  return {
    id: topic.id, type: "knowledge", title: topic.title, aliases: [], tags: [domain.title],
    headings: [], summary: topic.summary, body: "", importance: 1, order,
    href: `/knowledge/${domain.slug}#${topic.id}`, availability: "catalog",
  };
});

const plannedAi: SearchDocument[] = aiTopics.filter((topic) => !findCatalogArticle(topic.id)).map((topic, order) => ({
  id: topic.id, type: "ai", title: topic.title, aliases: [], tags: ["AI 工程"],
  headings: [], summary: topic.summary, body: topic.deliverable, importance: 1, order,
  href: `/ai#${topic.id}`, availability: "catalog",
}));

const practices: SearchDocument[] = exerciseTopics.map((topic, order) => {
  const exercise = exercises.find((item) => item.id === topic.id);
  return {
    id: topic.id, type: "practice", title: topic.title, aliases: topic.aliases, tags: [topic.environment],
    headings: [], summary: topic.summary,
    body: [topic.boundaries, ...(exercise?.problem ?? []), exercise?.entryContract ?? ""].join(" "),
    importance: exercise ? 2 : 1, order,
    href: exercise ? `/practice/${exercise.slug}` : `/practice#${topic.id}`,
    availability: exercise ? "readable" : "catalog",
  };
});

const readable: SearchDocument[] = articles.map((article, order) => ({
  id: article.catalogId ?? article.id, type: article.kind, title: article.title,
  aliases: [...article.aliases, ...[...knowledgeTopics, ...aiTopics].filter((topic) => topic.id === (article.catalogId ?? article.id)).map((topic) => topic.title)], tags: article.tags,
  headings: article.sections.map((section) => section.title), summary: article.summary,
  body: article.sections.filter((section) => section.id !== "recall").flatMap((section) => [...section.paragraphs, ...(section.code ? [section.code] : []), ...(section.examples ?? []).flatMap((example) => [example.code, ...example.explanation]), ...(section.diagram?.lines ?? [])]).join(" "),
  importance: 2, order, href: articleHref(article), availability: "readable",
}));

export const publicSearchDocuments: readonly SearchDocument[] = [
  ...domains, ...plannedKnowledge, ...plannedAi, ...practices, ...readable,
];
