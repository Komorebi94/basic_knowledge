import type { Article } from "../articles";

export const sortStabilityArticle: Article = {
  id: "K16-04",
  kind: "knowledge",
  domainSlug: "algorithms",
  slug: "sort-binary-search-stability",
  title: "排序、二分与稳定性",
  summary: "二分查找先拒绝未按分数升序的列表，命中只返回一个 id；分数相同的笔记用原下标保持先后，改按 id 比较会换掉这个顺序。",
  aliases: ["binary search", "stable sort", "comparator", "稳定性"],
  tags: ["算法", "排序", "查找"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "分数相同的两条笔记，为什么刷新之后先后换了？",
      paragraphs: [
        "列表按分数从低到高排。c 和 a 都是 1 分，c 原来写在 a 前面。一次排序之后 a 跑到 c 前面，用户以为排名变了，其实只是相等时的次序没定。另一边，有人在未排序的分数上做二分查找，目标明明存在，返回的却是另一条，或者直接 miss。",
        "二分查找的每一步都假设中点左边不大于目标、右边不小于目标。这个假设只在按同一比较规则升序时成立。分数相等时还要决定保留原顺序，还是改用 id。本篇用固定笔记演算，不调用数据源，也不把引擎的 sort 稳定性当成唯一证据。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：分数升序，相等时才看下标或 id",
      paragraphs: [
        "运行 npm run verify:k16。findScore 先检查每一项的 score 都不小于前一项。不满足就返回 unsorted，不再折半。折半时中点分数等于目标就返回 hit 加该 id；小于目标则抬高左边界，大于目标则降低右边界。边界交叉后是 miss。",
        "arrange 的 stable 在分数相等时比较原始下标，id 模式改为比较 id 字符串。其他 mode 返回 invalid。比较器在分数不等时只看分数。函数不修改原数组的得分。"
      ]
    },
    {
      id: "search",
      title: "命中的是中点碰到的那一条，不是所有同分笔记",
      paragraphs: [
        "a、b、c、d 的分数是 1、2、2、4。查找 2 时，区间长度 4，中点下标是 1，b 的分数正好是 2，结果 hit:b。c 的分数也是 2，但这一次没有被返回。查找 3 时中点会落到 2 或 4 上，两边都把区间收空，结果 miss。",
        "分数是 2、1 的列表返回 unsorted。若仍去折半，第一步就可能把真正的目标丢掉。空列表没有元素，循环不进入，返回 miss，这和「没找到」是同一结果，不是异常。要列出全部分数是 2 的笔记，命中之后还得向左右扫描相邻的相等项；只拿 hit 的 id 会漏掉 c。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function findScore(items, target) {
  if (!items.every((item, i) => i === 0 || item.score >= items[i - 1].score)) return 'unsorted';
  let low = 0;
  let high = items.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (items[mid].score === target) return 'hit:' + items[mid].id;
    if (items[mid].score < target) low = mid + 1;
    else high = mid - 1;
  }
  return 'miss';
}
const ranked = [{ id: 'a', score: 1 }, { id: 'b', score: 2 }, { id: 'c', score: 2 }, { id: 'd', score: 4 }];
console.log('命中重复:' + findScore(ranked, 2));
console.log('没有:' + findScore(ranked, 3));
console.log('未排序:' + findScore([{ id: 'a', score: 2 }, { id: 'b', score: 1 }], 1));
console.log('空列表:' + findScore([], 1));`,
          expectedOutput: [
            "命中重复:hit:b",
            "没有:miss",
            "未排序:unsorted",
            "空列表:miss"
          ],
          explanation: [
            "查找 2 时中点正好是 b，所以返回 b，而不是同时返回 c。查找 3 把区间收空，得到 miss。",
            "未排序的列表在折半前被拒绝。空列表没有中点，结果是 miss，不能写成找到了空 id。"
          ]
        }
      ]
    },
    {
      id: "order",
      title: "分数相同的时候，原下标和 id 是两种不同的次序",
      paragraphs: [
        "c、a 都是 1 分，b 是 2 分，输入顺序是 c、a、b。stable 在分数相等时保留较小的原始下标，结果 c,a,b。id 模式在分数相等时比较 id，a 排在 c 前面，结果 a,c,b。用户看见的名次变了，分数并没有变。",
        "未知 mode 返回 invalid，不能在相等时返回 0 然后指望引擎帮忙。ECMAScript 从 2019 年起要求 Array.prototype.sort 在比较结果为 0 时保持相对顺序，那是引擎的合同。这里的 stable 自己比较下标，所以这份输出不依赖那一条规范。若比较器对同一对元素有时返回正、有时返回负，两种模式都会失去意义。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function arrange(items, mode) {
  if (mode !== 'stable' && mode !== 'id') return 'invalid';
  const decorated = items.map((item, index) => ({ item, index }));
  decorated.sort((a, b) => {
    if (a.item.score !== b.item.score) return a.item.score - b.item.score;
    if (mode === 'stable') return a.index - b.index;
    return a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0;
  });
  return decorated.map((entry) => entry.item.id).join(',');
}
const tied = [{ id: 'c', score: 1 }, { id: 'a', score: 1 }, { id: 'b', score: 2 }];
console.log('稳定:' + arrange(tied, 'stable'));
console.log('按编号:' + arrange(tied, 'id'));
console.log('未知比较:' + arrange(tied, 'random'));`,
          expectedOutput: [
            "稳定:c,a,b",
            "按编号:a,c,b",
            "未知比较:invalid"
          ],
          explanation: [
            "c 和 a 分数相同。stable 保留 c 在输入里更靠前的位置，id 模式则让 a 排到 c 前面。b 因为分数更高，两种模式都在最后。",
            "random 不是两种约定之一，函数拒绝排序，避免相等项的顺序变成偶然结果。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "升序检查只看分数，命中一个 id 也不代表它是最左边的那条",
      paragraphs: [
        "findScore 的有序检查是相邻分数不下降。相等可以通过，所以重复分数仍能查找。它不检查 id 是否有序。若调用方以为二分会返回最左边的同分笔记，这次的 hit:b 恰好是最左边，换一个长度，中点可能先碰到右边那条。",
        "arrange 只在新数组上排序。它不处理分数不是数字的情况；减法遇到 NaN 时比较会失效。id 模式用字符串小于号，不按本地化规则排中文。stable 比较的是这次 map 时的下标，如果排序前已经过滤掉元素，下标是过滤后的顺序。",
        "miss 和 unsorted 不能混用。数据是乱的就先停止；数据有序但没有目标才是 miss。K16-01 的规模讨论说明折半是对数步，但那一步的前提就是这里的有序检查已经通过。未排序时谈步数没有意义。"
      ]
    },
    {
      id: "practice",
      title: "先确认有序，再决定相等时留谁",
      paragraphs: [
        "在 1、2、2、4 上查找 2 应得到 hit:b，查找 3 应得到 miss。分数下降的列表应是 unsorted。c 在 a 前面且分数相同，stable 应保持 c,a，id 模式应变成 a,c。",
        "本主题没有已开放的独立练习。示例不读取排行榜接口，也不测量 sort 的耗时。"
      ]
    }
  ],
  sources: [
    { title: "MDN：Array.prototype.sort", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort" },
    { title: "ECMA-262：Array.prototype.sort", url: "https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.sort" },
    { title: "Wikipedia：Binary search algorithm", url: "https://en.wikipedia.org/wiki/Binary_search_algorithm" }
  ]
};
