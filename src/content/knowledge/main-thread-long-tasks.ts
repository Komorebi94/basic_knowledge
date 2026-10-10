import type { Article } from "../articles";

export const mainThreadLongTasksArticle: Article = {
  "id": "K10-02",
  "kind": "knowledge",
  "domainSlug": "performance",
  "slug": "main-thread-long-tasks",
  "title": "主线程、长任务与交互响应",
  "summary": "如何找出耗时工作并验证拆分效果。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "main-thread-long-tasks",
    "主线程、长任务与交互响应"
  ],
  "tags": [
    "performance"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "接口已经返回，按钮为什么还要等？",
      "paragraphs": [
        "收到大列表后，主线程同步做排序、格式化和创建大量 DOM。这段任务未结束时，用户输入只能等待处理；网络已经完成并不保证界面可响应。要改善交互，应先找到占用主线程的工作，再决定减少、拆分或移到其他线程。",
        "本文示例使用少量数据验证顺序与结果，不制造卡死页面，也不把任意阈值当作实测。任务耗时与设备有关，真正长任务需由 Performance 记录证明。调度 API 还要检查目标浏览器支持。"
      ],
      "examples": [
        {
          "code": "console.log('开始');\nsetTimeout(() => console.log('输入机会'), 0);\nlet total = 0; for (let index = 0; index < 100; index++) total += index;\nconsole.log(total);\nconsole.log('结束');",
          "expectedOutput": [
            "开始",
            "4950",
            "结束",
            "输入机会"
          ],
          "explanation": [
            "同步循环在当前任务内完成，计时器即使零延迟也不能打断它。100 次不构成性能问题，例子只证明执行边界；真实大规模工作会使等待可见。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "主线程承担脚本与关键呈现工作",
      "paragraphs": [
        "事件处理、许多 DOM 操作、样式布局与绘制相关工作需要主线程协调。一段长脚本会推迟后续输入任务和呈现机会。优化的目标是减少用户等待与保持正确结果，而不只是让某个函数报告时间变短。",
        "常用长任务定义关注超过 50ms 的任务，但这个诊断阈值不意味着 49ms 就总是良好，也不意味着每个长任务都由你的脚本造成。根据真实交互轨迹找等待、处理与呈现成本，并区分第三方与自身责任。"
      ]
    },
    {
      "id": "yield",
      "title": "微任务不等于让浏览器处理下一任务",
      "paragraphs": [
        "await Promise.resolve() 让续体进入微任务，可能仍在浏览器获得输入或绘制机会前继续执行。循环不断排微任务并不能可靠分割长任务。要让出任务边界，可使用受支持的 scheduler.yield 或适当任务调度；降级方案与时机仍有差异。"
      ],
      "examples": [
        {
          "code": "console.log('同步');\nsetTimeout(() => console.log('任务'), 0);\nPromise.resolve().then(() => console.log('微任务1')).then(() => console.log('微任务2'));",
          "expectedOutput": [
            "同步",
            "微任务1",
            "微任务2",
            "任务"
          ],
          "explanation": [
            "当前同步代码结束后先清空微任务，再执行计时器任务。链式 Promise 可以把很多工作留在同一轮微任务检查中，不能据此保证输入已被处理。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "chunking",
      "title": "拆分计算要保留顺序与取消合同",
      "paragraphs": [
        "下面把纯加总拆成固定数量批次，每批结束后通过计时器创建任务边界。它只是完整的降级调度演示，不保证固定帧率；实际批次应根据工作量与预算调整，还要检查取消或过期身份。"
      ],
      "examples": [
        {
          "code": "function sumChunks(values, batchSize) {\n  return new Promise(resolve => {\n    let index = 0, total = 0;\n    function step() {\n      const end = Math.min(index + batchSize, values.length);\n      while (index < end) total += values[index++];\n      if (index < values.length) setTimeout(step, 0); else resolve(total);\n    }\n    step();\n  });\n}\nsumChunks([1, 2, 3, 4], 2).then(total => console.log(total));\nconsole.log('可以处理其他任务');",
          "expectedOutput": [
            "可以处理其他任务",
            "10"
          ],
          "explanation": [
            "第一批同步处理 1 和 2，然后排下一任务，外层先打印。下一批处理 3 和 4 后兑现，合计 10。示例未提供取消；真实组件卸载或新查询到来时要防止旧计算提交。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "错误拆分会增加开销或破坏语义",
      "paragraphs": [
        "每处理一个极小元素都让出一次，可能比原来的总计算更慢。批次过大又不会改善响应，应从轨迹与输入规模决定。数组被外部修改、批次中多次重复排序等问题也会破坏结果；要固定输入或定义可变输入合同。",
        "只把计算移入 requestAnimationFrame，若回调仍执行很久，会直接延迟该帧。rAF 适合协调有限的视觉写入，不是重 CPU 工作的通用后台线程。省掉必要校验虽缩短时间，却不属于正确优化。"
      ]
    },
    {
      "id": "workers",
      "title": "Worker 把纯计算移出主线程，但有通信成本",
      "paragraphs": [
        "大量解析、搜索或图像计算可能适合 Worker，DOM 仍属于主页面责任。输入输出要明确序列化或 transferable 所有权，线程间传输大对象本身有成本。将轻量运算移到 Worker 不一定获益。",
        "Worker 结果也可能乱序。每个任务携带身份，页面只接受当前有效结果；终止 Worker 或取消任务负责资源，而身份校验负责防旧结果。错误与重新启动应有界面恢复路径。"
      ]
    },
    {
      "id": "boundaries",
      "title": "两条拆分的实质边界",
      "paragraphs": [
        "第一条边界是原子操作：某些库函数一次调用就占用很久，外部切片无法打断内部执行，需要换算法、接口或 Worker。第二条边界是共享状态：让出后其他任务可修改状态，原本同步假设不再成立，必须检查输入快照和提交条件。",
        "第三条边界是后台标签。计时器可能被节流，批次不保证按预想频率执行。不要把调度间隔用于精确业务计时，持续时间应基于真实时钟与合同。",
        "例如搜索每次按键都对一万条记录做字符串归一化，先考虑把不变的归一化结果预计算并缓存，再用合适索引减少遍历。若仍必须进行大量计算，可以保存本次查询快照，按批计算，每次让出后检查是否被新查询替代。最终提交还要核对身份，避免较慢旧计算覆盖新结果。减少重复工作通常比单纯把它拆成很多任务收益更稳。",
        "决定批次大小时关注的是最重元素而非平均元素数。某一条记录包含巨大文本，固定每批一百条仍可能长时间阻塞；可以改用时间预算并处理单项极端值，或选支持分段的算法。若单项操作不可打断，时间预算检查也只能在它之后发生，这时需要改变实现或使用 Worker。必须说明这种最坏路径，不能承诺任何输入都保持顺畅。",
        "验收拆分方案时同时记录第一次反馈和最终完成时刻。更早反馈但总耗时略长可能是合理取舍，应让进度与取消保持可用；若任务很小，直接同步执行更清楚，额外调度反而增加复杂度。"
      ]
    },
    {
      "id": "recall",
      "title": "先减少工作，再安排工作",
      "paragraphs": [
        "检查重复计算、数据结构和不必要 DOM；若必须执行，选择批处理或 Worker，并保留结果、取消和错误合同。测量优化前后输入等待与整体完成时间，二者可能存在取舍。",
        "回忆：为什么 Promise 微任务不能可靠让出主线程？为什么拆分后需要重新考虑共享状态？可在加总函数外修改原数组，解释应如何固定输入才能保证确定结果。"
      ]
    }
  ],
  "sources": [
    {
      "title": "web.dev：Optimize long tasks",
      "url": "https://web.dev/articles/optimize-long-tasks"
    },
    {
      "title": "MDN：Scheduler.yield",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield"
    },
    {
      "title": "MDN：Using Web Workers",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers"
    }
  ]
};
