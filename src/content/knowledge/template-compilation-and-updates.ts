import type { Article } from "../articles";

export const templateCompilationUpdatesArticle: Article = {
  "id": "K08-05",
  "kind": "knowledge",
  "domainSlug": "vue",
  "slug": "template-compilation-and-updates",
  "title": "模板编译与更新优化",
  "summary": "从订单页的一次数量更新出发，观察模板编译、静态缓存、补丁标记与动态集合，解释稳定 props 和列表身份，并用旧界面反例检查手动缓存的边界。",
  "aliases": [
    "template compiler",
    "patch flags",
    "static hoisting",
    "tree flattening",
    "v-once",
    "v-memo",
    "模板编译",
    "更新优化"
  ],
  "tags": [
    "Vue",
    "模板编译",
    "更新优化"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-13",
  "sections": [
    {
      "id": "problem",
      "title": "数量只改了一处，整张订单页会重建吗？",
      "paragraphs": [
        "订单面板有标题、说明、数量、选中行和可编辑列表。数量从 1 变成 2，开发者担心 Vue 会把所有 DOM 都删掉再建，于是给整页加 v-once。结果刷新订单之后，数量停在旧值。要判断哪里可以优化，先分清重新执行渲染函数、创建虚拟节点、对比节点和修改真实 DOM，这些不是同一个动作。",
        "本文从模板变成渲染函数的过程出发，解释为什么静态内容可以缓存，为什么只改文字时不必全面对比属性，为什么组件收到的 props 是否变化仍决定更新范围。最后用真实反例检查缓存与列表身份：减少检查不能成为跳过正确更新的理由。",
        "前置阅读是 K08-01 的响应式依赖、K08-03 的状态所有权、K08-04 的挂载与更新阶段。结论先放在具体条件下：编译器只能利用模板可确定的信息；运行时仍要响应真实输入变化；手动声明不再更新或缓存时，作者承担证明依赖完整的责任。"
      ]
    },
    {
      "id": "environment",
      "title": "使用真实编译器，但只编译仓库作者的固定模板",
      "paragraphs": [
        "运行 npm run verify:k08-05，在临时独立 HTTP 页面使用 Vue 3.5.43 的完整浏览器构建 /vue.mjs，实际编译固定模板、挂载组件并核对输出。每个代码块是互不依赖的完整 ES 模块；手动复现可把 node_modules/vue/dist/vue.esm-browser.js 复制为静态服务根目录的 vue.mjs，在空 HTML 的 script type=\"module\" 中放一个示例，通过本地 HTTP 服务打开。",
        "Vue 完整浏览器构建提供 compile，它把作者写死的模板变成渲染函数。本文用它观察编译过程；普通 SFC 项目通常在构建时预编译，让生产浏览器使用运行时构建。本文不验证整个 SFC 构建流水线，也不把浏览器完整构建当作所有应用都应该加载的依赖。",
        "固定模板中使用的数据通过 ref 和 props 传入，而不拼进模板字符串。用户输入、服务端文章、导入备份都不能当作 Vue 模板编译；模板表达式可以执行代码，不是 HTML 净化器。不要在本站主页面控制台执行示例；需要测自己的工程时使用独立页面和受信任的源码。",
        "patchFlag、dynamicChildren、缓存数组位置及生成函数文本属于实现观察，本文数字与形状以 3.5.43 为准，不是稳定的业务 API。版本变化后应重新检查输出，不能在业务组件里手工改这些内部字段，或把一个固定标记当作跨版本性能保证。"
      ]
    },
    {
      "id": "pipeline",
      "title": "模板先生成 render，状态变化再触发 patch",
      "paragraphs": [
        "模板编译读取结构与表达式，生成返回 VNode 的 render 函数。VNode 描述节点类型、属性和孩子，并不是已经插入页面的 DOM。挂载阶段执行 render 并建立 DOM，同时追踪读取的响应式来源；以后来源变化，渲染工作重新排队，用新描述更新旧 DOM。能复用的节点不需要整体销毁。",
        "下面模板中的 h2 没有动态输入，output 读取 quantity。预期日志是 function、初始:数量:1、立即:数量:1、提交:数量:3:更新次数:1、标题复用:true。两次同步赋值可合并成本轮渲染，但这不表示中间的 JavaScript 状态从未变过；onUpdated 计数也不是一次用户操作或一次浏览器绘制的计数。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { compile, createApp, ref, onUpdated, nextTick } from '/vue.mjs';\nconst render = compile('<section><h2>订单</h2><output>数量:{{ quantity }}</output></section>');\nconsole.log(typeof render);\nconst quantity = ref(1);\nlet updates = 0;\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({\n  setup() {\n    onUpdated(() => { updates += 1; });\n    return { quantity };\n  },\n  render\n});\napp.mount(root);\nconst title = root.querySelector('h2');\nconsole.log('初始:' + root.querySelector('output').textContent);\nquantity.value = 2;\nquantity.value = 3;\nconsole.log('立即:' + root.querySelector('output').textContent);\nawait nextTick();\nconsole.log('提交:' + root.querySelector('output').textContent + ':更新次数:' + updates);\nconsole.log('标题复用:' + (root.querySelector('h2') === title));\napp.unmount();\nroot.remove();",
          "expectedOutput": [
            "function",
            "初始:数量:1",
            "立即:数量:1",
            "提交:数量:3:更新次数:1",
            "标题复用:true"
          ],
          "explanation": [
            "compile 返回函数，挂载时 quantity 为 1，output 对应“数量:1”。把 ref 改成 2 和 3 后，DOM 提交尚未发生，所以立即读取仍是 1；nextTick 后本轮 DOM 显示最终值 3。",
            "这轮更新只触发一次 onUpdated，且 h2 仍是同一个 DOM 对象，说明不是整页删除再建。单凭 DOM 对象相同不能证明静态 VNode 缓存有效，普通 patch 也能复用同类型 DOM；下一节直接观察编译后的 VNode 和动态集合。"
          ]
        }
      ]
    },
    {
      "id": "static-blocks",
      "title": "静态提升与缓存少创建节点，block 缩小后续检查集合",
      "paragraphs": [
        "旧资料常把这类优化统称“静态提升”：把不随渲染输入变化的内容从重复工作中移出去。当前版本可能生成缓存的 VNode、提升属性对象，或把连续静态节点合成静态内容；具体输出依赖模板、编译选项与版本。不能把所有静态标签都想象成一个永久共享的全局 DOM 实例。",
        "有稳定内部结构的模板片段可以形成 block。它记录需要更新的动态后代，即使动态后代藏在几层静态结构里面，更新时也能直接关注它。v-if、v-for 引入的结构变化需要各自处理，不能认为动态集合一旦确定，列表和条件分支就永远不用检查。",
        "下面只执行编译后的 render 两次，不挂载 DOM。两次调用共享一个缓存数组，模拟同一组件的两次渲染；不同组件实例不能共用这个数组。预期 静态复用:true、动态集合:1:span、文字:1->2:标记:1。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { compile } from '/vue.mjs';\nconst render = compile('<section><header><h2>订单</h2></header><div><p><span>{{ count }}</span></p></div></section>');\nconst cache = [];\nconst first = render({ count: 1 }, cache);\nconst second = render({ count: 2 }, cache);\nconsole.log('静态复用:' + (first.children[0] === second.children[0]));\nconsole.log('动态集合:' + second.dynamicChildren.length + ':' + second.dynamicChildren[0].type);\nconsole.log('文字:' + first.dynamicChildren[0].children + '->' +\n  second.dynamicChildren[0].children + ':标记:' + second.dynamicChildren[0].patchFlag);",
          "expectedOutput": [
            "静态复用:true",
            "动态集合:1:span",
            "文字:1->2:标记:1"
          ],
          "explanation": [
            "header 子树没有动态绑定，第二次 render 重用缓存里的那个 VNode，因此引用相同。span 的文字随 count 改变，两次渲染获得不同的动态描述，分别带文字 1 和 2。",
            "section 的 dynamicChildren 只记录这里需要检查的 span，而不是重新把 div、p 等静态外壳作为每轮检查目标。TEXT 标记在本版本为 1，告诉 patch 关注文字。这个例子检查的是虚拟描述和缓存身份，没有挂载，也没有测量 CPU、内存或浏览器布局耗时。"
          ]
        }
      ]
    },
    {
      "id": "flags",
      "title": "补丁标记告诉运行时要检查什么，不替代输入和结果校验",
      "paragraphs": [
        "如果模板确定 p 只有 class、title 与文字会变，编译器能给出一组更窄的检查信息。Vue 3.5.43 中 TEXT=1、CLASS=2、PROPS=8，这个节点合起来是 11，并列出动态属性 title。这些是位集合，不是“优先级 11”或“节点变化 11 次”。标记让运行时省掉已经能排除的比较，而不是跳过表达式求值。",
        "v-bind=\"attrs\" 的属性名也会随对象改变，编译器不能只列一个永远固定的 title。它需要更完整地检查属性集合，包含旧属性是否应移除。以下先观察固定绑定，再挂载动态对象，预期 固定:11:title、动态集合:16、旧属性移除:true:新ID:next。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { compile, createApp, ref, nextTick } from '/vue.mjs';\nconst fixed = compile('<p :class=\"tone\" :title=\"label\">{{ count }}</p>');\nconst vnode = fixed({ tone: 'active', label: '数量', count: 1 }, []);\nconsole.log('固定:' + vnode.patchFlag + ':' + vnode.dynamicProps.join(','));\nconst dynamic = compile('<div v-bind=\"attrs\"></div>');\nconsole.log('动态集合:' + dynamic({ attrs: { title: '旧标题' } }, []).patchFlag);\nconst attrs = ref({ title: '旧标题', 'data-old': '旧字段' });\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({ setup: () => ({ attrs }), render: dynamic });\napp.mount(root);\nattrs.value = { id: 'next' };\nawait nextTick();\nconst element = root.firstElementChild;\nconsole.log('旧属性移除:' + (!element.hasAttribute('title') && !element.hasAttribute('data-old')) + ':新ID:' + element.id);\napp.unmount();\nroot.remove();",
          "expectedOutput": [
            "固定:11:title",
            "动态集合:16",
            "旧属性移除:true:新ID:next"
          ],
          "explanation": [
            "固定模板的 patchFlag 同时包含文字、class 和指定属性检查，dynamicProps 是 title。动态对象模板得到本版本 FULL_PROPS 标记 16，因为属性名字集合不由固定模板完整确定。",
            "把 attrs 替换成仅含 id 的对象后，patch 不仅写入新 id，还移除 title 和 data-old，结果为 true:next。属性少写一次与旧属性永远不删除是不同的行为；不要用手工标记或直接 DOM 修改绕过编译器与运行时的共同合同。"
          ]
        }
      ]
    },
    {
      "id": "props",
      "title": "父组件更新，不等于所有子组件都必须重新渲染",
      "paragraphs": [
        "列表选中项由 A 改成 B，若每一行都收到 activeId，各行这个 prop 都变化，即使 C 一直没有被选中也收到新输入。父级可以提前派生 item.id === activeId，把每行真正需要的 active 布尔值传下去，只有 A 和 B 的这个值变化。这个优化来自状态与 props 的设计，不是静态提升替你把动态数据冻结。",
        "下面用 h 写同样的组件树，计数器是普通对象，避免计数本身成为渲染依赖。初始每行渲染一次，改变选中项后，传 ID 的三行都再执行一次；传 active 的版本只有 A、B 再执行。预期 传ID:2,2,2 与 传布尔:2,2,1。没有 slots、外部注入或行内其他响应式依赖，才能只用本例输入解释计数。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref, nextTick } from '/vue.mjs';\nasync function run(stable) {\n  const activeId = ref('A');\n  const renders = { A: 0, B: 0, C: 0 };\n  const Row = {\n    props: { id: String, activeId: String, active: Boolean },\n    setup(props) {\n      return () => {\n        renders[props.id] += 1;\n        const selected = stable ? props.active : props.id === props.activeId;\n        return h('li', props.id + ':' + selected);\n      };\n    }\n  };\n  const root = document.createElement('div');\n  document.body.append(root);\n  const app = createApp({\n    setup: () => () => h('ul', ['A', 'B', 'C'].map(id => h(Row,\n      stable ? { key: id, id, active: id === activeId.value }\n        : { key: id, id, activeId: activeId.value }\n    )))\n  });\n  app.mount(root);\n  activeId.value = 'B';\n  await nextTick();\n  console.log((stable ? '传布尔:' : '传ID:') + [renders.A, renders.B, renders.C].join(','));\n  app.unmount();\n  root.remove();\n}\nawait run(false);\nawait run(true);",
          "expectedOutput": [
            "传ID:2,2,2",
            "传布尔:2,2,1"
          ],
          "explanation": [
            "传 activeId 时从 A 变 B 改了每个 Row 的 props，三行都更新，计数均为 2。传 active 时 A 从 true 变 false，B 从 false 变 true，C 保持 false，于是 C 的输入稳定，仍只渲染一次。",
            "计数体现本树中的组件渲染调用，不能换算成“大列表快几倍”。行自身的状态、注入的响应式来源或动态 slot 仍可能独立触发更新；每轮创建新的对象或函数 prop 也可能打破引用稳定，需按实际输入追踪，而不是把整个复杂对象藏起来不更新。"
          ]
        }
      ]
    },
    {
      "id": "keys",
      "title": "列表 key 决定身份，不能用错误身份换取复用",
      "paragraphs": [
        "patch 不只更新文字，还要维护组件本地状态与 DOM 身份。订单行输入框有未提交草稿，排序后它应该跟着订单移动。key 应来自稳定的业务身份；索引会随排序与插入改变，拿索引当身份会让“这个位置的旧组件”接收另一笔订单，而仍保留原来的草稿。",
        "以下 Row 刻意只在 setup 从 item.name 初始化草稿，模拟上一章的本地编辑；它不是永远跟随 prop 的已提交显示。先给 A 输入 A草稿，再把 B 排到 A 前。预期 ID:B:B,A:A草稿 和 索引:B:A草稿,A:B，后者明确是错误实现。两个版本最后都清空列表并确认节点数 0，以免把空结果当作沿用旧列表。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { compile, createApp, h, ref, nextTick } from '/vue.mjs';\nasync function run(byId) {\n  const items = ref([{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }]);\n  const Row = {\n    props: { item: { type: Object, required: true } },\n    setup(props) {\n      const draft = ref(props.item.name);\n      return () => h('li', [\n        h('span', props.item.id),\n        h('input', {\n          'aria-label': props.item.id + '草稿', value: draft.value,\n          onInput: event => { draft.value = event.target.value; }\n        })\n      ]);\n    }\n  };\n  const template = byId\n    ? '<ul><Row v-for=\"(item,index) in items\" :key=\"item.id\" :item=\"item\" /></ul>'\n    : '<ul><Row v-for=\"(item,index) in items\" :key=\"index\" :item=\"item\" /></ul>';\n  const root = document.createElement('div');\n  document.body.append(root);\n  const app = createApp({ components: { Row }, setup: () => ({ items }), render: compile(template) });\n  app.mount(root);\n  const input = root.querySelector('input');\n  input.value = 'A草稿';\n  input.dispatchEvent(new Event('input', { bubbles: true }));\n  await nextTick();\n  items.value = [items.value[1], items.value[0]];\n  await nextTick();\n  const rows = [...root.querySelectorAll('li')].map(li =>\n    li.querySelector('span').textContent + ':' + li.querySelector('input').value\n  );\n  console.log((byId ? 'ID:' : '索引:') + rows.join(','));\n  items.value = [];\n  await nextTick();\n  console.log('清空:' + root.querySelectorAll('li').length);\n  app.unmount();\n  root.remove();\n}\nawait run(true);\nawait run(false);",
          "expectedOutput": [
            "ID:B:B,A:A草稿",
            "清空:0",
            "索引:B:A草稿,A:B",
            "清空:0"
          ],
          "explanation": [
            "使用订单 ID 时，B 和 A 对应的组件随着列表顺序移动，A 的草稿仍留在 A。使用索引时，第 0 个组件身份不变，但 props.item 从 A 变成 B，原有 ref 草稿仍为 A草稿，于是草稿与订单错配。",
            "这不是编译器“没发现数字变化”，而是作者提供了错误的身份合同。key 不是缓存依赖，也不负责自动合并服务端数据或保护删除中的草稿；每次渲染生成随机 key 则会造成重建与状态丢失。列表清空应移除行，不能用旧输入框伪装已有记录。"
          ]
        }
      ]
    },
    {
      "id": "once",
      "title": "v-once 是作者承诺不再更新，不是自动识别静态内容",
      "paragraphs": [
        "静态标题没有动态输入，编译器可以安全缓存；v-once 却允许你把有动态输入的子树也声明为只渲染一次。若对读取中的订单价格使用它，首次渲染的“加载中”就可能一直保留。只有内容的生命周期确实是第一次确定后不再变，且重新创建边界清楚，才适合这项声明。",
        "以下把 price 初始 null 渲染为加载中，再设置成 20。普通输出显示 20，错误的 v-once 子树仍是加载中。预期 加载中|加载中 与 加载中|20。不能用这类少更新的结果声称性能改善，因为它已经违反数据显示合同。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { compile, createApp, ref, nextTick } from '/vue.mjs';\nconst price = ref(null);\nconst render = compile('<section><p v-once>{{ price === null ? \"加载中\" : price }}</p><output>{{ price === null ? \"加载中\" : price }}</output></section>');\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({ setup: () => ({ price }), render });\napp.mount(root);\nconst read = () => root.querySelector('p').textContent + '|' + root.querySelector('output').textContent;\nconsole.log(read());\nprice.value = 20;\nawait nextTick();\nconsole.log(read());\napp.unmount();\nroot.remove();",
          "expectedOutput": [
            "加载中|加载中",
            "加载中|20"
          ],
          "explanation": [
            "首次渲染把两处都显示为加载中。price 更新时普通 output 提供本轮渲染的依赖与新值，而 v-once 指示该子树复用首次结果，所以 p 不会变成 20。",
            "修复通常是去掉 v-once，让真实依赖参与更新，而不是再写一个 watcher 手动改 p。错误、空结果、重试后的价格、单位或语言也都是可能变化的输入，不能只证明初次挂载正常就宣布这块内容永远不变。"
          ]
        }
      ]
    },
    {
      "id": "memo",
      "title": "v-memo 遗漏依赖，会让正确的状态仍显示错误的旧文字",
      "paragraphs": [
        "v-memo 接收固定长度依赖数组，若各项与上次相比不变，就可复用缓存子树。在性能证据确认大子树确有成本之前，优先使用普通模板与稳定 props；手动写依赖数组增加了维护责任。rowId 不变只说明仍是同一订单，不说明订单名称、价格、错误或权限都没变。",
        "下面 label 从旧变新，tick 同时变化以确保父组件重新渲染。故意错误的版本只放 rowId，正确版本同时放 label。预期 遗漏:旧|1、遗漏换ID:新|2、完整:新|1、完整换ID:新|2。换 ID 后突然更新，并不是旧数据问题自行消失，而是遗漏依赖被另一个变化碰巧唤醒。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { compile, createApp, ref, nextTick } from '/vue.mjs';\nasync function run(complete) {\n  const rowId = ref(1), label = ref('旧'), tick = ref(0);\n  const template = complete\n    ? '<section><p v-memo=\"[rowId,label]\">{{ label }}</p><output>{{ tick }}</output></section>'\n    : '<section><p v-memo=\"[rowId]\">{{ label }}</p><output>{{ tick }}</output></section>';\n  const root = document.createElement('div');\n  document.body.append(root);\n  const app = createApp({ setup: () => ({ rowId, label, tick }), render: compile(template) });\n  app.mount(root);\n  const read = () => root.querySelector('p').textContent + '|' + root.querySelector('output').textContent;\n  label.value = '新'; tick.value = 1;\n  await nextTick();\n  console.log((complete ? '完整:' : '遗漏:') + read());\n  rowId.value = 2; tick.value = 2;\n  await nextTick();\n  console.log((complete ? '完整换ID:' : '遗漏换ID:') + read());\n  app.unmount();\n  root.remove();\n}\nawait run(false);\nawait run(true);",
          "expectedOutput": [
            "遗漏:旧|1",
            "遗漏换ID:新|2",
            "完整:新|1",
            "完整换ID:新|2"
          ],
          "explanation": [
            "tick 更新使外层重新执行渲染，但错误版本的 memo 数组仍是 [1]，p 复用旧 VNode，所以 label 已经是新，DOM 仍显示旧。正确版本的 label 也在数组中，变化会使 memo 失效，因此显示新。",
            "rowId 变成 2 时两个版本都失效并生成新子树，错误版本才碰巧追上。若将一个对象放进数组，却只修改对象内部字段，引用不变也可能漏更新；要列出实际影响输出的值或可核验的版本，并覆盖成功、失败、空值与交互变化。v-memo 是性能提示，不能用来冻结授权或遮住过期数据。"
          ]
        }
      ]
    },
    {
      "id": "boundaries",
      "title": "编译提示不能解决所有更新成本",
      "paragraphs": [
        "第一条边界是工作类型：补丁标记减少某些 VNode 与属性比较，不能缩短接口请求、列表筛选、大量布局计算或图片解码。一个表达式每轮排序十万项，或 DOM 更新触发布局抖动，仍会有真实成本。先测出耗时是在计算、组件更新、DOM 提交还是布局绘制，再选择 computed、稳定 props、减少节点或虚拟列表。",
        "第二条边界是结构与身份：v-if 切换分支、列表插入删除、不同 key 触发重建时，都要维持正确的结构与生命周期。block 帮助定位动态区域，并不把这些操作变成“不更新”。手写 h、动态 slot、运行时对象属性也不能获得所有固定模板的同等分析条件；不要为了追求某个标记数字而改变正确的组件合同。",
        "第三条边界是证据：本篇核对 Vue 3.5.43 开发浏览器构建的输出、节点身份和渲染调用次数，没有运行生产性能基准，也没有 SSR、水合或 SFC 编译验收。真实项目还受到构建选项、生产优化与设备影响，不能将一行计数换算成性能提升比例。",
        "对订单页的工程建议是保留普通模板，让静态内容由编译器分析；先减少无关 props 的变化，维护稳定业务 key；只有在性能测量显示某个大子树确实昂贵、依赖合同又能完整维护时才加入 memo。每项优化都要回到读取、编辑、排序、失败与恢复行为，不能用“少渲染”替代“仍正确”。"
      ]
    },
    {
      "id": "practice",
      "title": "给一项优化找一个能推翻它的变化",
      "paragraphs": [
        "先合上代码解释：为何标题 DOM 相同不能单独证明静态提升？为什么状态是 3，而立即读到的 DOM 仍是 1？为什么传 active 布尔可以让 C 不更新，却不能保证行里读取的其他响应式值永远不触发更新？",
        "再给 memo 示例增加 price，把依赖数组只写 rowId 与 label，保持这两项不变只更新 price，预测并复现旧价格。修复后继续测试价格为空、读取失败与语言变化；每个影响输出的变化都要有对应失效条件。为 key 示例在列表开头插一行，检查原草稿是否仍属于原订单。",
        "本主题暂无已交付的独立 Vue 编码题，不提供空练习入口。E32 的简化依赖系统和 E38 的乐观更新仍在规划中，不能把它们当作模板编译练习已完成；文末回忆卡用于核对机制与边界。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Vue：Rendering Mechanism",
      "url": "https://vuejs.org/guide/extras/rendering-mechanism.html"
    },
    {
      "title": "Vue：Performance",
      "url": "https://vuejs.org/guide/best-practices/performance.html"
    },
    {
      "title": "Vue：List Rendering",
      "url": "https://vuejs.org/guide/essentials/list.html"
    },
    {
      "title": "Vue：Built-in Directives",
      "url": "https://vuejs.org/api/built-in-directives.html"
    },
    {
      "title": "Vue：Render Functions",
      "url": "https://vuejs.org/guide/extras/render-function.html"
    },
    {
      "title": "Vue：Security",
      "url": "https://vuejs.org/guide/best-practices/security.html"
    }
  ]
};
