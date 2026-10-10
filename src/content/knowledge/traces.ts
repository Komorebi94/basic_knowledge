import type { Article } from "../articles";

export const traceArticle: Article = {
  id: "K02-08", kind: "knowledge", domainSlug: "async", slug: "traces",
  title: "可观测异步流程",
  summary: "同一次操作用同一个标识记下开始、成功和失败。只在成功时打印，就无法把这次超时和另一次操作分开。",
  aliases: ["trace", "correlation id", "observability", "日志", "性能"],
  tags: ["JavaScript", "日志", "异步"], estimatedMinutes: 18, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：两条日志都写着失败，是哪一次请求？",
      paragraphs: [
        "假设保存和刷新几乎同时进行。失败日志若只写“请求失败”，就看不出是保存超时，还是刷新被拒绝。给每次操作一个标识，并在开始、成功、失败时都带上它，才能把同一次流程的事件串起来。",
        "示例里的标识是调用方传入的 A 和 B，不是随机演示。performance.now 只用来说明结束时刻不早于开始时刻，不把某一次的毫秒数当成性能结论。示例运行在现代浏览器。",
      ],
      examples: [{ language: "module", code: `function traced(id, task) {
  const events = [id + " start"];
  const started = performance.now();
  return Promise.resolve().then(task).then(
    (value) => {
      events.push(id + " success");
      return { value, events, ordered: performance.now() >= started };
    },
    (error) => {
      events.push(id + " fail " + error.message);
      return { value: null, events, ordered: performance.now() >= started };
    },
  );
}
const saved = await traced("A", () => Promise.resolve("saved"));
const failed = await traced("B", () => Promise.reject(new Error("timeout")));
console.log(saved.events.join(","));
console.log(saved.value);
console.log(String(saved.ordered));
console.log(failed.events.join(","));
console.log(String(failed.value));
console.log(String(failed.ordered));`, expectedOutput: ["A start,A success", "saved", "true", "B start,B fail timeout", "null", "true"], explanation: [
        "A 的事件是 start 然后 success，值是 saved。B 的任务拒绝为 timeout，失败回调记下 B fail timeout，值是 null，没有抛到 traced 的外面。两次操作的标识不同，失败行不会和 A 混在一起。",
        "ordered 为 true，只表示读取结束时刻时 performance.now() 不小于开始时刻。它不是耗时预算，也不是页面已经流畅的证据。真正的耗时要把开始、结束和标识一起交给性能记录，而不是只在控制台看一个布尔值。",
      ] }],
    },
    {
      id: "scope", title: "标识要穿过 await，不能只放在最外层的成功分支",
      paragraphs: [
        "一次用户操作可能包含校验、请求和写入缓存。若只有最外层 then 在成功时打印，中间步骤失败就没有标识。标识应在操作开始时确定，并作为参数传进每一步，而不是在打印前临时再读全局的“当前请求”。",
        "全局当前请求会在重叠操作里被覆盖。A 还没结束时 B 开始，全局变量变成 B，A 的失败日志就会写成 B。每一步保存自己收到的 id，才不会串。",
      ],
      examples: [{ code: `const lines = [];
let current = "none";
function wrong(id) {
  current = id;
  return Promise.resolve().then(() => {
    if (id === "A") throw new Error("timeout");
    lines.push(current + " success");
  }).catch((error) => {
    lines.push(current + " fail " + error.message);
  });
}
const first = wrong("A");
const second = wrong("B");
Promise.all([first, second]).then(() => console.log(lines.join(",")));`, expectedOutput: ["B success,B fail timeout"], explanation: [
        "这是错误实现。wrong 把 id 写进共享的 current。B 的调用在 A 的回调之前就把 current 改成 B。B 的成功回调先记下 B success。A 的失败回调再读 current，于是 A 的 timeout 被记成 B fail timeout。",
        "两条日志都带 B，A 的标识消失了。修复是在 catch 里使用函数参数 id，而不是 current。共享变量只适合不会重叠的状态；重叠的异步操作要各自保存标识。",
      ] }],
    },
    {
      id: "failure", title: "失败路径要保留原因，成功路径不要把标识留在页面文案里代替日志",
      paragraphs: [
        "用户看到的可以是“保存没有完成”。排查用的记录还要有标识、失败阶段和错误名或消息。只弹一句文案、不记录标识，下次无法和服务端日志对照。把内部异常栈直接显示给用户，又超出了用户完成操作所需要的信息。",
        "记录本身不要触发新的重试或新的请求，否则观察动作改变了原来的流程。下面把面向用户的句子和排查记录分开，并让失败记录带上阶段。",
      ],
      examples: [{ code: `function settle(id, stage, error) {
  if (error) {
    return {
      user: "保存没有完成",
      record: id + " " + stage + " " + error.name,
    };
  }
  return { user: "已保存", record: id + " " + stage + " success" };
}
const failed = settle("A", "upload", new TypeError("network"));
const saved = settle("B", "upload", null);
console.log(failed.user);
console.log(failed.record);
console.log(saved.user);
console.log(saved.record);`, expectedOutput: ["保存没有完成", "A upload TypeError", "已保存", "B upload success"], explanation: [
        "失败时用户句子不包含标识和 TypeError，排查记录则是 A upload TypeError。成功时用户句子是已保存，记录带上 B 和阶段。两次的标识不同，阶段都写明是 upload。",
        "error.name 比把整个错误对象塞进页面更可控。若还要保留消息，应确认其中没有令牌或个人信息。这个函数不发请求，也不会因为记录失败而再次调用 upload。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：一次操作一个标识，成功和失败都记",
      paragraphs: [
        "点击、提交或刷新开始时生成标识，传给请求头、本地日志和错误上报。await 前后用同一个参数。成功、失败和取消都记一条带标识的结果；取消用 AbortError 或明确的取消原因，不要记成未知失败。",
        "性能测量用同一标识标记开始和结束，再看重复操作的分布。一次 performance.now 的差值只是一次样本。不要把实验室里的单次数值写成所有用户的耗时。",
        "看一段异步函数时，找出失败分支的日志。若失败分支没有操作标识，重叠请求就无法事后分开。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，找到标识在哪里生成，是否作为参数传进每一步。写到共享变量里的标识，会被后一次操作覆盖。",
        "第二步，列出成功、失败和取消三条记录。缺一条，这条路径就无法和另一次操作区分。",
        "第三步，分开用户可见的句子和排查记录。用户句子不代替标识，排查记录也不直接铺到界面上。",
        "第四步，看计时有没有和同一次标识连在一起。单独一个布尔值或一次毫秒数，不能说明流程已经可观察。开头的 B fail timeout 能和 A 分开，是因为事件字符串里一直使用各自的参数。",
      ],
    },
  ],
  sources: [
    { title: "W3C：Performance.now", url: "https://www.w3.org/TR/hr-time-3/#dom-performance-now" },
    { title: "MDN：Performance.now", url: "https://developer.mozilla.org/en-US/docs/Web/API/Performance/now" },
  ],
};
