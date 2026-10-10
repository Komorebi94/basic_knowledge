import type { Article } from "../articles";

export const moduleGraphsAndLoadingArticle: Article = {
  "id": "K09-01",
  "kind": "knowledge",
  "domainSlug": "tooling",
  "slug": "module-graphs-and-loading",
  "title": "模块图、构建与按需加载",
  "summary": "开发服务器和生产构建有什么不同。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "module-graphs-and-loading",
    "模块图、构建与按需加载"
  ],
  "tags": [
    "tooling"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "开发服务器很快，生产为什么仍要构建？",
      "paragraphs": [
        "开发时修改一个模块马上更新，发布却要先构建生成静态产物。两种工作模式优化目标不同：开发关注启动、按需处理与反馈，生产关注可部署资源、兼容目标、压缩和加载关系。不能把开发 URL 直接作为交付产物。",
        "本文独立 JavaScript 例子模拟依赖图和加载缓存，不依赖某个打包器内部实现。工具行为以项目锁定版本和官方文档为准；Vite 的生产构建与依赖预处理实现会演进，不把某个历史底层工具当作永久保证。"
      ],
      "examples": [
        {
          "code": "const graph = new Map([['entry', ['list', 'format']], ['list', ['format']], ['format', []]]);\nfunction visit(id, seen = new Set()) {\n  if (seen.has(id)) return seen;\n  seen.add(id); for (const child of graph.get(id) ?? []) visit(child, seen); return seen;\n}\nconsole.log([...visit('entry')].join(','));\nconsole.log(visit('entry').size);",
          "expectedOutput": [
            "entry,list,format",
            "3"
          ],
          "explanation": [
            "入口访问 list 再访问 format，集合防止共享依赖重复遍历。模块图描述可达关系，不等于源码文件数或最终 chunk 数；构建会根据规则变换与分组。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "从源码依赖到可部署资源",
      "paragraphs": [
        "静态 import 让工具知道依赖边，解析器寻找模块，插件可能把 CSS、图片和特殊语法转换成资源或 JavaScript。类型声明可能在转换时被移除，构建成功不自动证明 TypeScript 类型正确，所以项目应单独运行真实类型检查。",
        "生产构建分析可达代码，按配置拆分、优化和命名资源。tree shaking 依赖静态可分析语义与副作用信息；一个没有使用返回值却修改全局的模块不能随便删除。包的 sideEffects 信息错误会改变行为，体积优化必须核对功能。"
      ]
    },
    {
      "id": "dynamic",
      "title": "按需加载把成本移到使用时机",
      "paragraphs": [
        "动态 import 返回 Promise，使用功能时再加载对应模块可以减少首屏成本，但引入延迟、加载状态和失败路径。若点击后必须立即呈现，可根据真实概率提前预取；预取全部功能就会失去按需收益。"
      ],
      "examples": [
        {
          "code": "let loads = 0; let cached;\nfunction loadFeature() {\n  if (!cached) cached = Promise.resolve().then(() => { loads++; return { run: value => value * 2 }; });\n  return cached;\n}\nPromise.all([loadFeature(), loadFeature()]).then(([a, b]) => {\n  console.log(a.run(3)); console.log(a === b, loads);\n});",
          "expectedOutput": [
            "6",
            "true 1"
          ],
          "explanation": [
            "两个调用共享同一个加载 Promise，模块模型只创建一次。真实 import 由模块系统管理缓存；不要从这个模型推断浏览器会发几个网络请求或 chunk 的具体结构。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "失败缓存需要明确恢复合同",
      "paragraphs": [
        "手写 loader 若永久缓存 rejected Promise，之后每次重试都会得到同一失败。要按合同清除失败缓存或更换资源版本，同时避免多个重试重复启动。真实动态 import 错误可能来自网络、模块执行或部署资源缺失，恢复策略要分类。"
      ],
      "examples": [
        {
          "code": "let attempts = 0; let cache;\nfunction load() {\n  if (!cache) cache = Promise.resolve().then(() => {\n    attempts++; if (attempts === 1) throw new Error('暂时失败'); return '完成';\n  }).catch(error => { cache = undefined; throw error; });\n  return cache;\n}\nload().catch(error => { console.log(error.message); return load(); }).then(value => console.log(value, attempts));",
          "expectedOutput": [
            "暂时失败",
            "完成 2"
          ],
          "explanation": [
            "第一次失败清除手写缓存，第二次重新创建 Promise 并成功。这不是标准 import 缓存清除 API，只展示应用 loader 的恢复责任。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "deploy",
      "title": "旧页面与新发布之间存在时间差",
      "paragraphs": [
        "用户打开旧 HTML 后，服务器发布新资源并删除旧 chunk，用户稍后访问懒加载功能就可能找不到旧文件。保留旧哈希资源、原子切换发布目录或提供安全刷新恢复，可降低这种风险。不能只在新标签打开首页就认定部署成功。",
        "base 路径、反向代理、MIME 与 SPA 路由回退同样属于交付合同。JavaScript 请求若被回退成 HTML，会产生解析错误；不要将所有路径都无条件回退入口。"
      ]
    },
    {
      "id": "boundaries",
      "title": "代码拆分不是免费午餐",
      "paragraphs": [
        "第一条边界是过度细分：大量小资源增加请求与调度成本，共享 chunk 还可能让修改影响多个入口缓存。第二条边界是执行副作用：导入模块会执行模块顶层代码，懒加载改变副作用发生时机。",
        "第三条边界是开发与生产差异。开发依赖优化、环境变量和 HMR 路径不代表生产行为。需要构建后在接近部署环境中验证路由、资源和核心交互，而不是只看开发服务器。"
      ]
    },
    {
      "id": "application",
      "title": "按用户路径决定拆分边界",
      "paragraphs": [
        "把低频重功能作为候选，如图表编辑器或管理面板；共享核心小模块通常无需强行单独拆分。先查看产物体积和真实首屏请求，再提出改变。",
        "交付检查应包含类型、lint、构建及构建产物运行。每一步证明不同事实：构建证明转换可完成，运行证明资源链与行为，类型检查证明静态合同。",
        "例如首页只需要列表，低频报表页需要大型图表库。将图表入口设置为动态边，可以把图表依赖移出首次路径，但首次进入报表要显示可理解的加载状态。若加载失败，应保留返回导航与重试，不能渲染一个永久空白容器。判断收益时比较首屏减少的字节与报表首次等待，尤其关注低速网络中的用户路径。",
        "拆分之后还要核对共享依赖。如果首页和报表都使用格式化函数，工具可能把它放在共同 chunk，也可能内联或按配置处理。只凭源代码 import 位置无法断言最终请求数量。查看 manifest、构建报告与真实网络，确认资源路径、缓存和执行副作用符合预期。构建文件大小是证据之一，不能独立证明交互已经改善。",
        "验收懒加载还应主动制造请求失败与旧资源缺失，而不是只观察缓存命中的快速成功。用户点击后必须看到加载结束、失败说明或可恢复操作，按钮不能因异常永久停在禁用状态。"
      ]
    },
    {
      "id": "recall",
      "title": "从入口跟踪一个功能",
      "paragraphs": [
        "画入口到功能的静态与动态边，标出何时下载、何时执行、失败后如何恢复和旧版本资源如何保留。再对照构建产物与网络记录。",
        "回忆：为什么源文件数不等于 chunk 数？为什么动态导入要有失败界面？可在图模型中增加环，确认 seen 防止无限递归并解释它不等价于处理所有真实循环依赖语义。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Vite：Features",
      "url": "https://vite.dev/guide/features.html"
    },
    {
      "title": "Vite：Building for Production",
      "url": "https://vite.dev/guide/build"
    },
    {
      "title": "Vite：Dependency Pre-Bundling",
      "url": "https://vite.dev/guide/dep-pre-bundling.html"
    }
  ]
};
