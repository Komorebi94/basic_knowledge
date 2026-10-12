import type { Article } from "../articles";

export const toolCallingAndAgentsArticle: Article = {
  "id": "AI04",
  "catalogId": "AI04",
  "kind": "ai",
  "slug": "tool-calling-and-agents",
  "title": "工具调用、结构化输出与 Agent",
  "summary": "用订单查询助手拆解提议、参数校验、授权、执行与反馈，说明合法 JSON 为什么不能证明工具动作符合用户目标。",
  "aliases": [
    "tool-calling-and-agents",
    "AI04"
  ],
  "tags": [
    "AI 工程",
    "工具调用"
  ],
  "estimatedMinutes": 20,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "模型提出“查询订单”，谁负责真的执行？",
      "paragraphs": [
        "我们构建一个只读订单助手。用户希望查询自己的一笔订单，模型可能提出工具名与订单编号，但应用必须检查身份、工具是否允许和参数是否有效，才去读取数据。本文目标是把“模型想做什么”和“宿主允许发生什么”放在两个明确边界里。",
        "前置知识是 JSON、对象校验和函数。示例在现代浏览器执行，不连接订单服务，不使用真实凭据。示例的 owner 是宿主已经认证的身份；它不能从模型参数里取值，否则攻击者只需要换一个字段就能改变权限主体。"
      ]
    },
    {
      "id": "mechanism",
      "title": "工具调用是一条反馈回路",
      "paragraphs": [
        "按 OpenAI function calling 官方说明，函数工具让模型产生调用信息，由应用侧执行，再把工具结果送回对话。本文使用独立的本地模型，不依赖特定 API 字段。协议层的名称和结构会变化，概念边界依然是提议、校验、执行与反馈。",
        "Agent 在此指能在观察与动作之间继续推进的工作流程。它可能看到失败结果后换参数重试，因此需要步数、时间和任务终止条件。循环不是“自主”两个字就能无限放开：重复查询可能只是浪费，重复付款则可能改变业务状态。",
        "结构化输出能帮助应用读取字段，但结构合法不等于语义正确。订单编号是字符串仍可能为空、属于别人或根本不存在；工具名在列表里仍可能超出本次用户授权。把模型生成 JSON 当成经过认证的命令，会同时混淆类型与权限。"
      ]
    },
    {
      "id": "wrong",
      "title": "错误实现：参数里的身份决定权限",
      "paragraphs": [
        "下面的候选调用把 owner 填成 bob，错误宿主直接信任它，于是返回别人的订单。输入完全是合法对象；漏洞来自身份取值的位置。"
      ],
      "examples": [
        {
          "code": "const orders = [{ id: 'o1', owner: 'bob', status: 'ready' }];\nconst authenticatedUser = 'alice';\nconst proposal = { name: 'readOrder', arguments: { id: 'o1', owner: 'bob' } };\nfunction unsafeRead(args) {\n  return orders.find(order => order.id === args.id && order.owner === args.owner);\n}\nconsole.log(authenticatedUser);\nconsole.log(unsafeRead(proposal.arguments).status);",
          "expectedOutput": [
            "alice",
            "ready"
          ],
          "explanation": [
            "认证用户 alice 没有参与筛选；工具按模型传入的 bob 查找，所以读到 ready。即使参数 schema 要求 owner 为字符串，也无法修复这个权限来源错误。",
            "这段错误实现只操作内存，目的是暴露授权逻辑。真实服务端仍需按已认证会话查询，客户端自己筛选不能保护后台数据。"
          ]
        }
      ]
    },
    {
      "id": "host",
      "title": "让宿主掌握分发、身份与失败语义",
      "paragraphs": [
        "正确分发器只接受只读工具，不让参数携带权限身份，并限制编号格式。未找到与不属于用户都返回同一 not-found 状态，减少无意透露记录存在性。示例为了简洁使用有限集合，不代表真实编号都必须采用这个正则。"
      ],
      "examples": [
        {
          "code": "const orders = [{ id: 'o1', owner: 'bob' }, { id: 'o2', owner: 'alice' }];\nfunction dispatch(proposal, user) {\n  if (!proposal || proposal.name !== 'readOrder') return { status: 'denied' };\n  const args = proposal.arguments;\n  if (!args || typeof args.id !== 'string' || !/^o[0-9]+$/.test(args.id) ||\n      Object.keys(args).some(key => key !== 'id')) return { status: 'invalid' };\n  const order = orders.find(item => item.id === args.id && item.owner === user);\n  return order ? { status: 'ok', id: order.id } : { status: 'not-found' };\n}\nconsole.log(dispatch({ name: 'readOrder', arguments: { id: 'o1' } }, 'alice').status);\nconsole.log(dispatch({ name: 'readOrder', arguments: { id: 'o2' } }, 'alice').status);\nconsole.log(dispatch({ name: 'deleteOrder', arguments: { id: 'o2' } }, 'alice').status);",
          "expectedOutput": [
            "not-found",
            "ok",
            "denied"
          ],
          "explanation": [
            "第一个编号属于 bob，宿主使用 alice 查询，返回 not-found。第二个属于 alice，返回 ok。第三个工具不在此次允许集合中，因此执行前返回 denied。",
            "只读边界来自宿主分发规则。反馈中的状态是结构化事实，后续语言不能把 denied 改述成“已删除”。生产实现还要校验返回值、限制数据字段，并对真实异常做可恢复处理。"
          ]
        }
      ]
    },
    {
      "id": "loop",
      "title": "反馈给模型之前，还需要收窄数据",
      "paragraphs": [
        "工具返回订单时只送回用户问题需要的字段。地址、支付标识与内部备注不因为存在于数据库就都应进入上下文。把状态、编号和允许解释的错误传回，再检查最后回答是否忠实。例如 not-found 只能说明本次读取没有可见结果，不能自行推断订单被删除。",
        "错误要区分参数无效、权限拒绝、业务无结果和系统故障。参数无效允许有限修正；权限拒绝不能通过换 owner 重试绕过；系统故障应按宿主策略重试或停止。让模型对每个错误都自由重试，会把稳定的拒绝变成探测入口。",
        "对写操作额外设计幂等键、前置条件和明确授权：先描述拟修改对象，再按合同执行，最后核对业务结果。调用成功只说明请求得到成功响应，不能省去对象身份和持久化结果的检查。本文只读例子没有提供这些写入能力，不能直接改一个工具名就升级成安全付款助手。"
      ]
    },
    {
      "id": "results",
      "title": "返回格式与业务意义需要分别校验",
      "paragraphs": [
        "宿主收到工具结果后，先验证返回结构，再确认业务身份与状态。一个结果包含字符串 status，仍可能是未知状态或另一订单。返回 schema 帮助发现形状错误，身份字段和业务条件负责结果归属。允许的状态集合应在适配器里定义，不能让页面按任意字符串自行猜测提示。",
        "把工具错误送回模型时，保留可恢复类别但减少内部详情。数据库连接串、堆栈中的私人路径和真实账号不帮助用户理解“暂时不可查询”，却可能扩大数据暴露。宿主可以记录脱敏诊断编号，最终回答引用编号与恢复动作，不需要把内部异常全文复制进语言上下文。",
        "最后回答也要检查事实一致性。模型可能在得到 not-found 后生成“订单不存在”，但合同只保证当前用户不可见。更准确的措辞应保持这个范围，避免泄露或杜撰对象状态。授权与输出准确性是两条独立要求，前者通过不代表后者自动成立。"
      ]
    },
    {
      "id": "termination",
      "title": "循环的结束条件为什么属于宿主",
      "paragraphs": [
        "若模型反复提出相同编号查询，宿主需要根据任务预算和重复动作规则终止。结束条件可以是获得可见结果、缺少必要输入、明确拒绝或达到有限尝试次数。预算不是让模型自己口头承诺少调用，而是执行层统计和限制，避免异常回路持续消耗资源。",
        "并发工具调用也需要明确依赖：查询订单与读取公开说明可以独立进行；根据查询结果决定退款则必须等待并核对前置状态。为了提速并行所有动作会打破因果条件。写操作还需考虑用户取消后是否可以阻止未开始步骤，已发生副作用怎样报告。",
        "对可恢复错误保持简单策略。一次参数校验失败允许提供具体反馈，重复无效提议则停止询问；权限拒绝不能被当作需要“寻找另一条路”的技术障碍。这让 Agent 的探索能力被限制在任务所允许的问题空间里。",
        "下面的订单只存在于内存，可在现代浏览器控制台运行。错误循环逐条执行，并在参数带有 owner 时采用该字段。宿主循环把身份固定为已认证的 alice：多余字段立即停止；非法编号只反馈一次，第二次仍非法就停止；同一编号重复，或成功读取已达两次，都在下一次提议执行前停止。"
      ],
      "examples": [
        {
          "code": "const orders = [{ id: 'o1', owner: 'bob', status: 'ready' }, { id: 'o2', owner: 'alice', status: 'paid' }, { id: 'o3', owner: 'alice', status: 'shipped' }, { id: 'o4', owner: 'alice', status: 'hold' }];\nfunction wrongLoop(proposals) {\n  const trace = [];\n  for (const proposal of proposals) {\n    const args = proposal.arguments;\n    const owner = args.owner ?? 'alice';\n    const order = orders.find(item => item.id === args.id && item.owner === owner);\n    trace.push(proposal.name + ':' + (order ? order.owner + ':' + order.status : 'missing'));\n  }\n  return trace;\n}\nfunction hostLoop(proposals, user) {\n  const trace = [];\n  let reads = 0, previous = '', invalids = 0;\n  for (const proposal of proposals) {\n    if (reads >= 2) { trace.push('stop:budget'); break; }\n    if (!proposal || proposal.name !== 'readOrder') { trace.push('stop:denied'); break; }\n    const args = proposal.arguments;\n    const keys = args && typeof args === 'object' ? Object.keys(args) : [];\n    if (keys.some(key => key !== 'id')) { trace.push('stop:unauthorized-field'); break; }\n    const idOk = !!(args && typeof args.id === 'string' && /^o[0-9]+$/.test(args.id));\n    if (!idOk) {\n      invalids += 1;\n      trace.push(invalids === 1 ? 'invalid' : 'stop:invalid');\n      if (invalids > 1) break;\n      continue;\n    }\n    const signature = 'readOrder:' + args.id;\n    if (signature === previous) { trace.push('stop:repeat'); break; }\n    previous = signature;\n    const order = orders.find(item => item.id === args.id && item.owner === user);\n    reads += 1;\n    trace.push(order ? 'read:' + order.id + ':' + order.status : 'read:not-found');\n  }\n  return trace;\n}\nconst attack = [{ name: 'readOrder', arguments: { id: 'o2' } }, { name: 'readOrder', arguments: { id: 'o1', owner: 'bob' } }, { name: 'deleteOrder', arguments: { id: 'o2' } }];\nconsole.log(wrongLoop(attack).join('|'));\nconsole.log(hostLoop(attack, 'alice').join('|'));\nconsole.log(hostLoop([{ name: 'readOrder', arguments: { id: '' } }, { name: 'readOrder', arguments: { id: 'o2' } }], 'alice').join('|'));\nconsole.log(hostLoop([{ name: 'readOrder', arguments: { id: '' } }, { name: 'readOrder', arguments: { id: 'bad' } }, { name: 'readOrder', arguments: { id: 'o2' } }], 'alice').join('|'));\nconsole.log(hostLoop([{ name: 'readOrder', arguments: { id: 'o2' } }, { name: 'readOrder', arguments: { id: 'o2' } }, { name: 'readOrder', arguments: { id: 'o3' } }], 'alice').join('|'));\nconsole.log(hostLoop([{ name: 'readOrder', arguments: { id: 'o2' } }, { name: 'readOrder', arguments: { id: 'o3' } }, { name: 'readOrder', arguments: { id: 'o4' } }], 'alice').join('|'));",
          "expectedOutput": [
            "readOrder:alice:paid|readOrder:bob:ready|deleteOrder:alice:paid",
            "read:o2:paid|stop:unauthorized-field",
            "invalid|read:o2:paid",
            "invalid|stop:invalid",
            "read:o2:paid|stop:repeat",
            "read:o2:paid|read:o3:shipped|stop:budget"
          ],
          "explanation": [
            "错误循环的三条提议都执行了。第一条没有 owner，代码用 alice 读到 paid；第二条改用参数中的 bob，读到 ready；第三条虽然叫 deleteOrder，仍然按 alice 找到 o2 并留下 paid 记录。循环没有预算，也没有在越权字段出现时停下。",
            "宿主处理同一串提议时，第一条签名是 readOrder:o2，reads 变为 1，记录 read:o2:paid。第二条含有 owner，在查找订单前写入 stop:unauthorized-field 并 break，所以 bob 的订单没有被读，deleteOrder 也没有开始。",
            "空编号先记 invalid，不增加 reads，随后合法的 o2 仍可读取。空编号后再给 bad，invalids 变为 2，写入 stop:invalid，后面的 o2 不再执行。重复序列的第二条签名与上一条相同，在第二次读取前停止，o3 没有发生。三条不同编号里，前两条分别读到 paid 和 shipped，第三条进入循环时 reads 已是 2，写入 stop:budget。",
            "这些停止原因都属于宿主计数，模型口头答应少调用并不能改变 trace。示例没有网络、并发取消和真实写操作；deleteOrder 在错误循环里也只是留下查找记录，用来暴露它已被执行。"
          ]
        }
      ]
    },
    {
      "id": "acceptance",
      "title": "怎样证明职责没有混淆？",
      "paragraphs": [
        "验收至少覆盖正确用户、其他用户、空编号、额外 owner 字段、未允许工具与服务失败。检查动作轨迹是否真正停在授权门前，而不是先执行再给语言加一条警告。输出 schema、参数 schema 和权限检查各自保护不同条件，需要分别验证。",
        "两个边界是并发状态变化和外部返回数据。订单在读取与修改之间可能变动，写入时需要服务端条件约束；工具结果也可能来自异常或不可信数据，应用仍需校验，并把资料中的指令当内容处理。",
        "交付说明列出允许工具、身份来源、参数合同、停止条件和已执行用例。工具多不等于任务完成能力强；给这个助手增加删除功能，只会增加新的权限与验收义务，不能自动提升查询质量。"
      ]
    }
  ],
  "sources": [
    {
      "title": "OpenAI：函数调用",
      "url": "https://developers.openai.com/api/docs/guides/function-calling"
    }
  ]
};
