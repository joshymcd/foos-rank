import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { Plus, Swords } from 'lucide-react'
import { useState } from 'react'
import { EmptyOrganization } from '../../../components/app-shell'
import { Scoreboard } from '../../../components/scoreboard'
import { Badge } from '../../../components/ui/badge'
import { buttonVariants } from '../../../components/ui/button'
import { EmptyState } from '../../../components/ui/empty-state'
import { SegmentedControl } from '../../../components/ui/segmented-control'
import { organizationsCollection } from '../../../collections/organization'
import { matchesCollection } from '../../../collections/matches'
import type { Match } from '../../../collections/matches'
import { peopleCollection } from '../../../collections/people'

export const Route = createFileRoute('/$organizationId/matches/')({
  component: Matches,
})

type Filter = 'all' | 'active' | 'completed'

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
  const [filter, setFilter] = useState<Filter>('all')
  if (!organization) return <EmptyOrganization />

  const activeMatches = matches.filter((match) => !match.complete)
  const completedMatches = matches
    .filter((match) => match.complete)
    .sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0))
  const visible: Array<{ match: Match; active: boolean }> =
    filter === 'active'
      ? activeMatches.map((match) => ({ match, active: true }))
      : filter === 'completed'
        ? completedMatches.map((match) => ({ match, active: false }))
        : [
            ...activeMatches.map((match) => ({ match, active: true })),
            ...completedMatches.map((match) => ({ match, active: false })),
          ]

  return (
    <div className="animate-fade-up space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Matches
          </h1>
          <p className="mt-1 text-sm text-muted">
            {completedMatches.length} completed
            {activeMatches.length > 0 && ` · ${activeMatches.length} live`}
          </p>
        </div>
        <Link
          to="/$organizationId/matches/new"
          params={{ organizationId }}
          className={buttonVariants({ className: 'hidden md:inline-flex' })}
        >
          <Plus className="size-4" aria-hidden />
          Start match
        </Link>
      </header>

      <SegmentedControl
        label="Filter matches"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
        ]}
      />

      <div className="space-y-3">
        {visible.map(({ match, active }, index) => (
          <Link
            key={match.id}
            to="/$organizationId/matches/$matchId"
            params={{ organizationId, matchId: match.id }}
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            className={
              active
                ? 'block animate-fade-in rounded-xl border border-live/30 bg-live-soft p-4 transition-all hover:-translate-y-0.5 hover:border-live/50 hover:shadow-md'
                : 'block animate-fade-in rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-surface-2 hover:shadow-md'
            }
          >
            <div className="mb-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{match.format}</Badge>
                {active && (
                  <Badge tone="live">
                    <span className="size-1.5 animate-pulse-dot rounded-full bg-live" />
                    Live
                  </Badge>
                )}
              </div>
              <time className="text-muted">
                {new Date(
                  match.completedAt ?? match.startedAt,
                ).toLocaleDateString()}
              </time>
            </div>
            <Scoreboard match={match} people={people} />
          </Link>
        ))}
        {visible.length === 0 && (
          <EmptyState
            icon={<Swords className="size-8" aria-hidden />}
            title={
              filter === 'active' ? 'No active matches' : 'No matches yet'
            }
            description={
              filter === 'active'
                ? 'Start a new match to see it here.'
                : 'Record your first match to build the history.'
            }
            action={
              <Link
                to="/$organizationId/matches/new"
                params={{ organizationId }}
                className={buttonVariants()}
              >
                <Plus className="size-4" aria-hidden />
                Start match
              </Link>
            }
          />
        )}
      </div>
    </div>
  )
}
