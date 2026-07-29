import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Scoreboard } from '../../../components/scoreboard'
import { Card } from '../../../components/ui/card'
import { organizationSnapshotOptions } from '../../../data/queries'
import type { Match, Person } from '../../../domain/entities'

export const Route = createFileRoute('/$organizationId/matches/')({
  component: Matches,
})

function Matches() {
  const { organizationId } = Route.useParams()
  const snapshot = useQuery(organizationSnapshotOptions(organizationId)).data
  const people = snapshot?.people ?? []
  const matches = snapshot?.matches ?? []
  const pendingMatches = matches
    .filter((match) => !match.complete)
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
  const completedMatches = matches
    .filter((match) => match.complete)
    .sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0))

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Matches
        </h1>
        <p className="mt-1 text-sm text-muted">
          {pendingMatches.length} pending · {completedMatches.length} completed
        </p>
      </header>

      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {pendingMatches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              people={people}
              organizationId={organizationId}
              pending
            />
          ))}
          {completedMatches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              people={people}
              organizationId={organizationId}
            />
          ))}
          {pendingMatches.length === 0 && completedMatches.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted">No matches yet.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

function MatchRow({
  match,
  people,
  organizationId,
  pending = false,
}: {
  match: Match
  people: Person[]
  organizationId: string
  pending?: boolean
}) {
  return (
    <Link
      to="/$organizationId/matches/$matchId"
      params={{ organizationId, matchId: match.id }}
      className="block px-4 py-3 transition-colors hover:bg-surface sm:px-5"
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{match.format}</span>
        {pending ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-pending-soft px-2 py-0.5 font-semibold text-pending">
            <span className="size-1.5 rounded-full bg-pending" />
            Pending
          </span>
        ) : (
          <time>
            {new Date(match.completedAt ?? match.startedAt).toLocaleString()}
          </time>
        )}
      </div>
      <Scoreboard match={match} people={people} />
    </Link>
  )
}
