import { emptyLearningState, isLearningState, normalizeLearningState, type LearningState } from '../../domain/learning';

const databaseName = "zhixu-personal";
const databaseVersion = 1;
const backupFormat = "zhixu-personal-backup";
const maximumBackupBytes = 50 * 1024 * 1024;

export type RecordInput =
  | {
      kind: "note";
      id: string;
      payload: {
        contentId: string;
        headingId: string | null;
        titleSnapshot: string;
        text: string;
      };
    }
  | {
      kind: "draft";
      id: string;
      payload: {
        exerciseId: string;
        exerciseRevision: number;
        attemptId: string;
        code: string;
        codeRevision: number;
      };
    }
  | { kind: "learning"; id: "state"; payload: LearningState };

export type PersonalRecord = RecordInput & {
  datasetId: string;
  revision: number;
  updatedAt: string;
};

type BackupRecord = RecordInput & {
  revision: number;
  updatedAt: string;
};

interface DatasetState {
  schemaVersion: 1;
  activeDatasetId: string;
  recoveryDatasetId: string | null;
}

interface StoredState {
  key: "state";
  value: DatasetState;
}

interface Backup {
  exportFormat: typeof backupFormat;
  schemaVersion: 2;
  exportedAt: string;
  records: BackupRecord[];
}

export class PersonalStoreError extends Error {
  constructor(
    readonly code: "unavailable" | "conflict" | "invalid" | "has-recovery" | "quota",
    message: string,
  ) {
    super(message);
    this.name = "PersonalStoreError";
  }
}

function storageFailure(transaction: IDBTransaction, message: string): PersonalStoreError {
  return transaction.error?.name === 'QuotaExceededError'
    ? new PersonalStoreError('quota', '本地存储空间不足，请先保留备份；原数据仍然有效')
    : new PersonalStoreError('unavailable', message);
}

let databasePromise: Promise<IDBDatabase> | undefined;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function canonicalBackupRecord(record: BackupRecord): BackupRecord {
  const common = { id: record.id, revision: record.revision, updatedAt: record.updatedAt };
  if (record.kind === "learning") return { ...common, id: "state", kind: "learning", payload: normalizeLearningState(record.payload) };
  return record.kind === "note"
    ? { ...common, kind: "note", payload: {
      contentId: record.payload.contentId, headingId: record.payload.headingId,
      titleSnapshot: record.payload.titleSnapshot, text: record.payload.text,
    } }
    : { ...common, kind: "draft", payload: {
      exerciseId: record.payload.exerciseId, exerciseRevision: record.payload.exerciseRevision,
      attemptId: record.payload.attemptId, code: record.payload.code, codeRevision: record.payload.codeRevision,
    } };
}

function isValidRecord(value: unknown): value is BackupRecord {
  if (!isObject(value)) return false;
  if (
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    value.id.length > 200 ||
    !Number.isSafeInteger(value.revision) ||
    Number(value.revision) < 1 ||
    !isValidDate(value.updatedAt) ||
    !isObject(value.payload)
  ) {
    return false;
  }

  if (value.kind === "learning") return value.id === "state" && isLearningState(value.payload);
  const payload = value.payload;
  if (value.kind === "note") {
    return (
      typeof payload.contentId === "string" &&
      payload.contentId.length > 0 &&
      (payload.headingId === null || typeof payload.headingId === "string") &&
      typeof payload.titleSnapshot === "string" &&
      payload.titleSnapshot.length <= 200 &&
      typeof payload.text === "string" &&
      payload.text.length <= 20_000
    );
  }
  if (value.kind === "draft") {
    return (
      typeof payload.exerciseId === "string" &&
      payload.exerciseId.length > 0 &&
      Number.isSafeInteger(payload.exerciseRevision) &&
      Number(payload.exerciseRevision) > 0 &&
      typeof payload.attemptId === "string" &&
      payload.attemptId.length > 0 &&
      typeof payload.code === "string" &&
      payload.code.length <= 100_000 &&
      Number.isSafeInteger(payload.codeRevision) &&
      Number(payload.codeRevision) >= 0
    );
  }
  return false;
}

