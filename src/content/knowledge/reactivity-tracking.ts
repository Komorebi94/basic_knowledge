import type { Article } from "../articles";

export const reactivityTrackingArticle: Article = {
  "id": "K08-01",
  "kind": "knowledge",
  "domainSlug": "vue",
  "slug": "reactivity-tracking",
  "title": "响应式依赖追踪",
  "summary": "Proxy、ref、解构为什么有不同影响。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "reactivity-tracking",
    "响应式依赖追踪"
  ],
  "tags": [
    "vue"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-13",
  "sections": [
    {
      "id": "problem",
      "title": "解构后再修改，为什么界面不跟着变？",
      "paragraphs": [
        "Vue 中读取 reactive 对象属性能形成依赖，但 const { count } = state 得到的是一次读取的数字。随后修改 state.count，局部 count 仍是旧数字。要解释差异，需要追踪谁在什么时候执行了属性读取，而不是只记“对象有响应式”。",
        "本文独立例子用 Proxy 展示读取拦截和依赖关系，是教学模型而非 Vue 的实现替代。Vue 3 框架片段需在安装 Vue 的项目中执行；实际 scheduler、嵌套代理和集合处理以公开文档为准。"
      ],
      "examples": [
        {
          "code": "let reads = 0;\nconst state = new Proxy({ count: 1 }, {\n  get(target, key, receiver) { reads++; return Reflect.get(target, key, receiver); }\n});\nconst { count } = state;\nstate.count = 2;\nconsole.log(count);\nconsole.log(state.count);\nconsole.log(reads);",
          "expectedOutput": [
            "1",
            "2",
            "2"
          ],
          "explanation": [
            "解构执行一次 get，把数字 1 存入普通绑定。读取 state.count 才再次走 get，返回 2。修改代理属性没有能力回头改写那个普通绑定。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "依赖记录是读取与活动计算之间的关系",
      "paragraphs": [
        "响应式系统在运行计算时记录当前活动 effect，属性 get 把这个 effect 与目标属性关联；set 通知相关订阅者重新计算。只有执行中实际访问的属性才可能成为依赖，条件分支会改变读取集合。",
        "ref 用 value 属性提供可追踪容器，reactive 用 Proxy 拦截对象。模板对 ref 的解包有方便规则，但普通 JavaScript 通常仍需 .value。不能把模板语法推广到数组、集合和所有嵌套场景。"
      ]
    },
    {
      "id": "tracking",
      "title": "一个完整但受限的依赖模型",
      "paragraphs": [
        "下面模型只处理单个原始属性与同步 effect，订阅集合避免重复注册。它用 active 指明当前计算，并在 finally 恢复，避免异常后残留错误归属。为了保持焦点，未实现分支依赖清理与嵌套 effect，不应用于生产。"
      ],
      "examples": [
        {
          "code": "let active = null;\nconst subscribers = new Set();\nconst state = new Proxy({ count: 1 }, {\n  get(target, key) { if (active && key === 'count') subscribers.add(active); return Reflect.get(target, key); },\n  set(target, key, value) { const changed = !Object.is(Reflect.get(target, key), value); Reflect.set(target, key, value); if (changed) [...subscribers].forEach(run => run()); return true; }\n});\nfunction effect(run) { function execute() { active = execute; try { run(); } finally { active = null; } } execute(); }\neffect(() => console.log(state.count * 2));\nstate.count = 2;\nstate.count = 2;",
          "expectedOutput": [
            "2",
            "4"
          ],
          "explanation": [
            "第一次活动计算读 count 并订阅，输出 2。修改为 2 通知重算输出 4；再次写同一值不通知。Vue 还需处理分支切换、调度和对象类型，模型不能推出这些完整细节。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "vue-code",
      "title": "保持属性关联，使用 toRef 或 toRefs",
      "paragraphs": [
        "以下 Vue 3 示例在项目模块中运行。toRef 建立与特定属性相连的 ref，后续通过该 ref 读取和修改都对应 state.count。只想保留一次快照时，普通解构反而正是所需语义。",
        "下面第二个代码块在独立 Vue 3.5.43 浏览器模块中实际运行，/vue.mjs 由 npm run verify:k08 提供的隔离服务加载。先观察初始 1 与调度后的 2，再停止 watcher；最后修改为 3，链接仍读到 3，但已停止的 watcher 不再输出。"
      ],
      "examples": [
        {
          "code": "const state = { count: 1 };\nconst link = { get value() { return state.count; }, set value(next) { state.count = next; } };\nconst snapshot = state.count;\nstate.count = 3;\nconsole.log(snapshot, link.value);\nlink.value = 4; console.log(state.count);",
          "expectedOutput": [
            "1 3",
            "4"
          ],
          "explanation": [
            "普通 getter/setter 说明关联容器的含义：读取时再访问原属性，写入也返回原属性。这不含 Vue 的依赖追踪，但准确区分链接与快照。"
          ],
          "language": "javascript"
        },
        {
          "language": "module",
          "code": "import { reactive, toRef, watchEffect, nextTick } from '/vue.mjs';\nconst state = reactive({ count: 1 });\nconst count = toRef(state, 'count');\nconst stop = watchEffect(() => console.log(count.value));\nstate.count = 2;\n// 默认调度可能合并更新；组件中由生命周期停止，独立使用时需 stop()。\nawait nextTick();\nstop();\nstate.count = 3;\nawait nextTick();\nconsole.log('停止后:' + count.value);",
          "expectedOutput": [
            "1",
            "2",
            "停止后:3"
          ],
          "explanation": [
            "toRef 每次通过 value 访问同一代理属性，所以初次 watchEffect 读到 1；state.count 改成 2 后，默认调度在 nextTick 前完成本轮重算并输出 2。",
            "stop 只停止观察工作，不删除 ref 与原属性的链接。随后写 3，count.value 仍为 3，但没有第三次 watcher 输出。独立模块显式停止，组件同步创建的 watcher 则由其生命周期管理。"
          ]
        }
      ]
    },
    {
      "id": "failure",
      "title": "绕过代理与替换根引用都会丢失关系",
      "paragraphs": [
        "直接修改原始对象而非代理，无法假定它会触发代理 set；业务应持有统一的响应式入口。另一个误区是把 reactive 变量整体换成另一个普通对象，原来订阅旧代理的读者不会自动连接新对象。需要可替换根值时通常用 ref 持有。",
        "解构对象属性若它本身是响应式对象，保留下来的引用可能仍有内部响应式行为；但原属性后来被替换，这个旧引用不会自动跟随。不要把“解构全失效”当作无条件口号，应区分原始值、引用与替换。"
      ]
    },
    {
      "id": "boundaries",
      "title": "追踪时间与身份的实质边界",
      "paragraphs": [
        "第一条边界是异步：watchEffect 仅追踪同步执行期间访问的依赖，await 之后才读取的值不能无条件认为已登记。第二条边界是身份：proxy 与原始对象不同，集合键和外部 API 可能关心身份，跨边界需明确转换责任。",
        "第三条边界是昂贵深层追踪。巨大对象的遍历有成本；shallowRef 等工具可用于外部不可变数据，但内部修改的通知规则不同。选它们是明确的所有权策略，不能只为减少重渲染就随意替换。"
      ]
    },
    {
      "id": "application",
      "title": "把读取路径保持在需要响应的计算里",
      "paragraphs": [
        "组件显示值、computed 和 watch source 要在执行时读取正确入口；提交时需要固定参数则显式创建快照。响应式链接与请求快照可以同时存在，各自服务不同时间合同。",
        "组合式函数返回 ref 使调用方解构后仍保持容器关系。返回值合同应说明哪些可写、哪些只读，以及外部持有的对象是否允许直接修改。",
        "以表单编辑为例，父模块拥有 reactive 用户对象，子模块解构 name 并把字符串交给异步保存。请求针对提交时的名称，字符串快照恰好合适；但若子模块想在界面实时显示父模块后来改名，就应保留 ref 或在计算中访问 user.name。相同解构语句放在不同责任边界，可能是正确快照，也可能是意外断链。",
        "调试时可以先在 computed 或 watchEffect 的同步代码中记录实际读取，再检查变化是不是经过同一代理。对象本身相等与否并不能回答属性是否被追踪；在活动计算之外读取再传数字，同样不会登记那个属性。依赖归属需要执行时机、读取入口和计算身份三者同时成立，这比把整个对象贴上“响应式”标签更能预测行为。"
      ]
    },
    {
      "id": "recall",
      "title": "追踪一个条件依赖",
      "paragraphs": [
        "假设显示模式 A 时读 first，模式 B 时读 second。问一次运行真正读了哪些字段，切换后旧订阅是否应清理，再判断哪个修改应该重算。",
        "回忆：为什么数字解构不继续响应？为什么 ref.value 不是无意义包装？可修改第三例，让链接指向嵌套对象并解释对象替换与旧引用的差别。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Vue：Reactivity in Depth",
      "url": "https://vuejs.org/guide/extras/reactivity-in-depth"
    },
    {
      "title": "Vue：Reactivity Fundamentals",
      "url": "https://vuejs.org/guide/essentials/reactivity-fundamentals"
    }
  ]
};
