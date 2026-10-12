import type { Article } from "../articles";

export const utilityDomainArticle: Article = {
  "id": "K03-06",
  "kind": "knowledge",
  "domainSlug": "typescript",
  "slug": "utility-and-domain-types",
  "title": "工具类型与领域类型",
  "summary": "从公开 DTO 和更新命令出发，解释 Pick、Omit、Partial、Readonly 的静态作用，避免共享模型泄漏及无效补丁。",
  "aliases": [
    "utility types",
    "Pick",
    "Omit",
    "Partial",
    "Readonly",
    "DTO",
    "领域类型"
  ],
  "tags": [
    "TypeScript",
    "类型建模",
    "工具类型与领域类型"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "Omit 掉内部字段，为什么响应里仍有它？",
      "paragraphs": [
        "后台保存文章时需要作者内部备注，公开接口却不应返回它。开发者将返回类型写成 Omit<ArticleRecord,\"internalMemo\">，然后直接返回原对象，结果 JSON 仍含内部备注。问题不在 Omit 失效，而在把静态投影误当成运行时字段删除。",
        "前置是 K03-01 的结构校验与 K03-04 的映射。本文只使用虚构文章和普通备注，无真实私人数据。正向示例在 strict、noUncheckedIndexedAccess 下编译运行；可选属性区别另用 exactOptionalPropertyTypes 的编译检查证明。"
      ]
    },
    {
      "id": "projection",
      "title": "类型只约束视图，真正投影必须构造对象",
      "paragraphs": [
        "结构类型允许含更多字段的变量用于较少字段的接口。对象字面量额外属性检查能发现部分拼写错误，却不是所有传值都适用的字段白名单。下面错误投影仍能编译，日志展示真实键未被删除；修复函数明确创建仅包含公开字段的新对象。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type RecordRow = { id: string; title: string; internalMemo: string };\ntype PublicRow = Omit<RecordRow, 'internalMemo'>;\nconst row: RecordRow = { id: 'a1', title: 'Draft', internalMemo: 'fixture note' };\nfunction wrongProjection(value: RecordRow): PublicRow { return value; }\nfunction toPublic(value: RecordRow): PublicRow {\n  return { id: value.id, title: value.title };\n}\nconsole.log(Object.keys(wrongProjection(row)).join(','));\nconsole.log(Object.keys(toPublic(row)).join(','));\nconsole.log(toPublic(row) === row);",
          "expectedOutput": [
            "id,title,internalMemo",
            "id,title",
            "false"
          ],
          "explanation": [
            "Omit 让 TypeScript 使用者不能直接按 PublicRow 读取 internalMemo，但返回的原对象实际仍有该字段，枚举和序列化不会删它。toPublic 构造新对象，键只剩 id/title，引用也不同。",
            "公开字段以后增加或变化时，应审核 DTO 的语义，不只自动跟随数据库。显式领域类型允许公开合同和内部存储独立演进，投影代码负责兑现这个边界。"
          ]
        }
      ]
    },
    {
      "id": "commands",
      "title": "Partial 数据表不是可靠的业务更新命令",
      "paragraphs": [
        "Partial 把顶层字段设为可选，适合独立可选的配置片段；它不表达字段必须一同变化、状态迁移或权限。把订单整行 Partial 当更新接口，还可能允许改 id、所有者或已结算金额。更新命令应只暴露允许操作，并让互相关联的字段一起出现。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type Price = { amountCents: number; currency: 'CNY' | 'USD' };\ntype Product = { id: string; title: string; price: Price };\ntype Command = { kind: 'rename'; title: string } | { kind: 'reprice'; price: Price };\nfunction apply(product: Product, command: Command): Product {\n  if (command.kind === 'rename') return { ...product, title: command.title };\n  if (!Number.isSafeInteger(command.price.amountCents) || command.price.amountCents < 0) {\n    throw new RangeError('Invalid amount');\n  }\n  return { ...product, price: { ...command.price } };\n}\nconst initial: Product = { id: 'p1', title: 'Old', price: { amountCents: 300, currency: 'CNY' } };\nconst changed = apply(initial, { kind: 'reprice', price: { amountCents: 500, currency: 'USD' } });\nconsole.log(changed.id, changed.price.amountCents, changed.price.currency);\nconsole.log(initial.price.currency);\ntry { apply(initial, { kind: 'reprice', price: { amountCents: -1, currency: 'CNY' } }); }\ncatch (error) { console.log(error instanceof RangeError); }",
          "expectedOutput": [
            "p1 500 USD",
            "CNY",
            "true"
          ],
          "explanation": [
            "命令不暴露 id，reprice 必须提供完整金额与币种，且运行时检查整数非负。新对象为 USD，原商品仍是 CNY；负数虽是 number，也违反业务合同，因此显式失败。",
            "联合保证受检查代码的字段关联，不能授权请求者修改商品。外部命令还需结构验证、鉴权、业务状态检查和持久化并发控制，类型不能承担这些责任。"
          ]
        }
      ]
    },
    {
      "id": "readonly",
      "title": "Readonly 是访问限制，不是深冻结",
      "paragraphs": [
        "Readonly<T> 限制通过该类型重赋顶层属性。若属性值本来是可变数组，仍可调用 push；其他可变别名也能修改同一对象。下面只演示浅层限制和别名影响，不能据此推断对象在所有访问路径都不可变。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type Draft = { title: string; tags: string[] };\nconst mutable: Draft = { title: 'Draft', tags: ['ts'] };\nconst view: Readonly<Draft> = mutable;\nview.tags.push('types');\nmutable.title = 'Changed';\nconsole.log(view.tags.join(','), view.title);\nconst snapshot = { title: mutable.title, tags: [...mutable.tags] };\nmutable.tags.push('later');\nconsole.log(snapshot.tags.join(','));",
          "expectedOutput": [
            "ts,types Changed",
            "ts,types"
          ],
          "explanation": [
            "tags 数组的引用属性只读，但数组对象仍可 push；mutable 别名改 title 后，view 看到相同对象的新值。snapshot 复制了数组，后续 later 不会进入它。",
            "若数组内是对象，浅数组复制仍共享元素。根据真实更新路径使用只读数组、结构共享或受限深冻结，必须解释支持的数据域，而不是把 Readonly 命名成全局不可变保证。"
          ]
        }
      ]
    },
    {
      "id": "negative-optional",
      "title": "错误实现：字段缺席与显式 undefined 混为一谈",
      "paragraphs": [
        "此片段在额外开启 exactOptionalPropertyTypes 时应编译失败。title? 表示字段可以缺席，出现时必须是 string；若业务允许显式 undefined，应写入字段值类型。strict 本身不会替你启用这个选项。",
        "更新语义通常需要区别未提供（保持）、null（清空）与 string（替换）。使用明确联合或专用命令表达，再在边界解析；JSON 还会丢弃对象中 undefined 值，不能把 JavaScript 内存补丁直接当可靠的传输格式。"
      ],
      "code": "type Patch = { title?: string };\nconst patch: Patch = { title: undefined };"
    },
    {
      "id": "reuse",
      "title": "Pick/Omit 适合内部关系，领域合同需要独立所有权",
      "paragraphs": [
        "当两个类型确实共享同一模型的字段语义，Pick 可以减少重复，例如内部日志只记录稳定 ID 与修订号。但公开请求或响应直接 Omit 大型数据库类型，会让新增字段默认流向公开合同，增加隐私和兼容风险。独立声明 DTO 并写投影，即使多写几行，也能让变化由拥有者明确决定。",
        "工具组合还可能丢掉判别联合关联，或让嵌套字段保留旧的可变属性。不要只看类型名字像“安全”。每次复用都列出允许哪些字段、缺席意味着什么、谁负责默认值和转换、哪些不变量仍需运行时检查。"
      ]
    },
    {
      "id": "satisfies",
      "title": "校验对象形状时，不必牺牲局部推断",
      "paragraphs": [
        "satisfies 可以检查表达式满足某个目标类型，同时不把结果完全改写成目标类型。它适合配置对象的约束与局部信息保留，但并不冻结、删除字段或验证动态 JSON；目标类型的结构规则仍然存在。as const 则主要保留字面量和只读静态信息，二者目的不同。",
        "若使用类型断言把对象转成目标类型，只是要求编译器信任你，难以发现实际缺失。优先让初始化或返回表达式接受检查；外部输入走 unknown 验证；通过后再映射成独立领域对象。这三个步骤分别建立数据事实、领域含义和消费合同。"
      ]
    },
    {
      "id": "boundaries",
      "title": "先定义更新语义，再选择工具",
      "paragraphs": [
        "第一条边界是序列化：Omit、Pick 和 Readonly 都没有对应的自动运行时代码。第二条边界是共享模型演进：内部新增字段不能未经审阅改变公开接口。再加上可选值和联合关联，工具类型的便利不能成为省掉合同讨论的理由。",
        "自行给 PublicRow 添加公开摘要，确认投影必须实际提供该字段；给 Command 增加一种“下架”动作，检查每个处理分支是否完整。本单元暂无已发布的独立题目，可以用这些变更和编译诊断建立行为证据。"
      ]
    }
  ],
  "sources": [
    {
      "title": "TypeScript：工具类型",
      "url": "https://www.typescriptlang.org/docs/handbook/utility-types.html"
    },
    {
      "title": "TypeScript：结构类型兼容",
      "url": "https://www.typescriptlang.org/docs/handbook/type-compatibility.html"
    },
    {
      "title": "TypeScript：exactOptionalPropertyTypes",
      "url": "https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html"
    }
  ]
};
