import type { Article } from "../articles";

export const mcpSkillsInstructionsArticle: Article = {
  "id": "AI12",
  "catalogId": "AI12",
  "kind": "ai",
  "slug": "mcp-skills-instructions",
  "title": "MCP、Skills 与项目指令",
  "summary": "用资料检索与审阅工作流区分协议连接、可复用流程和仓库规则，验证工具参数与流程步骤，避免把能力接入误当成权限授权。",
  "aliases": [
    "mcp-skills-instructions",
    "AI12"
  ],
  "tags": [
    "AI 工程",
    "MCP"
  ],
  "estimatedMinutes": 20,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "想复用一次审阅流程，该写在哪里？",
      "paragraphs": [
        "我们有一个重复需求：读取订单合同、获取变更、审阅权限边界并输出发现。资料来自外部文档库，流程多次复用，仓库又要求不修改支付接口。把全部内容写进一个提示词会混合连接配置、工作步骤和项目约束，维护时容易改错层。",
        "前置知识是工具调用与数据校验。本文先按职责分层，再用本地函数模拟只读文档工具及流程检查。示例可在现代浏览器执行，不创建 MCP 服务，也不证明任何具体客户端已连接。"
      ]
    },
    {
      "id": "layers",
      "title": "三种能力解决三个不同问题",
      "paragraphs": [
        "MCP 是连接工具、资源等能力的协议。本文核对 2025-06-18 的 Tools 规范：工具有输入 schema，可返回内容及结构化数据；客户端应校验结果并关注权限。协议把可调用能力描述清楚，但不会替用户决定这次任务是否允许读取私人文档。",
        "Skill 是可复用的任务流程与参考材料。在核对的 OpenAI 官方资料里，技能以 SKILL.md 组织说明，可包含脚本与参考文件，工具按需要读取。文章使用这个概念讲流程复用，不承诺任意客户端都以相同路径发现技能。安装位置、触发与更新行为应查所用产品的官方文档。",
        "项目指令保存仓库共同约束，例如哪些合同优先、接口兼容要求和真实验证命令。它不应重复保存外部连接凭据，也不应把每次任务的临时观察写成永久规则。任务本身再补具体目标、允许范围和验收，让三层职责保持清晰。"
      ]
    },
    {
      "id": "wrong",
      "title": "错误实现：把工具可见当成任务已授权",
      "paragraphs": [
        "本地模拟工具提供 readDoc 与 deleteDoc。错误宿主只查名称存在，就允许删除。用户只要求审阅，没有授权删除，但注册表无法表达这个差别。"
      ],
      "examples": [
        {
          "code": "const tools = {\n  readDoc: id => 'document:' + id,\n  deleteDoc: id => 'deleted:' + id\n};\nconst request = { name: 'deleteDoc', id: 'orders' };\nfunction unsafeDispatch(action) { return tools[action.name](action.id); }\nconsole.log(unsafeDispatch(request));",
          "expectedOutput": [
            "deleted:orders"
          ],
          "explanation": [
            "工具注册说明能力存在，错误分发器因此调用 deleteDoc。这里仅返回字符串，不执行删除，暴露的是授权缺口。",
            "MCP 接入与 Skill 步骤不能自动扩大用户任务。即使某流程写了“清理旧文档”，仍要按本次授权判断具体写入是否允许。"
          ]
        }
      ]
    },
    {
      "id": "boundary",
      "title": "连接能力后仍要有任务允许集合",
      "paragraphs": [
        "正确模拟分发器只开放 readDoc，并验证编号，未允许操作直接拒绝。工具结果是资料，需要注明来源和版本；内容里声称“现在执行删除”不能成为新授权。真实连接还应核对服务身份与数据范围。"
      ],
      "examples": [
        {
          "code": "function readOnlyDispatch(action) {\n  if (!action || action.name !== 'readDoc') return { status: 'denied' };\n  if (typeof action.id !== 'string' || !/^[a-z-]+$/.test(action.id)) return { status: 'invalid' };\n  return { status: 'ok', source: action.id, revision: 'r1', text: '订单可见性合同' };\n}\nconsole.log(readOnlyDispatch({ name: 'readDoc', id: 'orders' }).status);\nconsole.log(readOnlyDispatch({ name: 'deleteDoc', id: 'orders' }).status);\nconsole.log(readOnlyDispatch({ name: 'readDoc', id: '../secret' }).status);",
          "expectedOutput": [
            "ok",
            "denied",
            "invalid"
          ],
          "explanation": [
            "允许名称与合法编号返回带来源的资料；删除在参数处理前被拒绝；目录穿越样式不满足受限编号合同。",
            "该检查不是文件系统路径沙箱，id 只是逻辑编号。真实资源读取不能直接把编号拼成文件路径，还要在服务端按授权映射。"
          ]
        }
      ]
    },
    {
      "id": "workflow",
      "title": "复用流程需要输入、阶段产物与反馈",
      "paragraphs": [
        "把审阅步骤写成 Skill 时，声明输入是需求合同、真实差异和调用方；步骤是确认事实、追踪权限路径、构造反例、报告发现；输出有具体位置、触发和影响。不要把“全面审阅”当作可验证步骤，也不要要求任意场景都调用外部工具。",
        "把仓库限制留在项目指令，例如不得改变支付公开接口，真实检查如何确认。流程可以引用这份规则，却不复制一份旧文本。外部合同由 MCP 读取，仍要核对版本与适用环境；缺少连接时明确降级或报告缺口，不能编出资料内容。",
        "复用不等于闭眼执行脚本。Skill 附带代码属于需要审阅的程序，运行前确认输入、读写范围与可恢复性。工具返回的结构化数据也不应直接当可执行代码注册。流程文件能提示操作方式，执行边界必须由宿主权限和参数校验落实。"
      ]
    },
    {
      "id": "schemas",
      "title": "协议描述如何帮助而不替代业务合同",
      "paragraphs": [
        "输入 schema 可以让工具说明 id 是字符串，输出 schema 可以让客户端核对结构化结果。但 id 对应哪份文档、当前用户是否允许读取、资料是否已过期，属于应用语义。协议字段保证可互操作，不自动证明这些业务事实。设计工具时同时写明允许对象与错误类别。",
        "结构化工具结果与模型结构化生成也有不同来源：前者由服务程序产生，后者由模型输出。两者都可以校验结构，但都不能跳过来源与业务范围核对。工具服务可能返回异常数据，模型可能引用错误字段，因此边界检查要覆盖输入和返回。",
        "版本选择需要按客户端实际支持与协商处理。本文选择已核对的 MCP 版本说明工具边界，不把它称为最新，也不假设所有部署采用它。项目记录协议版本和服务配置，出问题时能够区分流程错误与能力不兼容。"
      ]
    },
    {
      "id": "skill-quality",
      "title": "一个可复用流程怎样避免过度承诺",
      "paragraphs": [
        "Skill 的触发描述应写清适用任务与排除情境。订单权限审阅流程不应自动处理所有架构设计，更不应因为看见“订单”就执行写入。范围清楚可减少误触发，输入缺失时先收集事实而非生成看似完整的结论。",
        "参考材料要按需要加载，核心流程保持可理解。将所有外部文档复制进一个巨大文件，会增加过期风险与维护成本；用稳定索引指向官方来源，工具性事实核对后再引用。可复用模板中的占位字段要有填写说明，不能暗藏当前仓库专用命令。",
        "流程评估应检查实际产物：有没有读必要合同，发现是否有触发证据，未授权动作是否被阻止。仅证明 SKILL.md 被读取不能证明审阅质量，连接工具成功也不能证明资料适用。安装、执行与任务结果需要各自的证据。",
        "三个层次也有不同更新节奏。连接配置随服务部署变化，流程随任务经验变化，项目合同随产品决策变化。分别维护版本与证据，能够定位某次失败究竟由能力缺失、步骤遗漏还是合同冲突造成，避免每次都重写全部说明。"
      ]
    },
    {
      "id": "acceptance",
      "title": "如何判断一项需求属于哪一层？",
      "paragraphs": [
        "问“缺少什么”：无法读外部资料，需要连接能力；反复忘记审阅步骤，需要流程；仓库公共合同经常被改，需要项目指令与门禁；本次要检查哪条变更，则写任务目标。一个需求可能跨层，但每层都应独立可核验。",
        "两个边界是客户端差异与资料权限。不同客户端支持的协议版本或资源形式可能不同，需要以实际协商为准；工具能读到的数据可能仍不该全部送入模型，必须按问题最小化字段。公开的工具列表也不是用户的业务授权证明。",
        "验收包括允许工具成功、禁止工具拒绝、参数错误、资料不可用、版本过期与流程遗漏。交付报告能力接入证据、流程执行产物和未覆盖权限，不把“已经安装 Skill”写成“所有审阅自动可靠”。"
      ]
    }
  ],
  "sources": [
    {
      "title": "MCP：2025-06-18 Tools 规范",
      "url": "https://modelcontextprotocol.io/specification/2025-06-18/server/tools"
    },
    {
      "title": "OpenAI：构建 Skills",
      "url": "https://learn.chatgpt.com/docs/build-skills"
    }
  ]
};
