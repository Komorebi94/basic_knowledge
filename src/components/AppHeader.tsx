import { Link } from 'react-router-dom'
import { SearchBar } from './SearchBar'

type AppHeaderProps = {
    search: string
    onSearchChange: (value: string) => void
    showSearch?: boolean
}

export function AppHeader({ search, onSearchChange, showSearch = true }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
                <Link to="/" className="cursor-pointer">
                    <span className="text-base font-semibold tracking-tight text-ink">
                        前端知识库
                    </span>
                </Link>
                {showSearch ? <SearchBar value={search} onChange={onSearchChange} /> : null}
            </div>
        </header>
    )
}
