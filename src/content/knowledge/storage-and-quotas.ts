import type { Article } from "../articles";

export const storageQuotasArticle: Article = {
  "id": "K04-04",
  "kind": "knowledge",
  "domainSlug": "browser",
  "slug": "storage-and-quotas",
  "title": "浏览器存储与配额",
  "summary": "从草稿保存失败出发，选择 Cookie、Web Storage 或 IndexedDB，推导事务何时成功，并处理配额、迁移阻塞与数据恢复。",
  "aliases": [
    "IndexedDB",
    "localStorage",
    "sessionStorage",
    "quota",
    "QuotaExceededError",
    "浏览器存储"
  ],
  "tags": [
    "浏览器",
    "Web 平台",
    "浏览器存储与配额"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "界面显示已保存，刷新后草稿为什么不见了？",
      "paragraphs": [
        "编辑器把文本写进 IndexedDB，看到 put 请求 success 就显示已保存。随后同一事务的另一个请求失败，整笔事务回滚，刷新后草稿仍是旧版本。用户损失的不是一个图标状态，而是对保存承诺的信任。要解释这个问题，需要区分内存状态、请求成功、事务提交和长期留存。",
        "前置是 K01-01 的数据复制与 K02-02 的错误传播。下面示例在独立的本地 HTTP origin 执行，使用专用数据库或键并在结束后清理。about:blank、受限嵌入页和禁用存储的环境可能无法访问这些 API；示例通过不代表真实磁盘耗尽或所有浏览器额度已验收。"
      ]
    },
    {
      "id": "selection",
      "title": "选存储前，先确定谁需要读数据",
      "paragraphs": [
        "Cookie 会在符合域、路径、SameSite 等条件的 HTTP 请求中参与传递，适合服务器需要的会话信息，但增加请求与安全责任。会话 Cookie 不应被当成可靠的“关窗口即删除”草稿策略；会话恢复可能延长它的使用。HttpOnly 限制脚本读取，Secure 限制安全传输，二者不能代替服务器鉴权。",
        "localStorage 和 sessionStorage 保存字符串并同步执行。localStorage 适合小规模偏好；sessionStorage 按 origin 与顶层浏览上下文划分，通常用于当前标签页会话。它们不是多字段事务数据库；较大序列化和同步读写会占用主线程。IndexedDB 异步保存结构化数据并提供索引、版本和事务，适合草稿、离线记录等，但要承担打开、升级和冲突处理。",
        "同源隔离是起点，不代表同一域上的所有嵌入情景都共享数据：浏览器可能分区或限制第三方存储。任何客户端存储也都不能成为唯一可靠的备份；敏感会话凭据更不应因为 API 易用就随手放进可被页面脚本读取的位置。"
      ]
    },
    {
      "id": "serialization",
      "title": "读取的数据仍需校验，JSON 解析不是业务校验",
      "paragraphs": [
        "下面仅把主题偏好存成带版本的小对象。读取时先处理 API 和 JSON 错误，再检查版本与允许值。旧版本、损坏值和未知字段不能直接成为页面状态。恢复使用明确默认值；若这是用户的重要正文，应保留原始文字供恢复，而不是静默覆盖。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const key = 'k04-example-theme';\nfunction readTheme(raw) {\n  try {\n    const value = JSON.parse(raw);\n    return value !== null && typeof value === 'object' &&\n      value.version === 1 && ['light', 'dark'].includes(value.theme)\n      ? value.theme : 'light';\n  } catch { return 'light'; }\n}\ntry {\n  localStorage.setItem(key, JSON.stringify({ version: 1, theme: 'dark' }));\n  console.log(readTheme(localStorage.getItem(key)));\n  console.log(readTheme('{broken'));\n  console.log(readTheme('{\"version\":2,\"theme\":\"dark\"}'));\n} finally { localStorage.removeItem(key); }",
          "expectedOutput": [
            "dark",
            "light",
            "light"
          ],
          "explanation": [
            "第一次写入的是 version=1 的已知结构，得到 dark；损坏 JSON 被捕获，版本 2 即使字段看起来可用也不按版本 1 解释，两次都回到 light。这里选择默认值只适用于可重建偏好。",
            "setItem 或 removeItem 自身也可能抛异常；这个实验会让这些异常显式失败，而不是打印虚假的成功。实际界面需要保留当前选择并显示保存失败，恢复后才重新写入。"
          ]
        }
      ]
    },
    {
      "id": "transaction",
      "title": "请求 success 在事务 complete 之前",
      "paragraphs": [
        "IndexedDB 请求在事务内执行。put 的 success 表示这次请求得到了结果，事务仍可能因为后续约束错误、显式 abort 或存储失败而回滚。保存成功反馈应等待 transaction 的 complete，失败路径处理 abort，并区分请求错误和整笔操作结果。",
        "下面一次提交两条记录；随后在另一事务里先更新 a，再主动 abort。我们在请求 success 中打印局部证据，但只有 complete 才算提交。回读 a 的结果证明前面的更新没有保留。这个反例模拟事务中止，不是假装测试了物理磁盘额度。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const name = 'k04-transaction-demo';\nfunction openDatabase() {\n  return new Promise((resolve, reject) => {\n    const request = indexedDB.open(name, 1);\n    request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'id' });\n    request.onsuccess = () => resolve(request.result);\n    request.onerror = () => reject(request.error);\n  });\n}\nfunction finished(tx) {\n  return new Promise((resolve, reject) => {\n    tx.oncomplete = () => resolve();\n    tx.onabort = () => reject(tx.error ?? new DOMException('Aborted', 'AbortError'));\n  });\n}\nconst db = await openDatabase();\ntry {\n  const first = db.transaction('drafts', 'readwrite');\n  const committed = finished(first);\n  first.objectStore('drafts').put({ id: 'a', text: 'original' });\n  first.objectStore('drafts').put({ id: 'b', text: 'second' });\n  await committed;\n  const tx = db.transaction('drafts', 'readwrite');\n  const outcome = finished(tx).catch(error => error.name);\n  const write = tx.objectStore('drafts').put({ id: 'a', text: 'changed' });\n  write.onsuccess = () => { console.log('request success'); tx.abort(); };\n  console.log(await outcome);\n  const readTx = db.transaction('drafts', 'readonly');\n  const readDone = finished(readTx);\n  const value = await new Promise((resolve, reject) => {\n    const request = readTx.objectStore('drafts').get('a');\n    request.onsuccess = () => resolve(request.result);\n    request.onerror = () => reject(request.error);\n  });\n  await readDone;\n  console.log(value.text);\n} finally {\n  db.close();\n  await new Promise((resolve, reject) => {\n    const request = indexedDB.deleteDatabase(name);\n    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);\n  });\n}",
          "expectedOutput": [
            "request success",
            "AbortError",
            "original"
          ],
          "explanation": [
            "第一笔事务 complete 后 a=original 已提交。第二笔 put 的 success 先发生，所以看到 request success；abort 回滚整个事务，finished 返回 AbortError。第三笔只读事务读到 original，而不是 changed。",
            "所有请求都在事务创建后同步排队，等待网络不能夹在创建事务和提交请求之间。数据库连接在 finally 关闭，再删除专用数据库，避免阻塞下次升级；生产代码还要处理 blocked 和 versionchange。"
          ]
        }
      ]
    },
    {
      "id": "lifetime",
      "title": "事务生命周期决定异步代码可以放在哪里",
      "paragraphs": [
        "错误实现是先创建 readwrite 事务，再 await fetch，最后调用 put。网络响应到达时事务可能已不活跃或结束，操作抛 TransactionInactiveError。先完成外部异步工作和数据校验，再打开短事务；需根据库中现值计算的新值，读取和写入应放在同一事务的请求回调中。不要让“await 看起来顺序清楚”掩盖浏览器事务生命周期。",
        "多标签页还会造成覆盖：两个页面都基于 revision=4 编辑，最后一次写入覆盖前一次。应在写事务内比较当前 revision 或数据集身份，不匹配就报告冲突并保留两份文字。storage 事件可通知其他页面 Web Storage 已变化，但不是原子比较与写入锁，也不在发起变更的窗口触发。",
        "升级数据库时，一个旧连接可能阻止新版本打开。已打开的连接监听 versionchange 并关闭，新的打开请求处理 blocked，向用户说明需要关闭其他页面。升级事务只做数据结构迁移；长网络请求、弹窗等待和业务加载不放进升级过程。"
      ]
    },
    {
      "id": "quota",
      "title": "配额估算不是预留，失败必须保持可恢复",
      "paragraphs": [
        "navigator.storage.estimate 返回估计的 usage 与 quota，适合提示与诊断。可用空间会被其他写入、浏览器策略和设备状态改变，先估算再写入不构成原子预留。不能用某个固定 MB 常量推断所有浏览器；遇到写入拒绝，应从实际异常与事务结局判断。",
        "下面保存函数在成功时才推进 persisted，额度拒绝保留用户输入并给出恢复状态。我们注入确定的异常，验证应用状态转换；真实 QuotaExceededError 仍需在受控浏览器额度下单独复现。这样的分层让业务恢复行为不依赖把测试机器磁盘填满。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "async function saveDraft(text, write) {\n  try {\n    await write(text);\n    return { status: 'saved', draft: text, persisted: text };\n  } catch (error) {\n    if (error instanceof DOMException && error.name === 'QuotaExceededError') {\n      return { status: 'quota', draft: text, persisted: null };\n    }\n    throw error;\n  }\n}\nconst failed = await saveDraft('unsaved words', async () => {\n  throw new DOMException('Fixture quota rejection', 'QuotaExceededError');\n});\nconsole.log(failed.status, failed.draft, failed.persisted);\nconst retry = await saveDraft(failed.draft, async () => {});\nconsole.log(retry.status, retry.persisted);",
          "expectedOutput": [
            "quota unsaved words null",
            "saved unsaved words"
          ],
          "explanation": [
            "异常分支保留 draft，persisted 没有被虚假推进。释放应用自己的可重建缓存或导出用户文本后，可重试同一份输入；只有 write 完成后才显示 saved。",
            "第二个 write 是无副作用的教学替身，因此只证明状态恢复逻辑，不证明浏览器实际写盘。其他异常会继续抛出，避免把权限错误或程序缺陷都错误描述成额度不足。"
          ]
        }
      ]
    },
    {
      "id": "retention",
      "title": "持久化、清理和备份分别承担什么责任",
      "paragraphs": [
        "浏览器默认存储通常属于 best-effort，可能在存储压力或策略下被清理。persist 可以申请更强的留存类别，但返回结果取决于环境，不保证永远保留，也不能阻止用户主动清除。即使事务 complete，也不应把它描述成断电后绝对可恢复的备份承诺。",
        "恢复方案按数据价值区分：图片缓存可以按最近使用淘汰，重要草稿要提供导出并保持未保存文字。只删除本应用有所有权的缓存；不要为了腾额度直接清空整个 origin 的 IndexedDB 或 localStorage。导入备份应先校验版本、结构和大小，再在事务中替换；不能边解析边破坏原库。"
      ]
    },
    {
      "id": "boundaries",
      "title": "从保存反馈到实际验证",
      "paragraphs": [
        "第一条边界是隐私模式、第三方嵌入和用户禁用存储：API 即使存在也可能拒绝调用。第二条边界是多个 origin：主站、运行器和不同协议端口的数据彼此隔离，HTTP 开发数据不会自动出现在 HTTPS 正式站。部署迁移需要明确导出导入或受控迁移方案。",
        "验证至少包括刷新回读、事务中止不改旧值、两个页面同时编辑、升级被旧连接阻塞、损坏数据和保存拒绝后仍可复制输入。本文的事务与异常示例提供局部可复现证据，不能替代完整存储适配层的集成验收。",
        "回忆：为什么 put success 后仍不能显示已保存？如果某缓存删除释放了空间，能否保证下一次写入一定成功？本单元没有已发布的独立编码题，可先修改事务例子，让第二个请求产生主键约束错误，再检查第一条更新是否保留。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Storage Standard：存储模型与持久化",
      "url": "https://storage.spec.whatwg.org/"
    },
    {
      "title": "MDN：IndexedDB 事务与升级",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB"
    },
    {
      "title": "MDN：配额与清理",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria"
    }
  ]
};
