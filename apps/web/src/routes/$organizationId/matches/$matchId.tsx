import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { EmptyOrganization } from '../../../components/app-shell'
import { MatchTeams } from '../../../components/match-teams'
import { organizationsCollection } from '../../../collections/organization'
import { matchesCollection, validateMatch } from '../../../collections/matches'
import type { TeamColor } from '../../../collections/matches'
import {
  calculateEloChanges,
  peopleCollection,
} from '../../../collections/people'

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
        {
          ...match,
          complete: true,
          sequence,
          completedAt,
          score,
          eloChanges: null,
        },
        people.filter((person) =>
          match.participants.some(
            (participant) => participant.personId === person.id,
          ),
        ),
      )
      const transaction = matchesCollection.update(match.id, (draft) => {
        draft.complete = true
        draft.sequence = sequence
        draft.completedAt = completedAt
        draft.score = score
        draft.eloChanges = eloChanges
      })
      await transaction.isPersisted.promise
    },
  })
  const cancel = useMutation({
    mutationFn: async () => {
      if (match) await matchesCollection.delete(match.id).isPersisted.promise
    },
  })
  const [redScore, setRedScore] = useState('')
  const [blueScore, setBlueScore] = useState('')

  if (!organization) return <EmptyOrganization />

  if (!match) {
    return (
      <>
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Match</h1>
        <p>
          Match not found.{' '}
          <Link
            to="/$organizationId/matches"
            params={{ organizationId }}
            className="underline"
          >
            Back to history
          </Link>
        </p>
      </>
    )
  }

  if (!match.complete) {
    const score = { red: Number(redScore), blue: Number(blueScore) }
    const scoreError =
      redScore === '' || blueScore === ''
        ? undefined
        : validateMatch(match.format, match.participants, score)
    return (
      <>
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Enter score</h1>
        <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            {match.format} started{' '}
            {new Date(match.startedAt).toLocaleTimeString()}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <ScoreInput
              label="Red score"
              value={redScore}
              onChange={setRedScore}
              tone="red"
            />
            <ScoreInput
              label="Blue score"
              value={blueScore}
              onChange={setBlueScore}
              tone="blue"
            />
          </div>
          {(scoreError || complete.error || cancel.error) && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {scoreError ?? complete.error?.message ?? cancel.error?.message}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={
                complete.isPending ||
                Boolean(scoreError) ||
                redScore === '' ||
                blueScore === ''
              }
              onClick={() => complete.mutate(score)}
              className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              Save result
            </button>
            <button
              onClick={() =>
                cancel.mutate(undefined, {
                  onSuccess: () =>
                    navigate({
                      to: '/$organizationId',
                      params: { organizationId },
                    }),
                })
              }
              className="rounded-md border border-slate-300 px-4 py-2 font-semibold"
            >
              Cancel match
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Match result</h1>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex justify-between text-sm text-slate-500">
          <span>{match.format}</span>
          <time>
            {new Date(match.completedAt ?? match.startedAt).toLocaleString()}
          </time>
        </div>
        <MatchTeams match={match} people={people} />
        <h2 className="mt-7 font-semibold">Player Elo</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {match.participants.map((participant) => {
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
                <span className="font-semibold tabular-nums">
                  {Math.round(person?.elo ?? 1000)}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

function ScoreInput({
  label,
  value,
  onChange,
  tone,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  tone: 'red' | 'blue'
}) {
  return (
    <label
      className={`rounded-lg p-4 ${tone === 'red' ? 'bg-red-50' : 'bg-blue-50'}`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <input
        inputMode="numeric"
        type="number"
        min="0"
        max="99"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-3xl font-bold tabular-nums"
      />
    </label>
  )
}
