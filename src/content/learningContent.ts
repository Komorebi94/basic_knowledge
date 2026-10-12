import publicMetadata from "./publicMetadata.json";
import { knowledgeTopics, aiTopics } from "./catalog";
import exercises from "./exerciseMetadata.json";
import existingCards from "./existing-cards.json";
import knowledgeCards from "./knowledge/p0-cards.json";
import browserCards from "./knowledge/browser-p1-cards.json";
import typescriptCards from "./knowledge/typescript-p1-cards.json";
import htmlCssCards from "./knowledge/html-css-p1-cards.json";
import networkingReactCards from "./knowledge/networking-react-p1-cards.json";
import aiCards from "./ai/p0-cards.json";
import p1RetrievalStream from "./ai/p1-retrieval-stream.json";
import p1CollaborationCost from "./ai/p1-collaboration-cost.json";
import caseSource from "./ai/p0-cases.json";

export interface RecallCard {
  readonly cardId: string;
  readonly catalogId: string;
  readonly sourceContentId: string;
  readonly sourceRevision: number;
  readonly cardRevision: number;
  readonly question: string;
  readonly answerPoints: readonly string[];
  readonly pitfalls: readonly string[];
  readonly sourceHeadingId: string;
  readonly order: number;
}

export interface ReviewCase {
  readonly catalogId: string;
  readonly title: string;
  readonly brief: string;
  readonly excerpt: string;
  readonly questions: readonly string[];
  readonly findings: readonly string[];
  readonly rubric: readonly string[];
}

export const reviewCases: readonly ReviewCase[] = caseSource;

const cardCounts = new Map<string, number>();
export const recallCards: readonly RecallCard[] = [...existingCards, ...knowledgeCards, ...browserCards, ...typescriptCards, ...htmlCssCards, ...networkingReactCards, ...aiCards, ...p1RetrievalStream.cards, ...p1CollaborationCost.cards].map((card) => {
  const article = publicMetadata.articles.find((item) => (item.catalogId ?? item.id) === card.catalogId);
  if (!article) throw new Error(`回忆卡片没有对应文章：${card.catalogId}`);
  const order = (cardCounts.get(card.catalogId) ?? 0) + 1;
  cardCounts.set(card.catalogId, order);
  return {
    ...card,
    cardId: `${card.catalogId}:recall:${order}`,
    sourceContentId: article.id,
    sourceRevision: 1,
    cardRevision: 1,
    order,
  };
});

export const p0KnowledgeIds = knowledgeTopics.filter((topic) => /-0[12]$/.test(topic.id)).map((topic) => topic.id);
export const p0AiIds = aiTopics.filter((topic) => !["AI13", "AI14", "AI17", "AI18"].includes(topic.id)).map((topic) => topic.id);
export const p1AiIds = aiTopics.filter((topic) => !p0AiIds.includes(topic.id)).map((topic) => topic.id);

export function cardsForContent(contentId: string): readonly RecallCard[] {
  return recallCards.filter((card) => card.sourceContentId === contentId);
}

export function exercisesForContent(catalogId: string) {
  return exercises.filter((exercise) => exercise.knowledgeIds.includes(catalogId));
}
