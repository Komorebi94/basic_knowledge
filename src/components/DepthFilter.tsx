import { DEPTHS, type Depth } from '@/content/types'
import { cn } from '@/lib/cn'
import { DEPTH_LABEL } from '@/lib/labels'

type DepthFilterProps = {
    value?: Depth
    onChange: (value: Depth | undefined) => void
}

export function DepthFilter({ value, onChange }: DepthFilterProps) {
    return (
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="深度">
            <span className="mr-1 text-xs text-faint">深度</span>
            <button
                type="button"
                onClick={() => onChange(undefined)}
                className={chipClass(value === undefined)}
            >
                全部
            </button>
            {DEPTHS.map((depth) => (
                <button
                    key={depth}
                    type="button"
                    onClick={() => onChange(depth)}
                    className={chipClass(value === depth)}
                >
                    {DEPTH_LABEL[depth]}
                </button>
            ))}
        </div>
    )
}

function chipClass(active: boolean): string {
    return cn(
        'cursor-pointer border-b-2 px-2 py-1 text-xs transition-colors duration-200',
        active ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink',
    )
}
