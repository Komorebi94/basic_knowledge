import type { Article } from "../articles";

export const multiAgentConflictsArticle: Article = {
  "id": "AI17",
  "catalogId": "AI17",
  "kind": "ai",
  "slug": "multi-agent-conflicts",
  "title": "多 Agent 协作与冲突控制",
  "summary": "以清单导入改造为完整案例，推导依赖图、文件所有权、基线冲突与交接验收，判断哪些任务适合并行，以及怎样避免汇总出一个错误系统。",
  "aliases": [
    "multi-agent",
    "多智能体",
    "orchestrator",
    "AI17"
  ],
  "tags": [
    "AI 工程",
    "并行协作",
    "冲突控制"
  ],
  "estimatedMinutes": 24,
  "verifiedAt": "2026-10-09",
  "sections": [
    {
      "id": "problem",
      "title": "三份“已完成”为什么仍不能直接合并？",
      "paragraphs": [
        "购物清单要增加 JSON 导入：格式或任意条目非法时保留旧清单；合法输入整体替换；写入失败可重试。我们准备让 Agent A 做候选校验，B 做持久化，C 做界面。A 说重复 id 应拒绝，B 为简化写入把重复 id 覆盖，C 又以为可以导入合法部分。三个模块各自运行，都不代表整体符合用户要求。",
        "Agent 是在任务上下文里调用工具、观察结果并继续行动的执行者。多 Agent 增加的是可以同时推进的工作轨迹，不会自动增加共同理解。先掌握任务合同、不可变候选与持久化事务，再读本文；示例使用现代 JavaScript 的数组、Map、Set、structuredClone，可在现代浏览器或 Node.js 22 独立执行，无模型调用、文件写入或真实数据库。"
      ]
    },
    {
      "id": "dependency",
      "title": "按依赖图安排并行，先固定共同的输入输出",
      "paragraphs": [
        "先冻结导入合同：候选校验返回成功候选或错误；失败绝不提交；持久化接收已校验的候选并完成整体替换；界面只有看到保存成功才显示完成。为了避免用相同误解验证相同实现，验收者从用户要求独立准备末项非法、重复 id、合法空数组和写入失败样本。",
        "依赖图的箭头表示后一个结果需要前一个稳定产物。合同 → 校验器、持久化；校验器与持久化 → 接入；接入 → 端到端验收。独立读资料、找调用方、设计错误样本可以并行；当存储接口尚未确定时，界面不能凭想象完成集成。下面用完成集合计算可开始任务。它只是调度条件，不会自动启动工具。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const tasks = [\n  { id: 'contract', needs: [] },\n  { id: 'validator', needs: ['contract'] },\n  { id: 'storage', needs: ['contract'] },\n  { id: 'integration', needs: ['validator', 'storage'] },\n  { id: 'acceptance', needs: ['integration'] }\n];\nfunction ready(done) {\n  const completed = new Set(done);\n  return tasks.filter(task => !completed.has(task.id) &&\n    task.needs.every(id => completed.has(id))).map(task => task.id);\n}\nconsole.log(ready([]).join(','));\nconsole.log(ready(['contract']).join(','));\nconsole.log(ready(['contract', 'validator']).join(','));\nconsole.log(ready(['contract', 'validator', 'storage']).join(','));",
          "expectedOutput": [
            "contract",
            "validator,storage",
            "storage",
            "integration"
          ],
          "explanation": [
            "没有前置产物时只能固定 contract；它完成后 validator 与 storage 都满足依赖，因此可同时开始。只有 validator 完成不会让 integration 就绪，storage 仍在关键路径。",
            "“任务已经发出”不能放入 completed。图需要检查未知依赖和循环，真实调度器还要区分运行、失败、取消与阻塞；本例只解释就绪条件，不能证明一个工作流没有循环。"
          ]
        }
      ]
    },
    {
      "id": "ownership",
      "title": "共同可读与共同可写是两种风险",
      "paragraphs": [
        "每个执行者可读取合同和调用方，但写入范围要尽量不重叠：A 拥有校验器与领域测试，B 拥有存储适配与故障测试，C 在接口固定后拥有页面。聚合导出、路由、共享类型、锁文件由整合者写。若 A 发现共同类型不足，提交具体接口建议，不能与 B 同时改同一个共享文件。",
        "共享目录中的并行读取也不是一致性快照：其他执行者可能刚刚写入新版本。需要同一基线时，应读固定提交、文件内容摘要或受控快照，并在交接时注明。独立 worktree 可以隔离本地改动，但合并仍可能有语义冲突；共享目录也能协作，但必须落实文件所有权。Git 没有文本冲突不意味着行为没有冲突。",
        "不要把“可写文件列表”当作权限安全边界。如果工具能修改其他文件，列表只是协作约定；权限仍由宿主限制。尤其禁止执行者为了通过自己的检查而修改公共验收预期，或清理别人正在使用的草稿。外部文档和其他 Agent 的消息同样需要按来源检查，不能授予新的写入权限。"
      ]
    },
    {
      "id": "wrong",
      "title": "错误实现：最后交付的人覆盖先前结果",
      "paragraphs": [
        "两位执行者读取相同 revision 1。A 开启重复拒绝；B 开启原子保存，却携带它在 revision 1 读到的重复拒绝 false。直接用 B 的整个对象替换，会撤回 A 的修复。这个例子模拟整文件覆盖，和真实共享状态丢更新具有相同结构。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "let current = { revision: 1, rejectDuplicates: false, atomicSave: false };\nconst base = structuredClone(current);\nconst patchA = { ...base, rejectDuplicates: true };\nconst patchB = { ...base, atomicSave: true };\ncurrent = { ...patchA, revision: 2 };\ncurrent = { ...patchB, revision: 3 };\nconsole.log(current.rejectDuplicates, current.atomicSave);",
          "expectedOutput": [
            "false true"
          ],
          "explanation": [
            "patchB 的 false 来自旧快照，而不是经过讨论的产品决定；后来写入把 A 的 true 覆盖了。revision 自增也没有帮助，因为保存时没有对比读取基线。",
            "不能只把两个布尔值取 OR 当通用修复。删除、重命名、接口变化无法用 OR 合并；应该拒绝旧基线提交并重新审阅受影响语义。"
          ]
        }
      ]
    },
    {
      "id": "implementation",
      "title": "基线校验先阻止无声覆盖，再讨论如何合并",
      "paragraphs": [
        "交付包应包含工作基线、拥有文件、实际改动、受影响调用方、检查命令及输出、未验证边界。保存时比较 expectedRevision；不匹配时保留当前产物，报告冲突。重读后应判断原改动是否仍有效，再生成新候选，而不是只把 expectedRevision 换成新数字。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "let current = { revision: 1, rejectDuplicates: false, atomicSave: false };\nfunction commit(expectedRevision, candidate) {\n  if (current.revision !== expectedRevision) return 'conflict';\n  current = {\n    revision: current.revision + 1,\n    rejectDuplicates: candidate.rejectDuplicates,\n    atomicSave: candidate.atomicSave\n  };\n  return 'saved';\n}\nconst base = structuredClone(current);\nconsole.log(commit(base.revision, { ...base, rejectDuplicates: true }));\nconsole.log(commit(base.revision, { ...base, atomicSave: true }));\nconsole.log(current.rejectDuplicates, current.atomicSave);\nconst refreshed = structuredClone(current);\n// 审阅发现两项改变互不否定，保留当前规则后增加原子保存。\nconsole.log(commit(refreshed.revision, { ...refreshed, atomicSave: true }));\nconsole.log(current.revision, current.rejectDuplicates, current.atomicSave);",
          "expectedOutput": [
            "saved",
            "conflict",
            "true false",
            "saved",
            "3 true true"
          ],
          "explanation": [
            "A 的基线 1 与当前版本相同，因此保存为版本 2。B 仍提交基线 1，比较失败，current 未改变。重新读取版本 2 并审阅后，B 的候选保留 rejectDuplicates true，最终版本 3 同时保留两个行为。",
            "内存同步函数在调用之间不可被异步步骤打断。真实存储必须把读取版本、比较和写入放在同一事务或服务器条件写入里；先查版本再单独写入仍有竞态。文件协作需要工作树核对或可验证快照，不能假设本函数已经实现 Git 合并。示例候选由受信任代码构造；来自其他执行者或外部消息的候选还需要类型、拥有范围与业务规则校验，基线相同也不能直接相信其内容。"
          ]
        }
      ]
    },
    {
      "id": "handoff",
      "title": "交接要压缩上下文，同时保留可重新核验的证据",
      "paragraphs": [
        "交接摘要最有价值的是让整合者知道去哪里复核：合同版本、改动范围、关键行为、失败样本、实际执行环境、产物基线。写“测试全过”丢掉了检查对象；写“在 revision 2 的候选上执行末项非法样本，结果 old 未变化”才有可追溯含义。命令不能从模板猜，需从真实项目脚本或工具帮助确认。",
        "对于导入案例，A 提供重复 id 与末项非法样本，B 提供真实写入失败注入及旧数据快照，C 提供错误提示和重试交互证据。整合者核对这些证据属于当前合并产物，再运行同一路径。一个月前的日志、另一个分支的通过截图，不能证明当前文件；摘要中的“应该支持”仍然是假设。",
        "建议交接任务模板如下。填写【基线】为可复核的提交、文件摘要或数据 revision；【检查】只列实际存在且已执行的检查，未执行的写明原因；【结果】区分观察与推断。发现共享接口需要改时按停止条件反馈，不假装任务已完整完成。"
      ],
      "code": "目标：【可观察行为】\n共同合同：【版本与不可违反条件】\n基线：【提交或文件摘要】\n可写范围：【拥有文件】\n依赖：【需要等待的产物】\n交付：【改动、调用方、失败样本】\n检查：【实际命令、环境、结果、产物版本】\n停止条件：【接口冲突、权限不足或缺失需求】\n未覆盖：【明确边界】"
    },
    {
      "id": "verification",
      "title": "合并后的审阅负责证明整体行为",
      "paragraphs": [
        "先检查改动有没有越出所有权范围，再核对每条共同合同是否只由一个领域入口执行。导入不能在 UI 和存储层各有一份不同校验。审阅时寻找数据从候选到提交的唯一通路，确认失败时没有提前写入、重试没有复用旧候选、成功通知没有早于持久化完成。",
        "随后用独立样本验收整个系统：合法两项整体替换；末项非法与重复 id 保留旧数据；合法空数组执行明确清空；保存失败不显示成功；恢复后重试完成一次写入。模块测试只能证明模块在自己的输入假设下正确，无法替代真实组合检查。交接证据能指导检查，但不能取代检查。",
        "若发现 C 按部分成功渲染，优先回到合同修复接法，不调整验收让现有输出通过。错误应记录“哪条合同破坏、由什么触发、实际结果、修复后证据”。多个 Agent 同意一个结论也不是独立证据：它们可能共享了同一摘要和错误假设。"
      ]
    },
    {
      "id": "boundaries",
      "title": "什么时候应该减少并行？",
      "paragraphs": [
        "本文给出的所有权与条件提交是作者为案例设计的工程建议。Anthropic 的多 Agent 研究系统报告说明协调与额外 token 开销值得评估；那是特定研究工作流的经验，不能把其收益数字移植成编码任务的保证。我们应在自己的同一任务集上比较结果、用时和成本。",
        "并行分支的耗时由最慢分支决定，还要加合同准备、交接、整合和复核。两项各五分钟的独立任务可能受益；一个三分钟修复加十分钟交接会更慢。不要为减少等待而在接口尚未稳定时复制假接口。共享状态多、依赖链长、需要反复同步完整上下文的任务，通常适合串行确定关键决策，再局部并行。",
        "两个额外边界需要单独处理。外部副作用如发布、发信、付款不能靠文件所有权隔离，应有独立授权与幂等机制；跨工作树的数据库和远端环境仍可能共享，需要隔离测试资源。取消某个执行者也不保证它已经停止写入，必须确认生命周期与迟到产物如何处理。",
        "完成后回看开销：重复读取多少、共享接口返工多少、实际省了多少墙钟时间、错误是否更容易被发现。如果串行完成同一任务更便宜且同样达到质量门槛，保留一个执行者。本文不新增独立编码练习，三个作者示例用于理解依赖与冲突；可用章节回忆卡检验能否推导新的协作情境。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Anthropic：多 Agent 研究系统的工程经验",
      "url": "https://www.anthropic.com/engineering/multi-agent-research-system"
    }
  ]
};
