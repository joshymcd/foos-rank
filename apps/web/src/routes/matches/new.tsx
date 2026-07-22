import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { AppShell, EmptyOrganization } from '../../components/app-shell'
import { organizationsCollection } from '../../collections/organization'
import {
  defaultRoles,
  formats,
  matchesCollection,
  teamSize,
  validateMatch,
} from '../../collections/matches'
import type {
  MatchFormat,
  MatchParticipant,
  TeamColor,
} from '../../collections/matches'
import { peopleCollection } from '../../collections/people'

export const Route = createFileRoute('/matches/new')({
  component: NewMatch,
})

function createParticipants(format: MatchFormat): MatchParticipant[] {
  const teams: TeamColor[] = ['red', 'blue']
  return teams.flatMap((team) =>
    defaultRoles(format, team).map((role) => ({ personId: '', team, role })),
  )
}

function NewMatch() {
  const navigate = useNavigate()
  const { organizationId } = Route.useSearch()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const matches = useLiveQuery(() => matchesCollection).data ?? []
  const active = matches.find(
    (match) => match.organizationId === organizationId && !match.complete,
  )
  const start = useMutation({
    mutationFn: async ({
      format,
      participants,
      matchOrganizationId,
    }: {
      format: MatchFormat
      participants: MatchParticipant[]
      matchOrganizationId: string
    }) => {
      const match = matchesCollection.insert({
        id: crypto.randomUUID(),
        organizationId: matchOrganizationId,
        format,
        participants,
        startedAt: new Date().toISOString(),
        complete: false,
        sequence: null,
        completedAt: null,
        score: null,
        ratingAlgorithm: null,
      })
      await match.isPersisted.promise
    },
  })
  const complete = useMutation({
    mutationFn: async (score: Record<TeamColor, number>) => {
      const current = Array.from(matchesCollection.values()).find(
        (match) => match.organizationId === organizationId && !match.complete,
      )
      if (!current) throw new Error('There is no active match.')
      const match = matchesCollection.update(current.id, (draft) => {
        draft.complete = true
        draft.sequence =
          Array.from(matchesCollection.values()).filter(
            (storedMatch) =>
              storedMatch.organizationId === organizationId &&
              storedMatch.complete,
          ).length + 1
        draft.completedAt = new Date().toISOString()
        draft.score = score
        draft.ratingAlgorithm = 'elo-team-average-v1'
      })
      await match.isPersisted.promise
    },
  })
  const cancel = useMutation({
    mutationFn: async () => {
      const current = Array.from(matchesCollection.values()).find(
        (match) => match.organizationId === organizationId && !match.complete,
      )
      if (current)
        await matchesCollection.delete(current.id).isPersisted.promise
    },
  })
  const [format, setFormat] = useState<MatchFormat>('1v1')
  const [participants, setParticipants] = useState<MatchParticipant[]>(
    createParticipants('1v1'),
  )
  const [redScore, setRedScore] = useState('')
  const [blueScore, setBlueScore] = useState('')
  if (!organization)
    return (
      <AppShell title="Start match">
        <EmptyOrganization />
      </AppShell>
    )
  const error = start.error ?? complete.error ?? cancel.error
  const setPlayer = (index: number, personId: string) =>
    setParticipants((current) =>
      current.map((participant, itemIndex) =>
        itemIndex === index ? { ...participant, personId } : participant,
      ),
    )
  const setRole = (index: number, role: MatchParticipant['role']) =>
    setParticipants((current) =>
      current.map((participant, itemIndex) =>
        itemIndex === index ? { ...participant, role } : participant,
      ),
    )
  if (active) {
    const score = { red: Number(redScore), blue: Number(blueScore) }
    const scoreError =
      redScore === '' || blueScore === ''
        ? undefined
        : validateMatch(active.format, active.participants, score)
    return (
      <AppShell title="Enter score">
        <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            {active.format} started{' '}
            {new Date(active.startedAt).toLocaleTimeString()}
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
          {(scoreError || error) && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {scoreError ?? error?.message}
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
              onClick={() =>
                complete.mutate(score, {
                  onSuccess: () => navigate({ to: '/matches' }),
                })
              }
              className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              Save result
            </button>
            <button
              onClick={() =>
                cancel.mutate(undefined, {
                  onSuccess: () => navigate({ to: '/overview' }),
                })
              }
              className="rounded-md border border-slate-300 px-4 py-2 font-semibold"
            >
              Cancel match
            </button>
          </div>
        </section>
      </AppShell>
    )
  }
  const configurationError = validateMatch(format, participants)
  return (
    <AppShell title="Start match">
      <section className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5">
        <fieldset>
          <legend className="font-semibold">Match format</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {formats.map((item) => (
              <label
                key={item.value}
                className={`cursor-pointer rounded border p-3 text-center text-sm ${format === item.value ? 'border-emerald-700 bg-emerald-50 font-semibold' : 'border-slate-200'}`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="format"
                  checked={format === item.value}
                  onChange={() => {
                    setFormat(item.value)
                    setParticipants(createParticipants(item.value))
                  }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <TeamBuilder
            team="red"
            format={format}
            participants={participants}
            people={people}
            setPlayer={setPlayer}
            setRole={setRole}
          />
          <TeamBuilder
            team="blue"
            format={format}
            participants={participants}
            people={people}
            setPlayer={setPlayer}
            setRole={setRole}
          />
        </div>
        {(configurationError || error) && (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {configurationError ?? error?.message}
          </p>
        )}
        <button
          disabled={start.isPending || Boolean(configurationError)}
          onClick={() =>
            start.mutate({
              format,
              participants,
              matchOrganizationId: organization.id,
            })
          }
          className="mt-6 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Start match
        </button>
        {people.length < 2 && (
          <p className="mt-3 text-sm text-slate-500">
            Add at least two people in{' '}
            <Link to="/people" className="underline">
              People
            </Link>{' '}
            first.
          </p>
        )}
      </section>
    </AppShell>
  )
}

function TeamBuilder({
  team,
  format,
  participants,
  people,
  setPlayer,
  setRole,
}: {
  team: TeamColor
  format: MatchFormat
  participants: MatchParticipant[]
  people: Array<{ id: string; name: string }>
  setPlayer: (index: number, personId: string) => void
  setRole: (index: number, role: MatchParticipant['role']) => void
}) {
  const indexes = participants
    .map((participant, index) => ({ participant, index }))
    .filter(({ participant }) => participant.team === team)
  return (
    <fieldset
      className={`rounded-lg p-4 ${team === 'red' ? 'bg-red-50' : 'bg-blue-50'}`}
    >
      <legend className="font-semibold capitalize">
        {team} team ({teamSize(format, team)})
      </legend>
      <div className="mt-3 space-y-3">
        {indexes.map(({ participant, index }) => (
          <div key={`${team}-${index}`} className="grid gap-2">
            <label className="text-sm font-medium">
              Player {indexes.length > 1 ? index + 1 : ''}
              <select
                value={participant.personId}
                onChange={(event) => setPlayer(index, event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">Select player</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
            {indexes.length > 1 && (
              <label className="text-sm font-medium">
                Position
                <select
                  value={participant.role}
                  onChange={(event) => {
                    if (
                      event.target.value === 'attack' ||
                      event.target.value === 'defence'
                    ) {
                      setRole(index, event.target.value)
                    }
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="attack">Attack</option>
                  <option value="defence">Defence</option>
                </select>
              </label>
            )}{' '}
            {indexes.length === 1 && (
              <p className="text-xs text-slate-600">Position: both</p>
            )}
          </div>
        ))}
      </div>
    </fieldset>
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
