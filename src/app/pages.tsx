import { Link } from "react-router";
import catalog from "../content/catalog.json";
const {ai:aiTopics,practice:exerciseTopics,knowledge:knowledgeTopics} = catalog;
import publicMetadata from "../content/publicMetadata.json";
import { HomeLearningSummary } from "../features/personal/HomeLearningSummary";

const learningPaths = [
  {
    title: "基础与运行机制",
    description: "理解语言、异步与浏览器。",
    to: "/knowledge/javascript",
    detail: "从值、引用与相等性开始",
  },
  {
    title: "工程质量",
    description: "让行为正确，让变更可验证。",
    to: "/knowledge/testing",
    detail: "从测试边界开始",
  },
  {
    title: "AI 协作实践",
    description: "交付任务、审阅改动、验证结果。",
    to: "/ai",
    detail: "先查看完整学习路线",
  },
] as const;

export function UnavailablePage({
  title,
  message,
  backTo,
  backLabel,
}: {
  title: string;
  message: string;
  backTo: string;
  backLabel: string;
}) {
  return (
    <section className="empty-panel">
      <span className="eyebrow">内容准备中</span>
      <h1>{title}</h1>
      <p>{message}</p>
      <Link className="button primary" to={backTo}>{backLabel} <span aria-hidden="true">→</span></Link>
    </section>
  );
}

export function HomePage() {
  return (
    <div className="home-page">
      <div className="page-intro">
        <p className="date-line">个人技术知识库</p>
        <h1>今天，巩固一点。</h1>
        <p>从一条清晰的学习路径开始，逐步建立可以复用的理解。</p>
      </div>

      <div className="home-grid">
        <section className="hero-panel">
          <span className="pill">从这里开始</span>
          <h2>先认识整张知识地图</h2>
          <p>16 个专题、{knowledgeTopics.length} 个知识单元，覆盖语言机制、浏览器、框架、工程质量与系统设计。完整目录已建立，正文逐步补充。</p>
          <Link className="button primary" to="/knowledge">浏览知识地图 <span aria-hidden="true">→</span></Link>
        </section>
        <section className="status-panel">
          <h2>内容进度</h2>
          <div className="status-number">{publicMetadata.articles.filter((article) => article.kind === "knowledge").length} <span>篇知识教程</span></div>
          <p>{publicMetadata.articles.filter((article) => article.kind === "ai").length} 篇 AI 教程、{publicMetadata.exercises.length} 道完整练习题面已补齐。规划共 {exerciseTopics.length} 道练习、{aiTopics.length} 个 AI 单元。笔记可以本地保存。</p>
        </section>
      </div>

      <HomeLearningSummary />
      <section className="section-block">
        <div className="section-title-row">
          <h2>沿着一条路径，慢慢补全</h2>
        </div>
        <div className="path-grid">
          {learningPaths.map((path) => (
            <Link className="path-card" key={path.title} to={path.to}>
              <h3>{path.title}</h3>
              <p>{path.description}</p>
              <span>{path.detail} <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block">
        <h2>这片空间会如何工作</h2>
        <div className="process-list" aria-label="学习流程">
          {["读懂原理", "主动回忆", "动手验证", "留下复盘"].map((step, index) => (
            <div className="process-step" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
        <p className="muted-copy">阅读、卡片评分与练习独立完成分别记录；可以从我的积累回看薄弱点与历史。</p>
      </section>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <section className="empty-panel">
      <span className="eyebrow">页面未找到</span>
      <h1>这里暂时没有内容</h1>
      <p>路径可能已更新，也可能尚未发布。可以回到知识地图继续浏览。</p>
      <Link className="button primary" to="/knowledge">查看知识地图 <span aria-hidden="true">→</span></Link>
    </section>
  );
}
