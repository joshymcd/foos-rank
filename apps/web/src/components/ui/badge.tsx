import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'danger'
  | 'live'
  | 'gold'
  | 'silver'
  | 'bronze'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface text-muted',
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger/10 text-danger',
  live: 'bg-live-soft text-live',
  gold: 'bg-gold/15 text-gold',
  silver: 'bg-silver/15 text-silver',
  bronze: 'bg-bronze/15 text-bronze',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
