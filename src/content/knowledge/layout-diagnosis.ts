import type { Article } from "../articles";

export const layoutDiagnosisArticle: Article = {
  "id": "K05-08",
  "kind": "knowledge",
  "domainSlug": "html-css",
  "slug": "layout-diagnosis",
  "title": "复杂布局诊断",
  "summary": "按滚动偏移、inset 和中间层 overflow 检查 sticky，再确认 fixed 的包含块，以及 Popover 是否脱离祖先裁剪。",
  "aliases": [
    "sticky",
    "scroll container",
    "fixed",
    "containing block",
    "popover",
    "弹层定位"
  ],
  "tags": [
    "HTML",
    "CSS",
    "复杂布局诊断"
  ],
  "estimatedMinutes": 24,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "标题写了 sticky，滚动后为什么和普通块一起离开视口？",
      "paragraphs": [
        "章节标题设置 position:sticky;top:0，在页面里有时能停住，放进卡片后就随内容滚走。旁边的菜单使用 position:fixed;top:0，却没有贴着浏览器上沿，而是贴着一个加了变换的祖先。再往后，提示层被卡片的 overflow:hidden 切掉一半。三种现象都像“定位失效”，检查对象却分别是滚动端口、包含块和顶层呈现。",
        "前置是 K05-02 的溢出与包含块，以及 K05-03 的滚动宽度。本文在空白页建立高度有限的滚动容器，滚动 40px 后比较目标与容器的矩形；固定定位和 Popover 再分别读取视口坐标。实验记录的是这次浏览器的几何结果。中间层的 filter、contain:paint 和 will-change:transform 在同一次环境里没有单独破坏粘滞，因此下文不把它们写成必然原因。"
      ]
    },
    {
      "id": "sticky",
      "title": "sticky 要有 inset，并且粘在最近的滚动端口里",
      "paragraphs": [
        "滚动容器高 100px，内容更高。标题 position:sticky;top:0 时，容器 scrollTop 为 40，标题相对容器顶部的距离仍是 0，它停在滚动端口的上沿。去掉 top 等 inset 后，同样的滚动使相对距离变为 -40，标题和普通流一起离开。没有偏移阈值时，粘滞定位没有可停留的位置。",
        "在标题和滚动容器之间插入 overflow:hidden 的中间层，即使标题仍有 top:0，相对距离也是 -40。这个中间层成为标题遇到的滚动端口；它本身没有可滚动的剩余空间，标题便不能再相对外层容器停留。诊断时从粘滞元素向上找第一个 overflow 不是 visible 的祖先，确认它是否就是作者期望的滚动容器。",
        "同一环境里，中间层只设置 transform、filter:opacity(1)、contain:paint 或 will-change:transform 时，标题仍能停在外层滚动容器。图形效果可能在别的引擎、别的组合或形成新包含块时改变结果，所以看到这些属性要记录并复测；本次能够稳定复现的失败是缺少 inset，以及中间层的 overflow:hidden。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function place(name, setup) {\n  const scroller = document.createElement('div');\n  scroller.style.cssText = 'height:100px;overflow:auto;position:relative';\n  const sticky = document.createElement('div');\n  sticky.style.cssText = 'position:sticky;height:20px';\n  setup(scroller, sticky);\n  const filler = document.createElement('div');\n  filler.style.height = '300px';\n  sticky.parentElement.append(filler);\n  document.body.append(scroller);\n  scroller.scrollTop = 40;\n  console.log(name + ':' + Math.round(sticky.getBoundingClientRect().top - scroller.getBoundingClientRect().top) + ',' + scroller.scrollTop);\n  scroller.remove();\n}\nplace('top', (scroller, sticky) => { sticky.style.top = '0px'; scroller.append(sticky); });\nplace('no-inset', (scroller, sticky) => { scroller.append(sticky); });\nplace('hidden', (scroller, sticky) => {\n  const mid = document.createElement('div');\n  mid.style.overflow = 'hidden';\n  mid.append(sticky);\n  scroller.append(mid);\n  sticky.style.top = '0px';\n});",
          "expectedOutput": [
            "top:0,40",
            "no-inset:-40,40",
            "hidden:-40,40"
          ],
          "explanation": [
            "每行是标题相对滚动容器顶部的距离，以及容器的 scrollTop。top 在滚动 40px 后仍贴着容器顶部。没有 inset 或被 overflow:hidden 隔开时，标题相对容器上移 40px。",
            "矩形差值消除了页面外边距。真实页面要继续向上检查是否还有另一层滚动容器，以及标题的父元素高度是否只和标题本身一样高；父元素没有额外空间时，粘滞也没有可移动区间。"
          ]
        }
      ]
    },
    {
      "id": "containing-block",
      "title": "fixed 的包含块会从视口变成变换祖先",
      "paragraphs": [
        "祖先位于绝对定位的 left:50px、top:40px，后代使用 position:fixed;top:0;left:0。祖先没有变换时，后代矩形在视口的 0,0。给祖先设置 transform:translateZ(0) 后，后代的 top 和 left 变为 40 和 50，也就是祖先的位置。再把变换设为 none，后代回到视口原点。",
        "fixed 的包含块默认与视口相关；祖先的 transform 会让该祖先成为后代固定定位的包含块。弹层若必须相对视口，就把它挂到不受变换、滤镜或包含效果影响的节点，并确认新的挂载点仍有正确的焦点顺序。弹层若必须跟随某个面板，则应明确以该面板为包含块，而不是依赖一条意外的变换。sticky 是否停留和 fixed 的包含块是两次检查，不要用移动弹层的经验直接改粘滞标题。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const host = document.createElement('div');\nhost.style.cssText = 'position:absolute;left:50px;top:40px;width:100px;height:100px';\nconst popup = document.createElement('div');\npopup.style.cssText = 'position:fixed;top:0;left:0;width:10px;height:10px';\nhost.append(popup); document.body.append(host);\nconsole.log([Math.round(popup.getBoundingClientRect().top), Math.round(popup.getBoundingClientRect().left)].join(','));\nhost.style.transform = 'translateZ(0)';\nconsole.log([Math.round(popup.getBoundingClientRect().top), Math.round(popup.getBoundingClientRect().left)].join(','));\nhost.style.transform = 'none';\nconsole.log([Math.round(popup.getBoundingClientRect().top), Math.round(popup.getBoundingClientRect().left)].join(','));\nhost.remove();",
          "expectedOutput": [
            "0,0",
            "40,50",
            "0,0"
          ],
          "explanation": [
            "没有变换时，固定定位相对视口的左上角。祖先平移形成包含块后，后代的 0,0 对齐祖先的 40,50。清除变换后，包含块回到视口。",
            "translateZ(0) 在这里用来建立可观察的包含块变化，不是推荐的性能写法。生产代码若需要新的包含块，应使用能表达目的的定位结构，并复测滚动、缩放和焦点。"
          ]
        }
      ]
    },
    {
      "id": "popover",
      "title": "Popover 打开后进入顶层，不再受祖先裁剪限制",
      "paragraphs": [
        "卡片只有 20px 高且 overflow:hidden。把 40px 高的 manual Popover 放在卡片内部，打开前 :popover-open 不匹配。showPopover() 后伪类匹配，弹层尺寸仍是 40×40，顶部在视口 0。它没有被祖先裁成 20px。hidePopover() 后伪类再次不匹配。",
        "顶层呈现适合菜单、提示和确认层，因为作者不再与每个祖先的 overflow、层叠上下文和变换较劲。打开前仍要准备触发按钮、可访问名称、关闭方式和焦点去向。manual 不会因为点击外部自动关闭；auto 的轻触关闭行为不同。选择哪种值，取决于用户是否需要同时操作弹层和页面，本文的实验只用 manual 验证打开、尺寸和关闭。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const clip = document.createElement('div');\nclip.style.cssText = 'overflow:hidden;width:30px;height:20px';\nconst pop = document.createElement('div');\npop.setAttribute('popover', 'manual');\npop.style.cssText = 'width:40px;height:40px;margin:0;padding:0;border:0;position:fixed;top:0;left:0';\nclip.append(pop); document.body.append(clip);\nconsole.log(String(pop.matches(':popover-open')));\npop.showPopover();\nconst popRect = pop.getBoundingClientRect();\nconst clipRect = clip.getBoundingClientRect();\nconsole.log([pop.matches(':popover-open'), Math.round(popRect.width), Math.round(popRect.height), Math.round(clipRect.height), Math.round(popRect.top)].join(','));\npop.hidePopover();\nconsole.log(String(pop.matches(':popover-open')));\nclip.remove();",
          "expectedOutput": [
            "false",
            "true,40,40,20,0",
            "false"
          ],
          "explanation": [
            "打开前伪类不匹配。打开后伪类匹配，弹层保持 40px 高，祖先只有 20px 高，弹层顶部在 0。关闭后伪类回到不匹配。",
            "示例把弹层固定到视口原点，方便比较尺寸。真实提示要靠近触发器，并保证它在视口内完整可读。CSS.supports('selector(:popover-open)') 可用来确认选择器可用，但不能代替打开后的焦点和关闭测试。"
          ]
        }
      ]
    },
    {
      "id": "order",
      "title": "按现象选择检查顺序",
      "paragraphs": [
        "元素应该在某个滚动容器内停留：先确认 sticky 和 inset，测量 scrollTop 与相对距离；若一起滚走，再找中间是否出现新的滚动端口，尤其是 overflow 不是 visible 的祖先。同时确认粘滞元素的包含块里还有可供它移动的空间。",
        "元素应该相对视口固定：读取它和视口的矩形，再向上寻找 transform、filter、perspective 或 will-change 等可能改变包含块的属性，并用去掉该属性前后的坐标对照。不要先增大 z-index。遮挡属于 K05-02 的层叠上下文；位置算错时，更大的 z-index 只会把错误位置画得更靠前。",
        "元素应该盖过卡片裁剪：优先使用带明确开关合同的 Popover 或 dialog 顶层，检查打开伪类、尺寸是否仍被祖先限制、焦点进入和返回。若不能使用顶层，就把层挂到裁剪祖先之外，并重新验证滚动时它应该跟随卡片还是跟随视口。"
      ]
    },
    {
      "id": "mistakes",
      "title": "用更高的层级掩盖定位对象选错",
      "paragraphs": [
        "标题不粘时把 top 改成更大的像素，或给一串祖先加 overflow:hidden 来消除页面滚动条。前者只移动阈值，后者可能制造新的滚动端口，使粘滞更早失效。先记录相对距离和 scrollTop，再改一个属性并复测。",
        "弹层被裁剪时，把它的 z-index 加到几千。若祖先仍在裁剪或建立了更低的层叠上下文，数值不会让它离开那个范围。改用顶层或移出裁剪祖先，然后测试键盘关闭、滚动和窗口变小后的位置。"
      ]
    },
    {
      "id": "boundaries",
      "title": "几何实验没有覆盖全部浏览器组合",
      "paragraphs": [
        "第一条边界是引擎差异。本文的粘滞失败复现了缺少 inset 和中间 overflow:hidden；变换等图形属性在这次 Chrome 空白页中没有单独使标题脱离外层滚动容器。换浏览器、加入动画或改变 DOM 层级后要重新测量，不能把这次阴性结果推广成永久规则。",
        "第二条边界是交互合同。Popover 的尺寸实验没有覆盖轻触关闭、焦点陷阱、锚点定位和虚拟键盘弹出后的可视区域。顶层只解决呈现范围，对话框仍要管理焦点和可访问名称。滚动联动若由脚本监听 scroll 来模仿 sticky，还要处理 K04 的监听器清理和主线程成本。"
      ]
    },
    {
      "id": "practice",
      "title": "用一次滚动区分三种定位失败",
      "paragraphs": [
        "建立 100px 滚动容器和高内容。预测 sticky 有 top、无 inset、以及中间层 overflow:hidden 的三行相对距离。再预测固定定位后代在祖先 translateZ(0) 前后的视口坐标。最后预测 40px 的 Popover 打在 20px 裁剪祖先里时，打开后的高度是 20 还是 40。",
        "把预测写在修改样式之前。结果不符时只改变一个条件再测，保留相对距离、包含块和打开状态三份证据。E28 的对话框练习尚未制作，本节不把它当作已经可做的验证。"
      ]
    }
  ],
  "sources": [
    {
      "title": "CSS Position：粘滞定位",
      "url": "https://drafts.csswg.org/css-position-3/#sticky-pos"
    },
    {
      "title": "HTML：Popover",
      "url": "https://html.spec.whatwg.org/multipage/popover.html"
    }
  ]
};
