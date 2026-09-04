import { CheckCircle2, Eye, EyeOff, Play, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { CodingChallenge } from '@/content/types'
import { handleEditorKey } from '@/lib/codeEditor'
import { runChallenge, type ChallengeTestResult } from '@/lib/challengeRunner'

type CodingChallengeProps = {
    articleKey: string
    challenge: CodingChallenge
}

export function CodingChallenge({ articleKey, challenge }: CodingChallengeProps) {
    const storageKey = `knowledge-draft:${articleKey}`
    const [code, setCode] = useState(() => readDraft(storageKey) ?? challenge.starterCode)
    const [results, setResults] = useState<ChallengeTestResult[]>()
    const [isStale, setIsStale] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [showAnswer, setShowAnswer] = useState(false)
    const editorRef = useRef<HTMLTextAreaElement>(null)
    const gutterRef = useRef<HTMLDivElement>(null)
    const pendingSelection = useRef<{ start: number; end: number } | null>(null)

    const isDirty = code !== challenge.starterCode
    const lineCount = code.split('\n').length
    const passedCount = results?.filter((result) => result.passed).length ?? 0
    const allPassed = Boolean(results?.length && passedCount === results.length)

    useEffect(() => {
        const editor = editorRef.current
        const selection = pendingSelection.current
        if (!editor || !selection) return
        pendingSelection.current = null
        editor.setSelectionRange(selection.start, selection.end)
    }, [code])

    function updateCode(value: string) {
        setCode(value)
        if (results) setIsStale(true)
        saveDraft(storageKey, value)
    }

    async function validate() {
        setIsRunning(true)
        setIsStale(false)
        try {
            setResults(await runChallenge(code, challenge.testCode))
        } finally {
            setIsRunning(false)
        }
    }

    function reset() {
        if (isDirty && !window.confirm('恢复初始代码，并丢掉当前草稿？')) return
        setCode(challenge.starterCode)
        setResults(undefined)
        setIsStale(false)
        setShowAnswer(false)
        try {
            localStorage.removeItem(storageKey)
        } catch {
            // Storage may be unavailable in privacy mode; the editor still works in memory.
        }
    }

    function applyAnswer() {
        updateCode(challenge.solutionCode)
        setShowAnswer(true)
        editorRef.current?.focus()
    }

    function onEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault()
            if (!isRunning) void validate()
            return
        }

        if (event.key === 'Escape') {
            event.currentTarget.blur()
            return
        }

        const editor = event.currentTarget
        const next = handleEditorKey(
            editor.value,
            editor.selectionStart,
            editor.selectionEnd,
            event.key,
            event.shiftKey,
        )
        if (!next) return

        event.preventDefault()
        pendingSelection.current = {
            start: next.selectionStart,
            end: next.selectionEnd,
        }
        updateCode(next.value)
    }

    function syncGutter() {
        if (gutterRef.current && editorRef.current) {
            gutterRef.current.scrollTop = editorRef.current.scrollTop
        }
    }

    return (
        <section className="mt-10 border-t border-line pt-8" aria-labelledby="coding-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs tracking-wide text-accent">先写再看答案</p>
                    <h2 id="coding-title" className="mt-1 text-xl font-semibold text-ink">
                        手写 {challenge.functionName}
                    </h2>
                </div>
                <button type="button" onClick={reset} className={secondaryButtonClass}>
                    <RotateCcw className="size-3.5" />
                    重置
                </button>
            </div>

            <ul className="mt-4 list-disc space-y-1 pl-5 text-[15px] leading-7 text-body">
                {challenge.instructions.map((instruction) => (
                    <li key={instruction}>{instruction}</li>
                ))}
            </ul>

            <div className="mt-5 overflow-hidden rounded-md border border-line bg-canvas focus-within:border-accent">
                <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 text-xs text-faint">
                    <span>{challenge.functionName}.js</span>
                    <span>
                        {lineCount} 行{isDirty ? ' · 已改' : ' · 初始代码'}
                    </span>
                </div>
                <div className="flex max-h-[32rem] min-h-80">
                    <div
                        ref={gutterRef}
                        aria-hidden="true"
                        className="w-11 shrink-0 overflow-hidden border-r border-line bg-surface py-4 text-right font-mono text-[13px] leading-6 text-faint select-none"
                    >
                        {Array.from({ length: lineCount }, (_, index) => (
                            <div key={index} className="px-2">
                                {index + 1}
                            </div>
                        ))}
                    </div>
                    <label className="min-w-0 flex-1">
                        <span className="sr-only">手写代码编辑器</span>
                        <textarea
                            ref={editorRef}
                            value={code}
                            onChange={(event) => updateCode(event.target.value)}
                            onKeyDown={onEditorKeyDown}
                            onScroll={syncGutter}
                            spellCheck={false}
                            wrap="off"
                            autoCapitalize="off"
                            autoCorrect="off"
                            autoComplete="off"
                            className="block h-full min-h-80 w-full resize-none overflow-auto border-0 bg-transparent p-4 font-mono text-[13px] leading-6 text-ink outline-none focus-visible:outline-none"
                            style={{ tabSize: 4 }}
                        />
                    </label>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => void validate()}
                    disabled={isRunning}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                >
                    <Play className="size-3.5" />
                    {isRunning ? '校验中…' : '运行校验'}
                </button>
                <button
                    type="button"
                    onClick={() => setShowAnswer((current) => !current)}
                    className={secondaryButtonClass}
                >
                    {showAnswer ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {showAnswer ? '隐藏答案' : '查看答案'}
                </button>
                <button type="button" onClick={applyAnswer} className={secondaryButtonClass}>
                    <WandSparkles className="size-3.5" />
                    填入答案
                </button>
                <p className="text-xs text-faint">
                    Tab 缩进 · {modSymbol()}+Enter 运行 · Esc 离开编辑器
                </p>
            </div>

            {results ? (
                <div className="mt-5 border border-line p-4" aria-live="polite">
                    <p className={allPassed && !isStale ? 'text-sm text-ok' : 'text-sm text-ink'}>
                        {allPassed
                            ? `全部通过（${passedCount}/${results.length}）`
                            : `通过 ${passedCount}/${results.length}`}
                        {isStale ? ' · 代码已改，这是上次结果' : ''}
                    </p>
                    <ul className="mt-3 space-y-2">
                        {results.map((result) => (
                            <li
                                key={result.name}
                                className={`flex items-start gap-2 text-sm ${isStale ? 'opacity-70' : ''}`}
                            >
                                {result.passed ? (
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />
                                ) : (
                                    <XCircle className="mt-0.5 size-4 shrink-0 text-bad" />
                                )}
                                <span>
                                    <span className="text-ink">{result.name}</span>
                                    {result.error ? (
                                        <span className="mt-0.5 block text-xs leading-5 text-bad">
                                            {result.error}
                                        </span>
                                    ) : null}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {showAnswer ? (
                <div className="mt-5">
                    <p className="mb-2 text-xs text-faint">参考答案（不是唯一解）</p>
                    <pre className="overflow-x-auto rounded-md border border-line bg-canvas p-4 font-mono text-[13px] leading-6 text-ink">
                        <code>{challenge.solutionCode}</code>
                    </pre>
                </div>
            ) : null}

            <p className="mt-3 text-xs leading-5 text-faint">
                代码在独立 Worker 中运行，超过 3 秒会被终止。草稿仅保存在当前浏览器。
            </p>
        </section>
    )
}

const secondaryButtonClass =
    'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted ring-1 ring-line transition-colors hover:text-ink hover:ring-line-strong'

function modSymbol(): string {
    return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent)
        ? '⌘'
        : 'Ctrl'
}

function readDraft(key: string): string | undefined {
    try {
        return localStorage.getItem(key) ?? undefined
    } catch {
        return undefined
    }
}

function saveDraft(key: string, value: string): void {
    try {
        localStorage.setItem(key, value)
    } catch {
        // Storage may be unavailable or full; editing remains available in memory.
    }
}
