# 复现练习参考实现、样例与行为用例

E01—E24 的参考代码、样例和测试是仓库维护的内容。执行 `node scripts/verify-exercises.mjs` 可以复现全部题目的参考行为、比较全部样例输出，并确认每题至少两个典型错误实现会被用例发现。该命令不会读取页面输入、用户草稿或备份，也不会提交练习完成记录。

在仓库根目录运行，使用已安装项目依赖的 Node.js 环境。项目 `package.json` 要求 Node.js `^20.19.0 || >=22.12.0`；验证脚本使用项目已有的 TypeScript 编译器，不需要安装额外测试库。

```sh
node scripts/verify-exercises.mjs
```

成功时输出题目数、行为用例数、样例数及检测到的错误实现数。任一参考用例失败、样例输出不一致或错误实现未被识别，命令会以非零状态结束，并在控制台指出题目及用例。报告保存至 `docs/verification/exercises.json`，包括：

- `runtime`、`verifiedAt`：实际 Node.js 版本与执行时间。
- `verifierSha256`：本次验证器源码指纹。
- 每题 `revision`、`contentSha256`：本次题目内容版本与指纹。
- `cases`：行为用例的通过或失败记录。
- `examples`：题面预期、实际捕获的日志与检查结果。
- `wrongImplementations`：错误方案名称，以及首先发现它的用例与原因。

例如查看 E01 时，在报告中找到 `"id": "E01"`。`E01-T01` 对应“最后一次起算”；它不是一次真实等待，而是以确定的虚拟时间顺序调用参考函数。报告中的时间戳只记录检查何时发生，不能用于评判算法复杂度。

## 源码与执行顺序

题目位于 `src/content/practice/async.ts`、`data.ts`、`functions.ts`；`index.ts` 注册题目，`types.ts` 定义合同。每题 `referenceArtifact` 是完整参考入口，`examples[].code` 是可见样例，`testCases[].code` 是带断言的行为用例。字符串源码只作为经过审阅的仓库内容被验证脚本加载。

验证器为**每个样例、每个行为用例**新建 Node.js VM 上下文，依次加载辅助函数、参考入口，再在异步函数中执行样例或测试，因此样例允许顶层形式的 `await`。控制台输出被捕获并与 `expectedLogs` 精确比较；页面展示的 `expectedOutput` 是面向读者的结果说明。对象日志采用 Node.js `inspect` 格式，浏览器控制台的排版可能不同，不能据此推断业务值不同。

测试某个错误方案时也使用独立上下文，先确认错误源码可解析，再执行同一组行为用例。因语法无效而失败不算检测到典型行为错误。错误方案只要有一条行为用例失败就被识别；报告保留该用例。

当前命令执行全部题目，没有 `--id`、代码字符串参数、文件上传入口或替换用户答案的 CLI。页面上的代码复制用于在自己的开发环境练习；不要假定复制样例到浏览器控制台后，`clock` 等辅助对象会自动存在。需要完整复现仓库合同，应运行以上验证命令并对照题目源码；在线编辑和判题是独立工作台的后续能力。

## 虚拟时钟 `clock`

| API | 含义 | 使用边界 |
| --- | --- | --- |
| `clock.now` | 当前虚拟毫秒，每例从 0 开始 | 用于记录任务开始或结束的顺序 |
| `clock.size` | 当前待执行计时器数量 | 可验证取消或完成是否清掉 timer；不能证明所有内存引用已回收 |
| `await clock.tick(ms)` | 将虚拟时间向前推进 `ms`，执行截止点内的 timer | 仓库测试使用有限非负数；它不等待真实的 `ms` 毫秒 |

上下文中的 `setTimeout`、`clearTimeout` 由虚拟实现替换。`Date.now()` 也返回 `clock.now`，但 `new Date()` 没有被替换成虚拟日期；需要测时间间隔时使用 `clock.now` 或 `Date.now()`，不要混用真实日期构造。

`tick` 先处理已有微任务，再按到期时间、计时器登记顺序执行 timer；每个 timer 之后处理微任务。执行过程中新增且已进入当前截止范围的 timer 也会执行。最后把 `now` 设为目标时间并再次处理微任务。这是本题确定的测试调度，不能推广为所有浏览器和 Node.js 事件循环的完整模型。

以 E01 的 trailing 合同为例，以下是**位于 harness 中**的行为测试片段：

```js
const output = [];
const wrapped = debounce(value => output.push(value), 10);
wrapped('A');
await clock.tick(5);
wrapped('B');
await clock.tick(9);
equal(output, []);
await clock.tick(1);
equal(output, ['B']);
```

第一次计时目标为 10；第二次在 5 发起，把目标改为 15。推进到 14 时没有输出，到 15 时只输出 B。这条断言会发现“旧 timer 没有取消”的错误，而不受真实机器速度影响。

零等待也要显式推进：`setTimeout(fn, 0)` 不同步执行，`await clock.tick(0)` 才触发当前时刻的计时器。虚拟时钟不能替代真实网络、DOM、动画帧或浏览器调度测试，本批题目不使用这些能力。

## 控制异步完成：`deferred()` 与 `flush()`

