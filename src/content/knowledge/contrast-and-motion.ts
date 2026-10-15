import type { Article } from "../articles";

export const contrastMotionArticle: Article = {
  id: "K15-06",
  kind: "knowledge",
  domainSlug: "accessibility",
  slug: "contrast-and-motion",
  title: "对比度与动态效果",
  summary: "用相对亮度计算文字和界面的对比比值，没有文字的颜色状态直接拒绝；减少动态效果时停掉装饰旋转，焦点提示仍然保留。",
  aliases: ["contrast ratio", "prefers-reduced-motion", "use of color", "对比度"],
  tags: ["无障碍", "对比度", "动画"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "失败只用红色表示，为什么有人看不见，有人又被转圈晃到？",
      paragraphs: [
        "保存失败时，标题旁边只多了一个红点，没有「失败」两个字。红点的颜色是 #777777，放在白底上，正文尺寸刚好差一口气。另一侧的加载图标一直旋转。用户打开了减少动态效果，页面却仍然转动；同时有人把焦点轮廓也一起关掉，键盘用户又不知道自己停在哪。",
        "颜色不能单独传递状态。文字和界面控件的对比门槛不同。装饰性旋转可以停，焦点提示不能跟着停。本篇用六位十六进制颜色和相对亮度公式算出比值，再按作者给定的种类比较 4.5 或 3。它不测量渲染后的字号，也不读取媒体查询。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：比值保留两位小数，大字和界面都用 3 作门槛",
      paragraphs: [
        "运行 npm run verify:k15。contrast 只接受 # 加六位小写十六进制。kind 为 text 时门槛是 4.5，large 和 ui 时门槛是 3。相对亮度按 sRGB 通道转换后加权，比值是较亮加 0.05 除以较暗加 0.05，显示时四舍五入到两位小数。不够门槛是 fail，够了是 pass。",
        "cue 没有可修剪的文字时返回 color-only，否则返回 text 加修剪后的文字。motion 只认 reduce 和 no-preference。spinner 在 reduce 下 stopped，否则 spin。fade 在 reduce 下 opacity-only，否则 fade。focus 无论偏好如何都是 visible。未知名字是 invalid。"
      ]
    },
    {
      id: "contrast",
      title: "#777777 过不了正文，但能过大字和界面控件",
      paragraphs: [
        "黑底白字的正文是 pass:21.00:text。#777777 对 #ffffff 的正文是 fail:4.48:text，同一对颜色的 large 和 ui 都是 pass:4.48。4.48 大于 3，小于 4.5，所以不能把界面控件通过了理解成正文也通过了。白对白是 fail:1.00:text。#fff 这种三位写法返回 invalid，函数不替调用方展开。",
        "large 是调用方声明的种类，不是测出来的 18pt 或 14pt 粗体。ui 使用 3 这个非文本对比的门槛，也不检查焦点环的相邻颜色。公式只处理纯色。渐变、背景图和半透明叠在别的颜色上时，不能把某一个色标代进去就算完成。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function channel(value) {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg, bg, kind) {
  if (!/^#[0-9a-f]{6}$/.test(fg) || !/^#[0-9a-f]{6}$/.test(bg)) return 'invalid';
  const need = kind === 'large' || kind === 'ui' ? 3 : kind === 'text' ? 4.5 : null;
  if (need === null) return 'invalid';
  const ratio = (Math.max(luminance(fg), luminance(bg)) + 0.05) / (Math.min(luminance(fg), luminance(bg)) + 0.05);
  const shown = (Math.round(ratio * 100) / 100).toFixed(2);
  return (ratio >= need ? 'pass:' : 'fail:') + shown + ':' + kind;
}
console.log('正文黑白:' + contrast('#000000', '#ffffff', 'text'));
console.log('正文灰:' + contrast('#777777', '#ffffff', 'text'));
console.log('大字灰:' + contrast('#777777', '#ffffff', 'large'));
console.log('界面灰:' + contrast('#777777', '#ffffff', 'ui'));
console.log('同色:' + contrast('#ffffff', '#ffffff', 'text'));
console.log('短色:' + contrast('#fff', '#ffffff', 'text'));`,
          expectedOutput: [
            "正文黑白:pass:21.00:text",
            "正文灰:fail:4.48:text",
            "大字灰:pass:4.48:large",
            "界面灰:pass:4.48:ui",
            "同色:fail:1.00:text",
            "短色:invalid"
          ],
          explanation: [
            "21.00 远高于 4.5。4.48 卡在正文门槛之下，所以 text 失败；同一比值对 3 的门槛通过，large 和 ui 才是 pass。",
            "同色比值是 1.00，必然失败。三位颜色被拒绝，避免函数悄悄把它当成六位。"
          ]
        }
      ]
    },
    {
      id: "motion",
      title: "红色没有文字就是只靠颜色，减少动态效果也不拿走焦点提示",
      paragraphs: [
        "cue 收到 color 为 red、text 为空，返回 color-only。失败状态至少还要有「失败」这样的文字或等价的非颜色提示。text 为「 失败 」时返回 text:失败，两端空白被去掉。颜色字段仍然可以存在，它只是不能单独工作。",
        "motion('reduce', 'spinner') 是 stopped，加载图标不再旋转。motion('reduce', 'fade') 是 opacity-only，过渡只改透明度，不再位移。motion('reduce', 'focus') 仍是 visible：减少动态效果不是去掉焦点轮廓的理由。没有偏好时 spinner 返回 spin。bounce 不在表里，返回 invalid。偏好字符串来自调用方，函数没有执行 matchMedia。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function cue(item) {
  if (!item || typeof item.color !== 'string') return 'invalid';
  const text = typeof item.text === 'string' ? item.text.trim() : '';
  if (!text) return 'color-only';
  return 'text:' + text;
}
function motion(preference, name) {
  if (preference !== 'reduce' && preference !== 'no-preference') return 'invalid';
  if (name === 'spinner') return preference === 'reduce' ? 'stopped' : 'spin';
  if (name === 'fade') return preference === 'reduce' ? 'opacity-only' : 'fade';
  if (name === 'focus') return 'visible';
  return 'invalid';
}
console.log('只看颜色:' + cue({ color: 'red', text: '' }));
console.log('有文字:' + cue({ color: 'red', text: ' 失败 ' }));
console.log('减少旋转:' + motion('reduce', 'spinner'));
console.log('减少淡入:' + motion('reduce', 'fade'));
console.log('焦点仍在:' + motion('reduce', 'focus'));
console.log('允许旋转:' + motion('no-preference', 'spinner'));
console.log('未知效果:' + motion('reduce', 'bounce'));`,
          expectedOutput: [
            "只看颜色:color-only",
            "有文字:text:失败",
            "减少旋转:stopped",
            "减少淡入:opacity-only",
            "焦点仍在:visible",
            "允许旋转:spin",
            "未知效果:invalid"
          ],
          explanation: [
            "空文字即使带了 red 也是 color-only。有文字时结果里只保留修剪后的失败，颜色不再单独决定状态。",
            "reduce 停掉 spinner，并把 fade 收成只改透明度。focus 在 reduce 下仍然 visible。bounce 没有定义，不能默许它继续播放。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "两位小数是显示约定，种类标签不是量到的字号",
      paragraphs: [
        "4.48 是公式结果四舍五入后的显示值。pass 和 fail 比较的是舍入前的比值与 4.5 或 3，不是先化成两位再比。换一组颜色时要重算，不能把 4.48 记成所有灰色的结果。",
        "text、large、ui 由调用方传入。函数不知道字体粗细、实际像素和用户样式表。把正文标成 large 会得到 pass，那是标错种类，不是文字变大了。ui 通过也不说明旁边的说明文字通过。",
        "motion 不读取 prefers-reduced-motion。stopped 只表示这个名字在 reduce 下应停止。必要的进度指示仍要有文字或确定进度，不能只剩一个不动的空圈。focus 返回 visible 也没有画出轮廓，更没有检查对比度。K15-01 要求焦点样式可见，这里只拒绝「为了减少动画而删掉焦点」。"
      ]
    },
    {
      id: "practice",
      title: "先算灰字，再看失败状态和旋转图标",
      paragraphs: [
        "#777777 对白底的正文应失败，同一对比的界面控件可以通过。只有红点、没有文字的失败应是 color-only。reduce 下的 spinner 应 stopped，focus 仍是 visible。",
        "本主题没有已开放的独立练习。示例不截图取色，也不读取系统的减少动态效果设置。"
      ]
    }
  ],
  sources: [
    { title: "W3C：Understanding 1.4.3 Contrast (Minimum)", url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" },
    { title: "W3C：Understanding 1.4.11 Non-text Contrast", url: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html" },
    { title: "W3C：Understanding 1.4.1 Use of Color", url: "https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html" },
    { title: "MDN：prefers-reduced-motion", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion" }
  ]
};
