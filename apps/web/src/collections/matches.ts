import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { dataStore } from '../data/datastore'
import { matchSchema } from '../domain/entities'
import { organizationQueryKey, queryClient } from './index'

export type {
  EloChange,
  Match,
  MatchFormat,
  MatchParticipant,
  PlayerRole,
  TeamColor,
} from '../domain/entities'

const collections = new Map<
  string,
  ReturnType<typeof createMatchesCollection>
>()

function createMatchesCollection(organizationId: string) {
  return createCollection(
    queryCollectionOptions({
      queryKey: organizationQueryKey(organizationId),
      queryFn: () => dataStore.getOrganizationSnapshot(organizationId),
      select: (snapshot) => snapshot?.matches ?? [],
      queryClient,
      schema: matchSchema,
      getKey: (match) => match.id,
      staleTime: 5_000,
      refetchInterval: 10_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }),
  )
}

export function getMatchesCollection(organizationId: string) {
  let collection = collections.get(organizationId)
  if (!collection) {
    collection = createMatchesCollection(organizationId)
    collections.set(organizationId, collection)
  }
  return collection
}
