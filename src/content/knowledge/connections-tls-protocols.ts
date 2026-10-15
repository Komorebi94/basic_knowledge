import type { Article } from "../articles";

export const connectionsTlsProtocolsArticle: Article = {
  "revision": 2,
  "id": "K06-03",
  "kind": "knowledge",
  "domainSlug": "networking",
  "slug": "connections-tls-protocols",
  "title": "连接、TLS 与协议演进",
  "summary": "用源、传输和 ALPN 判断 HTTP/1.1、2、3 各自解决的队头阻塞，并写明浏览器启用它们之前必须具备的条件。",
  "aliases": ["HTTP/2", "HTTP/3", "TLS", "ALPN", "head-of-line blocking", "连接复用"],
  "tags": ["网络", "HTTP", "连接、TLS 与协议演进"],
  "estimatedMinutes": 23,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "同一台服务器，为什么有的资源仍要排队？",
      "paragraphs": [
        "页面同时请求 HTML、接口和图片。开发者以为换到 HTTP/2 之后所有响应都会并行，抓包却仍看到一个慢响应拖住同连接上的其他流。要解释这个现象，先分清三层：哪些 URL 可以复用一条连接，这条连接跑的是哪一版 HTTP，以及阻塞发生在应用报文还是传输层。",
        "前置是 K06-01 的缓存。缓存减少请求，协议决定剩下的请求如何共享连接。本文的源比较使用浏览器 URL 对象。协议选择和丢包时间线是按规范前提写成的决策模型，用来预测“能不能启用”和“谁会被拖住”，不是网卡抓包，也不包含拥塞窗口。"
      ]
    },
    {
      "id": "origin",
      "title": "先判断同源，再核对连接复用的协议条件",
      "paragraphs": [
        "同源 URL 通常是分析连接复用的起点。源由方案、主机和端口组成：https://api.example.test/v1 与显式写 443 的另一路径同源，http 或 cdn 主机则不同源。这个 URL 比较不等于连接复用的完整判据。",
        "HTTP/2 允许在服务器对目标权威、证书覆盖目标主机等条件满足时跨不同 authority 合并连接。同一 IP 或通配证书单独存在都不足以保证浏览器合并，代理、地址验证与客户端策略也可能限制它。应分别记录 origin、证书及实际连接，而不是从“不同源”直接推出“一定新建连接”。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const a = new URL('https://api.example.test/v1');\nconst b = new URL('https://api.example.test:443/other');\nconst c = new URL('http://api.example.test/v1');\nconst d = new URL('https://cdn.example.test/v1');\nconsole.log([a.origin === b.origin, a.origin === c.origin, a.origin === d.origin].join(','));\nconsole.log(a.origin);",
          "expectedOutput": ["true,false,false", "https://api.example.test"],
          "explanation": [
            "第一行说明默认 443 仍与 https 源相同，http 和另一台主机则不同。第二行是序列化后的源，默认端口被省略。",
            "这只比较 URL 源。证书是否覆盖多个名字、DNS 是否指向同一地址，都不会改变这个相等结果。"
          ]
        }
      ]
    },
    {
      "id": "choice",
      "title": "HTTP/2 和 HTTP/3 都有启用前提",
      "paragraphs": [
        "HTTP/1.1 在一条 TCP 连接上一次处理一个响应，浏览器因此会对同一源打开有限的并行连接。HTTP/2 把多个流复用到一条连接上，用二进制帧和头部压缩减少队头等待和应用层连接数。浏览器不使用明文的 h2c；要协商到 h2，连接需要 TLS，并且 ALPN 选中 h2。",
        "HTTP/3 把流放到 QUIC 上，QUIC 使用 UDP，并把 TLS 1.3 做进传输。没有 TLS 1.3，或者没有 Alt-Svc、HTTPS 记录这类发现信号，客户端不会凭空改用 HTTP/3。下面的函数只编码这些前提：UDP 且 TLS 1.3 且已发现时选择 h3；TCP 上有 TLS 且 ALPN 为 h2 时选择 h2；其余走 HTTP/1.1。它不检查密码套件、证书主机名或中间盒。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function choose(input) {\n  if (input.transport === 'udp') return input.tls === '1.3' && input.discovery ? 'h3' : 'unavailable';\n  if (input.transport === 'tcp' && input.tls && input.alpn === 'h2') return 'h2';\n  return 'http/1.1';\n}\nconsole.log(choose({ transport: 'tcp', tls: '', alpn: 'h2', discovery: false }));\nconsole.log(choose({ transport: 'tcp', tls: '1.2', alpn: 'h2', discovery: false }));\nconsole.log(choose({ transport: 'udp', tls: '1.3', alpn: '', discovery: true }));\nconsole.log(choose({ transport: 'udp', tls: '1.2', alpn: '', discovery: true }));",
          "expectedOutput": ["http/1.1", "h2", "h3", "unavailable"],
          "explanation": [
            "没有 TLS 时，即使希望使用 h2，模型仍给出 HTTP/1.1，对应浏览器不走明文 HTTP/2。TCP 加 TLS 且 ALPN 为 h2 时得到 h2。UDP 只有在 TLS 1.3 且存在发现信号时得到 h3，TLS 1.2 的 UDP 不可用。",
            "真实协商还依赖服务器广告和客户端策略。模型里的 discovery 只表示“客户端已经知道可以尝试 HTTP/3”，不代表某次 DNS 查询的结果。"
          ]
        }
      ]
    },
    {
      "id": "blocking",
      "title": "TCP 上的丢包会拖住所有流，QUIC 按流阻塞",
      "paragraphs": [
        "HTTP/2 消除的是 HTTP/1.1 那种“一个响应占住整条连接”的应用层队头阻塞。流仍然共享一条 TCP 连接。TCP 要按序交付字节，一个包丢失时，后面已经到达的字节也不能交给上层，于是这条连接上的所有流一起停住。",
        "下面的时间线把 loss:a 理解为 a 流上的一次丢失。tcp 模式把整条连接标为阻塞，a2 和 b2 都停住。quic 模式只把 a 标为阻塞，b2 仍可交付。这是阻塞范围的教学模型：它不重传、不计算拥塞窗口，也没有把“停住”写成永久失败。丢失恢复后，流会继续。设计超时和重试时，不要把同连接上的集体延迟误判成每个请求各自的服务器故障。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function deliver(mode, events) {\n  const out = [];\n  const blocked = new Set();\n  for (const event of events) {\n    if (event.startsWith('loss:')) {\n      if (mode === 'tcp') blocked.add('*');\n      else blocked.add(event.slice(5));\n      continue;\n    }\n    if (blocked.has('*') || blocked.has(event[0])) out.push('stall:' + event);\n    else out.push(event);\n  }\n  return out.join(',');\n}\nconsole.log(deliver('tcp', ['a1', 'b1', 'loss:a', 'a2', 'b2']));\nconsole.log(deliver('quic', ['a1', 'b1', 'loss:a', 'a2', 'b2']));",
          "expectedOutput": ["a1,b1,stall:a2,stall:b2", "a1,b1,stall:a2,b2"],
          "explanation": [
            "丢失发生前，两种模式都交付了 a1 和 b1。TCP 模式在丢失后阻塞全部后续帧。QUIC 模式只阻塞名字以 a 开头的流，b2 继续交付。",
            "帧名字是为了让日志可读。真实 HTTP/2 帧还有流标识、窗口和优先级；这里只保留“阻塞范围不同”这一件事。"
          ]
        }
      ]
    },
    {
      "id": "tls",
      "title": "TLS 负责身份和机密性，不负责接口权限",
      "paragraphs": [
        "TLS 让客户端核对证书链和主机名，并保护传输内容。握手失败、证书过期、主机名不匹配，都还没有进入 HTTP 状态码。应用层把它们显示成“网络错误”时，应保留可区分的原因，方便判断是配置、时钟还是拦截。",
        "HTTP/3 的 0-RTT 可以在恢复连接时更早发送数据，但早期数据可能被重放。非幂等的下单和转账不要放进可重放的早期数据。TLS 成功只说明信道和主机名，K06-04 的登录态和 K06-05 的跨源暴露仍要单独设计。"
      ]
    },
    {
      "id": "mistakes",
      "title": "把协议版本当成性能开关",
      "paragraphs": [
        "错误做法是在服务器打开 HTTP/2 后删除缓存、合并请求和超时预算。多路复用减少了连接数量，没有取消慢接口、大响应和服务器队列。HTTP/2 规范包含服务器推送，当前浏览器已经不把它当作可用能力；预加载应使用普通请求和缓存头。",
        "另一个错误是看到 HTTP/3 不可用就判断整站故障。发现信号、UDP 被网络设备拦截或 TLS 版本不足时，客户端应能退回 h2 或 HTTP/1.1。回退路径要在测试环境实际走过，而不是只在配置文件里写一个版本号。"
      ]
    },
    {
      "id": "boundaries",
      "title": "模型没有覆盖密码套件和中间网络",
      "paragraphs": [
        "第一条边界是协商细节。ALPN、密码套件、证书扩展和 HTTP/3 的连接标识都比选择函数丰富。上线前用服务器和浏览器的协商结果核对，不用本文输出代替。",
        "第二条边界是中间盒和连接合并。企业代理、HTTP/1.1 降级和跨主机连接合并会改变抓包里看到的协议。源相等仍然是第一刀，其后的差异要按那一层的日志解释。"
      ]
    },
    {
      "id": "practice",
      "title": "先写源，再写协议前提和阻塞范围",
      "paragraphs": [
        "给三个 URL，先判断它们是否同一源。再给“TCP、无 TLS、希望 h2”和“UDP、TLS 1.3、已发现”两组输入，预测协议。最后预测 loss:a 之后，b 流在 TCP 和 QUIC 两种模式里是否还能交付。",
        "本主题当前没有专属判题练习，先运行本文完整示例，再改变输入验证失败路径。练习页已发布的相邻模型不能代替本主题的验收。模型题不执行浏览器协议协商、CORS 或连接复用；这些条件须结合目标浏览器和服务端记录核对。"
      ]
    }
  ],
  "sources": [
    { "title": "HTTP/2：RFC 9113", "url": "https://httpwg.org/specs/rfc9113.html" },
    { "title": "HTTP/3：RFC 9114", "url": "https://httpwg.org/specs/rfc9114.html" }
  ]
};
