import type {
  MatchFormat,
  MatchParticipant,
  PlayerRole,
  TeamColor,
} from './entities'

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
  validPersonIds?: ReadonlySet<string>,
) {
  const expected = teamSize(format, 'red') + teamSize(format, 'blue')
  if (participants.length !== expected) return 'Fill every player slot.'
  if (participants.some((participant) => !participant.personId.trim()))
    return 'Fill every player slot.'
  if (
    validPersonIds &&
    participants.some(
      (participant) => !validPersonIds.has(participant.personId),
    )
  )
    return 'Select players from this organization.'
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
      if (
        !(roles.size === 1 && roles.has('both')) &&
        !(roles.has('attack') && roles.has('defence'))
      )
        return 'Doubles teams need one attack and one defence player, or both players set to both.'
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
