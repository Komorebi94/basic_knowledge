import type { Article } from "../articles";

export const renderingAndLayoutArticle: Article = {
  "id": "K04-02",
  "kind": "knowledge",
  "domainSlug": "browser",
  "slug": "rendering-and-layout",
  "title": "渲染流水线与布局成本",
  "summary": "样式、布局、绘制、合成如何验证；何时避免布局抖动。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "rendering-and-layout",
    "渲染流水线与布局成本"
  ],
  "tags": [
    "browser"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "循环只改几十次宽度，为什么会卡？",
      "paragraphs": [
        "列表更新时，代码给每个条目设置宽度，再立即读取下一个条目的尺寸。单次属性赋值很便宜，但读取要求浏览器返回最新几何数据，前一次写入造成的布局失效可能必须立即解决。读写交替会让本可合并的工作被反复打断。",
        "本文完整 DOM 示例在现代浏览器空白页面运行。尺寸断言使用固定 CSS，不用运行时间阈值伪装性能保证。是否存在布局抖动必须查看真实 Performance 记录；示例解释触发机制，不能推断特定设备耗时。"
      ],
      "examples": [
        {
          "code": "const node = document.createElement('div');\nnode.style.cssText = 'position:absolute;width:100px;height:20px';\ndocument.body.append(node);\nconsole.log(node.getBoundingClientRect().width);\nnode.style.width = '140px';\nconsole.log(node.getBoundingClientRect().width);\nnode.remove();",
          "expectedOutput": [
            "100",
            "140"
          ],
          "explanation": [
            "第一次读取需要布局结果。写 width 使相关几何失效，第二次读取又要求最新宽度。输出证明读取与修改的语义，不证明具体引擎内部调用次数。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "失效并不意味着立即把整页重画",
      "paragraphs": [
        "样式修改会标记受影响部分需要重新计算。浏览器通常有机会在渲染时机合并多次修改；然而 JavaScript 同步请求几何信息时，必须得到与当前文档一致的值，就可能提前执行所需工作。读取不是一律昂贵，关键是它前面是否产生相关失效。",
        "布局处理几何关系；绘制处理可见外观；合成组合图层。修改颜色常常不改变几何，修改 width 通常需要布局。transform 可能避免布局，但不能保证任何元素、任何环境都只做合成，更不等于没有图层内存和光栅化成本。"
      ]
    },
    {
      "id": "batch",
      "title": "先完成读取，再集中写入",
      "paragraphs": [
        "若业务先测量现有尺寸，再根据结果修改，可以把所有读聚在一起，将计算留在 JavaScript 中，最后执行写入。这是保持相同业务关系的调度改变。下面多个元素初始宽度固定，读取之后统一增加，不再在每次写入后立刻问下一次尺寸。"
      ],
      "examples": [
        {
          "code": "const host = document.createElement('div');\nconst nodes = [80, 100, 120].map(width => {\n  const node = document.createElement('div');\n  node.style.cssText = 'height:10px;width:' + width + 'px';\n  host.append(node); return node;\n});\ndocument.body.append(host);\nconst widths = nodes.map(node => node.getBoundingClientRect().width);\nnodes.forEach((node, index) => { node.style.width = (widths[index] + 10) + 'px'; });\nconsole.log(widths.join(','));\nconsole.log(nodes.map(node => node.getBoundingClientRect().width).join(','));\nhost.remove();",
          "expectedOutput": [
            "80,100,120",
            "90,110,130"
          ],
          "explanation": [
            "先保存 80、100、120，再统一写 90、110、130。最后为验证结果集中读取。这种顺序提供合并工作机会，但不强行宣称引擎必定只布局一次。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "geometry",
      "title": "读取哪种宽度，要符合问题",
      "paragraphs": [
        "clientWidth、offsetWidth 和 getBoundingClientRect().width 回答不同问题。边框、滚动条、变换和小数会影响结果。排查尺寸必须先定义要的是内容布局尺寸、带边框尺寸还是视觉位置，不能随意换一个 API 来让结果看起来正确。"
      ],
      "examples": [
        {
          "code": "const box = document.createElement('div');\nbox.style.cssText = 'position:absolute;width:100px;height:20px;box-sizing:content-box;padding:10px;border:2px solid;transform:scale(2)';\ndocument.body.append(box);\nconsole.log(box.offsetWidth);\nconsole.log(box.getBoundingClientRect().width);\nbox.remove();",
          "expectedOutput": [
            "124",
            "248"
          ],
          "explanation": [
            "布局宽度为内容 100 加左右 padding 20 和 border 4，offsetWidth 为 124。scale(2) 改变视觉盒，矩形宽度为 248，但没有把布局中的宽度改为 248。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "requestAnimationFrame 不是自动消除抖动的魔法",
      "paragraphs": [
        "把同一段交替读写循环搬进 requestAnimationFrame，它仍会在回调内请求最新几何信息。这个 API 提供与渲染时机协调的机会，不能修复错误依赖。正确做法是划分读取、计算、写入，并在确有跨帧需求时安排后续工作。",
        "另一种错误是每次 scroll 都同步测量整张表。应先确认是否能用 CSS、缓存稳定尺寸或观察 API 表达需求；需要测量时限制范围并处理失效。缓存若没在字体、容器或内容变化时更新，会换来错误布局。"
      ]
    },
    {
      "id": "measurement",
      "title": "如何证明优化有效",
      "paragraphs": [
        "记录真实操作，查看长任务里是否出现重复样式与布局，定位到触发脚本。用相同列表规模、设备和缓存条件对比修改前后轨迹及交互延迟。只在微基准中比较两个循环的毫秒数，容易把 JIT、GC 和记录开销混入结果。",
        "除了速度还要核对结果：容器改变宽度、缩放、长文本和滚动条出现时布局是否正确。性能优化保持功能语义，不能以省掉必需测量导致错位为代价。"
      ]
    },
    {
      "id": "boundaries",
      "title": "批处理和图层都有适用边界",
      "paragraphs": [
        "第一条边界是依赖链。若下一步尺寸在语义上依赖前一步布局，就不能机械地先读所有值；可以重新设计 CSS 约束，或接受有限次数测量。第二条边界是不可见节点：display:none 的几何信息通常为零，测量时必须明确可见性合同。",
        "will-change 应限于确有需要且生命周期明确的元素。给每个列表项都提示独立图层可能增大内存，低端设备反而更慢。优先减少不必要工作，再根据轨迹决定是否改动画属性或图层策略。",
        "以表格自动列宽为例，错误路径是在每次单元格测量后立刻写列宽，随后又测下一格。更可靠的流程是先获得同一布局状态下的候选宽度，计算每列最大值，再统一写入。若写入后文本换行会改变行高，就把行高测量作为第二个明确阶段，而不是把它混进第一个循环。阶段数量来自业务依赖，不来自“必须只有一次布局”的口号。",
        "字体加载是缓存测量的典型失效源。第一次用回退字体算出的文字宽度，不能保证最终字体相同。需要监听实际字体或容器变化并重新测量，或让 CSS 内在布局承担这个关系。选择后者可减少 JavaScript 生命周期责任，但若产品明确要求跨列一致的复杂尺寸，仍应保留必要测量并记录触发条件。"
      ]
    },
    {
      "id": "recall",
      "title": "用因果关系推导一段新代码",
      "paragraphs": [
        "标出所有 DOM 写入和几何读取，问每个读取需要哪次修改后的结果。只需修改前尺寸的读取可以前移；需要修改后尺寸的读取要保留或改变布局方案。然后用记录确认推断。",
        "回忆：为什么 transform 后 offsetWidth 和矩形宽度不同？为什么 rAF 里仍可能强制布局？可给第二个例子增加边框并选择 border-box，再推导尺寸变化，不以猜测替代盒模型计算。"
      ]
    }
  ],
  "sources": [
    {
      "title": "MDN：关键渲染路径",
      "url": "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path"
    },
    {
      "title": "MDN：getBoundingClientRect",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect"
    }
  ]
};
