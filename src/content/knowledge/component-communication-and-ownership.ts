import type { Article } from "../articles";

export const componentCommunicationOwnershipArticle: Article = {
  "revision": 2,
  "id": "K08-03",
  "kind": "knowledge",
  "domainSlug": "vue",
  "slug": "component-communication-and-ownership",
  "title": "组件通信与状态所有权",
  "summary": "从侧栏与编辑器的数量不同步出发，解释 props、事件、v-model 和注入如何传递值与修改请求，并用独立草稿保留取消、校验与冲突边界。",
  "aliases": [
    "props emits",
    "provide inject",
    "v-model",
    "state ownership",
    "组件通信",
    "状态所有权"
  ],
  "tags": [
    "Vue",
    "组件通信",
    "状态所有权"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-15",
  "sections": [
    {
      "id": "problem",
      "title": "同一个数量，为什么侧栏和编辑器会各说各话？",
      "paragraphs": [
        "商品页的侧栏显示已选数量，编辑器允许加减。如果两个组件各用 ref(props.quantity) 建一份状态，编辑器改成 2 后，侧栏仍显示 1；如果子组件直接改传入的订单对象，侧栏虽然跟着变，父级却没有机会校验库存。问题的关键不是消息能否传到，而是谁有权确认这次变更。",
        "本文沿同一个订单编辑场景建立三条结论：共享事实只由一个所有者提交；子组件用事件表达请求；需要取消的编辑是独立草稿，不能悄悄与已提交值混为一谈。通信方式再按组件距离选择，父子用 props/emits，深层后代可以注入，跨页面共享再评估状态存储。",
        "前置阅读是 K08-01「响应式依赖追踪」和 K08-02「computed、watch 与副作用」：ref 保存响应式值，computed 从当前来源派生，nextTick 等待 Vue 已排队的 DOM 更新。文中的所有示例都是完整的 ES 模块，使用真实 Vue 3 运行时；h 创建虚拟节点，作用相当于对应模板，不需要单文件组件编译器。",
        "复现环境：运行 npm run verify:k08-03，脚本在临时 loopback 页面提供 /vue.mjs 并逐个执行作者示例。手动复现时，可把 node_modules/vue/dist/vue.esm-browser.js 复制为静态站点根目录的 vue.mjs，把一个示例放进空 HTML 的 script type=\"module\" 中，通过本地 HTTP 服务打开。每个示例单独运行；不要在本站主页面的控制台执行。若放进自己的 Vue 项目，把 import 来源改为 vue。实际核验版本记录在内部报告，本文 API 适用于 Vue 3，defineModel 的版本要求另行说明。"
      ]
    },
    {
      "id": "copies",
      "title": "响应式不等于自动同步两份副本",
      "paragraphs": [
        "先不挂载组件，只观察值的关系。ref(parent.value) 读取的是创建那一刻的数字，新 ref 不会记住“数字来自 parent”。之后父级或本地发生变化，只会改变各自的存储。computed 则在读取时保留来源关系，不需要再写一个 watch 维护第二份已提交数量。",
        "下面把错误的“副本充当共享事实”与正确的派生读取放在一起。预期三行依次是 1,2,1、3,2,3、6。它不是说本地副本永远错误；只有当副本也声称代表同一份已提交事实时，才会产生矛盾。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { ref, computed } from '/vue.mjs';\nconst quantity = ref(1);\nconst editorCopy = ref(quantity.value);\nconst sidebar = computed(() => quantity.value);\neditorCopy.value = 2;\nconsole.log([quantity.value, editorCopy.value, sidebar.value].join(','));\nquantity.value = 3;\nconsole.log([quantity.value, editorCopy.value, sidebar.value].join(','));\nconst subtotal = computed(() => quantity.value * 2);\nconsole.log(subtotal.value);",
          "expectedOutput": [
            "1,2,1",
            "3,2,3",
            "6"
          ],
          "explanation": [
            "第一次修改只写 editorCopy，quantity 仍是 1，侧栏读取的也仍是 1。随后父级改成 3，本地副本没有被赋值，所以停在 2；侧栏通过 computed 读当前来源，得到 3。",
            "小计 6 由当前数量 3 乘单价 2 得出。它没有自己的提交入口，不需要同步三份数据。这里仅核对响应式值；涉及 DOM 的后续例子会等待 nextTick，不能从同步读取推断 DOM 已更新。"
          ]
        }
      ]
    },
    {
      "id": "props",
      "title": "props 限制顶层赋值，却不是订单对象的深层防护墙",
      "paragraphs": [
        "父级把订单作为 prop 交给子级，意思是允许读取当前订单，并没有把订单的业务所有权转交过去。Vue 在开发运行时限制 setup 中 props 顶层属性的写入；嵌套对象仍可能是同一份响应式对象，直接改 props.order.quantity 会绕过父级的校验函数。能触发更新只说明依赖追踪有效，不说明业务操作合法。",
        "以下明确是错误实现：子组件在按钮事件中直接改订单内部数量。初始是 1，点击后父级也看到 2，但父级变更回调调用次数是 0。示例没有给父级传这个回调，所以显示出“数据变了，所有者却没有收到请求”的问题。真实项目应发出带必要载荷的事件，由父级执行变更。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, reactive, nextTick } from '/vue.mjs';\nconst order = reactive({ quantity: 1 });\nlet requests = 0;\nconst WrongEditor = {\n  props: { order: { type: Object, required: true } },\n  emits: ['request-change'],\n  setup(props) {\n    return () => h('button', {\n      onClick: () => { props.order.quantity += 1; }\n    }, '错误示例：直接改订单');\n  }\n};\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({\n  setup: () => () => h(WrongEditor, {\n    order,\n    onRequestChange: () => { requests += 1; }\n  })\n});\napp.mount(root);\nconsole.log(order.quantity);\nroot.querySelector('button').click();\nawait nextTick();\nconsole.log(order.quantity + ':' + requests);\napp.unmount();\nroot.remove();",
          "expectedOutput": [
            "1",
            "2:0"
          ],
          "explanation": [
            "父级和 props.order 持有同一订单对象。按钮把对象内部字段加一，所以父级观察到 2；这一写入从未调用 emit，requests 仍为 0。没有报错并不表示状态所有权得到了保护。",
            "顶层替换 props.order 与内部写 props.order.quantity 是不同操作。修复应让子级发请求，或明确约定一个紧密耦合的共享可写对象；不能把 Vue 开发警告当作深层不可变、安全授权或生产输入验证。"
          ]
        }
      ]
    },
    {
      "id": "controlled",
      "title": "完整编辑器：事件请求变更，父级统一校验并提交",
      "paragraphs": [
        "把数量放到两个组件最近的共同父级。侧栏读取这个 ref，编辑器接收 modelValue，点击后发出 update:modelValue。父级接到数字后检查是否为 1—5 的整数，接受时提交，拒绝时保留原数量并显示原因。这里“1—5”是作者定义的业务合同，不是 Vue 的限制。",
        "示例保留原生 input 的临时文字，点击提交才尝试修改共享数量；这份文字只属于编辑器，而父级数量才是侧栏的事实源。输入空字符串会转换成 0 并被拒绝，文字会转换成 NaN 并被拒绝，超范围或小数也不能提交；这些状态不会被伪装成数量 0。",
        "预期先显示 数量:1，提交 2 后显示 数量:2，再提交 9 时仍是 数量:2 并显示范围错误，最后提交 3 恢复成功。输入元素有可访问名称，错误使用 role=status 通知。事件载荷只是客户端请求，服务端库存和权限仍要由接口校验。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref, nextTick } from '/vue.mjs';\nconst QuantityEditor = {\n  props: { modelValue: { type: Number, required: true } },\n  emits: ['update:modelValue'],\n  setup(props, { emit }) {\n    const draftText = ref(String(props.modelValue));\n    return () => h('div', [\n      h('input', {\n        'aria-label': '待提交数量', value: draftText.value,\n        onInput: event => { draftText.value = event.target.value; }\n      }),\n      h('button', {\n        onClick: () => emit('update:modelValue', Number(draftText.value))\n      }, '提交数量')\n    ]);\n  }\n};\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({\n  setup() {\n    const quantity = ref(1);\n    const error = ref('');\n    function commit(next) {\n      if (!Number.isInteger(next) || next < 1 || next > 5) {\n        error.value = '数量必须是 1—5 的整数';\n        return;\n      }\n      quantity.value = next;\n      error.value = '';\n    }\n    return () => h('main', [\n      h('output', '数量:' + quantity.value),\n      h(QuantityEditor, {\n        modelValue: quantity.value, 'onUpdate:modelValue': commit\n      }),\n      h('p', { role: 'status' }, error.value)\n    ]);\n  }\n});\napp.mount(root);\nconsole.log(root.querySelector('output').textContent);\nasync function submit(text) {\n  const input = root.querySelector('input');\n  input.value = text;\n  input.dispatchEvent(new Event('input', { bubbles: true }));\n  root.querySelector('button').click();\n  await nextTick();\n  console.log(root.querySelector('output').textContent + '|' +\n    root.querySelector('[role=\"status\"]').textContent);\n}\nawait submit('2');\nawait submit('9');\nawait submit('');\nawait submit('abc');\nawait submit('2.5');\nawait submit('3');\napp.unmount();\nroot.remove();",
          "expectedOutput": [
            "数量:1",
            "数量:2|",
            "数量:2|数量必须是 1—5 的整数",
            "数量:2|数量必须是 1—5 的整数",
            "数量:2|数量必须是 1—5 的整数",
            "数量:2|数量必须是 1—5 的整数",
            "数量:3|"
          ],
          "explanation": [
            "input 事件同步保存 draftText，提交按钮把它转换为数字，emit 同步调用父级 listener。父级提交 ref 后，Vue 排队更新视图；await nextTick 之后读 output 才是本次渲染的结果。2 合法，侧栏显示 2。",
            "9、空串、abc 和 2.5 分别超界、转换成 0、转换成 NaN、不是整数，均命中同一提交校验。父级不改 quantity，侧栏保持 2，草稿仍可编辑。随后 3 被接受，错误清空，说明失败后可以恢复。",
            "为了明确提交时机，此处没有自动把父级新值覆盖到 draftText。若还有外部刷新，必须定义重置或冲突策略，下一节给出版本化草稿；简单 watch 双向复制会吞掉正在输入的内容。"
          ]
        }
      ]
    },
    {
      "id": "model",
      "title": "v-model 缩短接线，并没有取消所有权",
      "paragraphs": [
        "上例的 modelValue 和 update:modelValue 是默认组件 v-model 的公开合同。在模板中，v-model=\"quantity\" 把父级的值传给子级，并连接更新事件；在渲染函数中我们显式写出了这两条线。若默认生成的赋值不符合校验要求，可以像上例一样显式绑定值和 commit，让所有提交经过同一个入口。",
        "Vue 3.4 起可在单文件组件的 script setup 中使用 defineModel。它是编译宏，会建立对应 prop、更新事件和模型 ref，不是可以直接从运行时导入后调用的普通函数。上例采用显式合同，避免浏览器示例依赖 SFC 编译。命名 v-model 对应自己的 prop 和 update 事件；一次“保存订单”同时涉及数量和地址时，更适合一个提交事件表达事务，而不是靠两个独立 model 更新假装原子提交。",
        "容易忽略的失败路径是只在子级提供模型默认值，父级绑定的 ref 却是 undefined。子级可能显示默认的 1，父级仍未持有 1。工程上应由所有者初始化共享事实，或者明确支持“尚未选择”的状态；不要凭界面显示推断已经提交。"
      ]
    },
    {
      "id": "draft",
      "title": "草稿不是重复状态：取消与冲突必须有单独的语义",
      "paragraphs": [
        "需要确认、取消的编辑不能实时改已提交订单。这时副本代表“用户计划提交的新值”，是另一个领域概念。打开编辑器时复制需要编辑的原始字段和版本；取消只销毁草稿，保存先检查基础版本是否仍对应当前订单。不要用 Object.assign({}, order) 假装已经复制嵌套地址，嵌套对象仍可能共享；本文只有数字字段，浅复制足够。",
        "下面是一个本地同步提交模型，使用真实 reactive，但没有网络接口。预期分别是 1:2、false:4、true:3。先改草稿，不影响已提交值；模拟外部刷新后旧草稿保存被拒绝；用户重新打开后基于新版本保存成功。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { reactive } from '/vue.mjs';\nconst order = reactive({ quantity: 1, revision: 1 });\nfunction openDraft() {\n  return { quantity: order.quantity, baseRevision: order.revision };\n}\nfunction save(draft) {\n  if (draft.baseRevision !== order.revision) return false;\n  if (!Number.isInteger(draft.quantity) ||\n      draft.quantity < 1 || draft.quantity > 5) return false;\n  order.quantity = draft.quantity;\n  order.revision += 1;\n  return true;\n}\nlet draft = openDraft();\ndraft.quantity = 2;\nconsole.log(order.quantity + ':' + draft.quantity);\norder.quantity = 4;\norder.revision += 1;\nconsole.log(save(draft) + ':' + order.quantity);\ndraft = openDraft();\ndraft.quantity = 3;\nconsole.log(save(draft) + ':' + order.quantity);",
          "expectedOutput": [
            "1:2",
            "false:4",
            "true:3"
          ],
          "explanation": [
            "草稿数量 2 和已提交数量 1 分开保存，取消时可以直接丢弃 draft。外部刷新把 revision 改成 2，草稿仍基于 1，保存函数返回 false，保留已经刷新的 4。",
            "重新打开拿到版本 2，再保存 3 被接受，版本递增。真实页面应把 false 分成“输入无效”和“版本冲突”并显示可恢复提示；真实多人写入还要由服务器做条件更新，客户端版本比较不能阻止两次网络请求在服务器互相覆盖。"
          ]
        }
      ]
    },
    {
      "id": "events",
      "title": "组件事件只交给直接监听者，不会沿组件树自动冒泡",
      "paragraphs": [
        "把编辑器包进布局组件后，祖父级监听保存事件却收不到，常见原因是误把组件 emit 当成 DOM 冒泡。组件事件只通知直接绑定的 listener。需要穿过包装层时显式转发，或者在深层且有清晰作用域时使用注入。不要用全局事件总线掩盖这条边界，否则订阅和释放、事件来源与页面作用域都会变得不清楚。",
        "下面为两种包装器各挂载一次。故意错误的第一种声明 save 却没有转发，第二种明确连接 onSave 并重新 emit。预期分别是 丢失:0 与 转发:1。两种都设置 inheritAttrs:false，避免把未声明的 listener 透传给根组件后，碰巧收到事件，掩盖“不是冒泡”的事实。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h } from '/vue.mjs';\nconst Editor = {\n  emits: ['save'],\n  setup(_props, { emit }) {\n    return () => h('button', { onClick: () => emit('save', 2) }, '保存');\n  }\n};\nfunction run(forward) {\n  let received = 0;\n  const Wrapper = {\n    inheritAttrs: false,\n    emits: ['save'],\n    setup(_props, { emit }) {\n      return () => forward\n        ? h(Editor, { onSave: value => emit('save', value) })\n        : h(Editor);\n    }\n  };\n  const root = document.createElement('div');\n  document.body.append(root);\n  const app = createApp({\n    setup: () => () => h(Wrapper, {\n      onSave: value => { if (value === 2) received += 1; }\n    })\n  });\n  app.mount(root);\n  root.querySelector('button').click();\n  console.log((forward ? '转发:' : '丢失:') + received);\n  app.unmount();\n  root.remove();\n}\nrun(false);\nrun(true);",
          "expectedOutput": [
            "丢失:0",
            "转发:1"
          ],
          "explanation": [
            "按钮点击是原生 DOM 事件，但 Editor 在其回调里 emit 的 save 是组件事件。没有转发时，Wrapper 没有连接 Editor 的 save listener，祖父 listener 因而没有收到载荷。",
            "显式转发先把 Editor 的 2 交给 Wrapper，再由 Wrapper 通知自己的监听者，累计一次。此例验证的是组件事件，不推断原生 click 的冒泡规则；根节点 listener 透传也是另一套规则。"
          ]
        }
      ]
    },
    {
      "id": "injection",
      "title": "深层共享：提供只读值和由所有者执行的命令",
      "paragraphs": [
        "订单数量要经过多层布局才能到按钮时，provide/inject 可以减少中间 props 转发。使用共享的 Symbol 作为 key，并让提供者同时提供 readonly(quantity) 和 changeQuantity；消费方读数量、调用命令，而不直接写 ref。readonly 防止通过这份代理随意写入，但不是权限隔离；提供者仍可以通过原始 ref 更新它。",
        "注入发生在 setup 中。传入 ref 时接收者获得的仍是 ref，而不是数字快照；读取 .value 才能保留后续更新。直接 provide(key, quantity.value) 只提供当时数字，没有响应式连接。必需的 provider 缺失时应明确报配置错误，不能创建一份隐形备用订单把错误掩盖成正常空数据。可选主题配置才适合有意提供默认值。",
        "下面根组件提供订单上下文，中间层只渲染子组件，按钮消费注入的只读数量和命令。另一个没有提供者的按钮演示明确的缺失状态。预期是 1|未提供订单、2|未提供订单、原值:2:只读:true。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "import { createApp, h, ref, provide, inject,\n  readonly, isReadonly, nextTick } from '/vue.mjs';\nconst orderKey = Symbol('order');\nconst quantity = ref(1);\nconst publicQuantity = readonly(quantity);\nconst Consumer = {\n  setup() {\n    const order = inject(orderKey, null);\n    if (!order) return () => h('p', { role: 'alert' }, '未提供订单');\n    return () => h('button', {\n      onClick: () => order.changeQuantity(order.quantity.value + 1)\n    }, String(order.quantity.value));\n  }\n};\nconst Layout = { setup: () => () => h(Consumer) };\nconst Provider = {\n  setup() {\n    provide(orderKey, {\n      quantity: publicQuantity,\n      changeQuantity(next) {\n        if (Number.isInteger(next) && next >= 1 && next <= 5) {\n          quantity.value = next;\n        }\n      }\n    });\n    return () => h(Layout);\n  }\n};\nconst root = document.createElement('div');\ndocument.body.append(root);\nconst app = createApp({ setup: () => () => h('main', [h(Provider), h(Consumer)]) });\napp.mount(root);\nfunction read() {\n  return root.querySelector('button').textContent + '|' +\n    root.querySelector('[role=\"alert\"]').textContent;\n}\nconsole.log(read());\nroot.querySelector('button').click();\nawait nextTick();\nconsole.log(read());\nconsole.log('原值:' + quantity.value + ':只读:' + isReadonly(publicQuantity));\napp.unmount();\nroot.remove();",
          "expectedOutput": [
            "1|未提供订单",
            "2|未提供订单",
            "原值:2:只读:true"
          ],
          "explanation": [
            "Provider 的后代 Consumer 找到 orderKey，Layout 无须转发。旁边 Consumer 不在 Provider 的后代链中，得到显式默认 null 并显示缺失提示；“出现在同一个页面”不等于“能拿到那个注入”。",
            "按钮通过 changeQuantity 请求 2，提供者校验后改原 ref，readonly 视图也读到 2。nextTick 后按钮文字变化，缺失提示保留。isReadonly 为 true 验证对外代理只读，但这里没有尝试破坏代理，也没有测试网络权限。"
          ]
        }
      ]
    },
    {
      "id": "scope",
      "title": "放到父级、注入还是 store，先看生命周期和修改责任",
      "paragraphs": [
        "本文的选择建议是按所有权和存活范围判断：只有编辑器需要的输入文字留在本地；侧栏与编辑器共同需要的数量放到共同父级；订单工作区内的深层后代通过该工作区注入；多个独立页面需要同一会话事实时才考虑 store。store 改变的是共享位置和访问方式，仍需要统一的提交入口，不会自动处理草稿、服务端冲突或缓存新鲜度。",
        "一个实质边界是作用域。注入只沿祖先链查找，遇到相同 key 取最近的提供者。对不同订单分别建立 provider，可以让两个编辑区互不干扰；也因此不要在嵌套布局中无意提供同一个 key。跨树共享与路由持久化需另设所有者，不能假设 inject 是全局广播。",
        "另一个边界是运行时生命周期。模块顶层共享 ref 在单一浏览器会话可成为共享实例，但 SSR 的服务端模块可能被多个请求复用，不能把请求用户的订单放在那份实例中。应按应用或请求创建实例并注入；页面离开后草稿是否保留也要明确，不能由“恰好用了全局变量”决定。",
        "本文没有引入真实接口。服务端订单需区分加载中、尚未选择、订单不存在、读取失败与已就绪；不能用默认数量 1 将这些状态全部覆盖。提交失败应保留可重试草稿，冲突应允许重新读取或人工合并。实时同步所有字段的方案操作更少，却没有天然的取消边界；独立草稿多一套状态，却能表达确认和取消，两者应由产品行为决定。"
      ]
    },
    {
      "id": "practice",
      "title": "用一个新变化检查你的所有权设计",
      "paragraphs": [
        "先合上代码，推导“数量变成 5，再输入 6”时侧栏、草稿和错误分别显示什么。再添加一个外部刷新，把已提交数量从 2 改成 4：实时受控视图应显示 4，有未提交草稿的编辑器却不能无声覆盖用户输入。为它选择显式重置或版本冲突，并说明谁执行这个决定。",
        "进一步练习：把事件示例的包装器多加一层，指出需要在哪里转发；同时挂载两份 Provider，各自创建 quantity，确认按钮互不影响。若把 quantity 创建移到共同模块，两份 provider 可能共享同一事实，作用域就改变了。",
        "本主题当前没有专属判题练习，先运行本文完整示例，再改变输入验证失败路径。练习页已发布的相邻模型不能代替本主题的验收。这些 JavaScript 练习不挂载 Vue；框架机制仍按本文注明的真实实验核对。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Vue：Props",
      "url": "https://vuejs.org/guide/components/props.html"
    },
    {
      "title": "Vue：Component Events",
      "url": "https://vuejs.org/guide/components/events.html"
    },
    {
      "title": "Vue：Component v-model",
      "url": "https://vuejs.org/guide/components/v-model.html"
    },
    {
      "title": "Vue：Provide / Inject",
      "url": "https://vuejs.org/guide/components/provide-inject.html"
    },
    {
      "title": "Vue：State Management",
      "url": "https://vuejs.org/guide/scaling-up/state-management.html"
    },
    {
      "title": "Vue：Server-Side Rendering",
      "url": "https://vuejs.org/guide/scaling-up/ssr.html"
    }
  ]
};
