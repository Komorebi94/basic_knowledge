import type { Article } from "../articles";

export const designAndTaskSplittingArticle: Article = {
  "id": "AI05",
  "catalogId": "AI05",
  "kind": "ai",
  "slug": "design-and-task-splitting",
  "title": "先设计、再拆分、再实现",
  "summary": "从购物清单导入功能推导行为合同与任务边界，练习按可验证结果拆分工作，避免把文件数量误当成独立任务。",
  "aliases": [
    "design-and-task-splitting",
    "AI05"
  ],
  "tags": [
    "AI 工程",
    "先设计"
  ],
  "estimatedMinutes": 20,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "导入功能为什么不能只拆成“按钮”和“解析器”？",
      "paragraphs": [
        "我们要给购物清单添加 JSON 导入。要求合法文件整体替换清单，任何一项非法都保留原数据，用户能看到原因并重新选择文件。如果把按钮与解析器分别交给两次任务，却没有先约定失败语义，一方可能认为解析成功就替换，另一方可能认为部分合法也算成功。",
        "需要先理解数组、JSON.parse 和状态更新。本文的 JavaScript 示例可在现代浏览器独立执行，仅用字符串模拟文件内容；读取文件大小、编码和 UI 状态需要真实项目另行实现。这里先把最关键的事务边界讲清楚。"
      ]
    },
    {
      "id": "design",
      "title": "先把不可违反的条件写成行为合同",
      "paragraphs": [
        "合同规定导入是全有或全无：解析失败、结构不符或任意条目非法时，不写当前清单。合法清单需要 id 唯一、标题非空，允许空数组作为明确的清空动作。重复 id 不能靠后一个覆盖前一个，因为那会无声丢失数据。",
        "沿数据流设计三个阶段：把输入转换为候选数据，完整校验候选，最后一次替换。UI 只负责收集文件、显示处理状态与恢复入口，不重复条目校验规则。领域模块负责数据合同，持久化层负责一次写入的失败处理。这样的边界来自状态所有权，而不是一个文件看起来太长。",
        "列出保留行为：原有手动新增、编辑与删除不变，失败后原清单仍可操作，重试不复用上次失败候选。设计没有要求新的导入历史、多版本回滚或云同步，因此先不添加这些能力。范围越明确，后续可以用同一份合同检查任务是否扩大。"
      ]
    },
    {
      "id": "wrong",
      "title": "错误实现：一边校验一边写入",
      "paragraphs": [
        "下面遇到非法条目才返回，但第一个合法条目已经写进 current。它看似处理了错误，实际破坏了全有或全无。"
      ],
      "examples": [
        {
          "code": "let current = ['old'];\nfunction unsafeImport(items) {\n  current = [];\n  for (const item of items) {\n    if (typeof item !== 'string') return 'invalid';\n    current.push(item);\n  }\n  return 'ok';\n}\nconsole.log(unsafeImport(['new', 42]));\nconsole.log(current.join(','));",
          "expectedOutput": [
            "invalid",
            "new"
          ],
          "explanation": [
            "函数进入时先清空旧数据，再写入 new，第二项失败无法恢复 old。返回 invalid 只是错误报告，没有撤销前面的副作用。",
            "不能仅在 UI 层增加提示修复它；要把校验与提交拆开，让任何校验失败都发生在写入之前。"
          ]
        }
      ]
    },
    {
      "id": "implementation",
      "title": "最小工作单元要有独立验收结果",
      "paragraphs": [
        "第一单元交付候选校验器及合法、非法、重复 id 用例；第二单元接入一次替换并验证写入失败不丢原数据；第三单元接 UI 的成功、空、错误与重试。它们存在依赖，不能在接口未稳定前完全独立开展。能够并行的是不写同一文件的资料整理或基于已固定合同设计用例。"
      ],
      "examples": [
        {
          "code": "let current = [{ id: 'old', title: '原清单' }];\nfunction importList(text) {\n  let candidate;\n  try { candidate = JSON.parse(text); } catch { return 'parse-error'; }\n  if (!Array.isArray(candidate)) return 'invalid';\n  const seen = new Set();\n  for (const item of candidate) {\n    if (!item || typeof item.id !== 'string' || item.id.length === 0 ||\n        typeof item.title !== 'string' || item.title.trim().length === 0 || seen.has(item.id)) {\n      return 'invalid';\n    }\n    seen.add(item.id);\n  }\n  current = candidate.map(item => ({ id: item.id, title: item.title }));\n  return 'ok';\n}\nconsole.log(importList(JSON.stringify([{id: 'x', title: '新项'}, {id: 'x', title: '重复'}])));\nconsole.log(current[0].id);\nconsole.log(importList('[]'), current.length);",
          "expectedOutput": [
            "invalid",
            "old",
            "ok 0"
          ],
          "explanation": [
            "候选先解析到局部变量，循环只维护局部 seen；重复 id 导致返回时 current 仍是 old。合法空数组完成校验，才替换为长度零的清单。",
            "示例只投影 id 与 title，避免把未知字段直接持久化。它没有本地存储事务，真实项目需要先核对既有写入接口的原子性与错误行为。"
          ]
        }
      ]
    },
    {
      "id": "handoff",
      "title": "给每个任务交付输入、输出与停止条件",
      "paragraphs": [
        "交给 AI 的工作单至少写明当前合同、拥有文件、依赖接口、可观察产物和停止条件。校验器任务不能顺手改页面状态；UI 任务不能在提交阶段重新定义重复 id 规则。若发现合同不足，先把问题反馈到设计，再调整受影响单元。",
        "任务过大时，读者难以知道失败发生在哪一层；任务过小时，很多工作只产生内部辅助函数，尚无独立可检验的行为。以“合法候选不会部分写入”作为单元，比“新增三个函数”更容易验收，也不强迫某种代码结构。",
        "在每次合并产物前重新跑端到端边界：非法 JSON、合法但错误结构、末项非法、重复 id、空数组、存储失败和重试。单元测试各自通过，并不证明接口接法一致。尤其不能用 UI 的模拟返回代替真实校验器，让两边共享的误解一直被隐藏。"
      ]
    },
    {
      "id": "ownership",
      "title": "拆分前先确定谁拥有当前状态",
      "paragraphs": [
        "导入候选是局部数据，当前清单是领域状态，持久化记录是外部副作用。把这三种状态画在同一条数据流上，可以确定哪些步骤能自由重试：候选校验通常可重试，提交需要保证一次性，存储失败需要按已有合同恢复。任务边界应围绕这些性质，而不是按屏幕上的按钮位置切割。",
        "如果 UI 为了展示预览而提前替换当前清单，事务边界已经被破坏，即使最后提交函数是纯函数也不能补救。预览应读取候选，不改变正式数据；用户确认或合同规定的自动提交才触发替换。显示状态和业务提交必须共享明确的阶段语义。",
        "同一数据可能被其他页面引用，替换时需要保留既有通知和缓存失效机制。不要在导入组件直接写本地存储绕过领域入口。这种捷径会让页面看起来成功，而订阅者仍看到旧数据，下一次保存又覆盖导入结果。先查已有所有权再接入。"
      ]
    },
    {
      "id": "failure-design",
      "title": "失败恢复要在拆分时设计",
      "paragraphs": [
        "从用户角度分别描述解析失败、校验失败与提交失败。解析失败说明文件格式不能读取；校验失败说明具体条目不符合合同；提交失败说明候选合法但未成功保存。都应保留旧清单，但恢复动作不同，不能统一显示“导入失败”后让用户反复选择同一文件。",
        "错误位置可以用条目索引与字段名表达，避免把整个导入文件记录进日志。重复 id 是整体冲突，应该指出冲突而不是只删除后出现项。若后来产品要求部分导入，那是新的行为合同，需要重新设计结果报告和统计，不能暗中改变本例全有或全无。",
        "任务交接时带上这些失败样本，让实现者与验收者都以相同合同讨论。完成一个阶段后产物应该可运行或可审阅，不用空函数和虚假返回占位。暂未接存储时明确说明边界，再继续完成下一阶段，避免把演示成功当完整交付。"
      ]
    },
    {
      "id": "boundaries",
      "title": "拆分什么时候会增加成本？",
      "paragraphs": [
        "一个只有几行的确定性修复，过多阶段会制造重复说明与交接；涉及持久化和失败恢复的导入，先设计边界可以减少数据丢失风险。取舍要看契约复杂度、共享状态和可验证性，不能因为并行工具可用就强行并行。",
        "两个边界需要额外设计：大文件解析可能阻塞界面，要约定大小与执行环境；持久化失败可能在候选校验后发生，要保留原数据或采用受支持的原子写入。本文的内存赋值没有证明浏览器存储的事务特性。",
        "验收交付不仅列完成文件，还应报告合同落实位置、各单元实际检查和整体恢复行为。这样当后续增加 schema 版本时，可以知道要改的是输入转换与校验合同，而不是在所有按钮处理器里复制一份迁移逻辑。"
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
