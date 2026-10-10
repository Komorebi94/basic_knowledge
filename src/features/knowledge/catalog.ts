import { knowledgeTopics } from "../../content/catalog";

export interface KnowledgeDomain {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly topics: readonly (typeof knowledgeTopics)[number][];
}

const domainDefinitions: readonly Omit<KnowledgeDomain, "topics">[] = [
  { id: "K01", slug: "javascript", title: "JavaScript 语言机制", summary: "从语言语义推导行为，理解对象、作用域和模块。" },
  { id: "K02", slug: "async", title: "异步与并发", summary: "预测执行顺序，控制竞态、取消与失败。" },
  { id: "K03", slug: "typescript", title: "TypeScript 类型建模", summary: "用类型和运行时校验表达真实的领域约束。" },
  { id: "K04", slug: "browser", title: "浏览器与 Web 平台", summary: "定位浏览器执行、渲染和存储问题。" },
  { id: "K05", slug: "html-css", title: "HTML、CSS 与布局", summary: "写出结构正确、尺寸可预测的界面。" },
  { id: "K06", slug: "networking", title: "网络与接口协作", summary: "设计可取消、可缓存、失败可恢复的数据链路。" },
  { id: "K07", slug: "react", title: "React 核心与工程实践", summary: "从状态所有权和更新机制推导界面行为。" },
  { id: "K08", slug: "vue", title: "Vue 核心与工程实践", summary: "解释依赖追踪、组件通信与组合式复用。" },
  { id: "K09", slug: "tooling", title: "工程化与构建", summary: "解释开发与生产差异，让交付可复现。" },
  { id: "K10", slug: "performance", title: "性能工程", summary: "先测量瓶颈，再优化真实体验。" },
  { id: "K11", slug: "security", title: "安全与隐私", summary: "理解信任边界、授权与数据保护。" },
  { id: "K12", slug: "testing", title: "测试与质量", summary: "建立可重复的行为证据和回归检查。" },
  { id: "K13", slug: "architecture", title: "架构与复杂业务", summary: "在约束下拆分职责并解释取舍。" },
  { id: "K14", slug: "server", title: "Node、SSR 与全栈边界", summary: "理解服务端渲染和前后端运行时差异。" },
  { id: "K15", slug: "accessibility", title: "无障碍与交互质量", summary: "让键盘、读屏和不同尺寸都能完成核心流程。" },
  { id: "K16", slug: "algorithms", title: "数据结构与问题求解", summary: "为前端场景选择合适的数据结构与算法。" },
];

export const knowledgeDomains: readonly KnowledgeDomain[] = domainDefinitions.map((domain) => ({
  ...domain,
  topics: knowledgeTopics.filter((topic) => topic.domainId === domain.id),
}));

export function findKnowledgeDomain(slug: string | undefined) {
  return knowledgeDomains.find((domain) => domain.slug === slug);
}
