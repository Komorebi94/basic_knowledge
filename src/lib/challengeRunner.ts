export type ChallengeTestResult = {
    name: string
    passed: boolean
    error?: string
}

type WorkerResponse = {
    channel: 'challenge-result'
    runId: string
    results: ChallengeTestResult[]
}

const workerSource = [
    "'use strict'",
    "for (const key of ['fetch', 'WebSocket', 'EventSource', 'importScripts']) {",
    '    try { Object.defineProperty(self, key, { value: undefined }) } catch {}',
    '}',
    'self.onmessage = async (event) => {',
    '    const { runId, code, testCode } = event.data',
    '    const tests = []',
    '    const test = (name, run) => tests.push({ name, run })',
    "    const assert = (condition, message = '断言失败') => { if (!condition) throw new Error(message) }",
    '    const equal = (actual, expected) => { if (!Object.is(actual, expected)) throw new Error(`期望 ${String(expected)}，实际 ${String(actual)}`) }',
    '    const deepEqual = (actual, expected) => {',
    '        const actualText = JSON.stringify(actual)',
    '        const expectedText = JSON.stringify(expected)',
    '        if (actualText !== expectedText) throw new Error(`期望 ${expectedText}，实际 ${actualText}`)',
    '    }',
    '    const rejects = async (promise, message) => {',
    '        try {',
    '            await promise',
    "            throw new Error('期望 Promise 被拒绝，但它成功了')",
    '        } catch (error) {',
    "            if (error?.message === '期望 Promise 被拒绝，但它成功了') throw error",
    '            if (message && !String(error?.message).includes(message)) {',
    '                throw new Error(`错误信息应包含 ${message}，实际为 ${String(error?.message)}`)',
    '            }',
    '        }',
    '    }',
    '    const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))',
    '',
    '    try {',
    '        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor',
    "        const execute = new AsyncFunction('test', 'assert', 'equal', 'deepEqual', 'rejects', 'sleep', `${code}\\n${testCode}`)",
    '        await execute(test, assert, equal, deepEqual, rejects, sleep)',
    '        const results = []',
    '        for (const current of tests) {',
    '            try {',
    '                await current.run()',
    '                results.push({ name: current.name, passed: true })',
    '            } catch (error) {',
    '                results.push({ name: current.name, passed: false, error: error instanceof Error ? error.message : String(error) })',
    '            }',
    '        }',
    "        self.postMessage({ channel: 'challenge-result', runId, results })",
    '    } catch (error) {',
    "        self.postMessage({ channel: 'challenge-result', runId, results: [{ name: '代码加载', passed: false, error: error instanceof Error ? error.message : String(error) }] })",
    '    }',
    '}',
].join('\n')

export function runChallenge(
    code: string,
    testCode: string,
    timeoutMs = 3_000,
): Promise<ChallengeTestResult[]> {
    const runId = crypto.randomUUID()
    const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }))
    const worker = new Worker(workerUrl)

    return new Promise((resolve) => {
        const finish = (results: ChallengeTestResult[]) => {
            clearTimeout(timeout)
            worker.terminate()
            URL.revokeObjectURL(workerUrl)
            resolve(results)
        }

        const timeout = window.setTimeout(() => {
            finish([
                {
                    name: '执行超时',
                    passed: false,
                    error: `代码运行超过 ${timeoutMs}ms，可能存在死循环或未完成的异步任务。`,
                },
            ])
        }, timeoutMs)

        worker.onmessage = (event: MessageEvent<unknown>) => {
            if (!isWorkerResponse(event.data) || event.data.runId !== runId) return
            finish(event.data.results)
        }

        worker.onerror = (event) => {
            finish([{ name: '运行环境', passed: false, error: event.message }])
        }

        worker.postMessage({ runId, code, testCode })
    })
}

function isWorkerResponse(value: unknown): value is WorkerResponse {
    if (!value || typeof value !== 'object') return false

    const candidate = value as Partial<WorkerResponse>
    return (
        candidate.channel === 'challenge-result' &&
        typeof candidate.runId === 'string' &&
        Array.isArray(candidate.results)
    )
}
