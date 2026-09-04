import { aiArticles } from './ai'
import { browserArticles } from './browser'
import { cssArticles } from './css'
import { engineeringArticles } from './engineering'
import { handwritingArticles } from './handwriting'
import { foundationArticles } from './foundations'
import { javascriptArticles } from './javascript'
import type { Article, Depth, ModuleId } from './types'
import { reactArticles } from './react'
import { typescriptArticles } from './typescript'
import { vueArticles } from './vue'

export const articles: Article[] = [
    ...reactArticles,
    ...vueArticles,
    ...javascriptArticles,
    ...browserArticles,
    ...typescriptArticles,
    ...cssArticles,
    ...engineeringArticles,
    ...foundationArticles,
    ...handwritingArticles,
    ...aiArticles,
]

validateArticles(articles)

export function getArticle(moduleId: ModuleId, slug: string): Article | undefined {
    return articles.find((item) => item.module === moduleId && item.slug === slug)
}

function validateArticles(items: Article[]): void {
    const keys = new Set<string>()

    for (const item of items) {
        const key = `${item.module}/${item.slug}`
        if (keys.has(key)) {
            throw new Error(`Duplicate article: ${key}`)
        }
        if (!item.title.trim() || !item.summary.trim() || !item.body.trim()) {
            throw new Error(`Incomplete article: ${key}`)
        }
        if (item.pitfalls.length === 0) {
            throw new Error(`Article has no pitfalls: ${key}`)
        }
        keys.add(key)
    }
}

export function getRelated(article: Article, limit = 3): Article[] {
    return articles
        .filter((item) => item.module === article.module && item.slug !== article.slug)
        .sort((a, b) => b.heat - a.heat)
        .slice(0, limit)
}

export type ArticleQuery = {
    module?: ModuleId
    depth?: Depth
    search?: string
}

export function queryArticles({ module, depth, search }: ArticleQuery): Article[] {
    const keyword = search?.trim().toLowerCase() ?? ''

    return articles
        .filter((item) => (module ? item.module === module : true))
        .filter((item) => (depth ? item.depth === depth : true))
        .filter((item) => {
            if (!keyword) return true
            const haystack = [
                item.title,
                item.summary,
                item.overview,
                item.tags.join(' '),
                item.body,
            ]
                .join('\n')
                .toLowerCase()
            return haystack.includes(keyword)
        })
        .sort((a, b) => b.heat - a.heat || a.title.localeCompare(b.title, 'zh-CN'))
}
