import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { Check, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { EmptyOrganization } from '../../../components/app-shell'
import { Avatar } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { organizationsCollection } from '../../../collections/organization'
import { matchesCollection } from '../../../collections/matches'
import { peopleCollection } from '../../../collections/people'
import type { Person } from '../../../collections/people'
import { leaderboard } from '../../../domain/elo'
import type { RankedPerson } from '../../../domain/elo'

export const Route = createFileRoute('/$organizationId/people/')({
  component: People,
})

function People() {
  const { organizationId } = Route.useParams()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const matches = (useLiveQuery(() => matchesCollection).data ?? []).filter(
    (match) => match.organizationId === organizationId && match.complete,
  )
  const add = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const person = peopleCollection.insert({
        id: crypto.randomUUID(),
        organizationId,
        name: name.trim(),
        normalizedName: name.trim().toLowerCase(),
        elo: 1000,
        createdAt: new Date().toISOString(),
      })
      await person.isPersisted.promise
    },
  })
  const [name, setName] = useState('')
  if (!organization) return <EmptyOrganization />
  const rankedPeople = leaderboard(people, matches)

  return (
    <div className="animate-fade-up space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          People
        </h1>
        <p className="mt-1 text-sm text-muted">
          {people.length} {people.length === 1 ? 'player' : 'players'} on the
          roster.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add a player</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              add.mutate({ name }, { onSuccess: () => setName('') })
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <label className="sr-only" htmlFor="name">
              Player name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Player name"
              className="min-w-0 flex-1"
              required
            />
            <Button type="submit" disabled={add.isPending}>
              <UserPlus className="size-4" aria-hidden />
              Add player
            </Button>
          </form>
          {add.error && (
            <p role="alert" className="mt-2 text-sm font-medium text-danger">
              {add.error.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border">
          {rankedPeople.map((person, index) => (
            <RosterRow
              key={person.id}
              person={person}
              organizationId={organizationId}
              people={people}
              animationDelay={index * 40}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

function RosterRow({
  person,
  organizationId,
  people,
  animationDelay,
}: {
  person: RankedPerson
  organizationId: string
  people: Person[]
  animationDelay: number
}) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(person.name)
  const allMatches = useLiveQuery(() => matchesCollection).data ?? []
  const hasMatches = allMatches.some(
    (match) =>
      match.organizationId === organizationId &&
      match.participants.some(
        (participant) => participant.personId === person.id,
      ),
  )

  const rename = useMutation({
    mutationFn: async (newName: string) => {
      const trimmed = newName.trim()
      if (
        people.some(
          (item) =>
            item.id !== person.id &&
            item.normalizedName === trimmed.toLowerCase(),
        )
      )
        throw new Error('That name is already taken.')
      const transaction = peopleCollection.update(person.id, (draft) => {
        draft.name = trimmed
        draft.normalizedName = trimmed.toLowerCase()
      })
      await transaction.isPersisted.promise
    },
    onSuccess: () => setEditing(false),
  })

  const remove = useMutation({
    mutationFn: async () => {
      await peopleCollection.delete(person.id).isPersisted.promise
    },
  })

  return (
    <div
      style={{ animationDelay: `${animationDelay}ms` }}
      className="flex animate-fade-in items-center gap-3 px-4 py-3 sm:px-5"
    >
      <Avatar name={person.name} size="sm" />
      {editing ? (
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            rename.mutate(draftName)
          }}
        >
          <Input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            className="h-8 min-w-0 flex-1"
            autoFocus
            required
            onKeyDown={(event) => {
              if (event.key === 'Escape') setEditing(false)
            }}
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            aria-label="Save name"
            disabled={rename.isPending}
          >
            <Check className="size-4 text-success" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Cancel rename"
            onClick={() => {
              setEditing(false)
              setDraftName(person.name)
            }}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </form>
      ) : (
        <>
          <Link
            to="/$organizationId/people/$personId"
            params={{ organizationId, personId: person.id }}
            className="min-w-0 flex-1 rounded-md transition-colors hover:bg-surface -m-1 p-1"
          >
            <p className="truncate text-sm font-semibold">{person.name}</p>
            <p className="text-xs text-muted tabular-nums">
              {person.played} played · {person.wins}W – {person.losses}L
            </p>
          </Link>
          <span className="font-display text-sm font-bold tabular-nums">
            {Math.round(person.elo)}
          </span>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Rename ${person.name}`}
              onClick={() => {
                setDraftName(person.name)
                setEditing(true)
              }}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Remove ${person.name}`}
              disabled={hasMatches || remove.isPending}
              title={
                hasMatches
                  ? 'Players with recorded matches cannot be removed.'
                  : undefined
              }
              className="hover:text-danger disabled:opacity-30"
              onClick={() => {
                if (window.confirm(`Remove ${person.name} from the roster?`))
                  remove.mutate()
              }}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </div>
        </>
      )}
      {rename.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {rename.error.message}
        </p>
      )}
    </div>
  )
}
