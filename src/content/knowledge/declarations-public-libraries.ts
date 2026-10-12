import type { Article } from "../articles";

export const declarationsLibraryArticle: Article = {
  "id": "K03-07",
  "kind": "knowledge",
  "domainSlug": "typescript",
  "slug": "declarations-public-libraries",
  "title": "声明文件与公共库",
  "summary": "从发布后类型可用而代码不可用的事故出发，区分声明与实现，用一个完整双模块示例检查导出、消费者解析和运行时合同。",
  "aliases": [
    "declaration files",
    "d.ts",
    "package exports",
    "NodeNext",
    "bundler",
    "ESM",
    "CommonJS",
    "公共库"
  ],
  "tags": [
    "TypeScript",
    "类型建模",
    "声明文件与公共库"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "编辑器不报错，用户运行为什么还是失败？",
      "paragraphs": [
        "库发布后，编辑器能显示函数名，使用者一运行却得到“不是函数”。另一类问题是本地 workspace 能导入，安装发布包后找不到声明文件。这些问题需要同时检查 JavaScript 入口、类型入口、模块模式和真正发布的文件；.d.ts 本身不能保证实现存在。",
        "前置是 K01-07 的 ESM 模块、K03-01 的运行时校验和 K03-05 的函数合同。本章正向示例在 TypeScript 6.0.3 严格模式下编译运行；独立临时包验证则使用同一实现生成声明，检查 Bundler 和 NodeNext 的消费方式。不把这一个受限示例宣称成所有历史 TypeScript 或构建工具兼容。"
      ]
    },
    {
      "id": "ambient",
      "title": "declare 只告诉编译器“实现会由别处提供”",
      "paragraphs": [
        "声明文件描述已有 JavaScript 能力，不创建值。declare function 让编译器允许调用，但生成 JavaScript 后仍需有真实函数。下面为了复现错误，只声明一个实际不存在的函数，调用被 try/catch 捕获；编译成功而输出 ReferenceError，直接显示静态承诺和运行环境之间的缺口。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "declare function lessonOffsetFromExternal(value: unknown): number;\ntry { console.log(lessonOffsetFromExternal(7)); }\ncatch (error) { console.log(error instanceof ReferenceError); }\nconsole.log('declaration has no implementation');",
          "expectedOutput": [
            "true",
            "declaration has no implementation"
          ],
          "explanation": [
            "declare 在输出代码中消失；浏览器没有提供 lessonOffsetFromExternal，因此调用失败并打印 true。之后正常继续执行第二条日志。",
            "这是明确标注的错误环境实验，不是可用库。修复必须交付实现并正确绑定模块入口；添加更多声明或开启 skipLibCheck 都不会生成缺少的函数。"
          ]
        }
      ]
    },
    {
      "id": "library-source",
      "title": "先写真实实现，再由实现生成声明",
      "paragraphs": [
        "下面完整实现保存为 src/index.ts。输入是 unknown，因为库可能被 JavaScript 使用者调用，也可能接收解码数据；返回类型是 number，但运行时仍检查范围。options.max 也检查整数非负，避免声明正确却传入无效数值。库没有 DOM、网络或账号依赖，便于分别验证两种模块输出。",
        "编译时让 declaration/emitDeclarationOnly 为这个源文件生成类型文件，再按打包方式提供 .d.mts 与 .d.cts。JavaScript 的 .mjs 与 .cjs 分别用 ES 模块与 CommonJS 方式输出。不能只改扩展名就把 ESM 的 export 变成 require 可执行代码；两种实现应由同一来源构建并分别运行。"
      ],
      "code": "export interface OffsetOptions { max: number; }\nexport function readOffset(value: unknown, options: OffsetOptions): number {\n  if (!Number.isSafeInteger(options.max) || options.max < 0) {\n    throw new RangeError('Invalid maximum');\n  }\n  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > options.max) {\n    throw new TypeError('Invalid offset');\n  }\n  return value;\n}"
    },
    {
      "id": "runtime",
      "title": "让声明与运行结果描述同一个合同",
      "paragraphs": [
        "下面独立示例复现库的边界：7 合法，字符串 \"7\" 不自动转换，11 超过 max=10。明确拒绝比声明返回 number 却返回未检查字符串更可信；若产品希望接受数字字符串，应该另写解析规则并测试，而不是依靠 TypeScript 声明替运行时转换。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "interface Options { max: number; }\nfunction readOffset(value: unknown, options: Options): number {\n  if (!Number.isSafeInteger(options.max) || options.max < 0) throw new RangeError('Invalid maximum');\n  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > options.max) {\n    throw new TypeError('Invalid offset');\n  }\n  return value;\n}\nconsole.log(readOffset(7, { max: 10 }));\nfor (const input of ['7', 11]) {\n  try { readOffset(input, { max: 10 }); }\n  catch (error) { console.log(error instanceof TypeError); }\n}",
          "expectedOutput": [
            "7",
            "true",
            "true"
          ],
          "explanation": [
            "第一次检查通过得到 7；字符串不满足 typeof number；11 虽然是整数却超过上限，两条都得到 TypeError。",
            "代码同时检验 options.max，而不是假设所有 TypeScript 调用者都遵守类型。数值是否可用由运行合同决定，外部消费者不因获得 .d.ts 就免除边界风险。"
          ]
        }
      ]
    },
    {
      "id": "package-exports",
      "title": "包入口按消费方式同时选择代码与类型",
      "paragraphs": [
        "以下是这个临时库的完整 package.json，dist 内必须真实存在四个入口。exports 的 import 和 require 分支选择两种模块形态，每个分支先提供 types 条件，再提供 default 实现。types 条件供支持这种解析的 TypeScript 使用，不会让 Node 执行声明文件。files 指定发布文件范围，入口路径即使写对，文件漏发仍会失败。",
        "这个示例显式使用扩展名和双声明入口，避免把 ESM 语义的一个 .d.ts 同时当所有消费方的 CommonJS 声明。真实库可能只发布 ESM，也可能有多个子路径；不要为了演示模式强制所有项目双发。导出的子路径、默认/命名导出及依赖版本都是公共兼容合同。"
      ],
      "code": "{\n  \"name\": \"lesson-offset\",\n  \"version\": \"1.0.0\",\n  \"type\": \"module\",\n  \"exports\": {\n    \".\": {\n      \"import\": {\n        \"types\": \"./dist/index.d.mts\",\n        \"default\": \"./dist/index.mjs\"\n      },\n      \"require\": {\n        \"types\": \"./dist/index.d.cts\",\n        \"default\": \"./dist/index.cjs\"\n      }\n    }\n  },\n  \"files\": [\n    \"dist\"\n  ]\n}"
    },
    {
      "id": "resolution",
      "title": "开发项目能解析，不等于 Node 能运行",
      "paragraphs": [
        "Bundler 解析模式适合由打包器处理模块的应用，某些路径允许形式与原生 Node 不同。NodeNext 配合 .mts/.cts 或 package.json 的 type，模拟对应 Node 模块规则；选项应该与实际运行或构建工具一致。paths 主要帮助编译器解析，不会自动重写生成代码或替 Node 安装运行时别名。",
        "消费验证在临时目录创建 package 布局，不直接从源码路径导入。ESM 消费文件通过 import 获取命名函数，CommonJS 消费文件编译后通过 require 获取同名函数；两者都要验证真实结果，而不是只在编辑器里悬停看提示。若使用全局声明或模块扩充，还要避免污染不相关消费方的名字空间。"
      ]
    },
    {
      "id": "consumer-files",
      "title": "用真实导出包编译和运行消费文件",
      "paragraphs": [
        "将以下同一份内容分别保存为 consumer.mts 与 consumer.cts，放在能按包名解析 lesson-offset 的测试目录中。两种文件均按 NodeNext 模块与解析配置编译：前者输出 .mjs，后者输出 .cjs。打包器消费配置则用 .ts、ESNext 与 Bundler 做类型检查，由对应构建工具承担实际输出。不要在消费文件中直接导入库的 src 目录，否则会绕过导出清单与发布文件验证。",
        "两个 Node 消费文件的实际输出都应是先 7，再 true：合法数值经过库实现返回 7；字符串输入虽然能传给 unknown 参数，却被运行时校验拒绝。类型推断与模块加载同时成立，才算这个消费组合通过。本文临时包验证从同一实现生成声明和两种 JS 产物，不执行错误的声明漂移变体。"
      ],
      "code": "import { readOffset } from 'lesson-offset';\nimport type { OffsetOptions } from 'lesson-offset';\nconst options: OffsetOptions = { max: 10 };\nconst value: number = readOffset(7, options);\nconsole.log(value);\ntry { readOffset('7', options); }\ncatch (error) { console.log(error instanceof TypeError); }"
    },
    {
      "id": "consumer",
      "title": "消费方只依赖需要的公开结构",
      "paragraphs": [
        "下面用函数类型模拟公共库消费点，保持 unknown 输入与 number 输出，不依赖实现内部类型。这个单文件运行示例检查回调合同；真正的包解析检查另使用上文导出清单和构建产物，不把单文件赋值当成发布验证。"
      ],
      "examples": [
        {
          "language": "typescript",
          "code": "type PublicReader = (value: unknown, options: { max: number }) => number;\nfunction consume(reader: PublicReader): number {\n  return reader(4, { max: 10 }) + 1;\n}\nconst implementation: PublicReader = (value, options) => {\n  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > options.max) {\n    throw new TypeError('Invalid offset');\n  }\n  return value;\n};\nconsole.log(consume(implementation));",
          "expectedOutput": [
            "5"
          ],
          "explanation": [
            "consume 只使用公开签名，把 4 交给 reader 并加 1。实现返回受校验的数值，因此结果为 5。",
            "这个替身仅用于消费点关系，完整库实现仍以上文源文件为准。包验证还会故意把生成声明的 number 改成 string，确认消费方赋值会失败，从而发现声明漂移。"
          ]
        }
      ]
    },
    {
      "id": "negative-public-options",
      "title": "错误实现：消费方传入了不符合公开类型的选项",
      "paragraphs": [
        "max 的声明为 number，字符串选项在消费方被拒绝。若把声明改成宽类型来让它通过，却不更新运行时解析，库依旧不能正确处理。公共类型与实现必须一起审阅；修改参数可选性、输出联合或导出名称也可能破坏既有消费者。"
      ],
      "code": "interface OffsetOptions { max: number; }\ndeclare function readOffset(value: unknown, options: OffsetOptions): number;\nconst offset = readOffset(7, { max: '10' });"
    },
    {
      "id": "verification",
      "title": "公共库的正向、负向与真实包检查",
      "paragraphs": [
        "至少检查三类证据：合法调用保留预期类型，错误调用被拒绝，实际发布布局下的模块运行正常。负向测试应指定预期诊断，确认不是“找不到依赖”这种无关错误导致失败。生成声明后还需审查意外暴露的内部路径、环境类型和依赖；不想让用户依赖的内部类型，不应随意出现在公共返回值中。",
        "第一条边界是最低支持编译器：新类型语法或 exports 条件可能不被旧版本理解，需要明确支持范围并实际建立版本矩阵。第二条边界是运行时模块：类型解析通过不代表 JS 路径、扩展名与导出形态正确。skipLibCheck 不能成为修复坏声明的方式。",
        "本章临时包仅验证当前安装的 TypeScript 6.0.3、Node 与三种消费配置，不下载其他版本。没有独立编码题；可以先删掉一个 dist 入口或改变命名导出，分别观察类型和运行时如何失败，之后恢复产物。"
      ]
    }
  ],
  "sources": [
    {
      "title": "TypeScript：声明文件发布",
      "url": "https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html"
    },
    {
      "title": "TypeScript：模块与包入口解析",
      "url": "https://www.typescriptlang.org/docs/handbook/modules/reference.html"
    }
  ]
};
