# 实现状态与验证记录

记录日期：2026-10-15。设计目录描述目标合同，本文记录实际交付。当前页面以 D16—D18 为准：总览、侧栏、复习计划、我的积累和设置页不再交付。

历史2026-09-30验证浏览器：Chrome 154.0.8037.58；主站 origin：`http://127.0.0.1:5173`。笔记与备份验证使用独立临时上下文。

## 已实现

| 区域 | 实际状态 |
| --- | --- |
| 网站骨架 | React、TypeScript、Vite，深链接路由，桌面与移动布局 |
| 完整目录 | 16 个专题 × 8 个单元，共 128 个前端知识单元；40 道练习；20 个 AI 单元。均显示标题与学习范围；已补齐正文/题面与待编写状态分别标明 |
| 阅读内容 | 128 篇知识、20 篇 AI，共148篇完整教程；AI P0/P1 全部补齐。原 207 个作者例子，另加 4 个 AI P0 示例、11 个 AI P1 示例、18 个 K04 示例、18 个 K03 严格 TypeScript 示例、20 个 K05 布局示例、18 个 K06 示例、17 个 K07 示例与 43 个 K08-03—08 真实 Vue/Router/SSR 示例（含 3 个 Node 示例）及 2 个 K08-01/02 真实 Vue 示例，K09-03—08 新增 24 个 Node 作者示例，K10-03—08 的首屏、列表、缓存、包体、预算和诊断示例，K11-03—08 的 CSP、依赖、日志、跳转、隔离和威胁验证示例，K12-03—08 的替身、虚拟时钟、控件查询、数据隔离、属性变异和门禁示例，K13-03—08 的表单、权限、组件契约、迁移边界、租户配置和容量分档示例，K14-03—08 的流队列、聚合、分段输出、缓存键、运行时能力和请求记录示例，K15-03—08 的错误恢复、保存反馈、目标尺寸、对比度、复杂控件和发布门禁示例，以及 K16-03—08 的树遍历、有序查找、窗口、栈、状态转移和列表窗口示例；其中原 9 个严格 TypeScript 样例。原内容 ID、URL 和锚点保留 |
| 学习配套 | 386张回忆卡（P0为96张、AI P1新增14张、K04新增18张、K03新增18张、K05新增18张、K06新增18张、K07新增18张、K08-03—08新增18张、K09-03—08新增18张、K10-03—08新增18张、K11-03—08新增18张、K12-03—08新增18张、K13-03—08新增18张、K14-03—08新增18张、K15-03—08新增18张、K16-03—08新增18张）、任务模板及AI09/10/15审阅案例；卡片原文定位、默认折叠答案、自评说明与双向练习关联可用 |
| 练习内容与功能 | E01—E40 完整题目、代码与复盘自动保存、跨源 Worker 运行、停止/超时、结果与控制台、提示/参考标记、尝试和独立/参考证据历史；310 用例、120 样例通过，80 个典型错误实现被拒绝。E25—E40 是隔离 JavaScript 模型，不创建 DOM，不运行 React、Vue 或 TypeScript 编译器 |
| 搜索 | 中英别名、内容ID、全半角归一、分档排序；完整目录、正文、练习题面可检索；提示与折叠参考答案不进入练习全文索引，待编写条目定位目录锚点 |
| 本地练习数据 | 练习草稿、复盘、运行结果和通过证据自动保存在浏览器，并处理跨页冲突与未保存离开。笔记、收藏、阅读位置、补强和复习进度仍留在同一份数据中，供已有备份校验；这些页面入口已移出 |
| 已移出的页面 | 总览、侧栏、复习计划、我的积累、设置与数据页已按 D16—D18 移出。顶栏只保留知识地图、动手练习、AI 工程和搜索。已保存的正文字号仍会作用到页面 |
| 运行器 | 独立 origin、Worker、超时/停止、消息校验、CSP；已接入全部 40 道题的受信 harness |

## 历史验证证据（2026-09-30）

- typecheck、lint、build、build:runner 已通过。
- verify:runner：本机 Chrome 验证跨源隔离、Worker 无 DOM、网络阻断、超时和主动停止。
- verify:store：临时 Chrome 上下文验证保存恢复、冲突、备份预检、无效输入不改原库、导入切换和恢复；新增数据集身份检查、切换事务主动中断时原库不变。
- verify:personal：自动保存后刷新、两页面写入冲突、不丢输入、切页保护、我的笔记，以及导出/确认/导入/恢复的完整界面操作。
- verify:search：闭包/closure、全角英文、英文短语、特殊字符与空查询。
- verify:content：文章路径、章节深链接、内部来源检查、正文与示例解释搜索、AI 阅读和 390px 无横向溢出；确认阅读区不再出现目录、来源核验或笔记。
- verify:articles：十八篇文章的 94 个代码示例在临时空白 Chrome 页面运行并核对输出，其中 6 个 TypeScript 示例通过 strict 与 noUncheckedIndexedAccess 类型检查。模块示例按 ES 模块执行。Worker 示例在专用 Worker 中核对复制与转移。
- verify:closures：12 个原创教程示例输出通过，包含循环、TDZ、微任务和事件监听清理。
- verify:catalog：16 个专题页面各有 8 个单元，练习 40、AI 20；204 条搜索文档 ID 唯一；AI 分类无遗漏或重复；知识、AI、练习搜索跳转锚点与焦点正确；390px 三类目录无横向溢出。
- verify:visual：生成 1440/1024/390px 阅读页截图，并检查横向溢出。已人工查看三种尺寸，截图位于 `docs/verification/`。阅读页在手机隐藏底栏，统一单栏，不显示页内目录、来源核验或笔记区。

截图：[桌面](verification/reading-1440.png) · [平板](verification/reading-1024.png) · [手机](verification/reading-390.png)。

## 未完成

- 完整浏览器矩阵（桌面及移动端、当前与上一版本）与人工读屏走查未完成，不能声明 M0—M5 全部正式验收通过。
- 当前仅本机 Chrome 临时上下文验证。受控原生配额拒绝已验证，不等同物理磁盘耗尽或所有设备配额。
- 目标部署的双 origin、静态服务器 CSP 响应头和恢复路由尚未实测。
- 首页实验室性能已测，真实用户 INP、完整移动设备性能尚未测。

## 实现约定

- 全部目录来自设计文档 07/08/09，`scripts/sync-catalog.py` 生成 `src/content/catalog.json`，页面通过 `src/content/catalog.ts` 读取；每次同步检查 128/40/20 的规模及 ID 唯一性。不再维护只含两条知识点的页面列表。
- 已有 AI 任务契约试读的持久化 contentId 为 AI01，实际目录归属应为 AI02。使用 `catalogId: AI02` 修正目录关联，并保留原 contentId 和 URL，避免已有私人笔记丢失。AI01模型基础已使用独立持久化ID `AI01-foundations` 发布，并通过 `catalogId: AI01` 关联目录；原任务契约的AI01记录键保持不变。

