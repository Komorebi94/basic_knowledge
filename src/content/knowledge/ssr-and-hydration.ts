import type { Article } from "../articles";

export const ssrHydrationArticle: Article = {
  "revision": 2,
  "id": "K08-07",
  "kind": "knowledge",
  "domainSlug": "vue",
  "slug": "ssr-and-hydration",
  "title": "SSR 与水合",
  "summary": "从已显示却尚不可交互的订单按钮出发，实际生成服务器 HTML 并验证客户端接管，解释首次状态一致、请求隔离、生命周期与公开状态序列化的边界。",
  "aliases": [
    "SSR",
    "hydration",
    "server rendering",
    "hydration mismatch",
    "服务端渲染",
    "水合",
    "请求隔离"
  ],
  "tags": [
    "Vue",
    "SSR",
    "水合"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "订单已经显示了，为什么按钮暂时不能改数量？",
      "paragraphs": [
        "服务器返回订单标题与数量，浏览器一解析 HTML 就能看见按钮，但点击没有效果。客户端 JavaScript 加载后，Vue 才把组件行为接到现有 DOM 上。若客户端重新取到另一份初始数量，页面还可能先显示 1，接管时突然变成 2，并产生水合警告。",
        "SSR 负责把某次请求的状态渲染成 HTML，水合负责让客户端组件匹配已有 DOM 并安装行为。两次执行发生在不同运行环境，必须约定相同的首次状态和结构；它们不是把服务器里的组件实例、闭包或事件处理函数直接搬进浏览器。",
        "本文继续使用订单数量，完整验证服务端输出、浏览器接管、普通挂载重建与不一致；再检查请求状态隔离、服务端钩子和公开状态序列化。前置是 K08-04 的资源生命周期、K08-05 的渲染流程、K08-06 的 URL 与状态所有权。"
      ]
    },
    {
      "id": "environment",
      "title": "Node 生成 HTML，隔离浏览器接管同一份初始状态",
      "paragraphs": [
        "运行 npm run verify:k08-07。标注 Node 环境的代码以独立 Node ES 模块进程执行，使用已安装 Vue 3.5.43 与 vue/server-renderer；浏览器例子在独立临时 HTTP 页面使用同版本 Vue。Node 例子可保存为仓库根目录的 mjs 文件，用 node 执行；涉及共享工厂时保留文中的相对文件路径。",
        "共享工厂实际位于 scripts/lib/ssr-order-app.mjs，下一节展示完整源码。验证服务先在 Node 通过 renderToString 生成 HTML 与公开初始状态，再由 /ssr-order.json 提供；/ssr-order-app.mjs 仅将同一工厂的 Vue import 接到本地 /vue.mjs。浏览器测试不是把手写字符串冒充 SSR 输出。正文中的工厂源码与实际文件在门禁中逐字比对。",
        "每个浏览器代码块是独立完整 ES 模块，由上述验证命令运行；迁到自己的 Vue 项目时把 /vue.mjs 改为 vue，共享工厂按实际模块路径导入，并用你的受信任 SSR 页面和已验证公开状态替代教学 fixture。不要在本站主页面控制台运行；本站不会启用 Vue SSR，也不会求值用户代码或导入备份。"
      ]
    },
    {
      "id": "app-factory",
      "title": "同一个应用工厂，给服务器与浏览器各创建自己的实例",
      "paragraphs": [
        "以下工厂为每次调用创建自己的 quantity，再返回应用与状态引用。默认用 createSSRApp：服务器将它交给渲染器，客户端将另一实例挂载到已有 SSR DOM；只有明确比较普通客户端挂载时才传 false。两端共享定义与初始数据，不共享那份 ref。",
        "parseOrderState 定义作者的固定合同：一个大写字母 ID、最多 80 字符标题、1—5 的整数数量；它只返回公开字段，不转交调用方整个对象。serializeOrderState 将小于号编码为 JSON 字符转义，供后文演示 HTML script 文本边界。它只覆盖这个普通 JSON 数据模型，不支持任意 Date、Map、循环对象或通用应用状态。",
        "源码将在后续 Node 与浏览器例子中实际导入执行。按钮只在客户端事件处理后加一，最多到 5；这段逻辑没有服务端提交能力，不代表库存或权限已经校验。"
      ],
      "code": "import { createApp, createSSRApp, h, ref } from 'vue';\n\nexport function parseOrderState(input) {\n  if (typeof input !== 'object' || input === null || Array.isArray(input) ||\n      typeof input.id !== 'string' || !/^[A-Z]$/.test(input.id) ||\n      typeof input.title !== 'string' || input.title.length > 80 ||\n      !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 5) {\n    throw new TypeError('订单初始状态不符合合同');\n  }\n  return { id: input.id, title: input.title, quantity: input.quantity };\n}\n\nexport function serializeOrderState(input) {\n  return JSON.stringify(parseOrderState(input)).replace(/</g, '\\\\u003c');\n}\n\nexport function createOrderApp(input, hydrate = true) {\n  const initial = parseOrderState(input);\n  const quantity = ref(initial.quantity);\n  const component = {\n    setup() {\n      return () => h('main', [\n        h('h1', initial.title),\n        h('button', {\n          type: 'button',\n          onClick: () => { quantity.value = Math.min(quantity.value + 1, 5); }\n        }, '数量:' + quantity.value)\n      ]);\n    }\n  };\n  return { app: (hydrate ? createSSRApp : createApp)(component), quantity };\n}"
    },
    {
      "id": "server",
      "title": "服务端渲染输出 HTML，不输出可点击的闭包",
      "paragraphs": [
        "createSSRApp 建立组件描述，renderToString 根据当前请求状态执行渲染并返回 HTML。服务器不创建浏览器 DOM，也不会把 onClick 的函数放进 HTML。浏览器从响应得到按钮文字，但还没有执行客户端组件建立监听。",
        "下面在 Node 执行。预期 DOM环境:undefined，随后得到包含标题与按钮的完整 HTML；最后验证没有内联 onclick 属性。使用 h 的文本孩子还会按 HTML 文本语境转义标题，不需要把标题当作模板或 innerHTML 编译。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { renderToString } from 'vue/server-renderer';\nimport { createOrderApp } from './scripts/lib/ssr-order-app.mjs';\nconst { app } = createOrderApp({ id: 'A', title: '订单 A', quantity: 1 });\nconst html = await renderToString(app);\nconsole.log('DOM环境:' + typeof document);\nconsole.log(html);\nconsole.log('包含内联事件:' + html.includes('onclick='));",
          "expectedOutput": [
            "DOM环境:undefined",
            "<main><h1>订单 A</h1><button type=\"button\">数量:1</button></main>",
            "包含内联事件:false"
          ],
          "explanation": [
            "Node 中没有 document，但 renderToString 不需要它，按虚拟描述写出字符串。按钮 onClick 仍属于组件定义，SSR 字符串只包含 type 与文字，没有可执行的 onclick。",
            "服务器上创建的 ref 随这次渲染使用；客户端不能读取它的闭包。要从数量 1 开始接管，浏览器必须用同一公开初始状态重新创建应用，而不是指望组件实例通过 HTTP 自动转移。"
          ]
        }
      ]
    },
    {
      "id": "hydrate",
      "title": "状态与结构匹配时，水合复用现有 DOM 并安装行为",
      "paragraphs": [
        "下面从隔离服务获取真正的 Node SSR 结果，把它装入独立根容器。插入的是受审查的本地作者渲染结果；生产应用不能因此把任意接口 HTML 直接注入页面。客户端用同一工厂与初始状态创建新的 createSSRApp，再 mount 到已有内容。",
        "预期 接管前:数量:1、接管复用:true、接管后:数量:2。接管前点击只触发一个没有 Vue listener 的静态按钮；接管后保存的同一 DOM 对象能处理事件，数量才变成 2。此处等待 nextTick 只保证已排队的 Vue DOM 更新，不代表用户性能指标。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { nextTick } from '/vue.mjs';\nimport { createOrderApp } from '/ssr-order-app.mjs';\nconst response = await fetch('/ssr-order.json');\nif (!response.ok) throw new Error('本地 SSR 响应失败');\nconst payload = await response.json();\nconst root = document.createElement('div');\ndocument.body.append(root);\n// 只插入本地受审查 fixture 的 SSR 输出，不接受用户 HTML。\nroot.innerHTML = payload.html;\nconst button = root.querySelector('button');\nbutton.click();\nconsole.log('接管前:' + button.textContent);\nconst { app } = createOrderApp(payload.initial);\napp.mount(root);\nconsole.log('接管复用:' + (root.querySelector('button') === button));\nbutton.click(); await nextTick();\nconsole.log('接管后:' + button.textContent);\napp.unmount(); root.remove();",
          "expectedOutput": [
            "接管前:数量:1",
            "接管复用:true",
            "接管后:数量:2"
          ],
          "explanation": [
            "服务端 HTML 中的事件函数没有被传输，所以第一次 click 后文字仍为数量:1。mount 执行水合，对照客户端描述接管现有按钮，因此引用相同。",
            "第二次 click 调用新建的客户端组件闭包，把客户端 ref 从 1 改到 2，nextTick 后该按钮显示数量:2。复用 DOM 不意味着 setup 没有重新执行，也不意味着所有子树在任何不一致时都能无损复用。"
          ]
        }
      ]
    },
    {
      "id": "mount",
      "title": "普通 createApp 挂载同一描述，会走重建而不是水合",
      "paragraphs": [
        "createApp 面向普通客户端挂载，不能替代 SSR 接管入口。下面仍使用同一工厂、同一初始值与完全相同的结构，只把创建入口切为 false 对应的 createApp。这样能把入口差异与“写了另一套组件”区分开。",
        "预期 普通挂载重建:true:数量:1，随后 新按钮:数量:2。界面表面上也能正常点击，但原 SSR 按钮已经不是当前 DOM。不要把“最终显示一样”当作已经验证水合、节点复用或用户输入保留。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { nextTick } from '/vue.mjs';\nimport { createOrderApp } from '/ssr-order-app.mjs';\nconst response = await fetch('/ssr-order.json');\nif (!response.ok) throw new Error('本地 SSR 响应失败');\nconst payload = await response.json();\nconst root = document.createElement('div'); document.body.append(root);\nroot.innerHTML = payload.html;\nconst oldButton = root.querySelector('button');\nconst { app } = createOrderApp(payload.initial, false);\napp.mount(root);\nconst button = root.querySelector('button');\nconsole.log('普通挂载重建:' + (oldButton !== button) + ':' + button.textContent);\nbutton.click(); await nextTick();\nconsole.log('新按钮:' + button.textContent);\napp.unmount(); root.remove();",
          "expectedOutput": [
            "普通挂载重建:true:数量:1",
            "新按钮:数量:2"
          ],
          "explanation": [
            "创建入口变为 createApp 后，mount 清理原内容再建立客户端树，button 与原对象不同。初始状态相同使文字仍为 1，单看文字无法区分重建与接管。",
            "新按钮安装了事件处理并能更新到 2，但这个成功路径没有保留旧节点身份。SSR 项目需先选择正确接管方式，再检查状态和结构一致性，而不是用普通挂载消除警告后就宣布水合完成。"
          ]
        }
      ]
    },
    {
      "id": "mismatch",
      "title": "服务器是 1，客户端初次渲染是 2：警告是数据不一致的证据",
      "paragraphs": [
        "水合需要比较的是客户端首次结果与浏览器解析后的服务器 DOM。不能在首次客户端 render 时重新用随机数、当前时间、不同语言或不同用户响应覆盖服务端基线。确需浏览器特有值时，可先渲染双方一致的占位，再在 mounted 后作为正常更新显示。",
        "下面明确是错误实现：故意把客户端数量改成 2。预期 不一致被报告:true:数量:2、恢复后可点击:数量:3。warnHandler 记录消息后仍 console.warn 输出，不吞掉诊断；Vue 本例会修正文字符合客户端结果，但修复成功不等于正确的首次状态合同。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { nextTick } from '/vue.mjs';\nimport { createOrderApp } from '/ssr-order-app.mjs';\nconst response = await fetch('/ssr-order.json');\nif (!response.ok) throw new Error('本地 SSR 响应失败');\nconst payload = await response.json();\nconst root = document.createElement('div'); document.body.append(root);\nroot.innerHTML = payload.html;\nconst warnings = [];\nconst { app } = createOrderApp({ ...payload.initial, quantity: 2 });\napp.config.warnHandler = message => { warnings.push(message); console.warn(message); };\napp.mount(root);\nconsole.log('不一致被报告:' + warnings.some(message => message.includes('Hydration text content mismatch')) + ':' + root.querySelector('button').textContent);\nroot.querySelector('button').click(); await nextTick();\nconsole.log('恢复后可点击:' + root.querySelector('button').textContent);\napp.unmount(); root.remove();",
          "expectedOutput": [
            "不一致被报告:true:数量:2",
            "恢复后可点击:数量:3"
          ],
          "explanation": [
            "节点文字与客户端描述不匹配，开发构建通过警告报告 mismatch，并在这个文本场景中修正为数量:2。验证报告保留警告与 Vue 的水合错误日志，不能将它们当成无诊断的正常路径。",
            "安装事件后点击可显示 3，说明本例恢复了交互，不说明任意结构、属性或表单输入都能被完整保留。修复应使用服务器下发并校验的相同初始状态；data-allow-mismatch 只是为确实无法一致的特定区域允许警告差异，不能修复错误订单或跨用户状态。"
          ]
        }
      ]
    },
    {
      "id": "parser",
      "title": "原始 HTML 字符串相同，浏览器树也可能已经不同",
      "paragraphs": [
        "水合面对真实 DOM，而不是服务器字符串逐字比较。无效的 HTML 嵌套会被浏览器解析器调整：p 里放 div，浏览器会提前结束段落，并可能补出另一段落。Vue 客户端若仍期待 div 在 p 内，结构从一开始就不匹配。",
        "下面获取 Node 真实生成的错误与正确 HTML，只观察浏览器解析，不声称验证这个无效树的完整水合恢复。预期 服务端:<p><div>内容</div></p>、浏览器:p,div,p、首段孩子:0、合法结构:div:p。修复是改成合法的外层 div 和内层 p，而不是关闭结构警告。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const response = await fetch('/ssr-nesting.json');\nif (!response.ok) throw new Error('本地结构响应失败');\nconst payload = await response.json();\nconst root = document.createElement('div'); document.body.append(root);\nroot.innerHTML = payload.invalid;\nconsole.log('服务端:' + payload.invalid);\nconsole.log('浏览器:' + [...root.children].map(child => child.tagName.toLowerCase()).join(','));\nconsole.log('首段孩子:' + root.firstElementChild.children.length);\nroot.innerHTML = payload.valid;\nconsole.log('合法结构:' + root.firstElementChild.tagName.toLowerCase() + ':' + root.firstElementChild.firstElementChild.tagName.toLowerCase());\nroot.remove();",
          "expectedOutput": [
            "服务端:<p><div>内容</div></p>",
            "浏览器:p,div,p",
            "首段孩子:0",
            "合法结构:div:p"
          ],
          "explanation": [
            "Node 渲染器按 h 的描述生成 p 包 div 的字符串；浏览器按 HTML 解析规则得到空 p、div、空 p 三个兄弟，首段已经没有原本预期的孩子。字符串“看起来有嵌套”不能证明 DOM 确实那样嵌套。",
            "合法版本从 Node 生成 div 包 p，浏览器树也保持这个结构。检查水合问题时应同时看响应源码、浏览器 DOM 和客户端描述，尤其是段落、表格等有解析规则的容器。此例的 innerHTML 仅用于隔离解析作者固定 HTML，不作为内容展示架构。"
          ]
        }
      ]
    },
    {
      "id": "requests",
      "title": "每个请求创建状态：只新建 app 还不够",
      "paragraphs": [
        "服务器通常会复用模块实例。如果用户状态在模块顶层，后来的请求会改写同一对象，即使各自创建了 app，也可能渲染到另一请求的数据。组件树、store、Router 与序列化上下文需要明确的请求所有者；缓存的公开只读数据与请求私有状态必须分开。",
        "下面 Node 用两段重叠的异步流程模拟 A、B 请求，不接真实账户。错误版本共用 ref，B 在 A 恢复前覆盖它，两份 HTML 都是 B；正确版本在每次函数调用内创建 ref，各自得到 A 与 B。预期 错误:<p>B</p>,<p>B</p> 与 正确:<p>A</p>,<p>B</p>。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { createSSRApp, h, ref } from 'vue';\nimport { renderToString } from 'vue/server-renderer';\nconst shared = ref('');\nasync function wrong(name) {\n  shared.value = name;\n  await Promise.resolve();\n  return renderToString(createSSRApp({ render: () => h('p', shared.value) }));\n}\nconsole.log('错误:' + (await Promise.all([wrong('A'), wrong('B')])).join(','));\nasync function correct(name) {\n  const own = ref(name);\n  await Promise.resolve();\n  return renderToString(createSSRApp({ render: () => h('p', own.value) }));\n}\nconsole.log('正确:' + (await Promise.all([correct('A'), correct('B')])).join(','));",
          "expectedOutput": [
            "错误:<p>B</p>,<p>B</p>",
            "正确:<p>A</p>,<p>B</p>"
          ],
          "explanation": [
            "wrong(A) 写 A 后暂让出执行，wrong(B) 写 B；两个后续 render 都读同一 shared，所以都生成 B。问题是共享状态的位置，不是 Vue 是否为两次调用创建了不同 app。",
            "correct 内各建一份 own，异步恢复后仍读取各自引用。教学字母只是身份标签；生产私有响应还需授权与缓存分区，按请求创建实例不能代替接口权限，也不能让含用户信息的 HTML 进入公共缓存。"
          ]
        }
      ]
    },
    {
      "id": "lifecycle",
      "title": "服务端等待数据，不执行客户端挂载与卸载清理",
      "paragraphs": [
        "setup 在服务器与客户端分别运行，不能直接假设 window、document 或 localStorage 存在。客户端副作用在 mounted 后建立并按客户端生命周期释放；服务器为请求创建的连接、订阅或计时器需要请求自己的结束责任，不能等待组件 onUnmounted，因为 SSR 不会走浏览器的卸载流程。",
        "onServerPrefetch 返回的 Promise 会被服务端渲染等待。下面 Promise 仅表示作者控制的一次异步准备，不是实际订单接口；数量从 1 改成 2 后才输出 HTML。预期 <p>数量:2</p>、钩子:1,0,0，依次记录 serverPrefetch、mounted、unmounted。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { createSSRApp, h, ref, onServerPrefetch, onMounted, onUnmounted } from 'vue';\nimport { renderToString } from 'vue/server-renderer';\nconst calls = { prefetch: 0, mounted: 0, unmounted: 0 };\nconst app = createSSRApp({\n  setup() {\n    const quantity = ref(1);\n    onServerPrefetch(async () => {\n      calls.prefetch += 1;\n      await Promise.resolve();\n      quantity.value = 2;\n    });\n    onMounted(() => { calls.mounted += 1; });\n    onUnmounted(() => { calls.unmounted += 1; });\n    return () => h('p', '数量:' + quantity.value);\n  }\n});\nconsole.log(await renderToString(app));\nconsole.log('钩子:' + [calls.prefetch, calls.mounted, calls.unmounted].join(','));",
          "expectedOutput": [
            "<p>数量:2</p>",
            "钩子:1,0,0"
          ],
          "explanation": [
            "renderToString 等待 serverPrefetch 的异步准备完成，因此第一次输出就是 2，不是先输出 1 再像浏览器一样补 DOM。此过程中客户端 mounted 与 unmounted 都没有执行。",
            "服务器等待后的最终数据才是需要传给客户端的基线；如果仍下发准备之前的数量 1，会制造新的首次不一致。真实读取失败应有明确错误或不存在状态，并在写响应前决定 HTTP 状态；本例不验证服务器超时、断开或真实数据读取。"
          ]
        }
      ]
    },
    {
      "id": "serialization",
      "title": "只下发公开状态，并按嵌入位置处理数据",
      "paragraphs": [
        "HTML 文本转义与 JSON 序列化是不同边界。JSON.stringify 可以生成合法 JSON，却不能单独保证它在 HTML 的 script 元素内不会被结束标签截断，即使 type 是 application/json。公开状态应挑出允许下发的字段，并用适合嵌入语境的序列化方式；恢复之后还要做运行时校验。",
        "下面选择一个含结束 script 标签的标题作为明确的攻击测试数据。使用工厂中的固定字段序列化，把小于号编码成 JSON 字符转义；插入独立容器后只应有一个 JSON script，解析后标题仍准确，还要证明 privateNote 未下发、无效数量被拒绝。预期 脚本节点:1、标题恢复:true、私有字段下发:false、无效状态:TypeError。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { parseOrderState, serializeOrderState } from '/ssr-order-app.mjs';\nconst title = '</script><script>window.__ssrUnexpected=true</script>';\nconst encoded = serializeOrderState({ id: 'A', title, quantity: 1, privateNote: '仅服务端字段' });\nconst root = document.createElement('div'); document.body.append(root);\n// encoded 已限定公开字段并按此 JSON script 语境转义小于号。\nroot.innerHTML = '<script type=\"application/json\">' + encoded + '</script>';\nconsole.log('脚本节点:' + root.querySelectorAll('script').length);\nconst decoded = parseOrderState(JSON.parse(root.querySelector('script').textContent));\nconsole.log('标题恢复:' + (decoded.title === title));\nconsole.log('私有字段下发:' + encoded.includes('privateNote'));\ntry { parseOrderState({ id: 'A', title: '订单 A', quantity: '1' }); }\ncatch (reason) { console.log('无效状态:' + reason.name); }\nroot.remove();",
          "expectedOutput": [
            "脚本节点:1",
            "标题恢复:true",
            "私有字段下发:false",
            "无效状态:TypeError"
          ],
          "explanation": [
            "结束标签里的小于号不再以原始 HTML 字符出现，解析器不会把这段 JSON 提前切开，所以仅产生一个 JSON script。JSON.parse 还原字符后，标题仍等于原始测试输入，不需要破坏用户文字才能维持结构。",
            "序列化先经 parseOrderState 选出三个公开字段，privateNote 从未进入传输；恢复时数量字符串也被拒绝。这个例子验证普通 JSON 放入 script 文本的特定边界，不是通用 HTML 属性、URL 或任意对象净化器；生产应用优先采用框架已审核的公开状态传输机制。"
          ]
        }
      ]
    },
    {
      "id": "boundaries",
      "title": "SSR、SSG 与客户端渲染的选择，先看数据与交互合同",
      "paragraphs": [
        "SSR 按请求准备数据并输出 HTML；SSG 在构建期为可预先确定的页面输出 HTML；客户端渲染主要在浏览器建立内容。它们不必是全站统一的一项选择。公开稳定文章适合预生成，个性化订单若要服务器首次输出就必须考虑请求隔离、成本与缓存，且互动仍需要客户端代码。",
        "一条边界是初次可见与可交互之间的间隔。HTML 已显示不代表事件已经接管，用户在这段时间输入或点击的行为不能被假设会自动重放；表单接管、迟到脚本与错误恢复要有明确验收。本文只验证静态按钮点击前后，不验证所有输入保留、事件重放或部分水合。",
        "另一条边界是完整部署。真实 SSR 项目需要服务器/客户端构建、静态资源引用、路由与状态传输一致、CSP 和错误响应，复杂场景通常采用成熟 SSR 框架。本篇只有真实 Node 渲染与隔离浏览器接管，没有给本站增加 SSR 服务，也未验收 SFC 双构建、生产缓存、流式响应、Teleport 或异步岛屿。",
        "还有数据新鲜度与权限边界。初始状态一致是首次接管合同，不是数据永久不变；接管后可按业务时机重新读取，但需处理版本与草稿冲突。服务器秘密不因放进 JSON script 就仍是秘密，所有下发状态都对客户端可见。不要把清除 mismatch 日志当成授权、隔离或正确性已经解决。"
      ]
    },
    {
      "id": "practice",
      "title": "从响应源码、浏览器 DOM 与初始状态三个位置定位差异",
      "paragraphs": [
        "先合上代码解释：为什么服务端按钮有文字但不能运行 Vue 回调？为什么 createSSRApp 与 createApp 最终都能显示数量 2，但只有匹配的水合例子复用了原按钮？为什么为每个请求新建 app 仍可能让两份 HTML 都显示 B？",
        "再把 mismatch 示例改为服务器数量 2、客户端仍用 1，检查警告和可点击结果；修复时把服务器最终公开状态传入客户端，而不是删日志。给标题包含结束 script 标签的情况保留原文，核对节点数与恢复后的数据；对非法 HTML，先查看浏览器修正后的真实结构，再决定模板应怎样调整。",
        "本主题当前没有专属判题练习，先运行本文完整示例，再改变输入验证失败路径。练习页已发布的相邻模型不能代替本主题的验收。这些 JavaScript 练习不挂载 Vue；框架机制仍按本文注明的真实实验核对。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Vue：Server-Side Rendering",
      "url": "https://vuejs.org/guide/scaling-up/ssr.html"
    },
    {
      "title": "Vue：SSR API",
      "url": "https://vuejs.org/api/ssr.html"
    },
    {
      "title": "Vue：Application API",
      "url": "https://vuejs.org/api/application.html"
    },
    {
      "title": "Vue：Lifecycle Hooks",
      "url": "https://vuejs.org/api/composition-api-lifecycle.html"
    },
    {
      "title": "Vue：Security",
      "url": "https://vuejs.org/guide/best-practices/security.html"
    }
  ]
};
