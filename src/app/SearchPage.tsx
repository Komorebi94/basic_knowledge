import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { searchDocuments, type SearchDocument } from "../infrastructure/search/search";
import { loadSearchIndex } from "../content/searchIndex";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().slice(0, 80);
  const typeParam = searchParams.get("type") ?? "";
  const type = typeParam === "knowledge" || typeParam === "practice" || typeParam === "ai" || typeParam === "domain" ? typeParam : "all";
  const [attempt, setAttempt] = useState(0);
  const [documents, setDocuments] = useState<readonly SearchDocument[] | null>(null);
  const [errorAttempt, setErrorAttempt] = useState<number | null>(null);
  const status = !query || documents ? "ready" : errorAttempt === attempt ? "error" : "loading";

  useEffect(() => {
    if (!query || documents) return undefined;
    let active = true;
    loadSearchIndex().then(
      (index) => {
        if (active) setDocuments(index);
      },
      () => {
        if (active) setErrorAttempt(attempt);
      },
    );
    return () => {
      active = false;
    };
  }, [attempt, documents, query]);

  const matches = query && documents ? searchDocuments(documents, query).filter((match) => type === "all" || match.document.type === type) : [];

  return (
    <div className="standard-page">
      <div className="page-intro">
        <p className="eyebrow">目录与正文搜索</p>
        <h1>{query ? `“${query}”的搜索结果` : "搜索知识、练习与 AI"}</h1>
        <p>搜索知识与 AI 正文、练习题面和完整规划目录。待编写条目会定位到目录中的学习范围。</p>
      </div>
      <nav className="tabs" aria-label="搜索类型">{[{id:"all",label:"全部"},{id:"knowledge",label:"知识"},{id:"practice",label:"练习"},{id:"ai",label:"AI"},{id:"domain",label:"专题"}].map((item) => <Link className={`tab${type === item.id ? " active" : ""}`} aria-current={type === item.id ? "page":undefined} key={item.id} to={`/search?q=${encodeURIComponent(query)}${item.id === "all" ? "":`&type=${item.id}`}`}>{item.label}</Link>)}</nav>
      {query && status === "loading" ? <p role="status">正在准备搜索……</p> : null}
      {query && status === "error" ? (
        <div className="empty-panel compact" role="alert">
          <h2>搜索暂时无法使用</h2>
          <p>索引没有载入。请检查网络后重试，已打开的文章不受影响。</p>
          <button className="button secondary" type="button" onClick={() => setAttempt((value) => value + 1)}>重新加载</button>
        </div>
      ) : null}
      {query && status === "ready" && documents && matches.length > 0 ? (
        <div className="domain-grid">
          {matches.map(({ document }) => (
            <Link className="domain-card" key={document.id} to={document.href}>
              <span className="domain-id">{document.type === "domain" ? "专题" : document.type === "ai" ? "AI 工程" : document.type === "practice" ? "动手练习" : "知识单元"} · {document.id}</span>
              <h2>{document.title}</h2>
              <p>{document.summary}</p>
              <span className="text-link">{document.type === "domain" ? "查看专题目录" : document.availability === "readable" ? "阅读完整内容" : "查看目录 · 待编写"} <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      ) : null}
      {query && status === "ready" && documents && matches.length === 0 ? (
        <div className="empty-panel compact">
          <h2>暂时没有匹配的内容</h2>
          <p>可以换一个概念名称，或直接查看完整知识地图。</p>
          <Link className="button secondary" to="/knowledge">查看知识地图</Link>
        </div>
      ) : null}
      {!query ? (
        <div className="empty-panel compact">
          <h2>输入关键词开始搜索</h2>
          <p>可查找知识单元、练习题目和 AI 工程主题。</p>
          <Link className="button secondary" to="/knowledge">查看知识地图</Link>
        </div>
      ) : null}
    </div>
  );
}
