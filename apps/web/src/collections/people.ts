import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'
import { queryClient } from '../query-client'
import { createPerson, listPeople } from './mock-api'

export const personSchema = z.object({
  id: z.string(),
  name: z.string(),
  normalizedName: z.string(),
  createdAt: z.string(),
})

export type Person = z.infer<typeof personSchema>

export const peopleCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['foosrank', 'people'],
    queryFn: listPeople,
    queryClient,
    schema: personSchema,
    getKey: (person) => person.id,
    onInsert: async ({ transaction }) =>
      Promise.all(
        transaction.mutations.map((mutation) =>
          createPerson(mutation.modified),
        ),
      ),
  }),
)
