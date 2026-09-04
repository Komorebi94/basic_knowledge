import type { Article } from './types'
import { createReviewBody } from './review-body'

export const cssArticles: Article[] = [
    {
        slug: 'has-selector',
        module: 'css',
        title: ':has() 父级选择',
        summary: '按后代状态给祖先加样式，少写一堆状态 class。',
        depth: 'core',
        heat: 3,
        year: 2026,
        tags: [':has', '选择器'],
        overview:
            '`:has()` 让祖先根据内部是否存在某元素或某状态来改变自身。表单错误、卡片含图、导航当前项都可以纯 CSS 完成。',
        body: createReviewBody(
            `## 它是什么

\`:has()\` 是关系选择器：祖先根据后代是否匹配某个选择器来改变自己。\`field:has(:invalid)\` 给整块校验区加边框，\`card:has(img)\` 区分有图无图，\`nav:has(a[aria-current])\` 高亮当前分组。

它不是 JavaScript 查询 API，不会返回节点列表。能用它就少在 JS 里同步 class。逻辑放进 CSS 后，HTML 结构必须稳定，改了 DOM 选择器会悄悄失效。

## 性能与范围

\`:has\` 比简单类选择器贵，现代引擎已优化常见模式，但仍不要写 \`*:has(*)\`。把范围限定在组件根上，例如 \`.card:has(img)\`，不要从 \`body\` 扫整棵树。

\`card:not(:has(img))\` 表达空态。复杂状态机（多步、互斥、异步）仍应回到 class 或 aria 状态，\` :has\` 只适合结构关系明确的场景。

## 兼容

旧内核没有 \`:has\`。关键布局用 \`@supports selector(:has(*))\` 做回退，或同时保留一个状态 class。装饰性样式可以只给支持的浏览器。`,
            `:has 让祖先根据内部是否存在某元素或某状态来改自己的样式，适合表单错误、卡片空态、导航当前项，从而少写同步 class。它是选择器不是查询 API，范围要限定在组件根上，避免 *:has(*)。复杂状态机仍用显式 class。关键路径要有 @supports 回退，HTML 结构一变选择器就会失效。`,
            [
                {
                    question: '和 :focus-within 有什么差别？',
                    direction: ':focus-within 只关心焦点是否在子树；:has 可以匹配任意后代选择器。',
                },
                {
                    question: '为什么说它比 class 贵？',
                    direction: '浏览器要在子树变化时重新判断祖先是否匹配，选择器越宽成本越高。',
                },
                {
                    question: '能用 :has 选父级的相邻兄弟吗？',
                    direction: '可以写 .item:has(+ .item) 这类关系，但更复杂的跨层关系会难维护。',
                },
                {
                    question: '不支持时怎么办？',
                    direction: '用 @supports 回退到状态 class，不要让关键布局只依赖 :has。',
                },
            ],
        ),
        pitfalls: [
            '选择器写得太宽，一次样式计算扫整页。',
            '用 :has 模拟复杂状态机，最后还是得回到 class。',
            '忽略旧内核，没有 @supports 回退。',
        ],
    },
    {
        slug: 'container-queries',
        module: 'css',
        title: '容器查询',
        summary: '组件按自己的可用宽度改布局，而不是只看 viewport。',
        depth: 'core',
        heat: 3,
        year: 2026,
        tags: ['container-query', '响应式'],
        overview:
            '给容器 `container-type: inline-size`，子元素用 `@container (min-width: 420px)` 切换排版。侧栏里的卡片和主栏里的同一组件可以不一样。',
        body: createReviewBody(
            `## 为什么 viewport 不够

媒体查询看窗口。仪表盘里同一个 Widget 可能 280px 也可能 800px，按手机/桌面断点会同时错。容器查询让组件看自己的可用宽度，才能真正复用。

## 怎么写

父级声明 \`container-type: inline-size\`，需要多个容器时再加 \`container-name\`。查询写 \`@container card (min-width: 420px)\`。单位 \`cqi\` / \`cqb\` 相对容器，适合流体字号。

忘记 \`container-type\` 时查询永远不成立，这是最常见的空跑。

## 和网格的分工

外层用 Grid 或 Flex 分配空间，内层用容器查询改内部结构（单列变双列、隐藏次要信息）。不要用容器查询去搭整页栅格。

不要在 shrink-to-content 的元素上查 inline-size：子项变宽导致容器变宽，再触发查询，形成循环。容器应是有明确宽度约束的盒子。每个 div 都声明容器会增加样式计算，只在真正换布局的边界上开。`,
            `容器查询让组件按自己的可用宽度改排版，而不是只看窗口。父级要设 container-type，查询用 @container，cqi 相对容器。外层网格负责分空间，内层查询负责改内部结构。容器必须有确定的宽度约束，不能在由内容撑开的盒子上查 inline-size，也不要给每个节点都开容器。`,
            [
                {
                    question: '为什么查询不生效？',
                    direction: '祖先没有 container-type，或查的是错误的 container-name。',
                },
                {
                    question: '和媒体查询如何共存？',
                    direction: '窗口级用媒体查询；组件复用、侧栏/主栏差异用容器查询。',
                },
                {
                    question: '什么是循环依赖？',
                    direction: '容器宽度由子项决定，子项又按容器查询变宽，两边互相改尺寸。',
                },
                {
                    question: 'style queries 是什么？',
                    direction: '按容器上的自定义属性查询，适合主题变体，支持度要单独核对。',
                },
            ],
        ),
        pitfalls: [
            '忘记 container-type，查询永远不成立。',
            '在已经 shrink-to-content 的元素上查 inline-size，宽度循环依赖。',
            '每个 div 都声明容器，增加样式计算成本。',
        ],
    },
    {
        slug: 'cascade-layers',
        module: 'css',
        title: 'Cascade Layers',
        summary: '用层控制优先级，而不是靠选择器权重竞赛。',
        depth: 'core',
        heat: 4,
        year: 2026,
        tags: ['@layer', '层叠'],
        overview:
            '`@layer reset, tokens, components, utilities;` 先声明顺序。后声明的层默认压过先声明的层，与选择器复杂程度无关。',
        body: createReviewBody(
            `## 层解决什么

第三方组件、reset、业务覆盖混在一起时，人们会写超长选择器和 \`!important\`。层把“来源”变成一等优先级：后声明的层压过先声明的层，不管选择器谁更长。

先写 \`@layer reset, tokens, third-party, components, utilities;\` 锁顺序。工具类（Tailwind）放最后，才能稳定盖住组件。未分层的样式默认高于所有层，旧 CSS 一引进来就会压过整套设计系统。

## 和选择器权重

层内仍比优先级和源码顺序。层间先比层，再比层内。\`!important\` 会反向比较层顺序，并继续破坏可预测性，不要用它来修补分层。

同一层名可以多次出现，后面的声明并进同一层。顺序以第一次出现的层列表为准；写两次且不一致时，调试会以为选择器错了。

## 和 Tailwind

Tailwind v4 自己走层。自定义 CSS 应放进对应 layer，不要在组件文件里写裸选择器跟工具类打架。引入第三方时明确 \`@layer third-party { @import ... }\`。`,
            `Cascade Layers 用声明顺序决定来源优先级，后声明的层压过先声明的层，从而停止选择器权重竞赛。推荐 reset → tokens → third-party → components → utilities。未分层样式默认比所有层高，旧代码必须进层。层内仍比选择器，!important 会把层秩序打乱。`,
            [
                {
                    question: '未分层的 CSS 处在哪一层？',
                    direction: '相当于比所有普通层都高，所以旧代码必须显式导入到某一层。',
                },
                {
                    question: '层顺序写两次会怎样？',
                    direction: '以最先出现的层列表为准，后面再写不同顺序不会改排名。',
                },
                {
                    question: '!important 和层如何相互作用？',
                    direction: 'important 会按相反的层顺序比较，结果更难预测，应避免。',
                },
                {
                    question: '第三方样式怎么进层？',
                    direction: '用 @layer 包住 @import，或先声明层再导入到该层名。',
                },
            ],
        ),
        pitfalls: [
            '第三方 CSS 不进层，突然压过整套设计系统。',
            '层顺序声明两次且不一致，调试时以为选择器写错。',
            '用 !important 破坏层，回到原点。',
        ],
    },
    {
        slug: 'subgrid',
        module: 'css',
        title: 'Subgrid：子项对齐到父网格',
        summary: '嵌套网格可以继承父级轨道，卡片内部和相邻卡片对齐。',
        depth: 'deep',
        heat: 2,
        year: 2026,
        tags: ['subgrid', 'grid'],
        overview:
            '`grid-template-rows: subgrid` 让子元素使用父网格的行/列定义。标题、价格、按钮能跨卡片对齐，而不把内容强行拉成等高。',
        body: createReviewBody(
            `## 场景

产品列表、定价表、表单多列需要对齐标题、价格、按钮，但每张卡内容高度不同。没有 subgrid 时只能写死高度或 JS 量高度。有了之后，父级定义轨道，子卡片 \`display: grid; grid-template-rows: subgrid; grid-row: span 3\`，内部行跟父网格走。

Subgrid 继承的是父级轨道，包括 gap。子项自己的 padding 仍属于自己，不会变成父轨道的一部分。\`span\` 必须和占用的父轨道数一致，对不上就会溢出或塌陷。

## 限制

它只在网格里工作。Flex 容器上写 subgrid 不会生效。子项必须是父网格的直接参与者。

不支持时要能退化成普通文档流，保证可读，不必像素级对齐。不要为了对齐把视觉顺序和 DOM 顺序拧乱，屏幕阅读器会迷路。`,
            `Subgrid 让嵌套网格复用父级的行或列轨道，所以相邻卡片的标题、价格、按钮能对齐，而不把内容拉成等高。子项要 span 正确的轨道数，gap 跟父级走，padding 仍是自己的。它只存在于 Grid，不是 Flex 能力。不支持时退回普通流，不要为了视觉对齐打乱 DOM 顺序。`,
            [
                {
                    question: '和把子项写成同一父网格的单元格有何不同？',
                    direction: 'subgrid 保留子卡片自己的盒模型和内部布局，同时借用父轨道。',
                },
                {
                    question: 'gap 用谁的？',
                    direction: 'subgrid 使用父网格的轨道间隔，子项再设 gap 不会改写这些轨道。',
                },
                {
                    question: '为什么 span 很关键？',
                    direction: '子网格必须覆盖它要对齐的那些父轨道，少跨或多跨都会错位。',
                },
                {
                    question: '不支持时最小可用体验是什么？',
                    direction: '卡片内部正常堆叠，信息可读，放弃跨卡对齐。',
                },
            ],
        ),
        pitfalls: [
            'span 数量和父轨道对不上，内容溢出或塌陷。',
            '在 flex 容器里期待 subgrid 生效。',
            '为了对齐把内容藏起来，屏幕阅读器顺序乱掉。',
        ],
    },
    {
        slug: 'scroll-driven-animations',
        module: 'css',
        title: '滚动驱动动画',
        summary: '用滚动进度当时间轴，不必在 JS 里监听 scroll。',
        depth: 'deep',
        heat: 2,
        year: 2026,
        tags: ['animation-timeline', 'scroll'],
        overview:
            '`animation-timeline: scroll()` 或 `view()` 把动画进度绑到滚动或元素入视口。适合进度条、视差、阅读指示。',
        body: createReviewBody(
            `## scroll 与 view

\`scroll()\` 绑定滚动容器的整体进度，适合阅读进度条。\`view()\` 绑定主体元素穿过视口的进度，适合入场和视差。\`animation-range\` 指定从进入到离开的哪一段播放。

时间轴搞错源是常见事故：页面在 document 上滚，动画却绑在内部 overflow 容器上，进度一直不动。

## 为什么别用 JS

scroll 监听里读几何、写样式容易强制布局，主线程抖动会伤 INP。CSS 动画若只改 transform / opacity，更常走合成线程。不要用它去改 width、top、height，那会每帧 layout。

## 克制

装饰可以滚动驱动；阅读和操作不要被动画抢走。\`prefers-reduced-motion\` 下停掉非必要效果。长页面上堆很多 view timeline 会吃低端机，只留用户能感知的几处。`,
            `滚动驱动动画用滚动或元素入视口的进度当时间轴，不必在 JS 里听 scroll。scroll() 看容器整体进度，view() 看元素穿过视口，animation-range 截取区间。只动画 transform 和 opacity；改几何会每帧回流。搞清时间轴源，尊重减少动态效果，并且只用于装饰而不是关键操作。`,
            [
                {
                    question: '进度条该用 scroll 还是 view？',
                    direction: '整页阅读进度用 scroll()；某个模块进场用 view()。',
                },
                {
                    question: '为什么动画不跟着滚？',
                    direction: 'timeline 绑错了滚动容器，或祖先并不是实际在滚的那个。',
                },
                {
                    question: '怎样照顾减少动态效果？',
                    direction: '在 prefers-reduced-motion 媒体条件里关掉或缩短非必要动画。',
                },
                {
                    question: 'JS 滚动方案什么时候还需要？',
                    direction: '要精确计算、和其他系统同步，或目标浏览器没有这种 CSS 时。',
                },
            ],
        ),
        pitfalls: [
            '动画改 width/top 导致每帧 layout。',
            '在文档滚动和内部 overflow 容器上搞错 timeline 源。',
            '长页面上多个 view timeline 过重，低端机掉帧。',
        ],
    },
    {
        slug: 'color-mix-anchor',
        module: 'css',
        title: 'color-mix 与锚点定位',
        summary: '颜色在 CSS 里混合，弹出层用锚点贴着触发器。',
        depth: 'core',
        heat: 2,
        year: 2026,
        tags: ['color-mix', 'anchor', 'oklch'],
        overview:
            '`color-mix(in oklch, var(--accent) 24%, transparent)` 生成悬浮态。锚点定位则让 tooltip / menu 相对按钮放置，并在边缘翻折。',
        body: createReviewBody(
            `## 颜色

OKLCH 在感知上更均匀。token 只存基色，hover / disabled 用 \`color-mix(in oklch, var(--accent) 24%, transparent)\` 派生，避免手写 30 个色板。\`light-dark()\` 和相对色也能少养两套 palette。

必须写明色彩空间。在 sRGB 里 mix 容易出泥色，却以为已经用了 oklch。混合透明不等于对比度合格，错误态不能只靠颜色，还要有文字或图标。

## 锚点

\`anchor-name\` 定义锚，\`position-anchor\` 加上 \`position-area\` 或 inset 放置。\`position-try\` 提供贴边翻折的备选位置。这是平台能力，新的 tooltip / menu 应先考虑它，而不是默认上一套 JS floating。

锚点在 \`overflow: hidden\` 的祖先里会被裁剪，fixed 弹层若祖先有 transform 也会找错包含块。不支持时再回退到 JS 定位，并保持键盘与屏幕阅读器可用。`,
            `color-mix 在指定色彩空间里由基色派生 hover 和 disabled，OKLCH 比 sRGB 更不易出脏色，但对比度仍要测，状态不能只靠颜色。锚点定位让弹出层相对触发器放置，并用 position-try 在边缘翻折；它会受 overflow 和 transform 包含块影响。新组件优先用平台能力，不支持再回退 JS。`,
            [
                {
                    question: '为什么要写 in oklch？',
                    direction: '混合发生在该色彩空间里；默认或 sRGB 更容易得到发灰的中间色。',
                },
                {
                    question: '锚点弹层被切掉怎么办？',
                    direction: '检查祖先 overflow，或把弹出层传送到不会裁剪的容器。',
                },
                {
                    question: '和 JS floating-ui 如何选？',
                    direction: '简单贴边用锚点；要虚拟滚动、复杂碰撞或旧浏览器时再用 JS。',
                },
                {
                    question: 'light-dark() 能替代一整套暗色 token 吗？',
                    direction: '能减少双份色板，但仍要检查对比度和品牌色在暗底下是否成立。',
                },
            ],
        ),
        pitfalls: [
            '在 sRGB 里 mix 出泥色，却以为 oklch 写法已经写上了。',
            '锚点在 overflow hidden 父级里被裁剪。',
            '只靠颜色表达错误态，没有文字或图标。',
        ],
    },
]
