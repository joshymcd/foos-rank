import { organizationIdSchema } from '../domain/entities'

export const recentOrganizationsKey = 'foosrank-recent-organizations'

export function getRecentOrganizationIds() {
  if (typeof window === 'undefined') return []
  const value = window.localStorage.getItem(recentOrganizationsKey)
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return [
      ...new Set(
        parsed.flatMap((id) => {
          const result = organizationIdSchema.safeParse(id)
          return result.success ? [result.data] : []
        }),
      ),
    ].slice(0, 20)
  } catch {
    return []
  }
}

export function setRecentOrganizationIds(ids: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    recentOrganizationsKey,
    JSON.stringify([...new Set(ids)].slice(0, 20)),
  )
}

export function rememberOrganization(id: string) {
  setRecentOrganizationIds([
    id,
    ...getRecentOrganizationIds().filter((item) => item !== id),
  ])
}
