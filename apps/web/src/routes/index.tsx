import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { organizationsCollection } from '../collections/organization'

export const Route = createFileRoute('/')({ component: Home })
function Home() {
  const organizations = useLiveQuery(() => organizationsCollection).data ?? []
  return <Navigate to={organizations.at(0) ? '/overview' : '/setup'} />
}
