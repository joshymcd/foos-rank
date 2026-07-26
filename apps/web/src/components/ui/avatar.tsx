import BoringAvatar from 'boring-avatars'
import { cn } from '../../lib/cn'

const colors = [
  '#cba6f7',
  '#89b4fa',
  '#a6e3a1',
  '#fab387',
  '#f38ba8',
  '#f9e2af',
]

const sizes = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-full bg-brand-soft ring-1 ring-border',
        sizes[size],
        className,
      )}
    >
      <BoringAvatar
        size="100%"
        name={name.trim().toLowerCase()}
        variant="beam"
        colors={colors}
      />
    </span>
  )
}
