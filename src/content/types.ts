export const MODULE_IDS = [
    'react',
    'vue',
    'javascript',
    'browser',
    'typescript',
    'css',
    'engineering',
    'handwriting',
    'ai',
] as const

export type ModuleId = (typeof MODULE_IDS)[number]

export const DEPTHS = ['intro', 'core', 'deep'] as const

export type Depth = (typeof DEPTHS)[number]

export type CodingChallenge = {
    functionName: string
    instructions: string[]
    starterCode: string
    solutionCode: string
    testCode: string
}

export type Article = {
    slug: string
    module: ModuleId
    title: string
    summary: string
    depth: Depth
    heat: 1 | 2 | 3 | 4 | 5
    year: 2026
    tags: string[]
    overview: string
    body: string
    pitfalls: string[]
}

export function isModuleId(value: string): value is ModuleId {
    return (MODULE_IDS as readonly string[]).includes(value)
}
