import type { Article } from "../articles";

export const stateOwnershipArticle: Article = {
  id: "K13-02", kind: "knowledge", domainSlug: "architecture", slug: "state-ownership",
  title: "状态归属与数据流",
  summary: "区分源数据、派生值、远端缓存和编辑草稿，沿筛选与保存过程解释双写、旧响应覆盖以及冲突恢复的根因。",
  aliases: ["state ownership", "single source of truth", "derived state", "数据流"], tags: ["架构", "状态", "并发"],
  estimatedMinutes: 22, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "列表有三项，为什么页面显示数量还是两项？", paragraphs: [
      "页面同时保存 items 和 count，每次添加或删除都要更新两份。某条错误恢复路径只改 items，数量就不一致。这不是缺少某个 useEffect，而是把同一事实存了两次：count 本来可由 items.length 推导，却被当成独立来源。",
      "先给每项状态写清拥有者与意义。服务端记录是远端事实，客户端缓存是最近一次可用副本，输入草稿是用户尚未提交的意图，筛选后的列表是派生值。它们即使字段相似，也不能随意合并；该独立的状态要保留，能推导的状态不要双写。",
    ], examples: [{ code: `let items = ['A', 'B'];
let copiedCount = items.length;
items = [...items, 'C'];
console.log(copiedCount);
console.log(items.length);
const query = 'B';
const visible = items.filter((item) => item.includes(query));
console.log(visible.length);`, expectedOutput: ["2", "3", "1"], explanation: [
      "copiedCount 保存的是初始化那次的数值，没有任何自动关联，所以仍是 2。items.length 从当前源数组推导得到 3。筛选结果基于当前 items 与 query，数量 1 属于可见列表，不等于总数。",
      "修复通常是渲染时直接推导数量，而不是再添加同步 effect。如果统计来自服务端分页总量，它就不是当前页 length，需要保留独立含义；去掉重复不能去掉实际不同的事实。",
    ] }] },
    { id: "categories", title: "四种状态要分别回答从哪里来、何时失效", paragraphs: [
      "源状态不能由当前其它值完全推导，例如用户输入的查询词、已获取的记录及选中 ID。派生状态是当前源状态的纯计算，例如筛选结果与是否允许提交。缓存保留可能过期的远端结果，需要键、版本与失效策略。临时状态表达交互阶段，例如展开面板、未提交草稿和当前请求身份。",
      "把状态提到共同父层，是为了让需要它的消费者读同一事实；不代表全部状态应进入全局 store。只用于一个弹层的输入，放到全局会延长生命周期并增加跨页污染。共享范围跟实际消费者及持久化需求走。",
      "选中项通常保存 ID，再由当前数据查找，而不是同时保存一个可变对象副本。如果条目被删除或权限改变，要允许 ID 找不到，并提供明确恢复状态。派生值不是永久有效的缓存。",
    ] },
    { id: "draft", title: "编辑草稿与服务端记录为什么不能强行只留一份", paragraphs: [
      "用户正在编辑时，后台刷新可能返回更新后的记录。直接用刷新结果替换输入会丢掉尚未提交的文字。草稿表达用户意图，基线表达开始编辑时的版本，两者需要独立保存；所谓单一事实源，是每种事实只有一个拥有者，不是把所有事实塞进一个对象。",
    ], examples: [{ code: `const server = { text: 'original', revision: 1 };
const editing = { baseline: { ...server }, draft: 'my change' };
const refreshed = { text: 'remote change', revision: 2 };
const conflict = editing.baseline.revision !== refreshed.revision;
console.log(editing.draft);
console.log(refreshed.text);
console.log(conflict);
console.log(server.text);`, expectedOutput: ["my change", "remote change", "true", "original"], explanation: [
      "草稿保留 my change，刷新副本保留 remote change；基线 revision=1 与刷新 revision=2 不同，显示潜在冲突。两份文字均在，用户可以比较而不必从覆盖后的状态中猜原输入。",
      "这只是编辑模型，真正保存时服务端或本地事务必须校验期望版本。前端先比较不能阻止比较后发生的并发修改，写入端仍要执行原子条件检查。草稿复制也要按数据域处理嵌套引用，浅拷贝不是通用深克隆。",
    ] }] },
    { id: "requests", title: "异步结果也是状态，需要一个当前拥有者", paragraphs: [
      "切换记录或搜索词后，旧请求完成函数仍然活着。取消底层工作可以省资源，但不能保证每条异步路径停止；结果是否允许提交必须按发起时的请求身份判断。当前有效请求拥有成功、失败和加载状态的写权限。",
    ], examples: [{ code: `let latest = 0;
let state = { status: 'idle', value: '' };
function begin() {
  const id = ++latest;
  state = { status: 'loading', value: '' };
  return (status, value) => {
    if (id !== latest) return false;
    state = { status, value };
    return true;
  };
}
const old = begin();
const current = begin();
console.log(current('ready', 'new'));
console.log(old('error', 'old failed'));
console.log(state.status + ':' + state.value);`, expectedOutput: ["true", "false", "ready:new"], explanation: [
      "begin 在发起时产生新身份并进入 loading。current 持有最新身份，可以写 ready:new；old 虽然晚执行，但身份已过期，返回 false 且不修改状态。最后读到当前结果。",
      "真实实现的 finally 也应检查身份，否则旧请求可能把新请求的 loading 清掉。离开页面或清空选择要明确让旧身份失效；这些是所有权结束事件，不只是移除一个 loading 图标。",
    ] }] },
    { id: "cache", title: "缓存键必须包含决定结果的输入", paragraphs: [
      "列表结果取决于租户、权限、查询词、分页与筛选条件。只以路径作键，两个用户可能读取同一副本；只以查询词作键，切换租户也可能显示旧数据。哪些维度属于身份、哪些可以规范化，应按接口合同明确，而不是随手 JSON.stringify 一个巨大对象。",
      "缓存不是永久源事实。保存成功后要决定更新当前副本、失效后重新读取，还是根据服务器返回版本做合并。乐观更新给即时反馈，但失败时不能把整个旧对象无条件写回，因为中间可能已经有更新成功。回滚需要识别自己引入的修改及其版本归属。",
      "memoization 解决重复计算成本，不解决业务事实新鲜度。useMemo 或 computed 可以缓存派生计算，但其依赖正确与否仍由作者负责。对小数组先保持推导清晰，有性能证据再优化。",
    ] },
    { id: "boundaries", title: "持久化、URL 与跨页面共享各有独立合同", paragraphs: [
      "刷新后需要恢复的草稿属于持久化状态；仅表达当次展开的面板通常不需要写库。URL 适合可分享的筛选与选择，但查询参数仍是不可信输入，要校验默认值，不能直接注册任意脚本或资源 ID。",
      "跨标签编辑不能靠一个页面里的全局对象解决。记录版本、数据集身份、事务检查与冲突 UI 都需要配合。导入备份后，旧标签保存必须被识别为来自旧数据集，即使 record revision 恰好相同。",
      "两个实质边界分别是远端刷新不能覆盖用户草稿，以及取消不能代替请求归属。它们都涉及两个状态看起来相似、实际有不同拥有者的情况；明确生命周期比补一个同步 effect 更有解释力。",
    ] },
    { id: "verification", title: "沿事件列出唯一允许的状态变更", paragraphs: [
      "写一张事件表：输入变化只更新草稿或查询，数据刷新更新缓存，保存成功更新基线，保存失败保留草稿，版本冲突保留两份，退出使请求身份失效。每个事件都对应具体拥有者与不变量。",
      "验证添加、删除、清空、刷新、旧失败迟到与并发保存。再检查可由其它状态推导的字段是否重复保存。先删除具体的双写来源，不必为一次计数错误引入新全局状态库。",
    ] },
    { id: "recall", title: "新增一个状态字段前，先回答三个问题", paragraphs: [
      "这个字段能否从现有状态纯推导？谁有权修改它？在哪个事件之后它会失效？如果第一个答案是能，先不独立保存；如果后两个答不清，先冻结生命周期合同。",
      "单一事实源允许基线、草稿和缓存并存，因为它们表达不同事实。真正要避免的是同一个数量、同一个选中对象或同一份保存状态由多个地方各自更新。",
    ] },
  ],
  sources: [
    { title: "React：状态结构与归属", url: "https://react.dev/learn/thinking-in-react" },
    { title: "React：状态快照", url: "https://react.dev/learn/state-as-a-snapshot" },
  ],
};
