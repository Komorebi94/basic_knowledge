import { useLearning } from "../personal/useLearning";
import { Link, useParams } from "react-router";
import { UnavailablePage } from "../../app/pages";
import { ArticleView } from "../../content/ArticleView";
import { articles, findArticle, articleHref } from "../../content/articles";
import { findKnowledgeDomain, knowledgeDomains } from "./catalog";
import { findCatalogArticle, knowledgeTopics, topicDepth } from "../../content/catalog";

export function KnowledgeMapPage() {
  const { snapshot } = useLearning();
  return (
    <div className="standard-page">
      <div className="page-intro">
        <p className="eyebrow">系统知识</p>
        <h1>知识地图</h1>
        <p>从语言机制到工程决策，按主题建立完整理解。以下为规划目录，首版每个专题的前两篇已补齐，其余正文按目录继续扩展。</p>
      </div>
      <div className="catalog-note" role="status">
        {knowledgeDomains.length} 个专题 · {knowledgeTopics.length} 个知识单元 · {articles.filter((article) => article.kind === "knowledge").length} 篇教程。首版正文已补齐，后续内容继续扩展。
      </div>
      <div className="domain-grid">
        {knowledgeDomains.map((domain) => (
          <Link className="domain-card" key={domain.id} to={`/knowledge/${domain.slug}`}>
            <span className="domain-id">{domain.id} · {domain.topics.length} 个知识单元</span>
            <h2>{domain.title}</h2>
            <p>{domain.summary}</p>
            <p>已读 {articles.filter((a) => a.domainSlug === domain.slug && snapshot?.state.personal.readings[a.id]?.status === "read").length} / 已发布 {articles.filter((a) => a.domainSlug === domain.slug).length}</p>
            <span className="text-link">查看专题 <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function KnowledgeDomainPage() {
  const { snapshot } = useLearning();
  const { domain: slug } = useParams();
  const domain = findKnowledgeDomain(slug);
  const published = articles.filter((article) => article.kind === "knowledge" && article.domainSlug === slug);

  if (!domain) {
    return (
      <UnavailablePage
        title="没有找到这个专题"
        message="专题地址可能不正确。"
        backTo="/knowledge"
        backLabel="返回知识地图"
      />
    );
  }

  return (
    <div className="standard-page">
      <header className="page-heading">
        <div className="heading-bar">
          <Link className="back-link" to="/knowledge">← 全部知识</Link>
          <p className="eyebrow">{domain.id} · 知识专题</p>
        </div>
        <h1>{domain.title}</h1>
        <p>{domain.summary}</p>
      </header>
      <section className="topic-section">
        <div className="section-title-row">
          <h2>完整知识目录</h2>
          <span>{domain.topics.length} 个知识单元 · {published.length} 篇教程 · 已读 {published.filter((a) => snapshot?.state.personal.readings[a.id]?.status === "read").length}</span>
        </div>
        <ol className="topic-list">
          {domain.topics.map((topic, index) => {
            const article = findCatalogArticle(topic.id);
            return <li id={topic.id} key={topic.id} className="catalog-topic" tabIndex={-1}>
              <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="catalog-topic-main">
                <span className="catalog-topic-meta">{topic.id} · {topicDepth(topic.id)}</span>
                {article ? <Link className="catalog-topic-title" to={articleHref(article)}>{topic.title}</Link> : <span className="catalog-topic-title">{topic.title}</span>}
                <p>{topic.summary}</p>
              </div>
              <span className="topic-status">{article ? snapshot?.state.personal.readings[article.id]?.status === "read" ? "已读" : "正文已补齐" : "待编写"}</span>
            </li>;
          })}
        </ol>
      </section>
      <p className="muted-copy">目录覆盖核心、进阶与拓展；待编写条目先保留学习范围，正文完成后开放阅读。</p>
    </div>
  );
}

export function KnowledgeArticlePage() {
  const { domain, slug } = useParams();
  const article = findArticle("knowledge", slug, domain);
  if (article) return <ArticleView article={article} backTo={`/knowledge/${domain}`} backLabel="返回专题" />;
  return (
    <UnavailablePage
      title="文章尚未发布"
      message="目前只开放知识专题目录。正式文章经过内容审核后会出现在这里。"
      backTo="/knowledge"
      backLabel="返回知识地图"
    />
  );
}
