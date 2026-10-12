import { genericsConstraintsArticle } from "./knowledge/generics-and-constraints";
import { conditionalMappedArticle } from "./knowledge/conditional-and-mapped-types";
import { functionVarianceArticle } from "./knowledge/function-types-variance";
import { utilityDomainArticle } from "./knowledge/utility-and-domain-types";
import { declarationsLibraryArticle } from "./knowledge/declarations-public-libraries";
import { maintainableTypesArticle } from "./knowledge/maintainable-complex-types";
import { eventPropagationArticle } from "./knowledge/event-propagation-defaults";
import { storageQuotasArticle } from "./knowledge/storage-and-quotas";
import { observersViewportArticle } from "./knowledge/observers-and-viewport";
import { navigationRecoveryArticle } from "./knowledge/navigation-history-recovery";
import { serviceWorkerOfflineArticle } from "./knowledge/service-worker-offline";
import { platformEnhancementArticle } from "./knowledge/platform-progressive-enhancement";
import { flexGridConstraintsArticle } from "./knowledge/flex-and-grid-constraints";
import { responsiveContainerArticle } from "./knowledge/responsive-container-queries";
import { cascadeLayersArticle } from "./knowledge/cascade-layers-and-selectors";
import { animationFeedbackArticle } from "./knowledge/animation-and-feedback";
import { internationalTypographyArticle } from "./knowledge/international-typography";
import { layoutDiagnosisArticle } from "./knowledge/layout-diagnosis";
import { connectionsTlsProtocolsArticle } from "./knowledge/connections-tls-protocols";
import { cookiesSessionsRefreshArticle } from "./knowledge/cookies-sessions-refresh";
import { sameOriginCorsArticle } from "./knowledge/same-origin-cors";
import { streamsAndSocketsArticle } from "./knowledge/streams-and-sockets";
import { largeTransfersArticle } from "./knowledge/large-transfers";
import { apiContractsEvolutionArticle } from "./knowledge/api-contracts-evolution";
import { componentIdentityKeysArticle } from "./knowledge/component-identity-and-keys";
import { stateOwnershipDataFlowArticle } from "./knowledge/state-ownership-and-data-flow";
import { concurrentSuspenseArticle } from "./knowledge/concurrent-rendering-suspense";
import { hooksReuseBoundariesArticle } from "./knowledge/hooks-and-reuse-boundaries";
import { serverComponentsBoundaryArticle } from "./knowledge/server-components-boundary";
import { performanceDiagnosisArticle } from "./knowledge/performance-diagnosis";
import { authAuthorizationArticle } from "./knowledge/auth-authorization-csrf";
import { behaviorBoundaryArticle } from "./knowledge/behavior-boundary-tests";
import { boxesAndStackingArticle } from "./knowledge/boxes-and-stacking";
import { runtimeBoundariesArticle } from "./knowledge/browser-node-boundaries";
import { complexityScaleArticle } from "./knowledge/complexity-scale";
import { computedAndWatchArticle } from "./knowledge/computed-and-watch";
import { dependenciesAndLockfilesArticle } from "./knowledge/dependencies-and-lockfiles";
import { discriminatedStateArticle } from "./knowledge/discriminated-state";
import { effectsAndSynchronizationArticle } from "./knowledge/effects-and-synchronization";
import { experienceMetricsArticle } from "./knowledge/experience-metrics";
import { httpCacheValidationArticle } from "./knowledge/http-cache-validation";
import { keyboardFocusArticle } from "./knowledge/keyboard-focus";
import { mainThreadLongTasksArticle } from "./knowledge/main-thread-long-tasks";
import { mapsSetsQueuesArticle } from "./knowledge/maps-sets-queues-cache";
import { moduleBoundariesArticle } from "./knowledge/module-boundaries";
import { moduleGraphsAndLoadingArticle } from "./knowledge/module-graphs-and-loading";
import { navigationToPixelsArticle } from "./knowledge/navigation-to-pixels";
import { reactivityTrackingArticle } from "./knowledge/reactivity-tracking";
import { renderStateSnapshotsArticle } from "./knowledge/render-state-snapshots";
import { renderingHydrationArticle } from "./knowledge/rendering-and-hydration";
import { renderingAndLayoutArticle } from "./knowledge/rendering-and-layout";
import { requestsAndIdempotencyArticle } from "./knowledge/requests-and-idempotency";
import { semanticInteractionsArticle } from "./knowledge/semantic-interactions";
import { semanticsFeedbackArticle } from "./knowledge/semantics-names-feedback";
import { stateOwnershipArticle } from "./knowledge/state-ownership";
import { testingLevelsArticle } from "./knowledge/testing-levels";
import { xssOutputArticle } from "./knowledge/xss-output-context";
import { aiBugInvestigationArticle } from "./ai/ai-bug-investigation";
import { aiFeatureDevelopmentArticle } from "./ai/ai-feature-development";
import { contextEngineeringArticle } from "./ai/context-engineering";
import { designAndTaskSplittingArticle } from "./ai/design-and-task-splitting";
import { evalsAndTracesArticle } from "./ai/evals-and-traces";
import { harnessReliabilityArticle } from "./ai/harness-reliability";
import { llmFoundationsArticle } from "./ai/llm-foundations";
import { mcpSkillsInstructionsArticle } from "./ai/mcp-skills-instructions";
import { promptInjectionBoundariesArticle } from "./ai/prompt-injection-boundaries";
import { refactorAndMigrateArticle } from "./ai/refactor-and-migrate";
import { repositoryRulesArticle } from "./ai/repository-rules";
import { reviewAiCodeArticle } from "./ai/review-ai-code";
import { testAiOutputArticle } from "./ai/test-ai-output";
import { toolCallingAndAgentsArticle } from "./ai/tool-calling-and-agents";
import { workflowUpgradeEvaluationArticle } from "./ai/workflow-upgrade-evaluation";
import { retrievalFreshnessArticle } from "./ai/retrieval-freshness";
import { streamingExperienceArticle } from "./ai/streaming-experience";
import { multiAgentConflictsArticle } from "./ai/multi-agent-conflicts";
import { costLatencyModelChoiceArticle } from "./ai/cost-latency-model-choice";
import { valuesArticle } from "./knowledge/values-and-equality";
import { closureArticle } from "./knowledge/closures";
import { thisArticle } from "./knowledge/this-binding";
import { prototypeArticle } from "./knowledge/prototypes";
import { descriptorArticle } from "./knowledge/property-descriptors";
import { iteratorArticle } from "./knowledge/iterators";
import { moduleArticle } from "./knowledge/modules";
import { memoryArticle } from "./knowledge/memory";
import { tasksArticle } from "./knowledge/tasks-and-microtasks";
import { promiseArticle } from "./knowledge/promises";
import { asyncAwaitArticle } from "./knowledge/async-await";
import { concurrencyArticle } from "./knowledge/concurrency";
import { cancellationArticle } from "./knowledge/cancellation";
import { retryArticle } from "./knowledge/retry";
import { workerArticle } from "./knowledge/workers";
import { traceArticle } from "./knowledge/traces";
import { unknownArticle } from "./knowledge/unknown-and-boundaries";
import { taskContractArticle } from "./ai/task-contract";

