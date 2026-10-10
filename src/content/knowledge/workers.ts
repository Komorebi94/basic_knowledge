import type { Article } from "../articles";

export const workerArticle: Article = {
  id: "K02-07", kind: "knowledge", domainSlug: "async", slug: "workers",
  title: "Worker 与消息传递",
  summary: "专用 Worker 有自己的全局环境，没有页面文档。postMessage 默认复制数据；转移 ArrayBuffer 后，发送方的那份缓冲长度变为 0。",
  aliases: ["Worker", "postMessage", "structured clone", "消息传递", "转移"],
  tags: ["JavaScript", "Worker", "消息"], estimatedMinutes: 20, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：发给 Worker 之后再改对象，对方为什么还是旧数字？",
      paragraphs: [
        "假设主线程把 { n: 1 } 发给 Worker，随后把本地的 n 改成 9。Worker 回过来的 n 仍是 1。postMessage 在发送时做了结构化克隆，对方拿到的是另一份数据，不是主线程那个对象的引用。",
        "示例在浏览器里创建专用 Worker，源码放在 Blob 地址中，便于单页运行。这不是业务项目加载脚本的方式，也不是 Node.js 的 worker_threads。Worker 里没有 document。每个示例互不依赖，并在结束时 terminate。",
      ],
      examples: [{ language: "module", code: `const url = URL.createObjectURL(new Blob([
  "self.onmessage = (event) => { const data = event.data; self.postMessage({ kind: data.kind, n: data.n, bytes: data.buffer ? data.buffer.byteLength : 0, doc: typeof document }); };",
], { type: "text/javascript" }));
const worker = new Worker(url);
function ask(data, transfer) {
  return new Promise((resolve) => {
    worker.onmessage = (event) => resolve(event.data);
    worker.postMessage(data, transfer ?? []);
  });
}
const payload = { kind: "clone", n: 1 };
const pending = ask(payload);
payload.n = 9;
const first = await pending;
console.log(first.kind + " " + first.n);
console.log(first.doc);
const buffer = new Uint8Array([4, 5, 6]).buffer;
const moving = ask({ kind: "move", n: 0, buffer }, [buffer]);
console.log(String(buffer.byteLength));
const second = await moving;
console.log(second.kind + " " + second.bytes);
worker.terminate();
URL.revokeObjectURL(url);`, expectedOutput: ["clone 1", "undefined", "0", "move 3"], explanation: [
        "ask 在 postMessage 时把当时的 payload 克隆出去，n 是 1。随后主线程把 payload.n 改成 9，不会改到已经克隆的那份。Worker 回传 clone 1。first.doc 是字符串 undefined，因为 Worker 全局里没有 document，typeof document 得到 \"undefined\"。",
        "第二次把 ArrayBuffer 放进转移列表。postMessage 返回后，主线程这份 buffer 的 byteLength 已是 0，不能再读原来的字节。Worker 收到的 buffer 长度是 3，所以回传 move 3。转移不是复制一份再留着原件，而是把这块内存的所有权交出去。",
      ] }],
    },
    {
      id: "clone", title: "复制让两边互不影响，也让大对象在发送时占用主线程",
      paragraphs: [
        "结构化克隆会复制可克隆的数据，包括普通对象、数组、Map、Set 和 ArrayBuffer 的内容。函数、DOM 节点和某些带方法的对象不能克隆，发送它们会抛出 DataCloneError，消息不会悄悄变成半份对象。",
        "复制发生在发送的那一次调用里。数据很大时，主线程要花时间完成这份拷贝，Worker 才开始处理。把计算挪到 Worker，却每次发送整份未裁剪的数据，主线程的成本可能仍在 postMessage。能转移的二进制缓冲，或不必要的字段先去掉，再比较发送前后的耗时。",
      ],
      examples: [{ code: `const workerCode = "self.onmessage = () => self.postMessage('ready');";
const url = URL.createObjectURL(new Blob([workerCode], { type: "text/javascript" }));
const worker = new Worker(url);
const failed = new Promise((resolve) => {
  worker.onmessage = () => resolve("message");
  worker.onerror = () => resolve("error");
  try {
    worker.postMessage({ run() { return 1; } });
    resolve("sent");
  } catch (error) {
    resolve(error.name);
  }
});
failed.then((value) => {
  console.log(value);
  worker.terminate();
  URL.revokeObjectURL(url);
});`, expectedOutput: ["DataCloneError"], explanation: [
        "对象里的 run 是函数。postMessage 在主线程克隆时就抛出 DataCloneError，resolve 得到这个名字。Worker 不会收到这条消息，因此也不会回 ready。",
        "捕获发送错误只说明这次没有送出。调用方若还把本地状态当成“Worker 已开始处理”，就会和 Worker 的真实队列不一致。函数应留在创建它的环境里，发给 Worker 的是数据。",
      ] }],
    },
    {
      id: "isolation", title: "Worker 不共享页面对象，来回消息才是结果进入页面的路径",
      paragraphs: [
        "专用 Worker 有自己的全局作用域和事件循环。它看不到主线程的 let 变量、DOM 和 window 上的业务状态。主线程也看不到 Worker 里的局部变量。两边能交换的是消息数据。",
        "因此 Worker 适合纯计算和解析，不适合直接改页面。结果要 postMessage 回主线程，由主线程决定写入哪些 DOM。长时间占用 Worker 不会自动让页面保持响应；主线程若在收到结果后做沉重的渲染，卡顿仍在主线程。",
      ],
      diagram: {
        caption: "页面和 Worker 之间只有消息，没有共享的文档",
        lines: [
          "主线程：页面对象、业务变量",
          "    │ postMessage 复制或转移",
          "    ↓",
          "Worker：自己的全局环境，typeof document === \"undefined\"",
          "    │ postMessage 结果",
          "    ↓",
          "主线程：收到数据后再更新页面",
        ],
      },
    },
    {
      id: "choices", title: "怎么选：默认复制，只有不再使用的缓冲才转移",
      paragraphs: [
        "对象不大、发送后主线程还要继续读，就用默认复制。ArrayBuffer 或 MessagePort 在发送后主线程不再使用，才放入转移列表。转移后的缓冲 byteLength 为 0，继续读取是错误用法。不确定后面还要不要这份字节，就不要转移。",
        "一个 Worker 上的 onmessage 若在每次请求时被覆盖，后一次会拆掉前一次的回调。同时有多条回复时，要用一个监听器按顺序分发，或让每条消息带上编号再配对。本单元的第一例在收到前一条之后才发下一条，所以覆盖 onmessage 仍然对得上。",
        "看一次 postMessage 时，确认数据能否被结构化克隆，以及转移列表里的缓冲之后还是否被使用。两件事有一件不清楚，这条消息的成本或所有权就还没确定。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，确认这是浏览器专用 Worker，还是别的线程 API。本文的 document 结论不要直接套到 Node.js worker_threads。",
        "第二步，看 postMessage 的数据是否可克隆。函数和节点会在发送时失败，不会变成 Worker 里的同名函数。",
        "第三步，看有没有转移列表。有的话，发送返回后原缓冲的 byteLength 应为 0。没有的话，发送后修改本地对象不会影响对方。",
        "第四步，看结果如何回到页面。Worker 里没有文档，更新界面的代码应在主线程收到消息之后。开头的 n 在本地改成 9 之后，Worker 仍回 1，就是因为克隆发生在赋值之前。",
      ],
    },
  ],
  sources: [
    { title: "HTML：Worker", url: "https://html.spec.whatwg.org/multipage/workers.html#workers" },
    { title: "HTML：结构化克隆", url: "https://html.spec.whatwg.org/multipage/structured-data.html#structured-cloning" },
    { title: "MDN：Worker.postMessage", url: "https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage" },
  ],
};
