import type { Article } from "../articles";

export const conditionalMappedArticle: Article = {
  "id": "K03-04",
  "kind": "knowledge",
  "domainSlug": "typescript",
  "slug": "conditional-and-mapped-types",
  "title": "条件类型与映射类型",
  "summary": "通过结果提取与可编辑字段推导分布式条件类型、infer、never 和映射修饰符，区分编译期变换与运行时对象转换。",
  "aliases": [
    "conditional types",
    "mapped types",
    "infer",
    "distributive",
    "never",
    "条件类型"
  ],
  "tags": [
    "TypeScript",
    "类型建模",
    "条件类型与映射类型"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "给联合套上工具类型，为什么结果拆成了多个成员？",
      "paragraphs": [
        "服务返回成功或失败两种结果，页面希望提取成功载荷。后来为了生成表单字段，又想对所有字段加只读或移除可选。有人把类型工具复制进来，却发现 A|B 被分别处理，never 的结果又和普通类型不同。要理解这些现象，先明确变换处理的是整个联合，还是联合的每个成员。",
        "前置是 K03-02 的联合模型与 K03-03 的泛型关系。下面 TypeScript 正向代码在 strict、noUncheckedIndexedAccess 下编译并运行；静态关系通过 Assert 类型参数约束检查，日志只证明代码真正运行，不把运行输出当作类型系统全部证据。"
      ]
    },
    {
      "id": "distribution",
      "title": "裸类型参数让联合成员分别进入条件",
      "paragraphs": [
        "type F<T>=T extends U ? X : Y 中，检查侧直接是类型参数 T 时，联合通常分布到各成员，再把结果合并。将检查侧包成 [T]，比较的是整个候选联合。下面字符串或数字被第一种工具分别处理为 string[]|number[]，第二种则整体得不到“全是字符串”的结论。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type Each<T> = T extends string ? T[] : number[];\ntype Whole<T> = [T] extends [string] ? T[] : number[];\ntype Assert<T extends true> = T;\ntype Distributed = Assert<Each<string | number> extends string[] | number[] ? true : false>;\ntype NotAllStrings = Assert<Whole<string | number> extends number[] ? true : false>;\nconst a: Each<string | number> = ['draft'];\nconst b: Whole<string | number> = [3];\nconsole.log(a.join(','), b.join(','));",
          "expectedOutput": [
            "draft 3"
          ],
          "explanation": [
            "Each<string|number> 分别计算字符串与数字分支，允许 a 为字符串数组；Whole 整体判断 string|number 不都属于 string，选 number[]，b 合法。Assert 将推导写成编译时约束。",
            "分布并非条件类型永远发生的行为，关键在检查侧是否是裸类型参数。把具体联合直接写在条件左侧，或换成包装形式，都需要重新推导。"
          ]
        }
      ]
    },
    {
      "id": "infer",
      "title": "infer 提取已经匹配的结构，不制造运行结果",
      "paragraphs": [
        "infer 在条件匹配中为结构的一部分命名。Result 的成功成员能匹配 {ok:true,value:...}，于是提取 value；失败成员不满足匹配，得到 never。联合分布后，never 没有值成员，不会继续保留为“undefined 分支”。下面同时演示 never 在裸参数分布和整体检查中的差别。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type Result<T> = { ok: true; value: T } | { ok: false; message: string };\ntype Payload<T> = T extends { ok: true; value: infer Value } ? Value : never;\ntype IsString<T> = T extends string ? true : false;\ntype IsNever<T> = [T] extends [never] ? true : false;\ntype Assert<T extends true> = T;\ntype PayloadIsNumber = Assert<Payload<Result<number>> extends number ? true : false>;\ntype DistributedNever = Assert<IsNever<IsString<never>>>;\nconst value: Payload<Result<number>> = 42;\nconst empty: IsNever<never> = true;\nconsole.log(value, empty);",
          "expectedOutput": [
            "42 true"
          ],
          "explanation": [
            "成功成员提取 number，失败成员得到 never，两者合并为 number。IsString<never> 在没有成员的联合上分布，结果仍是 never；IsNever 用元组整体比较才能得到 true。",
            "infer 并不执行 Promise，也不会读取 JSON。它只根据静态结构提取关系；涉及函数重载时，提取工具可能取到最后的宽签名，不能反推出某次调用的精确运行结果。"
          ]
        }
      ]
    },
    {
      "id": "mapping",
      "title": "映射沿键变换，并明确保留或移除修饰符",
      "paragraphs": [
        "映射类型在 keyof T 的键集合上建立新属性，典型写法以 T[K] 保留各键的值类型。-readonly 移除只读，-? 移除可选，+ 或省略符号添加对应修饰。不要把移除可选当成填充缺省值；得到的新类型要求调用方提供这些值。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type Editable<T> = { -readonly [K in keyof T]-?: T[K] };\ntype Source = { readonly id: string; title?: string };\nconst form: Editable<Source> = { id: 'a1', title: 'Draft' };\nform.title = 'Published';\ntype PublicNames<T> = { [K in keyof T as K extends string ? `public_${K}` : never]: T[K] };\nconst renamed: PublicNames<{ count: number }> = { public_count: 2 };\nconsole.log(form.title, renamed.public_count);",
          "expectedOutput": [
            "Published 2"
          ],
          "explanation": [
            "Source 的 id 只读和 title 可选被移除，form 必须提供二者且允许后续修改。键重映射把 count 变成 public_count，值仍为 number。",
            "编译器没有把现有对象的 count 自动改名；renamed 是代码实际创建的新对象。键若含 Symbol 或 number，示例过滤掉非 string，这是刻意受限的模型，不是通用序列化器。"
          ]
        }
      ]
    },
    {
      "id": "negative-required",
      "title": "错误实现：类型要求字段，不会替你补字段",
      "paragraphs": [
        "Complete<Draft> 要求 title 存在，初始化却没有提供，因此编译失败。把 draft 断言成 Complete<Draft> 会让使用者相信 title 是字符串，却可能在运行时读到 undefined。",
        "修复是在运行时构造新对象，例如把可选标题归一成明确默认值，再让返回对象接受 Complete 检查。若默认空标题不是业务允许的值，应保留缺失状态并阻止发布，而不是仅为通过编译填字符串。"
      ],
      "code": "type Complete<T> = { [K in keyof T]-?: T[K] };\ntype Draft = { id: string; title?: string };\nconst ready: Complete<Draft> = { id: 'a1' };"
    },
    {
      "id": "union",
      "title": "keyof 联合和分别映射联合，回答不同问题",
      "paragraphs": [
        "对 {a:...}|{b:...} 来说，未收窄值没有共同的可访问键，直接 keyof 反映共同可安全使用的键集合。想保留各成员字段，需要在分布式条件里分别处理成员。内置 Pick/Omit 等工具也不应被想当然地视为“按每个联合成员完整投影”，应检查具体定义与业务预期。",
        "例如消息联合用 kind 关联不同载荷，先挑出共同属性再丢掉成员关系，会让消费方无法依据 kind 读取对应字段。修复可以保留原联合，或明确写按成员分布的投影；新增一个成员后做正负向检查，确认工具没有重新允许无效组合。"
      ]
    },
    {
      "id": "depth",
      "title": "递归变换之前，先冻结支持的数据域",
      "paragraphs": [
        "DeepReadonly 等工具容易让人以为函数、Date、Map、数组与任意对象都能一致递归。实际上这些值的可调用行为、索引与方法并不相同；把所有键递归一遍不等于集合不能修改。先说明支持 JSON 风格记录还是更丰富结构，再为特殊分支和递归终止设定规则。",
        "组合多个分布式变换还可能扩大候选集合，造成难读错误和更高检查成本。先命名中间概念并写几个具体推导，对有限字段采用显式领域类型；只有反复出现同一种关系才抽取通用工具。类型层面的深递归不会消耗运行时栈，但会消耗编译器工作量。"
      ]
    },
    {
      "id": "boundaries",
      "title": "类型计算要用编译证据验证",
      "paragraphs": [
        "第一条边界是可选语义：exactOptionalPropertyTypes 是独立配置，影响“属性缺席”与“显式 undefined”的区别；不能只说开了 strict 就启用它。第二条边界是运行时转换：映射类型不删除字段、不冻结对象、不改名，也不校验来自 JavaScript 的输入。",
        "自己把 Payload 的检查侧包成元组，预测 Result<number> 是否整体满足成功成员，再编译确认。E33 的工具类型练习仍待制作；先用本文完整例子和静态约束验证推导，不只观察日志。"
      ]
    }
  ],
  "sources": [
    {
      "title": "TypeScript Handbook：条件类型",
      "url": "https://www.typescriptlang.org/docs/handbook/2/conditional-types.html"
    },
    {
      "title": "TypeScript Handbook：映射与修饰符",
      "url": "https://www.typescriptlang.org/docs/handbook/2/mapped-types.html"
    }
  ]
};
