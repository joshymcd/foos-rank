import { describe, expect, it } from 'vitest'
import type { MatchParticipant } from './entities'
import { validateMatch } from './matches'

const roster = new Set(['a', 'b', 'c', 'd'])
const player = (
  personId: string,
  team: 'red' | 'blue',
  role: MatchParticipant['role'] = 'both',
): MatchParticipant => ({ personId, team, role })

describe('validateMatch', () => {
  it('rejects blank slots before duplicate checks', () => {
    expect(
      validateMatch(
        '1v1',
        [player('', 'red'), player('a', 'blue')],
        undefined,
        roster,
      ),
    ).toBe('Fill every player slot.')
  })

  it('rejects players outside the organization', () => {
    expect(
      validateMatch(
        '1v1',
        [player('a', 'red'), player('missing', 'blue')],
        undefined,
        roster,
      ),
    ).toBe('Select players from this organization.')
  })

  it('rejects duplicate players', () => {
    expect(
      validateMatch(
        '1v1',
        [player('a', 'red'), player('a', 'blue')],
        undefined,
        roster,
      ),
    ).toBe('Each player can only be selected once.')
  })

  it('accepts complementary doubles roles', () => {
    expect(
      validateMatch(
        '2v2',
        [
          player('a', 'red', 'attack'),
          player('b', 'red', 'defence'),
          player('c', 'blue', 'attack'),
          player('d', 'blue', 'defence'),
        ],
        undefined,
        roster,
      ),
    ).toBeUndefined()
  })

  it('rejects draws', () => {
    expect(
      validateMatch(
        '1v1',
        [player('a', 'red'), player('b', 'blue')],
        { red: 5, blue: 5 },
        roster,
      ),
    ).toBe('Foosball matches cannot end in a draw.')
  })
})
