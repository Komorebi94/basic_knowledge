import type { Article } from './types'
import { createReviewBody } from './review-body'

export const foundationArticles: Article[] = [
    {
        slug: 'types-and-coercion',
        module: 'javascript',
        title: '数据类型、类型判断与隐式转换',
        summary: '从值的存储与转换规则解释 typeof、instanceof、== 和浮点数问题。',
        depth: 'intro',
        heat: 5,
        year: 2026,
        tags: ['类型', '类型转换', '相等判断'],
        overview:
            'JavaScript 的基础不是背八种类型，而是能预测表达式结果，说明判断方式的边界，并在业务代码里避免隐式转换。',
        body: createReviewBody(
            `## 值怎么存

原始类型（undefined、null、boolean、number、bigint、string、symbol）按值复制；对象按引用复制。\`const a = { n: 1 }; const b = a; b.n = 2\` 之后 \`a.n\` 也是 2，因为两者指向同一对象。比较对象用 \`===\` 比的是引用，不是内容。

## typeof 与 instanceof

\`typeof\` 对函数返回 \`"function"\`，对 \`null\` 错误地返回 \`"object"\`，对数组也返回 \`"object"\`。因此它只能做粗分，不能当类型系统。

\`instanceof\` 沿对象的原型链查找 \`Ctor.prototype\`。跨 iframe 的数组会失败，因为两边的 \`Array\` 不是同一个构造函数；被改过原型的对象也会给出误导结果。判断数组用 \`Array.isArray\`，判断未知输入先当 \`unknown\` 再显式校验。

\`Object.is\` 补上 \`===\` 的两处例外：\`NaN\` 与自身相等，\`+0\` 与 \`-0\` 不相等。React 用它判断 state 是否变化。

## 隐式转换

\`==\` 会先做类型转换再比较。对象走 ToPrimitive：先 \`valueOf\`，再 \`toString\`（Date 相反）。\`[] == ![]\` 不要背结论，按步骤讲：

1. \`!\` 先算右边：对象是真值，\`![]\` 为 \`false\`，变成 \`[] == false\`
2. 一边是对象、一边是布尔，两边都 ToNumber
3. 空数组 \`ToPrimitive\` 得到 \`""\`，\`Number("")\` 为 \`0\`
4. \`Number(false)\` 为 \`0\`，所以 \`0 == 0\`

能把这四步说完，比报 true 有用。生产代码默认 \`===\`。

ToBoolean 里只有 \`false\`、\`0\`、\`-0\`、\`0n\`、\`""\`、\`null\`、\`undefined\`、\`NaN\` 为假。空数组和空对象都是真值，所以 \`if ([])\` 成立。

生产代码默认 \`===\`。需要同时排除 \`null\` 和 \`undefined\` 时用 \`== null\`，并写清楚意图。

## 浮点数

\`0.1 + 0.2 !== 0.3\` 来自 IEEE 754 二进制无法精确表示十分之一。金额用整数最小单位（分）或十进制定点库，比较用误差范围或整数，不要直接全等。`,
            `类型题先分清原始值按值复制、对象按引用比较。typeof 只能粗分，且 typeof null 是 object；数组用 Array.isArray，跨 realm 不要依赖 instanceof。相等默认用严格相等；讲 == 时按 ToPrimitive、ToNumber、ToBoolean 逐步推导，不要只报结论。Object.is 能区分 NaN 和正负零。金额不用浮点直接比较。`,
            [
                {
                    question: '为什么 typeof null 是 object？',
                    direction:
                        '历史实现把 null 标成对象类型标签，语言保留了这个结果，不能据此判断空对象。',
                },
                {
                    question: '[] == false 为什么为 true？',
                    direction: '双方都会转成数字，空数组 ToNumber 为 0，false 为 0。',
                },
                {
                    question: '怎样判断普通对象？',
                    direction:
                        '先排除 null，再确认 typeof 为 object，并且不是数组；更稳的做法是用业务 schema 校验。',
                },
                {
                    question: 'JSON.stringify 比较对象有什么问题？',
                    direction: '键顺序、undefined、函数、Symbol、循环引用和 Date 都会失真。',
                },
                {
                    question: 'Object.is 和 === 差在哪里？',
                    direction: 'Object.is(NaN, NaN) 为 true，Object.is(+0, -0) 为 false。',
                },
            ],
        ),
        pitfalls: [
            '把 typeof 当成万能类型判断，无法区分 null、数组和普通对象。',
            '用 JSON.stringify 比较对象，忽略键顺序和不可序列化值。',
            '用浮点数直接做金额全等比较。',
        ],
    },
    {
        slug: 'scope-closure-this',
        module: 'javascript',
        title: '执行上下文、作用域、闭包与 this',
        summary: '把变量查找、函数记忆外层环境和调用方式串成一套心智模型。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['闭包', '作用域', 'this'],
        overview:
            '作用域决定变量去哪里找，闭包让函数保留创建时的词法环境，this 则主要由调用方式决定。三者经常被组合考察。',
        body: createReviewBody(
            `## 作用域

JavaScript 使用词法作用域：变量往哪里找，在函数写成什么样时就定了，不取决于它在哪里被调用。引擎进入一个作用域时创建词法环境，变量和函数声明先完成初始化；\`let\` / \`const\` 在初始化前处于暂时性死区，提前访问会抛错。

查找沿着作用域链向外，直到全局。模块有自己的作用域，\`var\` 函数作用域和 \`let\` 块级作用域不要混着讲。

## 闭包

函数会记住创建时的词法环境。只要外部还拿着这个函数，它引用的外层变量就不能回收。模块私有状态、事件回调、防抖节流、柯里化都靠这个。

\`var\` 在循环里只有一个绑定，异步回调看到的是最终值；\`let\` 每轮一个绑定。React 事件处理函数关闭的是那一次渲染的 state 快照，所以会读到旧值——这是闭包，不是 bug。用函数式更新或把最新值放进 ref。

闭包不等于泄漏。泄漏发生在“已经没用的数据仍被活着的函数引用”，例如未移除的监听、无限增长的缓存、把整棵大对象关进长生命周期回调。

## this

普通函数的 this 看调用方式，按优先级：

1. \`new Fn()\`：this 是新实例
2. \`fn.call/apply/bind(object)\`：显式绑定（\`bind\` 再 \`bind\` 以第一次为准）
3. \`object.fn()\`：this 是调用者
4. 默认绑定：严格模式是 \`undefined\`，非严格是全局对象

\`const fn = object.method; fn()\` 丢 this，因为调用时没有接收者。回调传给 \`setTimeout\` 或 \`map\` 同理。

箭头函数没有自己的 this、arguments、new.target，向外层词法环境读。它不能 \`new\`，\`bind\` 也改不了它的 this。class 字段里的箭头方法能固定实例，但每个实例一份函数，不能放在原型上共享。`,
            `作用域是词法的，函数在哪里写就决定变量往哪找。闭包是函数带着创建时的环境离开；它让私有状态和回调成立，只有无用引用长期存活才叫泄漏。循环拿最后值和 React 读到旧 state，都是同一套“关闭了哪一次绑定”。this 对普通函数看调用方式，优先级是 new、显式绑定、对象调用、默认绑定；箭头函数没有自己的 this。回答时画出函数在哪创建、在哪调用、哪些引用还活着。`,
            [
                {
                    question: 'for 里 setTimeout 为什么总拿到最后的 i？',
                    direction:
                        'var 只有一个绑定，回调运行时循环已结束；改用 let 或在每轮保存当前值。',
                },
                {
                    question: 'React 里怎样读到最新 state？',
                    direction:
                        '用 setState 的函数式更新，或把最新值写入 ref，不要指望旧闭包自动刷新。',
                },
                {
                    question: 'bind 之后再 bind 会怎样？',
                    direction: '以第一次 bind 的 this 为准，后续 bind 只能预设更多参数。',
                },
                {
                    question: '为什么 class 方法传给按钮会丢 this？',
                    direction:
                        '取出的是普通函数，调用时没有接收者；在构造里 bind，或写成箭头字段。',
                },
                {
                    question: '闭包什么时候该拆掉？',
                    direction:
                        '监听、订阅、定时器结束时释放对大对象的引用，避免组件卸载后环境还活着。',
                },
            ],
        ),
        pitfalls: [
            '把 this 说成指向定义函数的对象；普通函数主要看调用方式。',
            '认为闭包一定造成内存泄漏；只有无用引用长期存活才是泄漏。',
            '用 bind 修补所有回调，掩盖不清晰的函数所有权。',
        ],
    },
    {
        slug: 'prototype-new-class',
        module: 'javascript',
        title: '原型链、new 与 class',
        summary: '理解对象如何共享方法、属性如何查找，以及 class 背后的原型机制。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['原型链', 'new', 'class'],
        overview:
            '对象读取属性时沿原型链向上查找。构造调用负责创建对象、连接原型、绑定 this，并按返回值规则决定最终结果。',
        body: createReviewBody(
            `## 两套指针

函数作为构造器时，\`Fn.prototype\` 是给实例共享的对象，上面通常有 \`constructor\` 指回 \`Fn\`。每个对象还有内部原型 \`[[Prototype]]\`（\`__proto__\` 是历史暴露），读取属性时沿这条链向上找，直到 \`null\`。

\`instance.__proto__ === Ctor.prototype\`。\`prototype\` 是函数上的属性，\`[[Prototype]]\` 是对象的委托目标，不要说成同一个东西。方法放在原型上，实例只存各自的数据。

\`Object.create(proto)\` 直接指定内部原型。\`Object.getPrototypeOf\` / \`Object.setPrototypeOf\` 是标准读写方式；运行时改原型影响性能，生产里少用。

## new

\`new Ctor(args)\` 的步骤：

1. 创建普通对象
2. 把对象的 \`[[Prototype]]\` 连到 \`Ctor.prototype\`
3. 以该对象为 this 执行 \`Ctor\`
4. 若构造函数返回对象（含函数），用返回值；返回原始值则忽略，仍用新对象

所以 \`function C() { return { x: 1 } }\` 的 \`new C()\` 不是 \`C\` 的实例。手写 \`new\` 必须覆盖这第四步。

## 继承与 class

寄生组合继承是 ES5 里较完整的方案：子类原型用 \`Object.create(Parent.prototype)\`，再修回 \`constructor\`，构造函数里 \`Parent.call(this, ...)\`。这样能继承实例属性和原型方法，又不会多一次无用的父类实例副作用。

\`class\` 是这套机制的严格语法：方法在原型上，\`extends\` 同时连接实例原型和 \`Child.__proto__ === Parent\`（静态继承）。\`super\` 在构造里必须先调用，才能用 this。class 不能当普通函数调用，原型上的方法不可枚举。

\`instanceof\` 查的是原型链上有没有 \`Ctor.prototype\`，因此能被 \`Symbol.hasInstance\` 或改原型影响，跨 iframe 同样不可靠。`,
            `对象读属性沿 [[Prototype]] 向上委托；函数的 prototype 是拿来给实例当原型的那张共享表，两者不是同一个属性。new 会创建对象、连原型、绑定 this，构造函数若返回对象则以返回值为准。class 仍是原型，extends 同时接实例链和静态链。继承优先讲寄生组合或 class，不要只背一句“子类原型等于父类实例”。`,
            [
                {
                    question: 'prototype 和 __proto__ 怎么区分？',
                    direction:
                        '前者是函数上的共享模板，后者（以及 [[Prototype]]）是对象实际委托的那条链。',
                },
                {
                    question: '构造函数 return 1 和 return {} 有什么差别？',
                    direction: '原始值被忽略，仍返回新实例；返回对象则整个替换 new 的结果。',
                },
                {
                    question: '为什么不推荐 new Parent() 当子类原型？',
                    direction:
                        '会执行父类构造并带上实例字段，还可能产生副作用；Object.create 只连原型。',
                },
                {
                    question: 'class 字段和原型方法差在哪？',
                    direction: '实例字段在每个对象上各有一份；原型方法共享同一函数。',
                },
                {
                    question: 'instanceof 为什么会在 iframe 里失败？',
                    direction: '两边的 Array 等构造函数不是同一个对象，原型链对不上。',
                },
            ],
        ),
        pitfalls: [
            '把 prototype 和对象内部原型当成同一个属性。',
            '漏掉构造函数显式返回对象时会替换实例。',
            '修改内置对象原型，给整个运行环境制造冲突。',
        ],
    },
    {
        slug: 'promise-async-control',
        module: 'javascript',
        title: 'Promise、async/await 与异步控制',
        summary: '掌握状态传递、异常传播、并发执行、取消和竞态，而不只是 API 用法。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['Promise', 'async/await', '并发'],
        overview:
            'Promise 表达一次未来结果，async/await 改善控制流可读性。重点是执行顺序、错误处理和多个任务如何协调。',
        body: createReviewBody(
            `## 状态与链式

Promise 只能从 pending 变成 fulfilled 或 rejected，之后不变。\`then\` / \`catch\` / \`finally\` 都返回新 Promise。回调返回普通值会兑现下一个，抛错或返回已拒绝的 Promise 会拒绝下一个，返回 thenable 则采用它的状态。

\`fn().then(ok).catch(err)\` 能接到 \`ok\` 里的抛错；\`fn().then(ok, err)\` 不能。\`catch\` 之后如果返回普通值，链会恢复为成功，调用方会当成已处理。

## async/await 与微任务

\`async\` 函数一定返回 Promise。\`await\` 把后续代码排进微任务，即使右边是普通值。它不阻塞线程，只暂停当前 async 函数。同步代码、本轮微任务、下一个任务的顺序仍由事件循环决定。

## 组合

- \`all\`：全部成功才成功，结果按输入位置；一个失败立刻拒绝，其它任务不会自动停
- \`allSettled\`：等全部结束，得到 \`status + value/reason\`
- \`race\`：第一个敲定的决定结果，常用来做超时，但超时不会取消原任务
- \`any\`：第一个成功即成功；全部失败才拒绝

\`map(async ...)\` 得到的是 Promise 数组，必须再 \`all\` 或 \`allSettled\`。循环里逐个 \`await\` 是串行。限流要让任务以函数形式排队，用固定数量 worker 领取，而不是先把全部请求发出去。

## 取消与竞态

Promise 不能取消已经开始的工作。\`AbortSignal\` 要传到 \`fetch\` 或底层 API。搜索和切页既要 abort，也要用序号或忽略过期结果，防止慢请求后到写状态。重试只针对暂时性错误，并带退避；取消错误不要展示成失败。`,
            `Promise 表示一次未来结果，状态只能落地一次。then 返回新 Promise，返回值、抛错和 thenable 决定下一环。await 只暂停当前 async 函数，后续进微任务。多个任务要先分清 all、allSettled、race、any 和串行 await；限流必须延迟创建任务。Promise 本身不取消工作，网络要传 AbortSignal，并且用版本号避免旧结果覆盖新 UI。`,
            [
                {
                    question: 'then 的第二个参数和 catch 差在哪？',
                    direction: '前者接不住 onFulfilled 里的抛错，后者能接到前面整段的拒绝。',
                },
                {
                    question: '为什么 for 里 await 是串行？',
                    direction: '每次 await 都等当前任务结束才进入下一轮，没有同时启动。',
                },
                {
                    question: 'Promise.race 做超时有什么漏洞？',
                    direction: '先落地的那边决定结果，但慢请求仍在跑，还可能稍后误写状态。',
                },
                {
                    question: 'catch 之后为什么调用方还以为成功？',
                    direction: 'catch 返回普通值会把链恢复成 fulfilled，需要再 throw 或返回拒绝。',
                },
                {
                    question: '怎样限制 3 个并发？',
                    direction:
                        '任务用函数表示，维护最多 3 个 worker 领取下一个，而不是 Promise.all 全量启动。',
                },
            ],
        ),
        pitfalls: [
            '在 map 的 async 回调后忘记 Promise.all，得到 Promise 数组。',
            'catch 后不重新抛出，调用方误判为成功。',
            '只取消前端状态更新，却让底层请求继续消耗资源。',
        ],
    },
    {
        slug: 'http-tcp-tls',
        module: 'browser',
        title: 'TCP、TLS 与 HTTP 请求链路',
        summary: '解释可靠连接、HTTPS 握手、协议复用以及一次请求为什么慢。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['TCP', 'TLS', 'HTTP'],
        overview:
            '网络题应从分层回答：DNS 找地址，传输层建立可靠通道，TLS 建立身份和加密，HTTP 传递应用消息。',
        body: createReviewBody(
            `## 延迟要拆开看

打开 \`https://api.example.com/users\` 的总耗时不是一个数字。应拆成 DNS、TCP、TLS、服务器等待（TTFB）、下载。CDN、多地址、Happy Eyeballs（同时试 IPv6/IPv4）都会影响“连上谁”。缓存命中时后面几步可能根本没有。

## TCP 三次握手在确认什么

1. 客户端 SYN：我要连，这是我的初始序列号
2. 服务端 SYN-ACK：我收到了，这是我的初始序列号
3. 客户端 ACK：我也收到了

三次之后双方都确认“我能发、你能收”。TCP 提供可靠有序字节流：序列号、确认、重传、校验。流量控制怕撑死接收方，拥塞控制怕撑死网络。它是全双工，关闭通常两个方向分别说再见。

只背“三次握手、四次挥手”却说不清每步确认了什么，面试会往下追。

## TLS 在 TCP 之上

目标是认证、机密性、完整性。客户端校验证书链、域名和有效期，再协商出会话密钥。非对称运算贵，只适合握手；后续大流量用对称加密。TLS 1.3 把握手轮次压得更短，还可以和 TCP 恢复会话叠在一起。

HTTPS 不证明这个网站业务可信，只证明你连到了证书对应的那个端点，路上不容易被窃听或篡改。它防不了 XSS。

## HTTP/1.1、2、3

HTTP/1.1 能复用连接，但一条连接上并发弱，浏览器常开 6 条左右。HTTP/2 把消息切成带流 ID 的帧，一条 TCP 上多路复用并压头部；**TCP 丢一个包，后面的字节都得等**，所以仍有队头阻塞。HTTP/3 走 QUIC：加密和多路流在用户态，单流丢包通常不堵死其它流，连接用 Connection ID，换 Wi-Fi 也不一定重来。

协议再新，也消不掉慢接口、大包和主线程长任务。先看瀑布图卡在哪一段。`,
            `一次 HTTPS 请求可以分层说明：DNS 把域名解析为地址；TCP 通过握手、序列号、确认、重传和控制算法提供可靠字节流；TLS 校验证书并协商会话密钥，保证传输机密性和完整性；HTTP 再在其上传递应用消息。HTTP/2 在单条 TCP 连接上多路复用，但仍受 TCP 丢包影响；HTTP/3 基于 QUIC，让不同流的丢包恢复更独立，并改善连接迁移。请求慢必须按各阶段测量。`,
            [
                {
                    question: 'TCP 为什么需要三次握手？',
                    direction: '双方都要确认自己的发送与接收可达，并交换和确认初始序列号。',
                },
                {
                    question: 'TLS 为什么不一直使用非对称加密？',
                    direction:
                        '非对称运算成本更高，适合认证和协商；大流量传输使用对称密钥效率更好。',
                },
                {
                    question: 'HTTP/2 为什么仍有队头阻塞？',
                    direction: '所有流共享一条 TCP 字节流，一个丢失的数据包会阻止后续字节交付。',
                },
                {
                    question: 'QUIC 为什么适合网络切换？',
                    direction: '它用连接 ID 标识会话，不完全绑定原来的 IP 与端口组合。',
                },
                {
                    question: 'HTTPS 能否阻止 XSS？',
                    direction: '不能，HTTPS 保护传输；页面自身执行不可信脚本属于应用内容安全问题。',
                },
            ],
        ),
        pitfalls: [
            '把 HTTPS 简化成给 HTTP 加一层对称加密。',
            '认为 HTTP/2 完全没有队头阻塞；TCP 丢包仍会影响连接中的流。',
            '背握手次数却解释不出每一步确认了什么。',
        ],
    },
    {
        slug: 'web-performance-memory',
        module: 'browser',
        title: 'Web 性能指标、长任务与内存泄漏',
        summary: '从加载、交互、视觉稳定和资源生命周期定位性能问题。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['性能', 'Core Web Vitals', '内存'],
        overview:
            '性能优化不是罗列技巧。先用指标和性能面板找到瓶颈，再区分网络、主线程、渲染、内存和框架更新。',
        body: createReviewBody(
            `## 先用指标定位，再动手

当前看三类 Core Web Vitals：

- **LCP**：最大那块内容何时画出来。常见是 Hero 图、大标题。慢可能是图片发现晚（没 preload、在 CSS 里）、服务器 TTFB 高，或下载完主线程没空画
- **INP**：从输入到下一帧有反馈。拆成输入排队、事件处理、渲染。点击后 200ms 的同步计算就会顶上去
- **CLS**：生命周期里意外位移。晚到的图没宽高、广告把正文顶下去，都是典型来源

实验室（Lighthouse、本机 Performance）好复现；RUM 才是真实设备和弱网。看 P75，不要只看平均值。事件要带版本、路由、设备。

## 优化顺着瓶颈走

网络：TTFB、压缩、CDN、缓存、优先级、拆包。  
主线程：长任务（连续 ≥50ms）、大 JSON、同步布局。  
渲染：图层和绘制面积。

长任务要减少、切成块并让出主线程，或丢到 Worker。切成一堆微任务往往没用：微任务会在渲染前被清空。

INP 差时先看是哪个点击处理太长，而不是先加 memo。LCP 差时先看是资源晚到还是主线程堵着。

## 内存：先证明是泄漏

监听、定时器、订阅、闭包、脱离 DOM 的节点、无限 Map 缓存是常客。曲线往上不等于泄漏：GC 有延迟，LRU 缓存涨到上限也正常。

做法：重复“打开页 → 操作 → 回到列表”若干次，强制 GC，对比堆快照。真正泄漏的对象数量随次数涨，并且能沿 retaining path 找到还活着的监听或闭包。组件卸载后定时器还在打 \`setState\`，既是泄漏也是逻辑 bug。`,
            `Web 性能应先用指标定位体验问题：LCP 看主要内容加载，INP 看交互到下一帧反馈，CLS 看意外位移。再结合网络瀑布、Performance 和 React/Vue 工具区分网络、主线程、渲染与框架更新。长任务要减少、分片或移到 Worker。内存上涨不一定是泄漏，应该重复操作、回到基线并比较堆快照和保留路径，确认本应释放的对象仍被谁引用。`,
            [
                {
                    question: '实验室数据与真实用户数据有什么区别？',
                    direction: '前者环境可控、适合诊断，后者反映真实设备和网络分布，两者需要结合。',
                },
                {
                    question: 'LCP 资源下载很快为什么指标仍慢？',
                    direction: '资源可能发现得晚，或下载后主线程被占用，直到较晚才完成布局与绘制。',
                },
                {
                    question: 'INP 由哪些部分组成？',
                    direction: '输入等待、事件处理执行以及浏览器呈现下一帧的时间都会贡献延迟。',
                },
                {
                    question: '为什么内存曲线上升不等于泄漏？',
                    direction:
                        '垃圾回收不会立即发生，缓存也可能有上限地增长；关键是对象是否能在合适时机释放。',
                },
                {
                    question: '如何寻找泄漏根因？',
                    direction: '用多次堆快照看持续增长对象，再沿 retaining path 找到未释放引用。',
                },
            ],
        ),
        pitfalls: [
            '没有测量就开始拆包或加 memo。',
            '只优化首次加载，忽略交互阶段的长任务。',
            '把浏览器正常缓存和延迟回收误判成内存泄漏。',
        ],
    },
    {
        slug: 'box-cascade-bfc',
        module: 'css',
        title: '盒模型、层叠优先级与 BFC',
        summary: '掌握尺寸如何计算、样式如何胜出，以及块级布局上下文解决什么问题。',
        depth: 'intro',
        heat: 5,
        year: 2026,
        tags: ['盒模型', '优先级', 'BFC'],
        overview:
            '这三部分是 CSS 的基础：盒模型解释尺寸，层叠解释最终样式，格式化上下文解释元素之间如何参与布局。',
        body: createReviewBody(
            `## 盒模型

\`box-sizing: content-box\`（默认）时，\`width\` / \`height\` 只含内容区；padding 和 border 往外加，元素占位是 \`width + padding + border\`。\`border-box\` 把 padding 和 border 算进声明尺寸，内容区被挤小。组件库和全局重置几乎都用 border-box，因为栏宽更好算。

占位还要看 margin 和滚动条。包含块决定百分比宽度的参照：普通块是最近的块级祖先内容区，绝对定位看最近的定位祖先。先问“相对谁算”，再算数字。

## 层叠

最终样式不是只比选择器长短。比较顺序大致是：

1. 来源与重要性：用户 \`!important\` > 作者 \`!important\` > 作者普通 > 用户普通 > UA
2. 层（\`@layer\`）：后声明的层压过先声明的层；未分层样式默认高于所有层
3. 选择器优先级：行内样式 / ID / class·属性·伪类 / 元素·伪元素
4. 出现顺序：同优先级后者赢

\`0,1,0,0\` 这种计数只是记忆法，比较时按位比，不会进位。\`!important\` 和超长选择器都是层叠没设计好的症状。覆盖第三方时优先分层，而不是互相比权重。

## BFC

BFC（块级格式化上下文）是一块独立的块布局范围。内部盒子按块方向排列，和外面的浮动、外边距隔开。它能：

- 包住内部浮动，避免父级高度塌陷
- 阻止外部浮动伸进来（文字环绕被切断）
- 切断相邻块之间的垂直外边距折叠

创建方式包括 \`overflow\` 不为 visible、\`display: flow-root\`、\`display: flex/grid\` 的子项、绝对/固定定位、\`contain: layout\` 等。\`flow-root\` 语义就是“建一个 BFC”，副作用比随便改 overflow 小。

外边距折叠发生在同一个 BFC 里、相邻块盒的垂直 margin 之间。父子折叠还要求中间没有 padding、border 或 BFC。说 BFC 时要讲清它划的是布局边界，不要只说“清浮动”。`,
            `盒模型先确认 box-sizing：content-box 的 width 不含 padding 和 border，border-box 含。百分比相对包含块，不要只报一个 width。层叠按来源、重要性、层、选择器优先级和源码顺序比，不是“谁写得长谁赢”。BFC 是独立的块布局环境，用来隔离浮动和切断外边距折叠；flow-root 比滥用 overflow 更合适。`,
            [
                {
                    question: '100% 宽再加 padding 为什么溢出？',
                    direction:
                        'content-box 下 100% 只指内容区，padding 额外占用；改 border-box 或把 padding 算进剩余空间。',
                },
                {
                    question: '选择器优先级会进位吗？',
                    direction: '不会，11 个 class 也压不过 1 个 ID。',
                },
                {
                    question: '为什么未分层 CSS 能压过 @layer 里的样式？',
                    direction: '未分层声明默认比所有层高，引入旧代码时必须明确放进哪一层。',
                },
                {
                    question: '父子外边距为什么叠在一起？',
                    direction:
                        '同一 BFC 且中间没有 padding、border 或新的格式化上下文时，垂直 margin 会折叠。',
                },
                {
                    question: 'overflow: hidden 清浮动有什么副作用？',
                    direction: '它顺便裁剪溢出并可能生成滚动容器，只为建 BFC 时更宜用 flow-root。',
                },
            ],
        ),
        pitfalls: [
            '把元素实际占用宽度只算成 width。',
            '遇到覆盖问题就加 !important。',
            '把 BFC 当成万能清除浮动技巧，不解释布局边界。',
        ],
    },
    {
        slug: 'flex-grid-responsive',
        module: 'css',
        title: 'Flex、Grid 与响应式布局',
        summary: '根据一维、二维和内容约束选择布局，而不是背居中代码片段。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['Flex', 'Grid', '响应式'],
        overview:
            'Flex 适合沿一个主轴分配空间，Grid 适合同时控制行列。可靠布局还要处理内容溢出、最小尺寸和不同屏幕。',
        body: createReviewBody(
            `## 怎么选

先问“要分配的是一条轴还是一个面”。导航、工具条、搜索框+按钮是一维，用 Flex。整页顶栏+侧栏+主区、定价表、表单多列是二维，用 Grid。居中用 Flex/Grid 的对齐属性，不要一上来 \`position: absolute\`。

## Flex：剩余空间和最小尺寸

主轴由 \`flex-direction\` 决定。\`flex-grow\` 分剩余空间，\`flex-shrink\` 在不够时收缩，\`flex-basis\` 是分配前的起始尺寸。\`flex: 1\` 等于 \`1 1 0%\`，起始尺寸是 0 再平分；\`flex: auto\` 是 \`1 1 auto\`，起始是内容宽，剩余才分，两项内容不等时视觉不均。

子项默认 \`min-width: auto\`（横向）或最小内容尺寸。中间一栏放长文件名时，它拒绝比这段文字更窄，省略号不出现，两侧按钮被挤出。处理：

\`\`\`css
.main { flex: 1; min-width: 0; }
.main h1 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
\`\`\`

只改文字节点不够，祖先 Flex 项也要允许收缩。\`margin: auto\` 吃掉剩余空间，可做“一侧顶住”。

## Grid：轨道而不是套 Flex

\`grid-template-columns: 240px minmax(0, 1fr)\` 比侧栏 \`flex: 0 0 240px\` + 主区再套一层更清楚。\`1fr\` 同样受最小内容尺寸影响，长单词会撑破栏，写成 \`minmax(0, 1fr)\`。

\`auto-fill\` 按容器尽量多放轨道，空轨留下；\`auto-fit\` 会折叠空轨让已有项变宽。卡片矩阵用 \`repeat(auto-fit, minmax(16rem, 1fr))\`。子项对不齐时用区域或后文的 subgrid，不要再套三层 Flex。

## 响应式

先保证不设断点时也不溢出，再在内容开始撞车的宽度加媒体查询或容器查询。按 iPhone / iPad 型号设断点，会漏掉“桌面窗口里的窄侧栏”。用真实标题、无图卡片、超长英文 token 测一遍。`,
            `一维分配用 Flex，二维骨架用 Grid，不要用绝对定位当布局系统。Flex 要处理主轴、shrink 和默认 min-width: auto，否则省略号和压缩不生效。Grid 用 fr、minmax 和区域，1fr 同样会被内容最小值撑破。响应式先保证流动，再按内容崩坏位置而不是机型设断点。`,
            [
                {
                    question: '为什么文字省略号在 Flex 项里不出现？',
                    direction:
                        '子项按最小内容尺寸拒绝收缩，需要 min-width: 0 并在文字节点设 overflow。',
                },
                {
                    question: 'auto-fit 和 auto-fill 差在哪？',
                    direction: '都按容器再放轨道；fit 会合并空轨，fill 保留空轨。',
                },
                {
                    question: 'flex: 1 和 width: 100% 哪个更合适？',
                    direction: '要吃剩余空间用 flex；width 100% 相对包含块，不参与剩余空间分配。',
                },
                {
                    question: '什么时候还要用绝对定位？',
                    direction: '徽标、角标、叠在已有布局上的装饰，而不是排整行整列。',
                },
            ],
        ),
        pitfalls: [
            '一遇到布局就绝对定位。',
            '忽略 flex 子项的最小内容尺寸，导致省略号失效。',
            '只按设备型号设计断点，没有根据内容崩坏位置调整。',
        ],
    },
    {
        slug: 'type-system-foundations',
        module: 'typescript',
        title: 'type、interface、unknown 与 never',
        summary: '理解声明方式、未知输入和不可达状态，而不是把类型当语法提示。',
        depth: 'intro',
        heat: 5,
        year: 2026,
        tags: ['type', 'interface', 'unknown'],
        overview:
            'TypeScript 的重点是如何建模边界。type 和 interface 大量能力重叠，选择应由扩展方式和项目约定决定。',
        body: createReviewBody(
            `## type 与 interface

对象形状上两者几乎一样：\`interface User { id: string }\` 和 \`type User = { id: string }\` 对调用方没差别。差别在表达力和扩展方式。

interface 可以声明合并：两个文件都写 \`interface Window { ... }\` 会合成一个。这对补全局或给库加字段有用，也会让字段来源变远，本地看不到谁加的。type 不能合并，但能写联合、元组、映射：\`type Result<T> = { ok: true; data: T } | { ok: false }\`。

项目里定一条即可：对外可扩展契约用 interface，内部联合和工具类型用 type。不要把“能合并”说成一定更好。

## any 与 unknown

\`any\` 关掉检查并沿赋值传播：\`const x: any = res; x.foo.bar\` 全程不报错。\`unknown\` 必须先收窄。\`JSON.parse\`、\`catch (error)\`、\`message.data\` 都应先当 unknown。

\`catch\` 不能写成 \`catch (e: Error)\`。\`throw 1\` 合法，所以要：

\`\`\`ts
catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
}
\`\`\`

\`as User\` 只改编译器看法。响应少了 \`id\`，运行时照样炸。第三方类型残缺时，在边界收窄，不要把 any 引进领域函数。

## never

\`never\` 是空集：没有值属于它。\`function fail(message: string): never { throw new Error(message) }\` 告诉调用方不会回来。

穷尽检查：

\`\`\`ts
function label(status: 'on' | 'off'): string {
  switch (status) {
    case 'on': return '开'
    case 'off': return '关'
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}
\`\`\`

联合加上 \`'idle'\` 后，default 无法把 \`idle\` 赋给 never，编译失败。用 never 骗过“这个分支到不了”是在关警报。`,
            `type 和 interface 都能描述对象，选择看扩展方式和团队约定：要联合和条件类型用 type，要声明合并用 interface。any 会传播并关掉检查，未知输入用 unknown 再收窄。never 表示不可达，用来做穷尽检查。不要用断言把坏数据送进领域类型。`,
            [
                {
                    question: '对象类型该统一用谁？',
                    direction: '选一个并写进规范。常见是对外契约用 interface，内部联合用 type。',
                },
                {
                    question: '声明合并的风险是什么？',
                    direction: '同名 interface 在别的文件被扩充，本地看不到字段从哪来。',
                },
                {
                    question: 'catch 的错为什么是 unknown？',
                    direction: 'throw 可以抛任何值，不能假定是 Error，要先收窄再读 message。',
                },
                {
                    question: '函数返回 never 表示什么？',
                    direction: '它不会正常返回，例如永远抛错或死循环，调用方不必处理返回值。',
                },
            ],
        ),
        pitfalls: [
            '把 interface 能合并描述成一定更好。',
            '用 any 解决第三方数据类型问题。',
            '滥用 as 让错误数据绕过类型系统。',
        ],
    },
    {
        slug: 'generics-mapped-runtime',
        module: 'typescript',
        title: '泛型、keyof、映射类型与运行时校验',
        summary: '让输入输出关系保留类型，同时清楚编译期类型不能验证网络数据。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['泛型', 'keyof', '运行时校验'],
        overview:
            '好的泛型表达值之间的关系，而不是把函数签名变复杂。外部数据必须在运行时验证，类型声明不会自动生成校验。',
        body: createReviewBody(
            `## 泛型关系

泛型要连接两个位置。\`get<T, K extends keyof T>(value: T, key: K): T[K]\` 里，键必须来自对象，返回值随键变：\`get(user, "id")\` 是 \`string\`，传 \`"nope"\` 直接报错。

反例：\`function wrap<T>(value: T): T { return value }\` 若再写成 \`wrap<any>\`，或 \`function parse<T>(text: string): T { return JSON.parse(text) as T }\`，T 只出现在返回值，调用方写 \`parse<User>(text)\` 等于自己断言。T 没有从输入推出来，这是假泛型。

## 类型变换

\`keyof User\` 得到 \`"id" | "name"\`。映射类型遍历这些键：

\`\`\`ts
type Optional<T> = { [K in keyof T]?: T[K] }
type PickId = Pick<User, 'id'>
\`\`\`

条件类型按关系分支，索引访问 \`T[K]\` 读取属性类型。优先用 \`Partial\`、\`Pick\`、\`Omit\`、\`Record\`、\`Awaited\`。单点场景写清楚的 \`UserDraft\`，比套四层 infer 更对面试官和同事友好。

## 运行时边界

\`tsc\` 之后类型被擦掉。下面这段编译通过，线上仍可能是 \`null\`：

\`\`\`ts
const user = (await response.json()) as User
user.id.toUpperCase()
\`\`\`

正确顺序：\`unknown\` → schema / type guard → 领域类型。zod 的 \`UserSchema.parse(data)\` 失败会抛错，成功后才当 User。TypeScript 不在生产拦截错误 JSON；拦不住是运行时没写校验，不是类型系统骗人。`,
            `泛型用来保留输入和输出之间的关系，例如键必须来自对象、返回值随键变化，而不是把签名变长。变换优先用内置工具类型。编译期类型不能验证网络数据，边界上要用 schema 或 type guard。认为 TypeScript 能在生产拦住错误 JSON，是把两件事情混为一谈。`,
            [
                {
                    question: '泛型参数只出现一次说明什么？',
                    direction: '它没有连接两个位置，通常可以删掉或改成具体类型。',
                },
                {
                    question: 'keyof 和 in 各干什么？',
                    direction: 'keyof 取出键的联合；映射类型里的 in 用来遍历这些键。',
                },
                {
                    question: '为什么断言不能代替校验？',
                    direction: '断言只改编译器看法，运行时对象该缺字段还是缺。',
                },
                {
                    question: '什么时候值得写很深的条件类型？',
                    direction: '有多处复用且能降低调用方断言时；单点使用更宜写清楚的领域类型。',
                },
            ],
        ),
        pitfalls: [
            '泛型参数只出现一次，没有表达任何关系。',
            '用复杂类型体操替代简单领域模型。',
            '认为 TypeScript 能在生产环境拦截错误响应。',
        ],
    },
    {
        slug: 'render-reconciliation-key',
        module: 'react',
        title: 'React 渲染、Reconciliation 与 key',
        summary: '理解组件调用、元素树比较、状态保留和 DOM 提交的完整过程。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['渲染', 'Diff', 'key'],
        overview:
            'React 更新不是“Virtual DOM 一定更快”，而是根据元素类型和 key 决定复用或重建，再把必要变更提交到宿主环境。',
        body: createReviewBody(
            `## 两个阶段

触发更新后，React 先进入 render 阶段：调用组件，根据当前 props 和 state 计算新的元素描述。并发模式下这个过程可能暂停、重启或直接放弃，所以 render 必须纯净，不能发送请求、修改 DOM 或写外部对象。随后进入 commit 阶段，把确认后的差异应用到 DOM；这个阶段不会以同样方式被中断。

## 比较规则

React 不会对任意两棵树做代价很高的完全最优比较，而是依赖启发式规则。元素类型不同通常重建对应子树，旧状态随卸载丢失；类型相同则复用实例、更新属性并继续比较子节点。

列表 key 表示元素在同一层级中的稳定身份。React 通过“类型 + key”判断前后是否为同一个组件，因此 key 不只是消除警告，还决定 state 属于哪条数据。使用数组下标时，一旦头部插入、删除或排序，原下标可能对应另一条数据，输入框内容、焦点或动画状态就会错位。稳定业务 ID 通常是更可靠的 key。

## Fiber

Fiber 是 React 内部表示组件工作与关系的数据结构。它把渲染拆成可调度单元，并保存父子、兄弟、更新优先级和副作用信息，为暂停、恢复、放弃和多优先级更新提供基础。Fiber 不是 DOM，也不是要求业务直接操作的公开 API。

“Virtual DOM 一定更快”并不准确。React 的价值是以声明式模型组织更新并批量提交；它仍要执行组件、比较元素并操作 DOM。是否更快取决于更新规模、算法和具体实现。`,
            `React 更新分为 render 和 commit：render 调用组件计算下一棵元素树，可以被中断或重试，所以必须纯；commit 才把确定的变化写入 DOM。协调时主要依据元素类型和同级 key 判断复用还是重建，key 实际上决定了组件身份和状态归属。Fiber 则把工作拆成可调度单元，为优先级和并发渲染提供基础。Virtual DOM 不是天然更快，而是让 React 能以统一方式计算并批量提交必要变化。`,
            [
                {
                    question: '修改 key 为什么可以重置组件状态？',
                    direction:
                        '类型相同但 key 改变时，React 会把它视为新身份，卸载旧实例并挂载新实例。',
                },
                {
                    question: '什么时候可以安全使用 index key？',
                    direction: '列表完全静态、不会重排增删且条目没有需要保留的局部状态时风险较低。',
                },
                {
                    question: 'render 阶段为什么可能执行多次？',
                    direction:
                        'React 可能因更高优先级更新、Suspense 或开发期检查而重试，因此不能依赖执行次数产生副作用。',
                },
                {
                    question: 'Reconciliation 和浏览器 DOM Diff 是一回事吗？',
                    direction:
                        '不是；前者是 React 比较元素与组件身份的过程，commit 才把结果映射为宿主 DOM 操作。',
                },
            ],
        ),
        pitfalls: [
            '回答 Virtual DOM 一定比直接操作 DOM 快。',
            '列表可增删重排时使用 index key，导致状态错位。',
            '在 render 阶段执行请求、订阅或修改外部对象。',
        ],
    },
    {
        slug: 'state-hooks-effects',
        module: 'react',
        title: 'State、批处理、Hooks 与 Effect',
        summary: '掌握状态快照、函数式更新、依赖数组、清理和闭包问题。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['State', 'Hooks', 'Effect'],
        overview:
            '组件每次渲染看到一份状态快照。Hook 按调用顺序关联状态，Effect 用于和 React 外部系统同步。',
        body: createReviewBody(
            `## 状态更新

每次渲染中的 state 都是一份快照，事件处理函数会闭包捕获这次快照。调用 setter 是把更新加入队列，不会修改当前变量。一次事件中的多个更新通常会批处理；连续写三次 \`setCount(count + 1)\` 使用的是同一个旧 count，而 \`setCount((value) => value + 1)\` 会按队列依次接收前一次结果。

对象和数组状态应创建新引用。原地修改后把同一个对象传回去，不仅会破坏历史快照，React 也可能通过 Object.is 判断值未变化而跳过更新。状态结构应尽量最小化：能由 props 和其他 state 计算出的值通常不需要再保存一份。

## Hooks 规则

React 依靠 Hook 的调用顺序把内部槽位与每次调用对应，所以普通 Hook 必须在组件或自定义 Hook 顶层以稳定顺序执行，不能放进条件、循环或提前 return 之后。\`useRef\` 保存跨渲染存在但修改后不触发界面的数据；\`useState\` 保存会影响输出、变化后需要重新渲染的数据。

## Effect

Effect 用来让 React 与外部系统同步，例如订阅事件、控制非 React 组件、计时器或网络连接。它不是生命周期名称的简单替换，也不是通用的数据加工区。能在渲染阶段由现有数据计算出的值，不应通过 Effect 再复制进 state，否则会多一次渲染并产生同步风险。

依赖数组描述 Effect 读取的响应式值，不能按期望执行次数随意删减。每次重新同步前 React 会先执行上一次清理，卸载时也会清理；订阅、定时器和请求都应处理资源释放或过期结果。若 Effect 不断触发，通常应检查依赖引用是否每次重建，以及这段逻辑是否本来就不需要 Effect。`,
            `React 的 state 是每次渲染的快照，setter 只是排队更新；依赖旧值时要用函数式更新，对象和数组则要创建新引用。普通 Hook 靠固定调用顺序关联内部状态，所以必须在顶层稳定调用。Effect 的职责是同步 React 外部系统，不应该拿来保存可直接计算的派生数据；它读取的响应式值要完整写入依赖，并为订阅、计时器和异步工作提供清理或过期保护。`,
            [
                {
                    question: '为什么调用 setter 后立即打印仍是旧值？',
                    direction:
                        '当前处理函数绑定的是本次渲染快照，更新会触发下一次渲染，不会改写当前闭包变量。',
                },
                {
                    question: '自动批处理会把所有更新合成一个吗？',
                    direction:
                        '它减少中间渲染，但更新队列仍按替换或函数式更新的规则依次计算最终状态。',
                },
                {
                    question: 'useRef 为什么不会触发渲染？',
                    direction: 'ref 是 React 保留的可变容器，修改 current 不进入状态更新队列。',
                },
                {
                    question: '怎样处理请求竞态？',
                    direction:
                        '清理阶段取消请求，或用标记忽略过期响应，确保只有当前依赖对应的结果能写入状态。',
                },
                {
                    question: '开发模式 Effect 为什么可能执行两次？',
                    direction:
                        'Strict Mode 会额外执行挂载与清理流程，帮助发现不可重复建立或缺少清理的副作用。',
                },
            ],
        ),
        pitfalls: [
            '连续 setCount(count + 1) 却期待每次都基于新值。',
            '为了消除依赖警告随意删除依赖项。',
            '用 Effect 同步两个本可直接计算的 state。',
        ],
    },
    {
        slug: 'react-performance-ssr',
        module: 'react',
        title: 'React 性能、懒加载与 Hydration',
        summary: '从更新来源、计算成本、包体和服务端输出定位性能问题。',
        depth: 'deep',
        heat: 4,
        year: 2026,
        tags: ['性能', 'SSR', 'Hydration'],
        overview:
            '框架性能题应先定位：是不必要更新、单次计算过重、DOM 过多，还是资源加载太慢。memo 只解决其中一部分。',
        body: createReviewBody(
            `## 更新性能

性能优化应先确定瓶颈属于哪一层：组件更新过于频繁、单次 render 计算过重、DOM 节点太多、主线程被业务计算占满，还是资源加载太慢。使用 React Profiler 查看哪些 commit 昂贵、更新由谁触发，再做针对性处理。

更新范围方面，应把状态放在真正需要它的最近公共祖先，避免高频 state 位于页面根部；Context 也要按变化频率和职责拆分。\`memo\` 只有在子组件重渲染确实昂贵、且 props 多数时候稳定时才有收益。超长列表应考虑虚拟化，紧急输入与重型结果可用并发更新拆分优先级。

## 加载性能

按路由或重型组件动态加载，可以避免把编辑器、图表、Markdown 等低频代码全部放进首包。但切分过细会增加请求、调度和 fallback 次数。预加载应基于用户高概率的下一步，在首屏关键资源与后续交互速度之间平衡。

## SSR 与 Hydration

SSR 在服务端先生成 HTML，让用户和搜索引擎更早获得内容；Hydration 在客户端复用现有 DOM，并把组件状态和事件处理连接上去。它不是简单地“再渲染一次”。服务端输出与客户端首次输出必须一致，否则可能产生警告、局部重建或状态错位。

常见不一致来源包括直接读取当前时间、随机数、浏览器存储、窗口尺寸或不同地区格式。应提供稳定初值，再在 Effect 中更新客户端专属信息；或者把确实只属于浏览器的子树隔离。流式 SSR 与 Suspense 还能分段发送内容，选择性 Hydration 则允许某些区域更早变得可交互。`,
            `React 性能要先测量并区分更新、计算、DOM 和加载瓶颈。更新层面可缩小 state 与 Context 的影响范围，只在确有重复昂贵计算且依赖稳定时使用 memo，长列表用虚拟化。加载层面按路由或重型功能拆包，但避免过度碎片化。SSR 提前输出 HTML，Hydration 在客户端复用 DOM 并接上交互；服务端和客户端首次结果必须一致，Suspense 与流式渲染可以进一步改善内容到达和可交互时机。`,
            [
                {
                    question: 'React.memo 为什么可能没有效果？',
                    direction:
                        'props 每次都是新对象、组件本身很便宜或更新来自 Context 时，比较成本可能没有收益。',
                },
                {
                    question: '如何区分渲染慢和网络慢？',
                    direction:
                        '结合浏览器网络瀑布、性能时间线和 React Profiler，分别观察资源等待与 commit 成本。',
                },
                {
                    question: 'Hydration mismatch 常见来源有哪些？',
                    direction:
                        '时间、随机数、客户端存储、浏览器 API、无效 HTML 嵌套及服务端和客户端数据不一致。',
                },
                {
                    question: '代码分割越多越好吗？',
                    direction:
                        '不是；应按用户路径和重型依赖划边界，过细会增加请求与加载占位的管理成本。',
                },
                {
                    question: '列表虚拟化的代价是什么？',
                    direction: '滚动定位、动态高度、可访问性和浏览器查找等行为会更复杂，需要权衡。',
                },
            ],
        ),
        pitfalls: [
            '未分析就给所有组件加 memo。',
            '把所有代码拆成碎块，增加请求和调度开销。',
            '在首屏渲染中直接读取随机数、当前时间或仅浏览器存在的数据。',
        ],
    },
    {
        slug: 'vue-reactivity-core',
        module: 'vue',
        title: 'ref、reactive、computed 与 watch',
        summary: '理解依赖收集、触发更新、派生状态和外部副作用之间的边界。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['ref', 'reactive', 'computed'],
        overview:
            'Vue 3 通过 Proxy 和 ref 包装追踪读取与写入。computed 表达可缓存的派生值，watch 用于响应变化执行副作用。',
        body: createReviewBody(
            `## 响应式

Vue 会把当前正在执行的组件渲染、computed 或 watcher 视为 effect。effect 读取 ref.value 或 reactive 属性时，响应系统按目标对象和属性记录依赖；写入发生且值确实变化时，只通知相关 effect，并通过调度队列批量执行，避免一次同步流程中重复更新 DOM。

ref 用容器表达单值，既能保存基本类型，也方便整体替换对象；reactive 返回对象 Proxy，适合多个相关字段组成的模型。模板会自动解包常见位置的 ref，但 JavaScript 中通常仍要访问 value。reactive 是深层转换；大型不可变数据、第三方类实例或只关心根引用的数据，可以考虑 shallowRef、shallowReactive 或 markRaw，避免无意义代理。

## computed 与 watch

computed 内部也是响应式 effect，但它表达无副作用的派生值，并按依赖失效进行惰性重算与缓存。watch 显式声明来源，可获得新旧值并精确控制 immediate、deep 和 flush；watchEffect 立即运行，并自动收集同步执行阶段读取的依赖。异步回调在第一个 await 之后读取的数据不会自动成为 watchEffect 的同步依赖。

请求、存储、日志、DOM 和第三方库同步适合 watcher。异步工作必须注册清理：依赖再次变化时取消旧请求或忽略旧结果，避免较慢的旧响应覆盖最新状态。需要读取 Vue 更新后的 DOM 时选择 post flush，而 sync watcher 会绕过批处理，应谨慎用于非常轻量的同步需求。

## 解构与身份

直接解构 reactive 对象的普通属性得到当前值，后续读取不再经过 Proxy，因此可能失去响应连接。可以通过 toRef/toRefs 保留属性引用，或向组合函数传 getter。传递和替换数据时要明确是在传代理、ref、getter还是一次性的当前值。`,
            `Vue 响应式通过 effect 在读取时收集属性依赖、写入时触发并批量调度。ref 适合单值和整体替换，reactive 适合聚合对象；computed 是有缓存、无副作用的派生状态，watch 和 watchEffect 则用于请求、存储等副作用。watch 显式指定来源，watchEffect 自动收集同步阶段依赖。直接解构 reactive 属性可能断开代理读取，异步 watcher 还必须清理旧任务，避免竞态。`,
            [
                {
                    question: 'computed 为什么能缓存？',
                    direction:
                        '它记录 getter 读取的依赖，依赖未触发失效时重复访问直接返回上次结果。',
                },
                {
                    question: 'watch 与 watchEffect 如何选择？',
                    direction:
                        '需要明确来源、新旧值和触发控制时用 watch；依赖与副作用高度一致时可用 watchEffect。',
                },
                {
                    question: 'deep watch 为什么要谨慎？',
                    direction:
                        '它需要遍历深层结构建立依赖，大对象成本较高，而且回调中的新旧对象可能是同一引用。',
                },
                {
                    question: '怎样防止旧请求覆盖新请求？',
                    direction: '在 watcher 清理中取消旧请求，或记录本次任务身份，只接受最新结果。',
                },
                {
                    question: '什么时候使用 shallowRef？',
                    direction: '外部状态或大型不可变对象只通过根引用替换更新时，能避免深层代理。',
                },
            ],
        ),
        pitfalls: [
            '用 watch 把一个响应式值复制到另一个值。',
            '在 computed 中发请求或修改其他状态。',
            '忽略异步 watch 的清理，让旧请求覆盖新结果。',
        ],
    },
    {
        slug: 'vue-components-lifecycle',
        module: 'vue',
        title: '组件通信、生命周期、key 与 nextTick',
        summary: '掌握父子契约、组件复用身份和 DOM 更新队列。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['组件通信', '生命周期', 'nextTick'],
        overview:
            'Vue 组件通过 props 向下传值、emit 向上通知、slot 传递结构。跨层共享再考虑 provide/inject 或 store。',
        body: createReviewBody(
            `## 组件通信

Props 让父组件向子组件传数据，子组件不应直接修改 props，而应通过 emit 表达事件，由拥有状态的一方决定如何更新。Slot 把一段渲染结构交给子组件安排位置，作用域插槽还允许子组件向插槽内容提供数据。provide/inject 适合主题、表单上下文或插件服务等跨层依赖，但它隐藏了来源，不应替代所有显式 props。

当状态跨越多个无直接层级关系的区域、需要独立业务生命周期或开发工具追踪时，再考虑 Pinia。选择通信方式的核心是所有权：谁持有权威状态，谁只能请求变化，以及状态需要存活多久。

## 生命周期

setup 阶段创建响应式状态和副作用，此时 DOM 尚未挂载；onMounted 后才能可靠访问组件自己的 DOM。状态变化会进入批量更新队列，DOM 提交后触发 updated。updated 中无条件再次修改其依赖状态会形成更新循环。卸载时应清理手动注册的全局监听、订阅、计时器和第三方实例。

## key

key 表示同级 VNode 的稳定身份，帮助 Vue 判断节点是移动、复用还是重新创建。可增删或排序的列表应使用业务 ID，数组下标无法跟随数据身份，可能造成表单值和组件状态错位。主动改变组件 key 可以明确要求丢弃旧实例及其本地状态，常用于完整重置。

## nextTick

Vue 为减少重复工作，会把同一轮同步状态修改合并到异步更新队列。因此写入响应式数据后，数据已经是新值，但 DOM 通常还没有提交。需要聚焦新元素、读取新尺寸或调用依赖新 DOM 的库时等待 nextTick；它只表示 Vue 当前更新队列已经刷新，不保证图片、字体或网络资源也已加载。

nextTick 是读取 DOM 时序的工具，不是修复数据流的默认手段。如果逻辑只依赖数据，应直接使用数据；如果总要在 updated 后反向修改状态，通常说明状态来源或组件职责需要重新设计。`,
            `Vue 组件通信遵循明确所有权：props 向下传值，emit 向上通知，slot 传结构，provide/inject 处理跨层依赖，复杂跨区域业务状态再使用 Store。setup 用于建立响应式逻辑，mounted 后才能访问 DOM，卸载时要清理外部资源。key 代表同级节点的稳定身份，决定实例复用与状态归属。状态更新会批量进入队列，需要读取更新后的 DOM 时用 nextTick，而不是用 setTimeout 猜测。`,
            [
                {
                    question: '为什么子组件不能直接修改 props？',
                    direction:
                        'props 的权威所有者在父组件，直接修改会让数据来源和更新路径变得不可预测。',
                },
                {
                    question: 'provide/inject 的主要风险是什么？',
                    direction: '依赖来源在组件树中不直观，范围过大时会增加耦合和测试难度。',
                },
                {
                    question: '改变 key 为什么能重置组件？',
                    direction:
                        'Vue 会把新 key 视为不同身份，卸载旧实例后重新创建，局部状态因此清空。',
                },
                {
                    question: 'nextTick 与 setTimeout 有什么区别？',
                    direction:
                        'nextTick 跟随 Vue 自身更新队列，setTimeout 只是未来任务，既不精确也表达不了等待 Vue DOM 提交的意图。',
                },
                {
                    question: 'onUpdated 中修改状态有什么风险？',
                    direction: '修改触发本次更新的依赖会再次排队渲染，容易形成无限更新循环。',
                },
            ],
        ),
        pitfalls: [
            '子组件直接修改 props。',
            '把所有共享状态都塞进全局 store。',
            '用 nextTick 修补错误的数据流设计。',
        ],
    },
    {
        slug: 'build-test-observability',
        module: 'engineering',
        title: '构建、测试、发布与前端监控',
        summary: '从源码检查到线上反馈构成完整质量闭环。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['测试', '发布', '监控'],
        overview:
            '工程化学习不应停在工具配置。重点是每个环节防什么问题、失败后如何定位，以及怎样安全发布和回滚。',
        body: createReviewBody(
            `## 构建与检查

编译器（tsc、oxc、babel）负责语法、类型和语言降级；打包器解析模块图，做拆包、tree-shaking、压缩和资源指纹。开发服务器按需编译，生产构建要按目标环境完整跑一遍。两边结果不同是常见事故：环境变量、tree-shaking 误删、\`process.env\` 被内联。

CI 最小集：锁文件安装 → typecheck → lint → 测试 → 生产构建。缺类型检查等于只打包；Node 版本和本地不一致会只在一边挂。密钥不能进 \`VITE_\` / \`NEXT_PUBLIC_\` 这种会打进客户端的前缀。

## 测试分层

- 单元：纯函数、状态转换、校验，快、稳定
- 组件：用户能看见的交互契约，按角色查询，不测内部 state 名字
- E2E：登录、下单、支付这类少量关键路径

测行为，不测实现。大面积快照会把无关 DOM 变化变成红灯。测试要能在 CI 重复跑，时间、随机数、网络都要可控。

## 发布

带内容哈希的 JS/CSS 可以长缓存；HTML 或带哈希的入口清单必须能立刻更新，否则用户会拿旧入口点已经下线的文件。发布顺序通常是先上传静态资源，再切换入口。

灰度按用户、租户或百分比放量，并准备一键回滚。回滚必须保证入口和静态资源是同一套版本，不能只回 HTML 或只回 CDN 目录。功能开关可以把代码发布和能力打开拆开。

## 监控

线上至少要有：JS 错误、资源失败、接口失败、Core Web Vitals、关键业务转化。每条事件带上版本、路由、环境、用户可脱敏标识和最近操作。没有版本就无法判断是哪次发布引入的。

Source map 只留给错误处理服务，不要公开挂在生产 CDN。日志里去掉 token、手机号和请求体里的隐私字段。监控是为了定位和回滚，不是为了堆仪表盘。`,
            `工程化要串成闭环：编译和打包分别解决语言与模块图，CI 必须包含类型、lint、测试和生产构建。测试按单元、组件、E2E 分层，测用户行为而不是内部实现。发布时哈希资源长缓存、入口可更新，并支持灰度和成套回滚。监控要带版本、路由和上下文，source map 与隐私字段不能随页面暴露。`,
            [
                {
                    question: '为什么开发通过不能直接当生产通过？',
                    direction:
                        '生产会做压缩、摇树、环境替换和代码分割，这些在开发服务器上不会完整发生。',
                },
                {
                    question: 'HTML 为什么不能和 JS 一样缓存一年？',
                    direction: '旧入口会继续引用已下线的哈希文件，发版后用户无法更新。',
                },
                {
                    question: '回滚失败常见原因是什么？',
                    direction: '入口和带哈希资源不是同一版本，或缓存层仍返回旧 HTML。',
                },
                {
                    question: '组件测试为什么不要断言 state 字段？',
                    direction: '重构内部实现会误伤测试；应断言屏幕上的文本、角色和交互结果。',
                },
                {
                    question: '错误日志至少要带哪些字段？',
                    direction:
                        '时间、版本、路由、环境、错误栈和可复现的操作上下文，并去掉敏感信息。',
                },
            ],
        ),
        pitfalls: [
            '开发构建通过就认为生产可发布。',
            '只统计错误数量，没有版本、路由和环境上下文。',
            '资源回滚后 HTML 与带哈希静态文件版本不匹配。',
        ],
    },
    {
        slug: 'react-context-granularity',
        module: 'react',
        title: 'Context 粒度与状态下发',
        summary: '用 Context 跨层传稳定依赖，按变化频率拆分，避免整树重渲染。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['Context', '状态管理', '重渲染'],
        overview:
            'Context 解决的是跨层传递，不是全局状态方案。值一变，所有消费该 Context 的组件都会重渲染，所以粒度和引用稳定性比“会不会用”更重要。',
        body: createReviewBody(
            `## 什么时候用

Props 钻两三层还能看懂时，继续显式传。主题、当前用户、国际化、表单控制器这类“很多层都要读、又不该层层转发”的依赖，才适合 Context。

它不是 Redux / Zustand 的替代品。Context 没有独立的选择器、中间件和时间旅行；高频变化的客户端缓存更适合专用库。两者可以组合：库管数据，Context 只下发稳定的 store 或服务引用。

## 为什么会打穿子树

\`<Theme.Provider value={{ theme, setTheme }}>\` 每次父组件渲染都是新对象，即便 theme 没变。消费方用 \`useContext\` 读到新引用就会更新。Provider 自己的 value 必须稳定：拆开 state 与 dispatch、用 \`useMemo\` 包配置对象，或把不变的方法和常变的数据分成两个 Context。

变化频率不同的数据不要放在同一个 value 里。主题几乎不变，购物车数量很常变；绑在一起时，改数量也会让只读主题的组件重渲染。

## 怎么拆

- 读多写少、变化慢：一个 Context 即可
- 读和写分离：\`StateContext\` + \`DispatchContext\`，只派发的按钮不订阅 state
- 按领域拆：用户、主题、特性开关各一张表
- 把 Provider 尽量靠近真正需要它的子树，不要挂在应用根上罩住整页

\`use\` 可以按条件读取不同 Context，但条件分支里创建的对象同样会破坏稳定性。列表项不要各自造一份新的 Context value。

## 和组合

能用组合就少用 Context：把 \`children\` 插到不变的外壳里，外壳更新不会重渲染 children。这比给每个中间层 memo 更干净。`,
            `Context 用来跨层传递依赖，不是默认的全局 store。Provider 的 value 按引用比较，新对象会让所有消费者重渲染，所以要把变化慢和变化快的数据拆开，并把 value 稳定住。读和写可以分两个 Context；Provider 尽量靠近消费方。高频业务状态更适合带选择器的状态库，Context 只下发稳定引用。能用 children 组合隔开更新时，不必上 Context。`,
            [
                {
                    question: '为什么 memo 包住消费者仍会更新？',
                    direction:
                        'memo 比的是 props；useContext 的更新不走 props，value 变了仍会渲染。',
                },
                {
                    question: 'dispatch 为什么可以单独放一个 Context？',
                    direction: 'React 保证 dispatch 引用稳定，只派发的组件不必订阅 state。',
                },
                {
                    question: 'Context 能替代状态库吗？',
                    direction:
                        '少量低频共享可以；需要选择器、缓存、跨路由持久化或复杂更新时用专用库。',
                },
                {
                    question: '怎样避免中间层无意义重渲染？',
                    direction: '把 children 作为组合槽，或把 Provider 放到更靠近叶子的位置。',
                },
            ],
        ),
        pitfalls: [
            '在根组件每次 render 都传入新的对象字面量当 value。',
            '把高频输入和低频主题塞进同一个 Context。',
            '为了少传 props 把局部 UI 状态提升成全局 Context。',
        ],
    },
    {
        slug: 'react-error-boundary',
        module: 'react',
        title: 'Error Boundary 与渲染错误隔离',
        summary: '用错误边界接住渲染期异常，保住页面其余部分，并决定重试还是降级。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['Error Boundary', '降级', '异常'],
        overview:
            '渲染、生命周期和构造函数里的抛错会拆掉整棵组件树。Error Boundary 接住子树错误，展示降级 UI，避免一张白屏。',
        body: createReviewBody(
            `## 能接什么

Error Boundary 是带 \`getDerivedStateFromError\` / \`componentDidCatch\` 的 class 组件（或框架封装）。它接住：

- 子组件渲染期间的抛错
- 生命周期、构造函数里的抛错
- 被 \`use()\` 读取的 rejected Promise（交给最近的错误边界，不是 Suspense）

接不住：

- 事件处理函数里的抛错（发生在提交之后，用 try/catch）
- 异步回调、\`setTimeout\`、原生监听
- 服务端渲染本身的错误（要在服务端另做处理）
- Error Boundary 自己在渲染降级 UI 时又抛错

## 边界怎么放

整页一个边界只能换一张全屏错误。应按独立功能块切：列表、编辑器、第三方小部件各自一块，主布局仍在。边界要记录错误、版本和组件栈，然后给用户可理解的降级和重试。

重试通常是改 \`key\` 重置边界状态，或让用户回到上一屏。不要在 \`componentDidCatch\` 里无条件 \`setState\` 触发无限循环。开发态 Strict Mode 可能让错误看起来发生两次，上报要去重。

## 和数据错误

接口返回 4xx、表单校验失败属于可预期状态，应建成联合类型走正常 UI，不要 throw 给边界。边界留给“组件已经无法继续渲染”的程序错误。未知错误继续上报；已知业务失败返回状态。`,
            `Error Boundary 接住子树在渲染和生命周期里的异常，展示降级 UI，避免整页崩溃。事件、定时器和异步回调里的错误它接不住，要在源头处理。边界按功能块放置，记录错误后提供重试或退出，而不是只有一个根级白屏。可预期的业务失败用状态表达，不要 throw。Suspense 处理等待，Error Boundary 处理失败，两者通常一起包在数据子树外。`,
            [
                {
                    question: '为什么事件处理里的 throw 不会被边界接住？',
                    direction:
                        '事件在 commit 之后执行，已经离开渲染；需要本地 try/catch 或统一错误处理。',
                },
                {
                    question: '怎样重试一个失败的子树？',
                    direction: '改变 Error Boundary 的 key 或内部 reset 状态，让子树重新挂载。',
                },
                {
                    question: 'Suspense 和 Error Boundary 谁包在外？',
                    direction:
                        '常见是外层错误边界、内层 Suspense，这样 pending 和 rejected 各走各的 UI。',
                },
                {
                    question: '函数组件能当错误边界吗？',
                    direction: '目前需要 class 或封装好的库；Hooks 没有等价的渲染错误捕获。',
                },
            ],
        ),
        pitfalls: [
            '只在根上放一个边界，局部组件一崩整页替换。',
            '把接口业务错误 throw 出去，用户只能看到通用失败页。',
            '以为 try/catch 包住 JSX 就能代替 Error Boundary。',
        ],
    },
    {
        slug: 'vue-router-reuse',
        module: 'vue',
        title: 'Vue Router：复用、key 与导航守卫',
        summary: '同组件切参数默认不重建实例，要靠 watch、key 或守卫重新拉数。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['Vue Router', 'key', '导航守卫'],
        overview:
            '路由参数变了但组件类型没变时，Vue 会复用实例。这是性能优化，也是“页面不刷新、数据还是上一篇”的根因。',
        body: createReviewBody(
            `## 复用规则

\`/article/1\` 和 \`/article/2\` 若都渲染 \`ArticlePage\`，默认复用同一实例：\`setup\` / \`onMounted\` 不会再跑，本地 state、滚动位置、请求序号都还在。必须在 \`watch(() => route.params.slug)\` 里重新获取数据，并重置页内状态。

需要完整重建时，给 \`<RouterView>\` 或页面根节点加 \` :key="route.fullPath"\`。key 变了等于换身份，和列表 key 同一套机制。不要无脑给所有页面加 fullPath，列表筛选项进 query 时会误拆实例。

## 守卫

- \`beforeEach\`：全局鉴权、登录跳转，应尽快结束，不要在这里做重 IO
- \`beforeEnter\` / 组件内 \`onBeforeRouteLeave\`：离开前提示未保存
- \`afterEach\`：埋点、改标题，不能取消导航

守卫里返回 \`false\` 取消，返回地址对象重定向。异步守卫要处理重复点击和过期导航，避免后到的校验结果打断当前页。

重定向和别名要能讲清：用户最终 URL 是什么，组件实际匹配哪条记录。\`params\` 丢失通常是声明了 path 参数却用 \`name\` 跳转时没带齐。

## 和 KeepAlive

\`<KeepAlive><RouterView /></KeepAlive>\` 缓存的是页面实例。切走进入 \`onDeactivated\`，不是 \`onUnmounted\`。参数变化仍可能复用缓存实例，所以缓存页也要 watch 路由。\`max\`、\`include\` 按路由 name 控制，避免整站页面常驻。

滚动行为用 \`scrollBehavior\` 显式处理：回退恢复位置，新导航回到顶部。不要假设浏览器会自动做对。`,
            `Vue Router 在组件类型不变时复用实例，params 变化不会自动重跑 onMounted。要么 watch 路由重新拉数并重置状态，要么用 key 强制重建。导航守卫负责鉴权、拦截未保存离开和重定向，afterEach 不能取消导航。KeepAlive 只是缓存实例，停用后副作用要自己暂停，缓存页同样要响应参数变化。`,
            [
                {
                    question: '为什么从文章 1 点到文章 2 内容不变？',
                    direction: '同一页面组件被复用，请求写在 onMounted 里不会再执行。',
                },
                {
                    question: '什么时候用 key，什么时候用 watch？',
                    direction:
                        '只要换数据、希望保留少量 UI 用 watch；输入框、定时器必须卸干净时用 key。',
                },
                {
                    question: 'beforeEach 里能不能请求用户信息？',
                    direction: '可以，但要缓存结果并处理超时；每次导航都打网会拖慢切页。',
                },
                {
                    question: 'KeepAlive 的页面为什么定时器还在跑？',
                    direction:
                        '实例没卸载，只是 deactivated；要在 onDeactivated 里停，在 onActivated 里恢复。',
                },
            ],
        ),
        pitfalls: [
            '只在 onMounted 拉详情，导致同路由不同 id 不刷新。',
            '给 RouterView 一律绑 fullPath，query 微调也销毁整页。',
            '在 afterEach 里做鉴权，导航已经完成无法取消。',
        ],
    },
    {
        slug: 'stacking-context-positioning',
        module: 'css',
        title: '定位、包含块与层叠上下文',
        summary: '先确定参照谁定位，再解释 z-index 为什么有时“加再大也不上去”。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['定位', '层叠上下文', 'z-index'],
        overview:
            '绝对定位看包含块，固定定位看视口（或变换过的祖先），sticky 在最近滚动祖先里吸附。z-index 只在同一个层叠上下文里比大小。',
        body: createReviewBody(
            `## 定位

- \`static\`：正常文档流，\`top/left\` 无效
- \`relative\`：占原来的位置，偏移只影响自己，给绝对定位子孙当包含块
- \`absolute\`：脱离文档流，相对于最近的非 static 祖先；找不到就相对初始包含块
- \`fixed\`：相对视口，但祖先有 \`transform\`、\`filter\`、\`perspective\`、\`will-change\` 等时，会改成相对该祖先
- \`sticky\`：在滚动容器里，到达阈值前像 relative，到达后像吸附；父级 \`overflow: hidden\` 常让它失效

百分比 \`top/height\` 相对包含块的高度。绝对定位的包含块是最近定位祖先的 padding box。\`width: auto\` 的绝对定位元素由左右偏移和内容共同决定，不是“永远缩成内容宽”。

## 层叠上下文

层叠上下文是一叠独立的“图层组”。组内按规则比，组和组之间先比整组，不能把子元素抽出来和外面比 \`z-index\`。

会新建层叠上下文的包括：根元素、\`position\` 非 static 且 \`z-index\` 不是 auto、\`opacity < 1\`、\`transform\` / \`filter\` 不为 none、\`isolation: isolate\`、某些 \`fixed\`、flex/grid 子项的 \`z-index\` 等。

同一上下文里的大致顺序：背景与边框 → 负 z-index → 普通流 → 浮动 → 定位且 z-index:auto → 正 z-index。数字只在这一层有效。父级 \`z-index: 1\` 时，子级写 \`9999\` 也超不过旁边 \`z-index: 2\` 的兄弟上下文。

弹层、吸顶导航、对话框要先找自己被关在哪个上下文里，再决定是提高祖先、把节点传送到 \`body\`，还是用 \`isolation\` 明确隔离，而不是无脑加大数字。`,
            `定位先问包含块：relative 占位并偏移，absolute 相对最近定位祖先，fixed 通常相对视口但会受 transform 等影响，sticky 依赖滚动祖先且常被 overflow 打断。z-index 不是全局比赛，只在同一个层叠上下文里比较；opacity、transform、定位加 z-index 都会开新上下文，子元素再大也出不去。弹层问题先找上下文边界，再考虑 Portal 或调整祖先。`,
            [
                {
                    question: '为什么 fixed 的弹层跟着页面一起滚？',
                    direction: '某个祖先设置了 transform 或 filter，fixed 的包含块变成了这个祖先。',
                },
                {
                    question: 'sticky 不吸顶最常见的原因？',
                    direction:
                        '父级 overflow 不是 visible，或祖先高度刚好等于 sticky 元素，没有滚动空间。',
                },
                {
                    question: '子元素 z-index:9999 为什么还在遮罩下面？',
                    direction: '它和遮罩不在同一层叠上下文，要比的是两边祖先的整组顺序。',
                },
                {
                    question: 'isolation: isolate 解决什么？',
                    direction: '强制创建层叠上下文，把内部 z-index 限制在组件内，避免污染外部。',
                },
                {
                    question: '绝对定位的百分比相对谁？',
                    direction:
                        '相对包含块的 padding box，不是相对自身父级内容，除非父级正好是包含块。',
                },
            ],
        ),
        pitfalls: [
            '把 z-index 当成全局层级，数字越加越大。',
            '在 overflow:hidden 的卡片里写 sticky，却以为浏览器坏了。',
            '给 fixed 容器的祖先加动画 transform，弹层定位全部错位。',
        ],
    },
]
