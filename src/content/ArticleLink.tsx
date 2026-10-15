import type { ReactNode } from "react";
import { Link } from "react-router";
import type { CatalogArticle } from "./catalog";
import { loadArticle } from "./loadArticle";

export function ArticleLink({ article, className, children }: { article: CatalogArticle; className?: string; children: ReactNode }) {
  function prefetch() {
    void loadArticle(article.kind, article.slug, article.domainSlug).catch(() => undefined);
  }

  return <Link className={className} to={article.href} onFocus={prefetch} onMouseEnter={prefetch}>{children}</Link>;
}
