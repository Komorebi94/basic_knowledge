import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import type { Article } from "./articles";
import { CodeBlock } from "./CodeBlock";
import { cardsForContent, exercisesForContent, reviewCases } from "./learningContent";
import { ArticleLearningTools } from "../features/personal/ArticleLearningTools";

export function ArticleView({ article, backTo, backLabel }: { article: Article; backTo: string; backLabel: string }) {
  const location = useLocation();
  const cards = cardsForContent(article.id);
  const exercises = exercisesForContent(article.catalogId ?? article.id);
  const cases = reviewCases.filter((item) => item.catalogId === (article.catalogId ?? article.id));

  useEffect(() => {
    let id: string;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    if (!id) return;
    const heading = document.getElementById(id);
    if (heading instanceof HTMLElement) {
      heading.scrollIntoView();
      heading.focus({ preventScroll: true });
    }
  }, [location.hash, article.id]);

  return (
    <div className="article-layout">
      <article className="article-body">
        <header className="article-header">
          <div className="heading-bar">
            <Link className="back-link" to={backTo}>← {backLabel}</Link>
            <p className="eyebrow">{article.kind === "ai" ? "AI 工程" : "系统知识"} · {article.catalogId ?? article.id} · 约 {article.estimatedMinutes} 分钟</p>
          </div>
          <h1>{article.title}</h1>
          <p className="article-lead">{article.summary}</p>
        </header>
        <ArticleLearningTools key={article.id} article={article} />

        {article.sections.map((section) => (
          <section className="article-section" key={section.id} aria-labelledby={section.id}>
            <h2 id={section.id} tabIndex={-1}>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.code && <CodeBlock code={section.code} />}
            {section.examples?.map((example) => <div className="article-example" key={example.code}>
              <CodeBlock code={example.code} />
              {example.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>)}
            {section.diagram && <figure className="article-diagram">
              <figcaption>{section.diagram.caption}</figcaption>
              <pre>{section.diagram.lines.join("\n")}</pre>
            </figure>}
          </section>
        ))}

        {cases.map((item) => <section className="article-section" key={item.title}>
          <h2>{item.title}</h2>
          <p>{item.brief}</p>
          <CodeBlock code={item.excerpt} />
          <ol>{item.questions.map((question) => <li key={question}>{question}</li>)}</ol>
          <p>先写下你的判断，再展开参考。可在「我的积累」中保存这篇文章的审阅笔记。</p>
          <details className="learning-disclosure"><summary>查看参考问题与自评尺度</summary>
            <ul>{item.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul>
            <p>按定位问题、解释触发条件、说明影响、提出验证办法四项自评：每项 0 分为未说明，1 分为部分说明，2 分为准确且有证据。自评不替代实际验证。</p>
            <ul>{item.rubric.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
          </details>
        </section>)}

        {cards.length > 0 && <section className="article-section" aria-labelledby="recall-cards">
          <h2 id="recall-cards" tabIndex={-1}>合上正文，试着回答</h2>
          <p>先独立回忆，再展开核对。这里展开答案不会计入完成；加入复习后，在复习会话中评分才会安排下次时间。</p>
          {cards.map((card) => <details className="learning-disclosure" key={card.cardId}>
            <summary>{card.question}</summary>
            <ul>{card.answerPoints.map((point) => <li key={point}>{point}</li>)}</ul>
            <p>容易忽略：{card.pitfalls.join("；")}</p>
            <Link className="text-link" to={`#${card.sourceHeadingId}`}>回看对应讲解 →</Link>
          </details>)}
        </section>}

        {exercises.length > 0 && <section className="article-section" aria-labelledby="related-exercises">
          <h2 id="related-exercises" tabIndex={-1}>用练习验证理解</h2>
          <ul>{exercises.map((exercise) => <li key={exercise.id}><Link to={`/practice/${exercise.slug}`}>{exercise.id} · {exercise.title}</Link></li>)}</ul>
        </section>}

      </article>
    </div>
  );
}
