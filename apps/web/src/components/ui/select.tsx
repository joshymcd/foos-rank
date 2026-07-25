import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text transition-colors focus:border-brand focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}
