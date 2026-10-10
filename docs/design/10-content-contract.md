# 内容契约、模板与生产规范

## 内容类型

| kind | 用途 | 路由 |
| --- | --- | --- |
| knowledge | 通用知识文章 | S04 |
| exercise | 可动手验证的题目 | S06 |
| ai-guide | AI 原理与方法 | S08 |
| ai-template | 以可复制任务模板为主的 AI 文章 | S08 |
| ai-case | 人工审阅/决策练习 | S08 |

近期条目仍是 ai-guide，通过 freshnessClass 标注时效，不另建 news 类型。AI 目录每个 ID 对应一篇主内容，附带模板与案例不重复计数。

## 公共元数据

以下是语言无关的数据合同，不是已实现的 Schema。开发阶段应采用运行时校验并生成编辑器类型。

| 字段 | 类型/约束 | 说明 |
| --- | --- | --- |
| id | 非空唯一字符串 | K01-01 / E01 / AI01 等；发布后不可变 |
| kind | 上表枚举 | 与必需字段组合验证 |
| slug | 小写英文数字与连字符 | 路由作用域内唯一，变更保留旧路径 |
| title | 1—80 字符 | 面向用户，遵守文案规范 |
| summary | 30—180 字符 | 说明解决什么问题，不堆标签 |
| domainId | 有效专题 ID | AI 内容归入 AI 分类 |
| depth | core/advanced/extension | 与交付优先级分开 |
| tags / aliases | 字符串数组 | 去重；支持中英文搜索 |
| estimatedMinutes | 1—120 正整数 | 阅读/练习估计，用标签说明 |
| status | draft/review/published/archived | 只有 published 进入公开目录和分母 |
| revision | 正整数 | 影响学习语义的版本 |
| updatedAt / verifiedAt | ISO 日期 | 编辑日期与事实核验日期分开 |
| freshnessClass | stable/practice/tool/recent | 180/90/30/14 天复核 |
| applicableVersions | 字符串数组 | 没有版本限制时写通用，不伪造版本 |
| prerequisites / relatedIds | ID 数组 | 不允许悬空引用或自身依赖 |
| sources | 来源对象数组 | title/url/publisher/publishedAt(可空)/checkedAt/claimScope |
| changeSummary | 字符串，可空 | 实质变更说明，用于首页近期变化 |

标题、摘要、正文、图注、卡片、提示、解析、SEO 描述与可访问名称均执行发布内容词汇检查。私人笔记不作为内容构建输入。

## 已确认的全站写作标准

用户已确认：网站内所有知识与 AI 文章都按「作用域、闭包与生命周期」的讲解深度制作；覆盖已有正文修订及后续新增文章。质量参照为 src/content/knowledge/closures.ts，章节数和示例数不作为凑数指标。

- 从具体问题开始，说明需要哪些前置概念，让读者知道要解释什么现象。
- 按理解路径引入术语，并解释机制为什么会产生当前行为；不堆叠定义、口号或只有结果的输出题。
- 代码前说明场景和环境，代码完整且可独立复现；代码后逐步解释状态、调用、数据或队列如何变化。
- 同时讲正常行为与失败路径。反例明确标为错误实现，解释哪里错、怎么修及修复后的预期行为。
- 给出工程用途、取舍和至少两个实质边界；区分规范语义、实现观察与作者建议。
- AI 内容通过一个完整工作案例串联目标、上下文、约束、审阅和验收；模板有填写说明，案例有错误实现与行为证据，不能只提供提示词列表。
- 涉及近期工具能力、版本或 API 的事实先核对官方资料，记录内部证据与日期；不杜撰仓库命令、不宣称未运行的检查通过。
- 不复制参考文章正文；用原创示例和自己的解释组织知识。写够解释所需的内容，不按固定字数填充。
- 阅读页面保持专注正文的单栏；不增加页内目录、来源核验模块或个人见解输入区。

完成前作者应自问：读者能否沿着本文独立推导一个新例子？每个关键结论是否给了理由、实例或证据？只看定义还不能回答“为什么”的段落，继续补写。

## 知识文章模板

1. **你将解决什么问题**：具体场景与学习目标。
2. **核心结论**：3—5 点，每点能独立解释。
3. **前置知识**：有效链接，可跳过不锁定。
4. **机制**：过程、状态变化或图示，提供文字解释。
5. **最小示例**：可复现输入、预期结果、环境与执行方法。
6. **工程应用**：说明怎么用，避免只罗列语法。
7. **反例与误区**：至少两个，解释为何失败与适用边界。
8. **取舍**：何时选另一种方案，不说某模式永远最好。
9. **主动回忆**：2—5 张单一目标卡片。
10. **动手练习**：关联题或说明该主题没有独立编码题。
11. **内部证据记录**：官方资料优先，标注版本与日期；不在阅读页生成来源与核验模块。

