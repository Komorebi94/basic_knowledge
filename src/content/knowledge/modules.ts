import type { Article } from "../articles";

export const moduleArticle: Article = {
  id: "K01-07", kind: "knowledge", domainSlug: "javascript", slug: "modules",
  title: "模块与执行时机",
  summary: "ES 模块把求值推迟到依赖准备好之后，并且只执行一次；导出的 let 是活绑定，循环依赖若在初始化完成前读取会抛出 ReferenceError。",
  aliases: ["esm", "import", "live binding", "模块", "循环依赖", "动态导入"],
  tags: ["JavaScript", "模块"], estimatedMinutes: 22, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：同一段初始化，为什么只打印了一次？",
      paragraphs: [
        "经典脚本每被插入一次就执行一次。ES 模块按模块记录求值：同一个模块地址第一次真正加载时执行模块体，之后再 import，拿到的是已经求值过的同一份命名空间。初始化日志不会因为调用方 import 了两次就再打印。",
        "下面的示例在浏览器里按 ES 模块执行，可以使用顶层 await。模块源码放在 Blob 地址里，是为了在单页示例中产生真实的模块记录，不是业务里加载文件的方式。每个示例互不依赖。",
      ],
      examples: [{ language: "module", code: `console.log("before");
const url = URL.createObjectURL(new Blob([
  "console.log('evaluate'); export const id = 1;",
], { type: "text/javascript" }));
const pending = import(url);
console.log("after");
const first = await pending;
const second = await import(url);
console.log(first.id);
console.log(second.id);
console.log(first === second);`, expectedOutput: ["before", "after", "evaluate", "1", "1", "true"], explanation: [
        "import() 返回 Promise，不会挡住后面的同步代码，所以 before 和 after 都先于模块体。模块体随后执行，打印 evaluate，然后两次 await 才得到结果。",
        "第二次 import 同一个 Blob 地址，不会再打印 evaluate。first 和 second 是同一个模块命名空间，恒等比较为 true，id 都是 1。动态导入改变的是发起加载的时机，不让模块体按调用次数重复执行。",
      ] }],
    },
    {
      id: "live-binding", title: "导出的是活绑定，读到的是当前值而不是导入时的快照",
      paragraphs: [
        "模块之间通过静态 import 连接的是绑定。导出方执行 count += 1 之后，已经导入该绑定的模块再读 count，看到的是新值。绑定不是导入瞬间复制出的数字。",
        "如果调用方自己执行 const snapshot = ns.count，那一次读到的数字会放进 snapshot。snapshot 是普通常量，不再跟随模块里的 count。要区分的是“模块绑定”和“你主动保存下来的值”。",
      ],
      examples: [{ language: "module", code: `const bUrl = URL.createObjectURL(new Blob([
  "export let count = 1; export function bump() { count += 1; }",
], { type: "text/javascript" }));
const ns = await import(bUrl);
console.log(ns.count);
ns.bump();
const aSource = 'import { count, bump } from "' + bUrl + '"; export function read() { return count; } export function up() { bump(); }';
const aUrl = URL.createObjectURL(new Blob([aSource], { type: "text/javascript" }));
const other = await import(aUrl);
console.log(other.read());
const snapshot = ns.count;
other.up();
console.log(snapshot);
console.log(ns.count);
console.log(other.read());`, expectedOutput: ["1", "2", "2", "3", "3"], explanation: [
        "命名空间第一次读到 1。bump 把模块里的 count 改成 2。另一个模块通过静态 import 引入的是同一个绑定，read() 也得到 2，不是它被创建时单独复制的 1。",
        "snapshot 在此时取到数字 2。other.up() 再把绑定加到 3，snapshot 仍是 2，而 ns.count 和 other.read() 都是 3。活绑定只存在于模块导入关系里；普通赋值拿到的是当时的原始值。",
      ] }],
    },
    {
      id: "cycle", title: "循环依赖可以连接函数，但不能在初始化完成前读取绑定",
      paragraphs: [
        "两个模块可以互相静态导入。只要在模块体执行期间不去读对方尚未初始化的词法绑定，循环可以建立。把读取放进函数，函数等到两边都初始化完再调用，就能读到对方的导出。",
        "如果模块体在求值时直接使用对方的 const 或 let，而对方那一行还没执行，就会抛出 ReferenceError。这和暂时性死区是同一类规则：绑定已经存在于作用域，但还不能读。循环本身不是错误，在初始化完成前读取才是。",
      ],
      examples: [{ language: "module", code: `const sourceA = "import { readA } from 'mod-b'; export const nameA = 'A'; export function readB() { return readA(); }";
const sourceB = "import { nameA } from 'mod-a'; export const nameB = 'B'; export function readA() { return nameA; }";
const urlA = URL.createObjectURL(new Blob([sourceA], { type: "text/javascript" }));
const urlB = URL.createObjectURL(new Blob([sourceB], { type: "text/javascript" }));
const map = document.createElement("script");
map.type = "importmap";
map.textContent = JSON.stringify({ imports: { "mod-a": urlA, "mod-b": urlB } });
document.head.append(map);
const cycle = await import("mod-a");
console.log(cycle.readB());`, expectedOutput: ["A"], explanation: [
        "mod-a 和 mod-b 通过导入表互相引用。求值 mod-b 时只定义 readA，不读取 nameA。等 import 完成后再调用 readB，readA 才读取已经初始化的 nameA，结果是 A。",
        "导入表在这个示例里用来给两个 Blob 地址起稳定的模块说明符。业务项目里的循环依赖通常写成相对路径，连接规则相同：函数可以在初始化之后调用，模块体里的立即读取则要看对方绑定有没有完成初始化。",
      ] }, { language: "module", code: `const sourceA = "import { nameB } from 'mod-b'; export const nameA = 'A';";
const sourceB = "import { nameA } from 'mod-a'; export const nameB = nameA + '-B';";
const urlA = URL.createObjectURL(new Blob([sourceA], { type: "text/javascript" }));
const urlB = URL.createObjectURL(new Blob([sourceB], { type: "text/javascript" }));
const map = document.createElement("script");
map.type = "importmap";
map.textContent = JSON.stringify({ imports: { "mod-a": urlA, "mod-b": urlB } });
document.head.append(map);
try {
  await import("mod-a");
  console.log("loaded");
} catch (error) {
  console.log(error.name);
}`, expectedOutput: ["ReferenceError"], explanation: [
        "这是错误的循环读取。求值 mod-a 时要先取得 mod-b 的 nameB。mod-b 的模块体立刻计算 nameA + '-B'，此时 mod-a 的 nameA 还停在初始化之前，读取抛出 ReferenceError。不会得到一个半初始化的字符串。",
        "把 nameB 的计算移进函数，或者改成单向依赖，可以避开这个顺序。捕获异常只说明这次加载失败，不表示两个模块以后还可以当作已经求值成功的记录继续用。",
      ] }],
    },
    {
      id: "failure", title: "模块体语法错误会让这次导入失败，而不是退回经典脚本",
      paragraphs: [
        "import() 失败时 Promise 拒绝。语法错误发生在模块解析阶段，调用方得到异常，模块不会继续执行后面的导出。不要在 catch 之后假设命名空间里已经有默认值。",
        "模块也始终是严格模式。顶层 this 是 undefined，不是全局对象。这和经典脚本里顶层 this 指向全局对象不同。把一段依赖 this 等于全局对象的脚本改成模块时，这种读取会变。",
      ],
      examples: [{ language: "module", code: `console.log(this === undefined);
const badUrl = URL.createObjectURL(new Blob([
  "export const = ;",
], { type: "text/javascript" }));
try {
  await import(badUrl);
  console.log("loaded");
} catch (error) {
  console.log(error.name);
}`, expectedOutput: ["true", "SyntaxError"], explanation: [
        "模块顶层 this 是 undefined，所以第一行是 true。坏模块的 export 声明语法不完整，import 拒绝，错误名是 SyntaxError，不会打印 loaded。",
        "SyntaxError 是这一个模块源码无法解析的结果。它和上一节初始化期间的 ReferenceError 不是同一种失败：前者还没有进入求值，后者是求值顺序中的读取。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：稳定依赖用静态导入，条件加载用动态导入",
      paragraphs: [
        "启动时就需要、并且应该进入依赖图的代码，用静态 import。它的绑定关系在代码里可见，循环依赖的初始化顺序也能被读出来。只有按用户操作或条件才加载的分支，用 import()。动态导入仍然只求值一次，不会变成每次点击都重新执行模块体。",
        "导出可变绑定时，调用方会看到后续赋值。若希望给调用方一份不会跟随变化的值，在导出前完成计算，或让调用方显式复制。不要依赖循环模块在模块体里互相读 const。",
        "检查两个互相导入的模块时，列出每条绑定是在模块体里立即读取，还是在函数调用时读取。立即读取的那一条，要能指出对方初始化是否已经完成。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，确认这是经典脚本还是模块。模块延迟到依赖可求值时执行，顶层 this 为 undefined，并且同一个模块记录只求值一次。",
        "第二步，看 import 是静态还是 import()。静态导入参与初始依赖图；import() 在调用到那一行才开始，并且不会挡住它后面的同步语句。",
        "第三步，区分活绑定和一次读取保存下来的值。另一个模块读到的导出 let 会跟随赋值；本地 const snapshot = count 不会。",
        "第四步，遇到循环时标出读取发生在模块体还是函数内。函数内的读取可以等初始化完成；模块体里读取尚未初始化的绑定会得到 ReferenceError。开头的 evaluate 只出现一次，就是因为第二次 import 复用了同一份模块记录。",
      ],
    },
  ],
  sources: [
    { title: "ECMAScript：模块记录", url: "https://tc39.es/ecma262/multipage/ecmascript-language-scripts-and-modules.html#sec-modules" },
    { title: "ECMAScript：import()", url: "https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-import-calls" },
    { title: "MDN：JavaScript 模块", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules" },
  ],
};
