import type { Article } from "../articles";

export const criticalResourcesArticle: Article = {
  id: "K10-03",
  kind: "knowledge",
  domainSlug: "performance",
  slug: "critical-resources",
  title: "首屏与关键资源",
  summary: "从主图发现太晚出发，说明预加载、阻塞脚本、字体显示和带宽排队如何改变首屏路径，并区分教学模型与真实浏览器调度。",
  aliases: ["LCP", "preload", "font-display", "关键资源", "首屏"],
  tags: ["性能工程", "首屏与关键资源"],
  estimatedMinutes: 24,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "主图文件并不大，首屏为什么还是要等？",
      paragraphs: [
        "订单页的主图只有几十 KB，实验室里的下载时间也不长。用户看到的却是一段空白：浏览器先下载并执行头部的阻塞脚本，解析到正文后才知道主图地址；另一版把主图写成 CSS 背景，查找 img 的检查根本看不到这个 URL。文件大小只解释下载阶段，不能解释浏览器何时才知道要下载它。",
        "本篇接续 K10-01 的 LCP 与 K10-02 的主线程。LCP 元素可能是图片、视频海报或文本块。这里沿用一张订单主图和一段标题字体，把发现、阻塞、字体首次绘制和单队列带宽拆开。时间数字都是作者规定的模型单位，不是某次 Chrome 轨迹里的毫秒。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：空白页解析固定 HTML，其余是可计算模型",
      paragraphs: [
        "运行 npm run verify:k10。DOMParser 示例在隔离空白页执行，只解析仓库里的固定字符串，不请求 hero.jpg，也不测量网络。其余示例是同步函数，浏览器或 Node 都能得到相同输出。",
        "模型故意省略 HTTP/2 优先级、预加载扫描器、缓存和主线程长任务。某个模型结果变小，只说明这条作者规则下的完成单位变小，不能写成 LCP 下降了多少毫秒，更不能代替真实用户数据。"
      ]
    },
    {
      id: "discovery",
      title: "元素选择器找不到 CSS 背景里的主图",
      paragraphs: [
        "下面用 DOMParser 解析两份固定 HTML。第一份在 head 里预加载主图，正文有 img。第二份只有一条 background url，可见区域是 div。预期 preload,img,no-css-url 与 no-preload,no-img,css-url。",
        "这只证明完整字符串解析后的 DOM 形状。DOMParser 一次性解析整段文本，不会复现流式解析中“解析到一半才发现图片”的时刻，也不会发起请求。预加载扫描器在真实浏览器里还可能提前看到 body 中的 img；本例没有实现扫描器。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function classify(html) {\n  const doc = new DOMParser().parseFromString(html, 'text/html');\n  const preload = doc.querySelector('link[rel=\"preload\"][as=\"image\"]') ? 'preload' : 'no-preload';\n  const img = doc.querySelector('img[src]') ? 'img' : 'no-img';\n  const style = doc.querySelector('style')?.textContent ?? '';\n  const background = /url\\(([^)]+)\\)/.test(style) ? 'css-url' : 'no-css-url';\n  return [preload, img, background].join(',');\n}\nconst withImage = '<!doctype html><html><head><link rel=\"preload\" as=\"image\" href=\"/hero.jpg\"></head><body><img src=\"/hero.jpg\"></body></html>';\nconst backgroundOnly = '<!doctype html><html><head><style>.hero{background:url(/hero.jpg)}</style></head><body><div class=\"hero\"></div></body></html>';\nconsole.log(classify(withImage));\nconsole.log(classify(backgroundOnly));",
          expectedOutput: ["preload,img,no-css-url", "no-preload,no-img,css-url"],
          explanation: [
            "第一份同时具有 preload 链接和 img，选择器都能命中。第二份的 URL 只出现在样式表文本里，img 选择器没有目标，所以只靠“页面上有没有 img”会漏掉这张主图。",
            "把背景改成 img，或让预加载地址和最终图像地址指向同一张图，才谈得上提前发现。选择器结果不是 LCP 候选算法；真实 LCP 还要看尺寸、可见性和绘制时间。"
          ]
        }
      ]
    },
    {
      id: "blocking",
      title: "阻塞脚本会推迟发现，预加载可以从 0 开始下载",
      paragraphs: [
        "下面的发现模型按事件顺序推进解析位置。blocking-script 把解析时钟增加 cost；image 若还没开始，就在当前解析时钟开始，完成时间是开始加上下载 cost。preload 把开始时间定为 0，但不代替 image 的下载成本。async-script 不推进解析时钟。没有 image 时结果是 undiscovered。预期 晚发现:70、预加载:40、异步脚本:40、只有样式:undiscovered、非法:invalid。",
        "70 等于脚本 30 加上图片 40：图片在脚本结束后才知道地址。预加载让同一张 40 单位的图片从 0 开始，阻塞脚本不再决定它的起点。异步脚本即使标了 30，也不挡住后续 image。负数成本直接拒绝，避免一条坏数据把时钟倒回。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function lcpReady(events) {\n  let parser = 0;\n  let imageStart = null;\n  let imageCost = null;\n  for (const event of events) {\n    if (event.type === 'blocking-script' || event.type === 'image' || event.type === 'async-script') {\n      if (!Number.isFinite(event.cost) || event.cost < 0) return 'invalid';\n    }\n    if (event.type === 'preload') imageStart = 0;\n    else if (event.type === 'blocking-script') parser += event.cost;\n    else if (event.type === 'image') {\n      imageStart = imageStart ?? parser;\n      imageCost = event.cost;\n    } else if (event.type === 'async-script') {\n      /* 异步脚本不挡住解析。 */\n    } else return 'invalid';\n  }\n  if (imageStart === null || imageCost === null) return 'undiscovered';\n  return String(imageStart + imageCost);\n}\nconsole.log('晚发现:' + lcpReady([{ type: 'blocking-script', cost: 30 }, { type: 'image', cost: 40 }]));\nconsole.log('预加载:' + lcpReady([{ type: 'preload' }, { type: 'blocking-script', cost: 30 }, { type: 'image', cost: 40 }]));\nconsole.log('异步脚本:' + lcpReady([{ type: 'async-script', cost: 30 }, { type: 'image', cost: 40 }]));\nconsole.log('只有样式:' + lcpReady([{ type: 'blocking-script', cost: 30 }]));\nconsole.log('非法:' + lcpReady([{ type: 'image', cost: -1 }]));",
          expectedOutput: ["晚发现:70", "预加载:40", "异步脚本:40", "只有样式:undiscovered", "非法:invalid"],
          explanation: [
            "预加载把 imageStart 固定为 0，后面的 image 保留已有起点，只用自己的 cost。因此阻塞脚本仍会占用解析时间，但不再推迟这张已经开始的图片。",
            "async 分支没有把 cost 加到 parser 上，所以图片起点仍是 0。只有样式背景时模型没有 image 事件，不能假装已经发现主图。这个时钟不是浏览器的预加载扫描器，也没有并行连接限制。"
          ]
        }
      ]
    },
    {
      id: "fonts",
      title: "字体策略决定文字何时出现，而不只是字体文件何时到达",
      paragraphs: [
        "标题若是 LCP，文字自己的绘制时间就进入关键路径。下面按 CSS Fonts 对 font-display 的块周期和交换周期建模：block 为 3s 与无限交换，swap 为 0s 与无限交换，fallback 为 100ms 与 3s，optional 为 100ms 与 0。到达时间落在块周期内就等到字体再画；交换周期为 0 时，错过块周期就保留后备字体。预期 swap:paint:0,fallback-then-swap:400、optional晚:paint:100,fallback-kept、optional早:paint:50,font、block早:paint:400,font、block晚:paint:3000,fallback-then-swap:5000、fallback中:paint:100,fallback-then-swap:200、fallback晚:paint:100,fallback-kept、非法:invalid。",
        "单位沿用规范里的毫秒周期，但输入是作者给定的到达时间，不是一次字体请求的测量。auto 交给用户代理，本模型拒绝它，而不是猜一个周期。浏览器还可以决定 optional 字体根本不下载；模型只处理已经给出的到达时间。"
      ],
      examples: [
        {
          language: "javascript",
          code: "const periods = {\n  block: { block: 3000, swap: Infinity },\n  swap: { block: 0, swap: Infinity },\n  fallback: { block: 100, swap: 3000 },\n  optional: { block: 100, swap: 0 }\n};\nfunction textPaint(display, arrive) {\n  const period = periods[display];\n  if (!period || !Number.isSafeInteger(arrive) || arrive < 0) return 'invalid';\n  if (arrive <= period.block) return 'paint:' + arrive + ',font';\n  if (period.swap === 0) return 'paint:' + period.block + ',fallback-kept';\n  if (arrive <= period.block + period.swap) return 'paint:' + period.block + ',fallback-then-swap:' + arrive;\n  return 'paint:' + period.block + ',fallback-kept';\n}\nconsole.log('swap:' + textPaint('swap', 400));\nconsole.log('optional晚:' + textPaint('optional', 400));\nconsole.log('optional早:' + textPaint('optional', 50));\nconsole.log('block早:' + textPaint('block', 400));\nconsole.log('block晚:' + textPaint('block', 5000));\nconsole.log('fallback中:' + textPaint('fallback', 200));\nconsole.log('fallback晚:' + textPaint('fallback', 4000));\nconsole.log('非法:' + textPaint('auto', 10));",
          expectedOutput: [
            "swap:paint:0,fallback-then-swap:400",
            "optional晚:paint:100,fallback-kept",
            "optional早:paint:50,font",
            "block早:paint:400,font",
            "block晚:paint:3000,fallback-then-swap:5000",
            "fallback中:paint:100,fallback-then-swap:200",
            "fallback晚:paint:100,fallback-kept",
            "非法:invalid"
          ],
          explanation: [
            "swap 的块周期是 0，所以文字立刻用后备字体绘制，400 时再交换。block 在字体于 400 到达前不绘制文字，文字 LCP 会被字体拖到 400；5000 才到达时，先在 3000 用后备字体画出，之后仍可交换。",
            "optional 若 400 才到达，块周期已过且交换周期为 0，这次导航保留后备字体。fallback 只在 100ms 后的 3s 交换窗内替换。把 block 改成 swap 可以让文字更早出现，但会发生一次字体替换，需要另看布局偏移。"
          ]
        }
      ]
    },
    {
      id: "contention",
      title: "单队列里先排轮播，主图完成时间会被推迟",
      paragraphs: [
        "预加载不是越多越好。下面用一条队列表示极端的单连接：按给定顺序发送，主图完成时间是它排到队首并传完自己的字节之时。先传 80 字节主图，完成于 80；先传 80 字节轮播再传主图，完成于 160。队列里没有主图则是 missing，负数是 invalid。",
        "真实浏览器会按优先级、多连接和缓存交错传输，不会严格等于这个相加结果。模型只说明一个顺序错误：为了折叠区的轮播占用了主图前面的带宽。预加载应指向当前视口的 LCP 资源，并使用最终会请求的同一 URL。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function lcpFinish(queue) {\n  let clock = 0;\n  let lcp = null;\n  for (const item of queue) {\n    if (!Number.isFinite(item.bytes) || item.bytes < 0) return 'invalid';\n    clock += item.bytes;\n    if (item.lcp) lcp = clock;\n  }\n  return lcp === null ? 'missing' : String(lcp);\n}\nconsole.log('先关键:' + lcpFinish([{ id: 'hero', bytes: 80, lcp: true }, { id: 'carousel', bytes: 80 }]));\nconsole.log('先轮播:' + lcpFinish([{ id: 'carousel', bytes: 80 }, { id: 'hero', bytes: 80, lcp: true }]));\nconsole.log('缺少主图:' + lcpFinish([{ id: 'carousel', bytes: 80 }]));\nconsole.log('非法:' + lcpFinish([{ id: 'hero', bytes: -1, lcp: true }]));",
          expectedOutput: ["先关键:80", "先轮播:160", "缺少主图:missing", "非法:invalid"],
          explanation: [
            "两条队列的字节总和都是 160，差别只在主图前面有没有别人。完成时间取主图传完的时钟，而不是整页传完的时钟。",
            "missing 表示优化了一组图片，却没有把 LCP 候选放进队列。这个相加模型没有优先级抢占；如果浏览器能让主图插队，实际差值会小于 80，但“轮播不该压过主图”的责任还在。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "发现得早不够：缓存、尺寸和绘制仍可能落在后面",
      paragraphs: [
        "预加载命中了错误的尺寸或另一份响应时，浏览器仍要再请求真正显示的 URL。srcset、Accept 和缓存变体都会制造这种“提前下载了另一张图”。响应式图片应让预加载的 imagesrcset、imagesizes 与 img 一致。",
        "主图没有宽高或比例时，即使下载很快，也可能在尺寸确定后移动周围内容。字体交换同样可能改变标题尺寸。首屏要同时看发现时间和是否预留空间，不能只看一条请求的瀑布。",
        "脚本改成 async 以后，执行顺序不再按文档顺序。若订单数据依赖这份脚本的同步副作用，页面会先绘制再报错。能否异步，先看依赖，再看它对发现时间的影响。"
      ]
    },
    {
      id: "practice",
      title: "先标出 LCP 候选，再改发现顺序",
      paragraphs: [
        "给订单页记下 LCP 是主图还是标题。若是主图，列出它的 URL 第一次出现在预加载、img 还是样式里；若是标题，写下 font-display 和后备字体的尺寸是否稳定。然后只改这一处，用同一设备和网络比较发现时间，而不是同时压缩所有图片。",
        "E25、E30、E40 仍未开放，本篇不提供练习入口。模型单位也不能当作性能预算的通过线。"
      ]
    }
  ],
  sources: [
    { title: "web.dev：Optimize Largest Contentful Paint", url: "https://web.dev/articles/optimize-lcp" },
    { title: "web.dev：Preload critical assets", url: "https://web.dev/articles/preload-critical-assets" },
    { title: "MDN：font-display", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display" },
    { title: "CSS Fonts Module：font-display", url: "https://drafts.csswg.org/css-fonts/#font-display-desc" }
  ]
};
