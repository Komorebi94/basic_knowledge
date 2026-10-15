import type { Article } from "../articles";

export const stackExpressionsArticle: Article = {
  id: "K16-06",
  kind: "knowledge",
  domainSlug: "algorithms",
  slug: "stack-and-expressions",
  title: "栈与表达式处理",
  summary: "括号用栈配对，多出来或交叉都不是平衡；编辑撤销把旧文本压栈，新的输入会清掉重做栈。",
  aliases: ["stack", "bracket matching", "undo", "括号"],
  tags: ["算法", "栈", "编辑"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "括号看起来成对，为什么表达式仍然对不上？",
      paragraphs: [
        "用户输入 ([)]。每种括号都有一个左和一个右，计数会认为已经平衡。实际读到右圆括号时，栈顶却是左方括号，后写的左括号先被错误地关掉。另一条路径是编辑器：输入 a、b 之后撤销回到 a，再输入 c。若重做栈还留着 b，用户按一次重做又会把已经放弃的 b 接回来。",
        "栈记住的是还没关闭的最近一层。后进先出正好对应嵌套，不对应交叉。撤销栈保存的是输入之前的文本，新的输入说明用户放弃了那条重做分支。本篇用固定字符和步骤演示，不解析真实公式，也不改页面上的输入框。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：只认三类括号，撤销和重做分开两栈",
      paragraphs: [
        "运行 npm run verify:k16。matchBrackets 遇到左括号就压栈。右括号必须弹出和它成对的左括号，否则 mismatch。其他字符是 invalid。扫完之后栈里还有左括号则是 open，栈空则是 balanced。空字符串没有字符要关，结果是 balanced。",
        "edit 的 type 先把当前文本压进撤销栈，再追加一个长度为 1 的字符，并清空重做栈。undo 在撤销栈空时返回 undo:blocked；否则把当前文本压进重做栈，再恢复上一份。恢复到空字符串时记为 undo:blank，避免和 blocked 写成同一句。redo 在重做栈空时返回 redo:blocked。字符长度不是 1 的 type 是 invalid。"
      ]
    },
    {
      id: "match",
      title: "右括号关掉的必须是栈顶，不能只看左右数量相等",
      paragraphs: [
        "()[] 先压入左圆括号，右圆括号把它弹出，再对方括号做一次，栈空，balanced。([)] 压入左圆括号和左方括号之后，下一个字符是右圆括号。栈顶是左方括号，对不上，mismatch。此时不再继续看后面的右方括号。",
        "只有一个左圆括号时，扫描结束栈不为空，open。空字符串 balanced。字母 a 不属于三类括号，invalid。不要把 invalid 收成 mismatch：字符本身就不在这套配对里，还没有机会和栈顶比较。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function matchBrackets(source) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of source) {
    if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
    else if (Object.hasOwn(pairs, ch)) {
      if (stack.pop() !== pairs[ch]) return 'mismatch';
    } else return 'invalid';
  }
  return stack.length ? 'open' : 'balanced';
}
console.log('平衡:' + matchBrackets('()[]'));
console.log('交叉:' + matchBrackets('([)]'));
console.log('未闭合:' + matchBrackets('('));
console.log('空括号:' + matchBrackets(''));
console.log('字母:' + matchBrackets('a'));`,
          expectedOutput: [
            "平衡:balanced",
            "交叉:mismatch",
            "未闭合:open",
            "空括号:balanced",
            "字母:invalid"
          ],
          explanation: [
            "()[] 两次都弹出栈顶对应的左括号，最后栈空。([)] 在右圆括号出现时栈顶仍是左方括号，所以交叉失败。",
            "落单的左括号留到结尾，结果是 open。空字符串没有未关闭的括号。字母不属于配对字符，返回 invalid。"
          ]
        }
      ]
    },
    {
      id: "undo",
      title: "新输入清掉重做，空文档和没有可撤销不是同一句话",
      paragraphs: [
        "依次输入 a、b，文本是 ab，撤销栈里有空文档和 a。一次 undo 回到 a。接着输入 c，文本变成 ac，重做栈被清空。这时 redo 得到 redo:blocked，b 不会再出现。",
        "再 undo 一次回到 a。再 undo 一次回到输入 a 之前的空文档，记为 undo:blank。再 undo 一次已经没有快照，记为 undo:blocked。blank 是一份真实的空文本，blocked 是栈里没有更早的文本。若两句都写成 empty，就分不清用户是回到了空白，还是按撤销已经按到底。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function edit(steps) {
  const undo = [];
  const redo = [];
  let text = '';
  const log = [];
  for (const step of steps) {
    if (!step || step.op === 'type') {
      const ch = step && typeof step.char === 'string' ? step.char : '';
      if (ch.length !== 1) { log.push('invalid'); continue; }
      undo.push(text);
      text += ch;
      redo.length = 0;
      log.push('type:' + text);
      continue;
    }
    if (step.op === 'undo') {
      if (!undo.length) { log.push('undo:blocked'); continue; }
      redo.push(text);
      text = undo.pop();
      log.push('undo:' + (text === '' ? 'blank' : text));
      continue;
    }
    if (step.op === 'redo') {
      if (!redo.length) { log.push('redo:blocked'); continue; }
      undo.push(text);
      text = redo.pop();
      log.push('redo:' + (text === '' ? 'blank' : text));
      continue;
    }
    log.push('invalid');
  }
  return log;
}
const steps = [{ op: 'type', char: 'a' }, { op: 'type', char: 'b' }, { op: 'undo' }, { op: 'type', char: 'c' }, { op: 'redo' }, { op: 'undo' }, { op: 'undo' }, { op: 'undo' }];
for (const line of edit(steps)) console.log('编辑:' + line);`,
          expectedOutput: [
            "编辑:type:a",
            "编辑:type:ab",
            "编辑:undo:a",
            "编辑:type:ac",
            "编辑:redo:blocked",
            "编辑:undo:a",
            "编辑:undo:blank",
            "编辑:undo:blocked"
          ],
          explanation: [
            "输入 c 之前清空重做栈，所以撤销 b 之后不能再 redo 出 b。文本停在 ac 之后的撤销才回到 a。",
            "再往前一版是输入任何字符之前的空文档，记为 blank。栈空之后继续 undo 才是 blocked。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "栈顶配对不是完整语法，撤销快照也不是协作历史",
      paragraphs: [
        "matchBrackets 不认识字符串里的括号、转义和注释。balanced 只表示这三类括号按嵌套关掉了。它不计算表达式的值，也不处理运算符优先级。括号数量相等不能代替栈顶检查，([)] 就是反例。",
        "edit 每个 type 保存整段文本，而不是一个字符的补丁。文本一长，栈里会留下多份副本。它也没有上限。undo:blank 只说明恢复出来的字符串是空的，不说明文档从来没有内容。redo:blocked 只说明当前分支上没有重做项。",
        "两个人同时编辑时，这份栈不知道对方的版本。新输入清掉重做，是单人编辑器的约定，不是多人合并。K16-02 的队列是先进先出，用来按到达顺序执行；嵌套和撤销要用栈，不能因为都是数组就混用两端。"
      ]
    },
    {
      id: "practice",
      title: "先配对括号，再把撤销和重做走岔",
      paragraphs: [
        "()[] 应是 balanced，([)] 应是 mismatch，单独的左括号应是 open。输入 a、b，撤销，再输入 c 之后，redo 应是 blocked。继续撤销应先看到 blank，再看到 blocked。",
        "本主题没有已开放的独立练习。示例不解析用户公式，也不保存真实编辑器的历史。"
      ]
    }
  ],
  sources: [
    { title: "MDN：Array.prototype.push", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push" },
    { title: "Wikipedia：Stack", url: "https://en.wikipedia.org/wiki/Stack_(abstract_data_type)" }
  ]
};
