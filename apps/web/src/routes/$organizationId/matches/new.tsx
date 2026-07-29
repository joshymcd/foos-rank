import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { SegmentedControl } from '../../../components/ui/segmented-control'
import { Select } from '../../../components/ui/select'
import {
  refreshOrganization,
  updateOrganizationSnapshot,
} from '../../../collections'
import type {
  MatchFormat,
  MatchParticipant,
  PlayerRole,
  TeamColor,
} from '../../../collections/matches'
import { getPeopleCollection } from '../../../collections/people'
import { dataStore } from '../../../data/datastore'
import {
  defaultRoles,
  formats,
  teamSize,
  validateMatch,
} from '../../../domain/matches'
import { cn } from '../../../lib/cn'

export const Route = createFileRoute('/$organizationId/matches/new')({
  component: NewMatch,
})

function createParticipants(format: MatchFormat): MatchParticipant[] {
  const teams: TeamColor[] = ['red', 'blue']
  return teams.flatMap((team) =>
    defaultRoles(format, team).map((role) => ({ personId: '', team, role })),
  )
}

const roleOptions: Array<{ value: PlayerRole; label: string }> = [
  { value: 'attack', label: 'Attack' },
  { value: 'defence', label: 'Defence' },
  { value: 'both', label: 'Both' },
]

function NewMatch() {
  const navigate = useNavigate()
  const { organizationId } = Route.useParams()
  const people =
    useLiveQuery(() => getPeopleCollection(organizationId)).data ?? []
  const pendingMatchId = useRef<string | null>(null)
  const start = useMutation({
    mutationFn: async ({
      format,
      participants,
    }: {
      format: MatchFormat
      participants: MatchParticipant[]
    }) => {
      const match = await dataStore.startMatch({
        organizationId,
        matchId: (pendingMatchId.current ??= crypto.randomUUID()),
        format,
        participants,
      })
      updateOrganizationSnapshot(organizationId, (snapshot) => ({
        ...snapshot,
        matches: snapshot.matches.some((item) => item.id === match.id)
          ? snapshot.matches
          : [...snapshot.matches, match],
      }))
      await refreshOrganization(organizationId).catch(() => undefined)
      return match.id
    },
  })
  const [format, setFormat] = useState<MatchFormat>('1v1')
  const [participants, setParticipants] = useState<MatchParticipant[]>(
    createParticipants('1v1'),
  )
  const [attemptedStart, setAttemptedStart] = useState(false)

  const error = start.error
  const validPersonIds = new Set(people.map((person) => person.id))
  const configurationError = validateMatch(
    format,
    participants,
    undefined,
    validPersonIds,
  )
  const setPlayer = (index: number, personId: string) => {
    pendingMatchId.current = null
    setParticipants((current) =>
      current.map((participant, itemIndex) =>
        itemIndex === index ? { ...participant, personId } : participant,
      ),
    )
  }
  const setRole = (index: number, role: MatchParticipant['role']) => {
    pendingMatchId.current = null
    setParticipants((current) => {
      const selected = current[index]
      if (role === 'both')
        return current.map((participant) =>
          participant.team === selected.team
            ? { ...participant, role: 'both' }
            : participant,
        )

      const teammateRole = role === 'attack' ? 'defence' : 'attack'
      return current.map((participant, itemIndex) => {
        if (participant.team !== selected.team) return participant
        return {
          ...participant,
          role: itemIndex === index ? role : teammateRole,
        }
      })
    })
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Start match
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pick a format and assign players to each team.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Format</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {formats.map((item) => {
            const selected = format === item.value
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  pendingMatchId.current = null
                  setFormat(item.value)
                  setParticipants(createParticipants(item.value))
                  setAttemptedStart(false)
                }}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                  selected
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-border bg-card hover:border-surface-2 hover:bg-surface',
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-sm">
          {(attemptedStart && configurationError) || error ? (
            <p role="alert" className="font-medium text-danger">
              {(attemptedStart && configurationError) || error?.message}
            </p>
          ) : null}
          {people.length < 2 && (
            <p className="text-muted">
              Add at least two people in{' '}
              <Link
                to="/$organizationId/people"
                params={{ organizationId }}
                className="font-semibold text-brand hover:underline"
              >
                People
              </Link>{' '}
              first.
            </p>
          )}
        </div>
        <Button
          size="lg"
          disabled={start.isPending || people.length < 2}
          onClick={() => {
            setAttemptedStart(true)
            if (configurationError) return
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
          }}
        >
          <Play className="size-4" aria-hidden />
          Start match
        </Button>
      </div>
    </div>
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
  const size = teamSize(format, team)
  return (
    <Card
      className={cn(
        'border-2',
        team === 'red' ? 'border-team-red/25' : 'border-team-blue/25',
      )}
    >
      <CardHeader>
        <CardTitle
          className={team === 'red' ? 'text-team-red' : 'text-team-blue'}
        >
          {team} team · {size} {size === 1 ? 'player' : 'players'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {indexes.map(({ participant, index }, slot) => (
          <div key={`${team}-${index}`} className="space-y-2.5">
            <label className="block text-sm font-medium">
              {size > 1 ? `Player ${slot + 1}` : 'Player'}
              <Select
                value={participant.personId}
                onChange={(event) => setPlayer(index, event.target.value)}
                className="mt-1.5"
              >
                <option value="">Select player</option>
                {people.map((person) => (
                  <option
                    key={person.id}
                    value={person.id}
                    disabled={participants.some(
                      (item, itemIndex) =>
                        itemIndex !== index && item.personId === person.id,
                    )}
                  >
                    {person.name}
                  </option>
                ))}
              </Select>
            </label>
            {size > 1 ? (
              <div>
                <p className="mb-1.5 text-sm font-medium">Position</p>
                <SegmentedControl
                  label={`Position for ${team} player ${slot + 1}`}
                  options={roleOptions}
                  value={participant.role}
                  onChange={(role) => setRole(index, role)}
                />
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
