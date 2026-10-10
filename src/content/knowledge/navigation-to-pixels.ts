import type { Article } from "../articles";

export const navigationToPixelsArticle: Article = {
  "id": "K04-01",
  "kind": "knowledge",
  "domainSlug": "browser",
  "slug": "navigation-to-pixels",
  "title": "从导航到页面呈现",
  "summary": "DNS、连接、响应、解析、样式与绘制分别做什么。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "navigation-to-pixels",
    "从导航到页面呈现"
  ],
  "tags": [
    "browser"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "HTML 已经返回，为什么屏幕仍是空白？",
      "paragraphs": [
        "打开商品详情时，服务器很快返回 HTML，首屏却迟迟不出现。把全部时间记作接口耗时会误导排查：连接建立、HTML 解析、样式下载、脚本执行、字体和图片都可能影响呈现。要先把导航到像素的过程拆成可观察的阶段。",
        "本文浏览器代码可独立在控制台执行。我们用本地 DOM 与资源计时演示平台行为，不假装一个脚本能够复现 DNS 或网络协议握手。真实瓶颈要用浏览器 Network 与 Performance 面板记录，并在相同网络和设备条件下比较。"
      ],
      "examples": [
        {
          "code": "const parsed = new DOMParser().parseFromString('<main><h1>商品</h1><p>价格</p></main>', 'text/html');\nconsole.log(parsed.querySelector('h1').textContent);\nconsole.log(parsed.querySelectorAll('main > *').length);",
          "expectedOutput": [
            "商品",
            "2"
          ],
          "explanation": [
            "输入字节经过 HTML 解析成为树，h1 是 main 的第一个元素孩子。DOMParser 的独立文档不会被绘制；拥有 DOM 结构不等于屏幕已经出现像素。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "connection",
      "title": "导航先取得响应，但不保证每次重做全部步骤",
      "paragraphs": [
        "浏览器按 URL 判断协议与目标，在需要时进行名字解析、建立连接和安全握手，再发出 HTTP 请求。连接复用、缓存、Service Worker 与不同 HTTP 版本会改变路径。因此不能看到一个资源就断言它一定重新 DNS、TCP 和 TLS。",
        "服务器可能在完整页面生成前发送部分响应。HTML 流式解析可以先建立前部节点并发现后续资源；总下载结束不一定是首屏出现的起点。反过来，响应头已经到达也不代表正文可用。比较 TTFB、响应下载与绘制时，要说明测量的起止点。",
        "重定向是额外跳转，可能引入连接和请求成本。缓存命中则可能减少网络工作。诊断时从最终文档的请求链开始，而不是只看某一个 API 的 duration。"
      ]
    },
    {
      "id": "parsing",
      "title": "解析发现资源，脚本又可能改变解析进度",
      "paragraphs": [
        "HTML 解析器逐步构造 DOM，遇到图片、样式和脚本会触发资源发现。传统没有 async 或 defer 的外部脚本通常阻塞解析；defer 脚本在解析结束后执行且保持文档顺序；async 在下载就绪后执行，不能依赖它与其他脚本的顺序。模块脚本也有自己的依赖与延后执行规则。",
        "样式不只是装饰。CSSOM 给出规则，浏览器将规则应用到相关元素，决定可见节点和样式。脚本如果读取几何信息，可能要求当前样式与布局先完成，因此样式下载还可能间接延迟脚本与文档进度。"
      ]
    },
    {
      "id": "rendering",
      "title": "从 DOM 到布局，再到绘制和合成",
      "paragraphs": [
        "计算样式决定每个元素使用的属性；布局计算尺寸与位置；绘制把边框、文字等变成绘制指令；合成组合可独立处理的图层。过程可能反复发生，而不是每个导航只能执行一次。加载字体、图片尺寸变化和脚本更新都会触发后续工作。"
      ],
      "examples": [
        {
          "code": "const box = document.createElement('div');\nbox.style.cssText = 'position:absolute;width:120px;height:30px;box-sizing:border-box;padding:10px';\ndocument.body.append(box);\nconsole.log(Math.round(box.getBoundingClientRect().width));\nbox.style.display = 'none';\nconsole.log(box.getBoundingClientRect().width);\nbox.remove();",
          "expectedOutput": [
            "120",
            "0"
          ],
          "explanation": [
            "附加节点后读取宽度要求浏览器给出布局结果，border-box 把 padding 包含在 120px 中。display:none 后节点仍在 DOM，却不生成可见布局盒，因此宽度为零；DOM 与布局树不是同一对象。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "events",
      "title": "加载事件回答资源状态，不直接回答体验",
      "paragraphs": [
        "DOMContentLoaded 表示文档解析及相应延后脚本执行阶段结束，load 等待更多依赖资源。它们不等同于最大内容出现，也不保证界面已经可响应。一个页面可能很早触发事件但接着运行长任务，用户点击仍迟钝。"
      ],
      "examples": [
        {
          "code": "const stages = ['response', 'parse', 'style', 'layout', 'paint'];\nconst mark = stages.map((name, index) => ({ name, duration: (index + 1) * 5 }));\nconsole.log(mark.reduce((sum, stage) => sum + stage.duration, 0));\nconsole.log(mark.filter(stage => stage.duration >= 20).map(stage => stage.name).join(','));",
          "expectedOutput": [
            "75",
            "layout,paint"
          ],
          "explanation": [
            "这是原创的阶段数据分析模型：五个耗时相加为 75，阈值筛选得到布局与绘制。它说明如何从阶段证据找候选瓶颈，不代表真实浏览器一定串行耗时或有这些固定数字。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "错误优化：接口更快了，首屏仍没改善",
      "paragraphs": [
        "若最大内容是一张大图，缩短一个非关键统计请求可能不影响首屏。先在记录中找到决定首屏的资源，确认是发现过晚、下载过慢还是解码与渲染推迟，再选择提前发现、优化体积或减轻主线程工作。",
        "把所有脚本改为 async 也可能破坏依赖顺序。独立统计脚本可以异步；依赖 DOM 或其他脚本的代码需明确执行合同。修复不能只根据一个标签属性判断，要验证事件、错误和用户核心操作。"
      ]
    },
    {
      "id": "boundaries",
      "title": "两条边界与工程取舍",
      "paragraphs": [
        "第一条边界是跨源计时可见性。Performance API 的部分细节受来源与 Timing-Allow-Origin 限制，零值不一定意味着没有耗时。第二条边界是后台标签和不同设备：调度、CPU、缓存状态会改变观察结果，单次桌面测量不能代表所有用户。",
        "预加载能让关键资源更早发现，但错误地预加载大量次要资源会竞争带宽。SSR 能提早提供结构，但水合与客户端脚本仍有成本。每个优化都要解释改善哪条关键路径，并监测是否把成本转移到其他用户操作。"
      ]
    },
    {
      "id": "recall",
      "title": "遇到空白页面怎样建立证据",
      "paragraphs": [
        "先确认文档请求与重定向，再检查关键样式、脚本和可见资源的发现时间，最后对照主线程轨迹与首屏内容。保留记录、设备条件和变更前后结果，不用猜测来替代测量。",
        "回忆：为什么有 DOM 不代表有可见盒？为什么 load 比接口结束更晚仍不足以证明卡顿原因？可把上文盒子的 visibility 改为 hidden，观察它仍保留布局尺寸，与 display:none 对照。"
      ]
    }
  ],
  "sources": [
    {
      "title": "MDN：浏览器工作过程",
      "url": "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work"
    },
    {
      "title": "MDN：关键渲染路径",
      "url": "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path"
    }
  ]
};
