import type { Article } from "../articles";

export const componentAccessibilityTestsArticle: Article = {
  id: "K12-05",
  kind: "knowledge",
  domainSlug: "testing",
  slug: "component-accessibility-tests",
  title: "组件交互与可访问性测试",
  summary: "在空白页区分真实按钮、样式像按钮的元素、原生禁用和可访问名称，键盘激活不靠内部状态。",
  aliases: ["testing library", "accessible name", "role query", "可访问性测试"],
  tags: ["测试", "可访问性", "交互"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "用类名点到了保存，为什么键盘用户仍然到不了这个控件？",
      paragraphs: [
        "测试执行 document.querySelector('.btn').click()，div 的点击处理把笔记标成已保存。页面上看起来像按钮，但元素不是 button，也没有 tabindex，键盘走不到它。测试查询的是实现留下的类名，不是用户能命名、聚焦和激活的控件。",
        "组件测试应先按角色和可访问名称找到控件，再发送键盘或点击，并检查用户能看见的结果。内部状态 isOpen 可以辅助定位失败，但不能代替“对话框出现了”或“按钮被禁用了”。本篇在空白页使用真实 DOM，不用组件库。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：空白页的真实元素，名称和焦点按本模型的规则读取",
      paragraphs: [
        "运行 npm run verify:k12。describeControl 的角色优先取 role 属性，否则用标签名。名称优先 aria-label，其次 aria-labelledby 指向的文本，再其次 textContent。禁用包含原生 :disabled 和 aria-disabled=true。",
        "可聚焦只在元素不是原生禁用时判断：有不小于 0 的 tabindex，或是按钮、输入控件，或是带 href 的链接。这个函数不是完整的可访问名称计算，也不创建对话框。press 是单独的键盘模型，只认识 Enter、空格和 Escape。"
      ]
    },
    {
      id: "query",
      title: "类选择器能找到伪装按钮，按钮选择器不能",
      paragraphs: [
        "页面上只有 class 为 btn 的 div 时，类选择器是 found，button 选择器是 missing。该 div 的记录是 div|保存|enabled|not-focusable。随后的真实按钮是 button|保存|enabled|focusable。带 role=button 且 tabindex 为 0 的 div 也是 button|保存|enabled|focusable。",
        "原生 disabled 的按钮是 disabled 且 not-focusable。同样写了 aria-disabled 的角色按钮仍是 focusable。输入框通过 aria-labelledby 得到名称正文。按钮同时有 aria-label 和文字时，名称取 aria-label。没有 href 的 a 不能聚焦，补上 href 之后可以。预期见下面十行。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function describeControl(element) {
  const role = element.getAttribute('role') || element.tagName.toLowerCase();
  const labelledBy = element.getAttribute('aria-labelledby');
  const labelText = labelledBy ? (document.getElementById(labelledBy)?.textContent || '') : '';
  const name = (element.getAttribute('aria-label') || labelText || element.textContent || '').replace(/\\s+/g, ' ').trim();
  const disabled = element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true';
  let focusable = false;
  if (!element.matches(':disabled')) {
    const tab = element.getAttribute('tabindex');
    if (tab !== null) focusable = Number(tab) >= 0;
    else if (element.tagName === 'BUTTON' || element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') focusable = true;
    else if (element.tagName === 'A' && element.hasAttribute('href')) focusable = true;
  }
  return [role, name || 'unnamed', disabled ? 'disabled' : 'enabled', focusable ? 'focusable' : 'not-focusable'].join('|');
}
document.body.replaceChildren();
const styled = document.createElement('div');
styled.className = 'btn';
styled.textContent = '保存';
document.body.append(styled);
console.log('类选择器:' + (document.querySelector('.btn') ? 'found' : 'missing'));
console.log('按钮选择器:' + (document.querySelector('button') ? 'found' : 'missing'));
console.log('样式:' + describeControl(styled));
const button = document.createElement('button');
button.textContent = '保存';
document.body.append(button);
console.log('按钮:' + describeControl(button));
const role = document.createElement('div');
role.setAttribute('role', 'button');
role.tabIndex = 0;
role.textContent = '保存';
document.body.append(role);
console.log('角色:' + describeControl(role));
const off = document.createElement('button');
off.textContent = '保存';
off.disabled = true;
document.body.append(off);
console.log('原生禁用:' + describeControl(off));
const aria = document.createElement('div');
aria.setAttribute('role', 'button');
aria.tabIndex = 0;
aria.setAttribute('aria-disabled', 'true');
aria.textContent = '保存';
document.body.append(aria);
console.log('aria禁用:' + describeControl(aria));
const label = document.createElement('span');
label.id = 'note-label';
label.textContent = '正文';
const input = document.createElement('input');
input.setAttribute('aria-labelledby', 'note-label');
document.body.append(label, input);
console.log('输入:' + describeControl(input));
const icon = document.createElement('button');
icon.setAttribute('aria-label', '保存笔记');
icon.textContent = '图标';
document.body.append(icon);
console.log('名称:' + describeControl(icon));
const link = document.createElement('a');
link.textContent = '说明';
document.body.append(link);
console.log('无href:' + describeControl(link));
link.href = '#notes';
console.log('有href:' + describeControl(link));`,
          expectedOutput: [
            "类选择器:found",
            "按钮选择器:missing",
            "样式:div|保存|enabled|not-focusable",
            "按钮:button|保存|enabled|focusable",
            "角色:button|保存|enabled|focusable",
            "原生禁用:button|保存|disabled|not-focusable",
            "aria禁用:button|保存|disabled|focusable",
            "输入:input|正文|enabled|focusable",
            "名称:button|保存笔记|enabled|focusable",
            "无href:a|说明|enabled|not-focusable",
            "有href:a|说明|enabled|focusable"
          ],
          explanation: [
            "只有 div 时，类选择器已经找到目标，按钮选择器找不到。测试若停在类名上，就会接受一个不能用键盘到达的元素。",
            "原生禁用的按钮不可聚焦；aria-disabled 仍可聚焦，所以还要单独拒绝激活。aria-label 覆盖了按钮里的“图标”，查询名称时应使用用户听到的那个名字。"
          ]
        }
      ]
    },
    {
      id: "keyboard",
      title: "不能聚焦的元素不接受 Enter，禁用元素即使可聚焦也不打开",
      paragraphs: [
        "press 先看 disabled。为 true 时返回当前开合状态加 ignored，因此原生禁用和 aria 禁用都是 closed:ignored。未禁用但不能聚焦时，Enter 或空格返回 not-actionable。可聚焦且未打开时，Enter 把状态变成 open。",
        "打开后 Escape 返回 closed。未打开时 Escape 返回 closed:already，避免把一次无效按键说成打开失败。这个模型不派发真实键盘事件，也不移动焦点。它只把上一节的 focusable 和 disabled 变成激活结果。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function press(control, key) {
  const open = control.open ? 'open' : 'closed';
  if (control.disabled) return open + ':ignored';
  if (!control.focusable && (key === 'Enter' || key === ' ')) return open + ':not-actionable';
  if ((key === 'Enter' || key === ' ') && !control.open) return 'open';
  if (key === 'Escape' && control.open) return 'closed';
  if (key === 'Escape') return 'closed:already';
  return open + ':ignored';
}
console.log('div:' + press({ open: false, disabled: false, focusable: false }, 'Enter'));
console.log('按钮:' + press({ open: false, disabled: false, focusable: true }, 'Enter'));
console.log('关闭:' + press({ open: true, disabled: false, focusable: true }, 'Escape'));
console.log('原生禁用:' + press({ open: false, disabled: true, focusable: false }, 'Enter'));
console.log('aria禁用:' + press({ open: false, disabled: true, focusable: true }, 'Enter'));
console.log('未打开:' + press({ open: false, disabled: false, focusable: true }, 'Escape'));`,
          expectedOutput: [
            "div:closed:not-actionable",
            "按钮:open",
            "关闭:closed",
            "原生禁用:closed:ignored",
            "aria禁用:closed:ignored",
            "未打开:closed:already"
          ],
          explanation: [
            "div 的记录来自上一节的 not-focusable，Enter 不能把它打开。真实按钮可以打开，Escape 再把它关上。",
            "两种禁用都忽略 Enter。aria 禁用仍然 focusable，所以测试要同时记下“能聚焦”和“激活被忽略”。未打开时的 Escape 保持 closed，并标明 already。"
          ]
        }
      ]
    },
    {
      id: "name",
      title: "查询用用户能感知的名字，断言看可见结果而不是内部字段",
      paragraphs: [
        "保存按钮有两个时，只写 button 会点到前一个。查询应同时使用角色和名称，例如“保存笔记”，而不是图标按钮里的装饰字符。名称来自 aria-label、标签或可见文本，测试不要再依赖生成类名。",
        "点击或按键之后断言标题、对话框文本、禁用状态或列表内容。组件实例上的 open 字段可以在失败时帮助定位，但通过条件应是用户能观察到的变化。角色按钮若没有键盘处理，DOM 查询仍会找到它，press 才会暴露 not-actionable 或 ignored。"
      ]
    },
    {
      id: "boundaries",
      title: "角色和名称不等于完整的无障碍验收，模型也不派发真实按键",
      paragraphs: [
        "describeControl 不做 accname 的完整计算，不处理隐藏文本、多个标签和 aria-describedby。它也不检查对比度、焦点顺序和屏幕阅读器的实际朗读。那些需要目标浏览器和人工任务，不能用这一行字符串代替。",
        "press 没有焦点陷阱，也没有检查 Escape 是否只关闭最上层对话框。真实交互测试应把键盘事件发给当前焦点，并确认焦点移入和移出。本模型只说明禁用和可聚焦如何决定一次激活。",
        "把 tabindex=0 加到 div 上可以让记录变成 focusable，但不自动提供按钮的键盘语义。角色、名称、可聚焦和激活处理要分开断言。"
      ]
    },
    {
      id: "practice",
      title: "先写键盘用户完成保存的步骤，再选择查询",
      paragraphs: [
        "步骤写成：用名称“保存笔记”找到按钮，确认它可聚焦且未禁用，按 Enter，看到保存结果；再对禁用状态确认按键被忽略。不要把 .btn 或组件内部字段写进通过条件。aria 禁用要多记一行焦点是否仍能到达。",
        "本主题没有已开放的独立练习。空白页示例不代替完整页面的焦点顺序检查。"
      ]
    }
  ],
  sources: [
    { title: "Testing Library：查询优先级", url: "https://testing-library.com/docs/queries/about" },
    { title: "MDN：button 角色", url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role" },
    { title: "WAI-ARIA：对话框模式", url: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" }
  ]
};
