import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppShell, EmptyOrganization } from '../../components/app-shell'
import { organizationSnapshotOptions, queryClient } from '../../data/queries'
import { rememberOrganization } from '../../data/recent-organizations'

export const Route = createFileRoute('/$organizationId')({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(
      organizationSnapshotOptions(params.organizationId),
    )
  },
  component: OrganizationLayout,
})

function OrganizationLayout() {
  const { organizationId } = Route.useParams()
  const snapshot = useQuery(organizationSnapshotOptions(organizationId)).data
  const organization = snapshot?.organization
  useEffect(() => {
    if (organization) rememberOrganization(organization.id)
  }, [organization])
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
