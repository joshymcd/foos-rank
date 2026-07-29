import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Avatar } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import {
  organizationSnapshotOptions,
  refreshOrganization,
  refreshRecentOrganizations,
} from '../../data/queries'
import type {
  Match,
  MatchFormat,
  MatchParticipant,
  Organization,
  Person,
} from '../../domain/entities'
import { defaultRoles, formats, validateMatch } from '../../domain/matches'
import {
  cancelMatchFn,
  renamePersonFn,
  updateOrganizationFn,
  updatePendingMatchFn,
} from '../../server/foosrank.functions'

export const Route = createFileRoute('/$organizationId/admin')({
  component: Admin,
})

function Admin() {
  const { organizationId } = Route.useParams()
  const snapshot = useQuery(organizationSnapshotOptions(organizationId)).data
  const organization = snapshot?.organization

  if (!organization) return null

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Admin
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage organization and player names.
        </p>
      </header>

      <OrganizationSettings organization={organization} />
      <PlayerNames organizationId={organizationId} people={snapshot.people} />
      <PendingMatches
        organizationId={organizationId}
        people={snapshot.people}
        matches={snapshot.matches}
      />
    </div>
  )
}

function participantsForFormat(
  format: MatchFormat,
  current: MatchParticipant[],
) {
  return (['red', 'blue'] as const).flatMap((team) =>
    defaultRoles(format, team).map((role, index) => ({
      personId:
        current.filter((participant) => participant.team === team)[index]
          ?.personId ?? '',
      team,
      role,
    })),
  )
}

