import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text placeholder:text-faint transition-colors focus:border-brand focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}
