import type { EloChange, Match, Person, TeamColor } from './entities'

export const INITIAL_ELO = 1000
const K_FACTOR = 32

export interface RankedPerson extends Person {
  rank: number
  played: number
  wins: number
  losses: number
  streak: number
}

export function matchWinner(match: Match): TeamColor | null {
  if (!match.complete || !match.score) return null
  if (match.score.red === match.score.blue) return null
  return match.score.red > match.score.blue ? 'red' : 'blue'
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
    const winner = matchWinner(match)
    if (!winner) continue
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

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

function distributeChange(total: number, personIds: string[]): EloChange[] {
  const base = Math.trunc(total / personIds.length)
  let remainder = total - base * personIds.length
  return personIds.map((personId) => {
    const extra = remainder === 0 ? 0 : Math.sign(remainder)
    remainder -= extra
    return { personId, change: base + extra }
  })
}

/** Each team's Elo change is shared across its players, keeping matches zero-sum. */
export function calculateEloChanges(
  match: Pick<Match, 'participants' | 'score'>,
  people: Array<Pick<Person, 'id' | 'elo'>>,
): EloChange[] {
  if (!match.score) return []
  if (match.score.red === match.score.blue) return []
  const teamRating = (team: TeamColor) => {
    const members = match.participants.filter(
      (participant) => participant.team === team,
    )
    if (members.length === 0) return INITIAL_ELO
    const total = members.reduce((sum, participant) => {
      const person = people.find((item) => item.id === participant.personId)
      if (!person) throw new Error('A match player is no longer on the roster.')
      return sum + person.elo
    }, 0)
    return total / members.length
  }
  const redExpected = expectedScore(teamRating('red'), teamRating('blue'))
  const redActual = match.score.red > match.score.blue ? 1 : 0
  const redDelta = Math.round(K_FACTOR * (redActual - redExpected))
  const redIds = match.participants
    .filter((participant) => participant.team === 'red')
    .map((participant) => participant.personId)
  const blueIds = match.participants
    .filter((participant) => participant.team === 'blue')
    .map((participant) => participant.personId)
  return [
    ...distributeChange(redDelta, redIds),
    ...distributeChange(-redDelta, blueIds),
  ]
}

export interface EloHistoryPoint {
  sequence: number
  elo: number
}

/**
 * Replays completed matches in sequence order to build a player's rating
 * timeline. Matches recorded before Elo tracking (eloChanges: null)
 * contribute a zero change.
 */
export function eloHistory(
  personId: string,
  matches: Match[],
): EloHistoryPoint[] {
  const history: EloHistoryPoint[] = [{ sequence: 0, elo: INITIAL_ELO }]
  let elo = INITIAL_ELO
  const completed = matches
    .filter((match) => match.complete && match.sequence !== null)
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
  for (const match of completed) {
    if (
      !match.participants.some(
        (participant) => participant.personId === personId,
      )
    )
      continue
    elo +=
      match.eloChanges?.find((change) => change.personId === personId)
        ?.change ?? 0
    history.push({ sequence: match.sequence ?? 0, elo })
  }
  return history
}

export interface HeadToHeadRecord {
  personId: string
  name: string
  played: number
  wins: number
  losses: number
}

/**
 * Win/loss record of one player against every opponent they have faced
 * (only matches where they played on opposing teams count).
 */
export function headToHead(
  personId: string,
  people: Person[],
  matches: Match[],
): HeadToHeadRecord[] {
  const records = new Map<string, { wins: number; losses: number }>()
  for (const match of matches) {
    const winner = matchWinner(match)
    if (!winner) continue
    const mine = match.participants.find(
      (participant) => participant.personId === personId,
    )
    if (!mine) continue
    const won = mine.team === winner
    for (const opponent of match.participants) {
      if (opponent.personId === personId || opponent.team === mine.team)
        continue
      const record = records.get(opponent.personId) ?? { wins: 0, losses: 0 }
      if (won) record.wins += 1
      else record.losses += 1
      records.set(opponent.personId, record)
    }
  }
  return people
    .filter((person) => records.has(person.id))
    .map((person) => {
      const record = records.get(person.id) ?? { wins: 0, losses: 0 }
      return {
        personId: person.id,
        name: person.name,
        played: record.wins + record.losses,
        wins: record.wins,
        losses: record.losses,
      }
    })
    .sort((a, b) => b.played - a.played || a.name.localeCompare(b.name))
}
