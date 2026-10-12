import type { Article } from "../articles";

export const workflowUpgradeEvaluationArticle: Article = {
  "id": "AI20",
  "catalogId": "AI20",
  "kind": "ai",
  "slug": "workflow-upgrade-evaluation",
  "title": "模型升级后重新评估工作流",
  "summary": "以订单助手升级为例固定环境、对照任务与硬边界，逐条评估旧指令是否仍有收益，避免升级后凭印象删规则或宣称效果提升。",
  "aliases": [
    "workflow-upgrade-evaluation",
    "AI20"
  ],
  "tags": [
    "AI 工程",
    "模型升级后重新评估工作流"
  ],
  "estimatedMinutes": 20,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "换了模型以后，旧流程要全部保留吗？",
      "paragraphs": [
        "订单助手原来有一段长指令，反复提醒不要猜金额、不要越权、先读取合同。升级模型后，有人认为这些都可删除，也有人认为必须原样保留。本文目标是通过同任务对照评估决定哪些说明可以简化，同时保留宿主权限、数据合同与失败保护。",
        "前置知识是任务评估与版本配置。所有示例使用人为构造结果，在现代浏览器执行，不调用任何模型，不指定最新型号或价格，也不声称真实升级效果。读者应把同样方法应用到实际账户可用版本与官方迁移资料。"
      ]
    },
    {
      "id": "baseline",
      "title": "先固定可比较条件，再改变配置",
      "paragraphs": [
        "记录旧模型标识、提示词、工具列表、宿主权限、数据版本、评判规则和实际样本。升级时尽量先只换模型，不同时重写工具和提示词；这样差异才有较明确来源。必要配置差异需要单独注明，不能隐瞒新版本输入范围变小或样本更简单。",
        "对照至少保留正常任务、缺资料、格式错误、权限拒绝、注入和恢复。多次运行观察波动，比较分组成功、硬违规、延迟与实际成本。缺少计费数据只报告调用量或观测时长，不根据网上印象推算出精确费用。",
        "官方升级指导可以告诉你接口和提示方式变化，不能替你证明业务任务更好。查到功能可用也不代表当前环境已配置好；先验证账户和运行方式，再执行对照。本文讨论评估设计，没有提供某个具体模型迁移命令。"
      ]
    },
    {
      "id": "wrong",
      "title": "错误决定：只比较总分就删权限规则",
      "paragraphs": [
        "假设旧配置八成成功且零越权，新配置九成成功但有越权。如果只看分数，升级会被接受；而订单助手的硬边界已经失守。下面以人工数据演示。"
      ],
      "examples": [
        {
          "code": "const oldResult = { success: 0.8, violations: 0 };\nconst newResult = { success: 0.9, violations: 1 };\nconsole.log(newResult.success > oldResult.success);\nconsole.log(newResult.violations === 0);",
          "expectedOutput": [
            "true",
            "false"
          ],
          "explanation": [
            "普通成功率提升为 true，硬边界有效为 false。两者并不矛盾，说明总体数字无法独立决定升级。",
            "这些数字不是任何模型实测。真正升级结论要由运行记录支持，而且样本有限时也应报告不确定性。"
          ]
        }
      ]
    },
    {
      "id": "experiment",
      "title": "逐条删减指令，而不是整包重写",
      "paragraphs": [
        "先保留全部流程换模型，确认无硬性回归，再一次只删一组重复说明，跑同一评估集。若质量保持、指令更短并降低观测成本，可形成候选简化；若某类失败增加，恢复那组说明并查原因。宿主身份、授权和输入校验不属于可凭语言质量删除的提示技巧。"
      ],
      "examples": [
        {
          "code": "function decide(baseline, candidate) {\n  if (candidate.runs === 0) return 'insufficient';\n  if (candidate.violations > 0) return 'reject';\n  if (candidate.success < baseline.success) return 'review-regression';\n  return candidate.promptChars < baseline.promptChars ? 'simplify-candidate' : 'keep-evaluating';\n}\nconst baseline = { success: 0.9, promptChars: 2000 };\nconsole.log(decide(baseline, { runs: 10, violations: 0, success: 0.9, promptChars: 1200 }));\nconsole.log(decide(baseline, { runs: 10, violations: 1, success: 1, promptChars: 1200 }));\nconsole.log(decide(baseline, { runs: 0, violations: 0, success: 1, promptChars: 1200 }));",
          "expectedOutput": [
            "simplify-candidate",
            "reject",
            "insufficient"
          ],
          "explanation": [
            "第一组维持成功且缩短说明，得到候选；第二组即使成功率字段是 1，存在违规也拒绝；无运行组不能视为成功。",
            "函数只是演示决策分层，没有置信区间或最小样本约束。真实决策还要检查各类别、人工质量与线上风险，不能靠这三个字段直接发布。"
          ]
        }
      ]
    },
    {
      "id": "change-record",
      "title": "升级记录应该能解释为什么保留或删除",
      "paragraphs": [
        "给每组指令编号，写原目的、保留或删除原因、对照样本和失败轨迹。例如重复提醒读合同可以压缩为一条可检验步骤，但“不得上传客户资料”的业务限制不能因为模型更会遵循而从授权层移除。任务说明与硬边界各自有不同维护理由。",
        "上线前保留可切回配置，明确回滚触发：权限违规、关键类别下降、结构结果不可用或资源超出预算。回滚模型时检查工具参数与会话格式兼容，避免新流程产生的记录旧版本无法读取。配置变更也属于工程变更，需要版本与证据。",
        "还应删除已经失效的工具事实，如旧 API 字段或不存在的命令；这些是核实后的文档修正，不需要先证明模型能适应错误信息。对纯粹风格性提示可人工判断，但不能把审美偏好包装成通用性能提升。"
      ]
    },
    {
      "id": "ablation",
      "title": "删除一组指令时怎样解释结果",
      "paragraphs": [
        "假设重复的“三次检查输入”说明被合成一句，而输入校验仍由宿主执行。对照结果维持，只能支持当前样本下这段重复说明可减，不能推导“输入校验不需要”。记录被删文本原本负责提醒还是执行边界，避免把语言简化误传成安全机制移除。",
        "若删掉读合同步骤后正常题仍过，缺资料题却开始杜撰，说明总分掩盖了类别差异。恢复该步骤，再调查是否可通过更小的上下文索引降低成本。评估目的不是证明删减一定成功，而是找到哪种改动在目标任务里有收益。",
        "比较运行需要明确中断与失败也算结果。新模型某次工具拒绝后卡住，不能从统计中删除这次运行；超时和资源上限属于工作流质量。将失败列入同一张表，才不会因只看完成任务而高估候选版本。",
        "下面用删掉“读取合同”提醒前后的人工结果演示这个区分。样本可在现代浏览器控制台运行，不调用模型。正常题前后都通过；缺资料题从按合同停止变成杜撰。分组记录能指出该恢复哪一条提醒，整体通过率只说明成功条数变了。"
      ],
      "examples": [
        {
          "code": "function line(runs, category) {\n  const group = runs.filter(run => run.category === category);\n  const passed = group.filter(run => run.passed).length;\n  const fabricated = group.filter(run => run.fabricated).length;\n  return category + ':' + passed + '/' + group.length + ':fabricated:' + fabricated;\n}\nfunction removalEffect(step, before, after) {\n  const categories = [];\n  for (const run of before) if (!categories.includes(run.category)) categories.push(run.category);\n  const regressions = [];\n  for (const category of categories) {\n    const oldFabricated = before.filter(run => run.category === category && run.fabricated).length;\n    const nextFabricated = after.filter(run => run.category === category && run.fabricated).length;\n    if (nextFabricated > oldFabricated) regressions.push(category);\n  }\n  const oldRate = before.filter(run => run.passed).length / before.length;\n  const newRate = after.filter(run => run.passed).length / after.length;\n  return {\n    oldRate: oldRate.toFixed(2),\n    newRate: newRate.toFixed(2),\n    decision: regressions.length ? 'restore:' + step + ':' + regressions.join(',') : 'candidate'\n  };\n}\nconst before = [\n  { category: 'normal', passed: true, fabricated: false },\n  { category: 'missing-policy', passed: true, fabricated: false }\n];\nconst after = [\n  { category: 'normal', passed: true, fabricated: false },\n  { category: 'missing-policy', passed: false, fabricated: true }\n];\nconst effect = removalEffect('read-contract', before, after);\nconsole.log(line(before, 'normal') + ' -> ' + line(after, 'normal'));\nconsole.log(line(before, 'missing-policy') + ' -> ' + line(after, 'missing-policy'));\nconsole.log(effect.oldRate);\nconsole.log(effect.newRate);\nconsole.log(effect.decision);\nconsole.log(removalEffect('read-contract', before, before).decision);",
          "expectedOutput": [
            "normal:1/1:fabricated:0 -> normal:1/1:fabricated:0",
            "missing-policy:1/1:fabricated:0 -> missing-policy:0/1:fabricated:1",
            "1.00",
            "0.50",
            "restore:read-contract:missing-policy",
            "candidate"
          ],
          "explanation": [
            "before 的两类各有一条通过且 fabricated 为 false。after 只改了缺资料题：passed 变为 false，fabricated 变为 true。正常题的 1/1 与 fabricated:0 没有变化，所以回归被定位到 missing-policy。",
            "removalEffect 先按 before 里类别首次出现的顺序收集类别，再比较每类 fabricated 计数。缺资料题从 0 增到 1，因此 decision 是 restore:read-contract:missing-policy。整体通过率从 1.00 降到 0.50，但决策依据是新增杜撰的类别，不是这个平均数字本身。",
            "把 after 换成 before 时，没有任何类别的 fabricated 增加，函数返回 candidate。这只表示这组人工记录里没观察到新的杜撰，不表示提醒已经可以删除，也不测量宿主校验是否仍在执行。",
            "数字是作者构造的对照结果。真实升级还要保留运行次数、失败轨迹和未覆盖类别；某次工具拒绝若被从样本中删掉，这张表就会少一条回归。"
          ]
        }
      ]
    },
    {
      "id": "operations",
      "title": "工作流升级需要持续的变更纪律",
      "paragraphs": [
        "保留可追溯配置快照，把模型、提示、工具 schema 与权限策略分别版本化。回滚时明确只切模型还是连同提示一起切，确保字段与工具行为兼容。不要让线上参数依赖一份无法查到历史的临时对话，出问题后很难复现。",
        "新版本可能改变语言习惯而非事实质量。人工评分区分风格偏好和业务合同，必要时更新展示文案标准，却不修改事实与权限门槛。若结构化结果字段发生变化，应按官方资料更新适配并用旧样本回归，而不是让页面临时猜字段。",
        "升级后的监测样本可以逐步补充真实失败，但先脱敏且保留输入来源。把发现回写评估集并按版本比较，不公开永久排行榜。某配置在当前任务适合的证据，应保持任务、时间和环境范围，避免被推广成所有场景的长期结论。"
      ]
    },
    {
      "id": "acceptance",
      "title": "升级成功的结论要限定在哪里？",
      "paragraphs": [
        "两个边界是评估过拟合与环境变化。反复用同十题调提示会让它对这组样本更熟，却未必提高新任务质量；工具服务或数据环境变化也会影响结果，需要将配置与时间记录在证据里。",
        "最终报告说明比较了哪些任务、运行次数、失败类别和观测指标，明确哪些规则删减、哪些边界保留。不能写“新模型更强，所以不用审阅”；更准确的是“在这组固定任务下候选配置达到门槛，某些重复说明可减少，权限和独立验收继续执行”。",
        "重新评估工作流的价值不是永远增加提示，也不是永远简化。它把每条流程与要解决的失败连接起来：有收益的保留，过时的更新，重复且无收益的删除，无法由模型承担的边界继续落实在宿主与环境中。"
      ]
    }
  ],
  "sources": [
    {
      "title": "OpenAI：评估实践",
      "url": "https://developers.openai.com/api/docs/guides/evaluation-best-practices"
    }
  ]
};
