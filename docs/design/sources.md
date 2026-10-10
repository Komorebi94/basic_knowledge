# 资料来源与核验记录

核验日：2026-09-30。以下页面已在设计阶段访问，用于确定内容方向或基础定义。公开日期按页面可见信息记录；未明确给出的不猜测。访问成功不代表所有下级链接、全部 API 或未来版本已验证。

## AI 工程

| 来源 | 发布日期 | 支持的设计内容 | 解释边界 |
| --- | --- | --- | --- |
| [OpenAI：重新审视技能与提示](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) | 2026-09-11 | AI20，模型升级后重新评估规则与上下文 | 特定模型的经验，不是所有模型结论 |
| [OpenAI：Harness engineering](https://openai.com/index/harness-engineering/) | 2026-02-11 | AI19，仓库可读性与可执行约束 | 内部实验结果不作为本站效率承诺 |
| [Anthropic：Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) | 2026-03-24 | AI19，长任务拆分与评估反馈 | 不意味着每个项目都应多 Agent |
| [Anthropic：Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | 2026-01-09 | AI16，任务集、评分与执行轨迹 | 具体评估集需按本项目自建 |
| [Anthropic：Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 2025-09-29 | AI03，上下文选择、检索、压缩与笔记 | 上下文大不等于全部有效 |
| [GitHub Spec Kit](https://github.github.com/spec-kit/) | 文档持续更新 | AI02/05，规范先行的实现流程 | 不绑定本项目必须使用该工具 |
| [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | 2025-11-25 文档路径版本 | AI12/15，授权、令牌与信任边界 | 路径版本不代表所有工具均兼容 |

## 前端与标准

| 来源 | 支持内容 | 使用方式 |
| --- | --- | --- |
| [React：Thinking in React](https://react.dev/learn/thinking-in-react) | K07，组件拆分与状态归属 | 作为官方阅读入口，版本细节另查 |
| [Vue：Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) | K08，响应式解释 | 手写简化题不能宣称等同真实实现 |
| [TypeScript：Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) | K03，类型收窄 | 配合具体版本编译验证 |
| [Web Vitals](https://web.dev/articles/vitals) | K10，LCP/INP/CLS 与性能验收 | 指标定义与本站预算分开 |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | K15，键盘、焦点、对比度与布局 | 以实际人工与工具检查验证 |
| [WHATWG HTML：Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops) | K02-01，任务与渲染流程 | 浏览器模型，不直接套用 Node |
| [MDN：JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model) | K02-01，执行栈与宿主机制 | 解释性资料，与规范交叉核对 |
| [ECMAScript：IsStrictlyEqual / SameValue / SameValueZero](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal) | K01-01，严格相等、Object.is 与集合相等 | 示例输出由 verify:articles 在 Chrome 核对；不把控制台对 -0 的显示当成规范 |
| [MDN：Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness) | K01-01，三种相等算法的对照 | 解释性资料，与 ECMAScript 抽象操作交叉核对 |
| [HTML：结构化克隆](https://html.spec.whatwg.org/multipage/structured-data.html#structured-cloning) | K01-01，嵌套复制与不可克隆值 | 只覆盖已运行的对象、日期、undefined 和函数失败路径 |
| [ECMAScript：this、原型、模块、迭代器与 WeakRef](https://tc39.es/ecma262/multipage/) | K01-03 至 K01-08 | 各篇示例由 verify:articles 在 Chrome 核对；不把回收时机写成固定输出 |
| [ECMAScript：Promise 与 async 函数](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects) | K02-02 至 K02-06，链式返回、组合、清理、并发、取消与重试 | 示例由 verify:articles 在 Chrome 核对；退避示例记录计划延迟，不把真实等待写成输出 |
| [HTML：Worker 与 DOM AbortSignal](https://html.spec.whatwg.org/multipage/workers.html#workers) | K02-05、K02-07、K02-08，取消、消息传递与操作轨迹 | 转移后发送方字节长度为 0；不把主线程渲染成本写成 Worker 已消除 |
| [MDN：AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) | 请求取消样稿与 AI08/09 案例 | 实際是否取消取决于消费方支持 |

## 未做的核验

本次未验证 128 个知识单元的全部技术细节、40 道题的全部参考实现、第三方库当前版本或浏览器 CSP 实际行为。这些属于内容生产与 M0/M5 的交付责任。本次的题目规则是本站拟定合同，不宣称是所有同名题目的唯一标准。

## 维护规则

每篇内部证据记录将来源对应到具体结论；按 D14 不在阅读页生成来源核验模块，必要的环境与结论边界仍写入相关正文。记录 checkedAt 与 claimScope，区分发布日期和访问日期。链接失效后先保留标题与核验记录，再寻找官方迁移页面；不能用不相关的新链接掩盖旧证据失效。

复核周期见 09。来源解释和提炼使用自己的文字，避免大段复制全文；示例、测试和案例优先原创。
