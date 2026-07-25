import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { AppShell, EmptyOrganization } from '../../components/app-shell'
import { matchesCollection } from '../../collections/matches'
import { organizationsCollection } from '../../collections/organization'
import { peopleCollection } from '../../collections/people'

export const Route = createFileRoute('/$organizationId')({
  loader: async () => {
    await Promise.all([
      organizationsCollection.preload(),
      peopleCollection.preload(),
      matchesCollection.preload(),
    ])
  },
  component: OrganizationLayout,
})

function OrganizationLayout() {
  const { organizationId } = Route.useParams()
  const organization = (
    useLiveQuery(() => organizationsCollection).data ?? []
  ).find((item) => item.id === organizationId)
  if (!organization)
    return (
      <main className="min-h-screen bg-bg p-6">
        <EmptyOrganization />
      </main>
    )

  return (
    <AppShell
      organizationId={organizationId}
      organizationName={organization.name}
    >
      <Outlet />
    </AppShell>
  )
}
