import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { ArrowRight } from 'lucide-react'
import { Scoreboard } from '../../components/scoreboard'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { getOrganizationCollection } from '../../collections/organization'
import { getMatchesCollection } from '../../collections/matches'
import { getPeopleCollection } from '../../collections/people'
import { leaderboard } from '../../domain/elo'

export const Route = createFileRoute('/$organizationId/')({
  component: Overview,
})

function Overview() {
  const { organizationId } = Route.useParams()
  const organization = (
    useLiveQuery(() => getOrganizationCollection(organizationId)).data ?? []
  ).find((item) => item.id === organizationId)
  const people =
    useLiveQuery(() => getPeopleCollection(organizationId)).data ?? []
  const allMatches =
    useLiveQuery(() => getMatchesCollection(organizationId)).data ?? []
  const completedMatches = allMatches
    .filter((match) => match.complete)
    .sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0))
  const pendingMatches = allMatches.filter((match) => !match.complete)
  const ranks = leaderboard(people, completedMatches)

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {organization?.name ?? organizationId}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {people.length} {people.length === 1 ? 'player' : 'players'} ·{' '}
          {completedMatches.length}{' '}
          {completedMatches.length === 1 ? 'match' : 'matches'}
        </p>
      </header>

      {pendingMatches.length > 0 && (
        <Link
          to="/$organizationId/matches"
          params={{ organizationId }}
          className="flex items-center justify-between rounded-lg border border-pending/30 bg-pending-soft px-4 py-3 text-sm font-semibold text-pending"
        >
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-pending" />
            {pendingMatches.length}{' '}
            {pendingMatches.length === 1 ? 'pending match' : 'pending matches'}
          </span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top players</CardTitle>
            <Link
              to="/$organizationId/leaderboard"
              params={{ organizationId }}
              className="text-xs font-semibold text-brand hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {ranks.slice(0, 3).map((person) => (
                <Link
                  key={person.id}
                  to="/$organizationId/people/$personId"
                  params={{ organizationId, personId: person.id }}
                  className="flex items-center gap-3 py-2.5 text-sm"
                >
                  <span className="w-5 text-muted tabular-nums">
                    {person.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {person.name}
                  </span>
                  <strong className="font-display tabular-nums">
                    {Math.round(person.elo)}
                  </strong>
                </Link>
              ))}
              {ranks.length === 0 && (
                <p className="py-3 text-sm text-muted">No players yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent matches</CardTitle>
            <Link
              to="/$organizationId/matches"
              params={{ organizationId }}
              className="text-xs font-semibold text-brand hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {completedMatches.slice(0, 3).map((match) => (
                <Link
                  key={match.id}
                  to="/$organizationId/matches/$matchId"
                  params={{ organizationId, matchId: match.id }}
                  className="block py-3"
                >
                  <time className="mb-2 block text-xs text-muted">
                    {new Date(
                      match.completedAt ?? match.startedAt,
                    ).toLocaleString()}
                  </time>
                  <Scoreboard match={match} people={people} />
                </Link>
              ))}
              {completedMatches.length === 0 && (
                <p className="py-3 text-sm text-muted">No matches yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
