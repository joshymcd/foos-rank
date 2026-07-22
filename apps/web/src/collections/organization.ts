import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'
import { queryClient } from '../query-client'
import { createOrganization, listOrganizations } from './mock-api'

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
})

export type Organization = z.infer<typeof organizationSchema>

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
