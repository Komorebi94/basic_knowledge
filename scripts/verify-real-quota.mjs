import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.ZHIXU_MAIN_ORIGIN ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { checkedAt: new Date().toISOString(), origin, chromeVersion: browser.version(), scope: 'Temporary isolated browser context; CDP origin quota, not physical disk exhaustion or a user device.', maximumFixtureTextBytes: 1_600_000, sources: ['https://chromedevtools.github.io/devtools-protocol/tot/Storage/#method-overrideQuotaForOrigin', 'https://chromium.googlesource.com/chromium/src/+/1ef1c1e6d3d38a1f19cb1c21c65c62364c4c60af/content/browser/indexed_db/instance/bucket_context.h'] };
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(origin, { waitUntil: 'networkidle' });
  const cdp = await context.newCDPSession(page);
  await page.evaluate(async () => {
    const store = await import('/src/infrastructure/persistence/personalStore.ts');
    const initial = await store.readLearning();
    await store.savePersonalRecord({ kind: 'note', id: 'baseline-note', payload: { contentId: 'K01-02', headingId: null, titleSnapshot: '私人原文', text: '<b>保留原文</b>' } }, null, initial.datasetId);
    await store.savePersonalRecord({ kind: 'draft', id: 'baseline-draft', payload: { exerciseId: 'E01', exerciseRevision: 1, attemptId: 'old-attempt', code: 'console.log(42)', codeRevision: 1 } }, null, initial.datasetId);
    await store.updateLearning(state => { state.personal.bookmarks['K01-02'] = { contentId: 'K01-02', titleSnapshot: '闭包', createdAt: '2026-10-09T01:00:00.000Z' }; return state; }, initial.datasetId);
    window.quotaSnapshot = async () => {
      const db = await new Promise((resolve, reject) => { const request = indexedDB.open('zhixu-personal'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      try {
        const tx = db.transaction(['meta', 'records']);
        const get = name => new Promise((resolve, reject) => { const request = tx.objectStore(name).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
        const [meta, records] = await Promise.all([get('meta'), get('records')]);
        return { meta, records };
      } finally { db.close(); }
    };
    window.quotaBaseline = await window.quotaSnapshot();
    let seed = 137;
    const randomText = length => { const chars = []; for (let index = 0; index < length; index++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; chars.push(String.fromCharCode(33 + ((seed >>> 16) % 90))); } return chars.join(''); };
    window.quotaBackup = JSON.stringify({ exportFormat: 'zhixu-personal-backup', schemaVersion: 1, exportedAt: '2026-10-09T01:00:00.000Z', records: Array.from({ length: 16 }, (_, index) => ({ kind: 'draft', id: 'quota-' + index, revision: 1, updatedAt: '2026-10-09T01:00:00.000Z', payload: { exerciseId: 'E01', exerciseRevision: 1, attemptId: 'quota-attempt-' + index, code: randomText(100_000), codeRevision: 1 } })) });
  });
  report.initialUsage = await cdp.send('Storage.getUsageAndQuota', { origin });
  const quotaSize = Math.ceil(report.initialUsage.usage) + 128 * 1024;
  try {
    await cdp.send('Storage.overrideQuotaForOrigin', { origin, quotaSize });
    report.overrideMethod = 'Storage.overrideQuotaForOrigin';
  } catch (error) {
    report.unsupported = String(error);
    throw new Error('CDP quota override unavailable; bounded test stopped without filling storage.', { cause: error });
  }
  report.controlledQuota = await cdp.send('Storage.getUsageAndQuota', { origin });
  console.log('Controlled origin quota:', report.controlledQuota.quota, 'Chrome:', report.chromeVersion);
  report.quotaCacheWaitMs = 32_000;
  console.log('Waiting 32 seconds for Chromium IndexedDB quota credit cache to expire.');
  await page.waitForTimeout(report.quotaCacheWaitMs);
  report.realImport = await page.evaluate(async () => {
    const store = await import('/src/infrastructure/persistence/personalStore.ts');
    const nativePut = IDBObjectStore.prototype.put;
    const requestErrors = [];
    const transactionErrors = [];
    const nativeTransaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args) { const transaction = nativeTransaction.apply(this, args); transaction.addEventListener('abort', () => transactionErrors.push(transaction.error?.name)); return transaction; };
    IDBObjectStore.prototype.put = function (...args) {
      const request = nativePut.apply(this, args);
      request.addEventListener('error', () => requestErrors.push(request.error?.name));
      return request;
    };
    let errorCode = null;
    let errorMessage = null;
    try { await store.importPersonalBackup(window.quotaBackup); } catch (error) { errorCode = error.code; errorMessage = error.message; } finally { IDBObjectStore.prototype.put = nativePut; IDBDatabase.prototype.transaction = nativeTransaction; }
    return { errorCode, errorMessage, nativeRequestErrors: requestErrors, nativeTransactionErrors: transactionErrors, allDatasetsUnchanged: JSON.stringify(await window.quotaSnapshot()) === JSON.stringify(window.quotaBaseline), readablePrivateText: (await store.readPersonalRecord('note', 'baseline-note'))?.payload.text };
  });
  report.afterAttemptUsage = await cdp.send('Storage.getUsageAndQuota', { origin });
  console.log('Real import result:', JSON.stringify(report.realImport), JSON.stringify(report.afterAttemptUsage));
  assert.equal(report.realImport.errorCode, 'quota');
  assert.ok([...report.realImport.nativeRequestErrors, ...report.realImport.nativeTransactionErrors].includes('QuotaExceededError'));
  assert.equal(report.realImport.allDatasetsUnchanged, true);
  assert.equal(report.realImport.readablePrivateText, '<b>保留原文</b>');

  await cdp.send('Storage.overrideQuotaForOrigin', { origin });
  report.recovery = await page.evaluate(async () => {
    const store = await import('/src/infrastructure/persistence/personalStore.ts');
    await store.importPersonalBackup(window.quotaBackup);
    const imported = await window.quotaSnapshot();
    await store.restorePreviousDataset();
    const restored = await window.quotaSnapshot();
    const baselineId = window.quotaBaseline.meta[0].value.activeDatasetId;
    const sameRecords = JSON.stringify(restored.records.filter(record => record.datasetId === baselineId)) === JSON.stringify(window.quotaBaseline.records);
    return { importedRecords: imported.records.length, restoredDatasetId: restored.meta[0].value.activeDatasetId, baselineDatasetId: baselineId, restoredRecordsExact: sameRecords, recoveryRetained: restored.meta[0].value.recoveryDatasetId !== null };
  });
  assert.equal(report.recovery.importedRecords, 19);
  assert.equal(report.recovery.restoredDatasetId, report.recovery.baselineDatasetId);
  assert.equal(report.recovery.restoredRecordsExact, true);
  assert.equal(report.recovery.recoveryRetained, true);
  console.log('Raised quota: import and exact previous-dataset recovery passed.');

  // Delete/restore writes are small or reduce usage and do not reliably exhaust quota.
  // Separate deterministic fault injection checks their error classification and rollback.
  report.injectedFailures = await page.evaluate(async () => {
    const store = await import('/src/infrastructure/persistence/personalStore.ts');
    const results = {};
    for (const operation of ['restore', 'discard', 'delete', 'clear']) {
      const before = await window.quotaSnapshot();
      const nativePut = IDBObjectStore.prototype.put;
      const nativeDelete = IDBObjectStore.prototype.delete;
      const nativeClear = IDBObjectStore.prototype.clear;
      const errorDescriptor = Object.getOwnPropertyDescriptor(IDBTransaction.prototype, 'error');
      const injectedTransactions = new WeakSet();
      Object.defineProperty(IDBTransaction.prototype, 'error', { configurable: true, get() { return injectedTransactions.has(this) ? new DOMException('Controlled classification fixture', 'QuotaExceededError') : errorDescriptor.get.call(this); } });
      const abort = transaction => { if (injectedTransactions.has(transaction)) return; injectedTransactions.add(transaction); queueMicrotask(() => transaction.abort()); };
      IDBObjectStore.prototype.put = function (...args) { const request = nativePut.apply(this, args); if (operation === 'restore' && this.name === 'meta') abort(this.transaction); return request; };
      IDBObjectStore.prototype.delete = function (...args) { const request = nativeDelete.apply(this, args); if (operation === 'delete' || operation === 'discard') abort(this.transaction); return request; };
      IDBObjectStore.prototype.clear = function (...args) { const request = nativeClear.apply(this, args); if (operation === 'clear') abort(this.transaction); return request; };
      let errorCode = null;
      try {
        if (operation === 'restore') await store.restorePreviousDataset();
        else if (operation === 'discard') await store.discardRecoveryDataset();
        else if (operation === 'clear') await store.clearPersonalData(before.meta[0].value.activeDatasetId);
        else await store.deletePersonalRecord('note', 'baseline-note', 1, before.meta[0].value.activeDatasetId);
      } catch (error) { errorCode = error.code; } finally {
        IDBObjectStore.prototype.put = nativePut;
        IDBObjectStore.prototype.delete = nativeDelete;
        IDBObjectStore.prototype.clear = nativeClear;
        Object.defineProperty(IDBTransaction.prototype, 'error', errorDescriptor);
      }
      results[operation] = { errorCode, allDatasetsUnchanged: JSON.stringify(await window.quotaSnapshot()) === JSON.stringify(before), method: 'Injected transaction abort with QuotaExceededError getter; not native quota exhaustion.' };
    }
    return results;
  });
  for (const [operation, result] of Object.entries(report.injectedFailures)) {
    assert.equal(result.errorCode, 'quota', operation);
    assert.equal(result.allDatasetsUnchanged, true, operation);
  }
  report.pageErrors = pageErrors;
  assert.deepEqual(pageErrors, [], 'no uncaught browser exceptions');
  report.status = 'passed';
  console.log('Restore/discard/delete/clear injected quota classification and atomic rollback passed.');
  await context.close();
} catch (error) {
  report.status = 'failed';
  report.error = String(error);
  throw error;
} finally {
  await mkdir('docs/verification', { recursive: true });
  await writeFile('docs/verification/p0-real-quota-report.json', JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
