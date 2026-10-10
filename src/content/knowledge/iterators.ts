import type { Article } from "../articles";

export const iteratorArticle: Article = {
  id: "K01-06", kind: "knowledge", domainSlug: "javascript", slug: "iterators",
  title: "迭代器与生成器",
  summary: "迭代器按需给出下一项；生成器把计算停在 yield。提前结束时要调用 return，否则清理代码不会因为循环停了就自动执行。",
  aliases: ["iterator", "generator", "Symbol.iterator", "迭代器", "生成器"],
  tags: ["JavaScript", "迭代器", "生成器"], estimatedMinutes: 22, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：序列已经创建，为什么第一项还没产生？",
      paragraphs: [
        "假设要按需产生编号。如果创建序列时就把两项都算完，调用方即使只要第一项，也付了全部成本。生成器把函数停在 yield：创建时只得到一个迭代器，第一次 next 才执行到第一个 yield。",
        "示例运行在现代浏览器或 Node.js 20 及以上。后面再看提前 break 时清理为什么会执行，以及只调用了一次 next 就丢掉迭代器时清理为什么不执行。",
      ],
      examples: [{ code: `function* range(limit) {
  for (let index = 0; index < limit; index += 1) {
    console.log("produce-" + index);
    yield index;
  }
}
const seq = range(2);
console.log("created");
console.log(seq.next().value);`, expectedOutput: ["created", "produce-0", "0"], explanation: [
        "range(2) 只创建生成器对象，函数体还没有执行，所以先输出 created。第一次 next 才进入函数，打印 produce-0，停在 yield，把 0 作为这次的 value。",
        "limit 里的第二项还没有产生。调用方停止继续 next，就不会执行后面的循环。这是惰性：工作量由消费次数决定，而不是由创建函数决定。",
      ] }],
    },
    {
      id: "protocol", title: "可迭代对象负责发出迭代器，迭代器负责给出 next",
      paragraphs: [
        "for...of、展开和 Array.from 需要的是可迭代对象。它实现 Symbol.iterator，调用后返回迭代器。迭代器的 next 返回 { value, done }。done 为 true 表示没有更多项，此后再 next 仍应返回完成状态，而不是从头开始。",
        "数组本身可以多次 for...of，因为每次都会向数组要一个新的迭代器。已经拿在手里的那一个迭代器被消费完，就不会自动重置。",
      ],
      examples: [{ code: `const values = ["a", "b"];
const iterator = values[Symbol.iterator]();
console.log(iterator.next().value);
console.log(iterator.next().value);
console.log(iterator.next().done);
console.log([...iterator].length);
console.log([...values].join(","));`, expectedOutput: ["a", "b", "true", "0", "a,b"], explanation: [
        "手动 next 两次得到 a 和 b，第三次 done 为 true。再把这个已经完成的迭代器展开，长度是 0。它不会回到 a。",
        "values 仍然是可迭代对象。再次展开会调用 Symbol.iterator 得到新迭代器，所以结果仍是 a,b。复用数据源和复用同一次迭代器不是一回事。",
      ] }],
    },
    {
      id: "cleanup", title: "for...of 提前退出会调用 return，只停在 next 则不会",
      paragraphs: [
        "生成器里的 finally，以及迭代器的 return 方法，表示消费方不再继续要下一项。for...of 在 break、return 或抛出异常而离开循环时，会调用迭代器的 return。生成器收到 return 后执行尚未执行的 finally，然后结束。",
        "如果代码只调用了 next，然后把迭代器丢掉，语言并不知道你已经不需要后面的项。finally 不会在这个时刻执行。资源因此仍被这次迭代持有，直到后来有人调用 return，或生成器对象本身不再可达。不要把“循环写到一半不写了”当成清理。",
      ],
      examples: [{ code: `function* labels() {
  try {
    yield "first";
    yield "second";
  } finally {
    console.log("cleanup");
  }
}
for (const label of labels()) {
  console.log(label);
  break;
}`, expectedOutput: ["first", "cleanup"], explanation: [
        "循环拿到 first 后 break。for...of 调用生成器的 return。函数离开 yield，执行 finally，打印 cleanup，生成器结束。second 没有被产生。",
        "这是提前退出时正确的清理路径。finally 里可以释放这次迭代打开的资源，但释放动作依赖消费方确实调用了 return。",
      ] }, { code: `function* labels() {
  try {
    yield "first";
    yield "second";
  } finally {
    console.log("cleanup");
  }
}
const seq = labels();
console.log(seq.next().value);
console.log("paused");`, expectedOutput: ["first", "paused"], explanation: [
        "这是错误的停止方式。next 得到 first 之后，脚本再也没有调用 next 或 return。输出只有 first 和 paused，没有 cleanup。生成器停在第一次 yield，finally 还没有机会执行。",
        "函数看起来已经“用完了”，只是因为后面的代码不再理它。持有 seq 的人仍让这次生成器保持打开。确定不再消费时，应调用 seq.return()，让 finally 现在执行，而不是等对象以后不可达。",
      ] }],
    },
    {
      id: "return-method", title: "自定义迭代器要自己实现 return，生成器抛错后会关闭",
      paragraphs: [
        "手写迭代器不是生成器，语言不会自动补上 finally。for...of 仍会在提前退出时调用 return，但只有迭代器提供了这个方法才会发生清理。return 应返回 { done: true }，表示迭代已经结束。",
        "生成器内部抛出异常时，这次迭代也会结束。异常传给 next 的调用方，随后再 next 得到 done 为 true，不会从抛错的位置继续。",
      ],
      examples: [{ code: `const bag = {
  [Symbol.iterator]() {
    let index = 0;
    return {
      next() {
        return index < 2 ? { value: index++, done: false } : { done: true };
      },
      return() {
        console.log("cleanup");
        return { done: true };
      },
    };
  },
};
for (const value of bag) {
  console.log(value);
  break;
}`, expectedOutput: ["0", "cleanup"], explanation: [
        "第一次 next 返回 0。break 之后 for...of 调用 return，打印 cleanup。如果删掉 return 方法，循环仍会停止，但不会有 cleanup 这行。提前退出的协议和清理动作是两件事，自定义迭代器必须自己把清理放进 return。",
        "index 停在 1，第二次值没有交给循环。下次 for...of 会再次调用 Symbol.iterator，得到新的迭代器；这次 return 结束的是当前这一份。",
      ] }, { code: `function* broken() {
  yield 1;
  throw new Error("boom");
}
const seq = broken();
console.log(seq.next().value);
try {
  seq.next();
  console.log("continued");
} catch (error) {
  console.log(error.message);
}
console.log(seq.next().done);`, expectedOutput: ["1", "boom", "true"], explanation: [
        "第一次 next 得到 1。第二次 next 执行 throw，调用方收到 boom，生成器因异常关闭。再次 next 的 done 为 true，不会继续产生新值。",
        "异常被 catch 住，只表示调用方处理了这一次失败，不表示生成器还停在原来的位置。若 finally 里有清理，异常离开生成器时也会执行；本例没有打开额外资源，所以没有写 finally。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：有限消费用迭代器，无限序列不要直接展开",
      paragraphs: [
        "数据已经在数组里、需要随机访问时，不必改成生成器。计算或读取成本高、调用方可能只要前几项时，生成器或自定义迭代器合适。迭代过程打开了文件、阅读器或订阅，就要在 return 和失败路径里关闭它。",
        "展开、Array.from 和部分集合构造会把迭代器一直读到 done。对没有上限的生成器这样做，循环不会结束。消费无限或昂贵序列时，用显式 next 或 for...of 加明确的停止条件，并在停止时走 return。",
        "for...in 遍历的是对象的可枚举字符串键，不是迭代器协议。数组若只想要元素，用 for...of。不要因为两个关键字相近，就把键的遍历当成值的惰性序列。",
        "写完一个迭代器后，用三种消费方式试它：读完、中途 break、只 next 一次就丢掉。第三种如果让资源一直开着，清理就还没接上协议。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，分清可迭代对象和迭代器。每次 for...of 或展开可迭代对象，都会要一个新迭代器。手里这个迭代器完成后不会重置。",
        "第二步，看值是在创建时产生，还是在 next 时产生。生成器停在 yield，没被要到的项不会执行。",
        "第三步，看离开的方式。break 会让 for...of 调用 return；只是不再调用 next，不会。自定义迭代器没有 return，就没有清理回调。",
        "第四步，看失败以后还能不能继续。生成器内部抛错会关闭它。开头的 range 在 created 之后才打印 produce-0，就是因为创建和第一次 next 是两步。",
      ],
    },
  ],
  sources: [
    { title: "ECMAScript：迭代器接口", url: "https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-iterator-interface" },
    { title: "ECMAScript：生成器对象", url: "https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-generator-objects" },
    { title: "MDN：迭代器与生成器", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators" },
  ],
};
