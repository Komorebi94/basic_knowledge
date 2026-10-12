import type { Article } from "../articles";

export const concurrentSuspenseArticle: Article = {
  "id": "K07-05",
  "kind": "knowledge",
  "domainSlug": "react",
  "slug": "concurrent-rendering-suspense",
  "title": "并发体验与 Suspense",
  "summary": "让紧急输入留在当前屏幕上，用过渡表示可延后的结果，并把 Suspense 的加载、内容和错误分成三种边界状态。",
  "aliases": ["useTransition", "Suspense", "concurrent rendering", "startTransition", "并发"],
  "tags": ["React", "并发", "并发体验与 Suspense"],
  "estimatedMinutes": 23,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "搜索框每输入一个字，为什么整页都换成了加载中？",
      "paragraphs": [
        "用户在搜索框输入时，请求的结果列表还没准备好，页面却把输入框和列表一起换成加载占位。输入是紧急更新，列表可以等。React 的过渡用来标记可以延后的更新：旧结果先留在屏幕上，新结果准备好再替换，并用 pending 表示正在等待。",
        "前置是 K07-01 的渲染可能重跑，以及 K07-02 的外部同步。本仓库的 React 是 19.3.0。示例按文档里的可见行为排列时间线，不调用 useTransition，也不证明某个浏览器帧里发生了多少次渲染。"
      ]
    },
    {
      "id": "transition",
      "title": "紧急更新先显示，过渡结果准备好后再替换",
      "paragraphs": [
        "受控输入的 setState 属于紧急更新，它应该马上改变输入框的值。列表筛选、路由内容或大型树的刷新可以放进 startTransition。过渡进行时 isPending 为 true，但当前已经提交的界面仍然显示旧结果。过渡结束才显示新结果。",
        "pending 不是把整棵子树卸载成加载占位的指令。若产品要求输入时保留旧列表并显示一个小的等待标记，就用 pending 驱动那个标记。若一段内容在首次出现前没有旧结果，才用 Suspense 的 fallback。不要把这两种等待画成同一个组件状态。"
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
        "Suspense 边界包住可以等待的子树。子树尚未完成时，边界显示 fallback；完成后显示内容。子树渲染出错则交给错误边界，Suspense 本身不处理错误。fallback 应该是这一小块的等待界面，不要把整个应用壳层放进同一个边界。",
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
      "id": "practice",
      "title": "把一次输入拆成紧急和可延后两步",
      "paragraphs": [
        "用户从 ab 输入到 abc，列表稍后返回。按顺序写出屏幕显示和 pending。再预测子树 pending、ready、error 时边界分别输出什么。最后说明为什么两次无缓存读取会留下两次调用。",
        "E30、E31、E38 尚未制作。接入 React 时用受控输入观察旧列表是否保留，不要只看加载组件是否出现。"
      ]
    }
  ],
  "sources": [
    { "title": "React：useTransition", "url": "https://react.dev/reference/react/useTransition" },
    { "title": "React：Suspense", "url": "https://react.dev/reference/react/Suspense" }
  ]
};
