import type { Article } from "../articles";

export const asyncAwaitArticle: Article = {
  id: "K02-03", kind: "knowledge", domainSlug: "async", slug: "async-await",
  title: "async/await 与资源清理",
  summary: "await 暂停的是当前异步函数，不是整段脚本。连续 await 是串行；同时创建多个 Promise 才是并行。finally 里的 return 会盖掉原来的结果。",
  aliases: ["async", "await", "finally", "串行", "并行"],
  tags: ["JavaScript", "async", "资源清理"], estimatedMinutes: 20, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：清理代码把要返回的值换掉了",
      paragraphs: [
        "假设读取配置成功后要返回 value，并在 finally 里关闭文件。若 finally 也写了 return \"cleanup\"，调用方拿到的是 cleanup，不是读取到的 value。关闭动作不该成为函数的结果。",
        "带顶层 await 的示例按 ES 模块运行。async 函数在遇到 await 之前仍是同步执行；finally 若没有 await，会在函数返回承诺之前同步跑完。每个示例互不依赖。",
      ],
      examples: [{ language: "module", code: `async function overwritten() {
  try {
    return "value";
  } finally {
    return "cleanup";
  }
}
async function kept() {
  try {
    return "value";
  } finally {
    console.log("cleanup");
  }
}
console.log("over " + await overwritten());
console.log("kept " + await kept());
console.log("sync");`, expectedOutput: ["over cleanup", "cleanup", "kept value", "sync"], explanation: [
        "overwritten 的 try 准备返回 value，但 finally 又 return 了 cleanup。这次函数的结果变成 cleanup，调用方打印 over cleanup。这是错误清理：释放资源的代码不该再写 return。",
        "kept 的 finally 只打印 cleanup，没有新的返回值。函数结果仍是 value，所以顺序是先打印 cleanup，再打印 kept value。两个 await 都结束后才执行 sync。finally 适合关闭、解锁和还原状态，结果仍由 try 或 catch 决定。",
      ] }],
    },
    {
      id: "serial", title: "串行是前一个 await 结束才开始下一个，并行是先一起发起",
      paragraphs: [
        "在同一个 async 函数里写 await step(\"a\") 再 await step(\"b\")，b 的函数体要等 a 的 await 恢复后才执行。把两个 step 同时放进 Promise.all，两个函数都会先跑到自己的第一个 await，然后再各自恢复。",
        "函数标成 async 不会自动并行，也不会自动加快。没有 await 的大段计算仍然占着当前调用，后面的定时器和渲染都要等它返回。并行只发生在多个 Promise 已经创建、执行权可以在它们之间交替的时候。",
      ],
      examples: [{ language: "module", code: `const log = [];
async function step(name) {
  log.push("start-" + name);
  await Promise.resolve();
  log.push("end-" + name);
}
await (async function serial() {
  await step("a");
  await step("b");
})();
console.log(log.join(","));
log.length = 0;
await Promise.all([step("c"), step("d")]);
console.log(log.join(","));`, expectedOutput: ["start-a,end-a,start-b,end-b", "start-c,start-d,end-c,end-d"], explanation: [
        "串行时 a 从 start 到 end 都结束后，b 才 start。第二次调用 step(\"b\") 还没发生，b 的工作就不会开始。",
        "并行时 c 和 d 都先打印 start，说明两个函数都已经执行到 await。随后两个 end 才出现。若 step 里在 await 之前就发起了请求，Promise.all 会让这些请求重叠；若请求写在第二个 await 之后，那一次请求仍然是串行的。",
      ] }],
    },
    {
      id: "errors", title: "await 到拒绝，会在这一行抛出；清理要覆盖成功和失败",
      paragraphs: [
        "await 一个拒绝的 Promise，相当于在这一行抛出它的原因。try/catch 能接住。若 catch 里不重新抛出，函数会以 catch 的返回值兑现，调用方看不出失败。",
        "资源要在 finally 里释放，这样成功返回和 catch 之后离开都会执行。释放本身若可能失败，要单独处理，避免它替换原来的业务错误。下面只演示业务错误被保留，清理日志仍然出现。",
      ],
      examples: [{ language: "module", code: `async function load() {
  try {
    await Promise.reject(new Error("missing"));
    return "value";
  } catch (error) {
    console.log("caught " + error.message);
    throw error;
  } finally {
    console.log("cleanup");
  }
}
try {
  console.log(await load());
  console.log("resolved");
} catch (error) {
  console.log("outer " + error.message);
}`, expectedOutput: ["caught missing", "cleanup", "outer missing"], explanation: [
        "await 到拒绝后进入 catch，打印 caught missing，再把同一个错误抛出。finally 仍会执行，所以 cleanup 出现在外层 catch 之前。函数没有返回 value，外层也没有打印 resolved。",
        "若 catch 只打印、不 throw，load 会兑现为 undefined，外层会走到 resolved。那是另一种结果：失败被吞掉。清理日志不能代替把错误继续传出去。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：有依赖就串行，无依赖再同时发起",
      paragraphs: [
        "下一步需要上一步的返回值时，用连续 await。彼此无关的读取用 Promise.all，让它们同时开始。all 里任何一个拒绝会让整组拒绝，已经发出的其他工作不会自动取消；取消要另外接 AbortSignal。",
        "finally 里做关闭和复位，不要 return 或 throw 一个新的结果，除非明确要用这个失败覆盖业务结果，并在注释里说明。关闭失败和业务失败最好分开记录，否则调用方只看得到后一个错误。",
        "看一段 async 函数时，列出每个 await 之前已经创建了哪些 Promise。还没创建的那一个，就不会和前面的请求并行。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，找到 await。它只暂停这个 async 函数，同一批已经创建的其他 Promise 仍可继续。",
        "第二步，看多个操作是先后 await，还是先放进 all 或其他组合。先后 await 的启动顺序就是源代码顺序。",
        "第三步，看拒绝会在哪一行变成抛出。catch 若不重新抛出，函数会兑现。调用方的 try 就接不到这个错误。",
        "第四步，看 finally 有没有 return 或 throw。有的话，它会变成这次调用的结果。开头的 overwritten 返回 cleanup，就是 finally 换掉了 value。",
      ],
    },
  ],
  sources: [
    { title: "ECMAScript：async 函数", url: "https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-async-function-definitions" },
    { title: "ECMAScript：await", url: "https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-async-functions-abstract-operations" },
    { title: "MDN：async function", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function" },
  ],
};
