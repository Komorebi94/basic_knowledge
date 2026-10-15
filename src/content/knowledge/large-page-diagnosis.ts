import type { Article } from "../articles";

export const largePageDiagnosisArticle: Article = {
  id: "K10-08",
  kind: "knowledge",
  domainSlug: "performance",
  slug: "large-page-diagnosis",
  title: "大型页面诊断案例",
  summary: "用一份虚拟订单页记录把移动端与桌面分开，逐条检验预加载和压缩页脚，并在 LCP 改善后继续保留未解决的交互问题。",
  aliases: ["performance diagnosis", "trace", "诊断", "回归验证", "订单页"],
  tags: ["性能工程", "大型页面诊断案例"],
  estimatedMinutes: 24,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "桌面实验室很快，移动端订单页为什么仍被判定为慢？",
      paragraphs: [
        "订单页在开发机上一次打开很快，实验室记录的桌面 LCP 集中在 1100 左右。同一时期四次移动访问的 LCP 却是 3200、2800、3000 和 3600。如果把所有设备合成一个平均数，桌面的快样本会把移动端的慢盖住。随后有人压缩了页脚脚本，实验室数字几乎没动；另一版提前发现主图，模型里的 LCP 从 70 降到 40，但点击筛选的 INP 仍是 180。",
        "本篇把 K10-01 的分组、K10-02 的交互、K10-03 的发现顺序和 K10-07 的失败关闭串成一次诊断。所有访问数字和 30、40、70、180 都是作者设定的虚拟记录，不是本站或某个生产站点的测量。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：虚拟访问记录和作者规定的接受条件",
      paragraphs: [
        "运行 npm run verify:k10。示例不打开 DevTools，也不读取性能时间线。分组使用和 K10-07 相同的 nearest-rank 75 分位。接受函数按固定顺序检查错误数、LCP 是否下降、INP 是否变差。",
        "诊断叙述里出现的“轨迹”是对前面章节模型的引用：阻塞 30 后才发现主图，下载成本 40，完成单位是 70。它不是一份可导入 Performance 面板的 trace 文件。"
      ]
    },
    {
      id: "segment",
      title: "先按设备分组，桌面的 1100 不能否定移动端的 3200",
      paragraphs: [
        "四次移动 LCP 排序后是 2800、3000、3200、3600。四条样本的 75 分位下标是 2，值为 3200。四次桌面排序后是 900、1000、1100、1200，同一下标是 1100。预期 mobile:3200,desktop:1100。",
        "这组样本只有各 4 次，能说明“不要合并后下结论”，不能说明真实用户的 75 分位就是 3200。字段数据还要有采集窗口、版本和足够的样本量。实验室如果只跑桌面，它复现的是 1100 这一组条件，而不是移动端。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function percentile(samples) {\n  const sorted = [...samples].sort((left, right) => left - right);\n  return sorted[Math.ceil(sorted.length * 0.75) - 1];\n}\nfunction groupLcp(visits) {\n  const groups = new Map();\n  for (const visit of visits) {\n    const list = groups.get(visit.device) ?? [];\n    list.push(visit.lcp);\n    groups.set(visit.device, list);\n  }\n  return [...groups].map(([device, values]) => device + ':' + percentile(values)).join(',');\n}\nconsole.log(groupLcp([\n  { device: 'mobile', lcp: 3200 },\n  { device: 'mobile', lcp: 2800 },\n  { device: 'mobile', lcp: 3000 },\n  { device: 'mobile', lcp: 3600 },\n  { device: 'desktop', lcp: 900 },\n  { device: 'desktop', lcp: 1100 },\n  { device: 'desktop', lcp: 1000 },\n  { device: 'desktop', lcp: 1200 }\n]));",
          expectedOutput: ["mobile:3200,desktop:1100"],
          explanation: [
            "Map 按第一次出现的设备保持顺序，所以移动端在前。两组各自排序，避免桌面的 900 到 1200 改变移动端的分位。",
            "函数没有检查样本量。诊断时必须在结论旁边写上每组只有 4 次；不能把这个输出单独当作预算通过或失败。"
          ]
        }
      ]
    },
    {
      id: "hypothesis",
      title: "一条改动只接受它真正改变的那一项",
      paragraphs: [
        "接受函数先看错误数，非 0 则 rejected-errors。LCP 没有严格变小则 no-lcp-change。LCP 变小但 INP 变大则 inp-worse。LCP 变小且 INP 不变则 lcp-only。两项都改善才是 both-improved。",
        "提前发现主图：完成单位从 70 到 40，INP 保持 180，错误数为 0，结论 lcp-only。只压缩页脚：主图发现时间不变，完成单位仍是 70，结论 no-lcp-change。预加载实现若引入错误，即使 LCP 数字变小也是 rejected-errors。若预加载额外把 INP 从 180 增到 220，结论是 inp-worse，不能只汇报 LCP 改善。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function accept(change) {\n  if (change.errors !== 0) return 'rejected-errors';\n  if (!(change.lcp < change.baselineLcp)) return 'no-lcp-change';\n  if (change.inp > change.baselineInp) return 'inp-worse';\n  if (change.inp === change.baselineInp) return 'lcp-only';\n  return 'both-improved';\n}\nconsole.log('预加载:' + accept({ lcp: 40, baselineLcp: 70, inp: 180, baselineInp: 180, errors: 0 }));\nconsole.log('页脚:' + accept({ lcp: 70, baselineLcp: 70, inp: 180, baselineInp: 180, errors: 0 }));\nconsole.log('有错误:' + accept({ lcp: 40, baselineLcp: 70, inp: 180, baselineInp: 180, errors: 1 }));\nconsole.log('交互变差:' + accept({ lcp: 40, baselineLcp: 70, inp: 220, baselineInp: 180, errors: 0 }));",
          expectedOutput: ["预加载:lcp-only", "页脚:no-lcp-change", "有错误:rejected-errors", "交互变差:inp-worse"],
          explanation: [
            "页脚压缩没有改变模型里的发现时间，第一项业务目标失败，函数不再讨论 INP。预加载达到了 LCP 目标且没有增加错误和 INP，所以保留为仅 LCP 改善。",
            "inp-worse 发生在 LCP 已经变小之后。报告若只写“主图从 70 到 40”，会漏掉筛选点击变得更慢。错误数优先于性能数字，避免一个损坏的页面因为更快而被接受。"
          ]
        }
      ]
    },
    {
      id: "retest",
      title: "复测要沿用同一分组，并显式留下未解问题",
      paragraphs: [
        "预加载结论是 lcp-only 时，移动端 LCP 假设可以进入复测，筛选 INP 仍是开放问题。复测应使用与基线相同的设备、网络和缓存状态，并继续按 mobile 与 desktop 分开。只在桌面复测预加载，不能回答最初的移动端 3200。",
        "开放问题需要一个新的证据入口，例如点击筛选后的长任务在脚本、布局还是第三方代码中。不要把 LCP 的 lcp-only 写成“页面性能已修复”。K10-07 的样本下限仍然适用：一次更快的刷新不是一组 75 分位。",
        "若复测时移动端分位没有下降，假设被否定，应回到发现时间是否真的提前、预加载 URL 是否和最终图片一致，而不是继续压缩无关资源。否定假设也是诊断结果。"
      ]
    },
    {
      id: "record",
      title: "一份诊断记录要能让另一个人重做决定",
      paragraphs: [
        "记录至少留下：用户动作是首次打开还是点击筛选；分组是 mobile 与 desktop；每组样本数和分位口径；候选原因是主图晚发现；对照改动是预加载和页脚压缩；接受条件是错误数不增加、目标指标下降、其他已观察指标不变差。缺任何一项，另一个人都无法判断 lcp-only 是否仍然成立。",
        "证据链接应指向版本、产物和原始数字的存放处。本篇的数字写在示例里，是为了让结论可复算。真实案例应保留原始记录，而不是只保留改写后的平均数。",
        "多个问题可以排队，但不能合并成一个“优化性能”的提交。预加载提交的验证范围是 LCP 发现时间；长任务提交的验证范围是筛选点击。混在一起时，任一方向的失败都会让两边都无法解释。"
      ]
    },
    {
      id: "boundaries",
      title: "虚拟案例没有测量渲染、权限和业务结果",
      paragraphs: [
        "模型里的 40 和 70 不是毫秒，也没有把主线程、图片解码和字体算进去。真实轨迹里，预加载成功仍可能因为解码、缓存未命中或错误的 srcset 而画不出来。INP 180 同样不是 Chrome 报告的交互延迟，它只是案例中“改动前后保持不变”的一个数。",
        "诊断没有检查订单接口的正确性、库存和权限。页面更快但显示了别人的订单，接受函数里的 errors 应该增加；如果错误没有被观测到，函数会错误地返回 lcp-only。观测本身是案例的一部分。",
        "大型页面往往同时有首屏、列表、编辑器和第三方脚本。本案例只处理一条首屏假设和一条被明确留下的交互问题，不能作为所有慢页面的检查清单。"
      ]
    },
    {
      id: "practice",
      title: "把一次慢拆成分组、假设、对照和未解项",
      paragraphs: [
        "选一个自己的慢动作，写下至少两个分组和每组样本数。提出一个可否定的原因，再写一个不应该改变该指标的对照改动。用同一条件复测，并列出这项改动没有覆盖的下一个指标。",
        "E25、E30 和 E40 尚未开放。本案例的虚拟数字不能当作这些练习或生产预算的输入。"
      ]
    }
  ],
  sources: [
    { title: "Chrome DevTools：Performance features reference", url: "https://developer.chrome.com/docs/devtools/performance/overview" },
    { title: "web.dev：Optimize Largest Contentful Paint", url: "https://web.dev/articles/optimize-lcp" },
    { title: "web.dev：Web Vitals", url: "https://web.dev/articles/vitals" }
  ]
};