export interface ArticleSection {
  id: string;
  title: string;
  paragraphs: readonly string[];
  code?: string;
  examples?: readonly { language?: "javascript" | "typescript" | "module"; code: string; explanation: readonly string[]; expectedOutput: readonly string[] }[];
  diagram?: { caption: string; lines: readonly string[] };
}

export interface Article {
  id: string;
  catalogId?: string;
  kind: "knowledge" | "ai";
  domainSlug?: string;
  slug: string;
  title: string;
  summary: string;
  aliases: readonly string[];
  tags: readonly string[];
  estimatedMinutes: number;
  verifiedAt: string;
  sections: readonly ArticleSection[];
  sources: readonly { title: string; url: string }[];
}

export const articles: readonly Article[] = [
  eventPropagationArticle,
  storageQuotasArticle,
  observersViewportArticle,
  navigationRecoveryArticle,
  serviceWorkerOfflineArticle,
  platformEnhancementArticle,
  flexGridConstraintsArticle,
  responsiveContainerArticle,
  cascadeLayersArticle,
  animationFeedbackArticle,
  internationalTypographyArticle,
  layoutDiagnosisArticle,
  connectionsTlsProtocolsArticle,
  cookiesSessionsRefreshArticle,
  sameOriginCorsArticle,
  streamsAndSocketsArticle,
  largeTransfersArticle,
  apiContractsEvolutionArticle,
  componentIdentityKeysArticle,
  stateOwnershipDataFlowArticle,
  concurrentSuspenseArticle,
  hooksReuseBoundariesArticle,
  serverComponentsBoundaryArticle,
  performanceDiagnosisArticle,

  valuesArticle,
  closureArticle,
  thisArticle,
  prototypeArticle,
  descriptorArticle,
  iteratorArticle,
  moduleArticle,
  memoryArticle,
  tasksArticle,
  promiseArticle,
  asyncAwaitArticle,
  concurrencyArticle,
  cancellationArticle,
  retryArticle,
  workerArticle,
  traceArticle,
  unknownArticle,
  taskContractArticle,
  authAuthorizationArticle,
  behaviorBoundaryArticle,
  boxesAndStackingArticle,
  runtimeBoundariesArticle,
  complexityScaleArticle,
  computedAndWatchArticle,
  dependenciesAndLockfilesArticle,
  discriminatedStateArticle,
  genericsConstraintsArticle,
  conditionalMappedArticle,
  functionVarianceArticle,
  utilityDomainArticle,
  declarationsLibraryArticle,
  maintainableTypesArticle,

  effectsAndSynchronizationArticle,
  experienceMetricsArticle,
  httpCacheValidationArticle,
  keyboardFocusArticle,
  mainThreadLongTasksArticle,
  mapsSetsQueuesArticle,
  moduleBoundariesArticle,
  moduleGraphsAndLoadingArticle,
  navigationToPixelsArticle,
  reactivityTrackingArticle,
  renderStateSnapshotsArticle,
  renderingHydrationArticle,
  renderingAndLayoutArticle,
  requestsAndIdempotencyArticle,
  semanticInteractionsArticle,
  semanticsFeedbackArticle,
  stateOwnershipArticle,
  testingLevelsArticle,
  xssOutputArticle,
  aiBugInvestigationArticle,
  aiFeatureDevelopmentArticle,
  contextEngineeringArticle,
  designAndTaskSplittingArticle,
  evalsAndTracesArticle,
  harnessReliabilityArticle,
  llmFoundationsArticle,
  mcpSkillsInstructionsArticle,
  promptInjectionBoundariesArticle,
  refactorAndMigrateArticle,
  repositoryRulesArticle,
  reviewAiCodeArticle,
  testAiOutputArticle,
  toolCallingAndAgentsArticle,
  workflowUpgradeEvaluationArticle,
  retrievalFreshnessArticle,
  streamingExperienceArticle,
  multiAgentConflictsArticle,
  costLatencyModelChoiceArticle,
];

export function articleHref(article: Article): string {
  return article.kind === "ai" ? `/ai/${article.slug}` : `/knowledge/${article.domainSlug}/${article.slug}`;
}

export function findArticle(kind: Article["kind"], slug: string | undefined, domainSlug?: string): Article | undefined {
  return articles.find((article) => article.kind === kind && article.slug === slug && (kind === "ai" || article.domainSlug === domainSlug));
}