- 内容目前存于独立 `src/content/articles.ts`（长篇闭包教程单独位于 `src/content/knowledge/closures.ts`），不在页面复制正文。已移除含糊的试读标记。`manifest.ts`提供公开元数据，`aiContracts.ts`补AI附加合同，`learningContent.ts`维护卡片与关联；`verify:p0`在构建时校验发布清单与引用。
- 整篇笔记稳定键 `note:<contentId>:whole` 保留；章节笔记使用稳定章节 ID，收藏独立保存。私人原文不会被系统改写。
- 保存时同时比较 datasetId 和记录 revision。导入后旧页面不能用相同 revision 覆盖新数据集；冲突界面保留两份文字，由用户选择。
- 当前导入在同一 IndexedDB 事务中暂存、核验并切换 activeDatasetId；任一步失败整笔回滚。原数据作为唯一恢复点保留，再次导入前必须处理恢复点。
- 导入只保留白名单字段，日期必须是规范 UTC ISO 时刻，修订号必须为安全整数。导入个人文字与代码作为文本；仅用户主动点击运行时，练习代码进入跨源 Worker。
- 笔记编辑用 React Router 的数据路由阻止未保存的站内切页；自动保存成功后继续原跳转。失败或冲突时留在当前页，提供复制和明确放弃操作。关闭或硬刷新由浏览器未保存提示保护。
- 跨标签页变更通过 BroadcastChannel 通知；维护操作检查未保存输入，租约与心跳处理崩溃页面。数据集身份与事务版本比较防止旧页面覆盖新库。

每次继续开发先读取本文与 [交付计划](design/13-delivery-plan.md)，保留当前用户数据，按完整验收合同推进。

## D14 阅读修订

用户要求文章深入讲解，移除正文目录、来源核验和个人见解区；统一阅读壳已同步修改。笔记入口移到我的积累，持久化键未变。搜索索引包含示例解释；章节深链接继续可用。verify:closures 实际执行 12 个示例核对输出，不执行读者输入。

## D15 全站教程标准

用户已确认所有知识与 AI 文章采用深入教程标准，仓库 AGENTS.md、内容契约、交接决策与验收已同步。事件循环 10 节、TypeScript 9 节、AI 任务合同 10 节；三篇扩写保留原内容 ID、URL 和已有章节锚点。模板文本仅供复制，自动示例验证不执行提示词。

K01 与 K02 的各 8 个单元已按同一深入教程标准开放。2026-10-08已补齐K03-02与K04—K16各前两篇，其余P1目录单元仍待编写。文章质量与正式发布元数据/卡片配齐是不同门槛。


## 2026-10-08 P0 内容补齐验证

- `typecheck`、`lint`、`build`已运行通过；构建自动执行`verify:p0`。
- `verify:p0`：32知识+16AI+24练习，96张P0卡（总120），4套模板、3个案例，稳定ID/路径、元数据、来源协议、有效卡片锚点、双向关联与204个搜索ID唯一。
- `verify:articles`：60篇文章、207个独立浏览器示例、9个严格TypeScript示例；二轮修正了WeakMap非注册Symbol事实、浏览器全局命名冲突及Harness稀疏数组误通过。
- `verify:exercises`：24题、182行为用例、72可见样例、48错误实现拒绝；虚拟时钟控制时间，报告包含内容与验证器SHA256，见[报告](verification/exercises.json)和[harness说明](verification/exercise-harness.md)。
- `verify:p0-ui`：84桌面详情路由、84个390px详情页面；卡片展开与原文焦点、案例和题目默认折叠、ID搜索、无效路由恢复均通过，0 pageerror。见[报告](verification/p0-ui-report.json)。代表截图为`verification/p0-{knowledge,ai,practice}-{desktop,mobile}.png`，均已人工查看。
- `verify:catalog`、`verify:search`、`verify:content`、`verify:personal`已运行通过；原笔记自动保存、刷新、跨标签冲突、切页保护及备份导入恢复无回归。
- 本节为 2026-10-08 内容交付记录；练习工作台、复习、收藏与阅读位置在下述 2026-10-09 功能交付中接入。
- 此次内容交付时单包 gzip 约397KiB。后续已拆分路由、正文与练习包，当前首页预算与实验室验证见下节。

上方2026-09-30的验证细节是历史证据；本节记录本次新增内容及检查范围，不把未执行的浏览器、读屏和配额测试写成通过。

## 2026-10-09 P0 功能交付与验证

- `typecheck`、`lint`、`build`、`build:runner` 全部通过；构建同时校验公开元数据与 P0 内容合同。全新数据首页为零，没有示例个人记录。
- `verify:personal-domain`、`verify:review`、`verify:practice-domain`：白名单/非法输入、时区与日历边界、队列与评分幂等、撤销、题目修订、辅助不可撤回、独立/参考证据与历史裁剪规则通过。
- `verify:learning-store`：schema 1 迁移与 schema 2 完整状态、事务回滚、恢复、并发、删除 CAS、跨页未保存保护与租约恢复通过。
- `verify:real-quota`：Chrome 受控站点额度下捕获原生 `QuotaExceededError`，整库未改变；解除限制后导入与恢复成功。其他维护错误另以故障注入验证，见 [范围说明](verification/p0-real-quota.md) 与 [报告](verification/p0-real-quota-report.json)。
- `verify:practice-runner`：全部 24 题参考实现和 48 个错误实现经过真实跨源浏览器运行器验证；宿主页存储隔离、外部网络阻断、超时/停止和未处理异步失败检查通过。见 [报告](verification/practice-browser.json)。
- `verify:practice-ui`：自动保存/刷新、复盘、独立/参考证据、持久提示、双击单运行、改回原文仍标旧结果、跨页冲突、切页保护、卸载清理、运行器不可用和剪贴板恢复通过。见 [报告](verification/practice-ui-report.json)。
- `verify:review-ui`：真实订阅与会话、答案揭示前快捷键禁评分、回答/显隐刷新、保存失败不前进、跨页冲突、撤销含最后一张、暂停与额外回顾、无效会话恢复通过。见 [报告](verification/review-ui-report.json)。
- `verify:learning-ui`：阅读位置恢复且章节链接优先、显式已读/撤回、收藏/补强、文章与章节笔记、删除确认、设置、搜索筛选、320/360/390/768/1024/1440px 无整页横向溢出通过。见 [报告](verification/p0-functions-personal.json)。
- 原 `verify:personal`、`verify:content`、`verify:search`、`verify:catalog` 回归通过；`verify:p0-ui` 再次覆盖 84 个桌面与 84 个移动详情路由，0 页面异常。
- `verify:performance`：最终生产构建五次冷缓存首页测量，390px、10Mbps、100ms RTT、4 倍 CPU 节流；检查 LCP≤2.5秒、CLS≤0.1、首页 JS gzip≤250KiB 与 1000 文档搜索 p95≤100ms。见 [原始报告](verification/p0-performance.json)。这是实验室证据，不含真实用户 INP；搜索计时排除索引加载。

截图：[练习代码](verification/practice-code-390.png) · [练习结果](verification/practice-results-390.png) · [复习会话](verification/review-active-mobile.png) · [复习完成](verification/review-completed-mobile.png) · [个人记录](verification/p0-functions-personal-390.png)。截图已生成并检查；自动键盘与宽度检查不替代人工读屏验收。

启动必须同时运行主站与独立运行器，部署与旧备份兼容说明见 [README](../README.md)。本轮不包含上线或 Git 提交。

## 2026-10-09 AI P1 内容补齐

本次范围是 AI13、AI14、AI17、AI18 四篇，AI 目录现有 20 篇全部可读；知识、练习与功能的其他 P1 规划不计作本次完成。

