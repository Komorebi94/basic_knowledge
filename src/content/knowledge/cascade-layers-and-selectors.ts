import type { Article } from "../articles";

export const cascadeLayersArticle: Article = {
  "id": "K05-05",
  "kind": "knowledge",
  "domainSlug": "html-css",
  "slug": "cascade-layers-and-selectors",
  "title": "层叠层、选择器与样式组织",
  "summary": "用层叠层把重置、主题和组件分开，说明特异性只在同一层内比较，并用自定义属性承接可替换的主题值。",
  "aliases": [
    "cascade layers",
    "@layer",
    "specificity",
    ":where",
    ":is",
    "custom properties",
    "层叠层"
  ],
  "tags": [
    "HTML",
    "CSS",
    "层叠层、选择器与样式组织"
  ],
  "estimatedMinutes": 24,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "后来写的类为什么盖不过前面的标签选择器？",
      "paragraphs": [
        "组件作者用 .action 设置背景，重置文件里已有 button.action。页面上生效的是重置规则。继续提高选择器，很快出现 #app .toolbar button.action.is-primary。下一次改动又要再加一段。这个问题来自比较顺序：同一层里的特异性、层与层之间的顺序，以及未分层样式相对分层样式的位置，是三件不同的事。",
        "前置是 K05-02 的层叠上下文。z-index 决定绘制分组，本节的层叠层决定同一元素上相互竞争的声明谁赢。两者可以同时存在，但不能用一个解释另一个。示例在空白页插入样式并读取计算后的颜色或外边距，颜色使用 rgb() 的计算值。"
      ]
    },
    {
      "id": "layers",
      "title": "层的顺序先于层内特异性",
      "paragraphs": [
        "没有层时，button.action 的特异性高于 .action，计算背景是 rgb(1, 2, 3)。把这两条规则分别放进先声明的 reset 层和后声明的 theme 层后，后声明的层获胜，背景变成 rgb(4, 5, 6)。theme 里那条规则只有一个类，它能赢是因为层顺序已经决定了比较范围，浏览器不会再拿它和 reset 层里的元素加类比较特异性。",
        "声明层顺序时使用 @layer reset, theme;，后面的层优先。组件样式若必须覆盖主题，应放在更后的层，或者主题本身提供可替换的自定义属性。不要在每一层内部继续堆选择器来跨层取胜。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const style = document.createElement('style');\nconst button = document.createElement('button');\nbutton.className = 'action';\ndocument.body.append(button);\nstyle.textContent = 'button.action { background-color: rgb(1, 2, 3); } .action { background-color: rgb(4, 5, 6); }';\ndocument.head.append(style);\nconsole.log(getComputedStyle(button).backgroundColor);\nstyle.textContent = '@layer reset, theme; @layer reset { button.action { background-color: rgb(1, 2, 3); } } @layer theme { .action { background-color: rgb(4, 5, 6); } }';\nconsole.log(getComputedStyle(button).backgroundColor);\nstyle.remove(); button.remove();",
          "expectedOutput": [
            "rgb(1, 2, 3)",
            "rgb(4, 5, 6)"
          ],
          "explanation": [
            "第一行没有层，元素加类的特异性更高，背景取 rgb(1, 2, 3)。第二行 reset 在 theme 之前声明，theme 中特异性更低的类获胜，背景变为 rgb(4, 5, 6)。",
            "按钮的用户代理样式存在，但这里的作者声明覆盖了背景色。实验只比较这两条作者规则，不说明按钮边框、字体和焦点样式的全部来源。"
          ]
        }
      ]
    },
    {
      "id": "unlayered",
      "title": "未分层的普通声明位于分层声明之后",
      "paragraphs": [
        "先只使用层：components 层里的 #card 设为蓝色，theme 层里的 .card 设为绿色。components 声明得更晚，所以结果是 rgb(0, 0, 255)。随后追加一条未分层的 .card { color: rgb(255, 0, 0); }，结果变成红色。一个类盖过了分层中的 ID。未分层作者样式在普通重要度里排在分层样式之后，这正是第三方样式或临时覆盖突然获胜的原因。",
        "重要度会改变比较桶。下面的 #note 在层内使用 !important，未分层的 .note 是普通声明，计算颜色是 rgb(0, 0, 9)。这条实验证明层内的重要声明可以胜过后来的未分层普通声明。规范还对重要声明使用与普通声明相反的层顺序；本文没有另做两条重要声明互相竞争的实验，涉及那条规则时直接核对 CSS Cascade 的层排序。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const style = document.createElement('style');\nstyle.textContent = '@layer theme, components; @layer components { #card { color: rgb(0, 0, 255); } } @layer theme { .card { color: rgb(0, 128, 0); } }';\ndocument.head.append(style);\nconst card = document.createElement('div');\ncard.id = 'card'; card.className = 'card';\ndocument.body.append(card);\nconsole.log(getComputedStyle(card).color);\nconst extra = document.createElement('style');\nextra.textContent = '.card { color: rgb(255, 0, 0); }';\ndocument.head.append(extra);\nconsole.log(getComputedStyle(card).color);\nconst important = document.createElement('style');\nimportant.textContent = '@layer base { #note { color: rgb(0, 0, 9) !important; } } .note { color: rgb(255, 0, 0); }';\ndocument.head.append(important);\nconst note = document.createElement('div');\nnote.id = 'note'; note.className = 'note';\ndocument.body.append(note);\nconsole.log(getComputedStyle(note).color);\nstyle.remove(); extra.remove(); important.remove(); card.remove(); note.remove();",
          "expectedOutput": [
            "rgb(0, 0, 255)",
            "rgb(255, 0, 0)",
            "rgb(0, 0, 9)"
          ],
          "explanation": [
            "第一行只有层，较晚的 components 层获胜。第二行未分层的类声明胜过层内 ID。第三行中，层内重要声明胜过未分层的普通类声明。",
            "三行分别读取两个元素，避免前一条规则残留。重要声明会提高后续维护成本；主题覆盖优先使用后层或自定义属性，把 !important 留给出于可访问性必须保住的少数规则。"
          ]
        }
      ]
    },
    {
      "id": "specificity",
      "title": ":where 把特异性降到零，:is 保留参数中的最高特异性",
      "paragraphs": [
        "重置和组件骨架适合低特异性，让后面的类可以覆盖。:where(#item) 的特异性为零，因此同一元素上的 .item 获胜，颜色是 rgb(0, 128, 0)。:is(#item) 取参数里最高的特异性，ID 仍然高于类，颜色变为 rgb(0, 0, 1)。选择函数不只是写法更短，它会改变后续规则能否覆盖。",
        "低特异性适合重置、主题变量的默认值和可选增强。组件的状态类保持稳定、可预测的特异性。ID 选择器会让覆盖方也走向 ID，页面结构一变就失效。状态用类或数据属性表达，把 ID 留给标签关联和无障碍引用。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const style = document.createElement('style');\nstyle.textContent = ':where(#item) { color: rgb(0, 0, 1); } .item { color: rgb(0, 128, 0); }';\ndocument.head.append(style);\nconst item = document.createElement('div');\nitem.id = 'item'; item.className = 'item';\ndocument.body.append(item);\nconsole.log(getComputedStyle(item).color);\nstyle.textContent = ':is(#item) { color: rgb(0, 0, 1); } .item { color: rgb(0, 128, 0); }';\nconsole.log(getComputedStyle(item).color);\nstyle.remove(); item.remove();",
          "expectedOutput": [
            "rgb(0, 128, 0)",
            "rgb(0, 0, 1)"
          ],
          "explanation": [
            ":where() 不把参数中的 ID 带入特异性，类规则获胜。:is() 采用参数的最高特异性，ID 规则获胜，尽管类规则写在后面。",
            "示例用罕见颜色避免和用户代理默认文本色混淆。真实主题应把颜色放进命名属性，而不是在选择器竞争里直接写死颜色值。"
          ]
        }
      ]
    },
    {
      "id": "tokens",
      "title": "主题值用自定义属性继承，缺失时给出后备",
      "paragraphs": [
        "自定义属性按继承传递。父元素设置 --space:12px，子元素的 margin-left 使用 var(--space)，计算值为 12px。子元素再设置同名属性为 4px 后，计算值变为 4px。主题在祖先替换属性，组件在局部收窄，不需要重新写一整套选择器。",
        "var(--missing, 7px) 在属性不存在时使用 7px。后备值适合组件独立渲染；真正的产品主题仍应在稳定祖先提供完整属性，避免每个组件各自发明颜色。属性名表达用途，例如 --space-action 或 --color-action，不要把偶然的像素值写进名称。",
        "层负责规则的优先级，自定义属性负责可替换的值。重置层用 :where() 建立低特异性基础，主题层设置属性，组件层只消费属性并描述结构。临时调试可以加一条未分层规则，合并前要移回它所属的层，否则它会长期压过层内更具体的选择器。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const host = document.createElement('div');\nconst child = document.createElement('div');\nhost.append(child); document.body.append(host);\nhost.style.setProperty('--space', '12px');\nchild.style.marginLeft = 'var(--space)';\nconsole.log(getComputedStyle(child).marginLeft);\nchild.style.setProperty('--space', '4px');\nconsole.log(getComputedStyle(child).marginLeft);\nchild.style.marginLeft = 'var(--missing, 7px)';\nconsole.log(getComputedStyle(child).marginLeft);\nhost.remove();",
          "expectedOutput": [
            "12px",
            "4px",
            "7px"
          ],
          "explanation": [
            "第一行子元素继承父元素的 --space。第二行子元素的同名属性覆盖继承值。第三行引用一个未定义属性，因此使用声明里的 7px 后备。",
            "自定义属性的继承和外边距的物理方向是两件事。需要跟随书写方向时，间距应改用 K05-07 的逻辑属性，属性值本身仍可以由主题提供。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "用更高特异性修补覆盖，会把层顺序隐藏起来",
      "paragraphs": [
        "错误修复是在组件里追加 #app button.action.action。它可能暂时变色，但下一次重置或未分层样式仍会从另一条路径获胜。修复时先确认规则当前在哪一层、是否重要、是否未分层，再把声明移到正确的层。",
        "也不要让每个组件复制主题色。颜色一旦写进选择器，暗色主题、高对比度和局部实验都要再赢一次特异性。组件消费自定义属性，主题只替换属性值，状态类只改变使用哪一个属性。"
      ]
    },
    {
      "id": "boundaries",
      "title": "层叠层不解决全部样式冲突",
      "paragraphs": [
        "第一条边界是来源和重要度。用户样式、过渡、动画和 !important 处在层顺序之外的比较阶段。本节实验只覆盖作者普通声明，以及一条层内重要声明对未分层普通声明的结果。",
        "第二条边界是元素的内联样式和影子树。内联声明有自己的位置；Shadow DOM 的样式封装不会因为页面使用了 @layer 就自动打通。组件库若同时提供层和影子树，文档要写明入口，调用方只通过公开的属性或部件覆盖。"
      ]
    },
    {
      "id": "practice",
      "title": "先说出比较范围，再预测颜色",
      "paragraphs": [
        "给自己三道预测：无层时 button.action 和 .action 谁生效；二者进入 reset 与 theme 后谁生效；未分层的类和层内 ID 谁生效。预测时先写“是否同一层”，再写特异性。把 :where(#item) 换成 :is(#item) 时，指出特异性来自哪里。",
        "然后检查一个真实组件的覆盖点是否是自定义属性。若必须新增选择器才能改一个颜色，把颜色移回主题属性。E27 至 E29 还没有独立练习，本节用空白页读计算样式作为证据。"
      ]
    }
  ],
  "sources": [
    {
      "title": "CSS Cascade：层叠层",
      "url": "https://drafts.csswg.org/css-cascade-5/#layering"
    },
    {
      "title": "CSS Cascade：特异性",
      "url": "https://drafts.csswg.org/css-cascade-5/#cascade-specificity"
    }
  ]
};
