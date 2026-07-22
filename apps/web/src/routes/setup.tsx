import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { organizationsCollection } from '../collections/organization'
import { loadDemo } from '../collections/mock-api'
import { peopleCollection } from '../collections/people'
import { queryClient } from '../query-client'

export const Route = createFileRoute('/setup')({ component: Setup })

function Setup() {
  const navigate = useNavigate()
  const createOrganization = useMutation({
    mutationFn: async ({
      organizationName,
      personName,
    }: {
      organizationName: string
      personName: string
    }) => {
      const organization = organizationsCollection.insert({
        id: crypto.randomUUID(),
        name: organizationName.trim(),
        createdAt: new Date().toISOString(),
      })
      await organization.isPersisted.promise
      const person = peopleCollection.insert({
        id: crypto.randomUUID(),
        name: personName.trim(),
        normalizedName: personName.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
      })
      await person.isPersisted.promise
    },
  })
  const demoMutation = useMutation({
    mutationFn: async () => {
      await loadDemo()
      await queryClient.invalidateQueries({ queryKey: ['foosrank'] })
    },
  })
  const [organizationName, setOrganizationName] = useState('')
  const [personName, setPersonName] = useState('')
  const error = createOrganization.error ?? demoMutation.error
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createOrganization.mutate(
      { organizationName, personName },
      { onSuccess: () => navigate({ to: '/overview' }) },
    )
  }
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-emerald-700">FoosRank</p>
        <h1 className="text-2xl font-bold">Create your organization</h1>
        <p className="mt-2 text-sm text-slate-600">
          This prototype uses temporary dummy data.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Organization name
            <input
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Acme Ltd"
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Your name
            <input
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Alex Morgan"
              required
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error.message}
            </p>
          )}
          <button
            disabled={createOrganization.isPending}
            className="w-full rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            Create organization
          </button>
        </form>
        <button
          type="button"
          disabled={demoMutation.isPending}
          onClick={() =>
            demoMutation.mutate(undefined, {
              onSuccess: () => navigate({ to: '/overview' }),
            })
          }
          className="mt-3 w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold"
        >
          Load sample organization
        </button>
      </section>
    </main>
  )
}
