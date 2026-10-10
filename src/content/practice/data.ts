import type { Exercise } from "./types";

export const dataExercises = [
  {
    "id": "E06",
    "slug": "restricted-deep-clone",
    "title": "受限数据域深拷贝",
    "summary": "缓存或编辑数据时需要隔离可变结构，但 JSON 拷贝会丢失 Map、Date、稀疏数组和循环。实现受限图拷贝，准确保留对象之间的身份关系，遇到无法可靠处理的数据明确报错。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 40,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "clone(value) → 副本；支持 Object.prototype/null 原型普通对象、Array、Date、Map、Set，函数保持身份。保留图中的共享/循环引用，只复制自有可枚举数据属性（含 Symbol）；枚举访问器、未知原型抛 TypeError。",
    "problem": [
      "缓存或编辑数据时需要隔离可变结构，但 JSON 拷贝会丢失 Map、Date、稀疏数组和循环。实现受限图拷贝，准确保留对象之间的身份关系，遇到无法可靠处理的数据明确报错。",
      "不调用 getter，枚举访问器直接拒绝；非枚举属性忽略。Date 复制时间值，Map 的键和值递归，Set 元素递归。原对象不变，属性值复制后使用可写/可配置普通数据描述符；数组长度与空槽保留。"
    ],
    "allowedApis": [
      "JavaScript 标准内建对象",
      "Promise 与微任务",
      "setTimeout / clearTimeout（虚拟时钟）",
      "AbortController / AbortSignal（可取消题）"
    ],
    "unsupportedBehavior": [
      "不支持 DOM、WeakMap、WeakSet、类实例、跨 realm 内建对象、Proxy 或宿主对象。",
      "非枚举属性忽略；不保留冻结状态、只读描述符、访问器或类私有字段。"
    ],
    "starterArtifact": "function clone(value) {\n  // TODO 按受限对象图合同复制。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "复制的是对象图，需要旧对象到新对象的映射。",
      "分配空容器后立即登记，再递归填充。",
      "使用属性描述符区分数据属性与访问器，Reflect.ownKeys 覆盖 Symbol。"
    ],
    "referenceArtifact": "function clone(value, seen = new Map()) {\n  if (value === null || typeof value !== 'object') return value;\n  if (seen.has(value)) return seen.get(value);\n  const proto = Object.getPrototypeOf(value);\n  let result;\n  if (proto === Array.prototype) result = new Array(value.length);\n  else if (proto === Date.prototype) result = new Date(Date.prototype.getTime.call(value));\n  else if (proto === Map.prototype) result = new Map();\n  else if (proto === Set.prototype) result = new Set();\n  else if (proto === Object.prototype || proto === null) result = Object.create(proto);\n  else throw new TypeError('Unsupported prototype');\n  seen.set(value, result);\n  if (proto === Map.prototype) for (const [key, item] of Map.prototype.entries.call(value)) result.set(clone(key, seen), clone(item, seen));\n  if (proto === Set.prototype) for (const item of Set.prototype.values.call(value)) result.add(clone(item, seen));\n  for (const key of Reflect.ownKeys(value)) {\n    const descriptor = Object.getOwnPropertyDescriptor(value, key);\n    if (!descriptor.enumerable) continue;\n    if (!Object.hasOwn(descriptor, 'value')) throw new TypeError('Enumerable accessor');\n    Object.defineProperty(result, key, { value: clone(descriptor.value, seen), writable: true, enumerable: true, configurable: true });\n  }\n  return result;\n}",
    "explanation": [
      "深拷贝不是把每条路径独立重建。两个属性指向同一子对象时，副本也应该共享一个子对象。seen 按旧对象身份索引副本；第一次遇见时立即登记，这一步同时解决循环和共享。",
      "数组先分配原 length，再只复制枚举属性。没有出现的索引不写入，因此空槽仍为空槽；展开运算符则会把空槽变成 undefined。Map 与 Set 的内容不属于普通自有属性，必须单独遍历，但继续使用同一 seen。",
      "访问器不在数据域中。通过描述符检查而非 value[key] 读取，可以在不执行 getter 的前提下拒绝枚举访问器。只允许精确的已知原型，避免把带私有字段的类实例伪造为看似同类却无法使用的对象。跨 realm 内建对象、Proxy 与属性描述符完整保真均不在本题能力内。"
    ],
    "alternative": "宿主提供的 structuredClone 有不同数据域（例如函数不可复制），可以在业务中优先考虑；JSON 转换只能用于明确允许丢失身份与特殊值的树形 JSON 数据。",
    "complexity": "时间 O(V+E)，空间 O(V+E) 保存副本与映射；递归调用栈 O(深度)，极深数据可改显式栈。",
    "commonMistakes": [
      "每条路径单独递归会拆散共享引用并在环上溢栈。",
      "直接取属性值会执行 getter，可能产生副作用。"
    ],
    "knowledgeIds": [
      "K01-01",
      "K01-04",
      "K01-05",
      "K01-06"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "const x = {}; x.self = x; const y = clone(x); console.log(y !== x, y.self === y);",
        "expectedOutput": "true true",
        "explanation": "先登记 x→y 再遍历属性，再次遇到 x 时直接取 y，形成副本自环。",
        "expectedLogs": [
          "true true"
        ]
      },
      {
        "code": "const k = {}; const y = clone(new Map([[k, k]])); const key = [...y.keys()][0]; console.log(y.get(key) === key);",
        "expectedOutput": "true",
        "explanation": "键和值在同一 seen 映射中复制，保留共享关系。",
        "expectedLogs": [
          "true"
        ]
      },
      {
        "code": "try { clone({ get value() { return 1; } }); } catch (e) { console.log(e.name); }",
        "expectedOutput": "TypeError",
        "explanation": "读取描述符可以发现访问器而不执行 getter；不猜测访问器副作用。",
        "expectedLogs": [
          "TypeError"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E06-T01",
        "name": "普通结构",
        "purpose": "对象独立且输入不变",
        "code": "let x={a:{n:1}},y=clone(x);assert(y!==x&&y.a!==x.a,\"must clone\");y.a.n=2;equal(x.a.n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "普通结构",
        "expectedOutcome": "对象独立且输入不变",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E06-T02",
        "name": "循环",
        "purpose": "自环指向副本",
        "code": "let x={};x.self=x;let y=clone(x);assert(y.self===y,\"cycle\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "循环",
        "expectedOutcome": "自环指向副本",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E06-T03",
        "name": "共享",
        "purpose": "共享子对象不拆散",
        "code": "let child={},x={a:child,b:child},y=clone(x);assert(y.a===y.b&&y.a!==child,\"shared\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "共享",
        "expectedOutcome": "共享子对象不拆散",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E06-T04",
        "name": "Symbol 与原型空对象",
        "purpose": "枚举 symbol 保留",
        "code": "let s=Symbol(\"key\"),x=Object.create(null);x[s]={n:1};let y=clone(x);assert(Object.getPrototypeOf(y)===null,\"null prototype\");equal(y[s].n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "Symbol 与原型空对象",
        "expectedOutcome": "枚举 symbol 保留",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E06-T05",
        "name": "稀疏数组",
        "purpose": "长度与空槽保留",
        "code": "let x=new Array(3);x[2]={n:1};let y=clone(x);equal(y.length,3);assert(!(0 in y)&&!(1 in y),\"holes\");assert(y[2]!==x[2],\"element copy\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "稀疏数组",
        "expectedOutcome": "长度与空槽保留",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E06-T06",
        "name": "集合图",
        "purpose": "Map 键与 Set 共享副本",
        "code": "let k={},m=new Map([[k,k]]),x={m,s:new Set([k])},y=clone(x),key=[...y.m.keys()][0];assert(y.m.get(key)===key&&y.s.has(key)&&key!==k,\"map/set identities\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "集合图",
        "expectedOutcome": "Map 键与 Set 共享副本",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E06-T07",
        "name": "Date 与函数",
        "purpose": "时间复制函数保持身份",
        "code": "const fn=()=>1,x={d:new Date(123),fn},y=clone(x);equal(y.d.getTime(),123);assert(y.d!==x.d&&y.fn===fn,\"date/function\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "Date 与函数",
        "expectedOutcome": "时间复制函数保持身份",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E06-T08",
        "name": "访问器拒绝",
        "purpose": "不能触发 getter",
        "code": "let hits=0,x={get n(){hits++;return 1}};expectThrow(()=>clone(x),\"TypeError\");equal(hits,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "访问器拒绝",
        "expectedOutcome": "不能触发 getter",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E06-T09",
        "name": "未知原型",
        "purpose": "显式拒绝类实例",
        "code": "class Thing{};expectThrow(()=>clone(new Thing()),\"TypeError\");expectThrow(()=>clone(new WeakMap()),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "未知原型",
        "expectedOutcome": "显式拒绝类实例",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E06-T10",
        "name": "非枚举忽略",
        "purpose": "只复制指定数据域",
        "code": "let x={a:1};Object.defineProperty(x,\"secret\",{get(){throw new Error(\"no\")}});let y=clone(x);equal(Reflect.ownKeys(y),[\"a\"]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "非枚举忽略",
        "expectedOutcome": "只复制指定数据域",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E06-T11",
        "name": "内建方法遮蔽",
        "purpose": "内建数据读取不调用用户遮蔽方法",
        "code": "let d=new Date(123);d.getTime=()=>{throw new Error(\"shadow\")};let m=new Map([[1,2]]);m[Symbol.iterator]=()=>{throw new Error(\"shadow iterator\")};let y=clone({d,m});equal(Date.prototype.getTime.call(y.d),123);equal(Map.prototype.get.call(y.m,1),2);assert(y.d.getTime===d.getTime,\"own function retained\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "内建方法遮蔽",
        "expectedOutcome": "内建数据读取不调用用户遮蔽方法",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "丢失 Symbol",
        "code": "function clone(value, seen = new Map()) {\n  if (value === null || typeof value !== 'object') return value;\n  if (seen.has(value)) return seen.get(value);\n  const proto = Object.getPrototypeOf(value);\n  let result;\n  if (proto === Array.prototype) result = new Array(value.length);\n  else if (proto === Date.prototype) result = new Date(Date.prototype.getTime.call(value));\n  else if (proto === Map.prototype) result = new Map();\n  else if (proto === Set.prototype) result = new Set();\n  else if (proto === Object.prototype || proto === null) result = Object.create(proto);\n  else throw new TypeError('Unsupported prototype');\n  seen.set(value, result);\n  if (proto === Map.prototype) for (const [key, item] of Map.prototype.entries.call(value)) result.set(clone(key, seen), clone(item, seen));\n  if (proto === Set.prototype) for (const item of Set.prototype.values.call(value)) result.add(clone(item, seen));\n  for (const key of Object.keys(value)) {\n    const descriptor = Object.getOwnPropertyDescriptor(value, key);\n    if (!descriptor.enumerable) continue;\n    if (!Object.hasOwn(descriptor, 'value')) throw new TypeError('Enumerable accessor');\n    Object.defineProperty(result, key, { value: clone(descriptor.value, seen), writable: true, enumerable: true, configurable: true });\n  }\n  return result;\n}"
      },
      {
        "name": "拆散共享引用",
        "code": "function clone(value, seen = new Map()) {\n  if (value === null || typeof value !== 'object') return value;\n  if (seen.has(value)) return value;\n  const proto = Object.getPrototypeOf(value);\n  let result;\n  if (proto === Array.prototype) result = new Array(value.length);\n  else if (proto === Date.prototype) result = new Date(Date.prototype.getTime.call(value));\n  else if (proto === Map.prototype) result = new Map();\n  else if (proto === Set.prototype) result = new Set();\n  else if (proto === Object.prototype || proto === null) result = Object.create(proto);\n  else throw new TypeError('Unsupported prototype');\n  seen.set(value, result);\n  if (proto === Map.prototype) for (const [key, item] of Map.prototype.entries.call(value)) result.set(clone(key, seen), clone(item, seen));\n  if (proto === Set.prototype) for (const item of Set.prototype.values.call(value)) result.add(clone(item, seen));\n  for (const key of Reflect.ownKeys(value)) {\n    const descriptor = Object.getOwnPropertyDescriptor(value, key);\n    if (!descriptor.enumerable) continue;\n    if (!Object.hasOwn(descriptor, 'value')) throw new TypeError('Enumerable accessor');\n    Object.defineProperty(result, key, { value: clone(descriptor.value, seen), writable: true, enumerable: true, configurable: true });\n  }\n  return result;\n}"
      }
    ]
  },
  {
    "id": "E14",
    "slug": "lru-cache",
    "title": "LRU 缓存",
    "summary": "缓存需要在容量有限时淘汰最久未用项，但 undefined 也可能是合法缓存值。实现 LRU，用显式 found 区分缺失，读取和更新都会提升该 key 的最近使用顺序。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 35,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "createLRU(capacity) → {get,set,has,size}；capacity 非负整数，否则 RangeError。get 返回 {found:true,value} 或 {found:false}，命中提升最近使用；set 返回 undefined，更新同样提升；has 只查询不提升。",
    "problem": [
      "缓存需要在容量有限时淘汰最久未用项，但 undefined 也可能是合法缓存值。实现 LRU，用显式 found 区分缺失，读取和更新都会提升该 key 的最近使用顺序。",
      "key 遵循 Map 相等规则；容量 0 不存储。缓存不复制键值对象，也不修改它们；size 只读。目标为每个操作摊还 O(1)，不依赖全数组扫描。"
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
    "starterArtifact": "function createLRU(capacity) {\n  // TODO 返回 get/set/has 与只读 size。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "Map 的插入顺序可表达从最旧到最新。",
      "命中时先 delete 再 set，把键移动到末尾。",
      "存在性用 has 判定，不能用 get 的值判断。"
    ],
    "referenceArtifact": "function createLRU(capacity) {\n  if (!Number.isInteger(capacity) || capacity < 0) throw new RangeError('Invalid capacity');\n  const cache = new Map();\n  return {\n    get size() { return cache.size; },\n    has(key) { return cache.has(key); },\n    get(key) {\n      if (!cache.has(key)) return {found:false};\n      const value = cache.get(key);\n      cache.delete(key); cache.set(key, value);\n      return {found:true, value};\n    },\n    set(key, value) {\n      cache.delete(key);\n      if (capacity === 0) return;\n      cache.set(key, value);\n      if (cache.size > capacity) cache.delete(cache.keys().next().value);\n    }\n  };\n}",
    "explanation": [
      "Map 更新已有键不会改变迭代顺序，所以 get 与 set 都要先删除再插入。第一个 key 始终代表最久未用；插入超容量时删首项，就只淘汰一个。",
      "get 返回带 found 的记录，使 undefined 不再承担两个含义。has 不提升时间，因为它只是检查；否则简单存在性查询会影响淘汰结果，违背冻结的合同。",
      "Map 提供摊还常数级查找与插入，适合此题目标。缓存持有键值身份，不深拷贝，外部修改对象会在缓存读取时可见；若业务需要不可变快照应在边界另行复制。"
    ],
    "alternative": "哈希表加双向链表能更明确控制最坏情况和容量策略，但代码量更多；数组移动虽直观，却让命中成为 O(n)。",
    "complexity": "get/set/has 摊还 O(1)，空间 O(capacity)。Map 复杂度是实现性能假设，不承诺单次硬实时。",
    "commonMistakes": [
      "用 value===undefined 判断命中。",
      "更新已有 key 不 delete 会保留旧淘汰顺序。"
    ],
    "knowledgeIds": [
      "K16-02",
      "K01-01"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "const c=createLRU(1); c.set(\"x\",undefined); console.log(c.get(\"x\"),c.get(\"y\"));",
        "expectedOutput": "{found:true,value:undefined} {found:false}",
        "explanation": "found 标志区分缓存值为 undefined 与键不存在。",
        "expectedLogs": [
          "{ found: true, value: undefined } { found: false }"
        ]
      },
      {
        "code": "const c=createLRU(2); c.set(\"a\",1); c.set(\"b\",2); c.get(\"a\"); c.set(\"c\",3); console.log(c.has(\"b\"));",
        "expectedOutput": "false",
        "explanation": "读取 a 把它移动到最近端，b 成为淘汰目标。",
        "expectedLogs": [
          "false"
        ]
      },
      {
        "code": "const c=createLRU(0); c.set(\"a\",1); console.log(c.size);",
        "expectedOutput": "0",
        "explanation": "容量零是合法空缓存，不是参数错误。",
        "expectedLogs": [
          "0"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E14-T01",
        "name": "淘汰顺序",
        "purpose": "get 提升最近使用",
        "code": "let c=createLRU(2);c.set(\"a\",1);c.set(\"b\",2);equal(c.get(\"a\"),{found:true,value:1});c.set(\"c\",3);equal(c.get(\"b\"),{found:false});equal(c.size,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "淘汰顺序",
        "expectedOutcome": "get 提升最近使用",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E14-T02",
        "name": "更新提升",
        "purpose": "set 更新不增加 size 且提升",
        "code": "let c=createLRU(2);c.set(\"a\",1);c.set(\"b\",2);c.set(\"a\",3);c.set(\"c\",4);equal(c.get(\"a\"),{found:true,value:3});assert(!c.has(\"b\"),\"evict b\");equal(c.size,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "更新提升",
        "expectedOutcome": "set 更新不增加 size 且提升",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E14-T03",
        "name": "undefined",
        "purpose": "命中与未命中区分",
        "code": "let c=createLRU(1);c.set(\"x\",undefined);equal(c.get(\"x\"),{found:true,value:undefined});equal(c.get(\"y\"),{found:false});",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "undefined",
        "expectedOutcome": "命中与未命中区分",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E14-T04",
        "name": "零容量",
        "purpose": "永不存储",
        "code": "let c=createLRU(0);c.set(\"x\",1);equal(c.size,0);equal(c.get(\"x\"),{found:false});",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "零容量",
        "expectedOutcome": "永不存储",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E14-T05",
        "name": "容量一",
        "purpose": "新键淘汰旧键",
        "code": "let c=createLRU(1);c.set(1,\"a\");c.set(2,\"b\");assert(!c.has(1)&&c.has(2),\"single capacity\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "容量一",
        "expectedOutcome": "新键淘汰旧键",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E14-T06",
        "name": "Map 相等",
        "purpose": "NaN 命中对象键按身份",
        "code": "let c=createLRU(3),a={},b={};c.set(a,1);c.set(b,2);c.set(NaN,3);equal(c.get(a).value,1);equal(c.get(b).value,2);equal(c.get(NaN).value,3);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "Map 相等",
        "expectedOutcome": "NaN 命中对象键按身份",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E14-T07",
        "name": "has 不提升",
        "purpose": "只检查不改变使用顺序",
        "code": "let c=createLRU(2);c.set(\"a\",1);c.set(\"b\",2);assert(c.has(\"a\"),\"has a\");c.set(\"c\",3);assert(!c.has(\"a\"),\"has must not refresh\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "has 不提升",
        "expectedOutcome": "只检查不改变使用顺序",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E14-T08",
        "name": "非法容量",
        "purpose": "范围失败",
        "code": "for(const n of [-1,1.5,NaN,Infinity])expectThrow(()=>createLRU(n),\"RangeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "非法容量",
        "expectedOutcome": "范围失败",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "undefined 当缺失",
        "code": "function createLRU(capacity) {\n  if (!Number.isInteger(capacity) || capacity < 0) throw new RangeError('Invalid capacity');\n  const cache = new Map();\n  return {\n    get size() { return cache.size; },\n    has(key) { return cache.has(key); },\n    get(key) {\n      if (cache.get(key) === undefined) return {found:false};\n      const value = cache.get(key);\n      cache.delete(key); cache.set(key, value);\n      return {found:true, value};\n    },\n    set(key, value) {\n      cache.delete(key);\n      if (capacity === 0) return;\n      cache.set(key, value);\n      if (cache.size > capacity) cache.delete(cache.keys().next().value);\n    }\n  };\n}"
      },
      {
        "name": "get 不提升",
        "code": "function createLRU(capacity) {\n  if (!Number.isInteger(capacity) || capacity < 0) throw new RangeError('Invalid capacity');\n  const cache = new Map();\n  return {\n    get size() { return cache.size; },\n    has(key) { return cache.has(key); },\n    get(key) {\n      if (!cache.has(key)) return {found:false};\n      const value = cache.get(key);\n      /* no recency update */\n      return {found:true, value};\n    },\n    set(key, value) {\n      cache.delete(key);\n      if (capacity === 0) return;\n      cache.set(key, value);\n      if (cache.size > capacity) cache.delete(cache.keys().next().value);\n    }\n  };\n}"
      }
    ]
  },
  {
    "id": "E15",
    "slug": "array-to-forest",
    "title": "数组转森林",
    "summary": "接口经常返回平铺的 id/parentId 节点。转换为森林时必须支持父节点晚出现、孤儿作为根，并保持根和兄弟的输入顺序；不能把非法环静默丢弃。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 30,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "toForest(nodes) → Array<新节点>；nodes 为节点数组，每项自有 id 为 string/number 且非 NaN，parentId 为同域或 null/undefined。重复 id、环、保留字段 children 冲突抛 Error；无效结构抛 TypeError。",
    "problem": [
      "接口经常返回平铺的 id/parentId 节点。转换为森林时必须支持父节点晚出现、孤儿作为根，并保持根和兄弟的输入顺序；不能把非法环静默丢弃。",
      "新节点浅复制输入其他自有可枚举字段，并生成 children 数组；输入节点不改动，其他嵌套字段按引用保留。parentId 缺失/null/undefined 表示根，不存在父亲也为根。仅支持普通对象，不使用 this。"
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
    "starterArtifact": "function toForest(nodes) {\n  // TODO 返回新节点构成的森林。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "先建立 id 索引，不能边读边依赖父亲已出现。",
      "环检测使用未访问/正在访问/已完成三种状态。",
      "遍历索引的插入顺序挂接，保持兄弟顺序。"
    ],
    "referenceArtifact": "function toForest(nodes) {\n  if (!Array.isArray(nodes)) throw new TypeError('Invalid nodes');\n  const byId = new Map();\n  const validId = id => typeof id === 'string' || (typeof id === 'number' && !Number.isNaN(id));\n  for (const node of nodes) {\n    if (!node || Object.getPrototypeOf(node) !== Object.prototype || !Object.hasOwn(node,'id') || !validId(node.id) || (node.parentId != null && !validId(node.parentId))) throw new TypeError('Invalid node');\n    if (Object.hasOwn(node,'children')) throw new Error('Reserved children');\n    if (byId.has(node.id)) throw new Error('Duplicate id');\n    byId.set(node.id, {...node, children:[]});\n  }\n  const state = new Map();\n  function visit(id) {\n    if (state.get(id) === 1) throw new Error('Cycle');\n    if (state.get(id) === 2) return;\n    state.set(id,1);\n    const parent = byId.get(id).parentId;\n    if (parent != null && byId.has(parent)) visit(parent);\n    state.set(id,2);\n  }\n  for (const id of byId.keys()) visit(id);\n  const roots = [];\n  for (const node of byId.values()) {\n    if (node.parentId != null && byId.has(node.parentId)) byId.get(node.parentId).children.push(node);\n    else roots.push(node);\n  }\n  return roots;\n}",
    "explanation": [
      "两遍构建把查找与挂接分开。第一遍创建副本并校验唯一性，使晚出现的父节点同样可查；第二遍按输入插入顺序挂接，所以每组 children 自然保持兄弟顺序。",
      "环可能完全没有根，单纯从根遍历不会发现它。visit 沿 parent 链检查所有节点，正在访问的节点再次出现代表环，已完成的节点不必重查，从而避免对每个节点重复走整条祖先链。",
      "这是结构转换而非深拷贝：节点容器和 children 是新的，其他字段保留引用。对属性访问器或 Proxy 没有安全保证，题面要求普通仓库数据；极深父链可以改显式栈避免递归深度限制。"
    ],
    "alternative": "把每个节点与所有节点比较可实现简单版本，但成本 O(n²)；索引加显式父链栈适合极深数据。",
    "complexity": "平均时间 O(n)，额外空间 O(n)，递归栈最坏 O(n)。",
    "commonMistakes": [
      "单遍构建会丢掉晚出现父节点。",
      "仅从根检测会漏掉没有根的环。"
    ],
    "knowledgeIds": [
      "K16-01",
      "K16-02",
      "K01-01"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(toForest([{id:2,parentId:1},{id:1}])[0].children[0].id);",
        "expectedOutput": "2",
        "explanation": "先建立完整索引，再挂接，所以父亲不必先出现。",
        "expectedLogs": [
          "2"
        ]
      },
      {
        "code": "console.log(toForest([{id:1,parentId:99}]).map(x=>x.id));",
        "expectedOutput": "[1]",
        "explanation": "缺父亲是明确允许的孤儿根，不丢节点。",
        "expectedLogs": [
          "[ 1 ]"
        ]
      },
      {
        "code": "try{toForest([{id:1,parentId:1}])}catch(e){console.log(e.message)}",
        "expectedOutput": "Cycle",
        "explanation": "父链中再次遇到正在访问节点，说明存在环。",
        "expectedLogs": [
          "Cycle"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E15-T01",
        "name": "乱序父子",
        "purpose": "父节点可晚出现",
        "code": "let r=toForest([{id:2,parentId:1},{id:1,parentId:null}]);equal(r.length,1);equal(r[0].children[0].id,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "乱序父子",
        "expectedOutcome": "父节点可晚出现",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E15-T02",
        "name": "兄弟顺序",
        "purpose": "按输入顺序挂接",
        "code": "let r=toForest([{id:1},{id:3,parentId:1},{id:2,parentId:1}]);equal(r[0].children.map(x=>x.id),[3,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "兄弟顺序",
        "expectedOutcome": "按输入顺序挂接",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E15-T03",
        "name": "孤儿与多根",
        "purpose": "缺父亲作为根",
        "code": "equal(toForest([{id:1,parentId:99},{id:2}]).map(x=>x.id),[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "孤儿与多根",
        "expectedOutcome": "缺父亲作为根",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E15-T04",
        "name": "空输入",
        "purpose": "返回空森林",
        "code": "equal(toForest([]),[]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空输入",
        "expectedOutcome": "返回空森林",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E15-T05",
        "name": "重复 ID",
        "purpose": "不可覆盖重复",
        "code": "expectThrow(()=>toForest([{id:1},{id:1}]),\"Error\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "重复 ID",
        "expectedOutcome": "不可覆盖重复",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E15-T06",
        "name": "环拒绝",
        "purpose": "自环与跨节点环显式失败",
        "code": "expectThrow(()=>toForest([{id:1,parentId:1}]),\"Error\");expectThrow(()=>toForest([{id:1,parentId:2},{id:2,parentId:1}]),\"Error\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "环拒绝",
        "expectedOutcome": "自环与跨节点环显式失败",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E15-T07",
        "name": "输入保持",
        "purpose": "浅复制且不注入 children",
        "code": "let extra={},nodes=[{id:1,extra},{id:2,parentId:1}],r=toForest(nodes);assert(r[0]!==nodes[0]&&!Object.hasOwn(nodes[0],\"children\"),\"no mutation\");assert(r[0].extra===extra,\"shallow copy\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "输入保持",
        "expectedOutcome": "浅复制且不注入 children",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E15-T08",
        "name": "校验与零 ID",
        "purpose": "合法 0，非法和保留字段拒绝",
        "code": "equal(toForest([{id:0},{id:1,parentId:0}])[0].children[0].id,1);expectThrow(()=>toForest([{id:NaN}]),\"TypeError\");expectThrow(()=>toForest([{id:1,children:[]}]),\"Error\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "校验与零 ID",
        "expectedOutcome": "合法 0，非法和保留字段拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "忽略重复",
        "code": "function toForest(nodes) {\n  if (!Array.isArray(nodes)) throw new TypeError('Invalid nodes');\n  const byId = new Map();\n  const validId = id => typeof id === 'string' || (typeof id === 'number' && !Number.isNaN(id));\n  for (const node of nodes) {\n    if (!node || Object.getPrototypeOf(node) !== Object.prototype || !Object.hasOwn(node,'id') || !validId(node.id) || (node.parentId != null && !validId(node.parentId))) throw new TypeError('Invalid node');\n    if (Object.hasOwn(node,'children')) throw new Error('Reserved children');\n    /* silently overwrite */\n    byId.set(node.id, {...node, children:[]});\n  }\n  const state = new Map();\n  function visit(id) {\n    if (state.get(id) === 1) throw new Error('Cycle');\n    if (state.get(id) === 2) return;\n    state.set(id,1);\n    const parent = byId.get(id).parentId;\n    if (parent != null && byId.has(parent)) visit(parent);\n    state.set(id,2);\n  }\n  for (const id of byId.keys()) visit(id);\n  const roots = [];\n  for (const node of byId.values()) {\n    if (node.parentId != null && byId.has(node.parentId)) byId.get(node.parentId).children.push(node);\n    else roots.push(node);\n  }\n  return roots;\n}"
      },
      {
        "name": "0 parent 当根",
        "code": "function toForest(nodes) {\n  if (!Array.isArray(nodes)) throw new TypeError('Invalid nodes');\n  const byId = new Map();\n  const validId = id => typeof id === 'string' || (typeof id === 'number' && !Number.isNaN(id));\n  for (const node of nodes) {\n    if (!node || Object.getPrototypeOf(node) !== Object.prototype || !Object.hasOwn(node,'id') || !validId(node.id) || (node.parentId != null && !validId(node.parentId))) throw new TypeError('Invalid node');\n    if (Object.hasOwn(node,'children')) throw new Error('Reserved children');\n    if (byId.has(node.id)) throw new Error('Duplicate id');\n    byId.set(node.id, {...node, children:[]});\n  }\n  const state = new Map();\n  function visit(id) {\n    if (state.get(id) === 1) throw new Error('Cycle');\n    if (state.get(id) === 2) return;\n    state.set(id,1);\n    const parent = byId.get(id).parentId;\n    if (parent != null && byId.has(parent)) visit(parent);\n    state.set(id,2);\n  }\n  for (const id of byId.keys()) visit(id);\n  const roots = [];\n  for (const node of byId.values()) {\n    if (node.parentId && byId.has(node.parentId)) byId.get(node.parentId).children.push(node);\n    else roots.push(node);\n  }\n  return roots;\n}"
      }
    ]
  },
  {
    "id": "E16",
    "slug": "tree-traversal",
    "title": "树遍历与查找",
    "summary": "树菜单中的搜索和展示需要不同顺序。实现广度优先与先序深度优先，并用对应顺序返回首个匹配节点；多根树视为一个森林，BFS 先访问所有根。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 20,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "traverse(roots, mode=\"bfs\") → 节点引用数组；findNode(roots,predicate,mode=\"bfs\") → 首个匹配节点或 undefined。roots 为树数组，节点 children 缺失或数组，mode 仅 bfs/dfs，否则 TypeError。",
    "problem": [
      "树菜单中的搜索和展示需要不同顺序。实现广度优先与先序深度优先，并用对应顺序返回首个匹配节点；多根树视为一个森林，BFS 先访问所有根。",
      "不修改 roots/children，不复制节点身份，predicate 抛错原样透传。不支持环与共享节点图；节点必须为非 null 对象，children 非数组抛 TypeError。"
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
    "starterArtifact": "function traverse(roots, mode = \"bfs\") { throw new Error(\"未实现\"); }\nfunction findNode(roots, predicate, mode = \"bfs\") { throw new Error(\"未实现\"); }",
    "hints": [
      "BFS 用队列，DFS 用栈。",
      "DFS 压栈时从右到左，避免兄弟顺序反转。",
      "保存节点引用，不对输入数组 reverse。"
    ],
    "referenceArtifact": "function traverse(roots, mode='bfs') {\n  if (!Array.isArray(roots) || !['bfs','dfs'].includes(mode)) throw new TypeError('Invalid traversal');\n  const pending = roots.slice(), result = [];\n  if (mode === 'dfs') pending.reverse();\n  let head = 0;\n  while (mode === 'bfs' ? head < pending.length : pending.length > 0) {\n    const node = mode === 'bfs' ? pending[head++] : pending.pop();\n    if (!node || typeof node !== 'object' || (node.children !== undefined && !Array.isArray(node.children))) throw new TypeError('Invalid node');\n    result.push(node);\n    const children = node.children || [];\n    if (mode === 'bfs') pending.push(...children);\n    else for (let i=children.length-1;i>=0;i--) pending.push(children[i]);\n  }\n  return result;\n}\nfunction findNode(roots, predicate, mode='bfs') {\n  if (typeof predicate !== 'function') throw new TypeError('Invalid predicate');\n  return traverse(roots,mode).find(predicate);\n}",
    "explanation": [
      "BFS 的 pending 是带 head 指针的数组，读取不会 shift 整个数组；子节点入队末尾，所以所有同层节点先于更深层。多根森林的根在初始化时同时入队。",
      "DFS 使用栈，后入先出。根和孩子都要逆序压入才能获得从左到右的先序结果。复制 roots 再 reverse 保护调用者数组。",
      "findNode 在参考方案中先得到完整遍历再找首项，顺序清晰且复用校验，但会访问全部节点。数据保证无环；把它当作图遍历会永久扩展，图算法应增加 visited 并重新定义共享节点语义。"
    ],
    "alternative": "生成器或边遍历边匹配可以在找到目标时提前停止，节省完整结果数组，但需决定未访问部分是否仍要校验。",
    "complexity": "遍历时间 O(n)，参考 find 同样 O(n)；结果和队列/栈空间 O(n)。",
    "commonMistakes": [
      "直接正序压栈反转兄弟访问顺序。",
      "BFS 每次 shift 大数组可能退化为 O(n²)。"
    ],
    "knowledgeIds": [
      "K16-01",
      "K16-02"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(traverse([{id:1,children:[{id:2}]}],\"bfs\").map(n=>n.id));",
        "expectedOutput": "[1,2]",
        "explanation": "队列先读取根，再把其孩子追加末尾。",
        "expectedLogs": [
          "[ 1, 2 ]"
        ]
      },
      {
        "code": "console.log(traverse([{id:1,children:[{id:3}]},{id:2}],\"dfs\").map(n=>n.id));",
        "expectedOutput": "[1,3,2]",
        "explanation": "栈用逆序压入孩子，使最左孩子先弹出；第一棵子树结束才访问第二根。",
        "expectedLogs": [
          "[ 1, 3, 2 ]"
        ]
      },
      {
        "code": "console.log(findNode([{id:1}],n=>n.id===2));",
        "expectedOutput": "undefined",
        "explanation": "完整顺序中没有匹配项，返回明确未命中值。",
        "expectedLogs": [
          "undefined"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E16-T01",
        "name": "两种顺序",
        "purpose": "BFS 分层 DFS 先序",
        "code": "let roots=[{id:1,children:[{id:2,children:[{id:4}]},{id:3}]}];equal(traverse(roots,\"bfs\").map(n=>n.id),[1,2,3,4]);equal(traverse(roots,\"dfs\").map(n=>n.id),[1,2,4,3]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "两种顺序",
        "expectedOutcome": "BFS 分层 DFS 先序",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E16-T02",
        "name": "空森林",
        "purpose": "空遍历和缺失",
        "code": "equal(traverse([]),[]);equal(findNode([],()=>true),undefined);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空森林",
        "expectedOutcome": "空遍历和缺失",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E16-T03",
        "name": "多根",
        "purpose": "BFS 根优先 DFS 第一根子树优先",
        "code": "let roots=[{id:1,children:[{id:3}]},{id:2}];equal(traverse(roots).map(n=>n.id),[1,2,3]);equal(traverse(roots,\"dfs\").map(n=>n.id),[1,3,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "多根",
        "expectedOutcome": "BFS 根优先 DFS 第一根子树优先",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E16-T04",
        "name": "首个匹配",
        "purpose": "按遍历顺序返回身份",
        "code": "let child={id:2},root={id:1,children:[child]};assert(findNode([root],n=>n.id===2)===child,\"identity\");assert(findNode([root],()=>true)===root,\"first\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "首个匹配",
        "expectedOutcome": "按遍历顺序返回身份",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E16-T05",
        "name": "输入不变",
        "purpose": "不 reverse children",
        "code": "let a={id:1},b={id:2},roots=[{children:[a,b]}];traverse(roots,\"dfs\");assert(roots[0].children[0]===a,\"no mutation\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "输入不变",
        "expectedOutcome": "不 reverse children",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E16-T06",
        "name": "失败与未命中",
        "purpose": "谓词异常透传校验明确",
        "code": "equal(findNode([{id:1}],()=>false),undefined);expectThrow(()=>findNode([{}],()=>{throw new Error(\"x\")}),\"Error\");expectThrow(()=>traverse([],\"bad\"),\"TypeError\");expectThrow(()=>traverse([{children:1}]),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "失败与未命中",
        "expectedOutcome": "谓词异常透传校验明确",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "DFS 兄弟反转",
        "code": "function traverse(roots, mode='bfs') {\n  if (!Array.isArray(roots) || !['bfs','dfs'].includes(mode)) throw new TypeError('Invalid traversal');\n  const pending = roots.slice(), result = [];\n  if (mode === 'dfs') pending.reverse();\n  let head = 0;\n  while (mode === 'bfs' ? head < pending.length : pending.length > 0) {\n    const node = mode === 'bfs' ? pending[head++] : pending.pop();\n    if (!node || typeof node !== 'object' || (node.children !== undefined && !Array.isArray(node.children))) throw new TypeError('Invalid node');\n    result.push(node);\n    const children = node.children || [];\n    if (mode === 'bfs') pending.push(...children);\n    else for (let i=0;i<children.length;i++) pending.push(children[i]);\n  }\n  return result;\n}\nfunction findNode(roots, predicate, mode='bfs') {\n  if (typeof predicate !== 'function') throw new TypeError('Invalid predicate');\n  return traverse(roots,mode).find(predicate);\n}"
      },
      {
        "name": "find 返回最后项",
        "code": "function traverse(roots, mode='bfs') {\n  if (!Array.isArray(roots) || !['bfs','dfs'].includes(mode)) throw new TypeError('Invalid traversal');\n  const pending = roots.slice(), result = [];\n  if (mode === 'dfs') pending.reverse();\n  let head = 0;\n  while (mode === 'bfs' ? head < pending.length : pending.length > 0) {\n    const node = mode === 'bfs' ? pending[head++] : pending.pop();\n    if (!node || typeof node !== 'object' || (node.children !== undefined && !Array.isArray(node.children))) throw new TypeError('Invalid node');\n    result.push(node);\n    const children = node.children || [];\n    if (mode === 'bfs') pending.push(...children);\n    else for (let i=children.length-1;i>=0;i--) pending.push(children[i]);\n  }\n  return result;\n}\nfunction findNode(roots, predicate, mode='bfs') {\n  if (typeof predicate !== 'function') throw new TypeError('Invalid predicate');\n  return traverse(roots,mode).reverse().find(predicate);\n}"
      }
    ]
  },
  {
    "id": "E17",
    "slug": "own-property-path",
    "title": "路径读取",
    "summary": "配置读取需要区分路径不存在与值恰好为 false、0 或 undefined。实现自有属性路径读取，不沿原型链查找，不执行访问器，并在入口拒绝危险片段。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 20,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "getPath(value, path, defaultValue) → 属性值或默认值；path 为 string/非负安全整数片段数组。仅访问自有数据属性，禁止 __proto__/prototype/constructor 片段；访问器、非法片段抛 TypeError。",
    "problem": [
      "配置读取需要区分路径不存在与值恰好为 false、0 或 undefined。实现自有属性路径读取，不沿原型链查找，不执行访问器，并在入口拒绝危险片段。",
      "空路径返回 value 身份；缺失或中间层为 null/undefined/原始值返回 defaultValue，存在且值为 undefined 仍返回 undefined。先校验整条路径，不因前段缺失而跳过后段危险片段。输入不变，不使用 this。"
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
    "starterArtifact": "function getPath(value, path, defaultValue) {\n  // TODO 仅访问自有数据属性。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "存在性与值分开判断。",
      "先校验所有片段，再沿路径取描述符。",
      "只有 value 描述符可读，getter 不在数据域。"
    ],
    "referenceArtifact": "function getPath(value, path, defaultValue) {\n  if (!Array.isArray(path)) throw new TypeError('Invalid path');\n  for (const part of path) {\n    if (!(typeof part === 'string' || (Number.isSafeInteger(part) && part >= 0)) || ['__proto__','prototype','constructor'].includes(part)) throw new TypeError('Unsafe path');\n  }\n  let current = value;\n  for (const part of path) {\n    if (current === null || (typeof current !== 'object' && typeof current !== 'function')) return defaultValue;\n    const descriptor = Object.getOwnPropertyDescriptor(current,part);\n    if (!descriptor) return defaultValue;\n    if (!Object.hasOwn(descriptor,'value')) throw new TypeError('Accessor not supported');\n    current = descriptor.value;\n  }\n  return current;\n}",
    "explanation": [
      "用 current[part]||defaultValue 会把 false 与 0 错当缺失，用 ?? 仍会把存在的 undefined 改成默认。参考方案通过自有属性描述符判断存在，因此值与命中两个概念不混淆。",
      "空路径不需要任何读取，直接返回输入。中间层不是对象或函数时停止并返回默认，避免把原始值隐式装箱后的属性当配置树继续读。",
      "完整预校验避免缺失前段掩盖危险后段。危险名称拒绝是一条明确的路径合同，不是对全部原型污染风险的普遍防护；Proxy 可以在描述符读取时执行陷阱，本题不提供 Proxy 安全保证。"
    ],
    "alternative": "路径字符串语法可更方便输入，但必须设计转义、数字索引和点号键规则；片段数组减少了歧义。",
    "complexity": "时间 O(path.length)，额外空间 O(1)。",
    "commonMistakes": [
      "用真值判断默认值会丢掉 0 与 false。",
      "in 运算符会把继承属性当作命中。"
    ],
    "knowledgeIds": [
      "K01-04",
      "K01-05"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(getPath({a:false},[\"a\"],\"默认\"));",
        "expectedOutput": "false",
        "explanation": "默认只替代缺失，不替代合法假值。",
        "expectedLogs": [
          "false"
        ]
      },
      {
        "code": "console.log(getPath({a:undefined},[\"a\"],\"默认\"));",
        "expectedOutput": "undefined",
        "explanation": "自有描述符存在，说明路径命中。",
        "expectedLogs": [
          "undefined"
        ]
      },
      {
        "code": "console.log(getPath(Object.create({a:1}),[\"a\"],\"默认\"));",
        "expectedOutput": "默认",
        "explanation": "继承属性不属于允许读取的数据边界。",
        "expectedLogs": [
          "默认"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E17-T01",
        "name": "正常路径",
        "purpose": "嵌套读取",
        "code": "equal(getPath({a:{b:2}},[\"a\",\"b\"],9),2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "正常路径",
        "expectedOutcome": "嵌套读取",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E17-T02",
        "name": "空路径",
        "purpose": "返回身份",
        "code": "let x={};assert(getPath(x,[],9)===x,\"identity\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空路径",
        "expectedOutcome": "返回身份",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E17-T03",
        "name": "缺失空中间层",
        "purpose": "默认值",
        "code": "equal(getPath({a:null},[\"a\",\"b\"],9),9);equal(getPath({},[\"x\"],9),9);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "缺失空中间层",
        "expectedOutcome": "默认值",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E17-T04",
        "name": "合法假值",
        "purpose": "0 false undefined 不替代",
        "code": "equal(getPath({a:0},[\"a\"],9),0);equal(getPath({a:false},[\"a\"],9),false);equal(getPath({a:undefined},[\"a\"],9),undefined);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "合法假值",
        "expectedOutcome": "0 false undefined 不替代",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E17-T05",
        "name": "数组和继承",
        "purpose": "索引可读，继承不能读",
        "code": "equal(getPath([3],[0],9),3);equal(getPath(Object.create({a:2}),[\"a\"],9),9);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "数组和继承",
        "expectedOutcome": "索引可读，继承不能读",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E17-T06",
        "name": "危险与访问器",
        "purpose": "完整预校验且不执行 getter",
        "code": "expectThrow(()=>getPath({},[\"missing\",\"__proto__\"]),\"TypeError\");expectThrow(()=>getPath({},[-1]),\"TypeError\");let n=0;expectThrow(()=>getPath({get a(){n++;return 1}},[\"a\"]),\"TypeError\");equal(n,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "危险与访问器",
        "expectedOutcome": "完整预校验且不执行 getter",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "假值替换",
        "code": "function getPath(value, path, defaultValue) {\n  if (!Array.isArray(path)) throw new TypeError('Invalid path');\n  for (const part of path) {\n    if (!(typeof part === 'string' || (Number.isSafeInteger(part) && part >= 0)) || ['__proto__','prototype','constructor'].includes(part)) throw new TypeError('Unsafe path');\n  }\n  let current = value;\n  for (const part of path) {\n    if (current === null || (typeof current !== 'object' && typeof current !== 'function')) return defaultValue;\n    const descriptor = Object.getOwnPropertyDescriptor(current,part);\n    if (!descriptor) return defaultValue;\n    if (!Object.hasOwn(descriptor,'value')) throw new TypeError('Accessor not supported');\n    current = descriptor.value;\n  }\n  return current || defaultValue;\n}"
      },
      {
        "name": "读取继承属性",
        "code": "function getPath(value, path, defaultValue) {\n  if (!Array.isArray(path)) throw new TypeError('Invalid path');\n  for (const part of path) {\n    if (!(typeof part === 'string' || (Number.isSafeInteger(part) && part >= 0)) || ['__proto__','prototype','constructor'].includes(part)) throw new TypeError('Unsafe path');\n  }\n  let current = value;\n  for (const part of path) {\n    if (current === null || (typeof current !== 'object' && typeof current !== 'function')) return defaultValue;\n    const descriptor = part in current ? {value:current[part]} : undefined;\n    if (!descriptor) return defaultValue;\n    if (!Object.hasOwn(descriptor,'value')) throw new TypeError('Accessor not supported');\n    current = descriptor.value;\n  }\n  return current;\n}"
      }
    ]
  },
  {
    "id": "E18",
    "slug": "flatten-depth",
    "title": "深度扁平化",
    "summary": "一层与深层数组扁平化有不同边界：只展开数组、保留对象身份、跳过空槽。实现可控深度的 flatten，并在操作前拒绝输入数组图中的循环，避免 Infinity 递归失控。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 20,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "flatten(array, depth=1) → 新数组；array 为数组，depth 为非负整数或 Infinity，否则 TypeError/RangeError。只展开数组，跳过各遍历层空槽；输入中任何可经数组元素抵达的环都抛 TypeError，包括 depth=0。",
    "problem": [
      "一层与深层数组扁平化有不同边界：只展开数组、保留对象身份、跳过空槽。实现可控深度的 flatten，并在操作前拒绝输入数组图中的循环，避免 Infinity 递归失控。",
      "depth=0 仍返回新数组并跳过顶层空槽；嵌套但不展开的数组按原引用保留。共享的无环数组合法，每次出现都按位置展开，不修改输入，不使用 this。"
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
    "starterArtifact": "function flatten(array, depth = 1) {\n  // TODO 按受限数组图合同展开。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "深度只控制展开，不控制数据域校验。",
      "active 跟踪当前递归链，checked 允许无环共享。",
      "用 hasOwn 检查索引，for...of 会把空槽读成 undefined。"
    ],
    "referenceArtifact": "function flatten(array, depth=1) {\n  if (!Array.isArray(array)) throw new TypeError('Invalid array');\n  if (!(depth === Infinity || (Number.isInteger(depth) && depth >= 0))) throw new RangeError('Invalid depth');\n  const active = new Set(), checked = new Set();\n  function validate(input) {\n    if (active.has(input)) throw new TypeError('Cyclic array');\n    if (checked.has(input)) return;\n    active.add(input);\n    for (let i=0;i<input.length;i++) if (Object.hasOwn(input,i) && Array.isArray(input[i])) validate(input[i]);\n    active.delete(input); checked.add(input);\n  }\n  validate(array);\n  const result = [];\n  function append(input, level) {\n    for (let i=0;i<input.length;i++) {\n      if (!Object.hasOwn(input,i)) continue;\n      const value = input[i];\n      if (Array.isArray(value) && level > 0) append(value,level===Infinity ? Infinity : level-1);\n      else result.push(value);\n    }\n  }\n  append(array,depth); return result;\n}",
    "explanation": [
      "扁平化深度描述跨越多少层数组。顶层不是一次展开，append 的每个嵌套数组在 level>0 时才递归。depth=0 仍建立新结果，并保留未展开数组身份。",
      "环检测使用当前递归链 active，不使用一个永久 visited 来拒绝重复数组。共享数组出现在两个位置并不是环，应产生两份展开值；checked 只避免重复验证，不能用于跳过展开。",
      "本题跳过自有空槽，也不读取原型上的数字属性；它是清晰的数据练习合同，不宣称完整复制原生 flat 对继承索引、物种构造器和访问器的全部语义。极深输入要改显式栈，避免调用栈上限。"
    ],
    "alternative": "显式栈可以消除递归深度限制；原生 flat 在已知可信数据中更简洁，但循环检测与继承属性语义需另行处理。",
    "complexity": "时间为数组图校验 O(V+E) 加实际展开访问 O(M)，空间 O(V+输出长度+递归深度)；共享子数组重复展开可使 M 大于图边数。",
    "commonMistakes": [
      "for...of 把空槽变成 undefined。",
      "全局 visited 在展开中跳过共享数组会丢失合法位置。"
    ],
    "knowledgeIds": [
      "K16-01",
      "K16-02",
      "K01-01"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(flatten([1,[2,[3]]],1));",
        "expectedOutput": "[1,2,[3]]",
        "explanation": "每跨一个数组层 depth 减一，达到零后嵌套数组保留。",
        "expectedLogs": [
          "[ 1, 2, [ 3 ] ]"
        ]
      },
      {
        "code": "console.log(flatten([,1,[,2]],Infinity));",
        "expectedOutput": "[1,2]",
        "explanation": "只处理自有索引，空槽不变成 undefined。",
        "expectedLogs": [
          "[ 1, 2 ]"
        ]
      },
      {
        "code": "const a=[]; a.push(a); try{flatten(a,0)}catch(e){console.log(e.name)}",
        "expectedOutput": "TypeError",
        "explanation": "环校验不受展开深度限制，不能因为 depth=0 就放过数据域违规。",
        "expectedLogs": [
          "TypeError"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E18-T01",
        "name": "默认深度",
        "purpose": "仅展开一层",
        "code": "equal(flatten([1,[2,[3]]]),[1,2,[3]]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "默认深度",
        "expectedOutcome": "仅展开一层",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E18-T02",
        "name": "零与无限",
        "purpose": "深度边界",
        "code": "let child=[2],input=[1,child],r=flatten(input,0);equal(r,[1,[2]]);assert(r!==input&&r[1]===child,\"depth zero identity\");equal(flatten([1,[2,[3]]],Infinity),[1,2,3]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "零与无限",
        "expectedOutcome": "深度边界",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E18-T03",
        "name": "空与空槽",
        "purpose": "遍历层空槽跳过",
        "code": "equal(flatten([]),[]);equal(flatten([,1,[,2]],Infinity),[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空与空槽",
        "expectedOutcome": "遍历层空槽跳过",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E18-T04",
        "name": "混合身份",
        "purpose": "只展开数组",
        "code": "let x={a:1};let r=flatten([x,[null,false]],Infinity);assert(r[0]===x,\"object identity\");equal(r.slice(1),[null,false]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "混合身份",
        "expectedOutcome": "只展开数组",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E18-T05",
        "name": "环与共享",
        "purpose": "环拒绝但无环共享允许",
        "code": "let a=[];a.push(a);expectThrow(()=>flatten(a,0),\"TypeError\");let shared=[1];equal(flatten([shared,shared],Infinity),[1,1]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "环与共享",
        "expectedOutcome": "环拒绝但无环共享允许",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E18-T06",
        "name": "输入与无效 depth",
        "purpose": "不改输入并校验",
        "code": "let input=[1,[2]];flatten(input);equal(input,[1,[2]]);for(const d of [-1,0.5,NaN])expectThrow(()=>flatten([],d),\"RangeError\");expectThrow(()=>flatten({}),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "输入与无效 depth",
        "expectedOutcome": "不改输入并校验",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "深度忽略",
        "code": "function flatten(array, depth=1) {\n  if (!Array.isArray(array)) throw new TypeError('Invalid array');\n  if (!(depth === Infinity || (Number.isInteger(depth) && depth >= 0))) throw new RangeError('Invalid depth');\n  const active = new Set(), checked = new Set();\n  function validate(input) {\n    if (active.has(input)) throw new TypeError('Cyclic array');\n    if (checked.has(input)) return;\n    active.add(input);\n    for (let i=0;i<input.length;i++) if (Object.hasOwn(input,i) && Array.isArray(input[i])) validate(input[i]);\n    active.delete(input); checked.add(input);\n  }\n  validate(array);\n  const result = [];\n  function append(input, level) {\n    for (let i=0;i<input.length;i++) {\n      if (!Object.hasOwn(input,i)) continue;\n      const value = input[i];\n      if (Array.isArray(value) && true) append(value,level===Infinity ? Infinity : level-1);\n      else result.push(value);\n    }\n  }\n  append(array,depth); return result;\n}"
      },
      {
        "name": "空槽保留 undefined",
        "code": "function flatten(array, depth=1) {\n  if (!Array.isArray(array)) throw new TypeError('Invalid array');\n  if (!(depth === Infinity || (Number.isInteger(depth) && depth >= 0))) throw new RangeError('Invalid depth');\n  const active = new Set(), checked = new Set();\n  function validate(input) {\n    if (active.has(input)) throw new TypeError('Cyclic array');\n    if (checked.has(input)) return;\n    active.add(input);\n    for (let i=0;i<input.length;i++) if (Object.hasOwn(input,i) && Array.isArray(input[i])) validate(input[i]);\n    active.delete(input); checked.add(input);\n  }\n  validate(array);\n  const result = [];\n  function append(input, level) {\n    for (let i=0;i<input.length;i++) {\n      /* reads holes as undefined */\n      const value = input[i];\n      if (Array.isArray(value) && level > 0) append(value,level===Infinity ? Infinity : level-1);\n      else result.push(value);\n    }\n  }\n  append(array,depth); return result;\n}"
      }
    ]
  },
  {
    "id": "E19",
    "slug": "stable-unique",
    "title": "稳定去重",
    "summary": "列表需要按业务键去重，而不是把对象序列化后比较。实现稳定去重：相同键只保留首次项，NaN 视为同键，正负零同键，对象键按身份区分。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 15,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "uniqueBy(items, keyFn=x=>x) → 新数组；items 为数组，keyFn 为函数，否则 TypeError。keyFn(item,index) 的键按 Map/Set SameValueZero 规则判断重复，保留首次项与输入顺序，异常透传。",
    "problem": [
      "列表需要按业务键去重，而不是把对象序列化后比较。实现稳定去重：相同键只保留首次项，NaN 视为同键，正负零同键，对象键按身份区分。",
      "不修改输入，不复制保留对象，不使用 keyFn 的 this。数组要求稠密，空槽不在题面数据域；keyFn 的副作用由调用方负责。"
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
    "starterArtifact": "function uniqueBy(items, keyFn = x => x) {\n  // TODO 返回稳定去重结果。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "结果数组与已见键集合各负其责。",
      "先求 key，再用 Set.has 判定。",
      "不要 stringify 键，它会破坏对象身份并遇到循环。"
    ],
    "referenceArtifact": "function uniqueBy(items, keyFn=x=>x) {\n  if (!Array.isArray(items) || typeof keyFn !== 'function') throw new TypeError('Invalid arguments');\n  const keys = new Set(), result = [];\n  for (let i=0;i<items.length;i++) {\n    const key = keyFn(items[i],i);\n    if (!keys.has(key)) { keys.add(key); result.push(items[i]); }\n  }\n  return result;\n}",
    "explanation": [
      "稳定性由单次正向遍历保证：结果只 append，首次进入集合的键不会再次 append。调用 keyFn 时传索引，允许明确以位置作为业务信息。",
      "SameValueZero 与 === 的差异在 NaN：NaN 与自己不全等，但 Set 会认为重复。它也合并正负零，保留结果的仍是首次输入项，所以 [-0,+0] 的输出保持 -0。",
      "对象键按身份比较而不是内容，两个内容相同对象默认仍不同。如果业务要按字段去重，需要 keyFn 显式选择字段；序列化对象会把身份规则偷换成结构规则，并可能在环或特殊值上失败。"
    ],
    "alternative": "使用 Map 可以同时保存键对应首项；排序去重会改变顺序，且需要额外副本和比较规则。",
    "complexity": "平均时间 O(n)，空间 O(k)，k 为不同键数量；keyFn 成本另计。",
    "commonMistakes": [
      "indexOf 无法识别 NaN 重复。",
      "按最后值覆盖会违反首次项合同。"
    ],
    "knowledgeIds": [
      "K01-01"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(uniqueBy([1,2,1,3]));",
        "expectedOutput": "[1,2,3]",
        "explanation": "第一次遇到键时写入结果，之后相同键跳过。",
        "expectedLogs": [
          "[ 1, 2, 3 ]"
        ]
      },
      {
        "code": "console.log(uniqueBy([NaN,NaN,0,-0]).length);",
        "expectedOutput": "2",
        "explanation": "Set 使用 SameValueZero，NaN 与 NaN 同键，正负零同键。",
        "expectedLogs": [
          "2"
        ]
      },
      {
        "code": "const a={id:1},b={id:1}; console.log(uniqueBy([a,b],x=>x.id)[0]===a);",
        "expectedOutput": "true",
        "explanation": "业务键相同，但保留的是原输入中的首次对象。",
        "expectedLogs": [
          "true"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E19-T01",
        "name": "首次与顺序",
        "purpose": "重复键保留首项",
        "code": "let a={id:1,name:\"first\"},b={id:1,name:\"last\"},c={id:2};let r=uniqueBy([a,b,c],x=>x.id);assert(r[0]===a&&r[1]===c,\"first identity\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "首次与顺序",
        "expectedOutcome": "重复键保留首项",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E19-T02",
        "name": "NaN 与零",
        "purpose": "SameValueZero",
        "code": "let r=uniqueBy([NaN,NaN,-0,+0]);equal(r.length,2);assert(Number.isNaN(r[0])&&Object.is(r[1],-0),\"same value zero\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "NaN 与零",
        "expectedOutcome": "SameValueZero",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E19-T03",
        "name": "对象身份",
        "purpose": "不同对象键不合并",
        "code": "let a={},b={};let r=uniqueBy([a,b,a]);assert(r.length===2&&r[0]===a&&r[1]===b,\"identity keys\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "对象身份",
        "expectedOutcome": "不同对象键不合并",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E19-T04",
        "name": "空输入",
        "purpose": "空结果",
        "code": "equal(uniqueBy([]),[]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空输入",
        "expectedOutcome": "空结果",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E19-T05",
        "name": "不修改输入与索引",
        "purpose": "索引正确且数组不变",
        "code": "let a=[1,1,1];equal(uniqueBy(a,(_,i)=>i%2),[1,1]);equal(a,[1,1,1]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "不修改输入与索引",
        "expectedOutcome": "索引正确且数组不变",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E19-T06",
        "name": "失败",
        "purpose": "keyFn 原错误透传参数校验",
        "code": "let e=new Error(\"x\");try{uniqueBy([1],()=>{throw e})}catch(x){assert(x===e,\"error identity\")};expectThrow(()=>uniqueBy(null),\"TypeError\");expectThrow(()=>uniqueBy([],1),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "失败",
        "expectedOutcome": "keyFn 原错误透传参数校验",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "NaN 没去重",
        "code": "function uniqueBy(items, keyFn=x=>x) {\n  if (!Array.isArray(items) || typeof keyFn !== 'function') throw new TypeError('Invalid arguments');\n  const keys = new Set(), result = [];\n  for (let i=0;i<items.length;i++) {\n    const key = keyFn(items[i],i);\n    if (Number.isNaN(key) || !keys.has(key)) { keys.add(key); result.push(items[i]); }\n  }\n  return result;\n}"
      },
      {
        "name": "对象按 JSON 比较",
        "code": "function uniqueBy(items, keyFn=x=>x) {\n  if (!Array.isArray(items) || typeof keyFn !== 'function') throw new TypeError('Invalid arguments');\n  const keys = new Set(), result = [];\n  for (let i=0;i<items.length;i++) {\n    const key = JSON.stringify(keyFn(items[i],i));\n    if (!keys.has(key)) { keys.add(key); result.push(items[i]); }\n  }\n  return result;\n}"
      }
    ]
  },
  {
    "id": "E20",
    "slug": "lower-bound",
    "title": "二分查找下界",
    "summary": "排序列表中重复值的第一个位置不能靠随便一个命中点代表。实现下界查找，返回首个大于等于 target 的索引；没有候选时返回数组长度，可用于插入位置。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 20,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "lowerBound(sorted, target) → 0—sorted.length 索引；sorted 为升序稠密数字数组，target 为非 NaN 数字；数组非数组或 target 非数字/NaN 抛 TypeError。数组元素和排序性由调用方保证，不做 O(n) 验证。",
    "problem": [
      "排序列表中重复值的第一个位置不能靠随便一个命中点代表。实现下界查找，返回首个大于等于 target 的索引；没有候选时返回数组长度，可用于插入位置。",
      "不修改数组、不使用 this。允许 Infinity/-Infinity 和重复值，不支持 NaN、稀疏数组或未排序输入；不承诺替调用方检查排序。"
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
    "starterArtifact": "function lowerBound(sorted, target) {\n  // TODO 返回首个 >= target 的索引。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "使用左闭右开的候选区间 [left,right)。",
      "小于 target 排除 middle 与左边；否则保留 middle 为右边界。",
      "循环条件 left<right，每轮严格缩小区间。"
    ],
    "referenceArtifact": "function lowerBound(sorted, target) {\n  if (!Array.isArray(sorted) || typeof target !== 'number' || Number.isNaN(target)) throw new TypeError('Invalid input');\n  let left=0, right=sorted.length;\n  while (left < right) {\n    const middle = left + Math.floor((right-left)/2);\n    if (sorted[middle] < target) left = middle+1;\n    else right = middle;\n  }\n  return left;\n}",
    "explanation": [
      "不变量是 left 左侧全部小于 target，right 及其右侧（如果存在）全部不小于 target。middle 小于 target 时它也不是候选，left=middle+1；否则 middle 可能就是最左答案，right=middle 保留它。",
      "相等不立即返回，才能找到重复段的开头。空数组初始化 left=right=0，循环不用执行；全小数组不断推进 left，最终等于 length。所有边界都由同一不变量处理。",
      "mid 用差值求中点避免把大索引转换成 32 位整数；位移写法会截断大数。排序前提由调用者提供，因此总检查不包含一次 O(n) 扫描，否则无法达到 O(log n) 目标。"
    ],
    "alternative": "线性扫描适合极小或未排序数据；需频繁查找时先排序，但排序成本与对原数组的影响应另计。",
    "complexity": "时间 O(log n)，额外空间 O(1)。",
    "commonMistakes": [
      "命中立即返回找不到重复值左边界。",
      "left=middle 在长度为一的区间中可能死循环。"
    ],
    "knowledgeIds": [
      "K16-01"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(lowerBound([1,2,2,4],2));",
        "expectedOutput": "1",
        "explanation": "等于目标时继续收缩右边界，不直接返回某个中间命中。",
        "expectedLogs": [
          "1"
        ]
      },
      {
        "code": "console.log(lowerBound([1,3,5],4));",
        "expectedOutput": "2",
        "explanation": "第一个不小于 4 的元素是索引 2 的 5。",
        "expectedLogs": [
          "2"
        ]
      },
      {
        "code": "console.log(lowerBound([1,2],3));",
        "expectedOutput": "2",
        "explanation": "数组全部小于目标，候选边界落在 length。",
        "expectedLogs": [
          "2"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E20-T01",
        "name": "重复值",
        "purpose": "返回首个不小于目标位置",
        "code": "equal(lowerBound([1,2,2,2,3],2),1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "重复值",
        "expectedOutcome": "返回首个不小于目标位置",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E20-T02",
        "name": "空数组",
        "purpose": "返回 length 零",
        "code": "equal(lowerBound([],2),0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空数组",
        "expectedOutcome": "返回 length 零",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E20-T03",
        "name": "全小全大",
        "purpose": "两端位置",
        "code": "equal(lowerBound([1,2],3),2);equal(lowerBound([1,2],0),0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "全小全大",
        "expectedOutcome": "两端位置",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E20-T04",
        "name": "缺失中间目标",
        "purpose": "插入位置",
        "code": "equal(lowerBound([1,3,5],4),2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "缺失中间目标",
        "expectedOutcome": "插入位置",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E20-T05",
        "name": "单值与 Infinity",
        "purpose": "边界正确",
        "code": "equal(lowerBound([2],2),0);equal(lowerBound([-Infinity,0,Infinity],Infinity),2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "单值与 Infinity",
        "expectedOutcome": "边界正确",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E20-T06",
        "name": "输入不变与非法目标",
        "purpose": "不修改校验",
        "code": "let a=[1,2,3];lowerBound(a,2);equal(a,[1,2,3]);expectThrow(()=>lowerBound(a,NaN),\"TypeError\");expectThrow(()=>lowerBound({},1),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "输入不变与非法目标",
        "expectedOutcome": "不修改校验",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "返回上界",
        "code": "function lowerBound(sorted, target) {\n  if (!Array.isArray(sorted) || typeof target !== 'number' || Number.isNaN(target)) throw new TypeError('Invalid input');\n  let left=0, right=sorted.length;\n  while (left < right) {\n    const middle = left + Math.floor((right-left)/2);\n    if (sorted[middle] <= target) left = middle+1;\n    else right = middle;\n  }\n  return left;\n}"
      },
      {
        "name": "丢失 length 哨兵",
        "code": "function lowerBound(sorted, target) {\n  if (!Array.isArray(sorted) || typeof target !== 'number' || Number.isNaN(target)) throw new TypeError('Invalid input');\n  let left=0, right=Math.max(0,sorted.length-1);\n  while (left < right) {\n    const middle = left + Math.floor((right-left)/2);\n    if (sorted[middle] < target) left = middle+1;\n    else right = middle;\n  }\n  return left;\n}"
      }
    ]
  },
  {
    "id": "E21",
    "slug": "balanced-brackets",
    "title": "括号匹配",
    "summary": "括号计数相等仍可能存在交叉嵌套。实现三种括号匹配，用栈保留每个未闭合位置的预期关闭类型，普通字符跳过，空字符串合法。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 15,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "isBalanced(text) → boolean；text 必须为字符串，否则 TypeError。仅处理 () [] {}，其他字符忽略；按最近未闭合的括号匹配，不解析字符串字面量或代码注释。",
    "problem": [
      "括号计数相等仍可能存在交叉嵌套。实现三种括号匹配，用栈保留每个未闭合位置的预期关闭类型，普通字符跳过，空字符串合法。",
      "输入不修改，不使用 this。它只检查字符序列，不是 JavaScript 语法解析器；引号中的括号也按普通括号处理。"
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
    "starterArtifact": "function isBalanced(text) {\n  // TODO 判断三种括号是否正确闭合。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "后打开的括号必须先关闭。",
      "遇 opener 把预期 closing 入栈。",
      "结束仍有未闭合栈项也应返回 false。"
    ],
    "referenceArtifact": "function isBalanced(text) {\n  if (typeof text !== 'string') throw new TypeError('Invalid text');\n  const close = {'(':')','[':']','{':'}'}, stack=[];\n  for (const char of text) {\n    if (Object.hasOwn(close,char)) stack.push(close[char]);\n    else if (char===')' || char===']' || char==='}') {\n      if (stack.pop() !== char) return false;\n    }\n  }\n  return stack.length === 0;\n}",
    "explanation": [
      "栈表达嵌套关系而非仅表达数量。([ 打开后，最内层预期 ]，此时 ) 不匹配，可以立即失败，不必继续遍历。空栈遇闭合也会 pop 得到 undefined，与闭合字符不等。",
      "完整遍历后栈为空才合法；否则 ( 或 { 等未闭合仍留在其中。普通字符不产生入栈或出栈，故空文本与没有括号的文本都合法。",
      "逐字符遍历可处理任意普通 Unicode 字符，但本题括号只有 ASCII 六种。代码字符串中的引号、转义和注释不被解析，不能把该函数当语言语法检查器。"
    ],
    "alternative": "只计数适合单种括号且仍需前缀非负检查；多类型嵌套必须保存顺序。语法级需求应使用正式解析器。",
    "complexity": "时间 O(n)，空间 O(d)，d 为最大嵌套深度。",
    "commonMistakes": [
      "分别计数三种括号会接受交叉嵌套。",
      "只检查过程中匹配，不检查最终栈，会接受未闭合。"
    ],
    "knowledgeIds": [
      "K16-01",
      "K16-02"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(isBalanced(\"{a[b(c)]}\"));",
        "expectedOutput": "true",
        "explanation": "每次闭合都匹配栈顶预期字符，结束时栈空。",
        "expectedLogs": [
          "true"
        ]
      },
      {
        "code": "console.log(isBalanced(\"([)]\"));",
        "expectedOutput": "false",
        "explanation": "遇到 ) 时栈顶预期为 ]，数量相等不能修复嵌套顺序。",
        "expectedLogs": [
          "false"
        ]
      },
      {
        "code": "console.log(isBalanced(\"hello\"));",
        "expectedOutput": "true",
        "explanation": "普通字符不影响栈，空括号序列合法。",
        "expectedLogs": [
          "true"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E21-T01",
        "name": "空普通字符",
        "purpose": "无括号合法",
        "code": "assert(isBalanced(\"\")&&isBalanced(\"hello中文\"),\"empty/plain\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空普通字符",
        "expectedOutcome": "无括号合法",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E21-T02",
        "name": "正确嵌套",
        "purpose": "三种组合合法",
        "code": "assert(isBalanced(\"a{b[c(d)e]f}g\"),\"nested\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "正确嵌套",
        "expectedOutcome": "三种组合合法",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E21-T03",
        "name": "交叉嵌套",
        "purpose": "计数相同仍拒绝",
        "code": "assert(!isBalanced(\"([)]\"),\"crossing\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "交叉嵌套",
        "expectedOutcome": "计数相同仍拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E21-T04",
        "name": "未闭合",
        "purpose": "残留 opener 拒绝",
        "code": "assert(!isBalanced(\"((\"),\"unclosed\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "未闭合",
        "expectedOutcome": "残留 opener 拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E21-T05",
        "name": "多余关闭",
        "purpose": "空栈 closing 拒绝",
        "code": "assert(!isBalanced(\")(\")&&!isBalanced(\"[]}\"),\"extra closing\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "多余关闭",
        "expectedOutcome": "空栈 closing 拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E21-T06",
        "name": "大输入和类型",
        "purpose": "线性处理大输入，非法类型拒绝",
        "code": "assert(isBalanced(\"(\".repeat(10000)+\")\".repeat(10000)),\"large\");expectThrow(()=>isBalanced(null),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "大输入和类型",
        "expectedOutcome": "线性处理大输入，非法类型拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "遗漏结束检查",
        "code": "function isBalanced(text) {\n  if (typeof text !== 'string') throw new TypeError('Invalid text');\n  const close = {'(':')','[':']','{':'}'}, stack=[];\n  for (const char of text) {\n    if (Object.hasOwn(close,char)) stack.push(close[char]);\n    else if (char===')' || char===']' || char==='}') {\n      if (stack.pop() !== char) return false;\n    }\n  }\n  return true;\n}"
      },
      {
        "name": "允许空栈关闭",
        "code": "function isBalanced(text) {\n  if (typeof text !== 'string') throw new TypeError('Invalid text');\n  const close = {'(':')','[':']','{':'}'}, stack=[];\n  for (const char of text) {\n    if (Object.hasOwn(close,char)) stack.push(close[char]);\n    else if (char===')' || char===']' || char==='}') {\n      if (stack.length && stack.pop() !== char) return false;\n    }\n  }\n  return stack.length === 0;\n}"
      }
    ]
  }
] as const satisfies readonly Exercise[];
