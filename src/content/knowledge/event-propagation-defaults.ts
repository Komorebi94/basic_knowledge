import type { Article } from "../articles";

export const eventPropagationArticle: Article = {
  "id": "K04-03",
  "kind": "knowledge",
  "domainSlug": "browser",
  "slug": "event-propagation-defaults",
  "title": "事件传播与默认行为",
  "summary": "沿着一次列表点击推导捕获、目标与冒泡，区分取消默认行为和停止传播，并实现有范围约束、能清理的事件委托。",
  "aliases": [
    "event delegation",
    "capture",
    "bubbling",
    "preventDefault",
    "passive",
    "事件委托"
  ],
  "tags": [
    "浏览器",
    "Web 平台",
    "事件传播与默认行为"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "点的是图标，为什么列表和按钮都响应了？",
      "paragraphs": [
        "订单列表把删除逻辑挂在容器上，按钮里又有一个图标。点击图标后，按钮的统计监听和容器的删除监听都执行。开发者为了避免重复请求加入 stopPropagation，结果页面级统计也消失了。这个问题首先需要解释同一次事件如何到达多个监听器，然后才讨论业务动作该由谁负责。",
        "前置概念是 K01-02 的回调生命周期和 K04-01 的 DOM 树。事件对象描述一次发生，监听器是订阅；多个订阅不意味着浏览器生成了多次点击。本文所有 examples 在独立 HTTP 空白页运行，自己创建和移除 DOM，不需要网络或框架；dispatchEvent 是同步派发的合成事件，不等同于真实用户激活。"
      ]
    },
    {
      "id": "path",
      "title": "先建立传播路径，再按阶段调用监听器",
      "paragraphs": [
        "对普通 DOM 树中的可冒泡事件，可把传播理解成沿祖先向目标走，再沿祖先返回。捕获监听先在祖先执行；目标上的捕获与非捕获监听都处于目标阶段；随后执行祖先上的冒泡监听。eventPhase 区分这些阶段，不能把目标上的 capture:true 误认为仍是祖先捕获阶段。",
        "target 指向此次事件对当前监听器暴露的目标，currentTarget 指向正在调用监听器的节点。下面事件从 span 发起，因此父元素两次看到的 target 都是 span，currentTarget 都是外层 div。监听结束后不要异步依赖 currentTarget，需先保存所需节点或数据。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const host = document.createElement('div');\nconst leaf = document.createElement('span');\nhost.append(leaf); document.body.append(host);\nconst order = [];\nhost.addEventListener('lesson', e => order.push('capture:' + e.eventPhase), true);\nleaf.addEventListener('lesson', e => order.push('target:' + e.eventPhase));\nhost.addEventListener('lesson', e => {\n  order.push('bubble:' + e.eventPhase);\n  console.log(e.target === leaf, e.currentTarget === host);\n});\nleaf.dispatchEvent(new Event('lesson', { bubbles: true }));\nconsole.log(order.join(','));\nhost.remove();",
          "expectedOutput": [
            "true true",
            "capture:1,target:2,bubble:3"
          ],
          "explanation": [
            "host 是 leaf 的祖先，捕获时 phase 为 1；leaf 自身是目标，phase 为 2；返回 host 时 phase 为 3。先打印目标身份，再打印完整顺序，是因为 dispatchEvent 在返回之前同步完成监听器调用。",
            "默认构造的 Event 不冒泡，因此必须明确 bubbles:true。节点删除后此例不再持有长期引用；实际组件若订阅 window 或 document，移除组件节点不会自动移除那些全局监听器。"
          ]
        }
      ]
    },
    {
      "id": "cancel",
      "title": "取消默认行为和停止传播回答不同问题",
      "paragraphs": [
        "preventDefault 在事件可取消且当前监听器允许取消时，将默认行为标记为已取消。例如应用接管表单提交后阻止默认导航。它不阻止其他监听器观察这个事件。stopPropagation 阻止继续到其他节点，却不阻止当前节点上尚未执行的监听器；stopImmediatePropagation 才会同时阻止当前节点后续监听器。",
        "错误实现是给每个按钮都加 stopPropagation，以为这可以取消链接导航或防止双提交。导航可能照常发生，而依赖冒泡的委托反而失效。修复时保留一次提交的明确所有权，用业务状态或请求幂等处理重复操作，只在必要时取消可取消的默认行为。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const parent = document.createElement('div');\nconst button = document.createElement('button');\nparent.append(button);\nconst seen = [];\nparent.addEventListener('save', () => seen.push('parent'));\nbutton.addEventListener('save', e => { e.preventDefault(); e.stopPropagation(); seen.push('first'); });\nbutton.addEventListener('save', () => seen.push('second'));\nconst event = new Event('save', { bubbles: true, cancelable: true });\nconsole.log(button.dispatchEvent(event));\nconsole.log(event.defaultPrevented, seen.join(','));\nconst fixed = new Event('save', { bubbles: true });\nbutton.dispatchEvent(fixed);\nconsole.log(fixed.defaultPrevented);",
          "expectedOutput": [
            "false",
            "true first,second",
            "false"
          ],
          "explanation": [
            "第一个事件允许取消，preventDefault 使 dispatchEvent 返回 false；stopPropagation 使 parent 不执行，但同一 button 的 second 仍执行。第二个事件不允许取消，defaultPrevented 保持 false。",
            "save 是教学自定义事件，没有浏览器自带的保存动作。这里验证的是取消标志和监听顺序；真实表单是否提交，还需以浏览器交互验证，不能从合成事件推断所有默认动作。"
          ]
        }
      ]
    },
    {
      "id": "delegation",
      "title": "委托要同时匹配动作和所属容器",
      "paragraphs": [
        "容器监听依靠冒泡处理动态孩子。点击图标时 target 不是按钮，所以先把目标收窄为 Element，再用 closest 找最近动作按钮，最后确认按钮位于本容器中。如果容器自身位于另一个带动作属性的祖先里，缺少 contains 校验可能越界匹配；嵌套列表还需定义哪个列表拥有动作。",
        "下面只允许 remove 动作，数据来自按钮的 data-id。真实项目还应校验 ID 与当前数据集的关系，不能把 DOM 中的字符串当成授权证明。AbortController 代表这次挂载的订阅生命周期，卸载时 abort，无需再拼出同一个匿名函数。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const list = document.createElement('div');\nconst button = document.createElement('button');\nbutton.type = 'button'; button.dataset.action = 'remove'; button.dataset.id = 'row-7';\nconst icon = document.createElement('span');\nbutton.append(icon); list.append(button); document.body.append(list);\nconst lifecycle = new AbortController();\nconst removed = [];\nlist.addEventListener('click', e => {\n  if (!(e.target instanceof Element)) return;\n  const action = e.target.closest('button[data-action=\"remove\"]');\n  if (!(action instanceof HTMLButtonElement) || !list.contains(action)) return;\n  removed.push(action.dataset.id);\n}, { signal: lifecycle.signal });\nicon.dispatchEvent(new MouseEvent('click', { bubbles: true }));\nlifecycle.abort();\nicon.dispatchEvent(new MouseEvent('click', { bubbles: true }));\nconsole.log(removed.join(','));\nlist.remove();",
          "expectedOutput": [
            "row-7"
          ],
          "explanation": [
            "第一次点击从 span 冒泡，closest 找到 button，范围检查通过，于是记录 row-7。abort 移除本次订阅；第二次事件仍可派发，却没有处理器再写入数组。",
            "按钮使用原生 button 和 type=button，不把不可聚焦的 div 假装成按钮。此例没有真的删除数据，避免将事件机制与业务持久化混为一个操作。"
          ]
        }
      ]
    },
    {
      "id": "passive",
      "title": "passive 是不取消的承诺，once 是订阅次数限制",
      "paragraphs": [
        "浏览器处理滚轮或触摸时，可能需要先知道脚本是否会阻止滚动。passive:true 明确承诺监听器不调用 preventDefault，使浏览器能采用相应调度；它不减少你的计算量，也不自动节流。若确实要接管手势，应先确认 CSS touch-action 能否表达约束，再在必要的事件类型上显式配置 passive:false，并验证原生滚动和辅助输入。",
        "错误实现是在 passive:true 的 touchmove 中调用 preventDefault。取消会被忽略，代码却继续假定页面没有滚动。修复要根据事件的 cancelable 和 defaultPrevented 判断事实，不通过隐藏控制台警告掩盖冲突。once:true 只在监听器实际被调用后移除，不是“这个元素一生只能点击一次”；每次重新注册都创建新的生命周期。"
      ]
    },
    {
      "id": "shadow",
      "title": "跨 Shadow DOM 时，目标和路径需要重新解释",
      "paragraphs": [
        "Shadow DOM 为组件提供封装边界。事件能否跨出影子树由 composed 等规则决定；在外部监听器看到的 target 可能被重定向为宿主。composedPath 可以帮助理解本次可见路径，但 closed shadow root 的内部节点不会随意暴露给外部观察者。不要假设 target.closest 一定能穿越所有组件内部。",
        "工程上，组件可通过明确的自定义事件公布“选择了条目”这类领域动作，并选择是否冒泡与跨边界。父页面不需要窥探内部按钮结构。这个设计减少委托与实现细节的耦合，同时要求事件载荷经过校验，事件本身不承担鉴权。"
      ]
    },
    {
      "id": "boundaries",
      "title": "没有冒泡和没有用户激活，是两种不同边界",
      "paragraphs": [
        "第一条边界是事件类型。focus 等事件不按 click 的方式冒泡，委托可以采用捕获或选用相应的 focusin；不能把一个委托方案推广到所有事件。第二条边界是用户激活。脚本 dispatchEvent 的 isTrusted 为 false，不会凭空获得剪贴板、弹窗或设备权限；即使处理器被调用，受限 API 仍可能拒绝。",
        "委托适合动态且动作一致的大列表；少量独立控件用直接监听更清楚。框架的事件层可能另有挂载和调度规则，应先确认它的合同，再解释原生路径。不要为了减少监听器数量牺牲动作所有权、可访问性和清理可读性。"
      ]
    },
    {
      "id": "practice",
      "title": "从传播证据定位重复动作",
      "paragraphs": [
        "遇到一次点击触发两次请求，先在可疑监听器记录事件类型、target、currentTarget、phase 和请求调用栈，再确认是否有两次注册、两层业务处理或真正两次输入。日志应只记录定位所需的信息，不带订单敏感字段。通过证据决定修复，而不是到处阻止传播。",
        "自行改写第一个例子：去掉 bubbles，预测捕获是否仍发生；把 stopPropagation 换成 stopImmediatePropagation，预测 second 是否执行。配套 E26 仍是待制作的 DOM 练习，本文提供可运行的机制实验，不把未交付题目显示为可练。"
      ]
    }
  ],
  "sources": [
    {
      "title": "DOM Standard：事件派发",
      "url": "https://dom.spec.whatwg.org/#dispatching-events"
    },
    {
      "title": "MDN：addEventListener 选项与清理",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener"
    }
  ]
};
