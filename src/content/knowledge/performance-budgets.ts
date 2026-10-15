import type { Article } from "../articles";

export const performanceBudgetsArticle: Article = {
  id: "K10-07",
  kind: "knowledge",
  domainSlug: "performance",
  slug: "performance-budgets",
  title: "性能预算与回归",
  summary: "用固定样本的 75 分位决定预算是否失败，样本不足时拒绝放行，并把单次变快和落在噪声带里的差异分开。",
  aliases: ["performance budget", "regression", "p75", "性能预算", "噪声"],
  tags: ["性能工程", "性能预算与回归"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "流水线是绿的，页面却可能已经变慢？",
      paragraphs: [
        "一次实验室运行从 100 降到 90，检查就被标成改善。同一组页面若只有两次样本，或者四次运行的 75 分位只从 100 升到 108，这个降幅可能是噪声，样本也可能根本不够做决定。预算若把“没有数据”和“数据合格”都当成通过，回归会在绿灯后面发生。",
        "本篇接续 K10-01 的分位和 K09-08 的发布门禁。示例使用 nearest-rank：排序后取 ceil(n × 0.75) − 1。阈值 10% 且绝对差小于 50 是作者为了演示噪声带写下的规则，不是通用的统计标准，也不是 Web Vitals 的官方预算。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：只对给定数字做门禁，不读取真实监控",
      paragraphs: [
        "运行 npm run verify:k10。两个示例都是同步函数，输入数组在源码里写死。它们不访问网络，也不连接 CI。",
        "把函数嵌进流水线之前，还要单独规定指标定义、环境和失败后谁不能发布。函数返回 fail，只说明这组数字没有满足作者规则。"
      ]
    },
    {
      id: "gate",
      title: "样本不足和非法样本都失败，不能当成预算内",
      paragraphs: [
        "预算门先要求样本数达到最小值，再计算 75 分位。分位大于预算为 regressed，否则为 within。决定函数只有 within 得到 pass，其余全部 fail。四次 100、120、140、180 相对预算 200，排序后下标 2 是 140，结果 within pass。100、180、260、400 的下标 2 是 260，结果 regressed fail。只有两次样本是 insufficient fail。包含负数是 invalid fail。",
        "失败关闭是这个门禁的核心。若 insufficient 也返回 pass，刚接上的采集故障会让变慢的版本继续发布。负数和缺失同样不能被忽略后用剩余样本计算。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function percentile(samples, ratio) {\n  if (!Array.isArray(samples) || samples.length === 0 || samples.some(value => !Number.isFinite(value) || value < 0)) return null;\n  const sorted = [...samples].sort((left, right) => left - right);\n  return sorted[Math.ceil(sorted.length * ratio) - 1];\n}\nfunction budgetGate(samples, budget, minSamples) {\n  if (!Number.isSafeInteger(minSamples) || minSamples < 1 || !Number.isFinite(budget) || budget < 0) return 'invalid';\n  if (!Array.isArray(samples) || samples.length < minSamples) return 'insufficient';\n  const p75 = percentile(samples, 0.75);\n  if (p75 === null) return 'invalid';\n  return p75 > budget ? 'regressed' : 'within';\n}\nfunction decide(result) { return result === 'within' ? 'pass' : 'fail'; }\nconst cases = [\n  [[100, 120, 140, 180], 200, 4],\n  [[100, 180, 260, 400], 200, 4],\n  [[100, 120], 200, 4],\n  [[100, -1, 120, 140], 200, 4]\n];\nfor (const [samples, budget, minSamples] of cases) {\n  const result = budgetGate(samples, budget, minSamples);\n  console.log(result + ' ' + decide(result));\n}",
          expectedOutput: ["within pass", "regressed fail", "insufficient fail", "invalid fail"],
          explanation: [
            "四条样本的 75 分位下标是 ceil(3) − 1，也就是排序后的第三项。140 没有超过 200，260 超过了。平均值会把这两组都拉向中间，所以门禁使用约定的分位而不是平均。",
            "insufficient 和 invalid 都进 decide 的失败分支。调用方如果只在 regressed 时失败，就会放行没有证据的构建。这个通过条件是 within，没有第三种“暂时算过”。"
          ]
        }
      ]
    },
    {
      id: "noise",
      title: "单次变快可以落在作者规定的噪声带里",
      paragraphs: [
        "比较函数要求基线和候选各自至少有 minRuns 次运行，然后比较两组的 75 分位。候选不高于基线为 no-regression。上升比例小于 10% 且绝对差小于 50 为 within-noise。超过这条带为 regressed。样本不够为 insufficient，基线分位为 0 时拒绝，避免除零。",
        "四次 100 对比四次 108，差 8，同时满足比例和绝对阈值，结果 within-noise。四次 130 的差是 30、比例 30%，结果 regressed。四次 90 是 no-regression。两次运行在最小次数为 4 时是 insufficient。这些阈值只属于本例，换一个更稳定或更吵的实验室就要重新估计，不能复制到所有指标。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function percentile(samples, ratio) {\n  if (!Array.isArray(samples) || samples.length === 0 || samples.some(value => !Number.isFinite(value) || value < 0)) return null;\n  const sorted = [...samples].sort((left, right) => left - right);\n  return sorted[Math.ceil(sorted.length * ratio) - 1];\n}\nfunction compareRuns(baseline, candidate, minRuns) {\n  if (!Number.isSafeInteger(minRuns) || minRuns < 1) return 'invalid';\n  if (!Array.isArray(baseline) || !Array.isArray(candidate) || baseline.length < minRuns || candidate.length < minRuns) return 'insufficient';\n  const base = percentile(baseline, 0.75);\n  const next = percentile(candidate, 0.75);\n  if (base === null || next === null || base === 0) return 'invalid';\n  const delta = next - base;\n  if (delta <= 0) return 'no-regression';\n  if (delta / base < 0.1 && delta < 50) return 'within-noise';\n  return 'regressed';\n}\nconsole.log(compareRuns([100, 100, 100, 100], [108, 108, 108, 108], 4));\nconsole.log(compareRuns([100, 100, 100, 100], [130, 130, 130, 130], 4));\nconsole.log(compareRuns([100, 100, 100, 100], [90, 90, 90, 90], 4));\nconsole.log(compareRuns([100, 90], [80, 70], 4));",
          expectedOutput: ["within-noise", "regressed", "no-regression", "insufficient"],
          explanation: [
            "108 比 100 大，但两条阈值都没有越过，函数拒绝把它叫作回归。130 的相对增幅已经达到 0.3，不再使用绝对差 30 小于 50 这一条单独放行。",
            "两次更快的运行仍然是 insufficient。单次从 100 看到 90 可以被人描述为变快，但在这个比较器里，没有四次基线和四次候选就不会产生 no-regression。"
          ]
        }
      ]
    },
    {
      id: "ci",
      title: "预算要写明指标、环境和失败后阻止哪一步",
      paragraphs: [
        "一个可执行的预算至少包含：指标名称和计算口径、页面与动作、设备网络或实验室配置、样本下限、比较对象，以及失败时阻止的是合并、部署还是只告警。只写“LCP 小于 2.5 秒”却不写清是实验室中位数还是真实用户 75 分位，前后运行不能比较。",
        "门禁应固定构建产物和环境。候选版本换了机器、网络节流或缓存状态，compareRuns 的输入就已经不是同一项测量。K09-08 的发布顺序模型负责阻止失败检查继续发布；本篇的 decide 只有 within 可以通过，二者衔接时不能在外层把 fail 吞掉。",
        "预算变严是产品决定，不是测量本身。把阈值从 200 改到 140 会让原来 within 的样本变成 regressed。修改阈值要和样本分开记录，避免把规则变化解释成页面变慢。"
      ]
    },
    {
      id: "boundaries",
      title: "实验室门禁不能单独证明真实用户没有回归",
      paragraphs: [
        "固定机器上的四次运行降低的是实验室噪声，不产生真实用户分布。移动网络、不同地区和后台标签都可能让字段数据的 75 分位变差，而实验室仍然 within。发布后仍要用 K10-01 的分组方式看字段数据。",
        "10% 与 50 个单位同时成立才算噪声，是为了避免一个很小的基线被相对比例放大，也避免一个很大的绝对值躲在百分比后面。它没有置信区间，不能称为统计检验。样本之间若互相影响，例如共享缓存把后一次运行变快，重复次数也不能消除这个偏差。",
        "性能预算失败不应被功能正确性的通过覆盖，功能失败也不应被性能通过覆盖。错误率上升时，即使分位变小，发布决定仍要单独看错误预算。"
      ]
    },
    {
      id: "practice",
      title: "用缺样本、噪声和明确回归各做一次决定",
      paragraphs: [
        "准备三组数字：次数不够、上升落在自己写明的噪声带内、上升越过噪声带。让门禁对前两组分别给出失败和保留，对第三组给出回归。然后改一个环境条件再运行，确认比较被拒绝，而不是和旧基线混在一起。",
        "本篇没有已开放的预算练习。示例阈值不能复制到生产流水线，除非团队用自己的重复运行重新选择并记录口径。"
      ]
    }
  ],
  sources: [
    { title: "web.dev：Performance budgets 101", url: "https://web.dev/articles/performance-budgets-101" },
    { title: "web.dev：Web Vitals", url: "https://web.dev/articles/vitals" }
  ]
};
