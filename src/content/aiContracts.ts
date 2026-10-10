import { articles } from "./articles";
import { reviewCases } from "./learningContent";

export interface AiContentContract {
  readonly catalogId: string;
  readonly sourceContentId: string;
  readonly scenario: string;
  readonly requiredInputs: readonly string[];
  readonly taskTemplate: string | null;
  readonly guardrails: readonly string[];
  readonly verificationChecklist: readonly string[];
  readonly failurePatterns: readonly string[];
  readonly evidenceArtifacts: readonly string[];
  readonly toolScope: string;
}

const inputs: Readonly<Record<string, readonly string[]>> = {
  AI01: ["订单金额与数量", "金额单位和合法范围", "已确认计算规则"],
  AI02: ["错误复现", "真实调用链", "必须保持的行为", "验收预期"],
  AI03: ["目标需求", "当前仓库事实", "资料版本和来源", "上下文范围"],
  AI04: ["工具描述与参数合同", "可信授权范围", "外部输入", "执行结果"],
  AI05: ["用户行为目标", "依赖关系", "任务边界", "阶段验收"],
  AI06: ["实际仓库规则", "已有失败模式", "可执行检查", "规则适用范围"],
  AI07: ["功能需求", "调用方与现有模式", "成功/空/错误行为", "实际检查命令"],
  AI08: ["复现输入与步骤", "期望和实际行为", "错误轨迹", "可控回归用例"],
  AI09: ["需求合同", "具体改动", "调用方", "独立行为证据"],
  AI10: ["业务单位与合法域", "候选实现", "独立预期结果", "错误实现反例"],
  AI11: ["现有行为基线", "迁移范围", "接口与数据兼容要求", "回退条件"],
  AI12: ["需连接的数据或工具", "可复用流程", "项目约束", "实际宿主权限"],
  AI13: ["当前资料与历史版本", "请求主体与访问权限", "分块与索引版本", "独立检索评估集"],
  AI14: ["流事件合同", "请求身份与取消条件", "完成与部分结果判据", "断流及重试策略"],
  AI15: ["可信用户任务", "不可信资料", "工具允许集合", "可访问对象范围"],
  AI16: ["冻结的任务集", "成功判据", "执行轨迹", "失败类别与运行环境"],
  AI17: ["冻结的行为合同", "任务依赖图", "文件写入边界与基线修订", "交接及合并验收证据"],
  AI18: ["固定任务集与质量门槛", "输入输出及缓存用量", "重试与工具和人工开销", "延迟分布与预算"],
  AI19: ["任务输入输出合同", "运行环境", "阶段产物", "恢复与检查接口"],
  AI20: ["工作流基线", "候选变更", "固定评估样本", "保留的硬权限边界"],
};

export const aiContentContracts: readonly AiContentContract[] = articles.filter((article) => article.kind === "ai").map((article) => {
  const catalogId = article.catalogId ?? article.id;
  const sections = article.sections;
  const templates = sections.map((section) => section.code).filter((code): code is string => Boolean(code?.includes("【")));
  const boundaries = sections.filter((section) => ["boundaries", "limits", "constraints", "acceptance", "freshness", "transfer"].includes(section.id));
  const failures = sections.filter((section) => ["wrong", "case", "reproduction", "review", "verification"].includes(section.id));
  const evidence = sections.filter((section) => ["evidence", "verification", "workflow", "implementation", "repair", "migration", "feedback", "host", "grading", "experiment", "acceptance"].includes(section.id));
  const cases = reviewCases.filter((item) => item.catalogId === catalogId);
  return {
    catalogId,
    sourceContentId: article.id,
    scenario: sections.find((section) => section.id === "problem")?.paragraphs[0] ?? article.summary,
    requiredInputs: inputs[catalogId] ?? [],
    taskTemplate: templates.length ? templates.join("\n\n") : null,
    guardrails: boundaries.flatMap((section) => section.paragraphs),
    verificationChecklist: [...evidence.flatMap((section) => section.paragraphs), ...cases.flatMap((item) => item.questions)],
    failurePatterns: [...failures.flatMap((section) => section.paragraphs), ...cases.flatMap((item) => item.findings)],
    evidenceArtifacts: ["scripts/verify-articles.mjs", ["AI13", "AI14", "AI17", "AI18"].includes(catalogId) ? "docs/verification/article-examples-report.json" : "src/content/ai/p0-verification.json"],
    toolScope: "原创示例用于本地机制验证；不连接模型、不自动操作远端仓库。真实工具调用依任务授权与宿主权限执行。",
  };
});