- AI13：退款政策案例串联分块、权限与业务版本过滤、重排、引用失效、独立检索与生成评估；明确 RAG 不保证新鲜度、授权或正确结论。
- AI14：逐字节 UTF-8/CRLF 的 SSE 示例，区分字节流、事件与业务完成；当前尝试、用户取消、迟到事件、断流草稿、结构化 final 和重试；教学解析器支持范围明确。
- AI17：清单导入案例的依赖图、文件所有权、基线条件提交、交接与合并验收，以及并行开销；外部权限不由其他 Agent 消息扩大。
- AI18：固定任务与质量门槛，包含重试、工具及人工的成本账本、冷暖缓存分组、TTFT/完成延迟、p95与预算预留/幂等结算；所有费用和耗时数字明确为人工实验数据。

新增 10 个完整 JavaScript 示例、14 张回忆卡及 4 份可填写任务模板。两轮作者自审加独立技术复核，修正用户取消状态与预算任务 ID 复用边界。官方资料的核验范围见 `src/content/ai/p1-retrieval-stream.json` 与 `p1-collaboration-cost.json`，不以来源链接替代运行证据。

验证命令与证据：

- `typecheck`、`lint`、`build`，构建门禁覆盖 20 篇 AI 附加合同、P1 正文、卡片锚点、模板、搜索与公开元数据。
- `ZHIXU_ARTICLE_IDS=AI13,AI14,AI17,AI18 npm run verify:articles`：独立 Chrome 空白页面核对 10 个新增示例；[报告](verification/article-examples-report.json)含源码 SHA256 与实际输出，不连接模型或真实后端。2026-10-12 同一命令会覆盖到 11 个示例，因为 AI13 增补了生成审阅例子；AI14、AI17、AI18 的证据仍是 2026-10-09 的运行记录。
- `verify:ai-p1-ui`：目录全部可读、新文章 ID 搜索、正文、卡片原文焦点、复习订阅刷新恢复、1440/390/320px 阅读；[报告](verification/ai-p1-ui-report.json)。
- `verify:p0-ui`：88 个桌面与 88 个移动详情路由、折叠卡片与解析、P1 ID 搜索和无效路由恢复；[报告](verification/p0-ui-report.json)。

截图位于 `verification/ai-p1-AI{13,14,17,18}-{1440,390}.png`，已人工检查四篇手机截图。新增内容未接入在线模型调用，流式示例也不代表完整生产 SSE 库；完整浏览器矩阵和人工读屏限制仍如上所述。

## 2026-10-12 K04 浏览器专题补齐

K04-03—K04-08 已补齐，K04 的八个单元全部可读。新增内容覆盖事件传播与默认行为、存储与配额、观察器与视口、导航与历史恢复、Service Worker 与离线、Web 平台能力与渐进增强。每篇从具体问题解释机制，包含完整示例、输出原因、错误路径、工程取舍与适用边界；共新增 18 个可执行示例、18 张回忆卡。知识正文现有 50 篇，与 20 篇 AI 合计 70 篇，卡片共 152 张。

- 注册、公开元数据、前置知识、正文搜索和卡片锚点已接入；构建门禁增加六篇 K04 P1 的正文、示例与卡片检查。
- `typecheck`、`lint`、`build`、`git diff --check` 通过。正文包仍有大于 500 kB 的构建提示，本轮没有额外拆包。
- `verify:k04`：临时独立 loopback HTTP origin、Chrome 154.0.8037.99，核对 18 个作者示例的实际输出。涵盖真实 DOM 事件、IndexedDB 事务中止与回读、三类观察器、History 与 Cache Storage；配额拒绝、剪贴板拒绝、导出取消及部分路由/缓存决策采用明确标注的教学替身，不冒充真实设备或权限验收。见 [示例报告](verification/k04-article-examples.json)。
- 同一命令用文章原文中的 Worker 与完整离线 HTML 实测首次未受控、重新导航受控、断网导航回退、恢复在线、新版本等待及旧缓存保留；不在学习站 origin 注册 Worker。见 [平台报告](verification/k04-platform-report.json)。
- `ZHIXU_ARTICLE_REPORT=k04-all-article-regression.json npm run verify:articles`：70 篇文章、240 个浏览器示例、9 个严格 TypeScript 示例全部通过。新增 origin fixture 支持仍只加载仓库作者内容；新报告与已有报告分开保存。见 [全量回归](verification/k04-all-article-regression.json)。
- `verify:k04-ui`：K04 八个单元全部可读；六篇新增文章的 ID 搜索、完整正文、深链接刷新、18 张卡片默认折叠及原文焦点、1440/390/320px 回流通过，0 pageerror。见 [界面报告](verification/k04-ui-report.json)。截图为 `verification/k04-K04-{03…08}-{1440,390}.png`，六张手机截图已人工查看。

来源于 2026-10-12 核对 DOM、Storage、HTML History、Intersection Observer、Service Workers、Permissions 规范与对应 MDN 页面；链接与核验日期存于文章及发布清单。完整跨浏览器矩阵、真实设备权限、物理配额与 bfcache 命中矩阵未在本轮验收。E25—E40 配套 DOM/框架/类型练习仍未制作；本轮只补知识内容，不启用学习站离线功能。

## 2026-10-12 K03 TypeScript 专题补齐

K03-03—K03-08 已补齐，K03 的八个单元全部可读。新增六篇分别覆盖泛型与约束、条件与映射类型、函数类型与变型、工具与领域类型、声明文件与公共库、复杂类型可维护性。每篇围绕具体工程问题解释类型关系、完整代码、失败路径、取舍与适用边界；新增 18 个 TypeScript 正向示例、7 个不执行的编译反例、18 张回忆卡。

- 文章注册、公开元数据、前置知识、搜索和卡片原文锚点接入；构建门禁新增六篇 K03 P1 的正文、示例与卡片检查。当前共 56 篇知识、20 篇 AI、170 张卡片，规划目录规模仍为 128/40/20。
- `typecheck`、`lint`、`build`、`git diff --check` 通过；正文延迟包仍有大于 500 kB 的构建提示，本轮没有额外拆包。
- `ZHIXU_ARTICLE_IDS=K03-03,K03-04,K03-05,K03-06,K03-07,K03-08 ZHIXU_ARTICLE_REPORT=k03-article-examples.json npm run verify:articles`：18 个示例先通过 TypeScript 6.0.3 的 strict 与 noUncheckedIndexedAccess，再在独立 Chrome 154.0.8037.99 页面核对全部预期输出。见 [示例报告](verification/k03-article-examples.json)。本次没有重新执行全部既有文章，K04 全量回归仍保留在前一节。
- `verify:k03-types`：七个原文编译反例均产生指定诊断；额外启用 exactOptionalPropertyTypes，验证属性缺席与显式 undefined 的差异，不使用忽略错误指令。见 [类型与公共包报告](verification/k03-types-report.json)。
- 同一命令从 K03-07 原文实现生成声明与 ESM/CommonJS JavaScript，在临时包的真实 exports 布局下验证 Bundler/ESNext、NodeNext ESM、NodeNext CommonJS 消费。两种 Node 消费者都实际输出 `7` 与 `true`；故意将声明返回值改成 string 后，number 消费点产生 TS2322。包与源码、导出清单、消费文件的 SHA256 随报告保存，不发布外部包。
- `ZHIXU_MAIN_ORIGIN=http://127.0.0.1:5183 npm run verify:k03-ui`：本轮专用开发实例验证八个可读单元、六篇新增文章的 ID 搜索、完整正文、深链接刷新、18 张卡片默认折叠及原文焦点、1440/390/320px 回流，0 pageerror。见 [界面报告](verification/k03-ui-report.json)。六张手机截图已人工查看，文件为 `verification/k03-K03-{03…08}-{1440,390}.png`。
- K03/K04 共享同一阅读验收脚本，保留 `verify:k04-ui` 入口；同一 5183 实例下 K04 分支回归通过。

