import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { themeStorageKey } from './theme-script'

export type ThemePreference = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

const listeners = new Set<() => void>()
let cachedPreference: ThemePreference | undefined
let listeningForStorage = false

function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = window.localStorage.getItem(themeStorageKey)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyPreference(preference: ThemePreference) {
  document.documentElement.dataset.theme = resolveTheme(preference)
}

function getPreferenceSnapshot() {
  cachedPreference ??= getStoredPreference()
  return cachedPreference
}

function getServerPreferenceSnapshot(): ThemePreference {
  return 'system'
}

function emitPreference(preference: ThemePreference) {
  cachedPreference = preference
  for (const listener of listeners) listener()
}

function handleStorage(event: StorageEvent) {
  if (event.key !== themeStorageKey && event.key !== null) return
  const preference = getStoredPreference()
  applyPreference(preference)
  emitPreference(preference)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!listeningForStorage) {
    window.addEventListener('storage', handleStorage)
    listeningForStorage = true
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && listeningForStorage) {
      window.removeEventListener('storage', handleStorage)
      listeningForStorage = false
    }
  }
}

export function useTheme() {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribe,
    getPreferenceSnapshot,
    getServerPreferenceSnapshot,
  )

  useEffect(() => {
    applyPreference(preference)
    if (preference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyPreference('system')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preference])

  const setThemePreference = useCallback((next: ThemePreference) => {
    applyPreference(next)
    try {
      if (next === 'system') window.localStorage.removeItem(themeStorageKey)
      else window.localStorage.setItem(themeStorageKey, next)
    } catch {
      // Storage unavailable; the preference still applies for this session.
    }
    emitPreference(next)
  }, [])

  return {
    preference,
    setThemePreference,
  }
}
