import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import { isModuleId } from '@/content/types'
import { ArticlePage } from '@/pages/ArticlePage'
import { BoardPage } from '@/pages/BoardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
    return (
        <BrowserRouter basename={routerBasename()}>
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
            >
                跳到正文
            </a>
            <Routes>
                <Route path="/" element={<BoardPage />} />
                <Route path="/:moduleId" element={<ModuleBoardPage />} />
                <Route path="/:moduleId/:slug" element={<ArticlePage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    )
}

function routerBasename(): string | undefined {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    return base === '' ? undefined : base
}

function ModuleBoardPage() {
    const { moduleId } = useParams()
    if (!moduleId || !isModuleId(moduleId)) {
        return <NotFoundPage />
    }
    return <BoardPage />
}
