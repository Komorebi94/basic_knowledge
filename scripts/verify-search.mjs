import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.ZHIXU_MAIN_ORIGIN ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  await page.goto(origin, { waitUntil: "networkidle" });
  const result = await page.evaluate(async () => {
    const { searchDocuments } = await import("/src/infrastructure/search/search.ts");
    const documents = [
      { id: "closure", type: "knowledge", title: "作用域与闭包", aliases: ["closure"], tags: ["JavaScript"], headings: ["词法环境"], summary: "解释函数如何保留外层变量", body: "示例与边界", importance: 3, order: 1, href: "/knowledge/javascript/closure" },
      { id: "event-loop", type: "knowledge", title: "任务与微任务", aliases: ["event loop"], tags: ["浏览器"], headings: ["队列"], summary: "事件循环与渲染", body: "执行顺序", importance: 2, order: 2, href: "/knowledge/async/event-loop" },
      { id: "xss", type: "knowledge", title: "输出安全", aliases: [], tags: ["安全"], headings: ["HTML 净化"], summary: "安全输出", body: "脚本标签作为文字处理", importance: 1, order: 3, href: "/knowledge/security/output" },
      { id: "K03-02", type: "knowledge", title: "联合类型与状态建模", aliases: [], tags: [], headings: [], summary: "请求状态", body: "", importance: 2, order: 4, href: "/knowledge/typescript/discriminated-state" },
    ];
    return {
      chinese: searchDocuments(documents, "闭包").map(({ document }) => document.id),
      english: searchDocuments(documents, "CLOSURE").map(({ document }) => document.id),
      fullWidth: searchDocuments(documents, "ＣＬＯＳＵＲＥ").map(({ document }) => document.id),
      phrase: searchDocuments(documents, "event loop").map(({ document }) => document.id),
      malicious: searchDocuments(documents, "<script>alert(1)</script>").map(({ document }) => document.id),
      empty: searchDocuments(documents, " ").length,
      idLookup: searchDocuments(documents, "K03-02").map(({ document }) => document.id),
      fullWidthId: searchDocuments(documents, "Ｋ０３－０２").map(({ document }) => document.id),
    };
  });
  assert.deepEqual(result.chinese, ["closure"]);
  assert.deepEqual(result.english, ["closure"]);
  assert.deepEqual(result.fullWidth, ["closure"]);
  assert.deepEqual(result.phrase, ["event-loop"]);
  assert.deepEqual(result.malicious, []);
  assert.equal(result.empty, 0);
  assert.deepEqual(result.idLookup, ["K03-02"]);
  assert.deepEqual(result.fullWidthId, ["K03-02"]);
  console.log("Chinese and English search verified in Chrome:", result);
} finally {
  await browser.close();
}
