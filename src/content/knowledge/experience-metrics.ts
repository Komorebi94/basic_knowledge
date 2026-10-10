import type { Article } from "../articles";

export const experienceMetricsArticle: Article = {
  "id": "K10-01",
  "kind": "knowledge",
  "domainSlug": "performance",
  "slug": "experience-metrics",
  "title": "体验指标与测量方法",
  "summary": "实验室/真实用户数据怎样互补；LCP、INP、CLS 衡量什么。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "experience-metrics",
    "体验指标与测量方法"
  ],
  "tags": [
    "performance"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "本地跑得快，用户为什么仍然觉得慢？",
      "paragraphs": [
        "工程师在高性能桌面和已缓存资源上打开页面，结果优秀；真实用户从移动网络首次进入，关键图片晚到，按钮点击还被长任务阻塞。性能不是一个总分，它包含加载、交互与视觉稳定等不同体验。",
        "本文数据样例是确定性的虚拟测量集，不冒充本项目真实用户数据。浏览器 Performance 计时仅证明代码阶段测量。要评价站点需合法收集真实访问证据，并与可控实验互相解释。"
      ],
      "examples": [
        {
          "code": "const milliseconds = [120, 150, 180, 220, 400, 900, 1200, 2400];\nconst sorted = [...milliseconds].sort((a, b) => a - b);\nconst rank = Math.ceil(sorted.length * 0.75) - 1;\nconsole.log(sorted[rank]);\nconsole.log(milliseconds.reduce((sum, value) => sum + value, 0) / milliseconds.length);",
          "expectedOutput": [
            "900",
            "696.25"
          ],
          "explanation": [
            "示例采用 nearest-rank 的 75 分位为第六项 900，平均数为 696.25。分位数强调部分较慢体验，与平均值不同；样本很小且虚拟，不能据此判断真实站点质量。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "三个指标分别回答三个问题",
      "paragraphs": [
        "LCP 关注视口里主要内容何时呈现；INP 关注页面交互到下一次绘制的响应延迟，包含输入等待、处理和呈现；CLS 关注意外布局偏移的视觉稳定。一个改善不会自动证明其他两个也改善。",
        "指标有具体收集算法与生命周期，不能把 performance.now 包住一个函数的时间称作 INP，也不能把 load 事件时间称作 LCP。工程上应使用经过验证的指标采集库和平台记录，内部函数计时用于定位机制。"
      ]
    },
    {
      "id": "lab-field",
      "title": "实验室与真实数据互补",
      "paragraphs": [
        "实验室测试可固定设备、网络、缓存和动作，适合复现与比较；真实数据涵盖多样设备、区域、页面和交互，但受样本、采集和隐私条件影响。实验室优秀而真实数据差时，要按用户分组找条件差异，而不是任意舍弃一边。"
      ],
      "examples": [
        {
          "code": "const visits = [{ device: 'mobile', lcp: 3200 }, { device: 'desktop', lcp: 1100 }, { device: 'mobile', lcp: 2800 }];\nconst mobile = visits.filter(visit => visit.device === 'mobile');\nconsole.log(mobile.length);\nconsole.log(mobile.reduce((sum, visit) => sum + visit.lcp, 0) / mobile.length);",
          "expectedOutput": [
            "2",
            "3000"
          ],
          "explanation": [
            "移动组平均 3000ms。全体平均可能被桌面快样本稀释，所以分组帮助定位。分组数量太小同样不可靠，真实分析需报告样本量和时间窗口。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "measurement",
      "title": "从用户动作建立测量边界",
      "paragraphs": [
        "明确要优化首次内容出现、筛选点击还是长页面滚动，再记录相应入口、结束条件和运行条件。使用 User Timing 为业务阶段打点，可以把数据处理与 DOM 更新关联到 Performance 轨迹，但它仍不是完整体验指标。"
      ],
      "examples": [
        {
          "code": "performance.mark('demo-start');\nconst sum = [1, 2, 3].reduce((value, item) => value + item, 0);\nperformance.mark('demo-end');\nperformance.measure('demo-work', 'demo-start', 'demo-end');\nconst entry = performance.getEntriesByName('demo-work', 'measure')[0];\nconsole.log(sum);\nconsole.log(entry.duration >= 0);\nperformance.clearMarks('demo-start'); performance.clearMarks('demo-end'); performance.clearMeasures('demo-work');",
          "expectedOutput": [
            "6",
            "true"
          ],
          "explanation": [
            "计算结果为 6，measure 得到该段经历时间。没有断言它小于某个毫秒值，因为调度和设备使耗时不稳定；业务标记用于关联证据，不是跨机器固定性能保证。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "错误优化：只追逐平均值和总分",
      "paragraphs": [
        "如果大部分访问很快而低端设备极慢，平均数可能掩盖尾部。只缩小一个 bundle 也可能无效：瓶颈也许是图片发现晚、同步解析或布局。先找影响目标指标的路径，再改变它。",
        "用较快网络重跑，看到分数提高后称优化成功，是改变测试条件。应保留前后版本、条件与多次结果；同时验证错误率、功能正确性和其他指标，避免把成本转移到后续交互。"
      ]
    },
    {
      "id": "boundaries",
      "title": "两条解释数据的边界",
      "paragraphs": [
        "第一条边界是访问生命周期：SPA 路由切换、后台标签和用户无交互等情况影响指标解释。不能用一个首屏值代表整个会话。第二条边界是因果：上线同时改了资源、服务和采样，指标变好不一定来自某个单独改动。",
        "第三条边界是采集范围。不要上报输入内容、令牌或精确个人标识来定位性能；优先页面类型、设备等级与安全的聚合信息，并遵守数据收集合同。"
      ]
    },
    {
      "id": "application",
      "title": "制定目标与守护条件",
      "paragraphs": [
        "按真实用户核心路径设置目标，先建立基线，再选择一个瓶颈进行可解释改动。守护条件包括业务结果、错误率与稳定性，性能收益不能以功能损坏换取。",
        "常用指标阈值会演进，内部目标应记录定义与来源日期。团队可以设更严格的业务预算，但要说明它是项目决策，不能当成规范要求。",
        "例如商品页的 LCP 很慢，记录显示主图请求在脚本执行完成后才发现，而下载速度本身正常。这时把主图放入初始结构或合理提前发现，可能直接缩短关键路径；压缩一个无关页脚脚本则未必有效。若同一页面 INP 也差，需要另看点击筛选后的任务与绘制，不能拿 LCP 的改进证据覆盖交互问题。",
        "CLS 排查同样要落到具体位移：图片没有预留尺寸、广告晚插入或字体替换都可能改变可见内容位置。优先建立稳定的空间合同，而不是延迟所有内容直到资源齐全，因为后者可能改善稳定性却损害加载。一次优化要同时观察目标指标与其他体验维度，记录权衡依据。",
        "真实数据的时间窗口应与发布相联系。新版本流量尚少时，不宜与旧版本的大样本直接比较；可按版本、页面类型和相似用户条件分析，说明缺失采样与不确定性。固定百分位算法、单位和过滤规则，让同一指标前后可比较。把秒和毫秒混在一起，会产生比测量噪声更严重的误判。",
        "性能记录的单位应固定，例如内部统一使用毫秒，显示层再转换成秒。每份对比保留采样数量和设备条件，缺少这些字段时只报告观察，不将单次快慢推断成全体用户收益。"
      ]
    },
    {
      "id": "recall",
      "title": "把慢拆成一个可检验问题",
      "paragraphs": [
        "描述慢的是哪个动作、哪个人群、哪条阶段链。收集可对照记录，提出一个能被证据支持或否定的原因，再决定改动。",
        "回忆：为何实验室与真实数据可能不同？为何计时一个事件处理函数不足以得到 INP？可给分组数据加网络类型，观察同设备不同网络是否应分开分析。"
      ]
    }
  ],
  "sources": [
    {
      "title": "web.dev：Web Vitals",
      "url": "https://web.dev/articles/vitals"
    },
    {
      "title": "MDN：User Timing",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/User_timing"
    }
  ]
};
