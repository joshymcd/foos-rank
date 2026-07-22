import {
  Link,
  Navigate,
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { EmptyOrganization } from '../../../components/app-shell'
import { organizationsCollection } from '../../../collections/organization'
import {
  defaultRoles,
  formats,
  matchesCollection,
  teamSize,
  validateMatch,
} from '../../../collections/matches'
import type {
  MatchFormat,
  MatchParticipant,
  TeamColor,
} from '../../../collections/matches'
import { peopleCollection } from '../../../collections/people'

export const Route = createFileRoute('/$organizationId/matches/new')({
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
  const { organizationId } = Route.useParams()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const matches = useLiveQuery(() => matchesCollection).data ?? []
  const activeMatch = matches.find(
    (match) => match.organizationId === organizationId && !match.complete,
  )
  const start = useMutation({
    mutationFn: async ({
      format,
      participants,
    }: {
      format: MatchFormat
      participants: MatchParticipant[]
    }) => {
      const match = matchesCollection.insert({
        id: crypto.randomUUID(),
        organizationId,
        format,
        participants,
        startedAt: new Date().toISOString(),
        complete: false,
        sequence: null,
        completedAt: null,
        score: null,
        eloChanges: null,
      })
      await match.isPersisted.promise
      return match.id
    },
  })
  const [format, setFormat] = useState<MatchFormat>('1v1')
  const [participants, setParticipants] = useState<MatchParticipant[]>(
    createParticipants('1v1'),
  )

  if (!organization) return <EmptyOrganization />

  if (activeMatch) {
    return (
      <Navigate
        to="/$organizationId/matches/$matchId"
        params={{ organizationId, matchId: activeMatch.id }}
      />
    )
  }

  const error = start.error
  const configurationError = validateMatch(format, participants)
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

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Start match</h1>
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
            start.mutate(
              { format, participants },
              {
                onSuccess: (matchId) =>
                  navigate({
                    to: '/$organizationId/matches/$matchId',
                    params: { organizationId, matchId },
                  }),
              },
            )
          }
          className="mt-6 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Start match
        </button>
        {people.length < 2 && (
          <p className="mt-3 text-sm text-slate-500">
            Add at least two people in{' '}
            <Link
              to="/$organizationId/people"
              params={{ organizationId }}
              className="underline"
            >
              People
            </Link>{' '}
            first.
          </p>
        )}
      </section>
    </>
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
            {indexes.length > 1 ? (
              <label className="text-sm font-medium">
                Position
                <select
                  value={participant.role}
                  onChange={(event) => {
                    if (
                      event.target.value === 'attack' ||
                      event.target.value === 'defence'
                    )
                      setRole(index, event.target.value)
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="attack">Attack</option>
                  <option value="defence">Defence</option>
                </select>
              </label>
            ) : (
              <p className="text-xs text-slate-600">Position: both</p>
            )}
          </div>
        ))}
      </div>
    </fieldset>
  )
}
