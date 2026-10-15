import type { Article } from "../articles";

export const serverComponentsBoundaryArticle: Article = {
  "revision": 2,
  "id": "K07-07",
  "kind": "knowledge",
  "domainSlug": "react",
  "slug": "server-components-boundary",
  "title": "服务端组件与边界",
  "summary": "按 React 19 的服务器组件模型区分服务器读取和客户端状态，并限制跨过 use client 边界的模块与属性。",
  "aliases": ["RSC", "use client", "server components", "服务端组件", "序列化"],
  "tags": ["React", "服务器组件", "服务端组件与边界"],
  "estimatedMinutes": 23,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "数据库查询写在组件里，为什么打包后仍把它送到了浏览器？",
      "paragraphs": [
        "订单页需要读数据库，也需要一个可点击的筛选按钮。把查询和 useState 写在同一个文件里，支持服务器组件的打包器必须决定这段代码在哪里执行。服务器组件可以在服务器上异步读取数据，但不能使用 state 和 Effect。客户端组件可以交互，但它的模块会进入客户端包，不能再导入只应留在服务器的文件。",
        "本仓库 package.json 中的 React 版本是 19.3.0，提供的是客户端运行时。空白页示例不启动服务器组件打包器，也没有执行 react-server 条件导出。下面的表格和导入规则按照 React 19 文档中的边界整理，用来检查设计；后文另以真实 SSR 对照，不能把它当成 RSC 构建证据。"
      ]
    },
    {
      "id": "capability",
      "title": "服务器读取数据，客户端保存交互状态",
      "paragraphs": [
        "在支持该模型的应用里，从服务器入口导入、没有进入 use client 依赖图的组件作为服务器组件执行。没有客户端指令的模块也可能被客户端入口导入，不能只检查当前文件有没有指令就判断执行环境。它可以是 async 函数并读取数据库、文件或请求头。它不拥有跨交互保持的 useState，也不会在浏览器里执行 useEffect。交互、浏览器 API 和事件处理放在客户端组件。",
        "能力不能靠运行后的报错来试。设计时先列出每个函数要读的资源和要保留的交互。需要两者时，把它们拆成服务器父组件和客户端子组件，而不是在一个函数里同时调用 readDatabase 和 useState。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function capability(env, api) {\n  const table = {\n    server: new Set(['readDatabase', 'asyncRender']),\n    client: new Set(['useState', 'useEffect', 'onClick'])\n  };\n  return table[env].has(api) ? 'available' : 'unavailable';\n}\nconsole.log([capability('server', 'useState'), capability('server', 'readDatabase')].join(','));\nconsole.log([capability('client', 'useState'), capability('client', 'readDatabase')].join(','));",
          "expectedOutput": ["unavailable,available", "available,unavailable"],
          "explanation": [
            "服务器环境没有 useState，可以读取数据库。客户端环境可以保存状态，没有直接的数据库读取能力。",
            "这是文档边界的检查表。某个框架若把数据访问封装成客户端请求，那是另一条网络路径，不再是服务器组件的直接读取。"
          ]
        }
      ]
    },
    {
      "id": "import",
      "title": "客户端模块不能导入服务器模块",
      "paragraphs": [
        "服务器组件可以渲染客户端组件，把客户端组件当作子节点或通过允许的方式引用。这个方向传递的是已序列化的属性和子树插槽。客户端组件的文件不能 import 服务器组件模块，否则只应留在服务器的代码会被拉进客户端图。",
        "想在客户端交互周围显示服务器内容时，由服务器父组件获取内容，再把客户端组件放在中间，把服务器内容作为 children 传下去。不要在客户端文件里导入服务器页面来“嵌一下”。指令 use client 标在文件入口，该文件及其专属导入进入客户端图；它不是在某一行函数上临时切换环境的开关。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function importAllowed(from, to) {\n  if (from === 'server' && to === 'client') return 'allowed:child-reference';\n  if (from === 'client' && to === 'server') return 'blocked:server-module';\n  return 'allowed:same';\n}\nconsole.log(importAllowed('server', 'client'));\nconsole.log(importAllowed('client', 'server'));\nconsole.log(importAllowed('client', 'client'));",
          "expectedOutput": ["allowed:child-reference", "blocked:server-module", "allowed:same"],
          "explanation": [
            "服务器引用客户端子组件是允许的边界。客户端导入服务器模块被阻止。客户端之间可以互相导入。",
            "allowed:child-reference 表示引用客户端入口并传递可序列化属性，不表示服务器可以调用客户端组件里的函数。"
          ]
        }
      ]
    },
    {
      "id": "props",
      "title": "跨过边界的属性必须能被服务器组件协议序列化",
      "paragraphs": [
        "从服务器传到客户端的属性会变成载荷的一部分。字符串、数字、普通对象和数组可以传递。普通函数闭包、类实例和持有服务器资源的对象不能当作普通属性传过去；框架支持的 Server Function 引用是专门的协议能力，不属于这个普通函数限制。事件处理函数应定义在客户端模块内部，而不是由服务器查询结果临时构造再传下来。",
        "structuredClone 能拒绝函数，因此可以当作一个本地的红灯示例。它不是 React Flight 协议：日期、Map 和某些特殊值在两边的支持范围可能不同。下面只把“普通对象可以通过克隆检查”和“含函数的对象会失败”当作边界提醒，最终以支持 RSC 的打包器和 React 19 的序列化规则为准。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function classify(value) {\n  try {\n    structuredClone(value);\n    return 'clone-ok';\n  } catch (error) {\n    return 'blocked:' + error.name;\n  }\n}\nconsole.log(classify({ id: 'a', count: 1 }));\nconsole.log(classify({ id: 'a', onClick() {} }));",
          "expectedOutput": ["clone-ok", "blocked:DataCloneError"],
          "explanation": [
            "普通数据可以被 structuredClone 复制。对象里的函数不能，克隆以 DataCloneError 失败。",
            "克隆成功不等于该值一定是合法的服务器组件属性。日期等类型要通过目标框架的序列化测试，不能只看这个空白页结果。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "给整个路由都加上 use client",
      "paragraphs": [
        "错误修复是数据读取失败后，把页面根文件标成客户端组件，再在 Effect 里请求接口。数据库模块和密钥因此更接近客户端边界，页面也失去服务器直接渲染数据的结构。应把按钮和输入拆成小的客户端组件，数据读取留在服务器父级。",
        "另一个错误是把服务端连接或查询函数放进属性，指望客户端帮你执行。客户端应收到已经取好的可序列化数据、框架支持且重新检查权限的 Server Function 引用，或自己发起受权限控制的 HTTP 请求。秘密和数据库凭据不能进入客户端模块。"
      ]
    },
    {
      "id": "boundaries",
      "title": "本文执行普通 SSR，服务器组件构建仍需目标框架验证",
      "paragraphs": [
        "第一条边界是运行时。本文的 RSC 检查表没有配置 react-server 条件或 RSC 打包器；后面的 renderToString 只执行普通 HTML SSR。把检查表通过，只说明设计符合文档中的方向；一个具体框架还有自己的文件约定和缓存。",
        "第二条边界是水合与版本。服务器输出和客户端 React 版本必须配套。本仓库当前安装 19.3.0，不能据此推断生产环境的 React 或框架版本。升级任一边都要重新核对指令、序列化和水合错误。"
      ]
    },
    {
      "id": "ssr-is-not-rsc",
      "title": "真实 SSR 对照：能在服务器输出 HTML，不等于启用了服务器组件",
      "paragraphs": [
        "本项目安装的是普通 React 与 React DOM，没有配置 Flight 或 RSC 打包器。下面在 Node 中调用真实 renderToString：包含 useState 的交互组件也能先输出 HTML，事件处理器不会变成 HTML 中的可执行函数；浏览器仍需水合才能获得这段点击行为。",
        "因此 use client 定义支持该机制的构建系统中的模块边界，不是“绝不在服务器运行”的标记。RSC 的服务器执行与 SSR 的 HTML 输出是两个阶段，不能用本地布尔检查表证明已经完成其中一个框架的构建合同。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { createElement as h, useState } from 'react';\nimport { renderToString } from 'react-dom/server';\nfunction Counter() {\n  const [count, setCount] = useState(1);\n  return h('button', { onClick: () => setCount(value => value + 1) }, count);\n}\nconst html = renderToString(h(Counter));\nconsole.log(html);\nconsole.log('含事件函数:' + html.includes('onClick'));",
          "expectedOutput": [
            "<button>1</button>",
            "含事件函数:false"
          ],
          "explanation": [
            "服务端首次 render 取到 count=1，输出按钮标记，但没有 DOM 事件监听。这个例子是真的 SSR，不是 RSC：没有验证服务器组件载荷、模块分类或 Server Function 调用。",
            "支持 RSC 的框架允许传递符合协议的 Server Function 引用，不能将“所有函数都不能跨边界”作为无例外规则；普通闭包、数据库连接及秘密仍不能作为普通客户端 props 传递。请使用框架支持的序列化类型与授权入口，不能用 structuredClone 的结果代替 Flight 合同。"
          ]
        }
      ]
    },
    {
      "id": "practice",
      "title": "给四个 API 和两条导入标出能否使用",
      "paragraphs": [
        "预测 useState 和 readDatabase 在服务器与客户端的可用性。再预测服务器导入客户端、客户端导入服务器是否允许。最后预测含 onClick 的对象能否通过克隆检查，并说明为什么克隆成功仍不够。",
        "本主题当前没有专属判题练习，先运行本文完整示例，再改变输入验证失败路径。练习页已发布的相邻模型不能代替本主题的验收。这些 JavaScript 练习不挂载 React；组件身份、Effect 和挂起行为按本文注明的真实运行环境核对。"
      ]
    }
  ],
  "sources": [
    { "title": "React：服务器组件", "url": "https://react.dev/reference/rsc/server-components" },
    { "title": "React：use client", "url": "https://react.dev/reference/rsc/use-client" }
  ]
};
