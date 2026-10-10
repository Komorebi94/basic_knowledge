import { useLearning } from "../personal/useLearning";
import { UnavailablePage } from "../../app/pages";
import { Link, useParams } from "react-router";
import { ArticleView } from "../../content/ArticleView";
import { articleHref, findArticle } from "../../content/articles";
import { aiCategories, aiTopics, findCatalogArticle } from "../../content/catalog";

const steps = ["明确需求", "整理上下文", "制定方案", "小步实现", "独立验证", "审阅改动", "交付复盘"] as const;
const publishedAiArticles = aiTopics.flatMap((topic) => {
  const article = findCatalogArticle(topic.id);
  return article?.kind === "ai" ? [article] : [];
});

export function AiHomePage() {
  const { snapshot } = useLearning();
  return (
    <div className="standard-page">
      <div className="page-intro">
        <p className="eyebrow">AI 工程</p>
        <h1>让 AI 参与实现，也让过程可检查。</h1>
        <p>从需求与上下文出发，经过实现、验证和审阅，留下可复核的交付证据。</p>
      </div>
      <section className="topic-section">
        <div className="section-title-row"><h2>已开放内容</h2><span>{publishedAiArticles.length} 篇</span></div>
        <div className="domain-grid">{publishedAiArticles.map((article) => (
          <Link className="domain-card" to={articleHref(article)} key={article.id}>
            <span className="domain-id">{article.catalogId ?? article.id}</span><h3>{article.title}</h3><p>{article.summary}</p><span className="text-link">开始阅读 →</span>
          </Link>
        ))}</div>
      </section>
      <section className="topic-section">
        <h2>协作流程</h2>
        <div className="ai-steps">
          {steps.map((step, index) => (
            <div className="ai-step" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>
      <div className="catalog-note">完整目录：{aiTopics.length} 个知识单元，覆盖基础、协作、审阅、权限、工具与应用工程。</div>
      {aiCategories.map((category) => (
        <section className="topic-section" key={category.id}>
          <div className="section-title-row"><h2>{category.title}</h2><span>{category.ids.length} 个单元</span></div>
          <ol className="topic-list">
            {aiTopics.filter((topic) => category.ids.some((id) => id === topic.id)).map((topic) => {
              const article = findCatalogArticle(topic.id);
              return <li className="catalog-topic" id={topic.id} key={topic.id} tabIndex={-1}>
                <span className="topic-index">{topic.id}</span>
                <div className="catalog-topic-main">
                  {article ? <Link className="catalog-topic-title" to={articleHref(article)}>{topic.title}</Link> : <span className="catalog-topic-title">{topic.title}</span>}
                  <p>{topic.summary}</p><p className="catalog-deliverable">实践目标：{topic.deliverable}</p>
                </div>
                <span className="topic-status">{article ? snapshot?.state.personal.readings[article.id]?.status === "read" ? "已读" : "正文已补齐" : "待编写"}</span>
              </li>;
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function AiArticlePage() {
  const { slug } = useParams();
  const article = findArticle("ai", slug);
  if (article) return <ArticleView article={article} backTo="/ai" backLabel="返回 AI 工程" />;
  return (
    <UnavailablePage
      title="AI 内容尚未发布"
      message="文章、工作模板和审阅案例正在核验；发布后会从 AI 工程目录进入。"
      backTo="/ai"
      backLabel="返回 AI 工程"
    />
  );
}
