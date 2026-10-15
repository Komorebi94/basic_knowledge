import type { Article } from "../articles";

export const transpilationTargetsArticle: Article = {
  "id": "K09-04",
  "kind": "knowledge",
  "domainSlug": "tooling",
  "slug": "transpilation-polyfills-and-targets",
  "title": "转译、polyfill 与目标环境",
  "summary": "用真实 TypeScript 转换与隔离运行时区分语法降级、类型声明和运行时 API，解释目标环境、补齐策略与依赖代码的兼容边界。",
  "aliases": [
    "transpile",
    "polyfill",
    "target",
    "lib",
    "浏览器兼容"
  ],
  "tags": [
    "工程化",
    "转译、polyfill 与目标环境"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-13",
  "sections": [
    {
      "id": "problem",
      "title": "构建目标已经是 ES2018，为什么运行时还没有 toSorted？",
      "paragraphs": [
        "订单页使用可选链和 toSorted，开发者设置 target=ES2018，以为输出就能在所有支持 ES2018 的浏览器运行。编译器能降级可选链语法，却不会因为改 target 自动安装 Array.prototype.toSorted。另一处只是添加类型 lib，编辑器不再报错，旧运行时仍会失败。",
        "兼容性至少有三个合同：输出语法能否解析，所需 API 是否存在且行为相容，所有入口及依赖是否采用相同目标。类型声明描述预期能力，不创造它。前置是 K03-01 的边界和 K09-01 的构建责任。"
      ]
    },
    {
      "id": "environment",
      "title": "复现环境：固定作者源码、临时产物与明确的验证范围",
      "paragraphs": [
        "运行 npm run verify:k09，逐一执行整个专题的作者示例。Node 代码块使用独立 ES 模块进程，浏览器代码块使用隔离空白页；不要在主站控制台执行。Node 示例可保存到仓库根目录的 mjs 文件后用 node 运行，保持相对 import 路径。",
        "真实工具实验使用仓库已安装 Rolldown 1.2.11、TypeScript 6.0.3 与 Node 22；scripts/lib/tooling-fixture.mjs 提供 bundle、runChunks 和 withFiles：只构建固定作者模块，在临时目录运行产物并于结束后清理。辅助源码和复现说明见仓库 docs/verification/tooling-harness.md；不安装未知包、不执行第三方安装脚本或用户输入。",
        "工具输出随版本与配置变化，本文只核对声明的行为与边界，不保证固定文件数量适用于所有项目，也不将教学计数换算成性能提升。关于发布与缓存的模型会明确标注，未调用真实 CI、CDN、监控账户或生产部署。"
      ]
    },
    {
      "id": "syntax",
      "title": "转译能改变语法，保留代码表达的结果",
      "paragraphs": [
        "下面用真实 TypeScript 把带类型、箭头、可选链和空值合并的代码转成 ES5，再在隔离 VM 中运行作者产物。预期 新语法保留:false、结果:0。测试的是该输入的转换与结果，不是拿现代 Node 解析成功证明所有 ES5 浏览器都支持它。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import ts from 'typescript';\nimport { runInNewContext } from 'node:vm';\nconst source = 'const read = (item: { value?: number } | null) => item?.value ?? 0; const answer = read(null);';\nconst code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES5 } }).outputText;\nconsole.log('新语法保留:' + /=>|\\?\\.|\\?\\?/.test(code));\nconst context = {};\nrunInNewContext(code, context);\nconsole.log('结果:' + context.answer);",
          "expectedOutput": [
            "新语法保留:false",
            "结果:0"
          ],
          "explanation": [
            "目标 ES5 使转换输出使用更早的语法表达箭头与空值分支，并移除类型标注。没有输入 item 时结果依然为 0，说明转换保留了这一场景的含义。",
            "转换结果仍可能依赖其他全局、辅助函数或库，现代 VM 执行也不是旧设备矩阵。生产应检查实际目标与依赖产物，并在约定的浏览器版本验证核心路径。"
          ]
        }
      ]
    },
    {
      "id": "runtime",
      "title": "降级语法之后，API 缺失仍会真实失败",
      "paragraphs": [
        "下面输出目标是 ES2018，但代码中的 toSorted 调用仍在。为可复现地制造缺失 API，在独立 VM 中把该方法设为 undefined，不改宿主 Array 原型。预期 API调用保留:true、缺失API:TypeError，随后用局部能力选择恢复出 1,3。",
        "局部 fallback 用复制后 sort 处理这里的数字数组，不声称是标准 toSorted polyfill。若希望补全标准 API，应采用经过审核并覆盖所需语义的实现，考虑稀疏数组、比较器、类型与修改原数组等边界。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import ts from 'typescript';\nimport { createContext, runInContext } from 'node:vm';\nconst code = ts.transpileModule('const result = [3,1].toSorted((a,b) => a-b);', {\n  compilerOptions: { target: ts.ScriptTarget.ES2018 }\n}).outputText;\nconsole.log('API调用保留:' + code.includes('.toSorted'));\nconst context = createContext({});\nrunInContext('Array.prototype.toSorted = undefined;', context);\ntry { runInContext(code, context); }\ncatch (reason) { console.log('缺失API:' + reason.name); }\nconst fallback = runInContext(`(() => {\n  const values = [3,1];\n  const sorted = typeof values.toSorted === 'function'\n    ? values.toSorted((a,b)=>a-b) : [...values].sort((a,b)=>a-b);\n  return sorted.join(',');\n})()`, context);\nconsole.log('局部恢复:' + fallback);",
          "expectedOutput": [
            "API调用保留:true",
            "缺失API:TypeError",
            "局部恢复:1,3"
          ],
          "explanation": [
            "转译不把 toSorted 替换成已有 API，隔离运行时没有这个方法便抛 TypeError。测试特意制造能力缺失，不能误称实际运行了一台老浏览器。",
            "局部函数检查能力并复制数组再排序，给出本例需要的恢复结果，不全局修改调用方环境。polyfill 是否全局安装、何时加载与自身副作用要与应用契约和 tree shaking 一起考虑。"
          ]
        }
      ]
    },
    {
      "id": "lib",
      "title": "lib 让类型检查认识 API，不改变运行时与输出目标",
      "paragraphs": [
        "下面给同一个源文件分别使用 ES2018 和 ES2023 标准库声明；目标语法仍为 ES2018。真实 createProgram 的语义检查在旧 lib 中报告 toSorted 不存在，新 lib 中不再报告。预期 旧lib缺声明:true、新lib错误数:0。",
        "lib 是你宣称运行环境提供的类型能力，不是兼容包下载清单。允许新声明后，应用仍需部署适当 API、fallback 或目标限制；target 与 lib 可以有不同值，必须知道为何这样设置。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import ts from 'typescript';\nimport { join } from 'node:path';\nimport { withFiles } from './scripts/lib/tooling-fixture.mjs';\nawait withFiles({ 'sample.ts': 'const values: number[] = [3,1]; const result = values.toSorted(); export { result };' }, async root => {\n  function check(lib) {\n    const program = ts.createProgram([join(root, 'sample.ts')], {\n      target: ts.ScriptTarget.ES2018, lib: [lib], strict: true, noEmit: true, types: []\n    });\n    return ts.getPreEmitDiagnostics(program);\n  }\n  console.log('旧lib缺声明:' + check('lib.es2018.d.ts').some(item => item.code === 2550));\n  console.log('新lib错误数:' + check('lib.es2023.d.ts').length);\n});",
          "expectedOutput": [
            "旧lib缺声明:true",
            "新lib错误数:0"
          ],
          "explanation": [
            "ES2018 声明没有提供这个方法，语义检查发现缺失。ES2023 提供相应标准声明，所以这个源文件在同样 ES2018 输出目标下通过类型检查。",
            "测试没有安装任何 polyfill，也没有改变运行时：上一例的缺失 VM 仍然没有方法。新类型能力只有与部署能力一致时才能成为可信合同。"
          ]
        }
      ]
    },
    {
      "id": "typecheck",
      "title": "成功去掉类型，不等于通过类型检查",
      "paragraphs": [
        "快速转译流程常只处理单文件语法，无法承担整个程序语义验证。下面故意把字符串赋给 number；transpileModule 仍产出 JavaScript，createProgram 则报告 2322。预期 转译有输出:true、语义错误:true。因此构建流程不能只等转换结束，就宣称领域类型正确。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import ts from 'typescript';\nimport { join } from 'node:path';\nimport { withFiles } from './scripts/lib/tooling-fixture.mjs';\nconst source = 'const count: number = \"bad\"; export { count };';\nconsole.log('转译有输出:' + Boolean(ts.transpileModule(source, {\n  compilerOptions: { target: ts.ScriptTarget.ES2022 }\n}).outputText));\nawait withFiles({ 'sample.ts': source }, async root => {\n  const program = ts.createProgram([join(root, 'sample.ts')], { strict: true, noEmit: true, types: [], target: ts.ScriptTarget.ES2022 });\n  console.log('语义错误:' + ts.getPreEmitDiagnostics(program).some(item => item.code === 2322));\n});",
          "expectedOutput": [
            "转译有输出:true",
            "语义错误:true"
          ],
          "explanation": [
            "输出保留字符串值，只去掉类型文字；它没有证明 count 真的是数字。语义检查读完整类型关系后发现赋值违反声明。",
            "本仓库有独立 typecheck，构建也运行 tsc。通用教程不能给其他项目虚构同名脚本，实际交付要核对目标仓库是否已有可靠检查入口。"
          ]
        }
      ]
    },
    {
      "id": "boundaries",
      "title": "兼容清单覆盖应用、依赖与加载方式",
      "paragraphs": [
        "先列目标浏览器或运行时，再区分语法、全局 API、Web API 与样式能力。Babel preset-env 或构建 target 可以依据目标转换一定语法，但 polyfill 引入策略、CSS 前缀、第三方原生扩展与宿主权限仍是独立事项。别用一项 browsers 配置替代所有边界。",
        "第一条边界是依赖代码。自己的 TS 转换成功，不证明 node_modules 中未转译语法、动态 chunk 与 worker 都符合目标。第二条边界是副作用和顺序：API 补齐必须在依赖它的代码之前执行，不能被错误的无副作用标注删除。",
        "第三条边界是渐进增强。Clipboard、文件选择器等能力不只是方法存在，还需要权限与调用环境，应用需保留恢复路径。本文验证真实 TypeScript 转换和受控缺失 API，不做旧浏览器矩阵、完整标准 polyfill 或 CSS 兼容验收。"
      ]
    },
    {
      "id": "practice",
      "title": "把“能编译、能解析、能运行”分别写成证据",
      "paragraphs": [
        "给语法例子加 async/await，检查降级后是否仍需要 Promise；给 API 例子添加稀疏数组，指出局部 fallback 何处不再等价于标准方法。对一个依赖入口核对其发行格式与目标，避免只看应用 tsconfig。",
        "本主题没有独立已开放兼容题。实际迁移应保留核心行为和失败恢复检查，记录运行时版本，不用“构建成功”替代所有能力已存在。"
      ]
    }
  ],
  "sources": [
    {
      "title": "TypeScript：target",
      "url": "https://www.typescriptlang.org/tsconfig/target.html"
    },
    {
      "title": "TypeScript：lib",
      "url": "https://www.typescriptlang.org/tsconfig/lib.html"
    },
    {
      "title": "TypeScript：Compiler API",
      "url": "https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API"
    },
    {
      "title": "Vite：Production Build",
      "url": "https://vite.dev/guide/build"
    }
  ]
};
