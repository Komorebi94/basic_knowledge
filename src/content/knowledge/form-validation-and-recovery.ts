import type { Article } from "../articles";

export const formValidationArticle: Article = {
  id: "K15-03",
  kind: "knowledge",
  domainSlug: "accessibility",
  slug: "form-validation-and-recovery",
  title: "表单验证与恢复",
  summary: "提交笔记或订单后，用第一条错误定位字段，摘要保留其余错误；只变红或未关联的提示不算可恢复，输入过程中先不打断。",
  aliases: ["form errors", "error summary", "aria-invalid", "表单恢复"],
  tags: ["无障碍", "表单", "错误"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "边框变红了，为什么用户还是找不到要改的那一项？",
      paragraphs: [
        "订单提交失败后，标题和数量都空着，页面只把两个输入框涂成红色。键盘焦点仍停在提交按钮上。用户看不见颜色时，不知道哪一项错了；看得见颜色时，也要自己猜是格式不对还是必填没写。改完标题再提交，数量的旧红框还在，但页面没有说明标题已经通过。",
        "可恢复的错误要同时做到三件事：指出字段，写出怎么改，并把下一次操作交到第一条错误上。其余错误留在摘要里，不能只留第一条。输入过程中先不要打断。本篇用固定对象演示这个合同，不读取真实表单，也不移动页面焦点。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：笔记只查标题，订单再查正整数数量",
      paragraphs: [
        "运行 npm run verify:k15。reviewNote 只接受 kind 为 note 或 order。标题会去掉两端空白，空字符串记为 title。订单的数量必须匹配从 1 开始的整数字符串，0 和空值都记为 amount。返回值里的 focus 是第一条错误的字段名，summary 按发现顺序接上全部字段和原因。",
        "showReview 把 saved 和 invalid 收成一行。errorCue 检查提示本身：没有文字的红色是 color-only，有文字但 linked 不是 true 是 unlinked。reportWhen 只区分 input 和 submit。这些函数不设置 aria-invalid，也不调用 focus。"
      ]
    },
    {
      id: "review",
      title: "两条错误时先去标题，改完标题后焦点合同改到数量",
      paragraphs: [
        "笔记标题是几个空格时，结果是 focus:title，摘要只有标题原因。标题写成「 会议 」时两端空白被去掉，返回 saved。订单同时缺标题、数量又是 0 时，focus 仍是 title，摘要用竖线接上 amount。用户按这一条就能知道下一站是标题，同时也能看见数量还没过。",
        "只把标题补成「订单」、数量仍是 0 时，title 从摘要里消失，focus 改成 amount。两条都满足后才 saved。kind 为 page 时没有字段可指，返回 invalid，不能假装保存成功。笔记不检查 amount，所以笔记带上 0 仍然 saved。订单规则不要悄悄套到笔记上。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function reviewNote(input) {
  if (!input || (input.kind !== 'note' && input.kind !== 'order')) return { status: 'invalid', focus: '', summary: '' };
  const errors = [];
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) errors.push({ field: 'title', message: '标题不能只包含空格' });
  if (input.kind === 'order') {
    const amount = typeof input.amount === 'string' ? input.amount.trim() : '';
    if (!/^[1-9][0-9]*$/.test(amount)) errors.push({ field: 'amount', message: '数量必须是正整数' });
  }
  if (!errors.length) return { status: 'saved', focus: '', summary: '' };
  return { status: 'invalid', focus: errors[0].field, summary: errors.map((item) => item.field + ':' + item.message).join('|') };
}
function showReview(input) {
  const result = reviewNote(input);
  if (result.status === 'saved') return 'saved';
  if (!result.focus) return 'invalid';
  return 'focus:' + result.focus + '|' + result.summary;
}
console.log('空白标题:' + showReview({ kind: 'note', title: '  ' }));
console.log('可保存:' + showReview({ kind: 'note', title: ' 会议 ' }));
console.log('两项错误:' + showReview({ kind: 'order', title: '', amount: '0' }));
console.log('只剩数量:' + showReview({ kind: 'order', title: '订单', amount: '0' }));
console.log('订单保存:' + showReview({ kind: 'order', title: '订单', amount: '2' }));
console.log('未知类型:' + showReview({ kind: 'page', title: '会议' }));
console.log('笔记忽略数量:' + showReview({ kind: 'note', title: '会议', amount: '0' }));`,
          expectedOutput: [
            "空白标题:focus:title|title:标题不能只包含空格",
            "可保存:saved",
            "两项错误:focus:title|title:标题不能只包含空格|amount:数量必须是正整数",
            "只剩数量:focus:amount|amount:数量必须是正整数",
            "订单保存:saved",
            "未知类型:invalid",
            "笔记忽略数量:saved"
          ],
          explanation: [
            "空标题先进入错误列表，所以两项一起失败时 focus 仍是 title。摘要里的 amount 没有被丢掉，用户不用再提交一次才发现第二项。",
            "标题改好后，下一次结果只剩 amount，说明恢复是重新计算，不是把旧错误留在界面上。笔记不套用订单的数量规则。"
          ]
        }
      ]
    },
    {
      id: "cue",
      title: "只变红和没关联的文字都还不能把用户带到字段上",
      paragraphs: [
        "errorCue 见到 color 为 red、message 为空，返回 color-only。颜色可以加强已经写出来的原因，但不能单独充当原因。message 有「标题不能只包含空格」、linked 为 false 时返回 unlinked：文字存在，却没有和 title 建立关联，辅助技术读到输入时不一定读到这句。linked 为 true 才返回 linked 加原因。",
        "reportWhen('input') 是 defer，reportWhen('submit') 是 summary。键入每个字符都弹出整份摘要，会打断正在输入的人；blur 在这个模型里是 invalid，避免把失焦误写成提交。K15-02 已经要求错误关联字段并在修复后清掉 aria-invalid。这里的 linked 只是布尔标记，没有创建真实的 aria-describedby。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function errorCue(input) {
  if (!input || input.field !== 'title') return 'invalid';
  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (input.color === 'red' && !message) return 'color-only';
  if (message && input.linked !== true) return 'unlinked';
  if (message && input.linked === true) return 'linked:' + message;
  return 'invalid';
}
function reportWhen(event) {
  if (event === 'input') return 'defer';
  if (event === 'submit') return 'summary';
  return 'invalid';
}
console.log('只变红:' + errorCue({ field: 'title', color: 'red', message: '' }));
console.log('未关联:' + errorCue({ field: 'title', color: 'red', message: '标题不能只包含空格', linked: false }));
console.log('已关联:' + errorCue({ field: 'title', message: '标题不能只包含空格', linked: true }));
console.log('输入中:' + reportWhen('input'));
console.log('提交时:' + reportWhen('submit'));
console.log('未知时机:' + reportWhen('blur'));`,
          expectedOutput: [
            "只变红:color-only",
            "未关联:unlinked",
            "已关联:linked:标题不能只包含空格",
            "输入中:defer",
            "提交时:summary",
            "未知时机:invalid"
          ],
          explanation: [
            "红色本身没有字段名和改法。未关联的句子即使写对了原因，也不算已经交到标题控件上。",
            "input 推迟摘要，submit 才汇总。blur 没有被定义成第三种时机，调用方不能用失焦代替提交。"
          ]
        }
      ]
    },
    {
      id: "recover",
      title: "恢复路径是重新提交后的新结果，不是把红框留着",
      paragraphs: [
        "第一次提交得到 focus:title 和两条摘要。用户改标题后再提交，旧的 title 原因必须消失，否则会把人带回已经正确的字段。只剩数量时，下一次操作位置改到 amount，原因仍是「数量必须是正整数」，而不是「失败」两个字。",
        "saved 不再带 focus。成功之后如果还把焦点按回标题，用户会以为还有错误。未知 kind 保持 invalid，不能为了清掉界面而返回 saved。数量 2 通过、数量 0 不通过，是因为模型要求第一位是 1 到 9。前导零不是这个模型里的正整数。"
      ]
    },
    {
      id: "boundaries",
      title: "字段名不是焦点移动，关联标记也不是读屏已经播报",
      paragraphs: [
        "focus:title 只是下一次应当放置操作的字段名。函数没有调用元素的 focus，也没有滚动页面。真实页面还要确认该控件存在、可见、没有被弹层挡住。K15-01 的焦点合同仍然要单独走一遍。",
        "linked:true 不是 aria-describedby，也不是某一种辅助技术的播报记录。颜色对比、错误文字是否够大，由 K15-06 的规则另判。这里只判断有没有文字、有没有关联标记。",
        "摘要顺序等于检查顺序。先检查标题，所以标题永远排在数量前面。如果页面视觉上数量在标题之前，DOM 和摘要顺序也要跟着调整，不能只改返回字符串。模型不支持在 input 事件里做字段级提示，需要那种交互时要另写合同，而不是把 blur 塞进 reportWhen。"
      ]
    },
    {
      id: "practice",
      title: "用一份订单把两条错误改到可以保存",
      paragraphs: [
        "先提交空标题和 0，确认 focus 是 title 且摘要里有 amount。再只改标题，确认摘要不再提到标题。最后把数量改成 2，确认 saved。另做一次只有红框、没有文字的提示，结果应是 color-only。",
        "本主题没有已开放的独立练习。示例不创建输入框，也不宣布某种读屏已经读出错误。"
      ]
    }
  ],
  sources: [
    { title: "W3C：Understanding 3.3.1 Error Identification", url: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html" },
    { title: "W3C：Understanding 3.3.3 Error Suggestion", url: "https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html" },
    { title: "MDN：aria-invalid", url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid" }
  ]
};
