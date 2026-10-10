import type { Article } from "../articles";

export const runtimeBoundariesArticle: Article = {
  id: "K14-01", kind: "knowledge", domainSlug: "server", slug: "browser-node-boundaries",
  title: "浏览器与 Node 运行边界",
  summary: "把 JavaScript 语言、宿主 API、模块解析和调度分开，解释为何共享代码中的 document、文件读取与环境配置会在另一端失效。",
  aliases: ["Node.js", "runtime", "globalThis", "event loop"], tags: ["Node", "浏览器", "运行边界"],
  estimatedMinutes: 22, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "同一段 JavaScript，为什么服务端没有 document？", paragraphs: [
      "一个格式化标题的工具读取 document.title，再返回字符串。浏览器运行正常，服务端渲染导入时却报 document 未定义。语法仍然是 JavaScript，差别在宿主：浏览器提供文档、窗口与渲染环境，Node 提供服务端进程与文件等能力；语言标准不要求每个宿主拥有这些对象。",
      "先区分三层：ECMAScript 定义值、函数、Promise 等语言机制；宿主提供 DOM、文件、网络及调度；构建系统决定模块解析、条件导出和代码转换。构建成功只能证明产物生成，不证明运行环境支持它使用的所有 API。本文浏览器可执行例子不会调用 Node 文件能力，Node 专用片段单独标注。",
    ], examples: [{ code: `console.log(typeof globalThis);
console.log(typeof document);
console.log(typeof window);
console.log(typeof process);
console.log(typeof Promise);`, expectedOutput: ["object", "object", "object", "undefined", "function"], explanation: [
      "这份预期只对应无第三方注入的普通浏览器页面：globalThis 指向当前全局，document 和 window 可用，Node 的 process 不存在，Promise 是语言提供的构造函数。",
      "在 Node、Worker 或测试环境中输出会不同。Worker 没有页面 document；测试工具可能提供 DOM 模拟或 process 替身。不能根据一个 typeof 判断就认定完整平台能力，应该验证实际所需 API 及语义。",
    ] }] },
    { id: "pure", title: "共享逻辑接收数据，而不是主动读取宿主", paragraphs: [
      "如果格式化只需要标题，就把标题作为参数。浏览器入口读取页面或接口，服务端入口读取请求或数据库，再把相同领域值传给纯逻辑。共享的是输入输出合同，不是把全部宿主 API 包装成一个巨大万能环境。",
    ], examples: [{ code: `function formatTitle(raw) {
  if (typeof raw !== 'string') throw new TypeError('title');
  const text = raw.trim();
  return text ? text + ' · 知识' : '知识';
}
console.log(formatTitle('  闭包  '));
console.log(formatTitle(''));
try { formatTitle(null); } catch (error) { console.log(error.name); }`, expectedOutput: ["闭包 · 知识", "知识", "TypeError"], explanation: [
      "函数只读取参数，因此可在浏览器和 Node 中执行。字符串规范化与空值合同相同，非法输入明确拒绝；调用方决定标题从哪里来。",
      "如果这段逻辑还依赖时区、随机数或系统语言，需要把确定性条件也固定下来。纯函数不只是没有 document，而是相同输入条件能得到相同结果，方便 SSR 首次输出和客户端接续保持一致。",
    ] }] },
    { id: "modules", title: "模块语法相同，不代表解析路径相同", paragraphs: [
      "浏览器原生 ESM 通常按 URL 获取模块，裸包名需要 import map 或构建处理；Node 的包解析会读取包配置、文件类型与条件导出。CommonJS 与 ESM 的边界也不同。写出 import 并不等于同一依赖在所有端都能加载。",
      "前端构建器可能把 process.env 的特定访问替换成编译时常量，不能据此推断浏览器真的拥有进程环境。进入客户端产物的配置应视为公开信息；数据库口令和服务端令牌不能因为写在 env 文件中就被当成安全。",
      "Node 专用文件应只由服务端入口导入，浏览器共享模块不能在顶层静态读取 node:fs。条件分支若没被构建器正确消除，依赖仍可能进入解析过程。分清入口比先写大量 typeof 判断更可靠。",
    ], code: `// Node ESM 专用示例：保存为 .mjs，在 Node 中运行。
import { readFile } from 'node:fs/promises';
const path = new URL('./package.json', import.meta.url);
const text = await readFile(path, 'utf8');
const value = JSON.parse(text);
console.log(typeof value.name === 'string');
// 输出取决于旁边实际文件；此片段不作为浏览器示例执行。` },
    { id: "scheduling", title: "先推导语言可保证的顺序，再处理宿主差异", paragraphs: [
      "Promise 回调在当前同步代码之后执行，可以在两端用相同最小例子观察。但 Node 还有自己的 nextTick、I/O 阶段与 setImmediate，浏览器还有渲染机会和页面任务来源。不能把一份浏览器输出题的队列图直接当成 Node 的完整事件循环。",
    ], examples: [{ code: `const order = [];
order.push('sync');
Promise.resolve().then(() => order.push('promise'));
queueMicrotask(() => order.push('microtask'));
order.push('end');
setTimeout(() => console.log(order.join(',')), 0);`, expectedOutput: ["sync,end,promise,microtask"], explanation: [
      "同步代码先写 sync 与 end。Promise 回调先登记，queueMicrotask 后登记，在本例微任务检查点按入队顺序写 promise 与 microtask。定时任务读取最终数组，得到这份顺序。",
      "这只证明当前例子的明确登记顺序，不证明 setTimeout(0) 精确零毫秒，也不包含 Node I/O 中 setImmediate 的相对顺序。解释实际 Node 行为时，必须说明版本、模块模式与调用上下文。",
    ] }] },
    { id: "io", title: "I/O、CPU 与全局状态要按请求生命周期管理", paragraphs: [
      "Node 的异步 I/O 可以在等待外部资源时继续处理其它工作，但同步 CPU 密集循环仍会占用执行线程。把函数标成 async 不会自动把循环移到另一线程。浏览器 Worker 与 Node worker_threads 有不同宿主 API 和启动方式，不能共享一份带 document 的 worker 文件。",
      "浏览器一个用户的模块缓存，在服务端进程中可能由多次请求共享。把当前 userId 放在模块顶层变量，A 请求 await 时 B 请求就可能改写它，A 恢复后读取 B 的身份。请求相关身份应沿参数或正确的异步上下文传递，不放在无区分的全局变量。",
      "文件、流、监听器和连接应由创建它们的生命周期负责释放。请求取消不自动撤销已经提交的数据库修改；读取超时也不证明远端操作没发生。跨端代码依然要有幂等与资源清理合同。",
    ] },
    { id: "boundaries", title: "兼容层能补接口，不能自动补语义", paragraphs: [
      "浏览器与 Node 都提供某些同名 API，并不意味着权限、Cookie、缓存和来源策略相同。浏览器 fetch 受页面来源与凭据政策影响；服务端请求环境要自行处理身份、目标白名单和私有网络访问边界。不要把浏览器的 CORS 错误解释迁移成服务端授权。",
      "DOM 模拟器适合部分结构与交互测试，但真实布局、绘制与浏览器存储仍应在目标浏览器验证。另一方面，本机 Node 成功也不证明边缘运行时提供文件系统或完整 Node 内建模块。部署能力需要以实际运行环境文档及测试为证据。",
      "这两个边界说明为什么“都是 JavaScript”不足以定义可移植性。列出需要的能力，明确运行入口，并用对应环境验证，是共享代码之前必须完成的工作。",
    ] },
    { id: "verification", title: "为共享模块建立明确的运行矩阵", paragraphs: [
      "记录模块预期运行于浏览器主线程、Worker、Node 或特定部署宿主中的哪几个，检查顶层副作用、全局对象、模块解析及依赖图。对纯逻辑可在多个宿主复用相同输入输出用例；对文件或 DOM 能力，分别使用真实适配器检查。",
      "实际命令从目标项目配置读取，不在通用文章中假设存在某个 npm script。报告构建与运行结果各自的环境，并写明未覆盖平台。若只在本机浏览器运行了本文示例，不能宣称 Node 和边缘部署也验证通过。",
    ] },
    { id: "recall", title: "遇到一个运行错误，先问它属于哪一层", paragraphs: [
      "document 未定义属于宿主能力，无法解析包名属于模块解析，旧请求覆盖结果属于数据流，语法不支持属于目标与转换。分清问题类别，再选择最小修复。",
      "共享代码最稳妥的起点是纯领域规则；宿主能力放在边缘。不要让一次为了服务端加载的修复，把用户权限或敏感配置带进客户端产物。",
    ] },
  ],
  sources: [
    { title: "Node：全局对象", url: "https://nodejs.org/api/globals.html" },
    { title: "Node：事件循环", url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick" },
    { title: "MDN：模块", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules" },
  ],
};
