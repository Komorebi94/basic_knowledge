import type { Article } from "../articles";

export const descriptorArticle: Article = {
  id: "K01-05", kind: "knowledge", domainSlug: "javascript", slug: "property-descriptors",
  title: "属性描述符与对象操作",
  summary: "复制对象时，可枚举性、自身属性、Symbol 和 getter 会决定哪些字段被带上，以及带上的是取值还是读取行为。",
  aliases: ["property descriptor", "enumerable", "getter", "Object.assign", "属性描述符", "可枚举"],
  tags: ["JavaScript", "对象", "属性"], estimatedMinutes: 22, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：展开之后，id 为什么丢了？",
      paragraphs: [
        "假设一份草稿用属性描述符把 id 标成不可枚举，标题仍然是普通字段。对象展开和 Object.assign 都像是在复制，展开结果里却没有 id。如果复制的目标是留住整份记录，这次操作已经漏了字段。",
        "示例使用严格模式，运行在现代浏览器或 Node.js 20 及以上。先看哪些属性算“自身且可枚举”，再看 getter 被复制时到底留下了函数还是当时的值。",
      ],
      examples: [{ code: `"use strict";
const source = {};
Object.defineProperty(source, "id", {
  value: "a", writable: true, enumerable: false, configurable: true,
});
Object.defineProperty(source, "title", {
  value: "draft", writable: true, enumerable: true, configurable: true,
});
const copy = { ...source };
console.log(source.id);
console.log(copy.id);
console.log(copy.title);
console.log(Object.hasOwn(copy, "id"));`, expectedOutput: ["a", "undefined", "draft", "false"], explanation: [
        "source.id 能读到 a，说明属性存在，只是 enumerable 为 false。对象展开调用的复制只带走自身可枚举属性，id 不在其中，title 在。",
        "copy.id 因此是 undefined，而且 copy 自身并没有 id。这不是读取失败后的空字符串，而是目标对象上没有这个属性。把展开结果交给后续保存前，要先列出哪些属性被排除了。",
      ] }],
    },
    {
      id: "enumerable", title: "可枚举只影响遍历和部分复制，不影响直接读取",
      paragraphs: [
        "属性描述符里的 enumerable 决定它会不会出现在 for...in、Object.keys，以及对象展开、Object.assign 这类按可枚举属性复制的操作中。直接写 source.id 不看这个标志，所以不可枚举属性仍然可读可写。",
        "writable 决定普通赋值能不能改值。configurable 决定能不能删除、能不能改描述符，以及能不能把不可枚举改成可枚举。四个概念要分开：自身、可枚举、可写、可配置。",
      ],
      examples: [{ code: `"use strict";
const source = {};
Object.defineProperty(source, "id", {
  value: "a", writable: true, enumerable: false, configurable: true,
});
source.title = "draft";
const names = Object.keys(source);
console.log(names.includes("id"));
console.log(names.includes("title"));
console.log(source.id);
const locked = {};
Object.defineProperty(locked, "id", {
  value: 1, writable: false, enumerable: true, configurable: false,
});
try {
  locked.id = 2;
  console.log("assigned");
} catch (error) {
  console.log(error.name);
}
console.log(locked.id);`, expectedOutput: ["false", "true", "a", "TypeError", "1"], explanation: [
        "Object.keys 只列出自身可枚举的字符串属性，所以没有 id，有 title。source.id 仍能读到 a。遍历不到，不等于属性不存在。",
        "locked.id 不可写。严格模式下普通赋值抛出 TypeError，值保持 1。非严格模式里同样的赋值会静默失败，也仍然保持 1；严格模式把失败变成异常，便于立刻发现。它同时不可配置，所以也不能 delete 后再重建。",
      ] }],
    },
    {
      id: "inherited", title: "复制只处理自身属性，原型上的字段不会被展开带走",
      paragraphs: [
        "for...in 会访问自身和原型上的可枚举字符串属性。对象展开和 Object.assign 不走这条遍历，它们只复制对象自身的可枚举属性。原型上的 kind 可以在读取时看见，但不会变成副本的自身属性。",
        "因此“循环能打印出来”不能当作“展开会保留它”的证据。复制之前先用 Object.hasOwn 确认字段写在哪一层。",
      ],
      examples: [{ code: `const parent = { kind: "parent" };
const source = Object.create(parent);
source.title = "draft";
const seen = [];
for (const key in source) seen.push(key);
const copy = { ...source };
console.log(seen.includes("kind"));
console.log(seen.includes("title"));
console.log(Object.hasOwn(source, "kind"));
console.log(copy.kind);
console.log(copy.title);`, expectedOutput: ["true", "true", "false", "undefined", "draft"], explanation: [
        "for...in 既能看到原型上的 kind，也能看到自身的 title。source 自身并不拥有 kind，hasOwn 为 false。",
        "展开只复制自身可枚举属性，副本没有 kind，读取 copy.kind 得到 undefined。title 是自身属性，被复制为 draft。若业务字段放在原型上提供默认值，展开不会把默认值固化进新对象。",
      ] }],
    },
    {
      id: "getter", title: "展开会调用 getter，并把当时的返回值写成数据属性",
      paragraphs: [
        "getter 是读取时执行的函数。对象展开和 Object.assign 需要得到一个值，于是会调用 getter，把返回值放进目标对象的数据属性。副本上不再有 getter。源对象以后即使改变了 getter 所依赖的字段，副本也不会跟着重算。",
        "若要保留“每次读取都重新计算”，必须复制属性描述符，而不是复制求值结果。Object.getOwnPropertyDescriptors 加上 Object.defineProperties 会带走 getter、不可枚举属性和 Symbol 属性。",
      ],
      examples: [{ code: `"use strict";
const source = { title: "draft" };
let reads = 0;
Object.defineProperty(source, "label", {
  enumerable: true,
  get() {
    reads += 1;
    return "computed-" + this.title;
  },
});
const copy = { ...source };
console.log(copy.label);
console.log(reads);
console.log(Object.getOwnPropertyDescriptor(copy, "label").get === undefined);
source.title = "published";
console.log(copy.label);
const clone = Object.defineProperties({}, Object.getOwnPropertyDescriptors(source));
console.log(clone.label);
console.log(reads);`, expectedOutput: ["computed-draft", "1", "true", "computed-draft", "computed-published", "2"], explanation: [
        "展开时 getter 执行一次，reads 变成 1，返回 computed-draft。副本的 label 没有 get，说明它已是数据属性。source.title 后来改成 published，copy.label 仍是展开当时写入的字符串。",
        "defineProperties 复制的是描述符，包括此时 title 的数据属性 published，以及 label 的 getter。读取 clone.label 时 this 是 clone，clone.title 是 published，所以得到 computed-published，reads 变成 2。getter 没有被绑死在 source 上；描述符复制保留的是函数，调用时的 this 仍由读取发生的对象决定。",
      ] }],
    },
    {
      id: "symbols", title: "Symbol 键能被展开带走，但 Object.keys 看不见它",
      paragraphs: [
        "Symbol 也可以作为属性键。普通赋值 source[token] = \"secret\" 会创建可枚举的 Symbol 属性。对象展开和 Object.assign 会复制这种自身可枚举的 Symbol 属性。Object.keys 和 for...in 只处理字符串键，所以它们看不到 token。",
        "Reflect.ownKeys 同时返回字符串键和 Symbol 键，包括不可枚举属性。要回答“这个对象到底有哪些自身键”，不能只调用 Object.keys。复制实现若只用 Object.keys 做白名单，会同时漏掉不可枚举字符串和全部 Symbol。",
      ],
      examples: [{ code: `"use strict";
const source = { title: "draft" };
const token = Symbol("token");
source[token] = "secret";
Object.defineProperty(source, "id", {
  value: "a", writable: true, enumerable: false, configurable: true,
});
const copy = { ...source };
console.log(copy.title);
console.log(copy[token]);
console.log(Object.hasOwn(copy, "id"));
console.log(Object.keys(source).includes("title"));
console.log(Object.getOwnPropertyNames(source).includes("id"));
console.log(Reflect.ownKeys(source).includes(token));
console.log(Object.keys(source).includes(token));`, expectedOutput: ["draft", "secret", "false", "true", "true", "true", "false"], explanation: [
        "展开复制了可枚举的 title 和 token。id 不可枚举，副本没有它。Symbol 键没有因为它不是字符串就被展开丢掉；丢掉它的条件是它不可枚举，或复制函数根本不处理 Symbol。",
        "Object.keys 只有 title 这种可枚举字符串，includes(token) 为 false，因为 keys 的结果里不会出现 Symbol。getOwnPropertyNames 能看到不可枚举的 id，但也不包含 Symbol。Reflect.ownKeys 能看到 token。三组 API 回答的是三个不同的问题。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：先列出要保留的是值、键，还是读取行为",
      paragraphs: [
        "只想要当前可枚举数据的快照时，对象展开或 Object.assign 合适，并接受不可枚举属性和原型字段不会出现，getter 会变成当时的值。要连同不可枚举属性、Symbol 和 getter 一起搬走时，复制描述符。两种结果不要混着叫“深拷贝”。它们也不递归复制嵌套对象。",
        "对外提供的记录要避免把调用方依赖的字段标成不可枚举，除非明确不想让它进入序列化和展开。需要隐藏键时用 Symbol，并在复制函数里用 Reflect.ownKeys 检查，而不是等 Object.keys 的结果来证明键不存在。",
        "审查一个复制函数时，用四份输入试它：不可枚举字符串、原型上的同名字段、可枚举 Symbol、会读取其他字段的 getter。任何一份的结果解释不清，这个函数的复制范围就还没有定义。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，确认属性在谁身上。自身没有时，读取可能来自原型，但展开和 Object.assign 不会把原型属性复制过来。",
        "第二步，看描述符的 enumerable、writable、configurable。遍历和部分复制看可枚举；严格模式下的普通赋值看可写；delete 和修改描述符看可配置。",
        "第三步，看键的类型。字符串键和 Symbol 键都会存在。Object.keys 只列可枚举字符串，getOwnPropertyNames 列全部字符串，Reflect.ownKeys 两者都列。",
        "第四步，看复制的是一次求值还是 getter 本身。展开留下返回值；描述符复制留下函数，之后读取时的 this 是新对象。开头丢掉的 id，就是一条存在但不可枚举的自身属性，展开按规则没有带走它。",
      ],
    },
  ],
  sources: [
    { title: "ECMAScript：属性描述符", url: "https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-property-descriptor-specification-type" },
    { title: "ECMAScript：Object.assign", url: "https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.assign" },
    { title: "MDN：Object.defineProperty", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty" },
  ],
};
