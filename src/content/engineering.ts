import type { Article } from './types'
import { createReviewBody } from './review-body'

export const engineeringArticles: Article[] = [
    {
        slug: 'vite',
        module: 'engineering',
        title: 'Vite：开发时 ESM，生产时打包',
        summary: '开发时按需提供模块，生产使用 Rolldown 打包、拆包和优化。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['Vite', 'ESM', 'HMR'],
        overview:
            'Vite 开发态基于 ESM 按需提供源码并进行依赖预构建，改动时通过 HMR 更新相关模块。Vite 8 使用 Rolldown 统一预构建与生产打包，并由 Oxc 提供解析和转换能力。',
        body: createReviewBody(
            `## 一次开发请求怎么走

打开 \`/\` 时，Vite 只返回 HTML 和入口 \`main.tsx\`，并不先打整个应用。浏览器再按 import 去拉 \`App.tsx\`、\`BoardPage.tsx\`。依赖（react、react-router）很少变，启动时预构建成 \`node_modules/.vite\` 里的少数文件，之后走缓存。源码按请求用 Oxc 转换。

改一个模块，HMR 只替换相关子图，页面状态还能在。这比 webpack 时代“先打一个大包再 serve”启动更快。预构建哈希变了会返回 504 Outdated Optimize Dep，浏览器里旧 URL 失效；懒加载页最容易因此白屏，硬刷新或删 \`.vite\`。

## 为什么生产仍要打包

开发可以假设本机有 Vite 中间件。生产是静态文件：要 tree-shaking、压缩、按路由拆包、给 JS/CSS 打内容哈希。没有打包，浏览器得请求几百个源文件，也没有长期缓存策略。

Vite 8 用 Rolldown 统一预构建和生产打包。面试讲“开发按需、生产打包”即可，不必背 Rolldown 内部。

## 配置边界

\`@\` 别名必须和 \`tsconfig\` paths 对齐，否则开发能解析、\`tsc -b\` 报找不到模块。环境变量只有 \`VITE_\` 会进客户端；\`process.env.SECRET\` 要么被替换成空，要么打进包。\`fs\`、\`path\` 不能出现在客户端模块。

大 CJS 依赖预构建失败时，用 \`optimizeDeps.include / exclude\` 写死，比反复清缓存稳。库模式要 external React，应用模式不能抄同一套。

SSR 时同一文件可能在 Node 和浏览器各执行一次。把 \`window\` 写在共享模块顶层，服务端会直接炸。`,
            `Vite 开发态用原生 ESM 按需编译源码，并把稳定依赖预构建，所以启动和 HMR 快；生产仍然要打包，才能拆包、压缩和打哈希。Vite 8 用 Rolldown 统一两端打包。配置上别名要和 TS 对齐，只有 VITE_ 变量能进浏览器，Node 模块不能进客户端。SSR 要意识到模块会在两个运行时各执行一次。`,
            [
                {
                    question: '预构建和源码编译有什么差别？',
                    direction: '依赖预构建一次后复用；源码按请求转换，改动后走 HMR。',
                },
                {
                    question: '为什么开发能跑、生产缺模块？',
                    direction: '开发按需加载，生产摇树或拆包后路径、副作用假设不同。',
                },
                {
                    question: 'VITE_ 前缀的意义是什么？',
                    direction: '显式允许打进客户端包；没有此外缀的变量默认不暴露。',
                },
                {
                    question: '什么时候要管 optimizeDeps？',
                    direction: '大包、CJS 依赖或预构建反复失效时，显式包含或排除比反复清缓存稳。',
                },
            ],
        ),
        pitfalls: [
            '在源码里读 process.env.SECRET，浏览器包会漏出去或变成空。',
            '把 Node 内置模块直接 import 进客户端。',
            '插件 hook 顺序导致 CSS 或 MD 处理两次。',
        ],
    },
    {
        slug: 'rspack-rsbuild',
        module: 'engineering',
        title: 'Rspack 与 Rsbuild',
        summary: 'Webpack 生态的 Rust 实现，适合存量 webpack 和超大仓库。',
        depth: 'core',
        heat: 2,
        year: 2026,
        tags: ['Rspack', 'Rsbuild', '构建'],
        overview:
            'Rspack 用 Rust 重写 webpack 核心，配置面刻意靠近 webpack。Rsbuild 是更开箱的上层。大仓从 webpack 迁过来成本通常低于换一套完全不同的心智。',
        body: createReviewBody(
            `## 什么时候选

已经有复杂 webpack 配置、Module Federation、多入口后台时，Rspack 能复用 loader/plugin 心智，迁移成本通常低于整仓改 Vite。新开的中小型 SPA，Vite 仍然更轻。不要因为“Rust”就无条件切换。

Rsbuild 是开箱上层，适合不想从零拼 webpack 配置的团队。底层仍是 Rspack。

## 兼容现实

常见 css / babel / ts 能对上。依赖 webpack 内部 API 的 loader 会对不上，需要官方兼容层或丢掉。假设全部 plugin drop-in 一定会踩坑，应先迁构建、再迁冷门插件。

## 和 CI

构建变快后，瓶颈常变成安装依赖和缓存。pnpm store 与构建缓存比再换一次打包器更先做。本地快、CI 慢，多半是 CI 没缓存 node_modules，不是打包器选错。

同时维护 Vite 和 Rspack 时，把 alias、env、目标浏览器抽出来，避免两套配置漂移。`,
            `Rspack 用 Rust 重写 webpack 核心，配置靠近 webpack，适合带着复杂 loader 和 Federation 的存量大仓；Rsbuild 是更开箱的上层。新的中小 SPA 不必为了 Rust 离开 Vite。不是所有 webpack 插件都能直接用。构建变快之后，先把安装和 CI 缓存做好，再谈换下一代打包器。`,
            [
                {
                    question: '和 Vite 怎么选？',
                    direction:
                        '绿场和中小 SPA 偏 Vite；webpack 资产很重、要保配置心智时偏 Rspack。',
                },
                {
                    question: 'Rsbuild 是另一套打包器吗？',
                    direction: '不是，它是 Rspack 上的应用层工具，减少手写底层配置。',
                },
                {
                    question: '迁移失败通常卡在哪？',
                    direction:
                        '依赖 webpack 私有 API 的插件、以及和环境变量、多入口相关的自定义逻辑。',
                },
                {
                    question: '为什么换了 Rust 打包器 CI 还是慢？',
                    direction: '安装、缓存和测试往往比编译更占时间。',
                },
            ],
        ),
        pitfalls: [
            '假设所有 webpack 插件都能 drop-in。',
            '本地快、CI 慢，原因其实是没缓存 node_modules。',
            '同时维护 Vite 和 Rspack 两套配置而不抽取共享 alias/env。',
        ],
    },
    {
        slug: 'esm-tree-shaking',
        module: 'engineering',
        title: 'ESM 与 Tree-shaking',
        summary: '静态结构才能被安全删除。副作用和通配导出是摇树的敌人。',
        depth: 'core',
        heat: 4,
        year: 2026,
        tags: ['tree-shaking', 'sideEffects', 'ESM'],
        overview:
            '打包器根据 ESM 的静态 import/export 判断哪些绑定没被用到。CJS、动态副作用、`export *` 会让删除变得保守。',
        body: createReviewBody(
            `## 为什么必须是静态 ESM

打包器靠静态 import/export 判断绑定有没有被用到。CJS 的 \`require\` 是运行时值，分析器只能保守保留。\`export *\`、把整个库 re-export 成一个对象、以及用 Babel 先把 ESM 转成 CJS，都会丢掉摇树信息。

库要提供真正的 ESM 出口，\`package.json\` 的 \`exports\` 写清楚。\`sideEffects: false\` 表示删掉未用文件是安全的；CSS、polyfill、改全局的文件必须列出来，不要为了体积撒谎。

## 应用侧

按绑定导入：\`import { format } from 'date-fns'\`，不要默认导入再取字段——对 CJS 兼容包尤其摇不动。体积变化用可视化看，不要猜。

## 动态 import

\`import()\` 是代码分割边界。块内部还能再摇，跨块不能假设同步可用。顶层改全局或读 \`window\` 却标无副作用，上线后会出现“偶发未定义”。`,
            `Tree-shaking 依赖 ESM 的静态结构。CJS、export *、先转成 CJS 再打包，都会让删除变保守。库要提供真实 ESM 出口，并诚实标注 sideEffects；CSS 和 polyfill 是真副作用。应用按具名绑定导入，用包体积可视化确认。动态 import 负责拆包，不能跨块当同步模块用。`,
            [
                {
                    question: 'sideEffects: false 标错会怎样？',
                    direction: '打包器删掉本应执行的 CSS 或 polyfill，运行时样式或 API 丢失。',
                },
                {
                    question: '为什么默认导入 lodash 摇不掉？',
                    direction: '若入口是一个大对象或 CJS，分析器看不到可删的独立绑定。',
                },
                {
                    question: 'export * 有什么问题？',
                    direction: '分析器更难证明某个导出未被使用，常把整模块留下。',
                },
                {
                    question: '开发态体积为什么不可信？',
                    direction: '开发不完整做压缩和摇树，要以生产构建的分析结果为准。',
                },
            ],
        ),
        pitfalls: [
            '库的 main 仍是 CJS，ESM 只是套壳，摇不动。',
            '在模块顶层改全局或读 window，却声称无副作用。',
            '用 babel 把 ESM 转成 CJS 再交给打包器，摇树信息丢失。',
        ],
    },
    {
        slug: 'module-federation',
        module: 'engineering',
        title: 'Module Federation：运行时组合',
        summary: '多个独立构建在运行时共享模块，适合多团队拆应用。',
        depth: 'deep',
        heat: 2,
        year: 2026,
        tags: ['Module Federation', '微前端'],
        overview:
            'Federation 让主机运行时去拉远程入口，共享 React 等依赖。它解决部署隔离，不自动解决设计系统和版本纪律。',
        body: createReviewBody(
            `## 适用

多团队、发布节奏不同、必须独立部署时才值得上。单仓单应用用 monorepo 拆包就够。Federation 解决的是运行时组合和部署隔离，不自动统一设计系统和数据契约。

主机运行时去拉远程入口，\`shared\` 必须有严格版本策略。React 出现两份实例会搞坏 Hook。类型不能靠运行时共享，要单独的契约包。

## 失败与安全

远程可能超时、版本不匹配或被劫持。要有降级 UI、超时和兼容校验。远程入口等于在跑别人的脚本，需要 CSP 和子资源完整性，不能把生产站变成任意脚本执行器。

## 2026 现状

webpack / Rspack / Vite 插件都还在，热度比 2021 冷静。很多团队回到 monorepo + 独立包，只在真有独立部署需求时用 Federation。`,
            `Module Federation 让多个独立构建在运行时组合，适合多团队独立发布，不适合单应用为拆而拆。共享依赖必须单例，尤其是 React。它不管设计系统和契约，类型要单独的包。远程加载要有降级、超时和完整性校验，因为远程入口就是在执行外部脚本。`,
            [
                {
                    question: 'Invalid hook call 为什么出现？',
                    direction: '页面上跑了两份 React，Hook dispatcher 对不上。',
                },
                {
                    question: '和 iframe 微前端怎么比？',
                    direction: 'iframe 隔离更强、集成更丑；Federation 共享运行时，隔离要靠纪律。',
                },
                {
                    question: '类型如何共享？',
                    direction: '发契约包或生成的 d.ts，不要指望运行时模块带类型。',
                },
                {
                    question: '远程失败时主机怎么办？',
                    direction: '超时、降级占位、熔断该远程，不能让整页白屏。',
                },
            ],
        ),
        pitfalls: [
            '共享了 React 却没共享 dispatcher，运行时出现 Invalid hook call。',
            '把业务数据契约只写在远程内部，主机无法演进。',
            '没有 CSP 与子资源完整性，远程入口等于任意脚本。',
        ],
    },
    {
        slug: 'pnpm-monorepo',
        module: 'engineering',
        title: 'pnpm 与 Monorepo',
        summary: '严格 node_modules 布局 + workspace，避免幽灵依赖。',
        depth: 'core',
        heat: 4,
        year: 2026,
        tags: ['pnpm', 'workspace', 'monorepo'],
        overview:
            'pnpm 默认不把未声明的包提升到可任意 require 的位置。workspace 用 `pnpm-workspace.yaml` 把 app 和 packages 连在一起。',
        body: createReviewBody(
            `## 幽灵依赖

扁平 npm/yarn 时代，A 依赖 B，B 依赖 C，应用可能直接 import C。pnpm 默认不把未声明的包提升到可随便引用的位置，直接 import C 会失败——这是特性。每个包必须在自己的 package.json 里声明真实依赖。

\`shamefully-hoist\` 会把严格模式关掉，问题回到幽灵依赖，只适合迁仓过渡。

## workspace

\`pnpm-workspace.yaml\` 列出 app 和 packages。内部包用 \`workspace:\` 协议，发布时再换成真实版本。应用不要用相对路径深入另一个包的 src，除非明确走源码引用并接受耦合。

内部包循环依赖时开发能跑、发布死锁。先把边界切对，再谈复用。

## 编排与配置

简单仓用 pnpm recursive scripts；复杂仓再用 Turborepo / nx 做任务缓存。每个包复制一份 TS/ESLint 配置会漂移，基础配置上提，包只留差异。`,
            `pnpm 用严格的 node_modules 布局消灭幽灵依赖：没用到的包不能直接 import。workspace 把多个包连在一起，内部依赖用 workspace 协议。不要用 hoist 逃回扁平世界，也不要包与包循环依赖。先把包边界和真实依赖写对，再上任务编排；公共 TS/ESLint 配置要上提，避免每包一份漂移。`,
            [
                {
                    question: '什么是幽灵依赖？',
                    direction: '代码 import 了未在本包声明、只因扁平化碰巧能解析到的包。',
                },
                {
                    question: 'workspace: 发布时变成什么？',
                    direction: '发布流程会替换成登记的真实版本号，本地继续链到工作区包。',
                },
                {
                    question: '为什么禁止直接引用隔壁包的 src？',
                    direction: '绕过包出口和构建，类型、打包和发布边界都会漏。',
                },
                {
                    question: '什么时候才上 Turborepo？',
                    direction: '包多、任务图复杂、需要稳定的构建缓存时；三四个包用递归脚本即可。',
                },
            ],
        ),
        pitfalls: [
            '用 shamefully-hoist 把严格模式关掉，问题回到幽灵依赖。',
            '内部包互相循环依赖，开发能跑、发布死锁。',
            '每个包复制一份 TS/ESLint 配置且漂移。',
        ],
    },
    {
        slug: 'ci-bundle-budget',
        module: 'engineering',
        title: 'CI 与包体积预算',
        summary: '把安装、类型检查、构建和体积阈值放进流水线，回归才出得去。',
        depth: 'intro',
        heat: 3,
        year: 2026,
        tags: ['CI', 'bundle', '质量'],
        overview:
            '本地能 build 不等于主干健康。CI 应跑类型、lint、单测和生产构建，并对主入口做体积预算。',
        body: createReviewBody(
            `## 流水线最小集

install（带缓存）→ typecheck → lint → test → 生产 build。前端仓不要只跑 \`vite build\`。把 typecheck 从脚本里拿掉，等于只打包。CI 和本地 Node 版本必须一致。

## 体积预算

用带 source map 的分析器看增长来源。预算按路由分，不要只看一个 total。锁依赖版本，避免传递依赖静默变大。预算数字要有人看、有人改；没有主人的阈值等于没有。

## 预览

每个 PR 给预览 URL，让设计和产品看真实构建，而不是开发服务器。预览环境要接近生产的分割和压缩，否则通过了也不代表主干。`,
            `CI 要证明主干可发布：锁文件安装、类型检查、lint、测试和生产构建缺一不可。包体积按路由设预算，用分析器看增长，并锁依赖避免传递膨胀。PR 预览必须是生产构建，不能只看开发服务器。Node 版本和本地对齐，预算要有人维护。`,
            [
                {
                    question: '为什么不能只跑 vite build？',
                    direction: '打包过了不代表类型、lint 和测试过了，这些失败同样不该进主干。',
                },
                {
                    question: '预算为什么要按路由拆？',
                    direction: '首页和后台大页的合理体积不同，一个 total 会掩盖局部爆炸。',
                },
                {
                    question: '预览和本地 dev 差在哪？',
                    direction: '预览走生产拆包和压缩，能暴露开发态看不到的体积和路径问题。',
                },
                {
                    question: '谁来更新预算？',
                    direction: '引入大依赖或新路由的人要同时改预算，并在 PR 里说明原因。',
                },
            ],
        ),
        pitfalls: [
            'CI 和本地 Node 版本不同，只有某一边失败。',
            '把 typecheck 从 build 里拿掉，`tsc -b && vite build` 变成只打包。',
            '预算是一个随意的数字，从来没人更新也没人看。',
        ],
    },
]
