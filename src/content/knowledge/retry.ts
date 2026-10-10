import type { Article } from "../articles";

export const retryArticle: Article = {
  id: "K02-06", kind: "knowledge", domainSlug: "async", slug: "retry",
  title: "重试、退避与幂等",
  summary: "只有标明可重试的失败才应该再试。退避是计划中的等待时间。同一次操作要用同一个幂等键，避免重试把副作用做两遍。",
  aliases: ["retry", "backoff", "idempotency", "重试", "退避", "幂等"],
  tags: ["JavaScript", "重试", "幂等"], estimatedMinutes: 20, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：第三次才成功，前两次失败算不算多做了工作？",
      paragraphs: [
        "假设接口暂时返回 busy，调用方最多试 3 次。前两次抛出可重试错误，第三次返回 ok。日志里能看到两次失败和最终的 calls 3。若每次尝试都会创建一笔新的付款，这三次调用就不是“同一次保存”，而是三笔副作用。",
        "下面的重试函数本身不睡眠。它只在错误带有 retryable 时继续下一次，否则立刻把错误抛出。带顶层 await 的示例按 ES 模块运行。真实等待时间放到后面的退避计算里，不在这个循环里假装已经过了若干毫秒。",
      ],
      examples: [{ language: "module", code: `async function run(task, attempts) {
  let last;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await task(index);
    } catch (error) {
      last = error;
      console.log("try " + index + " " + error.message);
      if (!error.retryable) throw error;
    }
  }
  throw last;
}
let calls = 0;
console.log("result " + await run(() => {
  calls += 1;
  if (calls < 3) {
    const error = new Error("busy");
    error.retryable = true;
    throw error;
  }
  return "ok";
}, 3) + " calls " + calls);
try {
  await run(() => {
    const error = new Error("bad-request");
    error.retryable = false;
    throw error;
  }, 3);
  console.log("fatal-ok");
} catch (error) {
  console.log("fatal " + error.message);
}`, expectedOutput: ["try 0 busy", "try 1 busy", "result ok calls 3", "try 0 bad-request", "fatal bad-request"], explanation: [
        "busy 被标成可重试。第 0 次和第 1 次失败后循环继续，第 2 次返回 ok，calls 是 3。最后一次成功不再打印 try。次数用尽时，循环会抛出最后一次错误；这个任务在第三次已经成功，所以没有走到那里。",
        "bad-request 没有 retryable。第一次失败就 throw，不会再试第二次，所以只有 try 0，外层打印 fatal bad-request，没有 fatal-ok。参数错误、校验失败和权限不足通常属于这一类。把所有错误都重试，会重复提交一次本来就不该成功的操作。",
      ] }],
    },
    {
      id: "idempotent", title: "重试安全的前提是同一次操作不会产生第二份副作用",
      paragraphs: [
        "读取数据通常可以重试。创建订单、扣款、发信若每次调用都新建一份，重试就会重复。幂等是指用同一个键表示同一次业务操作：第一次真正执行并记下回执，后面再用这个键调用，返回原来的回执，不再执行第二次。",
        "键要由调用方在第一次尝试前生成，并在每次重试时原样带上。用时间戳或随机数当每次请求的新键，重试就变成了新操作。服务端没有按键去重时，只在浏览器里重试也不能保证安全。",
      ],
      examples: [{ code: `const receipts = new Map();
function charge(key, amount) {
  if (receipts.has(key)) return receipts.get(key).id;
  const id = receipts.size + 1;
  receipts.set(key, { id, amount });
  return id;
}
console.log(charge("order-1", 20));
console.log(charge("order-1", 20));
console.log(charge("order-2", 20));
console.log(receipts.size);`, expectedOutput: ["1", "1", "2", "2"], explanation: [
        "order-1 第一次得到回执 1。第二次仍用 order-1，直接返回已有回执，size 没有增加。order-2 是另一笔操作，得到回执 2，size 变为 2。",
        "这是进程内的示意，不是支付接口。它说明幂等键识别的是操作，不是金额碰巧相同。若第二次调用改用新键，即使金额仍是 20，也会得到新回执。重试代码必须保留第一次的键。",
      ] }],
    },
    {
      id: "backoff", title: "退避是下一次尝试前要等待的计划，不是错误已经消失",
      paragraphs: [
        "连续立即重试会在对方已经过载时继续加压。退避用尝试次数计算等待：例如基础 10 毫秒，每次加倍，并设置上限 40。第 0 到第 3 次尝试前的等待可以是 10、20、40、40。上限避免一次算出过长的延迟。",
        "算出这些数字不等于已经等待。真正的定时器要在尝试之间单独安排，并且等待期间应能被取消。对方返回的 Retry-After 若存在，应优先使用明确的等待提示，而不是只套本地公式。下面只打印计划，不启动定时器。",
      ],
      examples: [{ code: `function plan(attempts, base, cap) {
  const waits = [];
  for (let index = 0; index < attempts; index += 1) {
    waits.push(Math.min(base * 2 ** index, cap));
  }
  return waits.join(",");
}
console.log(plan(4, 10, 40));
console.log(plan(3, 10, 1000));`, expectedOutput: ["10,20,40,40", "10,20,40"], explanation: [
        "第一行上限是 40。第三次加倍会得到 80，被上限截成 40，所以四次是 10,20,40,40。第二行上限足够大，三次就是 10,20,40。",
        "这些是尝试前的计划等待。函数返回时，时间并没有过去。把 plan 的结果直接当成“已经退避完成”是错误的。安排定时器时还要处理第 0 次是否立即开始：很多实现第一次不等待，公式就应从失败之后的下一次算起。本例把四次都列出来，是为了看清公式，不是规定第一次也必须等 10 毫秒。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：先分类错误，再决定能不能用同一个键重试",
      paragraphs: [
        "超时、网络中断、429 和明确的临时故障可以重试，并带上退避和次数上限。400 一类的请求内容错误不重试，先改输入。有副作用的操作，先确认服务端按幂等键去重，再在客户端重试；不能确认时，失败后让用户决定是否再次提交，而不是自动再来一次。",
        "重试次数用尽要把最后一次错误交出去，不要返回一个看起来成功的空值。等待中的定时器在离开页面或 abort 时要清掉，避免用户已经取消后仍又发出一次请求。",
        "看一段重试循环时，找出错误分类、幂等键和等待三个位置。缺任何一个，都不能把这段循环叫成安全的重试。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，看哪些错误会进入下一次循环，哪些会立刻抛出。没有标记的错误不该被默认重试。",
        "第二步，数真正执行副作用的次数。循环次数不等于安全次数，除非同一次操作共用一个幂等键并且服务端认这个键。",
        "第三步，把等待计划和实际定时器分开。算出 10,20,40 只是数字；没有定时器和取消，就还没有退避。",
        "第四步，看次数用尽后抛出的是最后一次原因，还是一个新的“重试失败”把原因弄丢了。开头的 busy 试到第三次才 ok，bad-request 则在第一次就停止。",
      ],
    },
  ],
  sources: [
    { title: "MDN：HTTP 429", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429" },
    { title: "RFC 9110：Retry-After", url: "https://www.rfc-editor.org/rfc/rfc9110#name-retry-after" },
  ],
};
