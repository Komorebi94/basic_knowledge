import type { Article } from "../articles";

export const routingFormsStateArticle: Article = {
  "id": "K08-06",
  "kind": "knowledge",
  "domainSlug": "vue",
  "slug": "routing-forms-and-state",
  "title": "路由、表单与状态管理",
  "summary": "沿订单列表与详情编辑流程，分清 URL、已提交订单和本地草稿的事实源，解释参数复用、导航保护、表单校验与共享存储，并验证失败后的恢复。",
  "aliases": [
    "Vue Router",
    "route params",
    "navigation guards",
    "form validation",
    "state management",
    "路由",
    "表单",
    "状态管理"
  ],
  "tags": [
    "Vue",
    "Vue Router",
    "表单",
    "状态管理"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-13",
  "sections": [
    {
      "id": "problem",
      "title": "地址是订单 B，编辑框为什么还保留订单 A？",
      "paragraphs": [
        "用户在订单 A 的详情页改了数量，还没保存就点进订单 B。地址栏已经变化，组件却被路由复用，setup 里从初始参数复制的订单 ID 没再更新。另一个页面把筛选条件同时存进 URL、组件 ref 和 store，浏览器返回后 URL 恢复了，列表却还按后来的筛选显示。两个问题都来自同一份事实有了多处无人协调的副本。",
        "本文按订单列表到详情编辑的流程分开三类状态：URL 表达可分享、可返回的导航选择；已提交订单代表最后确认的数据；草稿代表尚未确认的编辑。store 可以共享前两者中的某些数据和命令，但不能把它们与草稿混成一份“全局订单”。",
        "前置阅读是 K08-02 的 computed/watch、K08-03 的状态所有权、K08-04 的任务清理和 K08-05 的组件身份。需要掌握的不是把字段全放进哪一个库，而是每个字段从哪里读、谁能提交、地址变化或请求失败时保留哪一份。"
      ]
    },
    {
      "id": "environment",
      "title": "用内存历史验证路由，不修改主站地址",
      "paragraphs": [
        "运行 npm run verify:k08-06，在独立临时 HTTP 页面使用 Vue 3.5.43 与 Vue Router 4.6.4 执行全部作者示例。代码块都是互相独立的完整 ES 模块；/vue.mjs 是本地 Vue 构建，/vue-router.mjs 是验证服务将官方 Router 全局构建接到同一 Vue 实例后提供的模块。自己的 Vue 项目中，分别把 import 来源改为 vue 和 vue-router 即可采用相同公开 API。",
        "路由例子使用 createMemoryHistory：push、replace、返回与守卫在 Router 内部运行，不更改浏览器地址栏。它适合隔离验证，不代表已经测试真实后退按钮、页面重载或托管服务器的深链接回退。实际产品若用 createWebHistory，还要让服务端对正确的应用路径返回入口，并提供应用自己的不存在状态。",
        "表单模板是固定的仓库作者源码，预览与保存接口用明确标注的教学替身；不接生产接口、不运行用户上传数据。Vue Router 仅为开发验证依赖，本站仍使用现有 React 路由；本篇不会把两套路由装进主站。"
      ]
    },
    {
      "id": "ownership",
      "title": "先为每个字段选一份事实源，再决定存放位置",
      "paragraphs": [
        "列表的查询词、页码与筛选状态决定“正在看哪一份列表”，用户希望复制链接或返回后恢复时，URL 是合适的事实源。订单 ID 也由当前路由给出。打开面板、某个字段是否已触碰、提交中的按钮状态是交互状态，通常留在组件；已确认订单与正在输入的数量分别保存，草稿不会因为一按键就改变其他页面的已提交显示。",
        "这是一项工程选择而非 Vue 强制规则。不需要分享的临时搜索文字可以先留在本地，点击搜索后才提交到 URL；最终用于请求与渲染的条件从路由规范化后派生。这样“输入中的查询”与“当前列表查询”含义明确，浏览器返回改变的是后者，不需要两个 watcher 互相复制。",
        "服务端订单还需要身份、版本与刷新策略。把它放进 store 只是改变访问范围，不会让响应变成永久正确的数据。进入订单 B 时显示加载中，读取不到应显示不存在，失败应有原因与重试；不能拿订单 A 的对象暂时冒充 B 的已就绪数据。"
      ]
    },
    {
      "id": "query",
      "title": "URL 进入应用时先规范化，不把 query 当作已验证领域值",
      "paragraphs": [
        "query 中的值可能是字符串、null 或重复参数形成的数组。页码不能直接 parseInt，因为 2oops 会被当作 2；空查询、重复查询与超大页码也需要合同。以下作者合同限定页码为 1—1000 的十进制正整数，查询词最多 80 字且去两端空白，状态只允许 all/open。无效可选筛选回落默认值；订单 ID 或授权字段不能照搬这种宽松回退。",
        "下面用真实 Router 的 resolve 解析 URL，再用纯函数建立领域过滤值。预期 正常:Vue:2:open、异常::1:all、重复::1:all。这个例子不请求列表，也不在应用启动时偷偷重写地址；若要求地址规范化，应在确认语义后用 replace，并比较规范值避免导航循环。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { h } from '/vue.mjs';\nimport { createRouter, createMemoryHistory } from '/vue-router.mjs';\nconst router = createRouter({ history: createMemoryHistory(), routes: [\n  { path: '/orders', component: { render: () => h('p', '列表') } }\n] });\nfunction filters(query) {\n  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 80) : '';\n  const rawPage = query.page;\n  const numeric = typeof rawPage === 'string' && /^[1-9][0-9]*$/.test(rawPage)\n    ? Number(rawPage) : 1;\n  const page = Number.isSafeInteger(numeric) && numeric <= 1000 ? numeric : 1;\n  const status = query.status === 'open' ? 'open' : 'all';\n  return { q, page, status };\n}\nfor (const [label, url] of [\n  ['正常', '/orders?q=%20Vue%20&page=2&status=open'],\n  ['异常', '/orders?q&page=2oops&status=unknown'],\n  ['重复', '/orders?q=A&q=B&page=1&page=2&status=open&status=all']\n]) {\n  const value = filters(router.resolve(url).query);\n  console.log(label + ':' + value.q + ':' + value.page + ':' + value.status);\n}",
          "expectedOutput": [
            "正常:Vue:2:open",
            "异常::1:all",
            "重复::1:all"
          ],
          "explanation": [
            "resolve 将正常地址的查询词解码成带空白的字符串，规范化去空白后为 Vue；合法的页码 2 与状态 open 被保留。异常地址的无值 q 是 null，2oops 不满足整段十进制合同，所以回落空查询与第 1 页。",
            "重复 q、page、status 分别形成数组，不能当作单一领域值。本例选择默认值而非取任意一个参数，得到空查询、1、all。返回类型固定后，列表请求才不必在每个组件里再猜“数组该用哪个值”；真实接口仍要校验过滤范围与权限。"
          ]
        }
      ]
    },
    {
      "id": "history",
      "title": "筛选从路由派生，push 和 replace 决定返回能恢复哪一轮",
      "paragraphs": [
        "用户明确提交一次新的筛选通常可用 push，保留返回上一轮的入口；规范地址或调整当前轮不希望留下额外历史记录时可用 replace。它们不是“一个刷新一个不刷新”，都要等待导航结果，再读已生效的 route。要保留不属于筛选的 tab 参数，提交时合并现有 query，而不是把整份 query 清空。",
        "下面为简洁只传入已经合法的页码与查询，规范函数见上一节；生产代码应复用同一个入口。初始 old 第 3 页，push new 时重置第 1 页且保留 shipping 标签，再 replace 为 final。内存返回后恢复 old 第 3 页，而不是 new；实际请求筛选始终从 computed 读取路由。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, computed, nextTick } from '/vue.mjs';\nimport { createRouter, createMemoryHistory, RouterView, useRoute } from '/vue-router.mjs';\nlet selected;\nconst Page = {\n  setup() {\n    const route = useRoute();\n    selected = computed(() => ({ q: route.query.q ?? '', page: route.query.page ?? '1' }));\n    return () => h('p', String(selected.value.q));\n  }\n};\nconst router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/orders', component: Page }] });\nawait router.push('/orders?q=old&page=3&tab=shipping');\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({ render: () => h(RouterView) });\napp.use(router); await router.isReady(); app.mount(root);\nconsole.log('初始:' + selected.value.q + ':' + selected.value.page);\nawait router.push({ path: '/orders', query: { ...router.currentRoute.value.query, q: 'new', page: '1' } });\nawait nextTick();\nconsole.log('提交:' + selected.value.q + ':' + selected.value.page + ':' + router.currentRoute.value.query.tab);\nawait router.replace({ path: '/orders', query: { ...router.currentRoute.value.query, q: 'final' } });\nconsole.log('替换:' + selected.value.q + ':' + selected.value.page);\nconst returned = new Promise(resolve => {\n  const remove = router.afterEach((_to, _from, failure) => { remove(); resolve(failure); });\n  router.back();\n});\nawait returned; await nextTick();\nconsole.log('返回:' + selected.value.q + ':' + selected.value.page);\napp.unmount(); root.remove();",
          "expectedOutput": [
            "初始:old:3",
            "提交:new:1:shipping",
            "替换:final:1",
            "返回:old:3"
          ],
          "explanation": [
            "push 创建第二条历史记录，查询词 new 生效，页码归 1，tab 仍为 shipping。replace 只替换第二条，所以它不再保留 new 这一轮的历史身份。",
            "返回第一条后 selected 自动读到 old 与 3，无须从一个 store 副本恢复。router.back 不返回导航完成的 Promise，因此例子通过一次 afterEach 等待内存导航完成；真实应用还需处理导航失败和取消，不能无条件清理草稿。"
          ]
        }
      ]
    },
    {
      "id": "reuse",
      "title": "同一个详情组件会复用，监听身份而不是只在 mounted 读取",
      "paragraphs": [
        "从 /orders/A 到 /orders/B 匹配同一条动态路由时，通常复用同一个组件实例。mounted 不会因为参数变化自动再执行，ref(route.params.id) 也不会自动成为当前 ID。读取逻辑应针对 () => route.params.id 观察，并在每次变化后按新身份发起任务；不需要 watch 整个 route 对象，让 hash、tab 或无关 query 也触发读取。",
        "以下同步“读取”只记录 ID，不冒充真实接口；用它单独观察复用与监听范围。预期 复用:1:初始快照:A:读取:A,B 与 仅切标签:A,B。真实异步结果还要按 K08-04 的每轮清理保护成功与失败，并且不能无声重置正在编辑的草稿。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref, watch, nextTick } from '/vue.mjs';\nimport { createRouter, createMemoryHistory, RouterView, useRoute } from '/vue-router.mjs';\nlet setups = 0;\nconst reads = [];\nlet initialId;\nconst Detail = {\n  setup() {\n    setups += 1;\n    const route = useRoute();\n    const copied = ref(route.params.id);\n    initialId = copied;\n    watch(() => route.params.id, id => { reads.push(String(id)); }, { immediate: true });\n    return () => h('p', String(route.params.id));\n  }\n};\nconst router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/orders/:id', component: Detail }] });\nawait router.push('/orders/A');\nconst root = document.createElement('div'); document.body.append(root);\nconst app = createApp({ render: () => h(RouterView) });\napp.use(router); await router.isReady(); app.mount(root);\nawait router.push('/orders/B'); await nextTick();\nconsole.log('复用:' + setups + ':初始快照:' + initialId.value + ':读取:' + reads.join(','));\nawait router.push('/orders/B?tab=shipping'); await nextTick();\nconsole.log('仅切标签:' + reads.join(','));\napp.unmount(); root.remove();",
          "expectedOutput": [
            "复用:1:初始快照:A:读取:A,B",
            "仅切标签:A,B"
          ],
          "explanation": [
            "setup 只执行一次，copied 保存最初的 A。监听的 route.params.id 在导航到 B 后变化，所以同步记录 A、B，而不是继续读取 A 或重新挂载整个页面。",
            "tab 更新没有改变 ID，watch 不再追加读取记录。对于需要完全重新建立编辑身份的页面，也可显式以业务 ID 设置组件 key，但要先保护草稿与资源释放；用每个 fullPath 作为 key 会连切标签也销毁组件。"
          ]
        }
      ]
    },
    {
      "id": "guards",
      "title": "保护草稿时，同时覆盖参数更新与离开组件",
      "paragraphs": [
        "只有 onBeforeRouteLeave 还不够：详情 A 到 B 复用组件，属于更新而不是离开这份路由组件。需要针对业务身份变化登记 onBeforeRouteUpdate，另用 leave 守卫保护去其他页面。守卫返回 false 中止导航；是否允许放弃输入应来自真实交互，不能自动把 dirty 清掉再跳转。",
        "下面没有弹窗，dirty=true 模拟有未保存修改；dirty=false 明确模拟用户已选择放弃。先尝试换订单、再尝试离开，均保留 A；允许放弃后 B 生效；重复导航到 B 又得到 duplicated。预期 换订单被阻止:true:A、离开被阻止:true:A、已允许:B、重复导航:true。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref } from '/vue.mjs';\nimport { createRouter, createMemoryHistory, RouterView, useRoute,\n  onBeforeRouteUpdate, onBeforeRouteLeave, isNavigationFailure, NavigationFailureType } from '/vue-router.mjs';\nconst dirty = ref(true);\nconst Detail = {\n  setup() {\n    const route = useRoute();\n    onBeforeRouteUpdate((to, from) => {\n      if (to.params.id !== from.params.id && dirty.value) return false;\n    });\n    onBeforeRouteLeave(() => { if (dirty.value) return false; });\n    return () => h('p', String(route.params.id));\n  }\n};\nconst router = createRouter({ history: createMemoryHistory(), routes: [\n  { path: '/orders/:id', component: Detail },\n  { path: '/other', component: { render: () => h('p', '其他页面') } }\n] });\nawait router.push('/orders/A');\nconst root = document.createElement('div'); document.body.append(root);\nconst app = createApp({ render: () => h(RouterView) });\napp.use(router); await router.isReady(); app.mount(root);\nlet failure = await router.push('/orders/B');\nconsole.log('换订单被阻止:' + isNavigationFailure(failure, NavigationFailureType.aborted) + ':' + router.currentRoute.value.params.id);\nfailure = await router.push('/other');\nconsole.log('离开被阻止:' + isNavigationFailure(failure, NavigationFailureType.aborted) + ':' + router.currentRoute.value.params.id);\ndirty.value = false;\nawait router.push('/orders/B');\nconsole.log('已允许:' + router.currentRoute.value.params.id);\nfailure = await router.push('/orders/B');\nconsole.log('重复导航:' + isNavigationFailure(failure, NavigationFailureType.duplicated));\napp.unmount(); root.remove();",
          "expectedOutput": [
            "换订单被阻止:true:A",
            "离开被阻止:true:A",
            "已允许:B",
            "重复导航:true"
          ],
          "explanation": [
            "两个导航请求都经过守卫并返回 aborted，currentRoute 仍是 A；Promise 解决并不等于已经离开页面。因此不能只在 await router.push 后不看结果就删除草稿或关闭编辑器。",
            "模拟放弃后才能到 B，再去同一位置得到 duplicated。异步守卫被新导航取代还有 cancelled，异常也需处理；本例仅实测 aborted 与 duplicated。路由守卫不覆盖刷新、关闭标签页或外部跳转，持久化与 beforeunload 属于额外边界，不能宣称在这里都已保护。"
          ]
        }
      ]
    },
    {
      "id": "form",
      "title": "v-model 是输入绑定，数字修饰符不是业务校验",
      "paragraphs": [
        "表单应该从草稿状态渲染，v-model 负责把输入变化写到草稿。修饰符 .number 使用数字转换，转换失败或清空时还可能保留字符串；不能把绑定类型假设成始终 number。它也不证明数字是整数、在数量范围内，或输入原文满足完整格式。",
        "下面使用文本输入与 .number，写入 2x 会转换为数字 2，清空会得到空字符串。如果合同必须拒绝 2x，就保留原始文字并用整段规则验证，再转换到领域数量，而不是在转换以后猜原文。作者合同为去空白后仅允许 1—5，预期 输入2x:number:2、清空:string:、严格空值:false、严格2x:false、严格小数:false、严格2:true:2。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { compile, createApp, ref, nextTick } from '/vue.mjs';\nconst quantity = ref('');\nconst root = document.createElement('div'); document.body.append(root);\nconst app = createApp({ setup: () => ({ quantity }),\n  render: compile('<input aria-label=\"数量草稿\" v-model.number=\"quantity\">') });\napp.mount(root);\nasync function input(text) {\n  const field = root.querySelector('input');\n  field.value = text;\n  field.dispatchEvent(new Event('input', { bubbles: true }));\n  await nextTick();\n}\nawait input('2x');\nconsole.log('输入2x:' + typeof quantity.value + ':' + quantity.value);\nawait input('');\nconsole.log('清空:' + typeof quantity.value + ':' + quantity.value);\nfunction parseQuantity(raw) {\n  if (typeof raw !== 'string' || !/^[1-5]$/.test(raw.trim())) return { ok: false };\n  return { ok: true, value: Number(raw.trim()) };\n}\nconsole.log('严格空值:' + parseQuantity('').ok);\nconsole.log('严格2x:' + parseQuantity('2x').ok);\nconsole.log('严格小数:' + parseQuantity('2.5').ok);\nconst result = parseQuantity(' 2 ');\nconsole.log('严格2:' + result.ok + ':' + result.value);\napp.unmount(); root.remove();",
          "expectedOutput": [
            "输入2x:number:2",
            "清空:string:",
            "严格空值:false",
            "严格2x:false",
            "严格小数:false",
            "严格2:true:2"
          ],
          "explanation": [
            "这里的 input 是文本类型，.number 用可转换的数字前缀得到 2，并非验证“2x 是合法数量”。清空时不能得到可用数字，于是草稿成为空字符串。这个边界要求提交入口继续验证，而不是直接信任 v-model 的转换。",
            "parseQuantity 对原始字符串使用完整正则，再转换，空字符串、后缀与小数都被拒绝，带空白的 2 被接受。真实界面应在合适的提交或失焦时机展示字段错误，保留输入让用户修正；复杂区域数字格式与输入法组合事件需要另行定义与实测，不在此例保证中。"
          ]
        }
      ]
    },
    {
      "id": "submit",
      "title": "失败不清草稿，成功才更新已提交副本和基线",
      "paragraphs": [
        "提交过程至少包含 idle、saving、error 与成功后的已确认状态。提交时捕获经过验证的快照，锁住本轮重复请求；失败只更新错误，不能把草稿清空。成功后用经过合同验证的返回值更新已提交订单，并刷新草稿基线。dirty 应来自可比较的编辑字段，不是输入过一次就永远 true，也不是按钮一点击就设 false。",
        "以下用 Vue reactive/computed 实现一个固定字段的编辑会话。persist 是教学 Promise：第一次模拟网络失败，第二次返回已确认数量和递增版本，没有真实服务器。成功、失败、重试与提交时再次点击都可推导；例子禁止 saving 中开始另一轮，在真实表单中还应禁用编辑或安排编辑版本，避免响应覆盖用户保存期间的新输入。",
        "预期 草稿:2:已提交:1:dirty:true，第一次失败保留数量 2 与 dirty，第二轮再次点击被拒绝，成功才将已提交数量改成 2 并清 dirty。状态机器与返回值校验保护本地合同，不代替服务器权限、库存检查、幂等键和条件写入。 随后让教学服务返回越界数量 9，响应被拒绝且保留草稿 3；再次重试成功才确认 3。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { reactive, computed, readonly } from '/vue.mjs';\nfunction createEditor(initial, persist) {\n  const state = reactive({ committed: { ...initial }, draft: { quantity: initial.quantity }, phase: 'idle', error: '' });\n  const dirty = computed(() => state.draft.quantity !== state.committed.quantity);\n  function edit(next) {\n    if (state.phase === 'saving') return false;\n    state.draft.quantity = next;\n    return true;\n  }\n  async function save() {\n    if (state.phase === 'saving') return false;\n    const quantity = state.draft.quantity;\n    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {\n      state.phase = 'error'; state.error = '数量必须是 1—5 的整数'; return false;\n    }\n    const snapshot = { id: state.committed.id, quantity, revision: state.committed.revision };\n    state.phase = 'saving'; state.error = '';\n    try {\n      const result = await persist(snapshot);\n      if (typeof result !== 'object' || result === null || Array.isArray(result) || result.id !== snapshot.id || result.quantity !== snapshot.quantity ||\n          !Number.isSafeInteger(result.revision) || result.revision <= snapshot.revision) {\n        throw new Error('保存响应不符合合同');\n      }\n      state.committed = { id: result.id, quantity: result.quantity, revision: result.revision };\n      state.draft.quantity = result.quantity;\n      state.phase = 'idle';\n      return true;\n    } catch (reason) {\n      state.phase = 'error'; state.error = reason instanceof Error ? reason.message : '保存失败';\n      return false;\n    }\n  }\n  return { state: readonly(state), dirty, edit, save };\n}\nlet attempts = 0;\nasync function persist(snapshot) {\n  attempts += 1;\n  if (attempts === 1) throw new Error('网络失败');\n  if (attempts === 3) return { ...snapshot, quantity: 9, revision: snapshot.revision + 1 };\n  return { ...snapshot, revision: snapshot.revision + 1 };\n}\nconst editor = createEditor({ id: 'A', quantity: 1, revision: 1 }, persist);\neditor.edit(2);\nconsole.log('草稿:' + editor.state.draft.quantity + ':已提交:' + editor.state.committed.quantity + ':dirty:' + editor.dirty.value);\nconsole.log('失败:' + await editor.save() + ':' + editor.state.committed.quantity + ':' + editor.state.draft.quantity + ':' + editor.state.error);\nconst retry = editor.save();\nconsole.log('保存期编辑:' + editor.edit(3));\nconsole.log('重复提交:' + await editor.save());\nconsole.log('成功:' + await retry + ':' + editor.state.committed.quantity + ':dirty:' + editor.dirty.value);\neditor.edit(3);\nconsole.log('响应拒绝:' + await editor.save() + ':' + editor.state.committed.quantity + ':' + editor.state.draft.quantity + ':' + editor.state.error);\nconsole.log('再次恢复:' + await editor.save() + ':' + editor.state.committed.quantity + ':dirty:' + editor.dirty.value);",
          "expectedOutput": [
            "草稿:2:已提交:1:dirty:true",
            "失败:false:1:2:网络失败",
            "保存期编辑:false",
            "重复提交:false",
            "成功:true:2:dirty:false",
            "响应拒绝:false:2:3:保存响应不符合合同",
            "再次恢复:true:3:dirty:false"
          ],
          "explanation": [
            "edit 只改草稿，committed 仍为 1，所以 dirty 为 true。第一次保存失败进入 error，原始草稿 2 仍在，错误有明确原因；没有伪装成功或清除恢复材料。",
            "重试同步先进入 saving，因此紧接着第二次 save 返回 false，不调用 persist。实际重试完成后，响应通过固定字段校验，committed 与 draft 对齐到 2，dirty 自然变 false。这里要求返回数量与提交数量一致；若真实服务器会规范化数量，应改成明确的服务器确认合同，而不是把教学比较照抄成所有 API 的规则。 保存期 edit(3) 同样被拒绝，保证本轮响应不会覆盖保存期间的新输入。",
            "第三次教学调用返回数量 9，与快照不符，检查将其转为明确错误，已提交值仍为 2，草稿仍为 3。第四次返回合法响应后成功恢复到 3，说明有响应不等于保存成功；错误后仍有可重试输入。"
          ]
        }
      ]
    },
    {
      "id": "store",
      "title": "共享的是已确认事实与命令，不是所有输入字段",
      "paragraphs": [
        "跨页面需要订单概要时，可把已确认数据和更新命令放进应用范围的 store。局部编辑器仍保存自己的草稿与错误；列表缓存要维护筛选键、过期时间或版本，不要用一个 currentOrder 同时代表 A 的草稿、B 的结果和全部订单缓存。输入框按键不应自动通知所有已提交数据的消费者。",
        "下面是一个最小共享状态示例，使用 reactive 与 readonly，不是 Pinia 实现。命令 accept 只接受固定合同内的订单，保留自己的字段副本；应用一的两个视图共享同一个 store，应用二创建另一实例。预期 共享:2:2、隔离:1、拒绝:false:2、调用方修改后:2。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { reactive, readonly } from '/vue.mjs';\nfunction createOrderStore() {\n  const state = reactive({ order: { id: 'A', quantity: 1, revision: 1 } });\n  function accept(value) {\n    if (typeof value !== 'object' || value === null || Array.isArray(value) || value.id !== 'A' || !Number.isInteger(value.quantity) ||\n        value.quantity < 1 || value.quantity > 5 || !Number.isSafeInteger(value.revision) ||\n        value.revision <= state.order.revision) return false;\n    state.order = { id: value.id, quantity: value.quantity, revision: value.revision };\n    return true;\n  }\n  return { state: readonly(state), accept };\n}\nconst appOne = createOrderStore();\nconst appTwo = createOrderStore();\nconst list = appOne.state;\nconst detail = appOne.state;\nconst response = { id: 'A', quantity: 2, revision: 2 };\nappOne.accept(response);\nconsole.log('共享:' + list.order.quantity + ':' + detail.order.quantity);\nconsole.log('隔离:' + appTwo.state.order.quantity);\nconsole.log('拒绝:' + appOne.accept({ id: 'A', quantity: 9, revision: 3 }) + ':' + list.order.quantity);\nresponse.quantity = 5;\nconsole.log('调用方修改后:' + list.order.quantity);",
          "expectedOutput": [
            "共享:2:2",
            "隔离:1",
            "拒绝:false:2",
            "调用方修改后:2"
          ],
          "explanation": [
            "list 与 detail 持有同一个只读视图，accept 后同时读到 2。appTwo 的工厂调用创建另一份原始对象，所以仍为 1。作用域来自创建位置，readonly 不是跨用户授权边界。",
            "超范围响应被拒绝，不改变现有订单；命令还逐字段复制合法值，调用方之后改 response 不会悄悄改 store。本例仅有订单 A 和递增版本的作者合同，不是完整缓存库；多订单、删除、乱序响应与版本来源需要自己的领域规则。"
          ]
        }
      ]
    },
    {
      "id": "boundaries",
      "title": "选择路由、表单库与 store 时，保留真正的边界",
      "paragraphs": [
        "Pinia 是 Vue 的专门状态管理方案，state、getters 和 actions 可以组织共享事实、派生值与命令；它可以减少大型应用的状态组织负担，但不能代替决定所有权。上例仅验证 Vue 的最小工厂状态，未执行 Pinia API；真实项目已有 store 时应沿用既有领域入口，不再创建第二份平行状态管理器。",
        "表单库适合重复字段、触碰状态、结构化错误和复杂校验；简单表单也可以明确实现。无论采用哪一种，都要区分客户端格式错误、服务端业务拒绝、网络失败与版本冲突。成功后才推进确认基线；失败保留草稿并说明能否重试；外部刷新不能无声覆盖 dirty 的输入。",
        "第一条边界是持久化。URL 能恢复适合公开的导航状态，不适合保存敏感表单或凭据；ref/store 通常只是内存，不能保证刷新或浏览器重启后还在。需要保存草稿时按用户与资源身份、版本建立明确的存储合同，并处理写入失败、冲突和迁移，不要把 store 当成已经持久化。",
        "第二条边界是导航与权限。守卫只负责客户端导航流程，不能保护接口权限；内存历史示例也没有测实际关闭标签页、后退按钮或刷新。第三条边界是并发。客户端锁按钮只能避免当前入口重复点击，不能阻止其他页面或其他客户端提交；过期读取、过期保存与服务端条件更新仍须按各自身份处理。",
        "第四条边界是 SSR 与作用域。应用或请求各创建 store，再给其消费者提供引用；服务端模块单例可能跨请求共享用户状态。路由本身也要按应用建立，不能将某一用户的当前参数永久存到全局对象。本文没有执行 SSR，也没有声称最小工厂解决了所有缓存与生命周期问题。"
      ]
    },
    {
      "id": "practice",
      "title": "让地址、草稿和已确认值分别回答自己的问题",
      "paragraphs": [
        "合上代码，预测 push new 后 replace final 再返回会恢复哪一轮筛选；把 tab 的变化加入详情流程，解释为什么不应重读订单。再给详情草稿设 dirty，分别测试 A 到 B、A 到其他页面与重复导航，指出哪些导航失败应保留输入。",
        "给保存模型增加“响应版本未递增”或“服务器返回数量超合同”的情况，预测已提交值、草稿与错误应如何变化。若允许保存期间继续编辑，应加入编辑版本或只更新已确认副本，不要直接让旧请求覆盖新的输入；尝试取消与迟到结果时可回看 K08-04，并在动手练习中使用已开放的 E13「最新请求结果提交」。",
        "本篇没有新增独立 Vue 编码题，E32 与 E38 仍在规划中。文末回忆卡检查 URL 事实源、导航守卫和草稿提交；实际示例与阅读验证报告随仓库记录，不以目录条目数量冒充已交付内容。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Vue Router：Dynamic Matching",
      "url": "https://router.vuejs.org/guide/essentials/dynamic-matching.html"
    },
    {
      "title": "Vue Router：Composition API",
      "url": "https://router.vuejs.org/guide/advanced/composition-api.html"
    },
    {
      "title": "Vue Router：Navigation Guards",
      "url": "https://router.vuejs.org/guide/advanced/navigation-guards.html"
    },
    {
      "title": "Vue Router：Navigation Failures",
      "url": "https://router.vuejs.org/guide/advanced/navigation-failures.html"
    },
    {
      "title": "Vue Router：Programmatic Navigation",
      "url": "https://router.vuejs.org/guide/essentials/navigation.html"
    },
    {
      "title": "Vue Router：History Modes",
      "url": "https://router.vuejs.org/guide/essentials/history-mode.html"
    },
    {
      "title": "Vue：Form Input Bindings",
      "url": "https://vuejs.org/guide/essentials/forms.html"
    },
    {
      "title": "Vue：State Management",
      "url": "https://vuejs.org/guide/scaling-up/state-management.html"
    },
    {
      "title": "Pinia：Defining a Store",
      "url": "https://pinia.vuejs.org/core-concepts/"
    }
  ]
};
