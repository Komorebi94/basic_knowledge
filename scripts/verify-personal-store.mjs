import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.ZHIXU_MAIN_ORIGIN ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(origin, { waitUntil: "networkidle" });
  const result = await page.evaluate(async () => {
    const store = await import("/src/infrastructure/persistence/personalStore.ts");
    const note = {
      kind: "note",
      id: "note-1",
      payload: { contentId: "closures", headingId: null, titleSnapshot: "闭包", text: "先说作用域" },
    };
    const draft = {
      kind: "draft",
      id: "draft-1",
      payload: { exerciseId: "promise-all", exerciseRevision: 1, attemptId: "attempt-1", code: "return 1", codeRevision: 1 },
    };

    const initialDataset = await store.readPersonalDataset();
    const first = await store.savePersonalRecord(note, null, initialDataset.datasetId);
    const second = await store.savePersonalRecord(draft, null, initialDataset.datasetId);
    const recoveredDraft = await store.readPersonalRecord("draft", "draft-1");
    let conflict = false;
    try {
      await store.savePersonalRecord({ ...note, payload: { ...note.payload, text: "旧标签页" } }, null, initialDataset.datasetId);
    } catch (error) {
      conflict = error.code === "conflict";
    }

    const exported = await store.exportPersonalBackup();
    const preview = store.previewPersonalBackup(exported);
    let invalidRejected = false;
    try {
      await store.importPersonalBackup(JSON.stringify({ ...JSON.parse(exported), records: [{ nonsense: true }] }));
    } catch (error) {
      invalidRejected = error.code === "invalid";
    }
    const unchangedAfterInvalid = await store.readPersonalRecord("note", "note-1");

    const backup = JSON.parse(exported);
    backup.records = [{ ...backup.records.find((record) => record.kind === "note"), payload: { ...note.payload, text: "导入版本" } }];
    const nativePut = IDBObjectStore.prototype.put;
    let injectedAbort = false;
    IDBObjectStore.prototype.put = function (value, ...argumentsList) {
      const request = nativePut.call(this, value, ...argumentsList);
      if (this.name === "meta" && value.key === "state" && value.value.activeDatasetId !== initialDataset.datasetId) {
        injectedAbort = true;
        this.transaction.abort();
      }
      return request;
    };
    let abortRejected = false;
    try {
      await store.importPersonalBackup(JSON.stringify(backup));
    } catch (error) {
      abortRejected = error.code === "unavailable";
    } finally {
      IDBObjectStore.prototype.put = nativePut;
    }
    const afterAbort = await store.readPersonalDataset();
    await store.importPersonalBackup(JSON.stringify(backup));
    const importedNote = await store.readPersonalRecord("note", "note-1");
    const absentDraft = await store.readPersonalRecord("draft", "draft-1");
    let oldDatasetRejected = false;
    try {
      await store.savePersonalRecord(note, 1, initialDataset.datasetId);
    } catch (error) {
      oldDatasetRejected = error.code === "conflict";
    }
    let secondImportRejected = false;
    try {
      await store.importPersonalBackup(JSON.stringify(backup));
    } catch (error) {
      secondImportRejected = error.code === "has-recovery";
    }
    await store.restorePreviousDataset();
    const restoredDraft = await store.readPersonalRecord("draft", "draft-1");
    await store.discardRecoveryDataset();
    const finalBackup = JSON.parse(await store.exportPersonalBackup());
    return {
      firstRevision: first.revision,
      secondRevision: second.revision,
      recoveredDraft: recoveredDraft?.payload.code,
      conflict,
      preview,
      invalidRejected,
      unchangedAfterInvalid: unchangedAfterInvalid?.payload.text,
      importedNote: importedNote?.payload.text,
      absentDraft: absentDraft === null,
      oldDatasetRejected,
      injectedAbort,
      abortRejected,
      originalAfterAbort: afterAbort.datasetId === initialDataset.datasetId && afterAbort.records.length === 2 && !afterAbort.recoveryAvailable,
      secondImportRejected,
      restoredDraft: restoredDraft?.payload.code,
      finalRecordCount: finalBackup.records.length,
    };
  });

  assert.equal(result.firstRevision, 1);
  assert.equal(result.secondRevision, 1);
  assert.equal(result.recoveredDraft, "return 1");
  assert.equal(result.conflict, true);
  assert.deepEqual([result.preview.notes, result.preview.drafts], [1, 1]);
  assert.equal(result.invalidRejected, true);
  assert.equal(result.unchangedAfterInvalid, "先说作用域");
  assert.equal(result.importedNote, "导入版本");
  assert.equal(result.absentDraft, true);
  assert.equal(result.oldDatasetRejected, true);
  assert.equal(result.injectedAbort, true);
  assert.equal(result.abortRejected, true);
  assert.equal(result.originalAfterAbort, true);
  assert.equal(result.secondImportRejected, true);
  assert.equal(result.restoredDraft, "return 1");
  assert.equal(result.finalRecordCount, 2);
  console.log("Personal store verified in Chrome:", result);
} finally {
  await browser.close();
}
