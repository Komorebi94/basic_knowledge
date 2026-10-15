import type { Article } from "../articles";

export const internationalTypographyArticle: Article = {
  "revision": 2,
  "id": "K05-07",
  "kind": "knowledge",
  "domainSlug": "html-css",
  "slug": "international-typography",
  "title": "国际化排版与逻辑属性",
  "summary": "用逻辑属性让同一套间距跟随书写方向，并用可收缩的 Flex 项目容纳更长的文案，同时认清字体检测的真实含义。",
  "aliases": [
    "logical properties",
    "RTL",
    "writing-mode",
    "font fallback",
    "国际化",
    "逻辑属性"
  ],
  "tags": [
    "HTML",
    "CSS",
    "国际化排版与逻辑属性"
  ],
  "estimatedMinutes": 23,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "翻译变长、方向改为从右向左后，按钮为什么叠在文字上？",
      "paragraphs": [
        "界面按中文短标签设计：左边 16px 间距、右边操作按钮。阿拉伯语翻译更长，并且书写方向从右向左。原来写死的 margin-left 仍留在物理左侧，按钮宽度也不让步，长文本和按钮重叠或被推出容器。国际化布局要同时处理方向、轴和长度三件事。",
        "前置是 K05-03 的 Flex 最小尺寸。本节用 dir 和 writing-mode 读取逻辑属性对应的物理边，再用固定内容宽度代表更长的翻译，避免把某套字体的字形宽度写成普遍规则。字体检测示例说明 FontFaceSet.check 的返回值代表什么。"
      ]
    },
    {
      "id": "logical",
      "title": "逻辑属性跟随书写轴，而不是固定在屏幕的左右",
      "paragraphs": [
        "margin-inline-start 和 padding-inline-end 使用当前元素的行内方向。水平从左向右时，16px 外边距落在左边，8px 内边距落在右边。同一元素 dir 改为 rtl 后，16px 外边距落到右边，8px 内边距落到左边。规则文本没有改，物理边交换了。",
        "writing-mode:vertical-rl 改变的是轴。此时行内方向变为纵向，margin-inline-start 的 16px 出现在上边，padding-inline-end 的 8px 出现在下边。若改为 margin-block-start:16px，块起点在这个竖排模式里对应右边，计算后的 margin-right 为 16px。行内与块向要按当前书写模式理解，不能看见 start 就假设它永远是左边或上边。",
        "组件的间距、边框和定位偏移优先使用逻辑属性。真正必须固定在设备物理方向的效果，例如一条始终贴着屏幕右缘的系统手柄，才使用物理属性，并在文档里说明它故意不跟随文字方向。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function read(label, dir, writingMode, block) {\n  const box = document.createElement('div');\n  box.dir = dir;\n  box.style.cssText = 'position:absolute;width:100px;height:40px;margin:0;padding:0;border:0';\n  if (writingMode) box.style.writingMode = writingMode;\n  if (block) box.style.marginBlockStart = '16px';\n  else { box.style.marginInlineStart = '16px'; box.style.paddingInlineEnd = '8px'; }\n  document.body.append(box);\n  const cs = getComputedStyle(box);\n  console.log([label, cs.writingMode, cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft, cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(','));\n  box.remove();\n}\nread('ltr', 'ltr');\nread('rtl', 'rtl');\nread('vertical', 'ltr', 'vertical-rl');\nread('block', 'ltr', 'vertical-rl', true);",
          "expectedOutput": [
            "ltr,horizontal-tb,0px,0px,0px,16px,0px,8px,0px,0px",
            "rtl,horizontal-tb,0px,16px,0px,0px,0px,0px,0px,8px",
            "vertical,vertical-rl,16px,0px,0px,0px,0px,0px,8px,0px",
            "block,vertical-rl,0px,16px,0px,0px,0px,0px,0px,0px"
          ],
          "explanation": [
            "每行依次是标签、书写模式、上右下左外边距和上右下左内边距。ltr 的行内起点在左、终点在右。rtl 对调这两侧。vertical-rl 让行内起点到上边、行内终点到下边。最后一行单独设置块起点，16px 出现在右边。",
            "dir 改变方向，writing-mode 改变哪一条轴是行内轴。示例把两种变化分开，便于对照物理边。真实文本还要处理标点、数字和双向文本的排序，方向属性不能代替这些语言规则。"
          ]
        }
      ]
    },
    {
      "id": "length",
      "title": "为更长的文案预留可收缩的空间",
      "paragraphs": [
        "翻译长度不能按中文标签估算。实验用 280px 的内容盒代表一段更长的文字，操作区固定 64px，整行容器为 200px。文本项目保持默认 min-width:auto 时，文本项目宽 280px，操作区 64px，容器边框盒仍是 200px，滚动宽度达到 344px。按钮没有被压扁，长内容把行撑出容器。",
        "文本项目改为 min-width:0 并裁剪溢出后，文本项目宽 136px，操作区仍是 64px，容器滚动宽度回到 200px。136px 加 64px 等于容器宽度。这个结果沿用 K05-03：允许收缩的是文本项目，必须保持完整的是操作区。裁剪只适合确定可以省略的文本；若整句都不能省略，应让行换行或让容器滚动，而不是切掉操作按钮。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function row(css) {\n  const host = document.createElement('div');\n  host.style.cssText = 'display:flex;width:200px';\n  const label = document.createElement('div');\n  label.style.cssText = css;\n  const text = document.createElement('div');\n  text.style.cssText = 'width:280px;height:12px';\n  label.append(text);\n  const action = document.createElement('div');\n  action.style.cssText = 'flex:0 0 64px;height:12px';\n  host.append(label, action); document.body.append(host);\n  const line = [label.offsetWidth, action.offsetWidth, host.offsetWidth, host.scrollWidth].join(',');\n  host.remove();\n  return line;\n}\nconsole.log(row('flex:1 1 auto;min-width:auto;height:12px'));\nconsole.log(row('flex:1 1 auto;min-width:0px;overflow:hidden;height:12px'));",
          "expectedOutput": [
            "280,64,200,344",
            "136,64,200,200"
          ],
          "explanation": [
            "第一行文本项目拒绝窄于 280px 内容，加上 64px 操作区，滚动宽度为 344px。第二行文本项目可以缩到 136px，操作区保持 64px，容器不再横向溢出。",
            "280px 是受控的内容宽度，用来代表长翻译，不是某种语言的真实字符串宽度。上线前用最长的目标译文、用户字号和 200% 缩放再测一次。"
          ]
        }
      ]
    },
    {
      "id": "fallback",
      "title": "字体列表是候选，check 只说明能否立即绘制",
      "paragraphs": [
        "元素指定 MissingLessonFont, sans-serif 时，计算后的 font-family 仍是这个候选列表。document.fonts.check('16px MissingLessonFont') 和检查 sans-serif 都返回 true。check 的含义是：用该字体规格绘制文本时，是否不必等待尚未加载完成的字体。未知家族会退到已经可用的字体，所以 true 不能证明 MissingLessonFont 已安装。",
        "字体回退会改变字形宽度、行高和基线。布局若按某一种字体刚好卡进一行，回退字体可能换行或溢出。组件给出有序字体栈，包含通用家族作为最后候选，并让容器能容纳宽度变化。需要确切品牌字体时，使用字体加载流程并准备加载中的备用度量，不要把 check 的 true 当作文件存在的证明。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const el = document.createElement('div');\nel.style.fontFamily = 'MissingLessonFont, sans-serif';\ndocument.body.append(el);\nconsole.log(getComputedStyle(el).fontFamily);\nconsole.log(document.fonts.check('16px MissingLessonFont'));\nconsole.log(document.fonts.check('16px sans-serif'));\nel.remove();",
          "expectedOutput": [
            "MissingLessonFont, sans-serif",
            "true",
            "true"
          ],
          "explanation": [
            "计算样式保留作者写的候选顺序。两个 check 都为 true，说明当前可以用已有字体绘制，不能据此判断第一个家族已经安装。",
            "不同操作系统的通用家族对应不同字体，advance width 会变化。本文故意不记录某个字符串的像素宽度，避免把一台机器的测量当成排版规则。"
          ]
        }
      ]
    },
    {
      "id": "writing",
      "title": "方向、语言和字符串内容要一起交给平台",
      "paragraphs": [
        "在承载文本的元素上设置正确的 dir 和 lang。dir 影响逻辑属性、对齐起点和部分标点的方向；lang 影响断行、引号和字体选择。只在根元素设置一种语言，会让嵌入的另一段引文沿用错误规则。混合方向的字符串，例如从右向左的句子里出现订单号，需要让隔离的文本片段拥有自己的方向，避免数字和中性符号跑到意外的一侧。",
        "图标按钮的间距使用逻辑属性后，图标顺序也要按阅读起点排列。一个从左到右看起来像“文字然后按钮”的工具栏，在从右向左时起点应在右边。不要用 scaleX(-1) 翻折整个组件来模拟方向，那会翻转图标含义、文本和焦点顺序。"
      ]
    },
    {
      "id": "mistakes",
      "title": "物理方向和固定宽度把翻译挡在布局外面",
      "paragraphs": [
        "错误修复是为每一种语言写一套 left 和 right。语言增加后规则互相覆盖，嵌入的短引文也无法使用自己的方向。改成逻辑属性，并在 rtl 与竖排样本上读取物理边，确认映射符合预期。",
        "另一个错误是用中文样本定死按钮行高和卡片宽度，翻译一长就缩小字号。缩小字号损害可读性。应让文本区域收缩或换行，让操作保持可点尺寸，并用真实译文验收，而不是只看设计稿里的短词。"
      ]
    },
    {
      "id": "boundaries",
      "title": "逻辑属性不处理翻译正确性和字体授权",
      "paragraphs": [
        "第一条边界是语言内容。CSS 可以跟随方向和长度，不能判断译文是否准确、礼称是否合适或日期数字格式是否符合地区习惯。这些属于内容和格式化规则，需要单独的文案与区域设置。",
        "第二条边界是字体供给。示例里的 check 结果来自当前空白页和已安装字体。远程字体可能先用备用字体排版，加载完成后再替换，引起尺寸跳动。需要稳定度量时，为备用字体和最终字体建立相近的行高与尺寸预算，并测量加载前后的布局。"
      ]
    },
    {
      "id": "practice",
      "title": "交换方向后重新指出物理边",
      "paragraphs": [
        "盖住输出，指出 margin-inline-start:16px 在 ltr、rtl 和 vertical-rl 中分别落在哪一条物理边上。再预测 280px 内容放进 200px 行时，默认最小尺寸和 min-width:0 的滚动宽度。最后说明为什么 MissingLessonFont 的 check 可以为 true。",
        "本主题当前没有专属判题练习，先运行本文完整示例，再改变输入验证失败路径。练习页已发布的相邻模型不能代替本主题的验收。涉及状态、窗口或分帧的模型题只检验纯计算结果；真实 DOM、布局、构建及耗时按本文环境另行核对。"
      ]
    }
  ],
  "sources": [
    {
      "title": "CSS Logical Properties",
      "url": "https://drafts.csswg.org/css-logical-1/"
    },
    {
      "title": "CSS Writing Modes",
      "url": "https://drafts.csswg.org/css-writing-modes-4/"
    }
  ]
};
