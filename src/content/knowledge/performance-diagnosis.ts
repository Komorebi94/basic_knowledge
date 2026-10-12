import type { Article } from "../articles";

export const performanceDiagnosisArticle: Article = {
  "id": "K07-08",
  "kind": "knowledge",
  "domainSlug": "react",
  "slug": "performance-diagnosis",
  "title": "性能诊断与优化",
  "summary": "先用测量定位重复渲染，再决定是否使用 memo、代码分割或虚拟列表，并用同一交互比较优化前后。",
  "aliases": ["memo", "virtualization", "code splitting", "performance.measure", "性能"],
  "tags": ["React", "性能", "性能诊断与优化"],
  "estimatedMinutes": 23,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "给每一行都加了 memo，为什么输入仍然卡？",
      "paragraphs": [
        "长列表里每输入一个字都明显停顿。作者给行组件包上 memo，停顿还在。父组件每次渲染都创建新的 items 数组和新的点击函数，memo 的前后属性用 Object.is 比较，引用变了就会继续渲染。优化要先知道时间花在渲染、布局还是网络，再让比较能够成功。",
        "前置是 K07-01 的渲染和 K04-02 的布局成本。示例使用性能时间线的标记名称，以及引用相等和可见区间的纯计算。duration 的具体毫秒数不稳定，所以不断言某一帧的耗时。React 19.3.0 的 Profiler 需要在真实组件树里记录，本文模型不替代那次记录。"
      ]
    },
    {
      "id": "measure",
      "title": "先标记同一次交互，再比较优化",
      "paragraphs": [
        "在交互开始和结束放置同名标记，再用 measure 把它们连成一条记录。记录的 name 可以在断言里核对，duration 是数字，但它随机器和负载变化。比较优化时要重复同一操作、同一数据量和同一设备条件，看分布而不是看一次最小值。",
        "组件级重复渲染用 React Profiler 看是谁渲染、为什么渲染。长任务和布局用浏览器性能面板。两个工具回答的层次不同。没有记录之前，不根据组件数量决定加 memo 或虚拟列表。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "performance.mark('list-start');\nperformance.mark('list-end');\nperformance.measure('list', 'list-start', 'list-end');\nconst measure = performance.getEntriesByName('list')[0];\nconsole.log(measure.name);\nconsole.log(String(typeof measure.duration === 'number'));",
          "expectedOutput": ["list", "true"],
          "explanation": [
            "测量名称是 list。耗时字段是数字；示例不打印它的值，避免把某次空白页的微秒数写成性能合同。",
            "标记留在当前页面的性能缓冲区。测试结束后可以清理同名记录，避免下一次交互读到旧测量。"
          ]
        }
      ]
    },
    {
      "id": "memo",
      "title": "memo 只在前后属性引用都没变时跳过渲染",
      "paragraphs": [
        "memo 比较上一次和这一次的 props。items 和 onClick 都是同一引用时，可以跳过这棵子树。父组件写了内联箭头函数或重新 filter 出新数组，即使内容看起来一样，比较也会失败并重新渲染。先把稳定的数据放在 state 或模块常量里，把真正变化的 id 分开传递。",
        "跳过渲染不是免费的：比较本身有成本，而且被跳过的子树若依赖上下文，上下文变化仍会更新它。memo 适合已经测到、并且属性能够稳定的昂贵子树。便宜的小组件、每次属性本来就会变的组件，不需要这层包装。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function memoRender(previous, next) {\n  const same = previous.items === next.items && previous.onClick === next.onClick;\n  return same ? 'skip' : 'render';\n}\nconst items = [1];\nconst onClick = () => {};\nconsole.log(memoRender({ items, onClick }, { items, onClick }));\nconsole.log(memoRender({ items, onClick }, { items: [1], onClick }));\nconsole.log(memoRender({ items, onClick }, { items, onClick: () => {} }));",
          "expectedOutput": ["skip", "render", "render"],
          "explanation": [
            "同一数组和同一函数可以跳过。新数组或新函数都会重新渲染，尽管数组里的数字同样是 1。",
            "比较没有深相等。若业务需要按内容跳过，应先保证引用稳定，而不是在每一行做昂贵的深比较。"
          ]
        }
      ]
    },
    {
      "id": "window",
      "title": "虚拟列表只挂载窗口内的行，分割只加载打开后的代码",
      "paragraphs": [
        "一千行都创建真实输入和效果，成本会落在提交和布局上。虚拟列表根据滚动位置计算可见下标，并在窗口外保留少量 overscan，只挂载这一段。滚动 0、视口 200、行高 40、没有 overscan 时，区间是 0 到 5。滚到 400 且 overscan 为 1 时，起点提前一行，终点多留一行，区间是 9 到 16。行高不固定时不能使用这个除法，要改为测量后的偏移表。",
        "编辑器、图表等不在首屏使用的代码可以等用户打开再加载。没打开时只显示外壳，打开后先进入加载，模块到达后再显示编辑器。分割减少的是初始脚本，不减少已经打开之后的渲染成本。加载失败要能重试，不能停在永远的加载状态。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function visibleRange(scrollTop, height, itemHeight, count, overscan) {\n  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);\n  const end = Math.min(count, Math.ceil((scrollTop + height) / itemHeight) + overscan);\n  return start + '-' + end;\n}\nfunction panel(opened, loaded) {\n  if (!opened) return 'shell';\n  if (!loaded) return 'loading';\n  return 'editor';\n}\nconsole.log(visibleRange(0, 200, 40, 1000, 0));\nconsole.log(visibleRange(400, 200, 40, 1000, 1));\nconsole.log([panel(false, false), panel(true, false), panel(true, true)].join(','));",
          "expectedOutput": ["0-5", "9-16", "shell,loading,editor"],
          "explanation": [
            "200 除以 40 得到 5 行可见区间。滚动 400 时起点是 10，减过扫描后为 9，终点计算为 16。面板按是否打开和是否加载完显示外壳、加载或编辑器。",
            "区间终点不包含 end 所在的下标，具体组件要把这个约定和定位偏移写一致。固定行高的公式不能直接用于换行后的可变高度。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "未测量就同时加上 memo、缓存和虚拟化",
      "paragraphs": [
        "错误优化是一次提交里引入三种缓存，卡顿减轻后无法知道是哪一种生效，下次数据形状变化又全部失效。每次只改变一个因素，并用同一种标记重复测量。若时间主要花在网络或布局，继续包装组件不会解决。",
        "另一个错误是虚拟列表仍给每一行创建全局订阅或大型闭包。窗口外的组件虽然没挂载，数据层仍可能很重。先减少每行必须持有的状态，再减少挂载数量。"
      ]
    },
    {
      "id": "boundaries",
      "title": "空白页测量不能代表生产交互",
      "paragraphs": [
        "第一条边界是环境。本文只断言测量记录存在并且耗时是数字。生产要在接近用户的设备和数据量上比较，开发模式的检查会让绝对耗时偏大。",
        "第二条边界是正确性。memo 和虚拟化如果改变身份，会重置 K07-03 里的输入状态，或让表单控件失去焦点。性能改动要带一条仍能完成输入、提交和滚动定位的行为检查。"
      ]
    },
    {
      "id": "practice",
      "title": "预测三次属性比较和两个可见区间",
      "paragraphs": [
        "同一引用、新数组、新函数，分别预测 skip 还是 render。再预测滚动位置 0 和 400 的可见区间，以及面板从未打开到加载完成的三个状态。",
        "E30、E31、E38 尚未制作。在真实 React 树里补一次 Profiler 记录后，再决定是否保留 memo。"
      ]
    }
  ],
  "sources": [
    { "title": "React：memo", "url": "https://react.dev/reference/react/memo" },
    { "title": "React：useMemo", "url": "https://react.dev/reference/react/useMemo" }
  ]
};
