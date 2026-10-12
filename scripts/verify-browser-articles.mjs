import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { startArticleFixture } from './lib/article-fixture.mjs';
import { spawn } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { chromium } from 'playwright';
import ts from 'typescript';

// These files are repository-maintained lessons, never reader submissions.
const source = await readFile(new URL('../src/content/knowledge/service-worker-offline.ts', import.meta.url), 'utf8');
const exports = {};
runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports }, { timeout: 1000 });
const worker = exports.serviceWorkerOfflineArticle.sections.find(section => section.id === 'worker').code;
const offlinePage = exports.serviceWorkerOfflineArticle.sections.find(section => section.id === 'offline-page').code;
const fixture = await startArticleFixture(worker, offlinePage);
const { origin } = fixture;
let browser;
try {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/verify-articles.mjs'], {
      stdio: 'inherit',
      env: { ...process.env, ZHIXU_ARTICLE_IDS: 'K04-03,K04-04,K04-05,K04-06,K04-07,K04-08', ZHIXU_ARTICLE_ORIGIN: origin, ZHIXU_ARTICLE_REPORT: 'k04-article-examples.json' },
    });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Browser examples exited ${code}`)));
  });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(origin);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/k04-sw.js', { scope: '/', updateViaCache: 'none' });
    await navigator.serviceWorker.ready;
  });
  assert.equal(await page.evaluate(() => navigator.serviceWorker.controller), null, 'first document remains uncontrolled');
  await page.goto(origin + '/offline-demo');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  assert.equal(await page.locator('h1').innerText(), 'Online lesson');
  await context.setOffline(true);
  await page.reload();
  assert.equal(await page.locator('h1').innerText(), 'Offline lesson', 'controlled navigation falls back to precached response');
  await context.setOffline(false);
  await page.reload();
  assert.equal(await page.locator('h1').innerText(), 'Online lesson', 'online recovery uses network');
  fixture.setVersion(2);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration.update();
  });
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration.waiting?.state === 'installed';
  });
  assert.deepEqual(await page.evaluate(async () => (await caches.keys()).sort()), ['k04-shell-v1', 'k04-shell-v2'], 'waiting update preserves active cache');
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration.unregister();
    await Promise.all((await caches.keys()).map(name => caches.delete(name)));
  });
  await context.close();
  const report = {
    verifiedAt: new Date().toISOString(), browser: browser.version(), workerSha256: createHash('sha256').update(worker).digest('hex'),
    checks: ['First document has no controller without claim', 'New navigation is controlled', 'Real offline navigation returns precached fallback', 'Returning online uses network', 'v2 waits while v1 client remains and both caches exist'],
    limitations: ['Temporary isolated loopback origin only', 'No site-wide offline feature installed', 'No full cross-browser, physical quota, user permission or bfcache matrix'],
  };
  await writeFile(new URL('../docs/verification/k04-platform-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log('K04 isolated platform checks passed.');
} finally {
  await browser?.close();
  await fixture.close();
}
