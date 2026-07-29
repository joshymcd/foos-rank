import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { AppShell, EmptyOrganization } from '../../components/app-shell'
import { getMatchesCollection } from '../../collections/matches'
import { getOrganizationCollection } from '../../collections/organization'
import { getPeopleCollection } from '../../collections/people'
import { dataStore } from '../../data/datastore'
import { rememberOrganization } from '../../data/recent-organizations'

export const Route = createFileRoute('/$organizationId')({
  loader: async ({ params }) => {
    const snapshot = await dataStore.getOrganizationSnapshot(
      params.organizationId,
    )
    if (snapshot) rememberOrganization(params.organizationId)
    await Promise.all([
      getOrganizationCollection(params.organizationId).preload(),
      getPeopleCollection(params.organizationId).preload(),
      getMatchesCollection(params.organizationId).preload(),
    ])
  },
  component: OrganizationLayout,
})

function OrganizationLayout() {
  const { organizationId } = Route.useParams()
  const organization = (
    useLiveQuery(() => getOrganizationCollection(organizationId)).data ?? []
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
