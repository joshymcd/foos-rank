import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import {
  organizationSnapshotOptions,
  refreshOrganization,
} from '../../../data/queries'
import type { Person } from '../../../domain/entities'
import {
  addPersonFn,
  deletePersonFn,
  renamePersonFn,
} from '../../../server/foosrank.functions'

export const Route = createFileRoute('/$organizationId/people/')({
  component: People,
})

function People() {
  const { organizationId } = Route.useParams()
  const snapshot = useQuery(organizationSnapshotOptions(organizationId)).data
  const people = [...(snapshot?.people ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  )
  const matches = snapshot?.matches ?? []
  const add = useMutation({
    mutationFn: async (playerName: string) => {
      const trimmed = playerName.trim()
      if (!trimmed) throw new Error('Enter a player name.')
      await addPersonFn({
        data: { organizationId, name: trimmed },
      })
      await refreshOrganization(organizationId)
    },
  })
  const [name, setName] = useState('')

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Players
        </h1>
        <p className="mt-1 text-sm text-muted">
          {people.length} {people.length === 1 ? 'player' : 'players'}
        </p>
      </header>

      <Card className="overflow-hidden">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            add.mutate(name, { onSuccess: () => setName('') })
          }}
          className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:p-5"
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
          {add.error && (
            <p role="alert" className="self-center text-sm text-danger">
              {add.error.message}
            </p>
          )}
        </form>

        <div className="divide-y divide-border">
          {people.map((person) => (
            <RosterRow
              key={person.id}
              person={person}
              organizationId={organizationId}
              hasMatches={matches.some((match) =>
                match.participants.some(
                  (participant) => participant.personId === person.id,
                ),
              )}
            />
          ))}
          {people.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted">No players yet.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

function RosterRow({
  person,
  organizationId,
  hasMatches,
}: {
  person: Person
  organizationId: string
  hasMatches: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(person.name)
  const rename = useMutation({
    mutationFn: async (newName: string) => {
      const trimmed = newName.trim()
      if (!trimmed) throw new Error('Enter a player name.')
      await renamePersonFn({
        data: { organizationId, personId: person.id, name: trimmed },
      })
      await refreshOrganization(organizationId)
    },
    onSuccess: () => setEditing(false),
  })
  const remove = useMutation({
    mutationFn: async () => {
      await deletePersonFn({
        data: { organizationId, personId: person.id },
      })
      await refreshOrganization(organizationId)
    },
  })

  return (
    <div className="px-4 py-3 sm:px-5">
      <div className="flex items-center gap-3">
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
              className="h-9 min-w-0 flex-1"
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
              className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-brand"
            >
              {person.name}
            </Link>
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
            {!hasMatches && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${person.name}`}
                disabled={remove.isPending}
                className="hover:text-danger"
                onClick={() => {
                  if (window.confirm(`Remove ${person.name} from the roster?`))
                    remove.mutate()
                }}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            )}
          </>
        )}
      </div>
      {(rename.error || remove.error) && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {rename.error?.message ?? remove.error?.message}
        </p>
      )}
    </div>
  )
}
