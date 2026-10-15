import type { Article } from "../articles";

export const bundleAnalysisArticle: Article = {
  id: "K10-06",
  kind: "knowledge",
  domainSlug: "performance",
  slug: "bundle-analysis-and-dependencies",
  title: "包体分析与依赖治理",
  summary: "用固定模块的真实构建比较重依赖和重复副本，并把传输变小与初始解析变小分成两种不同收益。",
  aliases: ["bundle", "duplicate dependency", "包体", "依赖治理", "parse"],
  tags: ["性能工程", "包体分析与依赖治理"],
  estimatedMinutes: 24,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "依赖已经装进页面，为什么压缩包变小却不一定更早可交互？",
      paragraphs: [
        "订单页同时引入了两份几乎相同的格式化函数，因为左右两个模块各自依赖了一个拷贝。另一轮优化只把传输体积从 200 个单位压到 80，需要解析和执行的代码仍是 200。用户等待的可能是下载，也可能是主线程解析和执行；只看构建器报告的一个字节数，无法知道改动打中了哪一段。",
        "本篇接续 K09-03 的 tree shaking、K09-05 的代码分割，以及 K10-03 的首屏路径。真实构建使用仓库已安装的 Rolldown 1.2.11，只打包固定作者模块。传输和解析模型中的数字是作者给定的计数，不是这次构建的字节，也不换算成加载时间。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：Rolldown 打包固定模块，计数模型单独运行",
      paragraphs: [
        "运行 npm run verify:k10。Node 示例从仓库根目录导入 scripts/lib/tooling-fixture.mjs，在临时目录生成并执行产物，结束后清理。不要在主站控制台运行这段 import。浏览器示例只运行后面的计数函数。",
        "产物是否包含某个标记、以及两份依赖的产物是否更大，是本篇要核对的事实。Rolldown 升级后包装代码可能变化；比较使用的是相对大小和标记是否存在，不锁定总字节数。构建没有启用压缩，因此字符长度不是线上 gzip 体积。"
      ]
    },
    {
      id: "measure",
      title: "被执行的重模块会留下标记，两份拷贝不会合成一份",
      paragraphs: [
        "第一组让入口调用 chart.draw。轻入口只有 export const value = 4。重模块返回以 CHART_AUTHOR_MARKER 开头、并拼接 240 个 Y 的字符串。预期重模块的产物字符数更大、标记保留、运行结果以前缀开头。",
        "第二组里 left 和 right 都要格式化数字。重复版本分别依赖 util-a 与 util-b，源码各含 PAD_A_AUTHOR 和 PAD_B_AUTHOR 一次，产物更大，运行值同时包含两次调用的前缀。共享版本让两边依赖同一个 util，源码里 PAD_S_AUTHOR 只出现一次，但运行值里仍有两次调用。预期 重复更大:true、重复源码:1:1、共享源码:1、重复调用:true:true、共享调用:2。"
      ],
      examples: [
        {
          language: "node",
          code: "import { bundle, runChunks } from './scripts/lib/tooling-fixture.mjs';\nfunction size(output) {\n  return output.filter(item => item.type === 'chunk').reduce((sum, item) => sum + item.code.length, 0);\n}\nfunction codeOf(output) {\n  return output.filter(item => item.type === 'chunk').map(item => item.code).join('\\n');\n}\nconst count = (code, marker) => code.split(marker).length - 1;\nconst light = await bundle({ entry: 'export const value = 4;' });\nconst heavy = await bundle({\n  entry: \"import { draw } from 'chart'; export const value = draw();\",\n  chart: \"export const draw = () => 'CHART_AUTHOR_MARKER' + 'Y'.repeat(240);\"\n});\nconst heavyCode = codeOf(heavy);\nconsole.log('重模块更大:' + (size(heavy) > size(light)));\nconsole.log('标记保留:' + heavyCode.includes('CHART_AUTHOR_MARKER'));\nawait runChunks(heavy, module => console.log('运行:' + String(module.value).startsWith('CHART_AUTHOR_MARKER')));\nconst pad = marker => \"export const pad = n => '\" + marker + \"' + n + '\" + 'Z'.repeat(180) + \"';\";\nconst duplicated = await bundle({\n  entry: \"import { format } from 'left'; import { format as other } from 'right'; export const value = format(1) + other(1);\",\n  left: \"import { pad } from 'util-a'; export const format = n => pad(n);\",\n  right: \"import { pad } from 'util-b'; export const format = n => pad(n);\",\n  'util-a': pad('PAD_A_AUTHOR'),\n  'util-b': pad('PAD_B_AUTHOR')\n});\nconst single = await bundle({\n  entry: \"import { format } from 'left'; import { format as other } from 'right'; export const value = format(1) + other(1);\",\n  left: \"import { pad } from 'util'; export const format = n => pad(n);\",\n  right: \"import { pad } from 'util'; export const format = n => pad(n);\",\n  util: pad('PAD_S_AUTHOR')\n});\nconst dupCode = codeOf(duplicated);\nconst singleCode = codeOf(single);\nconsole.log('重复更大:' + (size(duplicated) > size(single)));\nconsole.log('重复源码:' + count(dupCode, 'PAD_A_AUTHOR') + ':' + count(dupCode, 'PAD_B_AUTHOR'));\nconsole.log('共享源码:' + count(singleCode, 'PAD_S_AUTHOR'));\nawait runChunks(duplicated, module => console.log('重复调用:' + module.value.startsWith('PAD_A_AUTHOR1') + ':' + module.value.includes('PAD_B_AUTHOR1')));\nawait runChunks(single, module => console.log('共享调用:' + (module.value.split('PAD_S_AUTHOR1').length - 1)));",
          expectedOutput: [
            "重模块更大:true",
            "标记保留:true",
            "运行:true",
            "重复更大:true",
            "重复源码:1:1",
            "共享源码:1",
            "重复调用:true:true",
            "共享调用:2"
          ],
          explanation: [
            "重模块被入口调用，所以标记和长字符串进入产物，字符数大于什么都不做的轻入口。未被引用的导出不一定留下；这里 draw 确实被调用，不能把结果理解成任意大文件都会被打包。",
            "两份 util 的模块 id 不同，产物同时保留 PAD_A_AUTHOR 和 PAD_B_AUTHOR，总体更大。共享 util 的标记在源码产物里只有一处，运行两次只说明函数执行了两次，不说明依赖被复制了两次。"
          ]
        }
      ]
    },
    {
      id: "benefit",
      title: "传输减少和初始解析减少要分开记账",
      paragraphs: [
        "下面四个非负整数分别是改动前后的传输量和初始解析量。两者都下降为 both，只有传输下降为 transfer-only，只有解析下降为 parse-only，都没有下降为 none，任一输入不是非负整数为 invalid。预期 transfer-only、parse-only、both、none、invalid。",
        "压缩或更好的编码可能只减少传输。把一个大模块移出首屏入口，可能减少初始解析，但用户打开对应功能时仍要下载它。两个数都不变或变大，就没有这条模型所定义的收益。模型不测量解析耗时，也不把单位当成毫秒。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function benefit(transferBefore, transferAfter, parseBefore, parseAfter) {\n  const values = [transferBefore, transferAfter, parseBefore, parseAfter];\n  if (values.some(value => !Number.isSafeInteger(value) || value < 0)) return 'invalid';\n  const transfer = transferBefore - transferAfter;\n  const parse = parseBefore - parseAfter;\n  if (transfer > 0 && parse > 0) return 'both';\n  if (transfer > 0) return 'transfer-only';\n  if (parse > 0) return 'parse-only';\n  return 'none';\n}\nconsole.log(benefit(200, 80, 200, 200));\nconsole.log(benefit(200, 200, 200, 40));\nconsole.log(benefit(200, 80, 200, 40));\nconsole.log(benefit(80, 200, 40, 40));\nconsole.log(benefit(-1, 0, 0, 0));",
          expectedOutput: ["transfer-only", "parse-only", "both", "none", "invalid"],
          explanation: [
            "200 到 80 的传输差是正数，解析差是 0，所以只有传输收益。解析从 200 到 40 而传输不变，则只记录解析收益。两者同时变小才是 both。",
            "改动后传输反而从 80 增到 200，函数返回 none，不允许只挑选变好的那一项汇报。负数不是合法测量，直接 invalid。"
          ]
        }
      ]
    },
    {
      id: "choice",
      title: "先找首屏真正执行的大块，再决定删除、共享或延后",
      paragraphs: [
        "分析顺序是：确认这个字节属于哪个路由的初始加载，确认它是否真的执行，再看同一功能是不是以不同版本出现了两次。重复的格式化函数应收敛到一个依赖。只在报表路由使用的图表，应从订单首页入口移走，而不是为了首页指标把图表从产品里删掉。",
        "barrel 文件若被命名空间导入，未使用的导出仍可能保留；K09-03 已用动态选择演示过这个边界。包体分析要打开产物搜索标记，不能只看依赖清单里有没有这个包名。",
        "锁文件能说明安装的是哪一个版本，不能说明两个包里的相同源码会被构建器合并。版本号不同或模块路径不同时，应预期它们同时存在，除非产物证明已经只剩一份。"
      ]
    },
    {
      id: "boundaries",
      title: "字符数、gzip 和可交互时间不是同一个测量",
      paragraphs: [
        "本篇的 size 比较的是未压缩产物的 JavaScript 字符长度。gzip 或 brotli 之后的网络字节可能排序不同。解析和执行还受 CPU、缓存以及代码是否在首屏路径上影响。字符数变小只证明这份固定产物更短。",
        "延后加载把成本移到下一次交互。首页的 transfer 下降时，报表按钮的等待可能上升。记录收益时要写明页面和动作。只比较首页、却把整次会话说成变快，超出了证据范围。",
        "依赖治理还包括安全补丁和许可证。本篇的重复检测不能发现有漏洞但只出现一次的依赖，也不能因为一份拷贝更小就留下旧版本。"
      ]
    },
    {
      id: "practice",
      title: "用标记确认目标代码，再用前后计数选择依据",
      paragraphs: [
        "给怀疑的依赖加一个只在该依赖中出现的固定标记，构建后确认标记在不在首屏产物里，并看共享依赖后标记是一份还是两份。然后分别记录传输和初始解析的前后值。只有一项下降时，结论就只覆盖那一项。",
        "没有已开放的包体练习。不要把本次 Rolldown 字符差写成所有项目的百分比。"
      ]
    }
  ],
  sources: [
    { title: "web.dev：Reduce JavaScript payloads with code splitting", url: "https://web.dev/articles/reduce-javascript-payloads-with-code-splitting" },
    { title: "MDN：rel=preload", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload" }
  ]
};
