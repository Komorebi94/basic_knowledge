import { type FormEvent, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useLearning } from "../features/personal/useLearning";

const navigation = [
  { label: "知识地图", to: "/knowledge" },
  { label: "动手练习", to: "/practice" },
  { label: "AI 工程", to: "/ai" },
] as const;

export function Layout() {
  const { snapshot } = useLearning();
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.hash) return;
    let id: string;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const entry = document.getElementById(id);
    if (entry instanceof HTMLElement) {
      entry.scrollIntoView({ block: "center" });
      entry.focus({ preventScroll: true });
    }
  }, [location.pathname, location.hash]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) return;
    navigate(`/search?q=${encodeURIComponent(normalized)}`);
  }

  return (
    <div className={`app-shell${snapshot?.state.personal.preferences.bodySize === "large" ? " large-body" : ""}`}>
      <a className="skip-link" href="#main-content">跳到正文</a>
      <header className="site-header">
        <div className="site-header-bar">
          <NavLink className="brand" to="/knowledge" aria-label="知序，返回知识地图">
            <span className="brand-mark" aria-hidden="true">知</span>
            <span className="brand-name">知序</span>
          </NavLink>
          <nav className="site-nav" aria-label="主导航">
            {navigation.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <form className="header-search" role="search" onSubmit={submitSearch}>
            <label className="visually-hidden" htmlFor="site-search">搜索知识、练习与 AI</label>
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder="搜索知识、练习、AI 或英文别名"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" aria-label="搜索">搜索</button>
          </form>
        </div>
      </header>
      <main id="main-content" className="page-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
