import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from 0 (or its previous value) to `target` with an
 * ease-out curve. Returns `target` immediately when the user prefers
 * reduced motion.
 */
export function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0)
  const previous = useRef(0)

  useEffect(() => {
    const from = previous.current
    previous.current = target
    if (
      from === target ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setValue(target)
      return
    }
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