于 2026-10-12 核对 TypeScript 官方 Handbook、模块/声明发布资料、exactOptionalPropertyTypes、satisfies 与官方性能指导，来源链接和日期存于文章及发布清单。当前证据只覆盖已安装 TypeScript 6.0.3、Node 与临时消费项目，不代表旧编译器、所有打包器或大型项目类型性能已验收。E33/E34 的可执行类型练习仍未制作。

## 2026-10-12 K05 HTML 与 CSS 专题补齐

K05-03—K05-08 已补齐，K05 的八个单元全部可读。新增六篇分别覆盖 Flex 与 Grid 约束、响应式与容器查询、层叠层与选择器、动画与交互反馈、国际化排版与逻辑属性、复杂布局诊断。每篇用空白页几何或计算样式实验解释机制，并写明失败路径、取舍和适用边界；新增 20 个浏览器示例、18 张回忆卡。

- 文章注册、公开元数据、前置知识、搜索和卡片原文锚点接入；构建门禁新增六篇 K05 P1 的正文、示例与卡片检查。当前共 62 篇知识、20 篇 AI、188 张卡片，规划目录规模仍为 128/40/20。搜索文档仍为 204 条：新正文替换了同 ID 的待编写目录条目。
- E27—E29 仍未制作，文章只说明这些练习尚未可做，不显示空的练习入口。
- `typecheck`、`lint`、`build`、`git diff --check` 通过。`build` 先执行 `verify:p0`。正文延迟包 `catalog` 仍大于 500 kB，本轮没有额外拆包。
- `npm run verify:k05`：Chrome 154.0.8037.99 空白页核对 20 个作者示例的实际输出，包含 Flex/Grid 尺寸、容器查询、层叠层、动画矩阵、逻辑属性物理边、sticky 相对距离、fixed 包含块和 Popover 打开状态。见 [示例报告](verification/k05-article-examples.json)。本次没有重新执行全部既有文章。
- `ZHIXU_MAIN_ORIGIN=http://127.0.0.1:5185 npm run verify:k05-ui`：本轮专用开发实例验证八个可读单元、六篇新增文章的 ID 搜索、完整正文、深链接刷新、18 张卡片默认折叠及原文焦点、1440/390/320px 回流，0 pageerror。见 [界面报告](verification/k05-ui-report.json)。六张手机截图已人工查看，文件为 `verification/k05-K05-{03…08}-{1440,390}.png`。

于 2026-10-12 核对 CSS Flexbox、Grid、Conditional Rules、Cascade、Writing Modes、Logical Properties、Position、Media Queries、Web Animations 与 HTML Popover 的对应章节，来源链接和日期存于文章及发布清单。几何数字来自本机 Chrome 空白页，不代表所有引擎、字体和缩放组合。完整浏览器矩阵与人工读屏仍未验收。

## 2026-10-12 K06、K07 网络与 React 专题补齐

K06-03—K06-08、K07-03—K07-08 已补齐，网络与 React 两个专题各八个单元全部可读。K06 覆盖连接与协议前提、Cookie 与刷新、同源和 CORS、SSE 与 WebSocket、大文件传输、接口契约。K07 覆盖组件身份与 key、状态所有权、并发体验与 Suspense、Hook 调用顺序、服务器组件边界、性能测量。协议选择、CORS 放行、协调和服务器组件都写成可执行的教学模型，并标明不是抓包、浏览器网络栈或 React 调度器源码。K07-07 标明客户端包为 React 19.3.0，示例不执行服务器组件。

- 文章注册、公开元数据、前置知识、搜索和卡片原文锚点接入；构建门禁新增十二篇正文、示例与卡片检查。当前共 74 篇知识、20 篇 AI、224 张卡片，规划目录规模仍为 128/40/20。搜索文档仍为 204 条：新正文替换了同 ID 的待编写目录条目。
- E30、E31、E36—E38 仍未制作，文章只说明这些练习尚未可做。E11—E13、E23、E24 继续指向既有异步题目，不作为这两专题的空练习入口。
- `typecheck`、`lint`、`build`、`git diff --check` 通过。`build` 先执行 `verify:p0`。正文延迟包 `catalog` 为 947.71 kB，本轮没有额外拆包。
- `npm run verify:k06`：Chrome 154.0.8037.99 空白页核对 18 个作者示例，包含 URL 源、协议前提、Cookie 属性、单次刷新、预检与响应暴露、SSE 分帧、Blob 分片和日期字符串。见 [示例报告](verification/k06-article-examples.json)。
- `npm run verify:k07`：同一 Chrome 核对 17 个作者示例，包含 key 配对、状态提升、过渡时间线、Hook 顺序、`Object.is` 依赖、服务器组件能力表和可见区间。见 [示例报告](verification/k07-article-examples.json)。本次没有重新执行全部既有文章。
- `ZHIXU_MAIN_ORIGIN=http://127.0.0.1:5186 npm run verify:k06-ui` 与 `verify:k07-ui`：本轮专用开发实例分别验证八个可读单元、六篇新增文章的 ID 搜索、完整正文、深链接刷新、18 张卡片默认折叠及原文焦点、1440/390/320px 回流，0 pageerror。见 [K06 界面报告](verification/k06-ui-report.json) 与 [K07 界面报告](verification/k07-ui-report.json)。十二张手机截图已人工查看，文件为 `verification/k06-K06-{03…08}-{1440,390}.png` 与 `verification/k07-K07-{03…08}-{1440,390}.png`。

于 2026-10-12 核对 RFC 9113、RFC 9114、RFC 6265、RFC 9110、RFC 3339、Fetch CORS、HTML 源与服务器发送事件、WebSockets、File API，以及 React 19 文档中的状态、列表、过渡、Suspense、Hook、服务器组件和 memo。来源链接返回 200。空白页里的模型只复现文档中的可观察结果，不代表生产抓包、真实长连接或 RSC 打包器已经验收。完整浏览器矩阵与人工读屏仍未验收。

## 2026-10-13 · 按目录顺序补齐 K08-03

