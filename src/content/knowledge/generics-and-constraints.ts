import type { Article } from "../articles";

export const genericsConstraintsArticle: Article = {
  "id": "K03-03",
  "kind": "knowledge",
  "domainSlug": "typescript",
  "slug": "generics-and-constraints",
  "title": "泛型与约束",
  "summary": "从列表查找和字段读取推导类型参数如何保留输入输出关系，解释约束、推断和泛型实现为何不能凭空制造调用方的具体类型。",
  "aliases": [
    "generics",
    "generic constraints",
    "keyof",
    "indexed access",
    "泛型约束"
  ],
  "tags": [
    "TypeScript",
    "类型建模",
    "泛型与约束"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "查找函数返回的对象，为什么还要重新判断字段？",
      "paragraphs": [
        "订单和文章都按 id 查找。若函数把参数和返回值都写成一个只含 id 的基础接口，调用后虽然拿到同一个对象，类型却只剩 id，调用方读不到订单金额。若把返回值改成 unknown，则又需要重复验证。泛型应解决的是输入对象与输出对象之间的关系，而不是给每个函数加一个字母 T。",
        "前置是 K03-01 的 unknown 与边界校验、K03-02 的联合状态。本文正向示例使用仓库 TypeScript 6.0.3，以 strict 和 noUncheckedIndexedAccess 编译后在独立浏览器执行；标为错误实现的代码只做编译诊断，不执行。类型参数在编译后消失，不会自动检查服务端返回。"
      ]
    },
    {
      "id": "relationship",
      "title": "保留元素类型，也保留找不到的可能",
      "paragraphs": [
        "函数接收 readonly T[] 并返回 T | undefined，表达“找到的是输入集合的某个元素，未找到则没有结果”。T 在调用中根据数组元素推断；约束 {id:string} 只赋予实现读取 id 的能力，并不把所有元素缩成这个基础类型。readonly 参数承诺本函数不改数组，仍不冻结元素对象。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "function findById<T extends { id: string }>(items: readonly T[], id: string): T | undefined {\n  return items.find(item => item.id === id);\n}\nconst orders = [{ id: 'o1', totalCents: 2500 }];\nconst found = findById(orders, 'o1');\nconsole.log(found?.totalCents);\nconsole.log(findById(orders, 'missing') === undefined);\nconsole.log(found === orders[0]);",
          "expectedOutput": [
            "2500",
            "true",
            "true"
          ],
          "explanation": [
            "第一次调用的 T 包含 id 与 totalCents，输出不必再断言为订单。查找 o1 返回原数组中的对象，金额为 2500，引用相等为 true；missing 返回 undefined，调用者必须处理。",
            "如果数组来自外部 JSON，必须先按订单合同验证。T 只来自已经受检查的输入声明；重复 id 的选择规则也属于运行时合同，本例 find 保留首次命中。"
          ]
        }
      ]
    },
    {
      "id": "keys",
      "title": "keyof 与索引访问把字段名和结果类型连起来",
      "paragraphs": [
        "读取字段时有两种关系：对象类型决定合法键 K，键 K 决定值类型 T[K]。若键仅是 string，编译器不能承诺任意字符串都存在；若结果写成 string | number，又丢失这次具体键的结果。下面 getField 的两层类型参数在同一次调用里保留这种对应。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "function getField<T, K extends keyof T>(value: T, key: K): T[K] {\n  return value[key];\n}\nconst task = { id: 't1', attempts: 3, enabled: true };\nconst attempts = getField(task, 'attempts');\nconst enabled = getField(task, 'enabled');\nconsole.log(attempts + 1);\nconsole.log(enabled ? 'on' : 'off');",
          "expectedOutput": [
            "4",
            "on"
          ],
          "explanation": [
            "键 attempts 让结果是 number，能够做加法；键 enabled 让结果是 boolean，分支为 on。返回的仍是运行时属性值，编译器没有创建一份额外对象。",
            "可选属性的 T[K] 仍可能包含 undefined；索引签名等宽泛模型也会扩大合法键集合。泛型不会把一个不精确的输入模型自动变得精确。"
          ]
        }
      ]
    },
    {
      "id": "negative-factory",
      "title": "错误实现：满足约束不等于构造出了 T",
      "paragraphs": [
        "这个函数承诺返回完整 T，却只复制 name。调用方的 T 可能还要求 id 或特殊字面量，返回对象没有这些字段，所以严格编译拒绝它。把返回值强制断言成 T 只会隐藏缺失，不能兑现承诺。",
        "修复按真实合同选择：若只要基础摘要，返回 {name:string}；若要完整输入，就返回原对象或保留全部字段；若要制造新的 T，要求调用方提供能构造 T 的工厂。约束给实现的是最低可用能力，不是制造任意子类型的权利。"
      ],
      "code": "function resetNamed<T extends { name: string }>(value: T): T {\n  return { name: value.name };\n}"
    },
    {
      "id": "factory",
      "title": "让调用方提供构造能力，比断言更诚实",
      "paragraphs": [
        "下面的转换仅负责计算展示文字，调用方负责构造自己的结果类型。它同时保留输入类型 Input 和输出类型 Output 的关系，返回值的类型来自 build。若业务一直只有一个固定摘要，直接写具体返回接口更简单，不必提前泛化。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "function summarize<Input, Output>(value: Input, label: (value: Input) => string,\n  build: (text: string) => Output): Output {\n  return build(label(value));\n}\nconst summary = summarize({ name: 'Draft', revision: 2 },\n  item => item.name + '@' + item.revision,\n  text => ({ text, kind: 'summary' as const }));\nconsole.log(summary.text, summary.kind);",
          "expectedOutput": [
            "Draft@2 summary"
          ],
          "explanation": [
            "Input 从对象得到，label 能读取 name/revision；build 返回含 text 和 kind 的对象，所以 Output 保留它们。运行时先计算 Draft@2，再构造对象并打印。",
            "as const 只保留这里写出的 summary 字面量，不声称未知对象满足某个类型。若 build 可能失败，应在返回合同中表达异常或 Result，而不是把泛型当成功保证。"
          ]
        }
      ]
    },
    {
      "id": "inference",
      "title": "推断来自候选关系，宽类型会丢掉精确信息",
      "paragraphs": [
        "类型参数可能从多个参数、回调和上下文共同推断。调用方提前把字面量赋给宽类型变量，某些精确信息已经消失，函数无法恢复。遇到报错先检查哪个位置提供了候选类型；必要时明确公共边界或指定类型参数，而不是把实现改成任意返回。",
        "当一个类型参数只出现在返回值，调用方可以指定任意类型，实现却没有来源证明它正确。例如 parseJson<T>(text):T 若内部仅 JSON.parse 加断言，就把编译器变成了信任调用者。更可靠的是接受 (value:unknown)=>T 验证器，解析之后通过验证器建立证据；若解析失败或缺字段，应显式失败。"
      ]
    },
    {
      "id": "constraints",
      "title": "约束只写需要的能力，默认参数只影响类型选择",
      "paragraphs": [
        "为了读取 length，约束可以是 {length:number}，不必限定成某个具体数组类。约束太宽会让实现可调用的操作不足，太窄则拒绝本来符合需求的字符串或只读集合。选择取决于函数真正使用哪些行为，不能为了好看复制一个庞大领域接口。",
        "泛型默认参数用于未显式选择类型时的默认建模，不会在运行时补默认对象。extends 在泛型声明中是约束，在条件类型中又参与类型判定；同一个词不代表对象真的继承某个类。公共接口还要注意可变集合写入和回调变型，详见 K03-05。"
      ]
    },
    {
      "id": "boundaries",
      "title": "什么时候泛型值得保留",
      "paragraphs": [
        "第一条边界是运行时数据：接口和泛型都不能证明网络输入。第二条边界是空集合与缺失结果：泛型保留元素关系，但 noUncheckedIndexedAccess 下普通下标仍可能为 undefined，不能用非空断言抹去业务缺失。",
        "取舍方法是画出类型关系：哪个输入决定哪个输出，哪些参数需要保持一致，哪些能力由调用方提供。若 T 没有建立这些关系，具体类型往往更可读；若多个使用者真的需要复用关系，再提取泛型。把 getField 的键改成未知字符串，解释编译器为什么不能确定结果。E33 类型练习仍待制作，本文示例可先独立复现。"
      ]
    }
  ],
  "sources": [
    {
      "title": "TypeScript Handbook：泛型关系与约束",
      "url": "https://www.typescriptlang.org/docs/handbook/2/generics.html"
    },
    {
      "title": "TypeScript Handbook：函数中的类型参数",
      "url": "https://www.typescriptlang.org/docs/handbook/2/functions.html"
    }
  ]
};
