import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'
import { readStoredArray, updateStoredArray } from '../lib/local-storage'
import { queryClient } from './index'

const teamColorSchema = z.enum(['red', 'blue'])
const playerRoleSchema = z.enum(['attack', 'defence', 'both'])
const matchFormatSchema = z.enum(['1v1', '2v1', '1v2', '2v2'])
const participantSchema = z.object({
  personId: z.string(),
  team: teamColorSchema,
  role: playerRoleSchema,
})
const eloChangeSchema = z.object({
  personId: z.string(),
  change: z.number(),
})
const matchSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  format: matchFormatSchema,
  participants: z.array(participantSchema),
  startedAt: z.string(),
  complete: z.boolean(),
  sequence: z.number().nullable(),
  completedAt: z.string().nullable(),
  score: z.object({ red: z.number(), blue: z.number() }).nullable(),
  eloChanges: z.array(eloChangeSchema).nullable(),
})

export type TeamColor = z.infer<typeof teamColorSchema>
export type PlayerRole = z.infer<typeof playerRoleSchema>
export type MatchFormat = z.infer<typeof matchFormatSchema>
export type MatchParticipant = z.infer<typeof participantSchema>
export type EloChange = z.infer<typeof eloChangeSchema>
export type Match = z.infer<typeof matchSchema>

const storageKey = 'foosrank-matches'

async function listMatches(): Promise<Match[]> {
  return readStoredArray<Match>(storageKey).map((match) => ({
    ...match,
    eloChanges: match.eloChanges ?? null,
  }))
}

export function resetMatches() {
  window.localStorage.removeItem(storageKey)
}

export const matchesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['foosrank', 'matches'],
    queryFn: listMatches,
    queryClient,
    schema: matchSchema,
    getKey: (match) => match.id,
    onInsert: async ({ transaction }) => {
      updateStoredArray<Match>(storageKey, (matches) => {
        const next = [...matches]
        for (const mutation of transaction.mutations) {
          const match = mutation.modified
          if (next.some((item) => item.id === match.id))
            throw new Error('Match already exists.')
          next.push(match)
        }
        return next
      })
    },
    onUpdate: async ({ transaction }) => {
      updateStoredArray<Match>(storageKey, (matches) => {
        const next = [...matches]
        for (const mutation of transaction.mutations) {
          const match = mutation.modified
          const index = next.findIndex((item) => item.id === match.id)
          if (index < 0) throw new Error('Match not found.')
          if (next[index].complete)
            throw new Error('Match is already complete.')
          next[index] = match
        }
        return next
      })
    },
    onDelete: async ({ transaction }) => {
      updateStoredArray<Match>(storageKey, (matches) => {
        const deletedIds = new Set(
          transaction.mutations.map((mutation) => mutation.modified.id),
        )
        if (
          ![...deletedIds].every((id) => matches.some((item) => item.id === id))
        )
          throw new Error('Match not found.')
        return matches.filter((match) => !deletedIds.has(match.id))
      })
    },
  }),
)
