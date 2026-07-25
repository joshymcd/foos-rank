import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { ArrowLeft, Flame, Swords, TrendingUp } from 'lucide-react'
import { EmptyOrganization } from '../../../components/app-shell'
import { EloSparkline } from '../../../components/elo-chart'
import { Scoreboard } from '../../../components/scoreboard'
import { Avatar } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { organizationsCollection } from '../../../collections/organization'
import { matchesCollection } from '../../../collections/matches'
import { peopleCollection } from '../../../collections/people'
import { eloHistory, headToHead, leaderboard } from '../../../domain/elo'
import { useCountUp } from '../../../lib/use-count-up'

export const Route = createFileRoute('/$organizationId/people/$personId')({
  component: PlayerProfile,
})

const medalTones = ['gold', 'silver', 'bronze'] as const

function PlayerProfile() {
  const { organizationId, personId } = Route.useParams()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const matches = (useLiveQuery(() => matchesCollection).data ?? []).filter(
    (match) => match.organizationId === organizationId && match.complete,
  )

  const ranks = leaderboard(people, matches)
  const person = ranks.find((item) => item.id === personId)
  const elo = useCountUp(Math.round(person?.elo ?? 1000))

  if (!organization) return <EmptyOrganization />

  if (!person) {
    return (
      <EmptyState
        title="Player not found"
        description="This player is not on the roster."
        action={
          <Link
            to="/$organizationId/people"
            params={{ organizationId }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand transition-all hover:bg-brand/90 active:scale-[0.98]"
          >
            Back to people
          </Link>
        }
      />
    )
  }

  const history = eloHistory(personId, matches)
  const rivals = headToHead(personId, people, matches)
  const personMatches = matches
    .filter((match) =>
      match.participants.some((participant) => participant.personId === personId),
    )
    .sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0))
  const winRate =
    person.played > 0 ? Math.round((person.wins / person.played) * 100) : 0

  return (
    <div className="animate-fade-up space-y-5">
      <Link
        to="/$organizationId/people"
        params={{ organizationId }}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" aria-hidden />
        People
      </Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <Avatar name={person.name} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {person.name}
              </h1>
              {person.rank <= 3 ? (
                <Badge tone={medalTones[person.rank - 1]}>#{person.rank}</Badge>
              ) : (
                <Badge tone="neutral">#{person.rank}</Badge>
              )}
              {person.streak >= 2 && (
                <Badge tone="live">
                  <Flame className="size-3" aria-hidden />
                  {person.streak} win streak
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              Member since {new Date(person.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl font-bold tabular-nums text-brand">
              {Math.round(elo)}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Elo rating
            </p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center sm:gap-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
              Played
            </dt>
            <dd className="mt-1 font-display text-xl font-bold tabular-nums">
              {person.played}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
              Win rate
            </dt>
            <dd className="mt-1 font-display text-xl font-bold tabular-nums">
              {winRate}%
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
              Record
            </dt>
            <dd className="mt-1 font-display text-xl font-bold tabular-nums">
              <span className="text-success">{person.wins}W</span>
              <span className="mx-1 text-faint">–</span>
              <span className="text-danger">{person.losses}L</span>
            </dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5" aria-hidden />
              Rating history
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EloSparkline history={history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Swords className="size-3.5" aria-hidden />
              Head to head
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rivals.map((rival, index) => {
              const rivalWinRate = Math.round(
                (rival.wins / rival.played) * 100,
              )
              return (
                <Link
                  key={rival.personId}
                  to="/$organizationId/people/$personId"
                  params={{ organizationId, personId: rival.personId }}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className="flex animate-fade-in items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface"
                >
                  <Avatar name={rival.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {rival.name}
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-success transition-all"
                        style={{ width: `${rivalWinRate}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    <span className="text-success">{rival.wins}W</span>
                    <span className="mx-1 text-faint">–</span>
                    <span className="text-danger">{rival.losses}L</span>
                  </span>
                </Link>
              )
            })}
            {rivals.length === 0 && (
              <p className="py-4 text-sm text-muted">
                No opponents faced yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {personMatches.slice(0, 10).map((match, index) => {
            const won =
              match.score &&
              match.participants.some(
                (participant) =>
                  participant.personId === personId &&
                  participant.team ===
                    (match.score && match.score.red > match.score.blue
                      ? 'red'
                      : 'blue'),
              )
            return (
              <Link
                key={match.id}
                to="/$organizationId/matches/$matchId"
                params={{ organizationId, matchId: match.id }}
                style={{ animationDelay: `${index * 40}ms` }}
                className="block animate-fade-in rounded-lg border border-border p-3 transition-all hover:-translate-y-0.5 hover:border-surface-2 hover:shadow-md"
              >
                <div className="mb-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{match.format}</Badge>
                    <Badge tone={won ? 'success' : 'danger'}>
                      {won ? 'Won' : 'Lost'}
                    </Badge>
                  </div>
                  <time className="text-muted">
                    {new Date(
                      match.completedAt ?? match.startedAt,
                    ).toLocaleDateString()}
                  </time>
                </div>
                <Scoreboard match={match} people={people} />
              </Link>
            )
          })}
          {personMatches.length === 0 && (
            <EmptyState
              icon={<Swords className="size-6" aria-hidden />}
              title="No matches yet"
              description="This player has not played any recorded matches."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
