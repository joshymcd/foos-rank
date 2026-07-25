import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center',
        className,
      )}
      {...props}
    >
      {icon && <span className="mb-1 text-faint">{icon}</span>}
      <p className="font-semibold text-text">{title}</p>
      {description && <p className="text-sm text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
