import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const topicId = process.argv[2] ?? 'K04';
const topics = { K03: 'typescript', K04: 'browser', K05: 'html-css', K06: 'networking', K07: 'react', K08: 'vue', K09: 'tooling', K10: 'performance', K11: 'security', K12: 'testing', K13: 'architecture', K14: 'server', K15: 'accessibility', K16: 'algorithms' };
assert(Object.hasOwn(topics, topicId), 'Only delivered K03–K16 topics can be verified');
const fullTopics = ['K08', 'K09', 'K10', 'K11', 'K12', 'K13', 'K14', 'K15', 'K16'];
const articleCount = fullTopics.includes(topicId) ? 8 : 6;
const prefix = topicId.toLowerCase();
const domainSlug = topics[topicId];
const origin = process.env.ZHIXU_MAIN_ORIGIN ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { verifiedAt: new Date().toISOString(), browser: browser.version(), articles: [], pageErrors: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', error => report.pageErrors.push(error.message));
  await page.goto(origin + '/knowledge/' + domainSlug, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.catalog-topic').count(), 8, topicId + ' has eight units');
  assert.equal(await page.getByText('待编写', { exact: true }).count(), 0, topicId + ' all readable');
  const content = await page.evaluate(async ({ topicId, fullTopics }) => {
    const { articles, articleHref } = await import('/src/content/articles.ts');
    const { cardsForContent, exercisesForContent } = await import('/src/content/learningContent.ts');
    const ids = fullTopics.includes(topicId) ? new RegExp('^' + topicId + '-0[1-8]$') : new RegExp('^' + topicId + '-0[3-8]$');
    return articles.filter(article => ids.test(article.id)).map(article => ({
      id: article.id, title: article.title, href: articleHref(article), cards: cardsForContent(article.id),
      headings: article.sections.map(section => section.id),
      exerciseSections: exercisesForContent(article.catalogId ?? article.id).length > 0 ? 1 : 0,
    }));
  }, { topicId, fullTopics });
  assert.equal(content.length, articleCount);
  for (const article of content) {
    await page.goto(origin + '/search?q=' + article.id, { waitUntil: 'networkidle' });
    await page.locator(`a.domain-card[href="${article.href}"]`).click();
    await page.getByRole('heading', { level: 1, name: article.title, exact: true }).waitFor();
    assert.equal(await page.locator('.note-editor,.article-toc,.article-sources').count(), 0);
    assert.equal(await page.locator('.article-section h2').count(), article.headings.length + 1 + article.exerciseSections);
    const recall = page.locator('section[aria-labelledby="recall-cards"]');
    const expectedCards = /^K(?:0[89]|1[0-6])-0[12]$/.test(article.id) ? 2 : 3;
    assert.equal(article.cards.length, expectedCards);
    assert.equal(await recall.locator('details').count(), expectedCards);
    for (let index = 0; index < article.cards.length; index++) {
      const card = recall.locator('details').nth(index);
      assert.equal(await card.getAttribute('open'), null);
      await card.locator('summary').click();
      await card.getByRole('link', { name: '回看对应讲解 →', exact: true }).click();
      assert.equal(new URL(page.url()).hash, '#' + article.cards[index].sourceHeadingId);
      await page.waitForFunction(id => document.activeElement?.id === id, article.cards[index].sourceHeadingId);
    }
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('heading', { level: 1, name: article.title, exact: true }).waitFor();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(origin + article.href, { waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${article.id}/${width}: page overflow`);
      if (width !== 320) await page.screenshot({ path: `docs/verification/${prefix}-${article.id}-${width}.png` });
    }
    report.articles.push({ id: article.id, href: article.href, cards: article.cards.length, checks: ['ID search opens full article', 'all sections rendered', 'all cards folded initially and source anchors focused', 'deep link reload', '1440/390/320px reflow'] });
  }
  assert.deepEqual(report.pageErrors, []);
  await writeFile(`docs/verification/${prefix}-ui-report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(`${topicId} UI passed: eight readable units; ${articleCount} articles checked, ${report.articles.reduce((sum, article) => sum + article.cards, 0)} cards, search, reload and responsive reading.`);
} finally { await browser.close(); }