function isStoredRecord(value: unknown): value is PersonalRecord {
  return (
    isObject(value) &&
    typeof value.datasetId === "string" &&
    value.datasetId.length > 0 &&
    isValidRecord(value)
  );
}

function isDatasetState(value: unknown): value is StoredState {
  return (
    isObject(value) &&
    value.key === "state" &&
    isObject(value.value) &&
    value.value.schemaVersion === 1 &&
    typeof value.value.activeDatasetId === "string" &&
    value.value.activeDatasetId.length > 0 &&
    (value.value.recoveryDatasetId === null ||
      (typeof value.value.recoveryDatasetId === "string" && value.value.recoveryDatasetId.length > 0
        && value.value.recoveryDatasetId !== value.value.activeDatasetId))
  );
}

function openDatabase(): Promise<IDBDatabase> {
  ensureNotifications();
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new PersonalStoreError("unavailable", "浏览器未提供本地数据库"));
      return;
    }

    const request = indexedDB.open(databaseName, databaseVersion);
    request.addEventListener("upgradeneeded", () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("meta")) {
        const meta = database.createObjectStore("meta", { keyPath: "key" });
        meta.put({
          key: "state",
          value: {
            schemaVersion: 1,
            activeDatasetId: crypto.randomUUID(),
            recoveryDatasetId: null,
          },
        } satisfies StoredState);
      }
      if (!database.objectStoreNames.contains("records")) {
        const records = database.createObjectStore("records", {
          keyPath: ["datasetId", "kind", "id"],
        });
        records.createIndex("byDataset", "datasetId");
      }
    });
    request.addEventListener("success", () => {
      const database = request.result;
      database.addEventListener("versionchange", () => {
        database.close();
        databasePromise = undefined;
      });
      resolve(database);
    });
    request.addEventListener("error", () => {
      databasePromise = undefined;
      reject(new PersonalStoreError("unavailable", "本地数据库无法打开"));
    });
    request.addEventListener("blocked", () => {
      databasePromise = undefined;
      reject(new PersonalStoreError("unavailable", "请关闭其他仍在使用旧版本的页面"));
    });
  });

  return databasePromise;
}

function getState(store: IDBObjectStore, onSuccess: (state: DatasetState) => void) {
  const request = store.get("state");
  request.addEventListener("success", () => {
    const value: unknown = request.result;
    if (!isDatasetState(value)) {
      store.transaction.abort();
      return;
    }
    onSuccess(value.value);
  });
}

export async function readPersonalRecord(
  kind: RecordInput["kind"],
  id: string,
): Promise<PersonalRecord | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["meta", "records"], "readonly");
    let record: PersonalRecord | null = null;
    getState(transaction.objectStore("meta"), (state) => {
      const request = transaction.objectStore("records").get([state.activeDatasetId, kind, id]);
      request.addEventListener("success", () => {
        const value: unknown = request.result;
        if (value === undefined) return;
        if (!isStoredRecord(value)) {
          transaction.abort();
          return;
        }
        record = value;
      });
    });
    transaction.addEventListener("complete", () => resolve(record));
    transaction.addEventListener("abort", () =>
      reject(new PersonalStoreError("unavailable", "无法读取本地记录")),
    );
    transaction.addEventListener("error", () =>
      reject(new PersonalStoreError("unavailable", "无法读取本地记录")),
    );
  });
}

