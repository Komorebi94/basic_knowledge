import type { Article } from "../articles";

export const moduleBoundariesArticle: Article = {
  id: "K13-01", kind: "knowledge", domainSlug: "architecture", slug: "module-boundaries",
  title: "模块边界与依赖方向",
  summary: "以笔记保存为例，将业务决策、外部存储和界面反馈分到清晰的所有权边界，理解什么时候需要适配器，什么时候简单函数已经足够。",
  aliases: ["module boundary", "dependency direction", "adapter", "依赖倒置"], tags: ["架构", "模块", "所有权"],
  estimatedMinutes: 22, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "换一种存储，为什么连页面里的校验公式都要重写？", paragraphs: [
      "某个页面在按钮回调里校验正文、打开数据库、生成记录键、处理版本冲突并显示成功。第二个页面要保存同类笔记，于是复制这段回调；后来正文限制改变，只改了一处。功能规模并不大，问题却来自规则与外部操作的所有权不清。",
      "模块划分的目标不是把文件拆得越多越好，而是让变化有明确归属。什么内容允许保存属于业务规则；如何通过 IndexedDB 或服务端提交属于适配器；如何展示等待、失败和重试属于界面。业务流程把规则与适配器组合起来，并把真实结果交给界面，不在多个组件里复制公式。",
      "本文以独立 JavaScript 小模型演示依赖方向。内存适配器没有真实数据库事务语义，示例只证明规则、调用与错误传播，不把它描述成可直接替代生产存储。",
    ] },
    { id: "policy", title: "先把业务规则写成不依赖 UI 的函数", paragraphs: [
      "规则越依赖 document、数据库连接或通知组件，就越难在边界输入上独立验证。纯规则接收稳定领域输入，返回规范化值或明确拒绝；它不负责弹提示，也不猜数据库怎么保存。规则中仍可保留真实业务复杂度，不必把每个 if 变成插件系统。",
    ], examples: [{ code: `function validateDraft(input) {
  if (typeof input.text !== 'string') return { ok: false, reason: 'text-type' };
  if (input.text.length > 10) return { ok: false, reason: 'too-long' };
  return { ok: true, value: { text: input.text } };
}
console.log(JSON.stringify(validateDraft({ text: '' })));
console.log(JSON.stringify(validateDraft({ text: 'elevenchars' })));
console.log(JSON.stringify(validateDraft({ text: false })));`, expectedOutput: ['{"ok":true,"value":{"text":""}}', '{"ok":false,"reason":"too-long"}', '{"ok":false,"reason":"text-type"}'], explanation: [
      "空字符串被接受，表明允许清空正文。elevenchars 超出模型约定的十个 UTF-16 code unit，产生 too-long；布尔值产生 text-type。返回形状区分成功与失败，调用方不用从含糊的 null 猜原因。",
      "十这个上限仅是演示合同。真实系统应复用已有正文限制及字符计数规则，不能把示例常数带进业务。这个函数不做保存，也不显示 UI，因此替换存储或提示方式不会改变它的输入输出。",
    ] }] },
    { id: "ports", title: "流程依赖所需能力，而不是具体数据库细节", paragraphs: [
      "业务流程需要的是写一份有效记录，并知道结果。把该能力通过参数传进来，可以避免流程直接导入 IndexedDB 全局对象，也方便在测试中观察调用。只有当存在真实替换或隔离需求时才引入这层；单次局部调用不必先造完整仓储继承体系。",
    ], examples: [{ code: `async function saveDraft(store, draft) {
  if (typeof draft.text !== 'string') return { status: 'invalid' };
  await store.write({ id: draft.id, text: draft.text });
  return { status: 'saved' };
}
const rows = new Map();
const store = { write: async (row) => { rows.set(row.id, { ...row }); } };
(async () => {
  console.log((await saveDraft(store, { id: 'n1', text: 'hello' })).status);
  console.log(rows.get('n1').text);
  console.log((await saveDraft(store, { id: 'n2', text: 42 })).status);
  console.log(rows.has('n2'));
})();`, expectedOutput: ["saved", "hello", "invalid", "false"], explanation: [
      "流程在输入有效之后调用 write，等待成功才返回 saved。Map 里出现 n1，说明写入方收到规范形状。无效的 n2 在边界被拒绝，store 没有被调用，不会产生记录。",
      "示例为了独立运行，只检查正文类型；真实代码应调用上一节已有规则，不在流程里再复制一套校验。store.write 的合同还要明确何时代表持久化成功、是否做版本比较和错误类别，接口简单不代表语义可以含糊。",
    ] }] },
    { id: "failure", title: "错误由能决定恢复方式的一层解释", paragraphs: [
      "底层配额错误、版本冲突和非法输入的恢复动作不同。若适配器 catch 所有异常并返回 true，流程会把失败当成功，页面显示已保存。若底层直接弹全局提示，调用方就难以保留输入、调整重试或测试错误状态。",
      "让底层保留错误语义，流程把业务可解释的失败转换成明确结果，界面选择文案与操作。未知异常继续报告给可观测系统，但只记录必要上下文，不把私人正文或令牌写进日志。",
    ], examples: [{ code: `async function persist(store, text) {
  await store.write(text);
  return 'saved';
}
(async () => {
  const failing = { write: async () => { throw new Error('quota'); } };
  try { console.log(await persist(failing, 'draft')); }
  catch (error) { console.log('keep-input:' + error.message); }
  const succeeding = { write: async () => {} };
  console.log(await persist(succeeding, 'draft'));
})();`, expectedOutput: ["keep-input:quota", "saved"], explanation: [
      "第一次 write 拒绝，await 把拒绝交给调用方，saved 没有执行。调用方示意保留输入并报告 quota。第二次适配器成功才显示 saved，说明错误路径不需要污染正常流程。",
      "输出只是流程模型，不包含真实的重试 UI。重试是否安全还取决于幂等写入与版本检查，不能看到 catch 就认为已经处理全部恢复。跨标签冲突应该有保留两份内容的专门结果，而不是自动重复覆盖。",
    ] }] },
    { id: "direction", title: "依赖方向用真实导入与调用判断", paragraphs: [
      "通常让 UI 依赖应用流程，流程依赖规则和所需能力，适配器实现这些能力。规则不反向导入页面，存储不控制界面跳转。若所有模块通过一个全局 service locator 获取依赖，源码导入虽然少，运行关系却被隐藏，定位变化反而更难。",
      "按领域聚合相同规则比按文件后缀集中所有 helpers 更有用。保存相关的键、版本与校验归同一所有者，页面消费公开入口。相同的两行文字处理不一定代表相同领域合同；为了消除表面重复而共享一个未来会分叉的规则，也会增加耦合。",
      "循环导入不必然导致运行失败，但意味着初始化与所有权更难推理。遇到页面和存储互相依赖，先问哪一方该拥有流程，再提取稳定合同；不要只把符号搬到 common 文件来掩盖原有循环。",
    ] },
    { id: "boundaries", title: "适配器边界不自动解决事务和并发", paragraphs: [
      "一次业务修改需要写入记录与事件日志，如果拆成两个各自成功的接口，中间失败就可能留下半份状态。接口设计必须表达“原子提交这一组修改”，由实际存储实现事务；把每个表封装成 repository 并不会自动获得跨表原子性。",
      "第二个边界是版本与数据集身份。用户导入备份后，旧页面若继续保存相同 revision 的旧记录，也可能覆盖新库。流程的写入合同需要同时说明数据集身份、期望版本与冲突结果。这是业务持久化事实，不能只靠 UI 显示一个保存按钮解决。",
      "内存替身适合快速测试调用顺序，真实适配器仍需集成验证。共享一个 write 签名，只能说明形状一致，不能证明失败回滚、配额或跨标签行为相同。",
    ] },
    { id: "verification", title: "在现有模块上做最小的边界改进", paragraphs: [
      "先画出现有调用链，找到复制规则和混合职责的具体位置。优先提取有真实重复或难以验证的业务规则，保留现有函数签名与持久化键；每步检查原调用方和失败路径。不要把一项保存修复扩大成全站层次重建。",
      "验证规则边界、适配器成功及失败、界面保留输入与真实刷新恢复。审查导入方向，确保纯领域函数没有偷偷读取 document 或全局数据库。能够给每项状态和副作用找到唯一拥有者，才说明边界改善了推理成本。",
    ] },
    { id: "recall", title: "判断一次改动应该落在哪一层", paragraphs: [
      "更换正文限制属于规则，改数据库字段映射属于适配器，增加失败后的复制按钮属于 UI，决定何时重试和如何处理冲突属于应用流程。用变化的原因而不是文件数量判断职责。",
      "如果修改一个小规则需要同步编辑多个页面，先找是否重复定义了同一事实。反过来，只有一次调用且没有替换需求时，直接清晰函数通常比抽象框架更合适。",
    ] },
  ],
  sources: [
    { title: "MDN：JavaScript 模块与导入", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules" },
    { title: "React：组件层次与状态归属", url: "https://react.dev/learn/thinking-in-react" },
  ],
};
