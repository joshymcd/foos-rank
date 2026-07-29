import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Scoreboard } from '../../../components/scoreboard'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import {
  refreshOrganization,
  updateOrganizationSnapshot,
} from '../../../collections'
import { getMatchesCollection } from '../../../collections/matches'
import type { TeamColor } from '../../../collections/matches'
import { getPeopleCollection } from '../../../collections/people'
import { dataStore } from '../../../data/datastore'
import { eloHistory } from '../../../domain/elo'
import { validateMatch } from '../../../domain/matches'
import { cn } from '../../../lib/cn'

export const Route = createFileRoute('/$organizationId/matches/$matchId')({
  component: MatchDetail,
})

function MatchDetail() {
  const navigate = useNavigate()
  const { organizationId, matchId } = Route.useParams()
  const people =
    useLiveQuery(() => getPeopleCollection(organizationId)).data ?? []
  const matches =
    useLiveQuery(() => getMatchesCollection(organizationId)).data ?? []
  const match = matches.find(
    (item) => item.id === matchId && item.organizationId === organizationId,
  )
  const complete = useMutation({
    mutationFn: async (score: Record<TeamColor, number>) => {
      if (!match) throw new Error('Match not found.')
      const validPersonIds = new Set(people.map((person) => person.id))
      const scoreError = validateMatch(
        match.format,
        match.participants,
        score,
        validPersonIds,
      )
      if (scoreError) throw new Error(scoreError)
      const completed = await dataStore.completeMatch({
        organizationId,
        matchId,
        score,
      })
      updateOrganizationSnapshot(organizationId, (snapshot) => ({
        ...snapshot,
        matches: snapshot.matches.map((item) =>
          item.id === completed.match.id ? completed.match : item,
        ),
        people: snapshot.people.map(
          (person) =>
            completed.people.find((item) => item.id === person.id) ?? person,
        ),
      }))
      await refreshOrganization(organizationId).catch(() => undefined)
    },
  })
  const cancel = useMutation({
    mutationFn: async () => {
      if (match) {
        await dataStore.cancelMatch({ organizationId, matchId: match.id })
        updateOrganizationSnapshot(organizationId, (snapshot) => ({
          ...snapshot,
          matches: snapshot.matches.filter((item) => item.id !== match.id),
        }))
        await refreshOrganization(organizationId).catch(() => undefined)
      }
    },
  })
  const [redScore, setRedScore] = useState(0)
  const [blueScore, setBlueScore] = useState(0)
  const [attemptedComplete, setAttemptedComplete] = useState(false)

  if (!match) {
    return (
      <div className="space-y-4">
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
    const scoreError = validateMatch(
      match.format,
      match.participants,
      score,
      new Set(people.map((person) => person.id)),
    )
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <BackLink organizationId={organizationId} />
          <span className="inline-flex items-center gap-1 rounded-full bg-pending-soft px-2 py-0.5 text-xs font-semibold text-pending">
            <span className="size-1.5 rounded-full bg-pending" />
            Pending · {match.format}
          </span>
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
              {((attemptedComplete && scoreError) ||
                complete.error ||
                cancel.error) && (
                <p role="alert" className="font-medium text-danger">
                  {(attemptedComplete && scoreError) ||
                    complete.error?.message ||
                    cancel.error?.message}
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
                disabled={complete.isPending}
                onClick={() => {
                  setAttemptedComplete(true)
                  if (!scoreError) complete.mutate(score)
                }}
              >
                Save result
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <BackLink organizationId={organizationId} />
        <span className="text-sm text-muted">
          {match.format} ·{' '}
          {new Date(match.completedAt ?? match.startedAt).toLocaleDateString()}
        </span>
      </div>

      <Card className="p-5 sm:p-6">
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
              const eloChange = match.eloChanges?.find(
                (item) => item.personId === participant.personId,
              )
              const postMatchElo =
                match.sequence === null
                  ? undefined
                  : eloHistory(participant.personId, matches).find(
                      (point) => point.sequence === match.sequence,
                    )?.elo
              return (
                <div
                  key={participant.personId + participant.role}
                  className="flex items-center gap-3 py-2.5 text-sm"
                >
                  <strong className="min-w-0 flex-1 truncate">
                    {person?.name ?? 'Unknown player'}
                  </strong>
                  <span
                    className={cn(
                      'font-semibold tabular-nums',
                      eloChange && eloChange.change > 0 && 'text-success',
                      eloChange && eloChange.change < 0 && 'text-danger',
                      (!eloChange || eloChange.change === 0) && 'text-faint',
                    )}
                  >
                    {eloChange
                      ? eloChange.change > 0
                        ? `+${eloChange.change}`
                        : eloChange.change
                      : 'Not tracked'}
                  </span>
                  {postMatchElo !== undefined && eloChange && (
                    <span className="w-12 text-right font-display font-bold tabular-nums">
                      {Math.round(postMatchElo)}
                    </span>
                  )}
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
  match: {
    participants: Array<{ personId: string; team: TeamColor; role: string }>
  }
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
          className="w-24 rounded-lg border border-border bg-card py-2 text-center font-display text-5xl font-bold tabular-nums text-text focus:border-brand"
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