export async function savePersonalRecord(
  input: RecordInput,
  expectedRevision: number | null,
  expectedDatasetId: string,
): Promise<PersonalRecord> {
  assertWritable();
  const candidate = { ...input, revision: 1, updatedAt: new Date().toISOString() };
  if (!isValidRecord(candidate)) {
    throw new PersonalStoreError("invalid", "记录字段无效或超过长度限制");
  }
  const normalized = canonicalBackupRecord(candidate);
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["meta", "records"], "readwrite");
    let saved: PersonalRecord | undefined;
    let conflict = false;
    let revisionOverflow = false;

    getState(transaction.objectStore("meta"), (state) => {
      if (state.activeDatasetId !== expectedDatasetId) {
        conflict = true;
        transaction.abort();
        return;
      }
      const records = transaction.objectStore("records");
      const request = records.get([state.activeDatasetId, normalized.kind, normalized.id]);
      request.addEventListener("success", () => {
        const current: unknown = request.result;
        if (current !== undefined && !isStoredRecord(current)) {
          transaction.abort();
          return;
        }
        if (maintenanceTokens.size > 0) { conflict = true; transaction.abort(); return; }
        const currentRevision = current?.revision ?? null;
        if (currentRevision !== expectedRevision) {
          conflict = true;
          transaction.abort();
          return;
        }
        if (!Number.isSafeInteger((currentRevision ?? 0) + 1)) {
          revisionOverflow = true;
          transaction.abort();
          return;
        }
        saved = {
          ...normalized,
          datasetId: state.activeDatasetId,
          revision: (currentRevision ?? 0) + 1,
          updatedAt: new Date().toISOString(),
        };
        records.put(saved);
      });
    });

    transaction.addEventListener("complete", () => {
      if (saved) { notifyDataChange(); resolve(saved); }
      else reject(new PersonalStoreError("unavailable", "记录未能保存"));
    });
    transaction.addEventListener("abort", () =>
      reject(
        conflict
          ? new PersonalStoreError("conflict", "这条记录已在另一页面更新")
          : revisionOverflow
            ? new PersonalStoreError("invalid", "记录版本超过支持范围，请先保留备份")
          : storageFailure(transaction, "记录保存失败"),
      ),
    );
  });
}

export interface PersonalDatasetSnapshot {
  datasetId: string;
  recoveryAvailable: boolean;
  records: PersonalRecord[];
}

export async function readPersonalDataset(): Promise<PersonalDatasetSnapshot> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["meta", "records"], "readonly");
    let snapshot: PersonalDatasetSnapshot | undefined;
    getState(transaction.objectStore("meta"), (state) => {
      const request = transaction.objectStore("records").index("byDataset")
        .getAll(IDBKeyRange.only(state.activeDatasetId));
      request.addEventListener("success", () => {
        const values: unknown = request.result;
        if (!Array.isArray(values) || !values.every(isStoredRecord)) {
          transaction.abort();
          return;
        }
        snapshot = {
          datasetId: state.activeDatasetId,
          recoveryAvailable: state.recoveryDatasetId !== null,
          records: values,
        };
      });
    });
    transaction.addEventListener("complete", () => {
      if (snapshot) resolve(snapshot);
      else reject(new PersonalStoreError("unavailable", "本地数据未能读取"));
    });
    transaction.addEventListener("abort", () =>
      reject(new PersonalStoreError("unavailable", "本地数据未能读取")),
    );
  });
}

function validateBackupJson(json: string): Backup {
  if (new TextEncoder().encode(json).byteLength > maximumBackupBytes) {
    throw new PersonalStoreError("invalid", "备份文件超过 50 MiB");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new PersonalStoreError("invalid", "备份不是有效的 JSON 文件");
  }
  if (
    !isObject(parsed) ||
    parsed.exportFormat !== backupFormat ||
    (parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) ||
    !isValidDate(parsed.exportedAt) ||
    !Array.isArray(parsed.records)
  ) {
    throw new PersonalStoreError("invalid", "备份格式或版本不受支持");
  }

  const seen = new Set<string>();
  const records: BackupRecord[] = [];
  for (const record of parsed.records) {
    if (!isValidRecord(record) || (parsed.schemaVersion === 1 && record.kind === "learning")) {
      throw new PersonalStoreError("invalid", "备份包含无效记录");
    }
    const key = `${record.kind}:\u0000${record.id}`;
    if (seen.has(key)) {
      throw new PersonalStoreError("invalid", "备份包含重复记录");
    }
    seen.add(key);
    records.push(canonicalBackupRecord(record));
  }
  return {
    exportFormat: backupFormat,
    // Schema 1 only contains note/draft records. Learning defaults are supplied
    // explicitly by readLearning rather than inventing historical events.
    schemaVersion: 2,
    exportedAt: parsed.exportedAt,
    records,
  };
}

