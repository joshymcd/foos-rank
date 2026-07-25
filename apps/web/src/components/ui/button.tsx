import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand shadow-sm hover:bg-brand/90',
  secondary: 'bg-surface text-text hover:bg-surface-2',
  outline: 'border border-border bg-card text-text hover:bg-surface',
  ghost: 'text-muted hover:bg-surface hover:text-text',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
}

export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return cn(
    'inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}
