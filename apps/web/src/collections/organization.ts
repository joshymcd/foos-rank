import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'
import { queryClient } from './index'

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
})

export type Organization = z.infer<typeof organizationSchema>

const storageKey = 'foosrank-organizations'

async function listOrganizations(): Promise<Organization[]> {
  try {
    const organizations = JSON.parse(
      window.localStorage.getItem(storageKey) ?? '[]',
    )
    return Array.isArray(organizations) ? organizations : []
  } catch {
    return []
  }
}

async function createOrganization(organization: Organization) {
  const storedOrganizations = JSON.parse(
    window.localStorage.getItem(storageKey) ?? '[]',
  )
  const organizations = Array.isArray(storedOrganizations)
    ? storedOrganizations
    : []
  window.localStorage.setItem(
    storageKey,
    JSON.stringify([...organizations, organization]),
  )
  return organization
}

export async function resetOrganization() {
  window.localStorage.removeItem(storageKey)
}

export const organizationsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['foosrank', 'organizations'],
    queryFn: listOrganizations,
    queryClient,
    schema: organizationSchema,
    getKey: (organization) => organization.id,
    onInsert: async ({ transaction }) =>
      Promise.all(
        transaction.mutations.map((mutation) =>
          createOrganization(mutation.modified),
        ),
      ),
  }),
)
