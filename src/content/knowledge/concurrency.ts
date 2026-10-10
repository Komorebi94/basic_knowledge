import type { Article } from "../articles";

export const concurrencyArticle: Article = {
  id: "K02-04", kind: "knowledge", domainSlug: "async", slug: "concurrency",
  title: "并发限制与背压",
  summary: "先创建全部 Promise 会让工作同时开始。限制在途数量要让多余任务等待；队列过长时要拒绝新工作，而不是无限堆积。",
  aliases: ["concurrency", "backpressure", "并发限制", "背压", "队列"],
  tags: ["JavaScript", "并发", "队列"], estimatedMinutes: 20, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：三件工作为什么没有一起 start？",
      paragraphs: [
        "假设要处理 a、b、c 三件互不相干的工作，每件在开始和结束时留下日志。若直接 Promise.all 三个已经调用的函数，三件都会立刻 start。若同时只允许两件在途，c 必须等 a 或 b 结束才 start。",
        "下面的限制器只用 Promise 排队，没有真实的睡眠时间，所以顺序由“最多两个在途”这条规则决定。它是教学实现：任务失败会拒绝对应的调用，队列本身没有长度上限，也不知道如何取消已经开始的任务。示例运行在现代浏览器。",
      ],
      examples: [{ code: `function createLimiter(limit) {
  let active = 0;
  const waiting = [];
  const pump = () => {
    while (active < limit && waiting.length > 0) {
      active += 1;
      const run = waiting.shift();
      run().finally(() => {
        active -= 1;
        pump();
      });
    }
  };
  return function schedule(task) {
    return new Promise((resolve, reject) => {
      waiting.push(() => task().then(resolve, reject));
      pump();
    });
  };
}
const limit = createLimiter(2);
const seen = [];
function job(name) {
  return () => {
    seen.push("start-" + name);
    return Promise.resolve().then(() => {
      seen.push("end-" + name);
      return name;
    });
  };
}
Promise.all([limit(job("a")), limit(job("b")), limit(job("c"))]).then(() => {
  console.log(seen.join(","));
});`, expectedOutput: ["start-a,start-b,end-a,end-b,start-c,end-c"], explanation: [
        "schedule 被调用三次时，a 和 b 立刻占满两个名额，所以先 start。c 留在 waiting 里，函数体还没有执行。a 和 b 的 then 结束后名额释放，pump 才取出 c。",
        "日志里 c 的 start 出现在 a、b 的 end 之后。若 job 在传给 schedule 之前就被调用，Promise 已经创建，限制器就来不及阻止它开始。要限制的是任务函数的调用时刻，不是 all 的结果数组。",
      ] }],
    },
    {
      id: "queue", title: "在途数量和排队长度是两个限制",
      paragraphs: [
        "在途限制回答“现在有几件正在做”。队列长度回答“还有几件在等”。只限制在途、不限制队列时，生产者可以一直把任务推进数组，内存随着等待项增长。背压是让生产者慢下来或被拒绝，而不是只把工作堆在内存里。",
        "下面这个闸门和前面的限制器分开。队列里已有一项时，再推进就返回 rejected，不把第二项存下来。它不启动任务，只说明拒绝新工作的判定可以发生在入队之前。",
      ],
      examples: [{ code: `function gate(max) {
  const queued = [];
  return function push(item) {
    if (queued.length >= max) return "rejected";
    queued.push(item);
    return "queued " + queued.length;
  };
}
const push = gate(1);
console.log(push("one"));
console.log(push("two"));
console.log(push("three"));`, expectedOutput: ["queued 1", "rejected", "rejected"], explanation: [
        "第一项进入队列，长度变为 1。第二项和第三项都因为长度已经达到上限而被拒绝，队列里仍然只有 one。",
        "若调用方忽略 rejected，仍假设这项会执行，那就是错误用法。拒绝必须传回给生产者：停止读取下一批、告诉用户稍后重试，或丢掉这项并计数。只返回字符串而生产者不停下来，队列限制就没有生效。",
      ] }],
    },
    {
      id: "failure", title: "某一件失败要让出名额，但不会自动取消旁边那一件",
      paragraphs: [
        "限制器在任务结束时用 finally 减少 active，所以拒绝和兑现都会释放名额。否则一件失败会把名额永久占住，后面的任务不再开始。",
        "释放名额不是取消。已经在运行的另一件任务仍会跑完，除非它自己接受取消信号。队列里还没开始的任务可以在失败策略里清空，那是额外决定，上面的 createLimiter 没有这样做。它会继续执行等待中的任务。",
      ],
      examples: [{ code: `function createLimiter(limit) {
  let active = 0;
  const waiting = [];
  const pump = () => {
    while (active < limit && waiting.length > 0) {
      active += 1;
      const run = waiting.shift();
      run().finally(() => {
        active -= 1;
        pump();
      });
    }
  };
  return function schedule(task) {
    return new Promise((resolve, reject) => {
      waiting.push(() => task().then(resolve, reject));
      pump();
    });
  };
}
const limit = createLimiter(1);
const seen = [];
function job(name, fail) {
  return () => {
    seen.push("start-" + name);
    return Promise.resolve().then(() => {
      if (fail) throw new Error(name);
      seen.push("end-" + name);
    });
  };
}
limit(job("a", true)).catch((error) => seen.push("fail-" + error.message));
limit(job("b", false)).then(() => console.log(seen.join(",")));`, expectedOutput: ["start-a,fail-a,start-b,end-b"], explanation: [
        "名额只有一个。a 先 start，然后在 then 里抛错。catch 记下 fail-a，finally 把名额减掉，b 才 start 并 end。失败没有把限制器卡死。",
        "b 仍然执行，说明 a 的失败没有清空队列。若业务要求一批里一件失败就不再做后面的，要在 catch 里另行丢掉 waiting，并拒绝那些还没开始的调用。这个示例没有实现该策略。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：先定在途上限，再定队列满了怎么办",
      paragraphs: [
        "上传、请求和图片处理这类会占连接或内存的工作，设置同时在途的上限。上限来自浏览器连接数、服务端容量或主线程能承受的结果处理量，不是一个永远正确的常数。队列再设置最大长度：满了就拒绝新任务，或让生产者等待一个“可以继续”的信号。无限数组只是把压力藏起来。",
        "任务函数不要在入队前调用。取消、超时和失败后是否继续队列，要单独写明。限制器保证的是开始数量，不保证每一件都能成功，也不保证失败时停掉已经发出的请求。",
        "看一段 Promise.all(items.map(task)) 时，确认 task 是在 map 时就被调用。若是，所有任务已经同时开始，后面的数字上限并没有生效。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，找到任务函数是何时被调用的。一调用就创建 Promise，工作通常已经开始。",
        "第二步，数在途数量。只有结束后才调用下一个，才是限制。只给 all 传一个数组，没有限制开始时刻。",
        "第三步，看队列有没有最大长度。没有的话，生产者可以一直追加。满了之后的返回值必须让生产者停下来。",
        "第四步，看失败和取消。finally 释放名额，并不取消其他任务，也不自动清空等待队列。开头的 c 晚于 a、b 的 end 才 start，是因为在途上限是 2。",
      ],
    },
  ],
  sources: [
    { title: "MDN：Promise.all", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all" },
    { title: "ECMAScript：Promise 任务与微任务", url: "https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-jobs" },
  ],
};
