import {
  Link,
  Navigate,
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { Play, User, Users } from 'lucide-react'
import { useState } from 'react'
import { EmptyOrganization } from '../../../components/app-shell'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { SegmentedControl } from '../../../components/ui/segmented-control'
import { Select } from '../../../components/ui/select'
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
  PlayerRole,
  TeamColor,
} from '../../../collections/matches'
import { peopleCollection } from '../../../collections/people'
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
        role === 'both' && participant.team === current[index].team
          ? { ...participant, role }
          : itemIndex === index
            ? { ...participant, role }
            : participant,
      ),
    )

  return (
    <div className="animate-fade-up space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Start match
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pick a format and assign players to each team.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Match format</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="radiogroup"
            aria-label="Match format"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
          >
            {formats.map((item) => {
              const selected = format === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setFormat(item.value)
                    setParticipants(createParticipants(item.value))
                  }}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all active:scale-[0.98]',
                    selected
                      ? 'border-brand bg-brand-soft shadow-sm'
                      : 'border-border bg-card hover:border-surface-2 hover:bg-surface',
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center gap-1',
                      selected ? 'text-brand' : 'text-faint',
                    )}
                  >
                    {item.red === 2 ? (
                      <Users className="size-4" aria-hidden />
                    ) : (
                      <User className="size-4" aria-hidden />
                    )}
                    <span className="text-xs font-bold">vs</span>
                    {item.blue === 2 ? (
                      <Users className="size-4" aria-hidden />
                    ) : (
                      <User className="size-4" aria-hidden />
                    )}
                  </span>
                  <span
                    className={cn(
                      'font-display text-lg font-bold',
                      selected ? 'text-brand' : 'text-text',
                    )}
                  >
                    {item.value}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

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

      <Card className="sticky bottom-20 z-10 shadow-lg md:bottom-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 !pt-5">
          <div className="text-sm">
            {configurationError || error ? (
              <p role="alert" className="font-medium text-danger">
                {configurationError ?? error?.message}
              </p>
            ) : (
              <p className="text-muted">Ready when you are.</p>
            )}
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
          >
            <Play className="size-4" aria-hidden />
            Start match
          </Button>
        </CardContent>
      </Card>
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
          <div
            key={`${team}-${index}`}
            className={cn(
              'space-y-2.5 rounded-lg p-3',
              team === 'red' ? 'bg-team-red-soft' : 'bg-team-blue-soft',
            )}
          >
            <label className="block text-sm font-medium">
              {size > 1 ? `Player ${slot + 1}` : 'Player'}
              <Select
                value={participant.personId}
                onChange={(event) => setPlayer(index, event.target.value)}
                className="mt-1.5"
              >
                <option value="">Select player</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
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
            ) : (
              <p className="text-xs text-muted">Plays both positions</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
