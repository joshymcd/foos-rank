import type { ActiveMatch, CompletedMatch } from './matches'
import type { Person } from './people'

interface MockState {
  people: Person[]
  matches: CompletedMatch[]
  activeMatch: ActiveMatch | null
}

const emptyState = (): MockState => ({
  people: [],
  matches: [],
  activeMatch: null,
})

let state = emptyState()

// These functions have the same shape as future REST calls.
export async function listPeople(): Promise<Person[]> {
  return state.people
}

export async function listMatches(): Promise<CompletedMatch[]> {
  return state.matches
}

export async function listActiveMatches(): Promise<ActiveMatch[]> {
  return state.activeMatch ? [state.activeMatch] : []
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

export async function resetData() {
  state = emptyState()
}
