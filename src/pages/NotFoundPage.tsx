import { Link } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'

export function NotFoundPage() {
    return (
        <div className="min-h-screen">
            <AppHeader search="" onSearchChange={() => undefined} showSearch={false} />
            <main id="main" className="mx-auto max-w-6xl px-5 py-16">
                <p className="text-xs tracking-wide text-accent">404</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                    没有这个页面
                </h1>
                <p className="mt-3 max-w-xl text-[15px] leading-7 text-body">
                    路径不存在，或模块名写错了。
                </p>
                <Link
                    to="/"
                    className="mt-6 inline-block cursor-pointer text-sm text-accent transition-colors duration-200 hover:underline"
                >
                    回到首页
                </Link>
            </main>
        </div>
    )
}
