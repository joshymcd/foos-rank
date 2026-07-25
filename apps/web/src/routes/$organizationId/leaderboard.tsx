import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { Flame, Trophy } from 'lucide-react'
import { EmptyOrganization } from '../../components/app-shell'
import { Avatar } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { EmptyState } from '../../components/ui/empty-state'
import { organizationsCollection } from '../../collections/organization'
import { matchesCollection } from '../../collections/matches'
import { peopleCollection } from '../../collections/people'
import { leaderboard } from '../../domain/elo'
import type { RankedPerson } from '../../domain/elo'
import { cn } from '../../lib/cn'
import { useCountUp } from '../../lib/use-count-up'

export const Route = createFileRoute('/$organizationId/leaderboard')({
  component: Leaderboard,
})

const medalStyles = [
  { tone: 'gold', label: '1st' },
  { tone: 'silver', label: '2nd' },
  { tone: 'bronze', label: '3rd' },
] as const

function StreakBadge({ streak }: { streak: number }) {
  if (streak >= 2)
    return (
      <Badge tone="live">
        <Flame className="size-3" aria-hidden />
        {streak}W
      </Badge>
    )
  if (streak <= -2) return <Badge tone="danger">{Math.abs(streak)}L</Badge>
  return <span className="text-xs text-faint">—</span>
}

function PodiumEntry({
  person,
  organizationId,
  place,
}: {
  person: RankedPerson
  organizationId: string
  place: 0 | 1 | 2
}) {
  const elo = useCountUp(Math.round(person.elo))
  const medal = medalStyles[place]
  const first = place === 0
  return (
    <Link
      to="/$organizationId/people/$personId"
      params={{ organizationId, personId: person.id }}
      style={{ animationDelay: `${place * 90}ms` }}
      className={cn(
        'flex animate-fade-up flex-col items-center rounded-xl border bg-card text-center transition-all hover:-translate-y-1 hover:shadow-md',
        first
          ? 'border-gold/40 bg-gradient-to-b from-gold/10 to-card px-3 pb-6 pt-8'
          : 'border-border px-3 pb-4 pt-6',
      )}
    >
      <Badge tone={medal.tone} className="mb-3">
        {first && <Trophy className="size-3" aria-hidden />}
        {medal.label}
      </Badge>
      <Avatar name={person.name} size={first ? 'xl' : 'lg'} />
      <p
        className={cn(
          'mt-3 w-full truncate font-semibold',
          first && 'font-display text-lg',
        )}
      >
        {person.name}
      </p>
      <p
        className={cn(
          'font-display font-bold tabular-nums text-brand',
          first ? 'text-3xl' : 'text-xl',
        )}
      >
        {Math.round(elo)}
      </p>
      <p className="mt-1 text-xs text-muted tabular-nums">
        {person.wins}W – {person.losses}L
      </p>
    </Link>
  )
}

function Leaderboard() {
  const { organizationId } = Route.useParams()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const matches = (useLiveQuery(() => matchesCollection).data ?? []).filter(
    (match) => match.organizationId === organizationId && match.complete,
  )
  if (!organization) return <EmptyOrganization />

  const ranks = leaderboard(people, matches)
  const podium = [ranks[1], ranks[0], ranks[2]].filter(Boolean)
  const rest = ranks.slice(Math.min(3, ranks.length))

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ranked by Elo rating across {matches.length}{' '}
          {matches.length === 1 ? 'match' : 'matches'}.
        </p>
      </header>

      {ranks.length === 0 && (
        <EmptyState
          icon={<Trophy className="size-8" aria-hidden />}
          title="No players yet"
          description="Add players from the People page to start ranking."
        />
      )}

      {ranks.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
          {podium.map((person) => (
            <PodiumEntry
              key={person.id}
              person={person}
              organizationId={organizationId}
              place={(person.rank - 1) as 0 | 1 | 2}
            />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {rest.map((person, index) => (
              <Link
                key={person.id}
                to="/$organizationId/people/$personId"
                params={{ organizationId, personId: person.id }}
                style={{ animationDelay: `${index * 40}ms` }}
                className="flex animate-fade-in items-center gap-3 px-4 py-3 transition-colors hover:bg-surface sm:px-5"
              >
                <span className="w-6 text-center font-display text-sm font-bold text-faint tabular-nums">
                  {person.rank}
                </span>
                <Avatar name={person.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{person.name}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {person.played} played · {person.wins}W – {person.losses}L
                  </p>
                </div>
                <StreakBadge streak={person.streak} />
                <span className="w-12 text-right font-display text-sm font-bold tabular-nums">
                  {Math.round(person.elo)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
