import type { Article } from "../articles";

export const urlRedirectBoundariesArticle: Article = {
  id: "K11-06",
  kind: "knowledge",
  domainSlug: "security",
  slug: "url-and-redirect-boundaries",
  title: "URL 与跳转边界",
  summary: "把登录后的 next 限制在本源 https 路径内，并与可以指向外部文档的参考链接分开，拒绝协议、主机和用户信息不符合目的的地址。",
  aliases: ["open redirect", "URL", "redirect", "跳转", "next"],
  tags: ["安全", "URL 与跳转边界"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "登录成功后的 next，为什么不能原样交给导航？",
      paragraphs: [
        "未登录用户访问订单详情，应用把当前地址放进 next，登录后再跳回去。若 next 直接来自查询参数，它也可以是另一个网站的地址，或以 // 开头、在解析后落到其他主机。用户看到的是本站登录页，跳转之后却离开了本站。参考资料链接则相反：它本来就可能指向外部文档。两种地址不能共用一个“只要能解析就导航”的函数。",
        "本篇接续 K11-01 对 URL 上下文的区分。示例用平台 URL 解析器检查作者给定的字符串，不改变浏览器地址，也不发起请求。允许的本源只有 https://notes.example。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：以固定本源解析，不执行跳转",
      paragraphs: [
        "运行 npm run verify:k11。safeNext 返回路径和查询，或 rejected。classifyLink 只返回 internal、external-ok 或 rejected，供页面决定是否导航。长度上限 200 是本模型的拒绝条件，不是浏览器的 URL 长度限制。",
        "以 // 开头、包含反斜杠或 @ 的 next 在解析前拒绝。这样可以把协议相对地址和带有用户信息的地址挡在 URL 归一化之外。模型不声称覆盖每一种浏览器历史中的解析差异。"
      ]
    },
    {
      id: "next",
      title: "站内跳转只接受本源 https，并丢掉主机只留路径",
      paragraphs: [
        "空字符串、超过 200 个字符、以 // 开头、含反斜杠或 @ 的输入为 rejected。其余地址用本源作为基址解析。协议必须是 https，origin 必须等于 https://notes.example，并且不能有用户名或密码。通过时只返回 pathname 加 search，不把主机再交回导航。",
        "预期：/orders?id=1 和完整的本源地址都得到 /orders?id=1。其他主机、协议相对地址、http、带 user@ 的地址、看起来像本源后缀的其他主机、空字符串和反斜杠都是 rejected。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function safeNext(raw, origin) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 200) return 'rejected';
  if (raw.startsWith('//') || raw.includes('\\\\') || raw.includes('@')) return 'rejected';
  let url;
  try { url = new URL(raw, origin); } catch { return 'rejected'; }
  if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) return 'rejected';
  return url.pathname + url.search;
}
const origin = 'https://notes.example';
console.log('相对:' + safeNext('/orders?id=1', origin));
console.log('本源:' + safeNext('https://notes.example/orders?id=1', origin));
console.log('外站:' + safeNext('https://evil.example/orders', origin));
console.log('协议相对:' + safeNext('//evil.example/orders', origin));
console.log('http:' + safeNext('http://notes.example/orders', origin));
console.log('用户信息:' + safeNext('https://user@notes.example/orders', origin));
console.log('后缀主机:' + safeNext('https://notes.example.evil.example/orders', origin));
console.log('空:' + safeNext('', origin));
console.log('反斜杠:' + safeNext('\\\\orders', origin));`,
          expectedOutput: [
            "相对:/orders?id=1",
            "本源:/orders?id=1",
            "外站:rejected",
            "协议相对:rejected",
            "http:rejected",
            "用户信息:rejected",
            "后缀主机:rejected",
            "空:rejected",
            "反斜杠:rejected"
          ],
          explanation: [
            "相对路径以本源为基址，解析后的 origin 相同，所以只把路径交回去。完整本源地址同样去掉主机，避免后续代码再一次解释主机部分。",
            "notes.example.evil.example 的 origin 与 notes.example 不相等，字符串前缀相同不能通过。协议相对地址、用户信息和反斜杠在解析前拒绝，因此不会先被归一化成一个看起来合法的本源地址。"
          ]
        }
      ]
    },
    {
      id: "purpose",
      title: "参考链接可以是外部 https，登录跳转仍然不行",
      paragraphs: [
        "classifyLink 按用途选择规则。next 只接受解析后仍为本源的 https，返回 internal，其他主机返回 rejected。reference 接受任意 https，且不能有用户名或密码，返回 external-ok。javascript:example 的协议不是 https，两种用途都是 rejected。//evil.example/docs 对 next 是 rejected，对 reference 会解析成 https://evil.example/docs，因而是 external-ok。",
        "外链允许离开本源，是因为用户点击的就是一个参考地址，页面还应使用合适的窗口和引用策略。这个允许不能复用到登录后的自动跳转。自动跳转的目标应来自 safeNext 的路径，而不是来自 reference 的判断。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function classifyLink(kind, raw) {
  let url;
  try { url = new URL(raw, 'https://notes.example'); } catch { return 'rejected'; }
  if (url.protocol !== 'https:' || url.username || url.password) return 'rejected';
  if (kind === 'next') return url.origin === 'https://notes.example' ? 'internal' : 'rejected';
  if (kind === 'reference') return 'external-ok';
  return 'rejected';
}
console.log('站内跳转:' + classifyLink('next', '/orders?id=1'));
console.log('外站跳转:' + classifyLink('next', 'https://evil.example/orders'));
console.log('参考资料:' + classifyLink('reference', 'https://docs.example/a'));
console.log('参考协议相对:' + classifyLink('reference', '//evil.example/docs'));
console.log('非 https:' + classifyLink('reference', 'javascript:example'));
console.log('未知用途:' + classifyLink('callback', 'https://notes.example/orders'));`,
          expectedOutput: [
            "站内跳转:internal",
            "外站跳转:rejected",
            "参考资料:external-ok",
            "参考协议相对:external-ok",
            "非 https:rejected",
            "未知用途:rejected"
          ],
          explanation: [
            "同一种 //evil.example/docs 会因用途不同得到不同结果。next 要求 origin 等于本源；reference 在协议已是 https 时接受其他主机。",
            "javascript:example 没有进入 https 分支。未知用途 callback 即使地址属于本源也拒绝，避免一个新调用点在没有单独规则时沿用外链或跳转的许可。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "路径合法还不等于可以打开那份订单",
      paragraphs: [
        "safeNext 返回 /orders?id=1，只说明跳转没有离开本源。订单 1 是否属于当前用户，仍由 K11-02 的服务端授权决定。用跳转校验代替权限校验，登录用户可以被送到自己不该看的本源地址。",
        "允许的参考链接仍可能把用户带到恶意内容。外部文档需要产品上的预期：用户能看出自己离开了应用，链接不携带会话，也不把授权码放进对方可以读取的引用信息里。模型的 external-ok 没有设置这些窗口属性。",
        "不同浏览器对反斜杠、编码和空格的解析可能不同。解析前的拒绝缩小了本模型要依赖的差异，但不是所有历史解析缺陷的测试。改变规则后要用目标浏览器再检查真实导航。"
      ]
    },
    {
      id: "practice",
      title: "为每个会导航的参数写明用途和允许的 origin",
      paragraphs: [
        "找出登录 next、支付回跳和帮助链接。自动跳转只保留本源路径；帮助链接单独允许 https 外部地址。对每一类准备本源、其他主机、协议相对和非 https 输入，确认只有符合该用途的地址能进入导航 API。",
        "没有已开放的跳转练习。示例域名不托管页面，函数也不会替你完成跳转。"
      ]
    }
  ],
  sources: [
    { title: "OWASP：Unvalidated Redirects and Forwards", url: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html" },
    { title: "MDN：URL", url: "https://developer.mozilla.org/en-US/docs/Web/API/URL" },
    { title: "WHATWG URL Standard", url: "https://url.spec.whatwg.org/" }
  ]
};
