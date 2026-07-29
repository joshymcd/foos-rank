import { createServerFn } from '@tanstack/react-start'
import {
  addPersonInputSchema,
  completeMatchInputSchema,
  matchInputSchema,
  organizationInputSchema,
  personInputSchema,
  recentOrganizationsInputSchema,
  renamePersonInputSchema,
  setupOrganizationInputSchema,
  startMatchInputSchema,
  updateOrganizationInputSchema,
} from '../domain/entities'
import {
  addPerson,
  cancelMatch,
  completeMatch,
  deletePerson,
  getOrganizations,
  getOrganizationSnapshot,
  renamePerson,
  setupOrganization,
  startMatch,
  updateOrganization,
} from './foosrank-repository.server'

export const getOrganizationsFn = createServerFn({ method: 'GET' })
  .validator(recentOrganizationsInputSchema)
  .handler(({ data }) => getOrganizations(data.ids))

export const getOrganizationSnapshotFn = createServerFn({ method: 'GET' })
  .validator(organizationInputSchema)
  .handler(({ data }) => getOrganizationSnapshot(data.id))

export const setupOrganizationFn = createServerFn({ method: 'POST' })
  .validator(setupOrganizationInputSchema)
  .handler(({ data }) => setupOrganization(data))

export const updateOrganizationFn = createServerFn({ method: 'POST' })
  .validator(updateOrganizationInputSchema)
  .handler(({ data }) => updateOrganization(data))

export const addPersonFn = createServerFn({ method: 'POST' })
  .validator(addPersonInputSchema)
  .handler(({ data }) => addPerson(data))

export const renamePersonFn = createServerFn({ method: 'POST' })
  .validator(renamePersonInputSchema)
  .handler(({ data }) => renamePerson(data))

export const deletePersonFn = createServerFn({ method: 'POST' })
  .validator(personInputSchema)
  .handler(({ data }) => deletePerson(data))

export const startMatchFn = createServerFn({ method: 'POST' })
  .validator(startMatchInputSchema)
  .handler(({ data }) => startMatch(data))

export const cancelMatchFn = createServerFn({ method: 'POST' })
  .validator(matchInputSchema)
  .handler(({ data }) => cancelMatch(data))

export const completeMatchFn = createServerFn({ method: 'POST' })
  .validator(completeMatchInputSchema)
  .handler(({ data }) => completeMatch(data))
