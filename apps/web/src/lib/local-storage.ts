export function readStoredArray<T>(key: string): T[] {
  const value = window.localStorage.getItem(key)
  if (value === null) return []

  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed as T[]
  } catch {
    // Fall through to the recoverable error below.
  }

  throw new Error(
    `The saved ${key} data is invalid. Reset local data to continue.`,
  )
}

export function updateStoredArray<T>(key: string, update: (items: T[]) => T[]) {
  const next = update(readStoredArray<T>(key))
  window.localStorage.setItem(key, JSON.stringify(next))
  return next
}
