import type { Article } from "../articles";

export const requestObservabilityArticle: Article = {
  "revision": 2,
  id: "K14-08",
  kind: "knowledge",
  domainSlug: "server",
  slug: "request-observability",
  title: "全链路可观测性",
  summary: "用日志和 trace 关联单次请求，指标按有界维度聚合；区分 requestId、traceId、spanId 与 exemplar，并在写入前去除秘密。",
  aliases: ["trace", "request id", "OpenTelemetry", "可观测性"],
  tags: ["服务端", "日志", "追踪"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-15",
  sections: [
    {
      id: "problem",
      title: "笔记保存失败了，为什么日志、指标和追踪对不上同一次请求？",
      paragraphs: [
        "页面显示保存失败，日志只有 saved 而没有可追踪的上下文，指标虽然增加，却无法说明哪一次请求失败。一次保存可能跨浏览器、聚合与笔记服务；要从聚合指标找到异常时段，再用 trace 和日志定位具体链路，不能要求指标为每个请求保存一条独立序列。",
        "日志可以携带 requestId、traceId 和 spanId，跨度通过 trace 上下文关联；指标则按路由模板、方法、结果类别等有限维度聚合，不把每请求唯一 ID 当普通标签。需要跳到某个具体请求时，可由 exemplar 关联采样测量与 trace。本篇先区分记录形状，再用真实 AsyncLocalStorage 演示异步上下文隔离。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：编号会去掉空白，秘密字段按名字拒绝",
      paragraphs: [
        "运行 npm run verify:k14。record 对单请求日志和跨度要求 requestId 是可修剪的非空字符串。日志会检查 fields 的键名，包含 token、authorization、password 或 cookie 时返回 secret，不返回字段的值。指标只需要非空 name，不强制 requestId；单请求日志和跨度仍需请求身份。跨度没有 parent 时记为 root。",
        "sameTrace 要求数组里的编号全部相同才返回 linked，否则 split。空数组是 empty。函数不生成 traceparent，也不采样。"
      ]
    },
    {
      id: "record",
      title: "没有编号的成功日志不能写入，带令牌字段的记录直接拒绝",
      paragraphs: [
        "只有 message、没有 requestId 的日志返回 missing-id。req-1 的日志若 fields 里有 token，返回 secret，输出中没有 session-demo。编号两边有空格时先修剪，日志是 log:req-1:saved。",
        "指标 notes 记为 metric:notes，不带每请求唯一 ID。单次请求的日志和跨度可以关联 req-1，但 Counter 或 Histogram 的普通标签应使用有限集合；不把每个请求建成一条新时间序列。"
      ],
      examples: [
        {
          "language": "javascript",
          "code": "function record(event) {\n  if (event?.kind === 'metric') {\n    if (typeof event.name !== 'string' || !event.name) return 'invalid';\n    return 'metric:' + event.name;\n  }\n  if (!event || typeof event.requestId !== 'string' || !event.requestId.trim()) return 'missing-id';\n  const id = event.requestId.trim();\n  if (event.kind === 'log') {\n    const fields = event.fields || {};\n    for (const key of Object.keys(fields)) {\n      if (/token|authorization|password|cookie/i.test(key)) return 'secret';\n    }\n    return 'log:' + id + ':' + (event.message || 'empty');\n  }\n\n  if (event.kind === 'span') return 'span:' + id + ':' + (event.parent || 'root');\n  return 'invalid';\n}\nconsole.log('无编号:' + record({ kind: 'log', message: 'saved' }));\nconsole.log('令牌:' + record({ kind: 'log', requestId: 'req-1', message: 'saved', fields: { token: 'session-demo' } }));\nconsole.log('日志:' + record({ kind: 'log', requestId: ' req-1 ', message: 'saved' }));\nconsole.log('指标:' + record({ kind: 'metric', name: 'notes' }));\nconsole.log('跨度:' + record({ kind: 'span', requestId: 'req-1', parent: 'bff' }));\nconsole.log('根跨度:' + record({ kind: 'span', requestId: 'req-1' }));",
          "expectedOutput": [
            "无编号:missing-id",
            "令牌:secret",
            "日志:log:req-1:saved",
            "指标:metric:notes",
            "跨度:span:req-1:bff",
            "根跨度:span:req-1:root"
          ],
          "explanation": [
            "缺少身份的单请求 saved 日志无法归属，模型拒绝它；含秘密字段的日志也不写入。基础设施日志并不一定有 HTTP 请求身份，应按日志类别定义合同，不能因此丢掉进程级故障。",
            "指标输出不带 req-1，名称 notes 代表聚合信号；日志和跨度保留请求关联。本模型不实现 traceparent 或指标 SDK，后面分别解释协议字段与 exemplar。"
          ]
        }
      ]
    },
    {
      id: "trace",
      title: "编号一致才能串起来，两个编号就是两次请求",
      paragraphs: [
        "sameTrace 收到两个 req-1 时返回 linked:req-1。一个 req-1 和一个 req-2 返回 split。失败页面上的日志若属于 req-2，就不能用来解释 req-1 的请求记录。",
        "聚合层、笔记服务和页面各写各的编号，看起来都有追踪，仍然 split。编号应在入口生成或从已核对的上游传下来，下游只延续，不另起一个无法对应的名字。 这里 sameTrace 比较的是作者已归类的单请求记录，不是要求聚合指标携带相同请求标签；跨服务 trace 与 span 还需使用真正的协议上下文。"
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
        "saved 日志解释一次操作的结果；请求量和错误率指标解释一段时间内的分布；trace/span 解释一次链路中各段的关系与时长。requestId 可按应用约定标识一次 HTTP 请求，traceId 可贯穿多个服务与请求，spanId 标识其中一段，三者不应不加区分地当成同一个字段。",
        "把唯一 requestId 或 traceId 塞进普通指标标签，会让标签组合不断增长。指标以路由模板而非实际记录 ID 聚合；exemplar 可以为部分测量附带 trace/span 上下文，作为从聚合图跳转到样本的入口，不能要求每条测量都保留完整请求。"
      ]
    },
    {
      id: "boundaries",
      title: "这些字符串不是一次导出的追踪，秘密检查也不读取字段的值",
      paragraphs: [
        "前面的 record 模型不生成 W3C traceparent，不设置采样率，也不把跨度发给收集器。span:req-1:bff 只说明父级名字被记下。真正的追踪还要有时间、状态和能够公开的属性。",
        "secret 只看键名。键名普通、值里夹着令牌时，这个函数不会发现。值的脱敏仍要按 K11-05 在写入前处理。返回 secret 时不回显原值。",
        "sameTrace 不做时间重叠判断。两个相同编号若被错误地复用到两次保存，函数仍返回 linked。编号必须一次一新，不能用用户 id 或笔记 id 代替请求编号。"
      ]
    },
    {
      "id": "node-context",
      "title": "真实 AsyncLocalStorage：并发请求不串上下文，指标仍是一条序列",
      "paragraphs": [
        "Node 22 中的 AsyncLocalStorage 会沿 Promise 等异步操作保留各自上下文。下面并发处理两个固定作者 trace，日志读取当前 trace；指标只用相同路由模板与结果类别作键。exemplar 结构用于说明关联位置，没有安装或冒充 OpenTelemetry SDK。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { AsyncLocalStorage } from 'node:async_hooks';\nconst context = new AsyncLocalStorage();\nconst logs = [];\nconst counts = new Map();\nlet exemplar;\nasync function save() {\n  await Promise.resolve();\n  const { traceId, spanId } = context.getStore();\n  logs.push({ traceId, spanId, outcome: 'saved' });\n  const labels = JSON.stringify({ route: '/notes/:id', method: 'POST', outcome: 'success' });\n  counts.set(labels, (counts.get(labels) ?? 0) + 1);\n  exemplar = { traceId, spanId, value: 1 };\n}\nawait Promise.all(['a', 'b'].map(letter => context.run({ traceId: letter.repeat(32), spanId: '1'.repeat(16) }, save)));\nconsole.log('日志上下文:' + logs.map(item => item.traceId[0]).join(','));\nconsole.log('指标序列:' + counts.size);\nconsole.log('累计:' + [...counts.values()][0]);\nconsole.log('关联样本:' + exemplar.traceId[0]);",
          "expectedOutput": [
            "日志上下文:a,b",
            "指标序列:1",
            "累计:2",
            "关联样本:b"
          ],
          "explanation": [
            "两个 Promise 恢复时分别读到自己的 a、b 上下文，日志没有互相覆盖。它们共享路由模板和成功类别，因此只有一条指标序列、计数为 2；将 traceId 加进 labels 才会错误地产生每请求新序列。",
            "样本保存 b 的 trace/span 作为关联入口，但生产 exemplar 的采样与导出由 SDK 决定。AsyncLocalStorage 只负责进程内传播；跨 HTTP 服务还需按 W3C Trace Context 验证和传播 traceparent，不得信任外部头中的身份或让其成为授权依据。"
          ]
        }
      ]
    },
    {
      id: "practice",
      title: "一次保存如何进入聚合指标，再定位到具体日志与跨度",
      paragraphs: [
        "缺编号的日志和带令牌字段的日志都应失败，失败输出不能回显令牌。单请求日志与跨度延续同一上下文；指标仅保留有界路由、方法和结果维度，不携带唯一请求编号。用真实 AsyncLocalStorage 例子验证两个并发上下文分离、同类指标仍只累计成一条序列，再解释 exemplar 如何指向其中一个 trace。",
        "本主题没有已开放的独立练习。示例不连接收集器。session-demo 只作为必须被拒绝的输入。"
      ]
    }
  ],
  sources: [
    {
      "title": "W3C：Trace Context",
      "url": "https://www.w3.org/TR/trace-context/"
    },
    {
      "title": "OpenTelemetry：Signals",
      "url": "https://opentelemetry.io/docs/concepts/signals/"
    },
    {
      "title": "OpenTelemetry：Context propagation",
      "url": "https://opentelemetry.io/docs/concepts/context-propagation/"
    },
    {
      "title": "OpenTelemetry：Metrics Data Model",
      "url": "https://opentelemetry.io/docs/specs/otel/metrics/data-model/"
    },
    {
      "title": "Prometheus：Metric and label naming",
      "url": "https://prometheus.io/docs/practices/naming/"
    },
    {
      "title": "Node：AsyncLocalStorage",
      "url": "https://nodejs.org/docs/latest-v22.x/api/async_context.html"
    }
  ]
};
