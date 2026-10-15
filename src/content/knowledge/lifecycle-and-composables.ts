import type { Article } from "../articles";

export const lifecycleComposablesArticle: Article = {
  "revision": 2,
  "id": "K08-04",
  "kind": "knowledge",
  "domainSlug": "vue",
  "slug": "lifecycle-and-composables",
  "title": "生命周期与组合式函数",
  "summary": "从关闭后仍收到消息的订单面板出发，区分组件卸载、请求失效与作用域停止，解释组合式函数的状态归属、响应式输入和同步调用约束。",
  "aliases": [
    "composables",
    "lifecycle hooks",
    "effectScope",
    "onScopeDispose",
    "onUnmounted",
    "组合式函数",
    "生命周期",
    "订阅释放"
  ],
  "tags": [
    "Vue",
    "生命周期",
    "组合式函数"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "订单面板关掉后，为什么消息仍在修改它的状态？",
      "paragraphs": [
        "沿用 K08-03 的订单编辑场景：面板打开时订阅订单变化，切换订单时读取预览，关闭面板后停止处理。若把订阅函数直接搬进 useOrderPanel，却没安排释放，每次重新打开就多一个回调。旧请求还可能在面板关闭后写回结果。函数名字以 use 开头，并不会替你决定谁拥有资源、资源何时停止。",
        "这一篇要建立的是资源生命周期：创建时明确所有者，失效时解除责任，结束时释放。组件生命周期管理整个面板，watch 的清理管理某一轮订单请求，effectScope 管理一组独立响应式工作；这三层边界不能用一个“页面关闭时再清理”互相替代。",
        "前置阅读是 K08-01 的依赖追踪、K08-02 的观察与副作用、K08-03 的状态所有权，以及 K02-05 的取消与过期结果。本文的组合式函数采用 Vue 3 Composition API，示例通过 h 返回视图，不需要单文件组件编译；事件与请求教学替身会明确标注。"
      ]
    },
    {
      "id": "environment",
      "title": "运行每个例子时，先把主页面留在隔离边界之外",
      "paragraphs": [
        "所有代码块都是互相独立的 ES 模块，在空白浏览器页面中执行。运行 npm run verify:k08-04 会启动临时本地 HTTP 页面，提供已安装的 Vue 3.5.43 浏览器构建 /vue.mjs，核对每个例子的预期输出；不接入真实订单服务，也不执行用户输入。",
        "手动复现可将 node_modules/vue/dist/vue.esm-browser.js 复制为本地静态服务根目录的 vue.mjs，在空 HTML 的 script type=\"module\" 中放入一个完整示例，通过 HTTP 打开。自己的 Vue 项目中把 import 来源替换为 vue。不要在本站主页面控制台粘贴运行；例子会创建和销毁 DOM、订阅与响应式作用域。",
        "h 是 Vue 的渲染函数 API：h(\"p\", 内容) 创建段落节点，h(Component) 创建子组件，ref 属性连接元素引用。nextTick 等待已排队的 Vue DOM 更新，并不代表图片加载、网络请求或浏览器绘制已经完成。toValue 在 Vue 3.3 起提供；本文用 watch 回调的 onCleanup 参数注册清理，不要求调用 Vue 3.5 才新增的 onWatcherCleanup。"
      ]
    },
    {
      "id": "lifecycle",
      "title": "从创建到卸载：钩子描述的是哪一个阶段？",
      "paragraphs": [
        "setup 同步执行时可建立响应式状态、注册钩子，但自己的 DOM 还未挂载。onMounted 时自身 DOM 已插入，且同步子组件已挂载；异步子组件和 Suspense 子树不能据此保证就绪。onBeforeUpdate 在本轮 DOM 更新前执行，onUpdated 在更新后执行；不能为了“同步”在 onUpdated 中无条件修改触发本轮更新的状态，否则会再次排队更新。",
        "onBeforeUnmount 适合仍需要访问现有实例或 DOM 的销毁工作；onUnmounted 表示组件及其子组件已卸载，setup 中关联的响应式 effect 已停止。它不会自动替你移除外部事件监听器、清除计时器或关闭连接。以下不含异步子树，预期日志按 setup:null → mounted:1 → before-update:1 → updated:2 → before-unmount:true → unmounted:false 出现。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref, nextTick, onMounted,\n  onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from '/vue.mjs';\nconst count = ref(1);\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({\n  setup() {\n    const element = ref(null);\n    console.log('setup:' + element.value);\n    onMounted(() => console.log('mounted:' + element.value.textContent));\n    onBeforeUpdate(() => console.log('before-update:' + element.value.textContent));\n    onUpdated(() => console.log('updated:' + element.value.textContent));\n    onBeforeUnmount(() => console.log('before-unmount:' + element.value.isConnected));\n    onUnmounted(() => console.log('unmounted:' + Boolean(element.value?.isConnected)));\n    return () => h('p', { ref: element }, String(count.value));\n  }\n});\napp.mount(root);\ncount.value = 2;\nawait nextTick();\napp.unmount();\nroot.remove();",
          "expectedOutput": [
            "setup:null",
            "mounted:1",
            "before-update:1",
            "updated:2",
            "before-unmount:true",
            "unmounted:false"
          ],
          "explanation": [
            "setup 时元素引用是 null。挂载钩子读到 1；状态改为 2 后，更新前钩子仍读旧 DOM 的 1，更新后钩子才读到 2。等待 nextTick 后再卸载，避免把排队更新与销毁混在一起。",
            "卸载前元素仍连接到 document，所以 isConnected 为 true。卸载后模板引用已清空且元素被移除，布尔检查为 false。这是本例在 Vue 3.5.43 的实际观察，不是允许在卸载钩子中继续操作已移除 DOM 的合同。"
          ]
        }
      ]
    },
    {
      "id": "subscription",
      "title": "订阅与移除必须使用同一回调，并跟随同一个所有者",
      "paragraphs": [
        "面板订阅外部事件的动作与数量状态一样需要所有者。usePulseCount 在每次调用中创建自己的 count，挂载后安装回调，卸载时移除原来的回调。不要在 removeEventListener 中重新写一个看似相同的箭头函数：那是另一个函数对象，无法删除原订阅；使用 capture 时移除也必须匹配这个选项。",
        "下面的 EventTarget 是手动发送 pulse 的教学事件源，不是服务器推送，也不模拟网络断开重连。左右各有一个面板，第一次事件都加一；移除左面板后再发一次，只有右边加一；整个应用卸载后再发一次，两边都保持不变。预期是 1,1、1,2、1,2。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref, onMounted, onUnmounted, nextTick } from '/vue.mjs';\nconst bus = new EventTarget();\nconst seen = new Map();\nfunction usePulseCount(target) {\n  const count = ref(0);\n  const handle = () => { count.value += 1; };\n  onMounted(() => target.addEventListener('pulse', handle));\n  onUnmounted(() => target.removeEventListener('pulse', handle));\n  return { count };\n}\nconst Panel = {\n  props: { name: { type: String, required: true } },\n  setup(props) {\n    const { count } = usePulseCount(bus);\n    seen.set(props.name, count);\n    return () => h('output', props.name + ':' + count.value);\n  }\n};\nconst leftVisible = ref(true);\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({\n  setup: () => () => h('main', [\n    leftVisible.value ? h(Panel, { name: 'left', key: 'left' }) : null,\n    h(Panel, { name: 'right', key: 'right' })\n  ])\n});\napp.mount(root);\nfunction read() {\n  return [seen.get('left').value, seen.get('right').value].join(',');\n}\nbus.dispatchEvent(new Event('pulse'));\nawait nextTick();\nconsole.log(read());\nleftVisible.value = false;\nawait nextTick();\nbus.dispatchEvent(new Event('pulse'));\nawait nextTick();\nconsole.log(read());\napp.unmount();\nbus.dispatchEvent(new Event('pulse'));\nconsole.log(read());\nroot.remove();",
          "expectedOutput": [
            "1,1",
            "1,2",
            "1,2"
          ],
          "explanation": [
            "两个 setup 各调用一次 usePulseCount，因此创建两份 ref 和两个不同的 handle。一个 pulse 被两位订阅者分别处理，第一行得到 1,1。复用的是逻辑，并不是把 count 自动变成共享状态。",
            "leftVisible 改为 false 后等待 DOM 更新，左组件卸载并移除自己的 handle，第二次事件只改右边。应用卸载又移除右订阅，第三次事件不能改任何计数。seen 为核对输出暂留引用，不是生产缓存；外部保留 ref 不会让已移除的监听器自动恢复。"
          ]
        }
      ]
    },
    {
      "id": "state",
      "title": "组合式函数复用逻辑，状态共享由创建位置决定",
      "paragraphs": [
        "一个纯格式化函数只把输入变成输出；组合式函数则可以封装随时间变化的响应式状态，并登记副作用。use 前缀是命名习惯，不是特殊编译语法，也不会把任意函数自动加入组件生命周期。是否需要组件或作用域，取决于内部调用了哪些 API。",
        "当 count 在函数内部创建，每次调用得到独立状态；移到模块顶层后，所有调用读同一份 ref。以下预期是 独立:1,0 与 共享:1,1。上一章的订单共享可以由共同父级创建后注入，不能因为把函数抽出来就假设共享已经正确发生。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { ref } from '/vue.mjs';\nfunction useCounter() {\n  const count = ref(0);\n  return { count, increment: () => { count.value += 1; } };\n}\nconst first = useCounter();\nconst second = useCounter();\nfirst.increment();\nconsole.log('独立:' + [first.count.value, second.count.value].join(','));\nconst sharedCount = ref(0);\nfunction useSharedCounter() {\n  return { count: sharedCount, increment: () => { sharedCount.value += 1; } };\n}\nconst sharedFirst = useSharedCounter();\nconst sharedSecond = useSharedCounter();\nsharedFirst.increment();\nconsole.log('共享:' + [sharedFirst.count.value, sharedSecond.count.value].join(','));",
          "expectedOutput": [
            "独立:1,0",
            "共享:1,1"
          ],
          "explanation": [
            "两个 useCounter 调用各执行一次 ref(0)，first.increment 只修改 first 持有的那个 ref。两个 useSharedCounter 却返回同一个 sharedCount，所以任一入口都能把双方读到的值改成 1。",
            "此例没有挂载钩子或 watcher，因而不需要组件实例。模块级共享只是展示创建位置的影响，不是建议把用户订单放到服务端模块单例；SSR 按请求隔离，资源释放责任也要由共享所有者承担。"
          ]
        }
      ]
    },
    {
      "id": "inputs",
      "title": "输入保留来源，返回值保留 ref，解构才不会取走快照",
      "paragraphs": [
        "组合式函数接收 props.quantity 这个数字，就只收到一个已经求值的输入。需要持续跟随变化时，应接收 ref 或 () => props.quantity 的 getter，并在 computed 或 watch 的追踪范围内读取它。把 toValue(source) 放到追踪函数外，只是早一点取了快照，没有建立持续依赖。",
        "返回一个普通对象，属性分别是 ref，调用方解构得到的仍是这些 ref。若返回 reactive 对象中的原始数字，直接解构会取走当时数字；要保持连接，可使用 toRefs，或保留整个 reactive 对象按属性读取。对于只有派生计算的 useDouble，直接 computed 就够了，不必再加一份 watch 同步结果。",
        "以下预期是 4,4,4、6,6,4、1:2。前两个结果分别通过 ref 和 getter读取数量；第三个是故意传入的数字快照。最后一行演示解构 reactive 的原始字段不会追随变化。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { ref, computed, toValue, reactive } from '/vue.mjs';\nfunction useDouble(source) {\n  const doubled = computed(() => toValue(source) * 2);\n  return { doubled };\n}\nconst quantity = ref(2);\nconst { doubled: byRef } = useDouble(quantity);\nconst { doubled: byGetter } = useDouble(() => quantity.value);\nconst { doubled: snapshot } = useDouble(quantity.value);\nconsole.log([byRef.value, byGetter.value, snapshot.value].join(','));\nquantity.value = 3;\nconsole.log([byRef.value, byGetter.value, snapshot.value].join(','));\nconst state = reactive({ quantity: 1 });\nconst { quantity: copied } = state;\nstate.quantity = 2;\nconsole.log(copied + ':' + state.quantity);",
          "expectedOutput": [
            "4,4,4",
            "6,6,4",
            "1:2"
          ],
          "explanation": [
            "创建 computed 时保留 source，getter 执行期间 toValue 才读取 ref 或执行传入的 getter。quantity 从 2 变成 3，使前两份结果失效并重算成 6；数字 2 的快照没有可追踪来源，所以始终是 4。",
            "普通返回对象里的 doubled 是 ref，解构只拿出这个 ref，没有取 .value。最后的 copied 却直接拿出原始数字 1，state.quantity 更新成 2 不会重新给 copied 赋值。这里没有观察副作用，只读派生值可以同步核对。"
          ]
        }
      ]
    },
    {
      "id": "registration",
      "title": "同步注册钩子，把异步工作放在已登记的回调里",
      "paragraphs": [
        "onMounted、onUnmounted 等 API 通常在 setup 同步调用链中关联当前组件。同步调用的组合式函数也在这条链上，能够注册钩子；Promise.then、定时器或按钮回调执行时则不能假设那个组件实例还处于活动注册上下文。正确做法是在 setup 阶段先登记挂载与释放回调，再由回调启动异步任务。",
        "下面故意在普通 Promise 的后续回调中注册 onUnmounted，是错误实现。预期是 同步:true、延迟:false、正确清理、错误清理次数:0。它观察 getCurrentInstance，而不靠吞掉警告制造“成功”；开发运行时还会发出没有活动组件实例的警告。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, onUnmounted, getCurrentInstance } from '/vue.mjs';\nlet finished;\nlet wrongCleanupCalls = 0;\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({\n  setup() {\n    console.log('同步:' + Boolean(getCurrentInstance()));\n    onUnmounted(() => console.log('正确清理'));\n    finished = Promise.resolve().then(() => {\n      console.log('延迟:' + Boolean(getCurrentInstance()));\n      // 错误实现：此处已经离开同步 setup 注册上下文。\n      onUnmounted(() => { wrongCleanupCalls += 1; });\n    });\n    return () => h('p', '面板');\n  }\n});\napp.mount(root);\nawait finished;\napp.unmount();\nconsole.log('错误清理次数:' + wrongCleanupCalls);\nroot.remove();",
          "expectedOutput": [
            "同步:true",
            "延迟:false",
            "正确清理",
            "错误清理次数:0"
          ],
          "explanation": [
            "setup 同步阶段有当前实例，提前登记的清理属于这个组件。普通 Promise 的回调在同步栈结束后执行，当前实例为 null，延迟注册不会成为该组件的卸载钩子。",
            "卸载只执行已经正确登记的清理。SFC 的 script setup 顶层 await 会经过编译转换以恢复实例上下文，不能用本例概括它；本例没有 SFC 编译，也不是声称所有异步代码都无法使用组合式 API。"
          ]
        }
      ]
    },
    {
      "id": "late-watch",
      "title": "异步创建的 watcher 没有自动得到组件所有者",
      "paragraphs": [
        "另一个常见错误是在请求成功后或定时器中才创建 watch。setup 中同步创建的 watcher 会随组件卸载停止；异步回调中新建的 watcher 通常没有这份归属，必须保留停止句柄，并防止组件结束后才开始订阅。优先同步创建 watcher，在其回调中根据“数据已就绪”决定是否执行工作，可以避免这层额外责任。",
        "为了直接观察泄漏，下面对同一流程运行错误版本与修复版本。同步 watcher 和延迟 watcher 都记录 source 的变化。第一次变化后卸载，再改 source；预期 错误:1,2、修复:1,1，最后的提前卸载分支为 提前卸载:0,0。错误版在展示结果后也手动停止，保证教学例子本身不会在隔离页面里无限残留。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref, watch, onUnmounted, nextTick } from '/vue.mjs';\nasync function run(manageLate, closeBeforeReady = false) {\n  const source = ref(0);\n  let syncCalls = 0;\n  let lateCalls = 0;\n  let stopLate;\n  let disposed = false;\n  let ready;\n  const root = document.createElement('div');\n  document.body.append(root);\n  const app = createApp({\n    setup() {\n      watch(source, () => { syncCalls += 1; });\n      if (manageLate) {\n        onUnmounted(() => { disposed = true; stopLate?.(); });\n      }\n      ready = Promise.resolve().then(() => {\n        if (disposed) return;\n        stopLate = watch(source, () => { lateCalls += 1; });\n      });\n      return () => h('p', '订阅面板');\n    }\n  });\n  app.mount(root);\n  if (closeBeforeReady) app.unmount();\n  await ready;\n  source.value = 1;\n  await nextTick();\n  if (!closeBeforeReady) app.unmount();\n  source.value = 2;\n  await nextTick();\n  const label = closeBeforeReady ? '提前卸载:' : manageLate ? '修复:' : '错误:';\n  console.log(label + [syncCalls, lateCalls].join(','));\n  stopLate?.();\n  root.remove();\n}\nawait run(false);\nawait run(true);\nawait run(true, true);",
          "expectedOutput": [
            "错误:1,2",
            "修复:1,1",
            "提前卸载:0,0"
          ],
          "explanation": [
            "source 首次变化时两个 watcher 都执行一次。卸载自动停止同步创建的 watcher，但错误版的延迟 watcher 仍活动，source 改成 2 时再执行，所以分别累计 1 和 2。",
            "修复版同步登记卸载处理，既设置 disposed 阻止迟到的初始化，又调用已经拿到的 stopLate。正常顺序下卸载后两者都保持 1。最后一次运行在 Promise 回调执行前就卸载，同步 watcher 已停止，disposed 阻止创建延迟 watcher，两项计数都为 0；停止已有工作和阻止尚未开始的工作缺一不可。"
          ]
        }
      ]
    },
    {
      "id": "request-cleanup",
      "title": "订单切换时就清理旧轮，而不是等到整个面板卸载",
      "paragraphs": [
        "面板还在，但选中订单从 A 变成 B，A 的读取已经失去写入当前面板的资格。watch 的 onCleanup 在旧轮失效、下轮执行前触发，也在 watcher 停止时触发；这里同步登记 active=false 和 controller.abort。取消用于节省资源，active 同时防止忽略 signal 的任务提交迟到结果，成功与失败都要检查。",
        "usePreview 以一个带 phase 的对象表达 idle、loading、ready、empty、error，避免 data=null 同时代表尚未读取、读取失败和空结果。教学 loader 只用可手动完成的 Promise，故意不响应 AbortSignal，因此能证明“即使取消没有让 Promise 停止，旧轮仍不能写入”；它不是实际 Fetch，也不能证明服务端写入被撤销。",
        "下面先让 B 成功再让 A 失败，状态仍为 ready:B；当前 C 失败显示 error:读取失败，D 返回空值显示 empty，随后 E 启动时面板卸载，E 后续成功也不再写回。预期依次是 idle、loading、ready:B:true、ready:B、error:读取失败、empty、卸载后:loading:true。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref, shallowRef, readonly, watch, nextTick } from '/vue.mjs';\nfunction deferred() {\n  let resolve, reject;\n  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });\n  return { promise, resolve, reject };\n}\nconst pending = new Map();\nfunction load(id, signal) {\n  const task = deferred();\n  pending.set(id, { ...task, signal });\n  return task.promise;\n}\nfunction usePreview(orderId, loader) {\n  const state = shallowRef({ phase: 'idle' });\n  watch(orderId, async (id, _old, onCleanup) => {\n    let active = true;\n    const controller = new AbortController();\n    onCleanup(() => { active = false; controller.abort(); });\n    if (!id) { state.value = { phase: 'idle' }; return; }\n    state.value = { phase: 'loading' };\n    try {\n      const data = await loader(id, controller.signal);\n      if (!active) return;\n      state.value = data === null ? { phase: 'empty' } : { phase: 'ready', data };\n    } catch (reason) {\n      if (!active) return;\n      state.value = { phase: 'error', message: reason instanceof Error ? reason.message : '读取失败' };\n    }\n  }, { immediate: true });\n  return { state: readonly(state) };\n}\nconst orderId = ref('');\nlet preview;\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({\n  setup() {\n    preview = usePreview(orderId, load);\n    return () => h('p', { role: 'status' }, preview.state.value.phase);\n  }\n});\napp.mount(root);\nfunction read() {\n  const current = preview.state.value;\n  return current.phase === 'ready' ? 'ready:' + current.data\n    : current.phase === 'error' ? 'error:' + current.message : current.phase;\n}\nasync function finish(id, value, fail = false) {\n  const task = pending.get(id);\n  if (fail) task.reject(new Error(value)); else task.resolve(value);\n  await Promise.resolve();\n  await nextTick();\n}\nconsole.log(read());\norderId.value = 'A'; await nextTick();\nconsole.log(read());\norderId.value = 'B'; await nextTick();\nawait finish('B', 'B');\nconsole.log(read() + ':' + pending.get('A').signal.aborted);\nawait finish('A', '旧失败', true);\nconsole.log(read());\norderId.value = 'C'; await nextTick();\nawait finish('C', '读取失败', true);\nconsole.log(read());\norderId.value = 'D'; await nextTick();\nawait finish('D', null);\nconsole.log(read());\norderId.value = 'E'; await nextTick();\napp.unmount();\nawait finish('E', '迟到结果');\nconsole.log('卸载后:' + read() + ':' + pending.get('E').signal.aborted);\nroot.remove();",
          "expectedOutput": [
            "idle",
            "loading",
            "ready:B:true",
            "ready:B",
            "error:读取失败",
            "empty",
            "卸载后:loading:true"
          ],
          "explanation": [
            "A 开始后进入 loading；切到 B 时清理 A，A 的 signal.aborted 为 true。B 成功提交 ready:B，之后 A 失败因为 active 为 false 被忽略，没有把新成功覆盖成旧错误。",
            "C 仍是当前轮，所以失败进入 error。换成 D 会重新进入 loading，空值完成后进入 empty，展示失败后可继续读取且空结果不同于失败。卸载停止同步 watcher 并执行 E 的清理，E 的 Promise 虽然仍完成，active 检查阻止写回，因此暂留引用读到的仍是最后的 loading，而不是 ready:迟到结果。",
            "卸载后的 loading 是用于核验“状态没有再写入”的内存观察，不是要展示给用户的页面。生产 loader 还需校验响应结构，接口地址由调用方提供；要重试相同 ID，可增加重试触发源或明确 reload 命令，不能指望给 ref 重复赋同一个 ID 会触发 watcher。"
          ]
        }
      ]
    },
    {
      "id": "scope",
      "title": "非组件任务用 effectScope 管理响应式工作，资源仍需登记释放",
      "paragraphs": [
        "后台队列或可独立关闭的会话不一定挂载组件，但仍会创建 watcher。effectScope.run 在同步执行期间收集其中创建的响应式工作，stop 统一停止，并执行 onScopeDispose 回调。组合式函数用 onScopeDispose 登记外部资源释放，可以复用于组件的 setup 作用域和独立 effectScope。没有活动 scope 时应明确失败，不能装作资源已经受到管理。",
        "scope.stop 不会自动推断哪个 EventTarget、计时器或连接属于你；外部资源必须显式登记。独立 detached scope 更需要清楚的停止所有者，不能把它当成卸载后继续工作的借口。下面创建一个独立 scope，给同步 watcher 与事件订阅同一份停止责任，预期是 活动:1,1 与 停止:1,1,1。最后一个数字表示释放回调只执行一次。最后一次在作用域外调用会显示 无作用域:必须在活动作用域中订阅，且不会先安装监听器。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { effectScope, getCurrentScope, onScopeDispose, ref, watch, nextTick } from '/vue.mjs';\nconst bus = new EventTarget();\nconst source = ref(0);\nlet eventCalls = 0;\nlet watchCalls = 0;\nlet cleanups = 0;\nfunction useScopedPulse(target) {\n  if (!getCurrentScope()) throw new Error('必须在活动作用域中订阅');\n  const handle = () => { eventCalls += 1; };\n  target.addEventListener('pulse', handle);\n  onScopeDispose(() => {\n    target.removeEventListener('pulse', handle);\n    cleanups += 1;\n  });\n}\nconst scope = effectScope();\nscope.run(() => {\n  useScopedPulse(bus);\n  watch(source, () => { watchCalls += 1; });\n});\nbus.dispatchEvent(new Event('pulse'));\nsource.value = 1;\nawait nextTick();\nconsole.log('活动:' + [eventCalls, watchCalls].join(','));\nscope.stop();\nscope.stop();\nbus.dispatchEvent(new Event('pulse'));\nsource.value = 2;\nawait nextTick();\nconsole.log('停止:' + [eventCalls, watchCalls, cleanups].join(','));\ntry { useScopedPulse(bus); }\ncatch (reason) { console.log('无作用域:' + reason.message); }",
          "expectedOutput": [
            "活动:1,1",
            "停止:1,1,1",
            "无作用域:必须在活动作用域中订阅"
          ],
          "explanation": [
            "run 中创建 watcher，使它属于 scope；useScopedPulse 自己登记外部监听器的释放。第一次事件和 source 更新分别累计一次。第一次 stop 停止 watcher 并移除监听器，第二次 stop 不会重复释放。",
            "随后再发事件和修改 source，两种计数都保持 1，cleanups 也是 1。此例在浏览器独立作用域中运行，没有挂载组件，因此使用 onScopeDispose；如果把函数移到没有活动 scope 的普通回调里，明确的检查会抛错而不是留下无人负责的订阅。"
          ]
        }
      ]
    },
    {
      "id": "boundaries",
      "title": "卸载、缓存停用与服务端运行，是三种不同的边界",
      "paragraphs": [
        "第一条边界是 KeepAlive：被缓存组件离开显示区域时可能只是 deactivated，实例没有卸载，onUnmounted 不会因此执行。若订阅只需在可见时活动，应由 onActivated/onDeactivated 建立和暂停，用一个幂等 start/stop 避免首次挂载或重新激活重复安装；最终卸载仍要释放。不要把 CSS 隐藏或缓存停用当成销毁。本文实际示例没有 KeepAlive，不能把卸载报告当作缓存行为的测试报告。",
        "第二条边界是 SSR：setup 会在服务端执行，而 mounted/updated/unmounted 这些客户端生命周期不能被当成服务端资源释放机制。浏览器专用 DOM 操作放进 onMounted，但不能在更早阶段就执行 window 或创建无人结束的计时器。服务端连接由请求生命周期管理；将用户状态放在模块顶层又会产生跨请求共享问题。本文没有执行服务端渲染。",
        "第三条边界是共享资源。每个组件各订阅一次最容易解释，也最容易释放，适合便宜且独立的工作；一个 WebSocket 连接由应用统一创建再分发可以节省成本，却要由应用而非任意消费面板关闭。最后一个订阅者退出是否关闭连接、重连时如何避免重复注册，是共享管理器的合同，不能散落在每个 use 函数里猜测。",
        "对当前订单面板，建议按资源列出“创建入口、失效条件、停止入口”：DOM 引用在挂载后使用；外部订阅随可见性或卸载释放；读取任务每次订单切换就清理；跨页面连接由应用会话管理。先定义这些实际需求，再提取组合式函数，避免做一个接收十几种生命周期策略却没有明确所有者的万能工具。"
      ]
    },
    {
      "id": "practice",
      "title": "用重新打开、切换与迟到返回检查是否真的结束",
      "paragraphs": [
        "先预测“打开 → 收到消息 → 关闭 → 再收到消息 → 重新打开”的输出：已经卸载的旧面板不能继续累计，新面板是否从零开始由状态创建位置决定。把订阅示例的卸载移到挂载之前不会得到同一条生命周期；如果延迟初始化，在开始前检查 disposed，结束后也要检查迟到回调。",
        "再给读取示例增加一个返回失败的旧 B，让新的 C 成功先到，预测最终 phase。不要只测试成功路径：旧失败同样不能覆盖当前成功；当前失败要能展示原因并通过新一轮读取恢复。E13「最新请求结果提交」已经提供独立练习，可在动手练习中用它验证成功、失败和取消的身份边界。",
        "本主题当前没有专属判题练习，先运行本文完整示例，再改变输入验证失败路径。练习页已发布的相邻模型不能代替本主题的验收。这些 JavaScript 练习不挂载 Vue；框架机制仍按本文注明的真实实验核对。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Vue：Composables",
      "url": "https://vuejs.org/guide/reusability/composables.html"
    },
    {
      "title": "Vue：Composition API Lifecycle",
      "url": "https://vuejs.org/api/composition-api-lifecycle.html"
    },
    {
      "title": "Vue：Reactivity Advanced",
      "url": "https://vuejs.org/api/reactivity-advanced.html"
    },
    {
      "title": "Vue：Watchers",
      "url": "https://vuejs.org/guide/essentials/watchers.html"
    },
    {
      "title": "Vue：Reactivity Utilities",
      "url": "https://vuejs.org/api/reactivity-utilities.html"
    },
    {
      "title": "Vue：script setup",
      "url": "https://vuejs.org/api/sfc-script-setup.html"
    },
    {
      "title": "Vue：KeepAlive",
      "url": "https://vuejs.org/guide/built-ins/keep-alive.html"
    },
    {
      "title": "Vue：SSR",
      "url": "https://vuejs.org/guide/scaling-up/ssr.html"
    }
  ]
};
