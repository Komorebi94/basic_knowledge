import type { Article } from "../articles";

export const sourceMapsDebuggingArticle: Article = {
  "id": "K09-07",
  "kind": "knowledge",
  "domainSlug": "tooling",
  "slug": "source-maps-and-production-debugging",
  "title": "Source map 与线上排查",
  "summary": "实际生成并查询源码映射，从产物身份、坐标换算和日志最小化出发，建立可复现的线上错误排查流程。",
  "aliases": [
    "source map",
    "symbolication",
    "线上排查",
    "错误堆栈"
  ],
  "tags": [
    "工程化",
    "Source map 与线上排查"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-13",
  "sections": [
    {
      "id": "problem",
      "title": "同一行压缩代码报错，怎样找到用户实际运行的源码？",
      "paragraphs": [
        "线上堆栈指向构建文件第三行，开发分支同位置却没有错误。问题可能不是映射器失效，而是拿新版本 map 查询旧产物。先明确用户运行的资源身份，再谈源码位置，否则一个看起来合理的行号会把排查带到错误分支。",
        "本篇接续 K09-04 的转换和 K09-05 的版本资源。Source map 描述生成代码位置与原始位置的对应关系，不重放请求、不记录变量值，也不证明所映射源码中的业务逻辑就是根因。"
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
      "id": "coordinates",
      "title": "真实映射：先区分人读坐标与 API 的零基坐标",
      "paragraphs": [
        "下面真实构建一个固定函数，在产物中找到 throw 的位置，再用 Node SourceMap 查询。预期 原始行:2、原始列:3、对应入口:true；这里输出给人的行列加一，findEntry 的输入与结果使用零基坐标。",
        "映射可能是稀疏的，查询结果关联最近的映射段，并非每一个生成字符都有独立原始字符。不要靠猜测压缩文件的行号，先保存生成文件和错误的精确坐标；本例主动定位 throw，不把手动字符串定位冒充生产堆栈采集。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { SourceMap } from 'node:module';\nimport { bundle } from './scripts/lib/tooling-fixture.mjs';\nconst output = await bundle({ entry: 'export function fail() {\\n  throw new Error(\"AUTHOR_FAILURE\");\\n}' }, { output: { sourcemap: 'hidden' } });\nconst chunk = output.find(item => item.type === 'chunk');\nconst position = chunk.code.indexOf('throw new Error');\nif (position < 0 || !chunk.map) throw new Error('Missing author mapping');\nconst before = chunk.code.slice(0, position).split('\\n');\nconst entry = new SourceMap(JSON.parse(chunk.map.toString())).findEntry(before.length - 1, before.at(-1).length);\nconsole.log('原始行:' + (entry.originalLine + 1));\nconsole.log('原始列:' + (entry.originalColumn + 1));\nconsole.log('对应入口:' + entry.originalSource.endsWith('entry'));",
          "expectedOutput": [
            "原始行:2",
            "原始列:3",
            "对应入口:true"
          ],
          "explanation": [
            "产物的 throw 映射回固定入口第二行缩进后的第三列。这里使用实际 Rolldown map 和 Node 查询结果，不用一个手写位置表代替工具。",
            "若转译插件改了代码却不返回有效 map，后续工具无法自动恢复丢失的关系。多步转换应传递并组合映射，失败时核对各阶段、原始源路径以及部署产物，而非只改最后的行列偏移。"
          ]
        }
      ]
    },
    {
      "id": "exposure",
      "title": "hidden 与删除 sourcesContent 分别改变什么？",
      "paragraphs": [
        "下面比较普通外部 map 与 hidden 且排除源内容的产物。预期 普通注释:true、隐藏注释:false、隐藏仍有map:true、没有源正文:true。hidden 只省略代码中的 sourceMappingURL 注释，生成的 map 仍然存在。",
        "排除 sourcesContent 减少直接携带源码正文，但 map 还可能暴露路径和名字；如果把它上传到可公开猜测的地址，隐藏注释不是访问控制。需要在线符号化的场景应按实际需要保存对应源码与 map，并控制访问、留存和上传权限。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { bundle } from './scripts/lib/tooling-fixture.mjs';\nconst modules = { entry: 'export const answer = 42;' };\nconst normal = (await bundle(modules, { output: { sourcemap: true } })).find(item => item.type === 'chunk');\nconst hidden = (await bundle(modules, { output: { sourcemap: 'hidden', sourcemapExcludeSources: true } })).find(item => item.type === 'chunk');\nconst map = JSON.parse(hidden.map.toString());\nconsole.log('普通注释:' + normal.code.includes('sourceMappingURL'));\nconsole.log('隐藏注释:' + hidden.code.includes('sourceMappingURL'));\nconsole.log('隐藏仍有map:' + Boolean(hidden.map));\nconsole.log('没有源正文:' + (!map.sourcesContent || map.sourcesContent.every(value => value == null)));",
          "expectedOutput": [
            "普通注释:true",
            "隐藏注释:false",
            "隐藏仍有map:true",
            "没有源正文:true"
          ],
          "explanation": [
            "普通模式给代码写入映射引用；hidden 保留映射对象而省略这条引用。排除正文的独立选项控制 sourcesContent，两者职责不同。",
            "错误平台能否取得原始源码取决于上传和查找配置，本例只核对生成结果，没有接入任何监控服务，也没有证明公开部署后 map 不可访问。"
          ]
        }
      ]
    },
    {
      "id": "identity",
      "title": "先选正确产物，再查 map：错误版本应拒绝解释",
      "paragraphs": [
        "下面用真实摘要实现一个明确的配对教学模型：记录构建代码摘要以及与之配对的 map 身份，查询前对照错误所属版本和资源字节。预期 正确配对:map-r1、拒绝:产物不匹配。",
        "摘要用于判断字节相同，不证明可信来源。记录应在受信构建中产生并与提交、产物路径、map 一起保留；若随意重新构建后上传一个同名 map，文件名相同也无法证明是原来的转换结果。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { createHash } from 'node:crypto';\nconst digest = code => createHash('sha256').update(code).digest('hex');\nconst record = { release: 'r1', artifactDigest: digest('author-code-r1'), map: 'map-r1' };\nfunction selectMap(release, code) {\n  if (release !== record.release || digest(code) !== record.artifactDigest) throw new Error('产物不匹配');\n  return record.map;\n}\nconsole.log('正确配对:' + selectMap('r1', 'author-code-r1'));\ntry { selectMap('r1', 'author-code-r2'); } catch (reason) { console.log('拒绝:' + reason.message); }",
          "expectedOutput": [
            "正确配对:map-r1",
            "拒绝:产物不匹配"
          ],
          "explanation": [
            "字节与版本都吻合才返回保存的映射标识，代码变化即使 release 标签没改也会拒绝。真实映射查询在前两个实验，本例只验证身份门禁。",
            "生产还需绑定 map 本身摘要与构建来源，并考虑 CDN 内容改写、上传遗漏、资源被覆盖和多版本并存。不能用宽松兜底 map 生成一个误导性源码位置。"
          ]
        }
      ]
    },
    {
      "id": "evidence",
      "title": "记录最小诊断证据，不把请求正文与身份凭证塞入堆栈",
      "paragraphs": [
        "日志要能关联版本、错误类别、资源与发生阶段，但不需要完整 URL 查询串、请求头、用户正文。下面固定白名单只取 release、routePattern、errorCode 三项；预期 字段:release,routePattern,errorCode、包含凭证:false。输入是作者测试标签，不含真实凭证。",
        "白名单只是这个示例的最小规则，不等于通用隐私处理器。允许字段也要验证长度与取值来源，例如路由模板由程序提供，不能直接把包含用户标识的 pathname 改名后放进去。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "const input = { release: 'r1', routePattern: '/orders/:id', errorCode: 'CHUNK_LOAD', authorization: 'AUTHOR_PRIVATE_MARKER', query: '?search=AUTHOR_PRIVATE_MARKER' };\nconst allowed = ['release', 'routePattern', 'errorCode'];\nconst event = Object.fromEntries(allowed.map(key => [key, input[key]]));\nconsole.log('字段:' + Object.keys(event).join(','));\nconsole.log('包含凭证:' + JSON.stringify(event).includes('AUTHOR_PRIVATE_MARKER'));",
          "expectedOutput": [
            "字段:release,routePattern,errorCode",
            "包含凭证:false"
          ],
          "explanation": [
            "新对象只包含三个显式字段，没有展开原始输入，因此测试标记不进入输出。不要在 catch 中无条件序列化整份错误上下文。",
            "真正的遥测入口还应拒绝超长字段、过滤允许字段里的个人信息并设置留存与权限。本例验证选择字段的机制，不验收真实日志平台或匿名化算法。"
          ]
        }
      ]
    },
    {
      "id": "workflow",
      "title": "从现象到根因的证据顺序",
      "paragraphs": [
        "首先记录影响版本、资源地址、生成坐标、发生时机与可复现路径，确认是资源加载失败、解析失败还是模块执行失败。随后用相同部署产物及其 map 找到源码位置，连同网络响应、状态转换和输入边界定位问题。",
        "复现环境应接近用户实际版本和配置；新分支源码成功不证明旧版本无问题。修复之后分别验证触发路径和恢复路径，保证重复请求、草稿保留与错误提示没有新回归，再将修复纳入发布门禁。"
      ]
    },
    {
      "id": "boundaries",
      "title": "映射能解释位置，不能凭空恢复运行事实",
      "paragraphs": [
        "转换链缺 map、错误坐标格式、部署中二次改写文件、旧版本证据过期都可能让映射错误。排查应暴露这些缺口，不把“有 map 文件”当作每次符号化都正确。",
        "源码位置只是定位入口：异步任务的起点、用户状态、请求结果与依赖版本需要其他证据。某个异常行可能只是防御性报错，真正根因在上游错误数据或失效资源。此处没有执行线上监控上传、真实用户数据采集或压缩后性能比较。"
      ]
    },
    {
      "id": "practice",
      "title": "故意错配一次映射，再解释为什么应中断",
      "paragraphs": [
        "保留 r1 代码与 map，生成 r2 后用 r1 的失败坐标去查；先使用摘要门禁阻止错配，再比较正确映射。把 sourceMappingURL 去掉但保留公开 map 路径，说明隐藏注释为什么不代表源码保密。",
        "本主题暂无独立已开放编码题。复现材料应记录工具版本、产物和 map 的身份及坐标约定，并给出正确与失败配对结果，不只附一张看起来有源码行号的截图。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Rolldown：Source map",
      "url": "https://rolldown.rs/reference/OutputOptions.sourcemap"
    },
    {
      "title": "Node：SourceMap API",
      "url": "https://nodejs.org/api/module.html"
    }
  ]
};
