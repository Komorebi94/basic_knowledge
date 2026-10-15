import type { Article } from "../articles";

export const streamsBackpressureArticle: Article = {
  "revision": 2,
  id: "K14-03",
  kind: "knowledge",
  domainSlug: "server",
  slug: "streams-backpressure-and-release",
  title: "流、背压与资源释放",
  summary: "用有限队列接收笔记附件的分块，队列满时停下，关闭后取完剩余块，释放时丢掉还没读的块。",
  aliases: ["stream", "backpressure", "readable", "背压"],
  tags: ["服务端", "流", "资源"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-15",
  sections: [
    {
      id: "problem",
      title: "附件只有几兆，为什么读进一个字符串之后进程仍会撑住？",
      paragraphs: [
        "笔记附件先被拼成一个完整字符串，校验通过后再写入存储。文件比预期大，或者同时有几个下载时，峰值内存是所有未处理字节的总和，而不是用户正在看的那一块。读得比写得快时，中间缓冲会一直涨。",
        "前半篇先用固定字符串队列解释背压与释放；后面在 Node 22 的真实 Stream 中运行 write/drain、pipeline 与取消。内存流没有磁盘权限和持久性保证，文件提交还需独立验收。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：容量为 2 的队列，块是非空字符串",
      paragraphs: [
        "运行 npm run verify:k14。push 在已释放时返回 released，已关闭时返回 closed，空块返回 invalid，长度达到容量返回 backpressure。pull 在空队列且未关闭时返回 wait，关闭后返回 done。",
        "release 先数出队列里还没读的块，再清空，并让之后的 push 和 pull 都返回 released。容量 2 和块 aa、bb、cc 只属于这个模型。整段缓冲的上限 4 是字符数，不是磁盘配额。"
      ]
    },
    {
      id: "queue",
      title: "队列满了必须停，关闭只是不再接收，不是把剩余块扔掉",
      paragraphs: [
        "aa、bb 依次入队。第三块 cc 得到 backpressure，此时队列仍是 aa、bb。取出 aa 之后才能把 cc 放进来。close 返回 closing，之后再 push 是 closed，但已经在队列里的 bb 和 cc 仍可取出，取空后是 done。",
        "全部取完再 release，剩余块数是 0。另一条管道在 aa、bb 都还没读时 release，剩余块数是 2，随后的 pull 是 released，那两块不会再被读到。停下生产和丢掉未读数据是两件事。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function createPipe(capacity) {
  const queue = [];
  let closed = false;
  let released = false;
  return {
    push(chunk) {
      if (released) return 'released';
      if (closed) return 'closed';
      if (typeof chunk !== 'string' || chunk.length === 0) return 'invalid';
      if (queue.length >= capacity) return 'backpressure';
      queue.push(chunk);
      return 'queued:' + queue.length;
    },
    pull() {
      if (released) return 'released';
      if (queue.length === 0) return closed ? 'done' : 'wait';
      return 'data:' + queue.shift();
    },
    close() {
      if (released) return 'released';
      closed = true;
      return 'closing';
    },
    release() {
      released = true;
      const leftover = queue.length;
      queue.length = 0;
      return 'released:' + leftover;
    },
  };
}
const pipe = createPipe(2);
console.log('入队:' + pipe.push('aa'));
console.log('再入:' + pipe.push('bb'));
console.log('堵住:' + pipe.push('cc'));
console.log('取出:' + pipe.pull());
console.log('补入:' + pipe.push('cc'));
console.log('关闭:' + pipe.close());
console.log('继续:' + pipe.pull() + '/' + pipe.pull() + '/' + pipe.pull());
console.log('关闭后再写:' + pipe.push('zz'));
console.log('释放:' + pipe.release() + '/' + pipe.pull());
const stuck = createPipe(2);
stuck.push('aa');
stuck.push('bb');
console.log('未读释放:' + stuck.release() + '/' + stuck.pull());`,
          expectedOutput: [
            "入队:queued:1",
            "再入:queued:2",
            "堵住:backpressure",
            "取出:data:aa",
            "补入:queued:2",
            "关闭:closing",
            "继续:data:bb/data:cc/done",
            "关闭后再写:closed",
            "释放:released:0/released",
            "未读释放:released:2/released"
          ],
          explanation: [
            "cc 在队列满时没有进入。取出 aa 腾出位置后，cc 才排在 bb 后面。close 不再收 zz，已经入队的两块仍按原顺序读出。",
            "第一条管道释放时队列已空。第二条在两块都未读时释放，返回的 2 是被丢掉的块数，之后不能再 pull 到 aa 或 bb。"
          ]
        }
      ]
    },
    {
      id: "memory",
      title: "整段拼起来会越过上限，逐块处理只留住当前一块",
      paragraphs: [
        "bufferAll 把每块长度累加，总和超过 4 就返回 exceeded，不再继续假装已经收下整个附件。aa 加 bb 刚好是 4，返回 buffered:4。三块一起是 6，返回 exceeded:6。",
        "holdOne 每一步只把 held 换成当前块的长度，seen 仍累计看过的总量。三块走完是 held:2/seen:6。峰值停留在一块的大小，总量仍然可记账。这不等于文件已经被安全写入，只说明处理方没有同时保存所有块。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function bufferAll(chunks, limit) {
  let total = 0;
  for (const chunk of chunks) {
    total += chunk.length;
    if (total > limit) return 'exceeded:' + total;
  }
  return 'buffered:' + total;
}
function holdOne(chunks) {
  let held = 0;
  let seen = 0;
  for (const chunk of chunks) {
    held = chunk.length;
    seen += chunk.length;
  }
  return 'held:' + held + '/seen:' + seen;
}
const chunks = ['aa', 'bb', 'cc'];
console.log('整段:' + bufferAll(chunks, 4));
console.log('刚好:' + bufferAll(['aa', 'bb'], 4));
console.log('逐块:' + holdOne(chunks));`,
          expectedOutput: [
            "整段:exceeded:6",
            "刚好:buffered:4",
            "逐块:held:2/seen:6"
          ],
          explanation: [
            "第三块让总和从 4 变成 6，整段缓冲在这里失败。刚好 4 个字符仍被接受，上限用的是大于而不是大于等于。",
            "逐块处理看过 6 个字符，但 held 只剩最后一块的 2。调用方若把每一块再推进自己的数组，峰值就会回到整段缓冲。"
          ]
        }
      ]
    },
    {
      id: "release",
      title: "背压保护下游，释放处理的是不再需要的上游",
      paragraphs: [
        "生产方看到 backpressure 应停止读取下一块，等消费方 pull 之后再继续。若生产方无视返回值继续读文件，队列外面仍会堆数据，模型里的上限就没有意义。",
        "用户取消下载或连接断开时调用 release，而不是只 close。close 承诺把已接收的块交付完；release 明确放弃这些块。两者之后都不能再写入。真实文件描述符、socket 和解析器也要在同一条失败路径里关闭，避免只清空数组、留下打开的句柄。"
      ]
    },
    {
      id: "boundaries",
      title: "这个队列不是 Node Stream，字符数也不是字节或背压水位",
      paragraphs: [
        "模型同步返回 backpressure，没有 pause、resume 或异步 drain。Node 的可读流、Web Streams 的 desiredSize 和 highWaterMark 各有自己的单位与时机。不能把 queued:2 说成某个版本的默认水位。",
        "块长度按 JavaScript 字符串的 UTF-16 码元计算。附件的字节数、压缩和多字节字符都可能不同。上限 4 只让例子稳定。",
        "holdOne 没有把块写到磁盘。seen 只是计数。真正的复制仍要确认写入完成、失败时删除半份文件，并在取消时停止来源。"
      ]
    },
    {
      "id": "node-pipeline",
      "title": "真实 Node pipeline：成功等待 finish，失败销毁两端",
      "paragraphs": [
        "下面使用 Node 22 的 node:stream 与 stream/promises，在内存中构造真正的 Readable、Writable，不打开磁盘文件。写入回调经微任务完成，pipeline 负责串接背压、失败传播和清理。回调中的成功表示这一块已被消费，不是“开始写就算完成”。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { Readable, Writable } from 'node:stream';\nimport { pipeline } from 'node:stream/promises';\nconst chunks = [];\nconst source = Readable.from(['aa', 'bb'], { objectMode: false });\nconst sink = new Writable({ highWaterMark: 1, write(chunk, _encoding, done) { chunks.push(chunk.toString()); queueMicrotask(done); } });\nawait pipeline(source, sink);\nconsole.log(chunks.join(''));\nconsole.log('完成:' + sink.writableFinished);\nconst failedSource = Readable.from(['first', 'second']);\nconst failedSink = new Writable({ write(_chunk, _encoding, done) { done(new Error('disk-unavailable')); } });\ntry { await pipeline(failedSource, failedSink); }\ncatch (error) { console.log('失败:' + error.message); }\nconsole.log('已销毁:' + (failedSource.destroyed && failedSink.destroyed));",
          "expectedOutput": [
            "aabb",
            "完成:true",
            "失败:disk-unavailable",
            "已销毁:true"
          ],
          "explanation": [
            "成功路径在 aa、bb 的写入回调都结束且 Writable finish 后才兑现，所以拼接为 aabb、writableFinished 为 true。低水位限制缓冲，但不是全进程的硬内存上限。",
            "失败端通过回调交出错误，pipeline 拒绝并销毁相关流。这里 disk-unavailable 是可控的接收端故障，不是假装磁盘真的满了；换成文件流后还需要临时文件与原子提交策略，销毁流不会自动删除半份文件。"
          ]
        }
      ]
    },
    {
      "id": "node-drain-abort",
      "title": "write 返回 false 后等 drain；取消则结束整条 pipeline",
      "paragraphs": [
        "write(false) 说明块已接收，但调用方应暂停继续写。下面保留首块的完成回调，先观察背压，再释放它并等待 drain。取消实验在首块写入期间 abort，验证的是资源状态和拒绝类别，不断言某个时间上限。"
      ],
      "examples": [
        {
          "language": "node",
          "code": "import { Readable, Writable } from 'node:stream';\nimport { pipeline } from 'node:stream/promises';\nimport { once } from 'node:events';\nlet release;\nconst sink = new Writable({ highWaterMark: 1, write(_chunk, _encoding, done) { release = done; } });\nconsole.log('可继续写:' + sink.write('aa'));\nconst drained = once(sink, 'drain');\nrelease(); await drained;\nconsole.log('缓冲字节:' + sink.writableLength);\nconst finished = once(sink, 'finish'); sink.end(); await finished;\nconst controller = new AbortController();\nconst source = Readable.from(['a', 'b']);\nconst target = new Writable({ write(_chunk, _encoding, done) { controller.abort(); done(); } });\ntry { await pipeline(source, target, { signal: controller.signal }); }\ncatch (error) { console.log(error.name); }\nconsole.log('取消后销毁:' + (source.destroyed && target.destroyed));",
          "expectedOutput": [
            "可继续写:false",
            "缓冲字节:0",
            "AbortError",
            "取消后销毁:true"
          ],
          "explanation": [
            "首块超过水位时 write 返回 false，但它没有被拒绝或丢掉。完成回调释放缓冲后触发 drain，等待者才能继续写；只看 false 就重新发送这一块，会造成重复。",
            "abort 让 pipeline 拒绝为 AbortError，并销毁两端。已被下游提交的内容不会回滚；远端写入或文件替换需要各自的事务与确认协议。不能在主线程同步无限循环里期待 AbortSignal 自动中断 JavaScript。"
          ]
        }
      ]
    },
    {
      id: "practice",
      title: "先让队列满，再分别演示交付完和放弃未读",
      paragraphs: [
        "用容量 2 写出堵住、取出后再放入、关闭后仍能读完。再写一条未读就释放的路径，确认剩余块数和之后不能再读。整段缓冲用一个会超过上限的总长度。",
        "本主题没有已开放的独立练习。示例不读取本机文件。"
      ]
    }
  ],
  sources: [
    { title: "Node.js：Stream", url: "https://nodejs.org/api/stream.html" },
    { title: "Node.js：Readable streams", url: "https://nodejs.org/api/stream.html#readable-streams" },
    { title: "MDN：Streams API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Streams_API" }
  ]
};
