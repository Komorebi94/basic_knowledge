# 网站知识内容审查 · 2026-10-15

> 历史审查基线：下文记录的是修复前状态。F01—F11 的修正、优先补强与本轮验证结果见 [纠错完成记录](content-corrections-2026-10-15.md)。原始发现与证据保留。

结论：当前内容不能认定为「全部正确、所有解析均已到位」。现有示例和练习有较好的自动验证基础，但独立复核发现了 11 项需要修正的问题；部分进阶内容还没有达到仓库要求的深入教程标准。建议先纠错，再补真实框架和平台案例，最后扩充知识目录。

本次只新增审查报告与证据，没有修改文章、参考答案、判题用例或应用代码。

## 审查范围与结论边界

- 对象是当前本地工作区：128 篇知识文章、20 篇 AI 文章、40 道练习，以及对应目录、来源和回忆卡关系。未提供生产网址，因此没有核对线上部署是否与本地同版本。
- 全量执行文章登记示例和练习现有用例，核对目录、路由、锚点、搜索与手机宽度；跨 16 个知识专题和 AI 目录巡检核心主张，对异步、协议、类型、安全边界及模型与真实 API 的关系重点复核。
- 对可疑行为直接提取当前参考代码，独立构造反例。没有通过修改预期或削弱用例来获得通过。
- 这是全量自动检查结合重点语义复核，不是 148 篇逐字逐句的独立专家校勘；通过输出检查不等于文章全部事实都正确，也不等于覆盖所有浏览器和版本。未发现问题的条目不应解释为零遗漏保证。
- 质量参照是 [内容合同](/Users/lujuxiao/Desktop/lujx/basic_knowledge/docs/design/10-content-contract.md) 与 [闭包教程](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/knowledge/closures.ts)。没有按字数或章节数给文章打分。

## 已确认、需要修正的问题

优先级面向教学影响：P1 表示常见输入会使推荐示例挂起或破坏消息；P2 表示知识、合同、解释或展示存在明确问题。这里没有将教学示例的问题等同于网站已经发生生产安全事故。

### F01 · P1 · 并发限制器没有覆盖同步抛错，失败后可能永久占用名额

位置：[concurrency.ts:23](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/knowledge/concurrency.ts:23)、[concurrency.ts:31](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/knowledge/concurrency.ts:31)，同样实现重复出现在后面的失败示例中。

`active` 先加一，再调用 `task().then(...)`。任务若同步抛错，或返回普通值，调用尚未返回就异常退出，后面的 `finally` 无法安装，名额不会释放。

独立复现：容量为 1，第一个任务直接 `throw Error('sync-failure')`；处理这个拒绝后提交返回已兑现 Promise 的第二项，连续清空微任务后第二项仍然 pending。原文关于「失败会释放名额、后续任务继续」的描述缺少这条常见路径。

修正方向：统一吸收任务返回值并捕获同步异常，保证每次取得名额都有对应释放；同时补充 limit 参数合同。验证同步失败、普通值、异步失败、排队项同步失败和后续恢复。E04 已有更完整的任务启动处理，可参考其边界思路。

### F02 · P1 · E37 的 SSE 解析器在 CRLF 跨块时错误拆分消息

位置：[p1.ts:454](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/practice/p1.ts:454)，参考实现的 `push` 对每个 chunk 单独替换换行。

合法输入分两次送入：

```text
第一块：data: a\r
第二块：\ndata: b\r\n\r\n
```

预期只派发一条、正文为 `a\nb` 的消息；实际派发 `a` 与 `b` 两条消息。原因是第一块末尾的 CR 已变成 LF，第二块开头的 LF 又被保留，组合出一个并不存在的事件空行。对同一文本穷举 21 个两段切分位置，发现这个切分失败。

同一实现还有 `event:` 空值问题：当前输出事件名为空字符串，标准应采用 `message`。这与不支持 `id/retry` 等主动收窄范围不同，属于已实现字段的解析错误。

