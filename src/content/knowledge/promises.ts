import type { Article } from "../articles";

export const promiseArticle: Article = {
  id: "K02-02", kind: "knowledge", domainSlug: "async", slug: "promises",
  title: "Promise、错误传播与组合",
  summary: "每次 then 都返回新的 Promise。拒绝会沿着这条链传递；all、allSettled、race 和 any 对失败的处理并不相同。",
  aliases: ["Promise", "Promise.all", "Promise.allSettled", "Promise.race", "Promise.any", "错误传播"],
  tags: ["JavaScript", "Promise", "异步"], estimatedMinutes: 22, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：catch 前面还有一行 then，为什么它没有执行？",
      paragraphs: [
        "假设保存任务先得到编号 1，下一步把它加一，再交给上传。上传抛出 stop 之后，后面那个打印成功的 then 没有出现，catch 却拿到了 stop。链并没有中断在抛出的那一行源代码上，而是改走拒绝这条路径。",
        "示例运行在现代浏览器。Promise 回调是微任务，排在当前脚本之后；这和定时器不是同一条队列，任务与微任务的先后已在上一单元说明。这里只追问拒绝如何传递，以及多个 Promise 组合时谁决定整次结果。每个示例互不依赖。",
      ],
      examples: [{ code: `Promise.resolve(1)
  .then((value) => {
    console.log("first " + value);
    return value + 1;
  })
  .then((value) => {
    console.log("second " + value);
    throw new Error("stop");
  })
  .then(() => console.log("skipped"))
  .catch((error) => {
    console.log("caught " + error.message);
    return "recovered";
  })
  .then((value) => console.log("after " + value));`, expectedOutput: ["first 1", "second 2", "caught stop", "after recovered"], explanation: [
        "前两个 then 的回调依次执行，打印 first 1 和 second 2。第二个回调抛出错误，这个 then 返回的 Promise 变为拒绝。再后面的 then 只登记了成功回调，拒绝不会进入它，所以没有 skipped。",
        "catch 收到 stop，并返回 recovered。catch 本身返回的是新的 Promise，返回普通值就使它变为兑现。最后的 then 因此执行，打印 after recovered。捕获之后如果还要保持失败，需要重新抛出，而不是返回一个正常值。",
      ] }],
    },
    {
      id: "chain", title: "then 的返回值决定下一次拿到什么",
      paragraphs: [
        "then 和 catch 总会返回一个新的 Promise，不会改写原来那个。回调返回普通值，新 Promise 就以该值兑现。回调返回 Promise，新 Promise 会跟随它兑现或拒绝。回调抛错，新 Promise 拒绝。",
        "忘记 return，回调的结果就是 undefined。里面即使又创建了一个 Promise，外层也等不到它。这是错误写法：任务看起来包在 then 里，调用方却在内层结束前就继续了。",
      ],
      examples: [{ code: `function missingReturn() {
  return Promise.resolve("task").then(() => {
    Promise.resolve("inner");
  });
}
missingReturn().then((value) => console.log("missing " + String(value)));
function forwarded() {
  return Promise.resolve("task").then(() => Promise.resolve("inner"));
}
forwarded().then((value) => console.log("forwarded " + value));`, expectedOutput: ["missing undefined", "forwarded inner"], explanation: [
        "missingReturn 的回调创建了 inner，但没有 return。then 看到的返回值是 undefined，所以调用方打印 missing undefined。inner 后来会自己兑现，只是没有任何回调在等它，这个结果被丢掉了。",
        "forwarded 把内层 Promise return 出去。外层 then 跟随它，打印 forwarded inner。要等的工作必须出现在返回值里，只是写在回调函数体中不会自动接上链条。",
      ] }],
    },
    {
      id: "combinators", title: "组合方法约定的是整组结果，不是把每个 Promise 变成同一种失败",
      paragraphs: [
        "Promise.all 在每一个都兑现时，按输入顺序给出结果数组。任何一个拒绝，all 就拒绝，并且不再等待其余成员。一个永远不结束的成员不会挡住已经发生的拒绝，但在全部都还没拒绝时，它会让 all 一直挂着。",
        "Promise.allSettled 等所有成员都结束，每一项是 fulfilled 或 rejected，它本身不会因为成员拒绝而拒绝。Promise.race 采用最先结束的那一个，不论兑现还是拒绝。Promise.any 采用最先兑现的那一个；若全部拒绝，它拒绝为一个 AggregateError。",
      ],
      examples: [{ code: `const pending = new Promise(() => {});
Promise.all([
  Promise.resolve("a"),
  Promise.reject(new Error("b")),
  pending,
]).then(() => console.log("all-ok")).catch((error) => console.log("all " + error.message));
Promise.allSettled([
  Promise.resolve("a"),
  Promise.reject(new Error("b")),
]).then((items) => console.log(items.map((item) => item.status).join(",")));
Promise.race([
  Promise.resolve("first"),
  pending,
]).then((value) => console.log("race " + value));
Promise.any([
  Promise.reject(new Error("x")),
  Promise.resolve("y"),
]).then((value) => console.log("any " + value));
Promise.any([
  Promise.reject(new Error("x")),
  Promise.reject(new Error("z")),
]).catch((error) => console.log(error.name));`, expectedOutput: ["fulfilled,rejected", "race first", "any y", "AggregateError", "all b"], explanation: [
        "all 因为 b 拒绝，打印 all b，没有打印 all-ok。pending 一直不结束，也没有阻止这次拒绝先传出来。页面不能据此认为 pending 里的请求已经停止，它只是不再影响 all 的结果。",
        "allSettled 给出 fulfilled,rejected，两次成员都算结束。race 采用已经兑现的 first，不等 pending。any 在有一个 y 兑现时就得到 y；两个都拒绝时，错误名是 AggregateError，不是第一个 Error 的名字。选方法之前要写明：需要全部成功、需要每一项的结局、需要最先结束，还是需要最先成功。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：失败要停掉整组，还是要留下每一项的结局",
      paragraphs: [
        "保存一组互相依赖的步骤时，用链式 then 或 async 函数，并在每一步 return。一组彼此独立、必须全部成功才继续的工作，用 all。需要知道哪些失败、哪些成功，用 allSettled，再自己决定要不要继续。race 适合“谁先完成就采用谁”，调用方仍要处理那个先完成的可能是拒绝。any 适合“有一个成功即可”，并要准备全部失败时的 AggregateError。",
        "catch 后面的 then 表示已经恢复。若恢复不了，就在 catch 里重新抛出。不要把拒绝写成返回空字符串，让后面的代码把失败当成正常值。",
        "读一条链时标出每个回调的返回值：普通值、Promise，还是抛错。返回值说不清的那一步，下一步的输入就不能确定。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，找到每个 then 或 catch 返回的新 Promise。原来的 Promise 不会因为后面加了回调而改变。",
        "第二步，看回调 return 了什么。没有 return 就是 undefined。返回的 Promise 还没结束时，外层会跟着等；抛错则外层拒绝。",
        "第三步，拒绝只会进入后面的拒绝回调。成功回调会被跳过，直到某个 catch 返回了正常值，链才重新兑现。",
        "第四步，对 all、allSettled、race、any 分别问：一个拒绝会不会让整组拒绝，还在进行的成员会不会被取消。开头的 skipped 没有打印，是因为 stop 已经把链带进了 catch。",
      ],
    },
  ],
  sources: [
    { title: "ECMAScript：Promise", url: "https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects" },
    { title: "ECMAScript：Promise.all", url: "https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise.all" },
    { title: "ECMAScript：Promise.any", url: "https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise.any" },
    { title: "MDN：Promise", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" },
  ],
};
