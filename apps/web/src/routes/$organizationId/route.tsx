import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { AppShell, EmptyOrganization } from '../../components/app-shell'
import { organizationsCollection } from '../../collections/organization'

export const Route = createFileRoute('/$organizationId')({
  component: OrganizationLayout,
})

function OrganizationLayout() {
  const { organizationId } = Route.useParams()
  const organizationsQuery = useLiveQuery(() => organizationsCollection)

  if (organizationsQuery.isLoading)
    return <main className="min-h-screen bg-bg p-6 text-muted">Loading…</main>

  if (organizationsQuery.isError)
    return (
      <main className="min-h-screen bg-bg p-6 text-danger" role="alert">
        Unable to read the saved organizations.
      </main>
    )

  const organization = organizationsQuery.data?.find(
    (item) => item.id === organizationId,
  )
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