- 新增「组件通信与状态所有权」深入教程，以订单数量为贯穿场景，解释副本与派生值、嵌套 props 修改、显式 modelValue/update:modelValue 合同、带校验的提交、版本化草稿、事件转发、只读注入与作用域。defineModel 只解释编译合同，未宣称执行 SFC 宏。
- 注册稳定 ID K08-03 与 `/knowledge/vue/component-communication-and-ownership`，补齐前置知识、公开版本/日期、全文搜索和 3 张默认折叠回忆卡。暂无本主题已交付独立题，未虚构练习入口。知识共 75/128 篇、AI 共 20/20 篇、回忆卡 227 张；K08-04—08 仍待编写，知识剩余 53 篇。
- 增加固定版本 Vue 3.5.43 开发验证依赖，隔离示例 fixture 通过 `/vue.mjs` 提供本地浏览器构建。本站仅展示代码，不挂载这些 Vue 示例，也不加载 Vue 运行时进入主站 bundle。
- `npm run verify:k08-03`：Chrome 中实际执行 6 个完整 ES 模块示例，核对无效输入、拒绝后恢复、共享嵌套对象绕过提交、草稿版本冲突、组件事件显式转发和必需注入缺失。见 [作者示例报告](verification/k08-03-article-examples.json)。没有调用真实订单接口，也没有验证服务端条件写入或库存权限。
- `npm run verify:k08-ui`：确认 8 个目录条目中仅前三节可读，五节仍待编写；新增文章 ID 搜索、所有正文节、3 张卡片及原文锚点焦点、深链接刷新、1440/390/320px 回流均通过，页面错误为零。见 [阅读报告](verification/k08-ui-report.json) 与桌面/手机截图；手机首屏已人工查看。本轮未做人工读屏验收。
- `ZHIXU_ARTICLE_IDS=K04-07,K08-03 ZHIXU_ARTICLE_REPORT=k08-fixture-regression.json npm run verify:articles`：既有 Service Worker 教程与新增 Vue 教程共 9 个作者示例通过，确认共享 fixture 的两种资源可以共存，见 [隔离服务回归报告](verification/k08-fixture-regression.json)。本轮未重新运行所有旧文章。
- `npm run typecheck`、`npm run lint`、`npm run build`、`npm run verify:search`、`git diff --check` 通过，构建自动执行 `verify:p0`。正文延迟包仍有既有的体积提示（本轮 catalog 969.50 kB），没有改动拆包策略；尚未提交或部署。
- 官方资料于 2026-10-13 核对：Vue Props、Component Events、Component v-model、Provide / Inject、State Management 与 SSR 指南；链接随文章元数据维护，阅读页面不新增来源模块。

## 2026-10-13 · 按目录顺序补齐 K08-04

- 新增「生命周期与组合式函数」深入教程，沿订单面板讲解 DOM 阶段、订阅释放、函数内独立状态与模块级共享、ref/getter 输入、返回 refs、同步钩子注册、异步 watcher 归属、每轮请求清理和独立 effectScope。对 KeepAlive、SSR、共享连接和 SFC 顶层 await 明确区分适用边界与实际验证范围。
- 注册 K08-04 与 `/knowledge/vue/lifecycle-and-composables`，补齐前置知识、公开元数据、全文索引和 3 张默认折叠回忆卡。知识现为 76/128 篇、AI 20/20 篇、回忆卡 230 张；知识剩 52 篇，下一节 K08-05。已有 K08-03 及未发布章节的身份和状态保留。
- `npm run verify:k08-04`：Vue 3.5.43 浏览器运行时中核对 8 个完整作者示例。涵盖卸载后订阅不再回调、状态独立与共享、输入快照、延迟注册错误、异步 watcher 泄漏与修复、初始化前卸载、旧失败不覆盖新成功、当前失败与空结果、卸载后迟到成功、scope 停止与缺失 scope。见 [作者示例报告](verification/k08-04-article-examples.json)。普通 Promise 延迟注册钩子的开发警告属于有意标注的错误实现，验证脚本不将警告当作输出断言；没有吞掉警告或把它称为成功注册。
- `npm run verify:k08-ui`：K08 八个目录条目中前四节可读、后四节待编写；同时复核 K08-03/04 的 ID 搜索、正文、6 张折叠卡片、原文锚点焦点、深链接刷新和 1440/390/320px 回流，页面错误为零。见 [阅读报告](verification/k08-ui-report.json) 与两篇的桌面/手机截图；K08-04 手机首屏已人工查看。没有人工读屏检查。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过，构建包含公开元数据生成与 `verify:p0`。本轮复用既有 Vue 开发依赖与隔离服务，没有新增运行依赖，也未重新执行所有旧文章；正文延迟包仍有既有体积提示（catalog 997.71 kB）。尚未提交或部署。
- 官方来源于 2026-10-13 核对：Vue Composables、Lifecycle Hooks、Reactivity Advanced/Utilities、Watchers、script setup、KeepAlive 与 SSR 指南。实际验证为浏览器生命周期与响应式 API，不包含 SFC 编译、KeepAlive、SSR、真实网络连接或真实服务端写入；loader 为显式标注的可控 Promise 教学替身。

## 2026-10-13 · 按目录顺序补齐 K08-05

- 新增「模板编译与更新优化」深入教程，沿订单页解释模板编译/render/mount/patch、静态缓存与提升、block 动态集合、补丁标记、稳定 props、业务 key、v-once 与 v-memo。区分编译优化、响应式调度、组件渲染次数与真实 DOM 更新，不以少更新掩盖旧界面。
- 注册 K08-05 与 `/knowledge/vue/template-compilation-and-updates`，补齐前置知识、版本边界、公开元数据、正文搜索与 3 张默认折叠回忆卡。知识现为 77/128 篇、AI 20/20 篇、回忆卡 233 张；知识剩 51 篇，下一节 K08-06。K08-06—08 仍待编写，未虚构独立练习入口。
- `npm run verify:k08-05`：Chrome 155.0.8059.40 与 Vue 3.5.43 完整浏览器构建中运行 7 个完整 ES 模块示例。实际编译作者固定模板，检查静态 VNode 缓存身份、dynamicChildren、TEXT/CLASS/PROPS/FULL_PROPS；实际挂载检查批处理、DOM 身份、旧属性移除、稳定 props 的调用计数、列表重排草稿错配与清空、v-once 冻结加载状态、遗漏 v-memo 依赖与修复。见 [作者示例报告](verification/k08-05-article-examples.json)。数字标记和 VNode 内部形状是本版本观察，不是业务 API 保证。
- `npm run verify:k08-ui`：K08 八个条目中前五节可读、后三节待编写；复核 K08-03—05 的 ID 搜索、正文渲染、9 张折叠回忆卡、原文锚点焦点、深链接刷新与 1440/390/320px 回流，页面错误为零。见 [阅读报告](verification/k08-ui-report.json) 和三篇的桌面/手机截图；K08-05 手机首屏已人工查看。本轮没有人工读屏检查。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过；构建包含公开元数据生成与 `verify:p0`。复用现有 Vue 开发依赖和隔离服务，未新增依赖，未重新运行所有旧文章；正文延迟包仍有既有体积提示（catalog 1,020.90 kB）。尚未提交或部署。
- 官方资料于 2026-10-13 核对：Vue Rendering Mechanism、Performance、List Rendering、Built-in Directives、Render Functions 与 Security。另检查已安装 `@vue/compiler-dom` 的真实生成代码；浏览器报告校验同版本完整构建的实际编译与更新。所有模板来自仓库作者固定源码，不编译用户输入或备份；不包含 SFC 构建、SSR、水合或生产性能基准验收，也不宣称性能提升百分比。

## 2026-10-13 · 按目录顺序补齐 K08-06

