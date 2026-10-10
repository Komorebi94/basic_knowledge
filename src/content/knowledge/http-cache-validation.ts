import type { Article } from "../articles";

export const httpCacheValidationArticle: Article = {
  "id": "K06-01",
  "kind": "knowledge",
  "domainSlug": "networking",
  "slug": "http-cache-validation",
  "title": "HTTP 缓存与条件请求",
  "summary": "新鲜度、验证、缓存键、Vary 的作用与误区。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "http-cache-validation",
    "HTTP 缓存与条件请求"
  ],
  "tags": [
    "networking"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "刷新后拿到旧内容，是浏览器出错了吗？",
      "paragraphs": [
        "页面请求配置，服务器部署后用户仍看到旧版本。先判断缓存是直接复用、发了条件请求，还是响应被另一层缓存覆盖。缓存有明确协议：新鲜度决定能否直接复用，验证器决定过期副本是否仍与服务器一致。",
        "本文完整示例使用本地缓存决策模型与 Response 对象，不发真实网络请求。模型故意只覆盖核心判断，不替代浏览器和代理的完整缓存实现；实际排查必须核对响应头、请求头与缓存层。"
      ],
      "examples": [
        {
          "code": "function choose(ageSeconds, maxAgeSeconds) {\n  return ageSeconds < maxAgeSeconds ? 'reuse' : 'validate';\n}\nconsole.log(choose(59, 60));\nconsole.log(choose(60, 60));",
          "expectedOutput": [
            "reuse",
            "validate"
          ],
          "explanation": [
            "小于新鲜寿命直接复用，到达边界后需要重新获取或验证。真实 age 涉及 Date、Age 和存储时间等计算，不能只用客户端时钟减一个随意时间戳。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "缓存副本需要键、策略和验证器",
      "paragraphs": [
        "缓存键通常包含请求方法与目标 URI，Vary 让指定请求头参与选择响应变体。若同一 URL 因语言返回不同正文，却未声明 Vary: Accept-Language，缓存可能将一种语言发给另一种请求。",
        "Cache-Control:max-age 描述新鲜寿命；no-cache 允许存储但要求使用前验证；no-store 指示不要存储。private 控制共享缓存的适用范围，不是加密或访问控制。理解每个指令的对象，才能避免把 no-cache 翻译成永不缓存。"
      ]
    },
    {
      "id": "validation",
      "title": "304 没有新正文，需要已有副本",
      "paragraphs": [
        "ETag 是服务器给表示的验证器。客户端带 If-None-Match 询问当前版本是否相同；匹配时服务器可返回 304，客户端结合已存副本与更新元数据继续使用。若版本不同则返回新表示，常见为 200。"
      ],
      "examples": [
        {
          "code": "function revalidate(cached, current) {\n  if (cached.etag === current.etag) return { status: 304, body: cached.body };\n  return { status: 200, body: current.body };\n}\nconst stored = { etag: 'v1', body: '旧配置' };\nconsole.log(revalidate(stored, { etag: 'v1', body: '旧配置' }).status);\nconst updated = revalidate(stored, { etag: 'v2', body: '新配置' });\nconsole.log(updated.status, updated.body);",
          "expectedOutput": [
            "304",
            "200 新配置"
          ],
          "explanation": [
            "相同验证器保留副本，不同验证器替换正文。这里返回 body 是为了展示应用后的结果，真实 304 响应本身不携带新正文；不能直接把它当 JSON 解析。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "keys",
      "title": "变体和私人数据必须进入缓存设计",
      "paragraphs": [
        "语言、压缩、身份和租户都可能影响表示。需要明确哪些差异通过 URL、Vary 或禁止共享缓存处理。不能把用户身份只放在 UI 内，却让 CDN 按相同 URL 缓存私人信息。"
      ],
      "examples": [
        {
          "code": "function cacheKey(url, language) { return JSON.stringify([url, language]); }\nconst cache = new Map();\ncache.set(cacheKey('/help', 'zh'), '帮助');\ncache.set(cacheKey('/help', 'en'), 'Help');\nconsole.log(cache.get(cacheKey('/help', 'zh')));\nconsole.log(cache.size);",
          "expectedOutput": [
            "帮助",
            "2"
          ],
          "explanation": [
            "把 URL 与语言作为结构化键避免相互覆盖。真实 HTTP 缓存由 Vary 等协议表达变体，应用内 Map 不会自动读取这些规则，也没有淘汰和新鲜度管理。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "错误策略与恢复办法",
      "paragraphs": [
        "把所有资源设为一年 max-age，入口 HTML 很可能继续引用旧资源。常见方案是内容哈希命名的静态资源长期缓存，入口文档保持可重新验证；部署时保留旧哈希资源一段时间，避免已有 HTML 引用突然失效。",
        "每次给 URL 拼随机时间戳虽可绕开缓存，却浪费带宽并掩盖策略错误。先确认副本在哪一层、为何仍新鲜、验证器是否正确变化，再修响应头或版本策略。缓存清空也不能保证所有中间代理副本都即时消失。"
      ]
    },
    {
      "id": "boundaries",
      "title": "缓存不替代安全和数据一致性协议",
      "paragraphs": [
        "第一条边界是认证：private 只限制共享缓存，仍需授权检查与传输保护。第二条边界是更新：写入成功后，应用缓存可能需失效或重新验证，浏览器 HTTP 缓存不会自动了解你的业务列表关系。",
        "第三条边界是 Service Worker：它可以实施独立策略，Network 中显示的数据来源与普通 HTTP 缓存不同。排查时把浏览器、Service Worker、CDN 和服务器应用缓存分别列出。"
      ]
    },
    {
      "id": "application",
      "title": "按可接受陈旧时间选择策略",
      "paragraphs": [
        "公开静态资源适合版本 URL；用户设置适合严格授权并明确验证；可以容忍短暂陈旧的公共列表可设置有限新鲜期。先写出业务能接受的时间窗口，再选择策略，不能因为缓存命中率高就认定正确。",
        "记录缓存命中、验证次数和陈旧错误，同时评估额外 RTT 与带宽。缓存工程是在一致性、体验和成本之间做有证据的取舍。",
        "例如账户设置 GET 返回个人偏好，CDN 只按 URL 保存就可能泄漏不同用户内容。即使浏览器发送了身份信息，也不能假设每种共享缓存都会以它作为键。接口合同必须明确响应是否允许共享、是否可在私人缓存存储以及登录切换如何清理应用副本。缓存安全不是命中率问题，应先保证表示边界正确。",
        "再看部署入口：HTML 可以重新验证，引用 /assets/app.abc.js 这样的内容版本；下一版 HTML 改为另一个哈希名。长期缓存旧资源不会导致新入口主动读取它，因为地址已变。仍在线的旧入口继续需要 abc.js，所以清理策略要覆盖活跃页面的延迟加载窗口。把所有旧资源马上删除，与内容哈希设计并不自动相容。",
        "测试缓存合同要覆盖首次无副本、仍新鲜、过期且版本相同、过期且版本改变四条路径，再加不同语言或用户的隔离。只测一次缓存命中，无法发现错误验证器或共享数据泄漏。"
      ]
    },
    {
      "id": "recall",
      "title": "给一个新接口设计缓存合同",
      "paragraphs": [
        "说明表示由哪些输入决定，副本最多可陈旧多久，更新后如何失效，哪个缓存层允许保存。再写响应头并用真实请求核对 200、304 与变体。",
        "回忆：no-cache 为什么仍可能存储？304 为什么依赖旧正文？可把语言示例省去 language 键，复现错误覆盖并解释修复依据。"
      ]
    }
  ],
  "sources": [
    {
      "title": "MDN：HTTP caching",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching"
    },
    {
      "title": "MDN：Cache-Control",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control"
    }
  ]
};
