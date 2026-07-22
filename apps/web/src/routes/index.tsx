import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { organizationsCollection } from '../collections/organization'

export const Route = createFileRoute('/')({ component: Home })
function Home() {
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  const { organizationId } = Route.useSearch()
  const organization =
    organizations.find((item) => item.id === organizationId) ??
    organizations.at(0)
  return (
    <Navigate
      to={organization ? '/overview' : '/setup'}
      search={organization ? { organizationId: organization.id } : {}}
    />
  )
}
