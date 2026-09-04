import { useDeferredValue, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { ArticleCard } from '@/components/ArticleCard'
import { DepthFilter } from '@/components/DepthFilter'
import { EmptyState } from '@/components/EmptyState'
import { ModuleTabs } from '@/components/ModuleTabs'
import { queryArticles } from '@/content'
import { getModule } from '@/content/modules'
import { DEPTHS, isModuleId, type Depth } from '@/content/types'

export function BoardPage() {
    const { moduleId } = useParams()
    const [params, setParams] = useSearchParams()
    const search = params.get('q') ?? ''
    const depth = parseDepth(params.get('depth'))
    const deferredSearch = useDeferredValue(search)
    const hasFilters = Boolean(search || depth)

    const module = moduleId && isModuleId(moduleId) ? moduleId : undefined
    const meta = module ? getModule(module) : undefined

    const list = useMemo(
        () => queryArticles({ module, depth, search: deferredSearch }),
        [module, depth, deferredSearch],
    )

    function setSearch(value: string) {
        setParams((current) => {
            const next = new URLSearchParams(current)
            if (value) next.set('q', value)
            else next.delete('q')
            return next
        })
    }

    function setDepth(value: Depth | undefined) {
        setParams((current) => {
            const next = new URLSearchParams(current)
            if (value) next.set('depth', value)
            else next.delete('depth')
            return next
        })
    }

    function clearFilters() {
        setParams((current) => {
            const next = new URLSearchParams(current)
            next.delete('q')
            next.delete('depth')
            return next
        })
    }

    return (
        <div className="min-h-screen">
            <AppHeader search={search} onSearchChange={setSearch} />
            <main id="main" className="mx-auto max-w-6xl px-5 py-6">
                <div className="mb-5 border-b border-line pb-3">
                    <ModuleTabs active={module} />
                    <div className="mt-2">
                        <DepthFilter value={depth} onChange={setDepth} />
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div>
                        <h1 className="text-sm font-medium text-ink">
                            {meta ? meta.label : '全部'}
                        </h1>
                        <p className="mt-1 text-sm text-muted">
                            {meta ? meta.description : '前端高频知识，按重要程度与模块复习。'}
                        </p>
                    </div>
                    <p className="text-xs text-faint tabular-nums">{list.length} 篇</p>
                </div>

                {list.length === 0 ? (
                    <EmptyState
                        title="没有匹配的条目"
                        hint="换一个模块、深度，或改短一点的关键词。"
                        actionLabel={hasFilters ? '清除筛选' : undefined}
                        onAction={hasFilters ? clearFilters : undefined}
                    />
                ) : (
                    <section aria-label="知识条目">
                        <ul>
                            {list.map((article) => (
                                <ArticleCard
                                    key={`${article.module}-${article.slug}`}
                                    article={article}
                                />
                            ))}
                        </ul>
                    </section>
                )}
            </main>
        </div>
    )
}

function parseDepth(value: string | null): Depth | undefined {
    if (value && (DEPTHS as readonly string[]).includes(value)) {
        return value as Depth
    }
    return undefined
}
