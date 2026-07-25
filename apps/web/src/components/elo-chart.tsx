import type { EloHistoryPoint } from '../domain/elo'

const WIDTH = 100
const HEIGHT = 36

export function EloSparkline({ history }: { history: EloHistoryPoint[] }) {
  if (history.length < 2) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-muted">
        Play a match to start the rating timeline.
      </div>
    )
  }
  const elos = history.map((point) => point.elo)
  const min = Math.min(...elos)
  const max = Math.max(...elos)
  const range = max - min || 1
  const points = history.map((point, index) => {
    const x = (index / (history.length - 1)) * WIDTH
    const y = HEIGHT - 3 - ((point.elo - min) / range) * (HEIGHT - 6)
    return [x, y] as const
  })
  const line = points.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `0,${HEIGHT} ${line} ${WIDTH},${HEIGHT}`
  const [lastX, lastY] = points[points.length - 1]
  const baselineY =
    HEIGHT - 3 - ((1000 - min) / range) * (HEIGHT - 6)

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="h-24 w-full"
      role="img"
      aria-label={`Rating history from ${elos[0]} to ${elos[elos.length - 1]}`}
    >
      <polygon points={area} fill="var(--brand)" opacity="0.12" />
      {baselineY >= 0 && baselineY <= HEIGHT && (
        <line
          x1="0"
          y1={baselineY}
          x2={WIDTH}
          y2={baselineY}
          stroke="var(--faint)"
          strokeWidth="0.4"
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <polyline
        points={line}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="2" fill="var(--brand)" />
    </svg>
  )
}
