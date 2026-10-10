import { studyDate, type ReviewEvent } from "./review";
export function weeklyReviewStats(events: readonly ReviewEvent[], timezone: string, now: string) {
  const today = studyDate(now, timezone);
  const monday = new Date(`${today}T00:00:00.000Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const startDate = monday.toISOString().slice(0,10);
  const ratings = events.filter((event) => !event.revertedAt && event.occurredAt <= now && studyDate(event.occurredAt,timezone) >= startDate && studyDate(event.occurredAt,timezone) <= today);
  return { startDate,events:ratings.length,cards:new Set(ratings.map((event) => event.cardId)).size };
}
