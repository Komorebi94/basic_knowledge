import { useCallback, useEffect, useRef, useState } from "react";
import { readLearning, updateLearning } from "../../infrastructure/persistence/personalStore";
import type { LearningState } from "../../domain/learning";

export function useLearning() {
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof readLearning>> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = useRef(snapshot);
  const generation = useRef(0);
  const mounted = useRef(true);
  const reload = useCallback(async () => {
    const token = ++generation.current;
    try { const value = await readLearning(); if (mounted.current && token === generation.current) { current.current = value; setSnapshot(value); setError(""); } }
    catch (cause: unknown) { if (mounted.current && token === generation.current) setError(cause instanceof Error ? cause.message : "无法读取学习数据"); }
  }, []);
  useEffect(() => {
    mounted.current = true;
    queueMicrotask(() => { if (mounted.current) void reload(); });
    const read = () => { void reload(); };
    window.addEventListener("focus", read);
    window.addEventListener("zhixu-data-change", read);
    return () => { mounted.current = false; window.removeEventListener("focus",read); window.removeEventListener("zhixu-data-change",read); };
  }, [reload]);
  const mutate = useCallback(async (updater: (state: LearningState) => LearningState) => {
    if (!current.current) throw new Error("学习数据尚未载入");
    const datasetId = current.current.datasetId;
    setBusy(true);
    try {
      const result = await updateLearning(updater, datasetId);
      ++generation.current;
      if (mounted.current) { current.current = result; setSnapshot(result); setError(""); }
      return result;
    } catch (cause: unknown) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "保存失败，请重试");
      throw cause;
    } finally { if (mounted.current) setBusy(false); }
  }, []);
  return { snapshot, error, busy, reload, mutate };
}
