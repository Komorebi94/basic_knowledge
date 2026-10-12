import type { Article } from "../articles";

export const componentIdentityKeysArticle: Article = {
  "id": "K07-03",
  "kind": "knowledge",
  "domainSlug": "react",
  "slug": "component-identity-and-keys",
  "title": "组件身份、key 与协调",
  "summary": "用稳定 key 区分位置和身份，解释为什么重排后输入还在，以及为什么改用下标或组件类型会重置状态。",
  "aliases": ["key", "reconciliation", "identity", "列表 key", "组件身份"],
  "tags": ["React", "协调", "组件身份、key 与协调"],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "列表只是换了顺序，为什么输入跑到了另一行？",
      "paragraphs": [
        "两条订单草稿可以展开编辑。按更新时间重新排序后，第一行里已经输入的备注出现在第二行。组件函数重新执行了，但 React 要根据身份决定哪一次状态还属于哪一个组件。排序改变的是位置，不应该改变草稿的身份。",
        "前置是 K07-01 的渲染快照。本仓库安装 React 19.3.0。空白页示例不挂载 React，也不读取 React 源码；它用 Map 和位置下标复现官方文档描述的可观察结果：同一 key 保留状态，key 或组件类型变化则从初始状态开始。真实列表仍要在 React 项目里核对。"
      ]
    },
    {
      "id": "identity",
      "title": "key 表示这次渲染里的同一组件，不是行号",
      "paragraphs": [
        "协调器把上一次的组件状态按 key 存起来。下一次渲染只要 key 还在，就把它和原来的状态配在一起，即使它在数组中的位置变了。key 消失，表示那个组件卸载，状态一并丢弃。新的 key 表示挂载一个新组件，状态从初始值开始。",
        "因此 key 要使用数据里稳定且唯一的 id。随机数和渲染期间的 Math.random() 会让每一次渲染都像新组件。整个列表使用同一个 key 则会让不同数据抢同一份状态。key 只在兄弟之间比较，不需要在全站唯一。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function reconcile(previous, next) {\n  const states = new Map(previous.map(item => [item.key, item.state]));\n  return next.map(item => item.key + ':' + (states.has(item.key) ? states.get(item.key) : 'fresh')).join(',');\n}\nconst previous = [{ key: 'a', state: 'typed' }, { key: 'b', state: 'empty' }];\nconsole.log(reconcile(previous, [{ key: 'b' }, { key: 'a' }]));\nconsole.log(reconcile(previous, [{ key: 'a2' }, { key: 'b' }]));",
          "expectedOutput": ["b:empty,a:typed", "a2:fresh,b:empty"],
          "explanation": [
            "第一行只改变顺序，a 的 typed 和 b 的 empty 跟着 key 走。第二行 a 换成新 key a2，a2 从 fresh 开始，b 仍保留 empty。",
            "Map 只保存这个例子需要的状态槽。React 还会比较组件类型、位置和更完整的树；这里没有实现那些步骤。"
          ]
        }
      ]
    },
    {
      "id": "index",
      "title": "用数组下标当 key，状态会粘在位置上",
      "paragraphs": [
        "下标 key 说的是“第 n 个位置”，不是“id 为 a 的订单”。排序、插入或删除后，同一个下标对着另一条数据，输入状态却留在原位置。列表永不重排、只在末尾追加时，下标碰巧不会暴露这个问题，但它表达的身份仍然是错的。",
        "过滤掉一项却继续用下标，也会让后面的项接到前面的状态。若状态里包含请求、订阅或草稿，这种错配不只是文字错位，还会把副作用带到另一条数据上。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function byIndex(previousStates, nextIds) {\n  return nextIds.map((id, index) => id + ':' + (previousStates[index] ?? 'fresh')).join(',');\n}\nconsole.log(byIndex(['typed', 'empty'], ['b', 'a']));\nconsole.log(byIndex(['typed', 'empty'], ['b']));",
          "expectedOutput": ["b:typed,a:empty", "b:typed"],
          "explanation": [
            "排序后位置 0 仍拿着 typed，所以数据 b 显示了原来 a 的输入。删除 a 后，只剩位置 0，b 继续拿到 typed。",
            "?? 只区分这个数组里没有的位置。真实状态还有更新队列和引用，不能用这一行代替 React 的协调器。"
          ]
        }
      ]
    },
    {
      "id": "type",
      "title": "组件类型变化也会丢掉原来的状态",
      "paragraphs": [
        "同一位置从编辑表单换成预览组件，React 把它们看成不同组件。即使外层数据 id 没变，表单内部的 state 也会卸载。想在两种展示之间保留草稿，应把草稿放在保持挂载的父组件，或让两种展示成为同一个组件内部的分支。",
        "key 也可以主动用于重置。同一个表单组件，在用户 id 变化时把 key 设为用户 id，下一位用户会从空表单开始，而不会残留上一位的未提交内容。这是有意重置，应让用户知道未保存的内容会清除。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function mountKey(type, id) {\n  return type + '#' + id;\n}\nconst states = new Map([['form#user', 'draft']]);\nfunction render(type, id) {\n  const key = mountKey(type, id);\n  if (!states.has(key)) states.set(key, 'fresh');\n  return key + ':' + states.get(key);\n}\nconsole.log(render('form', 'user'));\nconsole.log(render('preview', 'user'));\nconsole.log(render('form', 'next'));",
          "expectedOutput": ["form#user:draft", "preview#user:fresh", "form#next:fresh"],
          "explanation": [
            "同一 form 和 user 读到原来的 draft。换成 preview 后键不同，状态是 fresh。下一位用户即使仍是 form，键也不同，不会继承 draft。",
            "这里把类型和 id 都放进键，用来演示文档中的两条重置条件。父组件保存草稿时，不应再依赖子组件卸载后的内部状态。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "为了消除警告给每一项生成新 key",
      "paragraphs": [
        "错误修复是 key={Math.random()} 或每次渲染用 index 加上 Date.now()。警告消失了，输入和子组件状态也会每次清空，焦点位置跟着丢失。应使用数据 id；没有 id 时先为数据建立稳定 id，再渲染列表。",
        "另一个错误是在 map 外面的父元素上放 key，子项却没有。key 要放在从数组直接返回的那个元素上。条件分支里的两个组件若需要各自保留状态，也要有能区分它们的稳定身份。"
      ]
    },
    {
      "id": "boundaries",
      "title": "教学模型和 React 19 的协调器不是同一份代码",
      "paragraphs": [
        "第一条边界是实现。示例按 React 文档里“保留与重置状态”的可观察规则推演，本仓库的 React 版本是 19.3.0。它不覆盖并发渲染中未提交的树、Activity 或未来协调器的内部结构。",
        "第二条边界是副作用。状态槽被复用时，Effect 可能认为依赖没变而不重新订阅。列表项里的订阅要把数据 id 放进依赖或清理函数，不能假设位置变化一定会重跑 Effect。"
      ]
    },
    {
      "id": "practice",
      "title": "先预测排序，再预测删除和下一位用户",
      "paragraphs": [
        "给 a:typed、b:empty，预测按 b、a 排序且使用数据 id 时的状态，再预测改用下标时的状态。然后把组件从 form 换成 preview，预测草稿还在不在。",
        "E30、E31、E38 尚未制作。在 React 项目里用受控输入做一次排序测试，才能把模型结果落到真实渲染上。"
      ]
    }
  ],
  "sources": [
    { "title": "React：保留与重置状态", "url": "https://react.dev/learn/preserving-and-resetting-state" },
    { "title": "React：渲染列表", "url": "https://react.dev/learn/rendering-lists" }
  ]
};
