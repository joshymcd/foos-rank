import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'
import { queryClient } from './index'

export const personSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  normalizedName: z.string(),
  elo: z.number(),
  createdAt: z.string(),
})

export type Person = z.infer<typeof personSchema>

const storageKey = 'foosrank-people'

async function listPeople(): Promise<Person[]> {
  try {
    const people = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(people)
      ? people.map((person) => ({ ...person, elo: person.elo ?? 1000 }))
      : []
  } catch {
    return []
  }
}

async function savePeople(people: Person[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(people))
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
  await savePeople([...people, person])
  return person
}

async function updatePerson(person: Person) {
  // localStorage is synchronous: keep read→write atomic (no awaits in
  // between) so batched updates from one transaction all persist.
  const storedPeople = JSON.parse(
    window.localStorage.getItem(storageKey) ?? '[]',
  )
  const people = Array.isArray(storedPeople) ? storedPeople : []
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(
      people.map((item) => (item.id === person.id ? person : item)),
    ),
  )
  return person
}

async function deletePerson(id: string) {
  const storedPeople = JSON.parse(
    window.localStorage.getItem(storageKey) ?? '[]',
  )
  const people = Array.isArray(storedPeople) ? storedPeople : []
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(people.filter((person: Person) => person.id !== id)),
  )
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
    onUpdate: async ({ transaction }) =>
      Promise.all(
        transaction.mutations.map((mutation) =>
          updatePerson(mutation.modified),
        ),
      ),
    onDelete: async ({ transaction }) =>
      Promise.all(
        transaction.mutations.map((mutation) =>
          deletePerson(mutation.modified.id),
        ),
      ),
  }),
)
