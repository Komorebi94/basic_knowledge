import { Link } from "react-router";

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
