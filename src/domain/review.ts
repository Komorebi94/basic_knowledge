import type { RecallCard } from "../content/learningContent";

export type ReviewRating = "forgotten" | "unstable" | "remembered" | "fluent";
export interface CardProgress {
  cardId: string;
  cardRevision: number;
  subscribedAt: string;
  stage: number;
  lastRating: ReviewRating | null;
  lastReviewedAt: string | null;
  intervalDays: number | null;
  dueDate: string | null;
  paused: boolean;
  revision: number;
  lastEventId: string | null;
}
export interface ReviewEvent {
  eventId: string;
  sessionId: string;
  cardId: string;
  cardRevision: number;
  rating: ReviewRating;
  before: CardProgress;
  after: CardProgress;
  occurredAt: string;
  timezone: string;
  algorithmVersion: "fixed-v1";
  revertedAt: string | null;
  firstRating: boolean;
  appliedProgressRevision: number;
}
export interface ReviewSession {
  sessionId: string;
  cardsSnapshot: RecallCard[];
  cursor: number;
  status: "active" | "completed" | "ended";
  startedAt: string;
  finishedAt: string | null;
  timezone: string;
  sessionDate: string;
  mode: "daily" | "extra";
  answerDraft: string;
  answerRevealed: boolean;
  revision: number;
  eventIds: string[];
}
export interface ReviewState {
  progress: Record<string, CardProgress>;
  events: ReviewEvent[];
  sessions: Record<string, ReviewSession>;
  activeSessionId: string | null;
  latestSessionId: string | null;
}
export interface ReviewPreferences { dailyLimit: 10 | 20 | 30; studyTimezone: string }
export class ReviewConflictError extends Error {
  constructor(message = "这次复习已在另一页面更新，请刷新后继续") { super(message); this.name = "ReviewConflictError"; }
}
const intervals = [0, 1, 3, 7, 14, 30, 60] as const;
const ratingOrder: Record<ReviewRating, number> = { forgotten: 0, unstable: 1, remembered: 2, fluent: 3 };
export const ratingLabels: Record<ReviewRating, string> = { forgotten: "忘记了", unstable: "不太稳", remembered: "记住了", fluent: "很熟悉" };
export function emptyReviewState(): ReviewState {
  return { progress: {}, events: [], sessions: {}, activeSessionId: null, latestSessionId: null };
}
export function isStudyTimezone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(); return true; } catch { return false; }
}
export function studyDate(now: string, timezone: string): string {
  if (!validInstant(now) || !isStudyTimezone(timezone)) throw new Error("复习时间或学习时区无效");
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(now));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function addCalendarDays(date: string, days: number): string {
  if (!validDate(date) || !Number.isSafeInteger(days) || days < 0 || days > 60) throw new Error("复习日期或间隔无效");
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function nextSchedule(stage: number, rating: ReviewRating): { stage: number; intervalDays: number } {
  if (!Number.isInteger(stage) || stage < 0 || stage > 6 || !Object.hasOwn(ratingOrder, rating)) throw new Error("复习评分无效");
  const next = rating === "forgotten" ? 0 : rating === "unstable" ? Math.max(0, stage - 1) : Math.min(6, stage + (rating === "fluent" ? 2 : 1));
  return { stage: next, intervalDays: rating === "forgotten" || rating === "unstable" ? 1 : intervals[next] ?? 1 };
}
function newProgress(card: RecallCard, now: string): CardProgress {
  return { cardId: card.cardId, cardRevision: card.cardRevision, subscribedAt: now, stage: 0, lastRating: null, lastReviewedAt: null, intervalDays: null, dueDate: null, paused: false, revision: 1, lastEventId: null };
}
export function subscribeContent(state: ReviewState, cards: readonly RecallCard[], now: string): ReviewState {
  if (!validInstant(now)) throw new Error("订阅时间无效");
  let next = synchronizeCards(state, cards);
  const progress = { ...next.progress };
  for (const card of cards) {
    const current = progress[card.cardId];
    progress[card.cardId] = current ? { ...current, paused: false, revision: current.revision + 1 } : newProgress(card, now);
  }
  next = { ...next, progress };
  return next;
}
export function pauseContent(state: ReviewState, cards: readonly RecallCard[], paused: boolean): ReviewState {
  const progress = { ...state.progress };
  for (const card of cards) {
    const current = progress[card.cardId];
    if (current) progress[card.cardId] = { ...current, paused, revision: current.revision + 1 };
  }
  return { ...state, progress };
}
export function synchronizeCards(state: ReviewState, cards: readonly RecallCard[]): ReviewState {
  const active = state.activeSessionId ? state.sessions[state.activeSessionId] : undefined;
  const held = new Set(active?.cardsSnapshot.map((card) => card.cardId) ?? []);
  const progress = { ...state.progress };
  let changed = false;
  for (const card of cards) {
    const current = progress[card.cardId];
    if (current && current.cardRevision !== card.cardRevision && !held.has(card.cardId)) {
      progress[card.cardId] = { ...newProgress(card, current.subscribedAt), paused: current.paused, revision: current.revision + 1, lastEventId: current.lastEventId };
      changed = true;
    }
  }
  return changed ? { ...state, progress } : state;
}
export function changeReviewTimezone(state: ReviewState, timezone: string): ReviewState {
  if (!isStudyTimezone(timezone)) throw new Error("学习时区无效");
  return { ...state, progress: Object.fromEntries(Object.entries(state.progress).map(([id, progress]) => [id, {
    ...progress,
    dueDate: progress.lastReviewedAt && progress.intervalDays !== null ? addCalendarDays(studyDate(progress.lastReviewedAt, timezone), progress.intervalDays) : null,
    revision: progress.revision + 1,
  }])) };
}
function todayEvents(state: ReviewState, preferences: ReviewPreferences, now: string) {
  const today = studyDate(now, preferences.studyTimezone);
  return state.events.filter((event) => event.revertedAt === null && studyDate(event.occurredAt, preferences.studyTimezone) === today);
}
export function selectReviewCards(state: ReviewState, cards: readonly RecallCard[], preferences: ReviewPreferences, now: string, extra = false): RecallCard[] {
  const today = studyDate(now, preferences.studyTimezone);
  const events = todayEvents(state, preferences, now);
  const completed = new Set(events.map((event) => event.cardId));
  const first = new Set(events.filter((event) => event.firstRating).map((event) => `${event.cardId}:${event.cardRevision}`));
  const remaining = extra ? 10 : Math.max(0, preferences.dailyLimit - completed.size);
  const available = cards.filter((card) => {
    const progress = state.progress[card.cardId];
    return progress && !progress.paused && progress.cardRevision === card.cardRevision && !completed.has(card.cardId);
  });
  const due = available.filter((card) => {
    const date = state.progress[card.cardId]?.dueDate;
    return date !== null && date !== undefined && date <= today;
  }).sort((a, b) => {
    const x = state.progress[a.cardId]; const y = state.progress[b.cardId];
    if (!x || !y) return 0;
    return (x.dueDate ?? "").localeCompare(y.dueDate ?? "") || ratingOrder[x.lastRating ?? "forgotten"] - ratingOrder[y.lastRating ?? "forgotten"] || a.cardId.localeCompare(b.cardId);
  });
  const courseOrder = new Map(cards.map((card, index) => [card.cardId, index]));
  const fresh = available.filter((card) => state.progress[card.cardId]?.lastReviewedAt === null).sort((a, b) => {
    return (state.progress[a.cardId]?.subscribedAt ?? "").localeCompare(state.progress[b.cardId]?.subscribedAt ?? "") || (courseOrder.get(a.cardId) ?? 0) - (courseOrder.get(b.cardId) ?? 0) || a.order - b.order || a.cardId.localeCompare(b.cardId);
  });
  const newCount = extra ? 0 : Math.min(Math.max(0, 5 - first.size), fresh.length, remaining);
  return [...due.slice(0, remaining - newCount), ...fresh.slice(0, newCount)].map(copyCard);
}
function copyCard(card: RecallCard): RecallCard { return { ...card, answerPoints: [...card.answerPoints], pitfalls: [...card.pitfalls] }; }
export function getReviewSummary(state: ReviewState, cards: readonly RecallCard[], preferences: ReviewPreferences, now: string) {
  const today = studyDate(now, preferences.studyTimezone);
  const events = todayEvents(state, preferences, now);
  const todayCompleted = new Set(events.map((event) => event.cardId)).size;
  const active = state.activeSessionId ? state.sessions[state.activeSessionId] : undefined;
  return {
    today, todayCompleted, remaining: Math.max(0, preferences.dailyLimit - todayCompleted),
    newRemaining: Math.max(0, 5 - new Set(events.filter((event) => event.firstRating).map((event) => `${event.cardId}:${event.cardRevision}`)).size),
    dueCount: cards.filter((card) => { const progress = state.progress[card.cardId]; return progress && !progress.paused && progress.dueDate !== null && progress.dueDate <= today; }).length,
    subscribedCount: Object.values(state.progress).filter((item) => !item.paused).length,
    pausedCount: Object.values(state.progress).filter((item) => item.paused).length,
    weakCount: Object.values(state.progress).filter((item) => item.lastRating === "forgotten" || item.lastRating === "unstable").length,
    activeSessionId: state.activeSessionId, activeRemaining: active ? active.cardsSnapshot.length - active.cursor : 0,
    candidateCount: selectReviewCards(state, cards, preferences, now).length,
  };
}
export function startReviewSession(state: ReviewState, cards: readonly RecallCard[], preferences: ReviewPreferences, now: string, sessionId: string, mode: "daily" | "extra" = "daily", chosenIds: readonly string[] = []): ReviewState {
  if (state.activeSessionId) return state;
  const synced = synchronizeCards(state, cards);
  if (!nonempty(sessionId)) throw new Error("会话编号无效");
  if (synced.sessions[sessionId]) throw new ReviewConflictError("会话编号已存在");
  let selected = selectReviewCards(synced, cards, preferences, now, mode === "extra");
  if (mode === "extra" && chosenIds.length) {
    const ids = new Set(chosenIds);
    selected = cards.filter((card) => ids.has(card.cardId)).slice(0, 10).map(copyCard);
  }
  if (!selected.length) throw new Error(mode === "extra" ? "没有其他到期卡片，可以在卡片列表主动选择额外回顾" : "今日没有可选卡片，可先在文章加入复习");
  const session: ReviewSession = { sessionId, cardsSnapshot: selected, cursor: 0, status: "active", startedAt: now, finishedAt: null, timezone: preferences.studyTimezone, sessionDate: studyDate(now, preferences.studyTimezone), mode, answerDraft: "", answerRevealed: false, revision: 1, eventIds: [] };
  return { ...synced, sessions: { ...synced.sessions, [sessionId]: session }, activeSessionId: sessionId, latestSessionId: sessionId };
}
function activeSession(state: ReviewState, id: string, expectedRevision: number): ReviewSession {
  const session = state.sessions[id];
  if (!session || session.status !== "active" || state.activeSessionId !== id || session.revision !== expectedRevision) throw new ReviewConflictError();
  return session;
}
export function saveReviewAnswer(state: ReviewState, id: string, expectedRevision: number, draft: string, revealed: boolean): ReviewState {
  const session = activeSession(state, id, expectedRevision);
  if (draft.length > 20_000) throw new Error("回答超过 20,000 字符，请先复制保存");
  return { ...state, sessions: { ...state.sessions, [id]: { ...session, answerDraft: draft, answerRevealed: revealed, revision: session.revision + 1 } } };
}
export function rateReviewCard(state: ReviewState, sessionId: string, expectedRevision: number, rating: ReviewRating, eventId: string, now: string, cards: readonly RecallCard[], timezone: string): ReviewState {
  if (!nonempty(eventId) || !validInstant(now)) throw new Error("评分编号或时间无效");
  const existing = state.events.find((event) => event.eventId === eventId);
  if (existing) {
    if (existing.sessionId !== sessionId || existing.rating !== rating || existing.revertedAt !== null) throw new ReviewConflictError();
    return state;
  }
  const session = activeSession(state, sessionId, expectedRevision);
  if (!session.answerRevealed) throw new Error("请先回忆并展开参考要点，再选择评分");
  const card = session.cardsSnapshot[session.cursor];
  if (!card) throw new ReviewConflictError();
  const before = state.progress[card.cardId] ?? newProgress(card, now);
  if (before.cardRevision !== card.cardRevision) throw new ReviewConflictError("卡片版本已改变，请重新开始复习");
  const schedule = nextSchedule(before.stage, rating);
  const after: CardProgress = { ...before, ...schedule, dueDate: addCalendarDays(studyDate(now, timezone), schedule.intervalDays), lastRating: rating, lastReviewedAt: now, paused: false, revision: before.revision + 1, lastEventId: eventId };
  const event: ReviewEvent = { eventId, sessionId, cardId: card.cardId, cardRevision: card.cardRevision, rating, before: { ...before }, after, occurredAt: now, timezone, algorithmVersion: "fixed-v1", revertedAt: null, firstRating: !state.events.some((item) => item.cardId === card.cardId && item.cardRevision === card.cardRevision && item.revertedAt === null), appliedProgressRevision: after.revision };
  const cursor = session.cursor + 1;
  const completed = cursor === session.cardsSnapshot.length;
  let next: ReviewState = { ...state, progress: { ...state.progress, [card.cardId]: after }, events: [...state.events, event], sessions: { ...state.sessions, [sessionId]: { ...session, cursor, status: completed ? "completed" : "active", finishedAt: completed ? now : null, answerDraft: "", answerRevealed: false, revision: session.revision + 1, eventIds: [...session.eventIds, eventId] } }, activeSessionId: completed ? null : sessionId };
  if (completed) {
    next = synchronizeCards(next, cards);
    const applied = next.progress[card.cardId]?.revision ?? after.revision;
    next = { ...next, events: next.events.map((item) => item.eventId === eventId ? { ...item, appliedProgressRevision: applied } : item) };
  }
  return next;
}
export function undoLastReview(state: ReviewState, sessionId: string, expectedRevision: number, now: string): ReviewState {
  const session = state.sessions[sessionId];
  if (!session || session.revision !== expectedRevision || session.status === "ended" || (state.activeSessionId !== null && state.activeSessionId !== sessionId)) throw new ReviewConflictError();
  const id = session.eventIds.at(-1);
  const event = state.events.find((item) => item.eventId === id && item.revertedAt === null);
  if (!event || session.cursor === 0) throw new Error("当前会话没有可撤销的评分");
  const current = state.progress[event.cardId];
  if (!current || current.lastEventId !== event.eventId || current.revision !== event.appliedProgressRevision) throw new ReviewConflictError("这张卡已在另一页面更新，无法直接撤销，请刷新");
  return { ...state, progress: { ...state.progress, [event.cardId]: { ...event.before, revision: current.revision + 1 } }, events: state.events.map((item) => item.eventId === id ? { ...item, revertedAt: now } : item), sessions: { ...state.sessions, [sessionId]: { ...session, cursor: session.cursor - 1, status: "active", finishedAt: null, revision: session.revision + 1, eventIds: session.eventIds.slice(0, -1), answerDraft: "", answerRevealed: false } }, activeSessionId: sessionId, latestSessionId: sessionId };
}
export function endReviewSession(state: ReviewState, sessionId: string, expectedRevision: number, now: string, cards: readonly RecallCard[]): ReviewState {
  const session = activeSession(state, sessionId, expectedRevision);
  return synchronizeCards({ ...state, sessions: { ...state.sessions, [sessionId]: { ...session, status: "ended", finishedAt: now, revision: session.revision + 1 } }, activeSessionId: null }, cards);
}
export function progressLabel(progress: CardProgress | undefined): string {
  if (!progress || progress.lastRating === null) return "新卡";
  if (progress.lastRating === "forgotten" || progress.lastRating === "unstable") return "待补强";
  return progress.stage >= 4 ? "较熟悉" : "巩固中";
}
function object(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function nonempty(value: unknown): value is string { return typeof value === "string" && value.length > 0 && value.length <= 200 && !["__proto__", "constructor", "prototype"].includes(value); }
function positive(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function validInstant(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value; }
function validDate(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value; }
function isRating(value: unknown): value is ReviewRating { return value === "forgotten" || value === "unstable" || value === "remembered" || value === "fluent"; }
function isProgress(value: unknown): value is CardProgress {
  if (!object(value) || !nonempty(value.cardId) || !positive(value.cardRevision) || !validInstant(value.subscribedAt) || !Number.isInteger(value.stage) || Number(value.stage) < 0 || Number(value.stage) > 6 || typeof value.paused !== "boolean" || !positive(value.revision) || !(value.lastEventId === null || nonempty(value.lastEventId))) return false;
  if (value.lastRating === null) return value.lastReviewedAt === null && value.intervalDays === null && value.dueDate === null && value.stage === 0;
  return isRating(value.lastRating) && validInstant(value.lastReviewedAt) && [1, 3, 7, 14, 30, 60].includes(Number(value.intervalDays)) && typeof value.intervalDays === "number" && validDate(value.dueDate);
}
function isCard(value: unknown): value is RecallCard {
  return object(value) && nonempty(value.cardId) && nonempty(value.catalogId) && nonempty(value.sourceContentId) && nonempty(value.sourceHeadingId) && positive(value.sourceRevision) && positive(value.cardRevision) && positive(value.order) && typeof value.question === "string" && value.question.length > 0 && value.question.length <= 20_000 && Array.isArray(value.answerPoints) && value.answerPoints.length > 0 && Array.from(value.answerPoints).every((line) => typeof line === "string" && line.length <= 20_000) && Array.isArray(value.pitfalls) && Array.from(value.pitfalls).every((line) => typeof line === "string" && line.length <= 20_000);
}
function isSession(value: unknown): value is ReviewSession {
  return object(value) && nonempty(value.sessionId) && Array.isArray(value.cardsSnapshot) && value.cardsSnapshot.length > 0 && value.cardsSnapshot.length <= 30 && Array.from(value.cardsSnapshot).every(isCard) && new Set(value.cardsSnapshot.map((card) => card.cardId)).size === value.cardsSnapshot.length && Number.isInteger(value.cursor) && Number(value.cursor) >= 0 && Number(value.cursor) <= value.cardsSnapshot.length && typeof value.status === "string" && ["active", "completed", "ended"].includes(value.status) && (value.status !== "active" || Number(value.cursor) < value.cardsSnapshot.length) && (value.status !== "completed" || value.cursor === value.cardsSnapshot.length) && validInstant(value.startedAt) && (value.status === "active" ? value.finishedAt === null : validInstant(value.finishedAt)) && isStudyTimezone(value.timezone) && validDate(value.sessionDate) && (value.mode === "daily" || value.mode === "extra") && (value.mode !== "extra" || value.cardsSnapshot.length <= 10) && typeof value.answerDraft === "string" && value.answerDraft.length <= 20_000 && typeof value.answerRevealed === "boolean" && positive(value.revision) && Array.isArray(value.eventIds) && Array.from(value.eventIds).every(nonempty) && value.eventIds.length === value.cursor;
}
function isEvent(value: unknown): value is ReviewEvent {
  if (!(object(value) && nonempty(value.eventId) && nonempty(value.sessionId) && nonempty(value.cardId) && positive(value.cardRevision) && isRating(value.rating) && isProgress(value.before) && isProgress(value.after) && value.before.cardId === value.cardId && value.after.cardId === value.cardId && value.before.cardRevision === value.cardRevision && value.after.cardRevision === value.cardRevision && value.after.lastEventId === value.eventId && validInstant(value.occurredAt) && isStudyTimezone(value.timezone) && value.algorithmVersion === "fixed-v1" && (value.revertedAt === null || validInstant(value.revertedAt)) && typeof value.firstRating === "boolean" && positive(value.appliedProgressRevision))) return false;
  try {
    const schedule = nextSchedule(value.before.stage, value.rating);
    return value.after.stage === schedule.stage && value.after.intervalDays === schedule.intervalDays && value.after.lastRating === value.rating && value.after.lastReviewedAt === value.occurredAt && value.after.revision === value.before.revision + 1 && value.after.dueDate === addCalendarDays(studyDate(value.occurredAt, value.timezone), schedule.intervalDays);
  } catch { return false; }
}
export function isReviewState(value: unknown): value is ReviewState {
  if (!object(value) || !object(value.progress) || !object(value.sessions) || !Array.isArray(value.events)) return false;
  if (Object.keys(value.progress).length > 100_000 || Object.keys(value.sessions).length > 100_000 || value.events.length > 100_000) return false;
  if (!Object.entries(value.progress).every(([id, item]) => isProgress(item) && id === item.cardId) || !Object.entries(value.sessions).every(([id, item]) => isSession(item) && id === item.sessionId) || !Array.from(value.events).every(isEvent)) return false;
  // Every record was validated above; retain its validated types for reference checks.
  const sessions = value.sessions as Record<string, ReviewSession>; const events = value.events as ReviewEvent[]; const progress = value.progress;
  const eventById = new Map(events.map((event) => [event.eventId, event]));
  if (new Set(events.map((event) => event.eventId)).size !== events.length || !(value.activeSessionId === null || nonempty(value.activeSessionId)) || !(value.latestSessionId === null || nonempty(value.latestSessionId))) return false;
  const active = Object.values(sessions).filter((session) => isSession(session) && session.status === "active");
  if (active.length !== (value.activeSessionId === null ? 0 : 1) || (value.activeSessionId !== null && sessions[value.activeSessionId]?.status !== "active")) return false;
  if (value.latestSessionId !== null && !isSession(sessions[value.latestSessionId])) return false;
  return events.every((event) => Object.hasOwn(progress, event.cardId) && sessions[event.sessionId]?.cardsSnapshot.some((card) => card.cardId === event.cardId && card.cardRevision === event.cardRevision) === true && (event.revertedAt !== null || sessions[event.sessionId]?.eventIds.includes(event.eventId) === true)) && Object.values(sessions).every((session) => isSession(session) && session.eventIds.every((id, index) => {
    const event = eventById.get(id);
    return event && event.revertedAt === null && event.sessionId === session.sessionId && event.cardId === session.cardsSnapshot[index]?.cardId;
  })) && Object.values(value.progress).every((item) => isProgress(item) && (item.lastEventId === null || eventById.has(item.lastEventId))) && Object.values(progress).every((item) => {
    if (!isProgress(item)) return false;
    if (item.lastRating === null) return true;
    const event = item.lastEventId ? eventById.get(item.lastEventId) : undefined;
    return event !== undefined && event.revertedAt === null && event.cardId === item.cardId && event.cardRevision === item.cardRevision && event.rating === item.lastRating && event.occurredAt === item.lastReviewedAt && event.after.stage === item.stage && event.after.intervalDays === item.intervalDays;
  });
}

function normalizeProgress(progress: CardProgress): CardProgress {
  const { cardId, cardRevision, subscribedAt, stage, lastRating, lastReviewedAt, intervalDays, dueDate, paused, revision, lastEventId } = progress;
  return { cardId, cardRevision, subscribedAt, stage, lastRating, lastReviewedAt, intervalDays, dueDate, paused, revision, lastEventId };
}
function normalizeCard(card: RecallCard): RecallCard {
  const { cardId, catalogId, sourceContentId, sourceRevision, cardRevision, question, answerPoints, pitfalls, sourceHeadingId, order } = card;
  return { cardId, catalogId, sourceContentId, sourceRevision, cardRevision, question, answerPoints: [...answerPoints], pitfalls: [...pitfalls], sourceHeadingId, order };
}
export function normalizeReviewState(state: ReviewState): ReviewState {
  return {
    progress: Object.fromEntries(Object.entries(state.progress).map(([id, progress]) => [id, normalizeProgress(progress)])),
    events: state.events.map((event) => {
      const { eventId, sessionId, cardId, cardRevision, rating, occurredAt, timezone, algorithmVersion, revertedAt, firstRating, appliedProgressRevision } = event;
      return { eventId, sessionId, cardId, cardRevision, rating, occurredAt, timezone, algorithmVersion, revertedAt, firstRating, appliedProgressRevision, before: normalizeProgress(event.before), after: normalizeProgress(event.after) };
    }),
    sessions: Object.fromEntries(Object.entries(state.sessions).map(([id, session]) => {
      const { sessionId, cursor, status, startedAt, finishedAt, timezone, sessionDate, mode, answerDraft, answerRevealed, revision } = session;
      return [id, { sessionId, cursor, status, startedAt, finishedAt, timezone, sessionDate, mode, answerDraft, answerRevealed, revision, cardsSnapshot: session.cardsSnapshot.map(normalizeCard), eventIds: [...session.eventIds] }];
    })),
    activeSessionId: state.activeSessionId, latestSessionId: state.latestSessionId,
  };
}
