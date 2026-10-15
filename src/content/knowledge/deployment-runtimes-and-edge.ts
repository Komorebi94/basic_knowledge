import type { Article } from "../articles";

export const deploymentRuntimesArticle: Article = {
  "revision": 2,
  id: "K14-07",
  kind: "knowledge",
  domainSlug: "server",
  slug: "deployment-runtimes-and-edge",
  title: "部署运行时与边缘计算",
  summary: "先核对指定运行时的 API、生命周期与部署约束，再决定功能位置；用真实 Node 文件操作区分能力存在和托管权限。",
  aliases: ["edge", "serverless", "cold start", "部署运行时"],
  tags: ["服务端", "部署", "边缘"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-15",
  sections: [
    {
      id: "problem",
      title: "把读文件的接口放到边缘之后，为什么第一次请求和本地结果不一样？",
      paragraphs: [
        "同一导出程序在本机 Node 可以读取临时文件，迁移到另一托管环境后却失败：可能缺少 API、没有可写文件系统，也可能请求生命周期不允许继续执行。不能只凭 edge、serverless 或 Node 这些名称推出具体能力。",
        "前面的表格是“受限边缘与常驻进程”的固定教学配置。真实 Cloudflare Workers 提供 WebSocket 和出站 TCP 等能力，部分 Node 托管则会回收空闲实例。选择必须绑定供应商、兼容日期、协议方向、资源限制和请求生命周期；后面的 Node 探针只验证本地环境。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：只认识 edge 和 node，以及四项固定能力",
      paragraphs: [
        "运行 npm run verify:k14。accept 的能力只有 redirect、geo、filesystem、socket。边缘上文件和长连接是 unsupported，跳转和 geo 是 allowed。Node 上文件和长连接是 allowed，跳转是 allowed，geo 是 origin，表示个性化发生在源站而不是边缘缓存旁边。 这里 edge 指受限教学配置，不是所有边缘产品。",
        "startCost 另行接收生命周期 policy；persistent 保留进程，recycled 表示已确认回收，unknown 不推断。它不把所有 Node 部署标为常驻，也不把所有空闲都标为回收。"
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
        "启动取决于部署生命周期，不直接取决于语言运行时。本例把 policy 明确设为 persistent、recycled 或 unknown；只有确认回收后才将启动纳入下一请求，未知时不编造结论。",
        "空闲值 40 仅供模型分支推导，不代表任何平台的回收阈值或冷启动时长。实际记录要区分初始化、排队、网络与业务处理，并保留地区、包版本和实例状态。"
      ],
      examples: [
        {
          "language": "javascript",
          "code": "function startCost(policy, idleMs) {\n  if (!['persistent', 'recycled', 'unknown'].includes(policy) || !Number.isInteger(idleMs) || idleMs < 0) return 'invalid';\n  if (idleMs === 0) return 'warm';\n  if (policy === 'persistent') return 'process-kept';\n  if (policy === 'recycled') return 'cold-start';\n  return 'unknown';\n}\nconsole.log('按需回收:' + startCost('recycled', 40));\nconsole.log('常驻进程:' + startCost('persistent', 40));\nconsole.log('策略未知:' + startCost('unknown', 40));\nconsole.log('正在用:' + startCost('recycled', 0));\nconsole.log('负数:' + startCost('persistent', -1));",
          "expectedOutput": [
            "按需回收:cold-start",
            "常驻进程:process-kept",
            "策略未知:unknown",
            "正在用:warm",
            "负数:invalid"
          ],
          "explanation": [
            "空闲 40 不是冷启动测量，而是本例给定的输入。只有已经确认“该实例被回收”时，才在模型中计启动；常驻配置保留进程，生命周期未知就返回 unknown。",
            "Node 可以运行在按需回收平台，边缘实例也可能被复用。要根据实际实例启动、部署地区和负载记录观察，不能用 runtime 名称替代生命周期事实。"
          ]
        }
      ]
    },
    {
      id: "place",
      title: "一个请求可以分段：边缘做跳转，源站做文件和长连接",
      paragraphs: [
        "一个可行方案是边缘处理公开入口选择，具备所需权限和持久能力的源站负责文件导出；这是需要依据目标部署验证的方案，不是固定的 edge/Node 二选一。平台若提供合适的流、存储和连接能力，也可以重新评估位置。",
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
      "id": "node-runtime-probe",
      "title": "真实 Node 探针：临时文件可以读写，不代表它是持久数据库",
      "paragraphs": [
        "本例在 Node 22 的临时目录写入和读取一份固定作者文字，最后删除整个临时目录。API 存在与本次操作成功分别观察；权限失败会通过异常暴露，不能降级成假成功。该实验不建立 WebSocket 或 TCP 连接。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';\nimport { tmpdir } from 'node:os';\nimport { join } from 'node:path';\nconsole.log('Web API:' + [typeof fetch, typeof WebSocket].join(','));\nconst directory = await mkdtemp(join(tmpdir(), 'author-export-'));\ntry {\n  const file = join(directory, 'notes.txt');\n  await writeFile(file, '固定作者草稿', 'utf8');\n  console.log('读回:' + await readFile(file, 'utf8'));\n} finally { await rm(directory, { recursive: true, force: true }); }\nconsole.log('清理完成');",
          "expectedOutput": [
            "Web API:function,function",
            "读回:固定作者草稿",
            "清理完成"
          ],
          "explanation": [
            "当前 Node 提供 fetch 和 WebSocket 客户端构造器，临时目录本次允许写入；typeof 不能证明网络允许握手，也不能证明某个托管平台的全部协议与权限。",
            "finally 删除临时文件，展示资源所有权。容器重启、实例回收或平台迁移可能丢掉本地文件，因此重要导出和共享数据应按产品恢复目标选择持久存储；存在 fs API 不会自动产生这个保证。"
          ]
        }
      ]
    },
    {
      id: "practice",
      title: "先列功能需要的 API，再决定它能不能靠近用户",
      paragraphs: [
        "先填目标平台的能力、协议方向和生命周期，再预测是否可部署；不知道就写待核对。用本地 Node 探针验证一次文件读写，不把它推广成线上磁盘持久性。",
        "本主题没有专属编码题。能力表与本机实验各自限定环境，没有执行 Cloudflare 部署或比较跨地区延迟。"
      ]
    }
  ],
  sources: [
    {
      "title": "Node.js：文件系统",
      "url": "https://nodejs.org/api/fs.html"
    },
    {
      "title": "MDN：WebSockets",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API"
    },
    {
      "title": "WinterCG",
      "url": "https://wintercg.org/"
    },
    {
      "title": "Cloudflare Workers：WebSockets",
      "url": "https://developers.cloudflare.com/workers/runtime-apis/websockets/"
    },
    {
      "title": "Cloudflare Workers：TCP sockets",
      "url": "https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/"
    }
  ]
};