export async function exportPersonalBackup(): Promise<string> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["meta", "records"], "readonly");
    let records: BackupRecord[] | undefined;
    getState(transaction.objectStore("meta"), (state) => {
      const request = transaction
        .objectStore("records")
        .index("byDataset")
        .getAll(IDBKeyRange.only(state.activeDatasetId));
      request.addEventListener("success", () => {
        const values: unknown = request.result;
        if (!Array.isArray(values) || !values.every(isValidRecord)) {
          transaction.abort();
          return;
        }
        records = values.map(canonicalBackupRecord);
      });
    });
    transaction.addEventListener("complete", () => {
      if (!records) {
        reject(new PersonalStoreError("unavailable", "无法读取备份数据"));
        return;
      }
      resolve(JSON.stringify({
        exportFormat: backupFormat,
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        records,
      } satisfies Backup));
    });
    transaction.addEventListener("abort", () =>
      reject(new PersonalStoreError("unavailable", "备份导出失败")),
    );
  });
}

export function previewPersonalBackup(json: string) {
  const backup = validateBackupJson(json);
  const learning = backup.records.find((record) => record.kind === "learning");
  return {
    exportedAt: backup.exportedAt,
    notes: backup.records.filter(({ kind }) => kind === "note").length,
    drafts: backup.records.filter(({ kind }) => kind === "draft").length,
    learningRecords: backup.records.filter(({ kind }) => kind === "learning").length,
    bookmarks: learning ? Object.keys(learning.payload.personal.bookmarks).length : 0,
    ratings: learning?.payload.review.events.length ?? 0,
    practiceDrafts: learning ? Object.keys(learning.payload.practice.drafts).length : 0,
    attempts: learning?.payload.practice.attempts.length ?? 0,
    evidence: learning?.payload.practice.evidence.length ?? 0,
  };
}

async function importPersonalBackupTransaction(json: string): Promise<void> {
  const backup = validateBackupJson(json);
  const database = await openDatabase();
  const newDatasetId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["meta", "records"], "readwrite");
    let recoveryExists = false;
    getState(transaction.objectStore("meta"), (state) => {
      if (state.recoveryDatasetId !== null) {
        recoveryExists = true;
        transaction.abort();
        return;
      }
      const records = transaction.objectStore("records");
      for (const record of backup.records) {
        records.put({ ...record, datasetId: newDatasetId });
      }
      const verify = records.index("byDataset").getAll(IDBKeyRange.only(newDatasetId));
      verify.addEventListener("success", () => {
        const staged: unknown = verify.result;
        if (
          !Array.isArray(staged) ||
          staged.length !== backup.records.length ||
          !staged.every(isStoredRecord)
        ) {
          transaction.abort();
          return;
        }
        transaction.objectStore("meta").put({
          key: "state",
          value: {
            schemaVersion: 1,
            activeDatasetId: newDatasetId,
            recoveryDatasetId: state.activeDatasetId,
          },
        } satisfies StoredState);
      });
    });
    transaction.addEventListener("complete", () => { notifyDataChange(); resolve(); });
    transaction.addEventListener("abort", () =>
      reject(
        recoveryExists
          ? new PersonalStoreError("has-recovery", "请先处理上一次导入的恢复点")
          : storageFailure(transaction, "备份导入失败，原数据仍然有效"),
      ),
    );
  });
}

