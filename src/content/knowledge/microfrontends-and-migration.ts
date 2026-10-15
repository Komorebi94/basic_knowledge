import type { Article } from "../articles";

export const microfrontendsMigrationArticle: Article = {
  id: "K13-06",
  kind: "knowledge",
  domainSlug: "architecture",
  slug: "microfrontends-and-migration",
  title: "微前端与渐进迁移",
  summary: "用发布节奏和运行时份数决定模块、包或隔离，拒绝跨应用共享可变状态，消息只收约定频道。",
  aliases: ["micro-frontend", "module federation", "migration", "渐进迁移"],
  tags: ["架构", "微前端", "迁移"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "订单页换了框架，为什么笔记购物车里的数量会在两边各算各的？",
      paragraphs: [
        "订单小组要独立发布，于是把页面嵌进笔记应用，并让两边同时读写一个购物车对象。笔记这边用一份 React，订单这边又打包了一份。数量在一侧加一，另一侧仍显示旧值，样式和路由也互相覆盖。隔离没有做完，共享状态却先做了。",
        "先问发布是否独立、框架是否不同、共享的是纯函数还是可变数据。同组一起发布用模块。别的组独立发布但框架相同，可以先用包。框架不同且独立发布才考虑隔离。可变存储不能跨应用共用。本篇只做这个选择，不启动两套构建。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：四种放置结果，消息只认识 notes:saved",
      paragraphs: [
        "运行 npm run verify:k13。place 先看 shares。mutable-store 直接返回 reject-shared-mutable，不再讨论框架。其余情况下，框架为 other 且发布独立返回 isolate；别的组且发布独立返回 package；同组且一起发布返回 module。其他组合是 invalid。",
        "runtimeShare 里 react 多于一份是 duplicate-runtime，恰好一份是 singleton。format 即使两份也是 duplicate-ok，因为它没有共享运行时身份。deliver 只接受频道 notes:saved 和非空 id，id 会去掉两端空白。"
      ]
    },
    {
      id: "place",
      title: "共享可变状态时，更强的隔离理由也不会把它变成合法边界",
      paragraphs: [
        "同组一起发布、框架相同、不共享状态，结果是 module。别的组、独立发布、框架不同，结果是 isolate。别的组、独立发布、框架相同，结果是 package，因为还没到必须拆运行时的程度。",
        "最后一组即使框架不同而且独立发布，只要 shares 是 mutable-store，结果仍是 reject-shared-mutable。应改成事件或各自持有的数据，而不是先嵌入再共用一个对象。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function place(part) {
  if (part.shares === 'mutable-store') return 'reject-shared-mutable';
  if (part.framework === 'other' && part.release === 'independent') return 'isolate';
  if (part.team === 'other' && part.release === 'independent') return 'package';
  if (part.team === 'same' && part.release === 'together') return 'module';
  return 'invalid';
}
console.log('同组:' + place({ team: 'same', release: 'together', framework: 'same', shares: 'none' }));
console.log('独立框架:' + place({ team: 'other', release: 'independent', framework: 'other', shares: 'none' }));
console.log('独立同框架:' + place({ team: 'other', release: 'independent', framework: 'same', shares: 'none' }));
console.log('共享状态:' + place({ team: 'other', release: 'independent', framework: 'other', shares: 'mutable-store' }));`,
          expectedOutput: [
            "同组:module",
            "独立框架:isolate",
            "独立同框架:package",
            "共享状态:reject-shared-mutable"
          ],
          explanation: [
            "独立同框架停在 package，避免只为了组织边界就拆两套运行时。框架不同且要独立发布，才返回 isolate。",
            "共享状态的判断在框架判断之前。后三个字段即使满足隔离条件，也不能让可变购物车穿过边界。"
          ]
        }
      ]
    },
    {
      id: "runtime",
      title: "界面运行时要单份，纯函数可以重复，消息必须带约定频道",
      paragraphs: [
        "两份 react 返回 duplicate-runtime，一份返回 singleton。两份 format 返回 duplicate-ok。运行时重复会让钩子、上下文和事件系统各认各的实例；没有身份的格式化函数重复，主要是体积问题。",
        "频道 notes:saved 且 id 为 ' n1 ' 时得到 delivered:n1。空 id 是 bad-payload。order:paid 是 unknown-channel。隔离之后的通信只携带已经约定的事实，不把函数、DOM 节点或存储对象传过去。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function runtimeShare(name, copies) {
  if (!Number.isInteger(copies) || copies < 1) return 'invalid';
  if (name === 'react' && copies > 1) return 'duplicate-runtime';
  if (name === 'react') return 'singleton';
  if (name === 'format') return 'duplicate-ok';
  return 'invalid';
}
function deliver(message) {
  if (!message || message.channel !== 'notes:saved') return 'unknown-channel';
  if (typeof message.id !== 'string' || !message.id.trim()) return 'bad-payload';
  return 'delivered:' + message.id.trim();
}
console.log('两份运行时:' + runtimeShare('react', 2));
console.log('一份运行时:' + runtimeShare('react', 1));
console.log('纯函数:' + runtimeShare('format', 2));
console.log('消息:' + deliver({ channel: 'notes:saved', id: ' n1 ' }));
console.log('坏消息:' + deliver({ channel: 'notes:saved', id: '' }));
console.log('错频道:' + deliver({ channel: 'order:paid', id: 'n1' }));`,
          expectedOutput: [
            "两份运行时:duplicate-runtime",
            "一份运行时:singleton",
            "纯函数:duplicate-ok",
            "消息:delivered:n1",
            "坏消息:bad-payload",
            "错频道:unknown-channel"
          ],
          explanation: [
            "react 的份数是运行时身份问题，format 的份数不是。未知库名返回 invalid，不能把没分类的依赖说成可以随意复制。",
            "消息只留下修剪后的 id。空 id 和错误频道都不会被当成笔记已保存，接收方也就不会去改自己的列表。"
          ]
        }
      ]
    },
    {
      id: "migration",
      title: "迁移先切一条能独立验证的路径，不先拆所有目录",
      paragraphs: [
        "若只是订单页要换实现，可以先让它成为包，由笔记应用一起发布，等发布节奏真的不同再隔离。隔离之后用 notes:saved 这类消息同步结果，笔记应用自己更新列表。购物车数量仍只留在一个所有者那里。",
        "共享依赖要显式列出。界面运行时保持 singleton。日期和金额格式化可以重复，直到体积成为问题。K11-07 的源和沙箱仍然决定嵌入页能不能碰笔记文档，place 返回 isolate 并不自动带上这些限制。"
      ]
    },
    {
      id: "boundaries",
      title: "放置函数不构建应用，单份运行时也不保证版本兼容",
      paragraphs: [
        "模型没有打包器，没有模块联邦配置，也没有测量加载时间。isolate 只表示这种输入在教学规则里值得分开运行，不表示已经有一个安全的 iframe 或独立部署。",
        "singleton 只看份数是 1。两份相同版本号的 React 仍然是 duplicate-runtime。一份过旧的 React 即使份数正确，也可能不认识调用方的 API。版本范围要另查。",
        "deliver 不校验来源。K11-07 要求先核对消息来自哪个源，再读 id。只认频道会被同页面里的其他脚本冒充。"
      ]
    },
    {
      id: "practice",
      title: "先写不能共享的状态，再决定包还是隔离",
      paragraphs: [
        "列出发布节奏、框架和共享数据。可变对象直接拒绝。框架相同的独立发布先试包。只有运行时必须分开时才隔离，并规定一份界面运行时和一条消息频道。",
        "本主题没有已开放的独立练习。示例不生成第二套构建。"
      ]
    }
  ],
  sources: [
    { title: "Micro Frontends", url: "https://micro-frontends.org/" },
    { title: "webpack：Module Federation", url: "https://webpack.js.org/concepts/module-federation/" },
    { title: "MDN：postMessage", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage" }
  ]
};
