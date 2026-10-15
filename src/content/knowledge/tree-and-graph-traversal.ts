import type { Article } from "../articles";

export const treeGraphArticle: Article = {
  "revision": 2,
  id: "K16-03",
  kind: "knowledge",
  domainSlug: "algorithms",
  slug: "tree-and-graph-traversal",
  title: "树与图的遍历",
  summary: "先序和后序走完笔记树，依赖图用访问中的标记找出环；树函数不查环，无边和自环分别给出 none 与回到自身的路径。",
  aliases: ["tree traversal", "cycle detection", "DFS", "依赖环"],
  tags: ["算法", "树", "图"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-15",
  sections: [
    {
      id: "problem",
      title: "目录先渲染了父级，为什么安装顺序却走不完？",
      paragraphs: [
        "笔记目录要先出现「笔记」，再出现它下面的草稿和已发布。删除时相反，要先删掉 2026，才能删已发布，最后删笔记。另一边，模块依赖写成 app 依赖 ui、ui 依赖 api、api 又依赖 app。若按「被依赖的先安装」去排，三条边会绕回来，安装顺序不存在。",
        "树和图不是同一种结构。树从根向下走，每条边都指向子节点，默认没有回到祖先的边。依赖图的边可以指回已经走过的节点。本篇用固定节点演示先序、后序和环。树函数看到环会一直递归，所以查环要用另一张图。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：树用 children，图用有向边",
      paragraphs: [
        "运行 npm run verify:k16。orderTree 先把当前 id 放进先序，再递归每个 child，离开时放进后序。节点形状是 id 和 children 数组。示例里的笔记树有 draft，以及 published 下面的 2026。",
        "cycle 用 Map 保存每个起点的出边，插入顺序就是后来遍历的顺序。状态 0 是没看过，1 是正在这条路径上，2 是这条路径已经结束。走到状态 1 的节点就把从它到当前栈顶的路径加上它自己，收成 cycle。没有任何回边时返回 none。函数不排序模块，也不加载文件。"
      ]
    },
    {
      id: "tree",
      title: "先序适合先画出父级，后序适合先处理子级",
      paragraphs: [
        "笔记树的先序是 notes,draft,published,2026。渲染目录时可以按这个顺序创建节点：父级先存在，子级再挂上去。后序是 draft,2026,published,notes。删除或计算子树大小时用后序，因为离开一个节点时，它的子节点都已经处理完。",
        "只有 notes、没有子节点时，先序和后序都是 notes。顺序不同不是因为排序，而是记录 id 的时机不同。函数不会跳过空 children，也不会把兄弟节点排成字母序。published 写在 draft 后面，是因为 children 数组里它排在后面。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function orderTree(node) {
  const pre = [];
  const post = [];
  function visit(current) {
    pre.push(current.id);
    for (const child of current.children) visit(child);
    post.push(current.id);
  }
  visit(node);
  return 'pre:' + pre.join(',') + '|post:' + post.join(',');
}
const notes = { id: 'notes', children: [
  { id: 'draft', children: [] },
  { id: 'published', children: [{ id: '2026', children: [] }] }
]};
console.log('树:' + orderTree(notes));
console.log('单节点:' + orderTree({ id: 'notes', children: [] }));`,
          expectedOutput: [
            "树:pre:notes,draft,published,2026|post:draft,2026,published,notes",
            "单节点:pre:notes|post:notes"
          ],
          explanation: [
            "先序在进入节点时记录，所以 notes 在 draft 之前。后序在子节点都访问完才记录，所以 2026 在 published 之前，published 又在 notes 之前。",
            "没有子节点时，进入和离开是同一次访问，两种顺序都只有 notes。函数按 children 的数组顺序走，不另外排序。"
          ]
        }
      ]
    },
    {
      id: "cycle",
      title: "回到正在访问的节点才是环，走完再被指到则不是",
      paragraphs: [
        "app→ui→api→app 这条路径上，api 指向的 app 状态还是 1，所以结果是 cycle:app>ui>api>app。路径把回到的节点再写一次，环的起点和终点是同一个人。app→ui→api 没有指回去，三个节点都会走到状态 2，返回 none。",
        "app→app 是自环，路径是 cycle:app>app。空边列表没有任何节点，返回 none，不能把它说成有环或无环以外的第三种成功。a→b 没有环，后面的 c→c 仍要被看到：Map 会先走完 a 和 b，再从 c 开始，结果是 cycle:c>c。已经结束的节点被另一条边指到时不再深入，因为它的状态是 2，那不是环。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function cycle(edges) {
  const next = new Map();
  for (const [from, to] of edges) {
    if (!next.has(from)) next.set(from, []);
    if (!next.has(to)) next.set(to, []);
    next.get(from).push(to);
  }
  const state = new Map();
  const stack = [];
  function dfs(node) {
    state.set(node, 1);
    stack.push(node);
    for (const to of next.get(node)) {
      const mark = state.get(to) || 0;
      if (mark === 1) {
        const start = stack.indexOf(to);
        return stack.slice(start).concat(to).join('>');
      }
      if (mark === 0) {
        const found = dfs(to);
        if (found) return found;
      }
    }
    stack.pop();
    state.set(node, 2);
    return '';
  }
  for (const node of next.keys()) {
    if ((state.get(node) || 0) === 0) {
      const found = dfs(node);
      if (found) return 'cycle:' + found;
    }
  }
  return 'none';
}
console.log('环:' + cycle([['app', 'ui'], ['ui', 'api'], ['api', 'app']]));
console.log('无环:' + cycle([['app', 'ui'], ['ui', 'api']]));
console.log('自环:' + cycle([['app', 'app']]));
console.log('空:' + cycle([]));
console.log('后一段:' + cycle([['a', 'b'], ['c', 'c']]));`,
          expectedOutput: [
            "环:cycle:app>ui>api>app",
            "无环:none",
            "自环:cycle:app>app",
            "空:none",
            "后一段:cycle:c>c"
          ],
          explanation: [
            "回边指向状态仍为 1 的节点时，栈里从该节点到当前节点就是环。无环图里每个节点都会离开栈并标成 2。",
            "空列表没有节点可走。后一段先走完 a、b，再发现 c 指向自己，所以环没有被前一段的无环结果盖住。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "先序结果不是安装顺序，找到一个环也不等于列出了所有环",
      paragraphs: [
        "orderTree 不记录已经见过的 id。若某个子节点对象最终指回祖先，递归不会停止。目录数据要先保证它是树，或者改用 cycle 那种带状态的遍历。把菜单缩进和依赖安装写成同一个函数，会在有环时卡住。",
        "cycle 找到第一条回到状态 1 的路径就返回。图里还有别的环时，结果里不会出现。边的顺序改变，Map 的起点和第一条环都可能改变。none 只说明按这些边没有回到正在访问的节点，不说明模块一定能安装：缺少版本、重复包名和可选依赖都不在这个函数里。",
        "状态 2 被再次指到时跳过，这是有向图的深度优先搜索。无向图若把每条边存成两个方向，会把刚走过来的父节点看成回边。这个函数没有父节点参数，不能直接拿去判无向图。K16-02 的 Map 用来保存出边，键是字符串，不是节点对象。"
      ]
    },
    {
      id: "practice",
      title: "用同一份目录分别写出渲染顺序和删除顺序",
      paragraphs: [
        "笔记树的先序应以 notes 开头、2026 在 published 后面。后序应先出现 draft 和 2026。依赖三条边绕回 app 时应得到 cycle:app>ui>api>app；拿掉最后一条边应得到 none。",
        "E35 已提供可运行练习；具体入口见文末关联。DOM、焦点和框架主题的当前练习以 JavaScript 行为模型为范围，真实平台行为请按本文实验复核；通过模型不代表完成设备或框架集成验收。"
      ]
    }
  ],
  sources: [
    { title: "MDN：Map", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map" },
    { title: "Wikipedia：Depth-first search", url: "https://en.wikipedia.org/wiki/Depth-first_search" }
  ]
};
