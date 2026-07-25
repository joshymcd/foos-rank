import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { ArrowRight, Crown, Swords, Users } from 'lucide-react'
import { EmptyOrganization } from '../../components/app-shell'
import { Scoreboard } from '../../components/scoreboard'
import { Avatar } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { EmptyState } from '../../components/ui/empty-state'
import { Stat } from '../../components/ui/stat'
import { organizationsCollection } from '../../collections/organization'
import { matchesCollection } from '../../collections/matches'
import { peopleCollection } from '../../collections/people'
import { leaderboard } from '../../domain/elo'
import { useCountUp } from '../../lib/use-count-up'

export const Route = createFileRoute('/$organizationId/')({
  component: Overview,
})

const medalTones = ['gold', 'silver', 'bronze'] as const

function Overview() {
  const { organizationId } = Route.useParams()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const allMatches = useLiveQuery(() => matchesCollection).data ?? []
  const matches = allMatches.filter(
    (match) => match.organizationId === organizationId && match.complete,
  )
  const activeMatch = allMatches.find(
    (match) => match.organizationId === organizationId && !match.complete,
  )

  const ranks = leaderboard(people, matches)
  const playerCount = useCountUp(people.length)
  const matchCount = useCountUp(matches.length)

  if (!organization) return <EmptyOrganization />

  const topPlayer = ranks.at(0)

  return (
    <div className="animate-fade-up space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {organization.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {people.length} {people.length === 1 ? 'player' : 'players'} ·{' '}
          {matches.length} {matches.length === 1 ? 'match' : 'matches'} played
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Stat
          label="Players"
          value={Math.round(playerCount)}
          icon={<Users className="size-4" aria-hidden />}
        />
        <Stat
          label="Matches"
          value={Math.round(matchCount)}
          icon={<Swords className="size-4" aria-hidden />}
        />
        <Stat
          label="Top rated"
          value={
            topPlayer ? (
              <span className="flex items-center gap-2 text-2xl">
                <Avatar name={topPlayer.name} size="sm" />
                <span className="truncate">{topPlayer.name}</span>
              </span>
            ) : (
              '—'
            )
          }
          icon={<Crown className="size-4" aria-hidden />}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {activeMatch && (
        <Link
          to="/$organizationId/matches/$matchId"
          params={{ organizationId, matchId: activeMatch.id }}
          className="flex items-center justify-between rounded-xl border border-live/30 bg-live-soft p-4 text-sm font-semibold text-live transition-all hover:border-live/50"
        >
          <span className="flex items-center gap-2.5">
            <span className="size-2 animate-pulse-dot rounded-full bg-live" />
            Match in progress — resume scoring
          </span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <Link
              to="/$organizationId/leaderboard"
              params={{ organizationId }}
              className="text-xs font-semibold text-brand hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {ranks.slice(0, 5).map((person, index) => (
              <Link
                key={person.id}
                to="/$organizationId/people/$personId"
                params={{ organizationId, personId: person.id }}
                style={{ animationDelay: `${index * 50}ms` }}
                className="flex animate-fade-in items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface"
              >
                {person.rank <= 3 ? (
                  <Badge tone={medalTones[person.rank - 1]} className="w-7 justify-center">
                    {person.rank}
                  </Badge>
                ) : (
                  <span className="w-7 text-center text-sm font-semibold text-faint tabular-nums">
                    {person.rank}
                  </span>
                )}
                <Avatar name={person.name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {person.name}
                </span>
                <span className="font-display text-sm font-bold tabular-nums">
                  {Math.round(person.elo)}
                </span>
              </Link>
            ))}
            {ranks.length === 0 && (
              <p className="py-4 text-sm text-muted">No players yet.</p>
            )}
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
              History
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {matches
              .slice(-3)
              .reverse()
              .map((match, index) => (
                <Link
                  key={match.id}
                  to="/$organizationId/matches/$matchId"
                  params={{ organizationId, matchId: match.id }}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="block animate-fade-in rounded-lg border border-border p-3 transition-all hover:-translate-y-0.5 hover:border-surface-2 hover:shadow-md"
                >
                  <div className="mb-2.5 flex justify-between text-xs text-muted">
                    <Badge tone="neutral">{match.format}</Badge>
                    <time>
                      {new Date(
                        match.completedAt ?? match.startedAt,
                      ).toLocaleDateString()}
                    </time>
                  </div>
                  <Scoreboard match={match} people={people} />
                </Link>
              ))}
            {matches.length === 0 && (
              <EmptyState
                icon={<Swords className="size-6" aria-hidden />}
                title="No matches yet"
                description="Start your first match to see results here."
                action={
                  <Link
                    to="/$organizationId/matches/new"
                    params={{ organizationId }}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-brand px-3 text-sm font-semibold text-on-brand transition-all hover:bg-brand/90 active:scale-[0.98]"
                  >
                    Start match
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
