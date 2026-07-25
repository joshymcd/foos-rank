import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Minus, Plus, Trash2, Trophy } from 'lucide-react'
import { useState } from 'react'
import { EmptyOrganization } from '../../../components/app-shell'
import { Scoreboard } from '../../../components/scoreboard'
import { Avatar } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { organizationsCollection } from '../../../collections/organization'
import { matchesCollection, validateMatch } from '../../../collections/matches'
import type { TeamColor } from '../../../collections/matches'
import { peopleCollection } from '../../../collections/people'
import { calculateEloChanges } from '../../../domain/elo'
import { cn } from '../../../lib/cn'

export const Route = createFileRoute('/$organizationId/matches/$matchId')({
  component: MatchDetail,
})

function MatchDetail() {
  const navigate = useNavigate()
  const { organizationId, matchId } = Route.useParams()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const matches = useLiveQuery(() => matchesCollection).data ?? []
  const match = matches.find(
    (item) => item.id === matchId && item.organizationId === organizationId,
  )
  const complete = useMutation({
    mutationFn: async (score: Record<TeamColor, number>) => {
      if (!match) throw new Error('Match not found.')
      const scoreError = validateMatch(match.format, match.participants, score)
      if (scoreError) throw new Error(scoreError)
      const sequence =
        matches.filter(
          (item) => item.organizationId === organizationId && item.complete,
        ).length + 1
      const completedAt = new Date().toISOString()
      const eloChanges = calculateEloChanges(
        { participants: match.participants, score },
        people.filter((person) =>
          match.participants.some(
            (participant) => participant.personId === person.id,
          ),
        ),
      )
      const transactions = [
        matchesCollection.update(match.id, (draft) => {
          draft.complete = true
          draft.sequence = sequence
          draft.completedAt = completedAt
          draft.score = score
          draft.eloChanges = eloChanges
        }),
        ...eloChanges.map((eloChange) =>
          peopleCollection.update(eloChange.personId, (draft) => {
            draft.elo += eloChange.change
          }),
        ),
      ]
      await Promise.all(
        transactions.map((transaction) => transaction.isPersisted.promise),
      )
    },
  })
  const cancel = useMutation({
    mutationFn: async () => {
      if (match) await matchesCollection.delete(match.id).isPersisted.promise
    },
  })
  const [redScore, setRedScore] = useState(0)
  const [blueScore, setBlueScore] = useState(0)

  if (!organization) return <EmptyOrganization />

  if (!match) {
    return (
      <div className="animate-fade-up space-y-4">
        <BackLink organizationId={organizationId} />
        <p className="text-muted">
          Match not found.{' '}
          <Link
            to="/$organizationId/matches"
            params={{ organizationId }}
            className="font-semibold text-brand hover:underline"
          >
            Back to history
          </Link>
        </p>
      </div>
    )
  }

  if (!match.complete) {
    const score = { red: redScore, blue: blueScore }
    const scoreError = validateMatch(match.format, match.participants, score)
    return (
      <div className="animate-fade-up mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <BackLink organizationId={organizationId} />
          <Badge tone="live">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-live" />
            Live · {match.format}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ScorePanel
            team="red"
            match={match}
            people={people}
            value={redScore}
            onChange={setRedScore}
          />
          <ScorePanel
            team="blue"
            match={match}
            people={people}
            value={blueScore}
            onChange={setBlueScore}
          />
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 !pt-5">
            <div className="text-sm">
              {(scoreError || complete.error || cancel.error) && (
                <p role="alert" className="font-medium text-danger">
                  {scoreError ?? complete.error?.message ?? cancel.error?.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-danger hover:bg-danger/10 hover:text-danger"
                disabled={cancel.isPending}
                onClick={() => {
                  if (window.confirm('Cancel and delete this match?'))
                    cancel.mutate(undefined, {
                      onSuccess: () =>
                        navigate({
                          to: '/$organizationId/matches',
                          params: { organizationId },
                        }),
                    })
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                Cancel match
              </Button>
              <Button
                size="lg"
                disabled={complete.isPending || Boolean(scoreError)}
                onClick={() => complete.mutate(score)}
              >
                Save result
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const winner = match.score
    ? match.score.red > match.score.blue
      ? 'red'
      : 'blue'
    : null

  return (
    <div className="animate-fade-up mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <BackLink organizationId={organizationId} />
        <Badge tone="neutral">
          {match.format} ·{' '}
          {new Date(match.completedAt ?? match.startedAt).toLocaleDateString()}
        </Badge>
      </div>

      <Card className="animate-scale-in p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-center gap-2">
          <Trophy
            className={cn(
              'size-5',
              winner === 'red' ? 'text-team-red' : 'text-team-blue',
            )}
            aria-hidden
          />
          <h1
            className={cn(
              'font-display text-xl font-bold capitalize',
              winner === 'red' ? 'text-team-red' : 'text-team-blue',
            )}
          >
            {winner} team wins
          </h1>
        </div>
        <Scoreboard match={match} people={people} />
      </Card>

      <Card>
        <CardContent className="!pt-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Rating changes
          </h2>
          <div className="divide-y divide-border">
            {match.participants.map((participant) => {
              const person = people.find(
                (item) => item.id === participant.personId,
              )
              const change =
                match.eloChanges?.find(
                  (item) => item.personId === participant.personId,
                )?.change ?? 0
              return (
                <div
                  key={participant.personId + participant.role}
                  className="flex items-center gap-3 py-2.5 text-sm"
                >
                  <Avatar name={person?.name ?? 'Unknown'} size="xs" />
                  <span className="min-w-0 flex-1 truncate">
                    <strong>{person?.name ?? 'Unknown'}</strong>
                    <span className="text-muted">
                      {' '}
                      · {participant.team} · {participant.role}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'font-semibold tabular-nums',
                      change > 0 && 'text-success',
                      change < 0 && 'text-danger',
                      change === 0 && 'text-faint',
                    )}
                  >
                    {change > 0 ? `+${change}` : change}
                  </span>
                  <span className="w-12 text-right font-display font-bold tabular-nums">
                    {Math.round(person?.elo ?? 1000)}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function BackLink({ organizationId }: { organizationId: string }) {
  return (
    <Link
      to="/$organizationId/matches"
      params={{ organizationId }}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-text"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Matches
    </Link>
  )
}

function ScorePanel({
  team,
  match,
  people,
  value,
  onChange,
}: {
  team: TeamColor
  match: { participants: Array<{ personId: string; team: TeamColor; role: string }> }
  people: Array<{ id: string; name: string }>
  value: number
  onChange: (value: number) => void
}) {
  const clamp = (next: number) => onChange(Math.max(0, Math.min(99, next)))
  const names = match.participants
    .filter((participant) => participant.team === team)
    .map(
      (participant) =>
        people.find((person) => person.id === participant.personId)?.name ??
        'Unknown',
    )
  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 text-center',
        team === 'red'
          ? 'border-team-red/25 bg-team-red-soft'
          : 'border-team-blue/25 bg-team-blue-soft',
      )}
    >
      <p
        className={cn(
          'text-xs font-bold uppercase tracking-wider',
          team === 'red' ? 'text-team-red' : 'text-team-blue',
        )}
      >
        {team}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-text">
        {names.join(' + ')}
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          aria-label={`Decrease ${team} score`}
          className="size-11 !rounded-full !px-0"
          disabled={value <= 0}
          onClick={() => clamp(value - 1)}
        >
          <Minus className="size-5" aria-hidden />
        </Button>
        <label className="sr-only" htmlFor={`${team}-score`}>
          {team} score
        </label>
        <input
          id={`${team}-score`}
          inputMode="numeric"
          type="number"
          min={0}
          max={99}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) clamp(next)
          }}
          className="w-24 rounded-lg border border-border bg-card py-2 text-center font-display text-5xl font-bold tabular-nums text-text focus:border-brand focus:outline-none"
        />
        <Button
          variant="outline"
          aria-label={`Increase ${team} score`}
          className="size-11 !rounded-full !px-0"
          disabled={value >= 99}
          onClick={() => clamp(value + 1)}
        >
          <Plus className="size-5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
