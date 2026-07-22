import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { AppShell, EmptyOrganization } from '../components/app-shell'
import { MatchTeams } from '../components/match-teams'
import { organizationsCollection } from '../collections/organization'
import {
  activeMatchesCollection,
  matchesCollection,
} from '../collections/matches'
import { peopleCollection } from '../collections/people'
import { leaderboard } from '../domain/elo'

export const Route = createFileRoute('/overview')({
  component: Overview,
})
function Overview() {
  const { organizationId } = Route.useSearch()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = useLiveQuery(() => peopleCollection).data ?? []
  const matches = useLiveQuery(() => matchesCollection).data ?? []
  const activeMatch = (
    useLiveQuery(() => activeMatchesCollection).data ?? []
  ).at(0)
  if (!organization)
    return (
      <AppShell title="Overview">
        <EmptyOrganization />
      </AppShell>
    )
  const ranks = leaderboard(people, matches)
  return (
    <AppShell title={organization.name}>
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Leaderboard</h2>
            <Link
              to="/leaderboard"
              className="text-sm text-emerald-700 underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {ranks.slice(0, 5).map((person) => (
              <div
                key={person.id}
                className="flex justify-between rounded bg-slate-50 px-3 py-2"
              >
                <span>
                  <strong className="mr-3 text-slate-400">
                    #{person.rank}
                  </strong>
                  {person.name}
                </span>
                <span className="font-semibold tabular-nums">
                  {Math.round(person.rating)}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Organization snapshot</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Players</dt>
              <dd className="text-2xl font-bold">{people.length}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Matches</dt>
              <dd className="text-2xl font-bold">{matches.length}</dd>
            </div>
          </dl>
          {activeMatch && (
            <Link
              to="/matches/new"
              className="mt-5 block rounded bg-amber-50 p-3 text-sm font-medium text-amber-900"
            >
              Resume active match
            </Link>
          )}
        </section>
      </div>
      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent matches</h2>
          <Link to="/matches" className="text-sm text-emerald-700 underline">
            History
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {matches
            .slice(-5)
            .reverse()
            .map((match) => (
              <MatchTeams key={match.id} match={match} people={people} />
            ))}
          {matches.length === 0 && (
            <p className="text-sm text-slate-500">No completed matches yet.</p>
          )}
        </div>
      </section>
    </AppShell>
  )
}
