import type { Article } from "../articles";

export const requestObservabilityArticle: Article = {
  id: "K14-08",
  kind: "knowledge",
  domainSlug: "server",
  slug: "request-observability",
  title: "全链路可观测性",
  summary: "用同一请求编号串起日志、指标和跨度，缺少编号或字段里出现令牌时不记，不同编号不能当成同一次请求。",
  aliases: ["trace", "request id", "OpenTelemetry", "可观测性"],
  tags: ["服务端", "日志", "追踪"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "笔记保存失败了，为什么日志、指标和追踪对不上同一次请求？",
      paragraphs: [
        "页面显示保存失败。日志里有一句 saved，指标里笔记计数加了一，追踪里有一段 bff，但三份记录没有同一个请求编号。值班的人无法判断这句日志是不是这次失败，也不能看出时间花在聚合还是下游。另一条日志把令牌字段一起写进去，排查记录变成了新的凭证副本。",
        "同一次用户操作应带一个请求编号。日志、指标和跨度都引用它。没有编号就不记。字段名像令牌、授权、密码或 Cookie 时拒绝写入。本篇只检查记录的形状，不连接追踪系统。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：编号会去掉空白，秘密字段按名字拒绝",
      paragraphs: [
        "运行 npm run verify:k14。record 要求 requestId 是可修剪的非空字符串。日志会检查 fields 的键名，包含 token、authorization、password 或 cookie 时返回 secret，不返回字段的值。指标需要非空 name。跨度没有 parent 时记为 root。",
        "sameTrace 要求数组里的编号全部相同才返回 linked，否则 split。空数组是 empty。函数不生成 traceparent，也不采样。"
      ]
    },
    {
      id: "record",
      title: "没有编号的成功日志不能写入，带令牌字段的记录直接拒绝",
      paragraphs: [
        "只有 message、没有 requestId 的日志返回 missing-id。req-1 的日志若 fields 里有 token，返回 secret，输出中没有 session-demo。编号两边有空格时先修剪，日志是 log:req-1:saved。",
        "指标 notes 记成 metric:notes:req-1。带 parent bff 的跨度是 span:req-1:bff，没有 parent 的是 span:req-1:root。同一次保存因此可以在日志、计数和聚合跨度上使用同一个 req-1。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function record(event) {
  if (!event || typeof event.requestId !== 'string' || !event.requestId.trim()) return 'missing-id';
  const id = event.requestId.trim();
  if (event.kind === 'log') {
    const fields = event.fields || {};
    for (const key of Object.keys(fields)) {
      if (/token|authorization|password|cookie/i.test(key)) return 'secret';
    }
    return 'log:' + id + ':' + (event.message || 'empty');
  }
  if (event.kind === 'metric') {
    if (typeof event.name !== 'string' || !event.name) return 'invalid';
    return 'metric:' + event.name + ':' + id;
  }
  if (event.kind === 'span') return 'span:' + id + ':' + (event.parent || 'root');
  return 'invalid';
}
console.log('无编号:' + record({ kind: 'log', message: 'saved' }));
console.log('令牌:' + record({ kind: 'log', requestId: 'req-1', message: 'saved', fields: { token: 'session-demo' } }));
console.log('日志:' + record({ kind: 'log', requestId: ' req-1 ', message: 'saved' }));
console.log('指标:' + record({ kind: 'metric', requestId: 'req-1', name: 'notes' }));
console.log('跨度:' + record({ kind: 'span', requestId: 'req-1', parent: 'bff' }));
console.log('根跨度:' + record({ kind: 'span', requestId: 'req-1' }));`,
          expectedOutput: [
            "无编号:missing-id",
            "令牌:secret",
            "日志:log:req-1:saved",
            "指标:metric:notes:req-1",
            "跨度:span:req-1:bff",
            "根跨度:span:req-1:root"
          ],
          explanation: [
            "缺编号的日志被拒绝，避免一条无法归属的 saved 混进失败排查。令牌字段只返回 secret，值不会出现在结果里。",
            "日志、指标和跨度都带修剪后的 req-1。没有父级的跨度用 root，表示它是这次记录里的起点，而不是丢失了父级。"
          ]
        }
      ]
    },
    {
      id: "trace",
      title: "编号一致才能串起来，两个编号就是两次请求",
      paragraphs: [
        "sameTrace 收到两个 req-1 时返回 linked:req-1。一个 req-1 和一个 req-2 返回 split。失败页面上的日志若属于 req-2，就不能用来解释 req-1 的指标。",
        "聚合层、笔记服务和页面各写各的编号，看起来都有追踪，仍然 split。编号应在入口生成或从已核对的上游传下来，下游只延续，不另起一个无法对应的名字。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function sameTrace(ids) {
  if (!ids.length) return 'empty';
  return ids.every((item) => item === ids[0]) ? 'linked:' + ids[0] : 'split';
}
console.log('同一条:' + sameTrace(['req-1', 'req-1']));
console.log('拆开:' + sameTrace(['req-1', 'req-2']));
console.log('空:' + sameTrace([]));`,
          expectedOutput: [
            "同一条:linked:req-1",
            "拆开:split",
            "空:empty"
          ],
          explanation: [
            "两条记录编号相同才链接。req-2 即使时间接近，也不能并进 req-1。",
            "空列表没有可链接的请求，返回 empty，而不是伪造一个编号。"
          ]
        }
      ]
    },
    {
      id: "signals",
      title: "日志说明发生了什么，指标说明多少次，跨度说明时间落在哪一段",
      paragraphs: [
        "saved 这句日志回答这一次的结果。notes 指标回答计数，但不能代替那一句失败原因。bff 跨度回答时间花在聚合，还要有下游跨度才能看出是哪一个调用慢。三种信号都挂在 req-1 上，才构成同一次保存的证据。",
        "不要只增加日志行数。没有编号的行、含有令牌的字段，以及和指标对不上的跨度，都会让失败更难看。K11-05 要求写入前去掉凭证；这里的 secret 是同一约束在追踪记录上的入口。"
      ]
    },
    {
      id: "boundaries",
      title: "这些字符串不是一次导出的追踪，秘密检查也不读取字段的值",
      paragraphs: [
        "record 不生成 W3C traceparent，不设置采样率，也不把跨度发给收集器。span:req-1:bff 只说明父级名字被记下。真正的追踪还要有时间、状态和能够公开的属性。",
        "secret 只看键名。键名普通、值里夹着令牌时，这个函数不会发现。值的脱敏仍要按 K11-05 在写入前处理。返回 secret 时不回显原值。",
        "sameTrace 不做时间重叠判断。两个相同编号若被错误地复用到两次保存，函数仍返回 linked。编号必须一次一新，不能用用户 id 或笔记 id 代替请求编号。"
      ]
    },
    {
      id: "practice",
      title: "一次保存至少留下同一编号的日志、指标和跨度",
      paragraphs: [
        "缺编号和令牌字段都应失败，并且失败输出里没有令牌值。成功路径三条记录使用同一个 req-1。再拿 req-2 做一次 split，确认不能把邻近的失败算进这次。",
        "本主题没有已开放的独立练习。示例不连接收集器。session-demo 只作为必须被拒绝的输入。"
      ]
    }
  ],
  sources: [
    { title: "W3C：Trace Context", url: "https://www.w3.org/TR/trace-context/" },
    { title: "OpenTelemetry：Signals", url: "https://opentelemetry.io/docs/concepts/signals/" },
    { title: "OpenTelemetry：Context propagation", url: "https://opentelemetry.io/docs/concepts/context-propagation/" }
  ]
};
