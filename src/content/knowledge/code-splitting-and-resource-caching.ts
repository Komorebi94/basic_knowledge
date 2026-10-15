import type { Article } from "../articles";

export const codeSplittingCacheArticle: Article = {
  "id": "K09-05",
  "kind": "knowledge",
  "domainSlug": "tooling",
  "slug": "code-splitting-and-resource-caching",
  "title": "代码分割与资源缓存",
  "summary": "从旧订单页打开报表失败出发，实际检查动态 chunk、内容 hash 与资源响应，解释分割时机、入口更新、旧资源保留和加载失败恢复。",
  "aliases": [
    "code splitting",
    "chunk",
    "content hash",
    "immutable",
    "缓存",
    "懒加载"
  ],
  "tags": [
    "工程化",
    "代码分割与资源缓存"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-13",
  "sections": [
    {
      "id": "problem",
      "title": "发布后首页正常，旧标签页的报表为什么打不开？",
      "paragraphs": [
        "用户早晨打开订单页，下午服务器发布新版本并删除旧资源。首页刷新没问题，但旧页第一次进入报表时仍请求原来那份懒加载 chunk，得到 404。代码分割把下载成本推迟，也把资源是否仍可用的问题推迟到用户真正使用时。",
        "本篇从源码动态边走到真实产物，再看文件 hash、HTML 与资源缓存如何共同决定版本可用性。前置是 K09-01 的加载与失败、K09-03 的副作用，以及 K06-02 的 HTTP 缓存。只说“加动态 import”和“文件名带 hash”都不能完成这个合同。"
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
      "id": "chunks",
      "title": "动态边把模块执行推迟，chunk 数量由图与配置共同决定",
      "paragraphs": [
        "下面真实构建入口与 feature，入口只导出 load，feature 顶层计数表示模块开始执行。加载入口后计数仍为 0，调用 load 后执行一次，两次得到同一模块命名空间。预期 chunk数:2、入口有动态边:1、调用前:0、调用后:1:结果6:同模块true。",
        "模块系统会缓存本次临时路径下成功执行的模块；不要把这个计数推广成浏览器必定只发一个 HTTP 请求。共享依赖、预加载、缓存与模块图各有责任，最终需要看实际产物关系。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { bundle, runChunks } from './scripts/lib/tooling-fixture.mjs';\nconst output = await bundle({\n  entry: \"export const load = () => import('feature');\",\n  feature: 'globalThis.__authorLoads = (globalThis.__authorLoads ?? 0) + 1; export const run = n => n * 2;'\n});\nconst chunks = output.filter(item => item.type === 'chunk');\nconsole.log('chunk数:' + chunks.length);\nconsole.log('入口有动态边:' + chunks.find(item => item.isEntry).dynamicImports.length);\nglobalThis.__authorLoads = 0;\nawait runChunks(output, async entry => {\n  console.log('调用前:' + globalThis.__authorLoads);\n  const first = await entry.load(); const second = await entry.load();\n  console.log('调用后:' + globalThis.__authorLoads + ':结果' + first.run(3) + ':同模块' + (first === second));\n});\ndelete globalThis.__authorLoads;",
          "expectedOutput": [
            "chunk数:2",
            "入口有动态边:1",
            "调用前:0",
            "调用后:1:结果6:同模块true"
          ],
          "explanation": [
            "产物有入口和一个动态 feature，入口记录一条动态导入边。导入入口没有执行 feature；只有调用 load 才沿动态边加载和执行它。",
            "第二次 load 复用成功模块，结果同一对象且顶层计数不增加。实际界面还需显示加载中、当前失败与可恢复入口，不能把延迟成本丢给一个空白页面。"
          ]
        }
      ]
    },
    {
      "id": "hashes",
      "title": "懒加载模块内容变化，也可能改变引用它的入口 hash",
      "paragraphs": [
        "内容 hash 是构建工具根据产物关联计算的版本名字，并不是只看某个源码文件字节。下面入口源码没变，只把 feature 结果从 old 改成 new；实际输出显示动态资源和引用它的入口名字都变化。预期 子chunk变化:true、引用入口变化:true。",
        "这让新入口指向新资源，但还活着的旧入口依然指向旧名字。hash 提供可区分资源身份，不是 CDN 已刷新、旧文件仍在或发布是原子的证明。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { bundle } from './scripts/lib/tooling-fixture.mjs';\nasync function build(version) {\n  const output = await bundle({ entry: \"export const load=()=>import('feature');\", feature: `export const value='${version}';` },\n    { output: { entryFileNames: 'entry-[hash].js', chunkFileNames: '[name]-[hash].js' } });\n  const entry = output.find(item => item.type === 'chunk' && item.isEntry);\n  return { entry: entry.fileName, child: entry.dynamicImports[0] };\n}\nconst old = await build('old'), next = await build('new');\nconsole.log('子chunk变化:' + (old.child !== next.child));\nconsole.log('引用入口变化:' + (old.entry !== next.entry));",
          "expectedOutput": [
            "子chunk变化:true",
            "引用入口变化:true"
          ],
          "explanation": [
            "feature 的内容变化影响它的产物身份，入口必须改引用路径；该引用参与最终命名，因此入口名字也变。这里核对关系，不把具体 hash 字符串固化为教程输出。",
            "若应用只上传新入口而漏掉新子资源，新页同样打不开。发布应该先让新图的所有资源可用，再切换入口，并按留存策略保护仍会被旧页访问的图。"
          ]
        }
      ]
    },
    {
      "id": "http",
      "title": "实际资源响应证明旧图能否加载，不靠首页一次成功",
      "paragraphs": [
        "下面创建独立本地 HTTP 教学服务，入口用 no-cache，版本资源用长 max-age 与 immutable。模拟切换 HTML 后保留旧资源、删除旧资源，以及错误地把缺失 JS 回退成 HTML。预期 旧资源:200、入口策略:no-cache、旧页仍可加载:200、删除旧资源:404、错误回退:200:text/html。",
        "本例验证真实状态码与响应头，不使用 Node fetch 的结果冒充浏览器 HTTP 缓存命中率，也不模拟 CDN。no-cache 允许存储但要求复用前验证；no-store 则是另一责任。公共哈希资源可长期缓存，个性化 HTML 与数据还需正确的权限和缓存分区。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { createServer } from 'node:http';\nlet version = 'old', keepOld = true, badFallback = false;\nconst server = createServer((request, response) => {\n  const path = new URL(request.url, 'http://127.0.0.1').pathname;\n  if (path === '/entry.html') {\n    response.setHeader('Content-Type', 'text/html'); response.setHeader('Cache-Control', 'no-cache');\n    response.end('<script type=\"module\" src=\"/feature-' + version + '.js\"></script>'); return;\n  }\n  if (path === '/feature-new.js' || (path === '/feature-old.js' && keepOld)) {\n    response.setHeader('Content-Type', 'text/javascript');\n    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');\n    response.end('export const ready=true;'); return;\n  }\n  if (badFallback) { response.setHeader('Content-Type', 'text/html'); response.end('<h1>错误回退</h1>'); }\n  else { response.writeHead(404); response.end('Missing author asset'); }\n});\nawait new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });\nconst origin = 'http://127.0.0.1:' + server.address().port;\ntry {\n  let response = await fetch(origin + '/feature-old.js'); console.log('旧资源:' + response.status); await response.text();\n  response = await fetch(origin + '/entry.html'); console.log('入口策略:' + response.headers.get('cache-control')); await response.text();\n  version = 'new'; response = await fetch(origin + '/feature-old.js'); console.log('旧页仍可加载:' + response.status); await response.text();\n  keepOld = false; response = await fetch(origin + '/feature-old.js'); console.log('删除旧资源:' + response.status); await response.text();\n  badFallback = true; response = await fetch(origin + '/missing.js'); console.log('错误回退:' + response.status + ':' + response.headers.get('content-type')); await response.text();\n} finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }",
          "expectedOutput": [
            "旧资源:200",
            "入口策略:no-cache",
            "旧页仍可加载:200",
            "删除旧资源:404",
            "错误回退:200:text/html"
          ],
          "explanation": [
            "切换版本并不自动删除旧路径，所以保留阶段旧页仍取得 200。删除后同一路径变 404，即使新入口完全正常也无法救活那条旧动态引用。",
            "错误回退返回 200，却给 JS 请求一个 HTML 类型，状态码成功不等于模块可执行。真实服务器应区分资源路径与应用路由回退，核对 MIME、base、跨域与缓存；本例没有让浏览器执行这份错误响应。"
          ]
        }
      ]
    },
    {
      "id": "recovery",
      "title": "恢复策略要区分手写 loader、模块系统与用户草稿",
      "paragraphs": [
        "下面是明确的应用 loader 教学模型，不是 import 的缓存重置 API。第一次失败清除自己持有的 Promise，两个并发重试共享第二次工作。预期 首次:资源不可用、重试:ready:同结果true:次数2。",
        "真实动态 import 的失败可能来自网络、资源删除或模块执行，标准模块缓存行为不能由清空变量推断。遇到新旧图冲突可提示安全刷新，但刷新前要保护用户草稿，不无限循环刷新，也不把任意失败都当成发布过期。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "let promise;\nlet attempts = 0;\nfunction load() {\n  if (!promise) promise = Promise.resolve().then(() => {\n    attempts += 1;\n    if (attempts === 1) throw new Error('资源不可用');\n    return { state: 'ready' };\n  }).catch(reason => { promise = undefined; throw reason; });\n  return promise;\n}\ntry { await load(); } catch (reason) { console.log('首次:' + reason.message); }\nconst [first, second] = await Promise.all([load(), load()]);\nconsole.log('重试:' + first.state + ':同结果' + (first === second) + ':次数' + attempts);",
          "expectedOutput": [
            "首次:资源不可用",
            "重试:ready:同结果true:次数2"
          ],
          "explanation": [
            "应用保留第一次 Promise，失败时解除自己的缓存并把错误交给调用方。随后两个重试在同一轮共享 Promise，实际工作只再启动一次。",
            "这个可控模型验证应用状态恢复，不证明浏览器清空了失败模块记录。生产分类错误并提供返回、重试或保护草稿后的刷新，恢复动作必须有次数和用户状态边界。"
          ]
        }
      ]
    },
    {
      "id": "boundaries",
      "title": "分割、预加载与资源留存一起按用户路径验收",
      "paragraphs": [
        "低频重功能可作为动态边，核心小依赖不必为了源文件整齐强行拆成独立 chunk。构建 manifest 与产物依赖决定引用图，预取应按真实访问概率；预取所有功能会提前消耗本想推迟的下载成本。",
        "第一条边界是旧会话：保留多久取决于页面寿命、资源存储成本和更新机制。第二条边界是缓存键与地址：hash 名称只有与正确路径、响应字节与 MIME 一起才有意义；不可变地址不能被后来覆盖成不同内容。",
        "第三条边界是跨缓存系统。HTTP 缓存、Service Worker Cache Storage、页面内 Promise 和模块记录不是同一份缓存，清理一个不能保证其他都更新。本篇真实验证 Rolldown 与本地 HTTP，不验收真实 CDN、Service Worker 更新或浏览器缓存时序。"
      ]
    },
    {
      "id": "practice",
      "title": "从旧 HTML 出发走一次晚发生的加载",
      "paragraphs": [
        "保存旧入口引用，发布新图后才点击懒加载；分别验证旧资源保留、缺失、错误 MIME 与受控恢复。再改一个共享依赖，检查影响了哪些引用和 hash，不通过源码文件数量猜 chunk 数。",
        "本主题暂无独立已开放编码题。交付检查应覆盖新标签与旧会话、空数据、加载失败和草稿恢复，而不是只在缓存热的开发服务器里点击一次。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Vite：Production Build",
      "url": "https://vite.dev/guide/build"
    },
    {
      "title": "Vite：Backend Integration",
      "url": "https://vite.dev/guide/backend-integration"
    },
    {
      "title": "Rolldown：Output Options",
      "url": "https://rolldown.rs/reference/Interface.OutputOptions"
    },
    {
      "title": "MDN：Cache-Control",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control"
    }
  ]
};
