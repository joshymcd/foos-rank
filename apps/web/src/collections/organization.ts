import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'
import { readStoredArray, updateStoredArray } from '../lib/local-storage'
import { queryClient } from './index'

const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
})

export type Organization = z.infer<typeof organizationSchema>

const storageKey = 'foosrank-organizations'

async function listOrganizations(): Promise<Organization[]> {
  return readStoredArray<Organization>(storageKey)
}

export function resetOrganization() {
  window.localStorage.removeItem(storageKey)
}

export const organizationsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['foosrank', 'organizations'],
    queryFn: listOrganizations,
    queryClient,
    schema: organizationSchema,
    getKey: (organization) => organization.id,
    onInsert: async ({ transaction }) => {
      updateStoredArray<Organization>(storageKey, (organizations) => {
        const next = [...organizations]
        for (const mutation of transaction.mutations) {
          if (next.some((item) => item.id === mutation.modified.id))
            throw new Error('An organization with that ID already exists.')
          next.push(mutation.modified)
        }
        return next
      })
    },
    onUpdate: async ({ transaction }) => {
      updateStoredArray<Organization>(storageKey, (organizations) => {
        const next = [...organizations]
        for (const mutation of transaction.mutations) {
          const organization = mutation.modified
          const index = next.findIndex((item) => item.id === organization.id)
          if (index < 0) throw new Error('Organization not found.')
          if (!organization.name.trim())
            throw new Error('Enter an organization name.')
          next[index] = organization
        }
        return next
      })
    },
  }),
)
