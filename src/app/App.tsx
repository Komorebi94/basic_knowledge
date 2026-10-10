import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Link } from "react-router";
import { Layout } from "./Layout";
import { HomePage, NotFoundPage } from "./pages";
const KnowledgeMapPage = lazy(() => import("../features/knowledge/KnowledgePages").then((m) => ({default:m.KnowledgeMapPage})));
const KnowledgeDomainPage = lazy(() => import("../features/knowledge/KnowledgePages").then((m) => ({default:m.KnowledgeDomainPage})));
const KnowledgeArticlePage = lazy(() => import("../features/knowledge/KnowledgePages").then((m) => ({default:m.KnowledgeArticlePage})));
const PracticeListPage = lazy(() => import("../features/practice/PracticePages").then((m) => ({default:m.PracticeListPage})));
const PracticeWorkspacePage = lazy(() => import("../features/practice/PracticePages").then((m) => ({default:m.PracticeWorkspacePage})));
const AiHomePage = lazy(() => import("../features/ai/AiPages").then((m) => ({default:m.AiHomePage})));
const AiArticlePage = lazy(() => import("../features/ai/AiPages").then((m) => ({default:m.AiArticlePage})));
const ReviewPlanPage = lazy(() => import("../features/review/ReviewPages").then((m) => ({default:m.ReviewPlanPage})));
const ReviewSessionPage = lazy(() => import("../features/review/ReviewPages").then((m) => ({default:m.ReviewSessionPage})));
const PersonalPage = lazy(() => import("../features/personal/PersonalPage").then((m) => ({default:m.PersonalPage})));
const SettingsPage = lazy(() => import("../features/personal/DataSettingsPage").then((m) => ({default:m.DataSettingsPage})));
const SearchPage = lazy(() => import("./SearchPage").then((m) => ({default:m.SearchPage})));
function page(child:ReactNode) { return <Suspense fallback={<p role="status">正在载入页面……</p>}>{child}</Suspense>; }
function RouteFailure() {
  return <section className="empty-panel" role="alert"><h1>页面暂时无法载入</h1><p>请检查网络后重新加载。已保存的个人记录仍在本地。</p><div className="action-row"><button className="button primary" onClick={() => window.location.reload()}>重新加载</button><Link className="button secondary" to="/">返回总览</Link></div></section>;
}
const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<Layout />} errorElement={<RouteFailure />}>
    <Route index element={<HomePage />} />
    <Route path="knowledge" element={page(<KnowledgeMapPage />)} />
    <Route path="knowledge/:domain" element={page(<KnowledgeDomainPage />)} />
    <Route path="knowledge/:domain/:slug" element={page(<KnowledgeArticlePage />)} />
    <Route path="practice" element={page(<PracticeListPage />)} />
    <Route path="practice/:slug" element={page(<PracticeWorkspacePage />)} />
    <Route path="ai" element={page(<AiHomePage />)} />
    <Route path="ai/:slug" element={page(<AiArticlePage />)} />
    <Route path="review" element={page(<ReviewPlanPage />)} />
    <Route path="review/session/:sessionId" element={page(<ReviewSessionPage />)} />
    <Route path="me" element={page(<PersonalPage />)} />
    <Route path="settings" element={page(<SettingsPage />)} />
    <Route path="search" element={page(<SearchPage />)} />
    <Route path="*" element={<NotFoundPage />} />
  </Route>
));
export function App() { return <RouterProvider router={router} />; }
