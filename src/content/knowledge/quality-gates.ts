import type { Article } from "../articles";

export const qualityGatesArticle: Article = {
  id: "K12-08",
  kind: "knowledge",
  domainSlug: "testing",
  slug: "quality-gates",
  title: "质量门禁与测试诊断",
  summary: "用类型、lint、构建和测试四项记录区分跳过与失败，并写明每项检查能支持哪一类结论。",
  aliases: ["quality gate", "CI", "typecheck", "质量门禁"],
  tags: ["测试", "门禁", "诊断"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "测试通过了，为什么仍不能说这次改动可以合并？",
      paragraphs: [
        "流水线只跑了测试，类型检查被标成 skipped。测试全部通过，报告却写成门禁通过。一个把笔记 id 读成可能为空的改动，行为用例没用到那条路径，测试不会失败，类型检查才会失败。另一项失败是比较符写错，类型和 lint 都看不出来。",
        "每项检查都有它能支持的结论，也有它支持不了的结论。门禁先看四项是否都真正运行，再看哪一项失败。本篇处理一份固定记录，不读取仓库的真实命令输出，也不连接持续集成。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：四项状态只接受 pass、fail 和 skipped",
      paragraphs: [
        "运行 npm run verify:k12。gate 的键固定为 types、lint、build、tests。缺键或其他状态返回 invalid。只要有一项是 skipped，就返回 incomplete 和这些名字，此时同一份记录里的 fail 不会出现。没有跳过项时，才返回 failed 和失败名字；四项都是 pass 才返回 passed。",
        "supports 只认识四类检查和每类两条结论。测试支持 behavior 与 boundary，不支持 wrong-type。类型支持 wrong-type 与 missing-property，不支持 behavior。未知检查返回 invalid。"
      ]
    },
    {
      id: "gate",
      title: "有跳过项时，门禁还没有完成，不能先解释成某项失败",
      paragraphs: [
        "四项都是 pass 时返回 passed。只有 types 为 skipped 时返回 incomplete:types。types 为 fail 且其他都运行过时返回 failed:types。types 为 fail 同时 tests 为 skipped 时，结果是 incomplete:tests，types 的失败先不进入结果。",
        "这个顺序是为了避免半截流水线被读成“唯一的问题是类型”。tests 改成 pass 或 fail 之后，同一份类型失败才会变成 failed:types。跳过不是通过，失败也不是还没运行。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function gate(report) {
  const names = ['types', 'lint', 'build', 'tests'];
  if (!report || names.some((name) => !['pass', 'fail', 'skipped'].includes(report[name]))) return 'invalid';
  const skipped = names.filter((name) => report[name] === 'skipped');
  if (skipped.length) return 'incomplete:' + skipped.join('+');
  const failed = names.filter((name) => report[name] === 'fail');
  if (failed.length) return 'failed:' + failed.join('+');
  return 'passed';
}
const pass = { types: 'pass', lint: 'pass', build: 'pass', tests: 'pass' };
console.log('全过:' + gate(pass));
console.log('跳过类型:' + gate({ ...pass, types: 'skipped' }));
console.log('类型失败:' + gate({ ...pass, types: 'fail' }));
console.log('失败又跳过:' + gate({ ...pass, types: 'fail', tests: 'skipped' }));
console.log('缺记录:' + gate({ types: 'pass', lint: 'pass', build: 'pass' }));`,
          expectedOutput: [
            "全过:passed",
            "跳过类型:incomplete:types",
            "类型失败:failed:types",
            "失败又跳过:incomplete:tests",
            "缺记录:invalid"
          ],
          explanation: [
            "skipped 先于 fail 被收集。失败又跳过时，tests 还没有结果，所以看不到 types 的 fail。补上 tests 之后，类型失败才会单独出现。",
            "缺 tests 键不是 skipped，而是 invalid。门禁不能把没交给它的项目当成已通过。"
          ]
        }
      ]
    },
    {
      id: "claim",
      title: "测试通过支持不了类型结论，类型通过也支持不了行为结论",
      paragraphs: [
        "supports('tests', 'behavior') 是 supports，supports('tests', 'wrong-type') 是 outside。supports('types', 'behavior') 也是 outside。lint 对 hook-deps 是 supports。coverage 不是四类检查之一，返回 invalid。",
        "因此测试全绿不能填写“类型已经检查”。类型全绿也不能填写“保存行为已经证明”。构建失败说明程序没有按这次配置产出可运行结果，通常还没到解释行为断言。lint 能提醒未使用的值和一部分依赖写法，不能代替边界用例。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function supports(check, claim) {
  const claims = {
    types: ['wrong-type', 'missing-property'],
    lint: ['unused', 'hook-deps'],
    build: ['compile', 'missing-import'],
    tests: ['behavior', 'boundary'],
  };
  if (!Object.hasOwn(claims, check)) return 'invalid';
  return claims[check].includes(claim) ? 'supports' : 'outside';
}
console.log('测试对行为:' + supports('tests', 'behavior'));
console.log('测试对类型:' + supports('tests', 'wrong-type'));
console.log('类型对行为:' + supports('types', 'behavior'));
console.log('lint对依赖:' + supports('lint', 'hook-deps'));
console.log('未知:' + supports('coverage', 'behavior'));`,
          expectedOutput: [
            "测试对行为:supports",
            "测试对类型:outside",
            "类型对行为:outside",
            "lint对依赖:supports",
            "未知:invalid"
          ],
          explanation: [
            "每一类检查只支持表里的结论。测试用例没有走过的类型错误，不会因为测试通过而变成 supports。",
            "coverage 即使在别的流程里有用，也不是这个函数认识的检查。把它说成能够证明行为，会返回 invalid。"
          ]
        }
      ]
    },
    {
      id: "order",
      title: "诊断从第一份真实失败开始，不要用后一项的通过抹掉前一项",
      paragraphs: [
        "类型失败时，先看类型诊断，不要把同一提交的测试通过写成可以合并。测试失败时，先区分是断言与合同不符，还是 K12-06 里的共享状态、计时和环境。第一次失败后重试才通过，记录仍保留第一次的类别。",
        "构建失败可能来自类型、语法或缺失依赖，应看构建日志，而不是直接重跑测试。lint 单独失败时，结论只覆盖它检查的写法。四项都通过，也只支持它们各自表内的结论，不自动包含性能、安全或真实浏览器矩阵。"
      ]
    },
    {
      id: "boundaries",
      title: "这份记录不是命令输出，支持表也不是所有质量问题的清单",
      paragraphs: [
        "gate 不执行 tsc、eslint、构建或测试。传入 pass 只表示作者把该格填成 pass。真实门禁还要保留命令、退出码和日志，并确认跳过不是因为配置被关掉。",
        "supports 的列表是本篇为了说明边界而写下的六类结论。类型检查还能发现更多错误，测试也还能证明更多行为。表外的结论返回 outside，表示这一格不能拿来支持它，不是表示该结论不重要。",
        "incomplete 故意不并列 fail。若报告需要同时看见“测试没跑”和“类型已失败”，应分两行写原始状态，而不是只保留函数返回的摘要。摘要用于门禁是否完成，原始格子用于诊断。"
      ]
    },
    {
      id: "practice",
      title: "合并前核对四格都有结果，再按失败的那一格查看证据",
      paragraphs: [
        "types、lint、build、tests 都要是 pass 或 fail，不能留 skipped。失败时打开对应日志。测试通过只填写行为和已覆盖的边界；类型结论必须来自类型检查。不要用覆盖率数字代替这四格。",
        "本主题没有已开放的独立练习。示例不读取本仓库的真实检查结果。"
      ]
    }
  ],
  sources: [
    { title: "TypeScript：日常类型", url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html" },
    { title: "ESLint：核心概念", url: "https://eslint.org/docs/latest/use/core-concepts" },
    { title: "Playwright：断言", url: "https://playwright.dev/docs/test-assertions" }
  ]
};
