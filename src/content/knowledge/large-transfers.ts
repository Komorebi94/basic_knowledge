import type { Article } from "../articles";

export const largeTransfersArticle: Article = {
  "id": "K06-07",
  "kind": "knowledge",
  "domainSlug": "networking",
  "slug": "large-transfers",
  "title": "上传下载与大文件",
  "summary": "用分片、已接收范围和校验处理大文件中断，并在用户取消或上传号过期时停止续传。",
  "aliases": ["upload", "multipart", "Range", "Blob.slice", "checksum", "断点续传"],
  "tags": ["网络", "传输", "上传下载与大文件"],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "传到 80% 时刷新页面，为什么整个文件又从头开始？",
      "paragraphs": [
        "用户上传一个大文件，进度到 80% 后网络中断。恢复时如果没有上传号、已完成分片和总长度，客户端只能重新发送全部字节。大文件传输要把“这一次上传的身份”“哪些字节已经接受”“内容是否完整”和“用户是否还想继续”分成四个状态。",
        "前置是 K02-05 的取消和 K06-02 的幂等。示例用 Blob 切片得到真实分片边界，用集合记录已接受的分片号，并用 AbortSignal 表示用户取消。没有真实对象存储，过期判断是一个明确的时间比较。"
      ]
    },
    {
      "id": "parts",
      "title": "按固定边界切片，分片号而不是字节内容充当幂等键",
      "paragraphs": [
        "Blob.slice 按字节范围产生分片，不把整个文件一次放进内存里的新副本。5 个字节、每片 2 字节，边界是 0-2、2-4、4-5。最后一片可以短于上限。分片号从这些边界稳定得出，重试同一分片必须覆盖同一个号，不能追加成新内容。",
        "服务端按上传号保存已接受的分片号。重复到达的 1 号不增加完成数。缺少的号要能查询，这样恢复时只发送缺口。分片全部到齐后，再用整个对象的校验值确认顺序和内容，不能只因为计数等于分片数就对用户宣布成功。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const blob = new Blob([new Uint8Array([1, 2, 3, 4, 5])]);\nconst parts = [];\nfor (let start = 0; start < blob.size; start += 2) parts.push(start + '-' + Math.min(blob.size, start + 2));\nconsole.log(blob.size + ':' + parts.join(','));\nfunction recordPart(done, part) {\n  done.add(part);\n  return done.size;\n}\nconst done = new Set();\nconsole.log([recordPart(done, 1), recordPart(done, 1), recordPart(done, 2)].join(','));",
          "expectedOutput": ["5:0-2,2-4,4-5", "1,1,2"],
          "explanation": [
            "5 字节分成三段，最后一段只有一个字节。分片号 1 重复记录后集合大小仍是 1，写入 2 后大小变为 2。",
            "Set 只演示幂等计数。生产存储还要保存每片的校验、字节范围和上传号；范围重叠或号与范围不一致时要拒绝。"
          ]
        }
      ]
    },
    {
      "id": "resume",
      "title": "恢复前核对上传号、缺口和过期时间",
      "paragraphs": [
        "恢复请求先询问上传号还在不在、已接收哪些号、对象的总长度是否与本地文件一致。总长度或本地文件的修改时间变了，就不能把旧分片拼到新文件上。上传号过期后，缺口列表也失效，必须创建新的上传号，避免把字节写进一个即将被清理的会话。",
        "下载大文件可以使用 Range 请求补洞，但服务器必须声明接受范围，响应要带回这一段的内容范围。客户端把分段写入临时对象，全部范围到齐并校验后再改成用户可见的文件。校验失败时丢弃这次组装结果，不能把半截文件标成完成。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function resume(upload, now) {\n  if (upload.expiresAt <= now) return 'expired';\n  if (upload.size !== upload.localSize) return 'restart';\n  const missing = [];\n  for (let part = 1; part <= upload.totalParts; part += 1) {\n    if (!upload.done.includes(part)) missing.push(part);\n  }\n  return missing.length ? 'send:' + missing.join('+') : 'assemble';\n}\nconst upload = { expiresAt: 100, size: 5, localSize: 5, totalParts: 3, done: [1, 3] };\nconsole.log(resume(upload, 90));\nconsole.log(resume(upload, 100));\nconsole.log(resume({ ...upload, localSize: 6 }, 90));",
          "expectedOutput": ["send:2", "expired", "restart"],
          "explanation": [
            "未过期且长度一致时，只补第 2 片。时间达到过期点时不再续传。本地长度变化时重新开始，即使旧分片号还在。",
            "过期比较使用调用方传入的时间，避免示例依赖当前时钟。真实过期时间以服务端响应为准，客户端时钟只能用于提示。"
          ]
        }
      ]
    },
    {
      "id": "cancel",
      "title": "取消要停掉当前分片，并保留可恢复的进度",
      "paragraphs": [
        "用户按下取消时，AbortController 标记当前信号。正在发送的分片应停止，未开始的分片不要启动。已经接受的分片可以保留到上传号过期，用户如果立刻选择继续，仍从缺口发送。取消不是删除服务器上的整个上传，除非用户明确选择丢弃。",
        "信号 abort 之后，状态应变为已取消，而不是失败后自动重试。组件卸载也走同一条信号。若请求库忽略信号，界面停止不能当成传输已经停止，还要在文档和测试里写明这个限制。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function sendNext(signal, missing) {\n  if (signal.aborted) return 'stopped';\n  if (!missing.length) return 'assemble';\n  return 'send:' + missing[0];\n}\nconst controller = new AbortController();\nconst missing = [2, 3];\nconsole.log(sendNext(controller.signal, missing));\ncontroller.abort();\nconsole.log(sendNext(controller.signal, missing));\nconsole.log(String(controller.signal.aborted));",
          "expectedOutput": ["send:2", "stopped", "true"],
          "explanation": [
            "取消前下一步是发送第 2 片。abort 后同一缺口列表不再发送。信号的 aborted 保持 true。",
            "示例没有发出网络请求。接入传输时，把同一个 signal 传给每次分片请求，并在 abort 后避免再创建新的上传号。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "用文件名当作续传身份",
      "paragraphs": [
        "错误实现按文件名查找半截进度。同名的另一个文件、或同一文件被修改后，会接上错误的字节。身份应是服务端颁发的上传号，再绑定长度、校验和过期时间。",
        "另一个错误是每个分片失败都从第 1 片重传整个文件。重试的粒度是尚未确认的分片，并且要有次数上限。校验失败则整次组装作废，这和单片超时不是同一种恢复。"
      ]
    },
    {
      "id": "boundaries",
      "title": "切片示例不测量带宽和对象存储一致性",
      "paragraphs": [
        "第一条边界是存储实现。多部分上传的完成调用、列表分片和清理过期上传，随具体对象存储而不同。本文只固定客户端要保存的状态，不发明某个厂商的接口路径。",
        "第二条边界是完整性。示例没有计算加密哈希。宣布成功前应使用约定的哈希比较整个对象；哈希算法和编码要写在接口契约里。浏览器的非安全上下文可能缺少 SubtleCrypto，不能假设任何页面都能调用它。"
      ]
    },
    {
      "id": "practice",
      "title": "列出恢复时要发送的分片号",
      "paragraphs": [
        "5 字节、步长 2，先写出边界。已完成 1 和 3、共 3 片、长度一致且未过期时，预测恢复结果。把本地长度改掉或把当前时间改到过期点，再各预测一次。最后预测 abort 之后 sendNext 返回什么。",
        "E23 已覆盖超时包装，可以用来给单片请求加截止时间。大文件的上传号和校验仍要在接口层另测。"
      ]
    }
  ],
  "sources": [
    { "title": "HTTP 语义：范围请求", "url": "https://www.rfc-editor.org/rfc/rfc9110#section-14" },
    { "title": "File API：Blob", "url": "https://w3c.github.io/FileAPI/#dfn-slice" }
  ]
};
