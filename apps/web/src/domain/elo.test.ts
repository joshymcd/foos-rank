import { describe, expect, it } from 'vitest'
import type { MatchParticipant } from './entities'
import { calculateEloChanges } from './elo'

const people = ['a', 'b', 'c', 'd'].map((id) => ({ id, elo: 1000 }))

function participant(personId: string, team: 'red' | 'blue'): MatchParticipant {
  return { personId, team, role: 'both' }
}

function changes(participants: MatchParticipant[], red: number, blue: number) {
  return calculateEloChanges({ participants, score: { red, blue } }, people)
}

describe('calculateEloChanges', () => {
  it.each([
    [participant('a', 'red'), participant('b', 'blue')],
    [
      participant('a', 'red'),
      participant('b', 'red'),
      participant('c', 'blue'),
    ],
    [
      participant('a', 'red'),
      participant('b', 'blue'),
      participant('c', 'blue'),
    ],
    [
      participant('a', 'red'),
      participant('b', 'red'),
      participant('c', 'blue'),
      participant('d', 'blue'),
    ],
  ])('keeps every format zero-sum', (...participants) => {
    const result = changes(participants, 10, 5)
    expect(result.reduce((total, item) => total + item.change, 0)).toBe(0)
    expect(result.every((item) => Number.isInteger(item.change))).toBe(true)
    expect(
      result
        .filter((item) =>
          participants.some(
            (entry) => entry.personId === item.personId && entry.team === 'red',
          ),
        )
        .every((item) => item.change > 0),
    ).toBe(true)
  })

  it('does not rate a draw', () => {
    expect(
      changes([participant('a', 'red'), participant('b', 'blue')], 5, 5),
    ).toEqual([])
  })

  it('rejects missing roster members', () => {
    expect(() =>
      changes([participant('a', 'red'), participant('missing', 'blue')], 5, 2),
    ).toThrow('no longer on the roster')
  })
})
