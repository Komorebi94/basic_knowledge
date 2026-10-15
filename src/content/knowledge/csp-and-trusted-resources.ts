import type { Article } from "../articles";

export const cspTrustedResourcesArticle: Article = {
  id: "K11-03",
  kind: "knowledge",
  domainSlug: "security",
  slug: "csp-and-trusted-resources",
  title: "CSP 与可信资源",
  summary: "用订单页脚本策略说明 nonce、哈希和精确来源如何决定脚本能否运行，以及只报告不执行拦截时页面仍会运行被拒绝的脚本。",
  aliases: ["CSP", "Content-Security-Policy", "nonce", "script-src"],
  tags: ["安全", "CSP 与可信资源"],
  estimatedMinutes: 24,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "页面已经做了输出编码，为什么还要限制脚本来源？",
      paragraphs: [
        "订单页把评论交给文本节点，避免了 K11-01 里那条把字符串交给 HTML 解析器的路径。另一处仍用脚本拼接统计代码，或者从临时 CDN 地址加载库。输出编码约束的是某一处数据如何进入页面；Content-Security-Policy 约束的是页面完成后，浏览器还允许执行哪些脚本来源。两条控制回答不同的问题，不能用其中一条代替另一条。",
        "本篇的决策函数是解析后的来源名单，不是 CSP 头部解析器。它只识别 self、nonce-、sha256-、unsafe-inline 和精确的 https origin。它不实现通配符、端口、路径和 default-src 的完整回退，也不生成真实 nonce。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：固定策略对象，不安装响应头",
      paragraphs: [
        "运行 npm run verify:k11。示例在空白页同步执行，不发送 CSP 报告，也不把策略写进学习站。nonce 和哈希使用作者固定字符串 order、sha256-demo，不代表一次真实响应的随机值。",
        "浏览器对真实 CSP 的匹配还包含预加载、Worker、事件处理和内联事件属性等路径。模型返回 allowed，只说明这组字段符合作者规则。"
      ]
    },
    {
      id: "decision",
      title: "有 nonce 或哈希时，unsafe-inline 不再放行没有凭据的内联脚本",
      paragraphs: [
        "scriptDecision 先看 scriptSrc 是否为空。内联脚本只有 nonce 或哈希与名单中的一项完全一致才允许。名单里只要出现 nonce- 或 sha256- 前缀，unsafe-inline 就被忽略；没有这两类严格来源时，unsafe-inline 才允许内联脚本。外部脚本必须是 https，self 只等于策略里的 origin，其余来源必须与 URL 的 origin 全等。",
        "预期：正确 nonce 为 allowed，错误 nonce 为 blocked，nonce 与 unsafe-inline 并存且脚本没有 nonce 为 blocked，只有 unsafe-inline 为 allowed。同源 app.js 和 https://cdn.example 为 allowed，其他 origin 与 http 为 blocked。正确哈希为 allowed，错误哈希为 blocked。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function scriptDecision(policy, script) {
  const sources = policy.scriptSrc;
  if (!Array.isArray(sources) || sources.length === 0) return 'blocked';
  const strict = sources.some(item => item.startsWith('nonce-') || item.startsWith('sha256-'));
  if (script.kind === 'inline') {
    if (typeof script.nonce === 'string' && sources.includes('nonce-' + script.nonce)) return 'allowed';
    if (typeof script.hash === 'string' && sources.includes(script.hash)) return 'allowed';
    if (!strict && sources.includes('unsafe-inline')) return 'allowed';
    return 'blocked';
  }
  if (script.kind !== 'external') return 'blocked';
  let url;
  try { url = new URL(script.url); } catch { return 'blocked'; }
  if (url.protocol !== 'https:') return 'blocked';
  if (sources.includes('self') && url.origin === policy.origin) return 'allowed';
  if (sources.includes(url.origin)) return 'allowed';
  return 'blocked';
}
const origin = 'https://notes.example';
const policy = { origin, scriptSrc: ['self', 'nonce-order', 'https://cdn.example'] };
console.log('nonce:' + scriptDecision(policy, { kind: 'inline', nonce: 'order' }));
console.log('错误nonce:' + scriptDecision(policy, { kind: 'inline', nonce: 'other' }));
console.log('严格来源忽略宽松内联:' + scriptDecision({ origin, scriptSrc: ['nonce-order', 'unsafe-inline'] }, { kind: 'inline' }));
console.log('仅宽松内联:' + scriptDecision({ origin, scriptSrc: ['unsafe-inline'] }, { kind: 'inline' }));
console.log('同源:' + scriptDecision(policy, { kind: 'external', url: 'https://notes.example/app.js' }));
console.log('允许的源:' + scriptDecision(policy, { kind: 'external', url: 'https://cdn.example/lib.js' }));
console.log('其他源:' + scriptDecision(policy, { kind: 'external', url: 'https://other.example/lib.js' }));
console.log('http:' + scriptDecision(policy, { kind: 'external', url: 'http://cdn.example/lib.js' }));
console.log('哈希:' + scriptDecision({ origin, scriptSrc: ['sha256-demo'] }, { kind: 'inline', hash: 'sha256-demo' }));
console.log('错误哈希:' + scriptDecision({ origin, scriptSrc: ['sha256-demo'] }, { kind: 'inline', hash: 'sha256-other' }));`,
          expectedOutput: [
            "nonce:allowed",
            "错误nonce:blocked",
            "严格来源忽略宽松内联:blocked",
            "仅宽松内联:allowed",
            "同源:allowed",
            "允许的源:allowed",
            "其他源:blocked",
            "http:blocked",
            "哈希:allowed",
            "错误哈希:blocked"
          ],
          explanation: [
            "nonce-order 与脚本提供的 order 拼成同一项才命中。名单里已经有 nonce 时，没有带上 nonce 的内联脚本不能改走 unsafe-inline。只有名单里不存在 nonce 和哈希时，unsafe-inline 才生效。",
            "外部地址先要求 https，再做 origin 全等。cdn.example 的路径 lib.js 不单独参与比较，因此这个模型也不能表达“只允许某一个文件”。http 即使主机相同也被拒绝。哈希必须整段相等，demo 与 other 不是同一个来源。"
          ]
        }
      ]
    },
    {
      id: "report",
      title: "只报告的策略仍会运行被判定为 blocked 的脚本",
      paragraphs: [
        "enforce 把 allowed 变成 run。blocked 在 enforce 下是 block，在 report-only 下是 run-and-report。预期 报告模式:run-and-report、执行模式:block、允许:run、非法模式:invalid。",
        "报告模式用来观察新策略会拦截什么，不是已经生效的限制。把 Content-Security-Policy-Report-Only 当成保护，被拒绝的脚本仍然执行。报告内容还可能含有页面地址和被拦截资源，接收端要按日志最小化处理，不能把报告正文当成授权依据。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function enforce(mode, decision) {
  if (mode !== 'enforce' && mode !== 'report-only') return 'invalid';
  if (decision === 'allowed') return 'run';
  if (decision === 'blocked' && mode === 'report-only') return 'run-and-report';
  if (decision === 'blocked') return 'block';
  return 'invalid';
}
console.log('报告模式:' + enforce('report-only', 'blocked'));
console.log('执行模式:' + enforce('enforce', 'blocked'));
console.log('允许:' + enforce('enforce', 'allowed'));
console.log('非法模式:' + enforce('observe', 'blocked'));`,
          expectedOutput: ["报告模式:run-and-report", "执行模式:block", "允许:run", "非法模式:invalid"],
          explanation: [
            "同一个 blocked 决定在两种模式下的页面行为不同。report-only 保留运行，只增加报告；enforce 才不运行。",
            "observe 不是模型接受的模式，返回 invalid，避免一个拼写错误被当成已执行拦截。allowed 在两种正确模式下都是 run，因为没有东西需要拦截。"
          ]
        }
      ]
    },
    {
      id: "deploy",
      title: "nonce 必须每份响应都不同，静态文件里的固定值没有这个作用",
      paragraphs: [
        "可用的 nonce 由服务端在每次响应时生成，写入策略和对应脚本元素，并且不进缓存的公共 HTML。构建期写死一个 nonce，任何拿到页面副本的人都能复用它。哈希适合内容在构建时就确定的脚本；脚本正文变化后，哈希必须一起变，否则会被正确拦截。",
        "第三方脚本若不能加上 nonce，就把它的 origin 单独列入名单，而不是退回 unsafe-inline。名单越宽，策略越接近没有限制。能改成自有源或沙箱嵌入的，优先缩小名单。K11-04 讨论脚本进入页面之后还拥有什么能力。",
        "策略要和实际资源一起部署。预加载、字体、图片、连接和 Worker 都可能有各自的指令。只写 script-src 却让页面从新的 API 主机取数据，连接仍会按 default-src 或浏览器的默认行为处理。本模型没有覆盖这些指令。"
      ]
    },
    {
      id: "boundaries",
      title: "CSP 不证明输出编码已经正确，也不覆盖服务端权限",
      paragraphs: [
        "一条允许 self 的策略仍会执行本源上的恶意脚本。CSP 缩小的是浏览器愿意执行的来源，不代替文本、HTML、URL 和脚本字符串各自的编码。它也不检查订单是否属于当前用户；那是 K11-02 的服务端授权。",
        "精确 origin 全等故意比真实 CSP 主机匹配更窄。真实策略里的协议、端口、路径和通配符都有单独语法。把本函数的返回值说成浏览器已经按 CSP3 匹配，超出了模型范围。",
        "报告端点、采样和跨域报告还有自己的失败路径。模型没有发送报告，因此不能证明报告系统可用，也不能证明违规已经被看见。"
      ]
    },
    {
      id: "practice",
      title: "先列出脚本，再决定 nonce、哈希或精确来源",
      paragraphs: [
        "给订单页列出内联脚本、本源脚本和第三方脚本。内联脚本改为 nonce 或哈希，并确认名单里没有靠 unsafe-inline 兜底。每个外部 origin 都要能说明为什么必须存在。先用报告模式观察，再切换到执行模式，并保留一条被拒绝脚本确实没有运行的检查。",
        "本主题没有已开放的独立练习。示例里的 order 和 sha256-demo 不能用作真实策略。"
      ]
    }
  ],
  sources: [
    { title: "MDN：Content Security Policy", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP" },
    { title: "MDN：CSP script-src", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src" },
    { title: "CSP Level 3：source lists", url: "https://www.w3.org/TR/CSP3/#framework-directive-source-list" }
  ]
};
