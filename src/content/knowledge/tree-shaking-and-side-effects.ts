import type { Article } from "../articles";

export const treeShakingEffectsArticle: Article = {
  "id": "K09-03",
  "kind": "knowledge",
  "domainSlug": "tooling",
  "slug": "tree-shaking-and-side-effects",
  "title": "Tree shaking 与副作用",
  "summary": "从导入一个格式化函数却带入注册代码出发，实际检查未使用导出、模块副作用与纯调用标注，解释为什么可分析的导入仍不能任意删除行为。",
  "aliases": [
    "tree shaking",
    "sideEffects",
    "dead code elimination",
    "PURE",
    "副作用"
  ],
  "tags": [
    "工程化",
    "Tree shaking 与副作用"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-13",
  "sections": [
    {
      "id": "problem",
      "title": "只用了一个格式化函数，为什么整个包的行为还在？",
      "paragraphs": [
        "订单页只导入金额格式化函数，构建产物里却还有全局插件注册。开发者把所有模块标成无副作用，文件变小了，运行时插件却不见了。正确目标不是删除尽可能多的字符串，而是在保留可观察行为的前提下删掉不需要的工作。",
        "Tree shaking 根据模块关系、导出使用情况与副作用信息判断哪些语句可以省略。静态 import 提供可分析入口，但导入仍可能执行模块顶层代码；函数返回值未使用，也不证明函数没有写状态、抛错或注册资源。前置是 K01-07 的模块语义与 K09-01 的模块图。"
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
      "id": "reachable",
      "title": "先区分未使用的导出和必须执行的模块语句",
      "paragraphs": [
        "下面的 lib 同时导出 keep 和 unused，入口只使用 keep。Rolldown 真正构建这个虚拟模块图，再在临时目录以原生 ESM 加载产物。预期 未使用代码保留:false 与 运行结果:6。唯一标记只用来查这一段作者代码，不以字符串检查替代运行行为。",
        "这种删除依赖可分析关系。构建配置、入口导出合同、动态引用或其他副作用可能让代码继续需要，不能用这个小例子推断真实包里所有 unused 命名都一定会消失。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { bundle, runChunks } from './scripts/lib/tooling-fixture.mjs';\nconst output = await bundle({\n  entry: \"import { keep } from 'lib'; export const result = keep(3);\",\n  lib: \"export const keep = n => n * 2; export const unused = () => 'UNUSED_AUTHOR_MARKER';\"\n});\nconst code = output.filter(item => item.type === 'chunk').map(item => item.code).join('\\n');\nconsole.log('未使用代码保留:' + code.includes('UNUSED_AUTHOR_MARKER'));\nawait runChunks(output, module => console.log('运行结果:' + module.result));",
          "expectedOutput": [
            "未使用代码保留:false",
            "运行结果:6"
          ],
          "explanation": [
            "入口通过静态绑定调用 keep，unused 没有消费路径且其声明不产生必须保留的行为，真实产物移除了标记对应函数。",
            "运行结果仍为 6，说明这里减少代码没有损坏使用中的函数。产物代码检查证明这一段被省略，执行证明声明的功能仍成立，两项证据负责不同问题。"
          ]
        }
      ]
    },
    {
      "id": "module-effects",
      "title": "把有副作用的模块标成无副作用，会改变结果",
      "paragraphs": [
        "模块加载时注册插件，属于顶层副作用，即使没有导出也必须执行。下面对同一源码分别保留 moduleSideEffects 默认责任与故意错误的 false。预期 正常注册:true、错误标注:false。这个选项是构建者承诺，不是工具在发布前替你审核过了注册行为。",
        "包的 package.json sideEffects 字段、插件返回的模块信息以及工具选项都有自己的作用范围与优先级。CSS 导入、polyfill 和全局注册也可能靠加载时执行；不要把 webpack 字段的某一解释无条件套到所有工具配置上。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { bundle, runChunks } from './scripts/lib/tooling-fixture.mjs';\nfor (const effects of [true, false]) {\n  const output = await bundle({\n    entry: \"import 'register'; export const read = () => globalThis.__authorRegistered === true;\",\n    register: 'globalThis.__authorRegistered = true;'\n  }, { treeshake: { moduleSideEffects: effects } });\n  delete globalThis.__authorRegistered;\n  await runChunks(output, module => console.log((effects ? '正常注册:' : '错误标注:') + module.read()));\n  delete globalThis.__authorRegistered;\n}",
          "expectedOutput": [
            "正常注册:true",
            "错误标注:false"
          ],
          "explanation": [
            "正常配置下 register 的全局写入被保留，消费方 read 看到 true。false 允许工具把没有被使用导出的模块一起省略，register 被移除，read 变 false。",
            "这是一个明确错误实现，复现了体积变小而行为消失。生产应精确说明哪些文件无副作用，保护 CSS、注册与兼容初始化，并用消费端构建验证；不能靠开发页面正常证明发布包的标注正确。"
          ]
        }
      ]
    },
    {
      "id": "namespace",
      "title": "命名空间的运行时选择，扩大必须保留的导出集合",
      "paragraphs": [
        "若函数接受任意 key 再从模块命名空间读取，工具需要保留可能被选中的导出。下面入口只在测试时选择 light，但公开函数仍允许 key=heavy，因此产物保留 heavy 的标记。预期 动态可达:true、light:2。",
        "命名空间 import 本身并非永远阻止删除；固定 property 访问可能被分析。真正要检查的是工具能否确定访问路径和公开消费合同，而不是见到星号就改语法。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { bundle, runChunks } from './scripts/lib/tooling-fixture.mjs';\nconst output = await bundle({\n  entry: \"import * as api from 'lib'; export const choose = key => api[key]();\",\n  lib: \"export const light = () => 2; export const heavy = () => 'HEAVY_AUTHOR_MARKER';\"\n});\nconsole.log('动态可达:' + output.find(item => item.type === 'chunk').code.includes('HEAVY_AUTHOR_MARKER'));\nawait runChunks(output, module => console.log('light:' + module.choose('light')));",
          "expectedOutput": [
            "动态可达:true",
            "light:2"
          ],
          "explanation": [
            "构建时看不到消费方未来传哪个 key，heavy 仍能通过 choose 被访问，所以不是安全的删除目标。测试只调用 light，不会改变导出的函数合同。",
            "如果业务只需要 light，缩小公开接口才可能使工具明确删除另一部分。但改接口有兼容影响，不能为了摇掉代码删除真实消费者仍需要的能力。"
          ]
        }
      ]
    },
    {
      "id": "pure",
      "title": "PURE 标注说的是调用可省略，不是函数经过了纯度检查",
      "paragraphs": [
        "下面 record 会写全局，但故意把调用标为 PURE。返回值未使用时，工具相信标注并省略调用；关闭 annotations 后则保留真实副作用。预期 相信错误标注:false、忽略标注:true。",
        "应仅在确认调用不产生应保留的可观察效果时标注，并理解参数求值也有自己的副作用分析。标注不是运行时沙箱，也不是删除函数定义或整个模块的通用指令。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { bundle, runChunks } from './scripts/lib/tooling-fixture.mjs';\nfor (const annotations of [true, false]) {\n  const output = await bundle({ entry: `\n    function record() { globalThis.__authorPure = true; return {}; }\n    /*@__PURE__*/ record();\n    export const read = () => globalThis.__authorPure === true;\n  ` }, { treeshake: { annotations } });\n  delete globalThis.__authorPure;\n  await runChunks(output, module => console.log((annotations ? '相信错误标注:' : '忽略标注:') + module.read()));\n  delete globalThis.__authorPure;\n}",
          "expectedOutput": [
            "相信错误标注:false",
            "忽略标注:true"
          ],
          "explanation": [
            "annotations=true 将未使用结果的调用视为可省略，作者错误地承诺纯调用导致全局写入消失。false 不相信这个提示，保留调用，所以 read 为 true。",
            "这个反例把“没用返回值”和“没有副作用”分开。库作者要用真实发布产物覆盖初始化、样式和消费函数，应用作者则应先查是不可分析路径还是必要行为，而不是批量添加 PURE。"
          ]
        }
      ]
    },
    {
      "id": "boundaries",
      "title": "验证删除的正确性，要检查消费端和初始化顺序",
      "paragraphs": [
        "工程中先查真实产物与模块关系，再辨别 retained 代码的理由：导出可达、顶层效果、未知动态选择、工具保守分析或配置。导入一个函数仍带 CSS 注册可能完全正确；只有确认效果不需要，才讨论删除。",
        "第一条边界是语义：压缩、常量折叠与 tree shaking 是相关但不同的工作，小文件不证明初始化顺序正确。第二条边界是格式与工具：ESM 通常更容易静态分析，但现代工具也可能处理部分 CommonJS，不能说 require 一定无法优化。",
        "第三条边界是元数据责任。错误的 sideEffects 或 PURE 提示可能造成静默缺功能，往往只在消费端生产构建出现。这里执行 Rolldown 作者模块，不模拟真实 CSS 插件、webpack 产物或所有 CommonJS 形式。"
      ]
    },
    {
      "id": "practice",
      "title": "为减小产物保留一组行为反证",
      "paragraphs": [
        "给注册例子再加一个正常导出，预测当这个导出被真正使用时 false 是否仍会删掉整个模块；再用一个属性 getter 或会抛错的调用检查纯度判断。每次先说应保留的行为，再看工具生成了什么。",
        "本主题没有单独已开放编码题。可把订单格式化、样式加载和插件可用性写成消费检查，保留正常、初始化失败与加载顺序三类证据；目录不是产物已验证的证明。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Rolldown：Dead Code Elimination",
      "url": "https://rolldown.rs/in-depth/dead-code-elimination"
    },
    {
      "title": "Rolldown：treeshake",
      "url": "https://rolldown.rs/reference/InputOptions.treeshake"
    },
    {
      "title": "webpack：Tree Shaking",
      "url": "https://webpack.js.org/guides/tree-shaking/"
    }
  ]
};
