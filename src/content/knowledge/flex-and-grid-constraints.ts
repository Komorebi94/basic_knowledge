import type { Article } from "../articles";

export const flexGridConstraintsArticle: Article = {
  "id": "K05-03",
  "kind": "knowledge",
  "domainSlug": "html-css",
  "slug": "flex-and-grid-constraints",
  "title": "Flex 与 Grid 的约束",
  "summary": "固定内容宽度后，分别读取 Flex 项目和 Grid 轨道的占用，解释最小尺寸、伸缩和溢出各发生在哪一层。",
  "aliases": [
    "flex",
    "grid",
    "min-width",
    "minmax",
    "flex-basis",
    "内容最小宽度"
  ],
  "tags": [
    "HTML",
    "CSS",
    "Flex 与 Grid 的约束"
  ],
  "estimatedMinutes": 24,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "侧栏已经写了 flex:1，为什么长地址还是把整行挤出屏幕？",
      "paragraphs": [
        "工具栏里有一段不可断行的地址，旁边是固定的操作按钮。作者给地址容器写了 flex:1 1 0，期望它占满剩余空间并在内部省略。页面变窄后，地址没有省略，按钮被推出可视区域。这时需要分开看三层尺寸：内容的最小贡献、Flex 项目或 Grid 轨道的可用空间，以及溢出之后由谁滚动或裁剪。",
        "前置是 K05-02 的盒模型。本文示例在独立空白页创建固定宽度的容器，用明确的子元素宽度代替具体字体的字形宽度，因此读到的像素不依赖本机字体。示例结束后移除节点。这些数字说明布局规则，不代表某次真实文案在所有系统和缩放下的换行位置。"
      ]
    },
    {
      "id": "minimum",
      "title": "默认最小尺寸会拒绝项目缩到比内容更窄",
      "paragraphs": [
        "Flex 项目的默认 min-width 是 auto。自动最小尺寸会考虑内容的最小贡献。下面的内层宽度是 180px，外层 Flex 容器只有 100px，项目虽然写了 flex:1 1 0px，初始结果仍然是 180px。flex-basis:0 只说明伸缩计算的起点，它没有取消最小尺寸这道下限。",
        "把项目的 min-width 改为 0 后，项目边框盒变成 100px，但内层仍是 180px，容器的 scrollWidth 也仍是 180px。允许项目变窄，只是让项目的边框盒服从容器；可见溢出继续把可滚动范围撑大。再给项目设置 overflow:hidden，容器的 scrollWidth 才回到 100px。此时项目自己的 scrollWidth 仍是 180px，说明内容还在，只是被这个项目裁剪，不再扩大祖先的滚动范围。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const host = document.createElement('div');\nhost.style.cssText = 'display:flex;width:100px';\nconst item = document.createElement('div');\nitem.style.cssText = 'flex:1 1 0px;min-width:auto';\nconst inner = document.createElement('div');\ninner.style.cssText = 'width:180px;height:10px';\nitem.append(inner); host.append(item); document.body.append(host);\nconsole.log([item.offsetWidth, host.scrollWidth].join(','));\nitem.style.minWidth = '0px';\nconsole.log([item.offsetWidth, host.scrollWidth, inner.offsetWidth].join(','));\nitem.style.overflow = 'hidden';\nconsole.log([item.offsetWidth, host.scrollWidth, item.scrollWidth].join(','));\nhost.remove();",
          "expectedOutput": [
            "180,180",
            "100,180,180",
            "100,100,180"
          ],
          "explanation": [
            "第一行是默认自动最小尺寸：项目和容器滚动宽度都是内容的 180px。第二行把下限改为 0，项目边框盒缩到容器的 100px，内层和容器滚动宽度仍是 180px。第三行由该项目裁剪后，容器滚动宽度变为 100px，项目内部仍能报出 180px 的内容宽度。",
            "这里的 180px 是实验用的固定内容盒，用来隔离字形测量。真实地址还要决定换行、overflow-wrap 或文本省略。裁剪会切掉可选择和可聚焦的内容，只有产品确实要求隐藏时才使用。"
          ]
        }
      ]
    },
    {
      "id": "tracks",
      "title": "1fr 的轨道最小值默认包含内容",
      "paragraphs": [
        "Grid 的 1fr 是 minmax(auto, 1fr) 的写法。auto 最小值会采纳格子的最小贡献。容器宽 200px、第二列 80px 时，若第一格里有 300px 的内容，第一列在这个实验中变成 300px，网格边框盒仍是指定的 200px，scrollWidth 则是 380px。轨道溢出和容器的 width 可以同时成立。",
        "同一条 1fr 模板下，把格子的 min-width 设为 0，第一列变为 120px，scrollWidth 变为 300px。改用 minmax(0, 1fr) 并且保留格子的默认最小尺寸，这个实验也得到 120px 的列和 300px 的滚动宽度。两条路径都让列可以小于内容，但 300px 的子元素仍然溢出。只有格子再设置 overflow:hidden，网格 scrollWidth 才变为 200px。因此“列变窄”和“内容被裁剪”是先后两个决定。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function measure(name, template, itemCss) {\n  const grid = document.createElement('div');\n  grid.style.cssText = 'display:grid;width:200px;grid-template-columns:' + template;\n  const cell = document.createElement('div');\n  cell.style.cssText = itemCss;\n  const wide = document.createElement('div');\n  wide.style.cssText = 'width:300px;height:8px';\n  cell.append(wide);\n  const side = document.createElement('div');\n  side.style.height = '8px';\n  grid.append(cell, side);\n  document.body.append(grid);\n  console.log(name + ':' + [cell.offsetWidth, side.offsetWidth, grid.offsetWidth, grid.scrollWidth].join(','));\n  grid.remove();\n}\nmeasure('default', '1fr 80px', '');\nmeasure('item-min', '1fr 80px', 'min-width:0');\nmeasure('track-min', 'minmax(0,1fr) 80px', '');\nmeasure('clipped', 'minmax(0,1fr) 80px', 'overflow:hidden');",
          "expectedOutput": [
            "default:300,80,200,380",
            "item-min:120,80,200,300",
            "track-min:120,80,200,300",
            "clipped:120,80,200,200"
          ],
          "explanation": [
            "四段输出依次是格子宽度、侧列宽度、网格边框盒宽度和网格滚动宽度。default 的第一列被 300px 内容抬高，滚动宽度为 380px。item-min 与 track-min 都把第一列降到 120px，滚动宽度仍反映 300px 内容。clipped 在轨道变窄后裁剪格子，网格滚动宽度回到 200px。",
            "这个空白页实验说明两种写法都能让该列小于内容。网格定义是整组轨道的合同时，minmax(0, 1fr) 把下限写在轨道上；只有某一个格子允许小于内容时，再调整该格子的 min-width。二者都不会自动缩小子元素的 300px 宽度。"
          ]
        }
      ]
    },
    {
      "id": "distribution",
      "title": "相同的 flex-grow 仍按基准分配剩余空间",
      "paragraphs": [
        "两个项目都写 flex-grow:1，并不表示最终宽度各占一半。可用空间先减去 flex-basis，再把剩余空间按增长因子分配。容器 200px、基准分别是 40px 和 80px 时，剩余 80px，两边增长因子相同，于是各增加 40px，得到 80px 和 120px。",
        "若第一个项目改为 flex:0 0 40px，它不再增长或收缩，第二个项目获得剩下的 160px。flex:0 0 70px 的两个项目放进 100px 且不换行时，每个项目保持 70px，容器边框盒是 100px，滚动宽度是 140px。允许换行后，第二行出现，容器高度变为 16px，横向滚动宽度回到 100px。换行改变的是行的数量，不会把 flex:0 0 的项目压成更窄的宽度。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const host = document.createElement('div');\nhost.style.cssText = 'display:flex;width:200px';\nconst a = document.createElement('div');\nconst b = document.createElement('div');\na.style.cssText = 'flex:1 1 40px;height:10px';\nb.style.cssText = 'flex:1 1 80px;height:10px';\nhost.append(a, b); document.body.append(host);\nconsole.log([a.offsetWidth, b.offsetWidth].join(','));\na.style.flex = '0 0 40px';\nb.style.flex = '1 1 80px';\nconsole.log([a.offsetWidth, b.offsetWidth].join(','));\nhost.remove();",
          "expectedOutput": [
            "80,120",
            "40,160"
          ],
          "explanation": [
            "第一行的基准和是 120px，剩余 80px 被两个增长因子平分，所以 40px 基准变成 80px，80px 基准变成 120px。第二行冻结第一项，第二项吃掉剩余空间，得到 40px 和 160px。",
            "读取 offsetWidth 会要求完成布局。示例用固定基准避免字体影响，真实文字的最小贡献仍可能高于 flex-basis，需要和上一节的自动最小尺寸一起看。"
          ]
        },
        {
          "language": "javascript",
          "code": "const host = document.createElement('div');\nhost.style.cssText = 'display:flex;flex-wrap:nowrap;width:100px';\nfor (const size of [70, 70]) {\n  const item = document.createElement('div');\n  item.style.cssText = 'flex:0 0 ' + size + 'px;height:8px';\n  host.append(item);\n}\ndocument.body.append(host);\nconsole.log([host.offsetWidth, host.scrollWidth, host.children[0].offsetWidth, host.children[1].offsetWidth].join(','));\nhost.style.flexWrap = 'wrap';\nconsole.log([host.offsetHeight, host.scrollWidth].join(','));\nhost.remove();",
          "expectedOutput": [
            "100,140,70,70",
            "16,100"
          ],
          "explanation": [
            "收缩因子为 0 时，两个 70px 项目保持原宽，100px 容器出现 140px 的横向滚动宽度。换行后每个项目仍是 70px，它们分成两行，行高 8px，容器高度为 16px，横向滚动宽度回到容器宽度。",
            "示例没有设置 gap 和边框。真实组件要加上间距、边框和滚动条占用后再判断一行能否放下。换行还会改变阅读顺序和可达性，不能只看是否消除了横向滚动条。"
          ]
        }
      ]
    },
    {
      "id": "overflow",
      "title": "先判定溢出属于哪一层，再选择滚动、换行或裁剪",
      "paragraphs": [
        "排查时按这个顺序记录：内容本身的宽度、项目或格子的边框盒、轨道或 Flex 行的合计、容器的客户区与滚动宽度。内容宽于项目，说明下限或轨道已经允许项目变窄，剩下的是内容策略。项目宽于容器，说明最小尺寸、基准或轨道最小值仍在拒绝收缩。容器边框盒正确但 scrollWidth 更大，说明可见溢出仍在扩大滚动范围。",
        "文本可以使用换行、overflow-wrap 或有限行数的省略；控件和图片通常应该保留完整可操作区域，改为滚动或换行，而不是裁掉按钮。Grid 的固定轨道、minmax 和 auto-fit 适合表达列数合同。Flex 适合一行或一列里的分配和对齐。二维对齐若靠 Flex 嵌套硬凑，最小尺寸会在每一层重复出现，排查路径也会变长。"
      ]
    },
    {
      "id": "mistakes",
      "title": "把溢出隐藏加在最外层，常常藏住真正的尺寸合同",
      "paragraphs": [
        "最常见的错误是容器一溢出就写 overflow:hidden。工具栏的按钮可能被剪掉，键盘用户仍能聚焦到看不见的控件。修复要先让可操作项目保持完整尺寸，再让允许收缩的文本项目使用 min-width:0，并为文本选择换行或省略。",
        "另一个错误是只改 flex-basis 或只把 Grid 写成 1fr，却不检查内容的最小贡献。上面的实验已经显示，basis 为 0 的 Flex 项目仍可能是 180px，1fr 的列仍可能是 300px。布局声明描述分配方式，内容的最小尺寸是另一条输入。"
      ]
    },
    {
      "id": "boundaries",
      "title": "固定像素实验留下两个需要另测的边界",
      "paragraphs": [
        "第一条边界是字体和缩放。本实验用明确宽度代替文字，避免把某套字体的测量写成规则。真实多语言字符串还要看 K05-07 的长度和书写方向；逻辑属性下的 inline 尺寸才会跟随方向变化。",
        "第二条边界是嵌套滚动和间距。gap、边框、滚动条和百分比都改变可用空间。子网格、绝对定位子元素和替换元素的固有尺寸也会改变最小贡献。示例没有覆盖这些组合，接到生产组件时要用同一套测量顺序在目标容器里复测。"
      ]
    },
    {
      "id": "practice",
      "title": "换一组宽度，预测项目、轨道和滚动范围",
      "paragraphs": [
        "把最小尺寸实验的容器改成 140px、内层改成 160px，先预测三行输出，再在空白页运行。再预测：两个 flex:1 1 50px 的项目放进 200px 容器时各是多少；把其中一项改成 flex:0 0 50px 后又是多少。预测和结果不一致时，列出基准、剩余空间和最小尺寸，不要只改一个看起来相关的属性。",
        "E27、E28、E29 仍是待制作的交互练习。本文提供可复现的布局测量，不把未交付题目显示为可练。"
      ]
    }
  ],
  "sources": [
    {
      "title": "CSS Flexible Box：自动最小尺寸",
      "url": "https://drafts.csswg.org/css-flexbox-1/#min-size-auto"
    },
    {
      "title": "CSS Grid：轨道与灵活长度",
      "url": "https://drafts.csswg.org/css-grid-1/#track-sizing"
    }
  ]
};
