import type { Article } from "../articles";

export const cookiesSessionsRefreshArticle: Article = {
  "revision": 2,
  "id": "K06-04",
  "kind": "knowledge",
  "domainSlug": "networking",
  "slug": "cookies-sessions-refresh",
  "title": "Cookie、认证与会话",
  "summary": "比较 HttpOnly Cookie、内存和 localStorage 存放令牌的暴露面，并用单次刷新避免过期时的并发风暴。",
  "aliases": ["cookie", "HttpOnly", "SameSite", "refresh token", "session", "令牌"],
  "tags": ["网络", "认证", "Cookie、认证与会话"],
  "estimatedMinutes": 23,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "访问令牌刚过期，为什么同时发出了三次刷新？",
      "paragraphs": [
        "页面上三个请求同时收到 401。每个请求都自己调用刷新接口，刷新令牌又是一次性轮换的。第一次刷新使旧刷新令牌失效，后两次带着同一个旧值再刷新，于是整组会话被服务端作废，用户被要求重新登录。存放位置和刷新所有权是两件要分开设计的事。",
        "前置是 K06-02 的状态码与幂等。本文用属性解析说明 Set-Cookie 里脚本看不见的标志，用一张暴露面表比较存放位置，再用共享 Promise 保证同一次过期只刷新一次。解析器和表格是这些规则的可执行摘要，不是浏览器 Cookie 罐的完整实现。"
      ]
    },
    {
      "id": "placement",
      "title": "存放位置决定谁能读到令牌、谁会自动附带",
      "paragraphs": [
        "HttpOnly Cookie 不进入 document.cookie，页面脚本读不到令牌文本；浏览器会在匹配的路径、域名和安全条件下自动附带。自动附带带来跨站请求伪造的问题，所以还要看 SameSite，并对不安全的跨站请求使用独立的 CSRF 令牌或只接受自定义头。Secure 限制它只走 HTTPS。",
        "放在内存里的令牌需要脚本写入 Authorization 等头，刷新页面就丢失，XSS 若能执行脚本仍可能调用已封装的请求函数。localStorage 在刷新后还在，而且任何同源脚本都能读出字符串，XSS 的收获更大。下面三行是这三种位置的暴露面摘要：script 表示脚本能否直接拿到令牌，attach 表示谁把它放到请求上。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function profile(place) {\n  const table = {\n    'httpOnly-cookie': 'script:hidden,attach:browser,csrf:review',\n    memory: 'script:reachable,attach:manual,reload:lost',\n    localStorage: 'script:readable,attach:manual,reload:kept'\n  };\n  return table[place];\n}\nconsole.log(profile('httpOnly-cookie'));\nconsole.log(profile('memory'));\nconsole.log(profile('localStorage'));",
          "expectedOutput": [
            "script:hidden,attach:browser,csrf:review",
            "script:reachable,attach:manual,reload:lost",
            "script:readable,attach:manual,reload:kept"
          ],
          "explanation": [
            "HttpOnly Cookie 对脚本隐藏并由浏览器附带，因此要单独审查 CSRF。内存令牌由应用手动附带，重新加载后丢失。localStorage 重新加载后仍在，同源脚本可以直接读取。",
            "reachable 表示 XSS 仍可能通过应用自己的请求函数使用内存令牌。隐藏 Cookie 文本没有消除 XSS 调用同源接口的能力，只是减少了令牌被拷走后重放的一种路径。"
          ]
        }
      ]
    },
    {
      "id": "attributes",
      "title": "Set-Cookie 的属性决定这条会话能不能被脚本和跨站请求使用",
      "paragraphs": [
        "一条 Set-Cookie 先是名称和值，后面的属性用分号分开。HttpOnly 没有取值，表示存在即可。SameSite 可以是 Lax、Strict 或 None；None 还必须带 Secure。Path 和 Domain 决定自动附带的范围，Domain 过宽会把会话送到不该接收它的子域。",
        "未声明 SameSite 时，当前浏览器通常按 Lax 处理，不要按多年前“默认跨站都发送”来设计登录。Lax 在顶层安全导航时可能带上 Cookie，跨站的 POST 不会。若接口必须从另一个站点的页面以脚本调用并携带 Cookie，那是更高风险的组合，应重新考虑是否改为手动附带的令牌。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function readSetCookie(line) {\n  const parts = line.split(';').map(part => part.trim());\n  const pair = parts[0].split('=');\n  const attrs = {};\n  for (const part of parts.slice(1)) {\n    const index = part.indexOf('=');\n    const key = (index === -1 ? part : part.slice(0, index)).toLowerCase();\n    attrs[key] = index === -1 ? true : part.slice(index + 1);\n  }\n  return [pair[0], pair[1], String(attrs.httponly === true), attrs.samesite || ''].join(',');\n}\nconsole.log(readSetCookie('session=abc; HttpOnly; Secure; SameSite=Lax; Path=/'));\nconsole.log(readSetCookie('theme=light; SameSite=Strict'));",
          "expectedOutput": ["session,abc,true,Lax", "theme,light,false,Strict"],
          "explanation": [
            "第一行识别出 HttpOnly 存在、SameSite 为 Lax。第二行没有 HttpOnly，所以第三段是 false，SameSite 为 Strict。",
            "解析器只覆盖名称、HttpOnly 和 SameSite。它不执行浏览器对 Domain、过期时间和前缀 Cookie 的接受规则；服务端仍要设置这些属性并在响应里观察浏览器是否保存。"
          ]
        }
      ]
    },
    {
      "id": "refresh",
      "title": "轮换刷新令牌时，一次过期只能有一个刷新在途",
      "paragraphs": [
        "访问令牌过期后，等待者应共享同一次刷新。第一个调用创建 Promise 并记下它，后续调用返回同一个 Promise。刷新成功后更新内存中的访问令牌，再让队列里的请求用新令牌重试。刷新失败时，所有等待者看到同一次失败，下一次用户动作可以重新开始，不要在失败回调里立刻递归刷新。",
        "若刷新令牌每次使用都会轮换，重复刷新不是幂等操作。单次在途是正确性要求，不只是为了减少请求。刷新接口自己要拒绝并发使用同一个旧刷新令牌，客户端的共享 Promise 不能代替服务端的一次性约束。登出时要取消等待并清掉本地令牌，避免退出后还有请求把新令牌写回来。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "let flight = null;\nlet starts = 0;\nfunction refresh() {\n  if (!flight) {\n    starts += 1;\n    flight = Promise.resolve('fresh').then(value => { flight = null; return value; });\n  }\n  return flight;\n}\nPromise.all([refresh(), refresh(), refresh()]).then(values => {\n  console.log(String(starts));\n  console.log(values.join(','));\n});",
          "expectedOutput": ["1", "fresh,fresh,fresh"],
          "explanation": [
            "三次调用发生在同一次同步执行里，只创建了一个 Promise，starts 为 1。三个等待者都得到 fresh。",
            "示例用已解决的 Promise 代替网络。真实刷新要带 AbortSignal，并在失败时区分刷新令牌无效和暂时性故障；只有后者才允许稍后重试。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "把令牌同时放进 Cookie 和 localStorage",
      "paragraphs": [
        "错误实现是 HttpOnly Cookie 一套、localStorage 再存一份，请求时两个都带上。暴露面变成两者中更弱的那个，刷新轮换也会分裂成两套状态。选定一种附带方式，另一个位置不要保留同一权限的副本。",
        "另一个错误是每个 401 都立即刷新并重试，而且不限制重试次数。刷新接口故障时会形成风暴。401 先进入共享刷新；刷新失败后停止自动重试，把重新登录交给明确的界面。"
      ]
    },
    {
      "id": "boundaries",
      "title": "客户端存放策略不代替服务端会话撤销",
      "paragraphs": [
        "第一条边界是服务端。客户端删掉本地令牌，不能保证已经签发的令牌立刻失效。退出、改密和风控需要服务端会话表或令牌吊销。短寿命访问令牌缩小窗口，不取消吊销。",
        "第二条边界是浏览器策略。第三方 Cookie、存储分区和 SameSite 的具体行为会随浏览器产品变化。登录流程要在目标浏览器里核对实际会不会附带 Cookie，不要只靠属性字符串的解析结果。"
      ]
    },
    {
      "id": "practice",
      "title": "预测三次 401 会启动几次刷新",
      "paragraphs": [
        "写出 HttpOnly Cookie 和 localStorage 在“脚本能否读取、谁来附带、重新加载后还在不在”三列上的差异。再预测三个同步调用的 refresh 会打印的 starts。若第二次调用发生在第一次 Promise 已经清空 flight 之后，预测 starts 会变成多少。",
        "本主题当前没有专属判题练习，先运行本文完整示例，再改变输入验证失败路径。练习页已发布的相邻模型不能代替本主题的验收。模型题不执行浏览器协议协商、CORS 或连接复用；这些条件须结合目标浏览器和服务端记录核对。"
      ]
    }
  ],
  "sources": [
    { "title": "HTTP State Management：RFC 6265", "url": "https://www.rfc-editor.org/rfc/rfc6265.html" },
    { "title": "Fetch：凭据与请求", "url": "https://fetch.spec.whatwg.org/#http-network-or-cache-fetch" }
  ]
};
