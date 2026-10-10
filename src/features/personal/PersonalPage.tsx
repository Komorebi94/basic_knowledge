import { Link, useSearchParams } from "react-router";
import { articles, articleHref } from "../../content/articles";
import { NoteEditor } from "./NoteEditor";
import { PersonalLearningList } from "./PersonalLearningList";
import { useState } from "react";
import { usePersonalDataset } from "./usePersonalDataset";

const tabs = [
  { id: "notes", label: "笔记" },
  { id: "bookmarks", label: "收藏" },
  { id: "weak", label: "薄弱项" },
  { id: "history", label: "学习记录" },
] as const;

export function PersonalPage() {
  const [query,setQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const current = tabs.find((tab) => tab.id === requested) ?? tabs[0];
  const selectedArticle = articles.find((article) => article.id === searchParams.get("content"));
  const headingId = selectedArticle?.sections.find((section) => section.id === searchParams.get("heading"))?.id ?? null;
  const { snapshot, error, reload } = usePersonalDataset();
  const notes = snapshot?.records.filter((record) => record.kind === "note")
    .filter((record) => record.payload.text.trim().length > 0 && `${record.payload.titleSnapshot} ${record.payload.text}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) ?? [];

  return (
    <div className="standard-page">
      <div className="page-intro">
        <p className="eyebrow">个人积累</p>
        <h1>我的积累</h1>
        <p>笔记、收藏、薄弱项与学习记录保存在你的浏览器中。</p>
      </div>
      <nav className="tabs" aria-label="我的积累分类">
        {tabs.map((tab) => (
          <Link
            className={`tab${current.id === tab.id ? " active" : ""}`}
            key={tab.id}
            to={`/me?tab=${tab.id}`}
            aria-current={current.id === tab.id ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <label className="field-label" htmlFor="personal-search">搜索当前分类</label><input className="text-input" id="personal-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      {current.id !== "notes" && <PersonalLearningList tab={current.id} query={query} />}
      {current.id === "notes" && <section className="panel">
        <label htmlFor="note-article">选择笔记对应的文章</label>
        <select id="note-article" value={selectedArticle?.id ?? ""} onChange={(event) => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", "notes");
          next.delete("heading");
          if (event.target.value) next.set("content", event.target.value);
          else next.delete("content");
          setSearchParams(next);
        }}>
          <option value="">选择文章后开始编辑</option>
          {articles.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}
        </select>
        {selectedArticle && <><label className="field-label" htmlFor="note-heading">绑定范围</label><select id="note-heading" value={headingId ?? ""} onChange={(event) => { const next = new URLSearchParams(searchParams); if (event.target.value) next.set("heading",event.target.value); else next.delete("heading"); setSearchParams(next); }}><option value="">整篇文章</option>{selectedArticle.sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select><NoteEditor key={`${selectedArticle.id}:${headingId ?? "whole"}`} contentId={selectedArticle.id} headingId={headingId} title={selectedArticle.title} onSaved={reload} /></>}
      </section>}
      {current.id === "notes" && error ? <div className="feedback-panel" role="alert"><p>{error}</p><button className="button secondary" onClick={reload}>重新读取</button></div>
        : current.id === "notes" && !snapshot ? <p role="status">正在读取笔记……</p>
        : current.id === "notes" && notes.length > 0 ? <div className="note-list">{notes.map((note) => {
          const article = articles.find((item) => item.id === note.payload.contentId);
          return <article className="note-card" key={note.id}><h2>{note.payload.titleSnapshot}{note.payload.headingId ? " · 章节笔记" : ""}</h2><Link className="text-link" to={`/me?tab=notes&content=${encodeURIComponent(note.payload.contentId)}${note.payload.headingId ? `&heading=${encodeURIComponent(note.payload.headingId)}` : ""}`}>编辑这份笔记</Link><p>{note.payload.text}</p><span className="muted-copy">更新于 {new Date(note.updatedAt).toLocaleString("zh-CN")}</span>{article ? <Link className="text-link" to={articleHref(article)}>返回原文 →</Link> : <span className="topic-status">原内容暂不可用，笔记仍然保留</span>}</article>;
        })}</div> : current.id === "notes" ? <div className="empty-panel compact">
        <h2>还没有{current.label}</h2>
        <p>{current.id === "notes" ? "选择上方文章即可记录笔记，已保存的内容会出现在这里。" : "该类记录功能正在建设，后续会在这里展示真实学习数据。"}</p>
        <Link className="button secondary" to="/knowledge">浏览知识地图</Link>
      </div> : null}
    </div>
  );
}