修正方向：保留跨块的 CR 状态，正确吞掉紧随其后的 LF；在派发时处理空事件名。增加分块不变性检查。仓库 AI14 的解析示例已经讨论并处理跨块 CRLF，可统一两处协议认识。依据：[HTML SSE 解析规则](https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream)。

### F03 · P2 · E33 复制 `__proto__` 时会改变返回对象的原型

位置：[p1.ts:319](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/practice/p1.ts:319)。

`pick` 与 `readonlyCopy` 都创建 `{}`，再通过 `result[key] = source[key]` 复制任意字符串键。输入通过 JSON 获得自身的 `__proto__` 数据属性时，赋值命中目标对象继承的 setter，而不是创建同名自身属性。

复现：从 `JSON.parse('{"__proto__":{"injected":true}}')` 选择该键，结果 `Object.hasOwn(result, '__proto__')` 为 false，`result.injected` 却为 true。这既不符合「复制自身字符串键」合同，也让输入控制返回对象的原型。这里没有修改全局 `Object.prototype`。

修正方向：使用明确创建数据属性的复制方式，或采用适合合同的无原型字典；补充危险键、空原型输入和冻结副本的用例。

### F04 · P2 · E33 对 thenable 与 Awaited 的解释不正确

位置：[p1.ts:313](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/practice/p1.ts:313)、[p1.ts:316](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/practice/p1.ts:316)。

题面、限制与解析均称「只展开一层」，实际使用 `Promise.resolve(value).then(item => item)`，会递归吸收嵌套 thenable。独立测试外层 thenable 返回内层 thenable、内层返回 42，最终得到 42。

另一个失败路径是 `then` getter 抛错：`typeof value.then` 在返回 Promise 前就执行，当前会同步抛错；而调用者按题目展示的 Promise 拒绝合同处理时，无法仅靠返回值的 `.catch` 捕获。

