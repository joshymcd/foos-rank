import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { organizationsCollection } from '../collections/organization'
import { peopleCollection } from '../collections/people'

export const Route = createFileRoute('/setup')({ component: Setup })

function Setup() {
  const navigate = useNavigate()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const createOrganization = useMutation({
    mutationFn: async ({
      organizationName,
      personName,
      organizationId,
    }: {
      organizationName: string
      personName: string
      organizationId: string
    }) => {
      const organization = organizationsCollection.insert({
        id: organizationId,
        name: organizationName.trim(),
        createdAt: new Date().toISOString(),
      })
      await organization.isPersisted.promise
      const person = peopleCollection.insert({
        id: crypto.randomUUID(),
        organizationId,
        name: personName.trim(),
        normalizedName: personName.trim().toLowerCase(),
        elo: 1000,
        createdAt: new Date().toISOString(),
      })
      await person.isPersisted.promise
    },
  })
  const [organizationName, setOrganizationName] = useState('')
  const [personName, setPersonName] = useState('')
  const error = createOrganization.error
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const organizationId = organizationName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    createOrganization.mutate(
      { organizationName, personName, organizationId },
      {
        onSuccess: () =>
          navigate({ to: '/overview', search: { organizationId } }),
      },
    )
  }
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-emerald-700">FoosRank</p>
        <h1 className="text-2xl font-bold">Create your organization</h1>
        <p className="mt-2 text-sm text-slate-600">Stored in this browser.</p>
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
        {organizations.length > 0 && (
          <section className="mt-6 border-t border-slate-200 pt-6">
            <h2 className="font-semibold">Your organizations</h2>
            <div className="mt-3 space-y-2">
              {organizations.map((organization) => (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() =>
                    navigate({
                      to: '/overview',
                      search: { organizationId: organization.id },
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-left text-sm font-medium hover:bg-slate-50"
                >
                  {organization.name}
                </button>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
