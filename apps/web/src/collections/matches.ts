import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'
import { queryClient } from '../query-client'
import {
  createActiveMatch,
  createCompletedMatch,
  deleteActiveMatch,
  listActiveMatches,
  listMatches,
} from './mock-api'

export const teamColorSchema = z.enum(['red', 'blue'])
export const playerRoleSchema = z.enum(['attack', 'defence', 'both'])
export const matchFormatSchema = z.enum(['1v1', '2v1', '1v2', '2v2'])
export const participantSchema = z.object({
  personId: z.string(),
  team: teamColorSchema,
  role: playerRoleSchema,
})
export const activeMatchSchema = z.object({
  id: z.string(),
  format: matchFormatSchema,
  participants: z.array(participantSchema),
  startedAt: z.string(),
})
export const completedMatchSchema = activeMatchSchema.extend({
  sequence: z.number(),
  completedAt: z.string(),
  score: z.object({ red: z.number(), blue: z.number() }),
  ratingAlgorithm: z.literal('elo-team-average-v1'),
})

export type TeamColor = z.infer<typeof teamColorSchema>
export type PlayerRole = z.infer<typeof playerRoleSchema>
export type MatchFormat = z.infer<typeof matchFormatSchema>
export type MatchParticipant = z.infer<typeof participantSchema>
export type ActiveMatch = z.infer<typeof activeMatchSchema>
export type CompletedMatch = z.infer<typeof completedMatchSchema>

export const formats: Array<{
  value: MatchFormat
  label: string
  red: number
  blue: number
}> = [
  { value: '1v1', label: '1 vs 1', red: 1, blue: 1 },
  { value: '2v1', label: '2 vs 1', red: 2, blue: 1 },
  { value: '1v2', label: '1 vs 2', red: 1, blue: 2 },
  { value: '2v2', label: '2 vs 2', red: 2, blue: 2 },
]

export function teamSize(format: MatchFormat, team: TeamColor) {
  return formats.find((item) => item.value === format)?.[team] ?? 1
}

export function defaultRoles(
  format: MatchFormat,
  team: TeamColor,
): PlayerRole[] {
  return teamSize(format, team) === 1 ? ['both'] : ['attack', 'defence']
}

export function validateMatch(
  format: MatchFormat,
  participants: MatchParticipant[],
  score?: Record<TeamColor, number>,
) {
  const expected = teamSize(format, 'red') + teamSize(format, 'blue')
  if (participants.length !== expected) return 'Fill every player slot.'
  if (
    new Set(participants.map((participant) => participant.personId)).size !==
    participants.length
  )
    return 'Each player can only be selected once.'
  for (const team of ['red', 'blue'] as const) {
    const teamPlayers = participants.filter(
      (participant) => participant.team === team,
    )
    if (teamPlayers.length !== teamSize(format, team))
      return 'Team sizes do not match the format.'
    if (teamPlayers.length === 1 && teamPlayers[0].role !== 'both')
      return 'Solo players must play both.'
    if (teamPlayers.length === 2) {
      const roles = new Set(teamPlayers.map((participant) => participant.role))
      if (!roles.has('attack') || !roles.has('defence'))
        return 'Doubles teams need one attack and one defence player.'
    }
  }
  if (score) {
    if (
      !Number.isInteger(score.red) ||
      !Number.isInteger(score.blue) ||
      score.red < 0 ||
      score.blue < 0 ||
      score.red > 99 ||
      score.blue > 99
    )
      return 'Scores must be whole numbers between 0 and 99.'
    if (score.red === score.blue)
      return 'Foosball matches cannot end in a draw.'
  }
}

export const activeMatchesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['foosrank', 'active-matches'],
    queryFn: listActiveMatches,
    queryClient,
    schema: activeMatchSchema,
    getKey: (match) => match.id,
    onInsert: async ({ transaction }) =>
      Promise.all(
        transaction.mutations.map((mutation) =>
          createActiveMatch(mutation.modified),
        ),
      ),
    onDelete: async ({ transaction }) =>
      Promise.all(
        transaction.mutations.map((mutation) =>
          deleteActiveMatch(mutation.modified.id),
        ),
      ),
  }),
)

export const matchesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['foosrank', 'matches'],
    queryFn: listMatches,
    queryClient,
    schema: completedMatchSchema,
    getKey: (match) => match.id,
    onInsert: async ({ transaction }) =>
      Promise.all(
        transaction.mutations.map((mutation) =>
          createCompletedMatch(mutation.modified),
        ),
      ),
  }),
)
