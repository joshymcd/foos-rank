import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import {
  organizationSnapshotOptions,
  refreshOrganization,
  refreshRecentOrganizations,
} from '../../data/queries'
import type { Organization } from '../../domain/entities'
import { updateOrganizationFn } from '../../server/foosrank.functions'

export const Route = createFileRoute('/$organizationId/admin')({
  component: Admin,
})

function Admin() {
  const { organizationId } = Route.useParams()
  const organization = useQuery(organizationSnapshotOptions(organizationId))
    .data?.organization

  if (!organization) return null

  return <OrganizationSettings organization={organization} />
}

function OrganizationSettings({
  organization,
}: {
  organization: Organization
}) {
  const [name, setName] = useState(organization.name)
  const updateOrganization = useMutation({
    mutationFn: async (newName: string) => {
      const trimmed = newName.trim()
      if (!trimmed) throw new Error('Enter an organization name.')
      await updateOrganizationFn({
        data: { organizationId: organization.id, name: trimmed },
      })
      await Promise.all([
        refreshOrganization(organization.id),
        refreshRecentOrganizations(),
      ])
    },
  })

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Admin
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage organization settings and future administrative options.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Organization settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="max-w-md space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              updateOrganization.mutate(name)
            }}
          >
            <label className="block text-sm font-medium">
              Organization name
              <Input
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  updateOrganization.reset()
                }}
                className="mt-1.5"
                required
              />
            </label>
            {updateOrganization.error && (
              <p role="alert" className="text-sm text-danger">
                {updateOrganization.error.message}
              </p>
            )}
            {updateOrganization.isSuccess && (
              <p role="status" className="text-sm text-muted">
                Organization settings saved.
              </p>
            )}
            <Button type="submit" disabled={updateOrganization.isPending}>
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
