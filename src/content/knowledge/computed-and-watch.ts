import type { Article } from "../articles";

export const computedAndWatchArticle: Article = {
  "id": "K08-02",
  "kind": "knowledge",
  "domainSlug": "vue",
  "slug": "computed-and-watch",
  "title": "computed、watch 与副作用",
  "summary": "缓存、触发、清理和执行时机如何选择。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "computed-and-watch",
    "computed、watch 与副作用"
  ],
  "tags": [
    "vue"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "筛选结果要用 computed 还是 watch？",
      "paragraphs": [
        "列表随查询词变化，开发者用 watch 更新另一份 filtered 状态。查询和列表改变时都要维护，漏掉一个来源就显示旧结果。若结果只是输入的纯函数，computed 表达派生关系；若变化要触发请求、存储或第三方调用，才需要副作用观察。",
        "本文以独立 JavaScript 缓存与清理模型说明核心概念，并给 Vue 3 完整项目片段。模型不模拟全部 Vue 调度；尤其不能从同步输出推断框架 watcher 的默认执行时机。"
      ],
      "examples": [
        {
          "code": "let input = 2, dirty = true, cached = 0, calls = 0;\nfunction read() { if (dirty) { cached = input * 3; calls++; dirty = false; } return cached; }\nfunction set(value) { if (!Object.is(input, value)) { input = value; dirty = true; } }\nconsole.log(read(), read(), calls);\nset(4); console.log(read(), calls);",
          "expectedOutput": [
            "6 6 1",
            "12 2"
          ],
          "explanation": [
            "第一次读取执行计算并缓存，第二次复用。输入变化使缓存失效，下次读取重算。Vue 的 computed 基于响应式依赖维护失效，而不是由业务手工调用 set。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "computed 声明一个可随输入推导的值",
      "paragraphs": [
        "computed getter 应保持纯粹：不发送请求，不修改它依赖的状态，不依赖不可追踪的 Date.now 自动刷新。响应式依赖变化时缓存需要重新计算，普通时间流逝不会触发一个没有响应式输入的计算。",
        "watch 明确指定 source，比较来源变化后执行回调，适合需要 old/new 值或精确触发边界的副作用。watchEffect 运行并自动收集同步读取依赖，适合依赖容易与实现保持一致的同步过程。二者都不是复制派生状态的首选。"
      ]
    },
    {
      "id": "sources",
      "title": "观察 source 时保留读取关系",
      "paragraphs": [
        "watch(state.count, ...) 传入的是当时数字，不是可观察 getter。应传 ref，或写 () => state.count。直接观察 reactive 对象具有深层语义，getter 返回对象的默认关注点又不同，要按想要的变化范围选择。"
      ],
      "examples": [
        {
          "code": "const state = { count: 1 };\nconst fixed = state.count;\nconst source = () => state.count;\nstate.count = 5;\nconsole.log(fixed);\nconsole.log(source());",
          "expectedOutput": [
            "1",
            "5"
          ],
          "explanation": [
            "数字已经固定，getter 每次执行重新读取。这个例子没有 watcher，只说明为什么 source 不能提前求成原始值；框架还需要在 getter 执行时追踪依赖。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "vue-code",
      "title": "完整场景：派生列表与可停止的请求分开",
      "paragraphs": [
        "下面代码用于 Vue 3 项目，列表 computed 负责本地派生，watch 负责 query 的远程同步。cleanup 取消旧等待，active 同时保护成功和失败路径。网络端点必须由调用方提供，没有虚构服务地址。"
      ],
      "examples": [
        {
          "code": "let activeToken = 0; let value = '初始';\nfunction observe() { const token = ++activeToken; let active = true; return { cleanup() { active = false; }, finish(next) { if (active && token === activeToken) value = next; } }; }\nconst old = observe(); old.cleanup();\nconst current = observe(); old.finish('旧结果');\nconsole.log(value); current.finish('当前结果'); console.log(value);",
          "expectedOutput": [
            "初始",
            "当前结果"
          ],
          "explanation": [
            "旧轮已清理且身份过期，无法改值。当前轮可以更新。清理只解除本轮责任，真实网络仍需服务器权限和写操作幂等合同。"
          ],
          "language": "javascript"
        }
      ],
      "code": "import { ref, computed, watch } from 'vue';\nexport function useSearch(fetchItems) {\n  const query = ref('');\n  const items = ref([]);\n  const error = ref('');\n  const visible = computed(() => items.value.filter(item => item.title.includes(query.value)));\n  const stop = watch(query, (value, _old, onCleanup) => {\n    const controller = new AbortController();\n    let active = true;\n    onCleanup(() => { active = false; controller.abort(); });\n    error.value = '';\n    fetchItems(value, controller.signal).then(result => {\n      if (active) items.value = result;\n    }).catch(reason => {\n      if (active) error.value = reason instanceof Error ? reason.message : '请求失败';\n    });\n  });\n  return { query, items, visible, error, stop };\n}"
    },
    {
      "id": "timing",
      "title": "默认批处理与 DOM 访问",
      "paragraphs": [
        "Vue 的状态修改不等于 DOM 已经同步完成。多个同步更新可能被调度合并。若 watcher 需要读取自身组件更新后的 DOM，可按公开 API 选择 flush:post；同步 watcher 会立即响应，频繁变化的数据可能触发大量工作。",
        "nextTick 用于等待已排队的 DOM 更新完成，不是任意请求或定时器完成的通用等待。测试要等正确边界：请求 Promise、响应式更新与 DOM 提交属于不同阶段。"
      ]
    },
    {
      "id": "failure",
      "title": "深层 oldValue 不一定是历史副本",
      "paragraphs": [
        "观察对象内部修改时，新旧值可能引用同一个对象。把 oldValue 当成独立快照逐字段比较会得到误导结果。需要历史差异时明确复制策略或观察具体原始字段，不要无条件深拷贝巨大数据。",
        "另一个错误是在 await 后才注册 cleanup。旧轮可能已经失效，清理错过时机。优先在同步回调里建立取消器并立即注册清理，再启动异步工作。不同清理 API 的调用限制要遵守官方合同。"
      ]
    },
    {
      "id": "boundaries",
      "title": "两个决定选择的边界",
      "paragraphs": [
        "第一条边界是依赖范围：watchEffect 只收集同步访问，await 后新读字段不会自动完整登记。第二条边界是生命周期：组件 setup 中同步创建的 watcher 通常由组件管理，延迟在异步回调中创建时需要检查停止责任。",
        "第三条边界是双向编辑。computed 默认只读；确需 setter 时，应明确从编辑值映射回哪个事实源并处理无效输入。把 setter 用来悄悄修改多个无关状态会使数据流难以追踪。",
        "例如商品列表同时有原始 items、query 与排序规则，filtered 是三者的派生值。用 computed 让每次读取对应当前输入，再在另一个 watch 中根据 query 触发远程建议。远程建议是独立资源，不能把它的加载标记混成 filtered 是否存在。这样查询为空、匹配零条、远程失败三个情况各有明确含义，组件不会用一个空数组掩盖所有失败。",
        "若 watcher 中观察数组或大对象，需要说明变更粒度。只观察对象引用适合不可变替换；深层观察适合需要捕获内部修改但承担遍历成本的场景。把所有 watch 都设置 deep 可能让小改动遍历大量内容，还不能自动产生历史副本。先定义需要哪一个变化，再挑 source 和更新约定，避免为未知要求建立全对象监听。"
      ]
    },
    {
      "id": "recall",
      "title": "先决定这是值还是动作",
      "paragraphs": [
        "如果能从当前输入直接得到结果，选择纯派生；如果必须与外部同步，列出来源、清理与时机，再选择 watch 或 watchEffect。保留空结果、错误和恢复状态。",
        "回忆：为什么 computed getter 不适合发请求？为什么 deep watcher 的旧值可能已经变化？可给请求模型加入旧失败，证明失败也不能覆盖当前成功。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Vue：Computed",
      "url": "https://vuejs.org/guide/essentials/computed"
    },
    {
      "title": "Vue：Watchers",
      "url": "https://vuejs.org/guide/essentials/watchers"
    }
  ]
};
