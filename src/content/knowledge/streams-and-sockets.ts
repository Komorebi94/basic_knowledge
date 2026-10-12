import type { Article } from "../articles";

export const streamsAndSocketsArticle: Article = {
  "id": "K06-06",
  "kind": "knowledge",
  "domainSlug": "networking",
  "slug": "streams-and-sockets",
  "title": "SSE、WebSocket 与实时流",
  "summary": "按单双向、顺序和背压选择 SSE 或 WebSocket，并用事件编号处理重连后的重复与断档。",
  "aliases": ["SSE", "EventSource", "WebSocket", "backpressure", "Last-Event-ID", "实时流"],
  "tags": ["网络", "实时", "SSE、WebSocket 与实时流"],
  "estimatedMinutes": 23,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "重连之后，为什么同一条订单状态出现了两次？",
      "paragraphs": [
        "服务端把订单状态持续推给页面。连接断开后客户端重连，服务端从缓冲里重发最近几条，页面又把“已发货”执行了一次发通知。实时通道要先回答数据朝哪边流、断线后如何接上、重复事件如何识别，以及生产速度超过消费速度时丢什么。",
        "前置是 K02-05 的取消和 K06-02 的失败分类。浏览器提供 EventSource 和 WebSocket 构造器；空白页示例不连接真实服务器。下面用文本解析、编号应用和有界缓冲复现这三件事。"
      ]
    },
    {
      "id": "choice",
      "title": "服务器单向文本用 SSE，双向字节用 WebSocket",
      "paragraphs": [
        "SSE 基于 HTTP 响应流，浏览器 EventSource 负责按事件分帧，并在断开后按约定重连，可以把上次事件编号放进 Last-Event-ID。它适合通知、进度和只由服务器推送的状态。客户端要上传操作时，仍用普通请求，不要为了一条提交按钮升级成套接字。",
        "WebSocket 是双向的消息通道，适合协作光标、设备指令和对等的连续消息。它没有 SSE 那套浏览器内建的事件编号和自动重连语义，顺序、心跳、重连和鉴权都要写进协议。只需要请求后得到一个结果时，继续用 fetch。构造器存在只说明运行环境有这个类型，不说明网络允许升级或代理不会断开长连接。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function choose(need) {\n  if (need === 'server-text') return 'sse';\n  if (need === 'bidirectional') return 'websocket';\n  if (need === 'one-response') return 'fetch';\n  return 'unspecified';\n}\nconsole.log([choose('server-text'), choose('bidirectional'), choose('one-response')].join(','));\nconsole.log([typeof EventSource, typeof WebSocket].join(','));",
          "expectedOutput": ["sse,websocket,fetch", "function,function"],
          "explanation": [
            "第一行按数据方向选择通道。第二行说明当前空白页提供这两种构造器。",
            "选择函数不测量延迟，也不判断企业代理是否每分钟断开空闲连接。长连接仍要有心跳、超时和退回普通请求的路径。"
          ]
        }
      ]
    },
    {
      "id": "frames",
      "title": "SSE 以空行分帧，id 会保留到下一条事件",
      "paragraphs": [
        "事件之间用空行分开。以冒号开头的行是注释。data 可以出现多次，值按换行拼成正文；字段冒号后的一个前导空格要去掉。id 属于这条流的当前位置，下一条没有新 id 时仍使用它。解析完一帧才能把它交给业务。",
        "下面的解析器把 id 和 data 打成日志，多行 data 用可见的 \\n 连接，避免控制台把一条事件拆开。它不处理重试字段和 BOM。服务端若把一条业务消息拆成多个 data 行，客户端必须在空行处才提交，不能每读到一行就更新界面。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function parseSse(text) {\n  const events = [];\n  let data = [];\n  let id = '';\n  const flush = () => {\n    if (data.length) events.push((id || '-') + ':' + data.join('\\\\n'));\n    data = [];\n  };\n  for (const line of text.split('\\n')) {\n    if (line === '') { flush(); continue; }\n    if (line.startsWith(':')) continue;\n    const index = line.indexOf(':');\n    const field = index === -1 ? line : line.slice(0, index);\n    let value = index === -1 ? '' : line.slice(index + 1);\n    if (value.startsWith(' ')) value = value.slice(1);\n    if (field === 'data') data.push(value);\n    if (field === 'id') id = value;\n  }\n  flush();\n  return events.join('|');\n}\nconsole.log(parseSse('id: 7\\ndata: hello\\n\\ndata: a\\ndata: b\\n\\n'));",
          "expectedOutput": ["7:hello|7:a\\nb"],
          "explanation": [
            "第一条事件的 id 是 7、data 是 hello。第二条没有新 id，两行 data 合成 a 和 b，日志里显示为 a\\nb。",
            "id 中的空格按规范去掉了一个前导空格，所以结果是 7 而不是带前导空格的原始字段。不完整的最后一帧若没有空行，这个解析器会在结束时提交；网络分块时不能把缓冲区尾部当成完整事件。"
          ]
        }
      ]
    },
    {
      "id": "resume",
      "title": "用事件编号丢掉重复，用有界缓冲处理背压",
      "paragraphs": [
        "重连后服务端可能重发已经处理过的编号。客户端保存最后一条已应用的 id，小于或等于它的事件只确认、不重复执行副作用。编号出现空档时不能靠跳号假装没有丢消息，应重新拉取一份权威快照，再从新的 id 继续。编号要由服务端按业务流分配，不能用客户端本地时钟代替。",
        "生产速度快于界面时，要规定缓冲策略。订单状态可以保留最新一条，旧状态可以丢。聊天文本不能只留最新一条，缓冲满了应停止读取或断开，让发送方感知背压。下面的函数在超过上限时丢掉最旧的消息并计数；这适合可合并的状态，不适合资金流水。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function apply(lastId, event) {\n  if (event.id <= lastId) return 'duplicate:' + lastId;\n  return 'apply:' + event.id + ':' + event.text;\n}\nfunction pushBounded(buffer, message, limit) {\n  const next = buffer.concat(message);\n  const dropped = Math.max(0, next.length - limit);\n  return { buffer: next.slice(next.length - limit), dropped };\n}\nconsole.log([apply(7, { id: 7, text: 'shipped' }), apply(7, { id: 8, text: 'delivered' })].join(','));\nconst first = pushBounded(['a', 'b'], 'c', 2);\nconsole.log(first.dropped + ':' + first.buffer.join(''));",
          "expectedOutput": ["duplicate:7,apply:8:delivered", "1:bc"],
          "explanation": [
            "编号 7 已经应用过，再次出现只记为重复。编号 8 可以应用。缓冲上限为 2 时，放入 c 会丢掉最旧的 a，留下 bc，丢弃计数为 1。",
            "比较使用数值编号。真实流可能使用字符串游标，比较规则要由服务端定义。丢弃计数应进入监控，而不是只在内存里悄悄截断。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "把重连当成一次新的业务操作",
      "paragraphs": [
        "错误处理是每次 EventSource 的 open 都提交“用户上线”或重新下单。重连是传输恢复，不是新的用户意图。副作用只接受尚未应用的事件编号，连接事件只更新连接状态。",
        "另一个错误是 WebSocket 收到消息就无限 push 到数组。页面隐藏或主线程卡住时，数组会持续增长。为可合并的数据保留最新值；为不可合并的数据设置上限、告警和断开条件。"
      ]
    },
    {
      "id": "boundaries",
      "title": "空白页里的构造器不证明长连接可用",
      "paragraphs": [
        "第一条边界是网络路径。代理超时、企业防火墙和 HTTP/1.1 中间设备都可能打断 SSE 或 WebSocket。示例没有发起连接，因此没有测量这些路径。上线前要在目标网络里观察重连和心跳。",
        "第二条边界是鉴权。SSE 的浏览器接口不容易为每次重连附加新的 Authorization 头。用 Cookie 时要重新检查 K06-04 的 CSRF 和过期刷新；用一次性票据时，重连要能更换票据，不能把票据写进永久 URL。"
      ]
    },
    {
      "id": "practice",
      "title": "预测重放编号和缓冲溢出",
      "paragraphs": [
        "给一段带 id 和两行 data 的文本，先写出解析结果。再设 lastId 为 7，预测编号 7 和 8 分别是重复还是应用。最后把上限为 2 的缓冲从 ab 再放入 c，预测留下哪些元素。",
        "已发布的 E13 负责“只提交最新请求”，和这里“只应用更新的事件编号”是相邻问题。套接字练习尚未另建题目。"
      ]
    }
  ],
  "sources": [
    { "title": "HTML：服务器发送事件", "url": "https://html.spec.whatwg.org/multipage/server-sent-events.html" },
    { "title": "WebSockets 标准", "url": "https://websockets.spec.whatwg.org/" }
  ]
};
