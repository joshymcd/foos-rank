import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { AppShell, EmptyOrganization } from '../../components/app-shell'
import { MatchTeams } from '../../components/match-teams'
import { organizationsCollection } from '../../collections/organization'
import { matchesCollection } from '../../collections/matches'
import { peopleCollection } from '../../collections/people'

export const Route = createFileRoute('/matches/')({
  component: Matches,
})
function Matches() {
  const { organizationId } = Route.useSearch()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = useLiveQuery(() => peopleCollection).data ?? []
  const matches = useLiveQuery(() => matchesCollection).data ?? []
  if (!organization)
    return (
      <AppShell title="Matches">
        <EmptyOrganization />
      </AppShell>
    )
  return (
    <AppShell title="Match history">
      <div className="mb-5">
        <Link
          to="/matches/new"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Start match
        </Link>
      </div>
      <section className="space-y-3">
        {[...matches].reverse().map((match) => (
          <Link
            key={match.id}
            to="/matches/$matchId"
            params={{ matchId: match.id }}
            className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300"
          >
            <div className="mb-3 flex justify-between text-xs text-slate-500">
              <span>{match.format}</span>
              <time>{new Date(match.completedAt).toLocaleDateString()}</time>
            </div>
            <MatchTeams match={match} people={people} />
          </Link>
        ))}
        {matches.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No matches have been recorded.
          </div>
        )}
      </section>
    </AppShell>
  )
}
