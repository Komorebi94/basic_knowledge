import { type FormEvent, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useLearning } from "../features/personal/useLearning";

const navigation = [
  { label: "总览", to: "/", number: "01" },
  { label: "知识地图", to: "/knowledge", number: "02" },
  { label: "动手练习", to: "/practice", number: "03" },
  { label: "AI 工程", to: "/ai", number: "04" },
  { label: "复习计划", to: "/review", number: "05" },
  { label: "我的积累", to: "/me", number: "06" },
] as const;

const mobileNavigation = navigation.filter(({ to }) =>
  ["/", "/knowledge", "/practice", "/me"].includes(to),
);

function NavigationLinks({ closeMenu }: { closeMenu?: () => void }) {
  return (
    <>
      {navigation.map(({ label, to, number }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={closeMenu}
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          <span className="nav-number" aria-hidden="true">{number}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  );
}

function getSectionLabel(pathname: string) {
  const section = navigation.find(({ to }) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`),
  );
  if (section) return section.label;
  if (pathname === "/search") return "搜索";
  if (pathname === "/settings") return "设置与数据";
  return "页面";
}

export function Layout() {
  const { snapshot } = useLearning();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isReading = /^\/knowledge\/[^/]+\/[^/]+\/?$/.test(location.pathname) || /^\/ai\/[^/]+\/?$/.test(location.pathname);

  useEffect(() => {
    if (isReading || !location.hash) return;
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
  }, [isReading, location.pathname, location.hash]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) return;
    setMenuOpen(false);
    navigate(`/search?q=${encodeURIComponent(normalized)}`);
  }

  return (
    <div className={`app-shell${isReading ? " reading-mode" : ""}${snapshot?.state.personal.preferences.bodySize === "large" ? " large-body" : ""}`}>
      <a className="skip-link" href="#main-content">跳到正文</a>
      <aside className="sidebar">
        <NavLink className="brand" to="/" aria-label="知序，返回总览">
          <span className="brand-mark" aria-hidden="true">知</span>
          <span className="brand-name">知序</span>
        </NavLink>
        <p className="brand-subtitle">个人技术知识库</p>
        <nav aria-label="主导航" className="side-navigation">
          <NavigationLinks />
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/settings" className="settings-link">设置与数据</NavLink>
          <p>学习记录功能正在建设</p>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-header">
            <NavLink className="brand compact" to="/" aria-label="知序，返回总览">
              <span className="brand-mark" aria-hidden="true">知</span>
              <span className="brand-name">知序</span>
            </NavLink>
            <button
              className="menu-toggle"
              type="button"
              aria-controls="mobile-menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? "关闭目录" : "目录"}
            </button>
          </div>
          <span className="breadcrumb">工作空间 / {getSectionLabel(location.pathname)}</span>
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
        </header>
        {menuOpen && (
          <nav id="mobile-menu" className="mobile-menu" aria-label="移动端完整导航">
            <NavigationLinks closeMenu={() => setMenuOpen(false)} />
            <NavLink to="/settings" onClick={() => setMenuOpen(false)} className="nav-link">
              <span className="nav-number" aria-hidden="true">07</span>
              <span>设置与数据</span>
            </NavLink>
          </nav>
        )}
        <main id="main-content" className="page-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="常用页面">
        {mobileNavigation.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `mobile-bottom-link${isActive ? " active" : ""}`}
          >
            {label === "我的积累" ? "我的" : label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
