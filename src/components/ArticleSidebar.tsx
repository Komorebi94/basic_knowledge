import { ArrowLeft } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { Article, ModuleId } from '@/content/types'
import { cn } from '@/lib/cn'

type ArticleSidebarProps = {
    activeSlug: string
    articles: Article[]
    moduleId: ModuleId
    moduleLabel: string
}

export function ArticleSidebar({
    activeSlug,
    articles,
    moduleId,
    moduleLabel,
}: ArticleSidebarProps) {
    const { search } = useLocation()

    return (
        <aside className="min-w-0 lg:sticky lg:top-16 lg:self-start">
            <Link
                to={`/${moduleId}${search}`}
                className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-ink"
            >
                <ArrowLeft className="size-4" />
                返回 {moduleLabel}
            </Link>

            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <h2 className="text-sm font-medium text-ink">目录</h2>
                <span className="text-xs text-faint tabular-nums">{articles.length} 篇</span>
            </div>

            <nav
                aria-label={`${moduleLabel}目录`}
                className="lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto"
            >
                <ol className="-mx-1 flex gap-1 overflow-x-auto px-1 py-2 lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0">
                    {articles.map((item, index) => {
                        const isActive = item.slug === activeSlug

                        return (
                            <li key={item.slug} className="shrink-0 lg:w-auto">
                                <Link
                                    to={`/${item.module}/${item.slug}${search}`}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={cn(
                                        'flex cursor-pointer items-start gap-2 px-2 py-1.5 text-sm leading-5 transition-colors duration-200 lg:px-2 lg:py-2',
                                        isActive
                                            ? 'border-b-2 border-accent text-ink lg:border-b-0 lg:border-l-2'
                                            : 'border-b-2 border-transparent text-muted hover:text-ink lg:border-b-0 lg:border-l-2',
                                    )}
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'mt-0.5 w-5 shrink-0 font-mono text-xs',
                                            isActive ? 'text-accent' : 'text-faint',
                                        )}
                                    >
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="max-w-[11rem] truncate lg:max-w-none lg:line-clamp-2 lg:whitespace-normal">
                                        {item.title}
                                    </span>
                                </Link>
                            </li>
                        )
                    })}
                </ol>
            </nav>
        </aside>
    )
}
