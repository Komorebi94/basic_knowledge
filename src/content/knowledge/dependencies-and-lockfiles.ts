import type { Article } from "../articles";

export const dependenciesAndLockfilesArticle: Article = {
  "id": "K09-02",
  "kind": "knowledge",
  "domainSlug": "tooling",
  "slug": "dependencies-and-lockfiles",
  "title": "依赖、锁文件与供应链",
  "summary": "可重复安装、依赖升级、脚本权限如何控制。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "dependencies-and-lockfiles",
    "依赖、锁文件与供应链"
  ],
  "tags": [
    "tooling"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "同一份代码，两台机器为什么装出不同依赖？",
      "paragraphs": [
        "package.json 写范围版本，一台机器今天安装，另一台下周安装，可能得到不同满足范围的版本。直接依赖之外，传递依赖也会变化。可重复安装要把声明意图、实际解析结果与执行环境一起纳入控制。",
        "本文样例用确定性数据说明范围、锁定和升级审查，不运行安装或第三方脚本。真实 npm 行为依据官方文档和项目版本；不要把示例中的版本号误认为推荐安装的库。"
      ],
      "examples": [
        {
          "code": "const available = ['1.0.0', '1.1.0', '1.2.0'];\nconst lock = { package: 'example-lib', version: '1.1.0' };\nconsole.log(available[available.length - 1]);\nconsole.log(lock.version);",
          "expectedOutput": [
            "1.2.0",
            "1.1.0"
          ],
          "explanation": [
            "第一个值表示仓库当前可选最新版，第二个表示已锁定解析结果。例子没有实现 semver 解析，只显示范围允许变化与锁文件固定结果的区别。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "声明、锁文件和安装树不是同一东西",
      "paragraphs": [
        "package.json 表达依赖与脚本意图；锁文件记录解析版本、来源、完整性和依赖结构；node_modules 是某次安装得到的实际树。应提交符合项目约定的锁文件，并在 CI 使用与之相容的干净安装流程。",
        "npm ci 要求已有锁文件且声明相容，不负责随意修正冲突；与 npm install 的用途不同。生成锁文件时使用影响树结构的配置，CI 也需保持相应一致性。锁文件让输入更确定，但操作系统、CPU、运行时和可选依赖仍影响结果。"
      ]
    },
    {
      "id": "integrity",
      "title": "完整性保护字节一致，不保证代码安全",
      "paragraphs": [
        "锁文件 integrity 帮助判断取得的包字节是否符合预期，不证明包无漏洞、维护者可信或安装脚本没有风险。包发布源、权限与代码审查仍是独立责任。依赖引入时应知道它解决什么问题、谁维护、需要哪些脚本能力。"
      ],
      "examples": [
        {
          "code": "const dependency = { version: '2.0.0', integrity: 'known-bytes', installScript: true };\nfunction review(item) { return { reproducibleInput: Boolean(item.integrity), needsScriptReview: item.installScript }; }\nconst result = review(dependency);\nconsole.log(result.reproducibleInput);\nconsole.log(result.needsScriptReview);",
          "expectedOutput": [
            "true",
            "true"
          ],
          "explanation": [
            "有字节身份仍需审查脚本，这两个结果可以同时为真。字符串仅代表概念标记，不是实际哈希校验器；真正验证应使用包管理器的完整性机制。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "upgrade",
      "title": "升级应该是一组可审查的变化",
      "paragraphs": [
        "阅读直接与传递依赖变更、迁移说明和破坏性 API，更新声明及锁文件，运行与该依赖有关的行为检查。只看 version 字段增大而忽略配置和输出变化，会把问题留到生产。"
      ],
      "examples": [
        {
          "code": "const before = new Map([['core', '1.0.0'], ['parser', '2.0.0']]);\nconst after = new Map([['core', '1.1.0'], ['parser', '3.0.0']]);\nconst changes = [...after].filter(([name, version]) => before.get(name) !== version);\nconsole.log(changes.map(([name, version]) => name + ':' + version).join(','));\nconsole.log(changes.length);",
          "expectedOutput": [
            "core:1.1.0,parser:3.0.0",
            "2"
          ],
          "explanation": [
            "两个包都发生变化，不能只审核直接 core。Map 比较只显示差异，不能判断兼容性；parser 主版本变化需继续查它是否影响当前调用与构建链。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "错误流程：删除锁文件然后修到能跑",
      "paragraphs": [
        "为解决冲突直接删除锁文件重装，会让大量无关依赖重新解析，扩大回归面。先理解冲突来自哪次声明变更，用项目约定的工具版本重建必要部分，再审核差异。手工改锁文件某个版本也可能留下不一致的依赖与完整性信息。",
        "忽略全部安装脚本能减少执行面，但某些合法包需要构建原生组件或产物。应明确哪些脚本需要运行并在隔离环境验证，而不是因为安装结束没有报错就宣称功能完整。不要把凭证注入不需要权限的安装进程。"
      ]
    },
    {
      "id": "boundaries",
      "title": "两条可重复安装的边界",
      "paragraphs": [
        "第一条边界是平台。原生模块、可选包与系统库可能依赖具体环境；固定锁文件还要固定并记录支持的 Node、npm 与操作系统。第二条边界是包源可用性：锁定远程位置不保证它永远可下载，需要可靠镜像与制品保留策略。",
        "第三条边界是安全扫描。扫描提供已知风险证据，不能证明没有未知漏洞；修复建议也可能引入破坏性升级。按可利用性、使用路径和修复验证处理，不机械执行强制升级。"
      ]
    },
    {
      "id": "application",
      "title": "建立小范围升级与回滚证据",
      "paragraphs": [
        "每次升级只围绕一个清晰目标，保留旧锁文件与构建产物，验证类型、构建及关键调用。若变化触及序列化、网络或持久化合同，增加针对行为的回归测试。",
        "依赖数量不是唯一质量指标。可以用平台 API 简单完成的功能不必引包；复杂且高风险能力也不应为了零依赖而自行实现。决定依据是维护责任、质量和可验证性。",
        "例如图片处理包从纯 JavaScript 变成依赖本地二进制，版本升级虽然 API 函数名没改，CI 与部署平台却可能出现新要求。审核应检查安装脚本、可选平台包、运行时支持与许可证，验证目标环境真实处理一张图片。只运行类型检查不会发现二进制缺失，因为声明文件仍能描述相同函数。",
        "回滚也要围绕制品而不只是把 package.json 数字改回去。若锁文件或缓存仍属于新版本，安装树可能与声明不一致。恢复审核过的声明与锁文件，用相同工具配置重建，并确认构建产物身份。对于已经改变持久化格式的升级，还要验证旧程序能否读取新数据，依赖版本回退本身不能保证业务数据兼容。",
        "审核新增包时也检查是否真的进入客户端产物。只在构建中需要的工具应放到恰当依赖边界，不能因一个导入把服务器能力或凭证逻辑打进浏览器。锁文件能列出安装关系，产物分析才显示最终客户端代码，两者需要共同检查。"
      ]
    },
    {
      "id": "recall",
      "title": "审核一份锁文件差异",
      "paragraphs": [
        "找出直接声明为什么改、传递版本为何变化、平台配置是否一致、脚本是否增加，再对照实际使用路径。把升级理由与检查结果留在可审查记录中。",
        "回忆：integrity 为何不能证明安全？npm ci 为什么不应修复声明与锁文件冲突？可在差异例子加入删除包，并扩展比较器发现 before 中消失的条目。"
      ]
    }
  ],
  "sources": [
    {
      "title": "npm：npm ci",
      "url": "https://docs.npmjs.com/cli/commands/npm-ci/"
    },
    {
      "title": "npm：package-lock.json",
      "url": "https://docs.npmjs.com/cli/configuring-npm/package-lock-json/"
    }
  ]
};
