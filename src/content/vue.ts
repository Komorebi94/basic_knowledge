import type { Article } from './types'
import { createReviewBody } from './review-body'

export const vueArticles: Article[] = [
    {
        slug: 'vue-3-5-reactivity',
        module: 'vue',
        title: 'Vue 3.5 响应式与内存模型',
        summary: '大列表和深层对象上的响应式开销下降，Props 解构变得能保持响应。',
        depth: 'core',
        heat: 3,
        year: 2026,
        tags: ['Vue 3.5', 'reactivity', 'props'],
        overview:
            'Vue 3.5 重做了响应式内部实现：对大型 reactive 对象更省内存，并让 `reactive props destructure` 在编译后仍保持更新。',
        body: createReviewBody(
            `## 响应式模型

Vue 的响应式核心是“读取时收集依赖，写入时触发依赖”。\`reactive\` 使用 Proxy 拦截对象属性操作，\`ref\` 则用带 value 的容器统一处理基本类型和对象。当组件渲染读取响应式数据时，当前渲染 effect 会与对应属性建立关系；属性变化后，调度器只安排依赖它的工作更新。

Vue 3.5 调整了响应式内部数据结构，重点收益是降低大型响应式对象的内存占用，并减少陈旧依赖残留。业务写法大体不变，但长表格、树和文档模型等场景的底层成本更稳。性能优化仍应从减少不必要的深层响应、缩小更新范围入手，不能把版本优化当成无限包装数据的理由。

## Props 解构

普通对象解构只复制当前值，因此过去从 props 解构会失去后续读取连接。Vue 3.5 的响应式 Props 解构由编译器识别 \`defineProps\` 返回值，并把同一 \`script setup\` 中对解构变量的访问改写为 props 属性读取。它不是 JavaScript 解构语义整体改变：把解构变量传到外部函数、脱离编译上下文，仍要明确传值还是传 getter。

## 还该用 ref 还是 reactive

- 基本类型、单独状态：\`ref\`。
- 表单、聚合模型：\`reactive\` 可以，但传给子组件时注意丢掉代理。
- 需要解构普通 reactive 对象并保持连接：使用 \`toRefs\`，因为 Props 编译转换不覆盖任意对象。

## 和 computed

computed 仍是派生状态的正确位置。它根据读取到的依赖缓存结果，依赖未变化时重复访问不重新计算。不要用 watch 把 A 复制到 B；watch 更适合请求、存储和第三方组件等外部副作用。`,
            `Vue 通过 track 和 trigger 建立响应式属性与 effect 的关系：读取时收集，修改时调度更新。ref 适合单值和可整体替换的数据，reactive 适合聚合对象，computed 用于无副作用的派生状态。Vue 3.5 优化了内部依赖结构，并由编译器支持 defineProps 的响应式解构，但这不代表任意 reactive 对象解构后都能保持响应；跨函数边界时仍要明确传值、ref 还是 getter。`,
            [
                {
                    question: 'ref 包装对象后和 reactive 有什么关系？',
                    direction:
                        '普通 ref 会把对象值转为深层响应对象，同时额外提供可整体替换的 value 容器。',
                },
                {
                    question: '为什么替换整个 reactive 变量可能断开连接？',
                    direction:
                        '已有消费者追踪的是原 Proxy；变量指向新对象后，持有旧代理的地方不会自动改连。',
                },
                {
                    question: '什么时候用 shallowRef？',
                    direction:
                        '大型不可变数据或外部状态系统只需要关注根引用替换时，可避免深层代理成本。',
                },
                {
                    question: 'Props 响应式解构能否跨文件生效？',
                    direction:
                        '转换依赖编译器上下文；传给外部逻辑时用 getter或 toRef 明确保留响应读取。',
                },
            ],
        ),
        pitfalls: [
            '把 reactive 对象整个替换而不是改字段，依赖可能断。',
            '解构后拿到的如果是普通值（绕过编译的手写运行时），更新不会来。',
            '在超大列表上对每一行都套一层不必要的 reactive。',
        ],
    },
    {
        slug: 'vapor-mode',
        module: 'vue',
        title: 'Vapor Mode：更少 Virtual DOM',
        summary: '编译到更细粒度的 DOM 更新，目前作为实验方向了解。',
        depth: 'deep',
        heat: 1,
        year: 2026,
        tags: ['Vapor', '编译器', '性能'],
        overview:
            'Vapor 让组件在更新时不再走完整 VNode diff，而是由编译器生成精确的 DOM 操作。心智仍是模板 + 响应式，运行时更瘦。',
        body: createReviewBody(
            `## 和现行编译器的差别

现有 Vue 模板编译器已经会进行静态提升、缓存事件处理器，并用 patch flag 标记动态部分。运行时更新仍以 VNode 为主要抽象：重新执行组件渲染得到下一棵 VNode 树，再根据编译器提示缩小比较范围。

Vapor Mode 走向更细粒度的编译结果。编译器提前知道哪个表达式对应哪个 DOM 位置，可以生成接近“依赖变化后直接更新目标节点”的代码，减少创建和比较 VNode 的成本。响应式数据仍负责通知变化，改变的是变化如何映射到 DOM，而不是取消依赖追踪。

## 复习建议

Vapor 仍在持续演进，不应作为 Vue 学习主线。理解它与 Virtual DOM 路线的差异即可；复习优先级低于响应式、组件更新和模板编译。

## 迁移策略

保持模板约束：少用随手创建的 vnode、少在 render 函数里拼高度动态的树。能由编译器静态分析的模板更容易获得细粒度更新。评估时应比较首屏成本、更新成本、包体、组件兼容性和调试体验，而不能只看微型基准。`,
            `Vapor Mode 的核心是把更多工作从运行时移到编译期。经典 Vue 即使有静态提升和 patch flag，更新仍以 VNode 创建和比较为主；Vapor 则尝试把响应式依赖直接连接到具体 DOM 更新，减少 Virtual DOM 开销。它没有取消响应式，也不适合取代基础知识。由于这条路线仍在演进，生产采用应核对支持范围并以真实页面测量，模板越容易静态分析，收益通常越明确。`,
            [
                {
                    question: 'Vapor 是否等于没有 Virtual DOM？',
                    direction:
                        '目标是大幅减少常规更新对 VNode 的依赖，但兼容边界或动态能力仍可能需要经典路径。',
                },
                {
                    question: '细粒度更新一定更快吗？',
                    direction:
                        '取决于创建成本、更新频率和组件形态；真实应用还要考虑包体、内存与调试成本。',
                },
                {
                    question: '为什么模板比手写 render 更容易优化？',
                    direction: '模板语法受约束，编译器能静态识别节点结构、动态表达式和更新目标。',
                },
                {
                    question: '现有 Vue 编译器已经做了哪些优化？',
                    direction:
                        '包括静态提升、patch flag、缓存处理器和 block tree，用来跳过稳定内容。',
                },
            ],
        ),
        pitfalls: [
            '把 Vapor 理解成「再也不用懂响应式」，依赖收集规则并没有消失。',
            '混用大量手写 render 函数，编译器无法生成细粒度更新。',
            '未度量就全量开启，问题会变成难以对比的运行时分叉。',
        ],
    },
    {
        slug: 'define-model',
        module: 'vue',
        title: 'defineModel 与双向绑定',
        summary: '组件 v-model 的标准写法，替代手写 props + emit。',
        depth: 'core',
        heat: 3,
        year: 2026,
        tags: ['defineModel', 'v-model', '组件'],
        overview:
            '`defineModel` 把 `modelValue` + `update:modelValue` 收成一条声明。多个 v-model、修饰符和默认值都可以在同一 API 上表达。',
        body: createReviewBody(
            `## 为什么需要它

组件上的 v-model 本质仍是单向数据流的语法约定：父组件传入 modelValue，子组件通过 update:modelValue 事件请求父组件更新。旧写法需要分别声明 prop 和 emit，名称、类型与默认值分散，defineModel 用编译宏把同一契约集中声明，并返回一个可读写 ref。

子组件读取这个 ref 相当于读取父级传值，给 value 赋值则触发对应更新事件。因此“看起来双向”不代表父子共同随意修改同一份状态，权威值仍由父组件持有，子组件通过事件表达变化。

## 常见形态

- 单值：\`const model = defineModel<string>()\`
- 具名：\`defineModel('visible')\` 对应 \`v-model:visible\`
- 带修饰符：本地处理 \`trim\` / \`number\`，不要让父组件猜

父组件仍然使用 v-model。子组件读写 model.value，更新会回到父级。多个模型要使用不同名称，例如 visible 和 query；修饰符可以通过 get/set 转换集中处理，但转换规则应保持可预测。

## 和表单库

本地字段同步可以使用 defineModel；跨页提交、复杂校验和服务端错误应由表单层或显式状态协调。对象模型还要约定更新粒度：直接修改深层字段会共享对象引用，若需要清晰事件与变更记录，可以发送新对象或拆成多个字段。`,
            `组件 v-model 是 modelValue prop 与 update:modelValue 事件的语法糖，仍遵循 props 向下、事件向上的单向数据流。defineModel 是编译宏，把这组 prop、emit、类型、默认值和修饰符集中声明，并返回可读写 ref。单值、具名多个模型都能表达，但复杂表单不应全部压进一个巨大对象，也要注意默认值同步和深层对象直接修改带来的契约模糊。`,
            [
                {
                    question: 'defineModel 会绕过单向数据流吗？',
                    direction: '不会，写入返回的 ref 最终仍转换为向父组件发送更新事件。',
                },
                {
                    question: '组件怎样支持多个 v-model？',
                    direction:
                        '为每个模型声明独立名称，对应不同 prop 和 update 事件，避免状态语义混在一起。',
                },
                {
                    question: '为什么对象模型的深层修改要谨慎？',
                    direction: '父子可能共享同一对象引用，变更不会形成清晰的新值与事件边界。',
                },
                {
                    question: '修饰符应该在哪里处理？',
                    direction:
                        '在子组件模型的 get/set 转换中集中处理，并让输入输出类型和规则保持明确。',
                },
            ],
        ),
        pitfalls: [
            '子组件内部再复制一份 state，和 model 不同步。',
            '多个 defineModel 重名，运行时互相覆盖。',
            '把对象 v-model 直接 mutate 深层字段，父级可能听不到变化。',
        ],
    },
    {
        slug: 'template-refs-use-id',
        module: 'vue',
        title: 'useTemplateRef 与 useId',
        summary: '模板引用类型更稳，ID 在 SSR 和客户端之间对齐。',
        depth: 'intro',
        heat: 2,
        year: 2026,
        tags: ['useTemplateRef', 'useId', 'SSR'],
        overview:
            'Vue 3.5 提供 `useTemplateRef(name)` 获取带类型的模板 ref，以及 `useId()` 生成 SSR 安全的唯一 id，给 label / aria 使用。',
        body: createReviewBody(
            `## 模板 ref

模板 ref 是在组件挂载后获得真实 DOM 元素或子组件公开实例的逃生舱。传统写法需要声明一个同名 ref，再依靠字符串约定与模板对应；useTemplateRef 以模板引用名建立关系，并改善单文件组件中的类型推断。

它适合焦点管理、测量尺寸、媒体控制和接入非 Vue 控件，不应成为组件之间随意调用内部方法的通道。挂载前值为 null，条件渲染的元素消失后也会恢复为 null，因此使用时必须处理生命周期。v-for 中同名模板 ref 会得到元素集合，且不应依赖其顺序与源数组严格对应来做业务关联。

## useId

SSR 中服务端与客户端分别渲染，同一语义元素必须得到一致 ID。模块级自增或随机数容易因执行顺序不同而造成 hydration 不一致。useId 由 Vue 按应用与组件树生成稳定 ID，适合连接 label 和 input、aria-describedby 等关系。

它只保证 UI 实例范围的唯一与 SSR 对齐，不代表持久业务身份，因此不能拿来当数据库主键、列表业务 key 或跨会话记录 ID。`,
            `useTemplateRef 用来在挂载后安全取得模板中的 DOM 或组件实例，适合焦点、测量和第三方控件，但它是命令式逃生舱，不应替代响应式状态；读取时还要处理挂载前和条件卸载后的 null。useId 则生成服务端与客户端一致的 UI 唯一 ID，主要用于 label、aria 等可访问性关联。它不是业务主键，也不应替代列表的稳定数据 key。`,
            [
                {
                    question: '为什么 template ref 初始是 null？',
                    direction: 'setup 执行时 DOM 尚未创建，只有挂载提交完成后才能获得目标实例。',
                },
                {
                    question: '怎样限制父组件能访问的子组件能力？',
                    direction: '在 script setup 中使用 defineExpose，只公开确实需要的状态或方法。',
                },
                {
                    question: 'useId 为什么不能当 v-for 的 key？',
                    direction:
                        'key 要表达数据在列表中的稳定身份，而 useId 表达的是当前 UI 实例身份。',
                },
                {
                    question: '测量 DOM 时应该选哪个生命周期？',
                    direction:
                        '通常在 mounted 或 nextTick 后读取，并在尺寸持续变化时使用 ResizeObserver。',
                },
            ],
        ),
        pitfalls: [
            '在 v-for 里用同一个静态 ref 名，拿到的不是列表。',
            'mount 前就读 template ref，值还是 null。',
            '自己用随机数当 id，SSR 必炸。',
        ],
    },
    {
        slug: 'pinia',
        module: 'vue',
        title: 'Pinia：按模块切状态',
        summary: 'Store 是带类型的组合式状态，不是再造一个巨大 Vuex。',
        depth: 'core',
        heat: 4,
        year: 2026,
        tags: ['Pinia', '状态管理'],
        overview:
            'Pinia 用 setup store 或 option store 管理跨组件状态，天然适配 TypeScript。2026 年它仍是 Vue 应用的默认全局状态方案。',
        body: createReviewBody(
            `## 什么放进 store

Store 解决跨组件、跨路由共享且具有业务含义的状态，例如用户会话、购物车、编辑器文档或需要返回后保留的筛选条件。组件内临时 UI，如局部弹层开关和未提交输入，通常留在组件更容易理解。是否放入 store 应由状态所有权和生命周期决定，而不是“多个组件用过一次”就全局化。

## Setup store

defineStore 的 setup store 用 ref 表示 state、computed 表示 getter、函数表示 action，组合方式与组件一致。Option store 用 state、getters、actions 显式分区，结构统一。两种写法都应按业务领域拆 store，action 负责业务动作而不是简单地为每个字段生成 setter。

## 和 SSR

SSR 必须为每个请求创建独立的应用和 Pinia 实例，否则模块级单例会把一个用户的状态泄露给另一个请求。服务端状态还要安全序列化进 HTML，客户端用相同初始状态 hydration；敏感字段不能因为方便而全部下发。

## 持久化

持久化应是明确的基础设施能力，只保存必要且可序列化的字段，并处理版本迁移、过期和清理。访问令牌放 HttpOnly Cookie 通常比暴露给页面脚本的 localStorage 更安全；任何客户端状态都不能作为服务端授权依据。`,
            `Pinia 用领域 Store 管理需要跨组件或跨路由共享的业务状态，局部 UI 状态仍应留在组件。Setup Store 中 ref、computed、函数分别承担 state、getter 和 action，Option Store 则显式分区。SSR 时必须每个请求创建独立实例并安全 hydration，避免跨用户污染。持久化要选择必要字段、处理版本与过期，客户端 Store 只改善状态组织，不能替代服务端权限校验。`,
            [
                {
                    question: '为什么不建议只有一个巨大 Store？',
                    direction: '所有领域共享更新与依赖后，职责、测试和按需加载都会变得模糊。',
                },
                {
                    question: '直接解构 Store 为什么可能失去响应性？',
                    direction:
                        'state/getter 需要通过 storeToRefs 保持 ref 连接，action 则可直接解构。',
                },
                {
                    question: 'SSR 为什么不能复用全局 Pinia 实例？',
                    direction: '服务进程处理多个用户，请求共享实例会造成状态串扰甚至数据泄露。',
                },
                {
                    question: '服务端数据和 Store 谁是权威来源？',
                    direction: '服务端仍是业务与授权真相，Store 是客户端缓存和交互状态模型。',
                },
            ],
        ),
        pitfalls: [
            '一个 app store 塞所有字段，组件耦合回到 Vuex 时代。',
            '在 store 里直接操作路由或 DOM，职责泄漏。',
            '热更新后 store 订阅重复注册，开发态行为与生产不一致。',
        ],
    },
    {
        slug: 'suspense-keep-alive',
        module: 'vue',
        title: 'Suspense 与 KeepAlive',
        summary: '了解实验性 Suspense 与稳定的 KeepAlive，重点掌握缓存组件生命周期。',
        depth: 'core',
        heat: 2,
        year: 2026,
        tags: ['Suspense', 'KeepAlive', '异步组件'],
        overview:
            'Suspense 等待异步 setup / async 组件，目前仍是实验性能力；KeepAlive 是稳定的组件缓存机制。理解时需要区分两者的成熟度。',
        body: createReviewBody(
            `## Suspense

组件使用 async setup 或异步组件时，可以用 Suspense 在默认内容尚未准备好时显示 fallback。一个边界会协调其下方可识别的异步依赖，而不是每个子组件各自闪烁 loading。它目前仍被官方标记为实验能力，API 和行为可能变化；错误也不由 Suspense 自身处理，应配合 onErrorCaptured 或应用级错误方案。

边界位置决定等待粒度。把整棵应用放进一个边界会让一个慢依赖挡住所有内容；按布局和内容区域拆分，能先展示稳定外壳，再逐步显示异步区块。嵌套 Suspense、Transition、KeepAlive 和 RouterView 时顺序会影响缓存、过渡与 fallback，应依据官方组合模式验证。

## KeepAlive

KeepAlive 缓存动态组件实例，使切走的组件进入 deactivated，而不是完整 unmount；回来时 activated 并保留原 state。include/exclude 用组件名称选择缓存对象，max 以近似 LRU 的方式限制实例数量，避免长会话持续积累。

被缓存组件仍需在 onActivated/onDeactivated 中处理需要随可见性暂停的计时器、socket、媒体或数据刷新。deactivated 钩子也会在最终卸载时执行，因此清理逻辑应允许重复、保持幂等。

和 Vue Router 搭配时，缓存的是页面组件实例。路由参数变化但组件类型与 key 未变，实例可能复用；应明确是监听参数更新数据，还是通过 key 创建独立页面实例。`,
            `Suspense 用一个边界协调 async setup 和异步组件的等待状态，fallback 只处理等待，错误仍要单独捕获；它目前属于实验能力。KeepAlive 则是稳定的组件实例缓存：切走后组件进入停用状态并保留 state，回来时激活。实际使用要通过 include、exclude 和 max 控制范围，并在 activated/deactivated 中暂停或恢复外部副作用。两者解决的问题分别是异步等待和实例保留，不能混为一谈。`,
            [
                {
                    question: 'Suspense 会自动捕获异步错误吗？',
                    direction:
                        '不会，它协调 pending；错误要由 onErrorCaptured 或上层错误处理机制负责。',
                },
                {
                    question: 'KeepAlive 缓存的是 DOM 还是组件实例？',
                    direction: '核心是缓存组件实例及其状态和子树，切换时从活动树移入缓存再恢复。',
                },
                {
                    question: 'max 超限时如何淘汰？',
                    direction:
                        '会销毁最久未访问的缓存实例，行为类似 LRU，因此被淘汰组件下次会重新创建。',
                },
                {
                    question: '路由参数变化为什么页面可能不重新挂载？',
                    direction:
                        '组件类型和 key 未变时 Vue 会复用实例，应 watch 路由参数或设计明确的 key。',
                },
            ],
        ),
        pitfalls: [
            'KeepAlive 不设 max，长会话内存只升不降。',
            '停用后定时器还在跑，切回来数据已经过期。',
            'Suspense fallback 闪烁：没有最小展示时间或骨架对齐。',
        ],
    },
]
