import { articles, articleHref } from "./articles";
import { recallCards, reviewCases, p1AiIds } from "./learningContent";
import exercises from "./exerciseMetadata.json";
import retrievalStreamEvidence from "./ai/p1-retrieval-stream.json";
import collaborationCostEvidence from "./ai/p1-collaboration-cost.json";

export interface PublishedContent {
  readonly id: string;
  readonly catalogId: string;
  readonly kind: "knowledge" | "exercise" | "ai-guide" | "ai-template" | "ai-case";
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly domainId: string;
  readonly depth: "core" | "advanced" | "extension";
  readonly tags: readonly string[];
  readonly aliases: readonly string[];
  readonly estimatedMinutes: number;
  readonly status: "published";
  readonly revision: number;
  readonly updatedAt: string;
  readonly verifiedAt: string;
  readonly freshnessClass: "stable" | "practice" | "tool";
  readonly applicableVersions: readonly string[];
  readonly prerequisites: readonly string[];
  readonly relatedIds: readonly string[];
  readonly sources: readonly {
    title: string;
    url: string;
    publisher: string;
    publishedAt: string | null;
    checkedAt: string;
    claimScope: string;
  }[];
  readonly changeSummary: string;
  readonly href: string;
}

const templateIds = new Set(["AI02", "AI07", "AI08", "AI09", "AI11"]);
const supplementalPrerequisites: Readonly<Record<string, readonly string[]>> = {
  "K09-03": ["K09-01", "K09-02"],
  "K09-04": ["K03-01", "K09-01"],
  "K09-05": ["K09-01", "K09-03", "K06-02"],
  "K09-06": ["K01-07", "K09-02", "K03-07"],
  "K09-07": ["K09-01", "K09-04", "K09-05"],
  "K09-08": ["K09-02", "K09-05", "K09-06", "K09-07"],
  "K10-03": ["K10-01", "K10-02"],
  "K10-04": ["K10-02"],
  "K10-05": ["K06-02", "K10-03"],
  "K10-06": ["K09-03", "K09-05", "K10-03"],
  "K10-07": ["K10-01", "K09-08"],
  "K10-08": ["K10-01", "K10-02", "K10-03", "K10-07"],
  "K11-03": ["K11-01"],
  "K11-04": ["K11-01", "K09-02"],
  "K11-05": ["K11-02"],
  "K11-06": ["K11-01"],
  "K11-07": ["K11-01", "K04-01"],
  "K11-08": ["K11-01", "K11-02", "K12-02"],
  "K12-03": ["K12-01"],
  "K12-04": ["K12-02", "K02-01"],
  "K12-05": ["K12-02"],
  "K12-06": ["K12-01"],
  "K12-07": ["K12-02"],
  "K12-08": ["K12-01", "K12-02"],
  "K13-03": ["K13-02"],
  "K13-04": ["K11-02", "K13-01"],
  "K13-05": ["K13-01"],
  "K13-06": ["K13-01", "K11-07"],
  "K13-07": ["K13-01"],
  "K13-08": ["K13-01", "K10-07"],
  "K14-03": ["K14-01"],
  "K14-04": ["K14-01", "K11-02"],
  "K14-05": ["K14-02"],
  "K14-06": ["K14-02", "K11-05"],
  "K14-07": ["K14-01"],
  "K14-08": ["K14-04", "K11-05"],
  "K15-03": ["K15-02"],
  "K15-04": ["K15-02"],
  "K15-05": ["K15-01"],
  "K15-06": ["K15-02"],
  "K15-07": ["K15-01"],
  "K15-08": ["K15-03", "K15-01"],
  "K16-03": ["K16-02"],
  "K16-04": ["K16-01"],
  "K16-05": ["K16-01"],
  "K16-06": ["K16-02"],
  "K16-07": ["K16-01"],
  "K16-08": ["K16-04", "K10-04"],
  "K08-03": ["K08-01", "K08-02"],
  "K08-04": ["K08-01", "K08-02", "K08-03", "K02-05"],
  "K08-05": ["K08-01", "K08-03", "K08-04"],
  "K08-06": ["K08-02", "K08-03", "K08-04", "K08-05"],
  "K08-07": ["K08-04", "K08-05", "K08-06"],
  "K08-08": ["K08-01", "K08-02", "K08-04", "K08-05"],
  "K03-03": ["K03-01", "K03-02"],
  "K03-04": ["K03-02", "K03-03"],
  "K03-05": ["K03-02", "K03-03"],
  "K03-06": ["K03-01", "K03-04"],
  "K03-07": ["K01-07", "K03-01", "K03-05"],
  "K03-08": ["K03-04", "K03-06"],
  "K04-03": ["K01-02", "K04-01"],
  "K04-04": ["K01-01", "K02-02"],
  "K04-05": ["K04-02"],
  "K04-06": ["K02-05", "K04-04"],
  "K04-07": ["K04-04", "K04-06"],
  "K04-08": ["K04-03", "K02-02"],
  "K05-03": ["K05-02"],
  "K05-04": ["K05-03"],
  "K05-05": ["K05-02"],
  "K05-06": ["K04-02", "K05-02"],
  "K05-07": ["K05-03"],
  "K05-08": ["K05-02", "K05-03"],
  "K06-03": ["K06-01"],
  "K06-04": ["K06-02"],
  "K06-05": ["K06-02"],
  "K06-06": ["K02-05", "K06-02"],
  "K06-07": ["K02-05", "K06-02"],
  "K06-08": ["K06-02"],
  "K07-03": ["K07-01"],
  "K07-04": ["K07-01", "K07-03"],
  "K07-05": ["K07-01", "K07-02"],
  "K07-06": ["K07-01", "K07-02"],
  "K07-07": ["K07-04"],
  "K07-08": ["K07-01", "K04-02"],
};
const practiceSource = {
  title: "ECMAScript 语言规范",
  url: "https://tc39.es/ecma262/",
  publisher: "TC39",
  publishedAt: null,
  checkedAt: "2026-10-08",
  claimScope: "Promise、迭代、对象及集合语义；题目特定的数据域以题面为准。",
};

