import type { Article } from "../articles";

export const platformEnhancementArticle: Article = {
  "id": "K04-08",
  "kind": "knowledge",
  "domainSlug": "browser",
  "slug": "platform-progressive-enhancement",
  "title": "Web 平台能力与渐进增强",
  "summary": "从复制和导出功能出发，区分 API 存在、调用条件与实际成功，用权限、特性检测和恢复路径设计可用的增强功能。",
  "aliases": [
    "progressive enhancement",
    "feature detection",
    "Permissions API",
    "secure context",
    "user activation",
    "渐进增强"
  ],
  "tags": [
    "浏览器",
    "Web 平台",
    "Web 平台能力与渐进增强"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "浏览器支持复制，为什么按钮仍然失败？",
      "paragraphs": [
        "文章提供“复制代码”按钮，开发者检测 navigator.clipboard 存在便认定可用。但页面可能没有合适的用户激活、运行在受限 iframe 中、被权限策略限制，或用户拒绝操作。按钮报错后正文又不能选中，用户反而失去了最基本的复制方式。支持不是一个布尔值就能描述的事实。",
        "前置是 K04-03 的真实用户输入与 K02-02 的异步错误。渐进增强先保证核心任务能完成，再在有能力且调用成功时增加便利：代码本来可选中，复制 API 成功则提示已复制，失败则保留原文和手动路径。它需要设计成功、缺失、拒绝与恢复，而不只是 polyfill 一切。"
      ]
    },
    {
      "id": "layers",
      "title": "把支持拆成语法、接口、环境和结果",
      "paragraphs": [
        "CSS.supports 或对象属性检测回答当前环境是否认识对应特性；安全上下文、Permissions Policy、用户激活和权限决定这次操作是否被允许；Promise 的完成或拒绝才是本次操作结果。接口存在不证明行为符合你的数据合同，权限 granted 也不保证设备始终在线或资源不被占用。",
        "不要通过 User-Agent 字符串推断这些事实。版本、嵌入模式和策略会改变行为，UA 本身还可能简化或被修改。优先检测真正需要的 API 与行为，并只在操作时验证必要条件。CSS 可以先声明基础布局，再用 @supports 增强；即使增强不生效，也应能阅读、导航和提交。",
        "错误实现是页面加载时把所有支持的设备权限都申请一遍。用户没有看到用途，也不一定存在用户激活。更合理的是在明确操作入口说明目的，只申请当前任务所需能力，并且拒绝后仍有替代流程，不反复弹窗逼迫授权。"
      ]
    },
    {
      "id": "copy",
      "title": "复制操作的三条结果路径",
      "paragraphs": [
        "下面把写入能力作为参数，是为了在测试中确定性覆盖成功、API 缺失和权限拒绝，不访问真实剪贴板。生产事件处理器可把 navigator.clipboard 的对象传入；保留对象调用 writeText，避免丢失方法接收者。copy 结果直接对应界面反馈，未完成调用时不能先显示已复制。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "async function copyText(text, clipboard) {\n  if (!clipboard || typeof clipboard.writeText !== 'function') {\n    return { status: 'manual', text };\n  }\n  try {\n    await clipboard.writeText(text);\n    return { status: 'copied' };\n  } catch (error) {\n    return { status: 'manual', text, reason: error instanceof Error ? error.name : 'UnknownError' };\n  }\n}\nconsole.log((await copyText('const x = 1;', { writeText: async () => {} })).status);\nconsole.log((await copyText('const x = 1;', undefined)).status);\nconst denied = await copyText('const x = 1;', {\n  writeText: async () => { throw new DOMException('Denied fixture', 'NotAllowedError'); }\n});\nconsole.log(denied.status, denied.reason, denied.text);",
          "expectedOutput": [
            "copied",
            "manual",
            "manual NotAllowedError const x = 1;"
          ],
          "explanation": [
            "第一条路径等待 writeText 完成才返回 copied；第二条没有接口直接给出 manual；第三条拒绝后保留完整文本与错误类别。用户可以选择原文继续任务，而不是面对失效按钮。",
            "这是可执行的应用状态模型，写入函数是教学替身，不代表真实剪贴板授权已测。实际页面应使用可访问的状态提示，必要时聚焦可选择文本，同时避免在错误日志中泄露正文。"
          ]
        }
      ]
    },
    {
      "id": "permissions",
      "title": "查询状态不是发起权限申请",
      "paragraphs": [
        "Permissions API 的 query 在支持相应权限描述符时返回 PermissionStatus，可观察 granted、prompt、denied 及 change。查询本身不替用户完成授权；真正的功能 API 才按其规则执行操作或触发请求。各浏览器和各权限名称支持程度不同，query 也可能拒绝，所以未知状态不能硬编码成 denied。",
        "以地理位置为例，页面加载可以解释任务是否真的需要位置；用户点击“定位附近”时再调用定位 API，拒绝或超时后允许手动输入城市。不要因为查询到 prompt 就禁用唯一按钮：prompt 说明当前还需要用户选择，不是永久不可用。一次查询也不是未来所有调用的许可，用户可以更改设置。",
        "嵌入页面还需要核对宿主页的 Permissions Policy 和 iframe 许可，子页面不能自己提升宿主限制。API 名称存在但被策略禁止时，修复往往在部署或宿主页，不是在子页面捕获后循环重试。"
      ]
    },
    {
      "id": "choose",
      "title": "检测失败也要有解释得通的决策",
      "paragraphs": [
        "下面用显式能力描述选择导出方式。增强路径是文件选择器；基础路径是浏览器下载；再不具备下载条件时保留可复制文本。这是产品决策模型，并没有打开系统对话框。不能仅因为一个 API 不存在，就让用户重要数据完全无法取出。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "function exportMode({ secure, filePicker, download }) {\n  if (secure && filePicker) return 'picker';\n  if (download) return 'download';\n  return 'text';\n}\nconsole.log(exportMode({ secure: true, filePicker: true, download: true }));\nconsole.log(exportMode({ secure: false, filePicker: true, download: true }));\nconsole.log(exportMode({ secure: false, filePicker: false, download: false }));",
          "expectedOutput": [
            "picker",
            "download",
            "text"
          ],
          "explanation": [
            "第一组满足增强前提，第二组尽管声明接口存在却缺少安全条件，因此选择下载；第三组连基础下载也不具备，仍返回文本路径。顺序体现核心任务必须保留，而不是支持率排名。",
            "真实 picker 调用还可能因用户取消、权限或磁盘失败而拒绝；下载也可能被沙箱阻止。这个决策函数只选择入口，最终结果仍要由实际操作反馈，不能据此显示“文件已保存到磁盘”。"
          ]
        }
      ]
    },
    {
      "id": "cancel",
      "title": "用户取消与系统失败要采用不同反馈",
      "paragraphs": [
        "用户在文件选择器中点取消通常不需要显示红色故障，更不能自动换一个下载渠道把文件保存出去。将取消、成功和错误建模为不同结果；错误时提供用户可选择的恢复方式。若任务涉及账号、支付或定位，替代路径也必须遵守相同的身份与授权规则。",
        "下面只在明确识别取消时返回 canceled，对其他拒绝返回 failed。两条路径都没有 saved，避免“打开了对话框就算保存”的错觉。实际保存结果还需等待写入与关闭句柄等完整操作，这里通过参数替身验证决策。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "async function runExport(save) {\n  try { await save(); return 'saved'; }\n  catch (error) {\n    return error instanceof DOMException && error.name === 'AbortError' ? 'canceled' : 'failed';\n  }\n}\nconsole.log(await runExport(async () => {}));\nconsole.log(await runExport(async () => { throw new DOMException('User canceled fixture', 'AbortError'); }));\nconsole.log(await runExport(async () => { throw new DOMException('Permission denied fixture', 'NotAllowedError'); }));",
          "expectedOutput": [
            "saved",
            "canceled",
            "failed"
          ],
          "explanation": [
            "save 完成才得到 saved；已知的取消异常得到 canceled；权限拒绝得到 failed，界面可提供重试或手动导出入口。不能把所有 catch 都当成用户取消，掩盖真实数据丢失风险。",
            "不同 API 对取消的表达可能不同，必须核对具体合同。这里 AbortError 与取消的对应只属于这个导出函数的约定，不应全局把任何 AbortError 都解释成人工点击。"
          ]
        }
      ]
    },
    {
      "id": "polyfill",
      "title": "polyfill 只能补语义，不能补安全许可和硬件",
      "paragraphs": [
        "纯计算或部分语法功能可以通过转译、库或 polyfill 提供相近行为；但用户激活、浏览器权限、后台执行、真实设备和强隔离不能由普通脚本伪造。尤其是独立 Worker 运行失败时，不能把用户代码搬回主线程 eval 当成兼容降级，因为那会改变隔离合同。",
        "错误实现是给缺少 Clipboard API 的页面注入一段全局代码，承诺任何环境都能无提示复制。兼容方法仍可能受选择、焦点、策略和用户输入限制。更可维护的基础能力是保留可选择文本；增强失败时说明下一步，不隐藏原始内容。",
        "能力缺失也不总能安全降级。若核心任务依赖可靠加密、授权或执行隔离，宁可明确暂停该操作并保留输入，不能换成不满足条件的实现。渐进增强的目标是保持核心合同，替代方案必须满足同样的正确性与安全条件。"
      ]
    },
    {
      "id": "compatibility",
      "title": "验证真实任务矩阵，而不是一个支持率数字",
      "paragraphs": [
        "为每项增强列出目标环境和任务结果：桌面与手机、直接页面与嵌入页、安全与不安全上下文、允许与拒绝、API 缺失与调用失败、取消后重试。先测试基础流程，随后测试增强是否真的减少操作，并用键盘完成全部路径。权限提示本身的自动化可有局限，记录未验证的设备和浏览器。",
        "例如复制功能需要验证原文能选择、按钮可聚焦、成功状态可感知、拒绝后不丢文本；导出功能需要验证取消没有触发二次下载、重复点击不会保存多份、恢复入口不自动扩大权限。运行一次成功的桌面点击不足以宣布兼容所有设备。"
      ]
    },
    {
      "id": "boundaries",
      "title": "两条边界与选型取舍",
      "paragraphs": [
        "第一条边界是权限随时间变化：初始化时检测通过，点击时仍可能失败。第二条边界是替代流程的合同：下载能替代部分文件选择操作，却不一定提供同样的覆盖文件、持久句柄和后台写入能力，应在产品中说明用户可见差异。",
        "当新能力只是便利增强，优先保留简单且稳定的基础路径；当它决定核心功能，先验证目标环境和部署条件，再决定是否采用或调整产品范围。本单元不引入新 API 到学习站。动手给复制模型加入“操作进行中禁止重复点击”，推导失败后怎样恢复按钮，并写出缺失与拒绝的不同状态。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Permissions：查询与状态",
      "url": "https://www.w3.org/TR/permissions/"
    },
    {
      "title": "MDN：Permissions API",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API"
    },
    {
      "title": "MDN：渐进增强",
      "url": "https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement"
    }
  ]
};
