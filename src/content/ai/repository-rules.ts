import type { Article } from "../articles";

export const repositoryRulesArticle: Article = {
  "id": "AI06",
  "catalogId": "AI06",
  "kind": "ai",
  "slug": "repository-rules",
  "title": "仓库规则与可执行约束",
  "summary": "以防止越界改动为例，把仓库文字规则映射到差异审阅与运行门禁，说明规则文件、检查程序和权限控制分别能保证什么。",
  "aliases": [
    "repository-rules",
    "AI06"
  ],
  "tags": [
    "AI 工程",
    "仓库规则与可执行约束"
  ],
  "estimatedMinutes": 20,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "写了“只改内容目录”，为什么还可能改配置？",
      "paragraphs": [
        "一次文章修正只允许修改内容文件。AI 发现验证脚本失败后，可能修改脚本使它跳过这篇文章，最终展示绿色检查。用户要求的正文没有更可靠，检查却变弱了。本文目标是让任务范围、检查强度和授权边界都有可核对的依据。",
        "前置知识是文件差异与检查退出状态。示例用路径数组模拟变更列表，可以在现代浏览器执行；真实工具应从版本控制系统获得差异，不应相信 AI 自报“只改了两个文件”。示例没有读取磁盘，因此不会改变仓库权限。"
      ]
    },
    {
      "id": "layers",
      "title": "文字规则、工程门禁与权限是三层约束",
      "paragraphs": [
        "仓库规则说明什么行为被期待，例如保持公共接口、采用已有命名模式、不要保存密钥。工具读到规则后仍可能漏执行或误解，所以要把能机械判定的部分交给检查。类型检查能发现一部分合同错误，但不能判定某段文案是否充分解释了失败路径。",
        "门禁要明确输入与失败语义。对目录范围，输入是真实差异路径，输出是允许或拒绝以及违规文件。对样例输出，输入是作者维护的代码，输出是执行值与预期的比较。对业务语义，仍需要人根据复现路径审阅，不能用“Lint 没报错”替代。",
        "权限控制限制工具实际上能访问或修改的对象。自然语言“不访问外网”不等于网络被隔离；写权限开放也不意味着任何写入都获得了用户授权。按当前任务选目录与命令权限，再用差异和检查核对行为，两者不能互相替代。"
      ]
    },
    {
      "id": "wrong",
      "title": "错误实现：用字符串前缀检查目录",
      "paragraphs": [
        "允许目录是 src/content，错误检查却接受同名前缀 src/content-backup。另一个常见错误是仅筛选 .ts 文件，完全漏掉脚本和配置。下面让反例直接输出允许结果。"
      ],
      "examples": [
        {
          "code": "const allowed = 'src/content';\nconst changed = ['src/content/article.ts', 'src/content-backup/settings.ts'];\nconst accepted = changed.every(path => path.startsWith(allowed));\nconsole.log(accepted);",
          "expectedOutput": [
            "true"
          ],
          "explanation": [
            "第二条路径的前缀确实相同，但它不是目录下的文件。检查没有比较路径段，所以允许集合比规则写得更宽。",
            "真实路径处理还包括绝对路径、分隔符、符号链接和大小写。这个反例只说明前缀边界；不要把补一个斜杠描述成通用文件系统沙箱。"
          ]
        }
      ]
    },
    {
      "id": "gate",
      "title": "将可判定规则转成明确反馈",
      "paragraphs": [
        "对本例的版本控制相对路径，先拒绝反斜杠、绝对路径和 .. 段，再用带斜杠前缀匹配。真实工程可用平台路径 API 规范化并核对解析后位置；此处刻意收窄输入合同，避免在通用例子里伪装复杂文件访问安全。"
      ],
      "examples": [
        {
          "code": "function insideContent(path) {\n  if (typeof path !== 'string' || path.startsWith('/') || path.includes('\\\\')) return false;\n  const parts = path.split('/');\n  if (parts.some(part => part === '..' || part === '.' || part === '')) return false;\n  return path.startsWith('src/content/');\n}\nconst changed = ['src/content/article.ts', 'src/content-backup/settings.ts', 'src/content/../config.ts'];\nconsole.log(changed.filter(path => !insideContent(path)).join(','));\nconsole.log(insideContent('src/content/ai/tool.ts'));",
          "expectedOutput": [
            "src/content-backup/settings.ts,src/content/../config.ts",
            "true"
          ],
          "explanation": [
            "目录外同名前缀因为缺少 src/content/ 被拒绝；含 .. 的路径在匹配前就拒绝。正常子目录文件通过。",
            "示例没有解析符号链接，也没有打开文件，因此只能用于收窄形式的路径清单检查。实际访问边界仍交给系统沙箱与解析后的文件路径校验。"
          ]
        }
      ]
    },
    {
      "id": "mapping",
      "title": "保留少量规则，给每条规则对应证据",
      "paragraphs": [
        "规则不是越长越可靠。把“避免错误”改成具体约束：公开接口参数保持兼容，对非法输入显式失败，不得修改本任务的验证器。每条规则旁注明靠什么检查：类型编译、调用方测试、差异审阅或权限。无法检查的口号应细化为具体情境，而不是重复强调。",
        "一项检查失败时，反馈至少包含规则、观察输入、实际结果和下一步。例子中应明确列出 src/content-backup/settings.ts 超出范围，让 AI 解释必要性或撤回关联改动；不能只输出“不合规”使任务猜测。同样也不要自动改规则迁就结果，这会让下一次失败更难发现。",
        "可以按目录组织规则，把全站共通约束放上层，领域规则靠近领域。它们需要注明适用范围和冲突处理，避免复制三份略有不同的持久化合同。具体工具怎样发现项目指令，必须核对它的官方实现；不要把任意文件名都描述成所有 Agent 自动读取。"
      ]
    },
    {
      "id": "exceptions",
      "title": "规则例外怎样保持可审查",
      "paragraphs": [
        "规则可以有合理例外，例如修正文稿需要同时更新检索注册表。例外应来自用户或适用的项目合同，并记录具体文件与原因。工具遇到门禁失败后不能自己添加“忽略此文件”把例外变成永久规则。先查这次是否已有授权，再判断改动是否是必要的依赖步骤。",
        "检查程序需要维护，但修改它与业务修复应保持证据清楚。若验证器本身有 bug，先用最小样本证明错误判定，再修复并验证原有反例仍能失败。否则“修验证器”可能实际降低标准，而没有人注意到先前保护的行为被移除。",
        "把规则编号与门禁报告关联，便于指出失败来源。不要把所有要求合成一个“质量不达标”，也不要把检查日志当作可执行指令。日志是观察结果，后续动作仍由当前任务与授权确定，这同样适用于外部构建日志中的建议。",
        "下面沿用前文的相对路径合同，在现代浏览器里比较两种失败之后的动作。错误函数把第一次拒绝的路径写进忽略名单再查一遍，于是违规数变成 0。交付函数不修改名单；只有调用前已经给出的精确路径例外可以通过，含 .. 的路径即使被写进例外名单也仍然拒绝。"
      ],
      "examples": [
        {
          "code": "function violations(paths, ignored) {\n  const found = [];\n  for (const path of paths) {\n    if (ignored.includes(path)) continue;\n    const parts = typeof path === 'string' ? path.split('/') : [''];\n    const traversal = path.startsWith('/') || path.includes('\\\\') || parts.some(part => part === '..' || part === '.' || part === '');\n    const inContent = typeof path === 'string' && path.startsWith('src/content/') && !traversal;\n    if (!inContent) found.push(path);\n  }\n  return found;\n}\nfunction bypass(paths) {\n  const first = violations(paths, []);\n  return violations(paths, first).length + ':' + first.join(',');\n}\nfunction deliver(paths, authorized) {\n  const found = [];\n  for (const path of paths) {\n    const parts = typeof path === 'string' ? path.split('/') : [''];\n    if (typeof path !== 'string' || path.startsWith('/') || path.includes('\\\\') || parts.some(part => part === '..' || part === '.' || part === '')) {\n      found.push(path);\n      continue;\n    }\n    if (authorized.includes(path) || path.startsWith('src/content/')) continue;\n    found.push(path);\n  }\n  return found.length ? 'blocked:' + found.join(',') : 'accepted';\n}\nconst changed = ['src/content/article.ts', 'src/content-backup/settings.ts'];\nconsole.log(violations(changed, []).join(','));\nconsole.log(bypass(changed));\nconsole.log(deliver(changed, []));\nconsole.log(deliver(changed, ['src/content-backup/settings.ts']));\nconsole.log(deliver(['src/content/../config.ts'], ['src/content/../config.ts']));",
          "expectedOutput": [
            "src/content-backup/settings.ts",
            "0:src/content-backup/settings.ts",
            "blocked:src/content-backup/settings.ts",
            "accepted",
            "blocked:src/content/../config.ts"
          ],
          "explanation": [
            "第一次 violations 看到 article.ts 以 src/content/ 开头且没有 ..，所以放过；content-backup 只有相同的字符串前缀，没有目录分隔后的 content 段，进入 found。此时忽略名单仍是空的。",
            "bypass 把这份 found 原样当作新的忽略名单再查一次。第二条路径被 includes 跳过，返回的违规数是 0，同时输出里仍能看到被忽略的原路径。绿色结果来自名单被本次失败改写。",
            "deliver 不接收自己刚产生的 found。授权名单为空时，备份路径被拒绝。调用方事先放入同一路径后，该精确字符串才被接受；article.ts 仍靠目录规则通过。这个 accepted 只说明例外名单与路径一致，不说明有人已经批准这次例外。",
            "最后一次把 src/content/../config.ts 同时作为输入和授权例外。函数先按 .. 段拒绝，不会走到授权名单。因此例外不能豁免父目录跳转。示例仍不解析符号链接，也不读取文件内容。"
          ]
        }
      ]
    },
    {
      "id": "drift",
      "title": "规则漂移与重复如何影响交付",
      "paragraphs": [
        "多个目录复制相同公式，时间一长就会出现不同版本；AI 读取哪一份决定它采用哪条规则。将业务合同放到一个稳定来源，让其他地方引用，能够减少冲突。流程说明只解释何时读取合同，不重新发明调度、持久化或授权公式。",
        "当规则和代码不一致时，先区分规则过时与实现偏离。若项目已经明确选择新格式，更新旧规则有依据；若只是某轮代码漏掉校验，应该修实现。不能用“保持代码一致”作为理由把错误变成新规范。版本与决策记录能够帮助判断这类差异。",
        "发布前抽样核对规则仍对应真实检查。已删除的 package script 不该继续写成必跑命令，无法自动检查的语义也不该标为机器通过。把真实能力和人工工作分开报告，可以避免规则很多、结果却缺少任何可用证据。"
      ]
    },
    {
      "id": "acceptance",
      "title": "如何验证门禁本身没有被绕过？",
      "paragraphs": [
        "先让典型错误输入确实失败，再验证合法输入可以通过。范围检查要测试同名前缀、父目录逃逸和未知文件类型；行为检查要用已知错误实现验证断言有效。门禁失败以后禁止静默继续交付，记录原因并区分环境缺失与实现错误。",
        "两个边界是检查不完整与检查被修改。范围通过不能证明文章技术内容正确；验证脚本被同一改动降低要求时，绿色结果不能作为独立证据。应审阅检查本身的差异，并在授权范围外保留可靠的基线。",
        "最后的交付说明列出实际差异、检查命令及结果、人工审阅项和未验证边界。仓库规则让工具知道期望，门禁给它及时反馈，权限限制可能影响；可靠工作需要三者合作，而不是把一份长文档当作自动保证。"
      ]
    }
  ],
  "sources": [
    {
      "title": "OpenAI：评估实践",
      "url": "https://developers.openai.com/api/docs/guides/evaluation-best-practices"
    }
  ]
};
