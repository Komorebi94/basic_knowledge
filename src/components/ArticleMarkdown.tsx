import type { ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type ArticleMarkdownProps = {
    children: string
}

export function ArticleMarkdown({ children }: ArticleMarkdownProps) {
    return (
        <Markdown remarkPlugins={[remarkGfm]} components={components}>
            {children}
        </Markdown>
    )
}

const components = {
    h2: ({ children }: { children?: ReactNode }) => (
        <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight text-ink">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
        <h3 className="mt-6 mb-2 text-base font-medium text-ink">{children}</h3>
    ),
    p: ({ children }: { children?: ReactNode }) => (
        <p className="mb-4 text-[15px] leading-7 text-body">{children}</p>
    ),
    ul: ({ children }: { children?: ReactNode }) => (
        <ul className="mb-4 list-disc space-y-1 pl-5 text-[15px] leading-7 text-body">
            {children}
        </ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
        <ol className="mb-4 list-decimal space-y-1 pl-5 text-[15px] leading-7 text-body">
            {children}
        </ol>
    ),
    li: ({ children }: { children?: ReactNode }) => <li className="pl-1">{children}</li>,
    strong: ({ children }: { children?: ReactNode }) => (
        <strong className="font-medium text-ink">{children}</strong>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
        <blockquote className="mb-5 border-l-2 border-accent/60 px-4 text-ink [&>p]:mb-4 [&>p]:text-ink">
            {children}
        </blockquote>
    ),
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
        <a href={href} className="text-accent underline-offset-2 hover:underline">
            {children}
        </a>
    ),
    code: ({ children, className }: { children?: ReactNode; className?: string }) => {
        const isBlock = Boolean(className)
        if (isBlock) {
            return <code className="font-mono text-[13px] text-ink">{children}</code>
        }
        return (
            <code className="rounded-md bg-canvas px-1 py-0.5 font-mono text-[13px] text-accent ring-1 ring-line">
                {children}
            </code>
        )
    },
    pre: ({ children }: { children?: ReactNode }) => (
        <pre className="mb-4 overflow-x-auto rounded-md border border-line bg-canvas p-4 font-mono text-[13px] leading-6">
            {children}
        </pre>
    ),
}
