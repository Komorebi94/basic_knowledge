import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { readPagesOrigins } from "./pages-config.mjs";
import { framePolicy, workerPolicy } from "../runner/security.js";

const valid = { ZHIXU_PARENT_ORIGIN: "https://main.example.com", VITE_RUNNER_ORIGIN: "https://runner.example.com" };
assert.deepEqual(readPagesOrigins(valid), valid);
assert.deepEqual(readPagesOrigins({ ...valid, ZHIXU_PARENT_ORIGIN: "https://MAIN.example.com:443/" }), valid);
for (const name of Object.keys(valid)) {
  for (const value of [undefined, "", "invalid", "http://example.com", "https://localhost", "https://127.0.0.1",
    "https://[::1]", "https://dev.localhost", "https://user:password@example.com", "https://example.com/runner",
    "https://example.com?x=1", "https://example.com#section", "https://example.com;script-src"]) {
    assert.throws(() => readPagesOrigins({ ...valid, [name]: value }), undefined, `${name}: ${value}`);
  }
}
assert.throws(() => readPagesOrigins({ ...valid, VITE_RUNNER_ORIGIN: "https://MAIN.example.com:443/" }), /不同 origin/);

export function parseHeaders(source) {
  const rules = [];
  let current;
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    assert.ok(line.length <= 2000, "Pages 响应头超过单行限制");
    if (!/^\s/.test(line)) {
      current = { path: line, headers: {} };
      rules.push(current);
    } else {
      assert.ok(current);
      const separator = line.indexOf(":");
      assert.ok(separator > 0);
      const name = line.slice(0, separator).trim().toLowerCase();
      assert.ok(!(name in current.headers), "同一规则重复定义响应头");
      current.headers[name] = line.slice(separator + 1).trim();
    }
  }
  assert.ok(rules.length <= 100, "Pages 响应头超过规则数量限制");
  return rules;
}

export function headersFor(rules, path) {
  const headers = {};
  for (const rule of rules) {
    if (!(rule.path === path || (rule.path.endsWith("*") && path.startsWith(rule.path.slice(0, -1))))) continue;
    for (const [name, value] of Object.entries(rule.headers)) {
      assert.ok(!(name in headers), `${path} 的 ${name} 匹配到重复规则，会被 Pages 合并`);
      headers[name] = value;
    }
  }
  return headers;
}

const mainRules = parseHeaders(await readFile("dist/_headers", "utf8"));
const runnerRules = parseHeaders(await readFile("dist-runner/_headers", "utf8"));
await assert.rejects(access("dist/404.html"), { code: "ENOENT" });
await access("dist-runner/404.html");
const parentOrigin = new URL(process.env.ZHIXU_PARENT_ORIGIN ?? "http://127.0.0.1:5173").origin;
for (const path of ["/", "/index.html"]) {
  assert.equal(headersFor(runnerRules, path)["content-security-policy"], framePolicy(parentOrigin));
}
const workerRules = runnerRules.filter((rule) => rule.path.startsWith("/assets/worker-") && rule.path.endsWith(".js"));
assert.equal(workerRules.length, 1);
for (const rule of workerRules) {
  await access(`dist-runner${rule.path}`);
  assert.equal(headersFor(runnerRules, rule.path)["content-security-policy"], workerPolicy);
}
for (const path of ["/", "/knowledge/javascript/closures", "/assets/index-test.js"]) {
  assert.equal(headersFor(mainRules, path)["x-frame-options"], "DENY");
}
console.log("Pages: HTTPS/origin validation, SPA artifacts, document/Worker CSP and non-overlapping headers passed.");
