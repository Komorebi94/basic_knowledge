import type { Article } from "../articles";

export const hooksReuseBoundariesArticle: Article = {
  "id": "K07-06",
  "kind": "knowledge",
  "domainSlug": "react",
  "slug": "hooks-and-reuse-boundaries",
  "title": "Hooks 与复用边界",
  "summary": "解释自定义 Hook 为什么必须保持调用顺序，以及它复用的是逻辑而不是组件之间的状态。",
  "aliases": ["custom hook", "rules of hooks", "dependencies", "复用", "调用顺序"],
  "tags": ["React", "Hooks", "Hooks 与复用边界"],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "条件里多调用了一次 Hook，为什么后面的状态串了？",
      "paragraphs": [
        "组件有时订阅房间，有时不订阅。作者把 useState 写进 if。第一次渲染走了三个 Hook，第二次少了一个，再往下读到的状态槽接到了上一次的另一个值。Hook 的状态按组件本次渲染的调用顺序保存。自定义 Hook 只是把这串调用收进一个函数，不会创建新的状态所有者。",
        "前置是 K07-01 的状态槽和 K07-02 的订阅清理。示例用游标数组演示顺序错位，并用 Object.is 演示依赖比较。它对应 React 文档中的 Hook 规则，不执行 React 19.3.0 的调度。"
      ]
    },
    {
      "id": "order",
      "title": "同一组件的每次渲染都要按同一顺序调用 Hook",
      "paragraphs": [
        "渲染开始时从第一个槽位读取。每调用一次 useState 或 useEffect，游标前进。条件、循环和提前 return 若改变调用次数，后面的调用会读到别人的槽位。规则因此要求 Hook 只在组件或自定义 Hook 的顶层调用。",
        "需要条件订阅时，仍然每次调用 Hook，把条件放进 Hook 的参数或 Effect 内部。不要为了少一次调用把 Hook 放进分支。自定义 Hook 内部的调用顺序也算进这一个组件的总顺序，两个自定义 Hook 不能在同一次渲染里交换位置。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function useStateModel(cursor, initial) {\n  if (cursor.states.length === cursor.index) cursor.states.push(initial);\n  const value = cursor.states[cursor.index];\n  cursor.index += 1;\n  return value;\n}\nfunction component(cursor, enabled) {\n  cursor.index = 0;\n  const a = useStateModel(cursor, 'a');\n  if (enabled) useStateModel(cursor, 'b');\n  const c = useStateModel(cursor, 'c');\n  return a + ',' + c;\n}\nconst cursor = { states: [], index: 0 };\nconsole.log(component(cursor, true));\nconsole.log(component(cursor, false));",
          "expectedOutput": ["a,c", "a,b"],
          "explanation": [
            "第一次启用分支，槽位是 a、b、c，返回的 a 和 c 分别来自第一和第三槽。第二次跳过 b 的调用，名为 c 的读取落到第二槽，得到 b。",
            "这就是顺序错位。正确写法每次都调用同一个 Hook，用 enabled 决定 Effect 是否订阅，而不是增删 Hook 调用。"
          ]
        }
      ]
    },
    {
      "id": "deps",
      "title": "依赖用 Object.is 比较，新对象会变成变化",
      "paragraphs": [
        "Effect 的依赖数组按位置比较。长度不同就是变化；同一位置用 Object.is，对象和函数看引用而不是深比较。每次渲染都写的内联对象是新引用，Effect 会每次清理并重新执行。稳定的回调可以用事件处理函数、ref，或在依赖确实是值的时候把值拆开。",
        "依赖列表应包含 Effect 内使用、并且变化后必须重新同步的值。漏掉 roomId 会继续订阅旧房间。用空数组假装“只运行一次”，会在严格模式下和服务端渲染里暴露错误假设。清理函数要解除同一次订阅，这一点已在 Effect 一文里验证。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function changed(previous, next) {\n  if (previous.length !== next.length) return true;\n  return previous.some((item, index) => !Object.is(item, next[index]));\n}\nconst room = { id: 'a' };\nconst subscribe = () => {};\nconsole.log(String(changed([1, room], [1, room])));\nconsole.log(String(changed([1], [1, room])));\nconsole.log(String(changed([subscribe], [() => {}])));",
          "expectedOutput": ["false", "true", "true"],
          "explanation": [
            "同一数字和同一对象引用视为没变。数组变长视为变了。新写的函数与原来的函数不是同一引用，也视为变了。",
            "比较函数不深比较 room 内部字段。若替换了 room 对象但 id 相同，Effect 仍会重跑；想按 id 同步时，应把 room.id 放进依赖。"
          ]
        }
      ]
    },
    {
      "id": "reuse",
      "title": "自定义 Hook 复用逻辑，不在组件之间共享状态",
      "paragraphs": [
        "每个组件调用 useLocal 都会得到自己的返回值。在一个组件里改它，另一个组件的值不变。这是期望的复用：共享的是建立状态和订阅的步骤，不是那一份数据。需要共享数据时使用 K07-04 的共同所有者，而不是把 useState 包进 Hook 就当成全局存储。",
        "模块级变量会被所有调用者看到。useShared 这样闭包到外部 let 的写法会让两个组件互相改到同一数字，而且这个变量不跟随组件卸载。只有明确的单例，例如当前页面的连接注册表，才适合放在模块里，并要提供释放方法。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function useLocal(initial) { return { value: initial }; }\nconst one = useLocal(1);\nconst two = useLocal(1);\none.value = 2;\nconsole.log(one.value + ',' + two.value);\nlet shared = 0;\nfunction useShared() { return { get: () => shared, set: value => { shared = value; } }; }\nconst first = useShared();\nconst second = useShared();\nfirst.set(4);\nconsole.log(String(second.get()));",
          "expectedOutput": ["2,1", "4"],
          "explanation": [
            "两个 useLocal 的对象互不影响，所以一个变成 2 时另一个仍是 1。useShared 读写模块级变量，第二份读取到 4。",
            "useLocal 在这个模型里没有真正的状态槽，只演示返回值的所有权。模块级共享不会在组件卸载时自动还原，测试之间也会互相污染。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "在回调里调用 Hook 来偷取状态",
      "paragraphs": [
        "错误写法是在点击回调里调用 useState，希望临时得到一个值。Hook 只能在渲染期间按顺序调用，回调里调用会违反规则，也可能在开发检查中直接失败。回调应使用渲染时已经创建的状态和更新函数。",
        "另一个错误是自定义 Hook 隐藏了必变的依赖，却对外宣称“无需依赖”。调用者无法看出它订阅了哪个房间。Hook 的参数应包含会改变订阅的值，返回值里说明开始和停止，而不是读取看不见的全局。"
      ]
    },
    {
      "id": "boundaries",
      "title": "游标模型不包含并发渲染的丢弃结果",
      "paragraphs": [
        "第一条边界是渲染次数。React 可以在提交前重复渲染，Hook 必须能承受重复调用。示例只演示两次已按顺序执行的渲染，没有实现渲染中断。",
        "第二条边界是类型契约。自定义 Hook 的参数和返回值应表达订阅、草稿或请求的状态，不要返回随便拼出的对象却让调用者依赖隐式字段。类型能帮助发现漏掉的清理函数，但不能代替一次卸载测试。"
      ]
    },
    {
      "id": "practice",
      "title": "先数 Hook 调用，再判断引用是否相同",
      "paragraphs": [
        "第一次渲染调用三个槽、第二次去掉中间那个，预测第三个名字读到的值。再预测同一对象、更长的数组和新函数哪几次会让依赖比较返回 true。最后说明模块级计数为什么会串到另一个组件。",
        "E30、E31、E38 尚未制作。把条件订阅改成稳定调用后，用卸载和切换房间检查清理是否成对。"
      ]
    }
  ],
  "sources": [
    { "title": "React：复用逻辑的自定义 Hook", "url": "https://react.dev/learn/reusing-logic-with-custom-hooks" },
    { "title": "React：Hook 规则", "url": "https://react.dev/reference/rules/rules-of-hooks" }
  ]
};
