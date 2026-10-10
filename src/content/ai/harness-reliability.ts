import type { Article } from "../articles";

export const harnessReliabilityArticle: Article = {
  "id": "AI19",
  "catalogId": "AI19",
  "kind": "ai",
  "slug": "harness-reliability",
  "title": "Harness：把可靠性写进环境",
  "summary": "以文章示例发布为工程案例，将规则转成隔离执行、输出比较、阶段产物和恢复记录，理解 Harness 如何提供反馈而非替代理解。",
  "aliases": [
    "harness-reliability",
    "AI19"
  ],
  "tags": [
    "AI 工程",
    "Harness：把可靠性写进环境"
  ],
  "estimatedMinutes": 20,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "同一句“先验证”，为什么每轮仍会漏掉？",
      "paragraphs": [
        "作者维护文章示例，AI 增补后声称“已经验证”，实际只检查代码可以解析，没有比较输出。我们要建立受控 Harness：读取作者维护的示例，在隔离环境执行，捕获输出并与预期比较，失败留下可恢复记录。这样可靠性依赖环境反馈，而不是反复强调同一句提示。",
        "前置知识是函数、状态与断言。本文 JavaScript 只运行预先声明的受信任函数，不执行用户上传字符串。在现代浏览器可运行；它不是用户代码沙箱，不能直接改成 eval 上传内容。"
      ]
    },
    {
      "id": "mechanism",
      "title": "Harness 连接任务、工具、证据与反馈",
      "paragraphs": [
        "Harness 是围绕工作过程提供约束和反馈的运行环境。本文把它拆成输入合同、执行范围、结果收集、判定、失败反馈与恢复。仓库规则定义需要输出比较，Harness 真正执行并产生记录；人再审查内容解释是否充分，不能把自动输出相等当作教学质量保证。",
        "一次运行先固定内容版本和案例列表，再为每例提供干净状态，执行后收集输出、错误和超时。判定通过才形成候选证据；失败记录应能定位文章、示例和观察值。环境不可用属于未运行，不属于通过。这个区分让恢复后只需补跑缺失检查，而不会误报完成。",
        "输入来源也要受控。作者样例经过仓库审阅，可以由验证脚本加载；用户代码、备份文件和外部工具输出不能自动注册成程序。隔离作者示例有助于避免污染页面，用户代码需要更强边界，按项目运行器合同实现。"
      ]
    },
    {
      "id": "wrong",
      "title": "错误 Harness：执行了就算通过",
      "paragraphs": [
        "反例把任何未抛错的函数记为 passed，根本不看输出。它会认可 2 + 2 输出 5 的错误示例。"
      ],
      "examples": [
        {
          "code": "function unsafeCheck(sample) {\n  try { sample.run(); return 'passed'; } catch { return 'failed'; }\n}\nconst sample = { expected: ['4'], run() { return ['5']; } };\nconsole.log(unsafeCheck(sample));\nconsole.log(sample.run()[0] === sample.expected[0]);",
          "expectedOutput": [
            "passed",
            "false"
          ],
          "explanation": [
            "函数返回成功，所以错误 Harness 给 passed；独立比较发现输出不一致。没有异常只证明执行没有抛出，不证明例子符合预期。",
            "如果代码是异步，未等待 Promise 还可能在执行结束前报告通过；捕获输出与等待结束都应属于明确执行合同。"
          ]
        }
      ]
    },
    {
      "id": "feedback",
      "title": "保留实际输出与失败类别",
      "paragraphs": [
        "正确本地验证器比较完整输出序列，错误时保留异常信息；它执行受信任函数，不接受字符串程序。例子让匹配、不匹配和抛错分别产生三种记录。真实环境还需要超时、进程或页面终止与污染隔离。",
        "比较器还要防止数组空槽。对 actual 调用 every 会跳过不存在的索引，只有长度检查时，new Array(1) 可能冒充一行输出。此处约定 expected 是作者维护的稠密字符串数组，从预期索引逐项检查实际数组的自有属性和值；原型上的值也不能冒充真实收集的日志。"
      ],
      "examples": [
        {
          "code": "function check(sample) {\n  try {\n    const actual = sample.run();\n    const matches = Array.isArray(actual) && actual.length === sample.expected.length &&\n      sample.expected.every((line, index) => Object.hasOwn(actual, index) && actual[index] === line);\n    return { status: matches ? 'passed' : 'mismatch', actual };\n  } catch (error) { return { status: 'error', message: error.message }; }\n}\nconsole.log(check({ expected: ['4'], run: () => ['4'] }).status);\nconsole.log(check({ expected: ['4'], run: () => ['5'] }).status);\nconsole.log(check({ expected: [], run() { throw new Error('fixture failed'); } }).status);\nconsole.log(check({ expected: ['4'], run: () => new Array(1) }).status);",
          "expectedOutput": [
            "passed",
            "mismatch",
            "error",
            "mismatch"
          ],
          "explanation": [
            "第一例逐项相等通过；第二例输出不同形成 mismatch；第三例抛出异常形成 error。反馈让下一步能区分内容预期错误与执行故障。",
            "对无序业务集合不能机械比较行顺序，需要按合同定义判据。教程日志序列通常有明确顺序，尤其讲异步队列时，忽略顺序会掩盖关键错误。",
            "稀疏数组长度虽是 1，但索引 0 不存在。检查从受信任的稠密 expected 逐项访问 actual，并要求实际索引自有存在，因此不会被 actual.every 跳过空槽而误通过；稀疏输出得到 mismatch。"
          ]
        }
      ]
    },
    {
      "id": "recovery",
      "title": "阶段产物让任务能中断后继续",
      "paragraphs": [
        "每轮保存输入版本、已运行案例、失败案例、未运行原因和修改差异。恢复时先确认内容是否变过：已变化的案例重新验证，未变且证据有效的案例可复用。不能只读“上一轮完成”摘要就跳过版本检查。",
        "反馈应该促使修复内容或环境，不能允许自动删除失败样例、关闭类型检查或把预期改成实际值。预期输出若确实写错，可以修，但要附机制解释和独立证据。Harness 的判定规则也需要审阅，否则系统可能通过改裁判而自我确认。",
        "准备发布时组合输出验证、类型与集成检查、链接检查及人工技术复核。实际项目的命令从配置确认，不在通用文章里编造。检查通过之后形成候选产物，发布动作仍按项目的授权和审核合同进行。"
      ]
    },
    {
      "id": "isolation",
      "title": "干净环境为什么属于证据条件",
      "paragraphs": [
        "两个教程示例如果共用全局变量或定时器，第二个可能依赖第一个留下的状态。验证输出正确也不能证明它独立可复制。每例用新的页面或进程，明确等待异步结束并清理资源，才能让读者复制一个片段时获得相同条件。",
        "超时与无限循环需要运行环境可终止；仅在同一线程设置计时器无法中断阻塞循环。用户代码边界应采用项目专门隔离方案，不在主页面直接执行。本文受信任函数演示反馈机制，不能被当成接受任意代码的实现。",
        "编译型示例需要记录编译配置，浏览器样例需要记录支持的 API 范围。假如把 TypeScript 当 JavaScript 执行失败，那是环境错误，不是文章结论错误。Harness 应给这种失败明确分类，避免作者为了过检删掉类型信息。"
      ]
    },
    {
      "id": "artifacts",
      "title": "阶段证据怎样支持恢复和审阅",
      "paragraphs": [
        "运行记录绑定内容与检查版本，保留实际输出、预期、环境和结束状态。只保存 passed 布尔值不足以调查以后差异。对于异步例子，输出顺序、执行错误与取消状态都可能影响结论，应按照案例合同记录必要字段。",
        "失败反馈可以让工具自主修复可逆问题，例如代码拼写或确实错误的预期；涉及扩大权限、删除数据或改发布标准时，要回到当前授权。恢复任务不自动包含新的外部动作。环境负责约束能力，任务负责限定目的，阶段记录负责证明已发生什么。",
        "验证器自身要有小而有意义的错误样本：输出缺行、顺序错、抛错与未结束。保持这些反例能够防止未来优化把判定削弱成仅检查退出码。检查可靠性也是系统的一部分，而不是因为它叫 Harness 就无需审查。",
        "恢复记录必须区分执行失败与完全没有执行。运行器无法启动时，没有实际输出，不能用空数组与预期空数组相等判为成功。先证明执行真正开始并结束，再比较观察结果，这个阶段条件需要写进环境合同与失败反馈。"
      ]
    },
    {
      "id": "boundaries",
      "title": "环境反馈不能代替哪些判断？",
      "paragraphs": [
        "两个边界是语义与执行环境。样例输出相等不能证明解释正确，更不能证明内容覆盖失败边界；浏览器结果不等于 Node 特有 API 的结果。每个案例注明环境，跨环境结论需要分别核对。",
        "Harness 还可能引入维护成本：隔离页面生命周期、编译器版本、超时和输出格式都需要明确。小任务用现有检查即可，不必为了一个文案修改搭完整平台；反复出现的高风险缺口才值得转成稳定反馈机制。",
        "交付说明应报告哪些例子真实跑过、输出比较结果、工具环境和剩余人工审核。官方 Skills evals 方法强调任务、运行记录和检查可比较；本文本地 Harness 是对应这些目标的一种具体实现模型，不声称某产品自动替你完成全部阶段。"
      ]
    }
  ],
  "sources": [
    {
      "title": "OpenAI：用 Evals 系统验证 Skills",
      "url": "https://developers.openai.com/blog/eval-skills"
    }
  ]
};
