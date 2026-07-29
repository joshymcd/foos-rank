import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { dataStore } from '../data/datastore'
import { personSchema } from '../domain/entities'
import { organizationQueryKey, queryClient } from './index'

export type { Person } from '../domain/entities'

const collections = new Map<string, ReturnType<typeof createPeopleCollection>>()

function createPeopleCollection(organizationId: string) {
  return createCollection(
    queryCollectionOptions({
      queryKey: organizationQueryKey(organizationId),
      queryFn: () => dataStore.getOrganizationSnapshot(organizationId),
      select: (snapshot) => snapshot?.people ?? [],
      queryClient,
      schema: personSchema,
      getKey: (person) => person.id,
      staleTime: 5_000,
      refetchInterval: 10_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }),
  )
}

export function getPeopleCollection(organizationId: string) {
  let collection = collections.get(organizationId)
  if (!collection) {
    collection = createPeopleCollection(organizationId)
    collections.set(organizationId, collection)
  }
  return collection
}
