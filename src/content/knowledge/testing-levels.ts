import type { Article } from "../articles";

export const testingLevelsArticle: Article = {
  id: "K12-01", kind: "knowledge", domainSlug: "testing", slug: "testing-levels",
  title: "单元、集成与端到端的边界",
  summary: "以笔记保存为贯穿案例，把业务规则、存储协作与用户流程分到能提供真实证据的层次，识别 Mock 掩盖的集成缺陷。",
  aliases: ["unit test", "integration test", "E2E", "测试层次"], tags: ["测试", "行为证据"],
  estimatedMinutes: 20, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "所有函数测试都通过，为什么刷新后笔记还是没了？", paragraphs: [
      "页面调用 save(note)，单元测试把 save 替换成一个立即成功的函数，断言按钮显示“已保存”。这证明了界面怎样响应成功信号，却没有证明数据真的写入浏览器数据库，也没有证明刷新后读的是同一数据集。缺陷可能在事务完成时机、记录 ID、序列化或恢复入口。",
      "选择测试层不是先追求某种比例，而是先写需要证明的事实。字段校验可以在纯函数中证明；存储接口与事务要用真实或足够接近的依赖证明；刷新后恢复需要跨越页面与持久化边界。越过的边界越多，诊断和运行成本通常也越高，因此让每一层负责自己擅长提供的证据。",
    ] },
    { id: "unit", title: "单元层隔离业务规则，让边界输入容易穷举", paragraphs: [
      "先把与 UI 和存储无关的规则提出来，例如一份保存输入必须有有效 ID，正文允许空字符串但限制长度。纯函数接收输入并返回结果或抛出已约定错误；测试不需要启动浏览器，也不需要等待网络。下面是独立 JavaScript 模型，控制台输出用来证明合法与非法路径都走到了。",
    ], examples: [{ code: `function prepareNote(input) {
  if (!input || typeof input.id !== 'string' || !input.id.trim()) throw new TypeError('id');
  if (typeof input.text !== 'string') throw new TypeError('text');
  return { id: input.id.trim(), text: input.text };
}
console.log(JSON.stringify(prepareNote({ id: ' n1 ', text: '' })));
try { prepareNote({ id: 'n1', text: 42 }); }
catch (error) { console.log(error.message); }
console.log(JSON.stringify(prepareNote({ id: 'n1', text: '中文' })));`, expectedOutput: ['{"id":"n1","text":""}', "text", '{"id":"n1","text":"中文"}'], explanation: [
      "第一份输入把 ID 规范化为 n1，同时保留空正文，这体现“允许用户清空笔记”的合同。第二份正文类型错误，抛出 text；第三份中文保持原样。所有判断只依赖输入，因此无需 Mock 数据库。",
      "单元测试的证据边界同样明确：这些输出不能证明 IndexedDB 接受了记录，也不能证明 UI 保存状态正确。把纯函数抽出来是为了清楚检查已有规则，而不是为每个两行函数增加包装层。",
    ] }] },
    { id: "integration", title: "集成层检查接口之间真正交换的内容", paragraphs: [
      "两段独立正确的代码，可能对 ID 或字段名有不同约定。写入方使用 note.id，读取方却查 note.contentId，单独测试各自的内部假设都能通过。把它们接起来，用相同合同写入再读取，才会暴露不一致。下例使用内存 Map 而非真实数据库，用来缩小这类接口错误。",
    ], examples: [{ code: `const rows = new Map();
function write(note) { rows.set(note.id, { ...note }); }
function wrongRead(id) { return rows.get('note:' + id); }
function read(id) { return rows.get(id); }
write({ id: 'n1', text: 'kept' });
console.log(wrongRead('n1') === undefined);
console.log(read('n1').text);
console.log(rows.size);`, expectedOutput: ["true", "kept", "1"], explanation: [
      "写入键是 n1。错误读取加了 note: 前缀，找不到记录；修复读取直接使用同一键，得到 kept。检查 rows.size 为 1 也不能代替检查读到的内容，因为存入一份却查错键仍然可能发生。",
      "这个 Map 示例说明合同衔接，不证明真实浏览器存储。生产集成检查要覆盖实际事务完成、序列化、唯一键与失败回滚。使用内存替身时，应明确它没有配额限制、持久化和跨标签冲突语义。",
    ] }] },
    { id: "e2e", title: "端到端层从用户操作检查跨边界结果", paragraphs: [
      "笔记保存的最小完整流程是：进入文章对应的编辑入口，输入内容，等待真正的保存状态，刷新，再读取同一文章的笔记。随后构造失败：让实际存储拒绝写入，确认输入还在，界面没有显示已保存，并提供复制或重试。只截取按钮变色，不能证明这条流程成立。",
      "端到端环境要隔离自己的测试数据。多个测试共享一个私人数据库，清理与运行顺序就会影响结果。使用独立浏览器上下文、固定测试身份和明确数据准备；测试结束只清除自己的数据，避免碰到用户记录。",
      "等待依据应该是可观察状态或确定事件，不能凭固定的两秒暂停。固定暂停太短会偶发失败，太长浪费时间，而且不会修复系统本身丢失的完成信号。保留失败截图、控制台错误和必要网络轨迹，才能定位是应用问题还是环境问题。",
    ] },
    { id: "mock", title: "替身能控制依赖，也可能把需要证明的边界抹掉", paragraphs: [
      "界面测试可以让存储替身成功、失败或延迟，检查保存状态的分支。若问题恰好是数据库真的有没有完成事务，就不能再用始终成功的 save 替身声称完成验证。替身越过了目标边界，证据就与目标无关。",
    ], examples: [{ code: `async function saveAndReport(store, note) {
  await store.write(note);
  return 'saved';
}
const success = { write: async () => {} };
const failure = { write: async () => { throw new Error('quota'); } };
(async () => {
  console.log(await saveAndReport(success, { text: 'draft' }));
  try { await saveAndReport(failure, { text: 'draft' }); }
  catch (error) { console.log(error.message); }
})();`, expectedOutput: ["saved", "quota"], explanation: [
      "成功替身的 Promise 解决之后才返回 saved，失败替身把 quota 拒绝传播出来。两者证明调用者没有在 await 前提前报告成功，并且没有吞掉错误。",
      "替身没有存任何字节，所以测试不能证明刷新恢复。应把“界面响应存储结果”和“存储真正保存且恢复”分别覆盖；二者通过后，再保留少量用户流程检查接线。",
    ] }] },
    { id: "tradeoffs", title: "用失败成本与诊断成本决定组合", paragraphs: [
      "对大量边界输入优先使用快速、可隔离的单元用例；对序列化、数据库事务和请求适配采用集成用例；对核心用户路径保留端到端检查。重复在三层测试同一实现细节，会增加维护成本，不必为了覆盖数字这样做。",
      "至少两个边界要特别标注：模拟时钟不证明真实浏览器调度；内存存储不证明配额和事务。它们适合控制输入和时序，但目标若是运行平台行为，就需要目标平台上的证据。",
      "如果某一失败只能由 E2E 捕获，修复后可以再提取一个低层回归用例，让未来定位更快。但不要为了测试而把所有模块切成无意义的接口，复杂结构本身也会制造遗漏。",
    ] },
    { id: "verification", title: "一份测试报告应说明每项通过究竟证明了什么", paragraphs: [
      "分别记录规则输入输出、真实接口交换、用户刷新恢复，以及未验证的环境。例如“本机 Chrome 成功与故障注入通过，真实配额耗尽及其它浏览器未覆盖”，比“所有测试通过所以数据安全”更准确。",
      "当失败重试能通过时，仍要查第一次失败的根因。给 flaky 用例增加重试只是在降低观察到失败的概率，不等于产品正确。反例、隔离和确定完成信号才是让证据可重复的基础。",
    ] },
    { id: "recall", title: "给新功能安排最低成本的真实证据", paragraphs: [
      "新增一项列表筛选，输入规则在单元层测；请求参数与返回解析在集成层测；用户输入后列表、空状态、错误恢复在交互或端到端层测。先定位边界，再选工具。",
      "问自己：删掉真实存储后测试是否仍通过？如果仍通过，就不能用它证明持久化。这个简单的问题能够揭示许多看似完整、实际上越过目标的测试。",
    ] },
  ],
  sources: [
    { title: "Playwright：测试隔离与用户可见行为", url: "https://playwright.dev/docs/best-practices" },
    { title: "Testing Library：测试指导原则", url: "https://testing-library.com/docs/guiding-principles/" },
  ],
};
