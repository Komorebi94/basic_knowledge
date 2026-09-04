import type { Article } from './types'
import { createReviewBody } from './review-body'

export const typescriptArticles: Article[] = [
    {
        slug: 'discriminated-unions',
        module: 'typescript',
        title: '判别联合：把非法状态从类型里拿掉',
        summary: '用 tag 字段表达互斥状态，比可选字段堆砌更安全。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['联合类型', '收窄', '状态机'],
        overview:
            '请求、弹层、播放器这类 UI 状态用 `{ status: "loading" } | { status: "ok"; data: T } | { status: "error"; error: Error }` 表达。switch status 后，字段自动收窄。',
        body: createReviewBody(
            `## 为什么比可选字段好

扁平状态允许自相矛盾：

\`\`\`ts
type Bad<T> = { loading: boolean; data?: T; error?: Error }
const s: Bad<User> = { loading: true, data: user, error: new Error('x') }
\`\`\`

渲染只能写 \`data?.name\`，还要猜现在该转圈、展示还是报错。判别联合把互斥态拆开，非法组合赋不进去：

\`\`\`ts
type Remote<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'error'; error: Error }
\`\`\`

\`status === 'ok'\` 之后 \`data\` 一定在，没有 \`error\`。请求、弹层、播放器、支付步骤都适用。组件吃已经收窄的领域类型，不要满屏可选链。

## 怎么写

判别器必须是字面量。写成 \`status: string\`，分支里什么也收不窄。处理用 switch，剩余类型丢给 never：

\`\`\`ts
function text(state: Remote<User>): string {
  switch (state.status) {
    case 'idle': return '未开始'
    case 'loading': return '加载中'
    case 'ok': return state.data.name
    case 'error': return state.error.message
    default: {
      const _never: never = state
      return _never
    }
  }
}
\`\`\`

加上 \`'refreshing'\` 却不改函数，编译失败。需要“旧数据 + 正在刷新”时，建成 \`{ status: 'refreshing'; data: T }\`，不要在 ok 上再挂可选 loading。

## 和 API 边界

\`fetch\` 回来仍是 unknown。用 zod 或 guard 收成 Remote，失败走 error，不要 \`as { status: 'ok'; data: User }\`。错误 JSON 一旦被断言成成功形状，UI 会把 undefined 当用户名渲染。`,
            `UI 和请求状态不要用一堆可选字段，那会允许 loading 带着 data 和 error 同时存在。用字面量 tag 做成判别联合，switch 之后字段自动收窄，非法组合无法构造。判别器必须是字面量；default 用 never 做穷尽检查。外部 JSON 先校验再收成联合，组件只消费已经收窄的领域类型。`,
            [
                {
                    question: '判别器写成 string 会怎样？',
                    direction: '无法按分支收窄，联合退化成大家都可能有的可选字段。',
                },
                {
                    question: '为什么还要 never 检查？',
                    direction: '新增状态时，未处理分支不能赋给 never，编译期就能发现漏逻辑。',
                },
                {
                    question: '成功后还要显示上一份数据怎么建模？',
                    direction:
                        '做成独立状态，例如 refreshing 携带 data，而不是在 ok 上再挂可选 loading。',
                },
                {
                    question: '和枚举有什么差别？',
                    direction: '枚举只区分名字；判别联合还能让每个分支携带不同字段。',
                },
            ],
        ),
        pitfalls: [
            '判别器不是字面量（写成 string），收窄失效。',
            '用 as 把错误形状塞进成功分支。',
            '在 switch 里不处理 never，新增状态时静默漏逻辑。',
        ],
    },
    {
        slug: 'satisfies-operator',
        module: 'typescript',
        title: 'satisfies：校验形状，保留字面量',
        summary: '既要符合某类型，又不想被拓宽成索引签名。',
        depth: 'core',
        heat: 4,
        year: 2026,
        tags: ['satisfies', '字面量类型'],
        overview:
            '`const routes = { home: "/", article: "/q" } satisfies Record<string, string>` 会检查值都是 string，同时保留 `home` / `article` 的精确键和字面量路径。',
        body: createReviewBody(
            `## 和注解的差别

\`const routes: Record<string, string> = { home: "/" }\` 之后，\`routes.home\` 只是 \`string\`，键名也丢了，自动补全和路径字面量都没了。注解是“把值拓宽成这个类型”。

\`satisfies\` 是“检查值符合协议，但保留推断结果”。路由表、主题 token、消息字典、feature flag 都适合：既要保证值是 string 或某协议，又要留下精确键。

## 和 as const

\`as const\` 把一切变成只读字面量，但不检查是否符合更大的协议。写错字段名不会报“不符合 RouteTable”，只是得到另一个字面量类型。

两者可组合：\`as const satisfies Protocol\`。先锁字面量，再确认没漏协议字段。需要后续赋值的对象不要加 \`as const\`，否则属性变成只读。

## 用在哪里

组件库 variants、i18n 字典、权限映射。加新 key 时，过宽的 \`Record<string, unknown>\` 等于没检查；过窄的注解又丢掉字面量。satisfies 卡在中间。

它只在编译期生效，生产环境不会跑。运行时缺字段仍然要靠测试或 schema。`,
            `类型注解会拓宽推断，satisfies 只做符合性检查并保留字面量和精确键。路由表、token、字典这类“值要符合协议、键还要留下来”的对象用它。as const 负责只读字面量，不负责校验协议，两者可以组合。satisfies 不是运行时校验，也不能和过宽的 Record 一起用，否则等于没检查。`,
            [
                {
                    question: '为什么 routes.home 会变成 string？',
                    direction:
                        '写成 Record<string, string> 后，值按索引签名读取，字面量路径被丢掉。',
                },
                {
                    question: '什么时候不该 as const satisfies？',
                    direction: '对象后续还要赋值或增删字段时，只读字面量会让赋值失败。',
                },
                {
                    question: '和 satisfies 一个接口有何不同？',
                    direction: '接口注解会按接口成员读取；satisfies 保留实际字面量结构。',
                },
                {
                    question: '未声明的多余键会怎样？',
                    direction: '协议是封闭对象时多余键报错；协议是 Record 时多余键可能被允许。',
                },
            ],
        ),
        pitfalls: [
            '对需要可变对象的地方用 as const satisfies，后面赋值失败。',
            '误当成运行时校验，生产环境不会执行它。',
            '和过于宽的 Record<string, unknown> 一起用，等于没检查。',
        ],
    },
    {
        slug: 'infer-and-conditional',
        module: 'typescript',
        title: 'infer 与条件类型',
        summary: '从其它类型里抽出一块，用来写可复用的工具类型。',
        depth: 'deep',
        heat: 4,
        year: 2026,
        tags: ['infer', '条件类型'],
        overview:
            '条件类型 `T extends Pattern ? X : Y` 里可以用 `infer R` 捕获匹配到的片段，例如函数返回值、Promise 解包、数组元素。',
        body: createReviewBody(
            `## 它解决什么

条件类型按“T 是否符合某种形状”分支。\`infer R\` 在匹配成功时把形状里的一块抓出来命名。\`ReturnType\`、\`Awaited\`、\`Parameters\` 都是这个模式。

自己写之前先找内置工具。新工具类型必须有具体使用点，不要为了炫技建一套体操库。路由参数、事件 payload、Promise 解包是正当场景。

## 分配律

裸类型参数遇上联合会分配：\`A | B extends Foo ? X : Y\` 变成对 A、B 分别计算再联合。这让 \`Foo<string | number>\` 常常得到联合结果。

不想分配就写成 \`[T] extends [Pattern] ? ...\`，把联合当成一个整体。搞不清结果是宽了还是窄了，多半是忘了分配律。

## 可读性

多层 infer 嵌套时，报错会变成一长串展开。能拆成两步 type alias 就拆，并给中间结果起能读懂的名字。用 \`type\` 测试几个输入，防止重构时静默变意。

infer 只存在于编译期。它不能解析运行时字符串，也不能代替 zod。`,
            `条件类型按形状分支，infer 用来抽出匹配到的片段，ReturnType 和 Awaited 都是这样写的。优先复用内置工具，新类型要有真实调用点。裸参数遇上联合会分配，不想分配就用元组包一层。多层 infer 会让报错不可读，拆成两步别名，并记住这些结果在运行时并不存在。`,
            [
                {
                    question: '怎样从函数类型取出返回值？',
                    direction:
                        'T extends (...args: never) => infer R ? R : never，或直接用 ReturnType。',
                },
                {
                    question: '为什么有时结果变成两个分支的联合？',
                    direction: '分配律把联合拆开分别计算；用 [T] extends [U] 可以关掉。',
                },
                {
                    question: 'infer 能解析 URL 吗？',
                    direction: '只能处理类型层面的模板字面量，不能解析运行时任意字符串。',
                },
                {
                    question: '工具类型要不要写测试？',
                    direction: '要。用几个 expect-type 或简单赋值断言，避免重构后静默变宽或变窄。',
                },
            ],
        ),
        pitfalls: [
            '忘记分配律，联合类型结果比想象的宽或窄。',
            '用 infer 替代运行时解析，编译期结果在运行时并不存在。',
            '工具类型没有测试用例，重构时静默变意。',
        ],
    },
    {
        slug: 'template-literal-types',
        module: 'typescript',
        title: '模板字面量类型',
        summary: '字符串也可以是类型系统里的代数，适合事件名和 CSS token。',
        depth: 'deep',
        heat: 3,
        year: 2026,
        tags: ['模板字面量', '字符串类型'],
        overview:
            '`on${Capitalize<Event>}`、`${Color}-${Shade}` 这类类型让事件名、BEM、i18n key 在编译期对齐。',
        body: createReviewBody(
            `## 能做什么

模板字面量类型把有限联合拼成更大的有限联合。\`rgb | hsl\` 乘上 \`100 | 200 | 300\` 得到 token 名；\`on${'${Capitalize<Event>}'}\` 对齐事件处理函数名。\`Uppercase\` / \`Capitalize\` 用来落实命名约定。

它适合事件名、设计 token、i18n key、有限的路由片段。输入必须是字面量联合。对 \`string\` 做模板展开，结果直接退化成 \`string\`。

## 不要做什么

不要用它解析任意用户输入。联合成员一多，编译器和 IDE 会变慢甚至报过大联合。复杂路径解析、任意 CSS 类名拼接留给运行时。

提取可以用条件类型加 infer：\`T extends \`${'${infer Head}/${infer Tail}'}\` ? ...\`。这仍然只对字面量有用。

## 和运行时的缝

类型保证的是编译期见到的字符串。运行时若用随机数或接口返回的任意 string 去拼 class，类型承诺立刻失效。边界上要把外部字符串收成联合，或放弃“类型保证类名存在”。`,
            `模板字面量类型用来把有限联合拼成事件名、token、i18n key，输入必须是字面量。对普通 string 展开会退化，联合过大则拖垮编译。它可以配合 infer 抽片段，但不能当运行时解析器。动态拼接的随机字符串不受这套类型保护。`,
            [
                {
                    question: '为什么结果变成了 string？',
                    direction: '参与拼接的某一段是普通 string，不是字面量联合。',
                },
                {
                    question: '怎样从 /q/:module/:slug 抽出参数名？',
                    direction: '用条件类型和 infer 递归吃掉模板片段，只适合字面量路由表。',
                },
                {
                    question: '生成几万成员会怎样？',
                    direction: '类型检查和自动补全变慢，严重时编译器直接拒绝过大联合。',
                },
                {
                    question: '和正则比谁该做解析？',
                    direction: '有限、已知的字符串用类型；任意输入用运行时正则或解析器。',
                },
            ],
        ),
        pitfalls: [
            '对 string 而不是字面量联合做模板展开，结果退化成 string。',
            '生成几万成员联合，IDE 卡死。',
            '用类型保证 CSS 类名存在，却在运行时拼接了动态随机串。',
        ],
    },
    {
        slug: 'const-type-parameters',
        module: 'typescript',
        title: 'const 类型参数',
        summary: '调用时保持字面量推断，少写 as const。',
        depth: 'core',
        heat: 4,
        year: 2026,
        tags: ['TS 5', 'const 泛型'],
        overview:
            '`function useColumns<const T extends readonly string[]>(cols: T)` 会把传入的 `["id", "name"]` 推断成字面量元组，而不是 `string[]`。',
        body: createReviewBody(
            `## 问题

泛型默认会拓宽。\`useColumns(["id", "name"])\` 里的 T 常常变成 \`string[]\`，后面 \`row[col]\` 失去键信息。以前只能让调用方写 \`as const\`，这很容易忘。

## 现在

类型参数写成 \`const T\`，推断从值的字面量出发，得到 \`readonly ["id", "name"]\`。表格列、路由 builder、i18n、css token 列表都适用。

约束要写成 \`readonly ...[]\` 或只读对象。写成可变 \`T[]\` 时，只读字面量元组进不去，推断会失败或再被拓宽。

## 谁来写 const

库和内部工具的配置入口应该加 const 泛型，比要求每个调用方记得 as const 更稳。接受任意 string、确实需要拓宽的 API 不要加，否则调用方无法传入变量。

和重载一起用时，先确认字面量落到了哪条签名。const 泛型改变的是推断起点，不改变运行时。`,
            `泛型默认会把 ["id", "name"] 拓宽成 string[]。在类型参数前加 const，推断会保留字面量元组，调用方少写 as const。约束用 readonly 数组或只读对象。需要接受任意 string 的 API 不要加 const。这是给库入口用的推断开关，不是运行时特性。`,
            [
                {
                    question: '为什么约束要写成 readonly？',
                    direction: '字面量元组是只读的，可变 T[] 无法接收它。',
                },
                {
                    question: '和 as const 还要同时写吗？',
                    direction:
                        '库已经用 const 泛型时，调用方通常不必再写；需要只读值本身时仍可用 as const。',
                },
                {
                    question: '传入 string[] 变量会怎样？',
                    direction: '只能得到 string[]，const 泛型不能从已经拓宽的变量里还原字面量。',
                },
                {
                    question: '什么时候不该用？',
                    direction: 'API 本意就是任意字符串或可变数组时，加 const 会把合法调用挡掉。',
                },
            ],
        ),
        pitfalls: [
            '约束写成可变 T[]，字面量元组进不去。',
            '在需要真正拓宽的 API（接受任意 string）上误加 const。',
            '和重载混用时推断落到错误签名。',
        ],
    },
    {
        slug: 'narrowing',
        module: 'typescript',
        title: '类型收窄：guard、真值与断言边界',
        summary: '控制流是类型系统的一部分。未知数据要在边界收成已知形状。',
        depth: 'intro',
        heat: 5,
        year: 2026,
        tags: ['narrowing', 'unknown', 'type guard'],
        overview:
            'TS 根据 `typeof`、`in`、`instanceof`、真值检查和自定义 predicate 收窄。外部数据先当 `unknown`，验证后再当领域类型。',
        body: createReviewBody(
            `## 内置收窄

类型跟着控制流变。\`typeof x === 'string'\` 之后 x 是 string；\`Array.isArray(x)\` 之后是数组；\`key in obj\`、\`instanceof Date\` 同理。\`x != null\` 同时排除 null 和 undefined，但 0 和 \`''\` 还在——真值收窄会把它们当假，\`if (count)\` 会误伤合法的 0。

提前 \`return\` / \`throw\` 也是收窄：函数开头 \`if (!user) return\`，后面 user 就是定义好的。能靠控制流就不要 \`as\`。

## 自定义 guard

谓词 \`v is ModuleId\` 让编译器相信检查之后的类型。实现必须真查：

\`\`\`ts
function isModuleId(value: string): value is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(value)
}
\`\`\`

\`return true\` 的 guard 编译通过、运行崩溃。对象不要只判 \`typeof === 'object'\`（null 也是 object），要查字段。谓词比满地 \`as\` 好，因为检查写在一处。

## 断言与 unknown

\`JSON.parse\` 的结果是 any（历史包袱），应立刻当成 unknown：

\`\`\`ts
const raw: unknown = JSON.parse(text)
if (!isUser(raw)) throw new Error('invalid user')
raw.id
\`\`\`

\`as User\` 和 \`user.id!\` 只是逃逸。可选字段上的 \`!\` 把崩溃推迟到点击时。\`any\` 会污染调用方：一个 any 参数能让整条链失去检查。新代码禁用 any；存量先包 unknown 再收窄。`,
            `TypeScript 的收窄发生在控制流里：typeof、in、instanceof、真值检查和提前返回都会让类型变窄。外部数据先当 unknown，用真实检查或 type guard 收成领域类型。as 和 ! 只是逃逸舱，JSON.parse 不能直接断言。any 会传播并关掉检查；unknown 强迫处理。guard 的实现必须和谓词一致。`,
            [
                {
                    question: 'x != null 排除了什么？',
                    direction: '同时排除 null 和 undefined，不会排除 0 和空字符串。',
                },
                {
                    question: '为什么不要写 return true 的 guard？',
                    direction: '编译器会按谓词信任后续类型，运行时却没有任何检查。',
                },
                {
                    question: 'unknown 和 any 差在哪？',
                    direction: 'unknown 必须先收窄才能用；any 可以随意操作并污染下游。',
                },
                {
                    question: '什么时候可以用 as？',
                    direction:
                        '你刚完成运行时校验、或和 DOM/编译器限制无法表达时，并紧挨着校验代码。',
                },
            ],
        ),
        pitfalls: [
            'JSON.parse 直接断言成业务类型。',
            'type guard 写错实现，编译通过运行崩溃。',
            '可选字段用 ! 非空断言，只是把崩溃推迟到运行时。',
        ],
    },
]
