import { useCallback, useEffect, useRef, useState } from "react";
import "./review.css";
import { Link, useBlocker, useNavigate, useParams, type BlockerFunction } from "react-router";
import { articles, articleHref } from "../../content/articles";
import { recallCards } from "../../content/learningContent";
import { endReviewSession, getReviewSummary, pauseContent, progressLabel, rateReviewCard, ratingLabels, saveReviewAnswer, startReviewSession, synchronizeCards, undoLastReview, type ReviewRating, type ReviewSession } from "../../domain/review";
import { registerUnsavedDataGuard } from "../../infrastructure/persistence/personalStore";
import { useLearning } from "../personal/useLearning";

type LearningActions = ReturnType<typeof useLearning>;
function message(cause: unknown): string { return cause instanceof Error ? cause.message : "保存失败，请保留输入并重试"; }

export function ReviewPlanPage() {
  const learning = useLearning();
  const { snapshot, error, busy, mutate, reload } = learning;
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    let timeout: number;
    const tick = () => { setNow(new Date().toISOString()); timeout = window.setTimeout(tick, 60_000 - Date.now() % 60_000); };
    timeout = window.setTimeout(tick, 60_000 - Date.now() % 60_000);
    return () => window.clearTimeout(timeout);
  }, []);
  useEffect(() => {
    if (!snapshot || synchronizeCards(snapshot.state.review, recallCards) === snapshot.state.review) return;
    void mutate((state) => ({ ...state, review: synchronizeCards(state.review, recallCards) })).catch((cause: unknown) => setNotice(message(cause)));
  }, [snapshot, mutate]);
  async function begin(extra = false) {
    try {
      const result = await mutate((state) => ({ ...state, review: startReviewSession(state.review, recallCards, state.personal.preferences, new Date().toISOString(), crypto.randomUUID(), extra ? "extra" : "daily", extra ? chosen : []) }));
      if (result.state.review.activeSessionId) navigate(`/review/session/${result.state.review.activeSessionId}`);
    } catch (cause: unknown) { setNotice(message(cause)); }
  }
  if (!snapshot) return <div className="standard-page"><h1>复习计划</h1>{error ? <div role="alert"><p>{error}</p><button className="button secondary" onClick={() => { void reload(); }}>重新读取</button></div> : <p role="status">正在读取复习计划……</p>}</div>;
  const { review, personal } = snapshot.state;
  const summary = getReviewSummary(review, recallCards, personal.preferences, now);
  const subscribed = recallCards.filter((card) => review.progress[card.cardId]);
  const latest = review.latestSessionId ? review.sessions[review.latestSessionId] : undefined;
  return <div className="standard-page">
    <header className="page-intro"><p className="eyebrow">主动回忆</p><h1>复习计划</h1><p>先尝试回忆，再展开要点。评分会按固定间隔安排下一次回顾。</p></header>
    <p className="catalog-note">学习日 {summary.today} · {personal.preferences.studyTimezone} · 每日目标 {personal.preferences.dailyLimit} 张，新卡最多 5 张。今日完成 {summary.todayCompleted} 张，到期 {summary.dueCount} 张，新卡剩余额度 {summary.newRemaining} 张。</p>
    {(error || notice) && <div className="feedback-panel" role="alert"><p>{notice || error}</p><button className="button secondary" onClick={() => { setNotice(""); void reload(); }}>重新读取计划</button></div>}
    <div className="action-row">
      {review.activeSessionId ? <Link className="button primary" to={`/review/session/${review.activeSessionId}`}>继续未完成复习（{summary.activeRemaining} 张）</Link> : <button className="button primary" disabled={busy || summary.candidateCount === 0} onClick={() => { void begin(); }}>开始今日回顾（{summary.candidateCount} 张）</button>}
      {!review.activeSessionId && <button className="button secondary" disabled={busy || (summary.dueCount === 0 && chosen.length === 0)} onClick={() => { void begin(true); }}>额外回顾（最多 10 张）</button>}
      {latest?.status === "completed" && <Link className="text-link" to={`/review/session/${latest.sessionId}`}>查看上次完成与撤销 →</Link>}
    </div>
    {summary.candidateCount === 0 && !review.activeSessionId && <p>{subscribed.length === 0 ? "还没有订阅卡片，在文章点击加入复习即可开始。" : "今日没有其他默认候选。可以按计划明日再来，或选择卡片额外回顾。"}</p>}
    <Link className="text-link" to="/knowledge">浏览知识文章并加入复习 →</Link>
    <section aria-labelledby="review-card-list"><h2 id="review-card-list">已订阅卡片</h2><p className="muted-copy">暂停保留历史；恢复后已到期的卡片重新进入候选。勾选可主动额外回顾，最多 10 张。</p>
      {subscribed.length === 0 && <p>卡片会在你主动加入文章复习后出现在这里。</p>}
      <div className="note-list">{subscribed.map((card) => {
        const progress = review.progress[card.cardId];
        const source = articles.find((article) => article.id === card.sourceContentId);
        return <article className="note-card" key={card.cardId}><h3>{card.question}</h3><p>{progressLabel(progress)}{progress?.lastRating === null && review.events.some((event) => event.cardId === card.cardId && event.cardRevision !== card.cardRevision) ? " · 内容已更新" : ""} · {progress?.paused ? "已暂停" : "复习中"} · {progress?.dueDate ? `下次 ${progress.dueDate}` : "尚未评分"}</p><div className="action-row">
          <label><input type="checkbox" checked={chosen.includes(card.cardId)} disabled={!!review.activeSessionId || (!chosen.includes(card.cardId) && chosen.length >= 10)} onChange={(event) => setChosen((ids) => event.target.checked ? [...ids, card.cardId] : ids.filter((id) => id !== card.cardId))} /> 额外回顾此卡</label>
          <button className="button secondary" disabled={busy} onClick={() => { void mutate((state) => ({ ...state, review: pauseContent(state.review, [card], !state.review.progress[card.cardId]?.paused) })).catch((cause: unknown) => setNotice(message(cause))); }}>{progress?.paused ? "恢复复习" : "暂停复习"}</button>
          {source && <Link className="text-link" to={`${articleHref(source)}#${card.sourceHeadingId}`}>返回原文 →</Link>}
        </div></article>;
      })}</div>
    </section>
  </div>;
}

