import type { Article } from "../articles";

export const behaviorBoundaryArticle: Article = {
  id: "K12-02", kind: "knowledge", domainSlug: "testing", slug: "behavior-boundary-tests",
  title: "行为断言与边界用例",
  summary: "从请求乱序与有效空值出发，构造能击败错误实现的用例，分别检查返回值、状态、副作用、取消及失败恢复。",
  aliases: ["assertion", "edge case", "mutation testing", "行为断言"], tags: ["测试", "边界", "异步"],
  estimatedMinutes: 20, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "测试覆盖了那一行，为什么仍没有发现错误？", paragraphs: [
      "读取配置时写了 value || fallback。测试输入非空字符串，正确实现和错误实现都给出相同输出，覆盖率也显示这一行已执行。业务却允许 false、0 和空字符串，它们会被错误替换。覆盖率说明执行路径被走过，不说明判断区分了所有有效数据。",
      "行为断言从合同选择输入：何种值有效，什么算缺失，失败是否抛错，是否允许修改输入。有效用例应该让至少一种典型错误实现与正确行为产生不同结果。以下例子可在现代浏览器或 Node 运行，断言采用明确输出以便独立核对，不依赖测试框架。",
    ], examples: [{ code: `function incorrect(value) { return value || 'fallback'; }
function correct(value) { return value ?? 'fallback'; }
for (const value of [0, false, '', null]) {
  console.log(JSON.stringify([incorrect(value), correct(value)]));
}`, expectedOutput: ['["fallback",0]', '["fallback",false]', '["fallback",""]', '["fallback","fallback"]'], explanation: [
      "前三项是有效但 falsy 的值，|| 把它们误当缺失。?? 只在 null 或 undefined 时选备用值，因此保留前三项。最后的 null 在两种实现里都缺失，单独测它无法识别错误。",
      "选择 ?? 依赖合同。如果业务明确把空字符串视为缺失，需要先做该业务判断；不能因为这个例子就把所有 || 机械替换。用例必须把合法域写清，才能判断输出差异究竟是缺陷还是设计选择。",
    ] }] },
    { id: "matrix", title: "先划分数据域，再选能代表区别的输入", paragraphs: [
      "对数组转树，不只写一份正常树。划分空输入、父子乱序、多根、重复 ID、孤立节点、自环和跨节点环；这些类别触发不同不变量。对时间参数，要有零、最小允许值、负数、非整数和非数字，而不是随机挑几个正数。",
      "每个测试写一句目的，例如“false 是合法值，不应落到默认值”“失败后缓存必须清理，下一次允许重新发起”。有明确目的才知道断言该看什么，也更容易删除只重复正常路径的低价值用例。",
      "不要只测试返回值。输入可能被修改，重复调用可能累积状态，失败之后可能留下计时器或监听器。把这些外部合同变成前后比较：原输入保持一致、资源计数恢复、下一次操作能成功。",
    ] },
    { id: "identity", title: "异步反例需要控制谁先发出、谁先返回", paragraphs: [
      "如果每次测试都让 A 先发先返回，直接写入结果的错误实现也会通过。请求归属的关键反例是 A 先发、B 后发，B 先返回，之后 A 成功或失败。测试应直接控制完成函数或 Promise，不依赖真实接口恰好慢一点。",
    ], examples: [{ code: `function createState(guardErrors) {
  let latest = 0;
  let shown = 'empty';
  return {
    begin() {
      const id = ++latest;
      return {
        succeed(value) { if (id === latest) shown = value; },
        fail() { if (!guardErrors || id === latest) shown = 'error'; },
      };
    },
    read() { return shown; },
  };
}
for (const guardErrors of [false, true]) {
  const state = createState(guardErrors);
  const old = state.begin();
  const current = state.begin();
  current.succeed('new');
  old.fail();
  console.log(state.read());
}`, expectedOutput: ["error", "new"], explanation: [
      "两个模型都保护了成功分支，因此只测旧成功会让它们一起通过。guardErrors=false 时，旧请求失败仍把当前状态改成 error；true 时，失败也核对身份，保留 new。这个反例专门识别漏掉失败路径的实现。",
      "真实组件还可能在 finally、取消或清空时写入状态。测试矩阵应从所有写入点推导，而不是只围绕一个 API 是否被调用。取消信号能节约工作，但完成身份才决定谁有权写入。",
    ] }] },
    { id: "errors", title: "捕获错误不是吞掉错误：断言类别和副作用", paragraphs: [
      "一个测试把任意异常 catch 后视为成功，会同时接受预期校验失败与完全无关的代码崩溃。应确认实际异常类别或稳定错误码，并确认不应发生的写入没有发生。错误文案若允许翻译或调整，不宜把每个标点都作为合同。",
    ], examples: [{ code: `let writes = 0;
function save(input) {
  if (typeof input !== 'string') throw new TypeError('text-required');
  writes += 1;
  return input;
}
let caught;
try { save(42); } catch (error) { caught = error; }
console.log(caught instanceof TypeError);
console.log(caught.message);
console.log(writes);
console.log(save(''));
console.log(writes);`, expectedOutput: ["true", "text-required", "0", "", "1"], explanation: [
      "无效输入产生 TypeError 且写入计数保持零，分别验证错误语义与无副作用。接着空字符串合法，返回空串并写入一次，验证失败没有破坏后续正常调用。",
      "如果 save 先写后校验，错误仍可能被正确捕获，但 writes 会成为 1；只断言 throws 就漏掉了副作用。实际持久化系统还应检查事务回滚与原数据保留，计数模型只能说明调用次序。",
    ] }] },
    { id: "time", title: "时间、取消和重入要检查边界前后两个时刻", paragraphs: [
      "防抖在 wait-1 时不能执行，推进到 wait 时执行一次；flush 后再推进时钟不能重复；取消后既无调用也无残留状态。用统一虚拟时钟控制推进，并在异步队列切换处按合同处理微任务。真实 sleep 不提供精确边界，会混入机器负载。",
      "取消用例至少分为预取消、等待中取消、完成后取消。预取消不能建立无用资源；等待中取消要释放；完成后取消不应改变已经确定的结果。不要让一个全局 canceled 布尔值误伤下一次调用。",
      "事件监听器重入同样值得单独测：once 回调内部再次 emit，若解绑发生在回调之后，就会调用两次。返回快照遍历还涉及监听期间添加或移除其它回调，应先在题面冻结语义再写断言。",
    ] },
    { id: "independence", title: "不要让测试与实现共享同一个错误公式", paragraphs: [
      "二分查找实现错了边界公式，测试也调用同一 helper 生成 expected，就可能共同通过。对小输入使用手工可推导的预期位置，对较大输入使用结构不同的线性参考算法，再检查不修改输入。独立证据需要与实现不同的推导来源。",
      "属性测试可以检查一般不变量，如稳定去重的结果不重复、保留首次出现顺序、幂等应用结果不变。但属性也可能写错或太弱；永远返回空数组就能满足“不重复”。增加保留所有不同键的条件，才能排除这种退化实现。",
      "变异或错误实现检查用于评估用例区分力。把某个 >= 改成 >、省掉取消清理、吞掉旧失败，观察用例是否失败。它不能证明所有可能缺陷已消失，却能直接识别当前测试明显缺少的约束。",
    ] },
    { id: "verification", title: "把一项合同转成可审阅的用例记录", paragraphs: [
      "记录用例名称、输入、预期、为什么能区分错误、实际结果与环境。不要只贴绿色截图，也不要把未运行的负向用例列为通过。确定性输入和独立预期让另一位维护者能复现同一判断。",
      "如果测试偶发失败，先保留证据并确定是时钟、共享状态、外部服务还是产品竞态。增加重试可能暂时掩盖症状，不能改变行为合同。选最小能证明目标行为的一层执行，再补必要集成覆盖。",
    ] },
    { id: "recall", title: "先想一个会通过正常例子的错误方案", paragraphs: [
      "新增一个行为时，先写下最容易出现的错误实现，再设计输入把它与正确方案分开。对于默认值，就是 0 和 false；对于竞态，就是旧失败迟到；对于缓存，就是缓存 undefined 后再读。",
      "最后检查失败之后的恢复、重复调用和输入不变。能够说清每条用例要排除哪种错误，比单纯增加测试条数更有价值。",
    ] },
  ],
  sources: [
    { title: "Playwright：以用户可见行为验证", url: "https://playwright.dev/docs/best-practices" },
    { title: "Testing Library：行为优先", url: "https://testing-library.com/docs/guiding-principles/" },
  ],
};