async function restorePreviousDatasetTransaction(): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("meta", "readwrite");
    let missing = false;
    getState(transaction.objectStore("meta"), (state) => {
      if (state.recoveryDatasetId === null) {
        missing = true;
        transaction.abort();
        return;
      }
      transaction.objectStore("meta").put({
        key: "state",
        value: {
          ...state,
          activeDatasetId: state.recoveryDatasetId,
          recoveryDatasetId: state.activeDatasetId,
        },
      } satisfies StoredState);
    });
    transaction.addEventListener("complete", () => { notifyDataChange(); resolve(); });
    transaction.addEventListener("abort", () =>
      reject(
        missing
          ? new PersonalStoreError("invalid", "没有可恢复的旧数据")
          : storageFailure(transaction, "恢复失败，数据未切换"),
      ),
    );
  });
}

async function discardRecoveryDatasetTransaction(): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["meta", "records"], "readwrite");
    getState(transaction.objectStore("meta"), (state) => {
      if (state.recoveryDatasetId === null) return;
      const index = transaction.objectStore("records").index("byDataset");
      const cursorRequest = index.openKeyCursor(IDBKeyRange.only(state.recoveryDatasetId));
      cursorRequest.addEventListener("success", () => {
        const cursor = cursorRequest.result;
        if (!cursor) {
          transaction.objectStore("meta").put({
            key: "state",
            value: { ...state, recoveryDatasetId: null },
          } satisfies StoredState);
          return;
        }
        transaction.objectStore("records").delete(cursor.primaryKey);
        cursor.continue();
      });
    });
    transaction.addEventListener("complete", () => { notifyDataChange(); resolve(); });
    transaction.addEventListener("abort", () =>
      reject(storageFailure(transaction, "清理恢复点失败")),
    );
  });
}

export interface LearningSnapshot {
  datasetId: string;
  state: LearningState;
  revision: number | null;
}

let notificationChannel: BroadcastChannel | undefined;
const unsavedGuards = new Set<() => boolean>();
const maintenanceTokens = new Set<string>();
const maintenanceReplies = new Map<string, (blocked: boolean) => void>();
const remoteMaintenanceExpiry = new Map<string, number>();

function expireRemoteMaintenance() {
  const now = Date.now();
  for (const [token, expiry] of remoteMaintenanceExpiry) {
    if (expiry <= now) { remoteMaintenanceExpiry.delete(token); maintenanceTokens.delete(token); }
  }
}

function trackRemoteMaintenance(token: string) {
  remoteMaintenanceExpiry.set(token, Date.now() + 10_000);
  setTimeout(() => { expireRemoteMaintenance(); announceMaintenance(); }, 10_050);
}

export function registerUnsavedDataGuard(guard: () => boolean): () => void {
  ensureNotifications();
  unsavedGuards.add(guard);
  return () => unsavedGuards.delete(guard);
}

function hasUnsavedData(): boolean {
  for (const guard of unsavedGuards) {
    try { if (guard()) return true; } catch { return true; }
  }
  return false;
}

function announceMaintenance() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zhixu-data-maintenance', { detail: { active: maintenanceTokens.size > 0 } }));
  }
}

function ensureNotifications() {
  if (notificationChannel || typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
  notificationChannel = new BroadcastChannel('zhixu-personal-change');
  notificationChannel.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (!isObject(event.data)) return;
    const message = event.data;
    if (message.type === 'data-change') window.dispatchEvent(new Event('zhixu-data-change'));
    if (message.type === 'maintenance-request' && typeof message.token === 'string' && message.token.length <= 100) {
      expireRemoteMaintenance();
      const blocked = hasUnsavedData() || maintenanceTokens.size > 0;
      if (!blocked) { maintenanceTokens.add(message.token); trackRemoteMaintenance(message.token); announceMaintenance(); }
      notificationChannel?.postMessage({ type: 'maintenance-response', token: message.token, blocked });
    }
    if (message.type === 'maintenance-response' && typeof message.token === 'string' && typeof message.blocked === 'boolean') {
      maintenanceReplies.get(message.token)?.(message.blocked);
    }
    if (message.type === 'maintenance-heartbeat' && typeof message.token === 'string' && remoteMaintenanceExpiry.has(message.token)) trackRemoteMaintenance(message.token);
    if (message.type === 'maintenance-end' && typeof message.token === 'string') {
      maintenanceTokens.delete(message.token);
      remoteMaintenanceExpiry.delete(message.token);
      announceMaintenance();
    }
  });
}

