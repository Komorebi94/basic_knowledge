import type { Article } from "../articles";

export const mapsSetsQueuesArticle: Article = {
  id: "K16-02", kind: "knowledge", domainSlug: "algorithms", slug: "maps-sets-queues-cache",
  title: "Map、Set、队列与缓存",
  summary: "从成员判断、FIFO 调度和 LRU 淘汰三个场景选择结构，解释相等规则、缺失值、队列头指针及缓存生命周期。",
  aliases: ["Map", "Set", "queue", "LRU", "FIFO"], tags: ["数据结构", "缓存", "算法"],
  estimatedMinutes: 22, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "数组能保存所有数据，为什么仍需要其它结构？", paragraphs: [
      "数组适合顺序数据，但每次检查成员都扫描整个列表，工作会随着规模重复增长。键值查询、去重、先进先出和淘汰策略的操作合同不同；先确定最频繁的操作，再选择结构，而不是先宣布“所有数据都用 Map”。",
      "Map 保存键到值的关系，Set 保存成员，队列表达先进先出，缓存还要定义容量、更新与失效。以下示例可独立在现代浏览器或 Node 运行，不把常见引擎的平均实现成本误写成所有操作最坏恒定。",
    ] },
    { id: "keys", title: "键的相等规则与业务唯一性要分开", paragraphs: [
      "Map 和 Set 对原始值使用 SameValueZero：NaN 可与 NaN 匹配，正负零不区分；对象则按引用身份。两份 {id:1} 是不同键。如果业务按 id 去重，就显式提取 id，而不是把整个对象塞进集合后期待字段比较。",
    ], examples: [{ code: `const first = { id: 1 };
const second = { id: 1 };
const set = new Set([NaN, NaN, 0, -0, first, second]);
console.log(set.size);
console.log(set.has({ id: 1 }));
const byId = new Map([[first.id, first], [second.id, second]]);
console.log(byId.size);
console.log(byId.get(1) === second);`, expectedOutput: ["4", "false", "1", "true"], explanation: [
      "NaN 合并成一个，正负零合并成一个，两份不同对象各占一个，总计四项。新建 {id:1} 又是另一引用，因此 has=false。按 id 建表只剩一项，后写入的 second 覆盖前值。",
      "这不是稳定保留首次项的去重；若要求首次保留，需要在 has 后决定是否 set。相同容器可以实现不同策略，策略必须写在业务合同中。集合的插入顺序也不等于按键大小排序。",
    ] }] },
    { id: "missing", title: "undefined 是合法缓存值，不能用 get 单独判断命中", paragraphs: [
      "Map.get 对未命中返回 undefined，而缓存的值也可能恰好是 undefined。if (!cache.get(key)) 又进一步把 0、false 和空字符串都误当未命中。判断是否存在用 has，再读取值；如果 API 要一次返回，可以使用带 hit 标记的结果。",
    ], examples: [{ code: `const cache = new Map([['empty', undefined], ['zero', 0]]);
console.log(cache.get('empty') === cache.get('missing'));
console.log(cache.has('empty'));
console.log(cache.has('missing'));
function lookup(key) {
  return cache.has(key) ? { hit: true, value: cache.get(key) } : { hit: false };
}
console.log(lookup('zero').hit);
console.log(lookup('zero').value);`, expectedOutput: ["true", "true", "false", "true", "0"], explanation: [
      "empty 与 missing 的 get 都是 undefined，因此仅比较返回值无法区分。has 对两者分别得到 true 与 false。zero 的值 0 仍是命中，带 hit 的结构保持了这项信息。",
      "在异步缓存中，失败的在途 Promise 还应按合同清除；缓存键需要包含输入身份和结果条件。解决 undefined 区分只是容器语义，不自动解决错误重试、权限隔离或新鲜度。",
    ] }] },
    { id: "queue", title: "FIFO 队列可以用头指针避免反复搬移", paragraphs: [
      "数组 push 入队简单，shift 删除头部的成本取决于实现，频繁消费大队列时可以用头指针。读取 items[head] 后推进 head，但被消费的引用若还留在数组中，会延长资源生命；需要清空槽或按阈值压缩，明确空间回收。",
    ], examples: [{ code: `const items = [];
let head = 0;
function enqueue(value) { items.push(value); }
function dequeue() {
  if (head >= items.length) return { found: false };
  const value = items[head];
  items[head] = undefined;
  head += 1;
  if (head === items.length) { items.length = 0; head = 0; }
  return { found: true, value };
}
enqueue('A'); enqueue('B');
console.log(dequeue().value);
console.log(dequeue().value);
console.log(dequeue().found);
console.log(items.length + ':' + head);`, expectedOutput: ["A", "B", "false", "0:0"], explanation: [
      "入队顺序 A、B，出队保持 FIFO。每次清空已消费槽，全部消费完时重置数组与头指针，最后空队列返回 found=false，长度与 head 都是零。",
      "这是简单单线程队列，不提供容量或并发调度。持续生产而从不完全消费时仍需按阈值压缩或使用环形缓冲，避免数组索引长期增长。若允许 undefined 入队，found 标记同样用于区分合法值与空队列。",
    ] }] },
    { id: "lru", title: "LRU 把最近使用顺序作为独立不变量", paragraphs: [
      "LRU 在容量满时淘汰最久没使用的键。Map 保持插入顺序，可以通过删除再插入把命中项移到末尾；单纯 set 一个已有键不一定改变其顺序。读和更新都应刷新最近性，容量零则不保存。",
    ], examples: [{ code: `const cache = new Map([['A', 1], ['B', 2]]);
const capacity = 2;
function get(key) {
  if (!cache.has(key)) return { hit: false };
  const value = cache.get(key);
  cache.delete(key); cache.set(key, value);
  return { hit: true, value };
}
function set(key, value) {
  cache.delete(key); cache.set(key, value);
  if (cache.size > capacity) cache.delete(cache.keys().next().value);
}
get('A');
set('C', 3);
console.log([...cache.keys()].join(','));
console.log(get('B').hit);
console.log(get('A').value);`, expectedOutput: ["A,C", "false", "1"], explanation: [
      "初始顺序 A、B，读 A 后顺序变 B、A。写 C 超容量，删除最前的 B，剩 A、C；B 未命中，A 仍返回 1。输出检查了淘汰策略，而非只检查缓存 size。",
      "这个固定容量示例省略输入校验与容量零处理，完整练习 E14 会冻结这些合同。Map 版本适合清楚表达最近顺序，要求严格复杂度或更细控制时可讨论链表加索引；不要凭一次耗时决定理论复杂度。",
    ] }] },
    { id: "boundaries", title: "容器选择不能代替生命周期与权限策略", paragraphs: [
      "缓存是强引用集合，长期保存对象会阻止它们失去可达路径。容量、失效、清除和作用域都需要合同。WeakMap 适合附带对象生命周期的元数据，但不可枚举，不能直接替代按字符串键管理的 LRU。",
      "第二个边界是键不完整。数据若依赖用户、租户或查询条件，只用资源路径会交叉命中；keyFn 的身份与相等规则要显式定义。对象引用当键时，重新构造同字段对象也不会命中。",
      "第三个边界是队列容量。限制同时执行数不限制等待项数量，生产速度持续高于消费速度仍会增长。背压、拒绝或丢弃必须作为业务策略，而不是由数组最终耗尽内存来决定。",
    ] },
    { id: "verification", title: "验证操作序列，而不只验证最终容器长度", paragraphs: [
      "Map/Set 覆盖 NaN、正负零、对象身份及合法 undefined；队列覆盖空、混合入出、再次启动与资源释放；LRU 覆盖命中刷新、更新刷新、容量零与淘汰顺序。每条用例对应一项不变量。",
      "选择结构时记录输入规模、操作频率和空间代价。小型静态列表用数组通常最清晰；频繁成员判断与按键访问可以采用集合或索引；有过期与容量规则才需要缓存策略。",
    ] },
    { id: "recall", title: "从业务动作反推需要的结构", paragraphs: [
      "查成员用 Set，按键取值用 Map，按到达顺序执行用队列，限制保留最近项需要 LRU。再补键的相等、缺失值、容量和失效合同。",
      "若 get 返回 undefined，你能确定未命中吗？若队列只推进 head，旧对象是否仍可达？这两个问题能迅速检查实现是否只关心正常值，却忽略表示与生命周期边界。",
    ] },
  ],
  sources: [
    { title: "MDN：Map", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map" },
    { title: "MDN：Set", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set" },
  ],
};