// Publication metadata is derived from reviewed repository content, never from personal backups.
export const contentManifest: readonly PublishedContent[] = [
  ...articles.map((article): PublishedContent => {
    const catalogId = article.catalogId ?? article.id;
    const exerciseIds = exercises.filter((exercise) => exercise.knowledgeIds.includes(catalogId)).map((exercise) => exercise.id);
    const unit = Number(catalogId.split("-")[1]);
    const evidence = [...retrievalStreamEvidence.evidence, ...collaborationCostEvidence.evidence].find(item => item.catalogId === catalogId);
    return {
      id: article.id,
      catalogId,
      kind: article.kind === "knowledge" ? "knowledge" : reviewCases.some((item) => item.catalogId === catalogId) ? "ai-case" : templateIds.has(catalogId) ? "ai-template" : "ai-guide",
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      domainId: article.kind === "knowledge" ? catalogId.split("-")[0] ?? catalogId : "ai",
      depth: article.kind === "ai" ? p1AiIds.includes(catalogId) ? "advanced" : "core" : unit <= 2 ? "core" : unit <= 6 ? "advanced" : "extension",
      tags: article.tags,
      aliases: article.aliases,
      estimatedMinutes: article.estimatedMinutes,
      status: "published",
      revision: 1,
      updatedAt: /^K0[89]-0[1-8]$/.test(catalogId) || /^K1[0-6]-0[3-8]$/.test(catalogId) ? article.verifiedAt : supplementalPrerequisites[catalogId] ? "2026-10-12" : p1AiIds.includes(catalogId) ? "2026-10-09" : "2026-10-08",
      verifiedAt: article.verifiedAt,
      freshnessClass: article.kind === "ai" ? ["AI04", "AI12"].includes(catalogId) ? "tool" : "practice" : "stable",
      applicableVersions: /^K16-0[3-8]$/.test(catalogId) ? ["树遍历、有序查找、窗口、栈、状态转移和列表窗口在隔离空白页执行，使用固定作者输入。它们不是包安装器、排行榜、编辑器历史、虚拟列表或渲染耗时。"] : /^K15-0[3-8]$/.test(catalogId) ? ["错误恢复、保存步骤、目标尺寸、对比比值、控件键表和发布门禁在隔离空白页执行，使用固定作者输入。它们不是读屏、设备测量、对比度扫描器或 WCAG 符合性结论。"] : /^K14-0[3-8]$/.test(catalogId) ? ["流队列、聚合、分段输出、缓存键、运行时能力表和请求记录在隔离空白页执行，使用固定作者输入。它们不是 Node 流、真实 BFF、服务端渲染、CDN 或追踪系统。"] : /^K13-0[3-8]$/.test(catalogId) ? ["表单、权限、组件契约、边界选择、配置查找和容量分档在隔离空白页执行，使用固定作者输入。阈值和角色表是教学模型，不是生产配置、访问控制或容量评估。"] : /^K12-0[3-8]$/.test(catalogId) ? ["替身、虚拟时钟、数据隔离、属性判断和门禁记录在隔离空白页执行，使用固定作者输入。K12-05 查询空白页里的真实元素。这些模型不是测试框架、浏览器事件循环或持续集成。"] : /^K11-0[3-8]$/.test(catalogId) ? ["策略、来源和消息判断在隔离空白页执行，使用固定作者输入。模型不是完整 CSP、npm 安装或浏览器沙箱实现，也不发送外部请求。"] : /^K10-0[3-8]$/.test(catalogId) ? ["DOMParser 与 createElement 在隔离空白页执行；K10-06 使用 Rolldown 1.2.11 打包固定模块。其余时间为作者模型单位，不是真实用户 LCP/INP 或生产预算。"] : /^K09-0[3-8]$/.test(catalogId) ? ["Node 22.22.3、Rolldown 1.2.11、TypeScript 6.0.3；固定作者模块与临时产物；发布调度和缓存算法为明确教学模型，未执行真实 CI/CD"] : /^K08-0[128]$/.test(catalogId) ? ["Vue 3.5.43 开发浏览器运行时；K08-01/02 保留明确标注的 JS 教学模型；性能例子验证行为，不作为生产耗时基准"] : catalogId === "K08-07" ? ["Vue/server-renderer 3.5.43；Node ES 模块真实 SSR、浏览器接管；不验收 SFC 双构建、生产 SSR 或流式响应"] : catalogId === "K08-06" ? ["Vue 3.5.43、Vue Router 4.6.4；内存历史与导航守卫；保存为教学替身；未执行 Pinia、浏览器历史或 SSR"] : catalogId === "K08-05" ? ["Vue 3.5.43 完整浏览器构建；固定作者模板实际编译；VNode 内部形状按此版本观察；不执行 SFC、SSR 或生产性能基准"] : catalogId === "K08-04" ? ["Vue 3.5.43 浏览器开发运行时；toValue 需 Vue 3.3+；不执行 SFC 编译、KeepAlive 或 SSR"] : catalogId === "K08-03" ? ["Vue 3.5.43 浏览器开发运行时；显式 props/emits；defineModel 需 Vue 3.4+ 的 SFC 编译"] : /^K03-0[3-8]$/.test(catalogId) ? ["TypeScript 6.0.3；strict、noUncheckedIndexedAccess；可选属性和模块额外条件见正文"] : /^K05-0[3-8]$/.test(catalogId) ? ["现代浏览器空白页；几何结果以 Chrome 实测为准，容器查询、层叠层与 Popover 需要相应实现"] : /^K06-0[3-8]$/.test(catalogId) ? ["现代浏览器 Fetch、URL、Blob 与 AbortController；协议选择是教学清单，不是一次抓包"] : catalogId === "K07-07" ? ["客户端包 React 19.3.0；服务器组件边界按 React 19 文档；示例不执行服务器组件"] : /^K07-0[3-8]$/.test(catalogId) ? ["React 19.3.0 文档中的可观察行为；示例是教学模型，空白页不挂载 React"] : evidence?.applicableVersions ?? ["通用；具体运行环境与框架条件见正文示例"],
      prerequisites: supplementalPrerequisites[catalogId] ?? [],
      relatedIds: exerciseIds,
      sources: article.sources.map((source) => ({
        ...source,
        publisher: new URL(source.url).hostname,
        publishedAt: null,
        checkedAt: article.verifiedAt,
        claimScope: evidence?.sources.find(item => item.url === source.url)?.claimScope ?? "正文中相关机制与 API 的参考资料；独立示例输出由仓库验证脚本核对。",
      })),
      changeSummary: "补齐教程、回忆卡片和关联练习。",
      href: articleHref(article),
    };
  }),
  ...exercises.map((exercise): PublishedContent => ({
    id: exercise.id, catalogId: exercise.id, kind: "exercise", slug: exercise.slug,
    title: exercise.title, summary: exercise.summary, domainId: "practice", depth: "core",
    tags: ["JavaScript", "行为验证"], aliases: [], estimatedMinutes: exercise.estimatedMinutes,
    status: "published", revision: exercise.revision, updatedAt: exercise.updatedAt, verifiedAt: exercise.verifiedAt,
    freshnessClass: "stable", applicableVersions: ["现代 JavaScript；时间用例使用虚拟时钟"],
    prerequisites: exercise.knowledgeIds, relatedIds: exercise.knowledgeIds,
    sources: [practiceSource], changeSummary: "补齐题面、分层提示、参考解析及行为用例。",
    href: `/practice/${exercise.slug}`,
  })),
];

export const publishedCardCount = recallCards.length;
