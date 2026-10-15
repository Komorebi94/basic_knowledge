import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { UnavailablePage } from "../app/pages";
import { ArticleView } from "./ArticleView";
import { loadArticle } from "./loadArticle";
import type { Article } from "./articles";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; article: Article }
  | { status: "missing" }
  | { status: "error" };

function ArticleRoute({
  kind,
  slug,
  domainSlug,
  backTo,
  backLabel,
  missingTitle,
  missingMessage,
  missingBackTo,
  missingBackLabel,
}: {
  kind: Article["kind"];
  slug: string | undefined;
  domainSlug?: string;
  backTo: string;
  backLabel: string;
  missingTitle: string;
  missingMessage: string;
  missingBackTo: string;
  missingBackLabel: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${kind}:${domainSlug ?? ""}:${slug ?? ""}:${attempt}`;
  const [state, setState] = useState<LoadState & { key: string }>({ status: "loading", key: "" });
  const visible: LoadState = state.key === requestKey ? state : { status: "loading" };

  useEffect(() => {
    let active = true;
    loadArticle(kind, slug, domainSlug).then(
      (article) => {
        if (active) setState(article ? { status: "ready", article, key: requestKey } : { status: "missing", key: requestKey });
      },
      () => {
        if (active) setState({ status: "error", key: requestKey });
      },
    );
    return () => {
      active = false;
    };
  }, [domainSlug, kind, requestKey, slug]);

  if (visible.status === "loading") return <p role="status">正在载入文章……</p>;
  if (visible.status === "error") {
    return (
      <section className="empty-panel" role="alert">
        <h1>文章暂时无法载入</h1>
        <p>请检查网络后重新加载。目录和其他已打开的页面不受影响。</p>
        <div className="action-row">
          <button className="button primary" type="button" onClick={() => setAttempt((value) => value + 1)}>重新加载</button>
        </div>
      </section>
    );
  }
  if (visible.status === "missing") {
    return <UnavailablePage title={missingTitle} message={missingMessage} backTo={missingBackTo} backLabel={missingBackLabel} />;
  }
  return <ArticleView article={visible.article} backTo={backTo} backLabel={backLabel} />;
}

export function KnowledgeArticlePage() {
  const { domain, slug } = useParams();
  return (
    <ArticleRoute
      kind="knowledge"
      slug={slug}
      domainSlug={domain}
      backTo={`/knowledge/${domain ?? ""}`}
      backLabel="返回专题"
      missingTitle="文章尚未发布"
      missingMessage="目前只开放知识专题目录。正式文章经过内容审核后会出现在这里。"
      missingBackTo="/knowledge"
      missingBackLabel="返回知识地图"
    />
  );
}

export function AiArticlePage() {
  const { slug } = useParams();
  return (
    <ArticleRoute
      kind="ai"
      slug={slug}
      backTo="/ai"
      backLabel="返回 AI 工程"
      missingTitle="AI 内容尚未发布"
      missingMessage="文章、工作模板和审阅案例正在核验；发布后会从 AI 工程目录进入。"
      missingBackTo="/ai"
      missingBackLabel="返回 AI 工程"
    />
  );
}
