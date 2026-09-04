import { NavLink, useLocation } from 'react-router-dom'
import { MODULES } from '@/content/modules'
import { cn } from '@/lib/cn'

type ModuleTabsProps = {
    active?: string
}

export function ModuleTabs({ active }: ModuleTabsProps) {
    const { search } = useLocation()

    const tabClass = ({ isActive }: { isActive: boolean }) =>
        cn(
            'shrink-0 cursor-pointer border-b-2 px-2.5 py-1.5 text-sm transition-colors duration-200',
            isActive ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
        )

    return (
        <nav aria-label="知识模块" className="-mx-1 flex gap-1 overflow-x-auto px-1">
            <NavLink to={{ pathname: '/', search }} end className={tabClass}>
                全部
            </NavLink>
            {MODULES.map((module) => (
                <NavLink
                    key={module.id}
                    to={{ pathname: `/${module.id}`, search }}
                    className={({ isActive }) =>
                        cn(tabClass({ isActive: isActive || active === module.id }))
                    }
                >
                    {module.label}
                </NavLink>
            ))}
        </nav>
    )
}
