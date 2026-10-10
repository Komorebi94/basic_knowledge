import type { Article } from "../articles";

export const discriminatedStateArticle: Article = {
  "id": "K03-02",
  "kind": "knowledge",
  "domainSlug": "typescript",
  "slug": "discriminated-state",
  "title": "联合类型与状态建模",
  "summary": "怎样让 loading/success/error 不出现无效组合。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "discriminated-state",
    "联合类型与状态建模"
  ],
  "tags": [
    "typescript"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "一个请求为什么同时显示加载和错误？",
      "paragraphs": [
        "搜索面板分别保存 loading、data、error 三个变量，看起来容易理解。问题出现在重试：上一次错误没有清空，新请求把 loading 设为 true，界面同时显示旧错误和新进度。三个布尔或可选字段允许很多组合，但业务实际只认可待开始、加载、成功和失败四种状态。",
        "建模先回答有哪些可观察的情况，再决定字段。成功必须有数据，失败必须有错误；等待不必伪造一个空对象。本文 TypeScript 示例可以在严格模式编译后独立执行，重点是让编译器协助排除矛盾，运行时输入仍需校验。"
      ],
      "examples": [
        {
          "code": "type RequestState =\n  | { status: 'idle' }\n  | { status: 'loading'; requestId: number }\n  | { status: 'success'; data: string[] }\n  | { status: 'error'; message: string };\nfunction label(state: RequestState): string {\n  switch (state.status) {\n    case 'idle': return '尚未搜索';\n    case 'loading': return '请求:' + state.requestId;\n    case 'success': return '结果:' + state.data.length;\n    case 'error': return '失败:' + state.message;\n  }\n}\nconsole.log(label({ status: 'loading', requestId: 7 }));\nconsole.log(label({ status: 'success', data: [] }));",
          "expectedOutput": [
            "请求:7",
            "结果:0"
          ],
          "explanation": [
            "status 是所有成员共有的字面量属性。进入 success 分支，编译器知道对象具有 data；进入 loading 分支才有 requestId。空数组是成功结果，不应因为长度为零被判成失败。"
          ],
          "language": "typescript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "联合描述可选情况，交叉描述同时满足",
      "paragraphs": [
        "A | B 表示值可以属于 A 或 B。它并不表示每个值都同时具有 A 与 B 的全部属性，所以未收窄时只能安全使用共同属性。A & B 则要求同时满足两个约束，适合组合带时间戳的数据，不适合描述互斥的请求阶段。",
        "判别字段要能够唯一指出一个成员。把 status 写成普通 string，再把 data 和 error 都设为可选，会丢失相关性：编译器无法从 status 判断哪一个可选字段存在。为每个成员分别写字段，虽然重复几个名字，却换来真实的不变量。",
        "不要把联合误认为精确的对象属性白名单。TypeScript 是结构类型系统，某些额外属性可以通过变量传入。需要拒绝未知字段或反序列化对象时，要在运行时边界执行 schema 或明确检查。类型只保护受检查的代码。"
      ]
    },
    {
      "id": "transitions",
      "title": "状态更新必须整体表达一次迁移",
      "paragraphs": [
        "一次请求完成应替换整个状态，不是依次修改多个变量。这样观察者看到的是一个有效状态。迁移函数还可以携带请求身份，避免较早请求覆盖较晚结果。下面用同步事件序列模拟响应乱序，不依赖实际网络。"
      ],
      "examples": [
        {
          "code": "type State = { status: 'idle' } | { status: 'loading'; id: number } | { status: 'success'; id: number; value: string };\ntype Event = { type: 'start'; id: number } | { type: 'finish'; id: number; value: string };\nfunction reduce(state: State, event: Event): State {\n  if (event.type === 'start') return { status: 'loading', id: event.id };\n  if (state.status !== 'loading' || state.id !== event.id) return state;\n  return { status: 'success', id: event.id, value: event.value };\n}\nlet state: State = { status: 'idle' };\nstate = reduce(state, { type: 'start', id: 1 });\nstate = reduce(state, { type: 'start', id: 2 });\nstate = reduce(state, { type: 'finish', id: 1, value: '旧' });\nconsole.log(state.status);\nstate = reduce(state, { type: 'finish', id: 2, value: '新' });\nconsole.log(state.status === 'success' ? state.value : '未完成');",
          "expectedOutput": [
            "loading",
            "新"
          ],
          "explanation": [
            "start 2 替换了 loading 1。finish 1 身份不匹配，返回原对象；finish 2 才建立成功成员。联合约束字段，迁移逻辑约束时间，两者解决不同问题。"
          ],
          "language": "typescript"
        }
      ]
    },
    {
      "id": "exhaustive",
      "title": "新增成员时，让遗漏成为编译错误",
      "paragraphs": [
        "switch 分支完整覆盖联合后，剩余值应为 never。将它传给接收 never 的函数，新增 cancelled 或 refreshing 成员而没有处理时就会报类型错误。返回一个默认的空字符串虽然容易通过编译，却可能把新增业务情况静默藏起来。"
      ],
      "examples": [
        {
          "code": "type Result = { kind: 'ok'; count: number } | { kind: 'failed'; reason: string };\nfunction unreachable(value: never): never {\n  throw new Error('未处理状态:' + JSON.stringify(value));\n}\nfunction describe(result: Result): string {\n  switch (result.kind) {\n    case 'ok': return '数量:' + result.count;\n    case 'failed': return '原因:' + result.reason;\n    default: return unreachable(result);\n  }\n}\nconsole.log(describe({ kind: 'failed', reason: '超时' }));",
          "expectedOutput": [
            "原因:超时"
          ],
          "explanation": [
            "failed 分支明确读取 reason。default 在当前类型中不可达，但运行时仍抛错，防止未校验外部数据混入后被悄悄当成成功。它不是外部输入的验证器。"
          ],
          "language": "typescript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "错误实现：用断言跳过相关性",
      "paragraphs": [
        "常见错误是先读取 data，再用非空断言告诉编译器它一定存在。loading 或 error 进入这一段就会在运行时失败。修复应把读取放到 success 分支，或把需要的数据作为函数参数传递，不能只换成可选链然后显示零条。零条和未取得结果具有不同含义。",
        "另一个误区是把所有事件都接受为合法迁移。success 收到一个未知 finish 不一定该再次更新。需要根据产品合同决定重试、取消和刷新能从哪些状态发生；联合本身并不会自动实现状态机，也不会阻止不合理的函数返回。"
      ]
    },
    {
      "id": "boundaries",
      "title": "刷新与可编辑表单需要自己的领域结构",
      "paragraphs": [
        "第一条边界是后台刷新：页面可能同时拥有旧数据和正在更新的请求。这不是互斥模型失效，而是需要明确 refreshing 成员携带 previousData 和 requestId。不要为了保留旧数据重新加一组互不关联的可选字段。",
        "第二条边界是多个独立请求。列表和统计能分别加载，不应强行合成一个全页状态；各自使用请求联合，页面根据需要派生组合视图。状态粒度要对应实际独立变化的责任。",
        "第三条边界是持久化。写入 JSON 会丢掉类型信息，读取时不能直接断言 RequestState。检查版本、判别字段和成员必需字段后才能恢复；无法识别的旧状态应显示可恢复错误或迁移。"
      ]
    },
    {
      "id": "application",
      "title": "把不变量放在边界，避免组件各自猜测",
      "paragraphs": [
        "在业务模块定义 State 与 Event，导出迁移函数或命令；组件负责映射状态到视图。这样按钮禁用、错误显示和成功计数都使用同一事实源。简单开关不必建立复杂机器，真正互斥且字段相关的业务状态才值得联合。",
        "如果类型开始包含大量互相组合的成员，先检查是不是把多份独立状态混在一起。拆分所有权往往比生成几十种组合更清楚。类型应该帮助读者理解允许的情况，而不是展示类型技巧。"
      ]
    },
    {
      "id": "recall",
      "title": "主动推导一个新成员",
      "paragraphs": [
        "尝试加入 cancelled：它需要错误消息吗？是否保留已有数据？旧响应还能更新它吗？先写语义，再修改联合与迁移函数，让穷尽检查指出所有视图遗漏。",
        "回忆：为什么 data?: T 无法保证成功有数据？为什么请求身份检查不能由联合类型替代？没有独立编码题时，可用上文 reducer 增加取消事件，并验证取消后的 finish 返回原状态。"
      ]
    }
  ],
  "sources": [
    {
      "title": "TypeScript：Narrowing",
      "url": "https://www.typescriptlang.org/docs/handbook/2/narrowing.html"
    }
  ]
};