function notifyDataChange() {
  ensureNotifications();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('zhixu-data-change'));
  notificationChannel?.postMessage({ type: 'data-change' });
}

function assertWritable() {
  expireRemoteMaintenance();
  if (maintenanceTokens.size > 0) throw new PersonalStoreError('conflict', '个人数据正在替换或清理，请稍后重试；本页输入仍保留');
}

async function withMaintenance(action: () => Promise<void>): Promise<void> {
  ensureNotifications();
  expireRemoteMaintenance();
  if (hasUnsavedData() || maintenanceTokens.size > 0) {
    throw new PersonalStoreError('conflict', '请先保存或保留所有页面尚未保存的输入，再替换个人数据');
  }
  const token = crypto.randomUUID();
  maintenanceTokens.add(token);
  announceMaintenance();
  let blocked = false;
  maintenanceReplies.set(token, (denied) => { blocked ||= denied; });
  notificationChannel?.postMessage({ type: 'maintenance-request', token });
  const heartbeat = setInterval(() => notificationChannel?.postMessage({ type: 'maintenance-heartbeat', token }), 1_000);
  try {
    // Active peer pages get a bounded opportunity to report dirty inputs. Dataset
    // identity remains the write guard for sleeping pages and older app versions.
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    if (blocked || hasUnsavedData()) throw new PersonalStoreError('conflict', '另一页面有未保存输入或正在处理数据，请先保留后重试');
    await action();
  } finally {
    clearInterval(heartbeat);
    maintenanceReplies.delete(token);
    maintenanceTokens.delete(token);
    notificationChannel?.postMessage({ type: 'maintenance-end', token });
    announceMaintenance();
  }
}

export async function readLearning(): Promise<LearningSnapshot> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['meta', 'records'], 'readonly');
    let snapshot: LearningSnapshot | undefined;
    getState(transaction.objectStore('meta'), (meta) => {
      const request = transaction.objectStore('records').get([meta.activeDatasetId, 'learning', 'state']);
      request.addEventListener('success', () => {
        const record: unknown = request.result;
        if (record === undefined) {
          snapshot = { datasetId: meta.activeDatasetId, state: emptyLearningState(), revision: null };
        } else if (isStoredRecord(record) && record.kind === 'learning') {
          snapshot = { datasetId: meta.activeDatasetId, state: normalizeLearningState(record.payload), revision: record.revision };
        } else transaction.abort();
      });
    });
    transaction.addEventListener('complete', () => snapshot ? resolve(snapshot) : reject(new PersonalStoreError('unavailable', '学习记录未能读取')));
    transaction.addEventListener('abort', () => reject(new PersonalStoreError('invalid', '学习记录损坏，请保留备份后恢复')));
  });
}

