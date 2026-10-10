import { Link } from "react-router";
import publicMetadata from "../../content/publicMetadata.json";
import { useLearning } from "./useLearning";
import { getPracticeSummary } from "../../domain/practice";
import { weeklyReviewStats } from "../../domain/learningStats";
import { studyDate } from "../../domain/review";
export function HomeLearningSummary() {
  const { snapshot,error,reload } = useLearning();
  const personal = snapshot?.state.personal;
  const today = personal ? studyDate(new Date().toISOString(),personal.preferences.studyTimezone) : "";
  const read = Object.values(personal?.readings ?? {}).filter((r) => r.status === "read" && publicMetadata.articles.some((a) => a.id === r.contentId)).length;
  const practice = snapshot ? getPracticeSummary(snapshot.state.practice,Object.fromEntries(publicMetadata.exercises.map((e) => [e.id,e.revision]))) : null;
  const reviewed = new Set(snapshot?.state.review.events.filter((e) => !e.revertedAt && studyDate(e.occurredAt,personal?.preferences.studyTimezone ?? "Asia/Shanghai") === today).map((e) => e.cardId)).size;
  const week = snapshot ? weeklyReviewStats(snapshot.state.review.events,snapshot.state.personal.preferences.studyTimezone,new Date().toISOString()) : null;
  const recent = Object.values(personal?.readings ?? {}).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const content = publicMetadata.articles.find((a) => a.id === recent?.contentId);
  const session = snapshot?.state.review.activeSessionId;
  return <section className="section-block" aria-labelledby="learning-summary"><h2 id="learning-summary">你的学习记录</h2>
    <div className="personal-stats"><div><strong>{snapshot ? `${read} / ${publicMetadata.articles.length}` : "—"}</strong><span>已读文章，仅主动标记计数</span></div><div><strong>{snapshot ? `${practice?.independentExerciseIds.filter((id) => publicMetadata.exercises.some((e) => e.id === id)).length ?? 0} / ${publicMetadata.exercises.length}` : "—"}</strong><span>当前版本独立通过的练习</span></div><div><strong>{snapshot ? reviewed : "—"}</strong><span>今天评分的唯一卡片，撤销不计</span></div></div>
    {week && <p className="muted-copy">本周从 {week.startDate} 起评分 {week.events} 次，涉及 {week.cards} 张卡片（{personal?.preferences.studyTimezone}，撤销不计）。</p>}
    {!snapshot && !error && <p role="status">正在读取本地学习记录……</p>}
    <div className="action-row">{content && <Link className="button secondary" to={content.href}>继续阅读 · {content.title}</Link>}<Link className="button primary" to={session ? `/review/session/${session}`:"/review"}>{session ? "继续复习会话":"查看今日复习"}</Link><Link className="button secondary" to="/me?tab=weak">查看薄弱项</Link></div>
    {error && <div className="feedback-panel" role="alert"><p>{error}</p><button className="button secondary" onClick={() => { void reload(); }}>重新读取</button></div>}
  </section>;
}
