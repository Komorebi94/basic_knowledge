import type { Article } from "../articles";

export const concurrentSuspenseArticle: Article = {
  "revision": 2,
  "id": "K07-05",
  "kind": "knowledge",
  "domainSlug": "react",
  "slug": "concurrent-rendering-suspense",
  "title": "并发体验与 Suspense",
  "summary": "让紧急输入留在当前屏幕上，用过渡表示可延后的结果，并把 Suspense 的加载、内容和错误分成三种边界状态。",
  "aliases": ["useTransition", "Suspense", "concurrent rendering", "startTransition", "并发"],
  "tags": ["React", "并发", "并发体验与 Suspense"],
  "estimatedMinutes": 23,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "搜索框每输入一个字，为什么整页都换成了加载中？",
      "paragraphs": [
        "用户在搜索框输入时，请求的结果列表还没准备好，页面却把输入框和列表一起换成加载占位。输入是紧急更新，列表可以等。React 的过渡用来标记可以延后的更新：旧结果先留在屏幕上，新结果准备好再替换，并用 pending 表示正在等待。",
        "前面的时间线用于概念推导，后面的真实实验使用 React 19.3.0 的 use、Suspense、useTransition 与错误边界。它们观察已提交 DOM，不把内部渲染次数或性能提升当作固定保证。"
      ]
    },
    {
      "id": "transition",
      "title": "紧急更新先显示，过渡结果准备好后再替换",
      "paragraphs": [
        "受控输入的 setState 属于紧急更新，它应该马上改变输入框的值。列表筛选、路由内容或大型树的刷新可以放进 startTransition。过渡进行时 isPending 为 true，但当前已经提交的界面仍然显示旧结果。过渡结束才显示新结果。",
        "pending 用于表达过渡仍在进行，不要求把整棵子树卸载成加载占位。已揭示内容在过渡内再次挂起时通常可继续保留；首次挂起或紧急更新再次挂起，Suspense 都可能显示 fallback。应按是否有旧内容和更新优先级设计等待界面。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function play(steps) {\n  let shown = '';\n  const out = [];\n  for (const step of steps) {\n    if (step.kind === 'urgent') { shown = step.value; out.push('show:' + shown); }\n    if (step.kind === 'pending') out.push('pending:' + shown);\n    if (step.kind === 'ready') { shown = step.value; out.push('show:' + shown); }\n  }\n  return out.join(',');\n}\nconsole.log(play([\n  { kind: 'urgent', value: 'ab' },\n  { kind: 'pending' },\n  { kind: 'ready', value: 'abc' }\n]));",
          "expectedOutput": ["show:ab,pending:ab,show:abc"],
          "explanation": [
            "紧急更新先把屏幕设为 ab。等待期间标记 pending，但显示值仍是 ab。准备好后才变成 abc。",
            "时间线是文档行为的顺序模型。它没有模拟可中断渲染，也没有测量输入延迟。"
          ]
        }
      ]
    },
    {
      "id": "suspense",
      "title": "边界只在子树尚未完成时显示后备内容",
      "paragraphs": [
        "Suspense 在子树使用受支持的挂起来源时生效，例如 lazy 加载代码、use 读取稳定 Promise 或兼容框架的数据源。Effect 和普通事件回调里的 fetch 本身不会激活边界。挂起期间可显示 fallback，兑现后重试渲染；客户端渲染错误交给错误边界。",
        "数据获取若写在渲染函数里并且每次调用都发请求，渲染重跑就会重复请求。能暂停的读取需要稳定缓存：同一输入在缓存未完成时暂停，完成后返回同一结果。获取的身份、取消和过期仍遵守请求规则，不能因为边界显示了 fallback 就忽略旧请求。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function boundary(child) {\n  if (child.status === 'pending') return 'fallback';\n  if (child.status === 'error') return 'error-boundary';\n  return 'content:' + child.value;\n}\nlet calls = 0;\nfunction uncachedRead() { calls += 1; return 'pending'; }\nuncachedRead(); uncachedRead();\nconsole.log(boundary({ status: 'pending' }));\nconsole.log(boundary({ status: 'ready', value: 'list' }));\nconsole.log(boundary({ status: 'error' }));\nconsole.log('reads:' + calls);",
          "expectedOutput": ["fallback", "content:list", "error-boundary", "reads:2"],
          "explanation": [
            "pending 显示后备，ready 显示内容，error 交给错误边界。uncachedRead 执行两次，calls 为 2，说明没有缓存的读取会随渲染次数增加。",
            "示例里的 status 是已经归类的结果。真实 Suspense 通过渲染期间的暂停完成切换，错误则由错误边界捕获。"
          ]
        }
      ]
    },
    {
      "id": "scope",
      "title": "过渡和边界都要选对粒度",
      "paragraphs": [
        "把整个页面路由放进一个过渡，输入反馈也可能被大树拖住。把每一个按键都放进过渡，输入又会显得迟滞。通常输入值紧急更新，由此触发的列表放进过渡。多个互不相关的区域使用各自的 Suspense 边界，一块加载不会清空另一块已经完成的内容。",
        "嵌套边界时，内层可以先显示自己的 fallback，外层继续显示已经完成的兄弟。首次加载和后续刷新也可以使用不同边界：首次没有旧内容，后续刷新保留旧内容并显示 pending。这个选择要写进界面状态，而不是等加载变慢再临时加一层。"
      ]
    },
    {
      "id": "mistakes",
      "title": "用一个 isLoading 替换整页",
      "paragraphs": [
        "错误状态是任一请求开始就把根组件换成加载图。输入、导航和已有内容一起消失，完成后又全部重挂，本地状态被重置。应区分紧急更新、可延后更新和没有旧内容的首次等待。",
        "另一个错误是在渲染期间直接 fetch，靠 Suspense 的外观包住重复请求。渲染次数不是请求次数的合同。读取要进入有身份的缓存，并在输入变化时取消或忽略过期结果。"
      ]
    },
    {
      "id": "boundaries",
      "title": "时间线不测量帧率和水合",
      "paragraphs": [
        "第一条边界是调度。React 可以选择重跑过渡渲染、丢弃未提交的结果。示例只规定已经能被用户看到的顺序，不记录内部渲染了几次。性能是否改善要用 K07-08 的测量，而不是用 pending 的出现来证明。",
        "第二条边界是服务器渲染。服务端输出的后备内容和客户端水合必须对应同一边界。本示例在空白页运行，没有水合 React 19 的服务端输出。"
      ]
    },
    {
      "id": "react-suspense-experiment",
      "title": "真实 Suspense：普通异步状态与可挂起读取不是同一件事",
      "paragraphs": [
        "以下为真实 React 19.3.0 开发构建实验，运行 npm run verify:k07。隔离服务将本仓库安装的 react、react-dom/client 与测试 act 打包为 /react.mjs；普通项目分别从这些包导入相同 API。act 只用于让测试中的更新完成，不应放进产品事件处理器。每例创建独立根并在结束时卸载，不运行读者代码。",
        "为 Promise 在渲染外固定身份，用 use 读取它。初次未完成时看到 fallback，兑现后显示内容；再通过紧急更新换成另一份 pending Promise，会重新出现 fallback。最后拒绝本轮 Promise，由错误边界呈现恢复提示。普通 Effect 内 fetch 不会自动被 Suspense 检测。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createElement as h, createRoot, Component, Suspense, use, act } from '/react.mjs';\nglobalThis.IS_REACT_ACT_ENVIRONMENT = true;\nconst deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };\nclass ErrorBoundary extends Component {\n  state = { failed: false };\n  static getDerivedStateFromError() { return { failed: true }; }\n  render() { return this.state.failed ? h('p', null, '读取失败，请重试') : this.props.children; }\n}\nfunction Result({ promise }) { return h('p', null, use(promise)); }\nconst host = document.body.appendChild(document.createElement('div'));\nconst caught = [];\nconst root = createRoot(host, { onCaughtError: error => caught.push(error.message) });\nconst view = promise => h(ErrorBoundary, null, h(Suspense, { fallback: h('p', null, '读取中') }, h(Result, { promise })));\nconst first = deferred();\nawait act(async () => { root.render(view(first.promise)); });\nconsole.log(host.textContent);\nawait act(async () => { first.resolve('第一份内容'); });\nconsole.log(host.textContent);\nconst second = deferred();\nawait act(async () => { root.render(view(second.promise)); });\nconsole.log('后备:' + host.textContent.includes('读取中'));\nawait act(async () => { second.reject(new Error('unavailable')); });\nconsole.log(host.textContent);\nconsole.log('已捕获:' + caught.join(','));\nawait act(async () => { root.unmount(); }); host.remove();",
          "expectedOutput": [
            "读取中",
            "第一份内容",
            "后备:true",
            "读取失败，请重试",
            "已捕获:unavailable"
          ],
          "explanation": [
            "第一次渲染的 use 读取未完成 Promise，边界显示读取中；兑现后 React 重试渲染，输出第一份内容。换成第二份 pending Promise 的紧急更新会再次隐藏旧内容并显示后备，不能说 fallback 只用于首次加载。",
            "第二份 Promise 拒绝时，use 重新抛出错误，由 ErrorBoundary 切换为失败提示。这个教学边界没有内建重试按钮，应用可通过更新身份并重置错误边界恢复；单纯在 Effect 中维护 loading，不会自动进入同一挂起协议。",
            "onCaughtError 将预期错误交给记录数组，最后核对 unavailable；没有把任意错误都当成正确失败，也不把错误输出混进常规日志。测试断言错误原因和恢复界面，正式应用可以在此接入脱敏上报。"
          ]
        }
      ]
    },
    {
      "id": "react-transition-experiment",
      "title": "真实 Transition：保留旧内容，紧急输入先提交",
      "paragraphs": [
        "以下为真实 React 19.3.0 开发构建实验，运行 npm run verify:k07。隔离服务将本仓库安装的 react、react-dom/client 与测试 act 打包为 /react.mjs；普通项目分别从这些包导入相同 API。act 只用于让测试中的更新完成，不应放进产品事件处理器。每例创建独立根并在结束时卸载，不运行读者代码。",
        "把输入文字和结果 Promise 分成两份状态。输入更新保持紧急，结果切换放入 startTransition。受控 deferred 使等待时刻确定可见；这检验界面合同，不依赖人为 sleep 或某一帧的渲染次数。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createElement as h, createRoot, Suspense, use, useState, useTransition, act } from '/react.mjs';\nglobalThis.IS_REACT_ACT_ENVIRONMENT = true;\nlet resolveNext;\nconst initial = Promise.resolve('旧列表');\nconst next = new Promise(resolve => { resolveNext = resolve; });\nfunction List({ promise }) { return h('output', null, use(promise)); }\nfunction App() {\n  const [input, setInput] = useState('a');\n  const [result, setResult] = useState(initial);\n  const [pending, startTransition] = useTransition();\n  return h('section', null,\n    h('button', { onClick() { setInput('ab'); startTransition(() => setResult(next)); } }, '输入 ab'),\n    h('span', null, input + ':' + pending),\n    h(Suspense, { fallback: h('p', null, '读取中') }, h(List, { promise: result })));\n}\nconst host = document.body.appendChild(document.createElement('div'));\nconst root = createRoot(host);\nawait act(async () => { root.render(h(App)); });\nawait act(async () => { host.querySelector('button').click(); });\nconsole.log(host.querySelector('span').textContent);\nconsole.log(host.querySelector('output').textContent);\nawait act(async () => { resolveNext('新列表'); });\nconsole.log(host.querySelector('span').textContent);\nconsole.log(host.querySelector('output').textContent);\nawait act(async () => { root.unmount(); }); host.remove();",
          "expectedOutput": [
            "ab:true",
            "旧列表",
            "ab:false",
            "新列表"
          ],
          "explanation": [
            "点击后紧急输入已是 ab，过渡仍 pending，先前提交的旧列表继续显示。Promise 兑现后，新树可以提交，结果为新列表，pending 结束。这里保留的是已揭示的边界内容；边界 key 改变或首次没有旧内容时，呈现策略会不同。",
            "startTransition 的回调立即执行，写在回调中的昂贵同步计算仍会占主线程；它标记 React 更新，不是通用后台线程。异步 Action 在 await 后需要按当前 API 再标记更新，且不能自动解决请求乱序；请求身份、取消与错误仍单独处理。"
          ]
        }
      ]
    },
    {
      "id": "practice",
      "title": "把一次输入拆成紧急和可延后两步",
      "paragraphs": [
        "用户从 ab 输入到 abc，列表稍后返回。按顺序写出屏幕显示和 pending。再预测子树 pending、ready、error 时边界分别输出什么。最后说明为什么两次无缓存读取会留下两次调用。",
        "本主题当前没有专属判题练习，先运行本文完整示例，再改变输入验证失败路径。练习页已发布的相邻模型不能代替本主题的验收。这些 JavaScript 练习不挂载 React；组件身份、Effect 和挂起行为按本文注明的真实运行环境核对。"
      ]
    }
  ],
  "sources": [
    { "title": "React：useTransition", "url": "https://react.dev/reference/react/useTransition" },
    { "title": "React：Suspense", "url": "https://react.dev/reference/react/Suspense" }
  ]
};