- 新增「路由、表单与状态管理」深入教程，沿订单列表与详情编辑区分 URL、已确认数据和本地草稿，讲解 query 规范化、push/replace/返回、参数复用、按身份观察、更新与离开守卫、导航失败、数字输入校验、提交基线、失败重试和共享存储作用域。
- 注册 K08-06 与 `/knowledge/vue/routing-forms-and-state`，补齐前置知识、版本/验证边界、公开元数据、全文搜索及 3 张默认折叠回忆卡。知识现为 78/128 篇、AI 20/20 篇、回忆卡 236 张；知识剩 50 篇，下一节 K08-07「SSR 与水合」。K08-07/08 保持待编写，没有虚构框架练习入口。
- 新增 Vue Router 4.6.4 固定开发依赖；隔离服务把官方全局构建包装为 `/vue-router.mjs`，与 `/vue.mjs` 共用同一 Vue 实例。仅在作者示例页面使用，未改变主站 React 路由或引入主站运行依赖；报告增加实际 Router 版本记录。
- `npm run verify:k08-06`：真实 Vue 3.5.43/Router 4.6.4 中验证 7 个完整 ES 模块示例，覆盖重复/空 query、无效页码、内存历史返回、参数复用与无关标签变化、aborted/duplicated 导航、数字修饰符的字符串边界、严格原文校验、失败保留草稿、保存期编辑/重复提交防护、非法响应拒绝与重试、共享视图及应用隔离。见 [作者示例报告](verification/k08-06-article-examples.json)。保存接口是显式教学 Promise，最小 store 是 Vue 模型，未冒充真实 API 或 Pinia 执行。
- `npm run verify:k08-ui`：8 个 K08 目录条目中前六节可读、后两节待编写；复核 K08-03—06 的 ID 搜索、正文渲染、12 张折叠回忆卡、原文锚点焦点、深链接刷新和 1440/390/320px 回流，页面错误为零。见 [阅读报告](verification/k08-ui-report.json) 与四篇的桌面/手机截图；K08-06 手机首屏已人工查看，未做人工读屏检查。
- `ZHIXU_ARTICLE_IDS=K04-07,K08-04,K08-06 ZHIXU_ARTICLE_REPORT=k08-router-fixture-regression.json npm run verify:articles`：既有 Service Worker、Vue 生命周期及新路由教程共 18 个作者示例通过，见 [隔离服务兼容性报告](verification/k08-router-fixture-regression.json)；没有重新运行所有旧文章。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过，构建包含公开元数据生成和 `verify:p0`；正文延迟包仍有既有体积提示（catalog 1,050.59 kB）。本轮没有更改拆包策略，尚未提交或部署。
- 官方资料于 2026-10-13 核对：Vue Router Dynamic Matching、Composition API、Navigation Guards/Failures、Programmatic Navigation、History Modes；Vue Form Input Bindings、State Management；Pinia Defining a Store。实测为内存历史，不包含浏览器后退按钮、重载、外部离开、部署深链接回退、Pinia、持久化、SSR 或服务端权限/并发写入验收；这些边界随正文说明。

## 2026-10-13 · 按目录顺序补齐 K08-07

- 新增「SSR 与水合」深入教程，沿订单按钮区分服务端字符串与客户端交互，讲解共享应用工厂、createSSRApp 接管与 createApp 重建、首次状态不一致、浏览器解析修正、跨请求污染、服务端生命周期与公开 JSON 状态传输。
- 注册 K08-07 与 `/knowledge/vue/ssr-and-hydration`，补齐前置知识、公开元数据、全文索引和 3 张默认折叠回忆卡。知识现为 79/128 篇、AI 20/20 篇、回忆卡 239 张；知识剩 49 篇，下一节 K08-08「复杂页面性能与调试」。最后一节保持待编写，无空练习入口。
- 复用已安装 Vue/server-renderer 3.5.43，未新增依赖。新增受审查的 `scripts/lib/ssr-order-app.mjs` 工厂，Node 服务真实生成 SSR HTML，隔离浏览器导入同一工厂；门禁核对正文工厂源码与实际文件一致。主站仅显示代码，没有部署 SSR 服务。
- 作者示例类型增加 language:node，verify:articles 在固定仓库目录以独立 Node ES 模块进程执行作者源码，限制执行时间并严格核对 stdout/stderr；不接受用户代码或备份。报告分别统计浏览器/Node 示例、记录 Node 版本和工厂源码哈希，并保留浏览器警告/错误诊断。
- `npm run verify:k08-07`：Chrome 155.0.8059.40、Node v22.22.3、Vue/server-renderer 3.5.43 下，5 个浏览器与 3 个 Node 作者示例通过。实际验证 SSR 字符串与事件未传输、匹配水合保留按钮身份并安装交互、普通挂载重建、文字 mismatch 诊断与交互恢复、HTML 解析结构、并发状态串用与隔离、serverPrefetch 等待、客户端钩子不在服务端执行、script JSON 结束标签边界和状态校验。见 [作者示例报告](verification/k08-07-article-examples.json)。mismatch 是明确标注的错误实现，报告保留警告和水合错误日志，不称其为无诊断正常路径。
- `npm run verify:k08-ui`：K08 八个条目中前七节可读、最后一节待编写；复核 K08-03—07 的 ID 搜索、正文渲染、15 张折叠卡片、原文锚点焦点、深链接刷新与 1440/390/320px 回流，页面错误为零。见 [阅读报告](verification/k08-ui-report.json) 及五篇桌面/手机截图；K08-07 手机首屏已人工查看，没有人工读屏验收。
- `ZHIXU_ARTICLE_IDS=K04-07,K08-06,K08-07 ZHIXU_ARTICLE_REPORT=k08-ssr-fixture-regression.json npm run verify:articles`：既有 Service Worker、Vue Router 与新 SSR 教程共 15 个浏览器、3 个 Node 示例通过，见 [兼容性报告](verification/k08-ssr-fixture-regression.json)；没有重新运行全部旧文章。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过，构建包含公开元数据生成与 `verify:p0`。正文延迟包仍有既有体积提示（catalog 1,074.98 kB），本轮不改拆包策略。尚未提交或部署。
- 官方资料于 2026-10-13 核对：Vue SSR Guide、SSR API、Application API、Lifecycle Hooks 与 Security。实际验证为 Node 渲染和隔离浏览器接管，不包含 SFC 双构建、生产 SSR、真实接口授权、公开缓存分区、流式响应、Teleport、部分水合或所有表单输入保留；无效嵌套仅验证浏览器解析，不声称完整水合恢复。

## 2026-10-13 · K08 全章完成

- 补齐 K08-08「复杂页面性能与调试」，通过 7 个真实 Vue 浏览器示例解释提交测量窗口、分支依赖调试、computed 结果身份、shallowRef 内部修改与根替换、markRaw 嵌套身份、固定高度虚拟窗口、同步与批处理 watcher。覆盖空列表、滚动末端、非法高度和停止后的行为，不把计数或单次窗口当成生产性能提升。
- K08-01/02 保留原有教学模型、稳定 ID 和 URL，将既有 Vue 项目片段补成完整可执行示例：实际核对 toRef/停止后的属性连接，以及 useSearch 取消、旧失败忽略、当前失败和停止后不再启动请求。确认日期更新为 2026-10-13；没有改变卡片含义与个人数据合同。
- 注册 K08-08 与 `/knowledge/vue/complex-page-performance-and-debugging`，补齐前置知识、公开元数据、搜索和 3 张回忆卡。K08 八篇全可读，专题有 22 张回忆卡。知识现为 80/128 篇、AI 20/20 篇、正文共 100 篇、全站回忆卡 242 张；知识剩 48 篇（K09—K16 各 6 篇）。
- 新增 `npm run verify:k08` 整章检查命令。Chrome 155.0.8059.40、Vue 3.5.43、Router 4.6.4、Node v22.22.3 下全部 8 篇、51 个作者示例通过：48 浏览器、3 Node。见 [K08 全章示例报告](verification/k08-all-article-examples.json)。水合与延迟注册的故意错误示例诊断随报告保留；未执行用户输入或真实服务接口。
- `npm run verify:k08-ui` 扩展为核对全部 8 篇和 22 张卡片：目录无待编写条目、每个 ID 搜索打开正文、所有节渲染、卡片默认折叠及原文锚点焦点、深链接刷新、1440/390/320px 回流通过，页面错误为零。见 [完整阅读报告](verification/k08-ui-report.json) 与八篇桌面/手机截图；K08-08 手机首屏已人工查看，没有人工读屏验收。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过，构建包含公开元数据生成和 `verify:p0`；K08 发布门禁由部分 ID 清单改为校验全部六个扩展单元。没有重新运行 K08 以外全部文章，正文延迟包仍有既有体积提示（catalog 1,101.62 kB）。尚未提交或部署。
- 官方资料于 2026-10-13 核对：Vue Performance、Reactivity in Depth、Reactivity Advanced、Lifecycle Hooks、Watchers；Chrome Runtime Performance 与 MDN Performance mark。实际性能主题验证为机制与行为，不包含生产耗时/FPS/INP 基准、可变行高、完整虚拟控件焦点/读屏或复杂表格编辑验收，边界随正文明确说明。

