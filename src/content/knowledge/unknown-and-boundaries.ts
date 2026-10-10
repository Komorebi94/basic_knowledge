import type { Article } from "../articles";

export const unknownArticle: Article = {
  id: "K03-01", kind: "knowledge", domainSlug: "typescript", slug: "unknown-and-boundaries",
  title: "unknown、收窄与边界校验",
  summary: "用一份任务数据走完接收、形状检查、字段校验和领域转换，区分编译器知道的类型与运行时真正可信的数据。",
  aliases: ["unknown", "type narrowing", "type guard"], tags: ["TypeScript", "边界校验"],
  estimatedMinutes: 20, verifiedAt: "2026-09-30",
  sections: [
    { id: "problem", title: "接口声明正确，为什么页面仍然会报错？", paragraphs: [
      "假设页面从文件中读取任务：任务应该有 id、title 和 done。你已经为它定义了 TypeScript 类型，接口层也声明返回这个类型，但用户导入的文件把 title 写成数字。页面执行 title.trim() 时仍会抛错。",
      "类型定义表达的是程序希望满足的契约。JSON、网络和浏览器存储里的字节不会因为项目写了一个类型就改变形状。需要在进入系统的地方，把“尚未证明的数据”转换成“已经检查的数据”。本文使用独立 TypeScript 片段，开启 strict 检查；编译为 JavaScript 后运行，输出注释给出结果。",
    ], examples: [{ language: "typescript", code: `type Task = { id: string; title: string; done: boolean };
const input: unknown = JSON.parse('{"id":"t1","title":42,"done":false}');
const task = input as Task; // 只是断言，未检查数据
try {
  console.log(task.title.trim());
} catch (error) {
  console.log(error instanceof Error ? error.name : 'unknown error');
}
// TypeError`, expectedOutput: ["TypeError"], explanation: [
      "as Task 告诉编译器按 Task 看待 input，但没有产生运行时字段检查。编译后数据中的 title 仍是数字 42，因此 .trim() 不是可调用的方法。示例故意展示错误用法，不能把这一行当成边界校验。",
      "把输入先标为 unknown，是为了让后续代码在使用前证明必要事实。若直接允许任意属性访问，风险只会被推迟到运行时，错误也可能出现在离入口很远的页面组件里。",
    ] }] },
    { id: "unknown", title: "unknown 保留不确定性，收窄逐步消除它", paragraphs: [
      "unknown 表示此刻不知道值的具体类型。可以保存它、传给同样接收未知输入的函数，但不能未经检查就当作带 title 的对象使用。收窄发生在控制流中：通过一个条件后，编译器知道分支里多了哪些事实。",
      "不要一次跨过所有层次。先确认是对象，再确认属性存在，再确认属性值类型和范围。每一步只建立它真正检查过的结论。检查 typeof value === 'object' 时尤其要排除 null，也要考虑数组是否符合业务含义。",
    ], examples: [{ language: "typescript", code: `function readTitle(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  if (!('title' in value) || typeof value.title !== 'string') return null;
  const title = value.title.trim();
  return title.length > 0 ? title : null;
}
console.log(readTitle({ title: '  Draft  ' })); // Draft
console.log(readTitle({ title: 42 })); // null
console.log(readTitle(null)); // null
console.log(readTitle([])); // null`, expectedOutput: ["Draft", "null", "null", "null"], explanation: [
      "第一行守卫返回后，value 是非空且非数组的对象；属性存在性检查后，能继续判断 title 的值；字符串检查通过，才可以调用 trim。代码的使用能力与检查取得的证据一一对应。",
      "但这个函数只读取一个标题，不能由此宣称整份 Task 已通过验证。id 与 done 尚未检查。函数返回 string | null，恰好体现它承担的范围，没有把局部证据夸大成整个对象可信。",
    ] }] },
    { id: "mechanism", title: "类型守卫是承诺，编译器不会替你审查承诺是否完整", paragraphs: [
      "value is Task 形式的类型谓词允许调用方在条件为 true 的分支中，把 value 当作 Task 使用。它很方便，也很容易写得过于宽松：只检查 title，却声明已经证明 id 与 done，编译器不会自动补齐这些检查。",
      "设计守卫时，先列出返回类型中所有必需字段，以及每个字段的条件。下面的守卫只证明形状正确；字符串是否为空、id 是否合乎业务规则，将在下一层处理。",
    ], examples: [{ language: "typescript", code: `type Task = { id: string; title: string; done: boolean };
function isTask(value: unknown): value is Task {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && 'id' in value && typeof value.id === 'string'
    && 'title' in value && typeof value.title === 'string'
    && 'done' in value && typeof value.done === 'boolean';
}
for (const input of [
  { id: 't1', title: 'Draft', done: false },
  { title: 'Draft' },
  { id: 't1', title: 'Draft', done: 'false' },
]) console.log(isTask(input));
// true、false、false`, expectedOutput: ["true", "false", "false"], explanation: [
      "第一份数据字段齐全且类型一致。第二份缺少两个字段。第三份 done 是字符串，不能因为文本看起来像布尔值就让它通过；Boolean('false') 反而会得到 true，隐式转换容易引入更难发现的错误。",
      "这个守卫接受的不是“任意业务中都合法的任务”，而是三种字段类型满足要求的对象。例如空字符串仍可通过。守卫的命名、返回类型和调用方用途必须一致；需要完整业务校验时，应返回下一节那样的解析结果。",
    ] }] },
    { id: "parsing", title: "校验与转换一起做：返回领域值，或者说明失败原因", paragraphs: [
      "真实边界通常不只需要 true 或 false。导入失败时，用户希望知道是缺字段、类型错还是标题为空；进入系统后，页面希望拿到已规范化的值。解析函数可以同时完成检查和转换，并用判别联合明确表达成功与失败。",
      "下面给这篇教程约定一个小型契约：id 由 1—32 个字母、数字或连字符构成；标题去除首尾空白后长度为 1—80；done 必须为布尔值。这些是示例业务规则，不是所有任务系统的通用限制。",
    ], examples: [{ language: "typescript", code: `type Task = { id: string; title: string; done: boolean };
type ParseResult = { ok: true; value: Task } | { ok: false; error: string };
function parseTask(input: unknown): ParseResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, error: 'task must be an object' };
  }
  if (!('id' in input) || typeof input.id !== 'string' || !/^[a-zA-Z0-9-]{1,32}$/.test(input.id)) {
    return { ok: false, error: 'invalid id' };
  }
  if (!('title' in input) || typeof input.title !== 'string') {
    return { ok: false, error: 'title must be a string' };
  }
  const title = input.title.trim();
  if (title.length < 1 || title.length > 80) return { ok: false, error: 'invalid title length' };
  if (!('done' in input) || typeof input.done !== 'boolean') {
    return { ok: false, error: 'done must be a boolean' };
  }
  return { ok: true, value: { id: input.id, title, done: input.done } };
}
for (const input of [
  { id: 't1', title: '  Draft  ', done: false, ignored: 'extra' },
  { id: 't1', title: ' ', done: false },
  { id: 't1', title: 'Draft', done: 'false' },
]) {
  const result = parseTask(input);
  console.log(result.ok ? result.value.title : result.error);
}
// Draft、invalid title length、done must be a boolean`, expectedOutput: ["Draft", "invalid title length", "done must be a boolean"], explanation: [
      "成功分支创建一个只含白名单字段的新对象，没有把输入对象原样透传，也没有让未知额外字段自动进入领域值。标题已完成规范化，调用方不必每次再 trim 一遍。",
      "result.ok 是稳定的判别字段。判断它之后，成功分支能访问 value，失败分支能访问 error。这个结构使错误无法被一个空 Task 或默认标题掩盖，也避免把网络失败、解析失败和有效空列表混为一谈。",
      "示例按 JavaScript 字符串 length 计算长度，即 UTF-16 码元数；如果产品按用户感知字符计数，应另定规则。它还使用 in 检查属性可见性：对于 JSON.parse 得到的数据足够直观；若接收任意对象，要明确是否接受继承属性，并决定使用自有属性检查。Getter 和 Proxy 也可能在读取时运行代码，解析函数不是执行不可信对象的安全沙箱。",
    ] }] },
    { id: "arrays", title: "数组通过检查，只能说明容器是数组", paragraphs: [
      "Array.isArray(input) 不会证明每个元素都是任务。批量导入还需要逐项检查，并决定遇到坏元素时是整批失败还是保留有效项。两种策略都可以，但必须让结果与用户预期一致，不能悄悄丢掉错误数据。",
      "下面只提取所有合法字符串标题，作为一种明确的示例策略：任意一个元素无效，就返回失败，并指出它的位置。它不是上一节完整的 Task 导入器，而是专门演示“容器类型”与“元素类型”的区别。",
    ], examples: [{ language: "typescript", code: `type TitlesResult = { ok: true; values: string[] } | { ok: false; error: string };
function parseTitles(input: unknown): TitlesResult {
  if (!Array.isArray(input)) return { ok: false, error: 'expected array' };
  const values: string[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const item: unknown = input[index];
    if (typeof item !== 'string' || item.trim().length === 0) {
      return { ok: false, error: 'invalid item at ' + index };
    }
    values.push(item.trim());
  }
  return { ok: true, values };
}
for (const input of [[' One ', 'Two'], ['One', 2], []]) {
  const result = parseTitles(input);
  console.log(result.ok ? result.values.join(',') : result.error);
}
// One,Two、invalid item at 1、空行`, expectedOutput: ["One,Two", "invalid item at 1", ""], explanation: [
      "元素先被接成 unknown，逐个通过检查后才加入 string[]。第二个输入虽然是数组，却因为索引 1 的值是数字而失败。第三个输入是有效空数组，输出为空行；失败与有效空结果被判别字段区分开。",
      "大量导入还应限制文件大小、元素个数和嵌套深度，避免一个格式有效的文件消耗过多资源。限制多少取决于实际业务；不要为了示例通过就把生产系统边界留空。",
    ] }] },
    { id: "json", title: "JSON 语法有效与业务数据有效，是两次不同的检查", paragraphs: [
      "JSON.parse 只负责解析 JSON 文本。它可能抛出语法错误；解析成功得到的值也可能是 null、数组、字符串，或者字段不满足契约的对象。接收文本的适配层需要分别处理这两类结果。",
    ], examples: [{ language: "typescript", code: `type JsonResult = { ok: true; value: unknown } | { ok: false; error: string };
function parseJson(text: string): JsonResult {
  try {
    const value: unknown = JSON.parse(text);
    return { ok: true, value };
  } catch (error) {
    if (error instanceof SyntaxError) return { ok: false, error: 'invalid JSON syntax' };
    throw error;
  }
}
for (const text of ['{"title":"Draft"}', '{', 'null']) {
  const result = parseJson(text);
  console.log(result.ok ? typeof result.value : result.error);
}
// object、invalid JSON syntax、object`, expectedOutput: ["object", "invalid JSON syntax", "object"], explanation: [
      "最后一项输出 object，是因为 typeof null 的历史行为，并不是说 null 是可读字段的业务对象。parseJson 成功只证明文本语法可解析，value 仍是 unknown；它还必须交给 parseTask 等具体解析函数。",
      "错误处理只把预期的语法失败转换成结构化结果，其他意外错误继续抛出。把所有失败都吞成 []，会让损坏文件看起来像一份没有任务的正常备份，后续替换数据时尤其危险。",
    ] }] },
    { id: "application", title: "把校验放在边界，把可靠值交给页面", paragraphs: [
      "合理的数据流是：外部文本或响应 → 适配层解析 → 领域校验与规范化 → 明确的成功或失败 → 页面展示。页面接收到 Task 后，就按 Task 的规则使用，不在每个组件里重复猜测 title 是否为数字。",
      "校验规则不是只要写过一次就永远有效。如果接口版本改变、旧备份格式不同，应在边界识别版本并进行明确迁移。新类型声明不会自动让历史文件兼容；字段新增也要说明默认值的业务含义。",
      "当结构很多时，可以使用项目已有的 Schema 校验工具，减少手写检查的重复。选择依据是项目规模、错误定位、运行成本和已有约定，不应为了三个字段引入一套复杂平台，也不能假定工具能替你决定业务是否合法。",
    ], diagram: { caption: "证据应在系统入口建立", lines: ["外部数据：unknown", "    ↓ 语法解析（可能失败）", "未知值：unknown", "    ↓ 形状检查 + 范围检查 + 规范化", "成功：Task  →  页面和领域逻辑", "失败：明确的错误  →  提示与恢复；不覆盖原数据"] } },
    { id: "pitfalls", title: "四种看似安全、实际证据不足的写法", paragraphs: [
      "第一，as 或非空断言改变编译器看法，不产生运行时证明。第二，只验证一个字段，却返回包含许多字段的类型谓词，会让调用方得到虚假的保证。第三，只验证数组容器，忽略元素形状，错误仍会在 map 或渲染时暴露。",
      "第四，把输入整个展开进领域对象，再覆盖几个已检查字段。未预期字段、内部元数据或危险键可能随之保留下来。边界输出应按契约构造白名单对象；需要保留扩展字段时，也要明确允许范围与使用方式。",
      "校验也不是授权。证明 userId 是字符串，不代表当前用户有权操作它对应的资源；证明 URL 能解析，也不代表目标可访问。数据类型、业务规则和权限分别需要相应检查。",
    ] },
    { id: "recall", title: "审阅一个解析函数时，沿输入与输出核对", paragraphs: [
      "先看输入来自哪里、是否以 unknown 接收，解析异常是否与业务错误分开。再逐项列出返回类型包含的事实，确认每个事实都有对应检查，且转换顺序没有把非法值伪装成合法值。",
      "随后用缺字段、null、数组、错误元素、空白字符串、错误布尔值和边界长度验证失败路径。最后检查输出是否泄露原对象引用或额外字段，失败是否会错误地覆盖已保存数据。",
      "TypeScript 能帮助把已取得的证据传播给调用方。真正的可靠性来自入口检查、清晰的结果模型和可运行的边界用例；类型声明本身不是外部数据的质量保证。",
    ] },
  ],
  sources: [
    { title: "TypeScript Handbook：Narrowing", url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html" },
    { title: "TypeScript Handbook：Everyday Types", url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html" },
    { title: "MDN：JSON.parse", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse" },
  ],
};
