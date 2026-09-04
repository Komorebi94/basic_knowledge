export type ExtensionQuestion = {
    question: string
    direction: string
}

export function createReviewBody(
    explanation: string,
    answerScript: string,
    extensionQuestions: ExtensionQuestion[],
): string {
    const detailedExplanation = explanation.trim().replace(/^## /gm, '### ')
    const extensions = extensionQuestions
        .map(({ question, direction }) => `- **${question}** ${direction}`)
        .join('\n')

    return `## 1. 尽可能详细地理解问题

${detailedExplanation}

## 2. 总结回答话术

> ${answerScript}

## 3. 可拓展的问题

${extensions}`
}
