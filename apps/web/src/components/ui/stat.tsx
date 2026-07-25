import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Card } from './card'

export function Stat({
  label,
  value,
  icon,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  label: string
  value: ReactNode
  icon?: ReactNode
}) {
  return (
    <Card className={cn('p-5', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
        {icon && <span className="text-faint">{icon}</span>}
      </div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums text-text">
        {value}
      </div>
    </Card>
  )
}
