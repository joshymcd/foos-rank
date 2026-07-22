import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'
import { queryClient } from './index'

export const teamColorSchema = z.enum(['red', 'blue'])
export const playerRoleSchema = z.enum(['attack', 'defence', 'both'])
export const matchFormatSchema = z.enum(['1v1', '2v1', '1v2', '2v2'])
export const participantSchema = z.object({
  personId: z.string(),
  team: teamColorSchema,
  role: playerRoleSchema,
})
export const eloChangeSchema = z.object({
  personId: z.string(),
  change: z.number(),
})
export const matchSchema = z.object({
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
  try {
    const matches = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(matches)
      ? matches.map((match) => ({
          ...match,
          eloChanges: match.eloChanges ?? null,
        }))
      : []
  } catch {
    return []
  }
}

async function createMatch(match: Match) {
  const matches = await listMatches()
  window.localStorage.setItem(storageKey, JSON.stringify([...matches, match]))
  return match
}

async function updateMatch(match: Match) {
  const matches = await listMatches()
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(
      matches.map((item) => (item.id === match.id ? match : item)),
    ),
  )
  return match
}

async function deleteMatch(id: string) {
  const matches = await listMatches()
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(matches.filter((match) => match.id !== id)),
  )
}

export async function resetMatches() {
  window.localStorage.removeItem(storageKey)
}

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

export const matchesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['foosrank', 'matches'],
    queryFn: listMatches,
    queryClient,
    schema: matchSchema,
    getKey: (match) => match.id,
    onInsert: async ({ transaction }) =>
      Promise.all(
        transaction.mutations.map((mutation) => createMatch(mutation.modified)),
      ),
    onUpdate: async ({ transaction }) =>
      Promise.all(
        transaction.mutations.map((mutation) => updateMatch(mutation.modified)),
      ),
    onDelete: async ({ transaction }) =>
      Promise.all(
        transaction.mutations.map((mutation) =>
          deleteMatch(mutation.modified.id),
        ),
      ),
  }),
)
