import type { Article } from "../articles";

export const renderingHydrationArticle: Article = {
  id: "K14-02", kind: "knowledge", domainSlug: "server", slug: "rendering-and-hydration",
  title: "CSR、SSR、SSG 与水合",
  summary: "沿 HTML 生成、数据获取与交互接续的时间线比较渲染方案，解释首屏有文字却不能点击、首次状态不一致及跨用户缓存风险。",
  aliases: ["CSR", "SSR", "SSG", "hydration", "水合"], tags: ["渲染", "服务端", "React"],
  estimatedMinutes: 22, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "页面已经显示按钮，为什么点击暂时没有反应？", paragraphs: [
      "服务端返回含按钮的 HTML，浏览器解析后可以显示外观。客户端 JavaScript 还没有下载与接续完成，按钮上依赖框架的行为未必已经可用。显示内容与获得交互能力是两个时刻，SSR 不意味着不需要客户端代码。",
      "CSR 通常由客户端获取数据并生成主要界面；SSR 在请求阶段产生 HTML；SSG 在构建阶段预先生成 HTML。水合是客户端框架在已有服务端标记上接续组件行为与状态。它们描述不同步骤，可以在一项产品里组合，不能用一个简称推断所有缓存和交互策略。",
    ] },
    { id: "timeline", title: "比较时把资源与数据的发现时机放在同一时间线", paragraphs: [
      "CSR 的空壳可能需要先下载并执行脚本，脚本再请求数据，数据到达后才渲染正文；如果这些步骤串行，用户等待会累加。SSR 可以较早提供正文结构，但服务器仍可能等待数据，客户端随后仍有脚本与水合成本。SSG 省去每次请求的页面计算，却需要解决内容更新和失效。",
      "下面是依赖关系的确定性模型，不是网络性能测量。数字仅表示示例阶段耗时，真实体验还受并行、流式响应、缓存、网络和设备影响。先用模型找是否存在不必要串行，再用实测判断优化幅度。",
    ], examples: [{ code: `const stages = { script: 4, data: 3, render: 1 };
const sequential = stages.script + stages.data + stages.render;
const parallelDiscovery = Math.max(stages.script, stages.data) + stages.render;
console.log(sequential);
console.log(parallelDiscovery);
console.log(sequential - parallelDiscovery);`, expectedOutput: ["8", "5", "3"], explanation: [
      "串行模型先等待 script，再 data，最后 render，总计 8。若两项独立资源可以一起发现，等待较长的 4 之后渲染，总计 5；差值来自消除了串行依赖。",
      "这个算式不证明真实 SSR 一定快 3，也不证明所有数据可以提前请求。带权限或用户输入依赖的数据不能凭优化目标越过身份边界，性能结论需要目标环境的分布证据。",
    ] }] },
    { id: "first-state", title: "水合要求服务端与客户端第一次呈现有一致来源", paragraphs: [
      "服务端输出时间、随机 ID 或用户数据，客户端初次渲染却重新计算，就可能得到不同结构。框架接续时发现标记与预期不一致，会报告问题或采取恢复；掩盖警告不能修复两端状态合同。",
      "把服务器用于渲染的必要初始数据安全地交给客户端，使用相同确定性输入，让第一次呈现一致。客户端特有的窗口尺寸或本地偏好，可在接续后按设计更新；不应要求服务端读取不存在的浏览器对象。",
    ], examples: [{ code: `function renderLabel(snapshot) {
  return snapshot.title + ':' + snapshot.count;
}
const serverSnapshot = { title: '笔记', count: 3 };
const wrongClientSnapshot = { title: '笔记', count: 0 };
const sameClientSnapshot = { ...serverSnapshot };
console.log(renderLabel(serverSnapshot) === renderLabel(wrongClientSnapshot));
console.log(renderLabel(serverSnapshot) === renderLabel(sameClientSnapshot));
console.log(renderLabel(sameClientSnapshot));`, expectedOutput: ["false", "true", "笔记:3"], explanation: [
      "客户端默认 count=0 与服务器 count=3 不同，第一次标签不一致。使用服务器快照之后，两边得到相同字符串。这里把状态来源的问题缩成纯函数比较，便于独立推导。",
      "字符串比较不是完整水合算法，也不能捕获全部 DOM 差异。真实项目要在使用的框架与版本中检查错误回调、标记结构和交互接续；不要把模型输出写成已完成 React 水合测试。",
    ] }] },
    { id: "framework", title: "接续入口和数据安全是实现层的明确责任", paragraphs: [
      "React 中已有服务端标记通常使用 hydrateRoot 接续，空容器客户端渲染使用 createRoot。应用组件的初次输入必须与服务器对应；框架并不自动猜出服务器当时读到了哪份记录。下面展示入口形状，需在真实 React 构建环境中提供 App 与安全初始数据，并非可粘贴到普通控制台的独立示例。",
      "初始数据嵌入 HTML 时还跨过输出上下文。直接把 JSON.stringify 结果拼进 script 内容，仍需处理脚本结束序列与框架规定的序列化规则。优先使用框架提供的安全传输机制；不要为了首次一致把令牌、私密环境配置或其它用户数据一同发送。",
    ], code: `// React 客户端入口；服务器需用相同的 snapshot 渲染 App。
import { hydrateRoot } from 'react-dom/client';
import { App } from './App';
import { readInitialSnapshot } from './initial-data';
const container = document.getElementById('root');
if (!container) throw new Error('missing-root');
const snapshot = readInitialSnapshot(); // 按项目实际合同校验初始数据
hydrateRoot(container, <App snapshot={snapshot} />);
// App、initial-data 是示例边界；需按目标项目实际模块实现。` },
    { id: "cache", title: "缓存必须区分公开内容与用户相关结果", paragraphs: [
      "SSG 适合能够在发布阶段确定的公开内容。SSR 可以基于当前请求取数据，但若把个性化 HTML 放进只按路径区分的共享缓存，下一个用户可能得到上一位用户的页面。渲染方法与缓存安全是独立维度，选择 SSR 不会自动隔离用户。",
    ], examples: [{ code: `const cache = new Map();
function getPage(userId) {
  const key = '/notes';
  if (!cache.has(key)) cache.set(key, 'notes-for-' + userId);
  return cache.get(key);
}
console.log(getPage('A'));
console.log(getPage('B'));
const privateCache = new Map();
privateCache.set('A:/notes', 'notes-for-A');
console.log(privateCache.has('B:/notes'));`, expectedOutput: ["notes-for-A", "notes-for-A", "false"], explanation: [
      "错误缓存只用路径作键。A 第一次写入之后，B 命中同一条目，读到 A 内容。后面的私有模型包含用户身份，B 不会命中 A 的条目。",
      "包含 userId 只是模型，不是完整共享缓存建议；实际私有数据常应禁止公开共享缓存，并明确权限变化、租户、失效和服务端会话来源。不能信任客户端自报 ID 作为隔离凭据。",
    ] }] },
    { id: "choices", title: "从新鲜度、交互和运营约束选择组合", paragraphs: [
      "公开手册更新不频繁，预生成通常简单；高度个性化页面需要按请求取数据及严格私有缓存；交互工具的核心计算可能在客户端。SEO、首屏、服务器成本、构建耗时和错误恢复需要一起衡量，没有一种方案对所有页面都占优。",
      "流式 SSR 可以先交付部分结构，但部分失败、加载边界与客户端接续也变得更复杂。若数据本来就能缓存并提前发现，先优化依赖瀑布可能比全面更换框架更小。",
      "至少两个边界分别是第一份数据的一致性，以及个性化响应的缓存隔离。第三个是交互可用时刻：服务端 HTML 已显示但客户端失败时，关键操作如何反馈或降级，需要产品合同而非渲染简称。",
    ] },
    { id: "verification", title: "验证静态内容、首次状态与最终交互三个阶段", paragraphs: [
      "分别检查关闭脚本时服务器提供什么、正常接续是否报告不一致、接续后点击和导航是否正确。再用两个用户或租户检查缓存不交叉，并模拟数据失败及客户端资源失效。",
      "性能记录服务端响应、正文显示、交互就绪和布局变化，固定网络与设备多次运行。不能只用一次最快的 SSR 截图宣称全部用户体验提高。本文模型输出是推理证据，真实水合与性能需要在目标应用中执行。",
    ] },
    { id: "recall", title: "解释页面已有 HTML 与仍需 JavaScript 的关系", paragraphs: [
      "已有 HTML 能让浏览器显示内容；客户端代码还负责事件、状态与后续变化。初次接续读取相同快照，之后才进入客户端更新生命周期。",
      "选择预生成或按请求生成时，先说明内容何时变化、谁能看到，以及缓存何时失效。把这三件事写清，比只宣布“采用 SSR”更接近可验证方案。",
    ] },
  ],
  sources: [
    { title: "React：hydrateRoot 与首次一致性", url: "https://react.dev/reference/react-dom/client/hydrateRoot" },
    { title: "MDN：HTTP 缓存边界", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching" },
  ],
};
