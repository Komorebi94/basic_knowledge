import type { Article } from "../articles";

export const streamingRenderArticle: Article = {
  id: "K14-05",
  kind: "knowledge",
  domainSlug: "server",
  slug: "streaming-render-and-resume",
  title: "流式渲染与加载边界",
  summary: "用外壳、笔记和订单三段说明外壳失败就停止，某一段失败留空洞，脚本接续前页面只有可见内容。",
  aliases: ["streaming SSR", "suspense", "resume", "流式渲染"],
  tags: ["服务端", "渲染", "加载"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "订单接口失败了，为什么整页连已经写好的笔记也不返回？",
      paragraphs: [
        "服务端要等笔记和订单都查完，才一次性输出 HTML。订单超时，笔记区域其实已经有数据，用户却什么都看不到。反过来，外壳先到了，按钮也画出来了，可脚本还没接续，点击没有行为。把“字节已经发出”理解成“页面已经可用”，两件事就混在一起。",
        "流式输出可以先发送外壳，再补上各段。外壳失败应停止，因为后面没有可挂载的页面。某一段失败应留下有名字的空洞，而不是取消已经发送的外壳。客户端还要单独标记脚本何时可交互、何时接续完成。本篇不运行 React 的服务端渲染。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：第一段必须是成功的 shell，接续标记只有三种",
      paragraphs: [
        "运行 npm run verify:k14。renderSlots 要求第一项名字是 shell 且状态为 ok，否则 abort。后面每一项状态为 ok 时输出名字，否则输出名字加 :hole。函数不生成 HTML。",
        "continueClient 只认识 html-only、script-ready 和 hydrated，分别返回 visible-only、interactive 和 resumed。其他标记是 invalid。这三个词描述模型里的阶段，不是浏览器事件名。"
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
        "html-only 返回 visible-only：用户能看见外壳和已到的段，依赖脚本的点击还没有行为。script-ready 返回 interactive：脚本可以开始绑定，但框架若还没把已有标记接上状态，仍不算接续完成。hydrated 返回 resumed。",
        "css 不是这三种标记，返回 invalid。不要把样式表加载完成写成页面已经可交互。K14-02 区分了画出内容和获得行为；这里把流式页面的后半段也放进同一条时间线。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function continueClient(mark) {
  if (mark === 'html-only') return 'visible-only';
  if (mark === 'script-ready') return 'interactive';
  if (mark === 'hydrated') return 'resumed';
  return 'invalid';
}
console.log('只有壳:' + continueClient('html-only'));
console.log('脚本:' + continueClient('script-ready'));
console.log('接续:' + continueClient('hydrated'));
console.log('未知:' + continueClient('css'));`,
          expectedOutput: [
            "只有壳:visible-only",
            "脚本:interactive",
            "接续:resumed",
            "未知:invalid"
          ],
          explanation: [
            "可见、脚本就绪和接续完成依次发生。前一阶段不能代替后一阶段的结论。",
            "未知标记失败，避免把样式或图片加载当成脚本已经接上。"
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
