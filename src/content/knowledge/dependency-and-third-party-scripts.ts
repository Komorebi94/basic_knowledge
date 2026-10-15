import type { Article } from "../articles";

export const dependencyThirdPartyArticle: Article = {
  id: "K11-04",
  kind: "knowledge",
  domainSlug: "security",
  slug: "dependency-and-third-party-scripts",
  title: "依赖与第三方脚本风险",
  summary: "从安装时的来源、哈希和安装脚本，到页面里的经典脚本与沙箱框架，说明第三方代码实际得到的能力取决于加载方式。",
  aliases: ["supply chain", "SRI", "third-party script", "postinstall", "第三方脚本"],
  tags: ["安全", "依赖与第三方脚本风险"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "锁文件哈希相同，为什么页面上的统计脚本仍然能读到订单？",
      paragraphs: [
        "构建使用声明过的注册表，安装哈希也和锁文件一致，安装步骤却仍可能执行包自己的脚本。另一份统计代码没有进入锁文件：它由页面上的 script 元素在用户浏览器里加载。前一条边界在安装和构建，后一条边界在已经打开的文档。哈希一致只说明字节和锁文件记录相符，不说明这些字节没有能力，更不说明后来插入的脚本受到同一份清单约束。",
        "本篇接续 K09-02 的锁文件和 K11-01 的页面执行。示例分别判断安装条目和运行时加载方式。注册表地址、哈希和权限名称都是作者固定值，不访问 npm，也不加载外部脚本。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：固定条目和能力名称，不执行包脚本",
      paragraphs: [
        "运行 npm run verify:k11。acceptPackage 只比较调用方给出的注册表、哈希和 postinstall 标记。runtimeAccess 只区分 classic-script 与 sandboxed-frame。measure 是唯一被沙箱模型允许的能力名。",
        "真实安装还要处理可选依赖、覆盖、生命周期脚本的工作目录和密钥环境。模型返回 install，表示这组字段通过了作者规则，不是一次 npm ci 已经成功。"
      ]
    },
    {
      id: "install",
      title: "来源不对或哈希不符就拒绝，有安装脚本则进入复核",
      paragraphs: [
        "注册表必须是 https://registry.example。安装哈希必须等于锁文件哈希。两者都通过且没有 postinstall 时才是 install。注册表不同为 rejected-registry，哈希不同为 rejected-hash，哈希正确但带有安装脚本为 needs-review。预期四个结果依次为 install、rejected-registry、rejected-hash、needs-review。",
        "needs-review 不是拒绝字节，也不是批准运行。安装脚本会在安装者的环境里执行，权限等于运行安装命令的人和当时可见的环境变量。复核要看脚本做什么、是否需要在 CI 中禁用生命周期脚本，以及密钥是否会出现在那个环境里。只因为哈希匹配就让脚本运行，把完整性当成了行为许可。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function acceptPackage(entry) {
  if (entry.registry !== 'https://registry.example') return 'rejected-registry';
  if (entry.installedHash !== entry.lockHash) return 'rejected-hash';
  if (entry.postinstall) return 'needs-review';
  return 'install';
}
const clean = { registry: 'https://registry.example', installedHash: 'a', lockHash: 'a', postinstall: false };
console.log(acceptPackage(clean));
console.log(acceptPackage({ ...clean, registry: 'https://mirror.example' }));
console.log(acceptPackage({ ...clean, installedHash: 'b' }));
console.log(acceptPackage({ ...clean, postinstall: true }));`,
          expectedOutput: ["install", "rejected-registry", "rejected-hash", "needs-review"],
          explanation: [
            "镜像地址在哈希比较之前被拒绝，避免一份来自其他来源的相同字节绕过来源规则。哈希不等时不会因为没有安装脚本而放行。",
            "第四条哈希和来源都正确，返回值仍不是 install。调用方必须另有一次人工或策略复核，不能把 needs-review 写进自动安装成功的分支。"
          ]
        }
      ]
    },
    {
      id: "runtime",
      title: "经典脚本得到的是页面源，沙箱框架才按名单缩小能力",
      paragraphs: [
        "runtimeAccess 对 classic-script 直接返回 page-origin，不阅读请求的能力名单。sandboxed-frame 只接受 measure；请求里有名单外的名称就返回 rejected 加被拒绝的名称，全部允许时用加号连接，空请求为 none。预期：经典脚本即使只请求 measure 也是 page-origin，沙箱中的 measure 为 measure，同时请求 document 为 rejected:document，空请求为 none。",
        "这个差别来自加载方式。经典脚本与页面共享文档和源，名单只是注释，浏览器不会按数组限制它。沙箱框架要真正不授予文档和同源能力，才可能让有效能力停留在 measure。页面里再把订单节点交给它，模型不会发现。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function runtimeAccess(integration, requested) {
  if (integration === 'classic-script') return 'page-origin';
  if (integration !== 'sandboxed-frame') return 'invalid';
  const allowed = new Set(['measure']);
  const denied = requested.filter(item => !allowed.has(item));
  if (denied.length > 0) return 'rejected:' + denied.join('+');
  return requested.join('+') || 'none';
}
console.log('经典脚本:' + runtimeAccess('classic-script', ['measure']));
console.log('沙箱测量:' + runtimeAccess('sandboxed-frame', ['measure']));
console.log('沙箱越权:' + runtimeAccess('sandboxed-frame', ['measure', 'document']));
console.log('沙箱无请求:' + runtimeAccess('sandboxed-frame', []));
console.log('未知方式:' + runtimeAccess('module', ['measure']));`,
          expectedOutput: ["经典脚本:page-origin", "沙箱测量:measure", "沙箱越权:rejected:document", "沙箱无请求:none", "未知方式:invalid"],
          explanation: [
            "经典脚本分支在检查 measure 之前返回。因此“只请求测量”并不能把页面脚本限制成测量。沙箱分支会列出未被允许的 document，而不是返回已允许的 measure 后忽略多余请求。",
            "module 不是两种已知加载方式，返回 invalid。真实 ES module 若仍在页面源中执行，能力接近经典脚本；本函数没有把它自动归入任何一种，避免用名字猜测隔离效果。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "完整性、行为和页面权限要分别留下证据",
      paragraphs: [
        "子资源完整性可以让浏览器核对某个脚本地址的字节。地址本身被换掉、策略允许了新的 origin，或者脚本在核对通过后从页面读取数据，都不是哈希字段能够单独阻止的。完整性回答“是不是这一份”，加载方式和 CSP 回答“它在哪里执行、还能再加载什么”。",
        "私有 npm 源、固定版本和忽略生命周期脚本都是安装策略的可选项。它们会改变可复现性和功能，需要与团队的发布流程一起选择。本篇不把某一个镜像或 ignore-scripts 写成所有项目的默认值。",
        "第三方若只需要汇总后的计数，应由本源代码采集并发送最小数据，而不是让外部脚本遍历文档。模型里的 measure 没有定义数据内容；真正发送前仍要去掉订单号、令牌和可识别用户的信息。"
      ]
    },
    {
      id: "practice",
      title: "给每个第三方写下来源、字节核对和实际能力",
      paragraphs: [
        "把构建依赖和浏览器脚本分成两张表。构建依赖记录注册表、锁文件哈希和是否有安装脚本。浏览器脚本记录 URL、CSP 来源、是页面脚本还是沙箱，以及它实际能读到的文档范围。任何一行写着“只做统计”但加载方式是经典脚本时，能力栏应改成页面源，直到隔离方式改变。",
        "没有已开放的依赖审查练习。示例注册表和哈希 a 不能当作真实安装依据。"
      ]
    }
  ],
  sources: [
    { title: "OWASP：Third Party Javascript Management", url: "https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html" },
    { title: "npm：npm ci", url: "https://docs.npmjs.com/cli/commands/npm-ci" },
    { title: "MDN：Content Security Policy", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP" }
  ]
};
