import { Link, useParams } from "react-router";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePractice } from "./usePractice";
import { RunnerClient } from "../../infrastructure/runner/client";
import { registerUnsavedDataGuard } from '../../infrastructure/persistence/personalStore';
import { startAttempt, markAssistance, finishRun, type PracticeRun, type CaseResult } from "../../domain/practice";
import type { Exercise } from "../../content/practice";
import { UnavailablePage } from "../../app/pages";
import { articleHref } from "../../content/articles";
import { exerciseTopics, findCatalogArticle } from "../../content/catalog";
import { CodeBlock } from "../../content/CodeBlock";
import { exercises } from "../../content/practice";

const practicePanels = [
  ["brief", "题目"],
  ["code", "代码"],
  ["results", "结果"],
  ["hints", "提示"],
  ["solution", "解析"],
  ["history", "历史"],
] as const;

type PracticePanel = (typeof practicePanels)[number][0];

export function PracticeListPage() {
  return (
    <div className="standard-page">
      <div className="page-intro">
        <p className="eyebrow">动手验证</p>
        <h1>动手练习</h1>
        <p>先独立实现，运行行为用例，再用解析检查边界。</p>
      </div>
      <div className="catalog-note" role="status">
        {exercises.length} 道核心练习已补齐题面、三层提示、参考实现与行为用例。可恢复草稿、运行隔离用例并记录独立或参考通过证据。其余 {exerciseTopics.length - exercises.length} 道为后续规划。
      </div>
      <div className="practice-list">
        {exerciseTopics.map((topic) => {
          const exercise = exercises.find((item) => item.id === topic.id);
          return <article className="practice-row" id={topic.id} key={topic.id} tabIndex={-1}>
            <span className="domain-id">{topic.id}</span>
            <div>
              <h2>{exercise ? <Link to={`/practice/${exercise.slug}`}>{topic.title}</Link> : topic.title}</h2>
              <p className="catalog-topic-meta">{topic.environment}{topic.difficulty ? ` · ${topic.difficulty}` : ""}{topic.minutes ? ` · 建议 ${topic.minutes} 分钟` : ""}</p>
              <p>{topic.summary}</p>
              <details className="exercise-boundaries"><summary>边界范围</summary><p>{topic.boundaries}</p></details>
            </div>
            <span className="topic-status">{exercise ? "题面已补齐" : "待编写"}</span>
          </article>;
        })}
      </div>
    </div>
  );
}

export function PracticeWorkspacePage() {
  const { slug } = useParams();
  const exercise = exercises.find((item) => item.slug === slug || item.id === slug);
  if (!exercise) return <UnavailablePage
    title="题目尚未开放"
    message="这个地址没有已补齐的题目。可以返回目录选择核心练习。"
    backTo="/practice" backLabel="返回练习目录"
  />;

  return <Workspace key={exercise.id} exercise={exercise} />;
}

