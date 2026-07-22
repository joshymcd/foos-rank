import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'
import { queryClient } from '../query-client'

export const personSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  normalizedName: z.string(),
  createdAt: z.string(),
})

export type Person = z.infer<typeof personSchema>

const storageKey = 'foosrank-people'

async function listPeople(): Promise<Person[]> {
  try {
    const people = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(people) ? people : []
  } catch {
    return []
  }
}

async function createPerson(person: Person) {
  const storedPeople = JSON.parse(
    window.localStorage.getItem(storageKey) ?? '[]',
  )
  const people = Array.isArray(storedPeople) ? storedPeople : []
  if (
    people.some(
      (item) =>
        item.organizationId === person.organizationId &&
        item.normalizedName === person.normalizedName,
    )
  ) {
    throw new Error('That person is already in this organization.')
  }
  window.localStorage.setItem(storageKey, JSON.stringify([...people, person]))
  return person
}

export async function resetPeople() {
  window.localStorage.removeItem(storageKey)
}

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
