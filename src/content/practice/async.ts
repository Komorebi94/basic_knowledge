import type { Exercise } from "./types";

export const asyncExercises = [
  {
    "id": "E01",
    "slug": "debounce-cancel",
    "title": "防抖与取消",
    "summary": "搜索框每次输入都请求会产生无效工作。实现 trailing 防抖：连续调用只保留最后一次参数与 this，安静 waitMs 后执行，并允许取消或提前执行。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 25,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "debounce(fn, waitMs) → wrapped；wrapped(...args) 返回 undefined，cancel() 返回 undefined，flush() 返回本次 fn 的结果或 undefined。fn 非函数、wait 非数字抛 TypeError；wait 非有限整数或不在 0—2147483647 抛 RangeError。",
    "problem": [
      "搜索框每次输入都请求会产生无效工作。实现 trailing 防抖：连续调用只保留最后一次参数与 this，安静 waitMs 后执行，并允许取消或提前执行。",
      "执行前先清空本轮待执行状态；fn 内重入 wrapped 时必须留下下一轮。flush 同步透传异常，定时器异常交给宿主；不修改参数对象。"
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
    "starterArtifact": "function debounce(fn, waitMs) {\n  // TODO 返回具有 cancel() 与 flush() 的包装函数。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "先写出待执行状态：计时器、参数、调用者。",
      "cancel 与 flush 都要结束当前等待，区别是是否调用 fn。",
      "先保存本轮局部变量并清空共享状态，再执行 fn；重入会建立下一轮。"
    ],
    "referenceArtifact": "function debounce(fn, waitMs) {\n  if (typeof fn !== 'function' || typeof waitMs !== 'number') throw new TypeError('Invalid argument');\n  if (!Number.isInteger(waitMs) || waitMs < 0 || waitMs > 2147483647) throw new RangeError('Invalid wait');\n  let timer, pending;\n  function invoke() {\n    const call = pending;\n    pending = undefined;\n    if (timer !== undefined) clearTimeout(timer);\n    timer = undefined;\n    if (call) return fn.apply(call.receiver, call.args);\n  }\n  function wrapped(...args) {\n    if (timer !== undefined) clearTimeout(timer);\n    pending = { receiver: this, args };\n    timer = setTimeout(invoke, waitMs);\n  }\n  wrapped.cancel = () => {\n    if (timer !== undefined) clearTimeout(timer);\n    timer = pending = undefined;\n  };\n  wrapped.flush = invoke;\n  return wrapped;\n}",
    "explanation": [
      "防抖的窗口起点随调用移动。第一次安排 A，第二次取消 A 的计时器并保存 B，所以只有在最后一次调用之后完整安静一段时间才会执行。每个实例的闭包拥有自己的 timer 与 pending，实例之间没有共享取消状态。",
      "invoke 先把 pending 移到局部变量，再将计时器与共享 pending 清空。这个先后顺序不仅处理异常，也保护重入：fn 调用 wrapped 时，新一轮状态不会被本轮结束逻辑擦掉。",
      "包装器只返回 undefined，因为它不能同步返回尚未发生的结果。flush 知道现在就要执行，因此可以返回 fn 的结果。Promise 聚合、leading 与 maxWait 会改变契约，需要额外状态，不能悄悄混入本题。"
    ],
    "alternative": "可以把待执行调用封装成独立对象并维护 generation；更复杂的 leading/maxWait 库适用于真实输入体验，但其计时语义需要单独测试。",
    "complexity": "每次调用、cancel、flush 除 fn 本身均 O(1)；空间 O(k)，k 为最后一次参数数量，只保存最近一份上下文。",
    "commonMistakes": [
      "只保存第一次参数会调用过期输入。",
      "执行后才清理会误删重入建立的新状态。"
    ],
    "knowledgeIds": [
      "K01-02",
      "K02-01",
      "K12-02"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "const f = debounce(console.log, 100); f(\"A\"); await clock.tick(50); f(\"B\"); await clock.tick(100);",
        "expectedOutput": "B",
        "explanation": "B 覆盖 A 的待执行上下文，旧计时器取消，等待从第二次调用起算。",
        "expectedLogs": [
          "B"
        ]
      },
      {
        "code": "const f = debounce(console.log, 10); f(\"A\"); f.cancel(); await clock.tick(10);",
        "expectedOutput": "无输出",
        "explanation": "cancel 释放计时器与参数引用，没有仍可被触发的待执行项。",
        "expectedLogs": []
      },
      {
        "code": "const f = debounce(x => x * 2, 10); f(3); console.log(f.flush()); await clock.tick(10);",
        "expectedOutput": "6",
        "explanation": "flush 先取走并清理这一轮，再调用原函数；原定时器不会重复执行。",
        "expectedLogs": [
          "6"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E01-T01",
        "name": "最后一次起算",
        "purpose": "连续调用只执行 B",
        "code": "let out=[];let f=debounce(x=>out.push(x),10);f(\"A\");await clock.tick(5);f(\"B\");await clock.tick(9);equal(out,[]);await clock.tick(1);equal(out,[\"B\"]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "最后一次起算",
        "expectedOutcome": "连续调用只执行 B",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E01-T02",
        "name": "参数与 this",
        "purpose": "最后上下文全部保留",
        "code": "let out;const f=debounce(function(...a){out=[this.id,...a]},2);f.call({id:1},1);f.call({id:2},3,undefined);await clock.tick(2);equal(out,[2,3,undefined]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "参数与 this",
        "expectedOutcome": "最后上下文全部保留",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E01-T03",
        "name": "取消幂等",
        "purpose": "取消无迟到执行",
        "code": "let n=0,f=debounce(()=>n++,5);f();f.cancel();f.cancel();await clock.tick(10);equal(n,0);equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "取消幂等",
        "expectedOutcome": "取消无迟到执行",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E01-T04",
        "name": "flush 去重",
        "purpose": "立即返回且不重复",
        "code": "let n=0,f=debounce(()=>++n,5);f();equal(f.flush(),1);equal(f.flush(),undefined);await clock.tick(5);equal(n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "flush 去重",
        "expectedOutcome": "立即返回且不重复",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E01-T05",
        "name": "零等待",
        "purpose": "异步执行",
        "code": "let n=0,f=debounce(()=>n++,0);f();equal(n,0);await clock.tick(0);equal(n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "零等待",
        "expectedOutcome": "异步执行",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E01-T06",
        "name": "独立实例",
        "purpose": "取消不影响另一个实例",
        "code": "let n=0,a=debounce(()=>n++,2),b=debounce(()=>n++,2);a();b();a.cancel();await clock.tick(2);equal(n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "独立实例",
        "expectedOutcome": "取消不影响另一个实例",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E01-T07",
        "name": "参数校验",
        "purpose": "类型与范围失败且无计时器",
        "code": "expectThrow(()=>debounce(null,1),\"TypeError\");for(const w of [-1,NaN,Infinity,0.5])expectThrow(()=>debounce(()=>{},w),\"RangeError\");expectThrow(()=>debounce(()=>{},\"1\"),\"TypeError\");equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "参数校验",
        "expectedOutcome": "类型与范围失败且无计时器",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E01-T08",
        "name": "异常恢复",
        "purpose": "flush 异常可见且状态可复用",
        "code": "let n=0,f=debounce(()=>{if(++n===1)throw new Error(\"boom\");return n},1);f();expectThrow(()=>f.flush(),\"Error\");f();equal(f.flush(),2);await clock.tick(1);equal(n,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "异常恢复",
        "expectedOutcome": "flush 异常可见且状态可复用",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E01-T09",
        "name": "回调重入",
        "purpose": "下一轮不被当前轮清空",
        "code": "let n=0;const f=debounce(()=>{if(++n===1)f()},2);f();f.flush();await clock.tick(2);equal(n,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "回调重入",
        "expectedOutcome": "下一轮不被当前轮清空",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E01-T10",
        "name": "宿主异常",
        "purpose": "定时器异常透传且仍可调用",
        "code": "let n=0;const f=debounce(()=>{if(++n===1)throw new Error(\"timer\")},1);f();await expectReject(clock.tick(1),\"Error\");f();await clock.tick(1);equal(n,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "宿主异常",
        "expectedOutcome": "定时器异常透传且仍可调用",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "旧定时器未取消",
        "code": "function debounce(fn, waitMs) {\n  if (typeof fn !== 'function' || typeof waitMs !== 'number') throw new TypeError('Invalid argument');\n  if (!Number.isInteger(waitMs) || waitMs < 0 || waitMs > 2147483647) throw new RangeError('Invalid wait');\n  let timer, pending;\n  function invoke() {\n    const call = pending;\n    pending = undefined;\n    if (timer !== undefined) clearTimeout(timer);\n    timer = undefined;\n    if (call) return fn.apply(call.receiver, call.args);\n  }\n  function wrapped(...args) {\n    pending = { receiver: this, args };\n    timer = setTimeout(invoke, waitMs);\n  }\n  wrapped.cancel = () => {\n    if (timer !== undefined) clearTimeout(timer);\n    timer = pending = undefined;\n  };\n  wrapped.flush = invoke;\n  return wrapped;\n}"
      },
      {
        "name": "flush 未取消计时器",
        "code": "function debounce(fn, waitMs) {\n  if (typeof fn !== 'function' || typeof waitMs !== 'number') throw new TypeError('Invalid argument');\n  if (!Number.isInteger(waitMs) || waitMs < 0 || waitMs > 2147483647) throw new RangeError('Invalid wait');\n  let timer, pending;\n  function invoke() {\n    const call = pending;\n    pending = undefined;\n    timer = undefined;\n    pending = call;\n    if (call) return fn.apply(call.receiver, call.args);\n  }\n  function wrapped(...args) {\n    if (timer !== undefined) clearTimeout(timer);\n    pending = { receiver: this, args };\n    timer = setTimeout(invoke, waitMs);\n  }\n  wrapped.cancel = () => {\n    if (timer !== undefined) clearTimeout(timer);\n    timer = pending = undefined;\n  };\n  wrapped.flush = invoke;\n  return wrapped;\n}"
      }
    ]
  },
  {
    "id": "E02",
    "slug": "throttle-trailing",
    "title": "节流与尾调用",
    "summary": "鼠标移动触发过密时，希望立即响应首次操作，并在固定时间窗口结束时保留最后一次输入。实现固定窗口节流，窗口内调用不延长截止时间。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 25,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "throttle(fn, waitMs) → wrapped；wait 为 0—2147483647 整数。首次 leading 同步执行，窗口内记录最后调用，窗口结束 trailing；cancel() 关闭当前窗口。wrapped 返回 undefined；fn 的同步异常透传。",
    "problem": [
      "鼠标移动触发过密时，希望立即响应首次操作，并在固定时间窗口结束时保留最后一次输入。实现固定窗口节流，窗口内调用不延长截止时间。",
      "尾调用启动下一窗口，若新窗口没有额外调用则结束时不再重复执行。边界时间先执行已到期计时器，再发起新调用；保留 this，不修改参数。"
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
    "starterArtifact": "function throttle(fn, waitMs) {\n  // TODO 返回具有 cancel() 的包装函数。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "区分没有窗口与窗口已打开两个状态。",
      "尾项只保存窗口内最后一次额外调用。",
      "调用 fn 前打开下一窗口，防止 fn 内重入被当作新的 leading。"
    ],
    "referenceArtifact": "function throttle(fn, waitMs) {\n  if (typeof fn !== 'function' || typeof waitMs !== 'number') throw new TypeError('Invalid argument');\n  if (!Number.isInteger(waitMs) || waitMs < 0 || waitMs > 2147483647) throw new RangeError('Invalid wait');\n  let timer, pending;\n  function endWindow() {\n    timer = undefined;\n    const call = pending;\n    pending = undefined;\n    if (call) {\n      timer = setTimeout(endWindow, waitMs);\n      fn.apply(call.receiver, call.args);\n    }\n  }\n  function wrapped(...args) {\n    if (timer === undefined) {\n      timer = setTimeout(endWindow, waitMs);\n      fn.apply(this, args);\n    } else pending = { receiver: this, args };\n  }\n  wrapped.cancel = () => {\n    if (timer !== undefined) clearTimeout(timer);\n    timer = pending = undefined;\n  };\n  return wrapped;\n}",
    "explanation": [
      "节流与防抖最大的行为差异是截止点是否移动。这里 timer 一旦建立就不随额外调用重设，额外输入只是替换 pending，所以 t=8 的调用仍在 t=10 执行。",
      "尾调用先取出 pending 并安排下一窗口，再调用 fn。这样回调重入会进入新窗口的尾项，且错误不会让原窗口留下悬挂状态。没有 pending 时直接关闭窗口，不凭空再执行首次调用。",
      "cancel 同时丢弃尾项和清除截止点，因此随后调用可以立即 leading。此题不讨论基于时间戳的无限连续窗口或 leading=false；它们在边界时刻会呈现不同结果。"
    ],
    "alternative": "时间戳算法可减少某些计时器，但要单独定义边界与尾调用策略；使用双计时器时更容易不小心延长窗口。",
    "complexity": "包装调用与取消为 O(1)，空间 O(k)，仅保存最后一次参数。回调执行成本另计。",
    "commonMistakes": [
      "直接复用防抖会把固定截止点不断推后。",
      "单次 leading 后无条件 trailing 会重复一次用户操作。"
    ],
    "knowledgeIds": [
      "K01-02",
      "K02-01"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "const f = throttle(console.log, 10); f(\"A\"); f(\"B\"); await clock.tick(10);",
        "expectedOutput": "A、B",
        "explanation": "首次立即执行，B 保存为尾项，截止点不被 B 延后。",
        "expectedLogs": [
          "A",
          "B"
        ]
      },
      {
        "code": "const f = throttle(console.log, 10); f(\"A\"); await clock.tick(20);",
        "expectedOutput": "A",
        "explanation": "只调用一次不会产生多余尾调用。",
        "expectedLogs": [
          "A"
        ]
      },
      {
        "code": "const f = throttle(console.log, 10); f(\"A\"); f(\"B\"); f.cancel(); await clock.tick(10);",
        "expectedOutput": "A",
        "explanation": "取消的是当前窗口及等待尾项，已经执行的 leading 不回滚。",
        "expectedLogs": [
          "A"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E02-T01",
        "name": "首次立即执行",
        "purpose": "leading 同步",
        "code": "let a=[],f=throttle(x=>a.push(x),10);equal(f(1),undefined);equal(a,[1]);await clock.tick(20);equal(a,[1]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "首次立即执行",
        "expectedOutcome": "leading 同步",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E02-T02",
        "name": "固定窗口",
        "purpose": "尾调用不随调用延长",
        "code": "let a=[],f=throttle(x=>a.push(x),10);f(1);await clock.tick(8);f(2);await clock.tick(2);equal(a,[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "固定窗口",
        "expectedOutcome": "尾调用不随调用延长",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E02-T03",
        "name": "最后参数",
        "purpose": "this 和多参数取最后",
        "code": "let a=[],f=throttle(function(...x){a.push([this.n,...x])},10);f.call({n:1},0);f.call({n:2},1);f.call({n:3},2,undefined);await clock.tick(10);equal(a,[[1,0],[3,2,undefined]]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "最后参数",
        "expectedOutcome": "this 和多参数取最后",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E02-T04",
        "name": "取消恢复",
        "purpose": "取消丢弃尾项且可重新 leading",
        "code": "let a=[],f=throttle(x=>a.push(x),5);f(1);f(2);f.cancel();f.cancel();f(3);await clock.tick(10);equal(a,[1,3]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "取消恢复",
        "expectedOutcome": "取消丢弃尾项且可重新 leading",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E02-T05",
        "name": "窗口边界",
        "purpose": "尾调用后新调用归下一窗口",
        "code": "let a=[],f=throttle(x=>a.push(x),5);f(1);f(2);await clock.tick(5);f(3);equal(a,[1,2]);await clock.tick(5);equal(a,[1,2,3]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "窗口边界",
        "expectedOutcome": "尾调用后新调用归下一窗口",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E02-T06",
        "name": "独立实例",
        "purpose": "窗口互不影响",
        "code": "let a=[],f=throttle(()=>a.push(\"a\"),2),g=throttle(()=>a.push(\"b\"),2);f();g();f();g();f.cancel();await clock.tick(2);equal(a,[\"a\",\"b\",\"b\"]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "独立实例",
        "expectedOutcome": "窗口互不影响",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E02-T07",
        "name": "异常恢复",
        "purpose": "首次异常保持窗口，取消后可用",
        "code": "let n=0,f=throttle(()=>{if(++n===1)throw new Error(\"x\")},1);expectThrow(()=>f(),\"Error\");f.cancel();f();equal(n,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "异常恢复",
        "expectedOutcome": "首次异常保持窗口，取消后可用",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E02-T08",
        "name": "校验与零窗口",
        "purpose": "非法参数拒绝，零窗口尾调用仍异步",
        "code": "expectThrow(()=>throttle(null,1),\"TypeError\");expectThrow(()=>throttle(()=>{},-1),\"RangeError\");let n=0,f=throttle(()=>n++,0);f();f();equal(n,1);await clock.tick(0);equal(n,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "校验与零窗口",
        "expectedOutcome": "非法参数拒绝，零窗口尾调用仍异步",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "额外调用被丢弃",
        "code": "function throttle(fn, waitMs) {\n  if (typeof fn !== 'function' || typeof waitMs !== 'number') throw new TypeError('Invalid argument');\n  if (!Number.isInteger(waitMs) || waitMs < 0 || waitMs > 2147483647) throw new RangeError('Invalid wait');\n  let timer, pending;\n  function endWindow() {\n    timer = undefined;\n    const call = pending;\n    pending = undefined;\n    if (call) {\n      timer = setTimeout(endWindow, waitMs);\n      fn.apply(call.receiver, call.args);\n    }\n  }\n  function wrapped(...args) {\n    if (timer === undefined) {\n      timer = setTimeout(endWindow, waitMs);\n      fn.apply(this, args);\n    } else pending = undefined;\n  }\n  wrapped.cancel = () => {\n    if (timer !== undefined) clearTimeout(timer);\n    timer = pending = undefined;\n  };\n  return wrapped;\n}"
      },
      {
        "name": "单次调用重复尾执行",
        "code": "function throttle(fn, waitMs) {\n  if (typeof fn !== 'function' || typeof waitMs !== 'number') throw new TypeError('Invalid argument');\n  if (!Number.isInteger(waitMs) || waitMs < 0 || waitMs > 2147483647) throw new RangeError('Invalid wait');\n  let timer, pending;\n  function endWindow() {\n    timer = undefined;\n    const call = pending;\n    pending = undefined;\n    if (call) {\n      timer = setTimeout(endWindow, waitMs);\n      fn.apply(call.receiver, call.args);\n    }\n  }\n  function wrapped(...args) {\n    if (timer === undefined) {\n      timer = setTimeout(endWindow, waitMs);\n      pending = { receiver: this, args };\n      fn.apply(this, args);\n    } else pending = { receiver: this, args };\n  }\n  wrapped.cancel = () => {\n    if (timer !== undefined) clearTimeout(timer);\n    timer = pending = undefined;\n  };\n  return wrapped;\n}"
      }
    ]
  },
  {
    "id": "E03",
    "slug": "promise-all",
    "title": "Promise.all 语义",
    "summary": "多个异步任务完成顺序通常不等于输入顺序。实现 all，使调用方拿到与输入位置对应的值；普通值和 thenable 也按 Promise 同化规则处理。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 25,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "all(iterable) → Promise<Array>；接受同步可迭代对象，按输入位置保存结果；元素采用 Promise.resolve 吸收，首个被观察到的拒绝使整体拒绝，迭代过程异常也拒绝。",
    "problem": [
      "多个异步任务完成顺序通常不等于输入顺序。实现 all，使调用方拿到与输入位置对应的值；普通值和 thenable 也按 Promise 同化规则处理。",
      "空输入得到 []。不取消已启动任务，也不改动输入；元素拒绝后仍需为所有已观察元素安装拒绝处理。接口不使用 this。"
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
    "starterArtifact": "function all(iterable) {\n  // TODO 返回聚合 Promise。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "结果位置来自遍历索引，不来自完成顺序。",
      "计数中留一个遍历尚未结束的哨兵，处理空输入。",
      "Promise.resolve 负责 thenable 同化；for...of 的抛错需要走 reject。"
    ],
    "referenceArtifact": "function all(iterable) {\n  return new Promise((resolve, reject) => {\n    const result = [];\n    let remaining = 1, index = 0;\n    try {\n      for (const value of iterable) {\n        const position = index++;\n        remaining++;\n        Promise.resolve(value).then(resolved => {\n          result[position] = resolved;\n          if (--remaining === 0) resolve(result);\n        }, reject);\n      }\n      if (--remaining === 0) resolve(result);\n    } catch (error) { reject(error); }\n  });\n}",
    "explanation": [
      "循环中为每个元素绑定 position。B 先完成时写 result[1]，A 后完成时写 result[0]，所以顺序由输入确定。remaining 表示还未完成的元素，加一的哨兵表示遍历本身尚未结束。",
      "thenable 的 then getter 可以抛错，then 也可以重复 resolve。交给 Promise.resolve 同化可复用标准 Promise 的一次结算规则；直接读取并调用 then 会重复计算 remaining 或漏掉 getter 异常。",
      "拒绝只改变整体结果，不让底层工作消失。后续元素仍拥有 reject 回调，避免已观察任务出现无人处理的拒绝。这个受限版本不处理可替换 Promise 子类构造器的物种机制。"
    ],
    "alternative": "业务代码优先用原生 Promise.all；本题实现用于理解顺序与结算计数，不声称替代所有规范级构造器细节。",
    "complexity": "时间 O(n)，输出与闭包空间 O(n)；任务本身耗时另计。",
    "commonMistakes": [
      "push 完成结果导致乱序。",
      "remaining 从 0 开始却不处理空输入会永远等待。"
    ],
    "knowledgeIds": [
      "K02-02",
      "K01-06"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(await all([Promise.resolve(1), 2]));",
        "expectedOutput": "[1, 2]",
        "explanation": "每个输入都经 Promise.resolve，因此普通值和已解决 Promise 使用同一收集路径。",
        "expectedLogs": [
          "[ 1, 2 ]"
        ]
      },
      {
        "code": "console.log(await all([]));",
        "expectedOutput": "[]",
        "explanation": "计数哨兵在遍历完成后扣除，空输入也能归零。",
        "expectedLogs": [
          "[]"
        ]
      },
      {
        "code": "try { await all([Promise.reject(new Error(\"失败\"))]); } catch (e) { console.log(e.message); }",
        "expectedOutput": "失败",
        "explanation": "整体 Promise 首次拒绝后不可被后续成功覆盖。",
        "expectedLogs": [
          "失败"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E03-T01",
        "name": "空输入",
        "purpose": "空结果",
        "code": "equal(await all([]),[]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空输入",
        "expectedOutcome": "空结果",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E03-T02",
        "name": "普通值",
        "purpose": "位置和值保留",
        "code": "equal(await all([0,false,undefined]),[0,false,undefined]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "普通值",
        "expectedOutcome": "位置和值保留",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E03-T03",
        "name": "乱序",
        "purpose": "完成顺序不影响索引",
        "code": "let a=deferred(),b=deferred(),p=all([a.promise,b.promise]);b.resolve(2);a.resolve(1);equal(await p,[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "乱序",
        "expectedOutcome": "完成顺序不影响索引",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E03-T04",
        "name": "拒绝身份",
        "purpose": "拒绝原错误",
        "code": "let e=new Error(\"x\");await expectReject(all([Promise.reject(e)]),\"Error\",e);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "拒绝身份",
        "expectedOutcome": "拒绝原错误",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E03-T05",
        "name": "Set 输入",
        "purpose": "不限数组",
        "code": "equal(await all(new Set([1,2])),[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "Set 输入",
        "expectedOutcome": "不限数组",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E03-T06",
        "name": "thenable",
        "purpose": "吸收同步 thenable",
        "code": "equal(await all([{then(r){r(4);r(5)}}]),[4]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "thenable",
        "expectedOutcome": "吸收同步 thenable",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E03-T07",
        "name": "getter 错误",
        "purpose": "then getter 错误拒绝",
        "code": "await expectReject(all([{get then(){throw new TypeError(\"bad\")}}]),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "getter 错误",
        "expectedOutcome": "then getter 错误拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E03-T08",
        "name": "迭代错误",
        "purpose": "迭代本身抛错拒绝",
        "code": "const bad={*[Symbol.iterator](){yield 1;throw new RangeError(\"iterator\")}};await expectReject(all(bad),\"RangeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "迭代错误",
        "expectedOutcome": "迭代本身抛错拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E03-T09",
        "name": "多次拒绝",
        "purpose": "已观察元素都有人处理",
        "code": "let a=deferred(),b=deferred(),p=all([a.promise,b.promise]);let handled=p.catch(e=>e.message);a.reject(new Error(\"first\"));b.reject(new Error(\"second\"));equal(await handled,\"first\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "多次拒绝",
        "expectedOutcome": "已观察元素都有人处理",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "按完成顺序收集",
        "code": "function all(iterable) {\n  return new Promise((resolve, reject) => {\n    const result = [];\n    let remaining = 1, index = 0;\n    try {\n      for (const value of iterable) {\n        const position = index++;\n        remaining++;\n        Promise.resolve(value).then(resolved => {\n          result.push(resolved);\n          if (--remaining === 0) resolve(result);\n        }, reject);\n      }\n      if (--remaining === 0) resolve(result);\n    } catch (error) { reject(error); }\n  });\n}"
      },
      {
        "name": "遗漏空输入结算",
        "code": "function all(iterable) {\n  return new Promise((resolve, reject) => {\n    const result = [];\n    let remaining = 1, index = 0;\n    try {\n      for (const value of iterable) {\n        const position = index++;\n        remaining++;\n        Promise.resolve(value).then(resolved => {\n          result[position] = resolved;\n          if (--remaining === 0) resolve(result);\n        }, reject);\n      }\n      --remaining;\n    } catch (error) { reject(error); }\n  });\n}"
      }
    ]
  },
  {
    "id": "E04",
    "slug": "task-pool",
    "title": "并发任务池",
    "summary": "需要批量处理数据，又不能一次启动所有工作。编写任务池，让任务工厂在获得空位时才执行；在途计数包含尚未结算的同步或异步返回值。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 40,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "pool(tasks, limit) → Promise<Array>；tasks 为函数数组，limit 为正整数。参数无效拒绝 TypeError 或 RangeError；最多 limit 个任务在途，首次失败后停止启动新任务，按输入索引返回。",
    "problem": [
      "需要批量处理数据，又不能一次启动所有工作。编写任务池，让任务工厂在获得空位时才执行；在途计数包含尚未结算的同步或异步返回值。",
      "同步抛错等同异步拒绝。失败后停止补位，但已经启动的任务不被自动取消，其后续拒绝要被处理。不修改任务数组，不为工厂传入 this。"
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
    "starterArtifact": "function pool(tasks, limit) {\n  // TODO 延迟启动任务工厂并返回结果 Promise。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "任务工厂与 Promise 不是同一件事：工厂需要延迟调用。",
      "补位循环同时受 active、next、failed 限制。",
      "失败置位要发生在任何下一次补位前，已启动任务仍安装双分支回调。"
    ],
    "referenceArtifact": "async function pool(tasks, limit) {\n  if (!Array.isArray(tasks) || tasks.some(task => typeof task !== 'function')) throw new TypeError('Invalid tasks');\n  if (!Number.isInteger(limit) || limit <= 0) throw new RangeError('Invalid limit');\n  return new Promise((resolve, reject) => {\n    const result = new Array(tasks.length);\n    let next = 0, active = 0, completed = 0, failed = false;\n    function launch() {\n      while (!failed && active < limit && next < tasks.length) {\n        const index = next++;\n        active++;\n        let value;\n        try { value = tasks[index](); } catch (error) { failed = true; reject(error); return; }\n        Promise.resolve(value).then(value => {\n          active--; completed++; result[index] = value;\n          if (!failed && completed === tasks.length) resolve(result);\n          else launch();\n        }, error => { active--; failed = true; reject(error); });\n      }\n      if (!tasks.length) resolve([]);\n    }\n    launch();\n  });\n}",
    "explanation": [
      "next 只在工厂真正启动时前移，active 在启动前增加。这样同步返回值也先占有一个槽，再通过 Promise 微任务结算释放，不会在启动阶段绕过上限。",
      "结果数组按 index 写入，完成数量只负责判定何时整体完成。把完成数量当成写入索引会丢失输入顺序。失败后 launch 的 while 条件阻断新工厂，而正在运行的任务还会执行自己的结算处理。",
      "任务池限制的是开始执行的并发，不是停止已经发生的副作用。需要取消时应让工厂接收 signal 并另立取消合同；本题只保证失败后的工厂不会继续被启动。"
    ],
    "alternative": "固定数量 worker 循环也能实现池，但必须共享失败标记，并为每个工厂结果处理拒绝；原生 all 会立即调用全部工厂，不能满足限流。",
    "complexity": "调度时间 O(n)，结果空间 O(n)，在途处理器 O(min(n, limit))。任务执行成本另计。",
    "commonMistakes": [
      "tasks.map(task => task()) 提前启动所有任务。",
      "失败后成功回调继续补位会启动本应停止的工作。"
    ],
    "knowledgeIds": [
      "K02-04",
      "K02-05",
      "K02-02"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(await pool([() => 1, () => 2], 1));",
        "expectedOutput": "[1, 2]",
        "explanation": "limit=1 时下一工厂只在前一项结算后启动。",
        "expectedLogs": [
          "[ 1, 2 ]"
        ]
      },
      {
        "code": "console.log(await pool([], 3));",
        "expectedOutput": "[]",
        "explanation": "没有任务也需要明确完成，不等待一个永远不存在的回调。",
        "expectedLogs": [
          "[]"
        ]
      },
      {
        "code": "try { await pool([() => { throw new Error(\"失败\"); }, () => 2], 2); } catch (e) { console.log(e.message); }",
        "expectedOutput": "失败",
        "explanation": "同步抛错立刻进入失败状态，第二个工厂尚未获得启动机会。",
        "expectedLogs": [
          "失败"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E04-T01",
        "name": "并发上限",
        "purpose": "只启动 limit 个",
        "code": "let a=deferred(),b=deferred(),started=[];let p=pool([()=>{started.push(0);return a.promise},()=>{started.push(1);return b.promise},()=>{started.push(2);return 3}],2);equal(started,[0,1]);a.resolve(1);await flush();equal(started,[0,1,2]);b.resolve(2);equal(await p,[1,2,3]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "并发上限",
        "expectedOutcome": "只启动 limit 个",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E04-T02",
        "name": "顺序",
        "purpose": "乱序完成按输入返回",
        "code": "let a=deferred(),b=deferred(),p=pool([()=>a.promise,()=>b.promise],2);b.resolve(2);a.resolve(1);equal(await p,[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "顺序",
        "expectedOutcome": "乱序完成按输入返回",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E04-T03",
        "name": "失败停止补位",
        "purpose": "拒绝后不得启动新任务",
        "code": "let a=deferred(),b=deferred(),n=0,p=pool([()=>a.promise,()=>b.promise,()=>++n],2),caught=p.catch(e=>e.message);a.reject(new Error(\"bad\"));await flush();b.resolve(2);await flush();equal(n,0);equal(await caught,\"bad\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "失败停止补位",
        "expectedOutcome": "拒绝后不得启动新任务",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E04-T04",
        "name": "同步失败",
        "purpose": "同步抛错停止启动",
        "code": "let n=0;await expectReject(pool([()=>{throw new TypeError(\"x\")},()=>++n],2),\"TypeError\");equal(n,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "同步失败",
        "expectedOutcome": "同步抛错停止启动",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E04-T05",
        "name": "空输入",
        "purpose": "空结果",
        "code": "equal(await pool([],2),[]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空输入",
        "expectedOutcome": "空结果",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E04-T06",
        "name": "无效 limit",
        "purpose": "范围校验",
        "code": "for(const limit of [0,-1,1.5,NaN,Infinity])await expectReject(pool([],limit),\"RangeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "无效 limit",
        "expectedOutcome": "范围校验",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E04-T07",
        "name": "无效任务",
        "purpose": "拒绝非工厂",
        "code": "await expectReject(pool([1],2),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "无效任务",
        "expectedOutcome": "拒绝非工厂",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E04-T08",
        "name": "同步返回",
        "purpose": "串行补位无输入修改",
        "code": "const tasks=[()=>1,()=>2,()=>3],copy=tasks.slice();equal(await pool(tasks,1),[1,2,3]);assert(tasks.every((t,i)=>t===copy[i]),\"input changed\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "同步返回",
        "expectedOutcome": "串行补位无输入修改",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E04-T09",
        "name": "迟到拒绝",
        "purpose": "在途失败都有处理",
        "code": "let a=deferred(),b=deferred(),p=pool([()=>a.promise,()=>b.promise],2),caught=p.catch(e=>e.message);a.reject(new Error(\"a\"));b.reject(new Error(\"b\"));equal(await caught,\"a\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "迟到拒绝",
        "expectedOutcome": "在途失败都有处理",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "忽略并发上限",
        "code": "async function pool(tasks, limit) {\n  if (!Array.isArray(tasks) || tasks.some(task => typeof task !== 'function')) throw new TypeError('Invalid tasks');\n  if (!Number.isInteger(limit) || limit <= 0) throw new RangeError('Invalid limit');\n  return new Promise((resolve, reject) => {\n    const result = new Array(tasks.length);\n    let next = 0, active = 0, completed = 0, failed = false;\n    function launch() {\n      while (!failed && active < tasks.length && next < tasks.length) {\n        const index = next++;\n        active++;\n        let value;\n        try { value = tasks[index](); } catch (error) { failed = true; reject(error); return; }\n        Promise.resolve(value).then(value => {\n          active--; completed++; result[index] = value;\n          if (!failed && completed === tasks.length) resolve(result);\n          else launch();\n        }, error => { active--; failed = true; reject(error); });\n      }\n      if (!tasks.length) resolve([]);\n    }\n    launch();\n  });\n}"
      },
      {
        "name": "失败后仍补位",
        "code": "async function pool(tasks, limit) {\n  if (!Array.isArray(tasks) || tasks.some(task => typeof task !== 'function')) throw new TypeError('Invalid tasks');\n  if (!Number.isInteger(limit) || limit <= 0) throw new RangeError('Invalid limit');\n  return new Promise((resolve, reject) => {\n    const result = new Array(tasks.length);\n    let next = 0, active = 0, completed = 0, failed = false;\n    function launch() {\n      while (active < limit && next < tasks.length) {\n        const index = next++;\n        active++;\n        let value;\n        try { value = tasks[index](); } catch (error) { failed = true; reject(error); return; }\n        Promise.resolve(value).then(value => {\n          active--; completed++; result[index] = value;\n          if (!failed && completed === tasks.length) resolve(result);\n          else launch();\n        }, error => { active--; failed = true; reject(error); });\n      }\n      if (!tasks.length) resolve([]);\n    }\n    launch();\n  });\n}"
      }
    ]
  },
  {
    "id": "E05",
    "slug": "all-settled",
    "title": "Promise.allSettled 语义",
    "summary": "批量探测多个独立任务时，一个失败不应遮住其余任务的结果。实现 allSettled，保留成功与失败各自的状态和原值，并保持输入顺序。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 25,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "allSettled(iterable) → Promise<Array>；同步可迭代输入按位置返回 {status:\"fulfilled\",value} 或 {status:\"rejected\",reason}。元素拒绝不会拒绝整体，迭代异常仍拒绝整体。",
    "problem": [
      "批量探测多个独立任务时，一个失败不应遮住其余任务的结果。实现 allSettled，保留成功与失败各自的状态和原值，并保持输入顺序。",
      "空输入为 []，支持普通值、Set、thenable；不修改输入或取消任务。不使用 this，不实现 Promise 子类静态方法泛化。"
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
    "starterArtifact": "function allSettled(iterable) {\n  // TODO 返回按位置排列的结算记录。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "成功和失败都要减少待完成数。",
      "失败转成带 reason 的记录，不调用整体 reject。",
      "区别元素 then getter 抛错与输入迭代器抛错。"
    ],
    "referenceArtifact": "function allSettled(iterable) {\n  return new Promise((resolve, reject) => {\n    const result = []; let remaining = 1, index = 0;\n    function settle(position, record) { result[position] = record; if (--remaining === 0) resolve(result); }\n    try {\n      for (const value of iterable) {\n        const position = index++; remaining++;\n        Promise.resolve(value).then(\n          value => settle(position, {status: 'fulfilled', value}),\n          reason => settle(position, {status: 'rejected', reason})\n        );\n      }\n      if (--remaining === 0) resolve(result);\n    } catch (error) { reject(error); }\n  });\n}",
    "explanation": [
      "每个输入先被 Promise.resolve 同化，然后成功与失败分别构造带标签的记录。两种分支都进入 settle，所以 remaining 统计的是未结算数，不是成功数。",
      "标签与字段必须成对出现：fulfilled 用 value，rejected 用 reason。调用方据 status 收窄结果后再访问字段，不需要用值是否为空来猜测任务是否失败。",
      "输入迭代器抛错意味着收集输入的过程未完成，整体没有一个完整的任务集合，因此拒绝；某个 then getter 抛错则属于已经取得的元素，只形成 rejected 记录。"
    ],
    "alternative": "也可以先将每个 Promise 的拒绝转成记录，再调用原生 Promise.all；仍需确保迭代错误和空输入符合合同。",
    "complexity": "时间与空间均 O(n)，不计任务执行。",
    "commonMistakes": [
      "把元素 reject 直接交给整体 reject 会退化为 all。",
      "仅在成功时减计数导致失败任务让整体永久等待。"
    ],
    "knowledgeIds": [
      "K02-02"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(await allSettled([1, Promise.reject(\"失败\")]));",
        "expectedOutput": "[{status:\"fulfilled\", value:1}, {status:\"rejected\", reason:\"失败\"}]",
        "explanation": "拒绝被转成记录，成为聚合数组中的普通结果。",
        "expectedLogs": [
          "[ { status: 'fulfilled', value: 1 }, { status: 'rejected', reason: '失败' } ]"
        ]
      },
      {
        "code": "console.log(await allSettled([]));",
        "expectedOutput": "[]",
        "explanation": "遍历结束哨兵使空集合也能完成。",
        "expectedLogs": [
          "[]"
        ]
      },
      {
        "code": "console.log(await allSettled(new Set([2, 3])));",
        "expectedOutput": "两个 fulfilled 记录，值依次为 2、3",
        "explanation": "for...of 使用迭代顺序，不限定输入是数组。",
        "expectedLogs": [
          "[ { status: 'fulfilled', value: 2 }, { status: 'fulfilled', value: 3 } ]"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E05-T01",
        "name": "空输入",
        "purpose": "立即空结果",
        "code": "equal(await allSettled([]),[]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空输入",
        "expectedOutcome": "立即空结果",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E05-T02",
        "name": "普通值",
        "purpose": "状态完整",
        "code": "equal(await allSettled([0,undefined]),[{status:\"fulfilled\",value:0},{status:\"fulfilled\",value:undefined}]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "普通值",
        "expectedOutcome": "状态完整",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E05-T03",
        "name": "元素拒绝",
        "purpose": "整体成功含 reason",
        "code": "let e=new Error(\"x\"),r=await allSettled([Promise.reject(e),1]);equal(r[0].status,\"rejected\");assert(r[0].reason===e,\"reason identity\");equal(r[1],{status:\"fulfilled\",value:1});",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "元素拒绝",
        "expectedOutcome": "整体成功含 reason",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E05-T04",
        "name": "乱序完成",
        "purpose": "按位置排列",
        "code": "let a=deferred(),b=deferred(),p=allSettled([a.promise,b.promise]);b.resolve(2);a.resolve(1);equal(await p,[{status:\"fulfilled\",value:1},{status:\"fulfilled\",value:2}]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "乱序完成",
        "expectedOutcome": "按位置排列",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E05-T05",
        "name": "同步 thenable",
        "purpose": "一次同化",
        "code": "equal(await allSettled([{then(resolve){resolve(1);resolve(2)}}]),[{status:\"fulfilled\",value:1}]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "同步 thenable",
        "expectedOutcome": "一次同化",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E05-T06",
        "name": "迭代错误",
        "purpose": "整体拒绝",
        "code": "await expectReject(allSettled({*[Symbol.iterator](){yield 1;throw new TypeError(\"x\")}}),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "迭代错误",
        "expectedOutcome": "整体拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E05-T07",
        "name": "getter 抛错",
        "purpose": "元素 rejected 而非整体拒绝",
        "code": "let result=await allSettled([{get then(){throw new RangeError(\"x\")}}]);equal(result[0].status,\"rejected\");equal(result[0].reason.name,\"RangeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "getter 抛错",
        "expectedOutcome": "元素 rejected 而非整体拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E05-T08",
        "name": "非数组",
        "purpose": "接受可迭代 Set",
        "code": "equal(await allSettled(new Set([1,2])),[{status:\"fulfilled\",value:1},{status:\"fulfilled\",value:2}]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "非数组",
        "expectedOutcome": "接受可迭代 Set",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "按完成顺序收集",
        "code": "function allSettled(iterable) {\n  return new Promise((resolve, reject) => {\n    const result = []; let remaining = 1, index = 0;\n    function settle(position, record) { result.push(record); if (--remaining === 0) resolve(result); }\n    try {\n      for (const value of iterable) {\n        const position = index++; remaining++;\n        Promise.resolve(value).then(\n          value => settle(position, {status: 'fulfilled', value}),\n          reason => settle(position, {status: 'rejected', reason})\n        );\n      }\n      if (--remaining === 0) resolve(result);\n    } catch (error) { reject(error); }\n  });\n}"
      },
      {
        "name": "失败拒绝整体",
        "code": "function allSettled(iterable) {\n  return new Promise((resolve, reject) => {\n    const result = []; let remaining = 1, index = 0;\n    function settle(position, record) { result[position] = record; if (--remaining === 0) resolve(result); }\n    try {\n      for (const value of iterable) {\n        const position = index++; remaining++;\n        Promise.resolve(value).then(\n          value => settle(position, {status: 'fulfilled', value}),\n          reason => reject(reason)\n        );\n      }\n      if (--remaining === 0) resolve(result);\n    } catch (error) { reject(error); }\n  });\n}"
      }
    ]
  },
  {
    "id": "E10",
    "slug": "cancelable-delay",
    "title": "可取消延时",
    "summary": "异步任务需要等待一段时间，但页面离开时应及时结束等待。实现支持 AbortSignal 的 delay，正常完成或取消都释放计时器和监听，不把取消吞成成功。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 20,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "delay(ms, signal?) → Promise<void>；ms 为 0—2147483647 整数，非法数字抛 RangeError、非数字抛 TypeError（以 Promise 拒绝）。取消拒绝 signal.reason，reason 缺失时为 name=\"AbortError\" 的 Error。",
    "problem": [
      "异步任务需要等待一段时间，但页面离开时应及时结束等待。实现支持 AbortSignal 的 delay，正常完成或取消都释放计时器和监听，不把取消吞成成功。",
      "ms=0 仍经计时器异步完成；signal 必须是 AbortSignal，否则拒绝 TypeError。预取消不启动计时器，完成后再取消不会改变结果；不使用 this。"
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
    "starterArtifact": "function delay(ms, signal) {\n  // TODO 返回可取消的等待 Promise。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "先验证输入并处理预取消。",
      "完成与取消共享 cleanup，删除监听也清 timer。",
      "错误原因保留 signal.reason，不把取消转成 resolve。"
    ],
    "referenceArtifact": "function delay(ms, signal) {\n  return new Promise((resolve, reject) => {\n    if (typeof ms !== 'number') throw new TypeError('Invalid milliseconds');\n    if (!Number.isInteger(ms) || ms < 0 || ms > 2147483647) throw new RangeError('Invalid milliseconds');\n    if (signal !== undefined && !(signal instanceof AbortSignal)) throw new TypeError('Invalid signal');\n    const reason = () => signal.reason === undefined ? Object.assign(new Error('Aborted'), {name:'AbortError'}) : signal.reason;\n    if (signal?.aborted) { reject(reason()); return; }\n    let timer;\n    function cleanup() { clearTimeout(timer); signal?.removeEventListener('abort', abort); }\n    function abort() { cleanup(); reject(reason()); }\n    timer = setTimeout(() => { cleanup(); resolve(); }, ms);\n    signal?.addEventListener('abort', abort, {once:true});\n  });\n}",
    "explanation": [
      "取消是与计时器竞争的另一个结束事件。Promise 只结算一次，但资源不会自动释放；因此两个结束路径都要调用 cleanup，让另一条路径不再占据 timer 或监听。",
      "AbortSignal 可能在调用 delay 前已取消，此时注册新监听不会补发过去的 abort 事件，所以必须先检查 aborted。零等待仍使用 timer，保持同步代码先完成的边界。",
      "reason 是调用方提供的取消证据，可能不是 Error；参考实现原样拒绝它。没有 reason 时才创建 AbortError。完成后移除监听，后续取消不会回调旧等待。"
    ],
    "alternative": "支持主动 cancel() 的包装对象也可使用，但需要明确取消对象的生命周期；标准 signal 更容易贯穿一组异步任务。",
    "complexity": "时间和空间 O(1)；每个在途等待持有一个 timer 和最多一个监听。",
    "commonMistakes": [
      "只清 timer 不 reject 会让调用方永久等待。",
      "只监听 abort 不检查预取消会漏掉已经取消的信号。"
    ],
    "knowledgeIds": [
      "K02-05"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "const p = delay(5); await clock.tick(5); console.log(await p);",
        "expectedOutput": "undefined",
        "explanation": "计时器到期清理资源后完成，没有业务返回值。",
        "expectedLogs": [
          "undefined"
        ]
      },
      {
        "code": "const c = new AbortController(); c.abort(); try { await delay(5,c.signal); } catch (e) { console.log(e.name); }",
        "expectedOutput": "AbortError",
        "explanation": "先检查 signal 状态，不安排一个已经被取消的等待。",
        "expectedLogs": [
          "AbortError"
        ]
      },
      {
        "code": "const p = delay(0); console.log(\"开始\"); await clock.tick(0); await p; console.log(\"结束\");",
        "expectedOutput": "开始、结束",
        "explanation": "0 毫秒表示最近的计时器阶段，不表示同步执行。",
        "expectedLogs": [
          "开始",
          "结束"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E10-T01",
        "name": "正常完成",
        "purpose": "到期 resolve undefined",
        "code": "let done=false,p=delay(5).then(x=>{equal(x,undefined);done=true});await clock.tick(4);assert(!done,\"early\");await clock.tick(1);await p;assert(done,\"finish\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "正常完成",
        "expectedOutcome": "到期 resolve undefined",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E10-T02",
        "name": "零等待",
        "purpose": "不能同步完成",
        "code": "let done=false,p=delay(0).then(()=>done=true);await flush();assert(!done,\"must wait timer\");await clock.tick(0);await p;assert(done,\"zero timer\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "零等待",
        "expectedOutcome": "不能同步完成",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E10-T03",
        "name": "预取消",
        "purpose": "不创建计时器",
        "code": "let c=new AbortController();c.abort();await expectReject(delay(3,c.signal),\"AbortError\");equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "预取消",
        "expectedOutcome": "不创建计时器",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E10-T04",
        "name": "等待中取消",
        "purpose": "拒绝且无迟到 timer",
        "code": "let c=new AbortController(),p=delay(5,c.signal),caught=p.catch(e=>e.name);c.abort();equal(await caught,\"AbortError\");equal(clock.size,0);await clock.tick(10);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "等待中取消",
        "expectedOutcome": "拒绝且无迟到 timer",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E10-T05",
        "name": "完成后取消",
        "purpose": "成功保持",
        "code": "let c=new AbortController(),p=delay(1,c.signal);await clock.tick(1);equal(await p,undefined);c.abort();equal(await p,undefined);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "完成后取消",
        "expectedOutcome": "成功保持",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E10-T06",
        "name": "校验与监听释放",
        "purpose": "非法参数拒绝且完成清除监听",
        "code": "for(const x of [-1,NaN,Infinity,0.5])await expectReject(delay(x),\"RangeError\");await expectReject(delay(\"1\"),\"TypeError\");await expectReject(delay(1,{}),\"TypeError\");let c=new AbortController(),removed=0,orig=c.signal.removeEventListener.bind(c.signal);c.signal.removeEventListener=(...a)=>{removed++;orig(...a)};let p=delay(1,c.signal);await clock.tick(1);await p;equal(removed,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "校验与监听释放",
        "expectedOutcome": "非法参数拒绝且完成清除监听",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "预取消漏检",
        "code": "function delay(ms, signal) {\n  return new Promise((resolve, reject) => {\n    if (typeof ms !== 'number') throw new TypeError('Invalid milliseconds');\n    if (!Number.isInteger(ms) || ms < 0 || ms > 2147483647) throw new RangeError('Invalid milliseconds');\n    if (signal !== undefined && !(signal instanceof AbortSignal)) throw new TypeError('Invalid signal');\n    const reason = () => signal.reason === undefined ? Object.assign(new Error('Aborted'), {name:'AbortError'}) : signal.reason;\n    if (false) { reject(reason()); return; }\n    let timer;\n    function cleanup() { clearTimeout(timer); signal?.removeEventListener('abort', abort); }\n    function abort() { cleanup(); reject(reason()); }\n    timer = setTimeout(() => { cleanup(); resolve(); }, ms);\n    signal?.addEventListener('abort', abort, {once:true});\n  });\n}"
      },
      {
        "name": "取消错误变成功",
        "code": "function delay(ms, signal) {\n  return new Promise((resolve, reject) => {\n    if (typeof ms !== 'number') throw new TypeError('Invalid milliseconds');\n    if (!Number.isInteger(ms) || ms < 0 || ms > 2147483647) throw new RangeError('Invalid milliseconds');\n    if (signal !== undefined && !(signal instanceof AbortSignal)) throw new TypeError('Invalid signal');\n    const reason = () => signal.reason === undefined ? Object.assign(new Error('Aborted'), {name:'AbortError'}) : signal.reason;\n    if (signal?.aborted) { reject(reason()); return; }\n    let timer;\n    function cleanup() { clearTimeout(timer); signal?.removeEventListener('abort', abort); }\n    function abort() { cleanup(); resolve(); }\n    timer = setTimeout(() => { cleanup(); resolve(); }, ms);\n    signal?.addEventListener('abort', abort, {once:true});\n  });\n}"
      }
    ]
  },
  {
    "id": "E11",
    "slug": "retry-backoff",
    "title": "重试与退避",
    "summary": "暂时性错误可以重试，但无限重试或把业务错误当作暂时故障会重复副作用。实现带上限、错误谓词与取消的重试，attempts 包含首次调用，成功后立即结束。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 35,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "retry(task, {attempts=3, baseMs=100, maxMs=2147483647, shouldRetry=()=>true, signal}={}) → Promise；task(attempt, signal) 的 attempt 从 1 开始。attempts 为正整数，baseMs/maxMs 为合法计时整数；失败后等待 min(maxMs, baseMs×2^(attempt−1))。",
    "problem": [
      "暂时性错误可以重试，但无限重试或把业务错误当作暂时故障会重复副作用。实现带上限、错误谓词与取消的重试，attempts 包含首次调用，成功后立即结束。",
      "task/shouldRetry 非函数或 signal 非信号拒绝 TypeError，数字约束失败拒绝 RangeError。任务同步抛错也进入谓词；谓词抛错直接拒绝。预取消、等待中取消、任务在途取消都立即拒绝且不再重试；无法强制停止不响应 signal 的任务。"
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
    "starterArtifact": "function retry(task, options = {}) {\n  // TODO 返回按预算与谓词重试的 Promise。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "尝试编号从 1 开始，失败后先检查预算和谓词。",
      "等待间隔由失败的 attempt 推导，并限制计时器上限。",
      "任务与退避都要观察取消，取消后底层迟到拒绝仍有处理器。"
    ],
    "referenceArtifact": "async function retry(task, {attempts=3, baseMs=100, maxMs=2147483647, shouldRetry=()=>true, signal}={}) {\n  if (typeof task !== 'function' || typeof shouldRetry !== 'function' || (signal !== undefined && !(signal instanceof AbortSignal))) throw new TypeError('Invalid options');\n  if (!Number.isInteger(attempts) || attempts < 1 || !Number.isInteger(baseMs) || baseMs < 0 || baseMs > 2147483647 || !Number.isInteger(maxMs) || maxMs < 0 || maxMs > 2147483647) throw new RangeError('Invalid options');\n  const abortReason = () => signal.reason === undefined ? Object.assign(new Error('Aborted'), {name:'AbortError'}) : signal.reason;\n  function run() {\n    return new Promise((resolve, reject) => {\n      if (signal?.aborted) { reject(abortReason()); return; }\n      const abort = () => { cleanup(); reject(abortReason()); };\n      const cleanup = () => signal?.removeEventListener('abort', abort);\n      signal?.addEventListener('abort', abort, {once:true});\n      let value;\n      try { value = task(current, signal); } catch (error) { cleanup(); reject(error); return; }\n      Promise.resolve(value).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });\n    });\n  }\n  function pause(ms) {\n    return new Promise((resolve, reject) => {\n      if (signal?.aborted) { reject(abortReason()); return; }\n      let timer;\n      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); };\n      const abort = () => { cleanup(); reject(abortReason()); };\n      timer = setTimeout(() => { cleanup(); resolve(); }, ms);\n      signal?.addEventListener('abort', abort, {once:true});\n    });\n  }\n  let current = 1;\n  for (;;) {\n    if (signal?.aborted) throw abortReason();\n    try { return await run(); }\n    catch (error) {\n      if (signal?.aborted) throw abortReason();\n      if (current >= attempts || !shouldRetry(error, current)) throw error;\n      await pause(Math.min(maxMs, baseMs * 2 ** (current - 1)));\n      current++;\n    }\n  }\n}",
    "explanation": [
      "重试预算描述总调用次数。current=1 表示首次已经开始，失败时 current>=attempts 就直接抛出原错误。谓词只在还剩预算时询问，避免明明不会重试却触发额外判断副作用。",
      "baseMs×2^(current−1) 使首次失败等待 baseMs，下一次翻倍。maxMs 保证大尝试编号不会把超大数传给计时器。生产重试常需要随机抖动与总截止时间，这里故意固定间隔以便确定性推导。",
      "run 与 pause 都为 signal 安装可清理监听，使取消不必等待一个不合作的任务结束。取消仅停止外层等待和未来重试，无法撤销已经发生的写入；带副作用任务必须有幂等设计，不能因为看见错误就假定服务器没有成功。"
    ],
    "alternative": "指数退避可加入 full jitter 防止多个客户端同步重试，但题目测试应注入可控随机源。对于永久错误应通过谓词直接失败。",
    "complexity": "最多 O(attempts) 次调用和 O(attempts) 次调度；额外状态 O(1)，底层忽略取消的任务资源由任务负责。",
    "commonMistakes": [
      "把 attempts 当额外重试次数会多执行一次。",
      "只取消等待 timer 会让在途任务取消无法及时结算。"
    ],
    "knowledgeIds": [
      "K02-06",
      "K02-05"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(await retry(attempt => attempt, {attempts:3}));",
        "expectedOutput": "1",
        "explanation": "成功不会消耗剩余预算，也不会等待退避。",
        "expectedLogs": [
          "1"
        ]
      },
      {
        "code": "let n=0; const p=retry(() => { if (++n<2) throw new Error(\"暂时\"); return \"ok\"; }, {baseMs:5}); await flush(); await clock.tick(5); console.log(await p);",
        "expectedOutput": "ok",
        "explanation": "第一次失败后等 5ms，第二次成功结束。",
        "expectedLogs": [
          "ok"
        ]
      },
      {
        "code": "try { await retry(() => { throw new Error(\"永久\"); }, {attempts:1}); } catch (e) { console.log(e.message); }",
        "expectedOutput": "永久",
        "explanation": "预算包含首次，所以不允许第二次调用。",
        "expectedLogs": [
          "永久"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E11-T01",
        "name": "成功即停",
        "purpose": "首次成功不安排 timer",
        "code": "let n=0;equal(await retry(()=>++n),1);equal(n,1);equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "成功即停",
        "expectedOutcome": "首次成功不安排 timer",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E11-T02",
        "name": "attempts 包含首次",
        "purpose": "一次预算只调用一次",
        "code": "let n=0;await expectReject(retry(()=>{n++;throw new Error(\"x\")},{attempts:1}),\"Error\");equal(n,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "attempts 包含首次",
        "expectedOutcome": "一次预算只调用一次",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E11-T03",
        "name": "指数退避",
        "purpose": "间隔 2、4、5 且上限生效",
        "code": "let times=[],p=retry(a=>{times.push(clock.now);if(a<4)throw new Error(\"x\");return a},{attempts:4,baseMs:2,maxMs:5});await flush();await clock.tick(2);await clock.tick(4);await clock.tick(5);equal(await p,4);equal(times,[0,2,6,11]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "指数退避",
        "expectedOutcome": "间隔 2、4、5 且上限生效",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E11-T04",
        "name": "谓词拒绝",
        "purpose": "不可重试错误立刻停止",
        "code": "let n=0;await expectReject(retry(()=>{n++;throw new TypeError(\"x\")},{shouldRetry:()=>false}),\"TypeError\");equal(n,1);equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "谓词拒绝",
        "expectedOutcome": "不可重试错误立刻停止",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E11-T05",
        "name": "等待中取消",
        "purpose": "取消释放退避 timer",
        "code": "let c=new AbortController(),n=0,p=retry(()=>{n++;throw new Error(\"x\")},{signal:c.signal,baseMs:10}),caught=p.catch(e=>e.name);await flush();c.abort();equal(await caught,\"AbortError\");await clock.tick(20);equal(n,1);equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "等待中取消",
        "expectedOutcome": "取消释放退避 timer",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E11-T06",
        "name": "任务在途取消",
        "purpose": "不响应任务也立即拒绝",
        "code": "let d=deferred(),c=new AbortController(),p=retry(()=>d.promise,{signal:c.signal}),caught=p.catch(e=>e.name);c.abort();equal(await caught,\"AbortError\");d.reject(new Error(\"late\"));await flush();equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "任务在途取消",
        "expectedOutcome": "不响应任务也立即拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E11-T07",
        "name": "预取消与无效参数",
        "purpose": "不启动任务，校验明确",
        "code": "let c=new AbortController(),n=0;c.abort();await expectReject(retry(()=>++n,{signal:c.signal}),\"AbortError\");equal(n,0);await expectReject(retry(()=>1,{attempts:0}),\"RangeError\");await expectReject(retry(null),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "预取消与无效参数",
        "expectedOutcome": "不启动任务，校验明确",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E11-T08",
        "name": "同步异常与谓词异常",
        "purpose": "同步任务可重试，谓词错误透传",
        "code": "let n=0,p=retry(()=>{if(++n<2)throw new Error(\"x\");return 9},{baseMs:0});await flush();await clock.tick(0);equal(await p,9);await expectReject(retry(()=>{throw new Error(\"x\")},{shouldRetry(){throw new TypeError(\"predicate\")}}),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "同步异常与谓词异常",
        "expectedOutcome": "同步任务可重试，谓词错误透传",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "预算多一次",
        "code": "async function retry(task, {attempts=3, baseMs=100, maxMs=2147483647, shouldRetry=()=>true, signal}={}) {\n  if (typeof task !== 'function' || typeof shouldRetry !== 'function' || (signal !== undefined && !(signal instanceof AbortSignal))) throw new TypeError('Invalid options');\n  if (!Number.isInteger(attempts) || attempts < 1 || !Number.isInteger(baseMs) || baseMs < 0 || baseMs > 2147483647 || !Number.isInteger(maxMs) || maxMs < 0 || maxMs > 2147483647) throw new RangeError('Invalid options');\n  const abortReason = () => signal.reason === undefined ? Object.assign(new Error('Aborted'), {name:'AbortError'}) : signal.reason;\n  function run() {\n    return new Promise((resolve, reject) => {\n      if (signal?.aborted) { reject(abortReason()); return; }\n      const abort = () => { cleanup(); reject(abortReason()); };\n      const cleanup = () => signal?.removeEventListener('abort', abort);\n      signal?.addEventListener('abort', abort, {once:true});\n      let value;\n      try { value = task(current, signal); } catch (error) { cleanup(); reject(error); return; }\n      Promise.resolve(value).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });\n    });\n  }\n  function pause(ms) {\n    return new Promise((resolve, reject) => {\n      if (signal?.aborted) { reject(abortReason()); return; }\n      let timer;\n      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); };\n      const abort = () => { cleanup(); reject(abortReason()); };\n      timer = setTimeout(() => { cleanup(); resolve(); }, ms);\n      signal?.addEventListener('abort', abort, {once:true});\n    });\n  }\n  let current = 1;\n  for (;;) {\n    if (signal?.aborted) throw abortReason();\n    try { return await run(); }\n    catch (error) {\n      if (signal?.aborted) throw abortReason();\n      if (current > attempts || !shouldRetry(error, current)) throw error;\n      await pause(Math.min(maxMs, baseMs * 2 ** (current - 1)));\n      current++;\n    }\n  }\n}"
      },
      {
        "name": "退避不翻倍",
        "code": "async function retry(task, {attempts=3, baseMs=100, maxMs=2147483647, shouldRetry=()=>true, signal}={}) {\n  if (typeof task !== 'function' || typeof shouldRetry !== 'function' || (signal !== undefined && !(signal instanceof AbortSignal))) throw new TypeError('Invalid options');\n  if (!Number.isInteger(attempts) || attempts < 1 || !Number.isInteger(baseMs) || baseMs < 0 || baseMs > 2147483647 || !Number.isInteger(maxMs) || maxMs < 0 || maxMs > 2147483647) throw new RangeError('Invalid options');\n  const abortReason = () => signal.reason === undefined ? Object.assign(new Error('Aborted'), {name:'AbortError'}) : signal.reason;\n  function run() {\n    return new Promise((resolve, reject) => {\n      if (signal?.aborted) { reject(abortReason()); return; }\n      const abort = () => { cleanup(); reject(abortReason()); };\n      const cleanup = () => signal?.removeEventListener('abort', abort);\n      signal?.addEventListener('abort', abort, {once:true});\n      let value;\n      try { value = task(current, signal); } catch (error) { cleanup(); reject(error); return; }\n      Promise.resolve(value).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });\n    });\n  }\n  function pause(ms) {\n    return new Promise((resolve, reject) => {\n      if (signal?.aborted) { reject(abortReason()); return; }\n      let timer;\n      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); };\n      const abort = () => { cleanup(); reject(abortReason()); };\n      timer = setTimeout(() => { cleanup(); resolve(); }, ms);\n      signal?.addEventListener('abort', abort, {once:true});\n    });\n  }\n  let current = 1;\n  for (;;) {\n    if (signal?.aborted) throw abortReason();\n    try { return await run(); }\n    catch (error) {\n      if (signal?.aborted) throw abortReason();\n      if (current >= attempts || !shouldRetry(error, current)) throw error;\n      await pause(Math.min(maxMs, baseMs));\n      current++;\n    }\n  }\n}"
      }
    ]
  },
  {
    "id": "E12",
    "slug": "inflight-deduplication",
    "title": "请求去重",
    "summary": "同一资源被多个调用方同时请求时，希望共享这次工作而不是重复启动。实现按 key 去重的运行器，仅复用在途 Promise，不缓存成功值或失败结果。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 30,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "createDeduper() → run(key, task)；key 使用 Map 相等规则，task 为无参数函数；相同 key 在途期间返回严格同一个 Promise，结算后删除。任务工厂非函数返回拒绝 TypeError；任务同步抛错转换成拒绝。",
    "problem": [
      "同一资源被多个调用方同时请求时，希望共享这次工作而不是重复启动。实现按 key 去重的运行器，仅复用在途 Promise，不缓存成功值或失败结果。",
      "task 在下一个微任务启动，保证首次 run 返回前 key 已登记，工厂内部重入也能找到同一个 Promise。任务不得等待自己所属 key 的 Promise（自依赖会永久等待）。不使用调用 this，不修改 key。"
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
    "starterArtifact": "function createDeduper() {\n  // TODO 返回 run(key, task)。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "Map 保存 Promise 而不是结果。",
      "先创建延迟执行链，再登记 key，工厂下一微任务才启动。",
      "用 then 的两个清理分支，避免忽略 finally 返回的拒绝链。"
    ],
    "referenceArtifact": "function createDeduper() {\n  const pending = new Map();\n  return function run(key, task) {\n    if (pending.has(key)) return pending.get(key);\n    if (typeof task !== 'function') return Promise.reject(new TypeError('Invalid task'));\n    const promise = Promise.resolve().then(() => task());\n    pending.set(key, promise);\n    promise.then(() => pending.delete(key), () => pending.delete(key));\n    return promise;\n  };\n}",
    "explanation": [
      "run 本身不是 async 函数。async 会将返回 Promise 包装成另一个 Promise，值虽然相同却破坏严格身份共享。pending 存放的就是每次新建并返回的 promise。",
      "先登记再执行是重入保证的关键。Promise.resolve().then(task) 将工厂推迟到微任务，因此工厂内部再次 run 同 key 时能取到 outer；但等待 outer 会构成自依赖，题面明确排除。",
      "成功与失败都删除 key。使用 finally 清理却忽略其返回 Promise 会产生一条新的拒绝链；双分支 then 的两个处理函数都正常返回，因此内部清理链不会因为任务失败而拒绝。原始 Promise 仍需调用方处理错误。"
    ],
    "alternative": "带 TTL 的结果缓存会降低更多请求，但必须增加失效、权限范围和失败缓存策略；本题只消除同一时段重复工作。",
    "complexity": "Map 查找摊还 O(1)，空间 O(k)，k 为在途不同 key 数量。",
    "commonMistakes": [
      "async run 破坏 Promise 严格身份。",
      "只在成功时清理会永久缓存失败。"
    ],
    "knowledgeIds": [
      "K02-02",
      "K02-05"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "const run=createDeduper(); const a=run(\"x\",()=>1), b=run(\"x\",()=>2); console.log(a===b, await b);",
        "expectedOutput": "true 1",
        "explanation": "第二次调用读取 pending，不启动第二个工厂。",
        "expectedLogs": [
          "true 1"
        ]
      },
      {
        "code": "const run=createDeduper(); console.log(await run(\"x\",()=>1)); console.log(await run(\"x\",()=>2));",
        "expectedOutput": "1、2",
        "explanation": "结算后的清理先于后续读取，因此没有结果缓存。",
        "expectedLogs": [
          "1",
          "2"
        ]
      },
      {
        "code": "const run=createDeduper(); try { await run(\"x\",()=>{throw new Error(\"失败\")}); } catch(e){console.log(e.message)}",
        "expectedOutput": "失败",
        "explanation": "工厂在 Promise 微任务中执行，同步异常自动变成拒绝。",
        "expectedLogs": [
          "失败"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E12-T01",
        "name": "共享身份",
        "purpose": "相同 key 严格同 Promise",
        "code": "let run=createDeduper(),d=deferred(),n=0,p=run(\"x\",()=>{n++;return d.promise}),q=run(\"x\",()=>9);assert(p===q,\"same promise\");await flush();equal(n,1);d.resolve(1);equal(await p,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "共享身份",
        "expectedOutcome": "相同 key 严格同 Promise",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E12-T02",
        "name": "key 隔离",
        "purpose": "不同 key 独立执行",
        "code": "let run=createDeduper(),n=0;equal(await Promise.all([run(\"a\",()=>++n),run(\"b\",()=>++n)]),[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "key 隔离",
        "expectedOutcome": "不同 key 独立执行",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E12-T03",
        "name": "成功不缓存",
        "purpose": "完成后重新执行",
        "code": "let run=createDeduper(),n=0;equal(await run(\"x\",()=>++n),1);await flush();equal(await run(\"x\",()=>++n),2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "成功不缓存",
        "expectedOutcome": "完成后重新执行",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E12-T04",
        "name": "失败后重试",
        "purpose": "拒绝也清理 key",
        "code": "let run=createDeduper();await expectReject(run(\"x\",()=>Promise.reject(new Error(\"x\"))),\"Error\");await flush();equal(await run(\"x\",()=>2),2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "失败后重试",
        "expectedOutcome": "拒绝也清理 key",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E12-T05",
        "name": "同步抛错",
        "purpose": "变成拒绝并可恢复",
        "code": "let run=createDeduper(),p=run(\"x\",()=>{throw new TypeError(\"x\")});await expectReject(p,\"TypeError\");await flush();equal(await run(\"x\",()=>3),3);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "同步抛错",
        "expectedOutcome": "变成拒绝并可恢复",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E12-T06",
        "name": "工厂重入",
        "purpose": "登记先于工厂执行",
        "code": "let run=createDeduper(),outer,inner;outer=run(\"x\",()=>{inner=run(\"x\",()=>5);return 1});equal(await outer,1);assert(inner===outer,\"reentrant same promise\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "工厂重入",
        "expectedOutcome": "登记先于工厂执行",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E12-T07",
        "name": "undefined 与身份 key",
        "purpose": "Map 语义且不缓存 undefined",
        "code": "let run=createDeduper(),a={},b={},n=0;equal(await run(a,()=>++n),1);equal(await run(b,()=>++n),2);equal(await run(NaN,()=>undefined),undefined);await flush();equal(await run(NaN,()=>3),3);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "undefined 与身份 key",
        "expectedOutcome": "Map 语义且不缓存 undefined",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E12-T08",
        "name": "无附加无人处理拒绝",
        "purpose": "清理双分支不创造拒绝链",
        "code": "let run=createDeduper(),d=deferred(),p=run(\"x\",()=>d.promise);let caught=p.catch(e=>e.message);await flush();d.reject(new Error(\"handled\"));equal(await caught,\"handled\");await flush();await expectReject(run(\"bad\",null),\"TypeError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "无附加无人处理拒绝",
        "expectedOutcome": "清理双分支不创造拒绝链",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "包装 Promise 改身份",
        "code": "function createDeduper() {\n  const pending = new Map();\n  return async function run(key, task) {\n    if (pending.has(key)) return pending.get(key);\n    if (typeof task !== 'function') return Promise.reject(new TypeError('Invalid task'));\n    const promise = Promise.resolve().then(() => task());\n    pending.set(key, promise);\n    promise.then(() => pending.delete(key), () => pending.delete(key));\n    return promise;\n  };\n}"
      },
      {
        "name": "失败不清 key",
        "code": "function createDeduper() {\n  const pending = new Map();\n  return function run(key, task) {\n    if (pending.has(key)) return pending.get(key);\n    if (typeof task !== 'function') return Promise.reject(new TypeError('Invalid task'));\n    const promise = Promise.resolve().then(() => task());\n    pending.set(key, promise);\n    promise.then(() => pending.delete(key), () => undefined);\n    return promise;\n  };\n}"
      }
    ]
  },
  {
    "id": "E13",
    "slug": "latest-request",
    "title": "最近一次请求生效",
    "summary": "搜索请求 A 先发后到，B 后发先到，直接显示每次响应会回退到旧数据。实现序号守卫：工厂可以并发，但只有最新身份能提交，无论成功还是失败。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 30,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "createLatest(onSuccess,onError) → {run, cancel, sequence}；run(task) 返回任务原结果 Promise，并向最新未取消序号提交成功/失败；cancel() 使当前序号失效，不停止底层任务；sequence 只增不减。回调必须不抛错。",
    "problem": [
      "搜索请求 A 先发后到，B 后发先到，直接显示每次响应会回退到旧数据。实现序号守卫：工厂可以并发，但只有最新身份能提交，无论成功还是失败。",
      "run 无 this、工厂在微任务启动并以 task(sequence) 调用；非函数 task 同步 TypeError，回调非函数创建时 TypeError。run 返回 Promise 的成功/失败仍反映原任务，过期只抑制提交，不把旧失败变成成功。"
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
    "starterArtifact": "function createLatest(onSuccess, onError) {\n  // TODO 返回 run、cancel 与只读 sequence。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "发起请求时冻结本次序号。",
      "成功和失败提交前都比较序号。",
      "cancel 也要使身份失效，但不能把计数重置。"
    ],
    "referenceArtifact": "function createLatest(onSuccess, onError) {\n  if (typeof onSuccess !== 'function' || typeof onError !== 'function') throw new TypeError('Invalid callbacks');\n  let sequence = 0;\n  return {\n    get sequence() { return sequence; },\n    cancel() { sequence++; },\n    run(task) {\n      if (typeof task !== 'function') throw new TypeError('Invalid task');\n      const current = ++sequence;\n      return Promise.resolve().then(() => task(current)).then(value => {\n        if (current === sequence) onSuccess(value, current);\n        return value;\n      }, error => {\n        if (current === sequence) onError(error, current);\n        throw error;\n      });\n    }\n  };\n}",
    "explanation": [
      "完成顺序不能代表用户最新意图。sequence 在发起时递增，current 是每个请求的冻结身份；结算时再次比较，旧请求仍完成但没有显示权限。",
      "成功与失败对页面都有影响，所以两条分支必须使用同一个守卫。只保护成功会让旧错误覆盖新成功；取消也要递增序号，单纯停止某个网络请求无法替代身份校验。",
      "run 仍返回原任务语义：旧成功返回旧值，旧失败拒绝原错误。是否提交是独立的副作用控制。该合同要求提交回调不抛错；若业务需要处理提交自身失败，应另增提交错误模型。"
    ],
    "alternative": "可以同时 abort 旧请求节约资源，但守卫仍必需，因为底层可能忽略 abort 或已经完成。",
    "complexity": "每次调度 O(1)，每个在途任务持有 O(1) 处理状态，总 O(k)。",
    "commonMistakes": [
      "只在成功路径比较身份。",
      "cancel 重置为 0 会让老序号在未来再次匹配。"
    ],
    "knowledgeIds": [
      "K02-03",
      "K02-05"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "const out=[]; const l=createLatest(x=>out.push(x),()=>{}); const a=l.run(()=>1),b=l.run(()=>2); await Promise.all([a,b]); console.log(out);",
        "expectedOutput": "[2]",
        "explanation": "两个工厂都执行，但 A 在结算时已经不是最新身份。",
        "expectedLogs": [
          "[ 2 ]"
        ]
      },
      {
        "code": "const out=[]; const l=createLatest(x=>out.push(x),()=>{}); const p=l.run(()=>1); l.cancel(); await p; console.log(out);",
        "expectedOutput": "[]",
        "explanation": "cancel 增加序号，让在途请求失去提交资格。",
        "expectedLogs": [
          "[]"
        ]
      },
      {
        "code": "const l=createLatest(()=>{},e=>console.log(e.message)); try{await l.run(()=>{throw new Error(\"失败\")})}catch{}",
        "expectedOutput": "失败",
        "explanation": "最新失败同样受序号判断，并提交到错误分支。",
        "expectedLogs": [
          "失败"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E13-T01",
        "name": "旧慢新快",
        "purpose": "只提交新成功",
        "code": "let out=[],latest=createLatest(x=>out.push(x),()=>{}),a=deferred(),b=deferred(),pa=latest.run(()=>a.promise),pb=latest.run(()=>b.promise);b.resolve(\"new\");await pb;a.resolve(\"old\");await pa;equal(out,[\"new\"]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "旧慢新快",
        "expectedOutcome": "只提交新成功",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E13-T02",
        "name": "旧失败",
        "purpose": "旧拒绝不提交错误但 Promise 拒绝",
        "code": "let out=[],latest=createLatest(()=>{},e=>out.push(e)),a=deferred(),pa=latest.run(()=>a.promise),caught=pa.catch(e=>e.message);await latest.run(()=>1);a.reject(new Error(\"old\"));equal(await caught,\"old\");equal(out,[]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "旧失败",
        "expectedOutcome": "旧拒绝不提交错误但 Promise 拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E13-T03",
        "name": "新失败",
        "purpose": "最新错误可见",
        "code": "let e=new Error(\"new\"),out=[],latest=createLatest(()=>{},x=>out.push(x));await expectReject(latest.run(()=>Promise.reject(e)),\"Error\",e);assert(out[0]===e,\"submit new error\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "新失败",
        "expectedOutcome": "最新错误可见",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E13-T04",
        "name": "取消",
        "purpose": "取消抑制成功提交",
        "code": "let out=[],d=deferred(),latest=createLatest(x=>out.push(x),()=>{}),p=latest.run(()=>d.promise);latest.cancel();d.resolve(1);equal(await p,1);equal(out,[]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "取消",
        "expectedOutcome": "取消抑制成功提交",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E13-T05",
        "name": "计数单调",
        "purpose": "取消与请求均递增",
        "code": "let latest=createLatest(()=>{},()=>{});equal(latest.sequence,0);await latest.run(x=>x);equal(latest.sequence,1);latest.cancel();equal(latest.sequence,2);await latest.run(x=>equal(x,3));equal(latest.sequence,3);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "计数单调",
        "expectedOutcome": "取消与请求均递增",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E13-T06",
        "name": "同步异常",
        "purpose": "最新同步失败提交",
        "code": "let out=[],latest=createLatest(()=>{},e=>out.push(e.name));await expectReject(latest.run(()=>{throw new TypeError(\"x\")}),\"TypeError\");equal(out,[\"TypeError\"]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "同步异常",
        "expectedOutcome": "最新同步失败提交",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E13-T07",
        "name": "取消旧错误",
        "purpose": "取消抑制失败提交",
        "code": "let out=[],d=deferred(),latest=createLatest(()=>{},e=>out.push(e)),p=latest.run(()=>d.promise),caught=p.catch(e=>e.name);latest.cancel();d.reject(new Error(\"x\"));equal(await caught,\"Error\");equal(out,[]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "取消旧错误",
        "expectedOutcome": "取消抑制失败提交",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E13-T08",
        "name": "校验",
        "purpose": "非法工厂和回调拒绝",
        "code": "expectThrow(()=>createLatest(null,()=>{}),\"TypeError\");let latest=createLatest(()=>{},()=>{});expectThrow(()=>latest.run(1),\"TypeError\");equal(latest.sequence,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "校验",
        "expectedOutcome": "非法工厂和回调拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "旧成功仍提交",
        "code": "function createLatest(onSuccess, onError) {\n  if (typeof onSuccess !== 'function' || typeof onError !== 'function') throw new TypeError('Invalid callbacks');\n  let sequence = 0;\n  return {\n    get sequence() { return sequence; },\n    cancel() { sequence++; },\n    run(task) {\n      if (typeof task !== 'function') throw new TypeError('Invalid task');\n      const current = ++sequence;\n      return Promise.resolve().then(() => task(current)).then(value => {\n        if (true) onSuccess(value, current);\n        return value;\n      }, error => {\n        if (current === sequence) onError(error, current);\n        throw error;\n      });\n    }\n  };\n}"
      },
      {
        "name": "旧失败仍提交",
        "code": "function createLatest(onSuccess, onError) {\n  if (typeof onSuccess !== 'function' || typeof onError !== 'function') throw new TypeError('Invalid callbacks');\n  let sequence = 0;\n  return {\n    get sequence() { return sequence; },\n    cancel() { sequence++; },\n    run(task) {\n      if (typeof task !== 'function') throw new TypeError('Invalid task');\n      const current = ++sequence;\n      return Promise.resolve().then(() => task(current)).then(value => {\n        if (current === sequence) onSuccess(value, current);\n        return value;\n      }, error => {\n        if (true) onError(error, current);\n        throw error;\n      });\n    }\n  };\n}"
      }
    ]
  },
  {
    "id": "E23",
    "slug": "task-timeout",
    "title": "带超时的任务",
    "summary": "任务可能永久等待，或忽略调用方取消。实现截止时间包装器，让外层在到期或取消时结束，同时把内部 signal 通知任务；不能假设通知会强制停止任务。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 25,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "withTimeout(task, ms, externalSignal?) → Promise；task(internalSignal) 在微任务开始。ms 为合法计时整数；超时先以 name=\"TimeoutError\" 拒绝并 abort 内部信号，外部取消拒绝其 reason 并 abort。task 非函数/signal 非信号拒绝 TypeError，非法 ms 拒绝 RangeError。",
    "problem": [
      "任务可能永久等待，或忽略调用方取消。实现截止时间包装器，让外层在到期或取消时结束，同时把内部 signal 通知任务；不能假设通知会强制停止任务。",
      "先完成则清 timer/外部监听；先超时则内部 abort 且外层 TimeoutError 不被任务因 abort 引发的错误覆盖。预取消不启动任务；迟到结果被忽略但拒绝必须处理。不使用 this，不修改外部 signal。"
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
    "starterArtifact": "function withTimeout(task, ms, externalSignal) {\n  // TODO 返回带截止与取消转发的 Promise。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "完成、超时、外部取消共用一次结算入口。",
      "先冻结 settled 并结算外层，再 abort 内部。",
      "给底层 Promise 安装成功和失败处理，即使它迟到也不能遗弃拒绝。"
    ],
    "referenceArtifact": "function withTimeout(task, ms, externalSignal) {\n  return new Promise((resolve,reject)=>{\n    if (typeof task!=='function' || (externalSignal!==undefined && !(externalSignal instanceof AbortSignal))) throw new TypeError('Invalid task or signal');\n    if (!Number.isInteger(ms) || ms<0 || ms>2147483647) throw new RangeError('Invalid milliseconds');\n    if (externalSignal?.aborted) { reject(externalSignal.reason); return; }\n    const controller=new AbortController();\n    let settled=false, timer;\n    function cleanup() { clearTimeout(timer); externalSignal?.removeEventListener('abort',abort); }\n    function finish(ok,value,shouldAbort=false) {\n      if (settled) return;\n      settled=true; cleanup();\n      if (ok) resolve(value); else reject(value);\n      if (shouldAbort) controller.abort(value);\n    }\n    function abort() { finish(false,externalSignal.reason,true); }\n    timer=setTimeout(()=>finish(false,Object.assign(new Error('Timed out'),{name:'TimeoutError'}),true),ms);\n    externalSignal?.addEventListener('abort',abort,{once:true});\n    Promise.resolve().then(()=>{\n      if (settled) return undefined;\n      return task(controller.signal);\n    }).then(value=>finish(true,value),error=>finish(false,error));\n  });\n}",
    "explanation": [
      "Promise.race 只能竞争结果，不自动释放 timer 或取消任务。参考 finish 集中持有 settled 守卫与 cleanup，使任何获胜路径都移除另一条路径的资源。",
      "超时首先把外层设为失败，然后 abort 内部。如果先 abort，一个合作任务可能立刻拒绝并抢先给出 AbortError，而合同要求 TimeoutError。外层原因与取消通知因此有明确先后。",
      "底层可能忽略 signal，仍继续计算甚至迟到失败。给它的 Promise 安装完整 then 双分支，迟到回调到达时 settled 守卫忽略提交，但错误已经被观察。本题保证外层等待结束，不保证底层 CPU 或网络操作真的停止。"
    ],
    "alternative": "race 加 finally 也能实现，但仍须处理取消转发、预取消与 timer 清理；仅一个 Promise.race 不满足资源合同。",
    "complexity": "调度与额外状态 O(1)，底层任务自身时间/空间另计。",
    "commonMistakes": [
      "只 race timer，不清理成功后残留 timer。",
      "abort 内部后才 reject 会让任务错误覆盖 TimeoutError。"
    ],
    "knowledgeIds": [
      "K02-05",
      "K02-02"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "console.log(await withTimeout(() => 7, 10));",
        "expectedOutput": "7",
        "explanation": "任务在微任务返回，成功分支清掉截止 timer。",
        "expectedLogs": [
          "7"
        ]
      },
      {
        "code": "const d=deferred(); const p=withTimeout(()=>d.promise,5); const caught=p.catch(e=>e.name); await flush(); await clock.tick(5); console.log(await caught);",
        "expectedOutput": "TimeoutError",
        "explanation": "底层一直未完成，外层按截止点结束，不依赖任务合作。",
        "expectedLogs": [
          "TimeoutError"
        ]
      },
      {
        "code": "const c=new AbortController(); c.abort(); try{await withTimeout(()=>1,5,c.signal)}catch(e){console.log(e.name)}",
        "expectedOutput": "AbortError",
        "explanation": "预取消先于工厂启动，既不计时也不调用任务。",
        "expectedLogs": [
          "AbortError"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E23-T01",
        "name": "先完成",
        "purpose": "成功释放 timer 和外部监听",
        "code": "let c=new AbortController(),removed=0,orig=c.signal.removeEventListener.bind(c.signal);c.signal.removeEventListener=(...a)=>{removed++;orig(...a)};equal(await withTimeout(()=>2,5,c.signal),2);equal(clock.size,0);equal(removed,1);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "先完成",
        "expectedOutcome": "成功释放 timer 和外部监听",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E23-T02",
        "name": "先超时",
        "purpose": "拒绝 TimeoutError 且内部取消",
        "code": "let signal,d=deferred(),p=withTimeout(s=>{signal=s;return d.promise},3),caught=p.catch(e=>e.name);await flush();await clock.tick(3);equal(await caught,\"TimeoutError\");assert(signal.aborted,\"internal abort\");d.resolve(1);await flush();",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "先超时",
        "expectedOutcome": "拒绝 TimeoutError 且内部取消",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E23-T03",
        "name": "预取消",
        "purpose": "工厂不启动",
        "code": "let c=new AbortController(),n=0;c.abort();await expectReject(withTimeout(()=>++n,3,c.signal),\"AbortError\");equal(n,0);equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "预取消",
        "expectedOutcome": "工厂不启动",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E23-T04",
        "name": "外部取消",
        "purpose": "原因身份透传且内部 abort",
        "code": "let c=new AbortController(),d=deferred(),signal,e=new Error(\"cancel\"),p=withTimeout(s=>{signal=s;return d.promise},3,c.signal),caught=p.catch(x=>x);await flush();c.abort(e);assert(await caught===e&&signal.aborted,\"external cancellation\");equal(clock.size,0);d.resolve(1);await flush();",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "外部取消",
        "expectedOutcome": "原因身份透传且内部 abort",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E23-T05",
        "name": "迟到拒绝",
        "purpose": "超时后仍处理拒绝",
        "code": "let d=deferred(),p=withTimeout(()=>d.promise,1),caught=p.catch(e=>e.name);await flush();await clock.tick(1);equal(await caught,\"TimeoutError\");d.reject(new Error(\"late\"));await flush();",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "迟到拒绝",
        "expectedOutcome": "超时后仍处理拒绝",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E23-T06",
        "name": "同步异常",
        "purpose": "错误身份透传且资源释放",
        "code": "let e=new TypeError(\"x\");await expectReject(withTimeout(()=>{throw e},3),\"TypeError\",e);equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "同步异常",
        "expectedOutcome": "错误身份透传且资源释放",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E23-T07",
        "name": "零超时正常值",
        "purpose": "微任务工厂先于下一 timer 完成",
        "code": "equal(await withTimeout(()=>4,0),4);equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "零超时正常值",
        "expectedOutcome": "微任务工厂先于下一 timer 完成",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E23-T08",
        "name": "校验",
        "purpose": "无效输入拒绝不启动",
        "code": "await expectReject(withTimeout(null,1),\"TypeError\");await expectReject(withTimeout(()=>1,-1),\"RangeError\");await expectReject(withTimeout(()=>1,1,{}),\"TypeError\");equal(clock.size,0);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "校验",
        "expectedOutcome": "无效输入拒绝不启动",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E23-T09",
        "name": "取消竞争",
        "purpose": "工厂因 abort 拒绝不能覆盖超时原因",
        "code": "let p=withTimeout(s=>new Promise((_,reject)=>s.addEventListener(\"abort\",()=>reject(new Error(\"task abort\")))),2),caught=p.catch(e=>e.name);await flush();await clock.tick(2);equal(await caught,\"TimeoutError\");",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "取消竞争",
        "expectedOutcome": "工厂因 abort 拒绝不能覆盖超时原因",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "超时不通知任务",
        "code": "function withTimeout(task, ms, externalSignal) {\n  return new Promise((resolve,reject)=>{\n    if (typeof task!=='function' || (externalSignal!==undefined && !(externalSignal instanceof AbortSignal))) throw new TypeError('Invalid task or signal');\n    if (!Number.isInteger(ms) || ms<0 || ms>2147483647) throw new RangeError('Invalid milliseconds');\n    if (externalSignal?.aborted) { reject(externalSignal.reason); return; }\n    const controller=new AbortController();\n    let settled=false, timer;\n    function cleanup() { clearTimeout(timer); externalSignal?.removeEventListener('abort',abort); }\n    function finish(ok,value,shouldAbort=false) {\n      if (settled) return;\n      settled=true; cleanup();\n      if (ok) resolve(value); else reject(value);\n      /* forget abort */\n    }\n    function abort() { finish(false,externalSignal.reason,true); }\n    timer=setTimeout(()=>finish(false,Object.assign(new Error('Timed out'),{name:'TimeoutError'}),true),ms);\n    externalSignal?.addEventListener('abort',abort,{once:true});\n    Promise.resolve().then(()=>{\n      if (settled) return undefined;\n      return task(controller.signal);\n    }).then(value=>finish(true,value),error=>finish(false,error));\n  });\n}"
      },
      {
        "name": "预取消仍启动",
        "code": "function withTimeout(task, ms, externalSignal) {\n  return new Promise((resolve,reject)=>{\n    if (typeof task!=='function' || (externalSignal!==undefined && !(externalSignal instanceof AbortSignal))) throw new TypeError('Invalid task or signal');\n    if (!Number.isInteger(ms) || ms<0 || ms>2147483647) throw new RangeError('Invalid milliseconds');\n    /* skip pre-abort check */\n    const controller=new AbortController();\n    let settled=false, timer;\n    function cleanup() { clearTimeout(timer); externalSignal?.removeEventListener('abort',abort); }\n    function finish(ok,value,shouldAbort=false) {\n      if (settled) return;\n      settled=true; cleanup();\n      if (ok) resolve(value); else reject(value);\n      if (shouldAbort) controller.abort(value);\n    }\n    function abort() { finish(false,externalSignal.reason,true); }\n    timer=setTimeout(()=>finish(false,Object.assign(new Error('Timed out'),{name:'TimeoutError'}),true),ms);\n    externalSignal?.addEventListener('abort',abort,{once:true});\n    Promise.resolve().then(()=>{\n      if (settled) return undefined;\n      return task(controller.signal);\n    }).then(value=>finish(true,value),error=>finish(false,error));\n  });\n}"
      }
    ]
  },
  {
    "id": "E24",
    "slug": "serial-queue",
    "title": "异步串行队列",
    "summary": "多个操作依赖前一项结束，但任务会动态加入，且失败不能把整条链变成永久拒绝。实现串行队列，每次 enqueue 返回属于该项的结果，队列空闲后可再次启动。",
    "runtime": "JavaScript ES2022 · 纯逻辑隔离环境；计时器与 AbortController 由受控 harness 提供",
    "estimatedMinutes": 35,
    "revision": 1,
    "updatedAt": "2026-10-08",
    "verifiedAt": "2026-10-08",
    "entryContract": "createQueue() → {enqueue}；enqueue(task) 返回每项独立 Promise，task 无参数、无 this，在轮到时调用。始终只有一个任务在途，单项同步/异步失败不阻断后续；非函数任务返回拒绝 TypeError。",
    "problem": [
      "多个操作依赖前一项结束，但任务会动态加入，且失败不能把整条链变成永久拒绝。实现串行队列，每次 enqueue 返回属于该项的结果，队列空闲后可再次启动。",
      "入队不立即同步调用工厂，而在微任务开始。队列保证执行顺序，不强制撤销失败项副作用；任务若等待排在自己后面的项会自依赖，不在支持范围。不修改任务，不支持 this 或取消。"
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
    "starterArtifact": "function createQueue() {\n  // TODO 返回 enqueue(task)，每项有独立结果。\n  throw new Error(\"未实现\");\n}",
    "hints": [
      "维护一个只表示前序完成的 tail。",
      "返回该项 result，同时另建成功/失败都恢复的内部 tail。",
      "不要把恢复后的 tail 返回给调用者，否则会丢掉该项错误。"
    ],
    "referenceArtifact": "function createQueue() {\n  let tail=Promise.resolve();\n  return {\n    enqueue(task) {\n      if (typeof task!=='function') return Promise.reject(new TypeError('Invalid task'));\n      const result=tail.then(()=>task());\n      tail=result.then(()=>undefined,()=>undefined);\n      return result;\n    }\n  };\n}",
    "explanation": [
      "tail 描述之前所有项已经结束的时机。result=tail.then(task) 让新工厂等前序完成才启动；Promise 同化 task 的返回值，故同步值、Promise 和 thenable 都占据同一串行阶段。",
      "result 是调用方证据，必须保留其成功值或失败。内部 tail 的双分支把两种结算都转成 undefined，保证后项可以继续。把 result.catch(()=>{}) 返回出去虽然恢复了队列，却把失败伪装成成功。",
      "动态 enqueue 只是不断接长尾链，不需要遍历任务数组。任务内可以入队，但不能 await 排在自己之后的任务，否则后项等待当前项、当前项等待后项形成死锁。取消和队列容量限制需要另外建模。"
    ],
    "alternative": "显式数组与 drain 状态机可以提供待执行数、暂停和取消，但要仔细处理空闲重启；纯尾链适合本题最小合同。",
    "complexity": "每次 enqueue 调度 O(1)，未结算链空间 O(n)，n 为排队项数。执行耗时累加，不以 CPU 毫秒测试复杂度。",
    "commonMistakes": [
      "把 tail=result 会让一次拒绝阻断所有后项。",
      "立即调用 task 再入链并没有实现串行。"
    ],
    "knowledgeIds": [
      "K02-02",
      "K02-04",
      "K16-02"
    ],
    "timeoutMs": 2000,
    "examples": [
      {
        "code": "const q=createQueue(); const a=q.enqueue(()=>1),b=q.enqueue(()=>2); console.log(await a,await b);",
        "expectedOutput": "1 2",
        "explanation": "第二项链接到第一项的已恢复尾链，先后运行且各自返回结果。",
        "expectedLogs": [
          "1 2"
        ]
      },
      {
        "code": "const q=createQueue(); const a=q.enqueue(()=>{throw new Error(\"失败\")}); const b=q.enqueue(()=>3); await a.catch(()=>{}); console.log(await b);",
        "expectedOutput": "3",
        "explanation": "内部 tail 吸收失败供调度使用，外部 a 仍拒绝。",
        "expectedLogs": [
          "3"
        ]
      },
      {
        "code": "const q=createQueue(); console.log(await q.enqueue(()=>1)); console.log(await q.enqueue(()=>2));",
        "expectedOutput": "1、2",
        "explanation": "尾链结算后仍可继续追加，无需单独重启状态机。",
        "expectedLogs": [
          "1",
          "2"
        ]
      }
    ],
    "testCases": [
      {
        "id": "E24-T01",
        "name": "严格串行",
        "purpose": "前项未完成不启动下一项",
        "code": "let q=createQueue(),a=deferred(),out=[],p=q.enqueue(()=>{out.push(1);return a.promise}),r=q.enqueue(()=>{out.push(2);return 2});await flush();equal(out,[1]);a.resolve(1);equal(await p,1);equal(await r,2);equal(out,[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "严格串行",
        "expectedOutcome": "前项未完成不启动下一项",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E24-T02",
        "name": "独立 Promise",
        "purpose": "项结果身份独立",
        "code": "let q=createQueue(),p=q.enqueue(()=>1),r=q.enqueue(()=>2);assert(p!==r,\"independent promise\");equal(await p,1);equal(await r,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "独立 Promise",
        "expectedOutcome": "项结果身份独立",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E24-T03",
        "name": "同步失败恢复",
        "purpose": "后一项不被拒绝链阻断",
        "code": "let q=createQueue(),p=q.enqueue(()=>{throw new TypeError(\"x\")}),r=q.enqueue(()=>2);await expectReject(p,\"TypeError\");equal(await r,2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "同步失败恢复",
        "expectedOutcome": "后一项不被拒绝链阻断",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E24-T04",
        "name": "异步失败恢复",
        "purpose": "reject 后继续",
        "code": "let q=createQueue(),p=q.enqueue(()=>Promise.reject(new Error(\"x\"))),r=q.enqueue(()=>3);await expectReject(p,\"Error\");equal(await r,3);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "异步失败恢复",
        "expectedOutcome": "reject 后继续",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E24-T05",
        "name": "动态入队",
        "purpose": "执行中加入仍排到末尾",
        "code": "let q=createQueue(),d=deferred(),out=[],p=q.enqueue(()=>{out.push(1);return d.promise});await flush();let r=q.enqueue(()=>{out.push(2);return 2});equal(out,[1]);d.resolve(1);await p;await r;equal(out,[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "动态入队",
        "expectedOutcome": "执行中加入仍排到末尾",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E24-T06",
        "name": "空闲重启",
        "purpose": "全部结束后可继续",
        "code": "let q=createQueue();equal(await q.enqueue(()=>1),1);await flush();equal(await q.enqueue(()=>2),2);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "空闲重启",
        "expectedOutcome": "全部结束后可继续",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E24-T07",
        "name": "输入校验",
        "purpose": "非法项不破坏队列",
        "code": "let q=createQueue();await expectReject(q.enqueue(null),\"TypeError\");equal(await q.enqueue(()=>4),4);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "输入校验",
        "expectedOutcome": "非法项不破坏队列",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      },
      {
        "id": "E24-T08",
        "name": "微任务与顺序",
        "purpose": "工厂不在 enqueue 内同步调用",
        "code": "let q=createQueue(),out=[],p=q.enqueue(()=>out.push(1));equal(out,[]);let r=q.enqueue(()=>out.push(2));await Promise.all([p,r]);equal(out,[1,2]);",
        "setup": "在独立 JavaScript 上下文中加载参考入口；异步任务由 deferred() 控制，时间由 clock 控制。",
        "input": "微任务与顺序",
        "expectedOutcome": "工厂不在 enqueue 内同步调用",
        "cleanup": "每例使用独立上下文；结束时废弃全部计时器与监听器。"
      }
    ],
    "wrongImplementations": [
      {
        "name": "拒绝阻断后序",
        "code": "function createQueue() {\n  let tail=Promise.resolve();\n  return {\n    enqueue(task) {\n      if (typeof task!=='function') return Promise.reject(new TypeError('Invalid task'));\n      const result=tail.then(()=>task());\n      tail=result;\n      return result;\n    }\n  };\n}"
      },
      {
        "name": "提前启动工厂",
        "code": "function createQueue() {\n  let tail=Promise.resolve();\n  return {\n    enqueue(task) {\n      if (typeof task!=='function') return Promise.reject(new TypeError('Invalid task'));\n      const started=task(); const result=tail.then(()=>started);\n      tail=result.then(()=>undefined,()=>undefined);\n      return result;\n    }\n  };\n}"
      }
    ]
  }
] as const satisfies readonly Exercise[];
