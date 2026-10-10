import { useCallback, useEffect, useState } from "react";
import { readPersonalDataset, type PersonalDatasetSnapshot } from "../../infrastructure/persistence/personalStore";

export function usePersonalDataset() {
  const [snapshot, setSnapshot] = useState<PersonalDatasetSnapshot | null>(null);
  const [error, setError] = useState("");
  const [reloadId, setReloadId] = useState(0);
  const reload = useCallback(() => setReloadId((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const read = () => {
      const current = ++requestId;
      readPersonalDataset().then((result) => {
        if (!active || current !== requestId) return;
        setSnapshot(result);
        setError("");
      }).catch((cause: unknown) => {
        if (!active || current !== requestId) return;
        setError(cause instanceof Error ? cause.message : "无法读取本地数据");
      });
    };
    read();
    window.addEventListener("focus", read);
    window.addEventListener("zhixu-data-change", read);
    return () => {
      active = false;
      window.removeEventListener("focus", read);
      window.removeEventListener("zhixu-data-change", read);
    };
  }, [reloadId]);

  return { snapshot, error, reload };
}
