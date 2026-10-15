import type { Article } from "../articles";

export const designSystemContractsArticle: Article = {
  id: "K13-05",
  kind: "knowledge",
  domainSlug: "architecture",
  slug: "design-system-and-component-contracts",
  title: "设计系统与组件契约",
  summary: "用按钮契约拒绝未知变体和类名逃生口，并区分增加可选项与删除属性、改默认值的破坏性。",
  aliases: ["design system", "component API", "semver", "组件契约"],
  tags: ["架构", "设计系统", "契约"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "业务页面传入 danger，为什么升级按钮后整页颜色都变了？",
      paragraphs: [
        "按钮最初只有 primary 和 quiet。订单页为了少写一个组件，把 className 传到内部，并自行约定 danger 这个变体。设计系统后来调整主按钮的内边距，选择器同时打中了那层逃生类名，订单页的危险操作变成了普通主按钮的尺寸。变体没有进入契约，调用方和组件各改各的。",
        "契约要写明接受哪些变体、哪些插槽，以及是否允许类名穿透。增加可选项可以保持旧调用，删除属性、改默认值和重命名插槽会让旧调用改变含义。本篇判断一份固定按钮合同，不渲染真实组件。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：两种变体、默认不开放类名和插槽",
      paragraphs: [
        "运行 npm run verify:k13。初始合同的变体是 primary 和 quiet，escape 为 false，插槽列表为空。acceptButton 遇到未知变体、被禁止的 className 或未声明的 icon 时分别返回 unknown-variant、escape-blocked、unknown-slot。",
        "classifyChange 把 add-optional 和 add-variant 标为 compatible，把 remove-prop、change-default、rename-slot 标为 breaking。restyle 不在表内，返回 invalid，避免把一次视觉调整自动说成兼容或破坏。"
      ]
    },
    {
      id: "surface",
      title: "未声明的变体和类名都不能靠调用方约定蒙混过去",
      paragraphs: [
        "primary 被接受。同一变体再带 className 时，因为合同没有开放逃生口，返回 escape-blocked。danger 不在变体列表里，返回 unknown-variant。quiet 带 icon，而插槽列表为空，返回 unknown-slot。",
        "把 icon 写进插槽列表之后，同样的 quiet 加 icon 变为 accepted:quiet。开放插槽是合同变更，不是调用方先传了再说。未开放时拒绝，调用方就不会依赖一个没有名字的 DOM 结构。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function acceptButton(contract, props) {
  if (!contract.variants.includes(props.variant)) return 'unknown-variant';
  if (props.className && !contract.escape) return 'escape-blocked';
  if (props.icon && !contract.slots.includes('icon')) return 'unknown-slot';
  return 'accepted:' + props.variant;
}
const button = { variants: ['primary', 'quiet'], escape: false, slots: [] };
console.log('主按钮:' + acceptButton(button, { variant: 'primary' }));
console.log('类名:' + acceptButton(button, { variant: 'primary', className: 'x' }));
console.log('未知:' + acceptButton(button, { variant: 'danger' }));
console.log('图标:' + acceptButton(button, { variant: 'quiet', icon: 'plus' }));
const opened = { variants: button.variants, escape: button.escape, slots: ['icon'] };
console.log('开放图标:' + acceptButton(opened, { variant: 'quiet', icon: 'plus' }));`,
          expectedOutput: [
            "主按钮:accepted:primary",
            "类名:escape-blocked",
            "未知:unknown-variant",
            "图标:unknown-slot",
            "开放图标:accepted:quiet"
          ],
          explanation: [
            "类名检查发生在变体已经认识之后。primary 本身合法，也不能把内部样式层交给调用方。",
            "danger 被拒绝，是因为合同没有这个名字。图标只有在 slots 明确包含 icon 后才接受，调用方不能从一次碰巧的渲染推断插槽存在。"
          ]
        }
      ]
    },
    {
      id: "change",
      title: "加可选项通常兼容，删属性和改默认值会改变旧调用",
      paragraphs: [
        "add-optional 和 add-variant 返回 compatible：旧调用不传新属性、仍使用旧变体时行为可以保持。remove-prop、change-default 和 rename-slot 返回 breaking。调用方少传一个曾经生效的属性，或者默认尺寸从 md 变成 sm，页面会在不改代码的情况下变样。",
        "restyle 返回 invalid。只改内部像素不一定破坏契约，但若调用方已经依赖逃生类名或 DOM 结构，视觉调整就会变成事实破坏。分类函数拒绝替这种调整做判断，需要先看契约有没有把那些结构承诺出去。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function classifyChange(kind) {
  if (kind === 'add-optional' || kind === 'add-variant') return 'compatible';
  if (kind === 'remove-prop' || kind === 'change-default' || kind === 'rename-slot') return 'breaking';
  return 'invalid';
}
for (const kind of ['add-optional', 'add-variant', 'remove-prop', 'change-default', 'rename-slot', 'restyle']) {
  console.log(kind + ':' + classifyChange(kind));
}`,
          expectedOutput: [
            "add-optional:compatible",
            "add-variant:compatible",
            "remove-prop:breaking",
            "change-default:breaking",
            "rename-slot:breaking",
            "restyle:invalid"
          ],
          explanation: [
            "新增变体不要求旧页面改用它，所以这里标为兼容。删除属性和重命名插槽会让旧的属性名失去含义。",
            "改默认值即使属性名还在，也会改变没写该属性的调用方。restyle 没有足够信息，不能自动归类。"
          ]
        }
      ]
    },
    {
      id: "version",
      title: "破坏性变更要换主版本或提供一段并行的旧合同",
      paragraphs: [
        "兼容变更可以留在同一主版本。破坏性变更应让旧属性在一个明确的版本里继续可用，并写明移除时间；或者直接升主版本，调用方看见自己还在传已删除的名字。静默忽略未知属性会把 danger 吃掉，页面看起来升级成功，操作语义却丢了。",
        "插槽和变体宜少。每开放一个，就多一条要保持的测试。业务只使用一次的布局不必进设计系统；进了系统就要能说清谁可以依赖它，以及 K13-01 里的依赖方向：业务依赖契约，契约不依赖某一页的类名。"
      ]
    },
    {
      id: "boundaries",
      title: "这两段函数不渲染按钮，也不计算语义化版本号",
      paragraphs: [
        "acceptButton 不创建元素，不检查对比度、焦点和可访问名称。变体被接受只说明名字在名单里。K12-05 的角色和键盘仍然要单独看真实按钮。",
        "classifyChange 只有五种已知变更。它不解析版本号，也不知道调用方仓库里有没有用到被删的属性。真正发布前还要用类型或测试找出旧用法。",
        "escape 一旦设为 true，类名就会穿过边界，后面的视觉调整很难再判断影响面。模型拒绝默认逃生，是为了把扩展留在有名字的变体和插槽上。"
      ]
    },
    {
      id: "practice",
      title: "给每个公共属性写接受、拒绝和变更类别",
      paragraphs: [
        "按钮先列变体和插槽。未知变体、类名穿透和未声明图标都应失败。变更记录分开写增加可选项、改默认值和重命名。没有分类依据的视觉调整标成待判断，而不是随口写成兼容。",
        "本主题没有已开放的独立练习。primary 和 quiet 只是这份合同里的名字。"
      ]
    }
  ],
  sources: [
    { title: "语义化版本", url: "https://semver.org/" },
    { title: "MDN：自定义元素", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements" },
    { title: "MDN：Web Components", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_components" }
  ]
};
