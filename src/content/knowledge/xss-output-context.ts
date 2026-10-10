import type { Article } from "../articles";

export const xssOutputArticle: Article = {
  id: "K11-01", kind: "knowledge", domainSlug: "security", slug: "xss-output-context",
  title: "XSS、输出上下文与内容净化",
  summary: "从一条评论进入页面的路径出发，区分文本、HTML、URL 和脚本上下文，解释为什么输入检查、输出编码与内容净化不能互相替代。",
  aliases: ["XSS", "cross-site scripting", "sanitize", "输出编码"], tags: ["安全", "信任边界", "DOM"],
  estimatedMinutes: 22, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "评论只是字符串，为什么进入页面后会变成节点？", paragraphs: [
      "设想一份私人笔记写了 <strong>重要</strong>。用户希望保留原字样，页面却显示加粗的“重要”。问题不在字符串保存时变了，而在读取后把字符串交给 HTML 解析器：同样的字节进入不同解释器，有完全不同的含义。攻击者控制输入、应用把输入送入有权限的解释环境，这条路径构成 XSS 风险。",
      "追踪这类问题时，把入口、转换和输出位置连起来。输入可能来自查询参数、接口、导入文件或过去保存的记录。自家数据库并不意味着内容由可信作者写成；过去存入的不可信文字也会在今天重新进入页面。下面用无害标签观察解析差异，不创建可执行攻击代码。示例可单独在现代浏览器控制台运行。",
    ], examples: [{ code: `const input = '<strong>重要</strong>';
const text = document.createElement('div');
text.textContent = input;
const html = document.createElement('div');
html.innerHTML = input;
console.log(text.childElementCount);
console.log(html.childElementCount);
console.log(text.textContent === input);
console.log(html.textContent);`, expectedOutput: ["0", "1", "true", "重要"], explanation: [
      "textContent 创建文本内容，尖括号保持文字，因此第一个容器没有元素子节点。innerHTML 进入 HTML 解析器，产生 strong 元素，因此第二个容器有一个子元素，读 textContent 时只剩标签中的文字。容器未挂入页面，也足以观察解析过程。",
      "这个例子说明危险入口的解释方式，不证明 innerHTML 在任意数据上都立刻执行脚本。实际风险取决于载荷、元素和环境；用某一种脚本标签试验没有执行，不能证明其它可执行路径不存在。修复目标是避免不可信内容进入不需要的解释环境。",
    ] }] },
    { id: "text", title: "先确认需求是显示文本，还是支持富文本", paragraphs: [
      "评论、日志、笔记和错误信息若只需要文本，用 textContent 或框架的普通文本插值，直接表达需求。React 的字符串子节点会按文本渲染；dangerouslySetInnerHTML 则主动选择 HTML 解释路径。Vue 的普通插值与 v-html 也应按这个边界区分，而不是因为数据来自某接口就绕过。",
      "输出编码是把数据表示成当前上下文不会误解释的形式。HTML 文本节点、属性、URL 和 JavaScript 字符串各有不同的规则，不能先写一个 replace 尖括号函数，再用于所有位置。优先使用平台 API，让平台负责对应语法；需要富文本时，才进入经过审查的 HTML 净化流程。",
      "存储原文而在输出边界做处理，能够保留笔记的忠实性。把用户文字永久改写成实体，再在另一处按文本展示，会出现双重编码和信息损失。编码后的字节仍不应被拿去当另一种语言的源码。",
    ] },
    { id: "url", title: "把 URL 放进属性，仍需要判断它允许做什么", paragraphs: [
      "setAttribute 避免手工拼接属性语法，但不决定 URL 的业务许可。链接是否允许外站、是否只允许 HTTPS、是否要求同源，都要在解析后的 URL 上检查。HTML 属性语法正确的 javascript: URL，依然不适合作为来自不可信数据的导航目标。",
      "下面的示例故意限定为站内 HTTPS 路径。它拒绝协议不符和外部 origin，最后只返回规范化路径。示例域名用于纯解析，不会发起请求；这个策略适合站内跳转，不适合需要外部参考资料的链接集合。后者应允许明确协议，再按产品需求处理新窗口与引用策略。",
    ], examples: [{ code: `function internalPath(raw) {
  try {
    const base = 'https://notes.example/';
    const url = new URL(raw, base);
    if (url.protocol !== 'https:' || url.origin !== new URL(base).origin) return null;
    return url.pathname + url.search + url.hash;
  } catch { return null; }
}
console.log(internalPath('/notes?tab=all'));
console.log(String(internalPath('javascript:alert(1)')));
console.log(String(internalPath('//other.example/notes')));`, expectedOutput: ["/notes?tab=all", "null", "null"], explanation: [
      "相对路径以固定可信 base 解析，协议与 origin 都符合，于是输出站内路径。第二个输入解析出的协议不是 https:，第三个输入虽然沿用了 HTTPS，主机已改变，因此都被拒绝。先解析再检查避免把字符串前缀相似误当成同源。",
      "这里没有执行传入 URL，也没有覆盖所有导航政策。例如下载目标、mailto 或预签名外部链接各有独立需求，不能把同源策略机械复制到它们身上。URL 校验保护导航边界，不能代替服务端访问控制。",
    ] }] },
    { id: "rich-text", title: "真正需要富文本时，净化处理的是结构与能力", paragraphs: [
      "富文本允许一部分 HTML 结构，又要移除不允许的元素、事件属性与 URL 能力。正则替换难以模拟 HTML 解析、编码变体与节点重组；采用持续维护的净化器，明确允许标签、属性和链接协议，并为代表性载荷添加回归用例。净化器配置与版本属于安全边界，不能把库名当成永远安全的保证。",
      "净化之后再拼入未经净化的字符串，或者把净化结果转交另一个危险上下文，会重新打开入口。应让安全结果只走它承诺支持的输出路径。若产品根本不需要富文本，选择纯文本能直接减少解释器与维护负担。CSP 和 Trusted Types 可以约束部分危险使用方式，但不能替代这份数据到输出的合同。",
    ] },
    { id: "encoding", title: "一个看似修复的编码操作，怎样在第二次解析时失效", paragraphs: [
      "假设程序把尖括号改成 HTML 实体，于是认为字符串从此安全。第一次按 HTML 解析时，实体会成为文本节点；如果后来把该节点的 textContent 再交给 innerHTML，文本又进入解析器。每次越过解释边界都需要检查，安全不是输入上永久附着的标签。",
    ], examples: [{ code: `const first = document.createElement('div');
first.innerHTML = '&lt;em&gt;保存&lt;/em&gt;';
console.log(first.childElementCount);
const second = document.createElement('div');
second.innerHTML = first.textContent;
console.log(second.childElementCount);
console.log(second.querySelector('em') !== null);`, expectedOutput: ["0", "1", "true"], explanation: [
      "第一次解析将实体还原为文字 <em>保存</em>，没有 em 元素。第二次读取这些文字并作为 HTML 解释，创建了 em 元素。两次操作的数据相同，接收它们的解释步骤不同。",
      "这是错误数据流的无害演示。修复第二次展示时仍用 textContent，并避免把已经编码的字符串作为跨上下文通用结果。多次处理还可能让原本应显示的 & 字样变样；保留原始数据与输出策略通常更清晰。",
    ] }] },
    { id: "application", title: "审查时从每个输出位置反向追踪", paragraphs: [
      "先列出 innerHTML、动态脚本、事件属性、URL 跳转等解释入口，再追踪进入它们的数据由谁控制。对每一处写出真实需求：纯文本、有限富文本，还是经过允许的导航。删除不必要的解释能力，比给所有字符串套一个自制清理函数更容易验证。",
      "至少覆盖两个边界：数据来自旧存储也需要保护；经过一次编码再换上下文也需要保护。测试应同时确认恶意结构不能获得能力，以及合法文字、中文、尖括号和 & 符号仍能忠实显示。不要为了挡输入而篡改私人笔记内容。",
      "对于必须富文本的场景，配置要有作者、更新流程与回归样例。框架升级、净化器更新和允许属性变化都可能改变风险。本文示例只验证 DOM 解析行为，没有宣称完成某个真实站点的全量安全审计。",
    ] },
    { id: "recall", title: "用一个新字段验证自己的理解", paragraphs: [
      "给页面新增“参考链接”时，先回答：来源能否被用户控制，展示文字进入哪个上下文，href 的协议及目标范围如何限制？文字安全与导航安全要分别处理。",
      "再给页面新增“代码笔记”时，尖括号应当显示原样；若改变了节点数量，说明内容走入了不必要的解释器。能从入口一直追到输出，才知道修复是否覆盖了保存与重新展示的完整路径。",
    ] },
  ],
  sources: [{ title: "MDN：XSS 与输出上下文", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS" }],
};
