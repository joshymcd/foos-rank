import { QueryClient } from '@tanstack/react-query'
import { recentOrganizationsKey } from '../data/recent-organizations'
import type { OrganizationSnapshot } from '../domain/entities'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
  },
})

export function organizationQueryKey(organizationId: string) {
  return ['foosrank', organizationId, 'snapshot'] as const
}

export function recentOrganizationsQueryKey() {
  return ['foosrank', 'recent'] as const
}

export async function refreshOrganization(organizationId: string) {
  await queryClient.invalidateQueries({
    queryKey: organizationQueryKey(organizationId),
  })
}

export function setOrganizationSnapshot(snapshot: OrganizationSnapshot) {
  queryClient.setQueryData(
    organizationQueryKey(snapshot.organization.id),
    snapshot,
  )
}

export function updateOrganizationSnapshot(
  organizationId: string,
  update: (snapshot: OrganizationSnapshot) => OrganizationSnapshot,
) {
  queryClient.setQueryData<OrganizationSnapshot | null>(
    organizationQueryKey(organizationId),
    (snapshot) => (snapshot ? update(snapshot) : snapshot),
  )
}

export async function refreshRecentOrganizations() {
  await queryClient.invalidateQueries({
    queryKey: recentOrganizationsQueryKey(),
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === recentOrganizationsKey)
      void queryClient.invalidateQueries({ queryKey: ['foosrank', 'recent'] })
  })
}
