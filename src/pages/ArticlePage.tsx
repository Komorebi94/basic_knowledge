import { useEffect } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { ArticleMarkdown } from '@/components/ArticleMarkdown'
import { ArticleSidebar } from '@/components/ArticleSidebar'
import { CodingChallenge } from '@/components/CodingChallenge'
import { getArticle, queryArticles } from '@/content'
import { getHandwritingChallenge } from '@/content/handwriting-challenges'
import { getModule } from '@/content/modules'
import { isModuleId } from '@/content/types'
import { DEPTH_LABEL } from '@/lib/labels'

export function ArticlePage() {
    const { moduleId, slug } = useParams()
    const { search } = useLocation()

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' })
    }, [slug])

    if (!moduleId || !slug || !isModuleId(moduleId)) {
        return <Navigate to={{ pathname: '/', search }} replace />
    }

    const article = getArticle(moduleId, slug)
    if (!article) {
        return <Navigate to={`/${moduleId}${search}`} replace />
    }

    const module = getModule(article.module)
    const moduleArticles = queryArticles({ module: article.module })
    const challenge =
        article.module === 'handwriting' ? getHandwritingChallenge(article.slug) : undefined

    return (
        <div className="min-h-screen">
            <AppHeader search="" onSearchChange={() => undefined} showSearch={false} />
            <main id="main" className="mx-auto max-w-6xl px-5 py-6">
                <div className="grid items-start gap-8 lg:grid-cols-[16rem_minmax(0,42rem)] lg:gap-10">
                    <ArticleSidebar
                        activeSlug={article.slug}
                        articles={moduleArticles}
                        moduleId={article.module}
                        moduleLabel={module.label}
                    />

                    <article className="min-w-0">
                        <p className="text-xs tracking-wide text-muted">
                            {`${module.label} · ${DEPTH_LABEL[article.depth]} · 重要程度 ${article.heat}/5`}
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                            {article.title}
                        </h1>
                        <p className="mt-3 text-base leading-7 text-body">{article.summary}</p>

                        {article.tags.length > 0 ? (
                            <p className="mt-3 text-xs text-faint">{article.tags.join(' · ')}</p>
                        ) : null}

                        <section className="mt-10 border-t border-line pt-8">
                            <h2 className="text-sm font-medium tracking-wide text-accent">概述</h2>
                            <p className="mt-3 text-[15px] leading-7 text-body">
                                {article.overview}
                            </p>
                        </section>

                        {challenge ? (
                            <CodingChallenge
                                key={`${article.module}-${article.slug}`}
                                articleKey={`${article.module}/${article.slug}`}
                                challenge={challenge}
                            />
                        ) : null}

                        <section className="mt-8">
                            <ArticleMarkdown>{article.body}</ArticleMarkdown>
                        </section>

                        <section className="mt-10 border-t border-line pt-8">
                            <h2 className="text-sm font-medium tracking-wide text-accent">
                                易错点
                            </h2>
                            <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-body">
                                {article.pitfalls.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </section>
                    </article>
                </div>
            </main>
        </div>
    )
}