上述项目是作者的覆盖检查，不是必须逐项显示的页面模块。用户明确要求深入讲解：正文从问题、过程和代码出发，每个示例交代环境、预期输出、逐步原因与边界；允许代码与解释交替，不以罗列定义代替理解。文章不得内嵌个人见解输入区或页内目录。

通常阅读时长 8—25 分钟；以学习目标决定长度，不为凑时长灌水，也不因模板限制省略关键推导。卡片和关联练习是领域内容关系，未交付时不显示空入口。首版中文正文，保留技术术语英文别名。

## 卡片模板

cardId、sourceContentId、sourceRevision、cardRevision、question、answerPoints、pitfalls、sourceHeadingId、order。question 单一目标，不在题干泄露答案；answerPoints 2—5 条；pitfalls 至少一条。卡片不嵌入可执行脚本。

例：问题是“请求 A 比请求 B 更早发出，但更晚返回，如何避免页面显示 A 的旧结果？”答案要点包括定义最新请求身份、成功和失败路径都校验、取消用于节约资源且不能替代身份检查。不要只问“解释竞态”这种无限开放问题。

## 练习内容模板

除公共字段外必需：runtime、entryContract、allowedApis、unsupportedBehavior、starterArtifact、testCases、hints[3]、referenceArtifact、explanation、complexity、commonMistakes、knowledgeIds、timeoutMs。

每个 testCase：稳定 ID、公开名称、行为目的、setup、input、expectedOutcome、cleanup；异步时钟由统一 harness 提供。输入输出涉及函数、Date、Map 时使用受信任测试模块构造，不伪装成 JSON 能表达所有值。

starter/reference/test 是未来受审查的仓库内容，只允许构建时读取；不能让用户导入的 JSON 直接注册成题目代码。不同题目的允许行为不得互相推断。

## AI 文章附加字段

scenario、requiredInputs、taskTemplate（可选）、guardrails、verificationChecklist、failurePatterns、evidenceArtifacts、toolScope。审阅案例追加 caseBrief、changeExcerpt、questions、referenceFindings、selfAssessmentRubric。

任务模板可复制，所有占位字段统一使用【名称】。验证命令只在确认目标项目存在时才填入；通用模板不能杜撰 package scripts。

## 内容生产与审核

draft → 作者自检 → 技术复核 → review → 发布负责人核对元数据/样例/链接 → published。个人维护可由同一人承担角色，但需分两次检查，不能将 AI 草稿直接发布。

发布门槛：

- 核心结论有来源或可复现证据，事实与建议分开。
- 所有代码/题目参考实现实际跑过，运行记录可追溯。
- 每道题验证典型错误实现能被用例发现。
- 至少两个易错边界，不只有 happy path。
- 双向关联、稳定 ID、锚点、目录、全文索引有效。
- 手机正文与表格可读，图示有文字替代。
- 没有空占位答案、过时的“最新”、虚构版本和禁用宣传词。

## 文件组织建议

现有文章模块按知识/AI 分目录存放于 src/content/knowledge/ 与 src/content/ai/，统一由 src/content/articles.ts 注册；示例字段可标明 JavaScript/TypeScript，预期输出与解释随正文维护。运行 npm run verify:articles 在临时空白浏览器页面核对输出，并严格检查 TypeScript 示例；提示词模板不是执行代码。这个验证只处理仓库作者样例，不接收用户代码或备份。

未来内容源独立于 UI：content/knowledge/<domain>/<slug>.md、content/practice/<slug>/、content/ai/<slug>.md、content/cards/、content/manifest。此 Markdown 布局是未来规划，目前采用声明式 TypeScript 内容模块，不支持任意执行脚本。

Markdown 只允许声明式内容和经过审查的组件引用；P0 不接受任意 MDX JavaScript。构建生成目录、导航、关系和搜索索引。文章 ID 是唯一事实源，不在页面代码复制一份列表。

## 删除与改名

改标题不改 ID；改路径保留重定向；归档保留简要记录与替代条目；删除前检查用户记录引用。卡片语义变化递增 cardRevision，练习契约/测试变化递增 exercise revision。格式修正不重置进度。
