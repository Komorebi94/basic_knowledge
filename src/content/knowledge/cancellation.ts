import type { Article } from "../articles";

export const cancellationArticle: Article = {
  id: "K02-05", kind: "knowledge", domainSlug: "async", slug: "cancellation",
  title: "取消、过期结果与竞态",
  summary: "AbortSignal 用来阻止还没做完的工作。请求序号用来丢掉已经过期的结果。取消成功，并不自动保证页面不会留下旧数据。",
  aliases: ["AbortSignal", "AbortController", "竞态", "取消", "过期结果"],
  tags: ["JavaScript", "取消", "竞态"], estimatedMinutes: 20, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：后发出的结果已经显示，先发出的却还想写回来",
      paragraphs: [
        "假设搜索先发出请求 old，随后输入变化又发出 new。new 先回来并显示。若 old 稍后也回来，直接写入页面，用户会看到已经过期的结果。把 old 的 AbortController 取消，只能阻止那些还在看信号的步骤；已经算出并准备写入的值，仍要靠“这是不是最新一次请求”来丢掉。",
        "示例运行在现代浏览器，不发起真实网络请求。AbortSignal.reason 在 abort() 时是名为 AbortError 的 DOMException。每个示例互不依赖。",
      ],
      examples: [{ code: `let latest = 0;
const shown = [];
function finish(id, value) {
  if (id !== latest) {
    shown.push("ignore " + value);
    return;
  }
  shown.push("show " + value);
}
const first = ++latest;
const second = ++latest;
finish(first, "old");
finish(second, "new");
console.log(shown.join(","));`, expectedOutput: ["ignore old,show new"], explanation: [
        "first 和 second 按发出顺序取得编号。第二次自增之后，latest 是 second。finish(first) 发现编号已经不是最新，把 old 记为 ignore，不写入。finish(second) 与 latest 相同，记为 show。",
        "这个判断不依赖谁先返回。即使 old 的函数调用写在 new 后面，只要比较的是发出时保存的编号和当前 latest，过期结果就不会显示。编号必须在发起时取得，不能在返回时才去读一个会变的输入框。",
      ] }],
    },
    {
      id: "abort", title: "AbortSignal 通知工作停止，不会把已经完成的写入撤销",
      paragraphs: [
        "AbortController.abort() 把 signal.aborted 设为 true，并把 reason 放在 signal 上。还没开始的工作应先看 aborted，直接拒绝。已经开始的工作可以监听 abort 事件，在事件里拒绝自己的 Promise、清除定时器或中断读取。",
        "若结果已经写进页面，再 abort 不会自动把那次写入改回去。监听器只有在结果应用之前注册并执行，才来得及阻止写入。下面先证明信号本身会拒绝等待中的工作，再说明它和序号是两件事。",
      ],
      examples: [{ code: `const early = new AbortController();
early.abort();
console.log(String(early.signal.aborted));
console.log(early.signal.reason.name);
const later = new AbortController();
const work = new Promise((resolve, reject) => {
  if (later.signal.aborted) {
    reject(later.signal.reason);
    return;
  }
  later.signal.addEventListener("abort", () => reject(later.signal.reason), { once: true });
});
later.abort();
work.then(() => console.log("work-ok")).catch((error) => console.log("work " + error.name));`, expectedOutput: ["true", "AbortError", "work AbortError"], explanation: [
        "early.abort() 之后，aborted 为 true，reason.name 是 AbortError。已经中止的信号不会自己变回未中止，下一次操作需要新的 AbortController。",
        "later 上的工作先登记了 abort 监听。later.abort() 同步触发监听，reject 这个 Promise。随后的 catch 打印 work AbortError，没有 work-ok。reject 只结束这个 Promise；如果回调在 reject 之前已经改了页面变量，那些赋值仍然留着。",
      ] }],
    },
    {
      id: "both", title: "取消省掉后续工作，序号挡住已经产生的旧结果",
      paragraphs: [
        "只使用序号时，旧请求仍会把响应读完，占用连接和解析时间，只是不显示。只使用 abort 时，若某条路径没有把 signal 传下去，或者结果在 abort 之前已经应用，页面仍可能闪过旧数据。两者一起用：发起新请求时 abort 上一次，并为这一次记下编号；写入前再核对编号。",
        "abort 不是事务回滚。它不保证 fetch、文件读取或第三方函数真的停止，只保证那些实现了信号的 API 会收到通知。自己的循环和队列也要在每一步查看 signal.aborted。看到已经中止却继续写入，是错误实现。",
      ],
      examples: [{ code: `let latest = 0;
let view = "empty";
function start() {
  const controller = new AbortController();
  const id = ++latest;
  return { controller, id };
}
function apply(id, value, signal) {
  if (signal.aborted || id !== latest) return "ignored";
  view = value;
  return "applied";
}
const first = start();
const second = start();
first.controller.abort();
console.log(apply(first.id, "old", first.controller.signal));
console.log(apply(second.id, "new", second.controller.signal));
console.log(view);`, expectedOutput: ["ignored", "applied", "new"], explanation: [
        "第二次 start 让 latest 变成 second 的编号，并留下一个还没 abort 的控制器。first 被 abort 后，apply 看到 signal.aborted，返回 ignored，view 仍是 empty。",
        "second 的信号没有中止，编号也等于 latest，于是 view 写成 new。若删掉 signal.aborted 这一侧，只靠编号也能忽略 first，因为 latest 已经变了；若删掉编号、又忘记 abort，后返回的 first 仍会覆盖 new。示例把两个条件都放在写入前。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：能传到 API 的用信号，写入前一定对编号",
      paragraphs: [
        "fetch、流读取和其他声明接受 AbortSignal 的 API，把当前操作的 signal 传进去，以便底层停止等待。自己的异步函数在每个 await 之后检查 aborted，避免白做下一步。页面状态、缓存写入和提示文案在变更前核对请求编号。",
        "不要复用已经 abort 的控制器来表示下一次请求。不要只在按钮上设一个“已取消”布尔值，却让所有进行中的请求共用它；后一次请求可能被前一次的取消误伤。每次操作一对控制器和编号，结束时只让这一对失效。",
        "看一次搜索实现时，找出旧请求返回后执行的赋值。那一行若既不看信号也不看编号，竞态还在。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，找到一次操作的编号是在发起时固定的，还是在返回时才读最新输入。返回时才读，就不能代表“这是当时那一次”。",
        "第二步，看 abort 发生后，哪些步骤会拒绝或跳出。没有把 signal 传进去的步骤不会停。",
        "第三步，找到写入页面或缓存的那一行。它是否在写入前同时检查 aborted 和编号。只检查其中一个，就会漏掉另一类过期结果。",
        "第四步，确认下一次操作用的是新的 AbortController。开头的 old 被 ignore，是因为 latest 已经变成后一次的编号，而不是因为旧字符串自己会过期。",
      ],
    },
  ],
  sources: [
    { title: "DOM：AbortController", url: "https://dom.spec.whatwg.org/#abortcontroller" },
    { title: "DOM：AbortSignal", url: "https://dom.spec.whatwg.org/#interface-AbortSignal" },
    { title: "MDN：AbortSignal", url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal" },
  ],
};
