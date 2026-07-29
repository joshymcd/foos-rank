import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
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
import {
  organizationSnapshotOptions,
  refreshOrganization,
  refreshRecentOrganizations,
} from '../../data/queries'
import type { Organization, Person } from '../../domain/entities'
import {
  renamePersonFn,
  updateOrganizationFn,
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
    </div>
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
