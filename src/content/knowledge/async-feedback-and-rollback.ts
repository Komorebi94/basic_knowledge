import type { Article } from "../articles";

export const asyncFeedbackArticle: Article = {
  "revision": 2,
  id: "K15-04",
  kind: "knowledge",
  domainSlug: "accessibility",
  slug: "async-feedback-and-rollback",
  title: "异步交互与乐观更新",
  summary: "保存先把新标题标成待确认，重复提交不再写第二次；失败把界面退回服务端仍保存的草稿，撤销只在确认之后可用。",
  aliases: ["optimistic update", "rollback", "double submit", "状态反馈"],
  tags: ["无障碍", "异步", "反馈"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-15",
  sections: [
    {
      id: "problem",
      title: "标题已经改成新的，为什么刷新之后仍是草稿？",
      paragraphs: [
        "用户把笔记标题改成「新标题」并按下保存。界面立刻换成新标题，按钮却还能再按一次。请求失败后，页面仍显示新标题，服务器上却是原来的草稿。另一条路径是请求已经成功，用户按了撤销，界面回到草稿，随后迟到的成功响应又把新标题写回去。",
        "乐观更新要把三份状态分开：界面正在显示什么，服务器已经接受什么，这次请求还在不在途中。失败必须退回服务器那一份。确认之前不能撤销。等待期间的第二次提交要被拒绝。反馈用状态文字说明，不把焦点从输入框抢走。本篇按固定步骤演算，不发请求。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：界面、服务器和写入次数分开记",
      paragraphs: [
        "运行 npm run verify:k15。play 从 view 和 server 都是「草稿」、status 为 idle、writes 为 0 开始。submit 在 pending 时返回 busy，并且不改 view。空标题的 submit 返回 invalid。ok 只在 pending 时把 view 抄进 server 并把 writes 加一。fail 只在 pending 时把 view 拨回 server。undo 只在 confirmed 时把两边都设回草稿，并把 writes 减一，最少到 0。",
        "feedback 把 pending、confirmed、rolled-back、busy 收成带角色名的短句，末尾都是 keep-focus。未知阶段是 invalid。函数不创建 live region，也不调用 focus。"
      ]
    },
    {
      id: "play",
      title: "第二次点击被丢掉，失败退回的是服务器上的草稿",
      paragraphs: [
        "先 submit「新标题」，日志是 pending:新标题，此时 server 仍是草稿。紧接着 submit「另一标题」得到 busy：在途请求还没结束，第二个标题不能排队，也不能把 view 改掉。随后 fail，view 回到 server，日志是 rolled-back:草稿。这次还没 confirmed，再 undo 得到 no-undo。",
        "另一条路径 submit「 新标题 」会先去掉空白，得到 pending:新标题。ok 之后才是 confirmed:新标题:1，writes 变成 1，server 也变成新标题。undo 得到 undo:草稿:0。再 undo 是 no-undo，因为状态已经回到 idle。此时补一个 ok，得到 ignored：没有在途的保存，迟到的成功不能把草稿又改成新标题。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function play(steps) {
  let status = 'idle';
  let view = '草稿';
  let server = '草稿';
  let writes = 0;
  const log = [];
  for (const step of steps) {
    if (!step || typeof step.op !== 'string') { log.push('invalid'); continue; }
    if (step.op === 'submit') {
      const next = typeof step.next === 'string' ? step.next.trim() : '';
      if (!next) { log.push('invalid'); continue; }
      if (status === 'pending') { log.push('busy'); continue; }
      status = 'pending';
      view = next;
      log.push('pending:' + view);
      continue;
    }
    if (step.op === 'ok') {
      if (status !== 'pending') { log.push('ignored'); continue; }
      server = view;
      writes += 1;
      status = 'confirmed';
      log.push('confirmed:' + server + ':' + writes);
      continue;
    }
    if (step.op === 'fail') {
      if (status !== 'pending') { log.push('ignored'); continue; }
      view = server;
      status = 'rolled-back';
      log.push('rolled-back:' + view);
      continue;
    }
    if (step.op === 'undo') {
      if (status !== 'confirmed') { log.push('no-undo'); continue; }
      server = '草稿';
      view = '草稿';
      writes = Math.max(0, writes - 1);
      status = 'idle';
      log.push('undo:' + view + ':' + writes);
      continue;
    }
    log.push('invalid');
  }
  return log;
}
const failed = play([{ op: 'submit', next: '新标题' }, { op: 'submit', next: '另一标题' }, { op: 'fail' }, { op: 'undo' }]);
for (const line of failed) console.log('失败路径:' + line);
const saved = play([{ op: 'submit', next: ' 新标题 ' }, { op: 'ok' }, { op: 'undo' }, { op: 'undo' }, { op: 'ok' }]);
for (const line of saved) console.log('成功路径:' + line);`,
          expectedOutput: [
            "失败路径:pending:新标题",
            "失败路径:busy",
            "失败路径:rolled-back:草稿",
            "失败路径:no-undo",
            "成功路径:pending:新标题",
            "成功路径:confirmed:新标题:1",
            "成功路径:undo:草稿:0",
            "成功路径:no-undo",
            "成功路径:ignored"
          ],
          explanation: [
            "busy 出现时 view 仍是第一次提交的新标题，另一标题没有入队。fail 退回的是还没被 ok 改写的草稿。",
            "writes 只在 ok 时增加，undo 把它减回 0。撤销之后的 ok 被忽略，避免迟到响应覆盖已经撤销的结果。"
          ]
        }
      ]
    },
    {
      id: "feedback",
      title: "四种结果都说明状态，并且都把焦点留在原地",
      paragraphs: [
        "pending 对应 status:正在保存。confirmed 对应 status:已保存。rolled-back 用 alert:已恢复草稿，因为界面上的标题被改了回去，用户需要知道刚才看见的新标题没有留下来。busy 对应 status:请等待，用来解释第二次点击为什么没有生效。",
        "四句末尾都是 keep-focus。保存过程中把焦点跳到页顶的提示，会让正在修改标题的人失去输入位置。K15-02 把非阻塞状态放在已有的 status 区域；这里的 alert 只留给回滚这种已经改变了界面内容的结果。函数返回的是角色名和句子，不是 DOM。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function feedback(phase) {
  if (phase === 'pending') return 'status:正在保存:keep-focus';
  if (phase === 'confirmed') return 'status:已保存:keep-focus';
  if (phase === 'rolled-back') return 'alert:已恢复草稿:keep-focus';
  if (phase === 'busy') return 'status:请等待:keep-focus';
  return 'invalid';
}
console.log('等待:' + feedback('pending'));
console.log('确认:' + feedback('confirmed'));
console.log('回滚:' + feedback('rolled-back'));
console.log('重复:' + feedback('busy'));
console.log('未知反馈:' + feedback('focus'));`,
          expectedOutput: [
            "等待:status:正在保存:keep-focus",
            "确认:status:已保存:keep-focus",
            "回滚:alert:已恢复草稿:keep-focus",
            "重复:status:请等待:keep-focus",
            "未知反馈:invalid"
          ],
          explanation: [
            "正在保存和已保存都用 status，因为用户可以继续留在字段里。回滚改了可见标题，所以单独用 alert。",
            "keep-focus 是这四句的共同约定。focus 不是合法阶段，不能用把焦点移走的方式充当反馈。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "pending 不是已经保存，撤销也不是请求取消",
      paragraphs: [
        "pending:新标题 只改了 view。在 ok 之前刷新或失败，用户应当看到草稿。把 pending 的文案写成「已保存」，会和 confirmed 混在一起。writes 也解释了这一点：失败路径里没有 ok，所以没有增加写入次数。",
        "undo 在模型里直接改 server，并没有发送取消或补偿请求。真实保存若已经落到服务器，撤销必须再有一次可失败的请求；那次请求同样要处理 busy 和回滚。no-undo 只说明当前不是 confirmed，不是说产品永远不能提供取消。",
        "步骤是同步列表，没有时钟，也没有网络。ignored 表示 ok 来时已经不在 pending。它不能替代请求身份：若两次保存共用一个迟到的 ok，这个函数分不出它属于哪一次。焦点约定也只是字符串 keep-focus，没有检查 document.activeElement。"
      ]
    },
    {
      id: "practice",
      title: "把失败、重复点击和迟到成功各走一遍",
      paragraphs: [
        "失败路径应依次是 pending、busy、rolled-back:草稿、no-undo。成功路径应在 confirmed 之后才允许 undo，第二次 undo 和事后的 ok 都不能再改写草稿。四种反馈都以 keep-focus 结束。",
        "E38 已提供可运行练习；具体入口见文末关联。DOM、焦点和框架主题的当前练习以 JavaScript 行为模型为范围，真实平台行为请按本文实验复核；通过模型不代表完成设备或框架集成验收。"
      ]
    }
  ],
  sources: [
    { title: "W3C：Understanding 4.1.3 Status Messages", url: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html" },
    { title: "MDN：status role", url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role" }
  ]
};
