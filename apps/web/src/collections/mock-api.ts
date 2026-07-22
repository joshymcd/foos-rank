import type { ActiveMatch, CompletedMatch } from './matches'

interface MockState {
  matches: CompletedMatch[]
  activeMatch: ActiveMatch | null
}

const emptyState = (): MockState => ({
  matches: [],
  activeMatch: null,
})

let state = emptyState()

// These functions have the same shape as future REST calls.
export async function listMatches(): Promise<CompletedMatch[]> {
  return state.matches
}

export async function listActiveMatches(): Promise<ActiveMatch[]> {
  return state.activeMatch ? [state.activeMatch] : []
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
