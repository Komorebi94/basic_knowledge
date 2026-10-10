import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker, type BlockerFunction } from "react-router";
import { PersonalStoreError, deletePersonalRecord, registerUnsavedDataGuard, readPersonalDataset, savePersonalRecord, type PersonalRecord } from "../../infrastructure/persistence/personalStore";

type NoteRecord = Extract<PersonalRecord, { kind: "note" }>;
type SaveStatus = "loading" | "ready" | "saved" | "dirty" | "saving" | "error" | "conflict";

export function NoteEditor({ contentId, title, headingId = null, onSaved }: { contentId: string; title: string; headingId?: string | null; onSaved?: () => void }) {
  const noteId = `note:${contentId}:${headingId ?? "whole"}`;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [remote, setRemote] = useState<{ datasetId: string; record: NoteRecord | null } | null>(null);
  const data = useRef({ text: "", savedText: "", datasetId: "", revision: null as number | null, loaded: false, blocked: false });
  const inFlight = useRef<Promise<void> | null>(null);
  const mounted = useRef(false);
  const shouldBlock = useCallback<BlockerFunction>(({ currentLocation, nextLocation }) =>
    (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search) && data.current.text !== data.current.savedText, []);
  const blocker = useBlocker(shouldBlock);

  const save = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    if (!data.current.loaded || data.current.blocked || data.current.text === data.current.savedText) return Promise.resolve();

    const operation = async () => {
      try {
        while (data.current.text !== data.current.savedText) {
          const snapshot = data.current.text;
          if (mounted.current) setStatus("saving");
          const saved = await savePersonalRecord({
            kind: "note", id: noteId,
            payload: { contentId, headingId, titleSnapshot: title, text: snapshot },
          }, data.current.revision, data.current.datasetId);
          data.current.revision = saved.revision;
          data.current.savedText = snapshot;
        }
        if (mounted.current) { setStatus("saved"); onSaved?.(); }
      } catch (error: unknown) {
        data.current.blocked = true;
        if (!mounted.current) return;
        if (error instanceof PersonalStoreError && error.code === "conflict") {
          setStatus("conflict");
          setMessage("已保存的数据在另一页面更新，或备份导入切换了数据集。你的输入已保留，请比较后选择。");
          try {
            const dataset = await readPersonalDataset();
            const record = dataset.records.find((item): item is NoteRecord => item.kind === "note" && item.id === noteId) ?? null;
            if (mounted.current) setRemote({ datasetId: dataset.datasetId, record });
          } catch {
            if (mounted.current) setMessage("存在保存冲突，且新版本暂时无法读取。请先复制本页文字，再重试。");
          }
        } else {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "保存失败，输入仍在当前页面，请复制保留。");
        }
      } finally {
        inFlight.current = null;
      }
    };
    inFlight.current = operation();
    return inFlight.current;
  }, [contentId, headingId, noteId, title, onSaved]);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    readPersonalDataset().then((dataset) => {
      if (cancelled) return;
      const record = dataset.records.find((item): item is NoteRecord => item.kind === "note" && item.id === noteId);
      const initialText = record?.payload.text ?? "";
      data.current = { text: initialText, savedText: initialText, datasetId: dataset.datasetId, revision: record?.revision ?? null, loaded: true, blocked: false };
      setText(initialText);
      setReady(true);
      setStatus(record ? "saved" : "ready");
    }).catch((error: unknown) => {
      if (cancelled) return;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "笔记无法读取");
    });
    return () => {
      cancelled = true;
      mounted.current = false;
      void save();
    };
  }, [noteId, save]);

  useEffect(() => registerUnsavedDataGuard(() => data.current.text !== data.current.savedText), []);

  useEffect(() => {
    if (status !== "dirty") return;
    const timeout = window.setTimeout(() => { void save(); }, 500);
    return () => window.clearTimeout(timeout);
  }, [status, text, save]);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    let cancelled = false;
    void save().then(() => {
      if (!cancelled && data.current.text === data.current.savedText) blocker.proceed();
    });
    return () => { cancelled = true; };
  }, [blocker, save]);

  useEffect(() => {
    const preventDataLoss = (event: BeforeUnloadEvent) => {
      if (data.current.text !== data.current.savedText) event.preventDefault();
    };
    window.addEventListener("beforeunload", preventDataLoss);
    return () => window.removeEventListener("beforeunload", preventDataLoss);
  }, []);

  function resolveConflict(useSaved: boolean) {
    if (!remote) return;
    const savedText = remote.record?.payload.text ?? "";
    data.current.datasetId = remote.datasetId;
    data.current.revision = remote.record?.revision ?? null;
    data.current.savedText = savedText;
    data.current.blocked = false;
    if (useSaved) {
      data.current.text = savedText;
      setText(savedText);
      setStatus(remote.record ? "saved" : "ready");
      onSaved?.();
    } else {
      setStatus("dirty");
      void save();
    }
    setRemote(null);
  }

  return (
    <section className="note-editor" aria-labelledby="personal-note-heading">
      <div className="section-title-row"><h2 id="personal-note-heading">编辑笔记</h2><span role="status">{{ loading: "正在读取", ready: "尚无笔记", saved: "已保存到本地", dirty: "等待保存", saving: "正在保存", error: "保存未完成", conflict: "需要处理冲突" }[status]}</span></div>
      <label className="visually-hidden" htmlFor="personal-note">这篇文章的笔记</label>
      <textarea id="personal-note" value={text} disabled={!ready} maxLength={20_000} rows={7}
        onChange={(event) => {
          data.current.text = event.target.value;
          setText(event.target.value);
          if (!data.current.blocked) setStatus("dirty");
        }} onBlur={() => { void save(); }} placeholder="用自己的话解释原理，记录边界与疑问……" />
      <p className="muted-copy" aria-live="polite">{text.length.toLocaleString()} / 20,000 字符</p>
      <div className="action-row"><button className="button secondary" disabled={!ready || status === "saving"} onClick={() => setConfirmDelete(true)}>删除这份笔记</button></div>
      {confirmDelete && <div className="feedback-panel" role="alert"><p>确认删除「{title}」的{headingId ? "章节" : "整篇"}笔记？删除前可先复制文字。</p><div className="action-row"><button className="button secondary" onClick={() => setConfirmDelete(false)}>取消</button><button className="button primary" disabled={status === "saving" || status === "conflict"} onClick={() => {
        void deletePersonalRecord("note", noteId, data.current.revision, data.current.datasetId).then(() => { data.current.text = ""; data.current.savedText = ""; data.current.revision = null; data.current.blocked = false; setText(""); setStatus("ready"); setConfirmDelete(false); onSaved?.(); }).catch((cause: unknown) => { setMessage(cause instanceof Error ? cause.message : "删除失败"); setStatus("error"); });
      }}>确认删除</button></div></div>}
      <p className="muted-copy">仅保存在此浏览器中，编辑后自动保存。浏览器清理或更换地址可能导致数据不可用，请定期备份。</p>
      {blocker.state === "blocked" && <div className="feedback-panel" role="alert"><p>笔记尚未保存，正在尝试保存。若出现错误或冲突，请先处理或复制本页文字。</p><div className="action-row"><button className="button secondary" onClick={() => blocker.reset()}>继续编辑</button>{(status === "error" || status === "conflict") && <button className="button secondary" onClick={() => blocker.proceed()}>放弃未保存输入并离开</button>}</div></div>}
      {(status === "error" || status === "conflict") && <div className="feedback-panel" role="alert">
        <p>{message}</p>
        {remote && <><details><summary>查看已保存版本</summary><pre>{remote.record?.payload.text || "没有已保存笔记"}</pre></details>
          <div className="action-row"><button className="button secondary" onClick={() => resolveConflict(true)}>使用已保存版本</button><button className="button secondary" onClick={() => resolveConflict(false)}>以本页文字覆盖</button></div></>}
        {!remote && ready && <button className="button secondary" onClick={() => { data.current.blocked = false; void save(); }}>重试保存</button>}
        {!ready && <button className="button secondary" onClick={() => window.location.reload()}>重新读取</button>}
        <button className="button secondary" onClick={() => {
          if (!navigator.clipboard) { setMessage("请选中输入框文字手动复制。"); return; }
          navigator.clipboard.writeText(text).then(() => setMessage("本页笔记已复制，请妥善保留。")).catch(() => setMessage("无法自动复制，请选中输入框文字手动复制。"));
        }}>复制本页笔记</button>
      </div>}
    </section>
  );
}
