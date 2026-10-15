import type { Article } from "../articles";

export const cachePrefetchArticle: Article = {
  id: "K10-05",
  kind: "knowledge",
  domainSlug: "performance",
  slug: "cache-and-prefetch",
  title: "缓存与预取策略",
  summary: "用订单页 URL、Cache-Control 和小容量缓存说明何时可以复用响应，以及预取怎样挤掉主图或占满预算。",
  aliases: ["Cache-Control", "prefetch", "Vary", "stale-while-revalidate", "预取"],
  tags: ["性能工程", "缓存与预取策略"],
  estimatedMinutes: 24,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "第二次打开订单页没有变快，预取还让主图失去了位置？",
      paragraphs: [
        "用户从列表进入同一张订单，期望详情响应已经在缓存里。结果仍发起了请求：一次是因为比较缓存时把 URL 片段算进了键，另一次是语言不同却共用了同一份 HTML。与此同时，页面预取了两张推广图，容量只有两条的教学缓存把主图淘汰了。缓存命中和预取都是在用有限空间换后续等待，键或顺序错了，换来的是错误页面或更晚的主图。",
        "本篇接续 K10-03 的关键资源，以及 K06-02 里 HTTP 缓存的基本概念。示例实现的是可核对的键、寿命和容量规则，不是浏览器 HTTP 缓存，也不是 Cache Storage 的完整语义。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：固定 URL 与响应头，不连接真实缓存",
      paragraphs: [
        "运行 npm run verify:k10。示例使用平台 URL 解析器处理作者给定的地址，不发起网络请求。寿命解析只识别 max-age 和 stale-while-revalidate 这两个整数指令。容量示例是插入顺序的 Map，上限为 2。",
        "因此，输出不能用来宣称 Chrome 会以同样顺序淘汰磁盘缓存，也不能代替对响应头、Vary 和实际命中的检查。需要核对真实缓存时，仍要看响应头和网络记录。"
      ]
    },
    {
      id: "key",
      title: "片段不是缓存键，Vary 指定的请求头必须参与区分",
      paragraphs: [
        "下面的键使用 https URL，去掉片段，再把参与区分的请求头名称转成小写后排序。同一路径带 #photo 和不带片段、语言都是 zh 时，键相同。语言换成 en 时键不同。http URL 被拒绝，而不是悄悄升级。预期 忽略片段:true、语言不同:false、非https:rejected，以及键 https://shop.example/item?id=1|accept-language=zh。",
        "真实 HTTP 缓存键还包括方法、以及 Vary 列出的请求头在该请求中的值。本函数由调用方显式传入已经选中的头，不会读取 Vary 响应头再回查原始请求。漏传一个 Vary 头，就会把两份不同表示写成同一个键。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function cacheKey(input, vary) {\n  let url;\n  try { url = new URL(input); } catch { return 'invalid'; }\n  if (url.protocol !== 'https:') return 'rejected';\n  url.hash = '';\n  const headers = Object.entries(vary).map(([name, value]) => name.toLowerCase() + '=' + value).sort();\n  return url.toString() + '|' + headers.join('&');\n}\nconst withHash = cacheKey('https://shop.example/item?id=1#photo', { 'accept-language': 'zh' });\nconst plain = cacheKey('https://shop.example/item?id=1', { 'Accept-Language': 'zh' });\nconst english = cacheKey('https://shop.example/item?id=1', { 'accept-language': 'en' });\nconsole.log('忽略片段:' + (withHash === plain));\nconsole.log('语言不同:' + (withHash === english));\nconsole.log('非https:' + cacheKey('http://shop.example/item?id=1', {}));\nconsole.log('键:' + withHash);",
          expectedOutput: [
            "忽略片段:true",
            "语言不同:false",
            "非https:rejected",
            "键:https://shop.example/item?id=1|accept-language=zh"
          ],
          explanation: [
            "URL 解析器识别片段，函数再把 hash 清空，所以 #photo 不制造另一个键。Accept-Language 和 accept-language 被折成同一名称，但 zh 与 en 的值仍然分开。",
            "rejected 是这个教学键的策略：示例不把未加密来源写进可复用缓存。真实缓存对 http 的处理还受浏览器和私有网络策略影响，不能由这个返回值代替。"
          ]
        }
      ]
    },
    {
      id: "freshness",
      title: "新鲜、过期可复用和必须重新验证是三种状态",
      paragraphs: [
        "响应头 max-age=10, stale-while-revalidate=10 把前 10 个时间单位视为新鲜，其后 10 个单位仍可先用旧响应，但要重新验证。年龄 5 为 fresh，15 为 stale-revalidate，25 为 expired。没有条目是 miss。只有 public, max-age=10 时，年龄 15 已经超过新鲜期且没有额外的陈旧窗口，结果是 expired。no-cache 不被这个解析器识别，返回 invalid。",
        "stale-while-revalidate 允许先显示旧订单详情，同时发起验证。它不保证旧内容仍然符合权限或库存。验证失败、用户不同或响应是私有数据时，不能因为状态名叫 stale 就把上一名用户的响应交出去。解析器也不理解 no-cache、must-revalidate 和启发式新鲜度。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function lifetime(header) {\n  if (typeof header !== 'string') return null;\n  const maxAge = /(?:^|,\\s*)max-age=(\\d+)/.exec(header);\n  if (!maxAge) return null;\n  const swr = /(?:^|,\\s*)stale-while-revalidate=(\\d+)/.exec(header);\n  const freshUntil = Number(maxAge[1]);\n  const extra = swr ? Number(swr[1]) : 0;\n  return { freshUntil, staleUntil: freshUntil + extra };\n}\nfunction read(header, now) {\n  if (header === null) return 'miss';\n  const entry = lifetime(header);\n  if (!entry || !Number.isFinite(now) || now < 0) return 'invalid';\n  if (now <= entry.freshUntil) return 'fresh';\n  if (now <= entry.staleUntil) return 'stale-revalidate';\n  return 'expired';\n}\nconst header = 'max-age=10, stale-while-revalidate=10';\nconsole.log(read(header, 5));\nconsole.log(read(header, 15));\nconsole.log(read(header, 25));\nconsole.log(read(null, 5));\nconsole.log(read('public, max-age=10', 15));\nconsole.log(read('no-cache', 0));",
          expectedOutput: ["fresh", "stale-revalidate", "expired", "miss", "expired", "invalid"],
          explanation: [
            "有陈旧窗口时，15 仍落在 20 以内，所以可以走“先用旧值并重新验证”。没有这个指令时，新鲜期结束就是 expired，不能自行延长。",
            "invalid 表示解析器拒绝自己不理解的头，调用方应重新请求，而不是把 no-cache 当成可长期保存。完整 Cache-Control 还有多个组合，这个正则只覆盖示例中的两种整数指令。"
          ]
        }
      ]
    },
    {
      id: "eviction",
      title: "容量只有两条时，后写入的预取会淘汰更早的主图",
      paragraphs: [
        "下面的 Store 用 Map 的插入顺序表示淘汰：再次写入已有键会把它移动到最新，超过 2 条时删除最旧的键。依次写入 hero、next、promo 后，hero 不在了，next 和 promo 还在。预期 主图还在:false、保留:true:true。",
        "这不是浏览器缓存的淘汰算法。它只演示一个容量后果：预取的推广图比主图更晚写入，且容量不足以同时保留三者。预取之前要知道哪些条目更值得留下，而不是把所有链接都写进同一个小缓存。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function Store(limit) { this.limit = limit; this.map = new Map(); }\nStore.prototype.set = function(key) {\n  if (this.map.has(key)) this.map.delete(key);\n  this.map.set(key, true);\n  while (this.map.size > this.limit) this.map.delete(this.map.keys().next().value);\n};\nStore.prototype.has = function(key) { return this.map.has(key); };\nconst store = new Store(2);\nstore.set('hero');\nstore.set('next');\nstore.set('promo');\nconsole.log('主图还在:' + store.has('hero'));\nconsole.log('保留:' + store.has('next') + ':' + store.has('promo'));",
          expectedOutput: ["主图还在:false", "保留:true:true"],
          explanation: [
            "第三条插入时容量已满，函数删除最早插入且之后没有被重新 set 的 hero。next 和 promo 是较新的两条。",
            "若用户接下来一定要看主图，这个结果就是预取损害了更可能命中的条目。真实缓存还会考虑字节大小和新鲜度，不能把 Map 的条数直接当成磁盘配额。"
          ]
        }
      ]
    },
    {
      id: "budget",
      title: "预取排在主图前面时，固定预算会装不下主图",
      paragraphs: [
        "下面按顺序接受项目，预算是 100。装不下时跳过；若被跳过的是关键项，记下它的 id。先放 80 字节主图，后面两张 40 字节的图都放不进，结果 hero|none。先放两张 40 字节的预取，再用掉 80，主图被跳过，结果 promo,next|hero。",
        "跳过不会回头清空已经接受的预取。模型因此暴露一种失败：预取本身没有超过预算，但它们占用预算之后，关键资源不再有位置。恢复办法是让关键资源优先占用预算，预取只使用剩余部分，而不是依赖队列碰巧把主图放在前面。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function schedule(items, budget) {\n  let used = 0;\n  const accepted = [];\n  let blocked = '';\n  for (const item of items) {\n    if (!Number.isFinite(item.bytes) || item.bytes < 0) return 'invalid';\n    if (used + item.bytes > budget) {\n      if (item.critical) blocked = item.id;\n      continue;\n    }\n    accepted.push(item.id);\n    used += item.bytes;\n  }\n  return accepted.join(',') + '|' + (blocked || 'none');\n}\nconsole.log('先主图:' + schedule([{ id: 'hero', bytes: 80, critical: true }, { id: 'next', bytes: 40 }, { id: 'promo', bytes: 40 }], 100));\nconsole.log('先预取:' + schedule([{ id: 'promo', bytes: 40 }, { id: 'next', bytes: 40 }, { id: 'hero', bytes: 80, critical: true }], 100));",
          expectedOutput: ["先主图:hero|none", "先预取:promo,next|hero"],
          explanation: [
            "两种顺序的总字节都超过 100。差别是主图在前时，预算先满足关键项；主图在后时，预算已经分给预取，函数不会撤掉 promo 和 next。",
            "none 表示没有关键项被跳过，不表示页面上的其他图都已下载。这个预算也不是网络优先级。它适合检查自己的预取队列有没有把已知的 LCP 资源挤出去。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "能缓存的是可共享表示，预取不能扩大权限",
      paragraphs: [
        "订单详情若随登录用户变化，缓存键必须把用户或私有性区分开，或者直接不进入共享缓存。只按商品 id 缓存 HTML，会让下一名用户读到上一名用户的表示。Vary: Cookie 范围又可能过宽，使缓存几乎无法复用。私有响应、授权错误和个人信息默认不预取到可能被别人命中的位置。",
        "预取会提前执行读请求。对搜索建议、结算和管理操作使用预取，可能放大流量、写入日志或触发有副作用的接口。只预取确定安全的 GET，并限制数量、并发和触发距离。",
        "版本化的静态资源可以长期缓存，HTML 则要能指向新的资源地址。只把 HTML 缓存很久、却频繁修改其中的脚本地址，用户会继续运行旧页面。缓存时间应和发布时保留旧资源的窗口一起设计。"
      ]
    },
    {
      id: "practice",
      title: "为一个响应写下键、寿命和不能预取的理由",
      paragraphs: [
        "选择订单详情和主图各一条响应。写明缓存键包含哪些 URL 部分和请求头，新鲜期结束后是重新验证、短时间沿用旧值，还是必须等待网络。再列出最多三个预取目标，并说明它们为什么不会淘汰主图、不会携带别人的私有响应。",
        "本主题没有已开放的独立缓存题。示例里的容量 2 和预算 100 只用于教学，不能当作站点配置。"
      ]
    }
  ],
  sources: [
    { title: "MDN：HTTP caching", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching" },
    { title: "MDN：Cache-Control", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control" },
    { title: "MDN：Vary", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary" },
    { title: "MDN：rel=prefetch", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch" }
  ]
};
