import type { Article } from "../articles";

export const boxesAndStackingArticle: Article = {
  "id": "K05-02",
  "kind": "knowledge",
  "domainSlug": "html-css",
  "slug": "boxes-and-stacking",
  "title": "盒模型、格式化上下文与层叠",
  "summary": "margin、overflow、z-index 为什么产生意外结果。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "boxes-and-stacking",
    "盒模型、格式化上下文与层叠"
  ],
  "tags": [
    "html-css"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "写了 width:100px，为什么占用 124px？",
      "paragraphs": [
        "卡片网格中每项设置 100px，再加内边距与边框，三个项目却挤出容器。CSS width 的含义由 box-sizing 决定，不能只把属性数字当作外部尺寸。与此同时，margin、浮动与层叠上下文决定了布局和覆盖关系，排查要按各自机制分开。",
        "本文浏览器示例建立独立盒子，固定尺寸后读取几何信息。所有节点结束时移除。页面已有样式可能影响测量，最好在空白文档复现，再带回真实容器核对。"
      ],
      "examples": [
        {
          "code": "const box = document.createElement('div');\nbox.style.cssText = 'position:absolute;width:100px;height:20px;padding:10px;border:2px solid;box-sizing:content-box';\ndocument.body.append(box);\nconsole.log(box.offsetWidth);\nbox.style.boxSizing = 'border-box';\nconsole.log(box.offsetWidth);\nbox.remove();",
          "expectedOutput": [
            "124",
            "100"
          ],
          "explanation": [
            "content-box 的 width 指内容，左右 padding 共 20、border 共 4，总宽 124。border-box 将这些算入 width，总宽变为 100，内容空间相应缩小。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "内容、内边距、边框、外边距分别承担什么",
      "paragraphs": [
        "内容盒放文字或子元素，padding 隔开内容与边框，border 包围盒，margin 参与盒子之间的间隔。margin 不属于 getBoundingClientRect 的边框矩形，也不会因为 border-box 被包含到 width。",
        "百分比尺寸需要参照包含块，min-width 又可能限制实际收缩。Flex 项目的自动最小尺寸会让长内容拒绝缩小，此时应先检查 min-width 与换行规则，而不是给父容器隐藏溢出后称问题已解决。"
      ]
    },
    {
      "id": "formatting",
      "title": "格式化上下文让布局关系具有边界",
      "paragraphs": [
        "正常流中的块元素参与垂直排列；某些相邻垂直 margin 会折叠，不能简单相加。浮动可能脱离普通块的高度计算。建立新的块格式化上下文能隔离部分关系，flow-root 是明确表达这个目的的一种方式。"
      ],
      "examples": [
        {
          "code": "const host = document.createElement('div');\nhost.style.cssText = 'position:absolute;width:100px;display:flow-root';\nconst child = document.createElement('div');\nchild.style.cssText = 'float:left;width:20px;height:40px';\nhost.append(child); document.body.append(host);\nconsole.log(host.offsetHeight);\nhost.remove();",
          "expectedOutput": [
            "40"
          ],
          "explanation": [
            "flow-root 建立新块格式化上下文，浮动孩子被计入容器高度。只为清除浮动而使用 overflow:hidden 还会引入裁剪，可能切掉阴影或内容；明确目的比顺带副作用更容易维护。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "stacking",
      "title": "z-index 比较必须先找共同层叠上下文",
      "paragraphs": [
        "层叠上下文把一组元素作为整体参与上层排序。子元素 z-index 再大也不能越过祖先所在整体的排序。定位加非 auto 的 z-index、transform、opacity 等情况可能建立上下文，排查遮挡应从祖先关系开始。"
      ],
      "examples": [
        {
          "code": "const tree = [\n  { id: 'panel', stack: 1, childStack: 9999 },\n  { id: 'dialog', stack: 2, childStack: 0 }\n];\nconsole.log(tree.sort((a, b) => a.stack - b.stack).map(node => node.id).join(','));\nconsole.log(tree[0].childStack > tree[1].childStack);",
          "expectedOutput": [
            "panel,dialog",
            "true"
          ],
          "explanation": [
            "这是层级排序的简化模型，先比较父组 1 与 2，dialog 整体在后。panel 内部 9999 大于 0，却不能改变父组顺序。它解释比较范围，不是完整 CSS 绘制顺序实现。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "错误修复：无限增大层级或随意隐藏溢出",
      "paragraphs": [
        "弹层被盖住时把 z-index 改成一个更大的数字，若它仍在较低祖先上下文中，就不会解决问题。应检查 transform 等祖先属性，决定移到合适挂载点或使用具有正确合同的原生弹层机制，再验证焦点与关闭行为。",
        "overflow:hidden 可能让视觉上看不见溢出，却同时切掉可操作内容。先明确溢出来自内容不可换行、宽度叠加还是最小尺寸约束，再修相应原因；剪裁只有在产品确实需要时才采用。"
      ]
    },
    {
      "id": "boundaries",
      "title": "两个常被忽略的边界",
      "paragraphs": [
        "第一条边界是绝对定位：它的包含块可能由定位祖先或其他属性建立，并非总是浏览器窗口。第二条边界是 margin 折叠：Flex、Grid 等环境与普通块流规则不同，不能把某次结果推广到所有 display 模式。",
        "第三条边界是特殊顶层：原生 dialog 等元素的 top layer 不等价于普通 z-index 更大。使用时仍须考虑模态行为、可访问名称与焦点，而不是只为绕过遮挡就选择组件。"
      ]
    },
    {
      "id": "application",
      "title": "选择能表达关系的布局方法",
      "paragraphs": [
        "一维分配和对齐常适合 Flex，二维行列关系适合 Grid，文本排版继续使用正常流。不要为了一个简单间距写大量绝对定位；也不要为了让两列对齐就建立复杂运行时测量。",
        "统一 border-box 能降低尺寸推算负担，但不取消内容最小尺寸与溢出问题。设计 token 统一间距，布局规则表达容器与孩子的关系，两者共同使变化可预测。",
        "例如一个可折叠侧栏旁边的主内容包含很长的连续 URL。主内容默认最小尺寸可能由内容决定，侧栏收起后它仍挤出窗口。先在工具里查看主内容的实际最小宽度，再尝试 min-width:0 与合适的换行规则。这样明确允许该项目收缩，并定义内容如何断行，而不是把父容器 overflow 隐藏后让用户看不到末尾。",
        "再考虑卡片标题之间的间距：如果两个普通块的垂直 margin 折叠，看到的距离可能是较大的一项；若把父容器改为 Flex column，就不能继续按同样折叠规则推算。这说明布局重构即使保留数值，也可能改变行为。验收应覆盖长内容、容器变窄、焦点轮廓和弹层，不能只检查桌面截图。"
      ]
    },
    {
      "id": "recall",
      "title": "从尺寸和层级两条路径定位",
      "paragraphs": [
        "尺寸问题画内容、padding、border、margin，再找包含块和最小尺寸；遮挡问题画层叠上下文祖先，再比较同组元素。两个图回答不同问题。",
        "回忆：border-box 是否包含 margin？为什么子层级 9999 仍盖不过兄弟祖先？可将第一例加入 margin 20px，解释为什么 offsetWidth 不会因此增加 40。"
      ]
    }
  ],
  "sources": [
    {
      "title": "MDN：盒模型",
      "url": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model"
    },
    {
      "title": "MDN：层叠上下文",
      "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context"
    }
  ]
};
