import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { AppShell, EmptyOrganization } from '../../components/app-shell'
import { MatchTeams } from '../../components/match-teams'
import { organizationsCollection } from '../../collections/organization'
import { matchesCollection } from '../../collections/matches'
import { peopleCollection } from '../../collections/people'
import { replayRatings } from '../../domain/elo'

export const Route = createFileRoute('/matches/$matchId')({
  component: MatchDetail,
})
function MatchDetail() {
  const { matchId } = Route.useParams()
  const { organizationId } = Route.useSearch()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const matches = useLiveQuery(() => matchesCollection).data ?? []
  if (!organization)
    return (
      <AppShell title="Match">
        <EmptyOrganization />
      </AppShell>
    )
  const match = matches.find((item) => item.id === matchId)
  if (!match)
    return (
      <AppShell title="Match">
        <p>
          Match not found.{' '}
          <Link to="/matches" className="underline">
            Back to history
          </Link>
        </p>
      </AppShell>
    )
  const changes = replayRatings(people, matches).changes.get(match.id) ?? []
  return (
    <AppShell title="Match result">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex justify-between text-sm text-slate-500">
          <span>{match.format}</span>
          <time>{new Date(match.completedAt).toLocaleString()}</time>
        </div>
        <MatchTeams match={match} people={people} />
        <h2 className="mt-7 font-semibold">Players and rating changes</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {match.participants.map((participant) => {
            const change = changes.find(
              (item) => item.personId === participant.personId,
            )
            const person = people.find(
              (item) => item.id === participant.personId,
            )
            return (
              <div
                key={participant.personId}
                className="flex justify-between py-3 text-sm"
              >
                <span>
                  <strong>{person?.name ?? 'Unknown'}</strong> ·{' '}
                  {participant.team} · {participant.role}
                </span>
                <span
                  className={
                    change && change.delta >= 0
                      ? 'font-semibold text-emerald-700'
                      : 'font-semibold text-red-700'
                  }
                >
                  {change
                    ? `${change.delta >= 0 ? '+' : ''}${change.delta.toFixed(1)}`
                    : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </AppShell>
  )
}
