import { Search } from 'lucide-react'

type SearchBarProps = {
    value: string
    onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <label className="relative block w-full max-w-md">
            <span className="sr-only">搜索知识点</span>
            <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
            />
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="搜索标题、标签或正文"
                className="h-9 w-full rounded-md border border-line bg-surface py-2 pr-3 pl-9 text-sm text-ink placeholder:text-faint transition-colors duration-200 hover:border-line-strong focus:border-accent focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            />
        </label>
    )
}
