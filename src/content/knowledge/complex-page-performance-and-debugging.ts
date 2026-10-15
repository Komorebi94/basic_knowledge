import type { Article } from "../articles";

export const complexPagePerformanceArticle: Article = {
  "id": "K08-08",
  "kind": "knowledge",
  "domainSlug": "vue",
  "slug": "complex-page-performance-and-debugging",
  "title": "复杂页面性能与调试",
  "summary": "从订单列表输入卡顿出发，追踪实际依赖、计算结果身份和调度范围，验证浅响应式与固定高度窗口的行为，并说明测量、对象身份和恢复边界。",
  "aliases": [
    "Vue performance",
    "renderTracked",
    "renderTriggered",
    "shallowRef",
    "markRaw",
    "virtual list",
    "性能调试",
    "复杂页面"
  ],
  "tags": [
    "Vue",
    "性能",
    "调试"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-13",
  "sections": [
    {
      "id": "problem",
      "title": "订单列表卡顿，应该先加 memo 还是换 shallowRef？",
      "paragraphs": [
        "订单页输入筛选词时卡顿，团队怀疑 Vue 更新太多，先给列表加 memo，再把数据换成 shallowRef。卡顿可能稍减，但订单内部数量变了却没显示，错误消息也偶尔停在旧值。性能优化已经改变了用户可观察行为，问题不再只是速度。",
        "要处理复杂页面，先把一次动作拆成输入、计算、响应式调度、组件更新、DOM 提交与布局绘制。请求慢、重复排序、过量节点和遗留订阅需要不同的处理方法；减少组件渲染次数不会自动缩短网络，也不能替代正确的失效与释放。",
        "本文串起 K08-01—07：追踪实际读写，检查 computed 与 props 的结果身份，理解浅响应式与外部对象，再用固定高度列表减少 DOM 数量。每个优化都给出错误路径或适用条件；数量与回调次数是机制证据，不换算成未经测量的速度提升。"
      ]
    },
    {
      "id": "environment",
      "title": "隔离页面核对行为，生产性能仍要按真实场景测",
      "paragraphs": [
        "运行 npm run verify:k08-08，在临时独立 HTTP 页面使用 Vue 3.5.43 开发浏览器构建 /vue.mjs 执行完整 ES 模块示例。每个例子独立运行，不依赖其他例子的变量；自己的 Vue 项目中把 import 来源改为 vue。所有订单与计数均为作者教学数据，不读取个人记录或真实接口。",
        "手动复现可将 node_modules/vue/dist/vue.esm-browser.js 复制为本地静态服务根目录的 vue.mjs，在空 HTML 的 script type=\"module\" 中放一个示例，通过 HTTP 打开。不要在本站主页面控制台运行；这里会创建组件、滚动容器和观察器，并在结束时释放。",
        "开发构建的 onRenderTracked/onRenderTriggered 用来定位依赖，生产构建不提供同样的调试回调。Performance 面板可帮助区分脚本、布局和绘制，Vue DevTools 可协助看组件，app.config.performance 可以加入 Vue 标记。诊断信息不能原样记录用户订单或凭据；这里仅记录字段名与作者计数。"
      ]
    },
    {
      "id": "measurement",
      "title": "先定义测量窗口，不把 nextTick 当成整次交互完成",
      "paragraphs": [
        "如果要核对“改状态到 DOM 提交”，可以在修改前和 nextTick 后分别打 mark，再 measure。这个窗口包含 Vue 排队和本轮提交，却不保证像素已绘制、网络已结束或一次交互的 INP 已计算完。浏览器空白页的一次 duration 没有资格代表线上体验。",
        "下面真实创建两条标记和一条测量记录，但不对设备相关耗时写固定数字，只核对记录存在、时长非负和输出确已变成 2。预期 窗口:true:DOM:2。实际比较方案时应保持构建、数据量、设备、冷暖状态和操作路径一致，重复多次记录分布，同时保留失败与恢复合同。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref, nextTick } from '/vue.mjs';\nconst quantity = ref(1);\nconst root = document.createElement('div'); document.body.append(root);\nconst app = createApp({ setup: () => () => h('output', String(quantity.value)) });\napp.mount(root);\nperformance.mark('order-update-start');\nquantity.value = 2;\nawait nextTick();\nperformance.mark('order-update-commit');\nperformance.measure('order-update', 'order-update-start', 'order-update-commit');\nconst entry = performance.getEntriesByName('order-update', 'measure')[0];\nconsole.log('窗口:' + Boolean(entry && entry.duration >= 0) + ':DOM:' + root.textContent);\nperformance.clearMarks('order-update-start');\nperformance.clearMarks('order-update-commit');\nperformance.clearMeasures('order-update');\napp.unmount(); root.remove();",
          "expectedOutput": [
            "窗口:true:DOM:2"
          ],
          "explanation": [
            "修改 quantity 会排队更新，nextTick 后 output 已经读到 2，两个标记之间有实际 measure。断言只核对窗口边界和行为，避免把某台机器的一次毫秒数固化为教程合同。",
            "最终清除本例标记与测量，卸载应用并移除容器。若实际卡顿在图像解码或布局绘制，这个窗口不足以说明原因，应结合 Performance 时间线和用户交互观察，而不是仅缩小这里的 duration。"
          ]
        }
      ]
    },
    {
      "id": "dependencies",
      "title": "用读取与触发记录解释更新，不凭整个对象判断",
      "paragraphs": [
        "onRenderTracked 描述渲染执行时读了什么，onRenderTriggered 描述哪个响应式变化通知渲染工作；它们不等于 DOM 修改次数，更不等于用户操作次数。先用字段名定位来源，再检查读取范围和所有者；不要在调试钩子里修改依赖，引入新的更新。",
        "以下按 mode 读取 first 或 second。未读取的 second 在 A 模式中变化，不应导致当前组件更新；切到 B 后会读取已变成 20 的 second，旧 first 随后变化也不再触发这条分支。预期 初始依赖:first,mode、未读字段:1:A:1、读取字段:2:A:2:触发first:true、切换依赖:mode,second:B:20、旧字段:3:B:20。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, reactive, onRenderTracked, onRenderTriggered, nextTick } from '/vue.mjs';\nconst state = reactive({ mode: 'A', first: 1, second: 10 });\nconst tracked = new Set();\nconst triggered = [];\nlet renders = 0;\nconst root = document.createElement('div'); document.body.append(root);\nconst app = createApp({\n  setup() {\n    onRenderTracked(event => tracked.add(String(event.key)));\n    onRenderTriggered(event => triggered.push(String(event.key)));\n    return () => {\n      renders += 1;\n      return h('p', state.mode + ':' + (state.mode === 'A' ? state.first : state.second));\n    };\n  }\n});\napp.mount(root);\nconsole.log('初始依赖:' + [...tracked].sort().join(','));\nstate.second = 20; await nextTick();\nconsole.log('未读字段:' + renders + ':' + root.textContent);\nstate.first = 2; await nextTick();\nconsole.log('读取字段:' + renders + ':' + root.textContent + ':触发first:' + triggered.includes('first'));\ntracked.clear(); state.mode = 'B'; await nextTick();\nconsole.log('切换依赖:' + [...tracked].sort().join(',') + ':' + root.textContent);\nstate.first = 3; await nextTick();\nconsole.log('旧字段:' + renders + ':' + root.textContent);\napp.unmount(); root.remove();",
          "expectedOutput": [
            "初始依赖:first,mode",
            "未读字段:1:A:1",
            "读取字段:2:A:2:触发first:true",
            "切换依赖:mode,second:B:20",
            "旧字段:3:B:20"
          ],
          "explanation": [
            "首次渲染读 mode 和 first，所以改 second 不会触发本组件，renders 保持 1。改 first 后执行第二次渲染，并留下 first 的触发记录；日志没有泄露整个 state 对象。",
            "切换模式重新建立当轮读取集合，记录变成 mode、second，显示 B:20。之后 first 的变化不再影响这个分支，renders 保持 3。这里只用开发钩子诊断这份组件，外部 watcher 或其他组件仍可能独立工作。"
          ]
        }
      ]
    },
    {
      "id": "computed",
      "title": "结果内容没变，新的对象引用也可能放大下游工作",
      "paragraphs": [
        "Vue 3.4 起，computed 的结果未变时可以避免触发其下游 effect。但每次返回一个新对象，即使字段含义没变，引用仍不同。若依赖合同简单且完整，可以先计算新结果，再与 oldValue 比较所有相关字段，等价时复用旧对象；不能为了省计算提前返回 oldValue 而不读取当前依赖。",
        "下面比较“每轮新对象”和“相同 even 复用旧对象”。从 2 改 4 时两者都是偶数，但只有新对象版本让下游执行；改成 5 才让复用版本也执行。预期 初始:1,1、等价变化:2,1、值变化:3,2。计数来自 watchEffect，不代表昂贵计算已经不必运行。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { ref, computed, watchEffect, effectScope, nextTick } from '/vue.mjs';\nconst count = ref(2);\nconst calls = { fresh: 0, stable: 0 };\nconst scope = effectScope();\nscope.run(() => {\n  const fresh = computed(() => ({ even: count.value % 2 === 0 }));\n  const stable = computed(previous => {\n    const next = { even: count.value % 2 === 0 };\n    return previous && previous.even === next.even ? previous : next;\n  });\n  watchEffect(() => { void fresh.value; calls.fresh += 1; });\n  watchEffect(() => { void stable.value; calls.stable += 1; });\n});\nconst read = () => [calls.fresh, calls.stable].join(',');\nconsole.log('初始:' + read());\ncount.value = 4; await nextTick();\nconsole.log('等价变化:' + read());\ncount.value = 5; await nextTick();\nconsole.log('值变化:' + read());\nscope.stop();",
          "expectedOutput": [
            "初始:1,1",
            "等价变化:2,1",
            "值变化:3,2"
          ],
          "explanation": [
            "初次 effect 都读取结果，计数为 1。count 变为 4 后 fresh 创建新对象，下游累计到 2；stable 仍先读取 count 并计算 even，然后发现等价，返回同一个旧对象，使下游保持 1。",
            "count 变为 5 改变 even，stable 必须返回新结果，两个下游都再执行一次。对象有更多字段时要完整比较；不要用一个便宜字段相等证明整个订单相等，或深比较巨大结果而没有成本证据。scope.stop 停止本例的观察工作。"
          ]
        }
      ]
    },
    {
      "id": "shallow",
      "title": "shallowRef 改的是通知合同，不是只换一个更快的 ref",
      "paragraphs": [
        "深层响应式会在访问嵌套字段时使用代理；对于大批不可变快照，可以考虑 shallowRef 在根引用层通知更新。代价是内部对象不再自动深层追踪：直接写 rows.value[0].quantity 不会因为这一写入重新渲染依赖根引用的组件。其他更新偶然刷新它，还会使问题显得间歇出现。",
        "下面明确演示错误的内部修改与正确的根替换。预期 嵌套代理:false、内部修改:数据2:DOM1、根替换:DOM3。数据变了但界面没变不是“优化成功”；采用浅层策略就应把嵌套数据按不可变合同更新，或在专门外部系统桥接中明确安排通知。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, shallowRef, isReactive, nextTick } from '/vue.mjs';\nconst rows = shallowRef([{ id: 'A', quantity: 1 }]);\nconst root = document.createElement('div'); document.body.append(root);\nconst app = createApp({ setup: () => () => h('p', String(rows.value[0].quantity)) });\napp.mount(root);\nconsole.log('嵌套代理:' + isReactive(rows.value[0]));\nrows.value[0].quantity = 2;\nawait nextTick();\nconsole.log('内部修改:数据' + rows.value[0].quantity + ':DOM' + root.textContent);\nrows.value = rows.value.map(row => ({ ...row, quantity: 3 }));\nawait nextTick();\nconsole.log('根替换:DOM' + root.textContent);\napp.unmount(); root.remove();",
          "expectedOutput": [
            "嵌套代理:false",
            "内部修改:数据2:DOM1",
            "根替换:DOM3"
          ],
          "explanation": [
            "数组里的对象没有被 shallowRef 自动代理，内部数量改成 2 没触发根值通知，所以 DOM 仍为 1。读取原数据能看到 2，证明没有通知与没有写入是两回事。",
            "map 创建新的数组与行对象，再替换 .value，根引用变化触发渲染，DOM 得到 3。新建对象应与改动规模相符，不能为了减少深层代理又在每次按键深拷贝整个巨大状态。triggerRef 可用于明确的外部通知桥接，但不能随意调用来掩盖遗漏的所有权合同。"
          ]
        }
      ]
    },
    {
      "id": "identity",
      "title": "markRaw 只标根对象，嵌套引用仍可能遇到身份差异",
      "paragraphs": [
        "图表实例、外部状态对象等不适合被 Vue 自动代理时，可用 markRaw 明确跳过根对象转换。它不是递归冻结，也不是把对象内部所有引用从此都变成唯一的原始身份。嵌套对象如果另行进入 reactive 容器，可能在那里获得代理，使用对象作为 Map 键就会遇到原始引用与代理不相等。",
        "以下预期 根对象被代理:false、嵌套身份一致:false、引用键命中:false、业务ID命中:true。按稳定业务 ID 查找是本例的一种边界设计；如果外部 API 必须用对象身份，则应在适配层统一原始或代理身份，而不是每个调用方各自猜测。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { markRaw, reactive, isReactive } from '/vue.mjs';\nconst external = markRaw({ nested: { id: 'chart-A' } });\nconst holder = reactive({ external, nested: external.nested });\nconsole.log('根对象被代理:' + isReactive(holder.external));\nconsole.log('嵌套身份一致:' + (holder.external.nested === holder.nested));\nconst byReference = new Map([[external.nested, '作者缓存']]);\nconsole.log('引用键命中:' + byReference.has(holder.nested));\nconst byId = new Map([[external.nested.id, '作者缓存']]);\nconsole.log('业务ID命中:' + byId.has(holder.nested.id));",
          "expectedOutput": [
            "根对象被代理:false",
            "嵌套身份一致:false",
            "引用键命中:false",
            "业务ID命中:true"
          ],
          "explanation": [
            "holder.external 仍是标记过的原始根对象，但 holder.nested 是另一个入口，Vue 在那里代理嵌套对象。两条路径字段看似相同，对象引用却不相同，所以原始引用的 Map 键无法命中代理引用。",
            "两个对象都保留相同 id，按这个域内唯一 ID 查找可以命中。它不能替代所有外部 API 的身份要求，也不能证明响应式开销下降；markRaw 还允许内部修改，是否追踪、谁释放图表实例仍须单独约定。"
          ]
        }
      ]
    },
    {
      "id": "virtual",
      "title": "固定高度窗口减少 DOM，不能省掉列表的身份与边界",
      "paragraphs": [
        "一万条订单同时创建 DOM，本身就是成本，即使每行对比很高效也不能消掉它。虚拟列表只创建可见区附近的行，滚动时更新窗口。固定高度模型可以按 scrollTop/rowHeight 计算范围，用 overscan 多渲染少量邻近行，配合总高度占位保留滚动长度。",
        "下面是可实际挂载的固定高度教学窗口：10000 行、每行 20px、视口 60px、overscan 为 1。初始显示 0—3，滚到 40px 显示 1—5，滚到底保留末行；清空数据时移除行并显示空状态。范围函数拒绝无效高度，避免除零和无限计算。预期 初始:4、中间:1,2,3,4,5:偏移20、末尾:9999:4、清空:0:没有匹配订单、非法高度:TypeError。",
        "这里使用稳定行 ID、绝对定位窗口与固定行高，没有完整实现生产虚拟控件。可变行高、图片加载后的尺寸、键盘焦点、读屏语义、定位到未挂载条目、草稿回收与滚动锚点都需要额外合同；不能因为看见行数变少就宣称复杂表格已经可访问且不会丢编辑。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref, computed, nextTick } from '/vue.mjs';\nfunction range(length, rowHeight, viewport, scrollTop, overscan) {\n  if (!Number.isSafeInteger(length) || length < 0 || !Number.isFinite(rowHeight) || rowHeight <= 0 ||\n      !Number.isFinite(viewport) || viewport < 0 || !Number.isFinite(scrollTop) ||\n      !Number.isSafeInteger(overscan) || overscan < 0) throw new TypeError('无效窗口参数');\n  if (length === 0 || viewport === 0) return { start: 0, end: 0, offset: 0 };\n  const top = Math.min(Math.max(0, scrollTop), Math.max(0, length * rowHeight - viewport));\n  const start = Math.max(0, Math.floor(top / rowHeight) - overscan);\n  const end = Math.min(length, Math.ceil((top + viewport) / rowHeight) + overscan);\n  return { start, end, offset: start * rowHeight };\n}\nconst items = ref(Array.from({ length: 10000 }, (_, id) => ({ id })));\nconst scroll = ref(0);\nconst windowRange = computed(() => range(items.value.length, 20, 60, scroll.value, 1));\nconst visible = computed(() => items.value.slice(windowRange.value.start, windowRange.value.end));\nconst root = document.createElement('div'); document.body.append(root);\nconst app = createApp({\n  setup: () => () => h('section', [\n    h('div', {\n      class: 'viewport', style: { height: '60px', overflow: 'auto' },\n      onScroll: event => { scroll.value = event.target.scrollTop; }\n    }, h('div', { style: { height: items.value.length * 20 + 'px', position: 'relative' } }, [\n      h('ul', { style: { position: 'absolute', top: '0', left: '0', margin: '0', padding: '0', listStyle: 'none',\n        transform: 'translateY(' + windowRange.value.offset + 'px)' } },\n        visible.value.map(item => h('li', { key: item.id, style: { height: '20px' } }, String(item.id))))\n    ])),\n    h('p', { role: 'status' }, items.value.length ? '' : '没有匹配订单')\n  ])\n});\napp.mount(root);\nconsole.log('初始:' + root.querySelectorAll('li').length);\nconst viewport = root.querySelector('.viewport');\nviewport.scrollTop = 40;\nviewport.dispatchEvent(new Event('scroll'));\nawait nextTick();\nconsole.log('中间:' + [...root.querySelectorAll('li')].map(li => li.textContent).join(',') + ':偏移' + windowRange.value.offset);\nviewport.scrollTop = 999999;\nviewport.dispatchEvent(new Event('scroll'));\nawait nextTick();\nconsole.log('末尾:' + root.querySelector('li:last-child').textContent + ':' + root.querySelectorAll('li').length);\nitems.value = []; await nextTick();\nconsole.log('清空:' + root.querySelectorAll('li').length + ':' + root.querySelector('[role=\"status\"]').textContent);\ntry { range(10, 0, 60, 0, 1); }\ncatch (reason) { console.log('非法高度:' + reason.name); }\napp.unmount(); root.remove();",
          "expectedOutput": [
            "初始:4",
            "中间:1,2,3,4,5:偏移20",
            "末尾:9999:4",
            "清空:0:没有匹配订单",
            "非法高度:TypeError"
          ],
          "explanation": [
            "60px 容纳 3 行，初始加下方 overscan 后共 4 行。滚到 40px 的首个可见行是 2，左右各多一行得到区间 [1,6)，DOM 为 1—5，窗口位移为 20px；总占位高度仍是 200000px。",
            "滚动超过最大值会被浏览器和范围计算限制在末尾，最后显示 9999，共 4 行。数据清空后范围立即变成零，移除所有 li 并给出空状态；非法高度抛错。这些是数量、位置与恢复的行为证据，不是生产滚动 FPS 基准，也没有完成交互式表格的焦点回收。"
          ]
        }
      ]
    },
    {
      "id": "batching",
      "title": "同步 watcher 可以把一批修改放大成多次工作",
      "paragraphs": [
        "默认 watcher 会合并同步批次，flush:sync 则在每次修改时立即执行。若回调里复制或排序大量数据，同一任务里连改三次可能做三遍。同步时机有其用途，但应该由必须立即响应的合同驱动，不能为了“更快拿到值”就全站改成 sync。",
        "下面先连续写入 1、2、3，再等待调度；预期 同步阶段:3,0、调度后:3,1、停止后:3,1。旧订阅是否仍执行也是复杂页面诊断的一部分；反复进入离开页面后工作量增长时，先检查资源是否释放，而不是再加缓存掩盖它。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { ref, watch, effectScope, nextTick } from '/vue.mjs';\nconst value = ref(0);\nconst calls = { sync: 0, batched: 0 };\nconst scope = effectScope();\nscope.run(() => {\n  watch(value, () => { calls.sync += 1; }, { flush: 'sync' });\n  watch(value, () => { calls.batched += 1; });\n});\nvalue.value = 1; value.value = 2; value.value = 3;\nconsole.log('同步阶段:' + [calls.sync, calls.batched].join(','));\nawait nextTick();\nconsole.log('调度后:' + [calls.sync, calls.batched].join(','));\nscope.stop(); value.value = 4; await nextTick();\nconsole.log('停止后:' + [calls.sync, calls.batched].join(','));",
          "expectedOutput": [
            "同步阶段:3,0",
            "调度后:3,1",
            "停止后:3,1"
          ],
          "explanation": [
            "sync 每次写入立即调用回调，所以同步阶段已累计 3。默认 watcher 此时仍等待批处理，nextTick 后执行一次，看到这一轮最终值。两者都遵守各自时机合同，不能单从次数宣布某种配置永远更好。",
            "停止 scope 后再次写入，两个计数都保持不变，说明本例没有遗留活动 watcher。组件订阅、外部事件、计时器和请求的清理责任各不相同，可回看 K08-04；减少当前可见组件并不会自动关闭独立的外部监听器。"
          ]
        }
      ]
    },
    {
      "id": "diagnosis",
      "title": "把发现组织成可验证的一条因果链",
      "paragraphs": [
        "对订单筛选卡顿，先固定数据量与操作，记录输入开始到哪一阶段耗时。若 CPU 时间集中在筛选/排序，检查是否在每轮 render 重算并能用纯派生缓存；若大量无关行更新，检查 props 或结果引用；若浏览器布局与绘制占主导，检查节点数量、尺寸读写和布局结构；若离开再回来越来越慢，检查外部资源与异步工作残留。",
        "优化前后必须复用同一组行为断言：当前结果与旧失败、空列表与恢复、排序后草稿身份、输入法组合、键盘焦点与滚动边界。调试结果若只表明少创建对象，但无法证明仍显示当前订单，就还没有完成任务。K08-05 的 memo 反例与 K08-06 的提交基线可作为检查参照。",
        "第一条实质边界是生产环境。开发钩子、热更新和教学数据会改变成本，不能把开发截图当作线上性能报告。第二条边界是观察范围。DOM 提交窗口不覆盖整次用户交互，响应式调度次数不等于浏览器绘制次数；第三条边界是数据所有权。shallowRef、markRaw 和 memo 都会改变通知或身份合同，不能用它们冻结需要更新的业务数据。",
        "复杂页面优先采用职责清楚的状态与已经适配的虚拟列表/图表工具；只有重复的实测瓶颈才值得增加手动缓存或定制窗口。不要为每一行套多个没有实际责任的包装组件，也不要为了少一个组件把权限、请求、草稿与布局揉成一个难验证的大组件。"
      ]
    },
    {
      "id": "practice",
      "title": "为一次优化写出“为什么更少工作”与“哪里仍正确”",
      "paragraphs": [
        "合上代码，预测 A 分支中修改 second 是否会触发渲染；切到 B 后再改 first，依赖集合应怎样变化？把 computed 的对象增加另一输出字段，检查只比较 even 会漏掉什么。将 shallowRef 例子改为只 push 新行，再解释为什么界面可能没更新。",
        "给窗口例子输入空数据、超末尾滚动、零视口与无效行高，核对范围与 DOM，再说明可变行高需要额外维护什么。给虚拟行加入未提交输入，指出为什么草稿要以业务 ID 保存在窗口之外，不能完全依靠会被回收的行组件。",
        "本篇没有新增已交付虚拟列表题，规划 E30、E32、E38 仍未开放，不显示空练习入口。先用完整作者示例验证机制，再在自己的生产构建中测真实场景；文末回忆卡核对依赖、浅层策略和列表边界。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Vue：Performance",
      "url": "https://vuejs.org/guide/best-practices/performance.html"
    },
    {
      "title": "Vue：Reactivity in Depth",
      "url": "https://vuejs.org/guide/extras/reactivity-in-depth.html"
    },
    {
      "title": "Vue：Reactivity Advanced",
      "url": "https://vuejs.org/api/reactivity-advanced.html"
    },
    {
      "title": "Vue：Lifecycle Hooks",
      "url": "https://vuejs.org/api/composition-api-lifecycle.html"
    },
    {
      "title": "Vue：Watchers",
      "url": "https://vuejs.org/guide/essentials/watchers.html"
    },
    {
      "title": "Chrome：Runtime Performance",
      "url": "https://developer.chrome.com/docs/devtools/performance"
    },
    {
      "title": "MDN：Performance mark",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark"
    }
  ]
};
