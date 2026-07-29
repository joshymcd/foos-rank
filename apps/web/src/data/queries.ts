import { QueryClient, queryOptions } from '@tanstack/react-query'
import {
  getOrganizationsFn,
  getOrganizationSnapshotFn,
} from '../server/foosrank.functions'
import { getRecentOrganizationIds } from './recent-organizations'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 5_000, gcTime: 5 * 60_000 },
  },
})

export function organizationSnapshotOptions(organizationId: string) {
  return queryOptions({
    queryKey: ['foosrank', 'organization', organizationId],
    queryFn: () => getOrganizationSnapshotFn({ data: { id: organizationId } }),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function recentOrganizationsOptions() {
  const ids = [...new Set(getRecentOrganizationIds())]
  return queryOptions({
    queryKey: ['foosrank', 'recent-organizations', ...ids],
    queryFn: () => getOrganizationsFn({ data: { ids } }),
    refetchOnWindowFocus: true,
  })
}

export function refreshOrganization(organizationId: string) {
  return queryClient.invalidateQueries({
    queryKey: organizationSnapshotOptions(organizationId).queryKey,
  })
}

export function refreshRecentOrganizations() {
  return queryClient.invalidateQueries({
    queryKey: ['foosrank', 'recent-organizations'],
  })
}
