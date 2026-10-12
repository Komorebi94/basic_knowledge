import type { Article } from "../articles";

export const functionVarianceArticle: Article = {
  "id": "K03-05",
  "kind": "knowledge",
  "domainSlug": "typescript",
  "slug": "function-types-variance",
  "title": "函数类型与变型",
  "summary": "从事件回调的参数安全推导函数兼容，解释 strictFunctionTypes、方法例外、可选参数与重载为什么不能随意替换。",
  "aliases": [
    "variance",
    "contravariance",
    "strictFunctionTypes",
    "overloads",
    "callback",
    "函数变型"
  ],
  "tags": [
    "TypeScript",
    "类型建模",
    "函数类型与变型"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "能处理完整订单的回调，为什么不能处理所有事件？",
      "paragraphs": [
        "事件总线承诺给订阅者传入最基础的 {id:string}，有人把一个必须读取 totalCents 的订单处理器注册进去。它处理订单时正常，遇到只有 id 的事件就读到 undefined。回调兼容不是看名字相似，而是看调用者可能传什么、实现至少需要什么。",
        "前置是 K03-03 的泛型约束与 K03-02 的联合。本文编译环境开启 strict，其中包含 strictFunctionTypes；错误片段只做编译检查。函数类型主要描述调用合同，不自动检查所有运行时副作用和 JavaScript 外部调用。"
      ]
    },
    {
      "id": "contravariance",
      "title": "参数从调用者需求出发，返回值从消费方需求出发",
      "paragraphs": [
        "如果某位置可能传任意基础事件，就只能接收能处理全部基础事件的处理器。要求更具体订单的函数不能放在那里；相反，只读取 id 的函数可用于订单位置，因为订单满足基础需求。参数方向与结果方向不同：消费方只要求基础结果时，返回更完整订单通常是安全的。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type BaseEvent = { id: string };\ntype OrderEvent = BaseEvent & { totalCents: number };\nconst baseHandler = (event: BaseEvent): string => event.id;\nconst orderHandler: (event: OrderEvent) => string = baseHandler;\nconsole.log(orderHandler({ id: 'o1', totalCents: 300 }));\nconst createOrder = (): OrderEvent => ({ id: 'o2', totalCents: 500 });\nconst createBase: () => BaseEvent = createOrder;\nconsole.log(createBase().id);",
          "expectedOutput": [
            "o1",
            "o2"
          ],
          "explanation": [
            "orderHandler 的调用方给完整订单，baseHandler 只用 id，不会要求更多字段，因此替换安全。createBase 的消费方只读 id，createOrder 提供了该字段与额外金额，也满足要求。",
            "这些结论基于受检查的结构关系；TypeScript 的可变对象与方法还存在兼容例外。不能由一个例子宣称系统对任何变型都完全健全。"
          ]
        }
      ]
    },
    {
      "id": "negative-parameter",
      "title": "错误实现：把更窄的处理器放进更宽的入口",
      "paragraphs": [
        "allEvents 允许只传 {id}，orderOnly 却必须读取 totalCents，严格函数参数检查拒绝赋值。运行时若绕过检查，toFixed 会在 undefined 上失败。修复是缩小入口为订单事件，或改处理器先验证载荷，再处理确定存在的金额。"
      ],
      "code": "type BaseEvent = { id: string };\ntype OrderEvent = BaseEvent & { totalCents: number };\nconst orderOnly = (event: OrderEvent): string => event.totalCents.toFixed(0);\nconst allEvents: (event: BaseEvent) => string = orderOnly;"
    },
    {
      "id": "methods",
      "title": "方法签名的兼容例外，不是业务安全证明",
      "paragraphs": [
        "strictFunctionTypes 对普通函数参数采用更严格检查，但方法声明保留了双向参数兼容的例外。这是语言为既有生态作出的兼容取舍，不意味着窄参数方法真的能处理宽输入。下面的方法形式能编译；我们只用合法订单调用，刻意不执行只有 id 的错误调用。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type Base = { id: string };\ntype Order = Base & { totalCents: number };\ninterface MethodSink<T> { handle(value: T): string; }\nconst orderSink: MethodSink<Order> = { handle(value) { return value.totalCents.toFixed(0); } };\nconst baseSink: MethodSink<Base> = orderSink;\nconst order = { id: 'o3', totalCents: 700 };\nconsole.log(baseSink.handle(order));\ninterface FunctionSink<T> { handle: (value: T) => string; }\nconst safe: FunctionSink<Base> = { handle: value => value.id };\nconsole.log(safe.handle({ id: 'b1' }));",
          "expectedOutput": [
            "700",
            "b1"
          ],
          "explanation": [
            "方法接口允许这次赋值，但只传 id 将违反真实实现需求。日志 700 来自完整订单，证明示例没有用运行成功替危险输入背书。第二个接口用函数属性，适合需要严格回调合同的边界。",
            "不能靠把函数属性改成方法来消除报错，那只是改变检查规则。公共事件 API 应按实际调用集合设计，再验证负向兼容，而不是利用例外隐藏要求。"
          ]
        }
      ]
    },
    {
      "id": "arity",
      "title": "少用参数和要求参数可选，不是一回事",
      "paragraphs": [
        "数组 map 能提供元素、索引和数组，处理器只使用元素是合法的：额外参数可以被忽略。但 callback(value,index?) 表达调用者有权不传 index；一个必须有 number 索引的函数不能满足它。不要为了容纳只写一个参数的回调，就把所有其他参数标成可选。",
        "错误实现是把库始终提供的 index 声明为可选，导致消费者不得不检查 undefined。正确写成必需参数后，消费者仍可以忽略它。真正可能省略时，则处理器要支持缺席值或在入口提供默认值；rest 参数与元组可描述有限调用形态，不需要无限可选参数。"
      ]
    },
    {
      "id": "negative-optional",
      "title": "错误实现：可省略入口接收了必须有索引的函数",
      "paragraphs": [
        "visit 实际会省略 index，needsIndex 必须读取它，编译器拒绝传入。修复可以让 visit 每次都提供必需 number，或让 needsIndex 在 index 缺席时选择业务允许的默认行为。两种修复改变的合同不同，要先决定真实需求。"
      ],
      "code": "function visit(callback: (value: string, index?: number) => string): string {\n  return callback('draft');\n}\nconst needsIndex = (value: string, index: number): string => value + index.toFixed(0);\nvisit(needsIndex);"
    },
    {
      "id": "overloads",
      "title": "重载声明对外可见，实现签名不能补漏",
      "paragraphs": [
        "重载给不同输入建立不同输出关系，实现签名承担全部分支。调用者匹配公开重载，而不是调用宽的实现签名；只列 string 与 number 两个重载时，string|number 变量未必能直接调用，因为没有一个公开签名接受整个联合。若返回值没有这种分支关系，直接用联合参数会更简单。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "function normalize(value: string): string;\nfunction normalize(value: number): number;\nfunction normalize(value: string | number): string | number {\n  return typeof value === 'string' ? value.trim() : Math.round(value);\n}\nconst title = normalize(' Draft ');\nconst count = normalize(2.6);\nconsole.log(title.toUpperCase(), count.toFixed(0));\nconst mixed: unknown = JSON.parse('\"  Ready  \"');\nif (typeof mixed !== 'string' && typeof mixed !== 'number') throw new TypeError('Invalid input');\nconst output = typeof mixed === 'string' ? normalize(mixed) : normalize(mixed);\nconsole.log(output);",
          "expectedOutput": [
            "DRAFT 3",
            "Ready"
          ],
          "explanation": [
            "字符串重载让 title 仍是 string，数字重载让 count 仍是 number。JSON 先进入 unknown，类型检查排除其他输入，再按 typeof 分支选择对应公开签名，输出 Ready。类型声明没有替代解析与运行时校验。",
            "如果希望直接接收联合，还需提供适当的公开联合签名，或采用一个联合参数函数。不要只扩宽实现签名后就认定消费方已获得该能力。"
          ]
        }
      ]
    },
    {
      "id": "generics",
      "title": "回调中的泛型应该由谁选择",
      "paragraphs": [
        "一个属性类型为 <T>(value:T)=>T 的函数，承诺对每次调用的任意 T 都保留结果类型；只会处理 string 的函数不满足它。相反，容器 interface Store<T> 将 T 固定在容器实例层，每个方法共享这次选定的类型。把类型参数放在哪一层，决定谁有权选择它。",
        "事件名和载荷也应保持同一次调用的关联。若写成 name:keyof Events 与 payload:Events[keyof Events] 两个不相关的联合，会允许正确事件名配错误载荷。可以使用泛型 K 与 Events[K]，或更明确的判别联合，但联合变量和推断路径仍需实际编译测试，不能只凭工具类型名字判断。"
      ]
    },
    {
      "id": "boundaries",
      "title": "用最小危险调用检查替换是否成立",
      "paragraphs": [
        "第一条边界是方法双向兼容，编译通过可能放宽了真实要求。第二条边界是重载和实现差异，调用方只看到导出的签名。还要注意 void 回调允许返回一个被忽略的值，不代表这个返回值可被调用方使用；异步函数传入 void 回调时，拒绝也未必由调用者处理。",
        "评估回调先列出调用者所有合法参数，再看被替换函数能否逐一处理。用最小输入和错误签名检验，而不是只传一份完整订单。E34 类型安全事件映射仍待制作；可以先把负向参数例子改成函数属性接口，复现编译器如何暴露危险方向。"
      ]
    }
  ],
  "sources": [
    {
      "title": "TypeScript：类型兼容与函数参数",
      "url": "https://www.typescriptlang.org/docs/handbook/type-compatibility.html"
    },
    {
      "title": "TypeScript：函数签名与重载",
      "url": "https://www.typescriptlang.org/docs/handbook/2/functions.html"
    }
  ]
};
