import type { Article } from "../articles";

export const costLatencyModelChoiceArticle: Article = {
  "id": "AI18",
  "catalogId": "AI18",
  "kind": "ai",
  "slug": "cost-latency-model-choice",
  "title": "成本、延迟与模型选择",
  "summary": "以清单导入代码助手的固定任务集为例，计算包含重试、工具和人工修复的任务成本，区分冷暖缓存、首个 token 与完成延迟，并在质量门槛内比较方案。",
  "aliases": [
    "cost latency",
    "TTFT",
    "p95",
    "model selection",
    "AI18"
  ],
  "tags": [
    "AI 工程",
    "评估",
    "成本与延迟"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-09",
  "sections": [
    {
      "id": "problem",
      "title": "单次调用便宜，完成同一任务也便宜吗？",
      "paragraphs": [
        "我们要选择帮助维护清单导入功能的代码助手。方案 A 的一次模型调用更便宜，但常常需要第二次修复，且有候选会在末项非法时丢掉旧数据。方案 B 一次生成更贵，返工较少。选择前必须明确交付是通过验收的改动，而不是一次看起来完整的回答；否则会把未完成工作计为省钱。",
        "固定任务包含合法导入、末项非法、重复 id、空数组、存储失败恢复与旧 schema 迁移。不可接受项是数据丢失和越权工具操作；一般正确率与延迟预算另设门槛。本文只使用人工构造的观测记录和虚构实验费率，示例可在现代浏览器或 Node.js 22 执行，不连接任何模型 API，不代表当前模型价格或能力排名。"
      ]
    },
    {
      "id": "experiment",
      "title": "冻结任务、质量门槛与运行条件",
      "paragraphs": [
        "先给每个任务建立输入、初始状态、可观察预期和失败严重度。任务集拆为开发样本与留出的验收样本，避免不断调提示后再用同一批输入宣布提升。两方案共享任务、权限、工具版本、候选代码评估器、最大尝试数和预算；若改变工具或检索策略，那应命名为工作流方案比较，不能仅归因模型。",
        "门槛在看结果前写好：本实验要求六个任务都符合合同，数据丢失零次，未经授权的写入零次。这样的少量样本只够解释案例，没有证明线上风险为零。真实项目需要按任务难度、输入语言与失败代价分层，报告样本量、重复轮次和随机性，而不是给一个平均分隐藏致命失败。",
        "每轮保留模型标识或可得版本、提示版本、工具配置、任务 id、尝试号、实际用量、缓存状态、计时范围、最终状态和审阅结果。无法确定模型版本或服务器排队因素时明确记为未知。不能把一次完成的方案与允许十次重试的方案直接比较，也不能在预算失败后删去这条记录。"
      ]
    },
    {
      "id": "wrong",
      "title": "错误比较：只数成功回答的调用费",
      "paragraphs": [
        "下面两份账本来自同一个人工任务实验。input 和 cachedInput 以实际计量的 token 数表示；cachedInput 是 input 的子集。虚构单位为“实验币/百万 token”，A 为输入 2、缓存输入 0.5、输出 6，B 为输入 4、缓存输入 1、输出 12。toolFee 是外部工具本轮收费，humanMinutes 是审核与修复时间，以每分钟 0.2 实验币换算。它们只是演示参数。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const rates = { A: { input: 2, cached: 0.5, output: 6 },\n  B: { input: 4, cached: 1, output: 12 } };\nconst runs = [\n  { plan: 'A', input: 10000, cachedInput: 0, output: 2000, toolFee: 0.1, humanMinutes: 4 },\n  { plan: 'A', input: 10000, cachedInput: 8000, output: 1500, toolFee: 0.1, humanMinutes: 6 },\n  { plan: 'B', input: 10000, cachedInput: 0, output: 2000, toolFee: 0.1, humanMinutes: 1 }\n];\nfunction tokenCost(run) {\n  const rate = rates[run.plan];\n  return ((run.input - run.cachedInput) * rate.input +\n    run.cachedInput * rate.cached + run.output * rate.output) / 1000000;\n}\nfunction total(plan) {\n  return runs.filter(run => run.plan === plan).reduce((sum, run) =>\n    sum + tokenCost(run) + run.toolFee + run.humanMinutes * 0.2, 0);\n}\nconsole.log(tokenCost(runs[0]).toFixed(3), tokenCost(runs[2]).toFixed(3));\nconsole.log(total('A').toFixed(3), total('B').toFixed(3));",
          "expectedOutput": [
            "0.032 0.064",
            "2.249 0.364"
          ],
          "explanation": [
            "A 第一次为 0.020 输入加 0.012 输出，B 为 0.040 加 0.024；只看这一层 A 较便宜。A 第二次输入费用为 0.004 未缓存加 0.004 缓存，输出 0.009，总模型费 0.049。加两次工具费 0.2 和十分钟人工 2，得到 2.249；B 加一次工具 0.1 与一分钟人工 0.2，得到 0.364。",
            "这不是对任何产品的费用实测。实际工具可能免费，也可能按次数或计算时间收费；人工时间也可能难以可靠计量，应同时报告原始分钟数与费率敏感性。不能把输入全部按缓存费率计算，更不能把第二次调用或失败尝试删除。"
          ]
        }
      ]
    },
    {
      "id": "accounting",
      "title": "任务账本从开始一直记录到交付或终止",
      "paragraphs": [
        "账本需要包含失败和取消后的已发生费用。请求超时但服务器仍在处理时，客户端没有收到答案不代表没有计费；应按供应商最终用量或账单核对。若用量缺失，写未知或估计区间，不把它当零。推理 token、缓存写入、音频或图像等计费项依实际服务合同单独记录，不假设所有 API 都和示例三项一致。",
        "每个任务区分模型费、工具费、人工分钟、等待时间和最终验收结果。总支出除以验收成功任务数可以得到本批次每个成功任务的平均费用，它应把失败任务已消耗费用也计入；成功数为零时指标未定义，不写 0。另保留原始任务成功率，避免一个成功任务掩盖九个失败任务。",
        "任务成本不是唯一目标。涉及私人数据时需要数据处理与权限约束；涉及恢复旧数据时需要确定性的写入和校验。某方案即使账面便宜，只要破坏硬合同就没有进入候选集合。将这些约束放在选择之前，比发现便宜方案不安全后再补权重更清晰。"
      ]
    },
    {
      "id": "latency",
      "title": "首个 token、可用结果与完成时间分别计时",
      "paragraphs": [
        "对代码助手，首个 token 到达只说明模型开始输出，不代表补丁已可用。记录请求发出到首个 token 的 TTFT、到最后输出的生成完成时间，以及到工具检查和人工验收结束的任务完成时间。端到端任务还包括排队、网络、工具等待和重试；不要把工具慢误判成模型生成慢。",
        "冷缓存与暖缓存分组记录，先固定稳定前缀、请求结构和测试方式，再看用量报告是否实际命中缓存。OpenAI 当前文档描述提示缓存可复用匹配前缀的处理；是否命中应以实际响应用量为证据。缓存不是复用旧答案，也不会让输出自然正确；动态用户数据混入稳定前缀可能降低复用机会。模型、长度、保留策略和服务负载仍会影响结果。",
        "下面的 p95 用 nearest-rank 定义：排序后取 ceil(0.95×n) 的第 n 项，代码索引要减一。混在一起会让暖缓存表现掩盖冷启动。数字是人工毫秒观测，不是负载实验。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const samples = [\n  { cache: 'cold', ttft: 600, total: 3200 },\n  { cache: 'cold', ttft: 700, total: 3500 },\n  { cache: 'cold', ttft: 900, total: 5000 },\n  { cache: 'warm', ttft: 150, total: 2100 },\n  { cache: 'warm', ttft: 200, total: 2200 },\n  { cache: 'warm', ttft: 300, total: 2400 }\n];\nfunction p95(values) {\n  if (values.length === 0) return null;\n  const sorted = [...values].sort((a, b) => a - b);\n  return sorted[Math.ceil(0.95 * sorted.length) - 1];\n}\nfor (const cache of ['cold', 'warm']) {\n  const group = samples.filter(sample => sample.cache === cache);\n  console.log(cache, group.length, p95(group.map(s => s.ttft)), p95(group.map(s => s.total)));\n}\nconsole.log(p95([]));",
          "expectedOutput": [
            "cold 3 900 5000",
            "warm 3 300 2400",
            "null"
          ],
          "explanation": [
            "每组只有三个值，ceil(2.85) 是 3，所以这里 p95 恰好取最大值。冷组首个 token 的尾部为 900ms，但完整结果的尾部为 5000ms；首个字很快不能证明结果也很快。",
            "三条样本不足以稳定估计线上 p95。本例只演示定义与分组，真实报告需要更大样本、并发负载、重复轮次和未完成请求的统计规则。超时请求不能从耗时分母消失，应同时报告超时比例及截尾边界。"
          ]
        }
      ]
    },
    {
      "id": "budget",
      "title": "预算与超时需要控制器落实",
      "paragraphs": [
        "约定每任务最多两次尝试、最大支出和截止时间，并在开始下一次尝试之前检查。预估费用只用于决定是否启动，应由实际用量结算；开始后出现比预估更长的输出，仍可能越过预算，因此请求侧输出上限与工具耗费约束也要落实。仅在提示中说“少花钱”不构成硬限制。",
        "下面用同步记录模拟准入与结算。reserved 表示已经为在途工作占用的预计额度，settle 只能消费一次 reservation；预算检查将 used 与 reserved 一起计算，防止两项任务同时以同一余额获得准入。deadline 只是控制器的拒绝条件，不会神奇停止远端服务。任务 id 在本账本生命周期内不复用；真实账本也需要保留已结算身份，以拒绝迟到的重复完成。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function createBudget(limit, deadline) {\n  let used = 0;\n  const reservations = new Map();\n  const settledIds = new Set();\n  return {\n    start(id, estimate, now) {\n      if (!Number.isFinite(estimate) || estimate < 0 || !Number.isFinite(now)) return 'invalid';\n      if (now >= deadline) return 'timeout';\n      if (reservations.has(id) || settledIds.has(id)) return 'duplicate';\n      const reserved = [...reservations.values()].reduce((a, b) => a + b, 0);\n      if (used + reserved + estimate > limit) return 'budget';\n      reservations.set(id, estimate);\n      return 'started';\n    },\n    settle(id, actual) {\n      if (!Number.isFinite(actual) || actual < 0) return 'invalid';\n      if (!reservations.has(id)) return 'unknown';\n      reservations.delete(id);\n      settledIds.add(id);\n      used += actual;\n      return used > limit ? 'over-budget' : 'settled';\n    }\n  };\n}\nconst budget = createBudget(1, 1000);\nconsole.log(budget.start('first', 0.7, 100));\nconsole.log(budget.start('retry', 0.5, 200));\nconsole.log(budget.settle('first', 0.8));\nconsole.log(budget.settle('first', 0.8));\nconsole.log(budget.start('first', 0.1, 300));\nconsole.log(budget.start('retry', 0.3, 500));\nconsole.log(budget.start('late', 0.1, 1000));",
          "expectedOutput": [
            "started",
            "budget",
            "settled",
            "unknown",
            "duplicate",
            "budget",
            "timeout"
          ],
          "explanation": [
            "first 占用 0.7，剩余准入额度 0.3，所以预计 0.5 的 retry 被拒绝。实际费用 0.8 结算后 first 的 reservation 删除；第二次结算找不到该 reservation，不能重复扣款。已结算 id 保留在 settledIds 中，禁止复用同名任务，让迟到结算不会误扣新任务；剩余额度 0.2 拒绝预计 0.3 的尝试；now 等于截止时间也被拒绝。",
            "本例假设限额、截止时间及 id 来自可信配置，只支持一个内存控制器。多进程需要原子共享账本和持久化幂等；进程崩溃留下的 reservation 需要按真实任务状态恢复，不能超时就当免费释放。实际超预估仍要记账并停止新任务，不能修改实际费用让它看起来没超支。"
          ]
        }
      ]
    },
    {
      "id": "verification",
      "title": "在同一门槛内比较，而不是制造永久榜单",
      "paragraphs": [
        "先筛掉硬合同失败的方案，再比较达标方案的任务成功率、实际支出、人工分钟、冷暖 TTFT 与完成时间 p95。若 B 达标且任务费更低，可以在本任务集选择 B；若 A 经过更小上下文与确定性校验后也达标，则重新跑相同留出集，而不是沿用旧成绩。优化提示、删无关材料、并行独立工具请求都应重新验证行为。",
        "审阅报告包含每条任务结果、失败类型、真实用量、缺失字段、费率版本与日期、时间戳定义、缓存证据、超时与重试数。前文的人工账本可以用于检查计算公式，不能标成供应商实测。实际试验需要授权与安全数据，本文没有替读者发起付费请求。",
        "选择是一份有边界的实验结论：适用于哪些任务、哪些工具权限、哪个提示和模型版本、在哪些负载下。版本升级、任务分布或输入长度变化后重测。不能只发布“最快”“最便宜”的顺序；读者需要知道未达标者为何淘汰，以及达标者换来的收益和风险。"
      ]
    },
    {
      "id": "template",
      "title": "把比较条件写成可审阅的实验单",
      "paragraphs": [
        "模板的【任务集】填固定输入和预期，不能只有主题名；【质量门槛】包括不可接受失败；【观测】写清 API 用量和客户端时钟对应的范围；【未知】保留未收到用量或未做真实并发的限制。通用模板不附造出的仓库命令，检查需从实际项目确认。"
      ],
      "code": "目标：【同一可交付任务】\n任务集：【版本、输入、预期、留出样本】\n共同条件：【权限、工具、提示、并发与重试上限】\n质量门槛：【硬失败与一般阈值】\n预算：【总额、单任务上限、截止时间】\n观测：【实际用量、缓存命中、TTFT、完成、人工分钟】\n费用依据：【费率日期、单位、工具费、缺失项】\n审阅：【当前产物检查与严重失败证据】\n决策：【达标方案的取舍与适用范围】\n未知：【未测环境及复测触发条件】"
    },
    {
      "id": "boundaries",
      "title": "哪些边界会让数字失去意义？",
      "paragraphs": [
        "小样本、高度重复前缀和轻负载会低估冷启动与尾部等待；仅报告平均值会隐藏慢请求。批处理可以改变价格和完成时间目标，但不一定适用于等待交互的用户。首个 token 速度适合分析反馈感受，完整代码助手则必须关注可用补丁与验收时间，不用一个指标替代所有体验。",
        "缓存命中必须经过实际观测，费率必须核对当时合同。缓存内容若含私人资料，还需遵守服务数据政策及项目权限；价格降低不改变授权要求。上下文裁剪也可能删去失败条件，应该先确认质量门槛而后计算省下的输入，不用少 token 直接推断更好。",
        "可把模型生成限制在候选说明与改动建议，将字段校验、金额计算、权限和持久化交给确定性模块。这往往减少重试，但仍需真实任务证据。若模型或工具不能在预算内达到硬门槛，应转为人工处理或缩小任务，而不是降低数据保护要求。本文没有独立模型调用练习；作者示例与回忆卡用于推导计量和取舍，不构成任何模型购买建议。"
      ]
    }
  ],
  "sources": [
    {
      "title": "OpenAI：延迟优化",
      "url": "https://developers.openai.com/api/docs/guides/latency-optimization"
    },
    {
      "title": "OpenAI：提示缓存",
      "url": "https://developers.openai.com/api/docs/guides/prompt-caching"
    },
    {
      "title": "OpenAI：评估实践",
      "url": "https://developers.openai.com/api/docs/guides/evaluation-best-practices"
    }
  ]
};
