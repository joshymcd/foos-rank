import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ThemeToggle } from '../components/ui/theme-toggle'
import { rememberOrganization } from '../data/recent-organizations'
import { refreshOrganization } from '../data/queries'
import { setupOrganizationFn } from '../server/foosrank.functions'

export const Route = createFileRoute('/setup')({
  component: Setup,
})

function Setup() {
  const navigate = useNavigate()
  const [organizationName, setOrganizationName] = useState('')
  const [personName, setPersonName] = useState('')
  const createOrganization = useMutation({
    mutationFn: async ({
      name,
      playerName,
      id,
    }: {
      name: string
      playerName: string
      id: string
    }) => {
      if (!name || !playerName || !id)
        throw new Error('Enter an organization name and your name.')
      await setupOrganizationFn({
        data: { id, name, playerName },
      })
      rememberOrganization(id)
      await refreshOrganization(id)
    },
  })

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = organizationName.trim()
    const playerName = personName.trim()
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    createOrganization.mutate(
      { name, playerName, id },
      {
        onSuccess: () =>
          navigate({ to: '/$organizationId', params: { organizationId: id } }),
      },
    )
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-on-brand">
              <Trophy className="size-4" aria-hidden />
            </span>
            <div>
              <p className="font-display text-lg font-bold tracking-tight">
                FoosRank
              </p>
              <p className="text-xs text-muted">Organization setup</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <Card className="p-5">
          <h1 className="font-display text-xl font-bold">
            Create your organization
          </h1>
          <p className="mt-1 text-sm text-muted">
            Anyone with the organization URL can view and update its shared
            data.
          </p>
          <form onSubmit={submit} className="mt-5 space-y-4">
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
            {createOrganization.error && (
              <p role="alert" className="text-sm text-danger">
                {createOrganization.error.message}
              </p>
            )}
            <Button
              type="submit"
              disabled={createOrganization.isPending}
              className="w-full"
            >
              Create organization
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}
