import { Link } from "react-router";
import { useState } from "react";
import publicMetadata from "../../content/publicMetadata.json";
import { contentManifest } from "../../content/manifest";
import { recallCards } from "../../content/learningContent";
import { toggleBookmark, toggleWeakMarker } from "../../domain/personalLearning";
import { useLearning } from "./useLearning";
import { getPracticeSummary } from "../../domain/practice";

export function PersonalLearningList({ tab,query }: { tab: "bookmarks"|"weak"|"history"; query: string }) {
  const [visibleCount,setVisibleCount] = useState(50);
  const { snapshot,error,busy,mutate,reload } = useLearning();
  if (error) return <div className="feedback-panel" role="alert"><p>{error}</p><button className="button secondary" onClick={() => { void reload(); }}>重新读取</button></div>;
  if (!snapshot) return <p role="status">正在读取学习记录……</p>;
  const state = snapshot.state;
  const practice = getPracticeSummary(state.practice,Object.fromEntries(publicMetadata.exercises.map((e) => [e.id,e.revision])));
  const weak = new Map<string,string[]>();
  const weakDates = new Map<string,string>();
  for (const marker of Object.values(state.personal.weakMarkers)) weak.set(marker.contentId,[marker.reasonText]);
  for (const progress of Object.values(state.review.progress)) {
    if (progress.lastRating === "forgotten" || progress.lastRating === "unstable") {
      const card = recallCards.find((item) => item.cardId === progress.cardId);
      if (card && card.cardRevision === progress.cardRevision) {
        weak.set(card.sourceContentId,[...(weak.get(card.sourceContentId) ?? []),"最近卡片评分需要补强"]);
        weakDates.set(card.sourceContentId,[weakDates.get(card.sourceContentId) ?? "",progress.lastReviewedAt ?? ""].sort().at(-1) ?? "");
      }
    }
  }
  for (const id of practice.weakExerciseIds) {
    weak.set(id,[...(weak.get(id) ?? []),"最近练习失败或参考完成"]);
    weakDates.set(id,state.practice.runs.filter((run) => run.exerciseId === id && ["passed","failed"].includes(run.status)).at(-1)?.createdAt ?? "");
  }
  const entries = tab === "bookmarks" ? Object.values(state.personal.bookmarks).map((b) => ({ id:b.contentId,label:"已收藏",occurredAt:b.createdAt,title:b.titleSnapshot }))
    : tab === "weak" ? [...weak].map(([id,reasons]) => ({id,label:[...new Set(reasons)].join("；"),occurredAt:weakDates.get(id) || state.personal.weakMarkers[id]?.createdAt || "",title:contentManifest.find((c) => c.id === id)?.title ?? id}))
    : [ ...Object.values(state.personal.readings).map((r) => ({ id:r.contentId,label:r.status === "read" ? "已读":"在读",occurredAt:r.updatedAt,title:contentManifest.find((c) => c.id === r.contentId)?.title ?? r.contentId })),
      ...practice.history.map((run) => ({ id:run.exerciseId,label:run.label,occurredAt:run.occurredAt,title:contentManifest.find((c) => c.id === run.exerciseId)?.title ?? run.exerciseId })),
      ...state.review.events.filter((event) => !event.revertedAt).map((event) => ({ id:recallCards.find((card) => card.cardId === event.cardId)?.sourceContentId ?? event.cardId,label:"完成卡片评分",occurredAt:event.occurredAt,title:recallCards.find((card) => card.cardId === event.cardId)?.question ?? event.cardId })) ];
  const visible = entries.filter((entry) => `${entry.title} ${entry.label}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b) => {
    if (tab === "weak") {
      const manual = Number(!!state.personal.weakMarkers[b.id]) - Number(!!state.personal.weakMarkers[a.id]);
      if (manual) return manual;
    }
    return b.occurredAt.localeCompare(a.occurredAt);
  });
  return <section className="note-list" aria-label="真实学习记录">
    {visible.length === 0 && <div className="empty-panel compact"><h2>{query ? "没有匹配记录":"还没有这类记录"}</h2><p>阅读、收藏、卡片评分与练习完成后，会在这里留下对应记录。</p><Link className="text-link" to="/knowledge">浏览知识地图 →</Link></div>}
    {visible.slice(0,visibleCount).map((entry,index) => { const content = contentManifest.find((c) => c.id === entry.id); return <article className="note-card" key={`${entry.id}:${entry.occurredAt}:${index}`}><h2>{entry.title}</h2><p>{entry.label}</p>{entry.occurredAt && <time dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleString("zh-CN")}</time>}<div className="action-row">{content ? <Link className="text-link" to={content.href}>返回原内容 →</Link> : <span>原内容已归档，记录保留</span>}{tab === "bookmarks" && <button className="button secondary" disabled={busy} onClick={() => { void mutate((current) => ({ ...current,personal:toggleBookmark(current.personal,entry.id,entry.title) })).catch(() => {}); }}>取消收藏</button>}{tab === "weak" && state.personal.weakMarkers[entry.id] && <button className="button secondary" disabled={busy} onClick={() => { void mutate((current) => ({ ...current,personal:toggleWeakMarker(current.personal,entry.id) })).catch(() => {}); }}>取消手动补强</button>}</div></article>; })}
    {visible.length > visibleCount && <button className="button secondary" onClick={() => setVisibleCount((count) => count + 50)}>显示更多记录（剩余 {visible.length - visibleCount} 条）</button>}
  </section>;
}
