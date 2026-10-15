import type { Exercise, ExerciseTestCase } from "./types";

const setup = "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。";
const cleanup = "每例使用独立上下文；结束时废弃全部计时器与监听器。";
const runtime = "JavaScript ES2022 · 纯逻辑隔离环境。浏览器或框架题使用普通对象表达行为，不创建 DOM，不运行 React、Vue 或 TypeScript 编译器。";

function cases(id: string, rows: readonly { name: string; purpose: string; code: string }[]): ExerciseTestCase[] {
  return rows.map((row, index) => ({
    id: `${id}-T${String(index + 1).padStart(2, "0")}`,
    name: row.name,
    purpose: row.purpose,
    code: row.code,
    setup,
    input: row.name,
    expectedOutcome: row.purpose,
    cleanup,
  }));
}

export const p1Exercises: readonly Exercise[] = [
  {
    id: "E25", slug: "image-lazy-loading", title: "图片懒加载状态模型",
    summary: "用显式观察事件模拟视口进入、失败重试和卸载，不创建真实图片或观察器。",
    runtime, estimatedMinutes: 25, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "createLazy(items, observer) 接收 {id,src} 列表。observer 为 true 时初始状态是 placeholder；see(id) 首次进入记 loaded 且 loads 加一，重复进入返回 repeat。fail(id) 记 error，之后 see 可再次加载。destroy() 后忽略 see，并把仍是 placeholder 的项改为 dropped。observer 为 false 时全部直接 loaded，see 返回 ignored。",
    problem: ["真实页面会用观察器决定何时给图片赋值，但隔离环境没有视口和图片元素。本题把“进入视口、加载失败、组件卸载、没有观察器”收成可断言的状态记录。", "同一资源进入两次不能把 loads 累加成两次。失败后的再次进入才是重试。卸载后的旧通知必须被忽略，未加载项也不能继续假装还在等待。"],
    allowedApis: ["数组与对象", "字符串", "严格相等"],
    unsupportedBehavior: ["不调用 IntersectionObserver。", "不创建 img，不读取或写入真实 src。", "不判断真实视口、像素比或网络状态。"],
    starterArtifact: "function createLazy() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["先按输入复制一份状态列表，observer 为 false 时直接记 loaded 和 loads 1。", "see 只在当前是 placeholder 或 error 时把 loads 加一；loaded 再次进入返回 repeat。", "destroy 先置失效标志，再把残留 placeholder 改成 dropped；已 loaded 保持不变。"] as const,
    referenceArtifact: "function createLazy(items, observer) {\n  if (!Array.isArray(items) || typeof observer !== \"boolean\") throw new TypeError(\"Invalid input\");\n  const rows = items.map(item => {\n    if (!item || typeof item.id !== \"string\" || typeof item.src !== \"string\") throw new TypeError(\"Invalid item\");\n    return { id: item.id, status: observer ? \"placeholder\" : \"loaded\", loads: observer ? 0 : 1 };\n  });\n  let dead = false;\n  function find(id) { return rows.find(row => row.id === id); }\n  return {\n    snapshot() { return rows.map(row => ({ id: row.id, status: row.status, loads: row.loads })); },\n    see(id) {\n      if (dead || !observer) return \"ignored\";\n      const row = find(id);\n      if (!row) return \"missing\";\n      if (row.status === \"loaded\") return \"repeat\";\n      row.loads += 1;\n      row.status = \"loaded\";\n      return \"loaded\";\n    },\n    fail(id) {\n      const row = find(id);\n      if (!row || dead || row.status !== \"loaded\") return \"ignored\";\n      row.status = \"error\";\n      return \"error\";\n    },\n    destroy() {\n      dead = true;\n      for (const row of rows) if (row.status === \"placeholder\") row.status = \"dropped\";\n    }\n  };\n}\n",
    explanation: ["观察器可用时，第一次 see 才把 placeholder 变成 loaded。重复 see 返回 repeat，所以 loads 保持 1。", "fail 只接受当前已加载的项；随后的 see 是一次新的加载。destroy 之后 see 返回 ignored，尚未加载的项变为 dropped，已经 loaded 的记录保留。没有观察器时初始即 loaded，see 不再改变状态。"],
    alternative: "也可以把状态收成显式联合，并在 see 的每个分支返回原因。代价是调用方要处理更多状态名，但非法转移会更早暴露。",
    complexity: "每次 see、fail 为 O(n)，n 是图片数；snapshot 复制一份 O(n)。",
    commonMistakes: ["每次 see 都增加 loads，重复进入视口会重复请求。", "卸载后仍接受回调，已离开页面的项继续进入 loaded。"],
    knowledgeIds: ["K04-05"], timeoutMs: 2000,
    examples: [
      { code: "const host = createLazy([{ id: \"a\", src: \"a.png\" }], true);\nconsole.log([host.see(\"a\"), host.see(\"a\"), host.snapshot()[0].loads].join(\" \"));", expectedOutput: "loaded repeat 1", expectedLogs: ["loaded repeat 1"], explanation: "第一次 see 返回 loaded，第二次因已经 loaded 返回 repeat，loads 仍为 1。" },
      { code: "const host = createLazy([{ id: \"a\", src: \"a.png\" }], true);\nhost.see(\"a\");\nhost.fail(\"a\");\nconsole.log([host.see(\"a\"), host.snapshot()[0].loads].join(\" \"));", expectedOutput: "loaded 2", expectedLogs: ["loaded 2"], explanation: "失败后的 see 是重试，loads 从 1 变成 2。" },
      { code: "const host = createLazy([{ id: \"a\", src: \"a.png\" }, { id: \"b\", src: \"b.png\" }], true);\nhost.see(\"a\");\nhost.destroy();\nconsole.log([host.see(\"b\"), host.snapshot().map(row => row.status).join(\",\")].join(\" \"));", expectedOutput: "ignored loaded,dropped", expectedLogs: ["ignored loaded,dropped"], explanation: "卸载后忽略新的进入；已加载项保持 loaded，未进入项变成 dropped。" }
    ],
    testCases: cases("E25", [
      { name: "重复进入", purpose: "loaded 不重复计数", code: "const host = createLazy([{ id: \"a\", src: \"a.png\" }], true);\nhost.see(\"a\"); host.see(\"a\");\nequal(host.snapshot()[0].loads, 1);" },
      { name: "失败重试", purpose: "error 可以再次加载", code: "const host = createLazy([{ id: \"a\", src: \"a.png\" }], true);\nhost.see(\"a\"); host.fail(\"a\"); host.see(\"a\");\nequal(host.snapshot()[0], { id: \"a\", status: \"loaded\", loads: 2 });" },
      { name: "卸载", purpose: "销毁后忽略并丢弃占位", code: "const host = createLazy([{ id: \"a\", src: \"a.png\" }], true);\nhost.destroy();\nequal(host.see(\"a\"), \"ignored\");\nequal(host.snapshot()[0].status, \"dropped\");" },
      { name: "无观察器", purpose: "直接加载且 see 无效", code: "const host = createLazy([{ id: \"a\", src: \"a.png\" }], false);\nequal(host.see(\"a\"), \"ignored\");\nequal(host.snapshot()[0].loads, 1);" },
      { name: "未知 id", purpose: "不匹配的 id 不改状态", code: "const host = createLazy([{ id: \"a\", src: \"a.png\" }], true);\nequal(host.see(\"missing\"), \"missing\");\nequal(host.snapshot()[0].status, \"placeholder\");" },
      { name: "空列表", purpose: "没有项时快照为空", code: "equal(createLazy([], true).snapshot().length, 0);" },
      { name: "未加载不能失败", purpose: "placeholder 上的 fail 被忽略", code: "const host = createLazy([{ id: \"a\", src: \"a.png\" }], true);\nequal(host.fail(\"a\"), \"ignored\");\nequal(host.snapshot()[0].status, \"placeholder\");" },
      { name: "非法输入", purpose: "观察器标记必须是布尔值", code: "expectThrow(() => createLazy([], \"yes\"), \"TypeError\");" }
    ]),
    wrongImplementations: [
      { name: "重复计数", code: "function createLazy(items) {\n  const rows = items.map(item => ({ id: item.id, status: \"placeholder\", loads: 0 }));\n  return { snapshot() { return rows; }, see(id) { const row = rows.find(item => item.id === id); row.loads += 1; row.status = \"loaded\"; return \"loaded\"; }, fail() { return \"error\"; }, destroy() {} };\n}\n" },
      { name: "卸载后继续加载", code: "function createLazy(items, observer) {\n  const rows = items.map(item => ({ id: item.id, status: observer ? \"placeholder\" : \"loaded\", loads: observer ? 0 : 1 }));\n  return { snapshot() { return rows.map(row => ({ ...row })); }, see(id) { const row = rows.find(item => item.id === id); if (!row) return \"missing\"; if (row.status === \"loaded\") return \"repeat\"; row.loads += 1; row.status = \"loaded\"; return \"loaded\"; }, fail(id) { const row = rows.find(item => item.id === id); if (!row) return \"ignored\"; row.status = \"error\"; return \"error\"; }, destroy() {} };\n}\n" }
    ]
  },
  {
    id: "E26", slug: "event-delegation", title: "事件委托路径模型",
    summary: "沿父链查找第一个匹配角色，并处理取消订阅与后加入节点。",
    runtime, estimatedMinutes: 25, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "createDelegate(selector) 返回 add(id, parentId, role)、click(id) 和 unsubscribe()。click 从目标向父节点查找，返回第一个 role 等于 selector 的 id；到根仍没有则返回 none。未知 id 或取消订阅后返回 ignored。parentId 为 null 表示根，后加入的节点仍可命中。",
    problem: ["委托的关键是从事件目标向上找，而不是只比较被点击节点本身。子节点可以命中祖先上的选择器。", "取消订阅后，旧路径不能继续命中。订阅之后新增的节点只要父链完整，也应被同一次订阅处理。"],
    allowedApis: ["Map", "Set", "字符串"],
    unsupportedBehavior: ["不注册真实 DOM 监听器。", "不使用事件对象的 target、currentTarget 或 composedPath。", "不处理捕获阶段或 preventDefault。"],
    starterArtifact: "function createDelegate() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["用 Map 保存每个节点的 parentId 和 role，根的 parentId 用 null。", "click 用循环向上走，命中 selector 立即返回；用 Set 防止父链成环。", "unsubscribe 只改变一个有效标志，让之后的 click 都返回 ignored。"] as const,
    referenceArtifact: "function createDelegate(selector) {\n  if (typeof selector !== \"string\" || selector === \"\") throw new TypeError(\"Invalid selector\");\n  const nodes = new Map();\n  let active = true;\n  return {\n    add(id, parentId, role) {\n      if (typeof id !== \"string\" || nodes.has(id)) throw new Error(\"Invalid node\");\n      if (parentId !== null && !nodes.has(parentId)) throw new Error(\"Missing parent\");\n      nodes.set(id, { parentId, role });\n    },\n    unsubscribe() { active = false; },\n    click(id) {\n      if (!active || !nodes.has(id)) return \"ignored\";\n      const seen = new Set();\n      let current = id;\n      while (current) {\n        if (seen.has(current)) throw new Error(\"Cycle\");\n        seen.add(current);\n        if (nodes.get(current).role === selector) return current;\n        current = nodes.get(current).parentId;\n      }\n      return \"none\";\n    }\n  };\n}\n",
    explanation: ["click 先看目标自己的 role，再看父节点，所以子元素点击能命中外层按钮，目标自身匹配时不会继续冒泡。", "路径上没有 selector 时返回 none。unsubscribe 后同一 id 返回 ignored。add 发生在订阅之后，只要父节点已存在，click 仍能沿新父链命中。"],
    alternative: "注册时把匹配节点展开成子孙集合，click 就能 O(1) 判断。动态增删节点时要维护这棵索引，父链查找更直接。",
    complexity: "add 为 O(1)；click 最坏沿父链 O(d)，d 是深度。",
    commonMistakes: ["只比较目标角色，子元素点击无法命中父按钮。", "取消订阅只删表，后续 click 仍返回旧目标。"],
    knowledgeIds: ["K04-03"], timeoutMs: 2000,
    examples: [
      { code: "const host = createDelegate(\"button\");\nhost.add(\"root\", null, \"page\");\nhost.add(\"item\", \"root\", \"button\");\nhost.add(\"icon\", \"item\", \"icon\");\nconsole.log(host.click(\"icon\"));", expectedOutput: "item", expectedLogs: ["item"], explanation: "icon 自身不匹配，父节点 item 的角色是 button，因此命中 item。" },
      { code: "const host = createDelegate(\"button\");\nhost.add(\"root\", null, \"page\");\nhost.add(\"text\", \"root\", \"text\");\nconsole.log(host.click(\"text\"));", expectedOutput: "none", expectedLogs: ["none"], explanation: "从 text 走到根都没有 button，返回 none。" },
      { code: "const host = createDelegate(\"button\");\nhost.add(\"root\", null, \"page\");\nhost.add(\"item\", \"root\", \"button\");\nhost.unsubscribe();\nconsole.log(host.click(\"item\"));", expectedOutput: "ignored", expectedLogs: ["ignored"], explanation: "取消订阅后，原来能命中的节点也不再处理。" }
    ],
    testCases: cases("E26", [
      { name: "子元素", purpose: "命中最近的匹配祖先", code: "const host = createDelegate(\"button\"); host.add(\"root\", null, \"page\"); host.add(\"item\", \"root\", \"button\"); host.add(\"icon\", \"item\", \"icon\"); equal(host.click(\"icon\"), \"item\");" },
      { name: "目标自身", purpose: "自身匹配优先于父节点", code: "const host = createDelegate(\"button\"); host.add(\"root\", null, \"button\"); host.add(\"item\", \"root\", \"button\"); equal(host.click(\"item\"), \"item\");" },
      { name: "越界", purpose: "无匹配返回 none", code: "const host = createDelegate(\"button\"); host.add(\"root\", null, \"page\"); equal(host.click(\"root\"), \"none\");" },
      { name: "取消订阅", purpose: "之后的点击被忽略", code: "const host = createDelegate(\"button\"); host.add(\"root\", null, \"button\"); host.unsubscribe(); equal(host.click(\"root\"), \"ignored\");" },
      { name: "动态节点", purpose: "后加入节点可以命中", code: "const host = createDelegate(\"button\"); host.add(\"root\", null, \"page\"); host.add(\"late\", \"root\", \"button\"); equal(host.click(\"late\"), \"late\");" },
      { name: "未知节点", purpose: "没有登记的 id 被忽略", code: "equal(createDelegate(\"button\").click(\"missing\"), \"ignored\");" },
      { name: "缺失父节点", purpose: "不能把节点挂到不存在的父级", code: "expectThrow(() => createDelegate(\"button\").add(\"child\", \"missing\", \"button\"), \"Error\");" },
      { name: "空选择器", purpose: "选择器必须是非空字符串", code: "expectThrow(() => createDelegate(\"\"), \"TypeError\");" }
    ]),
    wrongImplementations: [
      { name: "只看目标", code: "function createDelegate(selector) {\n  const nodes = new Map();\n  return { add(id, parentId, role) { nodes.set(id, { parentId, role }); }, unsubscribe() {}, click(id) { const node = nodes.get(id); return node && node.role === selector ? id : \"none\"; } };\n}\n" },
      { name: "取消无效", code: "function createDelegate(selector) {\n  const nodes = new Map();\n  return { add(id, parentId, role) { nodes.set(id, { parentId, role }); }, unsubscribe() {}, click(id) { let current = id; while (current) { if (nodes.get(current).role === selector) return current; current = nodes.get(current).parentId; } return \"none\"; } };\n}\n" }
    ]
  },
  {
    id: "E27", slug: "accessible-tabs", title: "Tabs 键盘状态模型",
    summary: "在普通对象上实现标签选择：方向键跳过禁用项，首尾键落到可用项，面板 id 与当前标签对应。",
    runtime, estimatedMinutes: 30, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "createTabs(items) 接收 {id, disabled} 列表。active 是第一个未禁用项；全部禁用时为空字符串。key('ArrowRight'|'ArrowLeft') 在可用项上循环，key('Home'|'End') 到第一个或最后一个可用项，其他键返回 ignored。panel() 返回 panel- 加当前 id。",
    problem: ["标签页的键盘顺序不是数组下标顺序。禁用项要跳过，到末尾后从另一端继续，Home 和 End 只落在可用项上。", "当前标签和面板用同一个 id 关联。这里不创建真实 tab、tabpanel 或焦点，只返回应激活的 id 和面板名。"],
    allowedApis: ["数组", "字符串"],
    unsupportedBehavior: ["不创建 DOM，不设置 role、tabIndex 或 aria-controls。", "不移动真实焦点，也不朗读。", "不处理指针点击以外的页面坐标。"],
    starterArtifact: "function createTabs() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["先筛出未禁用项；没有可用项时 active 和 panel 都是空字符串。", "左右键在可用列表上取模，再映射回原数组下标。", "Home 和 End 直接取可用列表两端，不要落到禁用项。"] as const,
    referenceArtifact: "function createTabs(items) {\n  if (!Array.isArray(items)) throw new TypeError(\"Invalid tabs\");\n  const enabled = () => items.filter(item => item && item.disabled !== true);\n  let index = items.findIndex(item => item && item.disabled !== true);\n  function select(id) { index = items.findIndex(item => item.id === id); return items[index].id; }\n  return {\n    get active() { return index < 0 ? \"\" : items[index].id; },\n    panel() { return index < 0 ? \"\" : \"panel-\" + items[index].id; },\n    key(name) {\n      const list = enabled();\n      if (!list.length) return \"\";\n      if (name === \"Home\") return select(list[0].id);\n      if (name === \"End\") return select(list[list.length - 1].id);\n      if (name !== \"ArrowRight\" && name !== \"ArrowLeft\") return \"ignored\";\n      const current = Math.max(0, list.findIndex(item => item.id === items[index].id));\n      const step = name === \"ArrowRight\" ? 1 : -1;\n      return select(list[(current + step + list.length) % list.length].id);\n    }\n  };\n}\n",
    explanation: ["可用列表把禁用项拿掉，所以从 a 按 ArrowRight 会跳过 b 到达 c，再按一次回到 a。", "Home 和 End 取可用列表两端。全部禁用时 active 为空，按键也返回空字符串。panel 始终由当前 id 组成，便于调用方关联内容。"],
    alternative: "可以把 roving tabindex 做成显式状态机，每个按键一条转移。状态机会更长，但禁用和焦点恢复可以分开测试。",
    complexity: "每次按键 O(n)，n 是标签数。",
    commonMistakes: ["按原始下标移动，方向键停在禁用项上。", "End 取数组最后一项，即使该项已禁用。"],
    knowledgeIds: ["K15-07"], timeoutMs: 2000,
    examples: [
      { code: "const tabs = createTabs([{ id: \"a\", disabled: false }, { id: \"b\", disabled: true }, { id: \"c\", disabled: false }]);\nconsole.log([tabs.key(\"ArrowRight\"), tabs.panel()].join(\" \"));", expectedOutput: "c panel-c", expectedLogs: ["c panel-c"], explanation: "b 被禁用，ArrowRight 从 a 直接到 c，面板名跟着变成 panel-c。" },
      { code: "const tabs = createTabs([{ id: \"a\", disabled: false }, { id: \"b\", disabled: true }, { id: \"c\", disabled: false }]);\nconsole.log([tabs.key(\"End\"), tabs.key(\"Home\")].join(\" \"));", expectedOutput: "c a", expectedLogs: ["c a"], explanation: "End 落到最后一个可用项 c，Home 回到第一个可用项 a。" },
      { code: "const tabs = createTabs([{ id: \"a\", disabled: true }]);\nconsole.log(tabs.active + \"|\" + tabs.key(\"ArrowRight\"));", expectedOutput: "|", expectedLogs: ["|"], explanation: "没有可用标签时 active 为空，方向键也不选出 id。" }
    ],
    testCases: cases("E27", [
      { name: "跳过禁用", purpose: "方向键只在可用项上移动", code: "const tabs = createTabs([{ id: \"a\", disabled: false }, { id: \"b\", disabled: true }, { id: \"c\", disabled: false }]); equal(tabs.key(\"ArrowRight\"), \"c\"); equal(tabs.key(\"ArrowRight\"), \"a\");" },
      { name: "向左循环", purpose: "首项向左落到末个可用项", code: "const tabs = createTabs([{ id: \"a\", disabled: false }, { id: \"b\", disabled: true }, { id: \"c\", disabled: false }]); equal(tabs.key(\"ArrowLeft\"), \"c\");" },
      { name: "首尾", purpose: "Home 和 End 忽略禁用项", code: "const tabs = createTabs([{ id: \"a\", disabled: true }, { id: \"b\", disabled: false }, { id: \"c\", disabled: false }, { id: \"d\", disabled: true }]); equal(tabs.key(\"End\"), \"c\"); equal(tabs.key(\"Home\"), \"b\");" },
      { name: "面板", purpose: "面板 id 使用当前标签", code: "const tabs = createTabs([{ id: \"docs\", disabled: false }]); equal(tabs.panel(), \"panel-docs\");" },
      { name: "全部禁用", purpose: "没有可选标签", code: "const tabs = createTabs([{ id: \"a\", disabled: true }]); equal(tabs.active, \"\"); equal(tabs.key(\"Home\"), \"\"); equal(tabs.panel(), \"\");" },
      { name: "空列表", purpose: "没有项时按键为空", code: "equal(createTabs([]).key(\"ArrowRight\"), \"\");" },
      { name: "其他键", purpose: "不识别的键不改变选择", code: "const tabs = createTabs([{ id: \"a\", disabled: false }, { id: \"b\", disabled: false }]); equal(tabs.key(\"Enter\"), \"ignored\"); equal(tabs.active, \"a\");" },
      { name: "非法输入", purpose: "标签必须是数组", code: "expectThrow(() => createTabs(null), \"TypeError\");" }
    ]),
    wrongImplementations: [
      { name: "不停用项", code: "function createTabs(items) {\n  let index = 0;\n  return { get active() { return items[index] ? items[index].id : \"\"; }, panel() { return items[index] ? \"panel-\" + items[index].id : \"\"; }, key(name) { if (!items.length) return \"\"; if (name === \"ArrowRight\") index = (index + 1) % items.length; if (name === \"ArrowLeft\") index = (index - 1 + items.length) % items.length; return items[index].id; } };\n}\n" },
      { name: "End 不看禁用", code: "function createTabs(items) {\n  const list = items.filter(item => !item.disabled);\n  let index = items.findIndex(item => !item.disabled);\n  return { get active() { return index < 0 ? \"\" : items[index].id; }, panel() { return index < 0 ? \"\" : \"panel-\" + items[index].id; }, key(name) { if (name === \"End\") { index = items.length - 1; return items[index].id; } return index < 0 ? \"\" : items[index].id; } };\n}\n" }
    ]
  },
  {
    id: "E28", slug: "dialog-focus", title: "对话框焦点状态模型",
    summary: "用栈模拟多层对话框的焦点循环、Esc、遮罩和触发器恢复。",
    runtime, estimatedMinutes: 30, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "createDialogs() 提供 addTrigger、removeTrigger、open、tab、escape、backdrop、background 和 depth。open(triggerId) 压入一层，初始焦点是 close。tab 只在 close 与 body 间切换。escape 和 backdrop 关闭最上层，并返回仍存在的触发器 id；触发器已移除时返回 fallback。打开时 background 返回 blocked。",
    problem: ["对话框打开后，Tab 不应跑到背景里。关闭时要把焦点还给打开它的触发器；触发器已经不在时，只能回到事先约定的 fallback。", "多层对话框按栈关闭。后打开的先关闭，背景在仍有对话框时不可交互。本题不创建真实 dialog 或焦点陷阱。"],
    allowedApis: ["数组", "Set", "字符串"],
    unsupportedBehavior: ["不使用 HTML dialog、inert 或 focus()。", "不监听真实键盘和指针。", "不承诺屏幕阅读器公告。"],
    starterArtifact: "function createDialogs() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["每层记录 triggerId 和 focus，open 把 focus 设为 close。", "tab 只翻转栈顶的 close 与 body。", "关闭时弹出栈顶；触发器集合里还有该 id 就返回它，否则返回 fallback。"] as const,
    referenceArtifact: "function createDialogs() {\n  const triggers = new Set();\n  const stack = [];\n  function close() {\n    if (!stack.length) return \"none\";\n    const layer = stack.pop();\n    return triggers.has(layer.triggerId) ? layer.triggerId : \"fallback\";\n  }\n  return {\n    addTrigger(id) { if (typeof id !== \"string\" || triggers.has(id)) throw new Error(\"Invalid trigger\"); triggers.add(id); },\n    removeTrigger(id) { triggers.delete(id); },\n    open(triggerId) { if (!triggers.has(triggerId)) throw new Error(\"Missing trigger\"); stack.push({ triggerId, focus: \"close\" }); return \"open\"; },\n    tab() { if (!stack.length) return \"none\"; const top = stack[stack.length - 1]; top.focus = top.focus === \"close\" ? \"body\" : \"close\"; return top.focus; },\n    escape() { return close(); },\n    backdrop() { return close(); },\n    background() { return stack.length ? \"blocked\" : \"allowed\"; },\n    depth() { return stack.length; }\n  };\n}\n",
    explanation: ["Tab 只改栈顶焦点，所以不会把焦点交还给背景。连续两次 tab 会从 close 到 body 再回到 close。", "先打开 a 再打开 b 时，第一次 escape 恢复 b，a 仍开着。若关闭前移除了触发器，恢复值是 fallback。没有对话框时 background 是 allowed，有对话框时是 blocked。"],
    alternative: "可以用一个焦点哨兵列表代替 close/body 两个名字。哨兵更接近真实 Tab 循环，但本题只需要证明焦点没有离开对话框。",
    complexity: "打开、关闭和 tab 都是 O(1)。",
    commonMistakes: ["一次 Esc 把所有层都关掉，后打开的触发器丢失。", "打开后 background 仍返回 allowed，背景还能接收操作。"],
    knowledgeIds: ["K15-01"], timeoutMs: 2000,
    examples: [
      { code: "const host = createDialogs();\nhost.addTrigger(\"a\"); host.addTrigger(\"b\");\nhost.open(\"a\"); host.open(\"b\");\nconsole.log([host.escape(), host.depth(), host.escape()].join(\" \"));", expectedOutput: "b 1 a", expectedLogs: ["b 1 a"], explanation: "后打开的 b 先关闭，a 还在栈里，第二次关闭才回到 a。" },
      { code: "const host = createDialogs();\nhost.addTrigger(\"a\"); host.open(\"a\"); host.removeTrigger(\"a\");\nconsole.log(host.escape());", expectedOutput: "fallback", expectedLogs: ["fallback"], explanation: "触发器已经移除，关闭时不能把焦点还给一个不存在的控件。" },
      { code: "const host = createDialogs();\nhost.addTrigger(\"a\"); host.open(\"a\");\nconsole.log([host.tab(), host.tab(), host.background()].join(\" \"));", expectedOutput: "body close blocked", expectedLogs: ["body close blocked"], explanation: "焦点在 close 和 body 之间循环，打开期间背景不可交互。" }
    ],
    testCases: cases("E28", [
      { name: "多层 Esc", purpose: "只关闭栈顶", code: "const host = createDialogs(); host.addTrigger(\"a\"); host.addTrigger(\"b\"); host.open(\"a\"); host.open(\"b\"); equal(host.escape(), \"b\"); equal(host.depth(), 1); equal(host.escape(), \"a\");" },
      { name: "遮罩", purpose: "遮罩关闭当前层", code: "const host = createDialogs(); host.addTrigger(\"a\"); host.open(\"a\"); equal(host.backdrop(), \"a\"); equal(host.depth(), 0);" },
      { name: "触发器消失", purpose: "恢复到 fallback", code: "const host = createDialogs(); host.addTrigger(\"a\"); host.open(\"a\"); host.removeTrigger(\"a\"); equal(host.escape(), \"fallback\");" },
      { name: "背景", purpose: "打开时背景被挡住", code: "const host = createDialogs(); host.addTrigger(\"a\"); equal(host.background(), \"allowed\"); host.open(\"a\"); equal(host.background(), \"blocked\"); host.escape(); equal(host.background(), \"allowed\");" },
      { name: "焦点循环", purpose: "tab 不离开对话框", code: "const host = createDialogs(); host.addTrigger(\"a\"); host.open(\"a\"); equal(host.tab(), \"body\"); equal(host.tab(), \"close\");" },
      { name: "未打开", purpose: "没有层时关闭返回 none", code: "equal(createDialogs().escape(), \"none\"); equal(createDialogs().tab(), \"none\");" },
      { name: "缺少触发器", purpose: "不能打开未登记的触发器", code: "expectThrow(() => createDialogs().open(\"missing\"), \"Error\");" },
      { name: "重复触发器", purpose: "同一个 id 不能登记两次", code: "const host = createDialogs(); host.addTrigger(\"a\"); expectThrow(() => host.addTrigger(\"a\"), \"Error\");" }
    ]),
    wrongImplementations: [
      { name: "一次关完", code: "function createDialogs() {\n  const triggers = []; const stack = [];\n  return { addTrigger(id) { triggers.push(id); }, removeTrigger() {}, open(id) { stack.push(id); return \"open\"; }, tab() { return \"close\"; }, escape() { const id = stack[0]; stack.length = 0; return id || \"none\"; }, backdrop() { return this.escape(); }, background() { return \"allowed\"; }, depth() { return stack.length; } };\n}\n" },
      { name: "背景仍可交互", code: "function createDialogs() {\n  const triggers = new Set(); const stack = [];\n  return { addTrigger(id) { triggers.add(id); }, removeTrigger(id) { triggers.delete(id); }, open(id) { stack.push({ triggerId: id, focus: \"close\" }); return \"open\"; }, tab() { return \"body\"; }, escape() { const layer = stack.pop(); return layer ? layer.triggerId : \"none\"; }, backdrop() { return this.escape(); }, background() { return \"allowed\"; }, depth() { return stack.length; } };\n}\n" }
    ]
  },
  {
    id: "E29", slug: "form-validator", title: "表单校验状态模型",
    summary: "提交时校验标题和金额，失焦只延后，旧一代异步结果不能覆盖新提交。",
    runtime, estimatedMinutes: 30, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "createValidator() 有 title 和 amount 两个字符串字段。set 写入值。blur 返回 defer，不产生错误。submit 增加代次，title 去掉空白后不能为空，amount 必须匹配 ^[1-9][0-9]*$。返回 {generation, errors, focus, status}，focus 是第一个错误字段或空字符串，status 为 pending。settle(generation, ok) 在代次不符时返回 stale；ok 且无错误返回 saved，ok 且有错误返回 invalid，失败返回 rejected。",
    problem: ["失焦可以提醒调用方稍后检查，但不应在用户还没提交时就定下错误列表。提交才生成一代校验结果，并把 focus 指到第一个错误字段，供调用方做文字反馈。", "异步校验返回时，如果用户已经再次提交，旧结果必须是 stale。本题不设置 aria，也不移动 document 焦点。"],
    allowedApis: ["字符串", "正则", "数字"],
    unsupportedBehavior: ["不创建 form、input 或 aria-invalid。", "不移动 document.activeElement。", "不发网络请求；settle 由调用方传入结果。"],
    starterArtifact: "function createValidator() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["blur 直接返回 defer，不要在这里改 errors。", "submit 先把代次加一，再按 title、amount 的顺序收集错误，focus 取第一个。", "settle 先比较代次；代次相同才根据 ok 和当前错误决定 saved、invalid 或 rejected。"] as const,
    referenceArtifact: "function createValidator() {\n  const values = { title: \"\", amount: \"\" };\n  let generation = 0;\n  let errors = [];\n  return {\n    set(name, value) { if (!Object.hasOwn(values, name) || typeof value !== \"string\") throw new TypeError(\"Invalid field\"); values[name] = value; },\n    blur() { return \"defer\"; },\n    state() { return errors.join(\",\") || \"clear\"; },\n    submit() {\n      const current = ++generation;\n      errors = [];\n      if (!values.title.trim()) errors.push(\"title\");\n      if (!/^[1-9][0-9]*$/.test(values.amount)) errors.push(\"amount\");\n      return { generation: current, errors: errors.slice(), focus: errors[0] || \"\", status: \"pending\" };\n    },\n    settle(gen, ok) {\n      if (gen !== generation) return \"stale\";\n      if (!ok) return \"rejected\";\n      return errors.length ? \"invalid\" : \"saved\";\n    }\n  };\n}\n",
    explanation: ["空标题和金额 0 在 submit 时得到 title、amount 两个错误，focus 是 title，status 是 pending。在此之前 blur 只返回 defer，state 仍是 clear。", "第二次 submit 让第一次的代次过期，旧 settle 返回 stale。当前代次在没有错误且 ok 时是 saved；有错误时即使 ok 也是 invalid；ok 为 false 则是 rejected。"],
    alternative: "可以让每个字段携带自己的代次，这样单个字段的异步校验不会挡住其他字段。整表一代更简单，也避免旧字段结果混进新提交。",
    complexity: "submit 检查固定两个字段，O(1)。",
    commonMistakes: ["blur 立刻写入错误，用户尚未提交就进入失败状态。", "settle 不看代次，慢返回覆盖了更新的一次提交。"],
    knowledgeIds: ["K15-03"], timeoutMs: 2000,
    examples: [
      { code: "const form = createValidator();\nconsole.log([form.blur(), form.state()].join(\" \"));", expectedOutput: "defer clear", expectedLogs: ["defer clear"], explanation: "失焦只表示延后检查，错误列表仍是 clear。" },
      { code: "const form = createValidator();\nform.set(\"amount\", \"0\");\nconst result = form.submit();\nconsole.log([result.focus, result.errors.join(\"+\"), result.status].join(\" \"));", expectedOutput: "title title+amount pending", expectedLogs: ["title title+amount pending"], explanation: "空白标题和 0 都不合法，焦点落在第一个错误 title，状态仍是 pending。" },
      { code: "const form = createValidator();\nconst first = form.submit();\nform.set(\"title\", \" 笔记 \"); form.set(\"amount\", \"12\");\nconst second = form.submit();\nconsole.log([form.settle(first.generation, true), form.settle(second.generation, true)].join(\" \"));", expectedOutput: "stale saved", expectedLogs: ["stale saved"], explanation: "第一次提交已被第二次取代，旧的成功结果是 stale；新一代没有错误，所以是 saved。" }
    ],
    testCases: cases("E29", [
      { name: "失焦延后", purpose: "blur 不写入错误", code: "const form = createValidator(); form.set(\"title\", \"\"); equal(form.blur(), \"defer\"); equal(form.state(), \"clear\");" },
      { name: "提交错误", purpose: "空标题和非法金额一起报出", code: "const form = createValidator(); form.set(\"amount\", \"0\"); const result = form.submit(); equal(result.errors.join(\",\"), \"title,amount\"); equal(result.focus, \"title\"); equal(result.status, \"pending\");" },
      { name: "空白标题", purpose: "只含空白的标题无效", code: "const form = createValidator(); form.set(\"title\", \"   \"); form.set(\"amount\", \"8\"); equal(form.submit().errors.join(\",\"), \"title\");" },
      { name: "合法值", purpose: "去空白后的标题和正整数可以通过", code: "const form = createValidator(); form.set(\"title\", \" 笔记 \"); form.set(\"amount\", \"12\"); const result = form.submit(); equal(result.errors.length, 0); equal(form.settle(result.generation, true), \"saved\");" },
      { name: "有错误的成功", purpose: "ok 不能把错误提交变成 saved", code: "const form = createValidator(); const result = form.submit(); equal(form.settle(result.generation, true), \"invalid\");" },
      { name: "拒绝", purpose: "异步失败返回 rejected", code: "const form = createValidator(); form.set(\"title\", \"笔记\"); form.set(\"amount\", \"3\"); const result = form.submit(); equal(form.settle(result.generation, false), \"rejected\");" },
      { name: "代次", purpose: "旧提交不能覆盖新提交", code: "const form = createValidator(); const first = form.submit(); form.set(\"title\", \"笔记\"); form.set(\"amount\", \"3\"); const second = form.submit(); equal(form.settle(first.generation, true), \"stale\"); equal(form.settle(second.generation, true), \"saved\");" },
      { name: "未知字段", purpose: "只能写 title 和 amount", code: "expectThrow(() => createValidator().set(\"email\", \"a\"), \"TypeError\");" }
    ]),
    wrongImplementations: [
      { name: "失焦就失败", code: "function createValidator() {\n  const values = { title: \"\", amount: \"\" }; let errors = [];\n  function check() { errors = []; if (!values.title.trim()) errors.push(\"title\"); if (!/^[1-9][0-9]*$/.test(values.amount)) errors.push(\"amount\"); }\n  return { set(name, value) { values[name] = value; }, blur() { check(); return \"invalid\"; }, state() { return errors.join(\",\") || \"clear\"; }, submit() { check(); return { generation: 1, errors: errors.slice(), focus: errors[0] || \"\", status: \"pending\" }; }, settle(_gen, ok) { return ok && !errors.length ? \"saved\" : \"invalid\"; } };\n}\n" },
      { name: "忽略代次", code: "function createValidator() {\n  const values = { title: \"\", amount: \"\" }; let errors = [];\n  return { set(name, value) { values[name] = value; }, blur() { return \"defer\"; }, state() { return \"clear\"; }, submit() { errors = []; if (!values.title.trim()) errors.push(\"title\"); if (!/^[1-9][0-9]*$/.test(values.amount)) errors.push(\"amount\"); return { generation: 1, errors: errors.slice(), focus: errors[0] || \"\", status: \"pending\" }; }, settle(_gen, ok) { if (!ok) return \"rejected\"; return errors.length ? \"invalid\" : \"saved\"; } };\n}\n" }
    ]
  },
  {
    id: "E30", slug: "fixed-virtual-list", title: "固定行高窗口计算",
    summary: "按固定行高、滚动位置和 overscan 切出可见 id，滚动超出末尾时停在最后一屏。",
    runtime, estimatedMinutes: 30, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "sliceWindow(ids, {itemHeight, scrollTop, viewport, overscan}) 返回 {start, end, ids}。end 不含。空列表返回 start 0、end 0 和空 ids。scrollTop 超过内容末尾时夹到最后一行所在窗口。返回的 ids 必须是输入数组里的原值。itemHeight 和 viewport 是不小于 1 的整数，scrollTop 和 overscan 是不小于 0 的整数。",
    problem: ["固定行高可以把滚动位置换成行号，overscan 再向两侧多取几行，减少快滚时的空白。", "滚过末尾时不能算出一个空窗口。容器变矮要减少可见行。返回值使用输入 id，而不是重新生成的下标。本题不创建滚动容器。"],
    allowedApis: ["数组", "整数运算"],
    unsupportedBehavior: ["不读取 DOM 尺寸，不监听 scroll。", "不处理可变行高。", "不回收或创建真实行节点。"],
    starterArtifact: "function sliceWindow() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["空列表直接返回 0 到 0。非空时把 scrollTop 夹到最后一行的起始范围内。", "起始行是夹取后的 scrollTop 除以行高，可见行数至少是 1。", "start 再减去 overscan，end 加上可见行数和 overscan，两边都不要越出数组。"] as const,
    referenceArtifact: "function sliceWindow(ids, view) {\n  if (!Array.isArray(ids) || !view) throw new TypeError(\"Invalid input\");\n  const { itemHeight, scrollTop, viewport, overscan } = view;\n  for (const value of [itemHeight, viewport, overscan]) if (!Number.isInteger(value) || value < 0) throw new RangeError(\"Invalid view\");\n  if (itemHeight < 1 || viewport < 1) throw new RangeError(\"Invalid view\");\n  if (!Number.isInteger(scrollTop) || scrollTop < 0) throw new RangeError(\"Invalid scroll\");\n  if (ids.length === 0) return { start: 0, end: 0, ids: [] };\n  const top = Math.min(scrollTop, ids.length * itemHeight - 1);\n  const first = Math.floor(top / itemHeight);\n  const visible = Math.max(1, Math.ceil(viewport / itemHeight));\n  const start = Math.max(0, first - overscan);\n  const end = Math.min(ids.length, first + visible + overscan);\n  return { start, end, ids: ids.slice(start, end) };\n}\n",
    explanation: ["行高 10、视口 20、overscan 1、滚动 0 时，可见两行再向前不越界、向后多一行，所以前三个 id 进入窗口。", "滚动值远大于内容高度时，先夹到最后一行，因此仍然返回最后一个 id，而不是空数组。空列表保持 0 到 0。返回的是输入里的字符串 id。"],
    alternative: "可以先算不含 overscan 的可见区间，再单独扩展。两次夹取更啰嗦，但容器尺寸变化时容易核对是哪一步变了。",
    complexity: "切片 O(k)，k 是返回的行数；定位本身 O(1)。",
    commonMistakes: ["滚动超过末尾后返回空 ids，最后几行消失。", "返回下标而不是输入 id，行身份在数据替换后对不上。"],
    knowledgeIds: ["K10-04"], timeoutMs: 2000,
    examples: [
      { code: "console.log(sliceWindow([\"a\", \"b\", \"c\", \"d\"], { itemHeight: 10, scrollTop: 0, viewport: 20, overscan: 1 }).ids.join(\",\"));", expectedOutput: "a,b,c", expectedLogs: ["a,b,c"], explanation: "视口能放下两行，overscan 再向后多取一行，起点之前没有行可取。" },
      { code: "console.log(sliceWindow([\"a\", \"b\", \"c\", \"d\"], { itemHeight: 10, scrollTop: 1000, viewport: 10, overscan: 0 }).ids.join(\",\"));", expectedOutput: "d", expectedLogs: ["d"], explanation: "滚动超过内容末尾后夹到最后一行，窗口里仍是 d。" },
      { code: "const view = sliceWindow([], { itemHeight: 10, scrollTop: 0, viewport: 20, overscan: 0 });\nconsole.log([view.start, view.end, view.ids.length].join(\" \"));", expectedOutput: "0 0 0", expectedLogs: ["0 0 0"], explanation: "空列表没有可渲染行，区间保持 0 到 0。" }
    ],
    testCases: cases("E30", [
      { name: "空列表", purpose: "没有 id 时窗口为空", code: "equal(sliceWindow([], { itemHeight: 10, scrollTop: 0, viewport: 20, overscan: 0 }), { start: 0, end: 0, ids: [] });" },
      { name: "起始窗口", purpose: "滚动 0 包含 overscan", code: "equal(sliceWindow([\"a\", \"b\", \"c\", \"d\"], { itemHeight: 10, scrollTop: 0, viewport: 20, overscan: 1 }).ids.join(\",\"), \"a,b,c\");" },
      { name: "滚动夹取", purpose: "超过末尾仍保留最后一行", code: "equal(sliceWindow([\"a\", \"b\", \"c\", \"d\"], { itemHeight: 10, scrollTop: 1000, viewport: 10, overscan: 0 }).ids.join(\",\"), \"d\");" },
      { name: "容器变小", purpose: "更矮的视口减少行数", code: "const wide = sliceWindow([\"a\", \"b\", \"c\", \"d\"], { itemHeight: 10, scrollTop: 0, viewport: 30, overscan: 0 }); const narrow = sliceWindow([\"a\", \"b\", \"c\", \"d\"], { itemHeight: 10, scrollTop: 0, viewport: 10, overscan: 0 }); equal(wide.ids.join(\",\"), \"a,b,c\"); equal(narrow.ids.join(\",\"), \"a\");" },
      { name: "条目身份", purpose: "返回输入中的 id", code: "const ids = [\"row-a\", \"row-b\"]; const view = sliceWindow(ids, { itemHeight: 10, scrollTop: 0, viewport: 10, overscan: 0 }); equal(view.ids[0], ids[0]);" },
      { name: "中间位置", purpose: "overscan 向两侧扩展", code: "equal(sliceWindow([\"a\", \"b\", \"c\", \"d\", \"e\"], { itemHeight: 10, scrollTop: 20, viewport: 10, overscan: 1 }), { start: 1, end: 4, ids: [\"b\", \"c\", \"d\"] });" },
      { name: "负滚动", purpose: "scrollTop 不能为负", code: "expectThrow(() => sliceWindow([\"a\"], { itemHeight: 10, scrollTop: -1, viewport: 10, overscan: 0 }), \"RangeError\");" },
      { name: "零行高", purpose: "行高至少为 1", code: "expectThrow(() => sliceWindow([\"a\"], { itemHeight: 0, scrollTop: 0, viewport: 10, overscan: 0 }), \"RangeError\");" }
    ]),
    wrongImplementations: [
      { name: "越界变空", code: "function sliceWindow(ids, view) {\n  const first = Math.floor(view.scrollTop / view.itemHeight);\n  const end = Math.min(ids.length, first + Math.ceil(view.viewport / view.itemHeight));\n  if (first >= ids.length) return { start: first, end: first, ids: [] };\n  return { start: first, end, ids: ids.slice(first, end) };\n}\n" },
      { name: "返回下标", code: "function sliceWindow(ids, view) {\n  const end = Math.min(ids.length, Math.ceil(view.viewport / view.itemHeight));\n  return { start: 0, end, ids: Array.from({ length: end }, (_item, index) => String(index)) };\n}\n" }
    ]
  },
  {
    id: "E31", slug: "async-resource", title: "异步资源状态模型",
    summary: "用代次模拟请求开始、成功、失败、重试和卸载，旧结果不能覆盖新请求。",
    runtime, estimatedMinutes: 30, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "createResource() 初始 read() 为 idle。start(key) 在未卸载时把状态改为 pending 并返回递增 id；连续 start 代表参数变化或重复执行。succeed(id, value) 和 fail(id, message) 只接受当前 id，否则返回 stale。retry() 以当前 key 再 start 一次。dispose() 后 start 返回 null，后续 succeed 返回 disposed，read().status 为 disposed。",
    problem: ["请求的结果必须和发起它的那一次对应。参数变了，或同一次渲染里 start 被调用两次，先返回的结果都是旧的。", "卸载后不能再写入 ready。retry 不是把旧 id 重新结算，而是开始新的一代。这不是 React Hook，也不会模拟 StrictMode 的组件树。"],
    allowedApis: ["对象", "数字", "字符串"],
    unsupportedBehavior: ["不实现 React Hook，不触发渲染。", "不发真实请求。", "不模拟 StrictMode 的挂载次数，只提供可重复调用的 start。"],
    starterArtifact: "function createResource() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["start 先检查 disposed，再增加代次，并把 snapshot 设为 pending。", "succeed 和 fail 在 id 不等于当前代次时返回 stale，不要改 snapshot。", "retry 调用 start(当前 key)；dispose 后两种写入都失效。"] as const,
    referenceArtifact: "function createResource() {\n  let generation = 0;\n  let disposed = false;\n  let snapshot = { status: \"idle\", value: null, key: \"\" };\n  return {\n    read() { return { status: snapshot.status, value: snapshot.value, key: snapshot.key }; },\n    start(key) {\n      if (disposed) return null;\n      if (typeof key !== \"string\") throw new TypeError(\"Invalid key\");\n      const id = ++generation;\n      snapshot = { status: \"pending\", value: null, key };\n      return id;\n    },\n    succeed(id, value) {\n      if (disposed) return \"disposed\";\n      if (id !== generation) return \"stale\";\n      snapshot = { status: \"ready\", value, key: snapshot.key };\n      return \"ready\";\n    },\n    fail(id, message) {\n      if (disposed) return \"disposed\";\n      if (id !== generation) return \"stale\";\n      snapshot = { status: \"error\", value: message, key: snapshot.key };\n      return \"error\";\n    },\n    retry() {\n      if (disposed) return null;\n      if (!snapshot.key) throw new Error(\"Nothing to retry\");\n      return this.start(snapshot.key);\n    },\n    dispose() { disposed = true; snapshot = { status: \"disposed\", value: snapshot.value, key: snapshot.key }; }\n  };\n}\n",
    explanation: ["连续两次 start 后，第一次 succeed 返回 stale，第二次才把 value 写成 ready。这覆盖了参数变化和重复执行。", "dispose 之后 start 返回 null，迟到的 succeed 返回 disposed。fail 写入 error 后，retry 增加新代次，旧的 fail id 再 succeed 也是 stale。"],
    alternative: "可以用 AbortController 表示上一代。代次数字不依赖宿主取消，测试里也能直接比较 id。",
    complexity: "每次状态转移 O(1)。",
    commonMistakes: ["后返回的旧请求直接覆盖当前 value。", "卸载后仍把状态改成 ready。"],
    knowledgeIds: ["K07-02", "K07-06"], timeoutMs: 2000,
    examples: [
      { code: "const host = createResource();\nconst first = host.start(\"item\");\nconst second = host.start(\"item\");\nconsole.log([host.succeed(first, 1), host.succeed(second, 2), host.read().value].join(\" \"));", expectedOutput: "stale ready 2", expectedLogs: ["stale ready 2"], explanation: "两次 start 后只有后一个 id 可以写入，值是 2。" },
      { code: "const host = createResource();\nconst id = host.start(\"item\");\nhost.dispose();\nconsole.log([host.succeed(id, 1), host.read().status].join(\" \"));", expectedOutput: "disposed disposed", expectedLogs: ["disposed disposed"], explanation: "卸载后迟到的成功不能把状态改回 ready。" },
      { code: "const host = createResource();\nconst failed = host.start(\"item\");\nhost.fail(failed, \"timeout\");\nconst next = host.retry();\nconsole.log([host.succeed(failed, 1), host.succeed(next, 5), host.read().status].join(\" \"));", expectedOutput: "stale ready ready", expectedLogs: ["stale ready ready"], explanation: "retry 开始新一代，失败那一代的成功结果是 stale，新结果进入 ready。" }
    ],
    testCases: cases("E31", [
      { name: "重复执行", purpose: "后一次 start 使前一次变旧", code: "const host = createResource(); const first = host.start(\"a\"); const second = host.start(\"a\"); equal(host.succeed(first, 1), \"stale\"); equal(host.succeed(second, 2), \"ready\"); equal(host.read().value, 2);" },
      { name: "参数变化", purpose: "新 key 替换 pending", code: "const host = createResource(); host.start(\"a\"); const next = host.start(\"b\"); host.succeed(next, 4); equal(host.read().key, \"b\"); equal(host.read().value, 4);" },
      { name: "卸载", purpose: "dispose 后不能开始或写入", code: "const host = createResource(); const id = host.start(\"a\"); host.dispose(); equal(host.start(\"b\"), null); equal(host.succeed(id, 1), \"disposed\"); equal(host.read().status, \"disposed\");" },
      { name: "失败", purpose: "当前代次可以进入 error", code: "const host = createResource(); const id = host.start(\"a\"); equal(host.fail(id, \"down\"), \"error\"); equal(host.read(), { status: \"error\", value: \"down\", key: \"a\" });" },
      { name: "旧失败", purpose: "过期 id 的 fail 不覆盖", code: "const host = createResource(); const first = host.start(\"a\"); const second = host.start(\"a\"); equal(host.fail(first, \"down\"), \"stale\"); equal(host.read().status, \"pending\"); equal(second > first, true);" },
      { name: "重试", purpose: "retry 使用新 id", code: "const host = createResource(); const failed = host.start(\"a\"); host.fail(failed, \"down\"); const next = host.retry(); equal(host.succeed(failed, 1), \"stale\"); equal(host.succeed(next, 7), \"ready\");" },
      { name: "尚未开始", purpose: "没有 key 时不能 retry", code: "expectThrow(() => createResource().retry(), \"Error\");" },
      { name: "非法 key", purpose: "key 必须是字符串", code: "expectThrow(() => createResource().start(1), \"TypeError\");" }
    ]),
    wrongImplementations: [
      { name: "旧结果覆盖", code: "function createResource() {\n  let snapshot = { status: \"idle\", value: null, key: \"\" }; let id = 0;\n  return { read() { return { ...snapshot }; }, start(key) { snapshot = { status: \"pending\", value: null, key }; return ++id; }, succeed(_id, value) { snapshot = { status: \"ready\", value, key: snapshot.key }; return \"ready\"; }, fail(_id, message) { snapshot = { status: \"error\", value: message, key: snapshot.key }; return \"error\"; }, retry() { return this.start(snapshot.key); }, dispose() { snapshot.status = \"disposed\"; } };\n}\n" },
      { name: "卸载后仍写入", code: "function createResource() {\n  let generation = 0; let snapshot = { status: \"idle\", value: null, key: \"\" };\n  return { read() { return { ...snapshot }; }, start(key) { snapshot = { status: \"pending\", value: null, key }; return ++generation; }, succeed(id, value) { if (id !== generation) return \"stale\"; snapshot = { status: \"ready\", value, key: snapshot.key }; return \"ready\"; }, fail(id, message) { if (id !== generation) return \"stale\"; snapshot = { status: \"error\", value: message, key: snapshot.key }; return \"error\"; }, retry() { return this.start(snapshot.key); }, dispose() {} };\n}\n" }
    ]
  },
  {
    id: "E32", slug: "mini-reactive", title: "简化响应式依赖系统",
    summary: "在 effect 执行期间记录读取，写入时只重新运行仍依赖该属性的 effect。",
    runtime, estimatedMinutes: 35, revision: 1, updatedAt: "2026-10-14", verifiedAt: "2026-10-14",
    entryContract: "createReactive() 返回 reactive(object) 和 effect(fn)。effect 返回停止函数。读取发生在 effect 内才记录依赖；写入变化后重新运行对应 effect。下一次运行前清掉上一轮依赖和它创建的嵌套 effect。同一 effect 重复读取同一属性，一次写入只运行一次。停止后不再运行。",
    problem: ["依赖应来自这次执行实际读过的属性。条件从真变假后，不再读取的属性就不能继续触发它。", "嵌套 effect 由外层本次运行拥有，外层重跑前要停掉上一轮内层。停止函数要同时去掉依赖。这是一个教学模型，不是 Vue 的响应式实现。"],
    allowedApis: ["Proxy", "WeakMap", "Map", "Set", "Reflect"],
    unsupportedBehavior: ["不是 Vue，不实现 ref、computed、watch、调度队列或组件更新。", "只代理普通对象的字符串属性。", "不处理删除属性、数组方法和深层自动代理。"],
    starterArtifact: "function createReactive() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["用 active effect 在 get 时把自己加入该属性的订阅集合，并把集合记到 effect 上。", "effect 重跑前先停止它创建的子 effect，再从旧订阅集合里删掉自己。", "set 只有值真正变化时才触发；停止函数要让后续 run 直接返回。"] as const,
    referenceArtifact: "function createReactive() {\n  let active = null;\n  const stack = [];\n  const deps = new WeakMap();\n  function track(target, key) {\n    if (!active) return;\n    let keys = deps.get(target);\n    if (!keys) { keys = new Map(); deps.set(target, keys); }\n    let dep = keys.get(key);\n    if (!dep) { dep = new Set(); keys.set(key, dep); }\n    dep.add(active);\n    active.deps.add(dep);\n  }\n  function trigger(target, key) {\n    const dep = deps.get(target) && deps.get(target).get(key);\n    if (!dep) return;\n    for (const runner of [...dep]) if (runner !== active) runner.run();\n  }\n  function stop(runner) { runner.stopped = true; cleanup(runner); }\n  function cleanup(runner) {\n    for (const child of [...runner.children]) stop(child);\n    runner.children.clear();\n    for (const dep of runner.deps) dep.delete(runner);\n    runner.deps.clear();\n  }\n  return {\n    reactive(obj) {\n      if (!obj || typeof obj !== \"object\" || Array.isArray(obj)) throw new TypeError(\"Invalid state\");\n      return new Proxy(obj, {\n        get(target, key, receiver) {\n          const value = Reflect.get(target, key, receiver);\n          if (typeof key === \"string\") track(target, key);\n          return value;\n        },\n        set(target, key, value, receiver) {\n          const old = target[key];\n          const result = Reflect.set(target, key, value, receiver);\n          if (typeof key === \"string\" && !Object.is(old, value)) trigger(target, key);\n          return result;\n        }\n      });\n    },\n    effect(fn) {\n      if (typeof fn !== \"function\") throw new TypeError(\"Invalid effect\");\n      const runner = { deps: new Set(), children: new Set(), stopped: false, run() {\n        if (this.stopped) return;\n        cleanup(this);\n        stack.push(active);\n        active = this;\n        try { fn(); } finally { active = stack.pop(); }\n      } };\n      if (active) active.children.add(runner);\n      runner.run();\n      return () => stop(runner);\n    }\n  };\n}\n",
    explanation: ["effect 读取 on 和 extra 时只订阅这两个属性。on 变成 false 后，这次执行不再读 extra，cleanup 已去掉旧订阅，所以再改 extra 不会追加日志。", "外层读取 a、内层读取 b 时，只改 b 不会重跑外层。改 a 会先停掉旧内层，再创建新内层，因此 b 的日志只增加一次。重复读取 a 也只订阅一次。停止后继续赋值不再增加计数。"],
    alternative: "可以显式调用 track(key) 和 trigger(key)，不使用 Proxy。调用点更清楚，但忘记 track 时依赖会静默丢失。",
    complexity: "一次写入触发 k 个 effect，每个 effect 重跑成本取决于它读取的属性数。",
    commonMistakes: ["重跑前不清旧依赖，条件已经为假仍被 extra 触发。", "停止函数没有从订阅集合删除 effect，之后的赋值仍会运行。"],
    knowledgeIds: ["K08-01"], timeoutMs: 2000,
    examples: [
      { code: "const sys = createReactive();\nconst state = sys.reactive({ on: true, extra: 0 });\nconst logs = [];\nsys.effect(() => { logs.push(state.on ? String(state.extra) : \"off\"); });\nstate.extra = 1; state.on = false; state.extra = 9;\nconsole.log(logs.join(\",\"));", expectedOutput: "0,1,off", expectedLogs: ["0,1,off"], explanation: "on 变为 false 后不再读取 extra，随后修改 extra 不会再运行。" },
      { code: "const sys = createReactive();\nconst state = sys.reactive({ a: 1, b: 1 });\nconst logs = [];\nsys.effect(() => { logs.push(\"a\" + state.a); sys.effect(() => { logs.push(\"b\" + state.b); }); });\nlogs.length = 0; state.b = 2;\nconsole.log(logs.join(\",\"));", expectedOutput: "b2", expectedLogs: ["b2"], explanation: "只修改内层依赖 b 时，外层 effect 不重跑。" },
      { code: "const sys = createReactive();\nconst state = sys.reactive({ a: 1 });\nlet count = 0;\nconst stop = sys.effect(() => { count += 1; state.a; state.a; });\nstate.a = 2; stop(); state.a = 3;\nconsole.log(String(count));", expectedOutput: "2", expectedLogs: ["2"], explanation: "重复读取只触发一次；停止后再赋值，计数停留在初始和第一次更新。" }
    ],
    testCases: cases("E32", [
      { name: "条件依赖", purpose: "不再读取的属性停止触发", code: "const sys = createReactive(); const state = sys.reactive({ on: true, extra: 0 }); const logs = []; sys.effect(() => { logs.push(state.on ? String(state.extra) : \"off\"); }); state.on = false; state.extra = 9; equal(logs.join(\",\"), \"0,off\");" },
      { name: "嵌套", purpose: "内层依赖不重跑外层", code: "const sys = createReactive(); const state = sys.reactive({ a: 1, b: 1 }); const logs = []; sys.effect(() => { logs.push(\"a\" + state.a); sys.effect(() => { logs.push(\"b\" + state.b); }); }); logs.length = 0; state.b = 2; equal(logs.join(\",\"), \"b2\");" },
      { name: "外层更新", purpose: "外层重跑时重建内层", code: "const sys = createReactive(); const state = sys.reactive({ a: 1, b: 1 }); const logs = []; sys.effect(() => { logs.push(\"a\" + state.a); sys.effect(() => { logs.push(\"b\" + state.b); }); }); logs.length = 0; state.a = 3; equal(logs.join(\",\"), \"a3,b1\");" },
      { name: "重复依赖", purpose: "同一属性一次写入只运行一次", code: "const sys = createReactive(); const state = sys.reactive({ a: 1 }); let count = 0; sys.effect(() => { count += 1; state.a; state.a; }); state.a = 2; equal(count, 2);" },
      { name: "停止", purpose: "停止后不再运行", code: "const sys = createReactive(); const state = sys.reactive({ a: 1 }); let count = 0; const stop = sys.effect(() => { count += 1; state.a; }); stop(); state.a = 2; equal(count, 1);" },
      { name: "相同值", purpose: "相同赋值不触发", code: "const sys = createReactive(); const state = sys.reactive({ a: 1 }); let count = 0; sys.effect(() => { count += 1; state.a; }); state.a = 1; equal(count, 1);" },
      { name: "无 effect 读取", purpose: "effect 之外的读取不订阅", code: "const sys = createReactive(); const state = sys.reactive({ a: 1 }); state.a; let count = 0; sys.effect(() => { count += 1; }); state.a = 2; equal(count, 1);" },
      { name: "非法状态", purpose: "数组不能作为 reactive 目标", code: "expectThrow(() => createReactive().reactive([]), \"TypeError\");" }
    ]),
    wrongImplementations: [
      { name: "不清依赖", code: "function createReactive() {\n  let active = null; const deps = new WeakMap();\n  function track(target, key) { if (!active) return; let keys = deps.get(target); if (!keys) { keys = new Map(); deps.set(target, keys); } let dep = keys.get(key); if (!dep) { dep = new Set(); keys.set(key, dep); } dep.add(active); }\n  function trigger(target, key) { const dep = deps.get(target) && deps.get(target).get(key); if (dep) for (const runner of [...dep]) runner.run(); }\n  return { reactive(obj) { return new Proxy(obj, { get(target, key, receiver) { track(target, key); return Reflect.get(target, key, receiver); }, set(target, key, value, receiver) { const old = target[key]; const result = Reflect.set(target, key, value, receiver); if (!Object.is(old, value)) trigger(target, key); return result; } }); }, effect(fn) { const runner = { run() { active = this; fn(); active = null; } }; runner.run(); return () => { runner.run = () => {}; }; } };\n}\n" },
      { name: "停止无效", code: "function createReactive() {\n  let active = null; const stack = []; const deps = new WeakMap();\n  function track(target, key) { if (!active) return; let keys = deps.get(target); if (!keys) { keys = new Map(); deps.set(target, keys); } let dep = keys.get(key); if (!dep) { dep = new Set(); keys.set(key, dep); } dep.add(active); active.deps.add(dep); }\n  function trigger(target, key) { const dep = deps.get(target) && deps.get(target).get(key); if (!dep) return; for (const runner of [...dep]) if (runner !== active) runner.run(); }\n  function cleanup(runner) { for (const dep of runner.deps) dep.delete(runner); runner.deps.clear(); }\n  return { reactive(obj) { return new Proxy(obj, { get(target, key, receiver) { if (typeof key === \"string\") track(target, key); return Reflect.get(target, key, receiver); }, set(target, key, value, receiver) { const old = target[key]; const result = Reflect.set(target, key, value, receiver); if (typeof key === \"string\" && !Object.is(old, value)) trigger(target, key); return result; } }); }, effect(fn) { const runner = { deps: new Set(), run() { cleanup(this); stack.push(active); active = this; try { fn(); } finally { active = stack.pop(); } } }; runner.run(); return () => {}; } };\n}\n" }
    ]
  },
  {
    id: "E33", slug: "utility-type-model", title: "属性投影、浅冻结与 Promise 吸收",
    summary: "在运行时复制指定自身键、冻结浅副本，并按 Promise 语义递归吸收 thenable；与 TypeScript 类型变换分开验证。",
    runtime, estimatedMinutes: 25, revision: 2, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "pick(source, keys) 复制选中的自身字符串键，缺失键不出现，空 keys 得到 {}。包括 __proto__ 在内的键都创建自身数据属性，不改变结果原型。readonlyCopy(source) 复制自身可枚举字符串键并浅冻结新对象，严格模式修改副本抛 TypeError。unwrap(value) 返回 Promise，递归吸收 Promise/thenable，then getter 或调用抛错都变成拒绝。非对象 source、非字符串 key 抛 TypeError。",
    problem: [
      "本题训练运行时属性投影、浅冻结和 Promise 吸收，不实现 TypeScript 的 Pick、Readonly 或 Awaited。类型在编译时约束程序，不会自动复制字段或冻结对象；真实类型实现与编译练习见 K03-06。",
      "空 keys 表示本次不选择属性。缺失键与存在且值为 undefined 的键不同；__proto__ 也是可能出现在 JSON 数据中的自身键，不能用普通赋值调用目标继承的 setter。"
    ],
    allowedApis: ["对象", "Promise", "Object.freeze", "Object.hasOwn"],
    unsupportedBehavior: [
      "不运行 tsc，不以运行时抛错代替负向类型诊断。",
      "冻结只作用于副本顶层，嵌套对象保持原引用，不复制完整描述符或原型。",
      "Promise 吸收遵守递归语义，不实现只解包一层后仍直接兑现 thenable 的另一种协议。"
    ],
    starterArtifact: "function pick() {\n  throw new Error(\"未实现\");\n}\nfunction readonlyCopy() {\n  throw new Error(\"未实现\");\n}\nfunction unwrap() {\n  throw new Error(\"未实现\");\n}\n",
    hints: [
      "用 Object.hasOwn 区分缺失键。用 Object.defineProperty 创建自身数据属性，避免 __proto__ 触发目标 setter。",
      "readonlyCopy 用 Object.keys 选择自身可枚举字符串键，逐项创建新属性，最后冻结副本。",
      "unwrap 直接使用 Promise.resolve；不要提前读取 then，原生吸收会把 getter 及 then 调用异常转成拒绝。"
    ],
    referenceArtifact: "function pick(source, keys) {\n  if (source === null || typeof source !== \"object\" || Array.isArray(source) || !Array.isArray(keys)) throw new TypeError(\"Invalid pick\");\n  const result = {};\n  for (const key of keys) {\n    if (typeof key !== \"string\") throw new TypeError(\"Invalid key\");\n    if (Object.hasOwn(source, key)) Object.defineProperty(result, key, { value: source[key], enumerable: true, writable: true, configurable: true });\n  }\n  return result;\n}\nfunction readonlyCopy(source) {\n  if (source === null || typeof source !== \"object\" || Array.isArray(source)) throw new TypeError(\"Invalid source\");\n  const copy = {};\n  for (const key of Object.keys(source)) Object.defineProperty(copy, key, { value: source[key], enumerable: true, writable: true, configurable: true });\n  return Object.freeze(copy);\n}\nfunction unwrap(value) {\n  return Promise.resolve(value);\n}\n",
    explanation: [
      "pick({a:1}, [\"a\",\"missing\"]) 只有 a；选择自身存在的 undefined 字段仍要保留这个键。defineProperty 对 __proto__ 建立数据属性，返回对象仍以 Object.prototype 为原型。readonlyCopy 冻结新副本，不冻结原对象；嵌套引用仍可变化。",
      "unwrap(1) 兑现为 1；thenable 若交付另一个 thenable，会继续吸收到最终值。Promise.resolve 的吸收过程处理 then getter 和调用失败，统一返回拒绝。TypeScript Awaited 的递归类型关系可与此类比，但编译器类型与运行时操作分别验收。"
    ],
    alternative: "需要保留完整属性描述符时可使用 getOwnPropertyDescriptors/defineProperties；这与本题把选定值写成可写数据属性的合同不同。只需声明静态字段形状时使用 TypeScript 工具类型，不额外执行复制或冻结。",
    complexity: "pick 为 O(keys.length)，readonlyCopy 为 O(自身可枚举字符串键数)，均另计属性读取成本。Promise 的等待和 thenable 链长不受此函数固定常数约束；复制所需空间与保留键数相关。",
    commonMistakes: ["缺失键被写成 undefined，可选属性变成了显式空值。", "冻结原对象，调用方失去对输入的修改能力。"],
    knowledgeIds: ["K03-06"], timeoutMs: 2000,
    examples: [
      { code: "console.log(JSON.stringify(pick({ a: 1, b: 2 }, [\"a\", \"missing\"])));", expectedOutput: "{\"a\":1}", expectedLogs: ["{\"a\":1}"], explanation: "只复制存在的 a，缺失键不出现在结果里。" },
      { code: "const copy = readonlyCopy({ a: 1 });\nlet name = \"\";\ntry { copy.a = 2; } catch (error) { name = error.name; }\nconsole.log(name);", expectedOutput: "TypeError", expectedLogs: ["TypeError"], explanation: "冻结的是副本，修改它会抛 TypeError。" },
      { code: "const value = await unwrap({ then(ok) { ok(2); } });\nconsole.log(String(value));", expectedOutput: "2", expectedLogs: ["2"], explanation: "thenable 被展开一层，得到 then 交出去的 2。" }
    ],
    testCases: cases("E33", [
      {
        "name": "选择存在的键",
        "purpose": "只保留请求且拥有的键",
        "code": "equal(pick({ a: 1, b: 2 }, [\"a\"]), { a: 1 });"
      },
      {
        "name": "可选键缺失",
        "purpose": "没有的键不写入 undefined",
        "code": "equal(pick({ a: 1 }, [\"b\"]), {});"
      },
      {
        "name": "空键",
        "purpose": "空 keys 得到空对象",
        "code": "equal(pick({ a: 1 }, []), {});"
      },
      {
        "name": "只读副本",
        "purpose": "修改副本抛错且原对象不变",
        "code": "const source = { a: 1 }; const copy = readonlyCopy(source); expectThrow(() => { copy.a = 2; }, \"TypeError\"); source.a = 3; equal(source.a, 3);"
      },
      {
        "name": "普通值",
        "purpose": "非 thenable 原样解析",
        "code": "equal(await unwrap(1), 1); equal(await unwrap(\"ok\"), \"ok\");"
      },
      {
        "name": "一层 thenable",
        "purpose": "展开 then 交出的值",
        "code": "equal(await unwrap({ then(ok) { ok({ n: 2 }); } }), { n: 2 });"
      },
      {
        "name": "then 抛错",
        "purpose": "展开失败时拒绝",
        "code": "await expectReject(unwrap({ then() { throw new TypeError(\"bad\"); } }), \"TypeError\");"
      },
      {
        "name": "非法键",
        "purpose": "非字符串键被拒绝",
        "code": "expectThrow(() => pick({ a: 1 }, [1]), \"TypeError\"); expectThrow(() => pick(null, []), \"TypeError\");"
      },
      {
        "name": "特殊自身键",
        "purpose": "__proto__ 是数据属性而非原型修改",
        "code": "const source = JSON.parse('{\"__proto__\":{\"injected\":true}}'); for (const copy of [pick(source,[\"__proto__\"]), readonlyCopy(source)]) { equal(Object.getPrototypeOf(copy), Object.prototype); equal(Object.hasOwn(copy,\"__proto__\"),true); equal(copy.injected,undefined); equal(copy.__proto__.injected,true); }"
      },
      {
        "name": "嵌套 thenable",
        "purpose": "递归吸收到最终值",
        "code": "equal(await unwrap({then(resolve){resolve({then(done){done(42);}});}}),42);"
      },
      {
        "name": "then getter 失败",
        "purpose": "返回拒绝 Promise，不提前同步抛错",
        "code": "const result = unwrap({get then(){throw new TypeError(\"getter\");}}); await expectReject(result,\"TypeError\");"
      },
      {
        "name": "空原型与 undefined",
        "purpose": "自身键和值分别保留",
        "code": "const source = Object.create(null); source.a=undefined; const copy=pick(source,[\"a\",\"missing\"]); equal(Object.hasOwn(copy,\"a\"),true); equal(Object.hasOwn(copy,\"missing\"),false);"
      }
    ]),
    wrongImplementations: [
      { name: "缺失变 undefined", code: "function pick(source, keys) { const result = {}; for (const key of keys) result[key] = source[key]; return result; }\nfunction readonlyCopy(source) { return { ...source }; }\nfunction unwrap(value) { return Promise.resolve(value); }\n" },
      { name: "冻结原对象", code: "function pick(source, keys) { const result = {}; for (const key of keys) if (Object.hasOwn(source, key)) result[key] = source[key]; return result; }\nfunction readonlyCopy(source) { return Object.freeze(source); }\nfunction unwrap(value) { return Promise.resolve(value); }\n" }
    ]
  },
  {
    id: "E34", slug: "typed-event-map", title: "事件名称与参数数量校验",
    summary: "用参数个数约束事件名，错误名称和错误载荷在运行时抛 TypeError。",
    runtime, estimatedMinutes: 25, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "createTypedEvents(schema) 的 schema 把事件名映射到非负整数参数个数。on(name, handler) 返回取消函数。emit(name, ...args) 在名称不存在或参数个数不符时抛 TypeError。零参数事件不能接收额外参数，多参数事件必须给满。",
    problem: [
      "本题只在运行时检查已登记事件名和参数数量，不证明载荷类型正确。save 需要两个参数时，两个数字或两个对象都可能满足个数；字段类型要由运行时 schema 或 TypeScript 事件元组类型另行约束。",
      "零参数和多参数都按 schema 检查。取消订阅后，同一次 emit 不再调用该处理函数。K03-05 的编译练习会用事件名关联参数元组，拒绝同数量但类型错误的调用。"
    ],
    allowedApis: ["Map", "Set", "函数"],
    unsupportedBehavior: ["不运行 TypeScript，也不生成类型错误。", "不校验参数的字段形状，只校验个数。", "不提供通配事件或异步 emit。"],
    starterArtifact: "function createTypedEvents() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["构造时把每个事件名放进 Map，值是监听集合。", "emit 先确认名称存在，再比较 args.length 和 schema 中的个数。", "on 返回的函数从对应集合删除 handler。"] as const,
    referenceArtifact: "function createTypedEvents(schema) {\n  if (!schema || typeof schema !== \"object\" || Array.isArray(schema)) throw new TypeError(\"Invalid schema\");\n  const listeners = new Map();\n  for (const [name, count] of Object.entries(schema)) {\n    if (!Number.isInteger(count) || count < 0) throw new TypeError(\"Invalid schema\");\n    listeners.set(name, new Set());\n  }\n  return {\n    on(name, handler) {\n      if (!listeners.has(name) || typeof handler !== \"function\") throw new TypeError(\"Invalid listener\");\n      listeners.get(name).add(handler);\n      return () => listeners.get(name).delete(handler);\n    },\n    emit(name, ...args) {\n      if (!listeners.has(name)) throw new TypeError(\"Unknown event\");\n      if (args.length !== schema[name]) throw new TypeError(\"Invalid payload\");\n      for (const handler of [...listeners.get(name)]) handler(...args);\n    }\n  };\n}\n",
    explanation: ["tick 的个数是 0，emit('tick') 可以调用监听；emit('tick', 1) 因多了一个参数抛 TypeError。save 需要两个参数，少一个同样抛 TypeError。", "未知名称在 on 和 emit 时都抛 TypeError。取消函数执行后，再 emit 不会调用已移除的处理函数。"],
    alternative: "为每个事件配置运行时解析器，可以继续验证字段与值；编译期事件映射则使用事件名到参数元组的泛型关系。这两种方式各自承担边界，比较一份示例参数不能替代类型或 schema 校验。",
    complexity: "emit 为 O(k)，k 是该事件的监听数。",
    commonMistakes: ["未知事件被静默忽略，调用方不知道名称写错。", "不检查参数个数，零参数事件仍接收额外载荷。"],
    knowledgeIds: ["K03-05"], timeoutMs: 2000,
    examples: [
      { code: "const bus = createTypedEvents({ tick: 0, save: 2 });\nlet seen = \"\";\nbus.on(\"save\", (id, count) => { seen = id + \":\" + count; });\nbus.emit(\"save\", \"note\", 1);\nconsole.log(seen);", expectedOutput: "note:1", expectedLogs: ["note:1"], explanation: "save 需要两个参数，监听按名称和个数收到 note 与 1。" },
      { code: "const bus = createTypedEvents({ tick: 0 });\nlet name = \"\";\ntry { bus.emit(\"tick\", 1); } catch (error) { name = error.name; }\nconsole.log(name);", expectedOutput: "TypeError", expectedLogs: ["TypeError"], explanation: "零参数事件收到额外参数时抛 TypeError。" },
      { code: "const bus = createTypedEvents({ tick: 0 });\nlet name = \"\";\ntry { bus.emit(\"missing\"); } catch (error) { name = error.name; }\nconsole.log(name);", expectedOutput: "TypeError", expectedLogs: ["TypeError"], explanation: "schema 里没有的名称不能 emit。" }
    ],
    testCases: cases("E34", [
      { name: "零参数", purpose: "无参数事件可以触发", code: "const bus = createTypedEvents({ tick: 0 }); let count = 0; bus.on(\"tick\", () => { count += 1; }); bus.emit(\"tick\"); equal(count, 1);" },
      { name: "多参数", purpose: "参数个数符合时传给监听", code: "const bus = createTypedEvents({ save: 2 }); let seen = \"\"; bus.on(\"save\", (id, n) => { seen = id + n; }); bus.emit(\"save\", \"a\", 1); equal(seen, \"a1\");" },
      { name: "多余载荷", purpose: "零参数事件拒绝额外参数", code: "expectThrow(() => createTypedEvents({ tick: 0 }).emit(\"tick\", 1), \"TypeError\");" },
      { name: "缺少载荷", purpose: "多参数事件拒绝缺少的参数", code: "expectThrow(() => createTypedEvents({ save: 2 }).emit(\"save\", \"a\"), \"TypeError\");" },
      { name: "错误名称", purpose: "未知 emit 抛错", code: "expectThrow(() => createTypedEvents({ tick: 0 }).emit(\"nope\"), \"TypeError\");" },
      { name: "错误订阅", purpose: "未知 on 抛错", code: "expectThrow(() => createTypedEvents({ tick: 0 }).on(\"nope\", () => {}), \"TypeError\");" },
      { name: "取消订阅", purpose: "取消后不再调用", code: "const bus = createTypedEvents({ tick: 0 }); let count = 0; const off = bus.on(\"tick\", () => { count += 1; }); off(); bus.emit(\"tick\"); equal(count, 0);" },
      { name: "非法个数", purpose: "schema 的个数必须是非负整数", code: "expectThrow(() => createTypedEvents({ tick: -1 }), \"TypeError\");" }
    ]),
    wrongImplementations: [
      { name: "不校验个数", code: "function createTypedEvents(schema) {\n  const listeners = new Map(Object.keys(schema).map(name => [name, new Set()]));\n  return { on(name, handler) { listeners.get(name).add(handler); return () => listeners.get(name).delete(handler); }, emit(name, ...args) { for (const handler of listeners.get(name)) handler(...args); } };\n}\n" },
      { name: "未知事件静默", code: "function createTypedEvents(schema) {\n  const listeners = new Map(Object.keys(schema).map(name => [name, new Set()]));\n  return { on(name, handler) { if (!listeners.has(name)) return () => {}; listeners.get(name).add(handler); return () => listeners.get(name).delete(handler); }, emit(name, ...args) { if (!listeners.has(name) || args.length !== schema[name]) return; for (const handler of listeners.get(name)) handler(...args); } };\n}\n" }
    ]
  },
  {
    id: "E35", slug: "dependency-topo-sort", title: "依赖图拓扑排序",
    summary: "按入度做稳定拓扑排序，循环和缺失节点要明确失败。",
    runtime, estimatedMinutes: 30, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "topo(nodes, edges) 中 edge 是 [node, dependency]，表示 dependency 必须排在 node 前面。同一时刻多个入度为 0 的节点按 nodes 的原始顺序取出，不按字母排序。没有边的孤立点保留输入顺序。重复节点、指向未知 id 的边抛 Error，消息分别是 Duplicate node 和 Missing node。存在环时抛 Error，消息是 Cycle。",
    problem: ["构建或任务依赖常有多个合法顺序。本题在入度相同的节点之间固定使用输入顺序，这样结果可以重复断言。", "孤立点也要出现。缺依赖和环不能排成一个残缺数组，必须抛错。"],
    allowedApis: ["Map", "数组", "字符串"],
    unsupportedBehavior: ["不读取文件系统或包管理器。", "不稳定的字母序不算正确结果。", "发现环后不返回部分顺序。"],
    starterArtifact: "function topo() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["先用 nodes 的下标建立索引，重复 id 立即抛错。", "边的第二个元素指向被依赖方，入度加在第一个元素上；未知 id 抛 Missing node。", "就绪队列每次按原始下标排序后取出；最后结果数量不足就是 Cycle。"] as const,
    referenceArtifact: "function topo(nodes, edges) {\n  if (!Array.isArray(nodes) || !Array.isArray(edges)) throw new TypeError(\"Invalid graph\");\n  const index = new Map();\n  nodes.forEach((id, position) => {\n    if (typeof id !== \"string\" || index.has(id)) throw new Error(\"Duplicate node\");\n    index.set(id, position);\n  });\n  const indegree = new Map(nodes.map(id => [id, 0]));\n  const next = new Map(nodes.map(id => [id, []]));\n  for (const edge of edges) {\n    if (!Array.isArray(edge) || edge.length !== 2) throw new TypeError(\"Invalid edge\");\n    const node = edge[0];\n    const dependency = edge[1];\n    if (!index.has(node) || !index.has(dependency)) throw new Error(\"Missing node\");\n    next.get(dependency).push(node);\n    indegree.set(node, indegree.get(node) + 1);\n  }\n  const ready = nodes.filter(id => indegree.get(id) === 0);\n  const result = [];\n  while (ready.length) {\n    ready.sort((left, right) => index.get(left) - index.get(right));\n    const id = ready.shift();\n    result.push(id);\n    for (const to of next.get(id)) {\n      indegree.set(to, indegree.get(to) - 1);\n      if (indegree.get(to) === 0) ready.push(to);\n    }\n  }\n  if (result.length !== nodes.length) throw new Error(\"Cycle\");\n  return result;\n}\n",
    explanation: ["没有边时，所有节点入度为 0，按输入下标排序后就是原顺序，孤立点因此保留。c 同时被 a 和 b 依赖时，c 先出，a 和 b 同时就绪，a 的输入位置更靠前，所以顺序是 c、a、b。", "a 依赖 b 且 b 依赖 a 时，没有任何入度为 0 的起点，结果长度不够，抛 Cycle。边指向未出现的 z 时抛 Missing node，不会把 z 悄悄加进图里。"],
    alternative: "深度优先搜索也能检测环，但后序反转不等于输入稳定顺序。入度队列更容易按原始下标打破平局。",
    complexity: "按比较排序每轮 O(k log k) 的常用成本模型，最多 n 轮反复排序及移除队首，调度上界 O(m+n² log n)，空间 O(n+m)，另计回调和引擎实现。若用原始下标最小堆维护就绪节点，可达 O(m+n log n)；普通 FIFO 虽可线性，却不保证本题每一步都取当前最小输入下标。",
    commonMistakes: ["入度相同就按字母排序，输入顺序被打乱。", "遇到环时返回已经排出的前缀，调用方误以为排序成功。"],
    knowledgeIds: ["K16-03"], timeoutMs: 2000,
    examples: [
      { code: "console.log(topo([\"b\", \"a\"], []).join(\",\"));", expectedOutput: "b,a", expectedLogs: ["b,a"], explanation: "没有依赖时保持输入顺序，而不是排成 a,b。" },
      { code: "console.log(topo([\"a\", \"b\", \"c\"], [[\"a\", \"c\"], [\"b\", \"c\"]]).join(\",\"));", expectedOutput: "c,a,b", expectedLogs: ["c,a,b"], explanation: "c 是 a 和 b 的依赖，先输出；a 和 b 同时就绪时 a 更靠前。" },
      { code: "let name = \"\";\ntry { topo([\"a\", \"b\"], [[\"a\", \"b\"], [\"b\", \"a\"]]); } catch (error) { name = error.message; }\nconsole.log(name);", expectedOutput: "Cycle", expectedLogs: ["Cycle"], explanation: "互相依赖没有入度为 0 的节点，抛出 Cycle。" }
    ],
    testCases: cases("E35", [
      { name: "孤立点", purpose: "无边时保持输入顺序", code: "equal(topo([\"b\", \"a\", \"c\"], []).join(\",\"), \"b,a,c\");" },
      { name: "稳定平局", purpose: "同时就绪时使用输入次序", code: "equal(topo([\"a\", \"b\", \"c\"], [[\"a\", \"c\"], [\"b\", \"c\"]]).join(\",\"), \"c,a,b\");" },
      { name: "单依赖", purpose: "依赖排在节点前", code: "equal(topo([\"a\", \"b\", \"c\"], [[\"c\", \"a\"]]).join(\",\"), \"a,b,c\");" },
      { name: "环", purpose: "循环抛 Cycle", code: "expectThrow(() => topo([\"a\", \"b\"], [[\"a\", \"b\"], [\"b\", \"a\"]]), \"Error\");" },
      { name: "缺失依赖", purpose: "未知 id 抛 Missing node", code: "let message = \"\"; try { topo([\"a\"], [[\"a\", \"z\"]]); } catch (error) { message = error.message; } equal(message, \"Missing node\");" },
      { name: "重复节点", purpose: "重复 id 抛 Duplicate node", code: "let message = \"\"; try { topo([\"a\", \"a\"], []); } catch (error) { message = error.message; } equal(message, \"Duplicate node\");" },
      { name: "空图", purpose: "没有节点时结果为空", code: "equal(topo([], []).length, 0);" },
      { name: "非法边", purpose: "边必须是二元数组", code: "expectThrow(() => topo([\"a\"], [\"a\"]), \"TypeError\");" }
    ]),
    wrongImplementations: [
      { name: "字母序", code: "function topo(nodes) { return [...nodes].sort(); }\n" },
      { name: "环也返回", code: "function topo(nodes) { return nodes.slice(); }\n" }
    ]
  },
  {
    id: "E36", slug: "chunk-upload", title: "分片上传调度",
    summary: "用调用方提供的 send 模拟分片上传，限制并发、校验和、失败停止与取消。",
    runtime, estimatedMinutes: 35, revision: 1, updatedAt: "2026-10-14", verifiedAt: "2026-10-14",
    entryContract: "uploadAll(parts, {limit, send, signal}) 中 part 是 {id, sum}。重复 id 在调用 send 前抛 Error，消息 Duplicate part。limit 是不小于 1 的整数。send 返回的 sum 必须等于 part.sum，否则该片进入 failed，尚未开始的片进入 skipped。signal 在开始前已 aborted 时全部 skipped 且不调用 send。运行中 abort 后不再开始新片，已经开始且校验通过的片可以进入 done。再次调用 uploadAll 并只传入未完成片表示恢复。",
    problem: ["上传调度要限制同时发送的片数。某一片校验失败或 send 拒绝后，不再开始后面的片，已经在飞的片可以自然结束。", "取消发生在开始前时，一片都不发。重复 id 直接拒绝，避免同一片被提交两次。send 由测试注入，实现里不能调用 fetch 或连接真实服务。"],
    allowedApis: ["Promise", "AbortSignal", "数组", "Set"],
    unsupportedBehavior: ["不调用 fetch、XHR 或本地文件系统。", "不自动重试；恢复是调用方用剩余片再次调用。", "不读取真实上传进度事件。"],
    starterArtifact: "async function uploadAll() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["先扫描重复 id，再看 signal 是否已经 aborted。", "用一个递增下标分配下一片，同时运行的 worker 数不超过 limit。", "校验失败或 send 抛错后置失败标志；循环条件同时看 aborted，最后把没取到的片放进 skipped。"] as const,
    referenceArtifact: "async function uploadAll(parts, options) {\n  if (!Array.isArray(parts) || !options || !Number.isInteger(options.limit) || options.limit < 1) throw new RangeError(\"Invalid limit\");\n  if (typeof options.send !== \"function\") throw new TypeError(\"Invalid send\");\n  const ids = new Set();\n  for (const part of parts) {\n    if (!part || typeof part.id !== \"string\" || typeof part.sum !== \"string\") throw new TypeError(\"Invalid part\");\n    if (ids.has(part.id)) throw new Error(\"Duplicate part\");\n    ids.add(part.id);\n  }\n  const signal = options.signal;\n  if (signal && signal.aborted) return { done: [], failed: [], skipped: parts.map(part => part.id) };\n  const done = [];\n  const failed = [];\n  const skipped = [];\n  let cursor = 0;\n  let failedFast = false;\n  async function worker() {\n    while (!failedFast && !(signal && signal.aborted)) {\n      const index = cursor++;\n      if (index >= parts.length) return;\n      const part = parts[index];\n      let result;\n      try { result = await options.send(part); }\n      catch (_error) { failed.push(part.id); failedFast = true; return; }\n      if (!result || result.sum !== part.sum) { failed.push(part.id); failedFast = true; return; }\n      done.push(part.id);\n    }\n  }\n  const workers = [];\n  const count = Math.min(options.limit, parts.length);\n  for (let index = 0; index < count; index += 1) workers.push(worker());\n  await Promise.all(workers);\n  while (cursor < parts.length) skipped.push(parts[cursor++].id);\n  return { done, failed, skipped };\n}\n",
    explanation: ["limit 为 1 时，第一片的 send 还没完成，第二片不会开始。第一片返回的 sum 不匹配时，它进入 failed，后面的片进入 skipped。", "开始前 signal 已 aborted，则 send 一次都不调用。运行中 abort 只阻止新片，已经发送且校验通过的片仍在 done。重复 id 在 send 前抛 Duplicate part。把失败后剩余的片再次传入，就是这次调度的恢复。"],
    alternative: "可以用一个队列对象保存等待片。下标加 worker 更少分配对象，并发上限也直接体现在 worker 数量上。",
    complexity: "片数 n、并发 limit 时，同时存在的 send 不超过 limit；总等待时间取决于 send。",
    commonMistakes: ["一次启动全部 send，limit 没有生效。", "不比较返回的 sum，坏校验仍算上传完成。"],
    knowledgeIds: ["K06-07"], timeoutMs: 2000,
    examples: [
      { code: "const result = await uploadAll([{ id: \"a\", sum: \"1\" }, { id: \"b\", sum: \"2\" }], { limit: 1, send: async part => ({ sum: part.sum }) });\nconsole.log(result.done.join(\",\"));", expectedOutput: "a,b", expectedLogs: ["a,b"], explanation: "两片校验都通过，按开始顺序进入 done。" },
      { code: "const result = await uploadAll([{ id: \"a\", sum: \"1\" }, { id: \"b\", sum: \"2\" }], { limit: 1, send: async part => ({ sum: part.id === \"a\" ? \"no\" : part.sum }) });\nconsole.log([result.failed.join(\",\"), result.skipped.join(\",\")].join(\" \"));", expectedOutput: "a b", expectedLogs: ["a b"], explanation: "a 的校验和不匹配，b 还没开始，所以 a 失败、b 跳过。" },
      { code: "const controller = new AbortController();\ncontroller.abort();\nlet calls = 0;\nconst result = await uploadAll([{ id: \"a\", sum: \"1\" }], { limit: 1, signal: controller.signal, send() { calls += 1; return { sum: \"1\" }; } });\nconsole.log([calls, result.skipped.join(\",\")].join(\" \"));", expectedOutput: "0 a", expectedLogs: ["0 a"], explanation: "取消发生在开始前，send 没有被调用，a 记入 skipped。" }
    ],
    testCases: cases("E36", [
      { name: "并发上限", purpose: "第一片未完成时不开始第二片", code: "const gate = deferred(); const calls = []; const pending = uploadAll([{ id: \"a\", sum: \"1\" }, { id: \"b\", sum: \"2\" }], { limit: 1, send(part) { calls.push(part.id); return calls.length === 1 ? gate.promise.then(() => ({ sum: part.sum })) : Promise.resolve({ sum: part.sum }); } }); await flush(); equal(calls.join(\",\"), \"a\"); gate.resolve(); equal((await pending).done.join(\",\"), \"a,b\");" },
      { name: "校验失败", purpose: "坏校验停止后续片", code: "const result = await uploadAll([{ id: \"a\", sum: \"1\" }, { id: \"b\", sum: \"2\" }], { limit: 1, send: async part => ({ sum: part.id === \"a\" ? \"no\" : part.sum }) }); equal(result.failed.join(\",\"), \"a\"); equal(result.skipped.join(\",\"), \"b\");" },
      { name: "send 拒绝", purpose: "发送失败同样停止", code: "const result = await uploadAll([{ id: \"a\", sum: \"1\" }, { id: \"b\", sum: \"2\" }], { limit: 1, send: async () => { throw new Error(\"down\"); } }); equal(result.failed.join(\",\"), \"a\"); equal(result.skipped.join(\",\"), \"b\");" },
      { name: "重复片", purpose: "重复 id 在发送前抛错", code: "let calls = 0; await expectReject(uploadAll([{ id: \"a\", sum: \"1\" }, { id: \"a\", sum: \"1\" }], { limit: 1, send() { calls += 1; return { sum: \"1\" }; } }), \"Error\"); equal(calls, 0);" },
      { name: "开始前取消", purpose: "已取消时不调用 send", code: "const controller = new AbortController(); controller.abort(); let calls = 0; const result = await uploadAll([{ id: \"a\", sum: \"1\" }], { limit: 1, signal: controller.signal, send() { calls += 1; return { sum: \"1\" }; } }); equal(calls, 0); equal(result.skipped.join(\",\"), \"a\");" },
      { name: "运行中取消", purpose: "不再开始新片", code: "const gate = deferred(); const calls = []; const controller = new AbortController(); const pending = uploadAll([{ id: \"a\", sum: \"1\" }, { id: \"b\", sum: \"2\" }, { id: \"c\", sum: \"3\" }], { limit: 1, signal: controller.signal, send(part) { calls.push(part.id); if (part.id === \"a\") controller.abort(); return gate.promise.then(() => ({ sum: part.sum })); } }); await flush(); equal(calls.join(\",\"), \"a\"); gate.resolve(); const result = await pending; equal(result.done.join(\",\"), \"a\"); equal(result.skipped.join(\",\"), \"b,c\");" },
      { name: "恢复", purpose: "剩余片可以再次提交", code: "const first = await uploadAll([{ id: \"a\", sum: \"1\" }, { id: \"b\", sum: \"2\" }], { limit: 1, send: async part => ({ sum: part.id === \"b\" ? \"no\" : part.sum }) }); const second = await uploadAll(first.failed.map(id => ({ id, sum: \"2\" })), { limit: 1, send: async part => ({ sum: part.sum }) }); equal(first.done.join(\",\"), \"a\"); equal(second.done.join(\",\"), \"b\");" },
      { name: "非法并发", purpose: "limit 必须是正整数", code: "await expectReject(uploadAll([], { limit: 0, send() { return { sum: \"\" }; } }), \"RangeError\");" }
    ]),
    wrongImplementations: [
      { name: "一次全发", code: "async function uploadAll(parts, options) {\n  const done = [];\n  await Promise.all(parts.map(async part => { const result = await options.send(part); if (result.sum === part.sum) done.push(part.id); }));\n  return { done, failed: [], skipped: [] };\n}\n" },
      { name: "不校验", code: "async function uploadAll(parts, options) {\n  const done = [];\n  for (const part of parts) { await options.send(part); done.push(part.id); }\n  return { done, failed: [], skipped: [] };\n}\n" }
    ]
  },
  {
    id: "E37", slug: "sse-parser", title: "SSE 消息解析",
    summary: "把分块文本缓冲成 SSE 事件，处理半行、注释、空行和多行 data。",
    runtime, estimatedMinutes: 30, revision: 2, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "createSse() 返回 push(chunk) 和 rest()。输入是已解码文本；CRLF、单独 CR、LF 都作为行结束，CRLF 即使跨两次 push 也只算一次。只有完整空行才派发事件。冒号开头的行是注释，多行 data 用换行连接；没有 event 或 event 值为空时名称为 message。没有 data 的块不产生事件。rest 返回规范化后尚未派发的文本，不会在 EOF 提交残片。",
    problem: ["网络分块不会对齐 SSE 的行。解析器必须自己保存没有换行结尾的残片，不能把残片当成一条事件。", "注释、空行和多行 data 都有固定含义。本题只解析文本，不创建 EventSource，也不在断流时补一条假事件。"],
    allowedApis: ["字符串", "数组"],
    unsupportedBehavior: ["不创建 EventSource，不发起网络请求。", "不处理 retry、id 字段的重连状态。", "flush 或 rest 不会把末尾残片变成事件。"],
    starterArtifact: "function createSse() {\n  throw new Error(\"未实现\");\n}\n",
    hints: [
      "保存待派发文本和 skipLf 标记。读到 CR 时产生一个换行，再记住下个字符若是 LF 就跳过。",
      "只提取遇到完整空行的块。data 行可以有空值，多行用换行拼接；event 空值要回到 message。",
      "同一份协议文本在任意位置切成两块，合并两次 push 的事件应与一次 push 相同；rest 只观察残片，不提交。"
    ],
    referenceArtifact: "function createSse() {\n  let buffer = \"\";\n  let skipLf = false;\n  function take(block) {\n    let event = \"message\";\n    const data = [];\n    let has = false;\n    for (const line of block.split(\"\\n\")) {\n      if (line === \"\" || line.startsWith(\":\")) continue;\n      const index = line.indexOf(\":\");\n      const field = index === -1 ? line : line.slice(0, index);\n      let value = index === -1 ? \"\" : line.slice(index + 1);\n      if (value.startsWith(\" \")) value = value.slice(1);\n      if (field === \"event\") event = value;\n      else if (field === \"data\") { data.push(value); has = true; }\n    }\n    return has ? { event: event || \"message\", data: data.join(\"\\n\") } : null;\n  }\n  return {\n    push(chunk) {\n      if (typeof chunk !== \"string\") throw new TypeError(\"Invalid chunk\");\n      for (const char of chunk) {\n        if (skipLf) {\n          skipLf = false;\n          if (char === \"\\n\") continue;\n        }\n        if (char === \"\\r\") { buffer += \"\\n\"; skipLf = true; }\n        else buffer += char;\n      }\n      const events = [];\n      let at = buffer.indexOf(\"\\n\\n\");\n      while (at !== -1) {\n        const event = take(buffer.slice(0, at));\n        buffer = buffer.slice(at + 2);\n        if (event) events.push(event);\n        at = buffer.indexOf(\"\\n\\n\");\n      }\n      return events;\n    },\n    rest() { return buffer; }\n  };\n}\n",
    explanation: [
      "第一次 push 只有 data: a 和一个换行时，缓冲区还没有空行，返回空数组，rest 仍是这行。下一次补上 data: b 和空行后，两条 data 合成 a\\nb。",
      "冒号开头的行被忽略。event 字段把默认的 message 改成 note。末尾没有空行的残片一直留在 rest，不会被补成事件。",
      "CR 是有效行结束，但后面的 LF 可能还没到达。skipLf 跨 push 保存这份记忆，避免把同一 CRLF 的两半误当两次换行。event: 空值在派发时回退为 message。末尾只有 data 行或单个行结束时，没有事件空行，不能在流断开时补发。"
    ],
    alternative: "可以按单个换行增量解析并记到临时字段里。块切分更容易看清空行才是派发边界。",
    complexity: "一次 push 扫描新 chunk 及本次合并缓冲，成本 O(新块长度+保留长度)，额外空间与未完成事件及本次输出相关。长残片被许多小块反复拼接可能累计二次成本；生产流应限制事件长度或采用分段缓冲。",
    commonMistakes: ["每个 chunk 都立刻产出事件，半行被当成完整 data。", "多行 data 只保留最后一行，前面的内容丢失。"],
    knowledgeIds: ["K06-06"], timeoutMs: 2000,
    examples: [
      { code: "const parser = createSse();\nconsole.log(parser.push(\"data: a\").length + \"|\" + parser.rest());", expectedOutput: "0|data: a", expectedLogs: ["0|data: a"], explanation: "没有空行，半行留在缓冲区，这次不派发。" },
      { code: "const parser = createSse();\nparser.push(\"data: a\\n\");\nconsole.log(parser.push(\"data: b\\n\\n\")[0].data);", expectedOutput: "a\nb", expectedLogs: ["a\nb"], explanation: "两次 data 被空行收成一个事件，中间用换行连接。" },
      { code: "const parser = createSse();\nconsole.log(parser.push(\": keep\\n\\nevent: note\\ndata: x\\n\\n\")[0].event);", expectedOutput: "note", expectedLogs: ["note"], explanation: "注释块没有 data，不产生事件；后面的块使用 event 字段 note。" }
    ],
    testCases: cases("E37", [
      {
        "name": "跨 chunk",
        "purpose": "半行留到下一次",
        "code": "const parser = createSse(); equal(parser.push(\"data: a\\n\").length, 0); equal(parser.push(\"data: b\\n\\n\")[0].data, \"a\\nb\");"
      },
      {
        "name": "注释",
        "purpose": "冒号行不产生 data",
        "code": "const parser = createSse(); equal(parser.push(\": keep\\n\\n\").length, 0); equal(parser.push(\"data: x\\n\\n\")[0].data, \"x\");"
      },
      {
        "name": "事件名",
        "purpose": "event 字段覆盖 message",
        "code": "const parser = createSse(); equal(parser.push(\"event: note\\ndata: 1\\n\\n\")[0].event, \"note\");"
      },
      {
        "name": "默认名称",
        "purpose": "没有 event 时是 message",
        "code": "equal(createSse().push(\"data: hi\\n\\n\")[0].event, \"message\");"
      },
      {
        "name": "多 data",
        "purpose": "多行 data 用换行连接",
        "code": "equal(createSse().push(\"data: a\\ndata: b\\n\\n\")[0].data, \"a\\nb\");"
      },
      {
        "name": "断流残片",
        "purpose": "没有空行的文本留在 rest",
        "code": "const parser = createSse(); parser.push(\"data: hi\"); equal(parser.rest(), \"data: hi\"); equal(parser.push(\"\").length, 0);"
      },
      {
        "name": "回车换行",
        "purpose": "CRLF 按空行派发",
        "code": "equal(createSse().push(\"data: x\\r\\n\\r\\n\")[0].data, \"x\");"
      },
      {
        "name": "非法块",
        "purpose": "chunk 必须是字符串",
        "code": "expectThrow(() => createSse().push(1), \"TypeError\");"
      },
      {
        "name": "CRLF 任意分块",
        "purpose": "任意两段切分保持同一条多行事件",
        "code": "const text = \"data: a\\r\\ndata: b\\r\\n\\r\\n\"; for (let cut = 0; cut <= text.length; cut++) { const parser = createSse(); equal([...parser.push(text.slice(0, cut)), ...parser.push(text.slice(cut))], [{event:\"message\",data:\"a\\nb\"}]); }"
      },
      {
        "name": "空事件名称",
        "purpose": "空 event 回退 message，空 data 仍是事件",
        "code": "equal(createSse().push(\"event:\\ndata: a\\n\\n\"), [{event:\"message\",data:\"a\"}]); equal(createSse().push(\"data:\\n\\n\"), [{event:\"message\",data:\"\"}]);"
      },
      {
        "name": "跨块 CR 后不是 LF",
        "purpose": "单独 CR 仍有效，下一个普通字符不能丢",
        "code": "const parser = createSse(); equal(parser.push(\"data: a\\r\"), []); equal(parser.push(\"data: b\\r\\r\"), [{event:\"message\",data:\"a\\nb\"}]);"
      }
    ]),
    wrongImplementations: [
      { name: "半行也派发", code: "function createSse() {\n  return { push(chunk) { return [{ event: \"message\", data: String(chunk).replaceAll(\"\\n\", \"\") }]; }, rest() { return \"\"; } };\n}\n" },
      { name: "只留最后一行", code: "function createSse() {\n  let buffer = \"\";\n  return { push(chunk) { buffer += chunk; const events = []; let at = buffer.indexOf(\"\\n\\n\"); while (at !== -1) { const lines = buffer.slice(0, at).split(\"\\n\").filter(line => line.startsWith(\"data:\")); buffer = buffer.slice(at + 2); if (lines.length) events.push({ event: \"message\", data: lines[lines.length - 1].slice(5).trim() }); at = buffer.indexOf(\"\\n\\n\"); } return events; }, rest() { return buffer; } };\n}\n" }
    ]
  },
  {
    id: "E38", slug: "optimistic-update", title: "乐观更新与回滚模型",
    summary: "用变更日志保留较新的乐观值，旧成功不能覆盖它，失败时回到已提交值。",
    runtime, estimatedMinutes: 30, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "createOptimistic(initial) 的 view() 是最新未结算变更的值，没有未结算变更时是 committed()。change(value) 返回递增 id。settle(id, true) 在存在更大 id 时返回 ignored-stale 且不修改 committed；若它是最新变更，则提交该值并返回 committed。settle(id, false) 在存在更大 id 时返回 kept-newer；若它是最新变更，则清空未结算变更并返回 rolled-back。未知 id 返回 unknown。",
    problem: ["乐观更新先改界面，再等服务器。多个请求交错时，旧请求成功不能覆盖已经显示的更新值。", "最新一次被服务器拒绝时，界面回到最近一次已提交值。这不是 React useOptimistic，也不是 Vue 的响应式更新。"],
    allowedApis: ["数组", "数字"],
    unsupportedBehavior: ["不渲染组件，不调用框架更新。", "不发网络请求。", "不合并对象补丁，value 按一次完整替换处理。"],
    starterArtifact: "function createOptimistic() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["change 把 {id, value} 追加到未结算列表，view 取列表最后一项。", "成功时如果还有更大 id，只删除这一项；否则把该项写入 committed 并清空列表。", "失败时如果还有更大 id，只删除这一项；如果它是最新项，清空整个列表，view 回到 committed。"] as const,
    referenceArtifact: "function createOptimistic(initial) {\n  let committed = initial;\n  let next = 1;\n  const inflight = [];\n  return {\n    view() { return inflight.length ? inflight[inflight.length - 1].value : committed; },\n    committed() { return committed; },\n    change(value) { const id = next++; inflight.push({ id, value }); return id; },\n    settle(id, ok) {\n      const index = inflight.findIndex(item => item.id === id);\n      if (index < 0) return \"unknown\";\n      const item = inflight[index];\n      const newer = inflight.some(entry => entry.id > id);\n      if (!ok) {\n        if (newer) { inflight.splice(index, 1); return \"kept-newer\"; }\n        inflight.length = 0;\n        return \"rolled-back\";\n      }\n      if (newer) { inflight.splice(index, 1); return \"ignored-stale\"; }\n      committed = item.value;\n      inflight.length = 0;\n      return \"committed\";\n    }\n  };\n}\n",
    explanation: ["先 change(1) 再 change(2) 时，view 是 2。结算 1 的成功返回 ignored-stale，committed 仍是初始值，view 保持 2。随后结算 2 才把 committed 写成 2。", "最新变更失败会清空未结算列表，view 回到 committed。旧变更失败而更新的变更还在时返回 kept-newer，view 仍是较新的值。未知 id 返回 unknown。"],
    alternative: "可以给每次变更保存基准版本，拒绝时重放到后续变更上。完整替换更直接，也避免旧成功覆盖新值。",
    complexity: "change 为 O(1)；settle 在未结算数量 k 上是 O(k)。",
    commonMistakes: ["旧请求成功直接写入 committed，界面被过期结果覆盖。", "失败只改一个标志，view 仍停留在被拒绝的值。"],
    knowledgeIds: ["K15-04"], timeoutMs: 2000,
    examples: [
      { code: "const host = createOptimistic(0);\nconst first = host.change(1);\nconst second = host.change(2);\nconsole.log([host.settle(first, true), host.view(), host.committed()].join(\" \"));", expectedOutput: "ignored-stale 2 0", expectedLogs: ["ignored-stale 2 0"], explanation: "较旧的成功被忽略，view 仍是 2，已提交值仍是 0。" },
      { code: "const host = createOptimistic(0);\nhost.change(1);\nconst second = host.change(2);\nhost.settle(second, true);\nconsole.log([host.view(), host.committed()].join(\" \"));", expectedOutput: "2 2", expectedLogs: ["2 2"], explanation: "最新变更成功后，未结算列表清空，view 和 committed 都是 2。" },
      { code: "const host = createOptimistic(0);\nconst id = host.change(5);\nconsole.log([host.settle(id, false), host.view()].join(\" \"));", expectedOutput: "rolled-back 0", expectedLogs: ["rolled-back 0"], explanation: "最新变更被拒绝后，view 回到已提交的 0。" }
    ],
    testCases: cases("E38", [
      { name: "旧成功", purpose: "较旧成功不覆盖较新值", code: "const host = createOptimistic(0); const first = host.change(1); const second = host.change(2); equal(host.settle(first, true), \"ignored-stale\"); equal(host.view(), 2); equal(host.committed(), 0); equal(second > first, true);" },
      { name: "新成功", purpose: "最新成功写入 committed", code: "const host = createOptimistic(0); host.change(1); const second = host.change(2); equal(host.settle(second, true), \"committed\"); equal(host.view(), 2); equal(host.committed(), 2);" },
      { name: "拒绝回滚", purpose: "最新失败回到已提交值", code: "const host = createOptimistic(0); const id = host.change(5); equal(host.settle(id, false), \"rolled-back\"); equal(host.view(), 0);" },
      { name: "保留较新", purpose: "旧失败不影响较新变更", code: "const host = createOptimistic(0); const first = host.change(1); host.change(2); equal(host.settle(first, false), \"kept-newer\"); equal(host.view(), 2);" },
      { name: "交错后回滚", purpose: "较新失败后不再显示旧乐观值", code: "const host = createOptimistic(\"base\"); host.change(\"old\"); const next = host.change(\"new\"); equal(host.settle(next, false), \"rolled-back\"); equal(host.view(), \"base\");" },
      { name: "成功后旧 id", purpose: "已被清掉的旧 id 是 unknown", code: "const host = createOptimistic(0); const first = host.change(1); const second = host.change(2); host.settle(second, true); equal(host.settle(first, true), \"unknown\");" },
      { name: "未知 id", purpose: "没有的变更不能结算", code: "equal(createOptimistic(0).settle(9, true), \"unknown\");" },
      { name: "连续提交", purpose: "第二次最新成功覆盖 committed", code: "const host = createOptimistic(0); const first = host.change(1); host.settle(first, true); const second = host.change(4); host.settle(second, true); equal(host.committed(), 4); equal(host.view(), 4);" }
    ]),
    wrongImplementations: [
      { name: "旧成功覆盖", code: "function createOptimistic(initial) {\n  let committed = initial; let next = 1; const inflight = [];\n  return { view() { return inflight.length ? inflight[inflight.length - 1].value : committed; }, committed() { return committed; }, change(value) { const id = next++; inflight.push({ id, value }); return id; }, settle(id, ok) { const item = inflight.find(entry => entry.id === id); if (!item) return \"unknown\"; inflight.splice(inflight.findIndex(entry => entry.id === id), 1); if (!ok) return \"rolled-back\"; committed = item.value; return \"committed\"; } };\n}\n" },
      { name: "失败不回滚", code: "function createOptimistic(initial) {\n  let value = initial; let next = 1;\n  return { view() { return value; }, committed() { return initial; }, change(nextValue) { value = nextValue; return next++; }, settle() { return \"committed\"; } };\n}\n" }
    ]
  },
  {
    id: "E39", slug: "longest-unique-substring", title: "最长无重复子串",
    summary: "按 Unicode code point 找最长无重复子串，不按 grapheme cluster 切分。",
    runtime, estimatedMinutes: 25, revision: 1, updatedAt: "2026-10-14", verifiedAt: "2026-10-14",
    entryContract: "longestUnique(text) 用 Array.from 得到 code point 序列。窗口内 code point 不重复，长度相同时保留更早的窗口。空字符串返回空字符串。组合记号是独立 code point，不和前面的字符合成 grapheme。非字符串抛 TypeError。",
    problem: ["无重复子串的“字符”在本题里是 Unicode code point。组合用的附加记号单独占一个位置，不能先按用户看到的字素合并。", "空串没有窗口。全是同一个 code point 时结果就是它本身。两个等长窗口保留左边那个。"],
    allowedApis: ["Array.from", "Map", "字符串"],
    unsupportedBehavior: ["不使用 Intl.Segmenter，不按 grapheme cluster 切分。", "不按 UTF-16 孤立代理项定义字符；实现应遍历 code point。", "不处理 locale 排序或大小写折叠。"],
    starterArtifact: "function longestUnique() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["先 Array.from(text)，后续下标都针对这个数组。", "用 Map 记录每个 code point 上次出现的位置；位置落在当前窗口内时，把起点移到它的下一位。", "只有窗口严格变长时才更新答案，这样等长时保留先出现的结果。"] as const,
    referenceArtifact: "function longestUnique(text) {\n  if (typeof text !== \"string\") throw new TypeError(\"Invalid text\");\n  const chars = Array.from(text);\n  const last = new Map();\n  let start = 0;\n  let bestStart = 0;\n  let bestLength = 0;\n  for (let end = 0; end < chars.length; end += 1) {\n    const seen = last.get(chars[end]);\n    if (seen !== undefined && seen >= start) start = seen + 1;\n    last.set(chars[end], end);\n    if (end - start + 1 > bestLength) {\n      bestLength = end - start + 1;\n      bestStart = start;\n    }\n  }\n  return chars.slice(bestStart, bestStart + bestLength).join(\"\");\n}\n",
    explanation: ["abca 里 abc 和 bca 都是 3 个 code point，因为只在严格更长时更新，结果保留 abc。aaa 的窗口最多一个 a。", "a、组合附加记号、a 这三个 code point 中，两个 a 重复。第一段无重复窗口是 a 加附加记号，第二段附加记号加 a 等长，所以保留前者。按字素合并会把前两个 code point 看成一个字符，从而得到不同结果。"],
    alternative: "可以用集合记录窗口内的 code point，左端重复时逐个删除。Map 记录上次位置可以一次跳到重复项之后。",
    complexity: "code point 数为 n 时，每个位置最多进出窗口一次，O(n)。",
    commonMistakes: ["用字符串下标遍历，把一个 code point 拆成 UTF-16 单元。", "等长时覆盖成右边的窗口，结果和稳定的左窗口不一致。"],
    knowledgeIds: ["K16-05"], timeoutMs: 2000,
    examples: [
      { code: "console.log(longestUnique(\"abca\"));", expectedOutput: "abc", expectedLogs: ["abc"], explanation: "abc 与 bca 等长，保留先出现的 abc。" },
      { code: "console.log(longestUnique(\"aaa\") + \"|\" + longestUnique(\"\"));", expectedOutput: "a|", expectedLogs: ["a|"], explanation: "重复字符只保留一个 a，空字符串没有结果。" },
      { code: "console.log(longestUnique(\"a\\u0301a\") === \"a\\u0301\" ? \"code-point\" : \"other\");", expectedOutput: "code-point", expectedLogs: ["code-point"], explanation: "组合附加记号是单独的 code point，第一段无重复结果是 a 加该记号，不是整串。" }
    ],
    testCases: cases("E39", [
      { name: "等长取左", purpose: "相同长度保留较早窗口", code: "equal(longestUnique(\"abca\"), \"abc\");" },
      { name: "重复字符", purpose: "单一重复 code point", code: "equal(longestUnique(\"aaa\"), \"a\");" },
      { name: "空串", purpose: "空输入返回空串", code: "equal(longestUnique(\"\"), \"\");" },
      { name: "全部唯一", purpose: "整串都不重复", code: "equal(longestUnique(\"abcd\"), \"abcd\");" },
      { name: "中间重复", purpose: "窗口从重复点后重新开始", code: "equal(longestUnique(\"abba\"), \"ab\");" },
      { name: "组合记号", purpose: "附加记号按 code point 计数", code: "equal(longestUnique(\"a\\u0301a\"), \"a\\u0301\");" },
      { name: "补充平面", purpose: "emoji 按一个 code point", code: "equal(longestUnique(\"😀😀\"), \"😀\"); equal(Array.from(\"😀\").length, 1);" },
      { name: "非字符串", purpose: "拒绝非字符串", code: "expectThrow(() => longestUnique(1), \"TypeError\");" }
    ]),
    wrongImplementations: [
      { name: "原样返回", code: "function longestUnique(text) { return text; }\n" },
      { name: "只取首个", code: "function longestUnique(text) { return Array.from(text)[0] || \"\"; }\n" }
    ]
  },
  {
    id: "E40", slug: "frame-scheduler", title: "分帧预算规划",
    summary: "按预算把任务装进帧里，取消的跳过，超预算的单项不能拆开，隐藏时预算减半。",
    runtime, estimatedMinutes: 30, revision: 1, updatedAt: "2026-10-15", verifiedAt: "2026-10-15",
    entryContract: "runFrames(tasks, {budget, hidden, cancelled}) 中 task 是 {id, cost}，cost 是不小于 1 的整数，budget 是不小于 1 的整数。cancelled 里的 id 跳过。hidden 为 true 时有效预算是 max(1, floor(budget / 2))。任一未取消任务的 cost 大于有效预算时返回 {status:'unsplittable', id, frames:[]}。否则按输入顺序装箱，返回 {status:'done', frames}，每帧是 {ids, used}。空任务返回 done 和空 frames。",
    problem: ["长任务可以分成多帧，让每一帧的成本不超过预算。单个任务如果自己就超过预算，不能把它拆开后假装满足预算。", "取消的任务不占预算。页面隐藏时有效预算下降，原来放得下的任务可能变成不可拆。本题不调用 requestAnimationFrame，也不承诺硬实时。"],
    allowedApis: ["数组", "Set", "整数运算"],
    unsupportedBehavior: ["不调用 requestAnimationFrame、requestIdleCallback 或 setTimeout。", "不测量真实帧时间。", "不能把超预算的单个任务拆成多帧。"],
    starterArtifact: "function runFrames() {\n  throw new Error(\"未实现\");\n}\n",
    hints: ["先根据 hidden 计算有效预算，再跳过 cancelled。", "装箱前如果任务成本大于有效预算，立即返回 unsplittable，frames 为空。", "当前帧放不下时先收起当前帧，再把任务放进新帧。"] as const,
    referenceArtifact: "function runFrames(tasks, options) {\n  if (!Array.isArray(tasks) || !options || !Number.isInteger(options.budget) || options.budget < 1) throw new RangeError(\"Invalid budget\");\n  const cancelled = new Set(options.cancelled || []);\n  const budget = options.hidden ? Math.max(1, Math.floor(options.budget / 2)) : options.budget;\n  const frames = [];\n  let current = [];\n  let used = 0;\n  for (const task of tasks) {\n    if (!task || typeof task.id !== \"string\" || !Number.isInteger(task.cost) || task.cost < 1) throw new TypeError(\"Invalid task\");\n    if (cancelled.has(task.id)) continue;\n    if (task.cost > budget) return { status: \"unsplittable\", id: task.id, frames: [] };\n    if (used > 0 && used + task.cost > budget) { frames.push({ ids: current.slice(), used }); current = []; used = 0; }\n    current.push(task.id);\n    used += task.cost;\n  }\n  if (current.length) frames.push({ ids: current, used });\n  return { status: \"done\", frames };\n}\n",
    explanation: ["预算 5、任务成本 2、2、2 时，前两个放进第一帧，第三个放进第二帧。取消中间任务后，它不占预算，剩下的两个 2 可以放在同一帧。", "隐藏时预算 5 变成 2。成本 3 的任务大于 2，返回 unsplittable，并且不保留已经看过的部分帧。空列表是 done 和空 frames。"],
    alternative: "可以先过滤取消项并检查不可拆任务，再装箱。边扫描边返回更短，结果同样不会带上部分帧。",
    complexity: "任务数 n，一次线性扫描，O(n)。",
    commonMistakes: ["超预算任务被拆进多帧，预算约束被破坏。", "取消名单没有生效，被取消的任务仍占用一帧。"],
    knowledgeIds: ["K16-08"], timeoutMs: 2000,
    examples: [
      { code: "const result = runFrames([{ id: \"a\", cost: 2 }, { id: \"b\", cost: 2 }, { id: \"c\", cost: 2 }], { budget: 5 });\nconsole.log(result.frames.map(frame => frame.ids.join(\"\")).join(\"|\"));", expectedOutput: "ab|c", expectedLogs: ["ab|c"], explanation: "预算 5 可以放下两个成本 2 的任务，第三个进入下一帧。" },
      { code: "const result = runFrames([{ id: \"a\", cost: 2 }, { id: \"b\", cost: 2 }], { budget: 5, cancelled: [\"b\"] });\nconsole.log(result.frames[0].ids.join(\",\"));", expectedOutput: "a", expectedLogs: ["a"], explanation: "b 被取消，帧里只剩 a。" },
      { code: "const result = runFrames([{ id: \"slow\", cost: 3 }], { budget: 5, hidden: true });\nconsole.log(result.status + \" \" + result.id);", expectedOutput: "unsplittable slow", expectedLogs: ["unsplittable slow"], explanation: "隐藏后有效预算是 2，成本 3 的任务不能拆开。" }
    ],
    testCases: cases("E40", [
      { name: "装箱", purpose: "按预算拆成多帧", code: "const result = runFrames([{ id: \"a\", cost: 2 }, { id: \"b\", cost: 2 }, { id: \"c\", cost: 2 }], { budget: 5 }); equal(result.status, \"done\"); equal(result.frames.map(frame => frame.used).join(\",\"), \"4,2\");" },
      { name: "取消", purpose: "取消的任务不进入帧", code: "const result = runFrames([{ id: \"a\", cost: 2 }, { id: \"b\", cost: 9 }, { id: \"c\", cost: 2 }], { budget: 5, cancelled: [\"b\"] }); equal(result.frames[0].ids.join(\",\"), \"a,c\");" },
      { name: "长单项", purpose: "超过预算的任务不可拆", code: "equal(runFrames([{ id: \"slow\", cost: 6 }], { budget: 5 }), { status: \"unsplittable\", id: \"slow\", frames: [] });" },
      { name: "隐藏节流", purpose: "隐藏时预算减半", code: "equal(runFrames([{ id: \"slow\", cost: 3 }], { budget: 5, hidden: true }).status, \"unsplittable\"); equal(runFrames([{ id: \"a\", cost: 1 }, { id: \"b\", cost: 1 }, { id: \"c\", cost: 1 }], { budget: 4, hidden: true }).frames.map(frame => frame.ids.join(\"\")).join(\"|\"), \"ab|c\");" },
      { name: "空任务", purpose: "没有任务时帧为空", code: "equal(runFrames([], { budget: 5 }), { status: \"done\", frames: [] });" },
      { name: "刚好装满", purpose: "成本和预算相等时放在一帧", code: "equal(runFrames([{ id: \"a\", cost: 5 }], { budget: 5 }).frames[0].used, 5);" },
      { name: "零成本", purpose: "成本必须是正整数", code: "expectThrow(() => runFrames([{ id: \"a\", cost: 0 }], { budget: 5 }), \"TypeError\");" },
      { name: "非法预算", purpose: "预算必须是正整数", code: "expectThrow(() => runFrames([], { budget: 0 }), \"RangeError\");" }
    ]),
    wrongImplementations: [
      { name: "忽略取消", code: "function runFrames(tasks, options) {\n  const frames = []; let current = []; let used = 0;\n  for (const task of tasks) { if (used > 0 && used + task.cost > options.budget) { frames.push({ ids: current, used }); current = []; used = 0; } current.push(task.id); used += task.cost; }\n  if (current.length) frames.push({ ids: current, used });\n  return { status: \"done\", frames };\n}\n" },
      { name: "拆开长任务", code: "function runFrames(tasks, options) {\n  const frames = [];\n  for (const task of tasks) frames.push({ ids: [task.id], used: Math.min(task.cost, options.budget) });\n  return { status: \"done\", frames };\n}\n" }
    ]
  }
];
