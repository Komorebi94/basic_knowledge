import { useState } from "react";
import { discardRecoveryDataset, exportPersonalBackup, importPersonalBackup, previewPersonalBackup, restorePreviousDataset, updateLearning } from "../../infrastructure/persistence/personalStore";
import { usePersonalDataset } from "./usePersonalDataset";
import { ClearDataPanel, PreferencesPanel, StorageUsagePanel } from "./PreferencesPanel";

interface ImportPreview {
  json: string;
  fileName: string;
  notes: number;
  drafts: number;
  exportedAt: string;
  learningRecords: number;
  bookmarks: number;
  ratings: number;
  practiceDrafts: number;
  attempts: number;
  evidence: number;
}

export function DataSettingsPage() {
  const { snapshot, error, reload } = usePersonalDataset();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [exportStarted, setExportStarted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  async function perform(action: () => Promise<void>, success: string) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage(success);
      reload();
    } catch (cause: unknown) {
      setMessage(cause instanceof Error ? cause.message : "操作失败，原数据未更改。");
    } finally {
      setBusy(false);
    }
  }

  async function downloadBackup() {
    const json = await exportPersonalBackup();
    const url = URL.createObjectURL(new Blob([json], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `zhixu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setExportStarted(true);
    if (snapshot) await updateLearning((state) => ({ ...state, personal: { ...state.personal, preferences: { ...state.personal.preferences, lastExportAt: new Date().toISOString() } } }), snapshot.datasetId);
  }

  return (
    <div className="standard-page">
      <div className="page-intro"><p className="eyebrow">设置与数据</p><h1>保留你的积累</h1><p>笔记与草稿仅保存在当前浏览器。更换设备、地址或清理浏览器前，请先下载备份。</p></div>
      {error && <div className="feedback-panel" role="alert"><p>{error}</p><button className="button secondary" onClick={reload}>重新读取</button></div>}
      <PreferencesPanel />
      <section className="topic-section"><h2>导出备份</h2><p>备份包含你的笔记与代码，请妥善保存。当前格式覆盖笔记、草稿、阅读收藏、复习评分与练习证据；旧版笔记草稿备份仍可导入。</p>
        <button className="button primary" disabled={busy || !snapshot} onClick={() => { void perform(downloadBackup, "已发起备份下载，请确认文件已保存。"); }}>下载当前数据</button>
      </section>
      <section className="topic-section"><h2>从备份替换</h2><p>导入会全量替换当前个人学习记录、笔记与草稿，并保留一份导入前的数据作为恢复点。</p>
        <label className="file-input-label">选择 JSON 备份<input type="file" accept=".json,application/json" disabled={busy || !snapshot || snapshot.recoveryAvailable} onChange={(event) => {
          const file = event.target.files?.[0];
          setPreview(null); setConfirmed(false); setExportStarted(false);
          if (!file) return;
          if (file.size > 50 * 1024 * 1024) { setMessage("备份不能超过 50 MiB。"); return; }
          setBusy(true);
          file.text().then((json) => {
            const result = previewPersonalBackup(json);
            setPreview({ ...result, json, fileName: file.name });
            setMessage("");
          }).catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message : "备份无法读取")).finally(() => setBusy(false));
        }} /></label>
        {snapshot?.recoveryAvailable && <p className="muted-copy">请先恢复或清理上一次导入的恢复点，再选择新备份。</p>}
        {preview && <div className="backup-preview"><h3>{preview.fileName}</h3><p>包含 {preview.notes} 条笔记、{preview.drafts} 条旧草稿；另含 {preview.practiceDrafts} 条练习草稿、{preview.bookmarks} 条收藏、{preview.ratings} 条评分记录、{preview.attempts} 次尝试和 {preview.evidence} 条练习证据。导出于 {new Date(preview.exportedAt).toLocaleString("zh-CN")}。</p>
          <p>将替换当前 {snapshot?.records.filter((record) => record.kind === "note").length ?? 0} 条笔记、{snapshot?.records.filter((record) => record.kind === "draft").length ?? 0} 条草稿。</p>
          <label className="checkbox-label"><input type="checkbox" checked={confirmed} disabled={!exportStarted || busy} onChange={(event) => setConfirmed(event.target.checked)} />我已下载并保留当前数据备份</label>
          <button className="button primary" disabled={!confirmed || !exportStarted || busy || snapshot?.recoveryAvailable} onClick={() => {
            void perform(async () => { await importPersonalBackup(preview.json); setPreview(null); setConfirmed(false); setExportStarted(false); }, "备份已导入，可恢复到导入前的数据。");
          }}>替换个人数据</button>
        </div>}
      </section>
      {snapshot?.recoveryAvailable && <section className="topic-section"><h2>导入恢复点</h2><p>可以切换到导入前的数据。当前数据也会保留为另一份恢复点，便于再次切回。</p><div className="action-row">
        <button className="button secondary" disabled={busy} onClick={() => { void perform(restorePreviousDataset, "已切换到恢复数据集。"); }}>恢复另一数据集</button>
        <button className="button secondary" disabled={busy} onClick={() => setConfirmDiscard(true)}>清理恢复点</button>
      </div>{confirmDiscard && <div className="feedback-panel"><p>清理后只保留当前数据集，另一数据集将被删除。请确认已保留备份。</p><div className="action-row"><button className="button secondary" disabled={busy} onClick={() => setConfirmDiscard(false)}>取消</button><button className="button primary" disabled={busy} onClick={() => { void perform(async () => { await discardRecoveryDataset(); setConfirmDiscard(false); }, "恢复点已清理，当前数据保持有效。"); }}>确认清理</button></div></div>}</section>}
      <StorageUsagePanel />
      <ClearDataPanel />
      {busy && <p role="status">正在处理本地数据……</p>}
      {message && <p className="feedback-panel" role="status">{message}</p>}
    </div>
  );
}
