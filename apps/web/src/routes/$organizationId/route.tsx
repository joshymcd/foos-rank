import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AppShell } from '../../components/app-shell'

export const Route = createFileRoute('/$organizationId')({
  component: OrganizationLayout,
})

function OrganizationLayout() {
  const { organizationId } = Route.useParams()

  return (
    <AppShell organizationId={organizationId}>
      <Outlet />
    </AppShell>
  )
}
