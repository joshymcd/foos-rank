import { cn } from '../../lib/cn'

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  label?: string
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-surface p-1',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
            value === option.value
              ? 'bg-card text-text shadow-sm'
              : 'text-muted hover:text-text',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
