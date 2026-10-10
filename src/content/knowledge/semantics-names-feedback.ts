import type { Article } from "../articles";

export const semanticsFeedbackArticle: Article = {
  id: "K15-02", kind: "knowledge", domainSlug: "accessibility", slug: "semantics-names-feedback",
  title: "语义、名称与状态反馈",
  summary: "从一个只有图标的保存按钮与校验失败表单出发，区分可访问角色、名称、说明与动态状态，理解 ARIA 为什么不能替代原生交互。",
  aliases: ["accessible name", "ARIA", "label", "live region"], tags: ["无障碍", "语义", "反馈"],
  estimatedMinutes: 20, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "按钮看起来有含义，为什么辅助技术只知道它是按钮？", paragraphs: [
      "磁盘图标在视觉上可能表示保存，但若按钮没有可访问名称，用户得到的只有“按钮”这个角色。输入框旁的文字若没有建立 label 关联，视觉相邻也不能可靠表达字段名称。语义说明是什么，名称说明具体是哪一个，状态说明现在怎样，三者缺一都可能让任务难以完成。",
      "原生元素提供可靠起点：button 有按钮角色，label 可以关联输入，disabled 表达禁用。ARIA 用于补充原生语义表达不足的情况，而不是把所有 div 改成 role=button。以下 DOM 示例只核对关联结构与属性，不声称计算出了所有辅助技术的实际播报。",
    ] },
    { id: "labels", title: "显式 label 把字段名称与控件身份连起来", paragraphs: [
      "给输入一个唯一 ID，label 的 for 指向它。可见名称让所有用户共享同一提示，点击标签也能够定位输入。placeholder 会在输入之后消失，通常不能替代持久标签；标题文字也不应只是靠 CSS 排版与输入靠近。",
    ], examples: [{ code: `const root = document.createElement('div');
const label = document.createElement('label');
label.htmlFor = 'demo-note-title';
label.textContent = '笔记标题';
const input = document.createElement('input');
input.id = 'demo-note-title';
root.append(label, input);
document.body.append(root);
console.log(input.labels.length);
console.log(input.labels[0].textContent);
console.log(label.control === input);
root.remove();`, expectedOutput: ["1", "笔记标题", "true"], explanation: [
      "输入与标签挂入同一文档后，labels 集合包含关联的 label。文本是笔记标题，label.control 指向同一个 input，证明这是结构关联，不只是页面上相邻。",
      "真实页面要保证 ID 唯一，否则关联可能指向错误控件。多个重复字段需要稳定但不同的 ID；label.textContent 检查不能替代完整可访问名称和读屏走查，不过能提前抓出常见接线错误。",
    ] }] },
    { id: "names", title: "名称与说明应有不同用途", paragraphs: [
      "名称应短而明确，例如“保存笔记”；额外格式要求与错误原因属于说明，可以用 aria-describedby 关联。aria-label 可以给没有可见文字的图标按钮提供名称，但最好让名称与视觉标签一致，避免语音控制用户说可见文字却找不到对应控件。",
      "装饰图标不应重复播报。按钮已有可见保存文字时，图标可以隐藏于辅助技术，而不是让名称变成“磁盘 保存”。title 属性的悬浮提示可作为补充，不能当作唯一名称来源。",
      "ARIA 属性本身不校验操作是否实现。aria-expanded 应随展开状态更新，aria-pressed 用于切换按钮而非普通提交，aria-selected 属于特定选择模式。选错状态会让界面真实行为与语义互相矛盾。",
    ] },
    { id: "errors", title: "错误要关联字段，并说明怎样恢复", paragraphs: [
      "只把边框涂红依赖颜色，也没有解释哪里错。写具体错误，例如“标题不能只包含空格”，把它与输入关联，并在当前确实无效时设置 aria-invalid。修复后同步清除状态与旧错误，防止辅助技术继续报告已经不存在的问题。",
    ], examples: [{ code: `const root = document.createElement('div');
const input = document.createElement('input');
const error = document.createElement('p');
input.setAttribute('aria-label', '标题');
error.id = 'demo-title-error';
error.textContent = '标题不能只包含空格';
input.setAttribute('aria-describedby', error.id);
input.setAttribute('aria-invalid', 'true');
root.append(input, error);
document.body.append(root);
console.log(input.getAttribute('aria-describedby') === error.id);
console.log(input.getAttribute('aria-invalid'));
input.removeAttribute('aria-invalid');
error.textContent = '';
console.log(input.hasAttribute('aria-invalid'));
root.remove();`, expectedOutput: ["true", "true", "false"], explanation: [
      "aria-describedby 引用真实错误节点，aria-invalid=true 表示当前输入无效。修复阶段移除属性并清空旧文案，最后 false 说明无效状态已经解除。",
      "DOM 属性正确只是结构证据。错误出现时是否及时播报、是否需要错误摘要和主动焦点，还要按提交模式验证。对每次键入都报告长错误可能打断输入，因此要明确触发时机。",
    ] }] },
    { id: "status", title: "异步状态应被感知，也要避免每次更新抢焦点", paragraphs: [
      "保存成功、加载完成等信息适合在已存在的状态区域更新。role=status 通常用于非紧急消息；必须立即提醒的严重错误可能使用 alert，但过度打断会降低可用性。先建立区域，再更新文字，比在完成时突然插入一整块结构更容易形成清楚的动态反馈。",
    ], examples: [{ code: `const status = document.createElement('p');
status.setAttribute('role', 'status');
document.body.append(status);
status.textContent = '正在保存';
console.log(status.getAttribute('role'));
status.textContent = '已保存';
console.log(status.textContent);
console.log(status.tabIndex);
status.remove();`, expectedOutput: ["status", "已保存", "-1"], explanation: [
      "区域保有 status 角色，保存后文字更新为已保存。它默认不是 Tab 导航控件，状态反馈不需要把焦点从用户正在编辑的字段移走。",
      "输出不证明读屏实际说出了文字，只证明建立了正确意图的 DOM。具体播报时机受浏览器与辅助技术影响；真实验收要使用 VoiceOver 或 NVDA 沿操作路径检查，不能把 console 结果当作读屏通过。",
    ] }] },
    { id: "disabled", title: "原生禁用与 aria-disabled 不能随意互换", paragraphs: [
      "button.disabled 会影响交互与焦点行为。aria-disabled 只向辅助技术表达不可用，不自动阻止点击或键盘事件，也不自动改变视觉反馈。如果需要保留一个可聚焦但暂不可用的控件，必须在真实操作入口阻止执行，并给出原因与恢复路径。",
      "loading 也不总等于整个表单禁用。用户可能需要复制正文、取消或继续编辑。明确哪些动作暂停、哪些允许，避免为了阻止重复提交锁住所有恢复能力。状态必须来自真实请求与存储结果，不能在写入尚未完成时提前宣布已保存。",
    ] },
    { id: "boundaries", title: "语义正确还需要内容与交互一致", paragraphs: [
      "第一个边界是角色不能实现行为：role=button 的 div 仍需键盘激活、禁用和焦点样式。第二个边界是 DOM 属性不能保证实际播报：浏览器、辅助技术与更新时间会影响体验。自动检查能发现缺失名称和错误关联，却不能替代真实任务走查。",
      "错误与状态文案也要保持可理解。只显示“失败”却没有原因和恢复动作，语义再完整也不能完成任务。让保存失败保留输入，让权限失败说明无法操作，让空列表说明如何更改筛选。",
      "文本标签、对比度和颜色外的提示要同时考虑。辅助技术用户和视觉用户应得到一致的操作含义，而不是为其中一组维护完全不同的文案。",
    ] },
    { id: "verification", title: "检查角色、名称、状态及恢复四个问题", paragraphs: [
      "逐个可操作控件问：它是什么、它叫什么、当前状态是否真实、失败之后用户能做什么。用键盘触发，并用目标辅助技术确认名称与错误说明；对图标按钮、重复字段、加载状态和错误清除重点检查。",
      "报告自动检查与人工走查分别覆盖了什么。本文示例核对 label、描述关系和状态属性，不包含真实读屏证据。维护时保存这个边界，比声称符合所有无障碍要求更有用。",
    ] },
    { id: "recall", title: "把一个错误表单变成可恢复的交互", paragraphs: [
      "给每个字段可见标签，给具体错误建立说明关联；提交失败时找到摘要或首个无效字段；修复后清除旧状态。成功消息通过状态区域反馈，避免打断输入。",
      "如果只是把控件加上 ARIA 属性，却没有实现承诺的行为，语义就变成了误导。原生控件与真实状态是优先起点。",
    ] },
  ],
  sources: [
    { title: "W3C WAI：表单标签", url: "https://www.w3.org/WAI/tutorials/forms/labels/" },
    { title: "W3C APG：语义与键盘职责", url: "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/" },
  ],
};
