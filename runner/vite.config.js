import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { framePolicy, workerPolicy, runnerPagesHeaders } from "./security.js";

const runnerRoot = fileURLToPath(new URL(".", import.meta.url));
const parentUrl = new URL(process.env.ZHIXU_PARENT_ORIGIN ?? "http://127.0.0.1:5173");
if (!['http:', 'https:'].includes(parentUrl.protocol) || parentUrl.username || parentUrl.password ||
    parentUrl.pathname !== '/' || parentUrl.search || parentUrl.hash ||
    (!/^[a-z0-9.-]+$/i.test(parentUrl.hostname) && parentUrl.hostname !== '[::1]')) {
  throw new Error("ZHIXU_PARENT_ORIGIN 必须是无路径、查询、片段或凭据的 HTTP(S) origin");
}
const parentOrigin = parentUrl.origin;

function isWorkerScript(url) {
  return /^\/(?:worker\.js|assets\/worker-[^/]+\.js)(?:\?|$)/.test(url ?? "");
}

function securityHeaders() {
  return {
    name: "runner-security-headers",
    generateBundle(_options, bundle) {
      const workerPaths = Object.keys(bundle).map((path) => `/${path}`).filter(isWorkerScript);
      this.emitFile({ type: "asset", fileName: "_headers", source: runnerPagesHeaders(parentOrigin, workerPaths) });
      // The runner only serves its root entry; unknown paths must not load a CSP-free SPA shell.
      this.emitFile({ type: "asset", fileName: "404.html", source: '<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><title>地址不存在</title><p>运行环境地址不存在。</p></html>' });
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        response.setHeader(
          "Content-Security-Policy",
          isWorkerScript(request.url) ? workerPolicy : framePolicy(parentOrigin),
        );
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Referrer-Policy", "no-referrer");
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        response.setHeader(
          "Content-Security-Policy",
          isWorkerScript(request.url) ? workerPolicy : framePolicy(parentOrigin),
        );
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Referrer-Policy", "no-referrer");
        next();
      });
    },
  };
}

export default defineConfig({
  root: runnerRoot,
  publicDir: false,
  plugins: [securityHeaders()],
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: "../dist-runner",
    emptyOutDir: true,
  },
  define: {
    __PARENT_ORIGIN__: JSON.stringify(parentOrigin),
  },
});
