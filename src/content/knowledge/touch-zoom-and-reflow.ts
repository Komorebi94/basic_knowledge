import type { Article } from "../articles";

export const touchZoomArticle: Article = {
  id: "K15-05",
  kind: "knowledge",
  domainSlug: "accessibility",
  slug: "touch-zoom-and-reflow",
  title: "触控、缩放与响应式",
  summary: "用 24 CSS 像素和间距的固定规则判断点击目标，用缩放和软键盘的结果表区分被裁切、改排和被挡住。这些结果不是实测。",
  aliases: ["target size", "reflow", "visual viewport", "200% 缩放"],
  tags: ["无障碍", "触控", "布局"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "按钮在桌面上能点到，为什么手机上和放大之后都不行？",
      paragraphs: [
        "笔记列表里的删除是一个 20×20 CSS 像素的图标，和旁边的编辑只隔 8 像素。手指点下去经常打到另一项。把页面放大到 200% 后，固定 320 CSS 像素宽的工具栏被裁掉，保存按钮要左右滚动才能看见。软键盘打开时，底部固定的提交栏仍按布局视口贴在屏幕下沿，输入框被键盘挡住。",
        "点击目标、放大后的重排、软键盘遮挡是三件不同的事。本篇用整数像素和三个缩放档做判断，不测量真实设备，也不读取浏览器的 visualViewport。24 这个数来自 WCAG 2.2 的最小目标尺寸；间距分支是教学简化，不是规范里的圆相交测试。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：只认整数像素、三档缩放和两种定位",
      paragraphs: [
        "运行 npm run verify:k15。target 要求 w、h、gap 都是大于等于 0 的整数。两边都至少 24 时返回 ok。任一边更小、但 gap 至少 24 时返回 spaced。否则 too-small。24.5 这类非整数直接 invalid。",
        "layout 只接受 zoom 为 100、200 或 400。fixed 在 100 时 fits，在 200 和 400 时 clipped。reflow 在 200 时 stacked，在 400 时 one-axis。table 只在 400 时给出 two-axis-ok。keyboard 在 open 为 false 时是 full；open 为 true 时，visual 得到 above-keyboard，layout 得到 covered。"
      ]
    },
    {
      id: "target",
      title: "24×24 可以直接通过，20×20 要靠间距而不是再写一个更小的图标",
      paragraphs: [
        "24×24 且 gap 为 0，返回 ok:24x24。尺寸本身已经达到模型门槛，不需要额外间距。20×20 且 gap 为 24，返回 spaced:20x20:24。20×20 且 gap 为 8，返回 too-small:20x20:8，这就是删除和编辑贴在一起的情况。w 为 24.5 时返回 invalid，模型不接受小数像素，避免把四舍五入当成测量。",
        "spaced 不是 WCAG 2.5.8 的完整例外。规范允许的间距，是把直径 24 CSS 像素的圆放在每个过小目标的边界盒中心，圆与圆、圆与其他目标不相交；行内文字、用户代理控件和必要呈现还有别的例外。本函数只比较 gap >= 24。它比圆测试更粗，不能拿来出具符合性结论。44 CSS 像素是增强级目标，这里没有把 24 写成 44。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function target(box) {
  if (!box) return 'invalid';
  const { w, h, gap } = box;
  if (![w, h, gap].every((n) => Number.isInteger(n) && n >= 0)) return 'invalid';
  if (w >= 24 && h >= 24) return 'ok:' + w + 'x' + h;
  if (gap >= 24) return 'spaced:' + w + 'x' + h + ':' + gap;
  return 'too-small:' + w + 'x' + h + ':' + gap;
}
console.log('够大:' + target({ w: 24, h: 24, gap: 0 }));
console.log('有间距:' + target({ w: 20, h: 20, gap: 24 }));
console.log('太小:' + target({ w: 20, h: 20, gap: 8 }));
console.log('坏尺寸:' + target({ w: 24.5, h: 24, gap: 0 }));`,
          expectedOutput: [
            "够大:ok:24x24",
            "有间距:spaced:20x20:24",
            "太小:too-small:20x20:8",
            "坏尺寸:invalid"
          ],
          explanation: [
            "24×24 在 gap 为 0 时仍然 ok，因为门槛看的是目标自身的两边。20×20 只有间距达到 24 才进入 spaced。",
            "8 像素的间隔不够，返回 too-small。24.5 不是整数，函数拒绝计算，而不是把它收成 25。"
          ]
        }
      ]
    },
    {
      id: "reflow",
      title: "放大之后要改排，软键盘打开时要跟着可见视口而不是布局视口",
      paragraphs: [
        "fixed 在 200 返回 clipped：宽度锁死的工具栏在放大后需要横向滚动才能看见保存。reflow 在 200 返回 stacked，表示工具栏改成纵向排列，按钮仍在同一视口流里。reflow 在 400 返回 one-axis，对应内容在约 320 CSS 像素宽时只沿一个方向滚动。table 在 400 返回 two-axis-ok，因为数据表这类二维信息可以保留双向滚动；这条例外不能套到整页工具栏上。zoom 为 150 是 invalid，模型没有中间档。",
        "文字放大到 200% 对应的是文本缩放这条要求；重排到 320 CSS 像素宽对应的是另一条。函数用 200 和 400 两个标签区分它们，并没有在浏览器里执行缩放。keyboard('visual', true) 是 above-keyboard，提交栏留在软键盘上方。keyboard('layout', true) 是 covered，栏位被键盘盖住。键盘关闭时无论锚点是哪一种，都是 full。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function layout(mode, zoom) {
  if (zoom !== 100 && zoom !== 200 && zoom !== 400) return 'invalid';
  if (mode === 'fixed' && zoom === 100) return 'fits';
  if (mode === 'fixed' && (zoom === 200 || zoom === 400)) return 'clipped';
  if (mode === 'reflow' && zoom === 200) return 'stacked';
  if (mode === 'reflow' && zoom === 400) return 'one-axis';
  if (mode === 'table' && zoom === 400) return 'two-axis-ok';
  return 'invalid';
}
function keyboard(anchor, open) {
  if (open !== true && open !== false) return 'invalid';
  if (!open) return 'full';
  if (anchor === 'visual') return 'above-keyboard';
  if (anchor === 'layout') return 'covered';
  return 'invalid';
}
console.log('固定放大:' + layout('fixed', 200));
console.log('改排:' + layout('reflow', 200));
console.log('单轴:' + layout('reflow', 400));
console.log('表格例外:' + layout('table', 400));
console.log('未知缩放:' + layout('reflow', 150));
console.log('软键盘:' + keyboard('visual', true));
console.log('被挡住:' + keyboard('layout', true));
console.log('键盘关闭:' + keyboard('layout', false));`,
          expectedOutput: [
            "固定放大:clipped",
            "改排:stacked",
            "单轴:one-axis",
            "表格例外:two-axis-ok",
            "未知缩放:invalid",
            "软键盘:above-keyboard",
            "被挡住:covered",
            "键盘关闭:full"
          ],
          explanation: [
            "fixed 在 200 被裁切，reflow 在同样的档位改成 stacked。400 档的单轴滚动和表格的双向滚动是两条不同结果。",
            "软键盘打开时，visual 把操作留在键盘上方，layout 则被盖住。键盘关闭后不再区分锚点。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "这张表不是设备测量，24 像素的间距也不是圆测试",
      paragraphs: [
        "target 不读取 getBoundingClientRect，也不知道变换、缩放和滚动之后的实际命中区域。ok:24x24 只说明传入的整数达到了门槛。间距例外没有实现直径 24 的圆，也没有覆盖行内链接和浏览器默认控件。",
        "layout 不改变 CSS，不创建媒体查询。clipped、stacked、one-axis 是作者给定的结果标签。200 和 400 不是浏览器缩放比例的测量值。two-axis-ok 只允许出现在 mode 为 table 且 zoom 为 400 的组合上，不能用来放过整页。",
        "keyboard 不监听 visualViewport 的 resize 或 scroll。above-keyboard 只表示选择了可见视口这一种锚点。真实页面还要看固定头、安全区和焦点是否滚进可见区域。K15-01 里被固定导航挡住的焦点，不会因为这张表返回 full 就消失。"
      ]
    },
    {
      id: "practice",
      title: "用同一组按钮分别检查尺寸、放大和键盘",
      paragraphs: [
        "20×20、间距 8 应是 too-small；把间距调到 24 才是 spaced。固定布局在 200 应是 clipped，改排后应是 stacked。软键盘打开且锚在布局视口时应是 covered。",
        "本主题没有已开放的独立练习。示例不在手机上测量，也不能代替 200% 和 400% 的人工查看。"
      ]
    }
  ],
  sources: [
    { title: "W3C：Understanding 2.5.8 Target Size (Minimum)", url: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html" },
    { title: "W3C：Understanding 1.4.10 Reflow", url: "https://www.w3.org/WAI/WCAG22/Understanding/reflow.html" },
    { title: "W3C：Understanding 1.4.4 Resize Text", url: "https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html" },
    { title: "MDN：VisualViewport", url: "https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport" }
  ]
};
