import type { Article } from "../articles";

export const streamingRenderArticle: Article = {
  "revision": 2,
  id: "K14-05",
  kind: "knowledge",
  domainSlug: "server",
  slug: "streaming-render-and-resume",
  title: "流式渲染与加载边界",
  summary: "用外壳、笔记和订单三段说明外壳失败就停止，某一段失败留空洞，脚本接续前页面只有可见内容。",
  aliases: ["streaming SSR", "suspense", "resume", "流式渲染"],
  tags: ["服务端", "渲染", "加载"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-15",
  sections: [
    {
      id: "problem",
      title: "订单接口失败了，为什么整页连已经写好的笔记也不返回？",
      paragraphs: [
        "服务端要等笔记和订单都查完，才一次性输出 HTML。订单超时，笔记区域其实已经有数据，用户却什么都看不到。反过来，外壳先到了，按钮也画出来了，可脚本还没接续，点击没有行为。把“字节已经发出”理解成“页面已经可用”，两件事就混在一起。",
        "先用段名称模型区分外壳失败与局部失败，再实际运行 React 流式 SSR 和浏览器水合。已发送字节、已获得脚本与已接上对应交互是三个条件；原生链接等 HTML 行为还可能在脚本之前可用。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：第一段必须是成功的 shell，接续标记只有三种",
      paragraphs: [
        "运行 npm run verify:k14。renderSlots 要求第一项名字是 shell 且状态为 ok，否则 abort。后面每一项状态为 ok 时输出名字，否则输出名字加 :hole。函数不生成 HTML。",
        "continueClient 只认识 html-only、script-ready 和 hydrated，分别返回 visible-only、awaiting-hydration 和 resumed。其他标记是 invalid。这三个词描述模型里的阶段，不是浏览器事件名。"
      ]
    },
    {
      id: "slots",
      title: "外壳失败就中止，订单失败只把订单留成空洞",
      paragraphs: [
        "shell 状态为 down 时返回 abort，后面即使还有笔记也不会输出。shell 成功、notes 成功、orders 失败时，结果是 shell,notes,orders:hole。笔记已经进入输出，订单的位置被保留下来。",
        "空洞要有稳定名字，客户端才知道补哪一段。不要在失败时省略 orders，否则页面会把“没有这段”和“这段加载失败”看成一样。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function renderSlots(slots) {
  if (!slots.length || slots[0].name !== 'shell' || slots[0].status !== 'ok') return 'abort';
  const out = ['shell'];
  for (const slot of slots.slice(1)) out.push(slot.status === 'ok' ? slot.name : slot.name + ':hole');
  return out.join(',');
}
console.log('外壳失败:' + renderSlots([{ name: 'shell', status: 'down' }, { name: 'notes', status: 'ok' }]));
console.log('部分:' + renderSlots([{ name: 'shell', status: 'ok' }, { name: 'notes', status: 'ok' }, { name: 'orders', status: 'down' }]));
console.log('空列表:' + renderSlots([]));`,
          expectedOutput: [
            "外壳失败:abort",
            "部分:shell,notes,orders:hole",
            "空列表:abort"
          ],
          explanation: [
            "外壳失败时，后面的 notes 即使状态是 ok 也不出现。没有可挂载的页面时，继续输出一段笔记没有位置。",
            "订单失败保留 orders:hole。空列表同样 abort，因为第一段外壳不存在。"
          ]
        }
      ]
    },
    {
      id: "resume",
      title: "HTML 到达、脚本可运行、接续完成，是三个阶段",
      paragraphs: [
        "html-only 返回 visible-only，只表示模型尚未接上依赖脚本的操作。script-ready 返回 awaiting-hydration：模块可执行，框架仍需对当前区域绑定行为。hydrated 返回 resumed，表示本模型已完成接管。原生链接等不依赖脚本的操作可更早使用。",
        "css 不是上述状态，返回 invalid。不要将下载完成、样式就绪或外壳出现直接写成业务可交互；用真实控件验证状态。"
      ],
      examples: [
        {
          "language": "javascript",
          "code": "function continueClient(mark) {\n  if (mark === 'html-only') return 'visible-only';\n  if (mark === 'script-ready') return 'awaiting-hydration';\n  if (mark === 'hydrated') return 'resumed';\n  return 'invalid';\n}\nconsole.log('只有壳:' + continueClient('html-only'));\nconsole.log('脚本:' + continueClient('script-ready'));\nconsole.log('接续:' + continueClient('hydrated'));\nconsole.log('未知:' + continueClient('css'));",
          "expectedOutput": [
            "只有壳:visible-only",
            "脚本:awaiting-hydration",
            "接续:resumed",
            "未知:invalid"
          ],
          "explanation": [
            "三个标签区分可见、已具备执行脚本条件、已完成当前区域接管。脚本就绪时仍不能声称 React 点击行为已经可用；后面的真实实验通过按钮状态核对。",
            "标签是模型输入，不是浏览器事件。原生链接和表单本来有自己的 HTML 行为，不能把整个文档都称为无交互。"
          ]
        }
      ]
    },
    {
      id: "holes",
      title: "空洞要能重试，不能让失败段挡住已经显示的笔记",
      paragraphs: [
        "orders:hole 可以显示重试，笔记区域保持可用。重试只重取订单，不重新请求外壳，除非外壳本身无效。若重试会整页刷新并丢掉用户已经在笔记区输入的草稿，失败边界就过大了。",
        "外壳里的关键导航若依赖尚未到达的段，应把那部分放进外壳，或者明确它在空洞被填上之前不可用。不要一边流式输出，一边假设所有按钮都已接续。"
      ]
    },
    {
      id: "boundaries",
      title: "段名称不是 HTML，接续标记也不是一次真实水合",
      paragraphs: [
        "renderSlots 不输出文档，不处理分块字节，也不暂停等待网络。React 的 renderToReadableStream、Suspense 边界和 Web 的 ReadableStream 有各自的排队与取消语义。abort 只表示这个模型停止。",
        "continueClient 不检查脚本是否下载成功，也不恢复事件监听。resumed 是调用方传入 hydrated 之后的名字。真正的水合还要核对服务端标记和客户端第一次渲染是否一致。",
        "某一段失败留空洞，是当这段可以缺席时的选择。若订单是这一页的唯一内容，留空洞仍可能让页面没有可用操作，这时应把错误放进外壳并提供整页恢复，而不是显示一个空壳。"
      ]
    },
    {
      "id": "react-streaming-server",
      "title": "真实流式 SSR：外壳已发出，正文稍后补齐",
      "paragraphs": [
        "在 Node 22 使用 React 19.3.0 的 renderToPipeableStream，将已准备的外壳和挂起的笔记分开。客户端脚本并未在这里执行；观察的是实际写入 Writable 的 HTML 字节。等待首段确实写出后才兑现正文，确保验证分段而不是一次性缓冲完成。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { createElement as h, Suspense, use } from 'react';\nimport { renderToPipeableStream } from 'react-dom/server';\nimport { Writable } from 'node:stream';\nimport { once } from 'node:events';\nlet resolveNote, firstWrite;\nconst note = new Promise(resolve => { resolveNote = resolve; });\nconst firstChunk = new Promise(resolve => { firstWrite = resolve; });\nfunction Note() { return h('article', null, use(note)); }\nlet html = '';\nconst sink = new Writable({ write(chunk, _encoding, done) { html += chunk.toString(); firstWrite(); done(); } });\nconst completion = once(sink, 'finish');\nlet renderError;\nconst stream = renderToPipeableStream(h('main', null, h('h1', null, '笔记'), h(Suspense, { fallback: h('p', null, '读取中') }, h(Note))), {\n  onShellReady() { stream.pipe(sink); },\n  onShellError(error) { sink.destroy(error); },\n  onError(error) { renderError = error; },\n});\nawait firstChunk;\nconsole.log('首段后备:' + html.includes('读取中'));\nconsole.log('首段正文:' + html.includes('完整正文'));\nresolveNote('完整正文'); await completion;\nconsole.log('最终正文:' + html.includes('完整正文'));\nconsole.log('渲染无误:' + (renderError === undefined));",
          "expectedOutput": [
            "首段后备:true",
            "首段正文:false",
            "最终正文:true",
            "渲染无误:true"
          ],
          "explanation": [
            "未完成的 note 使内层挂起，但外壳的 h1 和 fallback 可以先写到接收端；首段没有完整正文。兑现后 React 重试该边界，把正文及接续所需标记继续输出。",
            "这证明服务端分段，不证明浏览器已经接管。正式 HTTP 服务还需正确 Content-Type、代理缓冲配置、CSP nonce、客户端资源与断开时 stream.abort；首段输出后也不能再任意修改已提交响应头。失败边界必须按页面是否仍可用设计。"
          ]
        }
      ]
    },
    {
      "id": "react-hydration-client",
      "title": "真实水合：脚本存在之后，还要接上已有按钮",
      "paragraphs": [
        "隔离服务的 /react-ssr.json 来自 Node React 的真实 renderToString，初始值固定为 1。只将这份受审查的作者 HTML 装入容器，先点击一次，再调用 hydrateRoot 后点击。生产页面不能照此注入任意外部 HTML。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createElement as h, hydrateRoot, useState, act } from '/react.mjs';\nglobalThis.IS_REACT_ACT_ENVIRONMENT = true;\nconst { html, initial } = await (await fetch('/react-ssr.json')).json();\nconst host = document.body.appendChild(document.createElement('div'));\nhost.innerHTML = html;\nconst original = host.querySelector('button');\noriginal.click(); console.log('接管前:' + original.textContent);\nfunction Counter() { const [count, setCount] = useState(initial); return h('button', { onClick: () => setCount(value => value + 1) }, count); }\nlet root;\nconst errors = [];\nawait act(async () => { root = hydrateRoot(host, h(Counter), { onRecoverableError: error => errors.push(error) }); });\nawait act(async () => { host.querySelector('button').click(); });\nconsole.log('接管后:' + host.querySelector('button').textContent);\nconsole.log('节点复用:' + (original === host.querySelector('button')));\nconsole.log('水合错误:' + errors.length);\nawait act(async () => { root.unmount(); }); host.remove();",
          "expectedOutput": [
            "接管前:1",
            "接管后:2",
            "节点复用:true",
            "水合错误:0"
          ],
          "explanation": [
            "即使 React 模块已下载，尚未调用 hydrateRoot 时，该按钮也没有业务监听，点击后仍是 1。水合采用同一初始状态与标记，复用已有节点并建立交互，之后点击变成 2。",
            "脚本就绪是获得执行条件，不是区域已可交互的证据。原生链接等 HTML 能力可能在脚本前就可用；这里检查的是依赖 React 监听的计数按钮。随机初值、错误嵌套或不同用户数据可能导致水合不匹配，错误不能靠清空容器掩盖。"
          ]
        }
      ]
    },
    {
      id: "practice",
      title: "写出外壳失败、单段失败和三个客户端阶段",
      paragraphs: [
        "外壳失败时期望 abort，即使后面的数据是成功的。单段失败时期望其他段仍在，失败段带 hole。客户端用可见、可交互和已接续三行分开写，不要合并成“加载完成”。",
        "本主题没有已开放的独立练习。示例不渲染框架组件。"
      ]
    }
  ],
  sources: [
    { title: "React：renderToReadableStream", url: "https://react.dev/reference/react-dom/server/renderToReadableStream" },
    { title: "MDN：ReadableStream", url: "https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream" },
    { title: "MDN：Streams API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Streams_API" }
  ]
};
