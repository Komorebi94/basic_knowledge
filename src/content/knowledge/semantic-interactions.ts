import type { Article } from "../articles";

export const semanticInteractionsArticle: Article = {
  "id": "K05-01",
  "kind": "knowledge",
  "domainSlug": "html-css",
  "slug": "semantic-interactions",
  "title": "语义结构与原生交互",
  "summary": "button、link、form、label 如何选择与组合。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "semantic-interactions",
    "语义结构与原生交互"
  ],
  "tags": [
    "html-css"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "一个可以点击的 div，为什么仍然不能正常操作？",
      "paragraphs": [
        "界面里用 div 模拟保存按钮，鼠标点击正常，键盘用户却无法到达；补了 tabindex 后仍需要自己处理按键、禁用、表单提交与名称。这不是 CSS 不够精致，而是没有继承原生控件的交互合同。",
        "选择元素从行为开始：跳到另一个地址用链接，触发当前操作用按钮，收集并提交字段用表单。下面完整例子在现代浏览器运行，使用脚本创建固定结构；自动点击只验证事件，不替代人工键盘和辅助技术检查。"
      ],
      "examples": [
        {
          "code": "const button = document.createElement('button');\nbutton.type = 'button';\nbutton.textContent = '保存';\nbutton.addEventListener('click', () => console.log('已保存'));\nbutton.click();\nbutton.disabled = true;\nbutton.click();\nconsole.log(button.disabled);",
          "expectedOutput": [
            "已保存",
            "true"
          ],
          "explanation": [
            "第一次程序点击触发操作。原生 disabled 后第二次 click 不触发，且控件带有禁用语义；给 div 加一个名为 disabled 的普通属性不会获得同样行为。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "语义带来平台行为，而不只是标签名称",
      "paragraphs": [
        "button 提供聚焦与键盘激活；a 的 href 描述真实目的地址，浏览器可打开新标签、复制地址和提供链接菜单。把所有元素写成按钮再用 JavaScript 跳转，会丢失链接行为。反过来 href=\"#\" 模拟操作会改变片段与导航，不能算正常按钮。",
        "原生能力也有边界：button 默认可能是 submit，所以表单里的取消、展开或删除按钮要明确 type=\"button\"。按钮文字描述动作；链接文字描述目标。不要依靠图标猜测，也不要让按钮的名称仅来自不稳定的视觉位置。"
      ]
    },
    {
      "id": "forms",
      "title": "提交入口统一到 form",
      "paragraphs": [
        "用户按回车和点击提交按钮，都应进入同一提交处理，而不是只监听按钮 click。表单可先进行原生约束验证，再触发 submit。脚本 requestSubmit 与 submit 行为不同：后者绕过常规提交事件与验证，通常不适合模拟用户提交。"
      ],
      "examples": [
        {
          "code": "const form = document.createElement('form');\nconst input = document.createElement('input');\ninput.name = 'nickname'; input.required = true;\nform.append(input); document.body.append(form);\nform.addEventListener('submit', event => {\n  event.preventDefault();\n  console.log(new FormData(form).get('nickname'));\n});\nconsole.log(form.checkValidity());\ninput.value = '小林';\nform.requestSubmit();\nform.remove();",
          "expectedOutput": [
            "false",
            "小林"
          ],
          "explanation": [
            "空的必填字段不满足约束。填入值后 requestSubmit 经过提交流程，事件处理阻止真实导航并读取字段。示例没有网络副作用，真实服务端仍须独立验证字段。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "names",
      "title": "label 把文字和输入建立可理解的关系",
      "paragraphs": [
        "仅把一段文字放在输入框旁边，不保证浏览器与读屏能知道它是名称。label 的 for 对应唯一 id，或把控件包在 label 内。placeholder 在输入后消失，应提供格式提示，不能承担唯一名称。"
      ],
      "examples": [
        {
          "code": "const host = document.createElement('div');\nconst label = document.createElement('label');\nlabel.htmlFor = 'demo-email'; label.textContent = '联系邮箱';\nconst input = document.createElement('input');\ninput.id = 'demo-email'; input.type = 'email';\nhost.append(label, input); document.body.append(host);\nconsole.log(input.labels.length);\nconsole.log(input.labels[0].textContent);\nhost.remove();",
          "expectedOutput": [
            "1",
            "联系邮箱"
          ],
          "explanation": [
            "for 与 id 相等使 labels 集合包含这个 label。唯一 id 是必要前提：重复 id 会让关联指向错误控件，视觉距离不能修复这种结构错误。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "错误实现与恢复路径",
      "paragraphs": [
        "给自定义 div 设置 role=\"button\" 只声明语义，不会自动添加 Space、Enter 激活或禁用逻辑。如果真的受特殊限制必须自定义，要完整实现键盘、焦点、名称和状态，但大多数常规操作直接使用 button 更可靠。",
        "表单提交失败时不能只清空所有输入并显示一个红色边框。保留用户已填数据，说明哪个字段失败，将错误与字段关联，允许修正后重试。防重复提交可以禁用提交按钮，但不能永久锁死失败后的恢复入口。"
      ]
    },
    {
      "id": "boundaries",
      "title": "原生验证和交互不能替代授权",
      "paragraphs": [
        "第一条边界是业务验证：email 类型只做格式层面的检查，不能证明邮箱归属或可投递。第二条边界是安全：客户端 disabled 和 hidden 都可修改，服务器必须校验权限。界面条件只说明如何呈现操作。",
        "第三条边界是动态界面：加载后替换整个表单可能丢失焦点和输入。优先保留稳定控件身份，更新反馈区域。弹层关闭要回到合理的触发位置，这属于完整交互合同而不是按钮标签自身能完成的事情。"
      ]
    },
    {
      "id": "application",
      "title": "按操作目的选择最少的自定义代码",
      "paragraphs": [
        "在代码审查中逐一询问目标行为：能否复制目标地址？是否需要提交字段？是否有展开状态？再检查对应原生结构。样式可以统一视觉，但保留元素的行为责任。",
        "可复用组件应在 props 或接口中表达 button 与 link 的差异，避免同时允许 href 和提交 type 却没有解释哪个有效。复用结构不应消除语义边界。",
        "例如商品详情中“查看配送说明”是到文档地址的导航，“加入购物车”是当前业务操作，而“确认订单”是表单提交。三者即使设计稿都画成相同圆角控件，也应分别继承链接、普通按钮与提交入口。样式复用可以共享，行为不能仅由视觉外形决定。尤其是链接应保留真实 href，允许用户选择新标签或复制地址。",
        "失败恢复还需要描述焦点。若服务端指出邮箱无效，保留所有字段，把错误文字与邮箱输入关联，并按产品交互决定是否移动焦点。全局错误则在可感知区域提供恢复说明，不要突然聚焦一个无关图标。自动化可以验证关联属性与提交分支，人工键盘与读屏核对负责确认实际操作连续性。"
      ]
    },
    {
      "id": "recall",
      "title": "从键盘完成一次真实流程",
      "paragraphs": [
        "用 Tab 到达字段、输入、回车提交，制造校验错误后修复，确认成功与失败都有反馈。这个顺序比只用鼠标点一次更能发现缺失合同。",
        "回忆：为什么 role 不提供键盘行为？为什么表单里非提交按钮要写 type？可将示例改成两个输入并关联各自 label，检查重复 id 会破坏什么。"
      ]
    }
  ],
  "sources": [
    {
      "title": "MDN：button",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button"
    },
    {
      "title": "MDN：label",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label"
    },
    {
      "title": "MDN：requestSubmit",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit"
    }
  ]
};
