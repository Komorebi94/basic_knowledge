import type { Article } from "../articles";

export const monorepoBoundariesArticle: Article = {
  "revision": 2,
  "id": "K09-06",
  "kind": "knowledge",
  "domainSlug": "tooling",
  "slug": "monorepo-and-package-boundaries",
  "title": "Monorepo 与包边界",
  "summary": "从工作区中能引用却发布后找不到文件的问题出发，验证包导出、任务图与缓存输入，解释工作区链接、增量构建和版本交付的责任。",
  "aliases": [
    "monorepo",
    "workspaces",
    "package exports",
    "task graph",
    "incremental build",
    "包边界"
  ],
  "tags": [
    "工程化",
    "Monorepo 与包边界"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "仓库里能 import，发布的包为什么没有这个路径？",
      "paragraphs": [
        "应用在 Monorepo 中直接导入工具包内部源码，开发时共享编译配置使它工作。包发布之后，消费者没有那个目录或加载不到对应格式。另一个团队把所有 workspace 的 build 同时启动，应用偶尔读到上一次工具包输出。放在同一个仓库不代表包入口和任务依赖已经正确。",
        "本篇分开工作区安装图、公开包入口、任务执行图和缓存输入。npm workspaces 可以声明嵌套包并在安装时链接，不能替你决定公共 API、任务拓扑、版本兼容和受影响范围。前置是 K09-01/02 与 K03-07 的公共库声明。"
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
      "id": "exports",
      "title": "包导出让消费者使用明确入口，不是一道文件权限墙",
      "paragraphs": [
        "下面在临时目录建立一个 CommonJS 作者包，exports 只公开根入口。Node 实际加载 root 成功，使用 package/internal.cjs 被拒绝。预期 公开入口:3、内部入口:ERR_PACKAGE_PATH_NOT_EXPORTED。没有运行 npm install 或任何安装脚本。",
        "exports 约束包名解析的子路径；包内部的相对访问或直接文件路径仍可能访问文件，不能把它当作保密、权限或隔离机制。发布时还应保证公开入口实际存在、类型声明匹配并且消费端环境支持发行格式。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { createRequire } from 'node:module';\nimport { join } from 'node:path';\nimport { withFiles } from './scripts/lib/tooling-fixture.mjs';\nawait withFiles({\n  'node_modules/order-lib/package.json': JSON.stringify({ name: 'order-lib', version: '1.0.0', exports: { '.': './index.cjs' } }),\n  'node_modules/order-lib/index.cjs': 'module.exports = { total: n => n * 3 };',\n  'node_modules/order-lib/internal.cjs': 'module.exports = 9;'\n}, root => {\n  const require = createRequire(join(root, 'consumer.cjs'));\n  console.log('公开入口:' + require('order-lib').total(1));\n  try { require('order-lib/internal.cjs'); }\n  catch (reason) { console.log('内部入口:' + reason.code); }\n});",
          "expectedOutput": [
            "公开入口:3",
            "内部入口:ERR_PACKAGE_PATH_NOT_EXPORTED"
          ],
          "explanation": [
            "Node 按 exports 的根映射加载真正的 index.cjs，返回功能结果 3。包名子路径 internal.cjs 虽有文件，但不在公开入口合同里，被 Node 解析器拒绝。",
            "这个实验只证明 CommonJS 根与未导出的子路径。ESM/CJS 条件、类型入口、浏览器映射和 npm 发布文件白名单还需另外核对；工作区路径别名不能代替这些消费者合同。"
          ]
        }
      ]
    },
    {
      "id": "tasks",
      "title": "任务图表达先后责任，不能只把包数组并行执行",
      "paragraphs": [
        "schema 生成后才能构建 sdk，sdk 的新输出就绪后才能构建 app。下面拓扑排序是明确的教学调度模型，不冒充 npm 自带增量执行器。正常得到 schema,sdk,app，循环和缺失依赖必须报错，不能跳过后继续发布。",
        "工作区安装依赖与任务依赖可以不同：测试可能需生成数据，文档任务可能需构建包，运行时依赖也可能无需本地先构建。应按读取的产物与实际责任建立任务边，不为了并行速度删除真实前置。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "function order(graph) {\n  const state = new Map(), result = [];\n  function visit(id) {\n    if (!Object.hasOwn(graph, id)) throw new Error('缺失任务:' + id);\n    if (state.get(id) === 'active') throw new Error('任务循环');\n    if (state.get(id) === 'done') return;\n    state.set(id, 'active');\n    for (const dependency of graph[id]) visit(dependency);\n    state.set(id, 'done'); result.push(id);\n  }\n  for (const id of Object.keys(graph)) visit(id);\n  return result;\n}\nconsole.log('顺序:' + order({ app: ['sdk'], sdk: ['schema'], schema: [] }).join(','));\ntry { order({ app: ['sdk'], sdk: ['app'] }); } catch (reason) { console.log(reason.message); }\ntry { order({ app: ['missing'] }); } catch (reason) { console.log(reason.message); }",
          "expectedOutput": [
            "顺序:schema,sdk,app",
            "任务循环",
            "缺失任务:missing"
          ],
          "explanation": [
            "DFS 先访问依赖，完成后才把任务加入结果，因此输入对象即使先写 app，也能得到正确顺序。done 状态避免共享前置重复执行。",
            "active 再被访问代表循环，未知节点代表图不完整，两种都中断。真实调度器还要处理并行、取消、失败传播和产物记录；简单顺序表并没有验证远程缓存或实际命令完成。"
          ]
        }
      ]
    },
    {
      "id": "cache",
      "title": "增量缓存键包括输出实际依赖的输入",
      "paragraphs": [
        "缓存只看 app 自己的源码，sdk 已经改了仍可能复用旧构建。下面用真实 SHA-256 计算固定合同的输入身份，把源码、依赖产物、目标与工具版本一起写进键。预期 依赖变化失效:true、目标变化失效:true、重复输入命中:true。",
        "这个模型说明责任，不是一套完整缓存服务。真实构建可能还依赖锁文件、生成代码、环境配置、插件与平台；只包含一个“环境名”不能证明所有有效输入都被覆盖，也不能把秘密原文上传到缓存键或日志。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { createHash } from 'node:crypto';\nfunction key({ source, dependencyDigest, target, toolVersion }) {\n  return createHash('sha256').update(JSON.stringify({ source, dependencyDigest, target, toolVersion })).digest('hex');\n}\nconst input = { source: 'app-source', dependencyDigest: 'sdk-v1', target: 'browser-A', toolVersion: 'author-tool-1' };\nconsole.log('依赖变化失效:' + (key(input) !== key({ ...input, dependencyDigest: 'sdk-v2' })));\nconsole.log('目标变化失效:' + (key(input) !== key({ ...input, target: 'browser-B' })));\nconsole.log('重复输入命中:' + (key(input) === key({ ...input })));",
          "expectedOutput": [
            "依赖变化失效:true",
            "目标变化失效:true",
            "重复输入命中:true"
          ],
          "explanation": [
            "同一输入的确定字段顺序生成同一摘要；依赖输出身份或目标变化改变摘要，不能误命中旧结果。这里不是判断 dependencyDigest 对应真实 sdk 字节，示例字段是作者标签。",
            "生产需用真实输入内容摘要，并校验缓存产物身份与可信来源。哈希不会自动知道遗漏了哪个文件，也不会把不可信远程产物变成安全结果。"
          ]
        }
      ]
    },
    {
      "id": "affected",
      "title": "从被改动包找消费者，同时保护未变化的独立任务",
      "paragraphs": [
        "变更 shared 时它的 app 消费者也受影响，而独立 docs 不应因为同库就全部重建。下面是受影响闭包模型，预期 shared,app；若删除 shared 的依赖边而 app 仍实际 import 它，模型会漏 app，这正是图声明不真实的失败。",
        "公共根配置、锁文件与编译规则变化可以影响多个任务，即使源码包未改。受影响范围应该从真实依赖和任务输入推出，而不是仅凭 Git 文件所在目录决定。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "function affected(graph, changed) {\n  const result = new Set(changed);\n  let grew = true;\n  while (grew) {\n    grew = false;\n    for (const [id, dependencies] of Object.entries(graph)) {\n      if (!result.has(id) && dependencies.some(dependency => result.has(dependency))) {\n        result.add(id); grew = true;\n      }\n    }\n  }\n  return [...result];\n}\nconst graph = { shared: [], app: ['shared'], docs: [] };\nconsole.log('受影响:' + affected(graph, ['shared']).join(','));\nconsole.log('错误图:' + affected({ ...graph, app: [] }, ['shared']).join(','));",
          "expectedOutput": [
            "受影响:shared,app",
            "错误图:shared"
          ],
          "explanation": [
            "模型沿消费者方向扩展变更集合，app 依赖 shared，所以被纳入，docs 没有这个关系则保持独立。集合与固定点循环使传递影响可被继续传播。",
            "把 app 的边删掉就只剩 shared，并不证明 app 真的无需检查；那只是图不可信。真实工作区应校验依赖声明与实际引用，防止 hoisting 或根配置隐藏未声明的依赖。"
          ]
        }
      ]
    },
    {
      "id": "release",
      "title": "源码复用、发布单位与版本策略分别决定",
      "paragraphs": [
        "内部源码包可以由应用构建统一处理，也可以先发布独立产物，两种都要有清楚入口与构建责任。对外发布包则需在干净消费环境测试打包后的文件、类型和发行格式，而不是从源码目录消费来证明包可用。",
        "统一版本便于整体协调，但让独立包版本一起变化；独立版本缩小发布面，仍要维护消费者兼容范围与联动升级。共享规范减少差异，但运行时单例库、平台差异或强域隔离不一定适合统一依赖版本。"
      ]
    },
    {
      "id": "boundaries",
      "title": "Monorepo 的收益依赖真实边界，而不是目录更多",
      "paragraphs": [
        "第一条边界是依赖可见性。根安装树或 hoisting 可能让未声明依赖碰巧可用，独立包消费者未必有它；exports 也不自动补齐依赖声明。第二条边界是缓存可信度与完整输入，缓存命中不是跳过质量门禁的理由。",
        "第三条边界是发布与运行时：同仓库提交不意味着所有服务可以同时部署，也不意味着各包的迁移可原子完成。跨包公共合同要兼容滚动升级与真实部署节奏。",
        "本篇真实验证 Node exports 与哈希，其他任务/受影响模型为作者教学算法；未创建真实 npm workspace、执行发布脚本、上传远程缓存或模拟所有模块条件。"
      ]
    },
    {
      "id": "practice",
      "title": "拿干净消费者而不是源码目录作为包验证入口",
      "paragraphs": [
        "给包例子添加一个新的公开子路径，核对文件确实包含且 Node 能解析；再构造 sdk 失败后 app 不可执行的调度检查。修改公共锁文件或编译目标，说明缓存与受影响范围应怎样变化。",
        "本主题当前没有专属判题练习，先运行本文完整示例，再改变输入验证失败路径。练习页已发布的相邻模型不能代替本主题的验收。涉及状态、窗口或分帧的模型题只检验纯计算结果；真实 DOM、布局、构建及耗时按本文环境另行核对。"
      ]
    }
  ],
  "sources": [
    {
      "title": "npm：Workspaces",
      "url": "https://docs.npmjs.com/cli/using-npm/workspaces/"
    },
    {
      "title": "Node：Packages",
      "url": "https://nodejs.org/api/packages.html"
    },
    {
      "title": "TypeScript：Project References",
      "url": "https://www.typescriptlang.org/docs/handbook/project-references.html"
    }
  ]
};
