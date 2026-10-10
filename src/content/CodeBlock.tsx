import { useState } from "react";

export function CodeBlock({ code }: { code: string }) {
  const [message, setMessage] = useState("");
  const [wrap, setWrap] = useState(false);
  return (
    <div className="code-block">
      <div className="code-actions"><button type="button" onClick={() => setWrap((value) => !value)} aria-pressed={wrap}>{wrap ? "取消换行" : "代码换行"}</button><button type="button" onClick={() => {
        if (!navigator.clipboard) { setMessage("请选择代码手动复制"); return; }
        navigator.clipboard.writeText(code).then(() => setMessage("已复制")).catch(() => setMessage("请选择代码手动复制"));
      }}>复制代码</button><span role="status">{message}</span></div>
      <pre className={wrap ? "code-wrap" : undefined}><code>{code}</code></pre>
    </div>
  );
}
