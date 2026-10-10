import { Link, useSearchParams } from "react-router";
import { searchDocuments } from "../infrastructure/search/search";
import { publicSearchDocuments } from "../content/searchDocuments";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().slice(0, 80);
  const type = ["knowledge","practice","ai","domain"].includes(searchParams.get("type") ?? "") ? searchParams.get("type") : "all";
  const matches = searchDocuments(publicSearchDocuments, query).filter((match) => type === "all" || match.document.type === type);

  return (
    <div className="standard-page">
      <div className="page-intro">
        <p className="eyebrow">目录与正文搜索</p>
        <h1>{query ? `“${query}”的搜索结果` : "搜索知识、练习与 AI"}</h1>
        <p>搜索知识与 AI 正文、练习题面和完整规划目录。待编写条目会定位到目录中的学习范围。</p>
      </div>
      <nav className="tabs" aria-label="搜索类型">{[{id:"all",label:"全部"},{id:"knowledge",label:"知识"},{id:"practice",label:"练习"},{id:"ai",label:"AI"},{id:"domain",label:"专题"}].map((item) => <Link className={`tab${type === item.id ? " active" : ""}`} aria-current={type === item.id ? "page":undefined} key={item.id} to={`/search?q=${encodeURIComponent(query)}${item.id === "all" ? "":`&type=${item.id}`}`}>{item.label}</Link>)}</nav>
      {matches.length > 0 ? (
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
      ) : (
        <div className="empty-panel compact">
          <h2>{query ? "暂时没有匹配的内容" : "输入关键词开始搜索"}</h2>
          <p>{query ? "可以换一个概念名称，或直接查看完整知识地图。" : "可查找知识单元、练习题目和 AI 工程主题。"}</p>
          <Link className="button secondary" to="/knowledge">查看知识地图</Link>
        </div>
      )}
    </div>
  );
}
