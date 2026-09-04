import type { Article } from './types'
import { createReviewBody } from './review-body'

export const reactArticles: Article[] = [
    {
        slug: 'react-19-actions',
        module: 'react',
        title: 'React 19 Actions 与表单模型',
        summary: '用 Action 处理提交、pending 和错误，减少手写 loading 样板。',
        depth: 'core',
        heat: 3,
        year: 2026,
        tags: ['React 19', 'Actions', 'useActionState'],
        overview:
            'React 19 把异步提交提升为一等公民：Action 可以挂在 form action 或 startTransition 上，框架会自动跟踪 pending，并配合 useActionState / useFormStatus 暴露状态。',
        body: createReviewBody(
            `## 它解决什么

过去提交表单要自己管 \`loading\`、错误对象、乐观更新和竞态。Actions 把「一次异步变更」当成可调度的工作单元，React 负责过渡态。

## 核心 API

- \`<form action={fn}>\`：浏览器原生提交与 React 状态更新走同一条路径。
- \`useActionState(action, initialState)\`：返回 \`[state, dispatch, isPending]\`，适合登录、保存、删除。
- \`useFormStatus()\`：在子组件读取最近的 form pending，做按钮禁用或 spinner。
- \`useOptimistic\`：在 Action 完成前先改 UI，失败再回滚。

## 和 Server Function 的关系

在 RSC 环境里，Action 常常就是 Server Function。客户端只提交 \`FormData\`，服务端变更数据后返回新 state。即使不做 RSC，客户端 Action 同样有价值：统一 pending 与错误形状。

## 实践建议

把 Action 写成「输入 → 结果」的变更函数，UI 只消费返回 state。已知的校验或业务失败适合返回可展示状态，未知的程序错误则继续抛出并交给 Error Boundary。重复提交还要根据业务决定排队、禁用、去重或取消，不能只依赖一个 pending 布尔值。`,
            `React Action 把一次可能异步的状态变更纳入 Transition。表单可以把函数传给 action，useActionState 用上一次结果和本次载荷计算新状态，并返回 dispatch 与 pending；子组件可用 useFormStatus 读取所属表单状态，useOptimistic 则负责请求完成前的即时反馈。它减少的是提交状态样板，但服务端仍必须做校验和权限控制，乐观更新也必须考虑失败回滚与重复提交。`,
            [
                {
                    question: 'useActionState 的 action 为什么会收到 previousState？',
                    direction:
                        '它的模型接近异步 reducer，使连续 Action 能基于上一次返回结果计算下一状态。',
                },
                {
                    question: '业务错误应该返回还是抛出？',
                    direction:
                        '可预期、可展示的失败返回状态；不可预期的程序错误抛出并交给错误边界。',
                },
                {
                    question: '乐观更新如何避免显示假成功？',
                    direction:
                        '保留权威状态，以临时状态覆盖展示；失败后回退并说明原因，成功后用服务端结果校准。',
                },
                {
                    question: 'Action 能替代接口层吗？',
                    direction:
                        '不能，它组织 UI 侧变更流程，鉴权、幂等、事务和输入校验仍属于服务端边界。',
                },
            ],
        ),
        pitfalls: [
            '把旧的 useState loading 和 Action pending 叠在一起，状态会分叉。',
            '乐观更新没有失败回滚路径，用户会看到假成功。',
            '在非 form 场景忘记用 startTransition 包住 Action，pending 不会进入过渡。',
        ],
    },
    {
        slug: 'use-hook',
        module: 'react',
        title: 'use()：条件式读取 Promise 与 Context',
        summary: 'use() 可以在分支里解包 Promise / Context，并与 Suspense 协同。',
        depth: 'core',
        heat: 3,
        year: 2026,
        tags: ['use()', 'Suspense', 'Context'],
        overview:
            'use() 不是普通 Hook：它可以在条件和循环中调用，用来解包 Promise 或 Context。Promise 未完成时会抛向最近的 Suspense。',
        body: createReviewBody(
            `## 为什么需要它

\`useEffect\` 拉数会先渲染空 UI 再灌数据，瀑布明显。\`use()\` 让组件在渲染期声明依赖的数据，Suspense 负责占位。

## 用法边界

- 读取 \`Promise\`：配合服务端预取或缓存后的客户端 Promise。
- 读取 \`Context\`：可以按条件选择不同 Context，这是其他 Hook 做不到的。
- 不要拿它替代所有数据层。列表过滤、输入框这类同步状态仍用 \`useState\`。

## 和缓存的关系

同一个 Promise 要被复用，否则每次渲染都是新请求。RSC / 框架缓存 / \`cache()\` 的意义就在这里：\`use()\` 解包的是稳定 thenable。

## 和 Hooks 规则

React 文档明确：\`use()\` 允许在条件和循环中调用，但仍必须在组件或 Hook 内使用。其它 Hook 继续遵守顶层、固定顺序规则。Promise 拒绝会交给最近的 Error Boundary，而不是由 Suspense 的 fallback 处理；Suspense 只负责等待状态。`,
            `use() 是 React 在渲染阶段读取资源的 API，可以读取 Promise 或 Context。读取 pending Promise 时组件会暂停，最近的 Suspense 展示占位；兑现后 React 重试渲染，拒绝则交给 Error Boundary。与普通 Hook 不同，use 可以出现在条件或循环里，但 Promise 必须稳定或经过缓存，否则每次渲染创建新 Promise 会反复暂停。它适合 Suspense 数据源，不应替代普通本地状态和所有数据请求方案。`,
            [
                {
                    question: 'Suspense 能捕获在 Effect 中发起的请求吗？',
                    direction:
                        '不能；Suspense 只响应渲染期间可识别的暂停来源，例如 lazy 或被 use 读取的 Promise。',
                },
                {
                    question: '为什么不能在 render 中直接创建 Promise 再 use？',
                    direction:
                        '重新渲染会产生新 Promise，React 无法复用已进行的工作，可能不断回到 fallback。',
                },
                {
                    question: 'use(Context) 相比 useContext 有什么不同？',
                    direction:
                        '读取结果相同，但 use 允许条件调用，因此可根据分支选择要读取的 Context。',
                },
                {
                    question: 'Suspense 与 Error Boundary 如何配合？',
                    direction:
                        '前者处理 pending，后者处理 rejected 或渲染错误，通常在数据子树外同时设置。',
                },
            ],
        ),
        pitfalls: [
            '每次 render 新建 Promise，Suspense 会反复重启。',
            '没有 Error Boundary 时，rejected Promise 会变成空白崩溃。',
            '用 use() 读会频繁变化的本地 state，没有收益，只增加复杂度。',
        ],
    },
    {
        slug: 'react-compiler',
        module: 'react',
        title: 'React Compiler 在做什么',
        summary: '编译器自动插入等价于 memo 的依赖追踪，减少手写 useMemo / useCallback。',
        depth: 'core',
        heat: 3,
        year: 2026,
        tags: ['Compiler', 'memo', '性能'],
        overview:
            'React Compiler 在构建期分析组件，生成带依赖追踪的更新代码。目标不是换一套 API，而是让默认写法也有稳定的重渲染行为。',
        body: createReviewBody(
            `## 编译前后的心智

没有 Compiler 时，父组件一更新，子组件默认跟着 render；要靠 \`memo\` / \`useCallback\` 稳住引用。Compiler 会为每个表达式建立依赖集合，只在依赖变了时重算。

## 2026 年怎么落地

- 新项目：优先开 Compiler，组件按「普通 JavaScript」写。
- 存量项目：按目录灰度，先看编译器的 bail-out 日志（不纯渲染、可变参数、副作用藏在 render）。
- 仍然要懂规则：render 必须纯，副作用放 Effect 或事件。

## 它替代不了什么

Compiler 不管列表虚拟化、过大组件树、错误的 Context 粒度、没有拆分的 Server/Client 边界。它优化的是「该不该重算」，不是「算了多少」。

## 和手动 memo 共存

遇到编译器跳过的组件，再结合分析结果局部使用手动 memo。编译器优化依赖 React 的纯渲染规则：相同输入应产生相同输出，不能在渲染阶段修改 props、外部变量或 DOM。迁移时应先启用 lint 诊断，再逐步扩大编译范围。`,
            `React Compiler 在构建期分析组件和 Hook 的数据依赖，并自动生成缓存逻辑，目标是减少手写 memo、useMemo 和 useCallback。它不会减少首次渲染必须完成的业务计算，也不能解决过大 DOM、Context 粒度或网络包体问题。要让分析成立，组件必须遵守纯渲染和 Hooks 规则。实际优化仍应以 Profiler 数据为依据，编译器跳过或确有语义需要时再保留手动缓存。`,
            [
                {
                    question: 'Compiler 是否意味着不再需要理解引用稳定性？',
                    direction:
                        '不是；外部库边界、Context value 和编译器未覆盖的代码仍依赖正确的引用与数据建模。',
                },
                {
                    question: '自动 memo 为什么解决不了大列表卡顿？',
                    direction:
                        '它只能跳过不必要的重算，必须渲染的海量节点仍需虚拟化、分页或减少内容。',
                },
                {
                    question: '哪些代码会妨碍编译器优化？',
                    direction:
                        '渲染期副作用、直接修改输入、违反 Hooks 规则和难以静态分析的动态行为都可能导致跳过。',
                },
                {
                    question: '存量项目怎样安全启用？',
                    direction: '先修复规则诊断并小范围开启，用性能与行为测试验证后逐步扩大。',
                },
            ],
        ),
        pitfalls: [
            '在 render 里改 DOM 或写 ref，Compiler 会 bail out，收益为零。',
            '把 Compiler 当成可以随便传新对象的许可，Context value 仍会打穿子树。',
            '性能问题不先量再改，盲目加 memo，和开 Compiler 一样无效。',
        ],
    },
    {
        slug: 'rsc-client-boundary',
        module: 'react',
        title: 'RSC 与 Client Component 边界',
        summary: '服务端组件默认跑在服务端，交互组件用 use client 划边界，props 必须可序列化。',
        depth: 'deep',
        heat: 3,
        year: 2026,
        tags: ['RSC', 'use client', 'Next.js'],
        overview:
            'Server Component 在服务端生成 UI 描述，不进浏览器 bundle。Client Component 以 `use client` 为入口，负责事件、state 和浏览器 API。',
        body: createReviewBody(
            `## 边界怎么划

默认服务端，遇到交互再开客户端。文件顶部的 \`'use client'\` 是模块图的入口：它以及它 import 的模块都会变成客户端包。

服务端可以渲染客户端组件，但不能在服务端组件里调用客户端 Hook。跨边界数据必须属于 React 支持的可序列化类型。Date、Map、Set、Promise 等内置类型可以传递；普通函数和自定义 class 实例不可以，Server Function 是受支持的特殊函数。

## 和 Next.js App Router

页面默认是 Server Component。把表单、图表、编辑器放进叶子客户端组件，把数据获取留在服务端。不要把整页标成 \`use client\`，那等于放弃 RSC。

## 组合模式

把客户端叶子包在服务端布局里：服务端负责权限、数据、流式 Suspense；客户端负责输入。需要把服务端数据传给客户端时，显式传最小化、可序列化的数据，而不是整个数据库实体。边界的位置同时决定客户端包体、数据传输量和组件可用能力，因此应尽量靠近真正需要交互的叶子。`,
            `Server Component 在服务端执行，可以直接靠近数据源并减少客户端 JavaScript；Client Component 负责 state、事件和浏览器 API。use client 标记的是客户端模块图入口，不只是当前组件，所以它导入的依赖也会进入客户端包。服务端可以组合客户端组件，但跨边界的 props 必须符合 React 支持的传输格式，普通回调不能直接传递，Server Function 是受框架管理的特殊情况。边界应尽量下沉到交互叶子，并只传最小数据。`,
            [
                {
                    question: 'use client 为什么可能让包体突然变大？',
                    direction:
                        '它会把该文件及其客户端依赖纳入浏览器模块图，边界过高会连带大量纯展示代码。',
                },
                {
                    question: 'Server Component 能否包含 Client Component？',
                    direction:
                        '可以，服务端输出中会保留客户端组件引用与 props，浏览器再加载对应代码完成交互。',
                },
                {
                    question: '为什么不能直接传数据库实体？',
                    direction: '除了序列化风险，还可能暴露无关字段并把持久化模型耦合到 UI 契约。',
                },
                {
                    question: 'RSC 与 SSR 是同一件事吗？',
                    direction:
                        '不是；SSR 生成 HTML，RSC 传输组件描述并减少客户端代码，两者可以组合使用。',
                },
            ],
        ),
        pitfalls: [
            '在服务端组件里把事件处理函数当 props 传给客户端，序列化会失败。',
            '过早 use client，把 markdown 解析、日期格式化也打进 bundle。',
            '把数据库对象直接传过边界，泄露字段且无法序列化。',
        ],
    },
    {
        slug: 'concurrent-starttransition',
        module: 'react',
        title: '并发更新与 startTransition',
        summary: '把紧急输入和非紧急渲染拆开，避免输入卡死在大列表重算上。',
        depth: 'core',
        heat: 4,
        year: 2026,
        tags: ['startTransition', 'useDeferredValue', '并发'],
        overview:
            '并发渲染允许 React 打断低优先级更新。`startTransition` / `useTransition` 标记非紧急更新，`useDeferredValue` 推迟派生值，保证输入保持即时。',
        body: createReviewBody(
            `## 什么算紧急

击键、点击、拖拽是紧急的；过滤一万行、切换 Tab 后的重型图表是可过渡的。两者写在同一次 setState 里，用户会感觉输入延迟。

## 怎么拆

受控输入立刻 \`setQuery\`；列表过滤包在 \`startTransition(() => setDeferredQuery(next))\`。或者对 query 使用 \`useDeferredValue\`，让列表跟一帧慢的值走。

## 和 Actions 的关系

React 19 里 Action 默认走 Transition。这就是提交按钮能自动 \`isPending\` 的原因。自己用 \`useTransition\` 时，注意不要把真正紧急的输入也标成 transition。

## Fiber 还要不要懂

仍然要懂：更新是可中断的工作循环，不是一次走完整个树。Transition 不会让 JavaScript 计算自动进入后台线程；它只是让 React 能优先处理更紧急的更新并放弃过时的低优先级渲染。如果事件处理器本身先同步计算很久，标记 Transition 也救不了卡顿。`,
            `React 并发渲染允许低优先级渲染被暂停、放弃或稍后继续。输入、点击等直接反馈应保持紧急，列表过滤或页面切换等可以用 startTransition 标为非紧急；useTransition 还提供 pending，useDeferredValue 则让某个派生值暂时落后于最新输入。Transition 不是延时器、节流器或多线程，它优化的是 React 更新调度，无法解决事件回调中的同步重计算。`,
            [
                {
                    question: 'Transition 与 debounce 有什么区别？',
                    direction:
                        'debounce 按时间丢弃中间触发，Transition 保留状态语义但允许 React 中断过时渲染。',
                },
                {
                    question: '为什么受控输入不能放进 Transition？',
                    direction:
                        '输入值必须立即与 DOM 同步，否则光标和字符反馈会落后；可延后的应是依赖输入的重型结果。',
                },
                {
                    question: 'startTransition 会让计算跑到其他线程吗？',
                    direction: '不会，JavaScript 仍在主线程；真正的 CPU 密集计算可能需要 Worker。',
                },
                {
                    question: 'useDeferredValue 何时比双 state 更合适？',
                    direction:
                        '当慢 UI 是某个值的派生结果时，它能直接提供滞后副本，减少手动同步状态。',
                },
            ],
        ),
        pitfalls: [
            '把输入框本身放进 transition，待机会变差而不是变好。',
            '用 debounce 替代 transition：debounce 丢中间态，transition 保留最新并保持可中断。',
            'isPending 不用来降低列表优先级，只拿来做 spinner，用户仍会看到卡顿。',
        ],
    },
    {
        slug: 'activity-view-transition',
        module: 'react',
        title: 'Activity 与实验性 View Transition',
        summary: 'Activity 保留隐藏 UI 的状态；React View Transition 仍应作为扩展能力了解。',
        depth: 'deep',
        heat: 2,
        year: 2026,
        tags: ['Activity', 'View Transition', 'React 19.2'],
        overview:
            'Activity 是 React 19.2 的稳定能力。React 的 ViewTransition 组件仍属于实验性能力，两者成熟度不同，只作为关联主题放在一起比较。',
        body: createReviewBody(
            `## Activity

Tab、抽屉、多步表单里，卸载再挂载会丢掉输入。Activity 隐藏时保留 state，卸载 Effect，并把隐藏更新推迟到浏览器空闲时；重新显示时 Effect 会重新挂载。

适用：侧边栏、切 Tab、返回仍要看到未提交内容。不适用：永远不再访问的页面，那应该卸载以释放内存。

## View Transition

浏览器 View Transitions API 先截当前帧，再截新帧，中间做插值。React 的 ViewTransition 组件能与更新调度衔接，但不应当作稳定 API 背诵；理解其用途、平台原理和实验状态即可。

适合列表重排、同一布局内的详情切入。不适合整页无共享元素的硬切，这时 CSS 动画或不添加动画可能更清晰。无论使用哪种方式，都要尊重 \`prefers-reduced-motion\`，并避免让动画延迟真实操作反馈。`,
            `Activity 用 visible 和 hidden 管理 UI：隐藏时保留组件 state 与 DOM，清理 Effects，并以较低优先级处理隐藏内容；重新显示时恢复原状态并重新建立 Effects。它适合短期会返回的标签页、侧栏或表单，不适合无限缓存页面。ViewTransition 解决的是前后视觉状态之间的动画衔接，和 Activity 的状态保留不是同一问题；使用时要单独确认当前 React 发布通道与浏览器支持。`,
            [
                {
                    question: 'Activity 隐藏与组件卸载有什么区别？',
                    direction:
                        '隐藏会保留 state 和 DOM，但清理 Effect；卸载则连同组件状态和 DOM 一起销毁。',
                },
                {
                    question: '隐藏后 video 为什么可能继续播放？',
                    direction:
                        'DOM 仍被保留，元素自身行为可能持续，因此要在 Effect 清理中显式暂停。',
                },
                {
                    question: 'Activity 会不会造成内存问题？',
                    direction:
                        '可能；保留太多不会再访问的子树会占用 DOM 与状态内存，应只用于高概率返回的内容。',
                },
                {
                    question: '如何处理减少动态效果偏好？',
                    direction:
                        '通过 prefers-reduced-motion 降低或关闭非必要过渡，并保持功能不依赖动画。',
                },
            ],
        ),
        pitfalls: [
            '把所有路由都包进 Activity，内存会线性上涨。',
            '动画还没接入共享元素就开 View Transition，只会得到一次淡入淡出。',
            '忽略 prefers-reduced-motion，把过渡强加给需要减少动效的用户。',
        ],
    },
]
