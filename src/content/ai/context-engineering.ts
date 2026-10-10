import type { Article } from "../articles";

export const contextEngineeringArticle: Article = {
  "id": "AI03",
  "catalogId": "AI03",
  "kind": "ai",
  "slug": "context-engineering",
  "title": "上下文工程与资料组织",
  "summary": "以修复订单取消流程为例，追踪必要资料、来源版本和摘要损失，建立能回到原始代码核验的最小上下文包。",
  "aliases": [
    "context-engineering",
    "AI03"
  ],
  "tags": [
    "AI 工程",
    "上下文工程与资料组织"
  ],
  "estimatedMinutes": 20,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "取消订单为什么需要先整理上下文？",
      "paragraphs": [
        "用户说“取消后还会显示成功”。AI 如果只看到按钮组件，很容易添加一个局部 canceled 标记，但真正写入结果的地方可能在共享请求层。本文的目标是给这次调查整理最小上下文包：能解释触发、状态写入与保留行为，同时不夹带无关目录和真实用户数据。",
        "前置知识是函数调用关系、异步请求与版本控制。示例用普通 JavaScript 数组表示资料条目，在现代浏览器独立运行。它演示资料选择与约束核验，不读取实际仓库；文中的虚拟路径只作为例子，迁移到项目时必须搜索确认。"
      ]
    },
    {
      "id": "mechanism",
      "title": "上下文包是证据的索引，而不是整个仓库的复制",
      "paragraphs": [
        "从取消按钮顺着调用链找到取消动作，再逆着结果显示找到状态写入者。两条路径相交的地方通常是重点。随后补齐接口合同、取消后页面预期和已有回归用例：没有业务合同，工具无法判断取消后保留旧数据还是清空；没有调用方，它无法判断修改共享函数会影响哪些页面。",
        "上下文应分为事实、约束和待验证假设。事实有来源及版本；约束来自用户和仓库合同；假设用于指导搜索，例如“可能是旧请求 finally 清除了 loading”。不要把这种推测压缩成“已确认 finally 有 bug”，摘要越短越容易丢掉证据等级。",
        "阅读全部文件并不天然优于有目标的检索。无关材料会提高维护与复核成本，也可能把旧设计当成当前事实。这里建议保留小而完整的材料集合：复现步骤、关键入口、领域合同、受影响调用方、相关检查。信息不足时回到原始材料补读，比重复扩大整包更容易发现缺口。"
      ]
    },
    {
      "id": "wrong",
      "title": "错误实现：只按文件名选资料",
      "paragraphs": [
        "名字包含 cancel 的文件不一定包含写入流程，名字不包含 cancel 的 store 却可能负责最终状态。下面故意只按关键词筛选，输出遗漏写入资料。"
      ],
      "examples": [
        {
          "code": "const documents = [\n  { path: 'cancel-button.js', roles: ['trigger'] },\n  { path: 'order-store.js', roles: ['write', 'contract'] },\n  { path: 'cancel-old-design.md', roles: ['obsolete'] }\n];\nconst picked = documents.filter(doc => doc.path.includes('cancel'));\nconsole.log(picked.map(doc => doc.path).join(','));\nconsole.log(picked.some(doc => doc.roles.includes('write')));",
          "expectedOutput": [
            "cancel-button.js,cancel-old-design.md",
            "false"
          ],
          "explanation": [
            "关键词筛选抓到触发与过时设计，却遗漏写入角色。false 指向资料覆盖缺口，不代表筛到的文件毫无价值。",
            "检索关键词适合找到入口，不能独立证明上下文完整。对真实仓库，要继续读引用与调用方，并核对设计是否仍有效。"
          ]
        }
      ]
    },
    {
      "id": "selection",
      "title": "从问题角色反推必需材料",
      "paragraphs": [
        "修复取消流程需要 trigger、write 和 contract 三个角色。用显式覆盖检查提醒遗漏，再由人核对每条来源是否支持它声称的角色。角色标签是作者添加的索引，不是自动理解代码的证明。下面用 revision 标识同一资料版本，便于后续检查摘要何时失效。"
      ],
      "examples": [
        {
          "code": "const docs = [\n  { path: 'button.js', revision: 'r7', roles: ['trigger'] },\n  { path: 'store.js', revision: 'r7', roles: ['write'] },\n  { path: 'contract.md', revision: 'r7', roles: ['contract'] }\n];\nfunction missingRoles(records, required) {\n  return required.filter(role => !records.some(doc => doc.roles.includes(role)));\n}\nconsole.log(missingRoles(docs, ['trigger', 'write', 'contract']).length);\nconsole.log(missingRoles(docs.slice(0, 1), ['trigger', 'write', 'contract']).join(','));",
          "expectedOutput": [
            "0",
            "write,contract"
          ],
          "explanation": [
            "完整材料各自覆盖一个角色，因此缺口长度为零。只留按钮时，检查明确指出 write 与 contract，帮助决定下一步读什么。",
            "零缺口只说明标签齐全，还要核验正文。一个已删除的路径或者错误 revision 都能让标签检查通过；这属于来源验证而非角色覆盖。"
          ]
        }
      ]
    },
    {
      "id": "summary",
      "title": "压缩资料时保留什么？",
      "paragraphs": [
        "取消合同里有一句关键话：“取消后保留已展示结果，但当前请求不得再写入。”压缩成“取消就清空”会直接改变行为。摘要至少保留目标、不变量、例外、来源和待核实点；代码细节可缩短，但行为否定词、单位、失败条件和生命周期不能随意删掉。",
        "将摘要交给另一轮任务时，附上原始位置与基线版本。要求它在准备修改对应代码前重读该位置。摘要负责定位，原文负责确认；这样能够减少重复阅读，又避免把历史摘要升级为永久真相。资料发生变化后，标记摘要待复核，而不是仅更新时间字段。",
        "可以按问题逐层供给材料。第一层是复现和合同，第二层是已找到的关键入口，第三层是调查过程中需要的实现细节。若 AI 提出“服务端取消也要改”，先查当前接口是否支持，再判断它是否属于授权范围。上下文组织不能代替需求决策。"
      ]
    },
    {
      "id": "freshness",
      "title": "来源新鲜度怎样影响取消诊断",
      "paragraphs": [
        "假设仓库合同注明取消后保留结果，远端文档却说取消要清空。不要按文档日期简单选择较新的一份：先确认它是否对应同一产品、接口版本和部署环境，再按项目已约定的优先级处理。来源时间用于发现冲突，不负责替代产品决策。把冲突写出来比悄悄合并更可靠。",
        "对代码记录当前提交或明确基线，对动态接口记录核验日期及环境。摘要里“请求支持取消”要指向具体适配器或官方说明，不能只引用一年前的通用设计。调查过程中若发现实现与合同不一致，分别标记当前行为和目标行为，不要把当前缺陷重新写成产品要求。",
        "资料索引还应写出没有读取的边界。例如移动端调用方尚未核对、服务端幂等语义未确认、缓存订阅未找到。这样的缺口能指导下一步搜索，也让接手者避免误把小上下文包当作全仓审计结论。最小上下文强调与问题相关，不意味着隐藏未知。"
      ]
    },
    {
      "id": "transfer",
      "title": "上下文交接要保留因果关系",
      "paragraphs": [
        "接手者需要知道某份资料为何被选中。仅列三个路径无法表达它们之间的关系；补一句“按钮调用 store.start，store 的完成函数写状态，取消合同限制写入身份”，就能提供检索路线。关系必须由已读代码支持，未知调用不能画成已经存在的事实。",
        "中断任务后恢复时先检查工作区差异，判断入口和合同是否改变。旧摘要可以继续作为索引，但不能跳过版本核对；否则另一轮刚修的 finally 又可能被按旧结构重写。对已验证结论保留证据，对未完成实验保留下一步，这比仅写“正在排查”有用。",
        "一个好的资料包可以让不同实现方案竞争：序号守卫、生命周期 token 或既有任务对象，只要保留取消合同都可以。把上下文写成“必须用某 API”会提前锁死方案。先交付真实约束与证据，让实现选择由目标项目的结构决定。"
      ]
    },
    {
      "id": "verification",
      "title": "如何验收上下文包和它的边界",
      "paragraphs": [
        "验收资料包不是检查字数，而是让读者独立回答：谁发起请求，谁写结果，取消怎样使身份失效，当前失败如何显示，哪些行为必须保留。每个回答要能返回到原始材料；无法定位的结论移到假设区并继续调查。",
        "两个边界是动态事实与敏感资料。远端接口文档可能比仓库新，也可能属于另一环境，需要注明范围；生产日志能帮助定位，却必须脱敏并减少字段。把整个环境文件当上下文复制，会引入与诊断无关的秘密。",
        "交付可包含“已确认入口、来源版本、未覆盖调用方、下一步检索问题”。最终改动后还要复核包里的事实是否仍正确。例如 store 拆分后旧索引必须更新。上下文工程的收益在于帮助后续工作保留可追溯依据，并不承诺一次摘要足以支持无限期开发。"
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
