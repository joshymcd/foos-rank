import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, ChevronRight, Swords, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { organizationsCollection } from '../collections/organization'
import { peopleCollection } from '../collections/people'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ThemeToggle } from '../components/ui/theme-toggle'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
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
  const [organizationId, setOrganizationId] = useState('')
  const [organizationLookupError, setOrganizationLookupError] = useState('')
  const error = createOrganization.error
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const newOrganizationId = organizationName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    createOrganization.mutate(
      { organizationName, personName, organizationId: newOrganizationId },
      {
        onSuccess: () =>
          navigate({
            to: '/$organizationId',
            params: { organizationId: newOrganizationId },
          }),
      },
    )
  }
  const openOrganization = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const existingOrganization = organizations.find(
      (organization) => organization.id === organizationId.trim().toLowerCase(),
    )
    if (!existingOrganization) {
      setOrganizationLookupError('Organization not found in this browser.')
      return
    }
    navigate({
      to: '/$organizationId',
      params: { organizationId: existingOrganization.id },
    })
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Hero panel */}
      <div className="relative hidden overflow-hidden bg-card lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div
          aria-hidden
          className="absolute -left-24 -top-24 size-96 rounded-full bg-brand/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-16 size-96 rounded-full bg-accent/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute bottom-24 left-1/3 size-64 rounded-full bg-team-blue/10 blur-3xl"
        />
        <div className="relative animate-fade-up">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-on-brand">
              <Trophy className="size-5" aria-hidden />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight">
              FoosRank
            </span>
          </div>
          <h1 className="mt-10 font-display text-5xl font-bold leading-tight tracking-tight">
            Every goal
            <br />
            <span className="text-brand">counts.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            The foosball tracker for your office. Record matches, climb the Elo
            leaderboard, and settle who really rules the table.
          </p>
          <ul className="mt-10 space-y-4 text-sm font-medium text-muted">
            <li className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Swords className="size-4" aria-hidden />
              </span>
              1v1 and doubles formats with attack &amp; defence roles
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Trophy className="size-4" aria-hidden />
              </span>
              Elo ratings, streaks, and head-to-head records
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Users className="size-4" aria-hidden />
              </span>
              One organization per browser — no accounts, no setup
            </li>
          </ul>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col p-4 sm:p-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-on-brand">
              <Trophy className="size-4" aria-hidden />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              FoosRank
            </span>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <Card className="w-full max-w-md animate-fade-up p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold tracking-tight">
              Create your organization
            </h2>
            <p className="mt-1 text-sm text-muted">
              Everything is stored locally in this browser.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                Organization name
                <Input
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  className="mt-1.5"
                  placeholder="Acme Ltd"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Your name
                <Input
                  value={personName}
                  onChange={(event) => setPersonName(event.target.value)}
                  className="mt-1.5"
                  placeholder="Alex Morgan"
                  required
                />
              </label>
              {error && (
                <p role="alert" className="text-sm font-medium text-danger">
                  {error.message}
                </p>
              )}
              <Button
                type="submit"
                disabled={createOrganization.isPending}
                className="w-full"
                size="lg"
              >
                Create organization
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </form>

            <section className="mt-6 border-t border-border pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Open an organization
              </h3>
              <form onSubmit={openOrganization} className="mt-3 flex gap-2">
                <label className="sr-only" htmlFor="organization-id">
                  Organization ID
                </label>
                <Input
                  id="organization-id"
                  value={organizationId}
                  onChange={(event) => {
                    setOrganizationId(event.target.value)
                    setOrganizationLookupError('')
                  }}
                  className="min-w-0 flex-1"
                  placeholder="acme-ltd"
                  required
                />
                <Button type="submit" variant="secondary">
                  Open
                </Button>
              </form>
              {organizationLookupError && (
                <p role="alert" className="mt-2 text-sm font-medium text-danger">
                  {organizationLookupError}
                </p>
              )}
            </section>

            {organizations.length > 0 && (
              <section className="mt-6 border-t border-border pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Your organizations
                </h3>
                <div className="mt-3 space-y-2">
                  {organizations.map((organization, index) => (
                    <button
                      key={organization.id}
                      type="button"
                      onClick={() =>
                        navigate({
                          to: '/$organizationId',
                          params: { organizationId: organization.id },
                        })
                      }
                      style={{ animationDelay: `${index * 50}ms` }}
                      className="flex w-full animate-fade-in items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-left text-sm font-medium transition-all hover:border-brand/40 hover:bg-brand-soft"
                    >
                      {organization.name}
                      <ChevronRight
                        className="size-4 text-faint"
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
