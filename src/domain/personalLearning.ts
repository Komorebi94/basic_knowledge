export interface Preferences {
  dailyLimit: 10 | 20 | 30;
  studyTimezone: string;
  bodySize: "normal" | "large";
  runShortcut: boolean;
  lastExportAt: string | null;
}
export interface ReadingProgress {
  contentId: string;
  status: "in-progress" | "read";
  headingId: string | null;
  scrollOffset: number;
  updatedAt: string;
}
export interface Bookmark { contentId: string; titleSnapshot: string; createdAt: string }
export interface WeakMarker { contentId: string; reasonText: string; createdAt: string }
export interface PersonalLearningState {
  preferences: Preferences;
  readings: Record<string, ReadingProgress>;
  bookmarks: Record<string, Bookmark>;
  weakMarkers: Record<string, WeakMarker>;
}
export function emptyPersonalLearningState(): PersonalLearningState {
  return { preferences: { dailyLimit: 20, studyTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai", bodySize: "normal", runShortcut: false, lastExportAt: null }, readings: {}, bookmarks: {}, weakMarkers: {} };
}
export function validTimezone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(); return true; } catch { return false; }
}
export function validInstant(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
export function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validId(value: unknown): value is string { return typeof value === "string" && value.length > 0 && value.length <= 200 && !["__proto__", "prototype", "constructor"].includes(value); }
export function isPersonalLearningState(value: unknown): value is PersonalLearningState {
  if (!object(value) || !object(value.preferences)) return false;
  const p = value.preferences;
  if (![10,20,30].includes(Number(p.dailyLimit)) || typeof p.dailyLimit !== "number" || !validTimezone(p.studyTimezone) || typeof p.bodySize !== "string" || !["normal","large"].includes(p.bodySize) || typeof p.runShortcut !== "boolean" || !(p.lastExportAt === null || validInstant(p.lastExportAt))) return false;
  if (!object(value.readings) || !object(value.bookmarks) || !object(value.weakMarkers)) return false;
  if ([value.readings, value.bookmarks, value.weakMarkers].some((entries) => Object.keys(entries).length > 20_000)) return false;
  return Object.entries(value.readings).every(([id,r]) => validId(id) && object(r) && r.contentId === id && typeof r.status === "string" && ["in-progress","read"].includes(r.status) && (r.headingId === null || (typeof r.headingId === "string" && r.headingId.length <= 200)) && typeof r.scrollOffset === "number" && Number.isFinite(r.scrollOffset) && r.scrollOffset >= 0 && r.scrollOffset <= 100_000_000 && validInstant(r.updatedAt))
    && Object.entries(value.bookmarks).every(([id,b]) => validId(id) && object(b) && b.contentId === id && typeof b.titleSnapshot === "string" && b.titleSnapshot.length <= 200 && validInstant(b.createdAt))
    && Object.entries(value.weakMarkers).every(([id,w]) => validId(id) && object(w) && w.contentId === id && typeof w.reasonText === "string" && w.reasonText.length <= 2000 && validInstant(w.createdAt));
}
export function toggleBookmark(state: PersonalLearningState, contentId: string, title: string, now = new Date().toISOString()): PersonalLearningState {
  const bookmarks = { ...state.bookmarks };
  if (Object.hasOwn(bookmarks, contentId)) delete bookmarks[contentId];
  else bookmarks[contentId] = { contentId, titleSnapshot: title, createdAt: now };
  return { ...state, bookmarks };
}
export function toggleWeakMarker(state: PersonalLearningState, contentId: string, now = new Date().toISOString()): PersonalLearningState {
  const weakMarkers = { ...state.weakMarkers };
  if (Object.hasOwn(weakMarkers, contentId)) delete weakMarkers[contentId];
  else weakMarkers[contentId] = { contentId, reasonText: "手动加入补强", createdAt: now };
  return { ...state, weakMarkers };
}
export function recordReading(state: PersonalLearningState, contentId: string, update: Partial<Pick<ReadingProgress,"status"|"headingId"|"scrollOffset">>, now = new Date().toISOString()): PersonalLearningState {
  const previous = state.readings[contentId];
  return { ...state, readings: { ...state.readings, [contentId]: { contentId, status: previous?.status ?? "in-progress", headingId: previous?.headingId ?? null, scrollOffset: previous?.scrollOffset ?? 0, ...update, updatedAt: now } } };
}
export function normalizePersonalLearningState(state: PersonalLearningState): PersonalLearningState {
  const p = state.preferences;
  return {
    preferences: { dailyLimit:p.dailyLimit, studyTimezone:p.studyTimezone, bodySize:p.bodySize, runShortcut:p.runShortcut, lastExportAt:p.lastExportAt },
    readings: Object.fromEntries(Object.entries(state.readings).map(([id,r]) => [id,{ contentId:r.contentId,status:r.status,headingId:r.headingId,scrollOffset:r.scrollOffset,updatedAt:r.updatedAt }])),
    bookmarks: Object.fromEntries(Object.entries(state.bookmarks).map(([id,b]) => [id,{ contentId:b.contentId,titleSnapshot:b.titleSnapshot,createdAt:b.createdAt }])),
    weakMarkers: Object.fromEntries(Object.entries(state.weakMarkers).map(([id,w]) => [id,{ contentId:w.contentId,reasonText:w.reasonText,createdAt:w.createdAt }])),
  };
}
