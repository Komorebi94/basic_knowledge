import type { Article } from "../articles";

export const maintainableTypesArticle: Article = {
  "id": "K03-08",
  "kind": "knowledge",
  "domainSlug": "typescript",
  "slug": "maintainable-complex-types",
  "title": "复杂类型的可维护性",
  "summary": "从过度抽象的表单配置出发，用有限关联、命名边界与可复现编译检查控制类型复杂度，避免把领域合同藏进递归谜题。",
  "aliases": [
    "type performance",
    "type instantiation",
    "satisfies",
    "type maintainability",
    "复杂类型"
  ],
  "tags": [
    "TypeScript",
    "类型建模",
    "复杂类型的可维护性"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "类型更聪明了，为什么修改一个字段更困难？",
      "paragraphs": [
        "表单库用递归条件类型推导所有路径、读取字段并关联组件。新增一个联合成员后，错误却显示数十层条件分支，团队只能靠断言让编译通过。复杂类型的价值应是让合法用法易写、非法用法易定位，而不是让读者证明作者擅长类型体操。",
        "前置是 K03-04 的类型变换与 K03-06 的领域边界。本文示例在 TypeScript 6.0.3 的 strict、noUncheckedIndexedAccess 下验证；编译性能只说明测量方法，不编造大型仓库耗时。类型性能与运行时性能分别衡量，减少类型分支不代表浏览器帧率提高。"
      ]
    },
    {
      "id": "finite",
      "title": "有限业务关系，优先写成能看懂的有限模型",
      "paragraphs": [
        "两种编辑字段的值类型不同，判别联合可以直接关联 kind 与 value。以下配置只有两种业务能力，不必先递归提取任意对象路径。阅读者从一个 switch 就能知道处理哪些情况；增加第三种时，穷尽检查会提示需要补逻辑。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type Field = { kind: 'text'; value: string } | { kind: 'count'; value: number };\nfunction preview(field: Field): string {\n  switch (field.kind) {\n    case 'text': return field.value.trim();\n    case 'count': return String(Math.max(0, Math.round(field.value)));\n    default: { const unreachable: never = field; return unreachable; }\n  }\n}\nconsole.log(preview({ kind: 'text', value: ' Draft ' }));\nconsole.log(preview({ kind: 'count', value: 2.7 }));",
          "expectedOutput": [
            "Draft",
            "3"
          ],
          "explanation": [
            "判别字段让 text 分支能调用 trim，让 count 分支做数值归一。default 的 never 在当前联合穷尽时成立，新增成员却不补 case 会在编译时暴露。",
            "这个模型只覆盖两种允许字段，不能假装适用于所有表单。真正需要扩展时先新增明确成员，再判断是否出现值得提取的重复关系。"
          ]
        }
      ]
    },
    {
      "id": "named",
      "title": "给语义命名，而不只是给长表达式换名字",
      "paragraphs": [
        "类型别名有助于错误定位和重复使用，但命名应对应领域概念，例如 EditableField、PublishedSummary。把一个巨大条件表达式命名成 Magic<T> 并没有让边界更清楚。公共签名可用稳定、可检查的领域类型截住内部推断，不向所有消费者暴露实现的每个联合。",
        "输出签名显式化也能防止实现小改动意外扩大公共类型。若返回值推断成大量分支对象，消费方错误会追入内部细节；声明明确 Result 后，作者在边界发现不符合合同的表达式。这样减少认知扩散，不要求每个简单局部变量都重复注解。"
      ]
    },
    {
      "id": "configuration",
      "title": "用 satisfies 检查配置，同时保留有用信息",
      "paragraphs": [
        "下面配置检查要求两种 renderer 都存在，但局部函数的参数推断仍由上下文得到。satisfies 不把配置转成只有 string 索引的宽对象，也不生成额外运行代码。它适合约束有限配置的完整性；输入如果来自 JSON，仍需要边界验证。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type Renderers = { text: (value: string) => string; count: (value: number) => string };\nconst renderers = {\n  text: value => value.trim(),\n  count: value => String(Math.round(value)),\n} satisfies Renderers;\nconsole.log(renderers.text(' Ready '));\nconsole.log(renderers.count(4.6));\nconst names = ['text', 'count'] as const;\nconsole.log(names.join(','));",
          "expectedOutput": [
            "Ready",
            "5",
            "text,count"
          ],
          "explanation": [
            "两种函数分别收到 string 与 number 的上下文类型，调用 trim/round 都有依据。names 的 as const 保留有限字面量元组，不伪装动态数据可信。",
            "删除 count 会在满足目标合同的检查处报错；把 text 参数扩为 unknown 后若要 trim，就必须先收窄。校验位置离配置更近，比让使用者在远处遭遇难读错误更易维护。"
          ]
        }
      ]
    },
    {
      "id": "negative-config",
      "title": "错误实现：配置缺了一种必需能力",
      "paragraphs": [
        "satisfies 检查发现缺少 count，诊断位于配置创建点。修复是提供该能力；若产品确实允许缺失，就改变合同并在消费方处理缺失，而不是用断言掩盖。负向例子只编译、不执行。"
      ],
      "code": "type Renderers = { text: (value: string) => string; count: (value: number) => string };\nconst renderers = { text: (value: string) => value.trim() } satisfies Renderers;"
    },
    {
      "id": "bounded",
      "title": "递归需要终点，字符串路径需要清楚的数据域",
      "paragraphs": [
        "自动推导所有深路径时，要决定是否包含数组、可选对象、循环结构、索引签名和联合成员。无界递归无法保证在有限检查成本内展开任意结构；限制深度时，还需定义到达上限返回什么。若返回宽 string，调用者可能失去全部路径保护；若返回 never，深层访问则被明确拒绝。",
        "模板字符串交叉组合多个联合会扩大候选集合。业务只允许 title 和 retryLimit 时，直接列出两个路径可能比通用深路径工具更准确。下面访问模型把合法键与返回值类型联系起来，并在读取时处理可选值；不支持嵌套任意路径，是刻意的产品边界。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type Settings = { title: string; retryLimit?: number };\nfunction getSetting<Key extends keyof Settings>(settings: Settings, key: Key): Settings[Key] {\n  return settings[key];\n}\nconst settings: Settings = { title: 'Draft' };\nconsole.log(getSetting(settings, 'title'));\nconsole.log(getSetting(settings, 'retryLimit') ?? 3);\nconst changed: Settings = { ...settings, retryLimit: 1 };\nconsole.log(getSetting(changed, 'retryLimit'));",
          "expectedOutput": [
            "Draft",
            "3",
            "1"
          ],
          "explanation": [
            "title 返回 string；retryLimit 因字段可选仍包含 undefined，读取默认值时才采用 3。新对象提供 1 后输出 1，类型工具没有自动替缺失字段填值。",
            "只用一个 keyof 关系表达有限需求，避免把整棵嵌套对象递归展开。若后来真的需要深路径，再用具体失败样本冻结语义，不先建没有消费者的通用框架。"
          ]
        }
      ]
    },
    {
      "id": "performance",
      "title": "先固定测量条件，再寻找昂贵关系",
      "paragraphs": [
        "类型复杂度影响编译与编辑器反馈。可以对目标项目执行存在且合适的 tsc 命令，启用 extendedDiagnostics 记录 Types、Instantiations、内存与检查时间；必要时生成 trace 定位复杂关系。比较时固定编译器、配置、文件集合、冷暖状态与机器，不能只拿一次耗时作结论。",
        "定位后优先减少重复展开、命名中间结果、限制联合规模和显式公共边界。某些场景使用 interface 表达对象关系能改善可读性与关系缓存，但不能把“interface 永远更快”当规则。性能改写要保持正向用法、负向拒绝和声明结果，不能靠关闭检查或放宽类型制造速度收益。",
        "本文没有大型类型压力基准，因此不给改写前后数字。仓库实际示例编译的证据用于验证语义；若未来编辑器变慢，另建立可复现项目和 trace，再按证据优化。"
      ]
    },
    {
      "id": "review",
      "title": "评审复杂工具时，需要能独立解释的新例子",
      "paragraphs": [
        "给每个公共类型至少列合法、非法、空或 never、联合、可选与递归边界。正向例子检查值的关系，负向例子明确期待哪类错误；否则“某处编译失败”可能只是依赖配置坏了。写出每一步推导，解释新增成员会在哪个位置被发现。",
        "如果一个类型工具只有作者能维护，多个调用处都需要断言，或诊断离真实错误很远，应考虑缩小支持范围或换成明确领域模型。反过来，重复且稳定的关系用泛型表达能够减少一致性错误，不能因为复杂就一律删除；价值取决于真实消费者与变化成本。"
      ]
    },
    {
      "id": "boundaries",
      "title": "把复杂度预算放在能带来收益的地方",
      "paragraphs": [
        "第一条边界是编译成本：类型不存在于生成 JS 中，运行日志不能证明类型性能改善。第二条边界是外部数据：再复杂的推导也无法替代运行时校验。第三条边界是工具版本：检查策略与诊断可能随编译器变化，升级后应复跑语义与性能证据。",
        "取舍可以从三个问题开始：这个工具表达了哪条真实关系？普通领域类型能否同样表达？合法与非法例子能否让维护者推导新情况？先用配置反例加入一种 date renderer，确认合同、实现和穷尽检查在哪里要求同步变化。本单元暂无独立编码题。"
      ]
    }
  ],
  "sources": [
    {
      "title": "TypeScript 官方：性能诊断与类型设计",
      "url": "https://github.com/microsoft/TypeScript/wiki/Performance"
    },
    {
      "title": "TypeScript：函数类型的可维护性",
      "url": "https://www.typescriptlang.org/docs/handbook/2/functions.html"
    },
    {
      "title": "TypeScript：satisfies 运算符",
      "url": "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html"
    }
  ]
};
