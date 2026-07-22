import type { ActiveMatch, CompletedMatch } from './matches'
import type { Organization } from './organization'
import type { Person } from './people'

interface MockState {
  organization: Organization | null
  people: Person[]
  matches: CompletedMatch[]
  activeMatch: ActiveMatch | null
}

const emptyState = (): MockState => ({
  organization: null,
  people: [],
  matches: [],
  activeMatch: null,
})

const demoState = (): MockState => {
  const people = [
    'Avery Chen',
    'Jordan Singh',
    'Morgan Bell',
    'Sam Taylor',
    'Casey Park',
  ].map((name, index) => ({
    id: `person-${index + 1}`,
    name,
    normalizedName: name.toLowerCase(),
    createdAt: '2026-07-01T09:00:00.000Z',
  }))
  return {
    organization: {
      id: 'organization-demo',
      name: 'Northstar Office',
      createdAt: '2026-07-01T09:00:00.000Z',
    },
    people,
    activeMatch: null,
    matches: [
      {
        id: 'match-1',
        sequence: 1,
        format: '1v1',
        participants: [
          { personId: 'person-1', team: 'red', role: 'both' },
          { personId: 'person-2', team: 'blue', role: 'both' },
        ],
        startedAt: '2026-07-02T12:00:00.000Z',
        completedAt: '2026-07-02T12:10:00.000Z',
        score: { red: 10, blue: 7 },
        ratingAlgorithm: 'elo-team-average-v1',
      },
      {
        id: 'match-2',
        sequence: 2,
        format: '2v1',
        participants: [
          { personId: 'person-3', team: 'red', role: 'attack' },
          { personId: 'person-4', team: 'red', role: 'defence' },
          { personId: 'person-1', team: 'blue', role: 'both' },
        ],
        startedAt: '2026-07-03T12:00:00.000Z',
        completedAt: '2026-07-03T12:15:00.000Z',
        score: { red: 8, blue: 10 },
        ratingAlgorithm: 'elo-team-average-v1',
      },
      {
        id: 'match-3',
        sequence: 3,
        format: '1v2',
        participants: [
          { personId: 'person-2', team: 'red', role: 'both' },
          { personId: 'person-3', team: 'blue', role: 'attack' },
          { personId: 'person-5', team: 'blue', role: 'defence' },
        ],
        startedAt: '2026-07-04T12:00:00.000Z',
        completedAt: '2026-07-04T12:15:00.000Z',
        score: { red: 10, blue: 6 },
        ratingAlgorithm: 'elo-team-average-v1',
      },
      {
        id: 'match-4',
        sequence: 4,
        format: '2v2',
        participants: [
          { personId: 'person-1', team: 'red', role: 'attack' },
          { personId: 'person-4', team: 'red', role: 'defence' },
          { personId: 'person-2', team: 'blue', role: 'attack' },
          { personId: 'person-5', team: 'blue', role: 'defence' },
        ],
        startedAt: '2026-07-05T12:00:00.000Z',
        completedAt: '2026-07-05T12:15:00.000Z',
        score: { red: 10, blue: 9 },
        ratingAlgorithm: 'elo-team-average-v1',
      },
    ],
  }
}

let state = emptyState()

// These functions have the same shape as future REST calls.
export async function listOrganizations(): Promise<Organization[]> {
  return state.organization ? [state.organization] : []
}

export async function listPeople(): Promise<Person[]> {
  return state.people
}

export async function listMatches(): Promise<CompletedMatch[]> {
  return state.matches
}

export async function listActiveMatches(): Promise<ActiveMatch[]> {
  return state.activeMatch ? [state.activeMatch] : []
}

export async function createOrganization(organization: Organization) {
  state.organization = organization
  return organization
}

export async function createPerson(person: Person) {
  if (
    state.people.some((item) => item.normalizedName === person.normalizedName)
  ) {
    throw new Error('That person is already in this organization.')
  }
  state.people.push(person)
  return person
}

export async function createActiveMatch(match: ActiveMatch) {
  state.activeMatch = match
  return match
}

export async function createCompletedMatch(match: CompletedMatch) {
  state.matches.push(match)
  return match
}

export async function deleteActiveMatch(id: string) {
  if (state.activeMatch?.id === id) state.activeMatch = null
}

export async function loadDemo() {
  state = demoState()
}

export async function resetData() {
  state = emptyState()
}
