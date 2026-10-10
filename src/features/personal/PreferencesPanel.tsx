import { useState } from "react";
import { cleanupRunDetails } from "../../domain/practice";
import { changeReviewTimezone } from "../../domain/review";
import { validTimezone, type Preferences } from "../../domain/personalLearning";
import { useLearning } from "./useLearning";
import { clearPersonalData } from "../../infrastructure/persistence/personalStore";

export function PreferencesPanel() {
  const { snapshot,busy,error,mutate,reload } = useLearning();
  const [timezone,setTimezone] = useState<string | null>(null);
  const [message,setMessage] = useState("");
  const [pending,setPending] = useState<Preferences | null>(null);
  const preferences = pending ?? snapshot?.state.personal.preferences;
  function save(update: Partial<Preferences>) {
    if (!preferences) return;
    setPending({ ...preferences,...update });
    void mutate((state) => ({ ...state,
      personal:{ ...state.personal,preferences:{ ...state.personal.preferences,...update } },
      review:update.studyTimezone && update.studyTimezone !== state.personal.preferences.studyTimezone ? changeReviewTimezone(state.review,update.studyTimezone):state.review,
    })).then(() => setMessage("设置已保存并生效。")).catch(() => {}).finally(() => setPending(null));
  }
  return <section className="topic-section"><h2>学习设置</h2>
    {!preferences ? <p role="status">正在读取设置……</p> : <div className="settings-fields">
      <label htmlFor="daily-limit">每日卡片上限</label><select id="daily-limit" value={preferences.dailyLimit} disabled={busy} onChange={(event) => { const value = Number(event.target.value); if (value === 10 || value === 20 || value === 30) save({dailyLimit:value}); }}><option value={10}>10 张</option><option value={20}>20 张</option><option value={30}>30 张</option></select><p>每日新卡最多 5 张；到期卡和新卡共同占用上限。</p>
      <label htmlFor="study-timezone">学习时区（IANA 名称）</label><input className="text-input" id="study-timezone" value={timezone ?? preferences.studyTimezone} disabled={busy} onChange={(event) => setTimezone(event.target.value)} placeholder="Asia/Shanghai" />
      <button className="button secondary" disabled={busy} onClick={() => { const zone = (timezone ?? preferences.studyTimezone).trim(); if (!validTimezone(zone)) { setMessage("请输入有效时区，例如 Asia/Shanghai 或 America/New_York。"); return; } save({studyTimezone:zone}); }}>保存时区</button><p>更换时区会按最后评分时刻重算到期日；进行中的会话保留原时区。</p>
      <label htmlFor="body-size">正文字号</label><select id="body-size" value={preferences.bodySize} disabled={busy} onChange={(event) => save({bodySize:event.target.value === "large" ? "large":"normal"})}><option value="normal">标准</option><option value="large">较大</option></select>
      <label className="checkbox-label"><input type="checkbox" checked={preferences.runShortcut} disabled={busy} onChange={(event) => save({runShortcut:event.target.checked})} />启用练习运行快捷键 Ctrl / ⌘ + Enter</label>
      <p>上次发起导出：{preferences.lastExportAt ? new Date(preferences.lastExportAt).toLocaleString("zh-CN"):"尚未导出"}</p>
    </div>}
    {(message || error) && <p className="feedback-panel" role={error ? "alert":"status"}>{error || message}</p>}{error && <button className="button secondary" onClick={() => { void reload(); }}>重新读取</button>}
  </section>;
}
export function ClearDataPanel() {
  const { snapshot,reload } = useLearning();
  const [confirm,setConfirm] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  return <section className="topic-section"><h2>清除本地个人数据</h2><p>清除本站的笔记、草稿、阅读、收藏、评分、练习记录、设置和恢复点。请先下载备份；公共文章保留。</p>
    <button className="button secondary" disabled={busy || !snapshot} onClick={() => setConfirm(true)}>清除个人数据</button>
    {confirm && <div className="feedback-panel" role="alert"><p>确认清除本站全部个人数据与恢复点？此操作不能撤销，请确认备份已保留。</p><div className="action-row"><button className="button secondary" disabled={busy} onClick={() => setConfirm(false)}>取消</button><button className="button primary" disabled={busy || !snapshot} onClick={() => { if (!snapshot) return; setBusy(true); void clearPersonalData(snapshot.datasetId).then(() => { setMessage("个人数据已清除。"); setConfirm(false); void reload(); }).catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message:"清除失败，原数据保留")).finally(() => setBusy(false)); }}>确认清除全部个人数据</button></div></div>}
    {message && <p className="feedback-panel" role="status">{message}</p>}
  </section>;
}

export function StorageUsagePanel() {
  const { snapshot,busy,error,mutate } = useLearning();
  const [estimate,setEstimate] = useState<{usage:number;quota:number} | null>(null);
  const [notice,setNotice] = useState("");
  const [confirm,setConfirm] = useState(false);
  async function inspect() {
    if (!navigator.storage?.estimate) { setNotice("当前浏览器无法估算空间，请定期导出备份。"); return; }
    try {
      const value = await navigator.storage.estimate();
      if (typeof value.usage !== "number" || typeof value.quota !== "number" || !Number.isFinite(value.usage) || !Number.isFinite(value.quota) || value.quota <= 0) { setNotice("当前浏览器未提供有效的空间估算。"); return; }
      setEstimate({usage:value.usage,quota:value.quota}); setNotice("");
    } catch { setNotice("空间估算暂不可用，请定期导出备份。"); }
  }
  const percentage = estimate ? Math.round(estimate.usage / estimate.quota * 100) : null;
  return <section className="topic-section"><h2>本地存储空间</h2><p>浏览器空间是估算值，可能随设备和隐私模式变化。</p><button className="button secondary" onClick={() => { void inspect(); }}>查看空间估算</button>
    {estimate && <p role="status">此地址已使用约 {(estimate.usage/1024/1024).toFixed(1)} MiB，可用配额约 {(estimate.quota/1024/1024).toFixed(1)} MiB（{percentage}%）。</p>}
    {percentage !== null && percentage >= 80 && <p role="alert">空间已达到配额的 80%，请先导出备份，再清理练习运行详情。</p>}
    <p>清理只删除较早运行的代码和逐项结果，保留学习证据、运行摘要以及各题最近独立通过的代码。</p><button className="button secondary" disabled={!snapshot || busy} onClick={() => setConfirm(true)}>清理较早运行详情</button>
    {confirm && <div className="feedback-panel" role="alert"><p>确认清理较早运行详情？请先下载备份。</p><div className="action-row"><button className="button secondary" disabled={busy} onClick={() => setConfirm(false)}>取消</button><button className="button primary" disabled={busy} onClick={() => { void mutate((state) => ({ ...state,practice:cleanupRunDetails(state.practice) })).then(() => { setConfirm(false); setNotice("较早运行详情已清理，学习证据保留。"); }).catch(() => {}); }}>确认清理运行详情</button></div></div>}
    {(notice || error) && <p className="feedback-panel" role={error ? "alert":"status"}>{error || notice}</p>}
  </section>;
}
