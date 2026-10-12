import type { Article } from "../articles";

export const responsiveContainerArticle: Article = {
  "id": "K05-04",
  "kind": "knowledge",
  "domainSlug": "html-css",
  "slug": "responsive-container-queries",
  "title": "响应式与容器查询",
  "summary": "比较视口媒体查询和容器查询的触发对象，并用特性检测决定侧栏等增强，同时保留窄容器里的可用布局。",
  "aliases": [
    "container query",
    "media query",
    "@container",
    "@supports",
    "responsive",
    "容器查询"
  ],
  "tags": [
    "HTML",
    "CSS",
    "响应式与容器查询"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "组件在宽页面里很窄，为什么仍套用了桌面断点？",
      "paragraphs": [
        "卡片被放进 300px 的侧栏，标题却用了为整页 1200px 准备的大字号，侧栏说明也被显示出来。作者查询的是视口，组件实际可用的是父容器。断点应该回答“谁的尺寸变了”：整页导航、安全区和设备方向适合看视口；可重用卡片、分栏和工具条适合看容器。",
        "前置是 K05-03 的最小尺寸和轨道。容器查询不能取消内容最小宽度，它只是按容器尺寸切换规则。本文在空白页注入样式并读取计算后的字号、显示和宽度。视口查询的布尔值来自该空白页的视口；验证脚本使用的默认视口宽于 400px。换一台窄视口设备时，这个布尔值可以改变，容器尺寸的结论仍按容器宽度判断。"
      ]
    },
    {
      "id": "viewport",
      "title": "媒体查询看视口，容器查询看被指定的容器",
      "paragraphs": [
        "container-type:inline-size 让元素成为查询容器，子元素可以用 @container (min-width:400px) 读取它的内联尺寸。容器宽 420px 时，标题的计算字号是 24px。把同一个容器改成 300px 后，字号回到基础规则的 16px。两次读取时，matchMedia('(min-width: 400px)') 都是 true，因为变化的是容器，视口并没有变窄。",
        "因此把组件断点写成视口媒体查询，会让同一张卡片在宽页面的窄栏里错误地使用宽布局。页面级规则继续用媒体查询：例如整页边距、打印和减少动态效果。组件级规则放到容器查询，并且让基础样式在查询不生效时仍然可用。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const style = document.createElement('style');\nstyle.textContent = '.cq{container-type:inline-size;width:420px}.label{font-size:16px}@container (min-width:400px){.label{font-size:24px}}';\ndocument.head.append(style);\nconst box = document.createElement('div');\nbox.className = 'cq';\nconst label = document.createElement('div');\nlabel.className = 'label';\nlabel.textContent = 'A';\nbox.append(label); document.body.append(box);\nconsole.log([getComputedStyle(label).fontSize, matchMedia('(min-width: 400px)').matches, box.offsetWidth].join(' '));\nbox.style.width = '300px';\nconsole.log([getComputedStyle(label).fontSize, matchMedia('(min-width: 400px)').matches, box.offsetWidth].join(' '));\nstyle.remove(); box.remove();",
          "expectedOutput": [
            "24px true 420",
            "16px true 300"
          ],
          "explanation": [
            "第一行容器为 420px，达到容器查询的 400px 条件，字号是 24px。第二行容器改为 300px，容器查询不再套用，字号回到 16px。两行的 true 都来自视口查询，说明视口没有跟随容器宽度变化。",
            "输出中的 true 依赖空白页视口宽于 400px。这个实验要证明的关系是：容器宽度改变字号，视口查询保持自己的结果。若在窄视口运行，第二个布尔值可能为 false，前两个字段仍应按容器宽度解释。"
          ]
        }
      ]
    },
    {
      "id": "container",
      "title": "增强布局写在查询里，窄容器保留完整任务",
      "paragraphs": [
        "卡片默认是 280px 的单栏，侧栏 display 为 none。容器达到 360px 后，侧栏变为 block，并在 420px 的容器里占 80px。基础样式先保证标题和主要操作存在；容器查询只增加侧栏这块额外空间才能容纳的内容。查询失效、样式被拦截或容器一直很窄时，主任务仍在单栏里。",
        "内联宽度 420px 会覆盖样式表里的 width:auto，所以实验中的卡片保持 420px。容器查询比较的是容器当时的内联尺寸，不要求宽度本身也由查询设置。组件作者要避免查询条件和内容最小宽度互相打架：侧栏出现后，主栏仍需要 K05-03 的可收缩下限，否则两列会把卡片重新撑破。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const style = document.createElement('style');\nstyle.textContent = '.card{container-type:inline-size;display:flex;width:280px}.side{display:none;width:80px;height:10px}@container (min-width:360px){.card{width:auto}.side{display:block}}';\ndocument.head.append(style);\nconst card = document.createElement('div');\ncard.className = 'card';\nconst main = document.createElement('div');\nmain.style.cssText = 'flex:1 1 auto;height:10px';\nconst side = document.createElement('div');\nside.className = 'side';\ncard.append(main, side); document.body.append(card);\nconsole.log([getComputedStyle(side).display, card.offsetWidth].join(','));\ncard.style.width = '420px';\nconsole.log([getComputedStyle(side).display, side.offsetWidth, card.offsetWidth].join(','));\nstyle.remove(); card.remove();",
          "expectedOutput": [
            "none,280",
            "block,80,420"
          ],
          "explanation": [
            "280px 低于 360px，侧栏保持 none，卡片宽度为 280px。把内联宽度设为 420px 后，容器查询生效，侧栏显示且宽度为 80px，卡片为 420px。",
            "内联 width 优先于查询里的 width:auto，因此卡片没有被查询改回自动宽度。这个结果适合说明查询条件和元素自身样式分层；生产代码应让容器宽度来自实际父级，而不是为了演示写死像素。"
          ]
        }
      ]
    },
    {
      "id": "supports",
      "title": "特性检测决定能否启用增强，不替代布局验证",
      "paragraphs": [
        "CSS.supports 回答当前环境是否识别某项声明。display:grid 和 container-type:inline-size 在本实验的浏览器中为 true，虚构的 display:frobnicate 为 false。支持为 false 时保留基础布局；支持为 true 只说明语法可用，仍要验证查询是否按预期切换、焦点顺序是否合理、窄容器是否溢出。",
        "渐进增强的顺序是：先写不依赖新特性的可完成界面，再把分栏、更大字号或补充信息放进 @supports 与 @container。不要先写只在新特性下成立的结构，再试图用脚本补回旧环境。检测结果也不要缓存到永久版本判断里，同一页面的 iframe 和后续浏览器升级都可能不同。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "console.log(CSS.supports('display: grid'));\nconsole.log(CSS.supports('container-type: inline-size'));\nconsole.log(CSS.supports('display: frobnicate'));",
          "expectedOutput": [
            "true",
            "true",
            "false"
          ],
          "explanation": [
            "前两项是当前浏览器认识的声明，第三项是故意不存在的显示值。false 用来确认检测会拒绝未知声明，而不是对任何字符串返回 true。",
            "检测通过后仍要运行前面的尺寸实验。语法支持和本页容器达到断点是两个条件，缺一都不能解释组件为什么呈现某个布局。"
          ]
        }
      ]
    },
    {
      "id": "enhancement",
      "title": "按稳定的内容和任务选择断点",
      "paragraphs": [
        "断点来自组件内容发生实质变化的宽度：一行按钮开始溢出、侧栏开始有意义、标题可以增加行距。先用内容摆出窄、中、宽三种真实状态，再记录触发宽度。按设备名称复制 375、768、1440 这类清单，常常和实际字体、翻译长度及嵌入位置错开。",
        "页面可以同时保留少量视口规则。整页换到单列、打印隐藏导航、减少动态效果，这些条件的主体是页面或用户偏好。卡片内部的侧栏则看卡片容器。两套查询表达两个主体，避免一张卡片既监听视口又监听容器后无法判断是哪一个条件生效。"
      ]
    },
    {
      "id": "mistakes",
      "title": "查询容器和断点条件需要显式建立",
      "paragraphs": [
        "只写 @container 而祖先没有 container-type 或 container-name 时，查询没有可测量的容器，增强规则不会按作者想象生效。样式应该让基础布局可见，便于发现查询没有挂上。命名容器可以避免组件嵌套时读到外层容器的尺寸。",
        "另一个错误是在查询中改变结构顺序或移除主操作。用户把窗口拉窄再拉宽时，主要按钮应保持可发现。容器查询适合改变间距、列数和补充区域，不适合把唯一的提交按钮放到某个宽度以上才存在。"
      ]
    },
    {
      "id": "boundaries",
      "title": "容器查询有明确的能力边界",
      "paragraphs": [
        "第一条边界是查询对象。inline-size 查询内联尺寸，不自动表达块向尺寸、内容是否被裁剪或滚动位置。需要根据高度分支时，要确认使用的容器类型和性能影响，并用实际高度复测。",
        "第二条边界是兼容与嵌套。特性检测为 false 的环境只拥有基础布局，这要求基础布局本身完成任务。嵌套查询容器会让子组件读到最近的合格容器；组件文档需要写明它查询的是自身还是父级。本文没有把某一年份的全球支持率写成结论。"
      ]
    },
    {
      "id": "practice",
      "title": "用两个宽度预测字号和侧栏",
      "paragraphs": [
        "不看输出，先回答：容器从 420px 改为 300px 时，标题字号哪个值会变，视口查询哪个值可以不变。再预测侧栏在 280px 和 420px 下的 display。然后把断点改成 240px，预测 280px 的卡片是否会显示侧栏。",
        "最后检查窄状态能否完成主任务：标题、主要按钮和必要说明都在，侧栏只是附加信息。E27 至 E29 尚未做成可运行练习，这里用空白页实验验证规则。"
      ]
    }
  ],
  "sources": [
    {
      "title": "CSS Conditional Rules：容器查询",
      "url": "https://drafts.csswg.org/css-conditional-5/#container-queries"
    },
    {
      "title": "Media Queries：视口与用户偏好",
      "url": "https://drafts.csswg.org/mediaqueries-5/"
    }
  ]
};