## 2026-10-13 · K09 全专题完成

- 补齐 K09-03—08：Tree shaking 与副作用、转译/polyfill/目标环境、代码分割与资源缓存、Monorepo 与包边界、Source map 与线上排查、CI/CD 与发布策略。每篇包含问题场景、完整可复现示例、输出原因、失败路径、适用边界与自检；真实工具实验与教学发布模型分别说明。
- 注册六篇正文、前置知识、来源与版本，并新增 18 张回忆卡。K09 全部 8 篇、22 张卡片可读；累计知识 86/128、AI 20/20，共 106 篇文章与 260 张卡片。知识剩余 42 篇，即 K10—K16 各 6 篇。
- `npm run verify:k09`：全部 30 个示例通过（24 Node、6 浏览器）。真实验证 Rolldown 1.2.11 产物、TypeScript 6.0.3 转译/语义诊断、Node 22.22.3 包导出和 SourceMap，以及临时本地 HTTP 响应。任务、缓存键、产物配对、灰度与发布状态为明确教学模型，未连接真实 CI/CD、CDN 或监控账户。报告记录代码和辅助源码摘要，见 [执行报告](verification/k09-all-article-examples.json) 与 [复现说明](verification/tooling-harness.md)。
- `npm run verify:k09-ui`：八节目录全部可读，八篇均检查 ID 搜索进入、正文渲染、22 张卡片默认折叠/原文焦点、深链接刷新，以及 1440/390/320px 无页面横向溢出。发现长错误码导致 320px 段落溢出，给正文段落补齐与列表一致的换行规则后全量重跑通过。已人工查看六篇新增教程的 390px 首屏；见 [UI 报告](verification/k09-ui-report.json)，截图位于同目录。
- `typecheck`、`lint`、`build`、内容门禁和 `git diff --check` 通过。构建仍有 catalog chunk 超过 500 kB 的警告，本次不调整构建架构。没有新增可练题、执行线上发布或 Git 提交。

## 2026-10-13 · K10 全专题完成

- 补齐 K10-03—08：首屏与关键资源、列表渲染与内存、缓存与预取、包体分析与依赖治理、性能预算与回归、大型页面诊断案例。每篇从订单页的具体失败写起，示例包含输出原因、失败路径和适用边界。
- 注册六篇正文、前置知识和 18 张回忆卡。K10 全部 8 篇、22 张卡片可读；累计知识 92/128、AI 20/20，共 112 篇文章与 278 张卡片。知识剩余 36 篇，即 K11—K16 各 6 篇。E25、E30、E40 仍未开放。
- DOMParser、固定行高窗口和节点计数在隔离空白页执行。K10-06 用 Rolldown 1.2.11 比较固定作者模块的标记和相对大小。发现时钟、字体周期、单队列带宽、缓存容量、预算噪声带和诊断接受条件是明确教学模型，不测量真实用户 LCP/INP，也不连接监控或 CI。
- `npm run verify:k10`：8 篇、24 个浏览器示例和 1 个 Node 示例通过。见 [执行报告](verification/k10-all-article-examples.json)。没有重新运行 K10 以外的文章。
- `npm run verify:k10-ui`：八节目录全部可读，八篇均检查 ID 搜索进入、正文渲染、22 张卡片默认折叠及原文焦点、深链接刷新，以及 1440/390/320px 无页面横向溢出，页面错误为零。已人工查看 K10-03—08 的 390px 首屏。见 [UI 报告](verification/k10-ui-report.json)，截图位于同目录。
- `typecheck`、`lint`、`build`、内容门禁和 `git diff --check` 通过。构建仍有 catalog chunk 超过 500 kB 的警告（本轮 1,235.16 kB），本次不调整构建架构。没有新增可练题、执行线上发布或 Git 提交。
- 官方资料于 2026-10-13 核对：web.dev 的 LCP、preload、content-visibility、code splitting、performance budgets 与 Web Vitals；MDN 的 font-display、HTTP caching、Cache-Control、Vary、prefetch、preload、DOMParser 与 createElement；CSS Fonts 的 font-display；Chrome DevTools Performance。链接返回 200。

## 2026-10-13 · K11 全专题完成

- 新增 K11-03 至 K11-08 六篇正文与 18 张回忆卡，K11 八个单元全部可读。知识正文 98/128，文章 118，回忆卡 296。剩余知识正文为 K12–K16 各六篇，共 30 篇；E25–E40 仍未开放。
- `npm run verify:k11`：8 篇文章、19 个浏览器示例通过，报告 `docs/verification/k11-all-article-examples.json`。示例是固定输入上的策略判断，不是完整 CSP 解析器、npm 安装、浏览器沙箱或真实请求。
- `npm run verify:k11-ui`：八个可读单元、8 篇文章、22 张卡、专题搜索、重载和 1440/390 通过，报告 `docs/verification/k11-ui-report.json`。已查看 K11-03 至 K11-08 的 390px 首屏，标题、摘要和问题段完整，未见横向溢出。没有做屏幕阅读器验收。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过。生产构建目录块 `catalog-45-CD3tA.js` 1,284.49 kB，仍超过 500 kB，未做拆分。文中来源地址已检查为 HTTP 200。下一篇从 K12-03 开始。

## 2026-10-13 · K12 全专题完成

- 新增 K12-03 至 K12-08 六篇正文与 18 张回忆卡，K12 八个单元全部可读。知识正文 104/128，文章 124，回忆卡 314。剩余知识正文为 K13–K16 各六篇，共 24 篇；E25–E40 仍未开放。E01 仍只关联 K12-02，本轮没有新增练习。
- `npm run verify:k12`：8 篇文章、18 个浏览器示例通过，报告 `docs/verification/k12-all-article-examples.json`。替身、虚拟时钟、隔离计划、属性判断和门禁记录是固定输入上的教学模型。K12-05 在空白页查询真实元素。它们不是测试框架、浏览器事件循环或持续集成。
- `npm run verify:k12-ui`：八个可读单元、8 篇文章、22 张卡、专题搜索、重载和 1440/390 通过，报告 `docs/verification/k12-ui-report.json`。已查看 K12-03 至 K12-08 的 390px 首屏，标题、摘要和问题段完整，未见横向溢出。阅读检查会计入已关联练习的标题，K12-02 因此包含 E01。没有做屏幕阅读器验收。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过。生产构建目录块 `catalog-CuyazIMg.js` 1,340.43 kB，仍超过 500 kB，未做拆分。文中来源地址已检查为 HTTP 200。下一篇从 K13-03 开始。

