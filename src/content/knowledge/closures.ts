import type { Article } from "../articles";

export const closureArticle: Article = {
  id: "K01-02", kind: "knowledge", domainSlug: "javascript", slug: "closures",
  title: "作用域、闭包与生命周期",
  summary: "沿着变量查找与函数执行的过程，理解闭包为何成立、状态如何共享，以及回调为什么会延长数据的生命周期。",
  aliases: ["closure", "closures", "闭包", "lexical scope"],
  tags: ["JavaScript", "作用域", "生命周期"], estimatedMinutes: 25, verifiedAt: "2026-09-30",
  sections: [
    {
      id: "problem", title: "从一个问题开始：函数已经返回，变量为什么还在？",
      paragraphs: [
        "假设要给上传任务生成连续编号。我们希望每个队列都有自己的编号，而不是把计数器放在全局变量里，让所有队列互相影响。最直接的做法是：调用一个函数，创建计数状态，再返回一个负责取号的函数。",
        "下面的代码都可以单独运行在现代浏览器控制台，或 Node.js 20 及以上版本。代码块中的输出注释对应完整示例；每个示例之间互不依赖。先观察结果，再解释为什么会得到它。",
      ],
      examples: [{ code: `function createSequence() {
  let sequence = 0;
  return function next() {
    sequence += 1;
    return sequence;
  };
}

const next = createSequence();
console.log(next()); // 1
console.log(next()); // 2`, expectedOutput: ["1", "2"], explanation: [
        "执行 const next = createSequence() 时，createSequence 的调用已经结束。第二行 next() 执行时，并没有重新调用 createSequence；sequence 却没有重新变成 0。它仍然是前一次调用中创建、随后被 next 使用的那份状态。",
        "这里需要分清两个问题：next 到哪里寻找 sequence？那份 sequence 为什么在外层调用结束后仍能访问？作用域回答前一个问题，闭包与可达性解释后一个问题。只背“函数嵌套函数”无法解释这个过程。",
      ] }],
    },
    {
      id: "scope-basics", title: "作用域：先确定一个名字属于哪里",
      paragraphs: [
        "作用域描述一个标识符在代码的哪些位置可见。全局、模块、函数、块都可能建立不同的名字边界；它不是对象里的属性集合，也不是屏幕上看到的一对任意大括号。对象字面量的大括号不会为属性值表达式创建块作用域。",
        "函数参数和函数内部的局部声明属于该次函数执行的环境；let、const 声明还受所在块约束。var 不受普通 if 或 for 块限制，通常归入外层函数作用域。下面先在同一个函数内比较它们。",
      ],
      examples: [{ code: `function inspectScope() {
  var label = 'function';
  if (true) {
    var label = 'changed';
    const detail = 'block';
    console.log(label, detail); // changed block
  }
  console.log(label); // changed
  try {
    console.log(detail);
  } catch (error) {
    console.log(error.name); // ReferenceError
  }
}
inspectScope();`, expectedOutput: ["changed block", "changed", "ReferenceError"], explanation: [
        "块内的 var label 没有建立第二个 label，它修改了函数中原有的绑定。detail 则只在块内可见，出了块后查不到这个名字，访问时抛出 ReferenceError。",
        "模块顶层声明也有自己的边界，不会仅因为写在文件最外层就自动变成 window 的属性。传统浏览器脚本与 ES 模块的顶层规则有差异，因此排查变量来源时要先确认运行方式。本文后续示例主要使用函数局部变量，避免把模块差异混进闭包问题。",
      ] }],
    },
    {
      id: "mechanism", title: "词法作用域：看创建位置，不沿调用者查找",
      paragraphs: [
        "所谓词法作用域，是名字查找由代码的词法嵌套关系约束。执行函数时，先查自己的环境；没找到，再沿它关联的外层环境继续查找。沿链找到最近的同名绑定就停止，不会把内外两份同名变量合并。",
        "调用栈回答“现在是谁调用了谁”，作用域链回答“这个名字往哪里查”。两个关系可能恰好相似，也可能完全不同。把一个函数传到另一个函数中执行，最容易看出这个区别。",
      ],
      examples: [{ code: `function createReader() {
  const label = 'creator';
  return function read() {
    return label;
  };
}

function invoke(reader) {
  const label = 'caller';
  console.log(label); // caller
  console.log(reader()); // creator
}

invoke(createReader());`, expectedOutput: ["caller", "creator"], explanation: [
        "read 的函数对象在 createReader 这次执行中创建，它关联的是那个环境。invoke 自己也声明了 label，但这个 label 不在 read 的外层词法链上，所以不能参与 read 的名称解析。",
        "执行 reader() 时，调用栈里有 invoke 和 read；可 read 查 label 走的是 read → 创建它的 createReader 环境 → 更外层环境。调用者换了，创建时关联的环境并没有换。这也是把同一个回调交给不同组件仍能使用原配置的基础。",
      ] }],
      diagram: { caption: "调用路径与名称查找路径是两种关系", lines: ["调用路径：invoke → read", "名称查找：read 的局部环境 → createReader 的环境（label = creator）→ 外层环境", "invoke 的 label = caller 不在这条名称查找路径中"] },
    },
    {
      id: "environments", title: "代码结构是静态的，执行环境却有不同实例",
      paragraphs: [
        "看源码就能知道 read 写在 createReader 内部，这种嵌套关系不会因为调用顺序变化而改变。但每次调用 createReader，参数和局部变量都会产生本次调用对应的状态。不能把“一段函数源码”理解成“永远只有一份局部变量”。",
        "下面的工厂函数源码只有一份，返回的两个函数却关联不同的 prefix。这种动态创建环境实例的行为，没有把 JavaScript 变成动态作用域语言：每个函数仍然沿自己创建时关联的词法环境查找。",
      ],
      examples: [{ code: `function createFormatter(prefix) {
  return function format(value) {
    return prefix + ':' + value;
  };
}

const formatPhoto = createFormatter('photo');
const formatVideo = createFormatter('video');
console.log(formatPhoto(7)); // photo:7
console.log(formatVideo(7)); // video:7
console.log(formatPhoto === formatVideo); // false`, expectedOutput: ["photo:7", "video:7", "false"], explanation: [
        "第一次调用产生 prefix 为 photo 的环境和一个 format 函数对象；第二次调用产生另一份环境和另一个函数对象。函数体长得一样，不代表函数对象身份一样，更不代表外部状态一样。",
        "可以把源码想成制造方式，把每次调用得到的状态想成具体实例。这个区分能解释独立计数器、按配置生成回调、以及为什么同一段代码创建出的处理器可能表现不同。",
      ] }],
    },
    {
      id: "closure", title: "闭包如何成立：把函数创建、返回、调用分开看",
      paragraphs: [
        "闭包可以理解为函数以及它关联的外层词法环境。关键是函数创建时的环境关联，而不是必须等到 return 那一行才突然产生一种新语法。即使内层函数立即调用，或被存入数组、注册为回调，它也可以使用外层绑定。",
        "回到最开始的取号函数。第一步，调用 createSequence，建立本次调用的环境并初始化 sequence。第二步，创建 next 函数对象，让它关联当前环境。第三步，把 next 返回给调用方，createSequence 的本次调用结束。第四步，稍后调用 next，它自己的执行环境沿外层关联找到原来的 sequence，并更新它。",
        "next 第二次调用会重新建立它自己的本次调用环境，却不会重新初始化 createSequence 中的 sequence。初始化代码属于外层工厂调用；只调用 next，执行的只是 next 的函数体。因此输出从 1 变成 2。",
      ],
      diagram: { caption: "外层函数返回后，仍存在访问状态的路径", lines: ["调用方的 next 变量", "    ↓ 引用", "返回的 next 函数对象", "    ↓ 关联外层环境", "createSequence 本次调用的状态：sequence", "", "再次执行 next：读取这份 sequence → 加一 → 写回"] },
    },
    {
      id: "bindings", title: "闭包关联的是绑定，不是创建时的数值快照",
      paragraphs: [
        "绑定是一个名字与其存储值之间的关系。闭包使用外层名字时，读取的是那份绑定在执行当时的值。若有人修改了同一份绑定，后续读取会看到修改；不会因为函数创建得早，就永远记住初始数字。",
        "如果业务需要某一时刻的值，就要显式保存到另一份绑定中。下面把持续变化的 version 和当时保存的 capturedVersion 放在同一个例子里比较。",
      ],
      examples: [{ code: `function createVersionReader() {
  let version = 1;
  const capturedVersion = version;
  return {
    update(value) { version = value; },
    current() { return version; },
    captured() { return capturedVersion; },
  };
}

const reader = createVersionReader();
reader.update(2);
console.log(reader.current()); // 2
console.log(reader.captured()); // 1`, expectedOutput: ["2", "1"], explanation: [
        "current 查到 version，其值已被 update 改成 2。captured 查到另一个绑定 capturedVersion，它在初始化时得到数字 1，之后没有变化。两种行为都来自闭包；差异在于读取哪份绑定。",
        "如果保存的是对象，const captured = object 只保存同一个对象的引用，不能冻结对象内容。修改 object.name 仍可能被 captured.name 看到。需要历史快照时，应根据数据结构选择复制或不可变更新策略，不能把 const 或闭包误当成深拷贝。",
      ] }],
    },
    {
      id: "shared-state", title: "多个函数可以共享状态，多个工厂调用可以彼此独立",
      paragraphs: [
        "同一次外层调用中创建的函数，可以访问同一份外层状态。若把读取和修改分成两个方法，它们并不是各自复制一个计数值。一个方法写入，另一个方法就能读到更新。",
        "另一方面，再调用一次工厂会建立另一份局部状态。判断是否共享，不应数函数有几个，而要追踪这些函数最终关联的是不是同一次调用产生的绑定。",
      ],
      examples: [{ code: `function createQueueCounter() {
  let count = 0;
  return {
    add() { count += 1; },
    read() { return count; },
  };
}

const photos = createQueueCounter();
const videos = createQueueCounter();
photos.add();
photos.add();
console.log(photos.read()); // 2
console.log(videos.read()); // 0`, expectedOutput: ["2", "0"], explanation: [
        "photos.add 与 photos.read 共享第一次调用中的 count；videos 的方法关联第二次调用中的 count。因此 photos 增加两次不会影响 videos。",
        "这种写法限定了修改入口：外部无法直接通过 photos.count 改动局部变量。但它不是安全沙箱或加密存储。如果方法返回内部可变对象的引用，调用方仍可能绕过预期入口修改对象。封装边界要检查暴露出来的数据，而不只是变量是否写在函数内部。",
      ] }],
    },
    {
      id: "loops", title: "循环中的 var 与 let：问题在于是否共享同一份绑定",
      paragraphs: [
        "经典的循环回调问题通常和 setTimeout 一起出现，容易让人以为原因是定时器。先把定时器拿掉：只保存回调，等循环全部结束后再调用。这样能单独观察绑定的共享关系。",
      ],
      examples: [
        { code: `function buildCallbacks() {
  const callbacks = [];
  for (var index = 0; index < 3; index += 1) {
    callbacks.push(() => index);
  }
  return callbacks;
}
console.log(buildCallbacks().map(read => read()).join(',')); // 3,3,3`, expectedOutput: ["3,3,3"], explanation: [
          "var index 属于 buildCallbacks 的函数作用域。三个箭头函数关联同一个 index 绑定。循环退出时 index 已变成 3，之后再调用任意一个回调，读到的都是 3。回调创建了三次，但 index 没有因此变成三份。",
        ] },
        { code: `function buildCallbacks() {
  const callbacks = [];
  for (let index = 0; index < 3; index += 1) {
    callbacks.push(() => index);
  }
  return callbacks;
}
console.log(buildCallbacks().map(read => read()).join(',')); // 0,1,2`, expectedOutput: ["0,1,2"], explanation: [
          "for 头部用 let 声明 index 时，循环为不同迭代建立对应的绑定。回调分别关联创建它时那次迭代的 index，因此循环结束后仍能读到 0、1、2。这里不能只说“let 是块作用域”：每次迭代的绑定才是区分三个回调的关键。",
          "也可以在 var 循环的循环体中写 const current = index，再让回调读取 current；或者调用一个工厂函数把 index 作为参数传入。两种方案都显式创建了每次执行自己的绑定。若把 let index 声明在循环外，再写 for (; index < 3; index += 1)，回调仍共享外部那一份 index，并不会得到每次迭代的独立绑定。",
        ] },
      ],
    },
    {
      id: "initialization", title: "能找到变量，不代表此刻可以读取：暂时性死区",
      paragraphs: [
        "名称解析和初始化是两个步骤。let、const 的绑定在相应环境建立后存在，但在执行到初始化之前不能读取。闭包可以先被创建，真正执行时若外层绑定还未初始化，仍会触发 ReferenceError。",
        "这也是“函数写在变量声明前面就不能访问它”不够准确的原因。决定成败的是执行到读取那一刻，目标绑定是否已初始化，而不只是源码中谁写在前面。",
      ],
      examples: [{ code: `function demonstrateTDZ() {
  const read = () => value;
  try {
    console.log(read());
  } catch (error) {
    console.log(error.name); // ReferenceError
  }
  let value = 8;
  console.log(read()); // 8
}
demonstrateTDZ();`, expectedOutput: ["ReferenceError", "8"], explanation: [
        "创建 read 时并没有执行箭头函数体，因此不会读取 value。第一次调用才开始读取，此时 value 仍在暂时性死区。初始化为 8 后再次调用，就能正常返回。闭包并不会绕过初始化规则。",
        "如果当前块中存在同名 let 声明，即使外层也有已初始化变量，当前绑定仍会遮蔽外层。读到未初始化的内层绑定就报错，不会因为它暂时不能用而继续向外寻找一个备用值。",
      ] }],
    },
    {
      id: "async", title: "异步回调为什么读到后来修改的值？",
      paragraphs: [
        "异步改变的是执行时机，闭包决定的是变量来源。回调排入队列后，外层代码通常还会继续运行。如果它修改了回调使用的绑定，那么回调真正执行时就读到新值。没有发生“异步导致闭包失效”。",
        "用微任务可以复现这种情况。当前同步代码会先完成，随后 Promise 回调执行。下面同时展示读取持续变化的状态与保留本次请求参数的差别。",
      ],
      examples: [{ code: `let query = 'first';
const requestedQuery = query;

Promise.resolve().then(() => {
  console.log(query); // second
  console.log(requestedQuery); // first
});
query = 'second';`, expectedOutput: ["second", "first"], explanation: [
        "回调创建时 query 的值是 first，但创建回调没有冻结 query。同步赋值把它改成 second 后，微任务才读取这份绑定。requestedQuery 则是另一个没有被修改的字符串绑定，所以仍为 first。",
        "真实请求处理中，可以为每次请求建立局部参数和请求标识。局部参数记录请求针对什么，标识用于判断结果是否仍属于当前有效请求。闭包能帮助保留身份，却不能自行解决响应乱序；仍需明确的取消或过期结果过滤逻辑。",
        "还有一种容易混淆的情况：函数组件每次渲染会创建本次渲染的局部绑定。旧渲染的回调仍关联旧绑定，因此可能读到旧状态。普通的共享变量示例与多次渲染的环境实例不同；不要简单总结成“闭包总读最新值”或“闭包总读旧值”。先判断到底是哪份绑定。",
      ] }],
    },
    {
      id: "application", title: "工程中的使用方式：带配置的函数与明确的状态入口",
      paragraphs: [
        "闭包适合把一次确定的配置留给后续动作，例如创建带命名空间的日志函数、生成字段校验器、为同一组操作提供局部状态。它让“操作”和“操作需要的数据”一起传递，不必把配置暴露到全局。",
        "下面生成一个固定扩展名的文件名校验函数。工厂阶段处理配置，执行阶段只接收要校验的文件名。例子只用于说明环境关联，并不承担文件安全验证。",
      ],
      examples: [{ code: `function createExtensionChecker(extension) {
  const suffix = '.' + extension.toLowerCase();
  return function check(filename) {
    return filename.toLowerCase().endsWith(suffix);
  };
}

const isImage = createExtensionChecker('PNG');
console.log(isImage('avatar.png')); // true
console.log(isImage('notes.txt')); // false`, expectedOutput: ["true", "false"], explanation: [
        "suffix 在工厂中计算一次，后续 check 使用同一份配置。调用方只需要持有 isImage，不必同时传递 extension。若需要另一种扩展名，再调用工厂获得另一个配置实例即可。",
        "当行为很少、状态边界清楚时，这种函数组合比较直接。若一个对象需要许多方法、实例身份或复杂生命周期，类或普通对象也可能更容易组织。不要为了展示闭包，把所有状态都藏进多层嵌套函数。",
      ] }],
    },
    {
      id: "lifetime", title: "生命周期：调用结束与状态可回收不是一回事",
      paragraphs: [
        "函数返回意味着这次调用不再执行，它在调用栈中的执行上下文会退出；这不等于它使用过的所有数据都立即释放。只要仍有可达路径能通过某个函数访问那份状态，程序之后就可能继续用到它。",
        "回收要看可达性。长期存在的事件目标、定时任务、订阅系统或缓存都可能持有回调，回调又可能访问较大的数据。即使你删除了一个局部引用，另一条持有路径仍可能存在。闭包不是内存泄漏的同义词；不再需要的数据仍被长期引用，才是要排查的问题。",
        "下面使用标准 EventTarget 演示注册与释放。它无需页面 DOM，现代浏览器和上述 Node.js 环境都可运行。dispose 同时移除监听并清空可变绑定里的数据，便于在仍持有 dispose 函数时也断开这条数据引用。",
      ],
      examples: [{ code: `function attachSession(target, session) {
  let activeSession = session;
  const onRefresh = () => {
    if (activeSession !== null) console.log(activeSession.label);
  };
  target.addEventListener('refresh', onRefresh);
  return function dispose() {
    target.removeEventListener('refresh', onRefresh);
    activeSession = null;
  };
}

const target = new EventTarget();
const dispose = attachSession(target, { label: 'photo-queue' });
target.dispatchEvent(new Event('refresh')); // photo-queue
dispose();
target.dispatchEvent(new Event('refresh')); // 不再输出`, expectedOutput: ["photo-queue"], explanation: [
        "注册后有一条路径：target → 监听器 onRefresh → activeSession → 会话对象。页面或组件不再需要这次会话时，仅仅从原业务变量中移除它，并不能保证事件目标上的监听器也消失。",
        "移除监听时必须提供原来的函数对象。重新写一个看起来相同的箭头函数，不会与已注册函数具有同一身份。更复杂的生命周期还应管理定时器、订阅与缓存；一个清理函数只负责它自己建立的资源，不能替其他持有者释放引用。",
        "清理后也不要宣称“对象马上被垃圾回收”。是否仍有其他引用、引擎何时回收，都不由 dispose 直接保证。工程上验证的是持有路径是否解除、无效回调是否停止；观察内存趋势时应结合重复挂载与释放、堆快照和实际可达路径。",
      ] }],
    },
    {
      id: "pitfalls", title: "规范、调试器与内存布局：不要把观察结果当成语言保证",
      paragraphs: [
        "解释行为时，可以用“函数关联外层环境”的模型。ECMAScript 使用环境记录及外层关联来描述名字解析，普通 ECMAScript 函数通过内部槽 [[Environment]] 关联创建时的环境。这是规范语义，不是要求每个引擎照着画一套物理内存结构。",
        "Chrome 开发者工具展开函数时可能显示 [[Scopes]]、Closure 等调试信息。它们有助于观察，但不是可以通过 fn['[[Scopes]]'] 读取的标准 JavaScript 属性，也不是所有浏览器都必须提供的统一接口。优化、执行位置与调试状态都可能影响可见内容。",
        "因此，“返回时把所有需要变量复制到堆里”只能算一个容易误导的类比。返回不是环境关联产生的必要时机，复制数值也解释不了共享可变绑定。不要根据某一次调试器显示，断言所有未引用局部变量必定立即回收，或断言所有外层变量必定永久保留。",
        "直接调用 eval 会让字符串代码在当前上下文中参与名字查找，使静态分析与优化更困难；间接 eval 则在全局上下文中执行。这个差异不能推出“间接 eval 不会有闭包”。实际代码应优先使用明确的数据解析与函数接口，不用 eval 作为观察闭包的必要工具，更不能执行不可信字符串。",
        "同样，this 与普通局部变量不是同一套查找规则。普通函数的 this 取决于调用方式等规则；箭头函数则使用外层 this。闭包保存外层变量访问能力，并不意味着给普通函数换一种调用方式就不会改变 this。",
      ],
    },
    {
      id: "recall", title: "遇到一段新代码，按这四步推导",
      paragraphs: [
        "第一步，标出声明边界。逐个识别参数、var、let、const 属于哪个函数或块，有没有同名遮蔽，以及读取时是否已初始化。先处理名字属于哪里，再讨论数值是多少。",
        "第二步，标出函数创建时机。每调用一次工厂，会创建哪份状态、哪些函数？这些函数关联同一次外层调用，还是不同调用？同一行源码重复执行，也可能创建不同的函数对象。",
        "第三步，沿执行顺序更新绑定。哪些操作会修改它？回调什么时候才读取？读取的是持续变化的绑定、另存的值，还是某次渲染对应的绑定？循环和异步问题都能落到这一步。",
        "第四步，检查谁持有函数和数据。外层调用结束不代表可达路径消失；组件卸载、任务取消或功能关闭时，应解除自己建立的监听、订阅和缓存关系。把调用栈、名称查找与资源生命周期分别画清楚，才能同时解释输出和清理责任。",
        "再回看开头的取号函数：next 关联第一次 createSequence 调用中的 sequence；两次执行 next 都修改这一份绑定；另一次调用 createSequence 会产生独立状态。只要仍能访问 next，这条状态访问路径就存在。到这里，闭包就不再是一个定义，而是一套可用来推导代码行为的方法。",
      ],
    },
  ],
  sources: [
    { title: "ECMAScript：环境记录", url: "https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-environment-records" },
    { title: "ECMAScript：OrdinaryFunctionCreate", url: "https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinaryfunctioncreate" },
    { title: "MDN：Closures", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures" },
    { title: "MDN：let 与暂时性死区", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let" },
    { title: "MDN：for 的逐次迭代绑定", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for" },
    { title: "MDN：eval", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval" },
  ],
};
