import type { Article } from './types'

export const handwritingArticles: Article[] = [
    {
        slug: 'debounce-throttle',
        module: 'handwriting',
        title: '防抖与节流',
        summary: '实现高频事件控制，并解释立即执行、尾调用、取消和 this 透传。',
        depth: 'intro',
        heat: 5,
        year: 2026,
        tags: ['debounce', 'throttle', '定时器'],
        overview:
            '防抖等待事件停止后执行，节流保证一段时间最多执行一次。实现前先确认 leading、trailing、等待时间和取消要求。',
        body: `## 先讲清楚要什么

防抖：连续触发时只认“停下来之后”那一次。输入搜索、窗口 resize 后重算布局常用它。

节流：一段时间内最多执行一次。滚动采样、拖拽上报常用它。涉及绘制时，优先考虑 \`requestAnimationFrame\`，它跟帧对齐，不是另一套节流参数。

实现前问清四件事：第一次要不要立刻跑（leading）、最后一次要不要补跑（trailing）、能不能取消、this 和参数以哪一次为准。没问清就写，面试官一改需求就翻。

## 核心机制

防抖用“清掉旧定时器、再设新的”表达“重新计时”。闭包里保存 timer；返回的函数负责清和设。为了给事件回调当方法用，要用 \`fn.apply(this, args)\`，不要写成箭头函数把 this 钉死。

节流可以用时间戳或定时器。时间戳保证 leading 准时；定时器方便 trailing。两者组合才能覆盖“开头立刻响应、结束再补一次”。

组件里必须能 cancel：卸载时清定时器，否则回调打到已卸载的 setState。

## 参考实现

下面是 trailing 防抖，也是本题练习器的范围。leading、maxWait、返回值要能口头补上。

\`\`\`ts
function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  waitMs: number,
) {
  let timer: ReturnType<typeof setTimeout> | undefined

  return function (this: unknown, ...args: TArgs) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), waitMs)
  }
}
\`\`\`

节流（时间戳，leading）：记录上次执行时间，间隔不够就直接 return；够了就执行并更新时间。需要 trailing 时，再用定时器在窗口结束时补一次最后的参数。`,
        pitfalls: [
            '没有先确认首次和末次事件是否要执行。',
            '组件卸载后未取消定时器。',
            '箭头返回函数改变了调用方期望的动态 this。',
        ],
    },
    {
        slug: 'promise-all',
        module: 'handwriting',
        title: '实现 Promise.all',
        summary: '保留输入顺序、兼容普通值、快速失败，并处理空输入。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['Promise', '并发', '顺序'],
        overview:
            'Promise.all 的关键不是循环，而是结果按输入位置保存、全部成功才完成，并在任意任务失败时立即拒绝。',
        body: `## 先讲清楚语义

输入是可迭代对象，元素可以是 Promise 或普通值。结果数组的下标必须和输入一致，与谁先完成无关。全部兑现才兑现；任何一个拒绝就立刻拒绝。空输入必须立刻得到 \`[]\`，否则会永远 pending。

快速失败不等于取消。其它 \`fetch\` 仍在飞，除非调用方自己传了 AbortSignal。面试时主动说这句，能和“实现 allSettled / 并发池”接上。

## 实现思路

1. \`Array.from\` 固定长度和顺序
2. 长度为 0 时直接 resolve
3. 用结果数组按 index 写入，不要 \`push\`
4. \`Promise.resolve(item)\` 统一普通值和 thenable
5. 成功计数到长度再 resolve；拒绝走同一个 reject，只落地一次

## 参考实现

\`\`\`ts
function promiseAll<T>(values: Iterable<T | PromiseLike<T>>): Promise<T[]> {
  const items = Array.from(values)

  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      resolve([])
      return
    }

    const results: T[] = new Array(items.length)
    let completed = 0

    items.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        results[index] = value
        completed += 1
        if (completed === items.length) resolve(results)
      }, reject)
    })
  })
}
\`\`\`

和 \`allSettled\` 的差别：后者把失败收成 \`{ status: 'rejected', reason }\`，等全部结束。和 \`race\` 的差别：后者只认第一个敲定的，不管成败。`,
        pitfalls: [
            '按照完成先后 push，破坏输入顺序。',
            '空数组永远不 resolve。',
            '认为一个任务 reject 后其他网络请求也会自动停止。',
        ],
    },
    {
        slug: 'concurrency-pool',
        module: 'handwriting',
        title: '实现 Promise 并发池',
        summary: '用固定数量 worker 消费任务，并决定失败、顺序和取消策略。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['Promise', '并发限制', 'worker'],
        overview:
            '并发限制考察调度能力。重点是同时运行数不超过上限，而不是先启动所有 Promise 再等待。',
        body: `## 先讲清楚要什么

限流的对象是“同时执行的任务数”，不是“Promise 数组的长度”。如果调用方传入已经在飞的 Promise，限制已经失效。正确输入是 \`() => Promise\`，由池子决定何时调用。

还要事先约定：失败是立刻拒绝还是继续把剩下的跑完；结果是否按输入顺序；未开始的任务还要不要领。本题采用快速失败、结果按位填写。

## 实现思路

用一个共享的 \`nextIndex\`。启动 \`min(limit, tasks.length)\` 个 worker，每个 worker 循环领取下一个下标、await 任务、把结果放回该下标。\`Promise.all(workers)\` 等待所有 worker 退出。

不要先 \`tasks.map(fn => fn())\` 再切片，那是先全量启动。limit 非法要抛错；limit 大于任务数时 worker 数跟任务数走，避免空转。

## 参考实现

\`\`\`ts
async function runPool<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('invalid limit')

  const results: T[] = new Array(tasks.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await tasks[index]()
    }
  }

  const workerCount = Math.min(limit, tasks.length)
  await Promise.all(Array.from({ length: workerCount }, worker))
  return results
}
\`\`\`

追问可以补：\`allSettled\` 语义、动态入队、优先级、进度、AbortSignal 让未开始的任务不再领取。`,
        pitfalls: [
            '传入已经创建的 Promise，任务早已全部启动。',
            '并发数大于任务数时创建大量空 worker。',
            '没有定义失败后未开始任务是否继续。',
        ],
    },
    {
        slug: 'request-race-retry',
        module: 'handwriting',
        title: '搜索请求：防竞态、超时与重试',
        summary: '保证旧请求不能覆盖新结果，并区分取消、超时和可重试错误。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['AbortController', '竞态', '重试'],
        overview:
            '这是比单独手写防抖更接近实际工作的题：用户连续输入时要取消旧请求，并确保返回顺序不会污染界面。',
        body: `## 先讲清楚事故

用户连续输入时会发出多个请求。只做防抖只能减少次数，已经发出的旧请求仍可能最晚回来，把新结果盖掉。所以要同时做三件事：

1. 取消上一趟能取消的工作（AbortController）
2. 即使用户端取消不了，也只允许最新序号写入 UI
3. 卸载时同样 abort，避免 setState 打到空组件

超时、重试是下一层。超时用 \`AbortSignal.timeout\` 或定时器 abort。重试只针对网络抖动、502、429，用指数退避加抖动；4xx 和 AbortError 不重试，AbortError 不要当成用户可见失败。

## 实现顺序

先定 UI 状态（idle / loading / success / error），再接取消和序号，最后才加超时和重试。口头上要分开“取消网络”和“忽略过期结果”：前者省资源，后者保正确。

## 参考骨架

\`\`\`ts
let seq = 0
let controller: AbortController | undefined

async function search(keyword: string) {
  controller?.abort()
  controller = new AbortController()
  const current = ++seq

  try {
    const data = await fetchResults(keyword, controller.signal)
    if (current !== seq) return
    render(data)
  } catch (error) {
    if (controller.signal.aborted || current !== seq) return
    renderError(error)
  }
}
\`\`\`

练习器会要求你把“只接受最新一次”写成可测的函数，而不是绑死在某个框架里。`,
        pitfalls: [
            '只做防抖，已经发出的旧请求仍可能最后返回。',
            '所有错误都无限重试，引发请求风暴。',
            '把 AbortError 展示成用户可见的失败提示。',
        ],
    },
    {
        slug: 'event-emitter',
        module: 'handwriting',
        title: '实现 EventEmitter',
        summary: '支持订阅、取消、单次订阅，并处理触发期间修改监听列表。',
        depth: 'core',
        heat: 4,
        year: 2026,
        tags: ['发布订阅', '事件', 'Map'],
        overview:
            '发布订阅题考察数据结构、函数身份和资源释放。最小实现通常使用 Map 保存事件名到监听集合。',
        body: `## 先讲清楚接口

- \`on(event, listener)\` 登记，返回取消函数更利于组件清理
- \`off(event, listener)\` 按**同一个函数引用**删除
- \`emit(event, ...args)\` 同步调用当前监听
- \`once\` 包一层，第一次 emit 后 off 自己

业务组件通信优先走框架数据流。EventEmitter 适合解耦的基础设施（socket、跨模块通知），用完必须卸。

## 实现时的坑

\`off\` 传入现场写的新箭头函数，对不上原来的引用，等于没取消。

\`emit\` 过程中如果有人 \`on\` / \`off\`，直接遍历可变数组会漏执行或重复执行。先 \`slice\` 或拷贝 Set 再调用。

某个 listener 抛错要预先约定：中断后续、收集后一起抛，还是隔离。默认隔离更接近 DOM 事件。

## 参考实现

\`\`\`ts
type Listener = (...args: unknown[]) => void

class EventEmitter {
  #events = new Map<string, Set<Listener>>()

  on(event: string, listener: Listener) {
    const set = this.#events.get(event) ?? new Set()
    set.add(listener)
    this.#events.set(event, set)
    return () => this.off(event, listener)
  }

  off(event: string, listener: Listener) {
    this.#events.get(event)?.delete(listener)
  }

  emit(event: string, ...args: unknown[]) {
    for (const listener of [...(this.#events.get(event) ?? [])]) {
      listener(...args)
    }
  }

  once(event: string, listener: Listener) {
    const wrapped: Listener = (...args) => {
      this.off(event, wrapped)
      listener(...args)
    }
    return this.on(event, wrapped)
  }
}
\`\`\`

once 必须 off 包装函数，不能 off 用户传入的原函数，否则会把其它相同引用一起删掉。`,
        pitfalls: [
            'off 时传入新函数，无法匹配原监听器。',
            'emit 直接遍历可变数组，回调删除元素导致漏执行。',
            '长期对象持有监听器，组件卸载后仍无法回收。',
        ],
    },
    {
        slug: 'array-tree-transform',
        module: 'handwriting',
        title: '数组与树相互转换',
        summary: '用索引把扁平数据组装成树，并处理乱序、孤儿和环。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['树', 'Map', '复杂度'],
        overview:
            '高频题通常给出 id 和 parentId。使用 Map 建索引可以做到线性复杂度，并支持子节点先于父节点出现。',
        body: `## 先讲清楚数据

输入是 \`{ id, parentId }[]\`，\`parentId\` 为空表示根。真实数据会乱序、缺父节点、id 重复、自指或成环。面试先声明策略：孤儿单独列出还是挂到根；环要检测并失败，而不是递归到爆栈。

不要修改输入对象。每条先浅拷贝再挂 \`children\`，避免调用方的源数组被悄悄长出字段。

## 实现思路

数组转树，两遍 O(n)：

1. 每条数据建节点，放进 \`Map<id, node>\`
2. 再扫一遍，有父则推进父的 children，否则进根列表

不要每条都 \`find\` 父节点，那是 O(n²)。父节点后出现也没关系，因为第一遍已经把节点都建好了。

树转数组用 DFS 或 BFS。出发前问清：要不要 children、要不要补 parentId、顺序按深度还是按原数组。

## 参考实现

\`\`\`ts
type Row = { id: string; parentId: string | null }
type Node = Row & { children: Node[] }

function listToTree(rows: Row[]): Node[] {
  const nodes = new Map<string, Node>()
  for (const row of rows) {
    nodes.set(row.id, { ...row, children: [] })
  }

  const roots: Node[] = []
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}
\`\`\`

检测环：遍历时记录当前路径上的 id，再次遇到就失败。`,
        pitfalls: [
            '每找一个父节点都遍历整个数组，退化为 O(n²)。',
            '假定父节点一定排在子节点前面。',
            '直接修改输入对象，给调用方留下隐藏副作用。',
        ],
    },
    {
        slug: 'lru-cache',
        module: 'handwriting',
        title: '实现 LRU Cache',
        summary: '使用 Map 的插入顺序实现固定容量的最近使用缓存。',
        depth: 'core',
        heat: 4,
        year: 2026,
        tags: ['LRU', '缓存', 'Map'],
        overview:
            'LRU 在容量满时淘汰最久未使用项。JavaScript Map 保持插入顺序，可通过删除后重新插入表达“刚刚使用”。',
        body: `## 先讲清楚规则

容量固定。\`get\` 命中要变成最近使用；\`set\` 更新已有键同样刷新位置；超出容量删最久没碰到的那条。TTL 是另一维度，不要和容量混在一题里硬写。

复杂度目标：get / set 平均 O(1)。JS 的 \`Map\` 按插入顺序迭代，删掉再 set 就会排到末尾，迭代器第一个键就是最旧的。其它语言经典写法是哈希表 + 双向链表。

## 实现思路

- get：没有返回 -1 或 undefined；有则 delete + set 原值，再返回
- set：键已存在先 delete；再 set；size 超容量则 \`map.keys().next().value\` 删掉

更新已有键如果只改值不 delete，它会留在旧位置，LRU 顺序就错了。

## 参考实现

\`\`\`ts
class LRUCache<K, V> {
  #limit: number
  #map = new Map<K, V>()

  constructor(limit: number) {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError('invalid limit')
    this.#limit = limit
  }

  get(key: K) {
    if (!this.#map.has(key)) return undefined
    const value = this.#map.get(key) as V
    this.#map.delete(key)
    this.#map.set(key, value)
    return value
  }

  set(key: K, value: V) {
    if (this.#map.has(key)) this.#map.delete(key)
    this.#map.set(key, value)
    if (this.#map.size > this.#limit) {
      const oldest = this.#map.keys().next().value as K
      this.#map.delete(oldest)
    }
  }
}
\`\`\`

追问：按字节计费、请求去重、命中率、主动过期。那些是生产缓存，不是这道题的最小正确性。`,
        pitfalls: [
            'get 只返回值，没有刷新最近使用顺序。',
            '更新已有键后保留在旧位置。',
            '把容量和过期时间混为一谈。',
        ],
    },
    {
        slug: 'deep-clone-boundaries',
        module: 'handwriting',
        title: '深拷贝：先说明边界再实现',
        summary: '处理循环引用和常见内置类型，并知道什么时候不该自己写。',
        depth: 'deep',
        heat: 4,
        year: 2026,
        tags: ['深拷贝', 'WeakMap', 'structuredClone'],
        overview:
            '深拷贝没有脱离数据模型的万能实现。实现前应先确认支持类型、原型和属性描述符，再选择实现范围。',
        body: `## 先讲边界

没有通用深拷贝。面试先划范围，再写代码：

- 要做：普通对象、数组、循环引用、Date、RegExp、Map、Set、Symbol 键
- 不做或不假装能做：函数闭包、DOM、Promise、WeakMap、原型上的方法、完整属性描述符
- 生产：类型符合就用 \`structuredClone\`；不可变更新往往只需沿变更路径浅拷贝

\`JSON.parse(JSON.stringify(x))\` 会丢掉 \`undefined\`、函数、Symbol、Date 语义和环，不能当答案。

## 实现思路

递归拷贝，用 \`WeakMap\` 记录“源对象 → 副本”。遇到已拷过的对象直接返回副本，这样环和“同一对象被两处引用”都能保住身份。

数组和对象分开建容器，再扫 \`Reflect.ownKeys\`（含 Symbol）。Date / RegExp / Map / Set 走对应构造器，Map/Set 的元素仍要递归。

## 参考实现

\`\`\`ts
function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return seen.get(value) as T

  if (value instanceof Date) return new Date(value.getTime()) as T
  if (value instanceof RegExp) return new RegExp(value.source, value.flags) as T

  const output = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value))
  seen.set(value, output)

  if (value instanceof Map) {
    const map = new Map()
    seen.set(value, map)
    value.forEach((item, key) => map.set(deepClone(key, seen), deepClone(item, seen)))
    return map as T
  }

  if (value instanceof Set) {
    const set = new Set()
    seen.set(value, set)
    value.forEach((item) => set.add(deepClone(item, seen)))
    return set as T
  }

  for (const key of Reflect.ownKeys(value)) {
    output[key] = deepClone(Reflect.get(value, key), seen)
  }
  return output
}
\`\`\`

WeakMap 必须在创建容器后立刻 set，再拷贝子字段，否则环走不回去。`,
        pitfalls: [
            '声称 JSON.parse(JSON.stringify(value)) 是通用深拷贝。',
            '处理了循环引用，却漏掉同一对象被多处共享的身份关系。',
            '为了不可变更新复制整个大型状态树。',
        ],
    },
    {
        slug: 'call-apply-bind',
        module: 'handwriting',
        title: '实现 call、apply 与 bind',
        summary: '用指定 this 调用函数，bind 还要能预设参数，并说清箭头函数和 new 的边界。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['call', 'apply', 'bind', 'this'],
        overview:
            '三者都是显式绑定 this。call / apply 立刻调用，差别只在参数形态；bind 返回新函数，第一次绑定的 this 不能再被 bind 改掉。',
        body: `## 先讲清楚语义

\`fn.call(thisArg, a, b)\` 和 \`fn.apply(thisArg, [a, b])\` 立刻执行。\`thisArg\` 在非严格模式会被装箱，\`null\` / \`undefined\` 会变成全局对象；严格模式保持原值。

\`bind\` 返回绑定函数：预设 this 和前缀参数，之后调用再拼剩余参数。再 \`bind\` 一次改不了 this，只能继续预设参数。箭头函数没有自己的 this，这三个方法都改不了它。

用 \`new boundFn()\` 时，规范要求 this 指向新实例，而不是 bind 进去的对象。完整 polyfill 要判断 \`this instanceof boundFn\`。练习器只要求：绑定 this、拼接参数、返回原函数的返回值。

## 实现思路

call：把函数临时挂到上下文对象上当方法调用，用完删除，避免留下可枚举属性（\`unique\` 符号键）。上下文不是对象时先装箱。

apply：转成 call，或把数组展开。

bind：闭包保存原函数、thisArg 和前缀参数，返回 \`function (...rest) { return fn.apply(thisArg, [...prefix, ...rest]) }\`。

## 参考实现

\`\`\`ts
function bind(fn, context, ...prefix) {
  if (typeof fn !== 'function') throw new TypeError('bind target must be a function')

  return function bound(...rest) {
    return fn.apply(context, [...prefix, ...rest])
  }
}
\`\`\`

call 的关键是“当成对象方法调用”，不要递归调用自己实现的 call。手写时说明：这是教学实现，生产直接用语言内置。`,
        pitfalls: [
            'bind 返回箭头函数，导致 new bound() 无法创建实例。',
            '临时挂到对象上的属性用固定字符串，覆盖用户已有键。',
            '对箭头函数手写 bind 还期望能改 this。',
        ],
    },
    {
        slug: 'array-flatten',
        module: 'handwriting',
        title: '数组扁平化',
        summary: '按指定深度展开嵌套数组，并说明和 flat 的差异、稀疏数组和栈溢出。',
        depth: 'intro',
        heat: 5,
        year: 2026,
        tags: ['flat', '递归', '数组'],
        overview:
            '扁平化是把嵌套数组按层展开。先约定深度、是否跳过空位、非数组元素如何保留，再选择递归或迭代。',
        body: `## 先讲清楚规则

\`flatten(arr, depth = Infinity)\` 只展开数组，其它值原样保留。\`depth <= 0\` 返回浅拷贝，不改原数组。\`[1, [2, [3]]]\` 在 depth 为 1 时是 \`[1, 2, [3]]\`。

\`Array.prototype.flat\` 会跳过空位；\`concat\` 展开也会丢掉空位。面试若没说，声明“按 flat 语义跳过 empty”。不要把类数组、字符串当数组展开，字符串有 \`length\` 但不是需要扁平的结构。

递归在极深嵌套上会爆栈。深度很大时用显式栈迭代，或按层循环。

## 实现思路

递归：结果数组，遍历当前层，元素是数组且 depth > 0 就 \`push(...flatten(item, depth - 1))\`，否则 push 元素。

迭代：栈里放 \`{ value, restDepth }\`，取出时按同样规则展开或写入结果。注意从右往左压栈才能保持顺序，或直接用队列按层处理。

## 参考实现

\`\`\`ts
function flatten(input, depth = Infinity) {
  if (!Array.isArray(input)) throw new TypeError('flatten expects an array')
  const maxDepth = Number(depth)
  if (Number.isNaN(maxDepth) || maxDepth <= 0) return input.slice()

  const output = []
  for (let index = 0; index < input.length; index += 1) {
    if (!(index in input)) continue
    const item = input[index]
    if (Array.isArray(item)) output.push(...flatten(item, maxDepth - 1))
    else output.push(item)
  }
  return output
}
\`\`\`

按下标扫才能跳过空位；\`for...of\` 会把 empty 当成 \`undefined\` 推进结果。练习器以密数组和深度为主。`,
        pitfalls: [
            '直接改原数组，调用方看到输入被摊平。',
            '用 typeof item === "object" 判断，把 null 和对象也展开。',
            '深度很大时纯递归导致栈溢出，却说复杂度只是 O(n)。',
        ],
    },
]
