import type { Article } from "../articles";

export const systemDesignCapacityArticle: Article = {
  "revision": 2,
  id: "K13-08",
  kind: "knowledge",
  domainSlug: "architecture",
  slug: "system-design-and-capacity",
  title: "系统设计与容量推演",
  summary: "用笔记数量、写入频率和搜索需求选择存储形状，并给搜索、写入、读取失败各自留下可见的降级。",
  aliases: ["capacity", "degradation", "system design", "容量"],
  tags: ["架构", "容量", "失败"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-15",
  sections: [
    {
      id: "problem",
      title: "笔记还不到一百条，为什么方案已经按全站搜索集群来设计？",
      paragraphs: [
        "设计说明写了搜索集群、写入队列和多副本，但当前只有几十篇笔记、每分钟几次保存，也不需要跨字段搜索。另一份方案在搜索不可用时整页报错，用户连最近的笔记列表也看不到。规模、写入频率和失败后的可见行为没有分开写，工具选择先于约束。",
        "推演应先写下数量、写入频率、是否真的要搜索，以及每种失败时用户还能做什么。本篇的阈值是教学模型里的固定整数，不是一次容量评估，也不是服务级别目标。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：四档存储和三种失败，阈值只在本模型里生效",
      paragraphs: [
        "运行 npm run verify:k13。笔记数和每分钟写入必须是非负整数。需要搜索且笔记数大于 10000 时返回 indexed-query。不超过 200 条且每分钟写入不超过 10 次时返回 local-cache。每分钟写入大于 600 时返回 queue-write。其余是 single-table。",
        "搜索阈值先于小规模判断，但 80 条即使需要搜索也不大于 10000，所以仍可能是 local-cache。degrade 把搜索失败映射为列出最近笔记，写入失败保留草稿，读取失败显示错误。其他故障名是 invalid。"
      ]
    },
    {
      id: "shape",
      title: "小规模即使想搜索，也还没有跨过索引阈值",
      paragraphs: [
        "80 条、每分钟 2 次、不搜索，是 local-cache。50000 条、每分钟 20 次、需要搜索，是 indexed-query。同样 80 条且需要搜索，因为没有超过 10000，结果仍是 local-cache。5000 条、每分钟 800 次是 queue-write。5000 条、每分钟 30 次、不搜索是 single-table。负数是 invalid。",
        "local-cache 表示这份规模可以先靠本地或单机上的简单存储。它不表示永远不迁移。跨过写入或搜索阈值后，选择才改变。先上队列或索引，不会让 80 条笔记的正确性更好，只会多一份要失败的组件。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function chooseStore(notes, writesPerMinute, needSearch) {
  if (!Number.isInteger(notes) || notes < 0 || !Number.isInteger(writesPerMinute) || writesPerMinute < 0) return 'invalid';
  if (needSearch && notes > 10000) return 'indexed-query';
  if (notes <= 200 && writesPerMinute <= 10) return 'local-cache';
  if (writesPerMinute > 600) return 'queue-write';
  return 'single-table';
}
console.log('小:' + chooseStore(80, 2, false));
console.log('搜索:' + chooseStore(50000, 20, true));
console.log('小但要搜:' + chooseStore(80, 2, true));
console.log('写入:' + chooseStore(5000, 800, false));
console.log('普通:' + chooseStore(5000, 30, false));
console.log('非法:' + chooseStore(-1, 1, false));`,
          expectedOutput: [
            "小:local-cache",
            "搜索:indexed-query",
            "小但要搜:local-cache",
            "写入:queue-write",
            "普通:single-table",
            "非法:invalid"
          ],
          explanation: [
            "需要搜索只在笔记数大于 10000 时改变结果。80 条仍走小规模分支，避免一个布尔值直接引入索引集群。",
            "写入频率大于 600 时，即使笔记数只有 5000 且不搜索，也返回队列。普通的 30 次写入则保持单表。负数没有规模含义，返回 invalid。"
          ]
        }
      ]
    },
    {
      id: "failure",
      title: "搜索挂了还可以列最近笔记，读取挂了就不能假装有数据",
      paragraphs: [
        "search-down 返回 list-recent：搜索不可用时缩小能力，仍显示最近笔记。write-down 返回 keep-draft：保存失败时草稿留在用户这里，不显示已保存。read-down 返回 show-error：没有可显示的笔记时不能编一份空成功。slow 返回 invalid，因为变慢还没有对应的用户可见策略。",
        "降级是产品行为，不是把错误吞掉。列表、草稿和错误页要能被用户区分。K10 的性能预算可以约束页面大小，但不能代替这里“哪一种依赖挂了还能做什么”。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function degrade(failure) {
  if (failure === 'search-down') return 'list-recent';
  if (failure === 'write-down') return 'keep-draft';
  if (failure === 'read-down') return 'show-error';
  return 'invalid';
}
console.log('搜索挂了:' + degrade('search-down'));
console.log('写入挂了:' + degrade('write-down'));
console.log('读取挂了:' + degrade('read-down'));
console.log('未知故障:' + degrade('slow'));`,
          expectedOutput: [
            "搜索挂了:list-recent",
            "写入挂了:keep-draft",
            "读取挂了:show-error",
            "未知故障:invalid"
          ],
          explanation: [
            "三种失败的用户结果不同。搜索失败仍有最近列表，读取失败没有可展示的笔记，所以必须显示错误。",
            "slow 没有映射。把未知故障当成 list-recent 会在读取变慢时展示过时的空策略，模型因此拒绝。"
          ]
        }
      ]
    },
    {
      id: "constraints",
      title: "先写约束和失败，再挑选能满足它们的最简单形状",
      paragraphs: [
        "约束包括笔记数量、写入频率、搜索是否跨字段、能不能接受短暂旧列表，以及草稿能不能只留在浏览器。形状从 local-cache、single-table、queue-write 到 indexed-query 逐级增加运行和故障面。能用前一档说明的，就不选后一档。",
        "容量数字要带单位和日期，并写明是估计还是已测量。本模型的 200、10、10000 和 600 只为了让例子稳定。真实方案换成测量值后，分支条件跟着改，降级行为仍要逐项保留。"
      ]
    },
    {
      id: "boundaries",
      title: "阈值不是服务目标和机器规格，降级名也不是已实现的页面",
      paragraphs: [
        "chooseStore 不估算磁盘、内存、地区和副本。local-cache 可能在真实配额下失败，那是另一项约束。函数输出不能写成已经选型完成的基础设施。",
        "degrade 不渲染页面，也不重试。list-recent 假设最近列表来自另一条仍可用的读取路径；如果最近列表和搜索共用一个已经挂掉的存储，这个降级不成立。",
        "整数笔记数忽略了单篇大小和附件。写入频率忽略了突发。超过平均值之前，峰值仍可能需要队列。模型没有峰值参数，就不能声称已经覆盖突发。"
      ]
    },
    {
      "id": "capacity-derivation",
      "title": "把记录数阈值换成一次可复算的容量推导",
      "paragraphs": [
        "前面的 80、50000 等数字只定义教学分支。真实选型先给规模单位：记录数、每条 UTF-8 字节、分页大小、同时请求数、峰值请求率及可接受陈旧时间。下面用固定作者记录实际编码一次，估算原始正文总量与单页传输；这不是数据库索引、压缩或 JavaScript 堆的精确容量。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const sample = { id: 'note-a', text: '笔记'.repeat(200) };\nconst bytesPerRow = new TextEncoder().encode(JSON.stringify(sample)).byteLength;\nconst totalRows = 100000;\nconst pageRows = 50;\nconst totalBytes = bytesPerRow * totalRows;\nconst pageBytes = bytesPerRow * pageRows;\nconst peakRequestsPerSecond = 90 / 60 * 10;\nconst averageSeconds = 0.05;\nconsole.log('正文超过8MiB:' + (totalBytes > 8 * 1024 * 1024));\nconsole.log('单页小于256KiB:' + (pageBytes < 256 * 1024));\nconsole.log('峰值每秒请求:' + peakRequestsPerSecond);\nconsole.log('平均在途估计:' + peakRequestsPerSecond * averageSeconds);",
          "expectedOutput": [
            "正文超过8MiB:true",
            "单页小于256KiB:true",
            "峰值每秒请求:15",
            "平均在途估计:0.75"
          ],
          "explanation": [
            "UTF-8 编码把汉字与 JSON 结构都计入样本字节；乘以十万条后，整批正文超过自定的 8MiB 下载预算，而 50 条分页仍低于自定的 256KiB。由此优先验证分页和按需查询，不是从记录数直接宣布必须采用某个数据库。",
            "90 次/分钟乘 10 倍突发得到 15 次/秒；在稳定流量与平均耗时 0.05 秒的粗略假设下，在途均值约 0.75。均值不覆盖突发尾部、排队、索引、权限和故障恢复。接下来要测 P95、写入冲突、真实配额及停服后的草稿恢复；没有这些证据就保留未知，而不是调整阈值让结论通过。"
          ]
        }
      ]
    },
    {
      id: "practice",
      title: "用当前规模选一档，并给三种失败各写一句用户能看见的结果",
      paragraphs: [
        "先填笔记数、每分钟写入和是否搜索，得到一档存储。再分别写搜索、写入和读取失败时是最近列表、保留草稿还是错误页。数字更换后重跑选择，不要让旧的集群方案留在文档里。",
        "本主题没有已开放的独立练习。200、10000 和 600 不能当作生产阈值。"
      ]
    }
  ],
  sources: [
    { title: "MDN：Performance", url: "https://developer.mozilla.org/en-US/docs/Web/API/Performance" },
    { title: "W3C：Resource Timing", url: "https://www.w3.org/TR/resource-timing-2/" },
    { title: "MDN：503", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503" }
  ]
};