export async function updateLearning(updater: (state: LearningState) => LearningState, expectedDatasetId: string): Promise<LearningSnapshot> {
  assertWritable();
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['meta', 'records'], 'readwrite');
    let snapshot: LearningSnapshot | undefined;
    let failure: unknown;
    getState(transaction.objectStore('meta'), (meta) => {
      if (meta.activeDatasetId !== expectedDatasetId) {
        failure = new PersonalStoreError('conflict', '个人数据已在另一页面替换，请刷新后重试');
        transaction.abort(); return;
      }
      const records = transaction.objectStore('records');
      const request = records.get([meta.activeDatasetId, 'learning', 'state']);
      request.addEventListener('success', () => {
        try {
          assertWritable();
          const current: unknown = request.result;
          if (current !== undefined && (!isStoredRecord(current) || current.kind !== 'learning')) throw new PersonalStoreError('invalid', '学习记录损坏');
          const revision = (current?.revision ?? 0) + 1;
          if (!Number.isSafeInteger(revision)) throw new PersonalStoreError('invalid', '学习记录版本超过支持范围');
          const state = current?.payload ?? emptyLearningState();
          const candidate: unknown = updater(structuredClone(state));
          if (!isLearningState(candidate)) throw new PersonalStoreError('invalid', '学习记录字段或关系无效；修改未保存');
          const normalized = normalizeLearningState(candidate);
          if (!isLearningState(normalized)) throw new PersonalStoreError('invalid', '学习记录规范化失败');
          records.put({ kind: 'learning', id: 'state', datasetId: meta.activeDatasetId, payload: normalized, revision, updatedAt: new Date().toISOString() } satisfies PersonalRecord);
          snapshot = { datasetId: meta.activeDatasetId, state: normalized, revision };
        } catch (error) { failure = error; transaction.abort(); }
      });
    });
    transaction.addEventListener('complete', () => {
      if (!snapshot) reject(new PersonalStoreError('unavailable', '学习记录未能保存'));
      else { notifyDataChange(); resolve(snapshot); }
    });
    transaction.addEventListener('abort', () => reject(failure ?? storageFailure(transaction, '学习记录保存失败；当前数据未改变')));
  });
}

export async function clearPersonalData(expectedDatasetId?: string): Promise<void> {
  return withMaintenance(async () => {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(['meta', 'records'], 'readwrite');
      let conflict = false;
      getState(transaction.objectStore('meta'), (state) => {
        if (expectedDatasetId !== undefined && state.activeDatasetId !== expectedDatasetId) { conflict = true; transaction.abort(); return; }
        // This database is application-owned; no other origin or app is cleared.
        transaction.objectStore('records').clear();
        transaction.objectStore('meta').put({ key: 'state', value: { schemaVersion: 1, activeDatasetId: crypto.randomUUID(), recoveryDatasetId: null } } satisfies StoredState);
      });
      transaction.addEventListener('complete', () => { notifyDataChange(); resolve(); });
      transaction.addEventListener('abort', () => reject(conflict ? new PersonalStoreError('conflict', '个人数据已被另一页面替换，请重新核对') : storageFailure(transaction, '清理失败，原数据仍保留')));
    });
  });
}

export async function importPersonalBackup(json: string): Promise<void> {
  return withMaintenance(() => importPersonalBackupTransaction(json));
}

export async function restorePreviousDataset(): Promise<void> {
  return withMaintenance(() => restorePreviousDatasetTransaction());
}

export async function discardRecoveryDataset(): Promise<void> {
  return withMaintenance(() => discardRecoveryDatasetTransaction());
}

export async function deletePersonalRecord(kind: 'note' | 'draft', id: string, expectedRevision: number | null, expectedDatasetId: string): Promise<void> {
  assertWritable();
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['meta', 'records'], 'readwrite');
    let conflict = false;
    getState(transaction.objectStore('meta'), (state) => {
      if (state.activeDatasetId !== expectedDatasetId) { conflict = true; transaction.abort(); return; }
      const records = transaction.objectStore('records');
      const key = [state.activeDatasetId, kind, id];
      const request = records.get(key);
      request.addEventListener('success', () => {
        const current: unknown = request.result;
        if (current === undefined && expectedRevision === null) return;
        if (!isStoredRecord(current) || current.revision !== expectedRevision || maintenanceTokens.size > 0) { conflict = true; transaction.abort(); return; }
        records.delete(key);
      });
    });
    transaction.addEventListener('complete', () => { notifyDataChange(); resolve(); });
    transaction.addEventListener('abort', () => reject(conflict ? new PersonalStoreError('conflict', '记录已在另一页面变化，请刷新后再删除') : storageFailure(transaction, '删除失败，记录仍保留')));
  });
}
