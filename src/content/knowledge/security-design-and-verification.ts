import type { Article } from "../articles";

export const securityDesignVerificationArticle: Article = {
  id: "K11-08",
  kind: "knowledge",
  domainSlug: "security",
  slug: "security-design-and-verification",
  title: "安全设计与验证",
  summary: "把订单页的跨用户修改、站外跳转和令牌入日志写成可失败的检查，没有对应威胁的清单项不能单独当作通过。",
  aliases: ["threat model", "security test", "威胁模型", "安全验证"],
  tags: ["安全", "安全设计与验证"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "检查清单全是勾，为什么仍然不知道订单页挡住了什么？",
      paragraphs: [
        "发布表写着已经启用 https、已经有登录页、已经做了安全扫描。这些句子没有对应一次具体失败：用户 A 修改用户 B 的订单时应被拒绝，登录后的 next 指向外站时应被拒绝，日志对象里的令牌应被替换。清单项可以提醒范围，却不能代替从资产、行动者和边界推导出的检查。全绿只说明表被填完。",
        "本篇把 K11-02 的授权、K11-06 的跳转和 K11-05 的日志收成同一个订单页案例。示例不扫描站点，也不调用外部安全服务。通过表示作者列出的检查都有对应威胁且结果为通过。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：固定威胁与检查结果，不评价真实站点",
      paragraphs: [
        "运行 npm run verify:k11。gate 只统计带有非空 threat 的项目。decide 要求三份固定证据的名称都出现。名称用短横线连接，避免把自然语言清单误认成已经实现的检查。",
        "三份证据分别指向前面章节的控制，但本篇不再执行那些函数。把证据名称放进数组，只说明案例记录声称这些检查存在；真正的行为仍由各自的示例和测试证明。"
      ]
    },
    {
      id: "gate",
      title: "没有威胁编号的通过项，不能让门禁通过",
      paragraphs: [
        "gate 先留下写了 threat 的项目。一个都没有时返回 no-threat-tests，即使某项 passed 为 true。有威胁编号时，必须每一项 passed 都为 true 才返回 passed，否则 failed。预期：只有 https 且 threat 为空时是 no-threat-tests；跨用户检查通过但跳转检查失败时是 failed；只有跨用户检查且通过时是 passed。",
        "第三条 passed 只覆盖它写下的那一个威胁。它不表示订单页的其他边界已经检查。no-threat-tests 要求补上威胁和失败时的预期，而不是把 https 勾选再算一次。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function gate(items) {
  const mapped = items.filter(item => item.threat);
  if (mapped.length === 0) return 'no-threat-tests';
  return mapped.every(item => item.passed) ? 'passed' : 'failed';
}
console.log(gate([{ name: 'https', threat: '', passed: true }]));
console.log(gate([
  { name: 'other-owner', threat: 'cross-user-edit', passed: true },
  { name: 'external-next', threat: 'open-redirect', passed: false }
]));
console.log(gate([{ name: 'other-owner', threat: 'cross-user-edit', passed: true }]));`,
          expectedOutput: ["no-threat-tests", "failed", "passed"],
          explanation: [
            "空字符串在过滤时被丢掉，所以一份看起来全部通过的 https 表没有进入分子。门禁不能在没有威胁的情况下返回 passed。",
            "第二组有明确威胁，其中一项失败，整体就是 failed。第三组证明门禁不会因为还存在未列出的风险而自动失败；未列出的风险要靠威胁模型补进输入，而不是靠函数猜测。"
          ]
        }
      ]
    },
    {
      id: "case",
      title: "订单页至少要能指出三份证据是否都在",
      paragraphs: [
        "案例把跨用户修改、站外 next 和令牌入日志定为必须留下证据的三件事。decide 检查 other-owner-rejected、redirect-rejected 和 token-redacted。缺哪些就返回 gap 加缺失名称，用加号连接；三项都在才返回 covered。顺序按这个固定名单，不按输入数组的顺序。",
        "只有 other-owner-rejected 时，缺口是跳转和日志。三项都在时为 covered。空数组的缺口包含全部三项。covered 仍然只是名称齐全，发布前要能打开对应测试并看到拒绝或替换的结果。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function decide(findings) {
  const required = ['other-owner-rejected', 'redirect-rejected', 'token-redacted'];
  const missing = required.filter(id => !findings.includes(id));
  if (missing.length > 0) return 'gap:' + missing.join('+');
  return 'covered';
}
console.log(decide(['other-owner-rejected']));
console.log(decide(['other-owner-rejected', 'redirect-rejected', 'token-redacted']));
console.log(decide([]));`,
          expectedOutput: [
            "gap:redirect-rejected+token-redacted",
            "covered",
            "gap:other-owner-rejected+redirect-rejected+token-redacted"
          ],
          explanation: [
            "第一行已经有授权证据，函数仍列出没有出现的两项。不会因为一项通过就把案例标成完成。",
            "空记录得到完整缺口。covered 只在三个固定名称都存在时出现，多出来的其他证据不会被这个函数否定，也不会填补缺失名称。"
          ]
        }
      ]
    },
    {
      id: "derive",
      title: "从资产、行动者和越界动作写出检查",
      paragraphs: [
        "订单记录是资产。已登录的其他用户、被诱导离开本源的浏览器，以及能读取日志的人，是不同行动者。越界动作分别是修改别人的订单、把 next 导航到外站、从日志取得令牌。每条检查都要写失败时的可观察结果：接口拒绝、导航函数返回 rejected、日志字段变成替换标记。",
        "https、依赖扫描和标题里的安全字样可以保留为背景，但要挂到具体威胁上。扫描发现一个库有已知问题，对应的是该库在本应用中是否可被触发、升级或移除后的行为，而不是把扫描工具的分数当成订单授权已经正确。",
        "威胁模型会过时。新增管理接口、预览链接或客户端日志接收者时，要新增行动者和检查。旧的 covered 不能自动延伸到新入口。"
      ]
    },
    {
      id: "boundaries",
      title: "名称齐全不是渗透测试，也不是权限系统已经正确",
      paragraphs: [
        "decide 不调用授权函数。测试若只断言函数被调用、却不断言其他用户被拒绝，名称仍然可以是 other-owner-rejected。审查时要看断言的输入和结果，不能只搜索测试名称。",
        "本案例没有覆盖 CSRF、CSP、第三方脚本和嵌入框架。它们在前几篇有各自的失败条件。一个订单页的发布可以分批验证，但报告必须写明这三份证据没有包含的边界。",
        "安全验证也不能破坏正常使用。所有者编辑自己的订单、回到本源路径和留下不含令牌的错误编号，都应仍然成功。只验证拒绝、不验证合法路径，会把可用的功能一起挡住。"
      ]
    },
    {
      id: "practice",
      title: "选一个写操作，写出行动者、越界动作和可观察失败",
      paragraphs: [
        "选择订单修改或登录回跳。写下资产、不允许的行动者和一次越界输入，再写下希望看到的拒绝或替换。把没有对应威胁的清单项移出通过条件。最后补一条合法所有者或合法本源路径仍然成功的检查。",
        "没有已开放的威胁建模练习。示例名称不是扫描器的规则编号。"
      ]
    }
  ],
  sources: [
    { title: "OWASP：Threat Modeling", url: "https://owasp.org/www-community/Threat_Modeling" },
    { title: "OWASP：Logging Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html" },
    { title: "OWASP：Unvalidated Redirects and Forwards", url: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html" }
  ]
};
