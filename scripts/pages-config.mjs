export function readPagesOrigins(environment) {
  const origins = {};
  for (const name of ["ZHIXU_PARENT_ORIGIN", "VITE_RUNNER_ORIGIN"]) {
    const value = environment[name];
    if (!value) throw new Error(`Cloudflare Pages 构建必须设置 ${name}`);
    let url;
    try { url = new URL(value); } catch { throw new Error(`${name} 必须是有效的 HTTPS origin`); }
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
        !/^[a-z0-9.-]+$/i.test(url.hostname) ||
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.hostname.endsWith(".localhost")) {
      throw new Error(`${name} 必须是独立线上 HTTPS origin，不能包含路径、查询、片段或凭据`);
    }
    origins[name] = url.origin;
  }
  if (origins.ZHIXU_PARENT_ORIGIN === origins.VITE_RUNNER_ORIGIN) {
    throw new Error("主站与运行器必须使用不同 origin，不能通过同域名下的路径隔离");
  }
  return origins;
}
