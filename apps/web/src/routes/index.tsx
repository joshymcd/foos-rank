import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { ChevronRight, Trophy } from 'lucide-react'
import { Card } from '../components/ui/card'
import { ThemeToggle } from '../components/ui/theme-toggle'
import { organizationsCollection } from '../collections/organization'

export const Route = createFileRoute('/')({
  loader: async () => {
    await organizationsCollection.preload()
  },
  component: Home,
})

function Home() {
  const navigate = useNavigate()
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []

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
              <p className="text-xs text-muted">Local foosball tracking</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <Card className="p-5">
          <section>
            <h1 className="font-display text-xl font-bold">
              Your organizations
            </h1>
            {organizations.length > 0 ? (
              <div className="mt-3 divide-y divide-border">
                {organizations.map((organization) => (
                  <button
                    key={organization.id}
                    type="button"
                    onClick={() =>
                      navigate({
                        to: '/$organizationId',
                        params: { organizationId: organization.id },
                      })
                    }
                    className="flex w-full items-center justify-between py-3 text-left text-sm font-medium hover:text-brand"
                  >
                    {organization.name}
                    <ChevronRight className="size-4 text-muted" aria-hidden />
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                No organizations are stored in this browser.
              </p>
            )}
          </section>
        </Card>
      </div>
    </main>
  )
}