function PendingMatches({
  organizationId,
  people,
  matches,
}: {
  organizationId: string
  people: Person[]
  matches: Match[]
}) {
  const pending = matches
    .filter((match) => !match.complete)
    .sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    )
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending matches</CardTitle>
      </CardHeader>
      <CardContent>
        {pending.length > 0 ? (
          <div className="divide-y divide-border">
            {pending.map((match, index) => (
              <PendingMatchForm
                key={match.id}
                label={`Pending match ${index + 1}`}
                organizationId={organizationId}
                people={people}
                match={match}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No pending matches.</p>
        )}
      </CardContent>
    </Card>
  )
}

function PendingMatchForm({
  label,
  organizationId,
  people,
  match,
}: {
  label: string
  organizationId: string
  people: Person[]
  match: Match
}) {
  const [format, setFormat] = useState(match.format)
  const [participants, setParticipants] = useState(match.participants)
  const update = useMutation({
    mutationFn: async () => {
      const validationError = validateMatch(
        format,
        participants,
        undefined,
        new Set(people.map((person) => person.id)),
      )
      if (validationError) throw new Error(validationError)
      await updatePendingMatchFn({
        data: { organizationId, matchId: match.id, format, participants },
      })
      await refreshOrganization(organizationId)
    },
  })
  const remove = useMutation({
    mutationFn: async () => {
      await cancelMatchFn({
        data: { organizationId, matchId: match.id },
      })
      await refreshOrganization(organizationId)
    },
  })
  const busy = update.isPending || remove.isPending

  return (
    <form
      aria-label={label}
      className="space-y-4 py-5 first:pt-0 last:pb-0"
      onSubmit={(event) => {
        event.preventDefault()
        update.mutate()
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm">{label}</strong>
        <span className="text-xs text-muted">
          {new Date(match.startedAt).toLocaleDateString()}
        </span>
      </div>
      <label className="block text-sm font-medium">
        Format
        <Select
          value={format}
          disabled={busy}
          onChange={(event) => {
            const next = event.target.value as MatchFormat
            setFormat(next)
            setParticipants(participantsForFormat(next, participants))
            update.reset()
          }}
          className="mt-1.5"
        >
          {formats.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {participants.map((participant, index) => (
          <div key={`${participant.team}-${index}`} className="space-y-2">
            <label className="block text-sm font-medium">
              {participant.team} player{' '}
              {
                participants
                  .slice(0, index + 1)
                  .filter((item) => item.team === participant.team).length
              }
              <Select
                value={participant.personId}
                disabled={busy}
                onChange={(event) => {
                  setParticipants((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, personId: event.target.value }
                        : item,
                    ),
                  )
                  update.reset()
                }}
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
            <label className="block text-sm font-medium">
              Position
              <Select
                value={participant.role}
                disabled={
                  busy ||
                  participants.filter((item) => item.team === participant.team)
                    .length === 1
                }
                onChange={(event) => {
                  const role = event.target.value as MatchParticipant['role']
                  setParticipants((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, role } : item,
                    ),
                  )
                  update.reset()
                }}
                className="mt-1.5"
              >
                <option value="attack">Attack</option>
                <option value="defence">Defence</option>
                <option value="both">Both</option>
              </Select>
            </label>
          </div>
        ))}
      </div>
      {(update.error || remove.error) && (
        <p role="alert" className="text-sm text-danger">
          {update.error?.message ?? remove.error?.message}
        </p>
      )}
      {update.isSuccess && (
        <p role="status" className="text-sm text-muted">
          Pending match saved.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          Save match
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-danger hover:bg-danger/10 hover:text-danger"
          disabled={busy}
          onClick={() => {
            if (window.confirm('Delete this pending match?')) remove.mutate()
          }}
        >
          <Trash2 className="size-4" aria-hidden />
          Delete match
        </Button>
      </div>
    </form>
  )
}

function OrganizationSettings({
  organization,
}: {
  organization: Organization
}) {
  const [name, setName] = useState(organization.name)
  const updateOrganization = useMutation({
    mutationFn: async (newName: string) => {
      const trimmed = newName.trim()
      if (!trimmed) throw new Error('Enter an organization name.')
      await updateOrganizationFn({
        data: { organizationId: organization.id, name: trimmed },
      })
      await Promise.all([
        refreshOrganization(organization.id),
        refreshRecentOrganizations(),
      ])
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="max-w-md space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            updateOrganization.mutate(name)
          }}
        >
          <label className="block text-sm font-medium">
            Organization name
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                updateOrganization.reset()
              }}
              className="mt-1.5"
              required
            />
          </label>
          {updateOrganization.error && (
            <p role="alert" className="text-sm text-danger">
              {updateOrganization.error.message}
            </p>
          )}
          {updateOrganization.isSuccess && (
            <p role="status" className="text-sm text-muted">
              Organization settings saved.
            </p>
          )}
          <Button type="submit" disabled={updateOrganization.isPending}>
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PlayerNames({
  organizationId,
  people,
}: {
  organizationId: string
  people: Person[]
}) {
  const sortedPeople = [...people].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player names</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted">
          Update your own name or another player's display name.
        </p>
        <div className="divide-y divide-border">
          {sortedPeople.map((person) => (
            <PlayerNameRow
              key={person.id}
              organizationId={organizationId}
              person={person}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PlayerNameRow({
  organizationId,
  person,
}: {
  organizationId: string
  person: Person
}) {
  const [name, setName] = useState(person.name)
  useEffect(() => setName(person.name), [person.name])
  const rename = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Enter a player name.')
      await renamePersonFn({
        data: { organizationId, personId: person.id, name: trimmed },
      })
      await refreshOrganization(organizationId)
    },
  })

  return (
    <form
      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault()
        rename.mutate()
      }}
    >
      <Avatar name={person.name} size="sm" />
      <label className="sr-only" htmlFor={`player-name-${person.id}`}>
        Name for {person.name}
      </label>
      <Input
        id={`player-name-${person.id}`}
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          rename.reset()
        }}
        className="min-w-0 flex-1"
        required
      />
      <Button type="submit" disabled={rename.isPending || name === person.name}>
        Save
      </Button>
      {rename.error && (
        <p role="alert" className="text-sm text-danger">
          {rename.error.message}
        </p>
      )}
      {rename.isSuccess && (
        <p role="status" className="text-sm text-muted">
          Player name saved.
        </p>
      )}
    </form>
  )
}
