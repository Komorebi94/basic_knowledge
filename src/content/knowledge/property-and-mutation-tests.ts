import type { Article } from "../articles";

export const propertyMutationTestsArticle: Article = {
  id: "K12-07",
  kind: "knowledge",
  domainSlug: "testing",
  slug: "property-and-mutation-tests",
  title: "属性测试与变异测试",
  summary: "用稳定去重的不变量和下界查找的比较符变异，说明一组样例通过时哪些错误实现仍会留下。",
  aliases: ["property-based testing", "mutation testing", "属性测试", "变异测试"],
  tags: ["测试", "属性", "变异"],
  estimatedMinutes: 24,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "三个例子都通过，为什么打乱顺序和丢掉重复的实现仍能留下？",
      paragraphs: [
        "稳定去重的测试只写了 ['a'] 得到 ['a']。返回空数组、排序后去重、保留全部重复项，都不会在这个输入上露出差异。下界查找只测目标小于首项、落在间隙和大于末项时，把 >= 改成 > 仍然得到相同索引。覆盖了函数，却没有覆盖会改变结果的输入。",
        "属性测试用一批输入检查不变量；变异测试故意改坏实现，看现有检查会不会失败。两者都用来发现样例太弱。本篇用固定小数组演示，不运行随机生成器，也不给项目接入变异框架。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：字符串去重和一条已排序的整数数组",
      paragraphs: [
        "运行 npm run verify:k12。judgeUnique 自己计算首次出现的顺序，再与被检查的输出比较。它不调用被测实现。输入只使用字符串，所以这里不讨论 NaN 和对象键。",
        "lowerBound 的数组固定为 [1, 3, 3, 5]，并且必须已按升序排列。strict 为 false 时使用 >=，为 true 时使用 >。suite 只比较两种比较符的结果是否不同，不重新证明参考实现的索引。目标 3 的手工预期是下标 1。"
      ]
    },
    {
      id: "property",
      title: "不变量要同时拒绝丢掉元素、打乱顺序、保留重复和发明新值",
      paragraphs: [
        "正确实现保留 b 然后 a，judgeUnique 返回 holds。空输出返回 dropped，因为两个不同的值都消失了。排序后的 ['a','b'] 返回 reordered。原样保留两个 b 返回 duplicate。输出里的 c 不在输入中，返回 invented。",
        "只写“结果里没有重复”时，空数组也能通过。只写“长度不变”时，保留重复的输出也能通过。把首次顺序、不丢键、不发明键写进同一个检查，这四个错误输出才会分开。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function judgeUnique(input, output) {
  const expected = [];
  const seen = new Set();
  for (const item of input) {
    if (!seen.has(item)) {
      seen.add(item);
      expected.push(item);
    }
  }
  const outSeen = new Set();
  for (const item of output) {
    if (outSeen.has(item)) return 'duplicate';
    if (!seen.has(item)) return 'invented';
    outSeen.add(item);
  }
  if (output.length !== expected.length) return 'dropped';
  for (let index = 0; index < output.length; index += 1) {
    if (output[index] !== expected[index]) return 'reordered';
  }
  return 'holds';
}
function stableUnique(input) {
  const seen = new Set();
  return input.filter((item) => (seen.has(item) ? false : (seen.add(item), true)));
}
console.log('正确:' + judgeUnique(['b', 'a', 'b'], stableUnique(['b', 'a', 'b'])));
console.log('空:' + judgeUnique(['b', 'a', 'b'], []));
console.log('排序:' + judgeUnique(['b', 'a', 'b'], ['a', 'b']));
console.log('重复:' + judgeUnique(['b', 'a', 'b'], ['b', 'a', 'b']));
console.log('发明:' + judgeUnique(['b', 'a'], ['b', 'c']));`,
          expectedOutput: [
            "正确:holds",
            "空:dropped",
            "排序:reordered",
            "重复:duplicate",
            "发明:invented"
          ],
          explanation: [
            "stableUnique 与检查器是两段代码。输入 b、a、b 的首次顺序是 b 然后 a，检查器按这个顺序比较，而不是按字典序。",
            "空数组没有重复，但丢掉了 a 和 b。排序结果包含正确的项，顺序却不是首次出现。发明值在重复检查之后被发现，因为 c 从未进入 seen。"
          ]
        }
      ]
    },
    {
      id: "mutation",
      title: "只测间隙时，把大于等于改成大于仍然活着",
      paragraphs: [
        "数组 [1, 3, 3, 5]。目标 0 时两种比较都返回 0，目标 4 都返回 3，目标 6 都返回 4，变异 survived。目标 3 的正确下界是 1，也就是第一个 3；改成 > 后要找到第一个大于 3 的 5，下标变成 3，变异 killed。目标 1 和 5 同样会让两个结果分开。",
        "suite([0, 4, 6]) 返回 survived，suite([0, 3, 6]) 返回 killed。差的就是重复值 3。变异测试没有证明 >= 版本在所有数组上都正确；它证明原来那组目标看不出这个改动。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function lowerBound(items, target, strict) {
  let low = 0;
  let high = items.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (strict ? items[mid] > target : items[mid] >= target) high = mid;
    else low = mid + 1;
  }
  return low;
}
function score(target) {
  const items = [1, 3, 3, 5];
  const correct = lowerBound(items, target, false);
  const mutant = lowerBound(items, target, true);
  return target + ':' + correct + '/' + mutant + (correct === mutant ? ':survived' : ':killed');
}
function suite(targets) {
  const items = [1, 3, 3, 5];
  const killed = targets.some((target) => lowerBound(items, target, false) !== lowerBound(items, target, true));
  return killed ? 'killed' : 'survived';
}
for (const target of [0, 1, 3, 4, 5, 6]) console.log(score(target));
console.log('缺重复:' + suite([0, 4, 6]));
console.log('含重复:' + suite([0, 3, 6]));`,
          expectedOutput: [
            "0:0/0:survived",
            "1:0/1:killed",
            "3:1/3:killed",
            "4:3/3:survived",
            "5:3/4:killed",
            "6:4/4:survived",
            "缺重复:survived",
            "含重复:killed"
          ],
          explanation: [
            "目标 3 可以手工核对：下标 0 的值是 1，下标 1 的值才是 3。> 会跳过两个 3，停在下标 3。",
            "0、4、6 三个目标上两种比较符结果相同，所以这组用例杀不死该变异。加入 3 之后 suite 才返回 killed。若 >= 和 > 一起写错，比较仍可能相同，suite 发现不了。"
          ]
        }
      ]
    },
    {
      id: "suite",
      title: "属性负责大批输入上的不变量，变异负责检查这些断言有没有牙齿",
      paragraphs: [
        "属性可以随机或按边界生成输入，但每个失败都要缩到一小份仍能失败的输入，便于阅读。生成器要覆盖空、重复、乱序和单项，不能只生成递增且互异的数组。检查器与被测实现分开写，避免两边共用同一个错误公式。",
        "变异先从最容易写错的运算符、边界和遗漏的清理入手。一个变异存活，就给这组测试增加能分开它的输入，而不是为了分数去改实现。变异运行成本高，适合关键纯函数和已经稳定的合同，不适合每次按键都跑全量。"
      ]
    },
    {
      id: "boundaries",
      title: "检查器会错，参考实现也会和变异一起错",
      paragraphs: [
        "judgeUnique 若只检查输出没有重复，空数组就会返回 holds。属性写弱时，错误实现看起来通过了。检查器还要有自己的小例子：b、a、b 必须得到 b、a，而不是 a、b。",
        "suite 把 >= 版本当作参考。两个版本若用了同一个错误中点，结果仍可能相同，存活不表示产品正确。小数组上的手工索引仍然需要，变异只补充“现有断言能否看见这个改动”。",
        "本篇没有随机种子、缩小失败输入或项目级变异报告。不能把这两段输出说成已经对仓库做了属性测试或变异测试。"
      ]
    },
    {
      id: "practice",
      title: "先写一个会放过错误实现的弱断言，再补出会失败的输入",
      paragraphs: [
        "对去重，先用空输出和排序输出试检查器，确认它们不是 holds。对下界，保留目标 3 的手工预期 1，并确认只测 0、4、6 时比较符变异仍然存活。然后再增加随机输入或不变量。",
        "本主题没有已开放的独立练习。示例数组不能当作通用排序或查找合同。"
      ]
    }
  ],
  sources: [
    { title: "Hypothesis：什么是基于属性的测试", url: "https://hypothesis.works/articles/what-is-property-based-testing/" },
    { title: "fast-check：简介", url: "https://fast-check.dev/docs/introduction/" },
    { title: "Stryker：变异测试", url: "https://stryker-mutator.io/docs/" }
  ]
};
