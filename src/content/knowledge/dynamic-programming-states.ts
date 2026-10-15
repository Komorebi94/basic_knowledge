import type { Article } from "../articles";

export const dynamicProgrammingArticle: Article = {
  id: "K16-07",
  kind: "knowledge",
  domainSlug: "algorithms",
  slug: "dynamic-programming-states",
  title: "动态规划与状态定义",
  summary: "拆帧的状态是填满前 i 项的方法数，选择笔记的状态是容量内的最大价值；相等时保留先选中的组合，不另换一套。",
  aliases: ["dynamic programming", "state transition", "状态", "转移"],
  tags: ["算法", "状态", "规划"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "为什么背「前一项加前两项」还是写不出这道调度？",
      paragraphs: [
        "一帧可以带走 1 条或 2 条笔记。问 n 条笔记有多少种拆法时，有人直接写成斐波那契数列。数字碰巧对上，却说不清最后一帧带走的是哪一种。换一个问题：复习时间只够 4，三条笔记的耗时和价值都不同，同一个递推式就完全不能用。",
        "先写状态在回答什么，再写它由哪些更小的状态加起来。拆帧的状态是「填满前 i 条的方法数」。选笔记的状态是「容量恰好用到某个上限时的最大价值和选中的 id」。本篇用固定的 n 和三张笔记演算，不搜索所有子集的名字，也不把数列名字当成推导。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：空拆法算一种，价值必须严格更大才替换",
      paragraphs: [
        "运行 npm run verify:k16。frames 拒绝负数和非整数。ways[0] 是 1，表示 0 条笔记有一种拆法：什么都不拆。计算 ways[i] 时，最后一帧若只带走第 i 条，前面是 ways[i-1]；若带走两条，前面是 ways[i-2]，i 小于 2 时这一支是 0。",
        "pick 的预算必须是非负整数。每条笔记的 cost 必须是正整数，value 必须是非负整数。容量从高往低更新，避免同一条笔记在一轮里被选两次。只有新价值严格大于旧价值才替换，相等时留下先选中的 id。没有笔记可放时 id 部分是 none。"
      ]
    },
    {
      id: "frames",
      title: "最后一帧只有带走一条或带走两条这两种接法",
      paragraphs: [
        "0 条的方法数是 1。1 条只能单独成帧，方法数是 1。2 条可以是两帧各一条，或一帧带走两条，方法数是 2。3 条的最后一帧若带走一条，前面的 2 条有 2 种；若带走两条，前面的 1 条有 1 种，一共 3。4 条是 3 加 2，方法数是 5。",
        "这个加法来自两种互斥的最后一帧，不是因为记得某个数列。负数返回 invalid，不能把 ways[-1] 当成 0 再继续加。函数只返回方法数，不列出每种拆法的具体帧。若要列出帧，状态里还得保存方案，而不仅仅是一个整数。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function frames(n) {
  if (!Number.isInteger(n) || n < 0) return 'invalid';
  const ways = [1];
  for (let i = 1; i <= n; i += 1) ways[i] = ways[i - 1] + (i >= 2 ? ways[i - 2] : 0);
  return 'ways:' + ways[n];
}
console.log('零项:' + frames(0));
console.log('一项:' + frames(1));
console.log('两项:' + frames(2));
console.log('三项:' + frames(3));
console.log('四项:' + frames(4));
console.log('负项:' + frames(-1));`,
          expectedOutput: [
            "零项:ways:1",
            "一项:ways:1",
            "两项:ways:2",
            "三项:ways:3",
            "四项:ways:5",
            "负项:invalid"
          ],
          explanation: [
            "0 条有一种空拆法。之后每一项都是「最后一帧一条」加上「最后一帧两条」，所以 3 是 2+1，4 是 3+2。",
            "负数没有「前若干条」这种状态，返回 invalid，而不是凑一个方法数。"
          ]
        }
      ]
    },
    {
      id: "pick",
      title: "容量里的最大价值要能说出选了哪些 id",
      paragraphs: [
        "a 耗时 2、价值 3，b 耗时 2、价值 2，c 耗时 3、价值 4。预算 4 时，a 和 b 的价值和是 5，耗时正好 4。c 单独价值 4，不如 5。结果是 value:5:a,b。预算 3 放不下 a 加 b，c 的价值 4 高于只放 a 的 3，结果是 value:4:c。",
        "预算 0 不能放任何正耗时的笔记，value:0:none。空笔记列表即使预算是 2，也是 value:0:none。相等时不替换：若后来的组合价值只是等于已经记下的组合，id 保持先出现的那一组。从高容量往低容量更新，是为了这一轮使用的是还没选过当前笔记的旧状态。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function pick(notes, budget) {
  if (!Number.isInteger(budget) || budget < 0) return 'invalid';
  const dp = Array.from({ length: budget + 1 }, () => ({ value: 0, ids: [] }));
  for (const note of notes) {
    if (!note || !Number.isInteger(note.cost) || note.cost <= 0 || !Number.isInteger(note.value) || note.value < 0) return 'invalid';
    for (let cap = budget; cap >= note.cost; cap -= 1) {
      const next = dp[cap - note.cost].value + note.value;
      if (next > dp[cap].value) dp[cap] = { value: next, ids: dp[cap - note.cost].ids.concat(note.id) };
    }
  }
  const best = dp[budget];
  return 'value:' + best.value + ':' + (best.ids.join(',') || 'none');
}
const notes = [{ id: 'a', cost: 2, value: 3 }, { id: 'b', cost: 2, value: 2 }, { id: 'c', cost: 3, value: 4 }];
console.log('预算4:' + pick(notes, 4));
console.log('预算3:' + pick(notes, 3));
console.log('预算0:' + pick(notes, 0));
console.log('空笔记:' + pick([], 2));`,
          expectedOutput: [
            "预算4:value:5:a,b",
            "预算3:value:4:c",
            "预算0:value:0:none",
            "空笔记:value:0:none"
          ],
          explanation: [
            "预算 4 选 a 和 b，价值和是 5，高于只选 c。预算 3 放不下这两条，改为价值 4 的 c。",
            "预算 0 和空列表都没有可放的笔记，价值是 0，id 部分是 none。相等价值不会用后一条换掉先记下的组合。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "方法数不是方案列表，容量状态也不是复习时间的测量",
      paragraphs: [
        "ways:5 没有说出那 5 种帧各是什么样。把方法数当成调度结果，仍然不知道每一帧带走哪些笔记。状态若只存整数，就恢复不出选择。pick 把 id 放进状态，才能回答选了谁，代价是每一格都多保存一份列表。",
        "只在价值严格更大时替换，所以价值相同的两种选法会留下先处理的笔记。这是这条转移的约定，不是「最优解唯一」。cost 必须为正，否则从高往低更新仍可能把同一条笔记重复加进同一格。函数发现非正 cost 就返回 invalid。",
        "预算 4 是调用方给出的整数，不是测出来的分钟。笔记顺序会影响相等时留下谁，因为循环按数组顺序处理。K16-01 关心规模：这里的格子数是预算加一，再乘笔记条数。预算很大而笔记很少时，不必为了这个模型去分配巨大的表。"
      ]
    },
    {
      id: "practice",
      title: "先用一句话写出状态，再对三个小输入",
      paragraphs: [
        "拆帧应得到 0 条 1 种、3 条 3 种、4 条 5 种，负数 invalid。三张笔记在预算 4 时应是 a,b 且价值 5，预算 3 时应是 c 且价值 4。",
        "本主题没有已开放的独立练习。示例不排列真实复习任务，也不测量每一帧的耗时。"
      ]
    }
  ],
  sources: [
    { title: "Wikipedia：Dynamic programming", url: "https://en.wikipedia.org/wiki/Dynamic_programming" }
  ]
};
