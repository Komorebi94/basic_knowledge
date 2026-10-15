import type { Article } from "../articles";

export const complexFormsArticle: Article = {
  id: "K13-03",
  kind: "knowledge",
  domainSlug: "architecture",
  slug: "complex-forms-and-workflows",
  title: "复杂表单与工作流",
  summary: "用笔记和订单草稿分开校验、撤销和在途提交，迟到的失败响应不能改掉已经结束的流程。",
  aliases: ["form workflow", "undo", "async submit", "表单工作流"],
  tags: ["架构", "表单", "工作流"],
  estimatedMinutes: 24,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "金额字段还在，为什么把笔记改成订单后提交却用了上一次的校验？",
      paragraphs: [
        "笔记草稿没有金额。用户把种类改成订单，金额框才出现，但提交仍沿用“金额必须为空”的判断，空金额的订单也被接受。另一条路径是提交已经发出，用户又改了标题，旧请求失败后把整张表标成失败，连新草稿也锁住。校验、联动、撤销和在途提交被写进同一个事件回调，后一次操作分不清自己改的是哪一版。",
        "工作流要有一份当前草稿、一条只读这份草稿的校验，以及提交世代。撤销回到上一次草稿，不回到服务器上的笔记。K13-02 把草稿和远端事实分开；本篇只处理这一张表怎么从编辑走到保存或失败。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：同步草稿机，金额只接受正整数文本",
      paragraphs: [
        "运行 npm run verify:k13。种类只有 note 和 order。标题去掉空白后不能为空。笔记的金额必须是空字符串；订单金额必须匹配从 1 开始的十进制数字，0 和空字符串都是 amount。长度和货币不是这个模型的规则。",
        "edit 和 undo 在 pending 时返回 busy，不改草稿。submit 通过后把世代加一。settle 只接受当前世代且阶段仍是 pending，否则返回 stale。模型不发网络请求。"
      ]
    },
    {
      id: "flow",
      title: "在途提交拒绝继续编辑，世代不符的响应保持原阶段",
      paragraphs: [
        "空标题提交得到 blocked:title。写成“草稿”后再写入金额 1，笔记规则返回 blocked:amount-forbidden。撤销回到金额为空的“草稿”。这次提交得到 pending:1，期间再编辑返回 busy。世代 0 的成功响应是 stale，世代 1 才把阶段改成 saved。",
        "订单缺金额是 blocked:amount。补上 12 后进入 pending:1，失败响应把阶段改成 failed，标题和金额仍留在视图里。失败没有清空用户刚提交的那一版草稿。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function validate(draft) {
  if (draft.kind !== 'note' && draft.kind !== 'order') return 'bad-kind';
  if (typeof draft.title !== 'string' || !draft.title.trim()) return 'title';
  if (draft.kind === 'note' && draft.amount !== '') return 'amount-forbidden';
  if (draft.kind === 'order' && !/^[1-9][0-9]*$/.test(draft.amount)) return 'amount';
  return 'ok';
}
function createFlow(initial) {
  let current = { ...initial };
  const past = [];
  let generation = 0;
  let phase = 'editing';
  return {
    view() { return phase + '|' + current.kind + '|' + current.title + '|' + current.amount; },
    edit(patch) {
      if (phase === 'pending') return 'busy';
      past.push({ ...current });
      current = { ...current, ...patch };
      phase = 'editing';
      return 'edited';
    },
    undo() {
      if (phase === 'pending') return 'busy';
      if (past.length === 0) return 'empty';
      current = past.pop();
      phase = 'editing';
      return 'undone';
    },
    submit() {
      const problem = validate(current);
      if (problem !== 'ok') return 'blocked:' + problem;
      generation += 1;
      phase = 'pending';
      return 'pending:' + generation;
    },
    settle(id, result) {
      if (phase !== 'pending' || id !== generation) return 'stale';
      phase = result === 'ok' ? 'saved' : 'failed';
      return phase;
    },
  };
}
const flow = createFlow({ kind: 'note', title: '', amount: '' });
console.log('空标题:' + flow.submit());
console.log('改标题:' + flow.edit({ title: '草稿' }));
console.log('笔记带金额:' + flow.edit({ amount: '1' }) + '/' + flow.submit());
console.log('撤销:' + flow.undo() + '/' + flow.view());
console.log('提交:' + flow.submit() + '/' + flow.edit({ title: '改' }));
console.log('旧响应:' + flow.settle(0, 'ok'));
console.log('成功:' + flow.settle(1, 'ok') + '/' + flow.view());
const order = createFlow({ kind: 'order', title: '零件', amount: '' });
console.log('订单缺金额:' + order.submit());
console.log('订单:' + order.edit({ amount: '12' }) + '/' + order.submit());
console.log('失败:' + order.settle(1, 'error') + '/' + order.view());`,
          expectedOutput: [
            "空标题:blocked:title",
            "改标题:edited",
            "笔记带金额:edited/blocked:amount-forbidden",
            "撤销:undone/editing|note|草稿|",
            "提交:pending:1/busy",
            "旧响应:stale",
            "成功:saved/saved|note|草稿|",
            "订单缺金额:blocked:amount",
            "订单:edited/pending:1",
            "失败:failed/failed|order|零件|12"
          ],
          explanation: [
            "撤销弹出的是写入金额之前的草稿，所以金额恢复为空字符串，视图末尾是一个空段。提交后的编辑被拒绝，草稿不会在等待期间变成“改”。",
            "世代 0 不是当前提交。订单失败后阶段是 failed，但零件和 12 还在，调用方可以改完再提交，而不是重新找一份被清掉的表单。"
          ]
        }
      ]
    },
    {
      id: "linkage",
      title: "联动是校验的输入条件，不是提交之后再隐藏字段",
      paragraphs: [
        "同一份校验按种类阅读金额。笔记带 1 是 amount-forbidden，笔记金额为空是 ok。订单金额为空或 0 都是 amount，12 才是 ok。task 不是两种种类，返回 bad-kind。",
        "界面可以按种类显示或隐藏金额框，但隐藏不能代替校验。若只在界面上拿掉输入框、提交对象里仍留着上一种类的金额，笔记会被拒绝。切换种类时要同时改草稿里的金额，并记入可撤销的一步。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function validate(draft) {
  if (draft.kind !== 'note' && draft.kind !== 'order') return 'bad-kind';
  if (typeof draft.title !== 'string' || !draft.title.trim()) return 'title';
  if (draft.kind === 'note' && draft.amount !== '') return 'amount-forbidden';
  if (draft.kind === 'order' && !/^[1-9][0-9]*$/.test(draft.amount)) return 'amount';
  return 'ok';
}
console.log('笔记空金额:' + validate({ kind: 'note', title: '草稿', amount: '' }));
console.log('笔记有金额:' + validate({ kind: 'note', title: '草稿', amount: '1' }));
console.log('订单空:' + validate({ kind: 'order', title: '零件', amount: '' }));
console.log('订单零:' + validate({ kind: 'order', title: '零件', amount: '0' }));
console.log('订单十二:' + validate({ kind: 'order', title: '零件', amount: '12' }));
console.log('种类:' + validate({ kind: 'task', title: '草稿', amount: '' }));`,
          expectedOutput: [
            "笔记空金额:ok",
            "笔记有金额:amount-forbidden",
            "订单空:amount",
            "订单零:amount",
            "订单十二:ok",
            "种类:bad-kind"
          ],
          explanation: [
            "0 不是从 1 开始的数字，所以和空字符串一样被订单拒绝。笔记则相反，任何非空金额都越界。",
            "两种种类共用一个函数，条件写在种类判断里。不要为笔记和订单独做两套会逐渐分叉的提交按钮。"
          ]
        }
      ]
    },
    {
      id: "steps",
      title: "撤销栈保存草稿，不保存服务器是否已经收下",
      paragraphs: [
        "每一次 edit 在修改前把当前草稿推进栈。undo 只在非 pending 时弹出。保存成功后的撤销如果还用这只栈，会把已经提交的内容改回本地旧稿，却不会撤回服务器上的笔记。提交成功后应清空这只编辑栈，或把撤销定义成另一次补偿操作。",
        "失败阶段留着草稿，是为了让用户修改后重新 submit。重新提交会增加世代。上一只失败响应如果晚到，因为阶段已经不是那次 pending，会得到 stale，不能把新的等待打回失败。"
      ]
    },
    {
      id: "boundaries",
      title: "这个草稿机不证明浏览器表单约束，也不合并并发编辑者",
      paragraphs: [
        "校验是作者写下的字符串规则，不是浏览器的 Constraint Validation，也不认识小数、本地化数字和多币种。订单金额 12 只表示模型接受这份文本。",
        "世代只区分这一张表上的提交。两位用户同时改同一篇笔记时，谁的版本能写入要由服务器的版本或所有者决定。stale 不能代替那一层冲突。",
        "pending 时拒绝编辑是这个流程的选择。若产品允许等待时继续改草稿，就必须把在途提交和当前草稿分成两份，结算时不能用新草稿覆盖旧请求的结果。"
      ]
    },
    {
      id: "practice",
      title: "先写种类切换后的草稿，再写在途和迟到响应",
      paragraphs: [
        "列出笔记、订单和非法种类的校验结果，包括 0 和空金额。再写提交中编辑、旧世代成功、失败后草稿仍在这三步。撤销只断言本地草稿，不断言服务器记录被撤回。",
        "本主题没有已开放的独立练习。示例里的长度以外的金额规则只属于这个模型。"
      ]
    }
  ],
  sources: [
    { title: "MDN：约束验证", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation" },
    { title: "MDN：表单验证", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation" },
    { title: "React：表单组件", url: "https://react.dev/reference/react-dom/components/form" }
  ]
};
