/** Repository-authored source only. Never register user-imported code as exercise content. */
export interface ExerciseTestCase {
  readonly id: string;
  readonly name: string;
  readonly purpose: string;
  readonly code: string;
  readonly setup: string;
  readonly input: string;
  readonly expectedOutcome: string;
  readonly cleanup: string;
}
export interface Exercise {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly runtime: string;
  readonly estimatedMinutes: number;
  readonly revision: number;
  readonly updatedAt: string;
  readonly verifiedAt: string;
  readonly entryContract: string;
  readonly problem: readonly string[];
  readonly allowedApis: readonly string[];
  readonly unsupportedBehavior: readonly string[];
  readonly starterArtifact: string;
  readonly hints: readonly [string, string, string];
  readonly referenceArtifact: string;
  readonly explanation: readonly string[];
  readonly alternative: string;
  readonly complexity: string;
  readonly commonMistakes: readonly string[];
  readonly knowledgeIds: readonly string[];
  readonly timeoutMs: number;
  readonly examples: readonly { readonly code: string; readonly expectedOutput: string; readonly expectedLogs: readonly string[]; readonly explanation: string }[];
  readonly testCases: readonly ExerciseTestCase[];
  readonly wrongImplementations: readonly { readonly name: string; readonly code: string }[];
}
