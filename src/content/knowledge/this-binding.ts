import type { Article } from "../articles";

export const thisArticle: Article = {
  id: "K01-03", kind: "knowledge", domainSlug: "javascript", slug: "this-binding",
  title: "this、调用方式与绑定",
  summary: "this 由调用发生时的接收者决定；把方法拆出来、换成箭头函数或用 new 调用，都会改变这次调用看到的对象。",
  aliases: ["this", "bind", "call", "arrow function", "调用方式", "绑定"],
  tags: ["JavaScript", "this", "函数"], estimatedMinutes: 22, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：同一个方法，为什么定时器里改不到计数器？",
      paragraphs: [
        "假设计数器对象有一个 inc 方法，页面上直接调用 counter.inc() 时，value 会加一。把同一个函数交给 setTimeout，回调里的 this 却不再是计数器。计数器停在原地，而这次调用的接收者变成了全局对象。",
        "下面的示例运行在浏览器的经典脚本里。方法内部写了 \"use strict\"，所以这个方法是严格模式函数；这不会改变 setTimeout 提供的接收者。每个示例互不依赖。先看调用点，再讨论箭头函数和 new。",
      ],
      examples: [{ code: `const counter = {
  value: 1,
  inc() {
    "use strict";
    console.log(this === counter ? "counter" : this === globalThis ? "global" : "other");
    if (typeof this.value === "number") this.value += 1;
  },
};
counter.inc();
console.log(counter.value);
setTimeout(counter.inc, 0);`, expectedOutput: ["counter", "2", "global"], explanation: [
        "counter.inc() 是一次方法调用。调用点在属性访问后面跟着括号，这次的接收者就是 counter，所以输出 counter，value 变成 2。",
        "setTimeout(counter.inc, 0) 传进去的是函数本身，不是“以后请用 counter 调用它”的约定。浏览器会在计时器触发时调用这个函数，并把全局对象当作 this。方法体因此打印 global。守卫判断 this.value 不是数字，所以不会去改全局对象，counter.value 也不会变成 3。",
        "问题出在调用方式，不在函数写在对象字面量里面。同一个函数值，可以在不同调用点看到不同的 this。",
      ] }],
    },
    {
      id: "call-site", title: "普通函数的 this 看这次怎么调用",
      paragraphs: [
        "对普通函数来说，this 不是在定义时绑死的参数。方法调用 obj.fn() 把 obj 当作接收者。直接 fn() 没有接收者。严格模式函数在没有接收者时，this 是 undefined，接着访问 this.value 会抛出 TypeError。",
        "非严格模式的普通函数在没有接收者时，this 会指向全局对象。用 new 调用又是另一条路径：语言会创建一个对象，并把这个新对象当作 this。看到一个函数，要先判断这次是方法调用、直接调用，还是构造调用。",
      ],
      examples: [{ code: `"use strict";
const counter = {
  value: 1,
  inc() {
    this.value += 1;
    return this.value;
  },
};
console.log(counter.inc());
const inc = counter.inc;
try {
  inc();
  console.log("called");
} catch (error) {
  console.log(error.name);
}
console.log(counter.value);`, expectedOutput: ["2", "TypeError", "2"], explanation: [
        "第一行调用保留了接收者，返回 2。随后 inc 只是这个函数值的另一个名字。inc() 没有写在某个对象属性后面，严格模式函数的 this 成为 undefined。",
        "this.value += 1 因此抛出 TypeError，函数体里的赋值没有发生。counter.value 仍是 2。这是错误调用方式，不是计数器坏了。调用方如果需要接收者，就要在调用点写出来，或在传给定时器之前先绑定。",
      ] }, { code: `function Point(x) {
  this.x = x;
}
Point(5);
console.log(globalThis.x);
const made = new Point(8);
console.log(made.x);
console.log(made instanceof Point);`, expectedOutput: ["5", "8", "true"], explanation: [
        "这段脚本没有 \"use strict\"。Point(5) 是直接调用，非严格模式把 this 设为全局对象，于是创建了全局属性 x，值是 5。新对象并没有产生。",
        "new Point(8) 走构造调用。语言创建对象，把该对象传给 Point 作为 this，并把这个对象作为 new 表达式的结果。made.x 是 8，made instanceof Point 为 true。全局 x 仍是刚才那一次直接调用留下的 5，本示例不再打印它。",
        "同一个函数既被直接调用又被 new 调用，是容易混淆的写法。类构造函数不允许省略 new，下一节把这条失败路径单独固定下来。",
      ] }],
    },
    {
      id: "arrow", title: "箭头函数没有自己的 this，它沿外层查找",
      paragraphs: [
        "箭头函数不建立自己的 this。它的函数体里出现 this 时，使用的是外层普通函数或脚本已经确定的那个 this。调用箭头函数时，调用点不会再重新指定接收者。",
        "因此箭头函数能保住外层方法里的 this，但不能凭空发明一个接收者。如果外层函数这次调用已经丢掉了接收者，箭头函数看到的也是那份丢失后的值。",
      ],
      examples: [{ code: `"use strict";
const reader = {
  value: 7,
  later() {
    function read() { return this.value; }
    return read();
  },
};
try {
  console.log(reader.later());
  console.log("called");
} catch (error) {
  console.log(error.name);
}`, expectedOutput: ["TypeError"], explanation: [
        "这是错误实现。reader.later() 本身是方法调用，later 的 this 确实是 reader。可是 later 里面的 read 是普通函数，read() 又是一次没有接收者的调用。严格模式下 read 的 this 是 undefined，返回 this.value 抛出 TypeError。",
        "把函数嵌进方法里，不会让内层函数继承外层的 this。内层普通函数仍然看自己的调用点。",
      ] }, { code: `"use strict";
const reader = {
  value: 7,
  later() {
    const read = () => this.value;
    return read();
  },
};
console.log(reader.later());
const callLater = reader.later;
try {
  console.log(callLater());
} catch (error) {
  console.log(error.name);
}`, expectedOutput: ["7", "TypeError"], explanation: [
        "read 是箭头函数，它使用 later 本次调用的 this。reader.later() 把 later 的 this 设为 reader，所以 read() 得到 7。调用 read 时前面没有对象，也不会改掉这个结果。",
        "callLater() 把 later 本身拆出来调用。later 这次没有接收者，它的 this 是 undefined。箭头函数只是沿用这份 this，于是 this.value 仍然抛出 TypeError。箭头函数保存的是外层那次调用确定的值，不是定义箭头时所在对象字面量的名字。",
      ] }],
    },
    {
      id: "bind", title: "bind 固定接收者，之后的 call 改不掉它",
      paragraphs: [
        "Function.prototype.bind 返回一个新函数。用这个新函数做普通调用时，this 使用 bind 时传入的接收者。再对绑定后的函数使用 call 或 apply，传进去的 thisArg 不会覆盖已经绑定的接收者。",
        "bind 适合把方法交给定时器、事件或数组方法之前，明确“以后普通调用也要用这个对象”。它会多一个函数对象。如果每次渲染都重新 bind，就每次得到新的函数身份；移除事件监听时必须拿当时绑定出来的那一个函数。",
      ],
      examples: [{ code: `"use strict";
function inc() {
  this.value += 1;
  return this.value;
}
const counter = { value: 1 };
const bound = inc.bind(counter);
console.log(bound());
console.log(bound.call({ value: 100 }));
console.log(counter.value);`, expectedOutput: ["2", "3", "3"], explanation: [
        "bound() 的 this 是 counter，value 从 1 变成 2。随后 bound.call({ value: 100 }) 仍然修改 counter，而不是那个临时对象。返回值 3 和 counter.value 一致。",
        "call 在这里不是没用，而是无法替换 bind 已经固定的接收者。若业务需要按不同对象调用同一函数，应保留原函数并在每次调用时使用 call，而不是先 bind 再指望 call 换对象。",
      ] }],
    },
    {
      id: "construct", title: "new 与类：构造调用会创建对象，也不允许漏写 new",
      paragraphs: [
        "类的构造函数只能作为构造调用。漏写 new 会抛出 TypeError，不会把字段写到全局对象上。类体里的代码始终按严格模式处理。",
        "类字段里的箭头函数，是在每个实例构造期间创建的。它捕获的 this 就是正在构造的实例。实例方法写在原型上，是所有实例共享的一个函数；拆出来调用时仍然没有自己的接收者。",
      ],
      examples: [{ code: `class Counter {
  value = 1;
  inc() {
    this.value += 1;
    return this.value;
  }
  snapshot = () => this.value;
}
const counter = new Counter();
const inc = counter.inc;
try {
  inc();
  console.log("called");
} catch (error) {
  console.log(error.name);
}
counter.value = 5;
const snapshot = counter.snapshot;
console.log(snapshot());
class Box {
  constructor() { this.ok = true; }
}
try {
  Box();
  console.log("called");
} catch (error) {
  console.log(error.name);
}`, expectedOutput: ["TypeError", "5", "TypeError"], explanation: [
        "inc 是原型上的普通方法。inc() 没有接收者，类方法是严格模式，抛出 TypeError。snapshot 是这个实例自己的箭头函数，提取之后再调用，仍然读到该实例的 value，所以在赋成 5 之后返回 5。",
        "Box() 不是构造调用，类构造函数直接抛出 TypeError，不会返回一个实例。这和前面非严格构造函数被直接调用时写入全局属性不同。新代码优先用类表达构造，就不用再靠调用方记得不要漏掉 new。",
      ] }],
    },
    {
      id: "events", title: "事件监听：浏览器会把当前元素当作接收者",
      paragraphs: [
        "元素的 addEventListener 在调用普通监听函数时，把当前元素当作 this。这和 setTimeout 把全局对象当作 this 是同一种机制：接收者由调用方决定，只是调用方不同。",
        "监听函数一旦直接调用，就不再经过元素。严格模式函数会因为没有接收者而在读取 this.dataset 时抛错。若回调必须同时交给元素和别的调度器，应把需要的节点放进参数，或使用绑定到该元素的函数，而不是假设 this 永远是按钮。",
      ],
      examples: [{ code: `"use strict";
const button = document.createElement("button");
button.dataset.action = "save";
function onClick() {
  console.log(this.dataset.action);
}
button.addEventListener("click", onClick);
button.click();
try {
  onClick();
  console.log("called");
} catch (error) {
  console.log(error.name);
}`, expectedOutput: ["save", "TypeError"], explanation: [
        "button.click() 触发监听。浏览器用按钮作为 this 调用 onClick，所以读到 dataset.action 为 save。随后脚本直接 onClick()，这次没有接收者，this 是 undefined，访问 dataset 抛出 TypeError。",
        "这不是 dataset 偶尔不可用，而是两次调用的接收者不同。测试代码如果只写 onClick()，并没有覆盖按钮真正触发时的 this。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：先固定调用点，再决定要不要箭头或 bind",
      paragraphs: [
        "对象需要在不同调用点保持同一个接收者时，用类字段箭头函数或 bind，并记住函数身份会按实例或按绑定次数产生。所有实例可以共享、调用点又稳定是方法调用时，用原型上的普通方法更直接。事件和定时器如果可以改成接收元素或上下文参数，就不依赖 this。",
        "不要混用三种约定：一个函数既被 new，又被直接调用，又被当作方法。类构造函数只用于 new；普通方法只在有接收者的调用点使用；箭头函数只用于沿用外层已经确定的 this。",
        "检查一段回调时，至少走三条路径：作为方法调用、从对象上拆出来调用、交给定时器或事件。三条路径的 this 解释不一致，就还不能把函数传出去。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，找到函数值后来在哪里被调用。是 obj.fn()、fn()、new Fn()，还是被定时器、事件或数组方法调用。先标调用点，再读函数体。",
        "第二步，若是普通函数，按那个调用点确定 this。严格模式只说明“没有接收者时 this 为 undefined”，不会取消调用方明确传进来的接收者。setTimeout 在浏览器中传入的是全局对象。",
        "第三步，若是箭头函数，向外找到最近的普通函数或脚本顶层，使用那里的 this。外层那次调用若已经没有接收者，箭头函数不会把它修正回对象字面量。",
        "第四步，看有没有 bind、call 或类字段。bind 之后的普通调用不再接受新的接收者；类字段箭头函数每个实例一份；原型方法所有实例共享。把这四步用于开头的计数器，就能解释为什么 counter.inc() 改到自己，而 setTimeout(counter.inc) 改不到。",
      ],
    },
  ],
  sources: [
    { title: "ECMAScript：普通调用与 this", url: "https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-function.prototype.call" },
    { title: "ECMAScript：Function.prototype.bind", url: "https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-function.prototype.bind" },
    { title: "ECMAScript：new 运算符", url: "https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-new-operator" },
    { title: "MDN：this", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this" },
  ],
};
