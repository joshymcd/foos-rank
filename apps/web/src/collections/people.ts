import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { z } from 'zod'
import { INITIAL_ELO } from '../domain/elo'
import { readStoredArray, updateStoredArray } from '../lib/local-storage'
import { queryClient } from './index'

const personSchema = z.object({
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
  return readStoredArray<Omit<Person, 'elo'> & { elo?: number }>(
    storageKey,
  ).map((person) => ({
    ...person,
    elo: person.elo ?? INITIAL_ELO,
  }))
}

export function resetPeople() {
  window.localStorage.removeItem(storageKey)
}

export const peopleCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['foosrank', 'people'],
    queryFn: listPeople,
    queryClient,
    schema: personSchema,
    getKey: (person) => person.id,
    onInsert: async ({ transaction }) => {
      updateStoredArray<Person>(storageKey, (people) => {
        const next = [...people]
        for (const mutation of transaction.mutations) {
          const person = mutation.modified
          if (!person.name.trim()) throw new Error('Enter a player name.')
          if (
            next.some(
              (item) =>
                item.organizationId === person.organizationId &&
                item.normalizedName === person.normalizedName,
            )
          )
            throw new Error('That person is already in this organization.')
          next.push(person)
        }
        return next
      })
    },
    onUpdate: async ({ transaction }) => {
      updateStoredArray<Person>(storageKey, (people) => {
        const next = [...people]
        for (const mutation of transaction.mutations) {
          const person = mutation.modified
          const index = next.findIndex((item) => item.id === person.id)
          if (index < 0) throw new Error('Player not found.')
          if (!person.name.trim()) throw new Error('Enter a player name.')
          if (
            next.some(
              (item) =>
                item.id !== person.id &&
                item.organizationId === person.organizationId &&
                item.normalizedName === person.normalizedName,
            )
          )
            throw new Error('That person is already in this organization.')
          next[index] = person
        }
        return next
      })
    },
    onDelete: async ({ transaction }) => {
      updateStoredArray<Person>(storageKey, (people) => {
        const deletedIds = new Set(
          transaction.mutations.map((mutation) => mutation.modified.id),
        )
        if (
          ![...deletedIds].every((id) => people.some((item) => item.id === id))
        )
          throw new Error('Player not found.')
        return people.filter((person) => !deletedIds.has(person.id))
      })
    },
  }),
)
