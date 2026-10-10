import type { Article } from "../articles";

export const complexityScaleArticle: Article = {
  id: "K16-01", kind: "knowledge", domainSlug: "algorithms", slug: "complexity-scale",
  title: "复杂度、规模与权衡",
  summary: "用列表关联与重复查找推导工作量，区分渐近复杂度、真实耗时和额外空间，解释为何索引、预处理与清晰实现需要结合规模选择。",
  aliases: ["Big O", "time complexity", "space complexity", "复杂度"], tags: ["算法", "规模", "性能"],
  estimatedMinutes: 20, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "两百条数据正常，为什么两万条时页面卡住？", paragraphs: [
      "页面给每条记录查找所属分类。实现对每条记录都从头扫描所有分类，记录数和分类数一起增长时，比较次数会相乘。输入扩大一百倍，工作量可能远不止一百倍。这类问题首先是数据结构和重复工作，而不是某个语法写得不够短。",
      "复杂度描述输入规模增长时资源消耗的趋势，不直接承诺毫秒值。下面用显式计数器统计比较次数，避免把一次机器运行时间当成算法证明。代码在现代浏览器或 Node 独立运行；只统计模型中的比较，不统计引擎优化、分配和渲染。",
    ], examples: [{ code: `function repeatedScan(size) {
  let comparisons = 0;
  for (let target = 0; target < size; target += 1) {
    for (let candidate = 0; candidate < size; candidate += 1) {
      comparisons += 1;
      if (candidate === target) break;
    }
  }
  return comparisons;
}
console.log(repeatedScan(4));
console.log(repeatedScan(8));
console.log(repeatedScan(0));`, expectedOutput: ["10", "36", "0"], explanation: [
      "规模 4 时各次查找分别比较 1、2、3、4 次，总计 10；规模 8 时总计 36。求和 n(n+1)/2 的最高增长项是 n²，因此这个特定流程属于二次增长。空输入没有比较。",
      "这里查找目标全都存在，属于明确输入模式。若每次都缺失，则每次比较 n 次，总计 n²；若所有目标总在第一项，则每次一次，总计 n。分析时区分输入类别，不要从一个输出推断所有场景相同。",
    ] }] },
    { id: "growth", title: "先定义 n 是什么，再数最关键的重复工作", paragraphs: [
      "n 可以是记录数、字符串长度、图节点数或请求数量，不定义它就没有可比较的复杂度。两个独立输入规模通常分别记为 n 与 m；对 n 条记录扫描 m 个分类，是 O(nm)，不能默认它们总相同。",
      "顺序执行两个各遍历一次的循环通常相加；嵌套并完整遍历的循环通常相乘；每次把搜索范围减半，则需要对数级步数。关键是每项工作执行多少次，而不是源代码有几层缩进。循环中直接跳出、范围收缩或调用其它复杂函数都会改变推导。",
      "大 O 适合描述上界趋势，不能说明两个同阶实现谁在小输入上更快。常数、内存布局和 API 实现仍有影响。先保证数据域与正确性，再根据真实瓶颈决定优化。",
    ] },
    { id: "index", title: "预处理能把重复扫描转换成一次建索引", paragraphs: [
      "若分类 ID 唯一，可先建 Map，再按 ID 查询。代价是额外空间和一次建表，收益是避免每条记录都重复扫描。下面同时计算源循环访问次数，用来说明工作被放到了哪里，不把 Map 内部实现写成规范保证的恒定时间。",
    ], examples: [{ code: `const categories = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }];
const records = [{ category: 'b' }, { category: 'a' }, { category: 'missing' }];
let buildVisits = 0;
const byId = new Map();
for (const category of categories) {
  buildVisits += 1;
  byId.set(category.id, category);
}
let lookups = 0;
const labels = records.map((record) => {
  lookups += 1;
  return byId.get(record.category)?.title ?? '未分类';
});
console.log(labels.join(','));
console.log(buildVisits + ':' + lookups);
console.log(categories.length + ':' + records.length);`, expectedOutput: ["B,A,未分类", "2:3", "2:3"], explanation: [
      "建索引访问两项分类，消费阶段执行三次 get。不存在的分类得到明确 fallback，输出保持记录顺序。原数组长度不变，说明索引过程没有删改源容器。",
      "常见哈希实现使这种查询具有良好平均成本，但 ECMAScript 对 Map 的要求不能简化成所有操作最坏 O(1)。重复 ID 会覆盖旧项，如果业务要求唯一，建表时必须检测重复；性能改进不能悄悄改变数据合同。",
    ] }] },
    { id: "space", title: "空间与生命周期要和时间一起分析", paragraphs: [
      "建索引占 O(m) 额外条目，产生 labels 占 O(n) 输出。输出空间与算法额外工作空间可以分别报告。递归还可能使用调用栈，深树即使总工作线性也可能栈溢出；需要按数据深度选择迭代栈或限制输入。",
      "缓存一次建立却永不释放，时间换空间就变成内存增长。只有数据版本改变时重建，或按明确生命周期保留索引，可以减少重复工作；若每次渲染重新建巨表，预处理成本仍然存在。不要用“缓存”二字省略失效规则。",
    ] },
    { id: "search", title: "对数级查找的收益依赖已排序前提", paragraphs: [
      "二分查找的每步保留一半候选范围，因此步数较少，但它要求数据已经按比较合同排序。为了只查一次而先排序，排序成本可能超过线性扫描。多次查询且数据稳定时，预处理更可能值得。",
    ], examples: [{ code: `function lowerBound(values, target) {
  let left = 0, right = values.length, steps = 0;
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    steps += 1;
    if (values[mid] < target) left = mid + 1;
    else right = mid;
  }
  return { index: left, steps };
}
const values = [1, 2, 2, 4, 8, 16, 32, 64];
console.log(JSON.stringify(lowerBound(values, 2)));
console.log(JSON.stringify(lowerBound(values, 100)));
console.log(JSON.stringify(lowerBound([], 3)));`, expectedOutput: ['{"index":1,"steps":4}', '{"index":8,"steps":3}', '{"index":0,"steps":0}'], explanation: [
      "对 2 的查找不断保留第一个可能大于等于目标的位置，最终 index=1，是重复值的首次位置。100 超出所有值，返回 length=8。空数组范围开始就为空，零步返回 0。",
      "本算法数据域是升序有限数字。未排序、NaN 或不一致比较器会破坏区间不变量，少量步骤不再代表正确。示例步骤是具体输入观察，渐近推导来自每次范围收缩，不来自计时。",
    ] }] },
    { id: "tradeoffs", title: "真实优化从调用频率和交互影响开始", paragraphs: [
      "十项一次查找通常直接扫描就够，十万项每次按键查找值得检查索引或算法。是否在主线程热路径、是否重复分配、输入多久更新一次，都影响取舍。先找频繁发生且占用明显的工作，不为冷路径的小常数引入复杂缓存。",
      "更好的算法也不能保证一次长任务不阻塞交互。线性处理百万项仍可能需要分片、Worker 或限制工作量；把循环改成 async 而不实际让出执行权没有帮助。算法趋势与调度响应是两个层面。",
      "至少两个边界是索引的额外内存及失效，以及二分依赖的排序前提。还有数据完整性：去重、排序、键覆盖和默认值都可能改变行为，必须和性能收益一起审查。",
    ] },
    { id: "verification", title: "把推导、行为与测量分别记录", paragraphs: [
      "推导记录 n/m、循环次数和假设；行为测试覆盖空输入、缺失项、重复键及不修改输入；性能测量固定环境，多种规模重复运行并观察分布。不要用一次 2ms 对 3ms 宣称渐近复杂度改变。",
      "如果目标是用户输入响应，测主线程任务、渲染与总反馈时间，而非只测 helper。内存也应在重复创建释放后观察保留路径。优化前后保持同样输入与输出合同，才可比较。",
    ] },
    { id: "recall", title: "从一段新循环独立推导增长", paragraphs: [
      "先定义规模，再计算最内层实际执行次数，区分相加、相乘和范围减半。说明平均与最坏输入，以及额外容器和栈空间。",
      "最后判断这项工作是否足够频繁、输入是否足够大。复杂度分析帮助选择数据结构，实测帮助判断产品收益，两者不能互相冒充。",
    ] },
  ],
  sources: [
    { title: "MDN：Map 与访问复杂度要求", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map" },
    { title: "ECMAScript：集合语义", url: "https://tc39.es/ecma262/multipage/keyed-collections.html" },
  ],
};
