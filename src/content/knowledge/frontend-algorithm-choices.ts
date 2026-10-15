import type { Article } from "../articles";

export const frontendAlgorithmsArticle: Article = {
  "revision": 2,
  id: "K16-08",
  kind: "knowledge",
  domainSlug: "algorithms",
  slug: "frontend-algorithm-choices",
  title: "前端场景的算法设计",
  summary: "长列表只取窗口内的下标，按键比较保留同一 id，重复查询才建索引；超过一帧的任务标成不可拆，而不是硬塞进去。",
  aliases: ["virtual list", "keyed diff", "scheduling", "窗口渲染"],
  tags: ["算法", "列表", "调度"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-15",
  sections: [
    {
      id: "problem",
      title: "一百行都创建节点之后，为什么插入一行却把后面的状态全换了？",
      paragraphs: [
        "笔记列表有 100 行，页面把每一行都做成节点。滚动时要更新的节点和数据一样多。更糟的是按位置比较：原来的 b 被拿掉、末尾加上 d 时，位置 1 从 b 变成 c，位置 2 从 c 变成 d，两行都被当成替换，输入框里的状态跟着丢。另一边，搜索每次都扫全表，以及一个 6 个单位的任务被塞进只有 5 个单位的帧里。",
        "这四件事用的结构不同。长列表要的是下标窗口，不是另一份数据。列表更新要的是 id 是否还在，不是下标是否对齐。索引要看笔记数和查询次数。调度要看任务能不能放进剩余预算。本篇用固定数字演示选择，不创建 DOM，也不申请动画帧。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：窗口、按键、20 条阈值和帧预算都是固定规则",
      paragraphs: [
        "运行 npm run verify:k16。windowRange 要求 count、start、size 是整数，start 在 0 到 count 之间，size 为正。返回的右端是 start+size 和 count 里较小的那个。reconcile 的 index 模式按位置写出 keep、replace、insert 或 remove。key 模式只报告消失的 id 和新出现的 id，都还在则是 keep。",
        "chooseIndex 在笔记数不超过 20，或查询次数不超过 1 时返回 scan，否则 index。20 和 1 是这张表的门槛，不是测出来的耗时。schedule 按顺序把正整数任务放进帧，放不下就新开一帧。单个任务大于帧预算时返回 unsplittable，不把任务切开。空任务列表是 frames:0。"
      ]
    },
    {
      id: "list",
      title: "窗口只给出下标范围，按键比较不会把移动看成替换",
      paragraphs: [
        "100 行、从 0 开始、窗口大小 10，结果是 0-10/100。从 95 开始时右端被总数挡住，结果是 95-100/100，只剩 5 行，而不是再写出 95 到 105。start 为 101 超过总数，返回 invalid。窗口函数不生成行数据，调用方再用这个范围去取。",
        "a、b、c 变成 a、c、d。按位置会得到 keep、replace:b>c、replace:c>d，c 被说成从 b 变来，又被下一格替换掉。按键会得到 remove:b,insert:d，a 和 c 仍然是 keep。a、b 换成 b、a 时，按键结果就是 keep：两个 id 都还在。这个 keep 没有说它们交换了位置，所以它不能单独用来做移动动画。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function windowRange(count, start, size) {
  if (!Number.isInteger(count) || count < 0 || !Number.isInteger(start) || start < 0 || start > count) return 'invalid';
  if (!Number.isInteger(size) || size <= 0) return 'invalid';
  return start + '-' + Math.min(count, start + size) + '/' + count;
}
function reconcile(before, after, mode) {
  if (mode === 'index') {
    const ops = [];
    const n = Math.max(before.length, after.length);
    for (let i = 0; i < n; i += 1) {
      if (before[i] === after[i]) ops.push('keep');
      else if (before[i] === undefined) ops.push('insert:' + after[i]);
      else if (after[i] === undefined) ops.push('remove:' + before[i]);
      else ops.push('replace:' + before[i] + '>' + after[i]);
    }
    return ops.join(',') || 'empty';
  }
  if (mode === 'key') {
    const next = new Set(after);
    const prev = new Set(before);
    const ops = [];
    for (const id of before) if (!next.has(id)) ops.push('remove:' + id);
    for (const id of after) if (!prev.has(id)) ops.push('insert:' + id);
    return ops.join(',') || 'keep';
  }
  return 'invalid';
}
console.log('开头:' + windowRange(100, 0, 10));
console.log('末尾:' + windowRange(100, 95, 10));
console.log('越界:' + windowRange(100, 101, 10));
console.log('按下标:' + reconcile(['a', 'b', 'c'], ['a', 'c', 'd'], 'index'));
console.log('按键:' + reconcile(['a', 'b', 'c'], ['a', 'c', 'd'], 'key'));
console.log('换位:' + reconcile(['a', 'b'], ['b', 'a'], 'key'));`,
          expectedOutput: [
            "开头:0-10/100",
            "末尾:95-100/100",
            "越界:invalid",
            "按下标:keep,replace:b>c,replace:c>d",
            "按键:remove:b,insert:d",
            "换位:keep"
          ],
          explanation: [
            "窗口右端不会超过 100。按位置比较把 c 和 d 都看成替换，按键比较只去掉 b 并插入 d。",
            "b、a 相对 a、b 只是顺序变了，两个 id 都还在，按键结果是 keep。它没有描述移动到哪个下标。"
          ]
        }
      ]
    },
    {
      id: "work",
      title: "查询次数和帧预算决定要不要建索引、能不能拆开任务",
      paragraphs: [
        "20 条笔记即使查 5 次，仍是 scan。21 条并且查 2 次，变成 index。21 条但只查 1 次，建索引的那一次扫描没有第二次可摊，结果仍是 scan。门槛写在函数里，换一套数据不会自动改变 20 和 1。",
        "任务 3、3、3，帧预算 5。第一帧放下一个 3，第二个 3 放不下，新开一帧，第三个同样新开，frames:3。2 和 2 可以进同一帧，frames:1。单独一个 6 大于 5，返回 unsplittable:6，不能把它报成两帧。没有任务时 frames:0，不预开空帧。K16-07 的拆帧讨论的是方法数；这里的一帧装不下整段任务时，选择是拒绝拆开，而不是枚举切法。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function chooseIndex(count, queries) {
  if (!Number.isInteger(count) || count < 0 || !Number.isInteger(queries) || queries < 0) return 'invalid';
  if (count <= 20 || queries <= 1) return 'scan';
  return 'index';
}
function schedule(tasks, frame) {
  if (!Number.isInteger(frame) || frame <= 0) return 'invalid';
  let framesUsed = 0;
  let used = 0;
  for (const task of tasks) {
    if (!Number.isInteger(task) || task <= 0) return 'invalid';
    if (task > frame) return 'unsplittable:' + task;
    if (used + task > frame) { framesUsed += 1; used = 0; }
    used += task;
  }
  if (used) framesUsed += 1;
  return 'frames:' + framesUsed;
}
console.log('小列表:' + chooseIndex(20, 5));
console.log('重复查:' + chooseIndex(21, 2));
console.log('一次查:' + chooseIndex(21, 1));
console.log('三帧:' + schedule([3, 3, 3], 5));
console.log('一帧:' + schedule([2, 2], 5));
console.log('不可拆:' + schedule([6], 5));
console.log('没有任务:' + schedule([], 5));`,
          expectedOutput: [
            "小列表:scan",
            "重复查:index",
            "一次查:scan",
            "三帧:frames:3",
            "一帧:frames:1",
            "不可拆:unsplittable:6",
            "没有任务:frames:0"
          ],
          explanation: [
            "20 条以内或只查一次，都走扫描。21 条且至少查两次才返回 index。这两个数是模型门槛。",
            "预算 5 装得下两个 2，装不下连续的第二个 3，所以 3、3、3 用了三帧。6 大于预算，结果是不可拆，而不是切开。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "这些标签不是虚拟列表、React diff 或测量出来的索引",
      paragraphs: [
        "windowRange 不读取滚动位置，不复用 DOM 节点，也不知道行高。0-10/100 只是下标。行高不固定时，可见范围不能只靠除法得到，这个函数也没有做。K10-04 讨论列表渲染和内存，这里只决定取哪一段下标。",
        "key 模式不产生移动操作。换位得到 keep，调用方若要动画，还得自己找下标变化。index 模式会把同一条 c 先写成替换结果、再写成被替换掉，这正是按位置复用状态会出错的原因。它不是一套完整的最短编辑脚本。React 列表用 key 保留身份，这个函数只借用这个区分，不运行协调器。",
        "chooseIndex 的 20 和 1 不是搜索耗时。scan 也不建立 Map。schedule 不调用 requestAnimationFrame，帧预算 5 不是毫秒。unsplittable 表示拒绝拆开这项任务；真要拆，必须另有任务自己的切分规则，不能在装不下时切一刀就返回 frames。"
      ]
    },
    {
      id: "practice",
      title: "用同一份一百行列表做窗口和身份两个选择",
      paragraphs: [
        "从 95 开始的窗口应是 95-100/100。a、b、c 到 a、c、d，按键应只 remove b 并 insert d。21 条笔记查两次应是 index，只查一次应是 scan。大于帧预算的单个任务应是 unsplittable。",
        "E40 已提供可运行练习；具体入口见文末关联。DOM、焦点和框架主题的当前练习以 JavaScript 行为模型为范围，真实平台行为请按本文实验复核；通过模型不代表完成设备或框架集成验收。"
      ]
    }
  ],
  sources: [
    { title: "React：Rendering lists", url: "https://react.dev/learn/rendering-lists" },
    { title: "MDN：Window.requestAnimationFrame", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame" }
  ]
};
