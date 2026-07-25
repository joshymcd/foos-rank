import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const palette = [
  '--brand',
  '--accent',
  '--team-blue',
  '--success',
  '--live',
  '--warning',
  '--team-red',
]

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
}

export function Avatar({
  name,
  size = 'md',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  name: string
  size?: keyof typeof sizes
}) {
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colorVar = palette[hash % palette.length]
  const initials = name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        sizes[size],
        className,
      )}
      style={{
        background: `color-mix(in srgb, var(${colorVar}) 18%, var(--card))`,
        color: `var(${colorVar})`,
      }}
      {...props}
    >
      {initials}
    </span>
  )
}
