import type { Article } from "../articles";

export const animationFeedbackArticle: Article = {
  "id": "K05-06",
  "kind": "knowledge",
  "domainSlug": "html-css",
  "slug": "animation-and-feedback",
  "title": "动画与交互反馈",
  "summary": "区分改变布局的 left 和只改变视觉的 transform，用动画接口控制暂停与取消，并在减少动态效果时跳过位移。",
  "aliases": [
    "transform",
    "opacity",
    "Web Animations",
    "prefers-reduced-motion",
    "compositor",
    "减少动态效果"
  ],
  "tags": [
    "HTML",
    "CSS",
    "动画与交互反馈"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "按钮只移动了 30px，为什么周围的布局跟着重新计算？",
      "paragraphs": [
        "保存成功后，提示从左侧滑入。实现方式是在每一帧修改 left。列表很长时，滑动期间页面连续重新布局。提示的位置变化只需要被看见，周围元素的排布并没有改变。动画前要先决定它改变的是布局几何，还是只改变绘制结果。",
        "前置是 K04-02 的渲染阶段和 K05-02 的盒模型。本文用固定定位元素读取 offsetLeft 与 getBoundingClientRect，并用 Web Animations API 把动画停在已知时间。示例不测量帧率，也不把某台设备的合成层数量写成结论。减少动态效果的分支接收明确参数，避免把验证机器的系统偏好写成唯一预期输出。"
      ]
    },
    {
      "id": "compositor",
      "title": "transform 改变视觉位置，不改变布局偏移",
      "paragraphs": [
        "固定定位元素的 left 设为 30px 时，offsetLeft 和 getBoundingClientRect().x 都是 30。布局位置和视觉位置一起改变，后续读取几何信息会看到新的布局。把 left 放回 0，再用 translateX(30px)，offsetLeft 仍是 0，矩形的 x 变为 30，计算后的 transform 是 matrix(1, 0, 0, 1, 30, 0)。",
        "平移和透明度是适合交给合成阶段的常见属性：它们可以改变看见的位置或透明程度，同时让布局偏移保持原值。宽度、高度、top 和 left 会改变布局几何。提示进入、按下反馈和焦点移动若只需要视觉位移，优先使用 transform 和 opacity。需要把后面的内容真正推开时，再改变布局属性，并接受相应的布局成本。",
        "will-change 只是提前提示浏览器可能变化的属性，它不保证建立独立合成层，也不缩短每一帧的脚本时间。连续给大列表加 will-change 会保留额外资源。动画结束后取消提示，保留元素最终应有的状态。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const box = document.createElement('div');\nbox.style.cssText = 'position:fixed;left:0;top:0;width:10px;height:10px';\ndocument.body.append(box);\nbox.style.left = '30px';\nconsole.log([box.offsetLeft, box.getBoundingClientRect().x].join(','));\nbox.style.left = '0px';\nbox.style.transform = 'translateX(30px)';\nconsole.log([box.offsetLeft, box.getBoundingClientRect().x].join(','));\nbox.remove();",
          "expectedOutput": [
            "30,30",
            "0,30"
          ],
          "explanation": [
            "修改 left 后，布局偏移和视觉坐标都是 30。改用 translateX(30px) 后，布局偏移回到 0，视觉坐标仍是 30。",
            "固定定位和 left:0 让坐标相对视口，避免正文外边距混入结果。transform 还会影响后代 fixed 元素的包含块，诊断弹层位置时见 K05-08。"
          ]
        }
      ]
    },
    {
      "id": "control",
      "title": "用动画对象暂停、定位和取消",
      "paragraphs": [
        "element.animate 返回可控制的动画。把不透明度从 1 过渡到 0.5，暂停后把 currentTime 放到 400ms，计算不透明度是 0.5，playState 是 paused。取消动画后，元素回到动画施加前的不透明度 1，getAnimations() 的长度是 0。取消会移除动画效果，不会自动把脚本之前写过的内联样式清掉。",
        "反馈动画需要一个所有者：组件挂载时创建，卸载、关闭或新的状态到达时取消。让旧动画继续填满最终帧，新的状态会被过期动画盖住。fill 决定动画区间之外是否保留效果；持久的界面状态应写回样式或数据，而不是依赖一条已经结束的动画替状态保存。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const el = document.createElement('div');\nel.style.cssText = 'width:20px;height:20px;opacity:1';\ndocument.body.append(el);\nconst anim = el.animate([{opacity:1},{opacity:0.5}],{duration:400,fill:'forwards'});\nanim.pause();\nanim.currentTime = 400;\nconsole.log([getComputedStyle(el).opacity, anim.playState].join(','));\nanim.cancel();\nconsole.log([getComputedStyle(el).opacity, el.getAnimations().length].join(','));\nel.remove();",
          "expectedOutput": [
            "0.5,paused",
            "1,0"
          ],
          "explanation": [
            "暂停在 400ms 时，不透明度停在后一个关键帧的 0.5。cancel 移除这条动画，计算值回到元素自身的 opacity:1，动画列表为空。",
            "currentTime 使用毫秒时间线。示例把动画停住是为了得到稳定读数，不表示界面反馈都应该暂停。真实交互还要处理用户在动画中途再次触发。"
          ]
        }
      ]
    },
    {
      "id": "motion",
      "title": "减少动态效果时跳过位移，并保留最终信息",
      "paragraphs": [
        "prefers-reduced-motion 表达用户希望减少非必要运动。读取 matchMedia('(prefers-reduced-motion: reduce)') 是这个决定的输入。下面的函数把决定显式传进来：reduce 为 true 时不创建动画，transform 保持 none；为 false 时把动画定位到结束帧，视觉上平移 40px，取消后又回到 none。",
        "跳过动画和把持续时间写成 0 不一定相同。若动画的结束帧才是界面应停留的状态，减少动态效果时应直接设置最终样式。若动画只是轻微提示并会回到起点，则不要播放，保持原来的稳定位置。必要的状态变化，例如焦点移到对话框，仍然立即完成，不用一段长距离滑动代替焦点管理。",
        "系统偏好是用户设置，页面不要提供一个难找的开关去覆盖它，除非产品有独立、明确的动画设置。验证时至少覆盖减少和未减少两条路径：一条确认没有位移，另一条确认动画可以取消并恢复。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function finish(reduce) {\n  const el = document.createElement('div');\n  document.body.append(el);\n  if (reduce) {\n    console.log(getComputedStyle(el).transform);\n    el.remove();\n    return;\n  }\n  const anim = el.animate([{transform:'translateX(0px)'},{transform:'translateX(40px)'}],{duration:200,fill:'forwards'});\n  anim.pause();\n  anim.currentTime = 200;\n  console.log(getComputedStyle(el).transform);\n  anim.cancel();\n  console.log(getComputedStyle(el).transform);\n  el.remove();\n}\nfinish(true);\nfinish(false);",
          "expectedOutput": [
            "none",
            "matrix(1, 0, 0, 1, 40, 0)",
            "none"
          ],
          "explanation": [
            "第一行没有创建动画，变换保持 none。第二行停在结束帧，矩阵表示向右 40px。第三行取消后回到 none。",
            "函数参数代表已经判定的用户偏好，所以输出不依赖验证机器是否打开减少动态效果。接到界面时，先读媒体查询或产品设置，再调用这种分支。"
          ]
        }
      ]
    },
    {
      "id": "feedback",
      "title": "反馈要说明状态，运动只是其中一种方式",
      "paragraphs": [
        "操作结果首先用文字、焦点或稳定的视觉状态表达。保存成功可以显示“已保存”，并在减少动态效果时立即呈现；允许运动时，再用短暂的透明度或轻微平移引导注意。颜色单独传递成败会让一部分用户看不见，运动单独传递成败则会在用户要求减少运动时消失。",
        "连续动画，例如加载指示，需要说明正在等待，并在请求结束、取消或失败时移除。不要让一个循环动画在组件卸载后仍引用已删除的元素。K02 的取消和过期结果同样适用于这里：新的响应到达时，旧的进入动画不应再把界面拉回前一个状态。"
      ]
    },
    {
      "id": "mistakes",
      "title": "用布局属性做装饰运动，或用动画代替状态",
      "paragraphs": [
        "错误实现是用定时器逐帧增加 left，并在每一帧读取周围元素的位置。视觉上同样移动 30px，布局成本却落在主线程的样式和布局阶段。装饰性移动改用 transform；若确实要重排，集中改变一次布局，而不是在动画的每一帧交替读写。",
        "另一个错误是在用户选择减少动态效果后仍播放大幅视差、自动轮播和来回缩放。保留即时的状态切换，去掉非必要运动。不要只把持续时间改得很短却仍做长距离位移，那仍然是运动。"
      ]
    },
    {
      "id": "boundaries",
      "title": "合成可能性和实际帧率需要分开验证",
      "paragraphs": [
        "第一条边界是浏览器的合成决策。transform 和 opacity 通常可以不触发布局，但滤镜、裁剪、大量图层和主线程长任务仍会影响流畅度。本文的证据是布局偏移与视觉坐标的差异，不是性能面板里的图层截图。",
        "第二条边界是可访问性偏好的范围。减少动态效果不表示移除焦点、错误文字或加载状态。前庭障碍、注意力和单纯的偏好都可能启用这个设置。页面在两种偏好下都要完成同一任务，只是运动的有无不同。"
      ]
    },
    {
      "id": "practice",
      "title": "预测偏移、视觉坐标和取消后的值",
      "paragraphs": [
        "先预测 left:30px 与 translateX(30px) 的两行输出，再预测动画取消后不透明度是 0.5 还是 1。然后写出减少动态效果时提示应停留的最终文字，以及不该出现的位移。",
        "在目标页面用开发者工具的渲染或性能记录核对一次真实滑动，确认没有在动画帧里读写布局。E27 至 E29 尚未提供可运行练习；本节的空白页读数用来核对机制。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Web Animations：控制动画播放",
      "url": "https://drafts.csswg.org/web-animations-1/#model-liveness"
    },
    {
      "title": "Media Queries：prefers-reduced-motion",
      "url": "https://drafts.csswg.org/mediaqueries-5/#prefers-reduced-motion"
    }
  ]
};
