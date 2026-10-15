import type { Article } from "../articles";

export const slidingWindowArticle: Article = {
  "revision": 2,
  id: "K16-05",
  kind: "knowledge",
  domainSlug: "algorithms",
  slug: "sliding-window-and-two-pointers",
  title: "滑动窗口与双指针",
  summary: "有序数组从两端收拢找一对和，窗口只向前移动来保留最长无重复片段；两端交叉或窗口回退都会漏掉或重复检查。",
  aliases: ["two pointers", "sliding window", "双指针", "无重复"],
  tags: ["算法", "窗口", "查找"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-15",
  sections: [
    {
      id: "problem",
      title: "为什么从两头往中间找不会漏掉那一对，窗口往回退却会重算？",
      paragraphs: [
        "分数已经从小到大排好，要找两个不同位置，使它们的和等于 6。从最左和最右开始，和太大就丢掉右边，和太小就丢掉左边。若随手把左指针往回移，刚才排除过的组合会再算一遍，也可能把已经证明不可能的一端又纳入。",
        "另一件事是在一串字符里找最长的、没有重复字符的一段。窗口的右端每次吃进一个字符，左端只在窗口里出现重复时向前跳。左端往回退会把已经滑出的字符再算进这一段。本篇用固定数组和字符串演示这两种移动，不扫描页面上的选区。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：数组必须非降，窗口只保留更长的第一段",
      paragraphs: [
        "运行 npm run verify:k16。pairSum 要求每一项都是整数，且不小于前一项。左下标从 0 开始，右下标从最后一项开始，只有左小于右时才看这一对。和等于目标就返回两个下标；和更小则左加一，和更大则右减一。收拢后没有命中是 none。",
        "longestUnique 用 Map 记下每个字符上次出现的下标。若这个下标还落在当前窗口里，左端跳到它的下一位。只有新片段比已记下的 best 更长时才替换。长度相同不替换，所以保留最先出现的那段。空字符串返回 empty。函数不处理代理对，按 UTF-16 码元走。"
      ]
    },
    {
      id: "pair",
      title: "和太小只移动左端，和太大只移动右端",
      paragraphs: [
        "1、2、4、7 找和为 6。下标 0 与 3 的和是 8，太大，右端移到 4。下标 0 与 2 的和是 5，太小，左端移到 2。下标 1 与 2 的和是 6，返回 1+2=6。这一对是值 2 和 4，不是下标相加。",
        "1、2、3 找和为 2。两端的和已经不小于 1+3，右端会一直左移，直到左右相遇，返回 none。没有哪一次需要把左端移回去，因为对固定的左端，更靠右的位置和只会更大。3、1 不是非降整数序列，返回 unsorted，不能把下标 0 和 1 的和 4 当成命中。未排序时「太大就丢右端」这个理由不成立。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function pairSum(nums, target) {
  if (!nums.every((n, i) => Number.isInteger(n) && (i === 0 || n >= nums[i - 1]))) return 'unsorted';
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return left + '+' + right + '=' + target;
    if (sum < target) left += 1;
    else right -= 1;
  }
  return 'none';
}
console.log('一对:' + pairSum([1, 2, 4, 7], 6));
console.log('没有一对:' + pairSum([1, 2, 3], 2));
console.log('未排序一对:' + pairSum([3, 1], 4));`,
          expectedOutput: [
            "一对:1+2=6",
            "没有一对:none",
            "未排序一对:unsorted"
          ],
          explanation: [
            "1+7 太大，放弃下标 3；1+4 太小，放弃下标 0；剩下的 2+4 正好是目标。返回的是下标 1 和 2。",
            "和为 2 的一对不存在，左右相遇后停止。未排序的 3、1 在移动指针前被拒绝。"
          ]
        }
      ]
    },
    {
      id: "window",
      title: "重复字符只把左端向前推，长度相同的后一段不替换前一段",
      paragraphs: [
        "abca 的窗口从 a 扩到 abc。最后一个 a 的旧下标还在窗口里，左端跳到 b，新窗口是 bca，长度仍是 3，不替换已经记下的 abc。结果是 abc。aaa 里每次都碰到同一个字符，窗口始终只有一个 a。",
        "abba 先得到 ab。第三个字符 b 与窗口内的 b 重复，左端跳到第二个 b 的后面，窗口变成只含这个 b。最后的 a 接上来是 ba，长度 2，不比 ab 长。结果仍是 ab。左端的下标在整个过程里只增加。若把它减回去，就会把已经证明会重复的前缀再收进来。空字符串没有片段，返回 empty。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function longestUnique(text) {
  if (typeof text !== 'string') return 'invalid';
  const last = new Map();
  let start = 0;
  let best = '';
  for (let end = 0; end < text.length; end += 1) {
    const ch = text[end];
    const seen = last.get(ch);
    if (seen !== undefined && seen >= start) start = seen + 1;
    last.set(ch, end);
    const slice = text.slice(start, end + 1);
    if (slice.length > best.length) best = slice;
  }
  return best || 'empty';
}
console.log('窗口:' + longestUnique('abca'));
console.log('重复:' + longestUnique('aaa'));
console.log('回退:' + longestUnique('abba'));
console.log('空串:' + longestUnique(''));`,
          expectedOutput: [
            "窗口:abc",
            "重复:a",
            "回退:ab",
            "空串:empty"
          ],
          explanation: [
            "abca 在第二个 a 出现时把左端移到 b，bca 与 abc 一样长，保留先得到的 abc。aaa 的窗口始终只有一个字符。",
            "abba 在重复的 b 之后窗口变短，最后的 ba 没有超过 ab。空字符串没有更长的片段，返回 empty。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "指针只朝一个方向走，才谈得上没有漏掉",
      paragraphs: [
        "pairSum 的不漏，靠的是排序。和小于目标时，当前左端配任何更小的右端都会更小，所以左端可以永久放弃。和大于目标时，当前右端配任何更大的左端都会更大，所以右端可以永久放弃。左右相等时不再使用同一个下标两次。数组只要有一处下降，这个放弃理由就不成立，函数改为 unsorted。",
        "窗口的不漏，靠的是左端只前进。右端每吃进一个字符，若窗口里有重复，就把左端推到旧位置之后，新窗口重新没有重复。旧位置之前的字符若再加入，必然会带上那个重复字符，所以不必把左端移回去重试。长度相等时不替换，因此结果是最先达到最大长度的那一段，不是任意一段。",
        "这两个函数都不证明字符串里的码点和用户看见的字素一致。slice 按码元截取。它们也不是页面选区：没有滚动位置，没有高亮。K16-04 的二分同样要求有序，但是它找的是一个值，不是一对下标。"
      ]
    },
    {
      id: "practice",
      title: "用一组有序数和一串重复字符把指针走完",
      paragraphs: [
        "1、2、4、7 与目标 6 应得到下标 1 和 2。未排序应直接 unsorted。abca 应得到 abc，abba 应得到 ab，空字符串应得到 empty。",
        "E39 已提供可运行练习；具体入口见文末关联。DOM、焦点和框架主题的当前练习以 JavaScript 行为模型为范围，真实平台行为请按本文实验复核；通过模型不代表完成设备或框架集成验收。"
      ]
    }
  ],
  sources: [
    { title: "MDN：String.prototype.slice", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice" },
    { title: "Wikipedia：Substring", url: "https://en.wikipedia.org/wiki/Substring" }
  ]
};
