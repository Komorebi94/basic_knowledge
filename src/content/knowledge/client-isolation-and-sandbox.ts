import type { Article } from "../articles";

export const clientIsolationArticle: Article = {
  id: "K11-07",
  kind: "knowledge",
  domainSlug: "security",
  slug: "client-isolation-and-sandbox",
  title: "客户端隔离与沙箱",
  summary: "用订单页、子域和嵌入框架比较源、iframe sandbox 与 Worker 消息，说明同时允许脚本和同源时，同源框架不再构成隔离边界。",
  aliases: ["origin", "sandbox", "iframe", "Worker", "postMessage"],
  tags: ["安全", "客户端隔离与沙箱"],
  estimatedMinutes: 24,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "框架和 Worker 都在另一个文件里，为什么隔离效果不同？",
      paragraphs: [
        "订单页把支付小部件放进 iframe，把价格计算放进 Worker。两者都不在主文档的脚本文件里，但 iframe 仍可能与页面同源并操作文档，Worker 则没有页面 DOM。若 sandbox 同时写上 allow-scripts 和 allow-same-origin，而框架地址又属于 https://notes.example，这份 sandbox 不再把框架挡在页面权限之外。",
        "本篇使用平台 URL 的 origin 比较，以及一个只识别两项 sandbox 标记的模型。消息示例检查 origin 和 orderId 的类型。它们不创建框架或 Worker，也不发送真实消息。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：比较给定地址和标记，不嵌入页面",
      paragraphs: [
        "运行 npm run verify:k11。sameOrigin 交给 URL 解析器，因此默认端口 443 与省略端口视为同一 origin。frameIsolation 只理解 allow-scripts 和 allow-same-origin，其他标记被忽略而不是被当成允许。",
        "浏览器的源还包括不透明源和文件系统等特殊地址。模型只比较能被 URL 解析的 http 与 https 地址。"
      ]
    },
    {
      id: "origin",
      title: "协议、主机和端口都相同才是同一源",
      paragraphs: [
        "https://notes.example/a 与 https://notes.example:443/b 的 origin 相同，因为 https 的默认端口是 443。api.notes.example 是另一个主机，http 与 https 是另一种协议，两条比较都是 false。预期 默认端口:true、子域:false、协议:false。",
        "同一站点、同一注册域和同一源不是一回事。api 子域可以属于同一产品，却不能读取 notes 页面的 DOM。Cookie 的 Domain 范围若比源更宽，认证材料的发送范围也会比 DOM 访问范围更宽；那是 K11-02 的会话边界，不会被这里的 true 或 false 自动处理。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function sameOrigin(left, right) {
  return new URL(left).origin === new URL(right).origin;
}
console.log('默认端口:' + sameOrigin('https://notes.example/a', 'https://notes.example:443/b'));
console.log('子域:' + sameOrigin('https://notes.example/a', 'https://api.notes.example/b'));
console.log('协议:' + sameOrigin('https://notes.example/a', 'http://notes.example/a'));`,
          expectedOutput: ["默认端口:true", "子域:false", "协议:false"],
          explanation: [
            "URL 解析器把省略的 https 端口规范成与 :443 相同的 origin。路径 a 和 b 不参与 origin 比较。",
            "子域和协议任一不同都使 origin 字符串不同。这个结果不表示浏览器会阻止导航，只表示文档之间不能按同源策略互相读取。"
          ]
        }
      ]
    },
    {
      id: "sandbox",
      title: "脚本与同源两项同时打开时，同源框架不再被 sandbox 挡住",
      paragraphs: [
        "没有 allow-scripts 时结果是 no-scripts。只有 allow-scripts 时，框架得到不透明源，结果是 opaque-origin，脚本可以运行，但不能使用父页面的源。两项都有且框架 origin 等于父页面时，结果是 not-a-boundary。两项都有但框架是 https://widgets.example 时，结果是 cross-origin：脚本按其自己的源运行，与父页面仍是不同源。",
        "not-a-boundary 是部署错误而不是增强。需要隔离的小部件应使用另一源，或不要同时授予脚本和同源。需要与父页面通信时，用明确的消息和 origin 检查，而不是取消 sandbox。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function frameIsolation(flags, frameOrigin, parentOrigin) {
  const allowScripts = flags.includes('allow-scripts');
  const allowSame = flags.includes('allow-same-origin');
  if (allowScripts && allowSame && frameOrigin === parentOrigin) return 'not-a-boundary';
  if (!allowScripts) return 'no-scripts';
  if (!allowSame) return 'opaque-origin';
  return 'cross-origin';
}
const parent = 'https://notes.example';
console.log('空标记:' + frameIsolation([], parent, parent));
console.log('仅脚本:' + frameIsolation(['allow-scripts'], parent, parent));
console.log('脚本加同源:' + frameIsolation(['allow-scripts', 'allow-same-origin'], parent, parent));
console.log('其他源:' + frameIsolation(['allow-scripts', 'allow-same-origin'], 'https://widgets.example', parent));`,
          expectedOutput: ["空标记:no-scripts", "仅脚本:opaque-origin", "脚本加同源:not-a-boundary", "其他源:cross-origin"],
          explanation: [
            "空标记连脚本都不运行。只允许脚本时，模型不把框架视为父源，因此返回不透明源。加上同源且地址确实属于父源时，两项授予抵消了 sandbox 的隔离。",
            "widgets.example 即使被允许使用它自己的源，父页面 origin 仍然不同，所以保持 cross-origin。这个返回值不表示父页面已经检查了消息；消息是下一个判断。"
          ]
        }
      ]
    },
    {
      id: "message",
      title: "Worker 没有文档，消息仍要核对来源和字段",
      paragraphs: [
        "Worker 不能访问父页面的 document。这使它适合不需要 DOM 的计算，但也意味着它不能成为显示订单的安全界面。父页面与 Worker、父页面与框架之间的数据都要通过消息传递。acceptMessage 只有 event.origin 等于预期源，且 data.orderId 是非空字符串时才接受。",
        "预期：来自 https://notes.example 且订单号为 1 时得到 accepted:1。来自 https://evil.example 的同形数据为 rejected。本源但缺少 orderId 为 invalid。先看来源，再看字段，避免处理一个不该接收的对象时才发现它的形状有问题。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function acceptMessage(event, expected) {
  if (event.origin !== expected) return 'rejected';
  if (typeof event.data?.orderId !== 'string' || event.data.orderId.length === 0) return 'invalid';
  return 'accepted:' + event.data.orderId;
}
const parent = 'https://notes.example';
console.log(acceptMessage({ origin: parent, data: { orderId: '1' } }, parent));
console.log(acceptMessage({ origin: 'https://evil.example', data: { orderId: '1' } }, parent));
console.log(acceptMessage({ origin: parent, data: {} }, parent));`,
          expectedOutput: ["accepted:1", "rejected", "invalid"],
          explanation: [
            "第二条的数据形状是对的，但 origin 不同，函数在读取业务含义前拒绝。第三条来源正确，却没有可用的订单号，因此是数据无效而不是来源错误。",
            "模型接收的是已经取好的 origin 和 data。真实 message 事件还要使用事件自身的 origin，不能改信 data 里面自报的来源字段。Worker 没有 origin 的页面文档，封装消息的代码仍要在两端固定预期对方。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "源隔离不消除同一文档中的脚本权限",
      paragraphs: [
        "主文档里的经典脚本与页面同源。把它移进同目录下的另一个文件，不会创造新源。只有不同 origin、不透明的 sandbox 源，或没有 DOM 的 Worker，才改变可访问的对象。K11-04 的 page-origin 指的就是前一种加载方式。",
        "opaque-origin 仍可能通过窗口目标、许可策略和被父页面主动交给它的数据产生影响。父页面若把令牌放进消息，隔离边界外面的数据又进入了框架。消息内容要按 K11-05 最小化。",
        "跨源框架的屏幕阅读和焦点顺序仍是页面的一部分。隔离是权限边界，不是把嵌入内容从无障碍树里自动删除。用户必须能理解并操作实际存在的控件。"
      ]
    },
    {
      id: "practice",
      title: "画出数据可以到达的源，而不是只数文件个数",
      paragraphs: [
        "给订单页列出主文档、框架和 Worker。写下每个 origin、sandbox 标记和消息字段。若某个框架与父页面同源且同时允许脚本和同源，把它标成没有隔离，直到来源或标记改变。每条消息都要有预期 origin 和字段校验。",
        "没有已开放的隔离练习。示例不会创建可交互的框架。"
      ]
    }
  ],
  sources: [
    { title: "MDN：Same-origin policy", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy" },
    { title: "MDN：iframe sandbox", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox" },
    { title: "HTML：iframe sandbox", url: "https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox" },
    { title: "MDN：postMessage", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage" }
  ]
};
