import type { Article } from "../articles";

export const observersViewportArticle: Article = {
  "revision": 2,
  "id": "K04-05",
  "kind": "knowledge",
  "domainSlug": "browser",
  "slug": "observers-and-viewport",
  "title": "观察器与视口",
  "summary": "从图片懒加载和尺寸联动出发，区分交叉、尺寸与 DOM 变更通知，解释异步批次、反馈循环和卸载清理。",
  "aliases": [
    "IntersectionObserver",
    "ResizeObserver",
    "MutationObserver",
    "observer",
    "观察器"
  ],
  "tags": [
    "浏览器",
    "Web 平台",
    "观察器与视口"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "列表滚动、容器变宽、DOM 改变，应该监听同一件事吗？",
      "paragraphs": [
        "卡片进入滚动区域时需要加载图片，侧栏折叠后图表需要适应容器，第三方控件插入节点后需要同步摘要。三种变化都可能让屏幕不同，却不是同一种事实。若统一用 scroll 监听或 MutationObserver，可能既漏掉真正变化，又频繁做无关测量。",
        "先确定业务问题：是否与观察区域相交，用 IntersectionObserver；元素观察盒尺寸是否改变，用 ResizeObserver；节点、属性或文字是否变更，用 MutationObserver。前置是 K04-02 的布局与几何。下面真实观察器实验在现代浏览器独立页面运行，使用回调承诺等待通知，不靠固定等待毫秒断言。"
      ]
    },
    {
      "id": "intersection",
      "title": "交叉观察的是几何关系，不是用户已经看见",
      "paragraphs": [
        "IntersectionObserver 把目标与 root 及相关裁剪区域的交叉关系异步送到回调。root=null 通常使用视口，指定滚动容器则使用该容器；rootMargin 可扩大或缩小观察区域。threshold 定义需要关注的交叉比例边界，例如 0、0.5、1。通知不是每移动一个像素都发生，且初次 observe 也可能带来当前状态。",
        "isIntersecting 与 intersectionRatio 分别描述是否相交和面积比例；边缘接触可能出现相交而面积为零，所以要求“至少一半”时要同时表达比例条件。几何相交不等于无遮挡、页面在前台或用户阅读过，不能直接记为已读。下面固定尺寸确保比例明确，只讨论基础几何观察，不依赖扩展可见性检测。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const root = document.createElement('div');\nroot.style.cssText = 'position:fixed;left:0;top:0;width:100px;height:100px;overflow:hidden';\nconst target = document.createElement('div');\ntarget.style.cssText = 'width:50px;height:50px';\nroot.append(target); document.body.append(root);\nlet observer;\ntry {\n  const result = await new Promise(resolve => {\n    observer = new IntersectionObserver(entries => {\n      const entry = entries.find(item => item.target === target);\n      if (entry) resolve(entry);\n    }, { root, threshold: [0, 1] });\n    observer.observe(target);\n  });\n  console.log(result.isIntersecting, result.intersectionRatio);\n} finally { observer?.disconnect(); root.remove(); }",
          "expectedOutput": [
            "true 1"
          ],
          "explanation": [
            "50×50 的目标完整位于 100×100 的 root 中，首次通知中交叉面积等于目标面积，所以 ratio 为 1。等待的是真实通知，不是猜测浏览器在某个定时器之前完成测量。",
            "finally 断开观察并移除节点；若浏览器没有该能力，例子会显式失败。产品应有降级，而教程验证应明确使用支持该 API 的环境，不伪造成功回调。"
          ]
        }
      ]
    },
    {
      "id": "loading",
      "title": "懒加载的完成条件是资源成功，而非触发观察",
      "paragraphs": [
        "错误实现是一收到相交通知就永久移除目标并标记图片加载完成。请求失败后占位可能一直存在，却没有重试入口。更合理的状态是 idle→loading→loaded/error：相交只允许发起一次请求，load 后进入 loaded，error 后保留手动重试或再次观察的策略。卸载时还需使迟到回调无效，不能让已移除的卡片更新其他条目。",
        "优先考虑原生 loading=lazy；当需要预加载距离、统一并发或特定滚动容器时再用观察器。rootMargin 提前触发能减轻可见时的空白，也会多下载用户未到达的资源；应结合图片大小、设备网络和列表长度选择，不是越大越好。没有观察器时可以直接加载必要资源，让核心内容仍能访问。"
      ]
    },
    {
      "id": "resize",
      "title": "尺寸通知适合容器，不等于只监听窗口 resize",
      "paragraphs": [
        "元素可能因父布局、字体、侧栏和内容改变尺寸，而窗口宽度完全没变。ResizeObserver 直接观察元素盒子的大小。默认 content-box 关注内容盒；border-box 关注包含边框的盒。读取 entry 提供的尺寸能减少重复测量，但要明确使用哪种盒和书写方向，不能把 inlineSize 永远当成物理横向宽度。",
        "下面观察固定 content-box，收到初始 80 后修改为 120，只在看到目标宽度时继续。它展示回调与尺寸变化的关系；并不保证每帧多少次通知或把 ResizeObserver 当成高精度动画时钟。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const box = document.createElement('div');\nbox.style.cssText = 'position:fixed;width:80px;height:20px;padding:0;border:0';\ndocument.body.append(box);\nlet observer;\ntry {\n  await new Promise(resolve => {\n    observer = new ResizeObserver(entries => {\n      const entry = entries.find(item => item.target === box);\n      if (!entry) return;\n      const width = entry.contentRect.width;\n      if (width === 80) { console.log(width); box.style.width = '120px'; }\n      if (width === 120) { console.log(width); resolve(); }\n    });\n    observer.observe(box);\n  });\n} finally { observer?.disconnect(); box.remove(); }",
          "expectedOutput": [
            "80",
            "120"
          ],
          "explanation": [
            "第一次回调交付 80，代码只进行一次有界宽度修改。后续通知交付 120，Promise 完成并清理。这里只允许两个状态，因此不会每次通知都无条件继续增大尺寸。",
            "真实布局可能产生小数、多个条目和竖排文字，业务不宜用精确整数宽度推断所有情况。这个固定 CSS 实验使用精确值，是为了让预期输出可复现。"
          ]
        }
      ]
    },
    {
      "id": "feedback",
      "title": "为什么回调中改尺寸可能形成反馈循环",
      "paragraphs": [
        "错误实现是在每次尺寸通知里将宽度设为当前宽度加 1。通知触发写入，写入触发下一次通知，反馈永远没有稳定点。浏览器的循环限制和错误报告防止一次渲染被无限占据，但不能替业务完成收敛。把写入移到 requestAnimationFrame 可能跨帧继续循环，仍不是根本修复。",
        "先问尺寸关系是否能由 CSS 容器查询、Grid 或内在布局承担。确需 JS 时，计算期望值并与当前或上次应用值比较，仅在变化时写入，必要时引入有依据的稳定区间。不要观察自己写出的尺寸再无条件反推自身；图表适应外层容器时，尽量观察外层、更新内层，明确防止内层反过来撑大外层的约束。"
      ]
    },
    {
      "id": "mutation",
      "title": "DOM 变更按记录批次交付，不是每次同步回调",
      "paragraphs": [
        "MutationObserver 记录已配置的 childList、attributes 或 characterData 变更，并在微任务检查点交付批次。subtree 决定是否包含后代；attributeFilter 能限制属性，减少无关通知。它观察 DOM 事实，不观察计算样式、元素移动或网络完成：样式表改变宽度时，没有对应 DOM 修改也可能改变布局。",
        "下面先追加一个节点，再修改宿主的 data-state。同步代码结束前已经执行了两次修改，但回调之后才得到两条记录；这说明“发生了变化”和“观察者处理了变化”是两个时刻。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const host = document.createElement('div');\nlet observer;\nconst delivered = new Promise(resolve => {\n  observer = new MutationObserver(records => {\n    console.log(records.map(record => record.type).join(','));\n    resolve();\n  });\n  observer.observe(host, { childList: true, attributes: true, attributeFilter: ['data-state'] });\n});\nhost.append(document.createElement('span'));\nhost.setAttribute('data-state', 'ready');\nconsole.log('sync complete');\nawait delivered;\nobserver.disconnect();",
          "expectedOutput": [
            "sync complete",
            "childList,attributes"
          ],
          "explanation": [
            "append 排入 childList，setAttribute 排入 attributes；二者不会立即打断当前代码，所以 sync complete 先打印。微任务阶段回调按记录顺序输出两种变化。",
            "宿主不需要连接到文档就能产生 DOM 变更通知。disconnect 会丢弃未交付记录；若清理前必须处理队列，先 takeRecords 再按业务处理，而不是假定所有通知都已收到。"
          ]
        }
      ]
    },
    {
      "id": "lifecycle",
      "title": "清理包括停止观察，也包括让迟到工作失效",
      "paragraphs": [
        "unobserve 只取消一个目标，适合资源成功后不再观察；disconnect 结束整个观察器，适合组件卸载。仅停止观察不能取消已经发起的图片请求、数据库操作或 Promise continuation。为异步加载配合取消和当前任务身份，卸载后即使请求返回也不推进界面。",
        "观察器的回调可能包含多个目标，不能只用 entries[0] 更新整个列表。每个 entry 与目标身份关联，虚拟列表节点复用时还要重新关联数据 ID。回调里做大型排序或同步布局仍会阻塞主线程；观察 API 减少了手工监听责任，没有把业务计算搬到 Worker。"
      ]
    },
    {
      "id": "boundaries",
      "title": "把观察结果翻译成业务事实之前",
      "paragraphs": [
        "第一条边界是后台和渲染调度：通知不是硬实时，不能靠它实现精确倒计时。第二条边界是观察对象不同：Mutation 不证明几何变了，Intersection 不证明用户看了，Resize 不证明内容语义变了。业务统计和状态更新必须采用真正对应的证据。",
        "动手改第一个例子：把目标高度改为 200，预测完整可见比例；改第二个例子为无条件宽度加 1，先在纸上推演为何不收敛，不要在主站执行失控代码。E25 的图片状态模型与 E30 的窗口计算已经开放；它们在 JavaScript Worker 中运行，不将通过结果计作真实观察器、图片加载或 DOM 虚拟列表验收。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Intersection Observer：交叉与通知",
      "url": "https://w3c.github.io/IntersectionObserver/"
    },
    {
      "title": "MDN：ResizeObserver 与循环",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver"
    },
    {
      "title": "MDN：MutationObserver",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver"
    }
  ]
};