function Workspace({exercise}:{exercise:Exercise}) {
  const [historyVisible,setHistoryVisible]=useState(20);
  const learning=usePractice(exercise), {snapshot,code,status,error,remote,save,change,updatePractice}=learning;
  const [running,setRunning]=useState(false),[runPhase,setRunPhase]=useState(''),[caseResults,setCaseResults]=useState<CaseResult[]>([]),[consoleLines,setConsoleLines]=useState<string[]>([]),[currentRun,setCurrentRun]=useState<PracticeRun|null>(null),[panel,setPanel]=useState<PracticePanel>("brief"),[confirm,setConfirm]=useState<'reset'|'attempt'|null>(null);
  const client=useRef<RunnerClient|null>(null), active=useRef(false), cancelledRun=useRef(false), mounted=useRef(true), summary=useRef<HTMLDivElement|null>(null);
  const draft=snapshot?.state.practice.drafts[exercise.id];
  const attempt=snapshot?.state.practice.attempts.find(a=>a.id===draft?.attemptId);
  const exerciseAttempts=snapshot?.state.practice.attempts.filter(a=>a.exerciseId===exercise.id)??[];
  const oldRevision=draft!==undefined&&draft.exerciseRevision!==exercise.revision;
  const stale=currentRun!==null&&(currentRun.codeRevision!==learning.codeRevision||currentRun.attemptId!==attempt?.id);
  const catchError=(cause:unknown)=>learning.setError(cause instanceof Error?cause.message:'操作未完成');
  useEffect(()=>registerUnsavedDataGuard(()=>active.current),[]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;client.current?.stop()}},[]);
  async function run(){
    if(active.current||!draft||!attempt||oldRevision)return;
    active.current=true;cancelledRun.current=false;setRunning(true);let record:PracticeRun|undefined;
    try{
      if(!(await save())||!mounted.current)return;
      const saved=learning.data.current.draft;if(!saved)return;
      const runId=crypto.randomUUID();record={id:runId,attemptId:saved.attemptId,exerciseId:exercise.id,exerciseRevision:exercise.revision,codeRevision:saved.codeRevision,codeSnapshot:learning.data.current.code,status:'running',caseResults:[],passed:0,total:exercise.testCases.length,createdAt:new Date().toISOString(),durationMs:0};
      const started=record;await updatePractice(state=>({...state,runs:[...state.runs,started]}));
      if(!mounted.current||cancelledRun.current){const stopped={...record,status:'stopped' as const};await updatePractice(state=>finishRun(state,stopped,crypto.randomUUID(),new Date().toISOString()));return}
      setRunPhase('正在加载运行环境');setCaseResults([]);setConsoleLines([]);setCurrentRun(record);
      const runner=new RunnerClient();client.current=runner;
      const result=await runner.run({runId,exercise,code:record.codeSnapshot??'',codeRevision:record.codeRevision,onReady:()=>{if(mounted.current)setRunPhase('正在执行用例')},onCase:r=>{if(mounted.current)setCaseResults(values=>[...values,r])},onConsole:line=>{if(mounted.current)setConsoleLines(values=>[...values,line].slice(0,200))}});
      const finished={...record,...result,caseResults:result.caseResults};
      await updatePractice(state=>finishRun(state,finished,crypto.randomUUID(),new Date().toISOString()));
      if(mounted.current){setCurrentRun(finished);setRunPhase(result.message||`${result.passed} / ${result.total} 用例通过`);if(document.activeElement?.tagName!=='TEXTAREA')summary.current?.focus()}
    }catch(cause:unknown){if(mounted.current){catchError(cause);setRunPhase('结果尚未保存，请保留代码后重试')}}
    finally{active.current=false;if(mounted.current)setRunning(false)}
  }
  async function newAttempt(){
    if(active.current||!draft)return;
    active.current=true;
    try{
      if(!(await save())||!mounted.current)return;
      const expected=learning.data.current.draft;if(!expected)return;
      await updatePractice(state=>{const actual=state.drafts[exercise.id];if(!actual||actual.revision!==expected.revision||actual.attemptId!==expected.attemptId)throw new Error('尝试已在另一页面更新，请读取最新草稿');return startAttempt(state,exercise.id,exercise.revision,exercise.starterArtifact,new Date().toISOString(),crypto.randomUUID())});
      if(mounted.current){learning.acceptSaved(exercise.starterArtifact);setCurrentRun(null);setCaseResults([]);setConfirm(null)}
    }catch(cause:unknown){if(mounted.current)catchError(cause)}
    finally{active.current=false}
  }
  async function assist(kind:'hint'|'reference'|'external',level=0){if(!attempt)return;try{await updatePractice(state=>markAssistance(state,attempt.id,kind,level))}catch(cause:unknown){catchError(cause)}}
  function onTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = practicePanels.findIndex(([id]) => id === panel);
    const last = practicePanels.length - 1;
    const next = event.key === "ArrowRight" ? (current === last ? 0 : current + 1)
      : event.key === "ArrowLeft" ? (current === 0 ? last : current - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : -1;
    const selected = practicePanels[next];
    if (!selected) return;
    event.preventDefault();
    const id = selected[0];
    setPanel(id);
    queueMicrotask(() => document.getElementById(`practice-tab-${id}`)?.focus());
  }
  const editor=<section className="article-section practice-editor" aria-labelledby="practice-editor-heading">
    <div className="section-title-row"><h2 id="practice-editor-heading">代码 · JavaScript</h2><span role="status">{status}</span></div>
    <label htmlFor="practice-code">本次实现</label>
    <textarea id="practice-code" style={{width:'100%',boxSizing:'border-box',fontFamily:'monospace'}} rows={18} maxLength={100000} value={code} readOnly={oldRevision} disabled={!draft&&!error} onChange={event=>change(event.target.value)} onBlur={()=>{void save()}} onKeyDown={event=>{if(snapshot?.state.personal.preferences.runShortcut&&(event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();void run()}}} />
    <p role="status">{runPhase}{stale?' · 结果对应较旧代码，当前编辑尚未验证':''}</p>
    <p>{code.length.toLocaleString()} / 100,000 字符 · {attempt?.assistance==='independent'?'本次尚未使用辅助':'本次使用辅助，全部通过将记为参考完成'}</p>
    <div className="action-row"><button type="button" className="button primary" disabled={running||!draft||oldRevision} onClick={()=>{void run()}}>{running?runPhase:'运行用例'}</button><button type="button" className="button secondary" disabled={!running} onClick={()=>{cancelledRun.current=true;client.current?.stop()}}>停止</button><button type="button" className="button secondary" disabled={running||!draft} onClick={()=>setConfirm('reset')}>重置骨架</button><button type="button" className="button secondary" disabled={running||!draft} onClick={()=>setConfirm('attempt')}>开始新尝试</button><button type="button" className="button secondary" onClick={()=>{if(!navigator.clipboard){learning.setError('复制不可用，请选择代码手动复制');return}void navigator.clipboard.writeText(code).catch(()=>learning.setError('复制不可用，请选择代码手动复制'))}}>复制代码</button><button type="button" className="button secondary" onClick={()=>{const blob=new Blob([code],{type:'text/javascript;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${exercise.id}.js`;a.click();URL.revokeObjectURL(url)}}>下载代码</button></div>
    {oldRevision&&<div role="alert"><p>题目已更新。旧版草稿只读保留，旧通过不计入新版；可先复制或下载，再开始新版尝试。</p></div>}
    {confirm&&<div role="alert"><p>{confirm==='reset'?'重置当前代码为骨架，不撤销本次使用辅助的记录。':'保存本次草稿并保留历史，开始新的独立尝试？'}</p><button type="button" onClick={()=>setConfirm(null)}>取消</button><button type="button" onClick={()=>{if(confirm==='attempt'||oldRevision){void newAttempt()}else{change(exercise.starterArtifact);setConfirm(null);void save()}}}>确认</button></div>}
    <label><input type="checkbox" checked={attempt?.selfReportedHelp??false} disabled={!attempt||attempt.selfReportedHelp} onChange={()=>{void assist('external')}} />本次使用了外部帮助（不可撤回）</label>
  </section>;
  const results=<section className="article-section" aria-labelledby="practice-results-heading"><h2 id="practice-results-heading">测试结果与控制台</h2><div ref={summary} tabIndex={-1} role="status">{runPhase||'尚未运行'}{stale?' · 结果对应较旧代码，当前编辑尚未验证':''}</div>{currentRun?.status==='passed'&&!stale&&<p>{attempt?.assistance==='independent'?'已记录独立通过证据':'已记录参考通过证据'}</p>}<ol>{caseResults.map(r=><li key={r.id}><strong>{r.name} · {r.passed?'通过':'失败'}</strong><p>{r.message}</p></li>)}</ol><details><summary>控制台（最多 200 行）</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{consoleLines.join('\n')||'没有输出'}</pre></details><label htmlFor="practice-reflection">本次复盘</label><textarea id="practice-reflection" style={{width:'100%',boxSizing:'border-box'}} maxLength={20000} value={learning.reflection} onChange={event=>learning.changeReflection(event.target.value)} onBlur={()=>{void save()}}/><p>写下边界、失败原因或下一次要验证的问题。</p></section>;
  return <div className="article-layout practice-workspace">
    <article className="article-body">
      <header className="practice-heading">
        <div className="heading-bar">
          <Link className="back-link" to="/practice">← 返回练习目录</Link>
          <p className="eyebrow">动手练习 · {exercise.id} · 建议 {exercise.estimatedMinutes} 分钟</p>
        </div>
        <h1>{exercise.title}</h1>
        <p className="article-lead">{exercise.summary}</p>
      </header>
      {error&&<div className="feedback-panel" role="alert"><p>{error}</p><button type="button" onClick={learning.retry}>重试保存</button></div>}
      {remote&&<div className="feedback-panel" role="alert"><p>此代码已在另一页面更新。本页输入仍保留，请比较两份后选择。</p><CodeBlock code={remote.state.practice.drafts[exercise.id]?.code??'新数据集没有这份草稿'} /><button type="button" onClick={()=>{void learning.resolveConflict(true).catch(catchError)}}>加载新版本</button><button type="button" onClick={()=>{void learning.resolveConflict(false).catch(catchError)}}>明确以本页覆盖</button></div>}
      {learning.blocker.state==='blocked'&&<div role="alert"><p>代码尚未保存，请处理错误或先复制下载。</p><button type="button" onClick={()=>learning.blocker.reset?.()}>继续编辑</button><button type="button" onClick={()=>learning.blocker.proceed?.()}>放弃未保存输入并离开</button></div>}
      <div className="practice-tabs" role="tablist" aria-label="练习内容" onKeyDown={onTabsKeyDown}>{practicePanels.map(([id, label]) => <button id={`practice-tab-${id}`} key={id} type="button" role="tab" aria-selected={panel === id} aria-controls="practice-panel" tabIndex={panel === id ? 0 : -1} onClick={() => setPanel(id)}>{label}</button>)}</div>
      <div id="practice-panel" className="practice-panel" role="tabpanel" aria-labelledby={`practice-tab-${panel}`}>
      {panel==='code'&&editor}{panel==='results'&&results}
      {panel==='hints'&&<section className="article-section"><h2>分层提示</h2><p>展开提示将保存本次辅助记录，全部通过记为参考完成。若本次已有通过证据，请先开始新尝试。</p>{exercise.hints.map((hint,index)=><div key={hint}><button type="button" disabled={!attempt} onClick={()=>{void assist('hint',index+1)}}>展开提示 {index+1}</button>{(attempt?.hintLevel??0)>index&&<p>{hint}</p>}</div>)}</section>}
      {panel==='solution'&&<section className="article-section"><h2>参考实现与推导</h2><p>查看参考将保存辅助记录。关闭页面不会撤销。</p><button type="button" disabled={!attempt} onClick={()=>{void assist('reference')}}>展开参考实现与完整解析</button>{attempt?.referenceRevealed&&<><CodeBlock code={exercise.referenceArtifact}/>{exercise.explanation.map(p=><p key={p}>{p}</p>)}<h3>复杂度与代价</h3><p>{exercise.complexity}</p><h3>另一种方案</h3><p>{exercise.alternative}</p><ul>{exercise.commonMistakes.map(p=><li key={p}>{p}</li>)}</ul></>}</section>}
      {panel==='history'&&<section className="article-section"><h2>尝试与运行历史</h2>{exerciseAttempts.slice(-historyVisible).reverse().map(a=><details key={a.id}><summary>{new Date(a.startedAt).toLocaleString()} · {a.assistance==='independent'?'未使用辅助':'使用辅助'} · 版本 {a.exerciseRevision}</summary><p>{a.reflection||'没有复盘'}</p>{a.codeSnapshot!==null&&<details><summary>结束尝试时的草稿</summary><CodeBlock code={a.codeSnapshot}/></details>}{snapshot?.state.practice.runs.filter(r=>r.attemptId===a.id).map(r=><details key={r.id}><summary>{r.status} · {r.passed}/{r.total} · 代码版本 {r.codeRevision}</summary>{r.codeSnapshot!==null?<CodeBlock code={r.codeSnapshot}/>:<p>详细快照已裁剪，长期证据保留。</p>}</details>)}</details>)}{exerciseAttempts.length>historyVisible&&<button type="button" onClick={()=>setHistoryVisible(count=>count+20)}>显示更多尝试</button>}</section>}
      {panel==='brief'&&<>

      <section className="article-section">
        <h2>场景与实现合同</h2>
        {exercise.problem.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p>{exercise.entryContract}</p>
        <p>运行环境：{exercise.runtime}</p>
        <p>允许能力：{exercise.allowedApis.join("；")}</p>
        <ul>{exercise.unsupportedBehavior.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul>
      </section>
      <section className="article-section">
        <h2>从骨架开始独立实现</h2>
        <CodeBlock code={exercise.starterArtifact} />
      </section>
      <section className="article-section">
        <h2>样例与输出原因</h2>
        <p>样例依赖你实现的入口。时间相关样例使用 clock 虚拟时钟，异步用例可用 deferred 控制完成；它们属于仓库测试环境，不是浏览器内建全局。对应 harness 见 scripts/verify-exercises.mjs。</p>
        {exercise.examples.map((example, index) => <div className="article-example" key={example.code}>
          <h3>样例 {index + 1}</h3>
          <CodeBlock code={example.code} />
          <p>预期输出：</p><pre>{example.expectedOutput}</pre>
          <p>{example.explanation}</p>
        </div>)}
      </section>
      <section className="article-section">
        <h2>用例要验证什么</h2>
        <p>每条用例检查一项可观察行为。运行时会用这些公开断言检查你的代码快照，并逐项展示结果。</p>
        <ol>{exercise.testCases.map((test) => <li key={test.id}>
          <strong>{test.name}</strong>：{test.purpose}
          <details className="learning-disclosure"><summary>查看用例步骤与断言</summary>
            <p>{test.setup}</p><CodeBlock code={test.code} />
            <p>预期：{test.expectedOutcome}</p><p>{test.cleanup}</p>
          </details>
        </li>)}</ol>
      </section>
      <section className="article-section">
        <h2>回看关联知识</h2>
        <ul>{exercise.knowledgeIds.map((id) => {
          const article = findCatalogArticle(id);
          return article ? <li key={id}><Link className="text-link" to={articleHref(article)}>{id} · {article.title}</Link></li> : <li key={id}>{id} · 正文待补齐</li>;
        })}</ul>
      </section>
      </>}
      </div>
    </article>
  </div>;
}
