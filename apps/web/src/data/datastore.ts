import {
  addPersonFn,
  cancelMatchFn,
  completeMatchFn,
  deletePersonFn,
  getOrganizationsFn,
  getOrganizationSnapshotFn,
  renamePersonFn,
  setupOrganizationFn,
  startMatchFn,
  updateOrganizationFn,
} from '../server/foosrank.functions'

export const dataStore = {
  getOrganizations: (ids: string[]) => getOrganizationsFn({ data: { ids } }),
  getOrganizationSnapshot: (id: string) =>
    getOrganizationSnapshotFn({ data: { id } }),
  setupOrganization: (
    data: Parameters<typeof setupOrganizationFn>[0]['data'],
  ) => setupOrganizationFn({ data }),
  updateOrganization: (
    data: Parameters<typeof updateOrganizationFn>[0]['data'],
  ) => updateOrganizationFn({ data }),
  addPerson: (data: Parameters<typeof addPersonFn>[0]['data']) =>
    addPersonFn({ data }),
  renamePerson: (data: Parameters<typeof renamePersonFn>[0]['data']) =>
    renamePersonFn({ data }),
  deletePerson: (data: Parameters<typeof deletePersonFn>[0]['data']) =>
    deletePersonFn({ data }),
  startMatch: (data: Parameters<typeof startMatchFn>[0]['data']) =>
    startMatchFn({ data }),
  cancelMatch: (data: Parameters<typeof cancelMatchFn>[0]['data']) =>
    cancelMatchFn({ data }),
  completeMatch: (data: Parameters<typeof completeMatchFn>[0]['data']) =>
    completeMatchFn({ data }),
}
