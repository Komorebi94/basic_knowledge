import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const origin = process.env.ZHIXU_MAIN_ORIGIN ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(origin, { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    const store = await import('/src/infrastructure/persistence/personalStore.ts');
    const domain = await import('/src/domain/review.ts');
    const { recallCards } = await import('/src/content/learningContent.ts');
    const now = '2026-10-09T01:00:00.000Z';
    const initial = await store.readLearning();
    let notifications = 0;
    window.addEventListener('zhixu-data-change', () => notifications++);
    const note = { kind: 'note', id: 'legacy-note', payload: { contentId: 'archived-unit', headingId: null, titleSnapshot: '旧标题', text: '<b>私人原文</b>' } };
    await store.savePersonalRecord(note, null, initial.datasetId);
    const backup = { exportFormat: 'zhixu-personal-backup', schemaVersion: 1, exportedAt: now, records: [{ ...note, revision: 1, updatedAt: now }] };
    await store.importPersonalBackup(JSON.stringify(backup));
    const migrated = await store.readLearning();
    const preserved = await store.readPersonalRecord('note', note.id);
    const emptyMigrated = migrated.revision === null && migrated.state.review.events.length === 0;
    await store.discardRecoveryDataset();
    const state = await store.updateLearning(value => {
      const cards = recallCards.slice(0, 2);
      value.personal.bookmarks['K01-02'] = { contentId: 'K01-02', titleSnapshot: '闭包', createdAt: now };
      value.review = domain.startReviewSession(domain.subscribeContent(value.review, cards, now), cards, value.personal.preferences, now, 'session-test');
      value.review = domain.saveReviewAnswer(value.review, 'session-test', 1, '我的回答', true);
      return value;
    }, migrated.datasetId);
    const beforeRating = JSON.stringify(state);
    const nativePut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, ...args) {
      const request = nativePut.call(this, value, ...args);
      if (this.name === 'records' && value.kind === 'learning') this.transaction.abort();
      return request;
    };
    let rollbackRejected = false;
    try {
      await store.updateLearning(value => ({ ...value, review: domain.rateReviewCard(value.review, 'session-test', 2, 'remembered', 'event-test', now, recallCards, value.personal.preferences.studyTimezone) }), migrated.datasetId);
    } catch { rollbackRejected = true; } finally { IDBObjectStore.prototype.put = nativePut; }
    const afterRollback = await store.readLearning();
    const rollbackUnchanged = JSON.stringify(afterRollback) === beforeRating;
    await store.updateLearning(value => ({ ...value, review: domain.rateReviewCard(value.review, 'session-test', 2, 'remembered', 'event-test', now, recallCards, value.personal.preferences.studyTimezone) }), migrated.datasetId);
    await store.updateLearning(value => ({ ...value, review: domain.rateReviewCard(value.review, 'session-test', 2, 'remembered', 'event-test', now, recallCards, value.personal.preferences.studyTimezone) }), migrated.datasetId);
    const rated = await store.readLearning();
    let updaterRollback = false;
    try { await store.updateLearning(value => { value.personal.bookmarks = {}; throw new Error('fixture'); }, migrated.datasetId); } catch { updaterRollback = true; }
    const bookmarkKept = Object.hasOwn((await store.readLearning()).state.personal.bookmarks, 'K01-02');
    const exported = JSON.parse(await store.exportPersonalBackup());
    const cleanState = exported.records.find(record => record.kind === 'learning');
    cleanState.payload.personal.injected = 'must-not-survive';
    await store.importPersonalBackup(JSON.stringify(exported));
    const imported = await store.readLearning();
    const unknownRemoved = !Object.hasOwn(imported.state.personal, 'injected');
    let datasetConflict = false;
    try { await store.updateLearning(value => value, migrated.datasetId); } catch (error) { datasetConflict = error.code === 'conflict'; }
    await store.restorePreviousDataset();
    await store.discardRecoveryDataset();
    const restored = await store.readLearning();
    const unregister = store.registerUnsavedDataGuard(() => true);
    let dirtyRejected = false;
    try { await store.clearPersonalData(restored.datasetId); } catch (error) { dirtyRejected = error.code === 'conflict'; }
    unregister();
    let invalidRejected = false;
    const invalidBackup = JSON.parse(await store.exportPersonalBackup());
    invalidBackup.records.find(record => record.kind === 'learning').payload.review.activeSessionId = 'missing';
    try { await store.importPersonalBackup(JSON.stringify(invalidBackup)); } catch (error) { invalidRejected = error.code === 'invalid'; }
    return { preserved: preserved.payload.text, emptyMigrated, rollbackRejected, rollbackUnchanged, eventCount: rated.state.review.events.length, cursor: rated.state.review.sessions['session-test'].cursor, updaterRollback, bookmarkKept, schema: exported.schemaVersion, unknownRemoved, datasetConflict, dirtyRejected, invalidRejected, restoredEvents: restored.state.review.events.length, notifications };
  });
  assert.equal(result.preserved, '<b>私人原文</b>');
  for (const key of ['emptyMigrated','rollbackRejected','rollbackUnchanged','updaterRollback','bookmarkKept','unknownRemoved','datasetConflict','dirtyRejected','invalidRejected']) assert.equal(result[key], true, key);
  assert.equal(result.schema, 2);
  assert.equal(result.eventCount, 1);
  assert.equal(result.cursor, 1);
  assert.equal(result.restoredEvents, 1);
  assert.ok(result.notifications >= 8);
  const peer = await context.newPage();
  await peer.goto(origin, { waitUntil: 'networkidle' });
  await peer.evaluate(async () => {
    const store = await import('/src/infrastructure/persistence/personalStore.ts');
    await store.readLearning();
    window.fixtureRelease = store.registerUnsavedDataGuard(() => true);
    window.fixtureChanges = 0;
    window.addEventListener('zhixu-data-change', () => window.fixtureChanges++);
  });
  const blocked = await page.evaluate(async () => { const store = await import('/src/infrastructure/persistence/personalStore.ts'); try { await store.clearPersonalData(); return false; } catch (error) { return error.code === 'conflict'; } });
  assert.equal(blocked, true, 'peer dirty input blocks clearing');
  await peer.evaluate(() => window.fixtureRelease());
  await page.evaluate(async () => { const store = await import('/src/infrastructure/persistence/personalStore.ts'); const value = await store.readLearning(); await store.updateLearning(state => { state.personal.preferences.bodySize = 'large'; return state; }, value.datasetId); });
  await peer.waitForFunction(() => window.fixtureChanges > 0);
  await Promise.all([page, peer].map((target, index) => target.evaluate(async index => {
    const store = await import('/src/infrastructure/persistence/personalStore.ts');
    const current = await store.readLearning();
    await store.updateLearning(state => {
      const id = 'peer-' + index;
      state.personal.bookmarks[id] = { contentId: id, titleSnapshot: id, createdAt: '2026-10-09T01:00:00.000Z' };
      return state;
    }, current.datasetId);
  }, index)));
  const concurrentKept = await page.evaluate(async () => {
    const store = await import('/src/infrastructure/persistence/personalStore.ts');
    const current = await store.readLearning();
    return ['peer-0', 'peer-1'].every(id => Object.hasOwn(current.state.personal.bookmarks, id));
  });
  assert.equal(concurrentKept, true, 'cross-page updates read fresh aggregate state');
  const deleted = await page.evaluate(async () => {
    const store = await import('/src/infrastructure/persistence/personalStore.ts');
    const current = await store.readLearning();
    const record = await store.readPersonalRecord('note', 'legacy-note');
    let staleBlocked = false;
    try { await store.deletePersonalRecord('note', 'legacy-note', record.revision + 1, current.datasetId); }
    catch (error) { staleBlocked = error.code === 'conflict'; }
    const stillThere = await store.readPersonalRecord('note', 'legacy-note');
    await store.deletePersonalRecord('note', 'legacy-note', record.revision, current.datasetId);
    return staleBlocked && Boolean(stillThere) && await store.readPersonalRecord('note', 'legacy-note') === null;
  });
  assert.equal(deleted, true, 'note deletion compares dataset and revision');
  await page.evaluate(async () => { const store = await import('/src/infrastructure/persistence/personalStore.ts'); await store.clearPersonalData(); });
  const cleared = await peer.evaluate(async () => { const store = await import('/src/infrastructure/persistence/personalStore.ts'); const [dataset, learning] = await Promise.all([store.readPersonalDataset(), store.readLearning()]); return dataset.records.length === 0 && !dataset.recoveryAvailable && learning.revision === null; });
  assert.equal(cleared, true);
  await page.evaluate(() => {
    window.fixtureMaintenance = false;
    window.addEventListener('zhixu-data-maintenance', event => { window.fixtureMaintenance = event.detail.active; });
    const orphan = new BroadcastChannel('zhixu-personal-change');
    orphan.postMessage({ type: 'maintenance-request', token: 'crashed-owner-fixture' });
    orphan.close();
  });
  await page.waitForFunction(() => window.fixtureMaintenance === true);
  await page.waitForFunction(() => window.fixtureMaintenance === false, undefined, { timeout: 15_000 });
  console.log('Learning persistence verified in isolated Chrome context:', result, { peerDirtyGuard: blocked, peerNotification: true, atomicClear: cleared, concurrentKept, deleteCAS: deleted, crashedMaintenanceLeaseReleased: true });
} finally { await browser.close(); }
