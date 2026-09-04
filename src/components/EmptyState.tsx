type EmptyStateProps = {
    title: string
    hint: string
    actionLabel?: string
    onAction?: () => void
}

export function EmptyState({ title, hint, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="border-y border-dashed border-line py-12">
            <p className="text-base font-medium text-ink">{title}</p>
            <p className="mt-2 text-sm text-muted">{hint}</p>
            {actionLabel && onAction ? (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-5 cursor-pointer text-sm text-accent transition-colors duration-200 hover:underline"
                >
                    {actionLabel}
                </button>
            ) : null}
        </div>
    )
}
