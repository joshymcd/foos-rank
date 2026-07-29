import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { dataStore } from '../data/datastore'
import {
  getRecentOrganizationIds,
  setRecentOrganizationIds,
} from '../data/recent-organizations'
import { organizationSchema } from '../domain/entities'
import {
  organizationQueryKey,
  queryClient,
  recentOrganizationsQueryKey,
} from './index'

export type { Organization } from '../domain/entities'

let recentCollection:
  ReturnType<typeof createRecentOrganizationCollection> | undefined
const organizationCollections = new Map<
  string,
  ReturnType<typeof createRecentOrganizationCollection>
>()

const refreshOptions = {
  staleTime: 5_000,
  refetchInterval: 10_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const

function createRecentOrganizationCollection() {
  return createCollection(
    queryCollectionOptions({
      queryKey: recentOrganizationsQueryKey(),
      queryFn: async () => {
        const ids = getRecentOrganizationIds()
        const organizations = await dataStore.getOrganizations(ids)
        const validIds = organizations.map((organization) => organization.id)
        if (validIds.length !== ids.length) setRecentOrganizationIds(validIds)
        return organizations
      },
      queryClient,
      schema: organizationSchema,
      getKey: (organization) => organization.id,
      ...refreshOptions,
    }),
  )
}

export function getRecentOrganizationsCollection() {
  recentCollection ??= createRecentOrganizationCollection()
  return recentCollection
}

export function getOrganizationCollection(organizationId: string) {
  let collection = organizationCollections.get(organizationId)
  if (!collection) {
    collection = createCollection(
      queryCollectionOptions({
        queryKey: organizationQueryKey(organizationId),
        queryFn: () => dataStore.getOrganizationSnapshot(organizationId),
        select: (snapshot) => (snapshot ? [snapshot.organization] : []),
        queryClient,
        schema: organizationSchema,
        getKey: (organization) => organization.id,
        ...refreshOptions,
      }),
    )
    organizationCollections.set(organizationId, collection)
  }
  return collection
}
