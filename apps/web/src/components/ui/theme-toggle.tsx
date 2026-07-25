import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/theme'
import type { ThemePreference } from '../../lib/theme'
import { Button } from './button'

const themeOrder: ThemePreference[] = ['system', 'light', 'dark']

export function ThemeToggle() {
  const { preference, setThemePreference } = useTheme()
  const nextTheme =
    themeOrder[(themeOrder.indexOf(preference) + 1) % themeOrder.length]
  const label = `${preference[0].toUpperCase()}${preference.slice(1)} theme`
  const Icon =
    preference === 'system' ? Monitor : preference === 'dark' ? Moon : Sun

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setThemePreference(nextTheme)}
      aria-label={`${label}. Switch to ${nextTheme} theme`}
      title={`${label}. Click for ${nextTheme} theme.`}
      className="w-full justify-start sm:w-auto sm:justify-center"
    >
      <Icon className="size-4" aria-hidden />
      <span className="sm:hidden">{label}</span>
    </Button>
  )
}
