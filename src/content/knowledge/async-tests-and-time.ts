import type { Article } from "../articles";

export const asyncTestsTimeArticle: Article = {
  id: "K12-04",
  kind: "knowledge",
  domainSlug: "testing",
  slug: "async-tests-and-time",
  title: "异步测试与可控时间",
  summary: "用虚拟时钟推进笔记防抖和重试等待，核对到期前、改写、取消和只改标记时分别发生什么。",
  aliases: ["fake timers", "virtual clock", "async test", "可控时间"],
  tags: ["测试", "异步", "时间"],
  estimatedMinutes: 24,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "测试睡了 100 毫秒就通过，为什么边界上仍会多保存一次？",
      paragraphs: [
        "笔记防抖的测试在调用后等待 100 毫秒，再断言保存了一次。机器忙时等待不够，空闲时又可能刚好跨过边界。等待也不能区分“99 毫秒不应触发”和“改写后只保留最后一次”。真实 sleep 把调度和负载混在同一个结果里。",
        "可控时间把现在、延迟和取消交给测试推进。本篇的时钟是同步模型：advance 只运行到期的回调，不插入 Promise 微任务，也不是浏览器事件循环。K12-02 要求时间用例看边界两侧；这里给出推进这些边界的方法。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：整数毫秒的虚拟时钟，回调在推进时同步运行",
      paragraphs: [
        "运行 npm run verify:k12。delay 只接受大于等于 0 的整数，否则返回 invalid。advance 把时间移到目标点，按到期时间然后 id 的顺序同步调用回调。同一时刻先登记的 id 更小，所以先运行。",
        "防抖等待固定为 100。重试的 waits 是每次失败之后的等待，第一次尝试立即发生。模型不调用 setTimeout，因此输出与机器负载无关。已开放的 E01 练习防抖实现本身，本篇不重复那道题的用例。"
      ]
    },
    {
      id: "debounce",
      title: "99 毫秒不保存，改写后只保留最后一次，取消必须拿掉计时器",
      paragraphs: [
        "第一次 call('a') 后 advance(99)，回调还没到期，保存列表仍是 none。接着 call('b') 会取消上一个计时器并重新安排 100 毫秒。再推进 100，只保存 b。此时计时器已经清空，再 cancel 返回 idle，继续推进也不会增加保存。",
        "另一只时钟把 a 推进到刚好 100，保存 a；c 只推进 50 时是 none，再推进 50 才变成 a|c。第三只时钟在到期前 cancel，推进 100 后仍是 none。负延迟返回 invalid。预期七行依次是 scheduled/none/none、scheduled/b/b、idle/none/b、a/a、none、c/a|c、canceled/none/none、invalid。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function createClock() {
  let now = 0;
  let nextId = 1;
  const timers = [];
  return {
    now() { return now; },
    delay(ms, run) {
      if (!Number.isInteger(ms) || ms < 0) return 'invalid';
      const id = nextId++;
      timers.push({ id, at: now + ms, run });
      return id;
    },
    cancel(id) {
      const index = timers.findIndex((timer) => timer.id === id);
      if (index < 0) return 'missing';
      timers.splice(index, 1);
      return 'canceled';
    },
    advance(ms) {
      if (!Number.isInteger(ms) || ms < 0) return 'invalid';
      const target = now + ms;
      const fired = [];
      for (;;) {
        let nextIndex = -1;
        for (let index = 0; index < timers.length; index += 1) {
          const timer = timers[index];
          if (timer.at > target) continue;
          if (nextIndex < 0 || timer.at < timers[nextIndex].at || (timer.at === timers[nextIndex].at && timer.id < timers[nextIndex].id)) nextIndex = index;
        }
        if (nextIndex < 0) break;
        const next = timers[nextIndex];
        now = next.at;
        timers.splice(nextIndex, 1);
        fired.push(next.run());
      }
      now = target;
      return fired.length ? fired.join(',') : 'none';
    },
  };
}
function shown(list) { return list.length ? list.join('|') : 'none'; }
function debounce(clock, wait) {
  let timerId = null;
  let generation = 0;
  const saved = [];
  return {
    saved,
    call(value) {
      generation += 1;
      const current = generation;
      if (timerId !== null) clock.cancel(timerId);
      const id = clock.delay(wait, () => {
        timerId = null;
        if (current !== generation) return 'stale';
        saved.push(value);
        return value;
      });
      if (id === 'invalid') return 'invalid';
      timerId = id;
      return 'scheduled';
    },
    cancel() {
      generation += 1;
      if (timerId === null) return 'idle';
      const result = clock.cancel(timerId);
      timerId = null;
      return result;
    },
  };
}
const clock = createClock();
const draft = debounce(clock, 100);
console.log('提前:' + draft.call('a') + '/' + clock.advance(99) + '/' + shown(draft.saved));
console.log('改写:' + draft.call('b') + '/' + clock.advance(100) + '/' + shown(draft.saved));
console.log('取消后:' + draft.cancel() + '/' + clock.advance(100) + '/' + shown(draft.saved));
const clock2 = createClock();
const later = debounce(clock2, 100);
later.call('a');
console.log('到期:' + clock2.advance(100) + '/' + shown(later.saved));
later.call('c');
console.log('半程:' + clock2.advance(50));
console.log('再到期:' + clock2.advance(50) + '/' + shown(later.saved));
const clock3 = createClock();
const stop = debounce(clock3, 100);
stop.call('a');
console.log('中途:' + stop.cancel() + '/' + clock3.advance(100) + '/' + shown(stop.saved));
console.log('非法:' + clock.delay(-1, () => 'x'));`,
          expectedOutput: [
            "提前:scheduled/none/none",
            "改写:scheduled/b/b",
            "取消后:idle/none/b",
            "到期:a/a",
            "半程:none",
            "再到期:c/a|c",
            "中途:canceled/none/none",
            "非法:invalid"
          ],
          explanation: [
            "99 毫秒停在边界之前，所以 a 没有写入。改写成 b 时旧计时器被取消，100 毫秒后只看到 b。到期后再取消返回 idle，因为已经没有计时器。",
            "半程推进不触发 c，补足剩余时间才触发。中途取消把计时器从队列移除，后面的 advance 找不到回调。负延迟在登记时就被拒绝。"
          ]
        }
      ]
    },
    {
      id: "retry",
      title: "重试要推进到下一次尝试，只改取消标记仍会迟到执行",
      paragraphs: [
        "第一次失败发生在时间 0，并登记 20 毫秒后的下一次。advance(19) 仍是 none。再推进 1 毫秒，时间到 20，记录第二次失败，并登记 50 毫秒后的尝试。再推进 50，时间到 70，结果为 ok。三次记录是 0:fail@0、1:fail@20、2:ok@70。",
        "只把 stopped 设为 true、不从时钟移除计时器时，advance(20) 仍会运行回调，返回 late。正确的 stop 先取消计时器，再推进 20 得到 none，日志停在第一次失败。等待中的取消必须同时去掉已登记的回调。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function createClock() {
  let now = 0;
  let nextId = 1;
  const timers = [];
  return {
    now() { return now; },
    delay(ms, run) {
      if (!Number.isInteger(ms) || ms < 0) return 'invalid';
      const id = nextId++;
      timers.push({ id, at: now + ms, run });
      return id;
    },
    cancel(id) {
      const index = timers.findIndex((timer) => timer.id === id);
      if (index < 0) return 'missing';
      timers.splice(index, 1);
      return 'canceled';
    },
    advance(ms) {
      if (!Number.isInteger(ms) || ms < 0) return 'invalid';
      const target = now + ms;
      const fired = [];
      for (;;) {
        let nextIndex = -1;
        for (let index = 0; index < timers.length; index += 1) {
          const timer = timers[index];
          if (timer.at > target) continue;
          if (nextIndex < 0 || timer.at < timers[nextIndex].at || (timer.at === timers[nextIndex].at && timer.id < timers[nextIndex].id)) nextIndex = index;
        }
        if (nextIndex < 0) break;
        const next = timers[nextIndex];
        now = next.at;
        timers.splice(nextIndex, 1);
        fired.push(next.run());
      }
      now = target;
      return fired.length ? fired.join(',') : 'none';
    },
  };
}
function scheduleRetry(clock, waits, outcomes) {
  let timerId = null;
  let stopped = false;
  const log = [];
  function step(index) {
    timerId = null;
    if (stopped) return 'stopped';
    if (index >= outcomes.length) return 'exhausted';
    const outcome = outcomes[index];
    log.push(index + ':' + outcome + '@' + clock.now());
    if (outcome === 'ok') return 'done';
    const gap = waits[index];
    if (!Number.isInteger(gap) || gap < 0) return 'exhausted';
    const id = clock.delay(gap, () => step(index + 1));
    if (id === 'invalid') return 'invalid';
    timerId = id;
    return 'waiting';
  }
  return {
    start() { return step(0); },
    stop() {
      stopped = true;
      if (timerId === null) return 'idle';
      const result = clock.cancel(timerId);
      timerId = null;
      return result;
    },
    log() { return log.join(',') || 'empty'; },
  };
}
const retryClock = createClock();
const retry = scheduleRetry(retryClock, [20, 50], ['fail', 'fail', 'ok']);
console.log('开始:' + retry.start() + '/' + retry.log());
console.log('未到:' + retryClock.advance(19) + '/' + retry.log());
console.log('第二次:' + retryClock.advance(1) + '/' + retry.log());
console.log('成功:' + retryClock.advance(50) + '/' + retry.log());
const looseClock = createClock();
let looseStopped = false;
const looseLog = [];
looseClock.delay(20, () => {
  if (looseStopped) return 'late';
  looseLog.push('ran');
  return 'ran';
});
looseStopped = true;
console.log('只改标记:' + looseClock.advance(20) + '/' + (looseLog.join('|') || 'empty'));
const strictClock = createClock();
const strict = scheduleRetry(strictClock, [20], ['fail', 'ok']);
console.log('严格开始:' + strict.start());
console.log('严格取消:' + strict.stop() + '/' + strictClock.advance(20) + '/' + strict.log());`,
          expectedOutput: [
            "开始:waiting/0:fail@0",
            "未到:none/0:fail@0",
            "第二次:waiting/0:fail@0,1:fail@20",
            "成功:done/0:fail@0,1:fail@20,2:ok@70",
            "只改标记:late/empty",
            "严格开始:waiting",
            "严格取消:canceled/none/0:fail@0"
          ],
          explanation: [
            "19 毫秒还没到第一次等待，日志保持 0:fail@0。推进到 20 才发生第二次失败，再过 50 毫秒才成功，所以成功时间是 70。",
            "只改标记时回调仍被时钟调用，返回 late，且没有写入 looseLog。严格取消把 id 从队列移除，推进后没有新的尝试。"
          ]
        }
      ]
    },
    {
      id: "clock",
      title: "虚拟时钟适合边界，真实耗时只适合单独的预算观察",
      paragraphs: [
        "防抖、重试间隔、超时和节流的断言应使用虚拟时钟，并在边界前、边界上和取消后各看一次。需要帧动画时，推进一帧并检查那一帧的状态，而不是睡 16 毫秒。只有“这个操作在本机是否经常超过预算”才需要墙钟，而且它是观察，不是精确边界。",
        "回调如果返回 Promise，本模型不会在 advance 里等待它。测试得自己决定何时刷新微任务，以及刷新发生在计时器之前还是之后。把真实事件循环的顺序说成这个同步队列的顺序，就超出了模型。"
      ]
    },
    {
      id: "boundaries",
      title: "虚拟时钟不证明浏览器调度，固定 sleep 也不证明产品没有竞态",
      paragraphs: [
        "模型没有任务队列、渲染帧和网络。两个计时器谁先运行由到期时间和 id 决定，不由浏览器的最小延迟或后台标签节流决定。平台差异要用目标浏览器的证据，不能用 advance 的结果代替。",
        "把 sleep 加长让测试变绿，只是降低了看见失败的概率。K12-06 会把这种重试后的通过单独分类。时间测试失败时先看是边界写错、计时器没取消，还是断言依赖了真实耗时。",
        "代次只防止回调在取消后继续保存。它不取消已经发出的请求。请求身份和资源释放仍按 K12-02 的完成路径检查。"
      ]
    },
    {
      id: "practice",
      title: "每个时间行为都写出推进前和推进后的可见结果",
      paragraphs: [
        "为防抖写下 99、100、中途改写和中途取消四行预期。为重试写下未到间隔、到达间隔和等待中取消三行预期。取消用例要断言后续推进没有新增副作用，而不是只断言标记变成 true。",
        "本主题没有另设开放练习。E01 仍负责防抖实现；本篇的时钟不能当作那道题的运行器。"
      ]
    }
  ],
  sources: [
    { title: "Playwright：Clock", url: "https://playwright.dev/docs/clock" },
    { title: "Jest：Timer Mocks", url: "https://jestjs.io/docs/timer-mocks" },
    { title: "MDN：微任务队列", url: "https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide" }
  ]
};
