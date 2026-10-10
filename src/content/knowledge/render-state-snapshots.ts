import type { Article } from "../articles";

export const renderStateSnapshotsArticle: Article = {
  "id": "K07-01",
  "kind": "knowledge",
  "domainSlug": "react",
  "slug": "render-state-snapshots",
  "title": "渲染、状态快照与更新",
  "summary": "为什么本次回调看到旧值；更新如何排队。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "render-state-snapshots",
    "渲染、状态快照与更新"
  ],
  "tags": [
    "react"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "点一次加三，为什么只加了一？",
      "paragraphs": [
        "计数器在一次点击中连续调用三次 setCount(count + 1)，预期增加三，结果只增加一。要解释这个行为，先区分本次渲染读到的值与排入更新队列的请求。setter 不会把当前函数里的 count 就地改写。",
        "本文可执行例子使用独立 JavaScript 模型演示快照与队列，不导入 React，也不声称模型实现全部调度。框架片段明确标为 React 项目代码，需要安装 React 并在组件中运行。实际组件行为应在项目测试中核对。"
      ],
      "examples": [
        {
          "code": "function render(count) {\n  return () => [count + 1, count + 1, count + 1];\n}\nconst handler = render(0);\nconst queued = handler();\nconsole.log(queued.join(','));\nconsole.log(queued.reduce((_previous, replacement) => replacement, 0));",
          "expectedOutput": [
            "1,1,1",
            "1"
          ],
          "explanation": [
            "handler 创建时关联 count 为 0 的那次调用，所以三个表达式都算出 1。把三个替换值依次应用，最终仍为 1。这里没有同步修改 count 的步骤。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "渲染计算界面，提交使结果可见",
      "paragraphs": [
        "函数组件的一次执行获得本次 props 与 state，返回需要的界面描述。事件回调也在这次执行中创建，因此使用这次快照。后续更新触发另一轮渲染，得到另一组绑定，旧回调的绑定不会被改成新的数值。",
        "渲染不等于提交。React 可以计算一个结果而不最终提交，也可能重新执行渲染，所以渲染过程应纯粹：不要请求支付、注册监听或修改外部可变对象。用户事件负责用户触发的动作；提交后需要同步外部系统的工作再考虑 Effect。"
      ]
    },
    {
      "id": "queue",
      "title": "依赖前一个结果时使用函数式更新",
      "paragraphs": [
        "setCount(current => current + 1) 将一个更新函数放入队列，处理时以当时队列中的前值为参数。三个函数依次得到 0、1、2，产生 1、2、3，而不是都闭包读取初始 count。"
      ],
      "examples": [
        {
          "code": "const updates = [n => n + 1, n => n + 1, n => n + 1];\nconst result = updates.reduce((current, update) => update(current), 0);\nconsole.log(result);\nconst mixed = [() => 5, n => n + 1];\nconsole.log(mixed.reduce((current, update) => update(current), 0));",
          "expectedOutput": [
            "3",
            "6"
          ],
          "explanation": [
            "函数按序应用，所以累加为 3。第二组先替换成 5 再增加为 6。更新函数应只计算下一状态，不发请求或写日志；开发检查可能重复调用纯计算来发现不纯行为。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "react-code",
      "title": "完整组件：让更新合同一眼可见",
      "paragraphs": [
        "以下代码用于 React 项目的组件文件，使用 createElement 避免 JSX 配置差异。把 Counter 交给现有 root.render 渲染，点一次按钮应增加三。它没有网络或持久化副作用。"
      ],
      "examples": [
        {
          "code": "function makeRender(value) {\n  return { readLater: () => value, label: String(value) };\n}\nconst oldRender = makeRender(2);\nconst newRender = makeRender(3);\nconsole.log(oldRender.readLater());\nconsole.log(newRender.label);",
          "expectedOutput": [
            "2",
            "3"
          ],
          "explanation": [
            "两次调用产生不同绑定。旧回调仍读 2，新界面描述为 3；这解释旧快照，不意味着 React 把同一状态存成两个永久独立来源。"
          ],
          "language": "javascript"
        }
      ],
      "code": "import { createElement, useState } from 'react';\nexport function Counter() {\n  const [count, setCount] = useState(0);\n  function addThree() {\n    setCount(value => value + 1);\n    setCount(value => value + 1);\n    setCount(value => value + 1);\n  }\n  return createElement('button', { type: 'button', onClick: addThree }, String(count));\n}"
    },
    {
      "id": "failure",
      "title": "错误实现：修改对象后仍交回原引用",
      "paragraphs": [
        "state 中放对象时直接写 state.name，再 setState(state)，可能因引用不变而跳过期望更新，也会污染旧快照。正确做法是在变更路径上创建新对象，保留未变化部分引用。嵌套对象需逐层更新，并非浅展开一次就复制了所有内容。",
        "另一种错误是用函数式更新解决所有旧闭包。它只能为下一状态计算提供队列前值；如果请求本来针对旧查询，结果仍需要身份校验。回调读取 props、取消规则或外部资源时，要处理相应生命周期，不能仅替换 setter 写法。"
      ]
    },
    {
      "id": "boundaries",
      "title": "快照与外部可变值的边界",
      "paragraphs": [
        "第一条边界是 ref：ref.current 是可变容器，读取它不是本次渲染的固定状态快照；修改也不会自动触发渲染。适合 DOM 引用、任务身份等，不适合代替应显示在界面的状态。第二条边界是外部 store：订阅要使用正确桥接 API，不能在渲染中随意读取一个会变的全局对象。",
        "第三条边界是更新批处理的具体时机。不要依赖固定微任务数或宣称每次 setter 都马上提交。以用户可观察结果与公开 API 合同设计逻辑，必要时采用框架提供的同步机制并说明代价。"
      ]
    },
    {
      "id": "application",
      "title": "状态保持最小事实源，显示值从它派生",
      "paragraphs": [
        "若总价由商品与数量决定，通常在渲染中计算，而不是再建立 total 状态并用 Effect 追赶。这样每次快照里总价与输入一致，也避免一轮额外更新。",
        "需要多个字段原子变化时，考虑联合状态或 reducer。独立字段确实可独立变化时继续分开保存。选择依据是业务不变量与所有权，不是一个组件必须只有一个 useState。",
        "例如编辑器保存请求携带本次文本 draft。点击后用户继续输入，新渲染产生更新文本，旧请求的回调仍应该知道当时保存了什么。这里保留旧快照是正确行为：可以显示“已保存版本”而不是把后来输入错误标成已保存。若显示当前最新文本，则需要从当前事实源读取，或在完成时依据版本判断哪些内容仍未保存。",
        "这也说明过期闭包不是一个脱离业务目标的绝对错误。需要固定一次操作参数时使用快照；需要按队列前值递增时使用更新函数；需要某个稳定资源的当前身份时可使用 ref。三种工具解决不同时间关系。审查时先写出“读取哪一时刻的值”，再选择机制，比看到闭包就机械改成 ref 更可靠。"
      ]
    },
    {
      "id": "recall",
      "title": "沿一次点击推导队列",
      "paragraphs": [
        "先标出事件回调属于哪次渲染，再计算每个 setter 参数是替换值还是更新函数，最后顺序应用队列。不要在调用 setter 后把本次 count 当成已经变化。",
        "回忆：为什么三个 count+1 都是同一数字？为什么函数式更新仍须纯粹？可把队列改成替换 5、增加 1、替换 9，推导最终 9。"
      ]
    }
  ],
  "sources": [
    {
      "title": "React：State as a Snapshot",
      "url": "https://react.dev/learn/state-as-a-snapshot"
    },
    {
      "title": "React：Queueing State Updates",
      "url": "https://react.dev/learn/queueing-a-series-of-state-updates"
    }
  ]
};
