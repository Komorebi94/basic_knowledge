import type { Article } from "../articles";

export const e2eStabilityArticle: Article = {
  id: "K12-06",
  kind: "knowledge",
  domainSlug: "testing",
  slug: "e2e-stability",
  title: "E2E 稳定性与环境",
  summary: "用共享笔记库比较隔离和清理时机，并把重试后通过的失败分成产品、共享状态、计时和环境。",
  aliases: ["flaky test", "test isolation", "retry", "端到端稳定性"],
  tags: ["测试", "端到端", "稳定性"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "单独跑能通过，为什么整组跑时后一个用例看见了别人的笔记？",
      paragraphs: [
        "用例 A 写入笔记 n1，用例 B 期望打开时列表为空。单独运行 B 时库是空的；A 先跑且没有清理时，B 读到 n1，断言失败。有人给失败用例加一次重试，B 碰巧在清理之后通过。报告变绿，第一次看见的共享数据却没有被处理。",
        "端到端用例要拥有自己的数据，并等待用户能观察到的完成状态。重试可以保留失败现场，不能把第一次失败改写成通过。本篇用固定计划模拟运行顺序，不启动浏览器，也不连接真实服务。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：一份内存笔记库和已经发生过的两次结果",
      paragraphs: [
        "运行 npm run verify:k12。runPlan 按数组顺序执行。isolate 为真时该用例使用新的 Map，否则共用一个 Map。seed 在读取前写入，cleanup 在读取之后清空当前这份库。诊断函数不重新执行用例，只给第一次结果和重试结果分类。",
        "ready 在状态数组里找第一次出现的 saved。它不睡眠，也不表示页面已经绘制。环境失败 env 即使重试通过，仍返回 environment，因为重试没有说明外部依赖恢复的原因。"
      ]
    },
    {
      id: "isolation",
      title: "清理放在断言之后，挡不住这次用例读到上一次的数据",
      paragraphs: [
        "A 写入 n1 且不清理时，B 看到 n1，结果是 A:n1,B:n1。两个用例都隔离时，B 的新库是空的，结果是 A:n1,B:empty。A 在自己断言之后清理，B 才看到 empty。",
        "若只有 B 在断言之后清理，B 的记录仍然是 B:n1。清理发生得太晚，这次断言已经使用了共享数据。隔离或上一个用例的清理解掉的是下一次的输入，不是这次已经读到的值。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function runPlan(tests) {
  const shared = new Map();
  return tests.map((test) => {
    const store = test.isolate ? new Map() : shared;
    if (test.seed) store.set(test.seed, test.name);
    const seen = [...store.keys()].sort().join('+') || 'empty';
    if (test.cleanup) store.clear();
    return test.name + ':' + seen;
  }).join(',');
}
console.log('共享:' + runPlan([{ name: 'A', seed: 'n1' }, { name: 'B' }]));
console.log('隔离:' + runPlan([{ name: 'A', seed: 'n1', isolate: true }, { name: 'B', isolate: true }]));
console.log('A清理:' + runPlan([{ name: 'A', seed: 'n1', cleanup: true }, { name: 'B' }]));
console.log('B才清理:' + runPlan([{ name: 'A', seed: 'n1' }, { name: 'B', cleanup: true }]));`,
          expectedOutput: [
            "共享:A:n1,B:n1",
            "隔离:A:n1,B:empty",
            "A清理:A:n1,B:empty",
            "B才清理:A:n1,B:n1"
          ],
          explanation: [
            "共享库按运行顺序累积。B 没有自己的 seed，却读到了 A 留下的 n1。隔离让 B 从新的空 Map 开始。",
            "A 读取并记录 n1 之后才清空，所以 A 的断言仍能看见自己的数据，B 不再看见。B 自己的清理发生在 B 已经读到 n1 之后，改变不了 B:n1。"
          ]
        }
      ]
    },
    {
      id: "flake",
      title: "重试通过要保留第一次失败的类别，不能改写成产品正确",
      paragraphs: [
        "diagnose 先看第一次结果。assert 返回 product，即使重试是 pass，因为断言已经说明结果不符合合同。shared 后重试通过返回 masked:shared-state；没有通过则是 shared-state。timeout 后通过返回 masked:timing。env 返回 environment。",
        "ready 用来代替固定睡眠：状态依次是 editing、saving、saved 时，第一次 saved 在下标 2，返回 ready@2。只有 editing 和 saving 时返回 not-ready。测试应在看到 saved 后再断言列表，而不是睡两秒。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function diagnose(first, retried) {
  if (first === 'pass') return 'passed';
  if (first === 'assert') return 'product';
  if (first === 'shared' && retried === 'pass') return 'masked:shared-state';
  if (first === 'timeout' && retried === 'pass') return 'masked:timing';
  if (first === 'shared') return 'shared-state';
  if (first === 'timeout') return 'timing';
  if (first === 'env') return 'environment';
  return 'invalid';
}
function ready(states) {
  const index = states.indexOf('saved');
  return index < 0 ? 'not-ready' : 'ready@' + index;
}
console.log('产品:' + diagnose('assert', 'pass'));
console.log('掩盖共享:' + diagnose('shared', 'pass'));
console.log('仍共享:' + diagnose('shared', 'fail'));
console.log('环境:' + diagnose('env', 'pass'));
console.log('就绪:' + ready(['editing', 'saving', 'saved']));
console.log('未就绪:' + ready(['editing', 'saving']));`,
          expectedOutput: [
            "产品:product",
            "掩盖共享:masked:shared-state",
            "仍共享:shared-state",
            "环境:environment",
            "就绪:ready@2",
            "未就绪:not-ready"
          ],
          explanation: [
            "断言失败不会因为第二次通过变成环境问题。共享状态被重试盖住时，结果仍带着 masked，提醒第一次失败需要处理。",
            "环境失败即使后来通过，也保留 environment。ready@2 表示第三条观察才出现 saved；没有这条观察就不能把页面当成已经保存。"
          ]
        }
      ]
    },
    {
      id: "ready",
      title: "等待的是可重复观察到的状态，数据准备只使用本用例的身份",
      paragraphs: [
        "完成信号可以是保存后的文本、列表中的笔记 id，或一条测试能够读取的状态。信号要在成功和失败时都会出现，否则失败路径只能靠超时。超时说明“没有看到信号”，还要保留当时的页面和接口记录，才能判断是产品没发出信号，还是测试看错了位置。",
        "每个用例使用独立的用户或数据集，名称带上用例身份。清理只删除自己写入的数据，放在断言之后，避免删掉还没检查的结果。并行运行时，隔离的是数据身份和浏览器上下文，不是只靠错开开始时间。"
      ]
    },
    {
      id: "boundaries",
      title: "内存计划不证明浏览器隔离，重试分类也不重跑失败的产品代码",
      paragraphs: [
        "runPlan 没有网络、登录和渲染。它只说明同一份 Map 会被后来的用例看见。真实端到端还要确认每个上下文有自己的存储，并且一个用例的失败不会留下下一个用例能读到的账号。",
        "diagnose 的输入是作者写下的两次结果，不是测试运行器的日志。masked 表示分类，不表示已经修复共享状态。修复后应让第一次运行通过，再考虑是否保留有限重试来发现新的不稳定。",
        "ready 找到的是数组里的标记。页面若先闪出一次 saved 再回到编辑，模型仍返回第一次的下标。测试要按产品合同决定看的是最终状态还是第一次出现。"
      ]
    },
    {
      id: "practice",
      title: "失败时先保留第一次现场，再决定是隔离、等待还是产品缺陷",
      paragraphs: [
        "用例共享数据时先改成独立数据集，并让清理发生在断言之后。等待改成 saved 或明确的错误状态。若重试才通过，把第一次失败记成 shared-state、timing 或 environment，不要只留下绿色结果。",
        "本主题没有已开放的独立练习。模型里的 n1 和状态名不是一次真实流水线的日志。"
      ]
    }
  ],
  sources: [
    { title: "Playwright：测试实践", url: "https://playwright.dev/docs/best-practices" },
    { title: "Playwright：浏览器上下文", url: "https://playwright.dev/docs/browser-contexts" },
    { title: "Playwright：重试", url: "https://playwright.dev/docs/test-retries" }
  ]
};
