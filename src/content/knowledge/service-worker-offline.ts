import type { Article } from "../articles";

export const serviceWorkerOfflineArticle: Article = {
  "id": "K04-07",
  "kind": "knowledge",
  "domainSlug": "browser",
  "slug": "service-worker-offline",
  "title": "Service Worker 与离线",
  "summary": "从离线页和更新后资源缺失出发，推导 Service Worker 生命周期、控制范围和缓存策略，避免强制更新破坏旧页面。",
  "aliases": [
    "Service Worker",
    "Cache Storage",
    "offline",
    "skipWaiting",
    "controllerchange",
    "离线缓存"
  ],
  "tags": [
    "浏览器",
    "Web 平台",
    "Service Worker 与离线"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "线上已经更新，旧页面为什么还找不到脚本？",
      "paragraphs": [
        "离线应用发布 v2 后，老标签页还运行 v1 的 HTML 与脚本。新 Worker 激活时清掉全部旧缓存，用户跳到未加载的页面，网络又中断，于是 v1 的延迟资源再也找不到。这个失败不是“缓存没清干净”，而是同时存在的版本缺少兼容合同。",
        "前置是 K04-04 的存储留存和 K04-06 的页面生命周期。Service Worker 是可被浏览器启动与终止的事件驱动 Worker，在控制范围内处理请求，没有 DOM，不宜把全局变量当长期数据库。HTTPS 或受认可的本地安全环境才允许注册；本文的实际注册验证仅在临时独立 origin 中执行，不给学习站添加离线功能。"
      ]
    },
    {
      "id": "lifecycle",
      "title": "注册、安装、等待、激活和控制不是同一个状态",
      "paragraphs": [
        "register 取得或更新 registration，不证明当前页面已经被控制。新脚本经过 install，初始化工作通过 event.waitUntil 关联到安装；关键资源准备失败应导致安装失败，旧的可用 Worker 不因此被当成新版本替换。成功安装的新 Worker 可能等待旧客户端退出，再进入 activate。",
        "active 也不等于当前文档立刻拥有 controller。一个首次打开且未受控的页面，通常要在激活后重新导航才进入控制；clients.claim 可以改变这一行为，但会让当前页面突然采用新拦截逻辑，应明确兼容性。Worker 生命周期依赖事件，不保证常驻；长计时器和内存中的订单状态不是可靠的后台工作计划。",
        "错误实现是 register 返回就隐藏“离线未准备好”提示。应分别观察安装结果、active 状态和 controller，再验证缓存中确有所需资源。registration 的 scope 规定控制的 URL 范围；脚本位置和响应头限制最大范围，部署到子路径时要同时检查资源 URL 与 scope。"
      ]
    },
    {
      "id": "cache-api",
      "title": "Cache Storage 的匹配与 HTTP 缓存不是同一合同",
      "paragraphs": [
        "Cache Storage 保存 Request/Response 对，应用决定何时 put、match 和 delete。它不会仅凭 Cache-Control 自动完成全部应用缓存失效；浏览器 HTTP 缓存则按网络缓存规则工作。二者还可能在同一次 fetch 里共同出现，诊断时需辨认响应来自哪一层。",
        "下面实际写入一个已知离线 Response，再按请求 URL 读取。请求中的查询参数默认属于匹配条件，因此 theme=dark 不会命中 theme=light；随意 ignoreSearch 可能把不同用户或不同筛选资源混在一起。这里只使用无敏感数据的本地练习 URL。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const name = 'k04-cache-demo';\ntry {\n  const cache = await caches.open(name);\n  const request = new Request(new URL('/shell?theme=light', location.href));\n  await cache.put(request, new Response('offline shell', {\n    headers: { 'Content-Type': 'text/plain; charset=utf-8' }\n  }));\n  const hit = await cache.match(request);\n  console.log(await hit.text());\n  console.log(Boolean(await cache.match(new URL('/shell?theme=dark', location.href))));\n} finally { await caches.delete(name); }",
          "expectedOutput": [
            "offline shell",
            "false"
          ],
          "explanation": [
            "put 后同一个请求键命中，Response 正文是 offline shell；查询参数变化后默认不匹配，输出 false。缓存条目在 finally 删除，实验不会留下长期资源。",
            "真正 fetch 得到的 Response body 是可消费流，若要同时返回和缓存，常需 clone；opaque 响应与失败 HTTP 状态也要有显式策略，不把任意响应都当可用资源。"
          ]
        }
      ]
    },
    {
      "id": "offline-page",
      "title": "先准备一个不依赖外部资源的离线壳",
      "paragraphs": [
        "在独立演示目录保存以下完整文件为 offline.html，与 k04-sw.js 一起通过本地 HTTP 服务提供。它不请求外部字体、脚本或样式，因此缓存这一份 HTML 就能显示明确的离线说明。生产离线壳若引用其他资源，安装清单也必须包括必要依赖，不能只缓存 HTML 再指望未缓存图片自动出现。",
        "这个页面表达网络中断，不能伪装成最新业务数据。恢复在线后，由下一次导航重新取得网络响应；如要自动重试或恢复未提交输入，必须另外设计该流程。"
      ],
      "code": "<!doctype html>\n<html lang=\"zh-CN\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>离线说明</title>\n</head>\n<body>\n  <h1>Offline lesson</h1>\n  <p>网络暂时不可用。恢复连接后，请重新打开页面。</p>\n</body>\n</html>"
    },
    {
      "id": "worker",
      "title": "一个范围明确的离线导航 Worker",
      "paragraphs": [
        "下面完整文件保存为 /k04-sw.js，并在同一 origin 提供 /offline.html。它只接管 GET、navigate 模式、同源的 /offline-demo；其他路径和 API 交还浏览器。install 预缓存一个无个人数据的离线壳；activate 只删除本应用前缀下的旧壳，不清空同源其他应用资源。",
        "网络优先意味着有网络时获取导航响应，网络拒绝时读取离线页。HTTP 404/500 仍属于 fetch 成功拿到响应，并不会自动进入 catch；如果产品要对这些状态降级，应按状态和业务规则显式处理，不能用离线页掩盖登录失败或权限拒绝。这个小例子只用于首次部署的孤立演示；它的激活清理没有实现多标签旧资源保留，不能直接套入带延迟资源的生产应用。"
      ],
      "code": "const CACHE = 'k04-shell-v1';\nconst ASSETS = ['/offline.html'];\nself.addEventListener('install', event => {\n  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));\n});\nself.addEventListener('activate', event => {\n  event.waitUntil(caches.keys().then(names => Promise.all(\n    names.filter(name => name.startsWith('k04-shell-') && name !== CACHE)\n      .map(name => caches.delete(name))\n  )));\n});\nself.addEventListener('fetch', event => {\n  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;\n  const url = new URL(event.request.url);\n  if (url.origin !== self.location.origin || url.pathname !== '/offline-demo') return;\n  event.respondWith(fetch(event.request).catch(async () => {\n    const cache = await caches.open(CACHE);\n    return (await cache.match('/offline.html')) ?? new Response('Offline unavailable', {\n      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }\n    });\n  }));\n});"
    },
    {
      "id": "registration",
      "title": "等到激活，再确认当前文档是否受控",
      "paragraphs": [
        "以下主页面代码与上一节 Worker 配套。它在独立演示页注册并等待 active，之后打印当前 controller 状态。没有 skipWaiting 或 clients.claim，因此首次打开的演示页仍未被控制。浏览器验证会另开新页面访问 /offline-demo，再在断网条件下确认离线壳出现。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const registration = await navigator.serviceWorker.register('/k04-sw.js', { scope: '/' });\ntry {\n  await navigator.serviceWorker.ready;\n  console.log(Boolean(registration.active));\n  console.log(navigator.serviceWorker.controller === null);\n} finally {\n  await registration.unregister();\n  await caches.delete('k04-shell-v1');\n}",
          "expectedOutput": [
            "true",
            "true"
          ],
          "explanation": [
            "ready 等待与当前页面匹配的 active registration，所以 active 为真。当前页面在首次导航时没有 controller，Worker 又没有 claim，因此 controller 仍为 null。",
            "这个输出只适用于全新的隔离上下文和根 scope；已有注册或被控制页面可能得到不同结果。finally 撤销注册并删除专用缓存；线上应用不应每次注册后马上撤销。"
          ]
        }
      ]
    },
    {
      "id": "strategy",
      "title": "按资源语义选择策略，再处理 Response 生命周期",
      "paragraphs": [
        "带内容哈希、不可变的静态资源适合缓存优先，命中后无需每次网络验证；导航可采用网络优先，断网返回明确的离线状态；可容忍短期旧值的数据可以考虑 stale-while-revalidate，但需要说明旧值、新值与失败提示。付款、登录和个性化接口不能因为“加速”就统一缓存。",
        "下面是网络优先决策的可执行模型，输入输出都是教学对象。网络异常时才使用已有缓存；没有缓存则继续抛异常。它让读者看见成功、降级和不可恢复三条路径，不宣称已覆盖真实 FetchEvent 或 HTTP 缓存。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "async function networkFirst(network, cached) {\n  try { return { source: 'network', value: await network() }; }\n  catch (error) {\n    if (cached !== undefined) return { source: 'cache', value: cached };\n    throw error;\n  }\n}\nconsole.log((await networkFirst(async () => 'new', 'old')).source);\nconsole.log(JSON.stringify(await networkFirst(async () => { throw new TypeError('offline'); }, 'old')));\ntry { await networkFirst(async () => { throw new TypeError('offline'); }, undefined); }\ncatch (error) { console.log(error.name); }",
          "expectedOutput": [
            "network",
            "{\"source\":\"cache\",\"value\":\"old\"}",
            "TypeError"
          ],
          "explanation": [
            "第一条路径优先 new；第二条网络拒绝但有 old，显式返回 cache 来源；第三条没有缓存，不编造成功结果，保留 TypeError。",
            "真实 Worker 中 respondWith 必须在事件处理期间关联响应 Promise，延长缓存更新等附带工作使用 waitUntil。模型没有读取或复用 Response 流，不能据此省掉真实实现中的 clone 与清理。"
          ]
        }
      ]
    },
    {
      "id": "updates",
      "title": "skipWaiting 越过等待，会带来什么版本组合",
      "paragraphs": [
        "默认等待减少新 Worker 过早接管旧页面的机会。skipWaiting 会让新安装 Worker 尝试提前激活；配合 clients.claim，旧页面可能立即由新逻辑处理请求。如果 v1 页面发出只在 v1 存在的资源请求，而 v2 已删除它，用户就遇到版本断裂。controllerchange 是控制发生变化的通知，不是强制刷新用户输入的理由。",
        "更新流程可以先准备 v2 全部必需资源，再通知用户有更新；在草稿保存成功且用户接受后触发切换与重载。多标签环境要说明旧版本兼容窗口，保留旧哈希资源或等旧客户端退出再淘汰。策略取舍是多占一些缓存换取稳定会话；只有无长期客户端且资源向后兼容时才考虑更积极的接管。",
        "回滚也需要合同。回退 HTML 而服务器已经删掉 v1 资源，缓存又只有 v2，单改版本号不能修复。部署应保留必要资源，观察实际 controller、缓存名、脚本 URL 和请求来源，再决定撤销注册或修复版本，不用“清所有缓存”作为默认诊断。"
      ]
    },
    {
      "id": "boundaries",
      "title": "离线能做什么，不能承诺什么",
      "paragraphs": [
        "第一条边界是首次访问：未安装、未控制或未缓存的资源不会凭空离线可用。第二条边界是留存与账户：缓存可能被用户或浏览器清理；退出账户时个性化数据若曾缓存，需要明确删除策略，不能与公共离线壳混放。私密数据是否可离线保存还需独立产品与权限决定。",
        "验证包括在线首次访问、安装失败、重新导航后控制、断网已缓存页面、未缓存路径、更新时旧标签、退出账户和缓存清理后的恢复。本章有真实注册与离线导航实验；学习站本身仍不启用离线缓存。",
        "动手推导：若将 fetch 的 catch 换成无条件返回离线页，为什么线上页面也不更新？若使用 ignoreSearch 匹配用户查询，会混淆哪些数据？本单元没有独立编码题，可用上文的隔离离线导航实验验证策略，不在日常应用中注册演示 Worker。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Service Workers：生命周期与 FetchEvent",
      "url": "https://w3c.github.io/ServiceWorker/"
    },
    {
      "title": "MDN：使用 Service Worker",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers"
    }
  ]
};
