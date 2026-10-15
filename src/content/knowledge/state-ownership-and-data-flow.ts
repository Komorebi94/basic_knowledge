import type { Article } from "../articles";

export const stateOwnershipDataFlowArticle: Article = {
  "revision": 2,
  "id": "K07-04",
  "kind": "knowledge",
  "domainSlug": "react",
  "slug": "state-ownership-and-data-flow",
  "title": "状态所有权与数据流",
  "summary": "把只服务一个组件的状态留在本地，把共享事实提升到共同父级，并避免把服务端响应当成第二份永久副本。",
  "aliases": ["state ownership", "lifting state", "server state", "数据流", "状态提升"],
  "tags": ["React", "状态", "状态所有权与数据流"],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "两个购物车数字，为什么一个变成 2、另一个还是 1？",
      "paragraphs": [
        "导航和结算页都显示购物车数量。点击加购后导航变成 2，结算页仍显示进入页面时复制的 1。两份 state 用同一个初始值创建，之后各自修改。共享的事实需要一个所有者，其他组件只接收当时的值和请求修改的回调。",
        "前置是 K07-01 的快照和 K07-03 的组件身份。先用普通对象解释复制和共享，再通过真实父子组件展示 prop 初值与共享状态的差别。服务端数据仍需处理过期响应与基线版本，状态提升不会消除这些边界。"
      ]
    },
    {
      "id": "local",
      "title": "只有一个组件使用的草稿留在该组件",
      "paragraphs": [
        "输入框尚未提交的文字、面板是否展开、一次不受别人影响的动画开关，放在使用它的组件里最清楚。提升到全局会让无关渲染读到这份草稿，也会让离开页面后的清理变模糊。",
        "本地状态的初始值只在挂载时采用。父组件后来传入的新 initialCount 不会自动改写已有 state。若业务要求属性变化就重置，使用 K07-03 的 key，或在明确事件里调用更新函数。不要在渲染期间因为 props 和 state 不同就无条件 setState，那会形成重复渲染。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function mount(initial) {\n  let value = initial;\n  return { read: () => value, set: next => { value = next; } };\n}\nconst field = mount(1);\nconsole.log(field.read());\nfield.set(2);\nconsole.log(field.read());\nconst ignored = 3;\nconsole.log(field.read() + ':' + ignored);",
          "expectedOutput": ["1", "2", "2:3"],
          "explanation": [
            "挂载时读到初始值 1，set 之后读到 2。之后出现的 3 没有写进这份状态，所以仍是 2。",
            "ignored 代表后来的 props。示例没有自动同步它。需要跟随 props 时，应把该值直接当 props 渲染，或用明确的重置身份。"
          ]
        }
      ]
    },
    {
      "id": "lift",
      "title": "多个组件要一起变时，状态放到最近的共同父级",
      "paragraphs": [
        "各自复制初始值之后，更新其中一个对象不会写到另一个对象。把 count 放在父级的一个对象里，两个子视图读取同一属性，一次加法两边都是新值。父级通过 props 把值传下去，通过回调接收修改，数据仍是单向的。",
        "共同父级很远、中间组件只是转发 props 时，可以再考虑上下文或专门的状态模块。那是为了减少转发，不是为了让每个叶子都拥有一份副本。上下文里的值变化仍会通知消费它的组件，所以不要把变化频繁的草稿和很少变化的主题塞进同一个值。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const parent = { count: 1 };\nfunction copy(initial) { return { count: initial }; }\nconst left = copy(parent.count);\nconst right = copy(parent.count);\nleft.count += 1;\nconsole.log([parent.count, left.count, right.count].join(','));\nparent.count += 1;\nconsole.log([parent.count, parent.count].join(','));",
          "expectedOutput": ["1,2,1", "2,2"],
          "explanation": [
            "第一行是两份副本：左边加一后，父级和右边仍是 1。第二行两个视图都读父级，同一次加法之后都是 2。",
            "第二行的两个 parent.count 表示两个子视图没有自己的 count。在 React 里它们应接收同一 prop，而不是调用两次 useState(parent.count)。"
          ]
        }
      ]
    },
    {
      "id": "server",
      "title": "服务端结果需要身份和刷新，不能变成无人维护的第二来源",
      "paragraphs": [
        "接口返回的订单是服务端状态。为了输入草稿可以把它复制到本地，但复制之后就分成了“服务器最后一次响应”和“用户正在编辑的草稿”。提交成功后要决定哪一份获胜，并用响应或重新读取更新服务器副本。请求序号沿用最新请求的规则，过期响应不能覆盖新草稿。",
        "下面用 generation 表示响应身份。只有与当前 generation 相同的响应可以写入 seen。旧响应返回时保持已有值。这不是缓存库，也没有重试；它只防止两份状态里更旧的那份赢。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function createView() {\n  let generation = 0;\n  let seen = '';\n  return {\n    start() { generation += 1; return generation; },\n    commit(id, value) { if (id === generation) seen = value; return seen; }\n  };\n}\nconst view = createView();\nconst first = view.start();\nconst second = view.start();\nconsole.log(view.commit(second, 'new'));\nconsole.log(view.commit(first, 'old'));",
          "expectedOutput": ["new", "new"],
          "explanation": [
            "第二次开始后，generation 是 2。身份 2 的响应写入 new。之后到达的身份 1 被忽略，seen 仍是 new。",
            "commit 在身份不匹配时保留旧值，包括保留空字符串。真实页面还要把失败响应和成功响应都做身份检查。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "为了省事把所有字段放进全局存储",
      "paragraphs": [
        "错误结构是每个输入框都连接全局 store。一个字段的按键通知整页订阅者，草稿也在路由离开后还留在内存里，下一次进入看到别人的半成品。先问这份数据有哪些组件读取、谁能修改、离开页面后是否还应存在。",
        "另一个错误是用 Effect 把 props 复制进 state，再从 state 渲染。复制完成之前会渲染旧值，props 更新时还要再同步一次。能直接由 props 计算出来的值，就在渲染时计算，不要再建一份会过期的状态。"
      ]
    },
    {
      "id": "boundaries",
      "title": "所有权不能解决服务端权威和并发编辑",
      "paragraphs": [
        "第一条边界是权威。父组件拥有的数量仍可能与服务器不一致。提交、库存校验和冲突提示属于接口契约，不因为 React 状态提升而消失。",
        "第二条边界是跨树通信。两个相距很远的组件共享同一事实时，最近父级可能高到不实用。可以使用上下文或外部存储，但存储的更新要能表达来源和版本，不能退回到两份互不通知的副本。"
      ]
    },
    {
      "id": "react-owner-experiment",
      "title": "真实父子实验：复制初值不会持续同步",
      "paragraphs": [
        "以下为真实 React 19.3.0 开发构建实验，运行 npm run verify:k07。隔离服务将本仓库安装的 react、react-dom/client 与测试 act 打包为 /react.mjs；普通项目分别从这些包导入相同 API。act 只用于让测试中的更新完成，不应放进产品事件处理器。每例创建独立根并在结束时卸载，不运行读者代码。",
        "父组件持有数量，受控展示直接读取父值；另一个子组件把该 prop 当作 useState 初值。点击一次父级按钮，比较两者。副本不是错误语法，只有业务需要共享事实时才是错误的所有权选择。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createElement as h, createRoot, useState, act } from '/react.mjs';\nglobalThis.IS_REACT_ACT_ENVIRONMENT = true;\nfunction Copied({ count }) { const [local] = useState(count); return h('output', { 'data-copy': true }, local); }\nfunction App() {\n  const [count, setCount] = useState(1);\n  return h('section', null, h('button', { onClick: () => setCount(value => value + 1) }, '增加'), h('output', { 'data-live': true }, count), h(Copied, { count }));\n}\nconst host = document.body.appendChild(document.createElement('div'));\nconst root = createRoot(host);\nawait act(async () => { root.render(h(App)); });\nawait act(async () => { host.querySelector('button').click(); });\nconsole.log('共享:' + host.querySelector('[data-live]').textContent);\nconsole.log('初值副本:' + host.querySelector('[data-copy]').textContent);\nawait act(async () => { root.unmount(); }); host.remove();",
          "expectedOutput": [
            "共享:2",
            "初值副本:1"
          ],
          "explanation": [
            "父级函数式更新从 1 变成 2，受控 output 每次读取最新 prop，所以显示 2。Copied 组件仍是同一位置和类型，只在第一次挂载时用 1 初始化，之后的 count=2 不会改写 local。",
            "如果子级表示未提交草稿，保留旧值可以合理；此时需要确认、取消和基线版本。如果显示的是共享数量，就删掉副本直接读 prop，而不是加 Effect 追赶它。"
          ]
        }
      ]
    },
    {
      "id": "practice",
      "title": "指出谁拥有购物车数量和草稿",
      "paragraphs": [
        "导航和结算同时显示数量时，预测各自 useState 之后只更新一边的结果，再预测提升到父级后的结果。给两次重叠请求，预测后发先至的旧值能不能覆盖新值。",
        "本主题当前没有专属判题练习，先运行本文完整示例，再改变输入验证失败路径。练习页已发布的相邻模型不能代替本主题的验收。这些 JavaScript 练习不挂载 React；组件身份、Effect 和挂起行为按本文注明的真实运行环境核对。"
      ]
    }
  ],
  "sources": [
    { "title": "React：在组件间共享状态", "url": "https://react.dev/learn/sharing-state-between-components" },
    { "title": "React：选择状态结构", "url": "https://react.dev/learn/choosing-the-state-structure" }
  ]
};
