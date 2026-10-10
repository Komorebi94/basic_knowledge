import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import type { Article } from "../../content/articles";
import { cardsForContent } from "../../content/learningContent";
import { recordReading, toggleBookmark, toggleWeakMarker } from "../../domain/personalLearning";
import { pauseContent, subscribeContent } from "../../domain/review";
import { readLearning, updateLearning } from "../../infrastructure/persistence/personalStore";
import { useLearning } from "./useLearning";

export function useReadingPosition(contentId: string) {
  const location = useLocation();
  const [positionError,setPositionError] = useState(false);
  const [retryId,setRetryId] = useState(0);
  const hash = useRef(location.hash);
  useEffect(() => { hash.current = location.hash; }, [location.hash]);
  useEffect(() => {
    let active = true;
    let datasetId = "";
    let ready = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSaved = -1;
    let saving: Promise<unknown> | undefined;
    let pending: { offset:number; heading:string|null } | null = null;
    const flush = () => {
      if (saving || !pending || !ready || !datasetId) return;
      const position = pending;
      pending = null;
      if (position.offset === lastSaved) return;
      saving = updateLearning((state) => ({ ...state, personal: recordReading(state.personal,contentId,{ headingId:position.heading,scrollOffset:position.offset }) }),datasetId)
        .then(() => { lastSaved = position.offset; if (active) setPositionError(false); }).catch(() => { if (active) setPositionError(true); })
        .finally(() => { saving = undefined; flush(); });
    };
    const persist = () => {
      if (!ready || !datasetId) return;
      const headings = [...document.querySelectorAll<HTMLElement>(".article-section h2[id]")];
      pending = { offset:Math.max(0,window.scrollY),heading:headings.filter((item) => item.getBoundingClientRect().top <= 150).at(-1)?.id ?? null };
      flush();
    };
    readLearning().then(async (snapshot) => {
      if (!active) return;
      datasetId = snapshot.datasetId;
      const reading = snapshot.state.personal.readings[contentId];
      if (retryId === 0 && !hash.current && reading) { window.scrollTo({ top:reading.scrollOffset,behavior:"instant" }); lastSaved = reading.scrollOffset; }
      else if (retryId === 0 && !hash.current) window.scrollTo({ top:0,behavior:"instant" });
      await updateLearning((state) => ({ ...state,personal:recordReading(state.personal,contentId,{}) }),datasetId);
      if (active) { ready = true; setPositionError(false); persist(); }
    }).catch(() => { if (active) setPositionError(true); });
    const onScroll = () => { clearTimeout(timer); timer = setTimeout(persist,500); };
    const visibility = () => { if (document.visibilityState === "hidden") persist(); };
    window.addEventListener("scroll",onScroll,{ passive:true });
    document.addEventListener("visibilitychange",visibility);
    return () => { active = false; clearTimeout(timer); persist(); window.removeEventListener("scroll",onScroll); document.removeEventListener("visibilitychange",visibility); };
  }, [contentId,retryId]);
  return { positionError,retryPosition:() => setRetryId((value) => value + 1) };
}
export function ArticleLearningTools({ article }: { article: Article }) {
  const { snapshot,error,busy,mutate,reload } = useLearning();
  const [notice,setNotice] = useState("");
  const { positionError,retryPosition } = useReadingPosition(article.id);
  const personal = snapshot?.state.personal;
  const cards = cardsForContent(article.id);
  const bookmarked = !!personal?.bookmarks[article.id];
  const read = personal?.readings[article.id]?.status === "read";
  const subscribed = cards.some((card) => !!snapshot?.state.review.progress[card.cardId]);
  function perform(updater: Parameters<typeof mutate>[0]) { void mutate(updater).then(() => setNotice("学习操作已保存。可在复习计划或我的积累中查看。")).catch(() => {}); }
  return <section className="learning-tools" aria-label="这篇文章的学习操作">
    <div className="action-row">
      <button className="button secondary" disabled={!snapshot || busy} aria-pressed={read} onClick={() => perform((state) => ({ ...state,personal:recordReading(state.personal,article.id,{ status:read ? "in-progress":"read" }) }))}>{read ? "撤回已读":"标记已读"}</button>
      <button className="button secondary" disabled={!snapshot || busy} aria-pressed={bookmarked} onClick={() => perform((state) => ({ ...state,personal:toggleBookmark(state.personal,article.id,article.title) }))}>{bookmarked ? "取消收藏":"收藏"}</button>
      <button className="button secondary" disabled={!snapshot || busy} aria-pressed={!!personal?.weakMarkers[article.id]} onClick={() => perform((state) => ({ ...state,personal:toggleWeakMarker(state.personal,article.id) }))}>{personal?.weakMarkers[article.id] ? "取消手动补强":"加入补强"}</button>
      <Link className="button secondary" to={`/me?tab=notes&content=${encodeURIComponent(article.id)}`}>记录笔记</Link>
      <button className="button primary" disabled={!snapshot || busy || cards.length === 0} onClick={() => perform((state) => ({ ...state,review:subscribeContent(state.review,cards,new Date().toISOString()) }))}>加入复习</button>
      <button className="button secondary" disabled={!snapshot || busy || !subscribed} onClick={() => perform((state) => ({ ...state,review:pauseContent(state.review,cards,true) }))}>暂停本篇复习</button>
      <Link className="text-link" to="/review">开始回忆 →</Link>
    </div>
    <p className="muted-copy" role="status">{snapshot ? (read ? "已标记已读；阅读和掌握分别记录。":"在读；只有主动标记才计入已读。") : "正在读取学习状态……"}</p>
    {notice && <p className="muted-copy" role="status">{notice}</p>}
    {(error || positionError) && <div className="feedback-panel" role="alert"><p>{error || "阅读位置未能保存，请重试读取。"}</p><button className="button secondary" onClick={() => { retryPosition(); void reload(); }}>重新读取</button></div>}
  </section>;
}
