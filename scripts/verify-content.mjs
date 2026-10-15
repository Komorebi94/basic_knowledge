import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.ZHIXU_MAIN_ORIGIN ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  const dialogs = [];
  page.on("dialog", async (dialog) => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/knowledge/javascript`, { waitUntil: "networkidle" });
  const contentIssues = await page.evaluate(async () => {
    const { articles, articleHref } = await import("/src/content/articles.ts");
    const ids = new Set();
    const hrefs = new Set();
    const issues = [];
    for (const article of articles) {
      const href = articleHref(article);
      if (ids.has(article.id)) issues.push(`重复 ID: ${article.id}`);
      if (hrefs.has(href)) issues.push(`重复路径: ${href}`);
      ids.add(article.id);
      hrefs.add(href);
      if (!article.title || article.title.includes("面试") || !article.summary || article.sections.length < 4) issues.push(`元数据不完整: ${article.id}`);
      const headings = new Set();
      for (const section of article.sections) {
        if (headings.has(section.id) || !/^[a-z0-9-]+$/.test(section.id)) issues.push(`章节锚点无效: ${article.id}`);
        headings.add(section.id);
      }
      if (article.sources.length === 0 || article.sources.some((source) => !/^https:\/\//.test(source.url))) issues.push(`来源链接无效: ${article.id}`);
    }
    return issues;
  });
  assert.deepEqual(contentIssues, []);
  await page.getByRole("link", { name: "作用域、闭包与生命周期" }).click();
  await page.getByRole("heading", { name: "作用域、闭包与生命周期" }).waitFor();
  assert.equal(new URL(page.url()).pathname, "/knowledge/javascript/closures");
  assert.equal(await page.getByText("本页目录", { exact: true }).count(), 0);
  assert.equal(await page.getByRole("heading", { name: "来源与核验" }).count(), 0);
  assert.equal(await page.locator(".note-editor").count(), 0);
  assert.equal(await page.locator(".article-section").count(), 16);
  assert.equal(await page.locator("#recall-cards").count(), 1);
  assert.equal(await page.locator("#related-exercises").count(), 1);
  await page.goto(`${origin}/knowledge/javascript/closures#application`, { waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).hash, "#application");
  assert.equal(await page.locator("#application").evaluate((element) => document.activeElement === element), true);

  await page.goto(`${origin}/search?q=closure`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /作用域、闭包与生命周期/ }).waitFor();
  await page.goto(`${origin}/search?q=${encodeURIComponent("备用值")}`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /作用域、闭包与生命周期/ }).waitFor();
  await page.goto(`${origin}/search?q=%E9%97%AD%E5%8C%85`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /作用域、闭包与生命周期/ }).waitFor();
  await page.goto(`${origin}/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "“<script>alert(1)</script>”的搜索结果", exact: true }).waitFor();
  assert.deepEqual(dialogs, [], "搜索输入必须作为文字，不能执行脚本");

  await page.goto(`${origin}/ai`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /让 AI 写代码：先约定任务合同/ }).click();
  await page.getByRole("heading", { name: "让 AI 写代码：先约定任务合同" }).waitFor();

  const routes = await page.evaluate(async () => {
    const { articles, articleHref } = await import("/src/content/articles.ts");
    return articles.map((article) => ({ href: articleHref(article), title: article.title, outputs: article.sections.flatMap(section => (section.examples ?? []).map(example => example.expectedOutput.length > 0 ? example.expectedOutput.join("\n") : "（无控制台输出）")) }));
  });
  for (const article of routes) {
    await page.goto(origin + article.href + "#problem", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: article.title, exact: true }).waitFor();
    assert.equal(await page.locator("#problem").evaluate((element) => document.activeElement === element), true);
    assert.equal(await page.locator(".note-editor, .article-toc, .article-mobile-toc, .article-sources").count(), 0);
    assert.deepEqual(await page.locator(".example-output code").allTextContents(), article.outputs, `${article.href}: complete expected output must be visible`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const article of routes) {
    await page.goto(origin + article.href, { waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, article.href);
  }
  assert.deepEqual(errors, []);
  console.log("Content routes, search, anchors and mobile width verified in Chrome");
} finally {
  await browser.close();
}
