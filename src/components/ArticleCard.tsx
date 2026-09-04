import { Link, useLocation } from 'react-router-dom'
import { getModule } from '@/content/modules'
import type { Article } from '@/content/types'
import { cn } from '@/lib/cn'
import { DEPTH_LABEL } from '@/lib/labels'

type ArticleCardProps = {
    article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
    const { search } = useLocation()
    const module = getModule(article.module)
    const visibleTags = article.tags.slice(0, 2)

    return (
        <li className="border-b border-line">
            <Link
                to={`/${article.module}/${article.slug}${search}`}
                className="group flex cursor-pointer items-start gap-3 py-3.5 transition-colors duration-200 hover:bg-surface-hover"
            >
                <span
                    aria-hidden
                    className="mt-1.5 block h-5 w-0.5 shrink-0"
                    style={{ background: module.accent }}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                        <h2 className="text-[15px] font-medium tracking-tight text-ink group-hover:text-accent">
                            {article.title}
                        </h2>
                        <p className="flex shrink-0 items-center gap-2 text-xs text-muted">
                            <span>
                                {module.label}
                                <span aria-hidden> · </span>
                                {DEPTH_LABEL[article.depth]}
                            </span>
                            <HeatDots value={article.heat} />
                        </p>
                    </div>
                    <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                        <p className="min-w-0 line-clamp-1 text-sm leading-6 text-muted">
                            {article.summary}
                        </p>
                        {visibleTags.length > 0 ? (
                            <p className="shrink-0 text-xs text-faint">{visibleTags.join(' · ')}</p>
                        ) : null}
                    </div>
                </div>
            </Link>
        </li>
    )
}

function HeatDots({ value }: { value: Article['heat'] }) {
    return (
        <span className="inline-flex items-center gap-1.5" title={`重要程度 ${value} / 5`}>
            <span className="sr-only">重要程度 {value} / 5</span>
            <span aria-hidden className="inline-flex items-center gap-1">
                {Array.from({ length: 5 }, (_, index) => (
                    <span
                        key={index}
                        className={cn(
                            'size-2 rounded-full',
                            index < value ? 'bg-accent' : 'bg-line-strong',
                        )}
                    />
                ))}
            </span>
        </span>
    )
}
