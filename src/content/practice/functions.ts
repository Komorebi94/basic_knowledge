import type { Exercise } from "./types";

export const functionsExercises = [
  {
    "id": "E07",
    "slug": "event-emitter",
    "title": "事件订阅器",
    "summary": "事件系统需要保证监听顺序，同时允许回调在执行过程中增删监听。实现订阅器：emit 使用启动时快照，同一函数可以重复订阅，异常收集后继续调用其余监听。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 30,
    "revision": 1,
    "updatedAt": "2026-10-15",
    "verifiedAt": "2026-10-15",
    "entryContract": "createEmitter() → {on,off,once,emit}；on/once(name, fn) 返回精确解绑函数；off(name, fn) 移除最近一次同函数订阅；emit(name,...args) 返回异常数组。name 为 string/Symbol，fn 为函数，否则 TypeError。",
    "problem": [
      "事件系统需要保证监听顺序，同时允许回调在执行过程中增删监听。实现订阅器：emit 使用启动时快照，同一函数可以重复订阅，异常收集后继续调用其余监听。",
      "监听 this 固定为 undefined（严格模式），按注册顺序传入全部参数。once 必须在调用前解绑；即使旧快照仍含该记录，也不能因重入触发第二次。解绑函数幂等，不修改参数。"
    ],
    "allowedApis": [
      "JavaScript 标准内建对象",
      "Promise 与微任务",
      "setTimeout / clearTimeout（虚拟时钟）",
      "AbortController / AbortSignal（可取消题）"
    ],
    "unsupportedBehavior": [
      "不支持 DOM、网络、动态导入或宿主对象。",
      "不以运行耗时自动判定渐进复杂度；资源限制由独立运行器负责。"
    ],
    "starterArtifact": "function createEmitter() {\n  // TODO 返回 on/off/once/emit。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "记录订阅对象，而不只记录回调函数。",
      "emit 复制当前列表后遍历，off 从原列表反向查找。",
      "once 先标记 fired 再解绑，再调用，防止嵌套 emit 的旧快照。"
    ],
    "referenceArtifact": "function createEmitter() {\n  const events = new Map();\n  function check(name, fn) { if ((typeof name !== 'string' && typeof name !== 'symbol') || typeof fn !== 'function') throw new TypeError('Invalid subscription'); }\n  function remove(name, record) {\n    const list = events.get(name); if (!list) return;\n    const index = list.indexOf(record); if (index !== -1) list.splice(index, 1);\n    if (!list.length) events.delete(name);\n  }\n  function subscribe(name, fn, once) {\n    check(name, fn);\n    const record = { fn, once, fired: false };\n    if (!events.has(name)) events.set(name, []);\n    events.get(name).push(record);\n    return () => remove(name, record);\n  }\n  return {\n    on: (name, fn) => subscribe(name, fn, false),\n    once: (name, fn) => subscribe(name, fn, true),\n    off(name, fn) {\n      check(name, fn); const list = events.get(name) || [];\n      for (let i = list.length - 1; i >= 0; i--) if (list[i].fn === fn) { remove(name, list[i]); break; }\n    },\n    emit(name, ...args) {\n      if (typeof name !== 'string' && typeof name !== 'symbol') throw new TypeError('Invalid event');\n      const errors = [], snapshot = (events.get(name) || []).slice();\n      for (const record of snapshot) {\n        if (record.once) {\n          if (record.fired) continue;\n          record.fired = true; remove(name, record);\n        }\n        try { record.fn.apply(undefined, args); } catch (error) { errors.push(error); }\n      }\n      return errors;\n    }\n  };\n}",
    "explanation": [
      "同一函数可以对应多个订阅记录，精确解绑必须删除记录身份，而 off 的合同是反向查找到最近一次匹配函数。把 Set 用作监听集合会自动去重，改变题面规定。",
      "启动时快照让一次分发有稳定范围：A 删除 B，B 仍属于本轮；A 新增 C，C 不属于本轮。列表的下一轮内容会反映这些修改，因此不是永远忽略增删。",
      "once 还需要 fired 标记。嵌套 emit 可能先在内层执行一个 once，而外层快照还保留它；仅从原列表移除不足以防止外层再次执行。错误收集也必须逐监听捕获，不能把整段循环放在一个 try 中。"
    ],
    "alternative": "发布订阅库常让异常直接抛出或自动去重；选择这些方案时应改变合同并迁移调用方，不能混用语义。",
    "complexity": "on 为摊还 O(1)，off/解绑 O(m)。emit 快照空间 O(m)；含 once 时每项解绑会查找并移动数组，最坏时间 O(m²)，另计监听函数本身成本。没有解绑的普通分发为 O(m)。",
    "commonMistakes": [
      "Set 去重违反重复订阅合同。",
      "调用 once 后才解绑导致重入重复甚至无限递归。"
    ],
    "knowledgeIds": [
      "K01-02",
      "K01-03"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "const e = createEmitter(); e.on(\"x\", console.log); e.emit(\"x\", 1, 2);",
        "expectedOutput": "1 2",
        "explanation": "参数按位置原样传给监听函数，返回的是错误数组而非监听结果。",
        "expectedLogs": [
          "1 2"
        ]
      },
      {
        "code": "const e = createEmitter(); e.once(\"x\", () => console.log(\"once\")); e.emit(\"x\"); e.emit(\"x\");",
        "expectedOutput": "once",
        "explanation": "第一次执行前移除订阅，第二轮没有该监听。",
        "expectedLogs": [
          "once"
        ]
      },
      {
        "code": "const e = createEmitter(); e.on(\"x\", () => { throw new Error(\"失败\"); }); console.log(e.emit(\"x\").length);",
        "expectedOutput": "1",
        "explanation": "异常成为数组成员，不中断整个分发。",
        "expectedLogs": [
          "1"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E07-T01",
        "name": "顺序参数",
        "purpose": "按注册顺序接收参数",
        "code": "let e=createEmitter(),out=[];e.on(\"x\",(...a)=>out.push([1,...a]));e.on(\"x\",(...a)=>out.push([2,...a]));equal(e.emit(\"x\",3),[]);equal(out,[[1,3],[2,3]]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "顺序参数",
        "expectedOutcome": "按注册顺序接收参数",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E07-T02",
        "name": "重复订阅与 off",
        "purpose": "移除最近一次",
        "code": "let e=createEmitter(),out=[],f=()=>out.push(\"f\");e.on(\"x\",f);e.on(\"x\",()=>out.push(\"mid\"));e.on(\"x\",f);e.off(\"x\",f);e.emit(\"x\");equal(out,[\"f\",\"mid\"]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "重复订阅与 off",
        "expectedOutcome": "移除最近一次",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E07-T03",
        "name": "精确解绑",
        "purpose": "返回值只解绑所属记录且幂等",
        "code": "let e=createEmitter(),n=0,f=()=>n++;let off=e.on(\"x\",f);e.on(\"x\",f);off();off();e.emit(\"x\");equal(n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "精确解绑",
        "expectedOutcome": "返回值只解绑所属记录且幂等",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E07-T04",
        "name": "快照删除",
        "purpose": "删除不影响本轮快照",
        "code": "let e=createEmitter(),out=[],f=()=>out.push(2);e.on(\"x\",()=>{out.push(1);e.off(\"x\",f)});e.on(\"x\",f);e.emit(\"x\");equal(out,[1,2]);e.emit(\"x\");equal(out,[1,2,1]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "快照删除",
        "expectedOutcome": "删除不影响本轮快照",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E07-T05",
        "name": "快照新增",
        "purpose": "新增从下一轮开始",
        "code": "let e=createEmitter(),out=[];e.once(\"x\",()=>{out.push(1);e.on(\"x\",()=>out.push(2))});e.emit(\"x\");equal(out,[1]);e.emit(\"x\");equal(out,[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "快照新增",
        "expectedOutcome": "新增从下一轮开始",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E07-T06",
        "name": "once 重入",
        "purpose": "重入不能再次触发一次监听",
        "code": "let e=createEmitter(),n=0;e.once(\"x\",()=>{n++;e.emit(\"x\")});e.emit(\"x\");equal(n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "once 重入",
        "expectedOutcome": "重入不能再次触发一次监听",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E07-T07",
        "name": "异常继续",
        "purpose": "错误收集且后续执行",
        "code": "let e=createEmitter(),n=0,error=new Error(\"x\");e.on(\"x\",()=>{throw error});e.on(\"x\",()=>n++);let errors=e.emit(\"x\");assert(errors[0]===error,\"same error\");equal(n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "异常继续",
        "expectedOutcome": "错误收集且后续执行",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E07-T08",
        "name": "空事件与 Symbol",
        "purpose": "未知事件空，Symbol 隔离",
        "code": "let e=createEmitter(),s=Symbol(),n=0;equal(e.emit(\"missing\"),[]);e.on(s,()=>n++);e.emit(\"s\");e.emit(s);equal(n,1);expectThrow(()=>e.on(1,()=>{}),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空事件与 Symbol",
        "expectedOutcome": "未知事件空，Symbol 隔离",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "删除首次匹配",
        "code": "function createEmitter() {\n  const events = new Map();\n  function check(name, fn) { if ((typeof name !== 'string' && typeof name !== 'symbol') || typeof fn !== 'function') throw new TypeError('Invalid subscription'); }\n  function remove(name, record) {\n    const list = events.get(name); if (!list) return;\n    const index = list.indexOf(record); if (index !== -1) list.splice(index, 1);\n    if (!list.length) events.delete(name);\n  }\n  function subscribe(name, fn, once) {\n    check(name, fn);\n    const record = { fn, once, fired: false };\n    if (!events.has(name)) events.set(name, []);\n    events.get(name).push(record);\n    return () => remove(name, record);\n  }\n  return {\n    on: (name, fn) => subscribe(name, fn, false),\n    once: (name, fn) => subscribe(name, fn, true),\n    off(name, fn) {\n      check(name, fn); const list = events.get(name) || [];\n      for (let i = 0; i < list.length; i++) if (list[i].fn === fn) { remove(name, list[i]); break; }\n    },\n    emit(name, ...args) {\n      if (typeof name !== 'string' && typeof name !== 'symbol') throw new TypeError('Invalid event');\n      const errors = [], snapshot = (events.get(name) || []).slice();\n      for (const record of snapshot) {\n        if (record.once) {\n          if (record.fired) continue;\n          record.fired = true; remove(name, record);\n        }\n        try { record.fn.apply(undefined, args); } catch (error) { errors.push(error); }\n      }\n      return errors;\n    }\n  };\n}"
      },
      {
        "name": "没有快照",
        "code": "function createEmitter() {\n  const events = new Map();\n  function check(name, fn) { if ((typeof name !== 'string' && typeof name !== 'symbol') || typeof fn !== 'function') throw new TypeError('Invalid subscription'); }\n  function remove(name, record) {\n    const list = events.get(name); if (!list) return;\n    const index = list.indexOf(record); if (index !== -1) list.splice(index, 1);\n    if (!list.length) events.delete(name);\n  }\n  function subscribe(name, fn, once) {\n    check(name, fn);\n    const record = { fn, once, fired: false };\n    if (!events.has(name)) events.set(name, []);\n    events.get(name).push(record);\n    return () => remove(name, record);\n  }\n  return {\n    on: (name, fn) => subscribe(name, fn, false),\n    once: (name, fn) => subscribe(name, fn, true),\n    off(name, fn) {\n      check(name, fn); const list = events.get(name) || [];\n      for (let i = list.length - 1; i >= 0; i--) if (list[i].fn === fn) { remove(name, list[i]); break; }\n    },\n    emit(name, ...args) {\n      if (typeof name !== 'string' && typeof name !== 'symbol') throw new TypeError('Invalid event');\n      const errors = [], snapshot = (events.get(name) || []);\n      for (const record of snapshot) {\n        if (record.once) {\n          if (record.fired) continue;\n          record.fired = true; remove(name, record);\n        }\n        try { record.fn.apply(undefined, args); } catch (error) { errors.push(error); }\n      }\n      return errors;\n    }\n  };\n}"
      }
    ]
  },
  {
    "id": "E08",
    "slug": "curry-arity",
    "title": "参数化柯里化",
    "summary": "希望把一个多参数函数拆成若干次调用，但函数 length 可能受默认参数影响。实现显式 arity 的柯里化，让独立调用分支各自保存参数并在收集足够时执行一次。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 20,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "curry(fn, arity) → curried；arity 为非负整数，fn 非函数抛 TypeError，非法 arity 抛 RangeError。累积参数达到 arity 即执行，多余参数保留；this 来自最后一次调用，不修改已有分支。",
    "problem": [
      "希望把一个多参数函数拆成若干次调用，但函数 length 可能受默认参数影响。实现显式 arity 的柯里化，让独立调用分支各自保存参数并在收集足够时执行一次。",
      "arity=0 的 curried 在第一次调用时执行；允许一次传多个或零个参数。不支持占位符、构造调用、无限参数链或异步结果聚合。"
    ],
    "allowedApis": [
      "JavaScript 标准内建对象",
      "Promise 与微任务",
      "setTimeout / clearTimeout（虚拟时钟）",
      "AbortController / AbortSignal（可取消题）"
    ],
    "unsupportedBehavior": [
      "不支持 DOM、网络、动态导入或宿主对象。",
      "不以运行耗时自动判定渐进复杂度；资源限制由独立运行器负责。"
    ],
    "starterArtifact": "function curry(fn, arity) {\n  // TODO 返回逐批收集参数的函数。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "每个中间函数拥有一份已收集参数。",
      "用 concat 生成新数组，不在共享数组上 push。",
      "达到阈值时 apply 最后调用的 this，多余参数不截断。"
    ],
    "referenceArtifact": "function curry(fn, arity) {\n  if (typeof fn !== 'function') throw new TypeError('Invalid function');\n  if (!Number.isInteger(arity) || arity < 0) throw new RangeError('Invalid arity');\n  function collect(previous) {\n    return function(...args) {\n      const combined = previous.concat(args);\n      return combined.length >= arity ? fn.apply(this, combined) : collect(combined);\n    };\n  }\n  return collect([]);\n}",
    "explanation": [
      "arity 冻结的是何时执行，而不是最终最多接收多少参数。因此第二次传入多余参数仍全部交给 fn，不能用 slice 截到 arity。零 arity 的意义是首次调用就满足阈值，而不是创建 curry 时立即调用 fn。",
      "每个 collect(previous) 创建独立闭包。concat 返回新数组，既让 c(1) 与 c(2) 不互相污染，也让 p(2) 执行后 p(3) 继续从同一 previous 起步。",
      "this 不属于已收集参数：在最终达到阈值的调用点动态获取它。箭头函数作为外层 curried 会捕获词法 this，无法满足此合同；普通函数加 apply 可以明确转交调用者。"
    ],
    "alternative": "绑定固定 this 或提供占位符可以解决不同需求，但需要明确新接口；自动使用 fn.length 仅在无默认参数/剩余参数的函数上可靠。",
    "complexity": "每次新增参数需要复制已收集数组，单次 O(k)，多次单参收集总体可 O(arity²)；空间 O(k)。",
    "commonMistakes": [
      "共享数组 push 会污染独立分支。",
      "截断多余参数会改变原函数调用。"
    ],
    "knowledgeIds": [
      "K01-02",
      "K01-03"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(curry((a,b,c) => a+b+c, 3)(1)(2,3));",
        "expectedOutput": "6",
        "explanation": "第一次只收集 1，第二次新增 2、3，达到三个参数时执行。",
        "expectedLogs": [
          "6"
        ]
      },
      {
        "code": "const p = curry((a,b) => [a,b], 2)(1); console.log(p(2), p(3));",
        "expectedOutput": "[1,2] [1,3]",
        "explanation": "previous 不被修改，所以同一部分应用可以安全复用。",
        "expectedLogs": [
          "[ 1, 2 ] [ 1, 3 ]"
        ]
      },
      {
        "code": "console.log(curry((...args) => args, 0)(4));",
        "expectedOutput": "[4]",
        "explanation": "arity=0 仍等待调用时机，而首次传入的参数完整保留。",
        "expectedLogs": [
          "[ 4 ]"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E08-T01",
        "name": "分批参数",
        "purpose": "跨调用累积",
        "code": "equal(curry((a,b,c)=>a+b+c,3)(1)(2,3),6);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "分批参数",
        "expectedOutcome": "跨调用累积",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E08-T02",
        "name": "多余参数",
        "purpose": "原样透传",
        "code": "equal(curry((...a)=>a,2)(1)(2,3),[1,2,3]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "多余参数",
        "expectedOutcome": "原样透传",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E08-T03",
        "name": "独立分支",
        "purpose": "部分应用不可被另一分支污染",
        "code": "let c=curry((a,b)=>[a,b],2),a=c(1),b=c(2);equal(a(3),[1,3]);equal(b(4),[2,4]);equal(a(5),[1,5]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "独立分支",
        "expectedOutcome": "部分应用不可被另一分支污染",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E08-T04",
        "name": "最终 this",
        "purpose": "使用执行那次接收者",
        "code": "let c=curry(function(a,b){return this.n+a+b},2),part=c.call({n:100},1);equal(part.call({n:10},2),13);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "最终 this",
        "expectedOutcome": "使用执行那次接收者",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E08-T05",
        "name": "零 arity",
        "purpose": "首调用触发且保留参数",
        "code": "equal(curry((...a)=>a,0)(1,2),[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "零 arity",
        "expectedOutcome": "首调用触发且保留参数",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E08-T06",
        "name": "空调用与失败",
        "purpose": "空调用无损，异常透传",
        "code": "equal(curry((a,b)=>a+b,2)()(1)()(2),3);expectThrow(()=>curry(()=>{throw new Error(\"x\")},1)(1),\"Error\");expectThrow(()=>curry(null,1),\"TypeError\");expectThrow(()=>curry(()=>{},-1),\"RangeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空调用与失败",
        "expectedOutcome": "空调用无损，异常透传",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "污染分支",
        "code": "function curry(fn, arity) {\n  if (typeof fn !== 'function') throw new TypeError('Invalid function');\n  if (!Number.isInteger(arity) || arity < 0) throw new RangeError('Invalid arity');\n  function collect(previous) {\n    return function(...args) {\n      previous.push(...args); const combined = previous;\n      return combined.length >= arity ? fn.apply(this, combined) : collect(combined);\n    };\n  }\n  return collect([]);\n}"
      },
      {
        "name": "丢弃多余参数",
        "code": "function curry(fn, arity) {\n  if (typeof fn !== 'function') throw new TypeError('Invalid function');\n  if (!Number.isInteger(arity) || arity < 0) throw new RangeError('Invalid arity');\n  function collect(previous) {\n    return function(...args) {\n      const combined = previous.concat(args);\n      return combined.length >= arity ? fn.apply(this, combined.slice(0, arity)) : collect(combined);\n    };\n  }\n  return collect([]);\n}"
      }
    ]
  },
  {
    "id": "E09",
    "slug": "compose-pipe",
    "title": "组合与管道",
    "summary": "数据需要经过几个同步变换时，嵌套调用难以读清顺序。实现组合和管道，明确右到左与左到右的执行方向，保持传入函数列表不变。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 20,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "compose(functions) / pipe(functions) → (value) => result；functions 为一元同步函数数组，非法输入抛 TypeError；空数组为 identity。compose 从右向左，pipe 从左向右，异常原样透传。",
    "problem": [
      "数据需要经过几个同步变换时，嵌套调用难以读清顺序。实现组合和管道，明确右到左与左到右的执行方向，保持传入函数列表不变。",
      "只约定一元函数；函数以 undefined 作为 this，不自动等待 Promise。输出可以是任意值，每一步把上一步结果作为唯一参数。"
    ],
    "allowedApis": [
      "JavaScript 标准内建对象",
      "Promise 与微任务",
      "setTimeout / clearTimeout（虚拟时钟）",
      "AbortController / AbortSignal（可取消题）"
    ],
    "unsupportedBehavior": [
      "不支持 DOM、网络、动态导入或宿主对象。",
      "不以运行耗时自动判定渐进复杂度；资源限制由独立运行器负责。"
    ],
    "starterArtifact": "function compose(functions) { throw new Error(\"未实现\"); }\nfunction pipe(functions) { throw new Error(\"未实现\"); }",
    "hints": [
      "确定遍历方向，再确定每步传递的唯一值。",
      "创建时校验并复制函数列表。",
      "不要对输入 reverse，异常无需捕获后重新包装。"
    ],
    "referenceArtifact": "function compose(functions) {\n  if (!Array.isArray(functions) || functions.some(fn => typeof fn !== 'function')) throw new TypeError('Invalid functions');\n  const steps = functions.slice();\n  return value => { for (let i = steps.length - 1; i >= 0; i--) value = steps[i](value); return value; };\n}\nfunction pipe(functions) {\n  if (!Array.isArray(functions) || functions.some(fn => typeof fn !== 'function')) throw new TypeError('Invalid functions');\n  const steps = functions.slice();\n  return value => { for (const fn of steps) value = fn(value); return value; };\n}",
    "explanation": [
      "组合与管道使用同一个累积变量，每一步用新结果替换 value。不同的只是遍历方向。加法与乘法不交换，所以 3 的两个输出可以直接揭露顺序错误。",
      "复制 steps 冻结创建时的步骤列表，调用方随后 push 不会悄悄改变已创建管道；复制的是函数引用，不复制函数闭包状态。",
      "同步异常自然打断后续变换并向调用者抛出。Promise 返回值在此只是一种普通值，下一步骤会直接收到它；需要异步管道时应另行定义等待和失败语义。"
    ],
    "alternative": "reduce/reduceRight 可以表达相同顺序；for 循环更容易逐步调试。异步 pipe 可以逐步 await，但不是本题合同。",
    "complexity": "创建时间/空间 O(n)，每次执行 O(n) 外加每步函数成本；执行额外空间 O(1)。",
    "commonMistakes": [
      "compose 按左到右执行改变结果。",
      "reverse 原列表造成外部副作用。"
    ],
    "knowledgeIds": [
      "K01-03"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(pipe([x => x+1, x => x*2])(3));",
        "expectedOutput": "8",
        "explanation": "先 3+1 得 4，再乘 2 得 8。",
        "expectedLogs": [
          "8"
        ]
      },
      {
        "code": "console.log(compose([x => x+1, x => x*2])(3));",
        "expectedOutput": "7",
        "explanation": "先执行右侧 3×2 得 6，再加 1 得 7。",
        "expectedLogs": [
          "7"
        ]
      },
      {
        "code": "const value = {}; console.log(pipe([])(value) === value);",
        "expectedOutput": "true",
        "explanation": "空步骤不会生成新值，直接返回输入身份。",
        "expectedLogs": [
          "true"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E09-T01",
        "name": "方向",
        "purpose": "compose 与 pipe 顺序不同",
        "code": "let f=x=>x+1,g=x=>x*2;equal(compose([f,g])(3),7);equal(pipe([f,g])(3),8);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "方向",
        "expectedOutcome": "compose 与 pipe 顺序不同",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E09-T02",
        "name": "空组合",
        "purpose": "返回原值身份",
        "code": "let x={};assert(compose([])(x)===x&&pipe([])(x)===x,\"identity\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空组合",
        "expectedOutcome": "返回原值身份",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E09-T03",
        "name": "单函数",
        "purpose": "直接转换",
        "code": "equal(compose([x=>x+1])(1),2);equal(pipe([x=>x+1])(1),2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "单函数",
        "expectedOutcome": "直接转换",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E09-T04",
        "name": "输入不变",
        "purpose": "不 reverse 原列表",
        "code": "let f=x=>x,g=x=>x,a=[f,g];compose(a)(1);assert(a[0]===f&&a[1]===g,\"input order\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "输入不变",
        "expectedOutcome": "不 reverse 原列表",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E09-T05",
        "name": "异常透传",
        "purpose": "原错误身份",
        "code": "let error=new Error(\"x\");try{pipe([()=>{throw error}])(1);assert(false,\"must throw\")}catch(e){assert(e===error,\"error identity\")};",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "异常透传",
        "expectedOutcome": "原错误身份",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E09-T06",
        "name": "非法函数与快照",
        "purpose": "拒绝非法且隔离外部列表变动",
        "code": "expectThrow(()=>pipe([1]),\"TypeError\");expectThrow(()=>compose(null),\"TypeError\");let a=[x=>x+1],p=pipe(a);a.push(x=>x*10);equal(p(1),2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "非法函数与快照",
        "expectedOutcome": "拒绝非法且隔离外部列表变动",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "compose 方向错",
        "code": "function compose(functions) {\n  if (!Array.isArray(functions) || functions.some(fn => typeof fn !== 'function')) throw new TypeError('Invalid functions');\n  const steps = functions.slice();\n  return value => { for (let i = 0; i < steps.length; i++) value = steps[i](value); return value; };\n}\nfunction pipe(functions) {\n  if (!Array.isArray(functions) || functions.some(fn => typeof fn !== 'function')) throw new TypeError('Invalid functions');\n  const steps = functions.slice();\n  return value => { for (const fn of steps) value = fn(value); return value; };\n}"
      },
      {
        "name": "空组合丢身份",
        "code": "function compose(functions) {\n  if (!Array.isArray(functions) || functions.some(fn => typeof fn !== 'function')) throw new TypeError('Invalid functions');\n  const steps = functions.slice();\n  return value => { for (let i = steps.length - 1; i >= 0; i--) value = steps[i](value); return value; };\n}\nfunction pipe(functions) {\n  if (!Array.isArray(functions) || functions.some(fn => typeof fn !== 'function')) throw new TypeError('Invalid functions');\n  const steps = functions.slice();\n  return value => { if (!steps.length) return undefined; for (const fn of steps) value = fn(value); return value; };\n}"
      }
    ]
  },
  {
    "id": "E22",
    "slug": "tuple-memoization",
    "title": "多参数记忆化",
    "summary": "昂贵的同步计算可缓存，但把参数拼成字符串会碰撞，也会丢失对象身份与 this。实现多参数记忆化，用参数前缀树记录完整元组，并显式保存命中标志。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 30,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "memoize(fn) → wrapped，wrapped.clear() 清空缓存；fn 必须为函数，否则 TypeError。同步结果按 [this,...args] 元组缓存，位置、参数个数与对象身份有意义；键比较为 Map SameValueZero，抛出的异常不缓存。",
    "problem": [
      "昂贵的同步计算可缓存，但把参数拼成字符串会碰撞，也会丢失对象身份与 this。实现多参数记忆化，用参数前缀树记录完整元组，并显式保存命中标志。",
      "结果 undefined 仍缓存；clear 后下次重新计算。fn 的 this 原样转交，输入不修改，缓存持有对象强引用。本题不聚合异步 Promise，也不支持递归同键在途去重。"
    ],
    "allowedApis": [
      "JavaScript 标准内建对象",
      "Promise 与微任务",
      "setTimeout / clearTimeout（虚拟时钟）",
      "AbortController / AbortSignal（可取消题）"
    ],
    "unsupportedBehavior": [
      "不支持 DOM、网络、动态导入或宿主对象。",
      "不以运行耗时自动判定渐进复杂度；资源限制由独立运行器负责。"
    ],
    "starterArtifact": "function memoize(fn) {\n  // TODO 返回具有 clear() 的同步包装器。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "字符串拼接不能表示完整身份元组。",
      "每个参数作为一层 Map 的键，终点单独保存 present。",
      "this 先作为第一层；只在 fn 正常返回后写缓存。"
    ],
    "referenceArtifact": "function memoize(fn) {\n  if (typeof fn !== 'function') throw new TypeError('Invalid function');\n  const node = () => ({ children:new Map(), present:false, value:undefined });\n  let root=node();\n  function wrapped(...args) {\n    let current=root;\n    for (const key of [this,...args]) {\n      if (!current.children.has(key)) current.children.set(key,node());\n      current=current.children.get(key);\n    }\n    if (current.present) return current.value;\n    const value=fn.apply(this,args);\n    current.value=value; current.present=true;\n    return value;\n  }\n  wrapped.clear=()=>{root=node();};\n  return wrapped;\n}",
    "explanation": [
      "前缀树让 [1] 与 [1,undefined] 落在不同终点，也让 [\"a,b\",\"c\"] 与 [\"a\",\"b,c\"] 不碰撞。Map 按对象身份索引，因此内容相同的两个对象不会共享结果。",
      "this 是调用语义的一部分：同样的参数在两个接收者上可能得到不同值，不能只缓存 args。严格模式中的 undefined this 也作为正常键保存。",
      "present 在 fn 正常返回后才设为 true，故抛错不会留下命中项。clear 换根使旧对象图可被回收（假设没有别的引用）。缓存本身没有容量限制，长期运行必须考虑 LRU 或 WeakMap，但 WeakMap 无法容纳原始值键，需混合结构。"
    ],
    "alternative": "哈希参数适合明确可序列化的不可变数据，但必须定义碰撞与版本；WeakMap/Map 混合树可以减少对象强引用，代价是更多结构。",
    "complexity": "每次查找 O(k)，k 为参数数加 this；空间与缓存过的不同前缀总量成正比，未设容量上限。",
    "commonMistakes": [
      "join 或 JSON.stringify 把身份规则变成字符串规则。",
      "用 value!==undefined 判断命中会重复计算合法 undefined。"
    ],
    "knowledgeIds": [
      "K01-01",
      "K01-02"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "let n=0; const f=memoize((a,b)=>{n++;return a+b}); f(1,2); f(1,2); console.log(n);",
        "expectedOutput": "1",
        "explanation": "this 与两个参数的同一前缀路径最终落到已存在节点。",
        "expectedLogs": [
          "1"
        ]
      },
      {
        "code": "let n=0; const f=memoize(()=>{n++;return undefined}); f(); f(); console.log(n);",
        "expectedOutput": "1",
        "explanation": "present 与 value 分开，undefined 不是未命中标志。",
        "expectedLogs": [
          "1"
        ]
      },
      {
        "code": "let n=0; const f=memoize(()=>++n); console.log(f()); f.clear(); console.log(f());",
        "expectedOutput": "1、2",
        "explanation": "clear 替换根节点，后续查找不再访问旧缓存路径。",
        "expectedLogs": [
          "1",
          "2"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E22-T01",
        "name": "普通命中",
        "purpose": "相同元组只执行一次",
        "code": "let n=0,f=memoize((a,b)=>{n++;return a+b});equal(f(1,2),3);equal(f(1,2),3);equal(n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "普通命中",
        "expectedOutcome": "相同元组只执行一次",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E22-T02",
        "name": "元组碰撞",
        "purpose": "位置与参数个数隔离",
        "code": "let n=0,f=memoize((...a)=>{n++;return a});equal(f(\"a,b\",\"c\"),[\"a,b\",\"c\"]);equal(f(\"a\",\"b,c\"),[\"a\",\"b,c\"]);f(1);f(1,undefined);equal(n,4);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "元组碰撞",
        "expectedOutcome": "位置与参数个数隔离",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E22-T03",
        "name": "undefined 结果",
        "purpose": "存在标志不依赖值",
        "code": "let n=0,f=memoize(()=>{n++;return undefined});equal(f(),undefined);equal(f(),undefined);equal(n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "undefined 结果",
        "expectedOutcome": "存在标志不依赖值",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E22-T04",
        "name": "异常不缓存",
        "purpose": "每次异常仍执行",
        "code": "let n=0,f=memoize(()=>{n++;throw new Error(\"x\")});expectThrow(()=>f(),\"Error\");expectThrow(()=>f(),\"Error\");equal(n,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "异常不缓存",
        "expectedOutcome": "每次异常仍执行",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E22-T05",
        "name": "对象身份",
        "purpose": "同内容不同对象不同键",
        "code": "let n=0,f=memoize(x=>{n++;return x}),a={},b={};assert(f(a)===a&&f(b)===b&&f(a)===a,\"identities\");equal(n,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "对象身份",
        "expectedOutcome": "同内容不同对象不同键",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E22-T06",
        "name": "this 入键",
        "purpose": "不同接收者不共享",
        "code": "let n=0,f=memoize(function(x){n++;return this.value+x}),a={value:1},b={value:2};equal(f.call(a,3),4);equal(f.call(b,3),5);equal(f.call(a,3),4);equal(n,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "this 入键",
        "expectedOutcome": "不同接收者不共享",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E22-T07",
        "name": "clear",
        "purpose": "重置缓存可复用",
        "code": "let n=0,f=memoize(()=>++n);equal(f(),1);f.clear();f.clear();equal(f(),2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "clear",
        "expectedOutcome": "重置缓存可复用",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E22-T08",
        "name": "Map 规则校验",
        "purpose": "NaN 命中非函数拒绝",
        "code": "let n=0,f=memoize(()=>++n);equal(f(NaN),1);equal(f(NaN),1);equal(f(-0),2);equal(f(+0),2);expectThrow(()=>memoize(1),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "Map 规则校验",
        "expectedOutcome": "NaN 命中非函数拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "this 未入键",
        "code": "function memoize(fn) {\n  if (typeof fn !== 'function') throw new TypeError('Invalid function');\n  const node = () => ({ children:new Map(), present:false, value:undefined });\n  let root=node();\n  function wrapped(...args) {\n    let current=root;\n    for (const key of args) {\n      if (!current.children.has(key)) current.children.set(key,node());\n      current=current.children.get(key);\n    }\n    if (current.present) return current.value;\n    const value=fn.apply(this,args);\n    current.value=value; current.present=true;\n    return value;\n  }\n  wrapped.clear=()=>{root=node();};\n  return wrapped;\n}"
      },
      {
        "name": "undefined 不缓存",
        "code": "function memoize(fn) {\n  if (typeof fn !== 'function') throw new TypeError('Invalid function');\n  const node = () => ({ children:new Map(), present:false, value:undefined });\n  let root=node();\n  function wrapped(...args) {\n    let current=root;\n    for (const key of [this,...args]) {\n      if (!current.children.has(key)) current.children.set(key,node());\n      current=current.children.get(key);\n    }\n    if (current.value !== undefined) return current.value;\n    const value=fn.apply(this,args);\n    current.value=value; current.present=true;\n    return value;\n  }\n  wrapped.clear=()=>{root=node();};\n  return wrapped;\n}"
      }
    ]
  }
] as const satisfies readonly Exercise[];