`deferred()` 返回 `{ promise, resolve, reject }`。测试决定何时调用 `resolve(value)` 或 `reject(error)`，因此可以稳定制造“旧请求晚完成”“第二项先完成”及“取消之后仍拒绝”等次序。

```js
const a = deferred();
const b = deferred();
const result = all([a.promise, b.promise]);
b.resolve('B');
a.resolve('A');
equal(await result, ['A', 'B']);
```

B 先完成，但 all 按输入索引保存，因此最终仍为 A、B。不要用真实网络延迟或真实 sleep 代替完成控制，它们不能稳定证明此项顺序合同。

`await flush()` 让 Promise 微任务推进，用于观察工厂是否已经启动、是否已安装 timer 等状态。当前实现连续等待 32 次 `Promise.resolve()`；它是这些有限测试链的推进辅助，**不是任意程序“所有异步任务已清空”的保证**。它不推进虚拟时间、不触发 timer，也不让尚未解决的 deferred Promise 自动完成。只调用 flush 后直接等待一个未 tick 的 delay，会保持未结算。

## 断言与错误检查

| 辅助函数 | 检查什么 |
| --- | --- |
| `assert(condition, message)` | 条件必须为真，否则抛出带说明的错误 |
| `equal(actual, expected)` | 使用 Node.js `deepStrictEqual` 比较值、结构与类型，不是 JSON 字符串比较 |
| `expectThrow(fn, name)` | 同步调用 `fn`，要求确实抛错且 `error.name` 匹配 |
| `await expectReject(promise, name, identity?)` | 要求 Promise 拒绝、名称匹配；给定 identity 时还要求拒绝原因是同一个对象 |

这里没有全局 `throws()` 函数，实际名称是 `expectThrow`。例如 `debounce(null, 1)` 创建时同步抛错，用 `expectThrow`；`delay(-1)` 返回拒绝 Promise，用 `expectReject`。混用会漏掉待观察的 Promise 或只观察到一个正常返回值。

需要验证引用身份时使用 `assert(copy.a === copy.b, '共享引用应保留')`，不要仅比较字段。对象值看似相同不意味着同一个对象。错误原因也可用 `identity` 检查，避免实现偷偷替换为一个只有消息相同的新错误。异常类型不是所有题目都相同，应按各题入口合同选择名称。

`equal` 是严格深比较，例如 0 与 -0 可区分，NaN 可以与 NaN 匹配；Map/Set 键的业务去重语义仍应按题目单独验证。实际值和预期通常都在同一测试上下文构造，不要把跨上下文对象的原型差异误认为题目值错误。

## 隔离、终止与未覆盖边界

每例结束时废弃 timer 与上下文，参考实现自己的清理行为则用 `clock.size`、取消后的观察和必要监听计数检查。废弃环境不证明代码已主动释放资源；这两种证据要分开。

验证器对同步执行设置 VM 超时，另设 250 毫秒的宿主守卫，发现永远未结算的测试 Promise。这个守卫只用于让验证任务终止，不参与防抖、退避或超时题的业务计时，也不能证明复杂度或硬实时表现。虚拟时钟另有限制，单次推进超过 1000 个 timer 回调会失败，防止错误方案不停安排当前时间 timer。

该 VM 流程只执行已审阅的仓库作者代码。Node.js VM 不是任意恶意程序的安全沙箱；禁止将用户输入、外部 JSON 或工具返回文本接到这里执行。本批验证也不证明在线运行器的文件权限、网络阻断、CPU 终止和浏览器矩阵，相关能力按 `docs/design/12-technical-boundaries.md` 与独立运行器合同另行验证。

## 浏览器工作台复现

启动主站 `npm run dev` 和独立服务 `npm run dev:runner`，默认分别为 `http://127.0.0.1:5173` 与 `http://127.0.0.1:5174`。主站配置 `VITE_RUNNER_ORIGIN`，独立服务配置 `ZHIXU_PARENT_ORIGIN`；部署时两个 origin 必须不同，静态服务必须保留 runner 的 CSP 响应头。主站不会回退到本页面执行用户代码。

运行 `node scripts/verify-practice-runner.mjs` 可在本机 Chrome 中复现全部 24 个参考与 48 个错误实现，报告为 `docs/verification/practice-browser.json`。`node scripts/verify-runner.mjs` 另检查跨源主页面/IndexedDB 不可访问、网络阻断和死循环终止。`node scripts/verify-practice-ui.mjs` 使用全新浏览器上下文检查保存、刷新、辅助证据、冲突、路由保护、停止与不可用恢复，报告为 `docs/verification/practice-ui-report.json`。这些浏览器脚本需要 Playwright 与本机 Chrome，服务应使用上述默认地址。

浏览器使用 `runner/harness.js` 的词法辅助参数，并在独立 origin 的 Worker 内执行代码；每条用例有新时钟与入口，每次运行创建新 Worker。浏览器 `equal` 检查本批题目使用的普通对象/数组、日期和基础 Map/Set 结构与身份边界；它并非 Node `deepStrictEqual` 对任意对象（例如含对象键的 Map）的通用替代。当前题目经过 Node 与浏览器双验证，复杂度与更广泛输入仍须按合同人工审查。Worker 让出一个原生任务后检查未处理的 Promise 拒绝；虚拟 `flush()` 仍只负责微任务，不模拟网络或原生任务。
