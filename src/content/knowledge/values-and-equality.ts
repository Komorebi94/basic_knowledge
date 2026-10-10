import type { Article } from "../articles";

export const valuesArticle: Article = {
  id: "K01-01", kind: "knowledge", domainSlug: "javascript", slug: "values-and-equality",
  title: "值、引用与相等性",
  summary: "赋值时复制的是原始值还是对象引用；严格相等、Object.is 和集合去重对 NaN、正负零的处理并不相同。",
  aliases: ["equality", "Object.is", "SameValue", "reference", "引用", "相等", "NaN"],
  tags: ["JavaScript", "相等性", "引用"], estimatedMinutes: 24, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：备份过的草稿，为什么跟着原件一起变了？",
      paragraphs: [
        "假设表单有一份草稿，保存前要留一个基线，用来判断用户有没有改过字数。最直接的写法是把当前对象赋给另一个变量。随后用户把 count 从 1 改成 2，基线里的 count 也变成了 2。比较时两边永远相同，页面就无法发现修改。",
        "下面的代码都可以单独运行在现代浏览器控制台，或 Node.js 20 及以上版本。每个示例互不依赖。输出注释对应完整运行结果；先看结果，再拆开赋值到底复制了什么。",
      ],
      examples: [{ code: `const draft = { count: 1 };
const baseline = draft;
baseline.count = 2;
console.log(draft.count); // 2
console.log(draft === baseline); // true`, expectedOutput: ["2", "true"], explanation: [
        "baseline = draft 没有制造第二份字段。它复制的是“指向这个对象的引用”，所以 baseline 和 draft 是两个名字，指向同一块对象。接着执行 baseline.count = 2，改的是这个对象的 count 属性，从 draft 读到的也是 2。",
        "最后的 true 说明两个名字通过严格相等比较时被视为同一个对象。如果目标是留住修改前的字数，这次赋值并没有完成复制。后面要先分清原始值、对象引用、重新绑定和修改属性，再决定相等比较该用哪一种规则。",
      ] }],
    },
    {
      id: "primitives", title: "原始值：赋值复制的是当时的值",
      paragraphs: [
        "JavaScript 的原始值包括 undefined、null、布尔值、数字、bigint、字符串和 symbol。它们不是带字段的对象。把一个原始值赋给另一个变量，得到的是那一次读取到的值；之后修改原来的绑定，不会改写已经复制出去的那一份。",
        "字符串和数字看起来都能“变化”，但代码里的变化通常是让名字改指向另一个值，而不是打开原来的字符串去改其中一个字符。下面用数字把这个过程和对象的共享属性分开。",
      ],
      examples: [{ code: `let score = 1;
const snapshot = score;
score = 2;
console.log(snapshot); // 1
console.log(score); // 2`, expectedOutput: ["1", "2"], explanation: [
        "第二行读取 score 当时的数字 1，并把这个数字放进 snapshot。第四行把 score 这个名字重新绑定到 2，没有一个操作能回头修改 snapshot 里的 1。两个变量后来不同，是因为它们持有两份原始值。",
        "null 和 undefined 也是值，不是“空对象”。typeof null === 'object' 是历史遗留结果，不能据此认为 null 可以拷贝字段。后面判断某个东西是不是记录对象时，必须把 null 排除。",
      ] }],
    },
    {
      id: "references", title: "对象引用：复制的是访问路径，不是字段快照",
      paragraphs: [
        "对象、数组、函数和日期都是对象。变量里存放的是对对象的引用。赋值、传参和从函数返回，传递的都是这份引用；对象的字段仍留在原来的对象上，不会因为多了一个名字就自动复制。",
        "因此“两个变量相等”和“两个变量的字段看起来一样”是两件不同的事。开头的草稿问题属于前者：名字不同，引用相同，所以属性修改互相可见。",
      ],
      diagram: {
        caption: "原始值复制的是值，对象赋值复制的是引用",
        lines: [
          "score = 1",
          "snapshot = score     snapshot 得到数字 1；之后 score = 2 不影响它",
          "",
          "draft = { count: 1 }",
          "baseline = draft     两个名字指向同一对象",
          "baseline.count = 2   这个对象的 count 变成 2，draft.count 也是 2",
        ],
      },
    },
    {
      id: "parameters", title: "参数与 const：重新绑定和修改属性不是一回事",
      paragraphs: [
        "函数参数同样接收一份引用或一份原始值。在函数内部给参数名重新赋值，只改变这次调用里的局部绑定，调用方的变量仍指向原来的对象。给参数对象的属性赋值，则会修改调用方也能看到的那一个对象。",
        "const 限制的是名字不能再绑定到别的值，不限制对象内部的属性。想用 const 保护草稿不被修改，做不到；它只能防止 baseline 这个名字后来指向另一份对象。",
      ],
      examples: [{ code: `function rebind(record) {
  record = { count: 9 };
}
function mutate(record) {
  record.count = 9;
}
const untouched = { count: 1 };
const edited = { count: 1 };
rebind(untouched);
mutate(edited);
console.log(untouched.count); // 1
console.log(edited.count); // 9`, expectedOutput: ["1", "9"], explanation: [
        "rebind 的参数一开始和 untouched 指向同一对象。函数体把局部名字 record 改指向一个新对象，调用结束后这个局部名字消失，untouched 仍是原来的对象，count 保持 1。",
        "mutate 没有更换参数指向的对象，而是写入 count。edited 和参数指向同一对象，所以调用方读到 9。把对象传进函数，并不等于把字段复制进函数。",
      ] }, { code: `const item = { id: 1 };
item.id = 2;
try {
  item = { id: 3 };
  console.log('reassigned');
} catch (error) {
  console.log(error.name); // TypeError
}
console.log(item.id); // 2`, expectedOutput: ["TypeError", "2"], explanation: [
        "item.id = 2 修改的是对象属性，const 允许这样做，所以 id 变成 2。try 里的 item = { id: 3 } 试图更换这个名字的绑定，语言会抛出 TypeError，赋值不会发生。",
        "这个例子是为了展示失败路径：const 不能当作深冻结。若业务要求对象在创建后不能改字段，需要单独的冻结或改为返回新对象；只把变量写成 const，调用方仍可能通过另一条引用改掉属性。",
      ] }],
    },
    {
      id: "shallow-copy", title: "浅拷贝：新对象只复制第一层字段",
      paragraphs: [
        "要保留修改前的草稿，需要一个新对象。对象展开和 Object.assign 会把源对象自身的可枚举属性值写到新对象上。第一层若是数字或字符串，新对象得到的是那些原始值；第一层若是对象，写进去的仍是原来的引用。",
        "所以浅拷贝能挡住“替换标题”这种第一层修改，挡不住“修改嵌套 meta”。复制到哪一层，必须和数据结构对应起来看，不能从语法上的一对花括号判断已经完整复制。",
      ],
      examples: [{ code: `const source = { title: 'draft', meta: { version: 1 } };
const copy = { ...source };
copy.title = 'published';
copy.meta.version = 2;
console.log(source.title); // draft
console.log(source.meta.version); // 2
console.log(source.meta === copy.meta); // true`, expectedOutput: ["draft", "2", "true"], explanation: [
        "展开创建了新对象，title 从 source 读出字符串 draft 后写到 copy。后来 copy.title = 'published' 只改新对象的第一层属性，source.title 仍是 draft。",
        "meta 的值是一个对象引用。展开时这个引用被原样写到 copy.meta，两个 meta 通过严格相等得到 true。copy.meta.version = 2 修改的是共享的嵌套对象，source.meta.version 因此也是 2。数组的 [...items] 同样只复制元素所在的那一层引用。",
      ] }],
    },
    {
      id: "deep-copy", title: "结构化克隆：能复制嵌套数据，但不能复制行为",
      paragraphs: [
        "如果基线必须和后续编辑完全分开，嵌套对象也要变成新对象。浏览器和 Node.js 20 及以上提供 structuredClone，它按结构化克隆算法复制可克隆的数据，包括嵌套对象、数组、日期，以及值为 undefined 的属性。克隆结果是新对象，和源对象不是同一个引用。",
        "这不是“把任何 JavaScript 值都复制一遍”。函数、symbol 值不能被结构化克隆，调用会抛出 DataCloneError。方法、回调和私有状态都不在这套复制能力里。需要行为时，应在数据复制之外重新创建函数，而不是假设克隆会保留方法。",
      ],
      examples: [{ code: `const source = { title: 'draft', meta: { version: 1 }, note: undefined, when: new Date(0) };
const copy = structuredClone(source);
copy.meta.version = 2;
console.log(source.meta.version); // 1
console.log(source.meta === copy.meta); // false
console.log('note' in copy); // true
console.log(copy.when.getTime()); // 0
console.log(source.when === copy.when); // false
try {
  structuredClone({ label: 'task', run() { return this.label; } });
  console.log('cloned');
} catch (error) {
  console.log(error.name); // DataCloneError
}`, expectedOutput: ["1", "false", "true", "0", "false", "DataCloneError"], explanation: [
        "copy.meta.version = 2 之后，source.meta.version 仍是 1，并且两个 meta 的严格相等为 false。嵌套对象在这次克隆中被换成了新对象，开头那种共享引用没有发生。",
        "note 的值是 undefined，克隆后属性仍在。日期被复制成另一个 Date，时间数值仍是 0，但 source.when === copy.when 为 false。比较日期要比较时间数值，不能比较两个 Date 对象的身份。",
        "最后一段是错误用法：对象上的 run 是函数，结构化克隆拒绝它并抛出 DataCloneError，不会静默丢掉方法后返回半份对象。catch 只证明这次调用失败；它不表示所有不可复制的值都使用同一个错误名以外的恢复策略。业务代码应在克隆前提取纯数据。",
      ] }],
    },
    {
      id: "strict-equality", title: "严格相等：类型和身份都参与，不做隐式转换",
      paragraphs: [
        "=== 对应规范中的 IsStrictlyEqual。类型不同时直接为 false，不会把字符串转成数字，也不会把 null 和 undefined 当成同一个值。数字之间还有两个特殊点：NaN 不严格等于 NaN，而 +0 严格等于 -0。对象之间比较的是引用是否相同，不比较字段内容。",
        "包装对象不是原来的原始值。Object(1) 得到一个数字对象，它和数字 1 类型不同，严格相等为 false。日常代码应避免 new Number、new String、new Boolean，否则同一个业务数字会因为包装而比较失败。",
      ],
      examples: [{ code: `console.log(1 === 1); // true
console.log('1' === 1); // false
console.log(null === undefined); // false
console.log(Object.is(1, Object(1))); // false，包装对象不是数字 1
const left = { id: 1 };
const right = { id: 1 };
console.log(left === right); // false
console.log(left === left); // true
const token = Symbol('id');
console.log(token === token); // true
console.log(Symbol('id') === Symbol('id')); // false`, expectedOutput: ["true", "false", "false", "false", "false", "true", "true", "false"], explanation: [
        "1 和 1 是相同类型的相同数字。字符串 '1' 不会在 === 中变成数字，所以第二行为 false。null 与 undefined 是两种不同的原始值。Object(1) 是对象，Object.is 和数字 1 比较的结果为 false。",
        "left 和 right 的字段都是 id: 1，但它们是两次对象字面量创建出的两个对象，=== 为 false。同一个引用和自己比较才为 true。symbol 同理：同一个 symbol 值相等，两次 Symbol('id') 会创建两个不同的 symbol，描述文字相同也不相等。",
      ] }],
    },
    {
      id: "loose-equality", title: "宽松相等会转换类型，不适合当作字段校验",
      paragraphs: [
        "== 对应规范中的 IsLooselyEqual。它在类型不同时按一组转换规则比较，例如 false 和空字符串都会转到数字 0，于是 0 == false 和 '' == false 都为 true；null == undefined 也为 true，但 null == 0 为 false。bigint 和数字可以用 == 做数值比较，1n == 1 为 true，但 1n === 1 为 false。",
        "这些规则能解释旧代码，不适合作为新的缺省判断。下面先给出一个错误实现：它想表示“没有填写”，却把数字 0 也收进去。修正后的判断只承认 null 和 undefined，空字符串是否合法留给该字段自己的规则。",
      ],
      examples: [{ code: `function isMissing(value) {
  return value == null || value == false || value == '';
}
function isAbsent(value) {
  return value === null || value === undefined;
}
console.log(isMissing(0)); // true
console.log(isAbsent(0)); // false
console.log(isAbsent(null)); // true
console.log(isAbsent('')); // false
console.log(1n === 1); // false
console.log(1n == 1); // true`, expectedOutput: ["true", "false", "true", "false", "false", "true"], explanation: [
        "isMissing 是错误实现。0 == false 为 true，所以计数字段里的 0 会被当成缺失。空字符串同样因为 == false 进入这个分支。调用方无法区分“用户填了 0”和“用户没填”。",
        "isAbsent 只在值严格等于 null 或 undefined 时返回 true。0 是一个已经存在的数字，空字符串是一个已经存在的字符串，都返回 false。若业务把空字符串视为未填写，应单独写 title.trim().length === 0 这样的字段规则，不要借宽松相等顺便处理。",
        "最后两行只说明 bigint 与数字的两种相等：=== 因类型不同而为 false，== 按数值比较而为 true。不要从这里推出所有不同类型都能安全混用；不同运算的转换规则并不相同。",
      ] }],
    },
    {
      id: "same-value", title: "Object.is：把 NaN 视为相同，把正负零视为不同",
      paragraphs: [
        "Object.is 对应规范中的 SameValue。它和 === 的差别集中在两个数字边界：Object.is(NaN, NaN) 为 true，而 NaN === NaN 为 false；Object.is(0, -0) 为 false，而 0 === -0 为 true。其余类型不同、对象身份和 symbol 身份的结果与严格相等一致。",
        "控制台有时把 -0 显示成 0，不能靠打印外观区分正负零。1 / 0 得到 Infinity，1 / -0 得到 -Infinity，可以用这个可观察结果确认符号；相等判断本身仍应调用 Object.is，而不是先做除法再比较。",
      ],
      examples: [{ code: `console.log(Object.is(NaN, NaN)); // true
console.log(NaN === NaN); // false
console.log(Object.is(0, -0)); // false
console.log(0 === -0); // true
console.log(1 / 0 === Infinity); // true
console.log(1 / -0 === -Infinity); // true`, expectedOutput: ["true", "false", "false", "true", "true", "true"], explanation: [
        "NaN 表示一次没有得到可用数字的运算结果，例如 0 / 0。严格相等规定它不等于任何数字，包括它自己，所以用 === 检查“结果是不是 NaN”永远失败，应使用 Number.isNaN 或 Object.is。",
        "正零和负零在 === 下是相等的，在 Object.is 下不是。多数计数和坐标比较希望把它们当成同一个零，这时 === 或后面的集合规则更合适。只有符号本身影响后续计算时，例如作为除数，才需要 Object.is 把它们分开。",
      ] }],
    },
    {
      id: "collections", title: "集合使用另一种规则：NaN 相同，正负零也相同",
      paragraphs: [
        "Map、Set 和 Array.prototype.includes 使用 SameValueZero。它在 SameValue 的基础上把 +0 和 -0 视为相同，同时仍把 NaN 视为相同。因此同一个 Set 里不会同时留下 NaN 和另一个 NaN，也不会同时留下 0 和 -0。",
        "数组的 indexOf 走的是严格相等，不是 SameValueZero。同样一组数据，indexOf 和 includes 对 NaN 的答案不同。选择查找方法之前，先确认它的相等算法，不能看见“找到了”就认为所有查找函数约定一致。",
      ],
      examples: [{ code: `const seen = new Set([NaN, 0]);
console.log(seen.has(NaN)); // true
console.log(seen.has(-0)); // true
console.log(seen.size); // 2
const values = new Map();
values.set(NaN, 'missing');
values.set(-0, 'zero');
console.log(values.get(NaN)); // missing
console.log(values.get(0)); // zero
console.log(values.size); // 2
console.log([NaN].indexOf(NaN)); // -1
console.log([NaN].includes(NaN)); // true
console.log([0].indexOf(-0)); // 0
console.log([0].includes(-0)); // true`, expectedOutput: ["true", "true", "2", "missing", "zero", "2", "-1", "true", "0", "true"], explanation: [
        "Set 初始化时 NaN 和 0 是两个不同的键，size 为 2。has(NaN) 为 true，是因为集合认为 NaN 与 NaN 相同。has(-0) 也为 true，是因为 -0 与已有的 0 在 SameValueZero 下相同，并不是集合里另存了一个负零。",
        "Map 先以 NaN 存入 missing，再以 -0 存入 zero。get(NaN) 仍是 missing，get(0) 是 zero，size 仍是 2。负零没有覆盖 NaN，它覆盖的是与 0 相同的那一格。",
        "indexOf(NaN) 返回 -1，因为严格相等认为 NaN 不等于 NaN。includes(NaN) 返回 true。对正负零，两种查找都认为 [0] 里能找到 -0：indexOf 返回位置 0，includes 返回 true。只有 NaN 这一侧能把两种算法分开。",
      ] }],
    },
    {
      id: "identity", title: "字段相同，不会让两个对象变成同一个键",
      paragraphs: [
        "集合对对象键使用的仍是引用身份。两次写出 { id: 'a' } 会得到两个对象，即使字段一样，后一个也不能取回前一个作为键存进去的值。日期也是对象：两个 new Date(0) 的严格相等为 false，要比较的是 getTime() 得到的数字。",
        "这能解释缓存和去重里的一类失败。用整个请求对象当 Map 键，调用方稍后按同样字段新建一个对象来查，就会漏掉已经存好的结果。键应使用稳定的原始值，例如字符串 id；对象身份只表示“就是这一份实例”。",
      ],
      examples: [{ code: `const key = { id: 'a' };
const records = new Map([[key, 'stored']]);
console.log(records.get(key)); // stored
console.log(records.has({ id: 'a' })); // false
console.log(new Date(0) === new Date(0)); // false
console.log(Object.is(new Date(0).getTime(), new Date(0).getTime())); // true`, expectedOutput: ["stored", "false", "false", "true"], explanation: [
        "records.get(key) 能取回 stored，因为查询使用的是当初放入的那一个对象。新的 { id: 'a' } 字段相同，但是另一个引用，has 为 false，Map 不会按 id 字段帮你查找。",
        "两个日期对象各自创建，=== 为 false。getTime() 都返回数字 0，Object.is 比较这两个数字才为 true。把日期放进业务相等判断时，先决定比较的是对象实例还是时间线上的瞬时。",
      ] }],
    },
    {
      id: "comparison", title: "按字段比较要写明范围，JSON 文本相同不等于值相同",
      paragraphs: [
        "有时业务要问的是“这些字段是否相同”，而不是“是不是同一个对象”。可以写一个只检查指定键的函数：两边是同一引用时直接返回 true；否则要求两边都是非数组对象，再对每个列出的键使用 Object.is。这样 NaN 会按 SameValue 视为相同，0 和 -0 视为不同。",
        "用 JSON.stringify 的文本是否相同来代替这个判断，是错误实现。JSON 会省略值为 undefined 的属性，遇到循环引用则抛出 TypeError，也不能表达函数、symbol 和单独的 undefined。文本碰巧一样，不能证明属性集合一样。",
      ],
      examples: [{ code: `const withNote = { value: undefined, items: [1, 2] };
const withoutNote = { items: [1, 2] };
console.log(JSON.stringify(withNote) === JSON.stringify(withoutNote)); // true
console.log('value' in withNote); // true
console.log('value' in withoutNote); // false
const node = { name: 'root' };
node.self = node;
try {
  JSON.stringify(node);
  console.log('serialized');
} catch (error) {
  console.log(error instanceof TypeError); // true
}`, expectedOutput: ["true", "true", "false", "true"], explanation: [
        "withNote 含有值为 undefined 的 value，withoutNote 没有这个属性。两份 JSON 文本都是 {\"items\":[1,2]}，所以字符串比较为 true。这是错误信号：属性是否存在并不相同，序列化把差异丢掉了。",
        "node.self 指回 node，形成循环。JSON.stringify 无法展开这种结构，抛出 TypeError。比较函数若只包一层 stringify，循环数据会变成异常，而不是一个可处理的 false。异常要单独报告，不能当成“内容不同”。",
      ] }, { code: `function sameRecord(left, right, keys) {
  if (left === right) return true;
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return false;
  if (Array.isArray(left) || Array.isArray(right)) return false;
  return keys.every((key) => Object.is(left[key], right[key]));
}
console.log(sameRecord({ id: 'a', count: NaN }, { id: 'a', count: NaN }, ['id', 'count'])); // true
console.log(sameRecord({ id: 'a', count: 0 }, { id: 'a', count: -0 }, ['id', 'count'])); // false
console.log(sameRecord({ id: 'a' }, { id: 'a', extra: 1 }, ['id'])); // true
console.log(sameRecord({ meta: { version: 1 } }, { meta: { version: 1 } }, ['meta'])); // false`, expectedOutput: ["true", "false", "true", "false"], explanation: [
        "第一组的 count 都是 NaN。Object.is 认为它们相同，所以在列出的键上都通过，结果为 true。第二组 0 与 -0 在 Object.is 下不同，结果为 false。若业务希望正负零相同，这里应改用自己的数字比较，不能继续借用 Object.is。",
        "第三组只检查 id。右边多出的 extra 被忽略，结果仍为 true。这是函数的适用边界，不是通用深比较：调用方必须把需要纳入的键全部列出来。第四组 meta 的值是对象，Object.is 比较引用，两份 { version: 1 } 不是同一个对象，所以为 false。这个函数不向下递归。",
        "数组被明确拒绝。数组也是对象，如果只按键 '0' 比较，会把顺序、长度和嵌套元素都漏掉。日期、Map 和带方法的对象同样不在这个函数的能力内。需要那些类型时，应先取出数字、字符串或纯字段，再比较取出后的值。",
      ] }],
    },
    {
      id: "choices", title: "怎么选：先写清要比较的是身份、数值还是字段",
      paragraphs: [
        "保留基线时，原始值直接赋值即可。对象要按需要复制的层次选择浅拷贝或结构化克隆；克隆失败说明其中有函数或 symbol 等不可克隆的值，应先改数据形状。比较“是不是这份实例”用 ===。检查 NaN 用 Number.isNaN 或 Object.is。只有正负零的符号有意义时才用 Object.is 区分它们。",
        "Map、Set 和 includes 已经固定使用 SameValueZero，不能给单次 has 临时换算法。对象键表示实例身份；字段身份应使用字符串、数字这类原始键。按字段比较时，列出键、选定 NaN 与正负零的规则，并拒绝自己不理解的数组、日期和循环结构。",
        "阅读一段新的比较代码时，至少用四类输入检查它：NaN、一对正负零、两个字段相同但不是同一引用的对象、一个带循环引用或函数的值。哪一类的结果解释不清，就还没有确定它使用的相等规则。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，看赋值复制了什么。右边若是原始值，左边得到当时的值；右边若是对象，左边得到引用。参数传递和返回值使用同一规则。",
        "第二步，看之后的写操作改了哪里。给名字重新赋值只影响这个绑定；给属性赋值会影响所有仍指向该对象的名字。const 只阻止前者。浅拷贝后，再确认嵌套属性是不是仍共享同一个引用。",
        "第三步，确认这次比较的算法。=== 不转换类型，NaN 不等于自身，正负零相等，对象看引用。Object.is 把 NaN 视为相同、正负零视为不同。Map、Set 和 includes 把 NaN 视为相同，也把正负零视为相同。== 会转换类型，不拿来做新的字段校验。",
        "第四步，若比较的是字段而不是引用，写下键的范围和失败行为。JSON 文本相同不能证明 undefined 属性和循环结构相同；一个只检查列出键的函数也不会自动比较嵌套对象。把身份、数值和结构分成三个问题，开头的草稿基线就不会再和原件共用同一份 count。",
      ],
    },
  ],
  sources: [
    { title: "ECMAScript：语言类型", url: "https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types" },
    { title: "ECMAScript：IsStrictlyEqual", url: "https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal" },
    { title: "ECMAScript：IsLooselyEqual", url: "https://tc39.es/ecma262/multipage/abstract-operations.html#sec-islooselyequal" },
    { title: "ECMAScript：SameValue", url: "https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevalue" },
    { title: "ECMAScript：SameValueZero", url: "https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero" },
    { title: "MDN：相等比较与相同性", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness" },
    { title: "HTML：结构化克隆", url: "https://html.spec.whatwg.org/multipage/structured-data.html#structured-cloning" },
  ],
};
