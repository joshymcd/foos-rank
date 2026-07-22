import type { Match, TeamColor } from '../collections/matches'
import type { Person } from '../collections/people'

export interface RankedPerson extends Person {
  rank: number
  played: number
  wins: number
  losses: number
  streak: number
}

export function leaderboard(
  people: Person[],
  matches: Match[],
): RankedPerson[] {
  const stats = new Map(
    people.map((person) => [
      person.id,
      { played: 0, wins: 0, losses: 0, streak: 0 },
    ]),
  )
  for (const match of [...matches].sort(
    (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
  )) {
    if (!match.complete || !match.score) continue
    const winner: TeamColor =
      match.score.red > match.score.blue ? 'red' : 'blue'
    for (const participant of match.participants) {
      const personStats = stats.get(participant.personId)
      if (!personStats) continue
      personStats.played += 1
      if (participant.team === winner) {
        personStats.wins += 1
        personStats.streak =
          personStats.streak >= 0 ? personStats.streak + 1 : 1
      } else {
        personStats.losses += 1
        personStats.streak =
          personStats.streak <= 0 ? personStats.streak - 1 : -1
      }
    }
  }
  return people
    .map((person) => {
      const personStats = stats.get(person.id) ?? {
        played: 0,
        wins: 0,
        losses: 0,
        streak: 0,
      }
      return {
        ...person,
        ...personStats,
      }
    })
    .sort(
      (a, b) =>
        b.elo - a.elo || b.wins - a.wins || a.name.localeCompare(b.name),
    )
    .map((person, index) => ({ ...person, rank: index + 1 }))
}