export function ReviewSessionPage() {
  const { sessionId } = useParams();
  const learning = useLearning();
  if (!learning.snapshot) return <div className="standard-page"><h1>回忆会话</h1><p role={learning.error ? "alert" : "status"}>{learning.error || "正在恢复会话……"}</p>{learning.error && <button className="button secondary" onClick={() => { void learning.reload(); }}>重新读取</button>}</div>;
  const session = sessionId ? learning.snapshot.state.review.sessions[sessionId] : undefined;
  if (!session) return <div className="standard-page"><h1>找不到这次复习</h1><p>这个地址没有可恢复的会话，已有评分记录仍然保留。</p><Link className="button primary" to="/review">返回复习计划</Link></div>;
  return <ReviewWorkspace key={`${learning.snapshot.datasetId}:${session.sessionId}`} session={session} learning={learning} />;
}

function ReviewWorkspace({ session, learning }: { session: ReviewSession; learning: LearningActions }) {
  const { mutate, snapshot, error, reload } = learning;
  const [view, setView] = useState(session);
  const [draft, setDraft] = useState(session.answerDraft);
  const [saveStatus, setSaveStatus] = useState("已保存到本地");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);
  const [upgradedAccepted, setUpgradedAccepted] = useState(false);
  const [working, setWorking] = useState(false);
  const state = useRef({ view: session, draft: session.answerDraft, savedDraft: session.answerDraft, revealed: session.answerRevealed, savedRevealed: session.answerRevealed, blocked: false });
  const inFlight = useRef<Promise<void> | null>(null);
  const operation = useRef(false);
  const ratingAttempt = useRef<{ cursor: number; eventId: string; rating: ReviewRating } | null>(null);
  const mounted = useRef(true);
  const questionHeading = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => { questionHeading.current?.focus(); }, [view.cursor, view.status]);
  const shouldBlock = useCallback<BlockerFunction>(({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname && (state.current.draft !== state.current.savedDraft || state.current.revealed !== state.current.savedRevealed), []);
  const blocker = useBlocker(shouldBlock);
  const accept = useCallback((next: ReviewSession, replaceDraft = true) => {
    state.current.view = next;
    state.current.savedDraft = next.answerDraft;
    state.current.savedRevealed = next.answerRevealed;
    if (replaceDraft) { state.current.draft = next.answerDraft; state.current.revealed = next.answerRevealed; }
    if (mounted.current) { setView(next); if (replaceDraft) setDraft(next.answerDraft); }
  }, []);
  const save = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    if (state.current.blocked) return Promise.reject(new Error("回答或会话存在冲突，请先保留本页回答并重新读取"));
    if (state.current.view.status !== "active" || (state.current.draft === state.current.savedDraft && state.current.revealed === state.current.savedRevealed)) return Promise.resolve();
    const run = async () => {
      try {
        while (state.current.draft !== state.current.savedDraft || state.current.revealed !== state.current.savedRevealed) {
          const { draft: text, revealed, view: current } = state.current;
          if (mounted.current) setSaveStatus("正在保存");
          const result = await mutate((value) => ({ ...value, review: saveReviewAnswer(value.review, current.sessionId, current.revision, text, revealed) }));
          const saved = result.state.review.sessions[current.sessionId];
          if (!saved) throw new Error("保存后的会话无法读取");
          accept(saved, false);
        }
        if (mounted.current) { setSaveStatus("已保存到本地"); setNotice(""); }
      } catch (cause: unknown) {
        state.current.blocked = true;
        if (mounted.current) { setSaveStatus("未保存，回答仍在本页"); setNotice(message(cause)); setConflict(true); }
        throw cause;
      } finally { inFlight.current = null; }
    };
    inFlight.current = run();
    return inFlight.current;
  }, [mutate, accept]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (session.revision === state.current.view.revision) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (!active || session.revision === state.current.view.revision) return;
      if (state.current.draft !== state.current.savedDraft || state.current.revealed !== state.current.savedRevealed) {
        state.current.blocked = true; setConflict(true); setNotice("这次会话已在另一页面更新。本页回答保留，请复制后读取新版本。");
      } else { accept(session); state.current.blocked = false; setConflict(false); }
    });
    return () => { active = false; };
  }, [session, accept]);
  useEffect(() => {
    if (draft === view.answerDraft || state.current.blocked) return;
    const timeout = window.setTimeout(() => { void save().catch((cause: unknown) => setNotice(message(cause))); }, 500);
    return () => window.clearTimeout(timeout);
  }, [draft, view.answerDraft, save]);
  useEffect(() => registerUnsavedDataGuard(() => state.current.draft !== state.current.savedDraft || state.current.revealed !== state.current.savedRevealed), []);
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => { if (state.current.draft !== state.current.savedDraft || state.current.revealed !== state.current.savedRevealed) event.preventDefault(); };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, []);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    let active = true;
    void save().then(() => { if (active) blocker.proceed(); }).catch((cause: unknown) => { if (active) setNotice(message(cause)); });
    return () => { active = false; };
  }, [blocker, save]);
  const changedContent = view.cardsSnapshot.some((card) => recallCards.find((current) => current.cardId === card.cardId)?.cardRevision !== card.cardRevision);
  const gate = changedContent && !upgradedAccepted;
  const rate = useCallback(async (rating: ReviewRating) => {
    if (operation.current || state.current.blocked || !state.current.view.answerRevealed || (changedContent && !upgradedAccepted)) return;
    operation.current = true; setWorking(true);
    try {
      await save();
      const current = state.current.view;
      if (!ratingAttempt.current || ratingAttempt.current.cursor !== current.cursor) ratingAttempt.current = { cursor: current.cursor, eventId: crypto.randomUUID(), rating };
      const attempt = ratingAttempt.current;
      const result = await mutate((value) => ({ ...value, review: rateReviewCard(value.review, current.sessionId, current.revision, attempt.rating, attempt.eventId, new Date().toISOString(), recallCards, value.personal.preferences.studyTimezone) }));
      const next = result.state.review.sessions[current.sessionId];
      if (!next) throw new Error("评分后的会话无法读取");
      ratingAttempt.current = null; accept(next); setSaveStatus("已保存到本地"); setNotice("");
    } catch (cause: unknown) { setNotice(`${message(cause)}。未确认保存前不会自动进入下一卡。`); }
    finally { operation.current = false; setWorking(false); }
  }, [save, mutate, accept, changedContent, upgradedAccepted]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || (event.target instanceof HTMLElement && (event.target.matches("input,textarea,select") || event.target.isContentEditable))) return;
      const ratings: ReviewRating[] = ["forgotten", "unstable", "remembered", "fluent"];
      const rating = ratings[Number(event.key) - 1];
      if (rating && state.current.view.status === "active" && state.current.view.answerRevealed) { event.preventDefault(); void rate(rating); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [rate]);
  async function undo() {
    if (operation.current) return;
    operation.current = true; setWorking(true);
    try {
      await save(); const current = state.current.view;
      const result = await mutate((value) => ({ ...value, review: undoLastReview(value.review, current.sessionId, current.revision, new Date().toISOString()) }));
      const next = result.state.review.sessions[current.sessionId]; if (next) accept(next);
      ratingAttempt.current = null; setNotice("已撤销最近评分，计划与今日统计已恢复。");
    } catch (cause: unknown) { setNotice(message(cause)); } finally { operation.current = false; setWorking(false); }
  }
  async function end() {
    if (operation.current) return;
    operation.current = true; setWorking(true);
    try {
      await save(); const current = state.current.view;
      const result = await mutate((value) => ({ ...value, review: endReviewSession(value.review, current.sessionId, current.revision, new Date().toISOString(), recallCards) }));
      const next = result.state.review.sessions[current.sessionId]; if (next) accept(next);
      setNotice("本次队列已结束，已经保存的评分保留。");
    } catch (cause: unknown) { setNotice(message(cause)); } finally { operation.current = false; setWorking(false); }
  }
  const card = view.cardsSnapshot[view.cursor];
  const source = card ? articles.find((article) => article.id === card.sourceContentId) : undefined;
  const isBusy = working;
  return <div className="standard-page review-workspace">
    <header className="page-heading">
      <div className="heading-bar">
        <Link className="back-link" to="/review">← 返回复习计划</Link>
        <p className="eyebrow">{view.mode === "extra" ? "额外回顾" : "今日回顾"} · {view.sessionDate} · {view.timezone} · 已完成 {view.cursor} / {view.cardsSnapshot.length} 张</p>
      </div>
      <h1>回忆会话</h1>
    </header>
    {snapshot?.state.personal.preferences.studyTimezone !== view.timezone && <p className="catalog-note">设置中的学习时区已改变；本次会话日期与顺序保留原快照，新的评分按当前学习时区安排。</p>}
    {(notice || error) && <div className="feedback-panel" role="alert"><p>{notice || error}</p>{conflict ? <><p>本页回答：{draft || "（空）"}</p><div className="action-row"><button className="button secondary" onClick={() => { state.current.blocked = false; accept(session); setConflict(false); setNotice(""); void reload(); }}>使用已保存会话</button><button className="button secondary" onClick={() => { state.current.blocked = false; setConflict(false); void save().catch((cause: unknown) => setNotice(message(cause))); }}>重试保存本页回答</button></div></> : <button className="button secondary" onClick={() => { void reload(); }}>重新读取会话</button>}</div>}
    {view.status === "active" && gate && <div className="feedback-panel" role="alert"><h2>内容已更新</h2><p>本次卡片是开始时的旧版快照。可以继续旧版评分；新版熟练度会在这次会话完成或结束后重置为新卡。</p><div className="action-row"><button className="button primary" onClick={() => setUpgradedAccepted(true)}>继续旧版会话</button><button className="button secondary" disabled={isBusy} onClick={() => { void end(); }}>结束后学习新版</button></div></div>}
    {view.status === "active" && card && <section className="article-section" aria-labelledby="recall-question"><h2 id="recall-question" ref={questionHeading} tabIndex={-1}>{card.question}</h2><p className="muted-copy">卡片版本 {card.cardRevision} · 先用自己的话回忆，再展开参考。</p><label htmlFor="recall-answer">我的回答（可留空）</label><textarea id="recall-answer" rows={5} value={draft} maxLength={20_000} disabled={isBusy || gate} onChange={(event) => { state.current.draft = event.target.value; setDraft(event.target.value); setSaveStatus("等待保存"); }} onBlur={() => { void save().catch((cause: unknown) => setNotice(message(cause))); }} /><p role="status">{saveStatus}</p>
      <button className="button secondary" disabled={working || gate || conflict} aria-expanded={view.answerRevealed} onClick={() => { state.current.revealed = !state.current.revealed; void save().catch((cause: unknown) => setNotice(message(cause))); }}>{view.answerRevealed ? "隐藏参考要点" : "展开参考要点"}</button>
      {view.answerRevealed && <div className="recall-reference"><h3>参考要点</h3><ul>{card.answerPoints.map((point) => <li key={point}>{point}</li>)}</ul><h3>容易遗漏</h3><ul>{card.pitfalls.map((point) => <li key={point}>{point}</li>)}</ul></div>}
      <div className="action-row" aria-label="自评结果">{(["forgotten", "unstable", "remembered", "fluent"] as const).map((rating, index) => <button className="button secondary" key={rating} disabled={!view.answerRevealed || isBusy || gate || conflict} onClick={() => { void rate(rating); }}>{index + 1} · {ratingLabels[rating]}</button>)}</div><p className="muted-copy">展开要点后可按数字 1—4 评分。忘记的卡片明日到期，不会在本次队列反复插回。</p>{source && <Link className="text-link" to={`${articleHref(source)}#${card.sourceHeadingId}`}>回原文巩固 →</Link>}
    </section>}
    {view.status === "completed" && <section className="empty-panel compact"><h2 ref={questionHeading} tabIndex={-1}>本次回顾已完成</h2><p>{view.cursor} 张评分已保存。下次日期由评分阶梯安排，完成不代表永久掌握。</p><Link className="button primary" to="/review">返回计划</Link></section>}
    {view.status === "ended" && <p>这次会话已结束，已完成 {view.cursor} 张。尚未评分的卡片仍按原计划保留。</p>}
    <div className="action-row">{view.status !== "ended" && <button className="button secondary" disabled={view.cursor === 0 || isBusy || conflict} onClick={() => { void undo(); }}>撤销最近评分</button>}{view.status === "active" && <button className="button secondary" disabled={isBusy || conflict} onClick={() => { void end(); }}>结束本次队列</button>}</div>
    {blocker.state === "blocked" && <div className="feedback-panel" role="alert"><p>回答尚未保存，请处理错误或先复制输入。</p><div className="action-row"><button className="button secondary" onClick={() => blocker.reset()}>继续编辑</button><button className="button secondary" onClick={() => blocker.proceed()}>放弃未保存回答并离开</button></div></div>}
    {draft !== view.answerDraft && <p className="muted-copy">输入只在当前页面，保存失败时请复制保留。</p>}
  </div>;
}
