import type { Article } from "../articles";

export const deploymentRuntimesArticle: Article = {
  id: "K14-07",
  kind: "knowledge",
  domainSlug: "server",
  slug: "deployment-runtimes-and-edge",
  title: "部署运行时与边缘计算",
  summary: "用固定能力表区分边缘和 Node：文件与长连接留在 Node，跳转可以放在边缘，空闲边缘要付启动成本。",
  aliases: ["edge", "serverless", "cold start", "部署运行时"],
  tags: ["服务端", "部署", "边缘"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "把读文件的接口放到边缘之后，为什么第一次请求和本地结果不一样？",
      paragraphs: [
        "笔记导出在 Node 里用文件系统读取临时包，连接保持到写完。部署到更靠近用户的运行时后，文件 API 不存在，长连接也不在这张能力表里。另外，这个运行时空闲后再来的请求要重新启动，导出时间比进程一直活着的 Node 更不稳定。",
        "放置功能前先看运行时支持什么，以及空闲之后要不要付启动成本。跳转和按地区选择公开入口可以靠近用户。读写本地文件和保持长连接留在本模型的 Node。这张表不是某一家边缘产品的文档。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：只认识 edge 和 node，以及四项固定能力",
      paragraphs: [
        "运行 npm run verify:k14。accept 的能力只有 redirect、geo、filesystem、socket。边缘上文件和长连接是 unsupported，跳转和 geo 是 allowed。Node 上文件和长连接是 allowed，跳转是 allowed，geo 是 origin，表示个性化发生在源站而不是边缘缓存旁边。",
        "startCost 里空闲毫秒为 0 时两边都是 warm。空闲大于 0 时，边缘返回 cold-start，Node 返回 process-kept。未知运行时或负数是 invalid。40 毫秒只是作者写下的空闲值，不是测量到的冷启动时间。"
      ]
    },
    {
      id: "capability",
      title: "文件和长连接在这张表里不能放到边缘",
      paragraphs: [
        "边缘读文件是 unsupported，Node 是 allowed。边缘长连接是 unsupported，Node 是 allowed。边缘跳转是 allowed。边缘 geo 是 allowed，Node 的 geo 是 origin。",
        "导出笔记若要读临时文件，就留在 Node。只根据地区把用户送到已有的公开地址，可以放在边缘。不要因为边缘离用户近，就把依赖本地磁盘或长时间连接的步骤一起搬过去。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function accept(runtime, feature) {
  const table = {
    edge: { redirect: 'allowed', geo: 'allowed', filesystem: 'unsupported', socket: 'unsupported' },
    node: { redirect: 'allowed', geo: 'origin', filesystem: 'allowed', socket: 'allowed' },
  };
  if (!table[runtime] || !Object.hasOwn(table[runtime], feature)) return 'invalid';
  return table[runtime][feature];
}
console.log('边缘文件:' + accept('edge', 'filesystem'));
console.log('节点文件:' + accept('node', 'filesystem'));
console.log('边缘长连接:' + accept('edge', 'socket'));
console.log('节点长连接:' + accept('node', 'socket'));
console.log('边缘跳转:' + accept('edge', 'redirect'));
console.log('边缘个性化:' + accept('edge', 'geo'));
console.log('节点个性化:' + accept('node', 'geo'));
console.log('未知:' + accept('browser', 'redirect'));`,
          expectedOutput: [
            "边缘文件:unsupported",
            "节点文件:allowed",
            "边缘长连接:unsupported",
            "节点长连接:allowed",
            "边缘跳转:allowed",
            "边缘个性化:allowed",
            "节点个性化:origin",
            "未知:invalid"
          ],
          explanation: [
            "文件和长连接只在 node 一行是 allowed。边缘可以做跳转，个性化在边缘返回 allowed，在 Node 返回 origin。",
            "browser 不在表里，返回 invalid。不能把没列入的运行时说成和边缘或 Node 相同。"
          ]
        }
      ]
    },
    {
      id: "start",
      title: "空闲之后，边缘要计算启动，一直留着的进程不用",
      paragraphs: [
        "空闲 40 毫秒时，边缘是 cold-start，Node 是 process-kept。空闲 0 表示实例正在处理或刚处理过，两边都是 warm。启动成本只在空闲之后出现，不是每个请求都自动加上。",
        "导出这种偶尔发生、又要读文件的工作，冷启动会叠在不支持的 API 之上。高频的公开跳转即使偶发冷启动，也通常比把整次导出搬到边缘更合适。选择看的是请求形态和能力，不是“边缘一定更快”。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function startCost(runtime, idleMs) {
  if ((runtime !== 'edge' && runtime !== 'node') || !Number.isInteger(idleMs) || idleMs < 0) return 'invalid';
  if (idleMs === 0) return 'warm';
  if (runtime === 'edge') return 'cold-start';
  return 'process-kept';
}
console.log('空闲边缘:' + startCost('edge', 40));
console.log('空闲节点:' + startCost('node', 40));
console.log('正在用:' + startCost('edge', 0));
console.log('负数:' + startCost('node', -1));`,
          expectedOutput: [
            "空闲边缘:cold-start",
            "空闲节点:process-kept",
            "正在用:warm",
            "负数:invalid"
          ],
          explanation: [
            "同样空闲 40，边缘要重新启动，Node 在这个模型里保持进程。空闲 0 不再区分两边。",
            "负数没有空闲含义，返回 invalid。40 不是生产环境测得的毫秒数。"
          ]
        }
      ]
    },
    {
      id: "place",
      title: "一个请求可以分段：边缘做跳转，源站做文件和长连接",
      paragraphs: [
        "用户先到边缘，边缘只决定去哪个区域的源站。源站的 Node 读取导出文件并保持写完所需的连接。这样地理延迟和进程能力分开处理。把两段都放在边缘，会同时碰上 unsupported 和 cold-start。",
        "个性化若依据每个用户的笔记内容，edge 的 geo 允许并不表示可以把私有 HTML 缓存在边缘。地区是粗粒度的公开选择。私有响应仍按 K14-06 隔离，避免靠近用户的缓存变成跨用户共享。"
      ]
    },
    {
      id: "boundaries",
      title: "能力表不是某个平台的兼容清单，冷启动也不是测量值",
      paragraphs: [
        "有的边缘运行时提供部分文件或长连接能力，有的 Node 托管也会在空闲后回收进程。本表把 filesystem 和 socket 固定为边缘不支持、Node 支持，只为了让这个例子的边界稳定。换平台前要查那一版的 API，而不是引用 accept 的返回值。",
        "startCost 不测量 CPU、地区或包体积。cold-start 没有毫秒数。它只区分“要不要把启动算进这次请求”。",
        "redirect 返回 allowed，不检查目标是否安全。开放跳转仍要按 K11-06 限制目的地。运行时允许发重定向，不表示任意 URL 都可以作为目标。"
      ]
    },
    {
      id: "practice",
      title: "先列功能需要的 API，再决定它能不能靠近用户",
      paragraphs: [
        "读文件和长连接应得到边缘 unsupported、Node allowed。跳转可以在边缘。再写空闲与正在使用两种启动结果。私有页面不要只因为 geo allowed 就缓存在边缘。",
        "本主题没有已开放的独立练习。表中的能力名不是某一厂商的接口。"
      ]
    }
  ],
  sources: [
    { title: "Node.js：文件系统", url: "https://nodejs.org/api/fs.html" },
    { title: "MDN：WebSockets", url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API" },
    { title: "WinterCG", url: "https://wintercg.org/" }
  ]
};
