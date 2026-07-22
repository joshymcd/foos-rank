import { createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { AppShell, EmptyOrganization } from '../components/app-shell'
import { organizationsCollection } from '../collections/organization'
import { matchesCollection } from '../collections/matches'
import { peopleCollection } from '../collections/people'
import { leaderboard } from '../domain/elo'

export const Route = createFileRoute('/people')({ component: People })
function People() {
  const { organizationId } = Route.useSearch()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const organization = organizations.find((item) => item.id === organizationId)
  const people = (useLiveQuery(() => peopleCollection).data ?? []).filter(
    (person) => person.organizationId === organizationId,
  )
  const matches = (useLiveQuery(() => matchesCollection).data ?? []).filter(
    (match) => match.organizationId === organizationId && match.complete,
  )
  const add = useMutation({
    mutationFn: async ({
      name,
      personOrganizationId,
    }: {
      name: string
      personOrganizationId: string
    }) => {
      const person = peopleCollection.insert({
        id: crypto.randomUUID(),
        organizationId: personOrganizationId,
        name: name.trim(),
        normalizedName: name.trim().toLowerCase(),
        elo: 1000,
        createdAt: new Date().toISOString(),
      })
      await person.isPersisted.promise
    },
  })
  const [name, setName] = useState('')
  if (!organization)
    return (
      <AppShell title="People">
        <EmptyOrganization />
      </AppShell>
    )
  const rankedPeople = leaderboard(people, matches)
  return (
    <AppShell title="People">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Add a player</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            add.mutate(
              { name, personOrganizationId: organization.id },
              { onSuccess: () => setName('') },
            )
          }}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <label className="sr-only" htmlFor="name">
            Player name
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Player name"
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2"
            required
          />
          <button
            disabled={add.isPending}
            className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            Add player
          </button>
        </form>
        {add.error && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {add.error.message}
          </p>
        )}
      </section>
      <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 font-semibold">
          Organization roster
        </div>
        <div className="divide-y divide-slate-100">
          {rankedPeople.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div>
                <p className="font-medium">{person.name}</p>
                <p className="text-sm text-slate-500">
                  {person.played} played · {person.wins}W {person.losses}L
                </p>
              </div>
              <strong className="tabular-nums">{Math.round(person.elo)}</strong>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
