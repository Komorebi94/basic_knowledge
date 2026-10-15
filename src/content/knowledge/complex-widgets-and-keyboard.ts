import type { Article } from "../articles";

export const complexWidgetsArticle: Article = {
  id: "K15-07",
  kind: "knowledge",
  domainSlug: "accessibility",
  slug: "complex-widgets-and-keyboard",
  title: "编辑器、表格与复杂控件",
  summary: "提交和数据表用原生控件，选项卡和表格编辑才增加方向键；编辑器在编辑模式里 Tab 缩进，必须有 Esc 回到可离开的导航模式。",
  aliases: ["APG tabs", "data grid", "contenteditable", "复杂控件"],
  tags: ["无障碍", "键盘", "控件"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "笔记表格为什么会把方向键吃掉，编辑器又为什么出不来？",
      paragraphs: [
        "笔记列表是一张普通数据表，作者却监听了方向键，想在行与行之间移动。结果页面不能再用方向键滚动，表本身也没有单元格编辑。代码编辑器则相反：Tab 被用来缩进，键盘用户按 Tab 永远到不了保存按钮，界面也没有写退出方式。选项卡如果每个标签都是一个 Tab 停靠点，标签一多，后面的正文就要按很多次才能到达。",
        "先决定控件是不是浏览器已经提供的那种。提交按钮、日期和只读数据表用原生行为。选项卡、二维编辑网格和会吞掉 Tab 的编辑器才需要额外的键合同。本篇用控件名字和按键返回动作名，不实现焦点移动，也不是 ARIA 创作实践的完整键盘表。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：六种已知控件，编辑器必须带模式",
      paragraphs: [
        "运行 npm run verify:k15。choose 把 submit 映射为 native:button，notes 映射为 native:table，sheet 映射为 grid:arrow-cells，tabs 映射为 tabs:one-tabstop，editor 映射为 editor:mode，date 映射为 native:date。其他名字，包括 menu，返回 invalid。",
        "press 按控件解释按键。选项卡的 Tab 是 leave，ArrowRight 是 next。数据表的 ArrowRight 是 ignore，Tab 是 next-control。网格的 ArrowRight 是 next-cell，Tab 是 leave。编辑器没有 edit 或 navigate 模式时是 invalid；edit 里 Tab 是 indent，Escape 是 navigate；navigate 里 Tab 是 leave，Enter 是 edit。提交按钮的 Enter 是 activate，ArrowRight 是 ignore。"
      ]
    },
    {
      id: "choose",
      title: "只有确实要在内部移动时，才换掉原生控件",
      paragraphs: [
        "submit 用按钮，date 用日期输入。它们的键盘、名称和禁用已经由浏览器提供。notes 保持 native:table：一行笔记不是一个需要方向键逐格编辑的网格。sheet 才是 grid:arrow-cells，因为用户要在单元格之间编辑。tabs 使用 one-tabstop，方向键在已进入的一组标签里移动，Tab 负责离开整组。",
        "editor 返回 editor:mode，表示它至少有两种模式，而不是一个永远吞键的区域。menu 返回 invalid。调用方还没说明这是菜单按钮、菜单栏还是列表框之前，模型不给它编一套方向键。选错模式比暂时不用自定义控件更糟：K15-01 已经说明 role 不会自动补上按键。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function choose(widget) {
  if (widget === 'submit') return 'native:button';
  if (widget === 'notes') return 'native:table';
  if (widget === 'sheet') return 'grid:arrow-cells';
  if (widget === 'tabs') return 'tabs:one-tabstop';
  if (widget === 'editor') return 'editor:mode';
  if (widget === 'date') return 'native:date';
  return 'invalid';
}
for (const widget of ['submit', 'notes', 'sheet', 'tabs', 'editor', 'date', 'menu']) console.log(widget + ':' + choose(widget));`,
          expectedOutput: [
            "submit:native:button",
            "notes:native:table",
            "sheet:grid:arrow-cells",
            "tabs:tabs:one-tabstop",
            "editor:editor:mode",
            "date:native:date",
            "menu:invalid"
          ],
          explanation: [
            "提交、笔记表和日期留在原生控件上。工作表和选项卡才拿到额外的内部导航合同，编辑器则必须分模式。",
            "menu 没有对应项。未知控件返回 invalid，而不是套用选项卡或网格的方向键。"
          ]
        }
      ]
    },
    {
      id: "keys",
      title: "数据表忽略方向键，编辑器要能从缩进模式里退出",
      paragraphs: [
        "选项卡上 ArrowRight 得到 next，Tab 得到 leave。标签内部用方向键换项，整组仍是页面 Tab 顺序上的一个停靠。笔记表上 ArrowRight 得到 ignore，控件自己不消费这个键；Tab 得到 next-control，走向表后面的下一个控件。工作表相反：ArrowRight 是 next-cell，Tab 是 leave，避免用户为了离开网格而把每一格都走完。",
        "编辑器在 edit 模式里按 Tab 得到 indent，这会把用户留在编辑区内。同一模式的 Escape 得到 navigate。进入 navigate 之后，Tab 才是 leave，Enter 才回到 edit。没有传入模式时，编辑器的 Tab 是 invalid，不能默认成缩进或离开。提交按钮的 Enter 是 activate，ArrowRight 是 ignore，普通按钮不需要方向键选择。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function press(widget, key, mode) {
  if (widget === 'tabs' && key === 'Tab') return 'leave';
  if (widget === 'tabs' && key === 'ArrowRight') return 'next';
  if (widget === 'notes' && key === 'ArrowRight') return 'ignore';
  if (widget === 'notes' && key === 'Tab') return 'next-control';
  if (widget === 'sheet' && key === 'ArrowRight') return 'next-cell';
  if (widget === 'sheet' && key === 'Tab') return 'leave';
  if (widget === 'editor') {
    if (mode !== 'edit' && mode !== 'navigate') return 'invalid';
    if (mode === 'edit' && key === 'Tab') return 'indent';
    if (mode === 'edit' && key === 'Escape') return 'navigate';
    if (mode === 'navigate' && key === 'Tab') return 'leave';
    if (mode === 'navigate' && key === 'Enter') return 'edit';
  }
  if (widget === 'submit' && key === 'Enter') return 'activate';
  if (widget === 'submit' && key === 'ArrowRight') return 'ignore';
  return 'invalid';
}
console.log('选项卡离开:' + press('tabs', 'Tab'));
console.log('选项卡下一项:' + press('tabs', 'ArrowRight'));
console.log('表格忽略方向键:' + press('notes', 'ArrowRight'));
console.log('网格下一格:' + press('sheet', 'ArrowRight'));
console.log('网格离开:' + press('sheet', 'Tab'));
console.log('编辑缩进:' + press('editor', 'Tab', 'edit'));
console.log('退出编辑:' + press('editor', 'Escape', 'edit'));
console.log('导航离开:' + press('editor', 'Tab', 'navigate'));
console.log('编辑缺模式:' + press('editor', 'Tab'));
console.log('按钮激活:' + press('submit', 'Enter'));
console.log('按钮忽略方向键:' + press('submit', 'ArrowRight'));`,
          expectedOutput: [
            "选项卡离开:leave",
            "选项卡下一项:next",
            "表格忽略方向键:ignore",
            "网格下一格:next-cell",
            "网格离开:leave",
            "编辑缩进:indent",
            "退出编辑:navigate",
            "导航离开:leave",
            "编辑缺模式:invalid",
            "按钮激活:activate",
            "按钮忽略方向键:ignore"
          ],
          explanation: [
            "笔记表忽略方向键，工作表才用方向键走单元格。两者都给了离开方式，但离开用的键不同。",
            "编辑模式的 Tab 是缩进，所以必须有 Escape 进入导航模式，之后 Tab 才能 leave。缺模式时拒绝猜测。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "动作名不是焦点已经移动，也不是创作实践的全部按键",
      paragraphs: [
        "next、next-cell 和 leave 只是合同里的动作。函数没有设置 tabindex，没有移动 activeElement，也没有实现 roving tabindex。选项卡的 Home、End 和方向键回绕都没有写。网格没有处理 Ctrl、表头和只读单元格。",
        "ignore 表示这个控件不把方向键当成自己的命令。浏览器仍可能用它滚动页面。不要把 ignore 理解成 preventDefault 之后什么都不发生。native:table 也不要再套一层 grid 角色，否则辅助技术会按网格而不是按表来读。",
        "editor 的两种模式必须能被用户发现。只有脚本里写了 Escape，界面上却没说明，键盘用户仍然出不来。日期返回 native:date，不表示每一种浏览器的日期控件体验相同；若真的改画日历，就要另做键盘合同，而不是继续声称它是原生输入。"
      ]
    },
    {
      id: "practice",
      title: "先选控件种类，再写它的离开方式",
      paragraphs: [
        "笔记列表应是 native:table，方向键为 ignore。需要逐格编辑时才用 sheet，ArrowRight 为 next-cell，Tab 为 leave。编辑器在 edit 里 Tab 为 indent 时，必须还能用 Escape 进入 navigate，再 Tab 离开。",
        "本主题没有已开放的独立练习。示例不创建表格或编辑器 DOM，也不代替创作实践里的人工键盘走查。"
      ]
    }
  ],
  sources: [
    { title: "W3C APG：Tabs Pattern", url: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/" },
    { title: "W3C APG：Grid Pattern", url: "https://www.w3.org/WAI/ARIA/apg/patterns/grid/" },
    { title: "MDN：table 元素", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/table" }
  ]
};
