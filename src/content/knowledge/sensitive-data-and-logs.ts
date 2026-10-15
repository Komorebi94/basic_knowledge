import type { Article } from "../articles";

export const sensitiveDataLogsArticle: Article = {
  id: "K11-05",
  kind: "knowledge",
  domainSlug: "security",
  slug: "sensitive-data-and-logs",
  title: "敏感数据与日志",
  summary: "在订单错误记录里替换令牌和授权头，并在写入日志前处理回跳地址中的授权码，避免调试信息变成另一份凭据副本。",
  aliases: ["redaction", "logging", "token", "日志", "敏感数据"],
  tags: ["安全", "敏感数据与日志"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "为了排查登录失败，日志为什么不能保存整份请求？",
      paragraphs: [
        "订单页登录失败时，开发者把请求对象写进日志：里面有用户编号、会话令牌，以及 Authorization 头。日志系统随后按原文保存、检索和复制到工单。令牌的用途是证明调用者，日志多一份，能读取日志的人或系统就多一条使用该令牌的路径。排查需要的是失败类别、请求编号和可公开的路由，不是凭据本身。",
        "本篇接续 K11-02。示例在输出前处理作者给定的对象和 URL，字段名只包含 token、authorization、password 和 cookie。地址参数只处理 token、access_token 和 code。它不是完整的数据分类器，也不会把已经写出的日志追回。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：固定对象与地址，不连接日志服务",
      paragraphs: [
        "运行 npm run verify:k11。示例使用字符串 session-demo 和 demo-code 作为必须被替换的固定输入，预期输出里只出现 [redacted] 或它的 URL 编码。深度超过 4 层时返回 [depth]，避免异常对象把处理过程本身变成泄露点。",
        "真实日志还有采集器、崩溃报告、浏览器扩展和截图。只改应用里的一条 console 路径，不能说明这些通道已经同样处理。"
      ]
    },
    {
      id: "fields",
      title: "敏感字段按名称替换，嵌套的授权头也不能漏掉",
      paragraphs: [
        "redact 遇到数组就逐项处理，遇到对象就按键名判断。键名不区分大小写，命中名单时整值替换为 [redacted]，不再递归进原值。普通字符串只有完全符合 Bearer 加一段非空白时才替换。对象 { user: A, token: session-demo, headers: { Authorization: Bearer session-demo }, note: ok } 的预期是用户和 note 保留，token 与 Authorization 替换。单独的 Bearer session-demo 也替换为 [redacted]。",
        "只遍历顶层会留下 headers 里的令牌。替换必须发生在写入、上报和放进错误对象之前。错误消息若把原值拼进异常文本，后面的日志即使调用 redact，也只能看到已经混在句子里的内容，字段名单不会再认出它。"
      ],
      examples: [
        {
          language: "javascript",
          code: `const secretKeys = new Set(['token', 'authorization', 'password', 'cookie']);
function redact(value, depth = 0) {
  if (depth > 4) return '[depth]';
  if (Array.isArray(value)) return value.map(item => redact(item, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = secretKeys.has(key.toLowerCase()) ? '[redacted]' : redact(item, depth + 1);
    return out;
  }
  if (typeof value === 'string' && /^Bearer\\s+\\S+$/i.test(value)) return '[redacted]';
  return value;
}
console.log(JSON.stringify(redact({ user: 'A', token: 'session-demo', headers: { Authorization: 'Bearer session-demo' }, note: 'ok' })));
console.log(redact('Bearer session-demo'));
console.log(redact({ note: '订单 18 未找到' }).note);`,
          expectedOutput: [
            '{"user":"A","token":"[redacted]","headers":{"Authorization":"[redacted]"},"note":"ok"}',
            "[redacted]",
            "订单 18 未找到"
          ],
          explanation: [
            "token 与 Authorization 命中名单后，原字符串不再出现在结果里。headers 是普通对象，函数会进入它，再对里面的键使用同一名单。",
            "订单号保留，因为 note 不是敏感键，句子也不符合 Bearer 形式。这个结果同时说明名单不会自动识别所有不该公开的业务数据；订单内容是否可进日志，要另有数据分类，而不是指望键名列表。"
          ]
        }
      ]
    },
    {
      id: "urls",
      title: "回跳地址里的授权码要在记录 URL 之前替换",
      paragraphs: [
        "redactUrl 只接受 https。参数名是 token、access_token 或 code 时，把值设为 [redacted]。https://notes.example/callback?code=demo-code&next=/app 的预期地址中，code 的值变成编码后的 %5Bredacted%5D，next 的斜线变成 %2F。http 地址返回 rejected，不输出原始查询。非法地址返回 invalid。",
        "URL 搜索参数的序列化会编码方括号和斜线。日志里看到的是编码后的替换标记，不是又一份授权码。rejected 避免为了记录一条不安全地址而把其中的 code 原样留下。若业务允许记录路径，应先替换，再决定是否保留主机名。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function redactUrl(input) {
  let url;
  try { url = new URL(input); } catch { return 'invalid'; }
  if (url.protocol !== 'https:') return 'rejected';
  for (const key of ['token', 'access_token', 'code']) if (url.searchParams.has(key)) url.searchParams.set(key, '[redacted]');
  return url.toString();
}
console.log(redactUrl('https://notes.example/callback?code=demo-code&next=/app'));
console.log(redactUrl('http://notes.example/callback?code=demo-code'));
console.log(redactUrl('not a url'));`,
          expectedOutput: [
            "https://notes.example/callback?code=%5Bredacted%5D&next=%2Fapp",
            "rejected",
            "invalid"
          ],
          explanation: [
            "code 被替换后再序列化，所以输出不含 demo-code。%5B 与 %5D 是方括号的编码，%2F 是 next 原值里的斜线，二者都不是新的凭据。",
            "http 在替换前就被拒绝，因此函数不会返回带有原始 code 的地址。not a url 无法解析，返回 invalid，而不是把原字符串写进日志。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "替换降低副本，不代替权限、保留期限和采集范围",
      paragraphs: [
        "能读日志的人仍然能看到用户编号、订单号和时间。这些字段是否允许保存，取决于产品的数据边界和保留期限。替换令牌后把完整订单正文永久保存，只解决了凭据这一类，没有最小化业务数据。",
        "名单外的键，例如 accessToken、session 或嵌在句子中的令牌，不会被这个函数认出。崩溃报告若序列化整个作用域，变量名可能根本不叫 token。应在采集边界明确允许的字段，而不是先收集全部再希望替换足够聪明。",
        "客户端日志、服务端日志和第三方监控是不同接收者。浏览器控制台里临时查看不等于可以把同一对象发给外部服务。发送前的接收者、采样和保留时间都要单独决定。"
      ]
    },
    {
      id: "practice",
      title: "用一条失败记录列出可以留下和必须去掉的字段",
      paragraphs: [
        "选一次登录或支付失败。列出排查真正需要的请求编号、路由、状态码和安全的错误类别，再列出令牌、Cookie、授权码和个人信息。确认写入日志的对象经过与接收者匹配的替换，并且 URL 的查询参数不会把授权码原样保存。",
        "没有已开放的日志练习。session-demo 与 demo-code 只用于证明替换，不能当成样例凭据使用。"
      ]
    }
  ],
  sources: [
    { title: "OWASP：Logging Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html" },
    { title: "MDN：URL", url: "https://developer.mozilla.org/en-US/docs/Web/API/URL" }
  ]
};
