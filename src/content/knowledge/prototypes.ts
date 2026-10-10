import type { Article } from "../articles";

export const prototypeArticle: Article = {
  id: "K01-04", kind: "knowledge", domainSlug: "javascript", slug: "prototypes",
  title: "原型、类与对象模型",
  summary: "属性先查对象自身，再沿原型链查找；类把共享方法放在原型上，字段相同的另一个对象不会因此变成子类。",
  aliases: ["prototype", "class", "instanceof", "原型", "继承", "对象模型"],
  tags: ["JavaScript", "原型", "类"], estimatedMinutes: 22, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：子对象没有写 greet，为什么还能调用？",
      paragraphs: [
        "假设一个父对象提供 greet，子对象只写了自己的 kind。调用 child.greet() 仍然有结果，而且结果用的是子对象的 kind。如果以为方法一定要复制到每个对象上，就解释不了这个调用，也解释不了后来给子对象补上一份同名方法时父方法为什么被挡住。",
        "示例可以单独运行在现代浏览器或 Node.js 20 及以上。先看查找顺序，再看类语法实际建立了哪条原型链，以及什么时候不该用继承。",
      ],
      examples: [{ code: `const parent = {
  kind: "parent",
  greet() { return "from-" + this.kind; },
};
const child = Object.create(parent);
child.kind = "child";
console.log(child.greet());
console.log(Object.hasOwn(child, "greet"));
console.log(Object.hasOwn(parent, "greet"));`, expectedOutput: ["from-child", "false", "true"], explanation: [
        "child 自身没有 greet。调用 child.greet 时，查找从 child 开始，没有找到，就到 Object.create 关联的 parent 上找到函数。函数只有一份，放在 parent 上。",
        "执行这个函数时，方法调用的 this 仍是 child。函数体读 this.kind，读到的是 child 自己的 kind，所以结果是 from-child。Object.hasOwn 只看自身属性，因此 child 为 false，parent 为 true。能调用，不表示子对象拥有这个属性。",
      ] }],
    },
    {
      id: "lookup", title: "查找沿原型链向上，找到同名属性就停止",
      paragraphs: [
        "读取属性时，先看对象自身的属性。自身没有，就取该对象的原型，再重复这个过程，直到 null。原型是另一个对象，不是一个类名字符串。Object.getPrototypeOf 能读到这条链接；Object.create(parent) 建立的就是“child 的原型是 parent”。",
        "写入属性默认写在对象自身，不会去改原型上的同名属性。所以 child.kind = \"child\" 遮蔽了 parent.kind，但没有删除父对象的 kind。读取时一旦在自身找到，就不会继续向上。",
      ],
      diagram: {
        caption: "读取 child.greet 时的查找路径",
        lines: [
          "child 自身：有 kind，没有 greet",
          "    ↓ 原型",
          "parent：有 greet",
          "    ↓ 调用时 this 仍是 child",
          "greet 读取 this.kind，得到 child 的 kind",
        ],
      },
    },
    {
      id: "shadow", title: "遮蔽是自身多了一份属性，删除后才会重新看见原型",
      paragraphs: [
        "给子对象赋一个同名属性，之后的读取就使用自身这份，原型上的函数还在。delete 删除的是自身属性。删除成功后，下一次读取会重新沿原型找到原来的方法。",
        "这不是父子两份方法自动合并，也不是覆盖写进了父对象。检查共享状态是否被改掉时，要看赋值发生在哪个对象上。",
      ],
      examples: [{ code: `const parent = {
  greet() { return "from-parent"; },
};
const child = Object.create(parent);
child.greet = function () { return "own"; };
console.log(child.greet());
console.log(parent.greet());
delete child.greet;
console.log(child.greet());
console.log(Object.hasOwn(child, "greet"));`, expectedOutput: ["own", "from-parent", "from-parent", "false"], explanation: [
        "赋值之后，child.greet 找到的是自身函数，返回 own。parent.greet() 仍返回 from-parent，父对象没有被这次赋值修改。",
        "delete child.greet 去掉自身属性。下一次 child.greet() 重新找到原型上的函数。hasOwn 变为 false，说明子对象又不再拥有 greet。如果 delete 的是不可配置属性，删除会失败；这个例子的赋值属性默认可配置，所以删除成功。",
      ] }],
    },
    {
      id: "class", title: "类把方法放在原型上，实例字段放在实例自身",
      paragraphs: [
        "class 没有把每个方法复制进实例。实例方法放在构造函数的 prototype 上，子类的 prototype 再链接到父类的 prototype。实例自身存放构造过程写入的字段，例如 this.tag。",
        "因此两个实例的 speak 是同一个函数。读取 dog.speak 得到的是原型上的方法，Object.hasOwn(dog, \"speak\") 为 false。这能解释方法为什么不占每份实例的一个函数对象，也能解释改原型方法会影响共享它的实例。",
      ],
      examples: [{ code: `class Animal {
  speak() { return "generic"; }
}
class Dog extends Animal {
  constructor() {
    super();
    this.tag = "dog";
  }
  speak() { return "woof"; }
}
const dog = new Dog();
const other = new Dog();
console.log(dog.speak());
console.log(Object.hasOwn(dog, "speak"));
console.log(Object.hasOwn(dog, "tag"));
console.log(Object.hasOwn(Dog.prototype, "speak"));
console.log(Object.getPrototypeOf(Dog.prototype) === Animal.prototype);
console.log(dog.speak === other.speak);`, expectedOutput: ["woof", "false", "true", "true", "true", "true"], explanation: [
        "dog.speak() 在 Dog.prototype 上找到 speak，返回 woof。这个方法不是 dog 的自身属性，tag 才是构造函数写到实例上的自身属性。",
        "Dog.prototype 的原型是 Animal.prototype，所以没被 Dog 遮蔽的属性还可以继续向 Animal 查找。两个实例的 speak 引用同一个函数，恒等比较为 true。若在某个实例上再赋值 dog.speak = ...，只会遮蔽这一只狗，other.speak 仍是原型方法。",
      ] }],
    },
    {
      id: "composition", title: "组合：每个对象带上自己的行为，而不是链到父类型",
      paragraphs: [
        "有些对象只是一组数据加一个小操作，并不需要“是一种动物”。工厂函数每次返回一个新对象，方法可以创建在该对象自身，也可以让多个对象共享同一个函数值。两种做法都不必建立子类型。",
        "继承适合表达稳定的“是一种”关系，并且共享的方法确实应该沿一条链查找。如果只是复用一段创建逻辑，或者不同对象的行为会单独替换，组合更不容易把不相关的属性带进来。下面的工厂每个对象都有自己的 speak，所以函数身份不同。",
      ],
      examples: [{ code: `function withSpeaker(kind) {
  return {
    kind,
    speak() { return this.kind; },
  };
}
const button = withSpeaker("button");
const link = withSpeaker("link");
console.log(button.speak());
console.log(link.speak());
console.log(button.speak === link.speak);
console.log(Object.getPrototypeOf(button) === Object.prototype);`, expectedOutput: ["button", "link", "false", "true"], explanation: [
        "button.speak() 读到自己的 kind。link 是另一个对象，kind 不同，方法也是在各自的对象字面量里创建的，所以两个 speak 不是同一个函数。",
        "这些对象的原型仍是普通的 Object.prototype，没有一条自定义类型链。它们不会因为都有 speak 就被 instanceof 分成父子类。需要共享方法时，可以把同一个函数值赋给多个对象，或把函数放在一个明确的原型上；那是另一种选择，这个工厂没有这么做。",
      ] }],
    },
    {
      id: "null-prototype", title: "原型可以为 null，跨窗口的数组也不会通过同一个 instanceof",
      paragraphs: [
        "Object.create(null) 的原型是 null，查找不会走到 Object.prototype。这样的对象没有 toString 等方法，适合当作纯键值记录，避免键名和原型方法冲突。它也不是 instanceof Object。",
        "instanceof 检查的是“某个构造函数的 prototype 是否出现在对象的原型链上”。不同窗口有自己的 Array 构造函数。一个值可以是数组，但不是当前窗口的 Array 的实例。判断数组应使用 Array.isArray，不要只用 instanceof Array。",
      ],
      examples: [{ code: `const record = Object.create(null);
record.id = "a";
console.log(record.id);
console.log(Object.getPrototypeOf(record) === null);
console.log(record instanceof Object);
try {
  record.toString();
  console.log("called");
} catch (error) {
  console.log(error.name);
}
const frame = document.createElement("iframe");
document.body.append(frame);
const OtherArray = frame.contentWindow.Array;
const value = new OtherArray(1, 2);
console.log(Array.isArray(value));
console.log(value instanceof Array);
console.log(value instanceof OtherArray);
frame.remove();`, expectedOutput: ["a", "true", "false", "TypeError", "true", "false", "true"], explanation: [
        "record.id 可以正常读写。它的原型是 null，instanceof Object 为 false。toString 不在自身，也不在任何原型上，调用抛出 TypeError。这种对象不能假设拥有对象字面量默认继承来的方法。",
        "iframe 有自己的全局环境。value 由那个环境的 Array 构造，Array.isArray 仍为 true，因为它识别的是数组这种对象，不是当前窗口的构造函数。value instanceof Array 为 false，value instanceof OtherArray 为 true。跨文档传递数组、日期或 Promise 时，instanceof 可能失败，类型判断要使用不依赖单一窗口构造函数的方法。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：共享查找用原型，一次性数据用组合",
      paragraphs: [
        "多个对象要共享同一份方法，并且方法里的 this 表示当前实例时，原型或类合适。方法会随实例不同而替换、或者对象只是一份记录时，用工厂返回自身属性更清楚。只为了少写几行而套一层继承，会把不相关的父类属性也带进查找。",
        "读取失败时按顺序检查：属性名是否写对，自身是否被遮蔽，原型链接是否是预期对象，原型是不是 null，值是否来自另一个窗口。写入时默认只改自身；要改共享行为，必须明确改原型上的属性，并接受所有未遮蔽实例都会看到。",
        "给一个对象加方法之前，先回答两句：这个函数应该被哪些对象共享，this 应该是谁。两句答不清，就先不要把它放到原型上。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，区分自身属性和原型属性。Object.hasOwn 为 false 仍可能读到值，因为查找还会向上走。",
        "第二步，沿 Object.getPrototypeOf 画出链接，直到 null。类的实例连到 Constructor.prototype，子类的 prototype 再连到父类的 prototype。",
        "第三步，看这次操作是读还是写。读会在第一条同名属性处停止；普通赋值写在自身，形成遮蔽。delete 只删除自身可配置属性，删除后原型上的属性会重新可见。",
        "第四步，判断共享是否是本意。两个实例的方法恒等，通常说明它们共享原型方法。跨窗口对象不要用当前窗口的 instanceof 下结论。开头的 child.greet() 就是：函数在 parent 上，this 是 child，kind 读到的是子对象自己的字段。",
      ],
    },
  ],
  sources: [
    { title: "ECMAScript：对象内部方法与原型", url: "https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinary-object-internal-methods-and-internal-slots" },
    { title: "ECMAScript：class 定义", url: "https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-class-definitions" },
    { title: "ECMAScript：instanceof", url: "https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-instanceofoperator" },
    { title: "MDN：继承与原型链", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain" },
  ],
};
