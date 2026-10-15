import type { Article } from "../articles";

export const accessibilityVerificationArticle: Article = {
  id: "K15-08",
  kind: "knowledge",
  domainSlug: "accessibility",
  slug: "accessibility-verification",
  title: "可用性验证与取舍",
  summary: "缺名称和低对比会挡住发布，只做了自动检查不能算通过；键盘任务没跑或读屏没跑时结果是未完成，而不是已接受。",
  aliases: ["accessibility test", "manual audit", "conformance", "人工走查"],
  tags: ["无障碍", "验证", "取舍"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "自动检查没有报错，为什么还不能说这条笔记流程可用？",
      paragraphs: [
        "发布前的扫描发现按钮有名称、对比度也过了，于是结果被写成通过。实际路径是：只用键盘新建笔记、触发两条校验错误、改完再保存。这条路径没有人走过。读屏也没有沿同一条路径听过错误摘要。扫描不能发现焦点被弹层丢掉，也不能发现错误只写在红框上。",
        "自动检查适合挡住缺名称和低对比这类它能看见的问题。键盘任务和读屏没做时，结论只能是未完成。文案打磨排在挡住发布的问题之后。本篇用发现项和结果字符串做门禁，不运行扫描器，也不操作读屏。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：扫描只认四种发现，门禁把失败和未测分开",
      paragraphs: [
        "运行 npm run verify:k15。scan 把 missing-name 收成 fail:name，low-contrast 收成 fail:contrast，name-ok 和 contrast-ok 收成对应的 pass。其他发现，包括 speech，是 invalid：读屏结果不能装进自动扫描。",
        "priority 把 missing-name、keyboard-trap、low-contrast 定为 block，把 motion 和 target-size 定为 fix-before-release，把 wording 定为 follow-up。gate 在列表为空时返回 empty。任一字符串以 fail 或 block 开头就返回 blocked 加这些项。没有失败但有 untested 时返回 incomplete。全部以 pass 开头才是 accepted。"
      ]
    },
    {
      id: "scan",
      title: "缺名称和低对比会挡住，文案问题排在后面",
      paragraphs: [
        "missing-name 是 fail:name，low-contrast 是 fail:contrast。name-ok 是 pass:name。speech 作为扫描发现是 invalid，因为自动扫描没有听见读屏。键盘陷阱的优先级是 block，和缺名称、低对比同一档。动效是 fix-before-release：发布前要改，但它不是扫描器返回的 fail 字符串。文案是 follow-up，不和键盘陷阱抢同一轮。",
        "优先级和扫描结果是两张表。扫描说 fail 的项，门禁会挡住。优先级说 block 的项，若调用方把 block 放进门禁，同样挡住。follow-up 不会变成 pass。把文案改完而名称仍缺，发布结论仍然不成立。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function scan(finding) {
  if (finding === 'missing-name') return 'fail:name';
  if (finding === 'low-contrast') return 'fail:contrast';
  if (finding === 'name-ok') return 'pass:name';
  if (finding === 'contrast-ok') return 'pass:contrast';
  return 'invalid';
}
function priority(issue) {
  if (issue === 'missing-name' || issue === 'keyboard-trap' || issue === 'low-contrast') return 'block';
  if (issue === 'motion' || issue === 'target-size') return 'fix-before-release';
  if (issue === 'wording') return 'follow-up';
  return 'invalid';
}
console.log('缺名称:' + scan('missing-name'));
console.log('低对比:' + scan('low-contrast'));
console.log('名称通过:' + scan('name-ok'));
console.log('未知发现:' + scan('speech'));
console.log('陷阱:' + priority('keyboard-trap'));
console.log('动效:' + priority('motion'));
console.log('文案:' + priority('wording'));`,
          expectedOutput: [
            "缺名称:fail:name",
            "低对比:fail:contrast",
            "名称通过:pass:name",
            "未知发现:invalid",
            "陷阱:block",
            "动效:fix-before-release",
            "文案:follow-up"
          ],
          explanation: [
            "名称和对比是扫描能给出的失败。speech 不是扫描发现，返回 invalid，避免把没做的读屏写成某一种自动结果。",
            "键盘陷阱与缺名称同为 block。动效要在发布前修，文案则排到后面，两者都不是 pass。"
          ]
        }
      ]
    },
    {
      id: "gate",
      title: "有失败就不能接受，读屏没跑只能算未完成",
      paragraphs: [
        "pass:name、fail:contrast、pass:task 放在一起，返回 blocked:fail:contrast。任务即使写成通过，低对比仍然挡住发布。pass:name、pass:task、untested:speech 返回 incomplete:untested:speech。名称和键盘任务都过了，读屏没跑，不能升成 accepted。",
        "三项都是 pass 时才 accepted。空列表是 empty，没有证据不能当成通过。单独把 block 放进去得到 blocked:block，用来接住优先级表里的键盘陷阱。未完成和挡住不同：挡住表示已经看见失败，未完成表示还缺一条证据。K15-03 的错误恢复如果没有人用键盘走过，就属于未完成，而不是扫描通过。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function gate(items) {
  if (!items.length) return 'empty';
  const fails = items.filter((item) => item.startsWith('fail') || item.startsWith('block'));
  const untested = items.filter((item) => item.startsWith('untested'));
  if (fails.length) return 'blocked:' + fails.join('+');
  if (untested.length) return 'incomplete:' + untested.join('+');
  if (items.every((item) => item.startsWith('pass'))) return 'accepted';
  return 'invalid';
}
console.log('挡住:' + gate(['pass:name', 'fail:contrast', 'pass:task']));
console.log('未完成:' + gate(['pass:name', 'pass:task', 'untested:speech']));
console.log('接受:' + gate(['pass:name', 'pass:contrast', 'pass:task']));
console.log('空:' + gate([]));
console.log('优先级挡住:' + gate(['block']));`,
          expectedOutput: [
            "挡住:blocked:fail:contrast",
            "未完成:incomplete:untested:speech",
            "接受:accepted",
            "空:empty",
            "优先级挡住:blocked:block"
          ],
          explanation: [
            "列表里只要有 fail，结论就是 blocked，后面的 pass:task 不能把它抬成接受。untested:speech 在没有失败时得到 incomplete。",
            "accepted 要求每一项都以 pass 开头。空列表和单独的 block 都不是接受：前者没有证据，后者是已知的挡住项。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "accepted 不是符合性声明，untested 也不能写成读屏失败",
      paragraphs: [
        "gate 只拼接调用方给的字符串。它不知道扫描器版本，也不知道任务步骤是否真的包含找错、改字段和再次提交。accepted 表示这张列表里都是 pass，不是 WCAG 符合性声明，更不是某一种读屏已经通过。",
        "untested:speech 是没做，不是听过之后判定失败。把没做写成 fail，会让人去修一个尚未观察的问题；把它留空然后 accepted，又会把没做当成通过。incomplete 就是为了保住这个差别。",
        "priority 不排序一整份报告，只给单个问题一个档。fix-before-release 不会自动进入 gate，除非调用方把它转换成门禁能认识的字符串。wording 的 follow-up 也不能替代 block。模型不点击页面，不记录浏览器和辅助技术的名称；真的走过任务时，那些环境仍然要写进记录。"
      ]
    },
    {
      id: "practice",
      title: "用一条保存路径分开扫描、键盘和读屏",
      paragraphs: [
        "缺名称或低对比应得到 fail，并让 gate 返回 blocked。名称、对比和键盘任务都是 pass、读屏仍是 untested 时，结果应是 incomplete。三项都是 pass 才 accepted。空列表保持 empty。",
        "本主题没有已开放的独立练习。示例不运行辅助技术，也不能把 accepted 写成读屏或整站验收已经通过。"
      ]
    }
  ],
  sources: [
    { title: "W3C：Evaluating Web Accessibility", url: "https://www.w3.org/WAI/test-evaluate/" },
    { title: "W3C：Understanding Conformance", url: "https://www.w3.org/WAI/WCAG22/Understanding/conformance.html" },
    { title: "W3C APG：键盘接口与焦点", url: "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/" }
  ]
};