修正方向：将运行时合同改为符合 Promise 吸收语义的描述；如果确实要保留单层结果，需使用不会再次吸收该值的外层容器，不能直接以 Promise 兑现该 thenable。TypeScript 的 `Awaited` 本身也用于递归解包，不能教成一层。依据：[TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html#awaitedtype)、[ECMAScript Promise Resolve Functions](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-resolve-functions)。

### F05 · P2 · 网络文章的 SSE 示例在 EOF 提交了残缺事件

位置：[streams-and-sockets.ts:52](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/knowledge/streams-and-sockets.ts:52)。

`parseSse` 在循环结束后无条件 `flush()`。对没有事件终止空行的 `data: partial`，当前返回 `-:partial`；标准在 EOF 应丢弃未完成事件。正文虽提醒网络分块不能这样做，仍将该行为保留为主解析示例，容易与 E37、AI14 的正确边界形成冲突。

修正方向：以完整事件终止符作为提交条件，EOF 不派发尾部残片；完整文本模型也应明确标注并遵守这项协议语义。依据：[HTML SSE 标准](https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation)。

### F06 · P2 · 将 Array.from 说成必须接受可迭代对象

位置：[iterators.ts:32](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/knowledge/iterators.ts:32)。

原文将 `for...of`、数组展开和 `Array.from` 一并称为需要可迭代对象。`Array.from` 还支持没有 `Symbol.iterator` 的类数组对象，例如：

```js
Array.from({ 0: 'a', 1: 'b', length: 2 }); // ['a', 'b']
```

修正方向：区分 iterable 与 array-like，并说明两者都存在时迭代协议优先。依据：[ECMAScript Array.from](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.from)。

### F07 · P2 · E07 的 emit 复杂度漏掉 once 解绑成本

位置：[functions.ts:42](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/practice/functions.ts:42)。

解析称 `emit` 时间为 O(m)。实际每个 once 监听执行前都会调用 `remove`，内部对数组使用 `indexOf/splice`。大量常驻监听与 once 交错时，每次解绑都从数组头搜索不同记录，累计查找范围可达 O(m²)，还未计算用户回调成本。独立探针中，1000 个交错监听、其中 500 个 once，其删除查找的前缀长度累计为 125750；这是逻辑工作量，不是耗时测量。快照空间 O(m) 的说法可以保留。

修正方向：改正复杂度并注明假设，或在保留快照、重入及精确解绑语义的前提下改变记录组织。不要用单次计时证明渐近复杂度。

E35 另有分析缺口：[p1.ts:394](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/practice/p1.ts:394) 只写了每次选择的排序量级，没有给出整体复杂度及边 m 的成本。反复排序并 shift 不等于堆版的 O(m+n log n)，建议补全总成本。

### F08 · P2 · 把同源写成浏览器连接复用的必要条件

位置：[connections-tls-protocols.ts:27](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/knowledge/connections-tls-protocols.ts:27)。

首句称「能够复用的连接，至少要属于同一个源」。HTTP/2 在满足权威性、证书等条件时可以跨不同 URI authority 复用连接。下一段虽提到连接合并，仍与首句的必要条件表述冲突。

修正方向：先讲常见同源复用，再单列 HTTP/2 coalescing；区分「两个 URL 不同源」与「一定不能共享连接」。依据：[RFC 9113 §9.1.1](https://www.rfc-editor.org/rfc/rfc9113.html#section-9.1.1)。

### F09 · P2 · 字体显示周期被写得像规范固定数值

位置：[critical-resources.ts:73](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/knowledge/critical-resources.ts:73)。

原文称按 CSS Fonts 建模，将 block、fallback、optional 的周期直接写成 3000ms、100ms 等，并据此推导精确绘制时刻。规范对短周期及极短周期给出推荐范围，具体行为由用户代理决定；这些常量可以作为教学假设，不能当成跨浏览器固定保证。

修正方向：在示例前明确「本例选择的假设周期」，将概念、规范建议与实际浏览器观察分开。相应回忆卡也要注明是在本模型条件下回答。依据：[CSS Fonts font-display](https://drafts.csswg.org/css-fonts-4/#font-display-desc)。

### F10 · P2 · 登记的完整预期输出没有被阅读组件渲染

位置：[ArticleView.tsx:45](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/ArticleView.tsx:45)。

文章示例保存了 `expectedOutput`，页面却只渲染代码和 explanation。代码注释或正文已列出的结果仍然可见，但仅保存在该字段里的完整输出序列不会出现。例如 K02-02 组合示例有五行输出，页面没有单独展示其完整顺序，后面的文字也没有逐项解释为什么 `all b` 排在最后。

这影响读者核对结果，尤其是异步输出题。修正方向：对适合展示的示例渲染完整预期输出，并补齐必要的顺序解释；正确与故意错误的示例都应清楚标明结果含义。

### F11 · P2 · 26 篇文章的练习可用性说明已经过期

位置示例：[concurrent-rendering-suspense.ts:90](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/knowledge/concurrent-rendering-suspense.ts:90)、[form-validation-and-recovery.ts](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/knowledge/form-validation-and-recovery.ts)。

20 篇文章仍明确称 E25—E40 中的一些题目尚未制作或开放；另有 6 篇称本主题没有已开放独立练习，但当前关联已经包含 E29、E38、E27、E35、E39 或 E40。目录与现有验证均确认 40 题已经注册，因此同一阅读页可能正文说没有题，文末又显示题目入口。

受影响文章：K05-04/06/07/08，K06-03/04/05，K07-03—08，K08-03/04/05/07，K09-06，K10-04/08，K15-03/04/07，K16-03/05/08。逐条原文、章节与关联保存在 [覆盖记录](content-audit-coverage.json)。

修正方向：依据当前练习的真实范围更新正文。模型题已经可做，但不能顺势写成真实 DOM、React 或类型练习已经交付；可用性与能力范围是两个判断。

## 解析深度与内容定位：四项优先补强

### 1. 部分练习标题与实际训练能力不一致

[p1.ts:5](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/practice/p1.ts:5) 明确说明 E25—E40 全部在纯 JavaScript 模型里运行，不创建 DOM，不运行 React、Vue 或 TypeScript 编译器。这个限制已披露，不应称其为暗中执行错误；但它与原 [练习目录](/Users/lujuxiao/Desktop/lujx/basic_knowledge/docs/design/08-exercise-catalog.md) 的部分目标存在交付差距。

- E31 名为 useAsyncResource，实际入口为 `createResource()`；没有 Hook 挂载、依赖变化、卸载或 Strict Mode 验证。
- E33 的运行时对象复制和冻结不等于 Pick、Readonly、Awaited 的类型实现。尤其 `Readonly<T>` 不会在运行时自动调用 Object.freeze。
- E34 只检查事件名与参数数量，不检查载荷类型；同样数量但类型完全错误的参数也可以通过。不能据此证明「类型安全事件映射」。
- E27/E28 可训练焦点与开合的状态决策，却没有实现真实角色、焦点移动、背景 inert 等行为。E40 进行成本装箱，不实际跨帧调度，也不能验证后台标签节流。

建议保留这些题作为「行为模型练习」，准确调整标题和训练目标；真实 DOM/React 题另以对应环境验证，类型题补编译器正向与负向断言。不要仅靠免责声明代替原本要训练的能力。类型与冻结的区别可对照 [TypeScript 对象类型](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)。

### 2. React 的机制说明还缺真实组件与关键触发条件

K07-03—08 的登记示例没有挂载 React。模型可以辅助理解状态身份，但很难让读者独立验证 key、Transition、Suspense、memo 的真实行为。

尤其 K07-05 应明确：Suspense 不会因为任意请求 pending 就出现 fallback；Effect 或普通事件回调里的 fetch 不会自动触发边界。应补一个真实 `lazy` 或稳定 Promise 配合 `use` 的完整案例，并展示首次挂起、再次挂起、过渡保留旧内容与错误边界。依据：[React Suspense](https://react.dev/reference/react/Suspense)。

还应说明 `startTransition` 的回调立即执行，不能把其中任意同步昂贵计算自动变成后台任务；异步 Action 中 await 后的更新标记及响应乱序也有需要处理的边界。依据：[React useTransition](https://react.dev/reference/react/useTransition)。K07-06 可以补充 React 19 的 `use` 能在条件和循环中调用这一例外，避免将传统 Hook 顺序规则泛化到所有 API。依据：[React use](https://react.dev/reference/react/use)。

### 3. 服务端和架构进阶主题缺少从模型走到工程的完整案例

K14-03—08 大多用同步函数返回 queued、partial、interactive、cold-start 等字符串。文章通常说明了模型限制，这是优点；但读者还缺少如何真正执行、如何观察失败和如何恢复的一段完整代码。

优先补：Node `pipeline` 或 Web Streams 的背压及取消、BFF 超时与部分失败、真实流式 SSR 与 hydration、按可信身份隔离服务端缓存。K14-05 应分清「脚本就绪」和「对应区域已经可交互」，不让字符串标签代替事件绑定证据。K14-07 应以指定平台和日期说明能力：边缘环境并不普遍禁止所有 socket，Node 部署也不天然保证进程永远保留。

K13 的固定记录数和写入次数阈值可以用于选择练习，但还需要从数据大小、读写分布、并发、索引、配额和恢复目标推导一次真实方案。不要将阈值表当成容量分析的终点。

### 4. 可观测性需要解释指标如何与 trace 关联

[request-observability.ts:20](/Users/lujuxiao/Desktop/lujx/basic_knowledge/src/content/knowledge/request-observability.ts:20) 强调日志、指标和跨度都引用同一请求编号，但没有区分日志字段、trace/span 上下文、指标标签和 exemplar。

当前例子只输出字符串，并没有真的创建高基数指标；问题在于生产落地指导缺少关键区别。若照此把每请求唯一 ID 放到 Counter/Histogram 的普通标签里，会产生持续增长的时间序列。应讲清楚：指标按有限维度聚合，具体请求通过日志与 trace 定位，必要时用 exemplar 关联采样测量与 trace。依据：[OpenTelemetry 指标关联说明](https://github.com/open-telemetry/opentelemetry-dotnet/blob/main/docs/metrics/README.md)、[Prometheus 标签建议](https://prometheus.io/docs/practices/naming/#labels)。

## 各专题值得补充的内容

以下是基于现有章节的补强方向，不表示每一项都应新增独立文章。优先扩写现有单元，减少只有标题的目录增长。

| 专题 | 建议补充到正文的内容 |
| --- | --- |
| K01 JavaScript | iterable 与 array-like 对照；描述符不变量；展开与 Object.assign 的目标 setter 差异；生成器 throw/yield* 与清理边界 |
| K02 异步 | resolved 与 fulfilled 的区别；thenable 吸收；组合方法空输入；同步抛错；带 jitter、Retry-After 和取消的完整重试案例；并发与 CPU 并行的区别 |
| K03 TypeScript | 正负类型样例与运行时样例成对出现；泛型推断失败的解释；库发布的消费端验证；实际类型练习 |
| K04 浏览器 | 浏览器任务与 Node 调度区别；真实观察器失败恢复；Service Worker 更新与旧页面的版本配合；目标浏览器能力矩阵 |
| K05 HTML/CSS | 包含块、层叠上下文与 top layer 的对照；自动最小尺寸；层内 !important 的反序；字体周期的实现差异 |
| K06 网络 | 真实 HTTP 缓存与 CORS 请求记录；Cookie 的 site/origin/端口区别；HTTP/2 连接合并；SSE 分块、EOF、游标与断档恢复 |
| K07 React | 真正挂载的 key/Effect/Transition/Suspense 案例；React 19 use 与 Actions 的边界；Profiler 前后证据；Server Functions 的合法序列化例外 |
| K08 Vue | 现有真实 Vue/Router/SSR 案例较完整；继续补 SFC 编译、Pinia、KeepAlive 与真实接口集成，分别注明环境 |
| K09 构建工程 | 在现有真实 Node 构建样例上补浏览器部署复核、ESM/CJS 消费差异和缓存输入变更；不要把本地调度模型当真实 CI 日志 |
| K10 性能 | 真实 Performance 轨迹、Web Vitals 采样、实验室与现场数据对照；先定位再验证因果，模型数字与实测结果分开 |
| K11 安全 | 一组真实 CSP 响应头与浏览器拦截；净化器配置及危险 URL；跨用户授权接口用例；日志字段白名单与保留期限 |
| K12 测试 | 真正 Testing Library/Playwright 的完整交互用例；分块不变性等属性测试；更贴近实际缺陷的变异，而非只用极弱错误实现 |
| K13 架构 | 从一个页面的 UI→流程→规则→存储走完成功、失败、冲突；固定教学阈值之后补可复算的容量推导 |
| K14 服务端 | 真实流、取消、BFF、SSR、水合、缓存隔离与指定部署运行时；避免仅用字符串状态完成整篇进阶教程 |
| K15 无障碍 | 真实 DOM、键盘焦点、错误关联和目标辅助技术走查；24px 间距例外、字体尺寸与对比度条件不能只靠数字模型验收 |
| K16 算法 | 复杂度逐层推导、输入不变量、失败及空间成本；树与图的重复节点语义；稳定拓扑排序的队列/堆取舍 |
| AI01—12/15/19 | 保留当前合同、权限与证据意识；选一个脱敏仓库任务串起真实上下文、diff、检查结果和失败恢复 |
| AI13/14 | 加一组留出集的检索与权限评估记录；统一 SSE 协议例子；用真实本地流验证取消、断流、部分结果与最终提交 |
| AI16—18/20 | 在人工账本之外补一次有版本记录的实际评估：重复次数、失败分布、留出集、真实用量和成本未知项，不写永久排行榜 |

闭包、值与引用，以及 K08-03—08 的组织方式最适合作为后续扩写参照：问题、完整环境、状态变化、故意错误、修复行为与边界相互对应。AI 文章对「语言声明不等于执行证据」的区分较好，应保留。

## 实际验证结果

| 检查 | 本次结果 | 证明范围 |
| --- | --- | --- |
| npm run typecheck | 通过 | 当前项目静态类型 |
| npm run lint | 通过 | 当前 lint 规则 |
| npm run build | 通过，含 verify:p0 | 当前构建及内容结构门禁 |
| npm run verify:articles | 148 篇、474 个登记示例通过 | 446 个浏览器、28 个 Node；其中 27 个严格 TS 示例；仅作者登记输入 |
| npm run verify:exercises | 40 题通过 | 310 行为用例、120 示例、80 个预设错误实现被拦截 |
| npm run verify:k03-types | 通过 | 7 个负向类型检查与 4 项包消费/声明变异检查 |
| npm run verify:content | 通过 | 全部文章路由、锚点、搜索和 390px 手机宽度 |
| npm run verify:catalog | **失败：脚本预期过期** | 等待旧地址 `/practice#E35` 超时，不能记为通过 |
| 独立目录与搜索复核 | 通过 | 16 专题各 8 条；实际搜索地址 `/practice/dependency-topo-sort` 可进入题页；手机目录无横向溢出 |
| 305 个去重来源 URL | 300 个直接 200；2 个重定向；3 个网络超时后经备用浏览通道确认可读 | 没有确认死链；仅检查可读性，不代表每个链接支持文章全部主张 |
| 独立边界探针 | 复现上述代码与协议问题 | 本次新增反例；不是修复通过的回归记录 |

运行环境：Node v22.22.3、Chrome 155.0.8059.40、TypeScript 6.0.3。未执行真实收费模型 API、生产后端、全浏览器矩阵或屏幕阅读器验收。

`verify:catalog` 的旧路由断言位于 [verify-catalog.mjs:42](/Users/lujuxiao/Desktop/lujx/basic_knowledge/scripts/verify-catalog.mjs:42)。应更新断言，再重新运行；本次另行验证当前页面，未改动该脚本来隐藏失败。

证据文件：

- [文章执行记录](content-audit-article-examples.json)
- [练习执行记录](content-audit-exercises.json)
- [类型与包消费记录](content-audit-types.json)
- [独立反例结果](content-audit-probes.json)
- [逐条覆盖记录与 26 处过期说明](content-audit-coverage.json)
- [来源访问结果](content-audit-sources.json)
- [独立目录与搜索验证](content-audit-ui.json)

来源记录中的 3 次超时是本机网络观察，随后已用网页工具读取同址；2 个 308 地址也已读取重定向后的页面。不要据原始超时或重定向状态将它们标成死链。

## 修订顺序与完成标准

1. 修 F01—F09 的实现、知识和合同错误，并将独立反例加入对应验证；优先处理并发挂起、SSE 分块和不安全属性复制。
2. 修完整输出展示和 26 处过期说明，同步正文、卡片、练习合同及目录脚本。
3. 重新界定模型练习与真实框架/类型练习的训练目标；补 React、服务端流与可观测性的真实案例。
4. 按上述专题表扩写，逐篇满足「读者能独立推导一个新例子、能解释失败原因、知道适用边界」后再视为完成。

每次语义修订应同步内容版本、复核日期及相关卡片，重新运行受影响检查。补一个实际反例比增加若干相似成功样例更有价值；示例数量增加不能代替技术复核。
