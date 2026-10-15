import type { Article } from "../articles";

export const ciCdReleaseArticle: Article = {
  "id": "K09-08",
  "kind": "knowledge",
  "domainSlug": "tooling",
  "slug": "ci-cd-and-release-strategies",
  "title": "CI/CD 与发布策略",
  "summary": "从失败门禁和旧流水线覆盖新版本出发，验证构建产物身份、发布顺序与灰度决策，说明持续交付和可恢复发布的边界。",
  "aliases": [
    "CI/CD",
    "deployment",
    "发布",
    "灰度",
    "回滚"
  ],
  "tags": [
    "工程化",
    "CI/CD 与发布策略"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-13",
  "sections": [
    {
      "id": "problem",
      "title": "检查全绿之后，为什么仍可能发布错版本？",
      "paragraphs": [
        "团队把测试、构建和部署拆成独立作业，部署拿到一次重新构建的文件；另一次慢流水线在新版本上线后才结束，覆盖了新入口。全绿只说明各自检查通过，不能证明上线的是被检查的同一份产物，更不能证明完成顺序等于版本顺序。",
        "本篇接续 K09-02 的锁文件、K09-05 的资源图与 K09-06 的任务依赖。持续集成负责尽早核对变更，持续交付保持可发布产物，自动部署还需要环境、权限、版本切换与恢复合同。以下发布算法均为明确教学模型，不连接 CI 或生产环境。"
      ]
    },
    {
      "id": "environment",
      "title": "复现环境：固定作者源码、临时产物与明确的验证范围",
      "paragraphs": [
        "运行 npm run verify:k09，逐一执行整个专题的作者示例。Node 代码块使用独立 ES 模块进程，浏览器代码块使用隔离空白页；不要在主站控制台执行。Node 示例可保存到仓库根目录的 mjs 文件后用 node 运行，保持相对 import 路径。",
        "真实工具实验使用仓库已安装 Rolldown 1.2.11、TypeScript 6.0.3 与 Node 22；scripts/lib/tooling-fixture.mjs 提供 bundle、runChunks 和 withFiles：只构建固定作者模块，在临时目录运行产物并于结束后清理。辅助源码和复现说明见仓库 docs/verification/tooling-harness.md；不安装未知包、不执行第三方安装脚本或用户输入。",
        "工具输出随版本与配置变化，本文只核对声明的行为与边界，不保证固定文件数量适用于所有项目，也不将教学计数换算成性能提升。关于发布与缓存的模型会明确标注，未调用真实 CI、CDN、监控账户或生产部署。"
      ]
    },
    {
      "id": "gates",
      "title": "失败的前置检查阻止发布，而不是只留下红色日志",
      "paragraphs": [
        "下面顺序模型把 typecheck、lint、build 和 publish 的依赖显式表示。预期 失败轨迹:typecheck,lint、失败未发布:true、成功轨迹:typecheck,lint,build,publish。真实仓库可并行做独立检查，但 publish 仍必须依赖全部需要的门禁和产物。",
        "命令名是教学标签，实际检查由本仓库 npm run typecheck、npm run lint、npm run build 运行。不能把模型通过当成这些命令通过，也不能把构建成功当成行为、权限或兼容性检查成功。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "async function pipeline(failing) {\n  const trace = []; let published = false;\n  try {\n    for (const task of ['typecheck', 'lint', 'build', 'publish']) {\n      trace.push(task);\n      if (task === failing) throw new Error(task + ' failed');\n      if (task === 'publish') published = true;\n    }\n    return { trace, published };\n  } catch (reason) { return { trace, published, error: reason.message }; }\n}\nconst failure = await pipeline('lint');\nconsole.log('失败轨迹:' + failure.trace.join(','));\nconsole.log('失败未发布:' + !failure.published);\nconsole.log('成功轨迹:' + (await pipeline()).trace.join(','));",
          "expectedOutput": [
            "失败轨迹:typecheck,lint",
            "失败未发布:true",
            "成功轨迹:typecheck,lint,build,publish"
          ],
          "explanation": [
            "lint 抛错使模型退出，不会继续 build 或 publish；成功路径才进入最后一步。真实流水线的条件与依赖需要保持这个责任，不能 always 部署或吞掉失败状态。",
            "失败返回包含原因供状态展示与恢复，不能把返回对象误当成功。重跑应从可信输入和明确失败阶段进行，部署要避免部分成功后重复产生副作用。"
          ]
        }
      ]
    },
    {
      "id": "artifacts",
      "title": "一次构建、同一份产物晋级，环境配置另有边界",
      "paragraphs": [
        "下面真实计算固定产物字节的 SHA-256，比较测试环境与生产环境选中的身份，以及重新构建变化后的身份。预期 同产物晋级:true、重建已变化:true。它验证字节身份，不调用真实制品库。",
        "锁文件配合 npm ci 固定安装依赖解析输入，仍需记录 Node、平台、工具、配置与有效环境输入。测试后换构建参数或重新生成资源会改变验证对象。环境配置如果注入前端产物就不是秘密存储，访问凭证应由有权限的服务器或 CI 环境持有，不写进公开 bundle。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { createHash } from 'node:crypto';\nconst identify = bytes => createHash('sha256').update(bytes).digest('hex');\nconst artifact = { bytes: 'AUTHOR_BUILD_R1' };\nconst staging = identify(artifact.bytes);\nconst production = identify(artifact.bytes);\nconsole.log('同产物晋级:' + (staging === production));\nconsole.log('重建已变化:' + (staging !== identify('AUTHOR_BUILD_R1_CHANGED_CONFIG')));",
          "expectedOutput": [
            "同产物晋级:true",
            "重建已变化:true"
          ],
          "explanation": [
            "同一字节在两个阶段产生相同摘要，重新生成不同字节则不同。晋级应引用同一不可变产物，而不是在生产阶段重新执行一套未验证构建。",
            "摘要不是签名，攻击者可同时替换产物与摘要；可信流水线、权限、来源和留存也要校验。不同环境确需不同构建时，分别检查实际部署产物，不能宣称两者已用同一次验证覆盖。"
          ]
        }
      ]
    },
    {
      "id": "concurrency",
      "title": "较慢的旧发布不能覆盖较新的发布意图",
      "paragraphs": [
        "下面用发布代次与条件提交模型复现乱序完成。启动旧任务，再启动新任务；新任务先提交，旧任务之后被拒绝。回滚作为新发布意图获得新代次。预期 新发布:true、旧发布拒绝:true、当前:r2、回滚新意图:true:r1。",
        "这是发布状态模型，不是 GitHub API。真实 Actions concurrency 可以限制同组作业的并发，但不应依靠作业开始顺序推断部署顺序；取消旧作业也无法撤销已发送的外部写入。部署目标仍需版本门禁、幂等切换或等价机制。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "let generation = 0;\nlet current = 'r0';\nfunction begin(artifact) { return { generation: ++generation, artifact }; }\nfunction commit(ticket) {\n  if (ticket.generation !== generation) return false;\n  current = ticket.artifact;\n  return true;\n}\nconst old = begin('r1'), next = begin('r2');\nconsole.log('新发布:' + commit(next));\nconsole.log('旧发布拒绝:' + !commit(old));\nconsole.log('当前:' + current);\nconst rollback = begin('r1');\nconsole.log('回滚新意图:' + commit(rollback) + ':' + current);",
          "expectedOutput": [
            "新发布:true",
            "旧发布拒绝:true",
            "当前:r2",
            "回滚新意图:true:r1"
          ],
          "explanation": [
            "新任务获得更高代次，提交后旧代次即使晚完成也无法覆盖。回滚不是放开旧任务，而是明确的新意图，接受同样的并发约束。",
            "真实跨进程条件提交需要存储的原子比较或部署系统保障，内存计数不提供分布式原子性。此模型还未处理重复提交、权限与存储故障，不能直接当生产部署器使用。"
          ]
        }
      ]
    },
    {
      "id": "canary",
      "title": "灰度需要可解释信号，样本不足不能当成功",
      "paragraphs": [
        "下面是固定作者阈值的灰度模型：至少 100 次请求才判断，错误率超过 5% 回滚，其他合格数据可晋级；无效计数拒绝。预期 小样本:hold、退化:rollback、稳定:promote、无效:invalid。阈值仅供教学，不能当行业默认值。",
        "真实观察需与基线、路由、地区、版本和时间窗口对比，并包含关键业务成功率与恢复指标。零错误的小样本不是稳定证明；一个全站平均数也可能掩盖某条付款路径完全失败。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "function decide({ requests, errors }) {\n  if (!Number.isSafeInteger(requests) || !Number.isSafeInteger(errors) || requests < 0 || errors < 0 || errors > requests) return 'invalid';\n  if (requests < 100) return 'hold';\n  return errors / requests > 0.05 ? 'rollback' : 'promote';\n}\nconsole.log('小样本:' + decide({ requests: 5, errors: 0 }));\nconsole.log('退化:' + decide({ requests: 100, errors: 6 }));\nconsole.log('稳定:' + decide({ requests: 100, errors: 2 }));\nconsole.log('无效:' + decide({ requests: 0, errors: 1 }));",
          "expectedOutput": [
            "小样本:hold",
            "退化:rollback",
            "稳定:promote",
            "无效:invalid"
          ],
          "explanation": [
            "先验证计数，再判断样本量，避免除零和把不可信指标当正常。6/100 超过示例阈值，2/100 没有超过，但模型只对这些合成计数负责。",
            "监控缺失、采样变化与流量结构变化也需要阻止盲目晋级。回滚动作应验证可执行性和数据兼容，不能只由一个字符串结果直接驱动生产。"
          ]
        }
      ]
    },
    {
      "id": "release",
      "title": "先准备资源图，再切入口，回滚也要保留依赖",
      "paragraphs": [
        "发布先准备完整的新资源图和映射证据，再验证资源路径、MIME 与入口可访问，最后切换用户入口。按旧会话寿命保留旧图；否则回滚 HTML 也可能指向已经删除的 chunk。发布记录应关联提交、产物、配置、map、目标环境和执行结果。",
        "前端资源切换不等于数据迁移回滚。删除列、改变持久化格式或外部写入可能不可逆，滚动升级常需先扩展兼容读取、再迁移、最后收缩旧合同。回退应用版本之前核对新旧应用对当前数据的兼容，不把重新部署旧文件当成万能恢复。"
      ]
    },
    {
      "id": "boundaries",
      "title": "自动化的责任包括权限、失败状态与恢复证据",
      "paragraphs": [
        "CI 来自外部贡献的代码应按相应信任边界运行，生产写入权限与秘密不无条件暴露给任意检查任务。环境审批是部署策略的一个选项，是否需要由团队合同决定；本篇不创建审批或真实发布流程。",
        "持续交付可以止于可验证、可发布的产物，自动部署则需额外的目标授权和运行期检查。蓝绿、滚动、灰度没有统一最佳方案：选择取决于状态、兼容窗口、容量和流量切换能力。",
        "本篇验证作者状态模型与真实字节摘要，没有运行 GitHub Actions、真实灰度流量或生产回滚。仓库实际质量门禁会单独执行并留下结果，两种证据不能混淆。"
      ]
    },
    {
      "id": "practice",
      "title": "把失败门禁、乱序发布与回滚一起写成验收条件",
      "paragraphs": [
        "让 build 失败并验证 publish 不触发；让旧任务晚完成并验证新版本保留；让监控样本不足保持 hold，再确认回滚能取得完整旧图且兼容当前数据。为部署状态补成功、失败、取消和恢复证据，避免只看最终绿灯。",
        "本主题暂无独立已开放部署题。练习先在本地作者模型完成，不使用真实生产权限；实际仓库 CI 接入需另行确定目标环境、制品保存和团队发布合同。"
      ]
    }
  ],
  "sources": [
    {
      "title": "GitHub：Deploying with Actions",
      "url": "https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments"
    },
    {
      "title": "GitHub：Workflow concurrency",
      "url": "https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency"
    },
    {
      "title": "npm：npm ci",
      "url": "https://docs.npmjs.com/cli/commands/npm-ci"
    }
  ]
};
