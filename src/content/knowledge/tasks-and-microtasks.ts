import type { Article } from "../articles";

export const tasksArticle: Article = {
  id: "K02-01", kind: "knowledge", domainSlug: "async", slug: "tasks-and-microtasks",
  title: "任务、微任务与渲染时机",
  summary: "从一段异步输出逐步追踪调用栈和队列，理解 Promise、await 与定时器的执行顺序，再解释 DOM 更新为什么不等于立即绘制。",
  aliases: ["event loop", "microtask", "任务循环"], tags: ["JavaScript", "浏览器", "异步"],
  estimatedMinutes: 20, verifiedAt: "2026-09-30",
  sections: [
    { id: "problem", title: "为什么写在前面的代码，反而在后面输出？", paragraphs: [
      "点击按钮后先显示加载状态，再执行一段计算；计算结束时，用户却从没看到加载提示。另一个场景是几个 console.log 按源码顺序排列，输出顺序却变了。两者都涉及执行时机，但分别还牵涉队列和绘制，不能只用“JavaScript 是单线程”解释完。",
      "本文限定现代浏览器的 Window 环境。下面的 JavaScript 示例可以分别粘贴到浏览器控制台运行；每段独立执行，输出注释是该段完整代码的结果。Node.js 的 nextTick、阶段调度和模块入口不同，不把浏览器结论直接套到它们上面。",
    ], examples: [{ code: `console.log('A');
setTimeout(() => console.log('D'), 0);
queueMicrotask(() => console.log('C'));
Promise.resolve().then(() => console.log('B'));
console.log('E');
// A、E、C、B、D`, expectedOutput: ["A", "E", "C", "B", "D"], explanation: [
      "A 和 E 是当前代码直接执行的同步语句。调用 setTimeout 是同步操作，但它安排的回调不是在这一行立刻执行。queueMicrotask 与 then 同样是在登记后续动作，而不是把当前代码暂停，插入各自的回调。",
      "这段代码登记 C 的微任务在前，登记 B 在后。当前同步代码完成后，C、B 依次执行；定时器回调 D 在后续任务中执行。Promise 没有一种永远压过 queueMicrotask 的特殊优先级，顺序要看实际排队时机。",
    ] }] },
    { id: "stack", title: "调用栈负责执行，异步 API 负责安排后续工作", paragraphs: [
      "调用栈记录当前正在进行的函数调用。一个函数直接调用另一个函数时，先进入被调用函数，等它返回，再继续原函数。调用栈中正常执行的同步代码不会仅因为计时器到期，就突然被计时器回调打断。",
      "浏览器可以在 JavaScript 之外等待计时器、处理网络与输入，随后把需要执行的回调安排进对应调度机制。异步不等于回调在另一条 JavaScript 线程中与当前代码同时执行；这里讨论的是同一 Window 的执行顺序。Worker 是另一个执行环境，需要另行分析。",
    ], examples: [{ code: `function inner() {
  console.log('inner');
}
function outer() {
  console.log('outer:start');
  setTimeout(() => console.log('timer'), 0);
  inner();
  console.log('outer:end');
}
outer();
// outer:start、inner、outer:end、timer`, expectedOutput: ["outer:start", "inner", "outer:end", "timer"], explanation: [
      "outer 登记 timer 后继续调用 inner，inner 返回后再输出 outer:end。即使此时定时器已经满足时间条件，也只能等当前执行让出机会。这里的 0 表示计时参数，不是“在这一行立即调用”。",
      "如果 inner 做了长时间计算，timer 会延迟，输入处理和界面更新也可能被拖住。把 inner 包进 async 函数但不拆分计算，也不会改变那段同步工作的成本。",
    ] }] },
    { id: "mechanism", title: "任务与微任务：一次执行结束后，谁接着执行？", paragraphs: [
      "任务可以由计时器、用户交互等来源产生。事件循环选择可运行的任务，执行相应工作；在微任务检查点处理已排队的微任务。为了分析本文的最小示例，可以把当前脚本看成正在执行的任务，把 Promise 回调与 queueMicrotask 看成等待检查点的工作。",
      "微任务队列处理期间，新加入的微任务也要继续处理。它不是只截取进入检查点前的一批，然后立刻去跑定时器。只要这次检查点仍有微任务，后续任务就不能因为“等待很久”而随意插进这些示例的执行序列。",
      "这是一种分析步骤，不是一张穷尽浏览器行为的时序表。规范还有脚本清理等触发检查点的路径。真实事件派发与跨任务来源调度，必须结合具体触发方式分析，不能把所有异步都压成一个 FIFO 队列。",
    ], diagram: { caption: "用于跟踪本文示例的过程", lines: ["当前同步代码执行完成", "    ↓", "微任务检查点：取出微任务 → 执行 → 继续处理新加入的微任务", "    ↓ 队列处理完成", "浏览器获得处理后续任务与更新渲染的机会", "具体任务选择与绘制时机仍受浏览器调度约束"] } },
    { id: "nested", title: "嵌套微任务：按入队顺序画出变化", paragraphs: [
      "遇到嵌套 Promise 时，先不要凭缩进猜优先级。把每个回调什么时候被登记写下来，然后逐步更新队列。回调执行时创建的工作，不会反过来排到早已入队的工作前面。",
    ], examples: [{ code: `queueMicrotask(() => {
  console.log('first');
  queueMicrotask(() => console.log('nested'));
});
Promise.resolve().then(() => console.log('second'));
setTimeout(() => console.log('timer'), 0);
console.log('sync');
// sync、first、second、nested、timer`, expectedOutput: ["sync", "first", "second", "nested", "timer"], explanation: [
      "同步执行完毕时，微任务队列先有 first，再有 second。运行 first 时输出 first，并把 nested 加到队尾；此时 second 已经在队列里，所以必须先运行 second，再运行 nested。",
      "nested 虽然创建得更晚，仍在同一次检查点中被处理，因此先于后续的 timer。对这个例子有用的是队列变化：初始 [first, second] → first 执行后 [second, nested] → [nested] → 空。",
    ] }] },
    { id: "promise", title: "Promise 的执行器是同步的，then 回调是后续工作", paragraphs: [
      "new Promise 接收的执行器函数会在构造过程中执行。resolve 改变 Promise 的状态，并让相关后续反应按 Promise 机制安排；它不会把 then 回调当作普通函数直接插到当前调用中。若把执行器与 then 都统称为“Promise 代码”，就容易误判输出。",
    ], examples: [{ code: `const completed = new Promise(resolve => {
  console.log('executor');
  resolve('result');
});
completed.then(value => console.log(value));
console.log('after');
// executor、after、result`, expectedOutput: ["executor", "after", "result"], explanation: [
      "构造 completed 时先进入执行器，输出 executor。resolve 后返回构造流程，登记 then 回调，再输出 after。即使 completed 此时已经 fulfilled，then 也不会同步输出 result。",
      "所以，把昂贵循环写进 Promise 执行器，页面仍然会在构造时被那段工作拖住。Promise 表达后续结果，并不会自动把执行器中的计算转移到 Worker。",
    ] }] },
    { id: "await", title: "await 让当前异步函数暂停，不代表让浏览器画了一帧", paragraphs: [
      "async 函数从调用开始仍会执行同步部分，直到碰到需要暂停的 await。即使 await 的值是已完成的 Promise，后面的延续也要经异步调度恢复。它暂停的是这个异步函数，而不是强制当前页面完成绘制。",
    ], examples: [{ code: `async function run() {
  console.log('before await');
  await Promise.resolve();
  console.log('after await');
}
run();
queueMicrotask(() => console.log('queued'));
console.log('outside');
// before await、outside、after await、queued`, expectedOutput: ["before await", "outside", "after await", "queued"], explanation: [
      "调用 run 时先输出 before await。await 安排恢复动作后，调用方继续执行，登记 queued 并输出 outside。这个示例中，run 的恢复动作先于 queued 入队，所以 after await 先输出。",
      "如果 await 等待的 Promise 尚未完成，恢复动作的安排时机就会不同。不要把这里的具体输出背成 await 永远优先于 queueMicrotask 的规则。判断关键是等待的状态与登记动作发生的时间。",
    ] }] },
    { id: "rendering", title: "DOM 改了，不等于用户已经看到了", paragraphs: [
      "把元素文字改成“正在处理”，会同步改变 DOM 状态。JavaScript 随后读取元素内容也能看到新值。但屏幕像素更新还要经过浏览器的渲染工作；当前代码若继续长时间占用执行机会，用户可能只看到计算结束时的最终状态。",
      "await Promise.resolve() 之后继续长计算，通常仍把工作留在微任务处理中。这个 await 可以改变 JavaScript 的执行顺序，却不是通用的“等待加载提示绘制完成”接口。应根据工作量拆成有界批次，让出后续执行机会，或把合适的计算移到 Worker。",
      "requestAnimationFrame 适合在浏览器下一次相应渲染更新中的动画帧回调阶段更新动画状态，通常在绘制之前调用。它不是“已绘制”通知：在回调里执行很长的工作，也会推迟那次更新。后台页回调可能被暂停，不能拿它承担必须准时完成的业务计时。",
      "读取布局属性可能触发同步样式或布局计算，但布局计算完成也不等于屏幕已经呈现。调试时应分别确认数据、DOM、布局、绘制四个层次，避免用某次 console.log 的时间戳证明视觉效果已经发生。",
    ] },
    { id: "application", title: "合并同一段同步代码中的重复更新", paragraphs: [
      "微任务适合有界的收尾工作，例如同一段同步调用里多次通知状态变化，但只想在这段工作结束后统一读取最终状态。关键是确保只排一个微任务，并在执行时解除排队标记。",
    ], examples: [{ code: `let queued = false;
let value = 0;
function update(next) {
  value = next;
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    console.log('flush:' + value);
  });
}
update(1);
update(2);
update(3);
console.log('scheduled');
// scheduled、flush:3`, expectedOutput: ["scheduled", "flush:3"], explanation: [
      "第一次 update 置 queued 为 true 并安排收尾；随后两次只更新 value，不再安排回调。收尾读取的是最终值 3。这依赖几次 update 发生在同一段同步执行中；分散在不同任务里的调用，不保证只会收尾一次。",
      "这个例子只演示合并读取。生产代码还要处理收尾异常、收尾期间再次更新以及资源取消等需求。若收尾持续排入新的微任务，就有可能占住检查点，让后续工作迟迟没有机会。",
    ] }] },
    { id: "pitfalls", title: "从输出题走到真实页面，需要补上这些边界", paragraphs: [
      "第一，计时器的延迟不是精确执行时刻。当前工作耗时、嵌套计时器规则和页面状态都可能影响执行；0 毫秒也不能保证立即或下一帧执行。第二，不同任务来源不构成可随意背诵的全局优先级表，必须看事件来源和实际调度条件。",
      "第三，连续微任务仍可能阻塞体验。有限的一次合并是合理用途，无界的微任务递归则可能持续占用执行机会。教学时不要为了证明这一点直接在主页面运行无限循环，可用性能记录或有界样例观察。",
      "第四，动画帧回调、微任务完成、布局读取都不能单独保证用户已经看到某个中间画面。需要验证加载状态时，用真实页面观察或性能工具，而不只写一个“Promise 已经 resolve”的断言。",
    ] },
    { id: "recall", title: "一套可以重复使用的推导步骤", paragraphs: [
      "先说明运行环境与触发入口，区分普通同步调用、Promise 执行器和真正的回调。同步部分按调用栈执行，遇到登记操作只记录它产生了什么工作，不提前执行回调。",
      "接着追踪微任务的入队时刻，执行一个就更新一次队列；遇到 await 先判断等待的状态，再决定后续恢复何时被安排。处理完相关微任务后，再考虑后续任务。",
      "最后单独讨论渲染：DOM 更新在哪里发生，是否还有长时间同步工作或持续微任务，动画帧回调承担了什么。输出顺序可以证明调度关系，却不能替代对屏幕实际更新的验证。",
    ] },
  ],
  sources: [
    { title: "HTML Standard：事件循环处理模型", url: "https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model" },
    { title: "MDN：微任务深入说明", url: "https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth" },
    { title: "MDN：requestAnimationFrame", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame" },
  ],
};
