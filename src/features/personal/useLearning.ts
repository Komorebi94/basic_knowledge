import { useCallback, useEffect, useRef, useState } from "react";
import { readLearning } from "../../infrastructure/persistence/personalStore";

export function useLearning() {
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof readLearning>> | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const reload = useCallback(async () => {
    const token = ++generation.current;
    try {
      const value = await readLearning();
      if (mounted.current && token === generation.current) setSnapshot(value);
    } catch {
      // 读取失败时保留已有快照。顶栏只根据已保存的正文字号调整。
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    queueMicrotask(() => { if (mounted.current) void reload(); });
    const read = () => { void reload(); };
    window.addEventListener("focus", read);
    window.addEventListener("zhixu-data-change", read);
    return () => { mounted.current = false; window.removeEventListener("focus", read); window.removeEventListener("zhixu-data-change", read); };
  }, [reload]);
  return { snapshot };
}
