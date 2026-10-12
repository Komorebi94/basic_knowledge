# 实现状态与验证记录

记录日期：2026-10-12。设计目录描述目标合同，本文记录实际交付。

历史2026-09-30验证浏览器：Chrome 154.0.8037.58；主站 origin：`http://127.0.0.1:5173`。笔记与备份验证使用独立临时上下文。

## 已实现

| 区域 | 实际状态 |
| --- | --- |
| 网站骨架 | React、TypeScript、Vite，深链接路由，桌面与移动布局 |
| 完整目录 | 16 个专题 × 8 个单元，共 128 个前端知识单元；40 道练习；20 个 AI 单元。均显示标题与学习范围；已补齐正文/题面与待编写状态分别标明 |
| 阅读内容 | 74 篇知识、20 篇 AI，共94篇完整教程；AI P0/P1 全部补齐。原 207 个作者例子，另加 4 个 AI P0 示例、11 个 AI P1 示例、18 个 K04 示例、18 个 K03 严格 TypeScript 示例、20 个 K05 布局示例、18 个 K06 示例与 17 个 K07 示例；其中原 9 个严格 TypeScript 样例。原内容 ID、URL 和锚点保留 |
| 学习配套 | 224张回忆卡（P0为96张、AI P1新增14张、K04新增18张、K03新增18张、K05新增18张、K06新增18张、K07新增18张）、任务模板及AI09/10/15审阅案例；卡片原文定位、默认折叠答案、自评说明与双向练习关联可用 |
| 练习内容与功能 | E01—E24完整题目、代码与复盘自动保存、跨源 Worker 运行、停止/超时、结果与控制台、提示/参考标记、尝试和独立/参考证据历史；182用例、72样例通过，48典型错误实现被拒绝 |
| 搜索 | 中英别名、内容ID、全半角归一、分档排序；完整目录、正文、练习题面可检索；提示与折叠参考答案不进入练习全文索引，待编写条目定位目录锚点 |
| 个人数据 | 文章/章节笔记、私人搜索、阅读位置、显式已读、收藏、补强、历史；自动保存、冲突比较、切页保护；schema 2 全量备份，兼容 schema 1、事务替换与恢复 |
| 复习闭环 | 文章订阅/暂停、每日队列、固定间隔日历调度、时区、回答草稿、显隐恢复、原子评分与撤销、额外回顾、会话恢复 |
| 设置与统计 | 每日目标、时区、字号、运行快捷键、存储估算/详情清理/清除确认；首页真实已读、独立通过、今日与本周复习数据 |
| 运行器 | 独立 origin、Worker、超时/停止、消息校验、CSP；已接入全部 24 道题的受信 harness |

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
- 首页实验室性能已测，真实用户 INP、完整移动设备性能尚未测；正文延迟包仍触发体积提示。

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
