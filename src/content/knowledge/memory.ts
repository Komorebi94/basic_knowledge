import type { Article } from "../articles";

export const memoryArticle: Article = {
  id: "K01-08", kind: "knowledge", domainSlug: "javascript", slug: "memory",
  title: "内存与垃圾回收",
  summary: "对象能否回收取决于还有没有可达引用。Map 会保住键和值；WeakMap 不阻止键被回收，但示例不能把某一次回收时刻写成必然发生。",
  aliases: ["garbage collection", "WeakMap", "WeakRef", "垃圾回收", "弱引用", "内存泄漏"],
  tags: ["JavaScript", "内存", "可达性"], estimatedMinutes: 20, verifiedAt: "2026-10-08",
  sections: [
    {
      id: "problem", title: "从一个问题开始：局部变量已经清空，缓存为什么还在？",
      paragraphs: [
        "假设用 Map 按会话对象缓存一份较大的数据。函数返回前把局部变量设为 null，调用方可能以为会话已经可以回收。Map 自己还持有这个对象作为键，条目的 size 仍然是 1。变量结束和对象不可达不是同一件事。",
        "示例运行在现代浏览器。这里只断言引用关系，不断言垃圾回收器已经在某一行运行。回收时机由引擎决定，不能从一次 console.log 证明对象已经被收走。",
      ],
      examples: [{ code: `const cache = new Map();
let session = { id: "s1" };
cache.set(session, { payload: "large" });
console.log(cache.get(session).payload);
session = null;
console.log(cache.size);`, expectedOutput: ["large", "1"], explanation: [
        "set 之后，Map 同时引用键和值。session = null 只是这个局部绑定不再指向对象，Map 内部的键引用还在，所以 size 仍是 1，payload 刚才也能取到。",
        "要让这组键值不再被 Map 保住，需要 cache.delete 在还拿着键的时候删除，或丢掉整个 Map。只清业务变量，不会自动删掉容器里的条目。",
      ] }],
    },
    {
      id: "reachability", title: "回收看可达性：从根还能不能走到这个对象",
      paragraphs: [
        "引擎可以从一组根出发走到的对象，都还不能回收。根包括正在执行的调用、模块顶层绑定，以及浏览器持有的文档、事件目标和定时器。一条路径上只要还有引用，对象就可达。",
        "函数返回只结束这次调用栈上的绑定。返回值、闭包、集合、监听器都可能把对象留在别的路径上。内存持续增长时，要找的是这条路径，而不是先假设语言没有回收。",
      ],
      diagram: {
        caption: "局部变量清空之后，Map 仍保住会话",
        lines: [
          "session 变量 = null",
          "cache → Map 条目",
          "         ├─ 键：会话对象 { id: s1 }",
          "         └─ 值：{ payload: large }",
          "从 cache 仍能走到会话对象，所以它继续可达",
        ],
      },
    },
    {
      id: "weakmap", title: "WeakMap 的键可以是对象或未注册 Symbol",
      paragraphs: [
        "WeakMap 不建立对键的强引用。现代规范允许对象以及未注册的 Symbol 作为键，例如 Symbol('session')；Symbol.for('session') 注册在全局符号注册表中，不能作为弱键。只要没有其它强引用让允许的键保持可达，它就可能被回收。值仍可被外部引用，因此不能说键消失后值必然立即回收。",
        "WeakMap 不可枚举，也没有 size。这避免把垃圾回收的不确定时机暴露为可观察的键集合；并非只是因为枚举暂时取得的引用会阻止回收。字符串、数字和注册 Symbol 作为 set 的键会抛出 TypeError。按可重建的字符串 ID 长期查找应使用 Map 并规定淘汰；使用 Symbol 弱键前还需确认目标运行时支持。",
      ],
      examples: [{ code: `const cache = new WeakMap();
const session = { id: "s1" };
cache.set(session, { payload: "large" });
console.log(cache.get(session).payload);
console.log(cache.size === undefined);
const token = Symbol('session');
cache.set(token, { payload: 'symbol-data' });
console.log(cache.get(token).payload);
try {
  cache.set(Symbol.for('session'), { payload: 'no' });
} catch (error) {
  console.log(error.name);
}
try {
  cache.set("s1", { payload: "no" });
  console.log("stored");
} catch (error) {
  console.log(error.name);
}`, expectedOutput: ["large", "true", "symbol-data", "TypeError", "TypeError"], explanation: [
        "session 仍被常量引用，所以 get 能取回 large。cache.size 是 undefined，WeakMap 不提供可以遍历出全部键的计数字段。",
        "未注册 token 保持可达，可以读取 symbol-data；注册 Symbol.for('session') 和字符串 s1 都被拒绝，分别抛出 TypeError。这个失败来自键不符合弱持有条件，不是容量满了。示例只验证允许与禁止的键，以及强引用仍在时可读，不证明任何键已经被回收。",
      ] }],
    },
    {
      id: "weakref", title: "WeakRef 在强引用还在时能取回对象，回收时刻不可作为输出",
      paragraphs: [
        "WeakRef 保存对目标的弱引用。目标仍被其他强引用指着时，deref() 返回那个对象。所有强引用都断开之后，引擎可以在将来的某次回收中清掉目标，此后 deref() 返回 undefined。规范没有规定这会发生在下一行。",
        "FinalizationRegistry 可以在回收之后安排回调，回调同样没有截止时间，也不能在回调里可靠地使用已经回收的对象。排查泄漏不要写一个“置空后必定打印 collected”的判断。应保留强引用来观察身份，用堆快照看断开操作之后还有哪些路径。",
      ],
      examples: [{ code: `let session = { id: "s1" };
const ref = new WeakRef(session);
console.log(ref.deref() === session);
console.log(ref.deref().id);`, expectedOutput: ["true", "s1"], explanation: [
        "session 这个绑定还在，deref 返回的就是原来的对象，id 为 s1。WeakRef 在强引用存在时不会把对象变成空。",
        "若接下来执行 session = null，本页不再断言下一行的 deref 结果。它可能仍是对象，也可能在之后的回收中变成 undefined。把某一次运行里看到的回收时机写成语言规则，会让测试偶发失败，也不能指导生产代码。",
      ] }],
    },
    {
      id: "listeners", title: "监听器会保住闭包里的对象，移除时必须是同一个函数",
      paragraphs: [
        "事件目标引用监听函数，监听函数若引用会话对象，会话就从事件目标可达。removeEventListener 必须传入当初添加的那个函数。新写一个看起来相同的箭头函数，是另一个函数值，移除不会成功，原来的路径还在。",
        "断开监听只说明这条路径被移除。若 Map、模块变量或定时器仍引用同一会话，对象依然可达。清理函数要覆盖自己建立的每一条路径，不能用一次移除代表所有容器。",
      ],
      examples: [{ code: `function attach(target, session) {
  const onRefresh = () => console.log(session.label);
  target.addEventListener("refresh", onRefresh);
  return () => target.removeEventListener("refresh", onRefresh);
}
const target = new EventTarget();
const detach = attach(target, { label: "queue" });
target.dispatchEvent(new Event("refresh"));
detach();
target.dispatchEvent(new Event("refresh"));`, expectedOutput: ["queue"], explanation: [
        "第一次派发调用 onRefresh，打印 queue。detach 移除的是同一个 onRefresh。第二次派发没有监听器，不再打印。",
        "在移除之前，target 通过监听器引用 onRefresh，onRefresh 引用会话对象。移除之后，这条由 attach 建立的路径断开。示例没有再把会话放进别的集合，所以这里能说明的是监听路径，不是整个进程里再无任何引用。",
      ] }, { code: `function attach(target, session) {
  target.addEventListener("refresh", () => console.log(session.label));
  return () => target.removeEventListener("refresh", () => console.log(session.label));
}
const target = new EventTarget();
const detach = attach(target, { label: "queue" });
target.dispatchEvent(new Event("refresh"));
detach();
target.dispatchEvent(new Event("refresh"));`, expectedOutput: ["queue", "queue"], explanation: [
        "这是错误实现。添加和移除各写了一个箭头函数，两者函数身份不同。removeEventListener 没有移除已经注册的那个监听器。",
        "两次派发都打印 queue。detach 这个名字容易让人以为清理已经完成，输出说明监听仍在。修复方法是把同一个函数值保存下来再移除，如上一例。移除失败时，会话仍从事件目标可达。",
      ] }],
    },
    {
      id: "evidence", title: "证据来自重复操作后的保留路径，而不是一次内存数字",
      paragraphs: [
        "打开页面后内存上升，可能只是缓存了正当的数据。有用的比较是：执行同一套创建和释放多次，释放之后保留的对象是否按次数累积。堆快照里看会话对象的保留路径，是事件目标、Map、全局数组，还是模块绑定。",
        "WeakMap 和 WeakRef 不能代替这条检查。它们不提供“现在已经回收”的同步结果。代码能保证的是不再留下强引用；引擎何时回收，用浏览器堆快照在重复释放之后观察，不在业务日志里打印一次数字就下结论。",
      ],
    },
    {
      id: "choices", title: "怎么选：标识要长期存在就用 Map，生命周期跟对象走就用 WeakMap",
      paragraphs: [
        "键是字符串 id、会话结束后还要按 id 查到记录，用 Map，并在结束时 delete。键是对象、附带数据不该延长对象寿命，用 WeakMap。需要知道对象是否还在，同时允许它消失，可以用 WeakRef，但调用方必须接受 deref() 变为 undefined，并另有强引用路径来处理仍在使用的情况。",
        "事件、定时器和缓存要成对建立和拆除。拆除使用同一个函数、同一个计时器标识和同一个键。只把变量设为 null，不会拆除容器里的引用。",
        "审查缓存时问两句：键断开外部变量后，容器是否还引用它；重复进入并离开功能后，监听器和计时器的数量是否回到进入前。两句都靠输出时机碰运气，就还没有可重复的证据。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，列出根。全局绑定、模块、文档和仍注册的事件、定时器都算。只看函数是否 return，看不到这些根。",
        "第二步，从根沿引用走到目标对象。Map 的键和值都是强引用。WeakMap 的键不是强引用，但它的值会随键的可达性一起离开这张表。",
        "第三步，看清理用的是不是原来的身份。另一个箭头函数、另一个定时器标识，都不会拆掉原来的路径。",
        "第四步，把可重复的观察和引擎时机分开。size、监听器是否再触发、deref 在强引用还在时的结果，都可以断言。某一次赋值 null 之后对象是否已回收，不能写成固定输出。开头的 cache.size 在 session = null 之后仍是 1，就是因为 Map 自己还走得到那个对象。",
      ],
    },
  ],
  sources: [
    { title: "MDN：WeakMap 对象与未注册 Symbol 键", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap" },
    { title: "ECMAScript：WeakMap", url: "https://tc39.es/ecma262/multipage/keyed-collections.html#sec-weakmap-objects" },
    { title: "ECMAScript：WeakRef", url: "https://tc39.es/ecma262/multipage/managing-memory.html#sec-weak-ref-objects" },
    { title: "MDN：内存管理", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management" },
  ],
};
