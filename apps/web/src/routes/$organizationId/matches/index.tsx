import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { EmptyOrganization } from '../../../components/app-shell'
import { MatchTeams } from '../../../components/match-teams'
import { organizationsCollection } from '../../../collections/organization'
import { matchesCollection } from '../../../collections/matches'
import { peopleCollection } from '../../../collections/people'

export const Route = createFileRoute('/$organizationId/matches/')({
  component: Matches,
})
function Matches() {
  const { organizationId } = Route.useParams()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const matches = (useLiveQuery(() => matchesCollection).data ?? []).filter(
    (match) => match.organizationId === organizationId,
  )
  const activeMatches = matches.filter((match) => !match.complete)
  const completedMatches = matches.filter((match) => match.complete)
  if (!organization) return <EmptyOrganization />
  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
        <Link
          to="/$organizationId/matches/new"
          params={{ organizationId }}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Start match
        </Link>
      </div>
      {activeMatches.length > 0 && (
        <section className="mb-7 space-y-3">
          <h2 className="font-semibold">Active matches</h2>
          {activeMatches.map((match) => (
            <Link
              key={match.id}
              to="/$organizationId/matches/$matchId"
              params={{ organizationId, matchId: match.id }}
              className="block rounded-lg border border-amber-200 bg-amber-50 p-4 hover:border-amber-300"
            >
              <div className="mb-3 flex justify-between text-xs text-amber-900">
                <span>{match.format}</span>
                <span>In progress</span>
              </div>
              <MatchTeams match={match} people={people} />
            </Link>
          ))}
        </section>
      )}
      <section className="space-y-3">
        <h2 className="font-semibold">Completed matches</h2>
        {[...completedMatches].reverse().map((match) => (
          <Link
            key={match.id}
            to="/$organizationId/matches/$matchId"
            params={{ organizationId, matchId: match.id }}
            className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300"
          >
            <div className="mb-3 flex justify-between text-xs text-slate-500">
              <span>{match.format}</span>
              <time>
                {new Date(
                  match.completedAt ?? match.startedAt,
                ).toLocaleDateString()}
              </time>
            </div>
            <MatchTeams match={match} people={people} />
          </Link>
        ))}
        {completedMatches.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No completed matches have been recorded.
          </div>
        )}
      </section>
    </>
  )
}
