import type { CompletedMatch, TeamColor } from '../collections/matches'
import type { Person } from '../collections/people'

export interface RankedPerson extends Person {
  rating: number
  rank: number
  played: number
  wins: number
  losses: number
  streak: number
}

export interface MatchRatingChange {
  personId: string
  before: number
  after: number
  delta: number
}

const INITIAL_RATING = 1000
const K_FACTOR = 32

export function replayRatings(people: Person[], matches: CompletedMatch[]) {
  const ratings = new Map(people.map((person) => [person.id, INITIAL_RATING]))
  const changes = new Map<string, MatchRatingChange[]>()

  for (const match of [...matches].sort((a, b) => a.sequence - b.sequence)) {
    const teamMembers = (team: TeamColor) =>
      match.participants.filter((participant) => participant.team === team)
    const red = teamMembers('red')
    const blue = teamMembers('blue')
    const average = (members: typeof red) =>
      members.reduce(
        (sum, member) => sum + (ratings.get(member.personId) ?? INITIAL_RATING),
        0,
      ) / members.length
    const redRating = average(red)
    const blueRating = average(blue)
    const expectedRed = 1 / (1 + 10 ** ((blueRating - redRating) / 400))
    const redWon = match.score.red > match.score.blue
    const redPool = K_FACTOR * ((redWon ? 1 : 0) - expectedRed)

    for (const [, members, pool] of [
      ['red', red, redPool],
      ['blue', blue, -redPool],
    ] as const) {
      for (const member of members) {
        const before = ratings.get(member.personId) ?? INITIAL_RATING
        const after = before + pool / members.length
        ratings.set(member.personId, after)
        const record: MatchRatingChange = {
          personId: member.personId,
          before,
          after,
          delta: after - before,
        }
        changes.set(match.id, [...(changes.get(match.id) ?? []), record])
      }
    }
  }
  return { ratings, changes }
}

export function leaderboard(
  people: Person[],
  matches: CompletedMatch[],
): RankedPerson[] {
  const { ratings } = replayRatings(people, matches)
  const stats = new Map(
    people.map((person) => [
      person.id,
      { played: 0, wins: 0, losses: 0, streak: 0 },
    ]),
  )
  for (const match of [...matches].sort((a, b) => a.sequence - b.sequence)) {
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
        rating: ratings.get(person.id) ?? INITIAL_RATING,
        ...personStats,
      }
    })
    .sort(
      (a, b) =>
        b.rating - a.rating || b.wins - a.wins || a.name.localeCompare(b.name),
    )
    .map((person, index) => ({ ...person, rank: index + 1 }))
}
