import type { Article } from "../articles";

export const streamingExperienceArticle: Article = {
  "id": "AI14",
  "catalogId": "AI14",
  "kind": "ai",
  "slug": "streaming-experience",
  "title": "AI 应用中的流式体验",
  "summary": "通过本地字节流和交错请求理解UTF-8、SSE事件边界、取消、断流与结构化完成；设计不会混合新旧草稿的恢复行为。",
  "aliases": [
    "AI14",
    "streaming-experience",
    "SSE",
    "server-sent events",
    "流式输出"
  ],
  "tags": [
    "AI 工程",
    "AI 应用中的流式体验"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-09",
  "sections": [
    {
      "id": "problem",
      "title": "文字已经显示，为什么还不能算回答完成？",
      "paragraphs": [
        "退款助手一边生成一边显示，网络断开后屏幕留下“标准订单可以退款”，用户却看见绿色完成标记；重新尝试还把新稿追加到旧句后面。另一轮请求更晚开始，却被上轮迟到事件覆盖。这三个故障分别属于完成合同、重试身份和异步写入权限。",
        "本文以浏览器fetch消费SSE样式事件为工作案例。前置概念是Promise、ReadableStream、AbortController和JSON校验。所有例子使用本地Response与模拟事件，不联系模型服务；在支持这些Web API的现代浏览器可独立运行。"
      ]
    },
    {
      "id": "protocol",
      "title": "传输结束、事件完整与业务完成是三件事",
      "paragraphs": [
        "fetch成功拿到Response时，响应体可能仍在读取；reader.read返回done说明字节流结束，不保证服务端完成业务。应用必须定义明确的final事件并检查其结构，不能把连接关闭等同于完整答案。收到final后才能提交稳定结果；收到错误事件或缺final的EOF则标为失败或中断。",
        "SSE事件以文本行组成，空行分隔事件，多个data行用换行连接。UTF-8字符可能跨网络片段，CRLF也可能跨片段，一个片段还可能包含多个事件。不能对每个Uint8Array单独new TextDecoder再按双换行分割。",
        "原生EventSource提供专门的SSE接口和重连行为；fetch更便于本例携带POST请求体及AbortSignal，却需要应用自己处理字节流、事件协议与重试。两者并非可任意替换：服务端接口、认证方式、跨域策略和恢复合同决定选择，浏览器包中也不放服务端密钥。"
      ]
    },
    {
      "id": "wrong",
      "title": "错误实现为什么在本地顺畅、上线就乱码？",
      "paragraphs": [
        "错误做法是在每次read后独立解码并直接JSON.parse文本。网络若恰好按事件发送，测试会通过；代理缓冲或慢网把一个汉字、一个JSON字段拆成两次read，就出现替换字符或语法错误。反过来一次read含两个事件时也不能把整片当一个JSON。",
        "下面故意将整个响应拆成逐字节片段，并使用CRLF和LF混合、注释、多个data行及末尾未完整事件。这个场景能揭示边界错误，比只用一次enqueue完整字符串更有证明力。"
      ]
    },
    {
      "id": "decoder",
      "title": "先恢复字符，再按行组装事件",
      "paragraphs": [
        "实现保留decoder、当前行和事件data三个状态。解码器在stream:true时保存未完成字节；行解析器记住刚遇到CR，吞掉其后可选LF；空行才派发完整事件。EOF时flush解码器，但不派发尚缺空行的事件。",
        "readEvents同样可接收fetch返回的Response：先核对HTTP状态、响应体及媒体类型，再读取。fetch应传入同一个signal，让取消能中止等待中的网络read；这个函数的signal检查负责在read前后拒绝继续处理，不单独保证任意自定义无限流的read被唤醒。",
        "finally里的cancel属于释放未结束流的清理步骤；若流已出错，cancel也可能拒绝。本例不让二次清理错误覆盖最初的读取、取消或协议错误，随后仍释放reader锁。生产日志应分别保留原始失败与清理失败的类别，不能把这个局部处理扩展成静默吞掉整个读取错误。"
      ],
      "examples": [
        {
          "code": "function createParser(onEvent) {\n  let line = '', skipLF = false, type = 'message', data = [];\n  function acceptLine(value) {\n    if (value === '') {\n      if (data.length) onEvent({ type, data: data.join('\\n') });\n      type = 'message'; data = []; return;\n    }\n    if (value.startsWith(':')) return;\n    const colon = value.indexOf(':');\n    const field = colon < 0 ? value : value.slice(0, colon);\n    let valuePart = colon < 0 ? '' : value.slice(colon + 1);\n    if (valuePart.startsWith(' ')) valuePart = valuePart.slice(1);\n    if (field === 'event') type = valuePart || 'message';\n    if (field === 'data') data.push(valuePart);\n  }\n  return {\n    push(text) {\n      for (const char of text) {\n        if (skipLF) { skipLF = false; if (char === '\\n') continue; }\n        if (char === '\\r' || char === '\\n') {\n          acceptLine(line); line = ''; skipLF = char === '\\r';\n        } else line += char;\n      }\n    },\n    end() { line = ''; data = []; type = 'message'; }\n  };\n}\nasync function readEvents(response, onEvent, signal) {\n  if (!response.ok || !response.body) throw new Error('HTTP or body unavailable');\n  const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();\n  if (mime !== 'text/event-stream') throw new Error('Unexpected content type');\n  const reader = response.body.getReader();\n  const decoder = new TextDecoder('utf-8', { fatal: true });\n  const parser = createParser(onEvent);\n  let ended = false;\n  try {\n    while (true) {\n      signal?.throwIfAborted();\n      const item = await reader.read();\n      signal?.throwIfAborted();\n      if (item.done) { parser.push(decoder.decode()); parser.end(); ended = true; break; }\n      parser.push(decoder.decode(item.value, { stream: true }));\n    }\n  } finally {\n    if (!ended) await reader.cancel().catch(() => {});\n    reader.releaseLock();\n  }\n}\nconst wire = ': heartbeat\\r\\nevent: delta\\r\\ndata: 中\\r\\ndata: 文\\r\\n\\r\\nevent: final\\ndata: {\"answer\":\"中文\",\"complete\":true}\\n\\ndata: 未结束';\nconst bytes = new TextEncoder().encode(wire);\nconst body = new ReadableStream({ start(controller) {\n  for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));\n  controller.close();\n} });\nconst seen = [];\nawait readEvents(new Response(body, { headers: { 'content-type': 'text/event-stream' } }), event => seen.push(event));\nconsole.log(seen.length);\nconsole.log(seen[0].type);\nconsole.log(JSON.stringify(seen[0].data));\nconsole.log(JSON.parse(seen[1].data).complete);",
          "expectedOutput": [
            "2",
            "delta",
            "\"中\\n文\"",
            "true"
          ],
          "explanation": [
            "UTF-8的“中”占多个字节，逐字节网络片段先经有状态decoder组合，再交给SSE按行解析；传输块、字符和事件三个边界完全不同。",
            "CR后立即结束一行并记skipLF，下一片中的LF不会再制造空行；两个data行用换行连接。空行才派发事件，最后没有空行的“未结束”在EOF丢弃。",
            "示例仅处理event/data和注释，不提供EventSource的id/retry及自动重连；fatal:true是本合同对非法UTF-8的严格拒绝策略，原生SSE默认的解码行为不同。生产还需限制行长、事件长度、累计输出和总耗时。"
          ],
          "language": "module"
        }
      ]
    },
    {
      "id": "states",
      "title": "部分文本只属于当前尝试",
      "paragraphs": [
        "一次用户提交创建attempt身份和独立缓冲；状态从streaming走向completed、interrupted、cancelled或failed。部分文字可以展示，但标注为生成中或中断草稿；复制草稿应说明不完整，审批、下载正式结果或触发外部动作只读取通过验证的final。",
        "delta只是展示增量，final是结构化结果。final可能修订前文，不能要求它一定等于拼接delta；显示层提交final时替换稳定结果，保留草稿仅供诊断。JSON能解析不等于字段符合合同，也不等于内容语义正确。例子的answer字符串与complete:true是本地合同，不代表任何供应商统一协议。",
        "为防上轮覆盖，把写入条件放在每次成功、失败、结束及finally路径。AbortController节约资源，身份校验决定谁有权写入；取消可能与事件派发交错，因此两者都要有。旧请求的finally也不能关掉新请求的loading。"
      ]
    },
    {
      "id": "identity",
      "title": "取消之后的迟到结果仍要拒绝",
      "paragraphs": [
        "下面用同步事件模拟容易稳定复现的交错：旧请求先有草稿，新请求开始并取消旧请求，随后旧final迟到。管理器只有当前且streaming的会话能写入；断流没有final因此得到interrupted；重试创建空缓冲；非法final走failed。",
        "真实集成把readEvents回调连接到apply，在正常EOF后调用close；catch中先核对当前身份，网络或协议错误调用fail。用户取消按钮通过manager.cancel同时abort与记录cancelled，此后的catch再调用fail也不会覆盖终态；不要绕过管理器直接abort后期待fail自动推断用户意图。finally释放reader与计时器，但不要修改非当前会话的页面状态。例子close只模拟缺final的正常EOF，异常中断应保留具体错误类别。",
        "本示例把通过结构校验的final视为稳定终态，之后的应用事件均忽略，因此未知事件、非法JSON及字段校验的拒绝范围是final之前。若生产合同要求final之后的尾部协议也必须完整，应先暂存候选final，等流和尾部校验成功再提交completed；那是另一种完成合同，不能沿用这里收到final立即稳定的判定。"
      ],
      "examples": [
        {
          "code": "function createSessionManager() {\n  let current = null, sequence = 0;\n  return {\n    start() {\n      if (current) {\n        current.controller.abort();\n        if (current.status === 'streaming') current.status = 'cancelled';\n      }\n      current = { id: ++sequence, controller: new AbortController(), status: 'streaming', partial: '', final: null };\n      return current;\n    },\n    apply(session, event) {\n      if (session !== current || session.status !== 'streaming' || session.controller.signal.aborted) return;\n      if (event.type === 'delta') {\n        if (typeof event.data !== 'string') throw new Error('Invalid delta');\n        session.partial += event.data;\n      } else if (event.type === 'final') {\n        const result = JSON.parse(event.data);\n        if (!result || typeof result !== 'object' || Array.isArray(result) ||\n            typeof result.answer !== 'string' || result.complete !== true) throw new Error('Invalid final');\n        session.final = { answer: result.answer, complete: true };\n        session.status = 'completed';\n      } else throw new Error('Unknown event');\n    },\n    cancel(session) {\n      if (session === current && session.status === 'streaming') {\n        session.controller.abort();\n        session.status = 'cancelled';\n      }\n    },\n    close(session) {\n      if (session === current && session.status === 'streaming') session.status = 'interrupted';\n    },\n    fail(session) {\n      if (session === current && session.status === 'streaming') session.status = 'failed';\n    }\n  };\n}\nconst manager = createSessionManager();\nconst old = manager.start();\nmanager.apply(old, { type: 'delta', data: '旧草稿' });\nconst active = manager.start();\nmanager.apply(old, { type: 'final', data: '{\"answer\":\"旧答案\",\"complete\":true}' });\nmanager.apply(active, { type: 'delta', data: '退款规则' });\nmanager.close(active);\nconsole.log(old.status + ':' + old.controller.signal.aborted);\nconsole.log(active.status + ':' + (active.final === null));\nconst retry = manager.start();\nmanager.apply(retry, { type: 'delta', data: '新稿' });\nmanager.apply(retry, { type: 'final', data: '{\"answer\":\"标准订单14日，定制订单除外\",\"complete\":true}' });\nconsole.log(retry.partial);\nconsole.log(retry.status + ':' + retry.final.answer);\nconst invalid = manager.start();\ntry { manager.apply(invalid, { type: 'final', data: '{\"answer\":14,\"complete\":true}' }); }\ncatch { manager.fail(invalid); }\nconsole.log(invalid.status + ':' + (invalid.final === null));\nconst cancelled = manager.start();\nmanager.apply(cancelled, { type: 'delta', data: '取消前草稿' });\nmanager.cancel(cancelled);\nmanager.apply(cancelled, { type: 'final', data: '{\"answer\":\"迟到答案\",\"complete\":true}' });\nmanager.fail(cancelled);\nconsole.log(cancelled.status + ':' + cancelled.controller.signal.aborted + ':' + (cancelled.final === null));",
          "expectedOutput": [
            "cancelled:true",
            "interrupted:true",
            "新稿",
            "completed:标准订单14日，定制订单除外",
            "failed:true",
            "cancelled:true:true"
          ],
          "explanation": [
            "start先abort旧controller并改变其状态，再创建新身份；旧会话无论迟到什么都被apply的身份条件拦住。",
            "active只收到delta，close把它转成interrupted且final仍为空；retry.partial只有“新稿”，没有拼接前次“退款规则”。",
            "非法final.answer是数字，结构守卫抛错，调用方记录failed而不提交final。合法final也仍需后续业务审阅，本例只证明传输与结构合同。",
            "用户取消通过manager.cancel：它先中止controller并将当前streaming会话记为cancelled。随后迟到final及catch调用fail都因终态守卫不能改写取消状态，final仍为空。"
          ]
        }
      ]
    },
    {
      "id": "retry",
      "title": "为什么重新请求不能接着旧稿追加？",
      "paragraphs": [
        "重试可能使服务端重新生成，文本不一定从断点续写。默认策略是保留上次草稿供用户查看，启动新的attempt和空缓冲，稳定结果只接受本次final。把两轮delta拼起来可能重复、矛盾或漏掉过渡条件，尤其不应把这种混合文本用于业务执行。",
        "只有服务端明确定义稳定runId、事件序号、保存期限、去重规则和恢复终点，客户端才能基于最后确认序号续传。SSE的id与重连能力不自动赋予生成任务幂等性：重连到同一URL是否读旧运行还是创建新运行，仍是服务端合同。",
        "生成请求若同时触发扣费或业务写入，应分别定义幂等键和事务边界；前端取消只停止读取，不证明后端任务没发生。超时后先查询运行状态再决定是否重试副作用，不让“重试”按钮重复创建订单。"
      ]
    },
    {
      "id": "experience",
      "title": "让用户能辨认进度与恢复路径",
      "paragraphs": [
        "开始时显示可取消的生成状态；首个字符延迟与总完成时间分别度量，不要用快速吐出一个无用token掩盖长等待。按帧或短批次刷新UI，避免每字符触发昂贵布局；保留用户主动上滚的位置，不强制滚到底。",
        "取消明确显示用户已停止；断流显示保留的是未完成草稿，提供重新生成；结构错误说明结果不能提交并保留可诊断信息。恢复按钮只在可以恢复时启用，避免一个按钮挂着却没有行为。",
        "读屏状态使用克制的live通知，在开始、停止、失败、完成时报告，不逐token播报；焦点留在用户操作位置，完成后提供可导航的稳定结果。长输出设预算与截断说明；若服务端缓冲导致没有增量，界面仍应有等待与取消状态，不伪装成已收到进度。"
      ]
    },
    {
      "id": "verification",
      "title": "验收需要怎样故意把流拆坏？",
      "paragraphs": [
        "测试将同一合法事件序列按每字节、随机片段和多事件合并三种方式传输，要求结果一致。加入CRLF跨片、中文跨字节、多data行、注释、缺空行EOF、非法UTF-8、非法JSON及错误final字段。结构与协议错误不得提交稳定结果。",
        "再测取消发生在响应头前、read等待时、delta后及final附近；A慢B快时，A的delta、error、EOF和finally均不能覆盖B。缺final的断流和人工取消分别可见；重试缓冲必须为空；若有真正续传合同，再测试重复序号和过期runId。",
        "下方合同每一项都按实际接口填写：完成合同指出哪个事件才算完成及业务校验条件，取消字段区分客户端读取与服务端运行，断流字段选择重新生成还是有序续传。所有项确定后再接入API，不假设供应商的结束标记都一样。",
        "证据保留脱敏runId、尝试身份、首字符/完成时间、终止原因及协议验证结果；日志不保存密钥或无必要的完整私人提示。本文没有独立编码题，可修改示例移除final或让旧请求迟到，先预测状态再比较输出。"
      ],
      "code": "目标：【生成流程】\n请求协议：【方法、身份、事件类型】\n完成合同：【final结构与业务校验】\n取消：【客户端与服务端各自行为】\n断流：【草稿保存与重试方式】\n预算：【输出长度、时间】\n验收：【拆片、竞态、恢复样本】"
    },
    {
      "id": "boundaries",
      "title": "哪两类成功不能互相替代？",
      "paragraphs": [
        "边界一是协议与内容：完整final只说明消息按合同到达并通过结构检查，不能证明退款政策正确；知识新鲜度与引用支持另行审阅。边界二是本地取消与远端执行：abort不能证明服务端停止计费或副作用回滚。必要时用服务端运行状态与幂等合同管理。",
        "边界三是示例解析器与完整SSE客户端：本文限定event/data和注释，没有id/retry自动重连，也没有生产长度预算。原生EventSource或经审阅的成熟解析器更适合完整协议，不能把教学代码直接当成通用生产库。",
        "短小结构化结果若无需增量展示，可以等完整响应再验证，降低部分状态与恢复成本。需要长时间反馈时，先设计状态与用户操作，再决定是否用流；流式输出改变体验，不降低业务验收标准。"
      ]
    }
  ],
  "sources": [
    {
      "title": "WHATWG：SSE事件流解析",
      "url": "https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream"
    },
    {
      "title": "WHATWG：TextDecoder与流式解码",
      "url": "https://encoding.spec.whatwg.org/#interface-textdecoder"
    }
  ]
};
