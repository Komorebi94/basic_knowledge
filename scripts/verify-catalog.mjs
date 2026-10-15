import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.ZHIXU_MAIN_ORIGIN ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin, { waitUntil: "networkidle" });
  const catalog = await page.evaluate(async () => {
    const { knowledgeTopics, aiTopics, exerciseTopics, aiCategories } = await import("/src/content/catalog.ts");
    const { knowledgeDomains } = await import("/src/features/knowledge/catalog.ts");
    const { publicSearchDocuments } = await import("/src/content/searchDocuments.ts");
    return {
      knowledge: knowledgeTopics.length, ai: aiTopics.length, exercises: exerciseTopics.length,
      categories: aiCategories.flatMap((category) => category.ids),
      searchCount: publicSearchDocuments.length,
      searchUnique: new Set(publicSearchDocuments.map((document) => document.id)).size,
      domains: knowledgeDomains.map((domain) => ({ slug: domain.slug, count: domain.topics.length })),
    };
  });
  assert.deepEqual([catalog.knowledge, catalog.exercises, catalog.ai], [128, 40, 20]);
  assert.equal(catalog.domains.length, 16);
  assert.equal(new Set(catalog.categories).size, 20);
  assert.equal(catalog.categories.length, 20);
  assert.equal(catalog.searchCount, 204);
  assert.equal(catalog.searchUnique, 204);
  for (const domain of catalog.domains) {
    assert.equal(domain.count, 8);
    await page.goto(`${origin}/knowledge/${domain.slug}`, { waitUntil: "networkidle" });
    assert.equal(await page.locator(".catalog-topic").count(), 8);
  }
  await page.goto(`${origin}/ai`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".catalog-topic").count(), 20);
  assert.equal(await page.locator("#AI01 a").getAttribute("href"), "/ai/llm-foundations");
  assert.equal(await page.locator("#AI02 a").getAttribute("href"), "/ai/task-contract");
  await page.goto(`${origin}/practice`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".practice-row").count(), 40);

  for (const [query, href, heading = query] of [
    ["联合类型与状态建模", "/knowledge/typescript/discriminated-state"],
    ["模型升级后重新评估工作流", "/ai/workflow-upgrade-evaluation"],
    ["依赖图拓扑排序", "/practice/dependency-topo-sort"],
    ["useAsyncResource", "/practice/async-resource", "异步资源状态模型"],
  ]) {
    await page.goto(`${origin}/search?q=${encodeURIComponent(query)}`, { waitUntil: "networkidle" });
    await page.locator(`a[href='${href}']`).click();
    assert.equal(new URL(page.url()).pathname + new URL(page.url()).hash, href);
    if (href.includes("#")) {
      assert.equal(await page.locator("#E35").evaluate((element) => document.activeElement === element), true);
    } else {
      await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/knowledge/javascript", "/ai", "/practice"]) {
    await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route);
  }
  assert.deepEqual(errors, []);
  console.log("Full catalog verified: 16 domains / 128 knowledge / 40 practice / 20 AI, search anchors and mobile layouts");
} finally {
  await browser.close();
}
