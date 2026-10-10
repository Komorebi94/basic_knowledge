import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.ZHIXU_MAIN_ORIGIN ?? 'http://127.0.0.1:5173';
const output = new URL('../docs/verification/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const checks = [];
const screenshots = [];
let checkedRoutes = 0;
let mobileRoutes = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (error) => errors.push({ href: page.url(), message: error.message }));
  await page.goto(origin, { waitUntil: 'networkidle' });
  const content = await page.evaluate(async () => {
    const { articles, articleHref } = await import('/src/content/articles.ts');
    const { exercises } = await import('/src/content/practice/index.ts');
    const { recallCards, p0KnowledgeIds, p0AiIds, reviewCases } = await import('/src/content/learningContent.ts');
    const { publicSearchDocuments } = await import('/src/content/searchDocuments.ts');
    const articleRoutes = articles.map(article => ({
      id: article.catalogId ?? article.id, title: article.title, href: articleHref(article), type: article.kind,
      headings: article.sections.map(section => section.id),
      cards: recallCards.filter(card => card.sourceContentId === article.id),
    }));
    const practiceRoutes = exercises.map(exercise => ({
      id: exercise.id, title: exercise.title, href: '/practice/' + exercise.slug, type: 'practice',
      hints: exercise.hints, answer: exercise.referenceArtifact,
    }));
    const p0 = [...p0KnowledgeIds, ...p0AiIds];
    const missing = p0.filter(id => !articleRoutes.some(article => article.id === id));
    const p0Cards = recallCards.filter(card => p0.includes(card.catalogId));
    const invalidCards = recallCards.filter(card => {
      const article = articleRoutes.find(route => route.id === card.catalogId);
      return !article?.headings.includes(card.sourceHeadingId);
    }).map(card => card.cardId);
    const leakedPractice = exercises.flatMap(exercise => {
      const doc = publicSearchDocuments.find(document => document.id === exercise.id);
      return exercise.hints.filter(hint => doc?.body.includes(hint)).map(() => exercise.id)
        .concat(doc?.body.includes(exercise.referenceArtifact) ? [exercise.id + ':answer'] : []);
    });
    return {
      articleRoutes, practiceRoutes, cards: recallCards.length, p0Cards: p0Cards.length, missing, invalidCards,
      searchIds: publicSearchDocuments.map(document => document.id), leakedPractice,
      cases: reviewCases.map(item => ({ id: item.catalogId, title: item.title })),
    };
  });
  assert.equal(content.articleRoutes.length, 64, 'all article count');
  assert.equal(content.articleRoutes.filter(route => route.type === 'ai').length, 20, 'complete AI catalog');
  assert.equal(content.practiceRoutes.length, 24, 'core exercise count');
  assert.deepEqual(content.missing, [], 'P0 articles missing');
  assert(content.cards >= 128, 'new AI articles have recall cards');
  for (const id of ['AI13','AI14','AI17','AI18']) {
    const route=content.articleRoutes.find(article => article.id === id);
    assert(route && route.cards.length >= 2 && route.cards.length <= 5, id + ' published with recall cards');
  }
  assert.equal(content.p0Cards, 96, 'P0 card count');
  assert.deepEqual(content.invalidCards, [], 'recall anchor contract');
  assert.equal(content.searchIds.length, 204, 'search index count');
  assert.equal(new Set(content.searchIds).size, 204, 'search IDs unique');
  assert.deepEqual(content.leakedPractice, [], 'hints and full answers excluded from search');
  checks.push(`${content.articleRoutes.length} articles (20 AI), 24 exercises, no missing P0/P1 AI, ${content.cards} cards including 96 P0, valid card anchors, 204 unique search IDs, no hint/answer indexing`);
  console.log(checks.at(-1));

  const routes = [...content.articleRoutes, ...content.practiceRoutes];
  for (const route of routes) {
    await page.goto(origin + route.href, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1, name: route.title, exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, route.href, route.id + ' route');
    assert.equal(await page.locator('.note-editor, .article-toc, .article-mobile-toc, .article-sources').count(), 0, route.id + ' reader focus');
    if (route.type === 'practice') {
      await page.getByRole('tab', { name: '提示', exact: true }).click();
      for (let number = 1; number <= 3; number++) {
        assert.equal(await page.getByText(route.hints[number - 1], {exact:true}).count(), 0, route.id + ' hint hidden');
        await page.getByRole('button', {name:'展开提示 ' + number,exact:true}).click();
        await page.getByText(route.hints[number - 1], {exact:true}).waitFor();
      }
      await page.getByRole('tab', { name:'解析',exact:true }).click();
      assert.equal(await page.locator('.code-block code').count(),0,route.id + ' answer hidden');
      await page.getByRole('button',{name:'展开参考实现与完整解析',exact:true}).click();
      await page.getByRole('heading',{name:'复杂度与代价',exact:true}).waitFor();
      assert.equal(await page.locator('.code-block code').innerText(),route.answer,route.id + ' answer content');
    } else {
      assert.equal(await page.locator('h2#problem').count(), 1, route.id + ' problem anchor');
      const recallSection = page.locator('section[aria-labelledby="recall-cards"]');
      assert.equal(await recallSection.locator('details').count(), route.cards.length, route.id + ' recall count');
      const recall = recallSection.locator('details').first();
      assert.equal(await recall.getAttribute('open'), null, route.id + ' recall hidden');
      await recall.locator('summary').click();
      assert.notEqual(await recall.getAttribute('open'), null, route.id + ' recall expanded');
      assert.equal(await recall.locator('ul li').count(), route.cards[0].answerPoints.length, route.id + ' recall answers');
      await recall.getByRole('link', { name: '回看对应讲解 →', exact: true }).click();
      assert.equal(new URL(page.url()).hash, '#' + route.cards[0].sourceHeadingId, route.id + ' recall destination');
      await page.waitForFunction(id => document.activeElement?.id === id, route.cards[0].sourceHeadingId);
    }
    checkedRoutes++;
    if (checkedRoutes % 12 === 0) console.log('Desktop routes and disclosures: ' + checkedRoutes + '/' + routes.length);
  }
  checks.push(`${routes.length} routes and titles, article recall disclosure/source focus, 24 exercise three-layer hints and reference solutions`);

  for (const id of ['AI09', 'AI10', 'AI15']) {
    const route = content.articleRoutes.find(article => article.id === id);
    await page.goto(origin + route.href, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading',{level:1,name:route.title,exact:true}).waitFor();
    const disclosure = page.locator('details').filter({ has: page.locator('summary', { hasText: /^查看参考问题与自评尺度$/ }) });
    assert.equal(await disclosure.count(), 1, id + ' review case');
    assert.equal(await disclosure.getAttribute('open'), null, id + ' reference hidden');
    await disclosure.locator('summary').click();
    assert.notEqual(await disclosure.getAttribute('open'), null, id + ' reference expanded');
    assert.ok(await disclosure.locator('li').count() >= 4, id + ' findings and rubric');
  }
  checks.push('AI09/AI10/AI15 case reference findings hidden initially, expanded with rubric');
  for (const id of ['K03-02', 'AI01', 'AI13', 'AI14', 'AI17', 'AI18', 'AI20', 'E01', 'E35']) {
    const route = routes.find(item => item.id === id);
    const expected = route?.href ?? '/practice#E35';
    await page.goto(origin + '/search?q=' + encodeURIComponent(id), { waitUntil: 'domcontentloaded' });
    const result = page.locator('a.domain-card[href="' + expected + '"]');
    await result.waitFor();
    await result.click();
    assert.equal(new URL(page.url()).pathname + new URL(page.url()).hash, expected, id + ' search navigation');
    if (route) await page.getByRole('heading', { level: 1, name: route.title, exact: true }).waitFor();
    else await page.locator('#E35').waitFor();
  }
  checks.push('K03-02/AI01/AI13/AI14/AI17/AI18/AI20/E01 ID search opens readable content; E35 opens planned catalog anchor');
  for (const [href, target] of [['/knowledge/typescript/missing-p0', '/knowledge'], ['/ai/missing-p0', '/ai'], ['/practice/missing-p0', '/practice'], ['/missing-p0', '/knowledge']]) {
    await page.goto(origin + href, { waitUntil: 'domcontentloaded' });
    const panel = page.locator('.empty-panel');
    await panel.waitFor();
    const recovery = panel.locator('a[href="' + target + '"]');
    assert.equal(await recovery.count(), 1, href + ' recovery');
    await recovery.click();
    assert.equal(new URL(page.url()).pathname, target, href + ' recovered');
  }
  checks.push('Unavailable article/exercise and unknown route have working recovery links');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await page.goto(origin + route.href, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1, name: route.title, exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route.id + ' page overflow');
    // Inspect expanded answers too; horizontal scrolling inside a code block is allowed.
    if (route.type === 'practice') {
      await page.getByRole('tab',{name:'解析',exact:true}).click();
      await page.getByRole('heading',{name:'参考实现与推导',exact:true}).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route.id + ' expanded answer overflow');
    }
    mobileRoutes++;
    if (mobileRoutes % 12 === 0) console.log('390px pages without document overflow: ' + mobileRoutes + '/' + routes.length);
  }
  checks.push(`All ${routes.length} pages at 390px have no document overflow, including expanded exercise answers`);

  const representatives = [['knowledge', 'K03-02'], ['ai', 'AI15'], ['practice', 'E01']];
  for (const [screen, size] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    await page.setViewportSize(size);
    for (const [kind, id] of representatives) {
      const route = routes.find(item => item.id === id);
      await page.goto(origin + route.href, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { level: 1, name: route.title, exact: true }).waitFor();
      const name = 'p0-' + kind + '-' + screen + '.png';
      await page.screenshot({ path: new URL(name, output).pathname });
      screenshots.push(name);
    }
  }
  assert.deepEqual(errors, [], 'browser runtime errors');
  await writeFile(new URL('p0-ui-report.json', output), JSON.stringify({ verifiedAt: new Date().toISOString(), browser:browser.version(), origin, checkedRoutes, mobileRoutes, checks, screenshots, errors }, null, 2) + '\n');
  console.log('P0 UI verified: ' + checkedRoutes + ' desktop routes, ' + mobileRoutes + ' mobile routes, ' + screenshots.length + ' screenshots, zero browser errors.');
} catch (error) {
  await writeFile(new URL('p0-ui-report.json', output), JSON.stringify({ verifiedAt: new Date().toISOString(), browser:browser.version(), origin, checkedRoutes, mobileRoutes, checks, screenshots, errors, failure: error.message }, null, 2) + '\n');
  throw error;
} finally {
  await browser.close();
}
