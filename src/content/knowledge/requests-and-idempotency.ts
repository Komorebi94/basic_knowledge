import type { Article } from "../articles";

export const requestsAndIdempotencyArticle: Article = {
  "id": "K06-02",
  "kind": "knowledge",
  "domainSlug": "networking",
  "slug": "requests-and-idempotency",
  "title": "请求状态、错误与幂等",
  "summary": "网络错误和业务错误怎么区分；何时重试。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "requests-and-idempotency",
    "请求状态、错误与幂等"
  ],
  "tags": [
    "networking"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "fetch 没有抛错，为什么操作仍失败？",
      "paragraphs": [
        "保存按钮发送请求，代码只写 try/catch，服务器返回 500 后却显示保存成功。fetch 的 Promise 是否拒绝与 HTTP 是否成功是不同层次：取得可访问的 HTTP 响应可能正常兑现，应用必须继续检查状态与正文合同。",
        "下面使用本地 Response 与确定性函数，在浏览器或支持标准 Fetch API 的 Node 环境执行，不会写真实服务器。我们把传输、HTTP、解析、业务四层分开，避免所有失败都被显示为网络异常。"
      ],
      "examples": [
        {
          "code": "const response = new Response('{\"message\":\"维护中\"}', { status: 503, headers: { 'Content-Type': 'application/json' } });\nconsole.log(response.ok);\nconsole.log(response.status);\nresponse.json().then(body => console.log(body.message));",
          "expectedOutput": [
            "false",
            "503",
            "维护中"
          ],
          "explanation": [
            "Response 已经存在，但 ok 为 false。正文解析成功也不改变 503 的含义；需要同时处理 HTTP 状态和服务端提供的安全错误信息。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "错误层次决定用户提示与恢复",
      "paragraphs": [
        "传输层失败可能包括连接问题、取消和浏览器访问限制；HTTP 层有 4xx、5xx；解析层可能收到错误格式；业务层即使 200 也可能表示操作不成立。界面应保留可恢复输入，提供对应动作，并把内部诊断与用户文案分开。",
        "取消通常表示当前结果不再需要，不能一律显示红色失败；授权失效需要登录恢复；输入校验失败需要指向字段。把这些情况都转成“请重试”会增加无意义请求，甚至重复写入。"
      ]
    },
    {
      "id": "parsing",
      "title": "检查成功响应也要校验数据",
      "paragraphs": [
        "响应类型与 body shape 属于接口合同。Content-Type 是提示而非可信保证；JSON 可以成功解析成 null 或错误结构。边界要检查必要字段，再把受信任值交给业务代码。"
      ],
      "examples": [
        {
          "code": "function readCount(value) {\n  if (typeof value !== 'object' || value === null || !Number.isInteger(value.count) || value.count < 0) {\n    throw new Error('响应不符合合同');\n  }\n  return value.count;\n}\nconsole.log(readCount({ count: 0 }));\ntry { readCount({ count: '0' }); } catch (error) { console.log(error.message); }",
          "expectedOutput": [
            "0",
            "响应不符合合同"
          ],
          "explanation": [
            "零是合法数量，不能用 if(!value.count) 判断。字符串零不满足数值合同，被边界拒绝；这防止后续计算暗中发生字符串拼接。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "idempotency",
      "title": "请求重发与操作只执行一次是两个问题",
      "paragraphs": [
        "幂等表示相同请求重复执行的预期效果与执行一次相同，并不要求每次响应内容或日志相同。PUT、DELETE 的协议语义是幂等；POST 默认没有这样的保证。网络超时无法证明服务器没有完成写入，因此盲目重试可能重复下单。"
      ],
      "examples": [
        {
          "code": "const completed = new Map();\nlet orders = 0;\nfunction createOrder(key, payload) {\n  const previous = completed.get(key);\n  if (previous) {\n    if (previous.payload !== payload) throw new Error('键被不同参数复用');\n    return previous.id;\n  }\n  const id = ++orders; completed.set(key, { payload, id }); return id;\n}\nconsole.log(createOrder('request-7', 'book'));\nconsole.log(createOrder('request-7', 'book'));\ntry { createOrder('request-7', 'pen'); } catch (error) { console.log(error.message); }",
          "expectedOutput": [
            "1",
            "1",
            "键被不同参数复用"
          ],
          "explanation": [
            "重复相同键和参数返回首次结果，没有增加订单。不同参数复用键被拒绝。这个同步内存模型没有多进程并发、事务与持久化能力，真实实现必须原子处理键和业务写入。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "failure",
      "title": "错误重试会放大故障",
      "paragraphs": [
        "重试 400 不会修复输入错误；同时重试大量客户端的 503 会给故障服务增加压力。应选择可重试类别、限制次数与总预算，尊重服务器退避信息，并采用带抖动退避。对于写操作，先确认幂等合同。",
        "按钮禁用可以减少双击，但刷新页面、多设备和代理重发仍存在。前端去重不能代替服务端幂等键；相反，服务端幂等也不能代替界面正确显示 loading、失败和可恢复状态。"
      ]
    },
    {
      "id": "boundaries",
      "title": "两条必须说明的边界",
      "paragraphs": [
        "第一条边界是 AbortController：取消客户端等待不保证服务器撤销写入。需要业务查询确认最终状态，或后端提供真正的取消协议。第二条边界是幂等键有效期：过期后重发可能被当作新操作，客户端应遵守合同并在不确定时查询。",
        "第三条边界是 HTTP 方法语义与服务端实际实现。一个名叫 PUT 的端点若每次递增余额，实际破坏幂等；代码和验收必须核实，不能只按方法名字自动重试。"
      ]
    },
    {
      "id": "application",
      "title": "把错误映射集中在接口边界",
      "paragraphs": [
        "接口层负责分类、校验和安全诊断，领域层决定是否恢复或重试，组件显示相应状态。避免每个按钮重复猜测 status 或 body.success，也不要把所有错误吞掉并返回空数组。空结果应有明确成功证据。",
        "建立失败用例：500 返回 JSON、200 返回非法结构、取消、超时但写入已完成、重复键不同参数。这样才能证明恢复合同而不是只测一次成功。",
        "完整保存流程可以这样推导：先验证本地字段，建立本次请求身份并进入加载，发送携带幂等键的写请求，检查 HTTP，再校验业务响应，最后仅由仍有效的请求更新界面。传输断开时，若服务端提供按键查询结果的端点，先确认是否成功；只有合同允许才重发相同键。失败恢复保留用户输入，而不是重新生成一个键无条件下单。",
        "幂等键也需要绑定身份与参数。在服务器上仅按一个短字符串全局去重，可能让不同租户碰到同一键，或让恶意用户读取他人结果。实际存储应明确用户或租户范围、规范化参数摘要、原子提交和过期政策。客户端只发送键不能完成这些责任；同步 Map 示例展示的是最小机制，生产必须补全并发与授权边界。",
        "验收幂等时不仅检查两次返回同一 ID，还要检查业务写入计数只增加一次。让第二次调用携带不同参数，确认它被拒绝而不是静默复用旧结果。这两个用例分别证明去重和参数绑定，缺一个都不能说明合同完整。"
      ]
    },
    {
      "id": "recall",
      "title": "对未知结果建立明确行动",
      "paragraphs": [
        "请求断开后，先问这是否写操作、是否有幂等键、是否可查询最终状态，再决定恢复动作。没有合同的自动重试应先停下，而不是增加一个循环。",
        "回忆：为什么 JSON 解析成功不能证明操作成功？为什么客户端取消不能保证订单未创建？可扩展订单模型记录请求身份，并验证同键不同参数不会新增订单。"
      ]
    }
  ],
  "sources": [
    {
      "title": "MDN：Using Fetch",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch"
    },
    {
      "title": "MDN：Idempotent",
      "url": "https://developer.mozilla.org/en-US/docs/Glossary/Idempotent"
    }
  ]
};
