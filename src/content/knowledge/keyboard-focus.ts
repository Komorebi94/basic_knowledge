import type { Article } from "../articles";

export const keyboardFocusArticle: Article = {
  id: "K15-01", kind: "knowledge", domainSlug: "accessibility", slug: "keyboard-focus",
  title: "键盘导航与焦点管理",
  summary: "沿打开弹层、操作表单和返回页面的路径，解释焦点、Tab 顺序与组件内部导航的不同职责，避免键盘陷阱和焦点丢失。",
  aliases: ["keyboard navigation", "focus management", "tabindex", "键盘"], tags: ["无障碍", "焦点", "交互"],
  estimatedMinutes: 20, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "鼠标可以打开弹层，键盘用户却不知道自己在哪里", paragraphs: [
      "点击“编辑”后页面出现一个浮层，但键盘焦点仍在被遮住的原按钮。按 Tab 继续移动时，焦点可能走入背景；按 Esc 关闭后又跳到页面开头。视觉上功能已经出现，操作路径却没有接续。焦点不是装饰，它表示键盘输入接下来交给哪个控件。",
      "一次交互要同时确定入口、组件内操作、退出和焦点恢复。优先使用原生 button、input、dialog 等语义与浏览器行为，再按实际组件模式补充控制。下面的 DOM 示例在现代浏览器独立运行，结束时删除建立的节点并恢复原焦点；它们检查焦点与事件，不模拟读屏体验。",
    ] },
    { id: "native", title: "原生按钮已经有键盘激活与语义", paragraphs: [
      "div 加 click 监听可以响应鼠标，却不会自动成为按钮，也没有原生禁用、键盘激活和可访问角色。加 tabindex 只让它能获得焦点，仍需要补完整交互。若目标就是普通按钮，直接使用 button 可以减少需要手写的行为。",
    ], examples: [{ code: `const previous = document.activeElement;
const wrapper = document.createElement('div');
const native = document.createElement('button');
native.textContent = '编辑';
const imitation = document.createElement('div');
imitation.textContent = '编辑';
wrapper.append(native, imitation);
document.body.append(wrapper);
console.log(native.tabIndex);
console.log(imitation.tabIndex);
native.focus();
console.log(document.activeElement === native);
wrapper.remove();
if (previous instanceof HTMLElement) previous.focus();`, expectedOutput: ["0", "-1", "true"], explanation: [
      "原生 button 默认参与顺序键盘导航，tabIndex 为 0。普通 div 默认不参与，读到 -1。节点挂入页面后调用 native.focus，activeElement 指向按钮，证明焦点进入真实可操作控件。",
      "tabIndex=-1 不表示在所有条件下绝对不能聚焦，而是默认不进入顺序导航。disabled、隐藏祖先和 inert 等条件还会影响可操作性。此例只检查默认按钮与 div，不声称已经验证所有键盘事件或辅助技术。",
    ] }] },
    { id: "order", title: "Tab 负责控件间移动，方向键通常负责组件内部移动", paragraphs: [
      "普通页面让 DOM 顺序与视觉阅读顺序一致，优先用 tabindex=0 和默认原生顺序。正数 tabindex 会建立优先级，页面增加控件后容易产生不自然跳转，通常应避免。tabindex=-1 适合程序主动聚焦的标题或错误摘要，不把它们加入每次 Tab 的停靠点。",
      "Tabs、菜单或列表框等组合控件往往只保留一个 Tab 入口，方向键在内部移动，这要遵循组件模式，而不是拦截页面所有方向键。普通文本、输入框光标移动与页面滚动不应被全局监听无条件阻断。",
      "编辑器若使用 Tab 缩进，需要明确退出方式及可见提示；不能让键盘用户被困在代码区域。最好提供模式切换或平台约定，并实际验证键盘能离开。",
    ], examples: [{ code: `const section = document.createElement('section');
const heading = document.createElement('h2');
heading.textContent = '保存失败';
heading.tabIndex = -1;
section.append(heading);
document.body.append(section);
const previous = document.activeElement;
heading.focus();
console.log(heading.tabIndex);
console.log(document.activeElement === heading);
section.remove();
if (previous instanceof HTMLElement) previous.focus();`, expectedOutput: ["-1", "true"], explanation: [
      "标题设置 -1 后仍可通过 focus 主动聚焦，activeElement 与 heading 相同。它可以作为提交失败后的摘要入口，同时不增加普通 Tab 导航的停靠项。",
      "能主动聚焦并不说明何时都该抢焦点。用户正在输入时，自动保存提示通常应通过状态播报呈现，不能每次把焦点移走；只在真正需要新的操作位置时管理焦点。",
    ] }] },
    { id: "dialog", title: "弹层是一段有开始与结束的焦点生命周期", paragraphs: [
      "打开模态对话框时，保存触发者身份，按内容选择初始焦点，约束背景不可交互，并让关闭路径可通过键盘到达。结束后，如果触发者仍存在且适合聚焦，将焦点还给它；如果记录已删除，转到下一个合理位置，而不是试图聚焦已脱离文档的节点。",
      "原生 dialog.showModal 提供模态顶层及背景处理能力，但仍需要合适的初始位置、关闭文案和业务退出合同。复杂自定义弹层可以复用经过验证的组件，避免只写一个 Tab 循环就认为所有屏幕阅读和多弹层场景都已解决。",
    ], examples: [{ code: `const previous = document.activeElement;
const trigger = document.createElement('button');
trigger.textContent = '打开';
const dialog = document.createElement('dialog');
const close = document.createElement('button');
close.textContent = '关闭';
dialog.append(close);
document.body.append(trigger, dialog);
trigger.focus();
const opener = document.activeElement;
dialog.showModal();
close.focus();
console.log(dialog.open);
console.log(document.activeElement === close);
dialog.close();
if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
console.log(document.activeElement === trigger);
dialog.remove(); trigger.remove();
if (previous instanceof HTMLElement) previous.focus();`, expectedOutput: ["true", "true", "true"], explanation: [
      "showModal 把 dialog 打开，显式将焦点放到关闭按钮；前两个 true 分别检查打开状态和当前操作位置。关闭后按保存的 opener 身份恢复，第三个 true 说明回到原入口。",
      "这个例子没有覆盖 Esc、表单提交、嵌套弹层和删除触发者。真实功能要验证每条退出路径都执行相同清理，并在 trigger 不再存在时选择合理替代位置。不要把这一组 true 当成完整无障碍验收。",
    ] }] },
    { id: "routing", title: "路由、错误和异步反馈需要不同焦点策略", paragraphs: [
      "客户端路由切换可能更换正文而不刷新文档。导航后可以把焦点移到新页面主标题或主内容入口，让键盘和辅助技术知道已进入新位置。章节深链接应优先聚焦目标章节，不被通用“回页首”逻辑覆盖。",
      "提交失败时，把焦点移到错误摘要或首个无效输入，并提供从摘要跳到字段的入口。自动保存成功、加载完成等非阻塞状态通常适合状态反馈，避免突然抢焦点。恢复用户操作位置与报告状态是不同职责。",
      "焦点样式必须可见。移除 outline 后没有替代样式，即使 Tab 顺序正确，用户也无法确认当前控件。对比度、遮挡和滚动位置需要在真实尺寸下检查。",
    ] },
    { id: "boundaries", title: "焦点可到达，不等于组件已可理解", paragraphs: [
      "键盘行为之外，控件还要有语义、名称与状态。一个能 Tab 到达的空图标按钮，辅助技术仍可能不知道其操作。相反，ARIA role 只表达角色，不能自动补上 Enter、Space、方向键与禁用逻辑。",
      "第二个边界是焦点与阅读顺序。把控件视觉上重排但不调整合理 DOM 顺序，键盘可能在屏幕上来回跳。放大至 200%、软键盘弹出和窄屏滚动时，焦点也可能被固定导航遮住。需要沿真实任务人工操作，而不是只查 tabIndex。",
      "对原生输入的方向键和组合输入事件保持克制。全局快捷键在文本编辑区域通常应让位，防止保存快捷键或评分键误触发正在输入的文字。",
    ] },
    { id: "verification", title: "只用键盘走一遍成功与退出路径", paragraphs: [
      "从地址栏或页面起点开始：找到入口、打开弹层、完成字段、修正错误、提交、关闭并继续操作。记录焦点到哪里，背景是否能误操作，Esc 与关闭按钮是否一致，触发者被删除时是否仍有合理恢复。",
      "自动 DOM 检查能证明一些状态，真正的键盘导航和读屏仍需人工走查。报告使用的浏览器、辅助技术与尺寸；未使用读屏工具就不要宣称读屏体验通过。",
    ] },
    { id: "recall", title: "为一个新弹层写焦点合同", paragraphs: [
      "明确入口身份、初始焦点、内部按键、所有退出路径和返回位置。再列出触发者消失、保存失败和窄屏遮挡三个反例。",
      "优先使用原生控件，给必须主动聚焦的标题 -1，保留可见焦点。焦点管理应让用户继续当前任务，而不是让每次异步通知都强制跳转。",
    ] },
  ],
  sources: [{ title: "W3C APG：键盘接口与焦点", url: "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/" }],
};
