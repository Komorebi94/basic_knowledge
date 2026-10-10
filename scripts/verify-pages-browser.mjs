import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { parseHeaders, headersFor } from "./verify-pages.mjs";

const mainOrigin = process.env.ZHIXU_MAIN_ORIGIN ?? "http://127.0.0.1:5173";
const runnerOrigin = process.env.ZHIXU_RUNNER_ORIGIN ?? "http://127.0.0.1:5174";
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };
const servers = [];
let browser;

async function serve(directory, origin, spa) {
  const url = new URL(origin);
  assert.equal(url.hostname, "127.0.0.1", "本地部署验证只允许监听 127.0.0.1");
  const root = resolve(directory);
  const rules = parseHeaders(await readFile(resolve(root, "_headers"), "utf8"));
  const server = createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, origin).pathname);
      let file = resolve(root, `.${path === "/" ? "/index.html" : path}`);
      if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
      let content;
      try { content = await readFile(file); } catch (error) {
        if (error.code !== "ENOENT") throw error;
        file = resolve(root, spa ? "index.html" : "404.html");
        content = await readFile(file);
        response.statusCode = spa ? 200 : 404;
      }
      for (const [name, value] of Object.entries(headersFor(rules, path))) response.setHeader(name, value);
      response.setHeader("Content-Type", mime[extname(file)] ?? "application/octet-stream");
      response.end(content);
    } catch {
      response.writeHead(500).end("Local deployment verification failed");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(Number(url.port), url.hostname, resolve);
  });
  servers.push(server);
}

try {
  await serve("dist", mainOrigin, true);
  await serve("dist-runner", runnerOrigin, false);
  browser = await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH, headless: true }
    : { channel: "chrome", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`${mainOrigin}/knowledge/javascript/closures#closure`);
  assert.equal(response.status(), 200);
  await page.getByRole("heading", { name: "作用域、闭包与生命周期", exact: true }).waitFor();
  await page.locator("#closure").waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "作用域、闭包与生命周期", exact: true }).waitFor();
  assert.equal(new URL(page.url()).hash, "#closure");
  assert.deepEqual(errors, []);
  assert.equal((await fetch(`${runnerOrigin}/missing`)).status, 404);
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/verify-runner.mjs"], {
      env: { ...process.env, ZHIXU_MAIN_ORIGIN: mainOrigin, ZHIXU_RUNNER_ORIGIN: runnerOrigin },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`运行隔离验证失败：${code}`)));
  });
  console.log("Pages local simulation: article deep link, refresh, chapter anchor, runner 404 and Chrome isolation passed. Cloudflare edge deployment remains unverified.");
} finally {
  if (browser) await browser.close();
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
}