## 2026-10-13 · K13 全专题完成

- 新增 K13-03 至 K13-08 六篇正文与 18 张回忆卡，K13 八个单元全部可读。知识正文 110/128，文章 130，回忆卡 332。剩余知识正文为 K14–K16 各六篇，共 18 篇；E25–E40 仍未开放。本轮没有新增练习。
- `npm run verify:k13`：8 篇文章、18 个浏览器示例通过，报告 `docs/verification/k13-all-article-examples.json`。表单世代、菜单与授权、按钮契约、放置边界、配置回退和容量分档是固定输入上的教学模型，不是生产配置、访问控制或容量评估。
- `npm run verify:k13-ui`：八个可读单元、8 篇文章、22 张卡、专题搜索、重载和 1440/390 通过，报告 `docs/verification/k13-ui-report.json`。已查看 K13-03 至 K13-08 的 390px 首屏，标题、摘要和问题段完整，未见横向溢出。没有做屏幕阅读器验收。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过。生产构建目录块 `catalog-DShzUWJc.js` 1,387.86 kB，仍超过 500 kB，未做拆分。文中来源地址已检查为 HTTP 200。下一篇从 K14-03 开始。

## 2026-10-14 · K14 全专题完成

- 新增 K14-03 至 K14-08 六篇正文与 18 张回忆卡，K14 八个单元全部可读。知识正文 116/128，文章 136，回忆卡 350。剩余知识正文为 K15–K16 各六篇，共 12 篇；E25–E40 仍未开放。本轮没有新增练习。
- `npm run verify:k14`：8 篇文章、18 个浏览器示例通过，报告 `docs/verification/k14-all-article-examples.json`。有限队列、聚合与字段整形、分段输出、缓存键、运行时能力表和请求记录是固定输入上的教学模型，不是 Node 流、真实 BFF、React 流式渲染、CDN、边缘平台或追踪收集器。
- `npm run verify:k14-ui`：八个可读单元、8 篇文章、22 张卡、专题搜索、重载和 1440/390 通过，报告 `docs/verification/k14-ui-report.json`。已查看 K14-03 至 K14-08 的 390px 首屏，标题、摘要和问题段完整，未见横向溢出。没有做屏幕阅读器验收。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过。生产构建目录块 `catalog-B-14QuuF.js` 1,431.92 kB（gzip 520.81 kB），仍超过 500 kB，未做拆分。文中来源地址已检查为 HTTP 200。搜索文档仍为 204。下一篇从 K15-03 开始。

## 2026-10-14 · K15 全专题完成

- 新增 K15-03 至 K15-08 六篇正文与 18 张回忆卡，K15 八个单元全部可读。知识正文 122/128，文章 142，回忆卡 368。剩余知识正文为 K16 六篇；E25–E40 仍未开放。本轮没有新增练习。
- `npm run verify:k15`：8 篇文章、18 个浏览器示例通过，报告 `docs/verification/k15-all-article-examples.json`。错误恢复、保存步骤、目标尺寸、对比比值、控件键表和发布门禁是固定输入上的教学模型，不是读屏、设备测量、对比度扫描器或 WCAG 符合性结论。间距分支不是直径 24 的圆相交测试。
- `npm run verify:k15-ui`：八个可读单元、8 篇文章、22 张卡、专题搜索、重载和 1440/390 通过，报告 `docs/verification/k15-ui-report.json`。已查看 K15-03 至 K15-08 的 390px 首屏，标题、摘要和问题段完整，未见横向溢出。没有做屏幕阅读器验收。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过。生产构建目录块 `catalog-CiAP7AZz.js` 1,483.43 kB（gzip 538.40 kB），仍超过 500 kB，未做拆分。文中来源地址已检查为 HTTP 200。搜索文档仍为 204。下一篇从 K16-03 开始。

## 2026-10-14 · K16 全专题完成

- 新增 K16-03 至 K16-08 六篇正文与 18 张回忆卡，K16 八个单元全部可读。知识正文 128/128，文章 148，回忆卡 386。知识目录已全部发布。E25–E40 仍未开放。本轮没有新增练习。
- `npm run verify:k16`：8 篇文章、19 个浏览器示例通过，报告 `docs/verification/k16-all-article-examples.json`。树遍历、有序查找、窗口、栈、状态转移和列表窗口是固定输入上的教学模型，不是包安装器、排行榜、编辑器历史、虚拟列表或渲染耗时。索引门槛 20 与 1、帧预算 5 是模型整数。
- `npm run verify:k16-ui`：八个可读单元、8 篇文章、22 张卡、专题搜索、重载和 1440/390 通过，报告 `docs/verification/k16-ui-report.json`。已查看 K16-03 至 K16-08 的 390px 首屏，标题、摘要和问题段完整，未见横向溢出。没有做屏幕阅读器验收。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过。生产构建目录块 `catalog-Uxa0OcE4.js` 1,528.29 kB（gzip 554.55 kB），仍超过 500 kB，未做拆分。文中来源地址已检查为 HTTP 200。搜索文档仍为 204。尚未开放的是练习 E25–E40。

## 2026-10-14 · E25–E40 练习完成

- 新增 E25–E40 共 16 道练习。练习 40/40 开放。知识正文仍是 128/128，文章 148，回忆卡 386。没有新增知识正文。
- `npm run verify:exercises`：40 道题、310 个行为用例、120 个样例通过，80 个错误实现被拒绝。报告 `docs/verification/exercises.json`。
- `npm run verify:practice-runner`：40 个参考实现通过，80 个错误实现被拒绝；超时、停止和 iframe 清理通过。
- 练习目录 40 行均为「题面已补齐」，没有「待编写」。E25 题面、骨架 `未实现` 和关联 K04-05 已在页面打开核对；390px 下该页没有横向溢出。没有做屏幕阅读器验收。
- E25–E31、E33、E34、E38、E40 在现有隔离 Worker 中用普通对象表达观察器、事件路径、焦点、校验、窗口、请求、类型约束和分帧。它们不调用 IntersectionObserver、DOM、React、Vue、tsc、fetch 或 requestAnimationFrame，也不承诺读屏或硬实时。E32 明确不是 Vue。
- `npm run typecheck`、`npm run lint`、`npm run build`、`git diff --check` 通过。目录块仍是 `catalog-Uxa0OcE4.js` 1,528.29 kB（gzip 554.55 kB），未做拆分。搜索文档仍为 204。练习块为 `PracticePages-DR00fGys.js` 364.69 kB（gzip 85.48 kB）。

## 2026-10-15 · 正文按需加载

- 知识地图、专题和 AI 目录只使用文章摘要。打开一篇文章时再加载该篇；指向链接时预取。搜索索引在进入搜索后单独请求，不进入首屏。
- 生产构建不再出现超过 500 kB 的 JavaScript 分块警告。入口约 346 kB（gzip 109 kB），知识目录摘要约 105 kB（gzip 33 kB），单篇文章约 7–30 kB。搜索索引是独立 JSON，约 1,387 kB（gzip 519 kB），只在搜索时下载。
- 已在本机开发服务器核对：知识地图不请求正文模块；闭包深链接聚焦章节；错误专题不打开闭包正文；搜索 `closure` 命中原文；AI 文章只请求对应模块。真实用户 INP 与移动设备性能仍未测。
