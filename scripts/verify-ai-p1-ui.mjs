import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.ZHIXU_MAIN_ORIGIN ?? "http://127.0.0.1:5173";
const ids = ["AI13", "AI14", "AI17", "AI18"];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = { verifiedAt: new Date().toISOString(), browser: browser.version(), origin, articles: [], pageErrors: [] };
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("pageerror", error => report.pageErrors.push(error.message));
  await page.goto(`${origin}/ai`, { waitUntil: "networkidle" });
  assert.deepEqual(await page.locator(".domain-grid .domain-id").allTextContents(), Array.from({ length: 20 }, (_, index) => `AI${String(index + 1).padStart(2, "0")}`), "Published AI articles follow catalog order");
  assert.equal(await page.locator(".catalog-topic").count(), 20);
  assert.equal(await page.getByText("待编写", { exact: true }).count(), 0);
  const content = await page.evaluate(async ids => {
    const { articles, articleHref } = await import("/src/content/articles.ts");
    const { cardsForContent } = await import("/src/content/learningContent.ts");
    return articles.filter(article => ids.includes(article.id)).map(article => ({ id: article.id, title: article.title, href: articleHref(article), cards: cardsForContent(article.id) }));
  }, ids);
  assert.equal(content.length, 4);
  await mkdir("docs/verification", { recursive: true });
  for (const article of content) {
    await page.goto(`${origin}/search?q=${article.id}`, { waitUntil: "networkidle" });
    await page.locator(`a.domain-card[href="${article.href}"]`).click();
    await page.getByRole("heading", { level: 1, name: article.title, exact: true }).waitFor();
    assert.equal(await page.locator(".note-editor,.article-toc,.article-sources").count(), 0);
    const recall = page.locator('section[aria-labelledby="recall-cards"]');
    assert.equal(await recall.locator("details").count(), article.cards.length);
    await recall.locator("summary").first().click();
    await recall.getByRole("link", { name: "回看对应讲解 →", exact: true }).first().click();
    await page.waitForFunction(id => document.activeElement?.id === id, article.cards[0].sourceHeadingId);
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(origin + article.href, { waitUntil: "networkidle" });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${article.id}/${width}: overflow`);
      if (width !== 320) await page.screenshot({ path: `docs/verification/ai-p1-${article.id}-${width}.png` });
    }
    report.articles.push({ id: article.id, href: article.href, cards: article.cards.length, checks: ["search and route", "focused reader", "recall source focus", "1440/390/320px reflow"] });
  }
  assert.deepEqual(report.pageErrors, []);
  await writeFile("docs/verification/ai-p1-ui-report.json", JSON.stringify(report, null, 2) + "\n");
  console.log("AI P1 UI verified: 20 published AI units; 4 new search/routes, recall focus and responsive readers.");
  await context.close();
} finally { await browser.close(); }
