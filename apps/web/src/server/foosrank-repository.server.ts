import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Resource } from 'sst'
import { calculateEloChanges, INITIAL_ELO } from '../domain/elo'
import {
  matchSchema,
  normalizeName,
  organizationSchema,
  organizationSnapshotSchema,
  personSchema,
} from '../domain/entities'
import type {
  Match,
  MatchFormat,
  MatchParticipant,
  Organization,
  OrganizationSnapshot,
  Person,
  Score,
} from '../domain/entities'
import { validateMatch } from '../domain/matches'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
})
const tableName = (
  Resource as typeof Resource & { FoosRankData: { name: string } }
).FoosRankData.name

const pk = (organizationId: string) => `ORG#${organizationId}`
const personSk = (personId: string) => `PERSON#${personId}`
const nameSk = (normalizedName: string) => `PERSON_NAME#${normalizedName}`
const matchSk = (matchId: string) => `MATCH#${matchId}`

interface StoredEntity<T> {
  pk: string
  sk: string
  entity: T
  matchCount?: number
  version?: number
}

function isTransactionConflict(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'TransactionCanceledException' ||
      error.name === 'TransactionConflictException')
  )
}

async function getItem<T>(organizationId: string, sk: string) {
  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: pk(organizationId), sk },
      ConsistentRead: true,
    }),
  )
  return result.Item as StoredEntity<T> | undefined
}

function personVersion(item: StoredEntity<Person>) {
  if (typeof item.version !== 'number')
    throw new Error('Player record is invalid.')
  return item.version
}

export async function getOrganizations(ids: string[]) {
  if (ids.length === 0) return []
  const items: Array<Record<string, unknown>> = []
  let keys = ids.map((id) => ({ pk: pk(id), sk: 'META' }))
  for (let attempt = 0; keys.length > 0 && attempt < 5; attempt += 1) {
    const result = await client.send(
      new BatchGetCommand({
        RequestItems: {
          [tableName]: { Keys: keys },
        },
      }),
    )
    items.push(...(result.Responses?.[tableName] ?? []))
    keys = (result.UnprocessedKeys?.[tableName]?.Keys ?? []) as typeof keys
    if (keys.length > 0)
      await new Promise((resolve) => setTimeout(resolve, 20 * 2 ** attempt))
  }
  if (keys.length > 0) throw new Error('Organizations could not be loaded.')
  const organizations = new Map(
    items.flatMap((item) => {
      const parsed = organizationSchema.safeParse(item.entity)
      return parsed.success ? [[parsed.data.id, parsed.data] as const] : []
    }),
  )
  return ids.flatMap((id) => {
    const organization = organizations.get(id)
    return organization ? [organization] : []
  })
}

export async function getOrganizationSnapshot(
  organizationId: string,
): Promise<OrganizationSnapshot | null> {
  const items: Array<Record<string, unknown>> = []
  let lastKey: Record<string, unknown> | undefined
  do {
    const result = await client.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': pk(organizationId) },
        ExclusiveStartKey: lastKey,
        ConsistentRead: true,
      }),
    )
    items.push(...(result.Items ?? []))
    lastKey = result.LastEvaluatedKey
  } while (lastKey)

  const organizationItem = items.find((item) => item.sk === 'META')
  if (!organizationItem) return null
  return organizationSnapshotSchema.parse({
    organization: organizationItem.entity,
    people: items
      .filter((item) => String(item.sk).startsWith('PERSON#'))
      .map((item) => item.entity),
    matches: items
      .filter((item) => String(item.sk).startsWith('MATCH#'))
      .map((item) => item.entity),
  })
}

export async function setupOrganization(input: {
  id: string
  name: string
  playerName: string
}) {
  const createdAt = new Date().toISOString()
  const organization = organizationSchema.parse({
    id: input.id,
    name: input.name,
    createdAt,
  })
  const person = personSchema.parse({
    id: crypto.randomUUID(),
    organizationId: input.id,
    name: input.playerName,
    normalizedName: normalizeName(input.playerName),
    elo: INITIAL_ELO,
    createdAt,
  })
  try {
    await client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName,
              Item: { pk: pk(input.id), sk: 'META', entity: organization },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: { pk: pk(input.id), sk: 'COUNTER', value: 0 },
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                pk: pk(input.id),
                sk: personSk(person.id),
                entity: person,
                matchCount: 0,
                version: 0,
              },
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                pk: pk(input.id),
                sk: nameSk(person.normalizedName),
                personId: person.id,
              },
            },
          },
        ],
      }),
    )
  } catch (error) {
    if (isTransactionConflict(error))
      throw new Error('An organization with that ID already exists.')
    throw error
  }
  return { organization, people: [person], matches: [] }
}

export async function updateOrganization(input: {
  organizationId: string
  name: string
}) {
  const current = await getItem<Organization>(input.organizationId, 'META')
  if (!current) throw new Error('Organization not found.')
  const organization = organizationSchema.parse({
    ...current.entity,
    name: input.name,
  })
  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: { ...current, entity: organization },
      ConditionExpression: 'attribute_exists(pk)',
    }),
  )
  return organization
}

export async function addPerson(input: {
  organizationId: string
  name: string
}) {
  const person = personSchema.parse({
    id: crypto.randomUUID(),
    organizationId: input.organizationId,
    name: input.name,
    normalizedName: normalizeName(input.name),
    elo: INITIAL_ELO,
    createdAt: new Date().toISOString(),
  })
  try {
    await client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            ConditionCheck: {
              TableName: tableName,
              Key: { pk: pk(input.organizationId), sk: 'META' },
              ConditionExpression: 'attribute_exists(pk)',
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                pk: pk(input.organizationId),
                sk: personSk(person.id),
                entity: person,
                matchCount: 0,
                version: 0,
              },
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                pk: pk(input.organizationId),
                sk: nameSk(person.normalizedName),
                personId: person.id,
              },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
        ],
      }),
    )
  } catch (error) {
    if (isTransactionConflict(error))
      throw new Error('That person is already in this organization.')
    throw error
  }
  return person
}

export async function renamePerson(input: {
  organizationId: string
  personId: string
  name: string
}) {
  const current = await getItem<Person>(
    input.organizationId,
    personSk(input.personId),
  )
  if (!current) throw new Error('Player not found.')
  const version = personVersion(current)
  const person = personSchema.parse({
    ...current.entity,
    name: input.name,
    normalizedName: normalizeName(input.name),
  })
  if (person.normalizedName === current.entity.normalizedName) {
    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: { ...current, entity: person, version: version + 1 },
        ConditionExpression: '#version = :version',
        ExpressionAttributeNames: { '#version': 'version' },
        ExpressionAttributeValues: { ':version': version },
      }),
    )
    return person
  }
  try {
    await client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: tableName,
              Key: {
                pk: pk(input.organizationId),
                sk: nameSk(current.entity.normalizedName),
              },
              ConditionExpression: 'personId = :personId',
              ExpressionAttributeValues: { ':personId': person.id },
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                pk: pk(input.organizationId),
                sk: nameSk(person.normalizedName),
                personId: person.id,
              },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: { ...current, entity: person, version: version + 1 },
              ConditionExpression: '#version = :version',
              ExpressionAttributeNames: { '#version': 'version' },
              ExpressionAttributeValues: { ':version': version },
            },
          },
        ],
      }),
    )
  } catch (error) {
    if (isTransactionConflict(error))
      throw new Error('That person is already in this organization.')
    throw error
  }
  return person
}

export async function deletePerson(input: {
  organizationId: string
  personId: string
}) {
  const current = await getItem<Person>(
    input.organizationId,
    personSk(input.personId),
  )
  if (!current) throw new Error('Player not found.')
  const version = personVersion(current)
  try {
    await client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: tableName,
              Key: {
                pk: pk(input.organizationId),
                sk: personSk(input.personId),
              },
              ConditionExpression: 'matchCount = :zero AND #version = :version',
              ExpressionAttributeNames: { '#version': 'version' },
              ExpressionAttributeValues: { ':zero': 0, ':version': version },
            },
          },
          {
            Delete: {
              TableName: tableName,
              Key: {
                pk: pk(input.organizationId),
                sk: nameSk(current.entity.normalizedName),
              },
              ConditionExpression: 'personId = :personId',
              ExpressionAttributeValues: { ':personId': current.entity.id },
            },
          },
        ],
      }),
    )
  } catch (error) {
    if (isTransactionConflict(error))
      throw new Error('Players with matches cannot be removed.')
    throw error
  }
}

export async function startMatch(input: {
  organizationId: string
  matchId: string
  format: MatchFormat
  participants: MatchParticipant[]
}) {
  const existing = await getItem<Match>(
    input.organizationId,
    matchSk(input.matchId),
  )
  if (existing) {
    if (
      existing.entity.format === input.format &&
      JSON.stringify(existing.entity.participants) ===
        JSON.stringify(input.participants)
    )
      return matchSchema.parse(existing.entity)
    throw new Error('Match ID is already in use.')
  }
  const people = await Promise.all(
    input.participants.map((participant) =>
      getItem<Person>(input.organizationId, personSk(participant.personId)),
    ),
  )
  const validPersonIds = new Set(
    people.flatMap((item) => (item ? [item.entity.id] : [])),
  )
  const validationError = validateMatch(
    input.format,
    input.participants,
    undefined,
    validPersonIds,
  )
  if (validationError) throw new Error(validationError)
  const match = matchSchema.parse({
    id: input.matchId,
    organizationId: input.organizationId,
    format: input.format,
    participants: input.participants,
    startedAt: new Date().toISOString(),
    complete: false,
    sequence: null,
    completedAt: null,
    score: null,
    eloChanges: null,
  })
  try {
    await client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName,
              Item: {
                pk: pk(input.organizationId),
                sk: matchSk(match.id),
                entity: match,
              },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          ...input.participants.map((participant) => ({
            Update: {
              TableName: tableName,
              Key: {
                pk: pk(input.organizationId),
                sk: personSk(participant.personId),
              },
              UpdateExpression:
                'SET matchCount = matchCount + :one, #version = #version + :one',
              ConditionExpression: 'attribute_exists(pk)',
              ExpressionAttributeNames: { '#version': 'version' },
              ExpressionAttributeValues: { ':one': 1 },
            },
          })),
        ],
      }),
    )
  } catch (error) {
    if (isTransactionConflict(error)) {
      const committed = await getItem<Match>(
        input.organizationId,
        matchSk(input.matchId),
      )
      if (
        committed?.entity.format === input.format &&
        JSON.stringify(committed.entity.participants) ===
          JSON.stringify(input.participants)
      )
        return matchSchema.parse(committed.entity)
      throw new Error('A match player is no longer on the roster.')
    }
    throw error
  }
  return matchSchema.parse(match)
}

export async function cancelMatch(input: {
  organizationId: string
  matchId: string
}) {
  const current = await getItem<Match>(
    input.organizationId,
    matchSk(input.matchId),
  )
  if (!current) throw new Error('Match not found.')
  if (current.entity.complete) throw new Error('Match is already complete.')
  try {
    await client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: tableName,
              Key: { pk: pk(input.organizationId), sk: matchSk(input.matchId) },
              ConditionExpression: '#entity.#complete = :false',
              ExpressionAttributeNames: {
                '#entity': 'entity',
                '#complete': 'complete',
              },
              ExpressionAttributeValues: { ':false': false },
            },
          },
          ...current.entity.participants.map((participant) => ({
            Update: {
              TableName: tableName,
              Key: {
                pk: pk(input.organizationId),
                sk: personSk(participant.personId),
              },
              UpdateExpression:
                'SET matchCount = matchCount - :one, #version = #version + :one',
              ConditionExpression: 'matchCount >= :one',
              ExpressionAttributeNames: { '#version': 'version' },
              ExpressionAttributeValues: { ':one': 1 },
            },
          })),
        ],
      }),
    )
  } catch (error) {
    if (isTransactionConflict(error))
      throw new Error('Match changed. Try again.')
    throw error
  }
}

export async function completeMatch(input: {
  organizationId: string
  matchId: string
  score: Score
}) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const snapshot = await getOrganizationSnapshot(input.organizationId)
    if (!snapshot) throw new Error('Organization not found.')
    const match = snapshot.matches.find((item) => item.id === input.matchId)
    if (!match) throw new Error('Match not found.')
    if (match.complete) throw new Error('Match is already complete.')
    const personItems = await Promise.all(
      match.participants.map((participant) =>
        getItem<Person>(input.organizationId, personSk(participant.personId)),
      ),
    )
    const people = personItems.flatMap((item) => (item ? [item.entity] : []))
    const validationError = validateMatch(
      match.format,
      match.participants,
      input.score,
      new Set(people.map((person) => person.id)),
    )
    if (validationError) throw new Error(validationError)
    const counter = await getItem<never>(input.organizationId, 'COUNTER')
    if (
      !counter ||
      typeof (counter as unknown as { value?: unknown }).value !== 'number'
    )
      throw new Error('Organization sequence counter not found.')
    const currentSequence = (counter as unknown as { value: number }).value
    const eloChanges = calculateEloChanges(
      { participants: match.participants, score: input.score },
      people,
    )
    const completedMatch = matchSchema.parse({
      ...match,
      complete: true,
      sequence: currentSequence + 1,
      completedAt: new Date().toISOString(),
      score: input.score,
      eloChanges,
    })
    const updatedPeople = personItems.flatMap((item) =>
      item
        ? [
            {
              item,
              person: personSchema.parse({
                ...item.entity,
                elo:
                  item.entity.elo +
                  (eloChanges.find(
                    (change) => change.personId === item.entity.id,
                  )?.change ?? 0),
              }),
            },
          ]
        : [],
    )
    try {
      await client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: tableName,
                Item: { ...counter, value: currentSequence + 1 },
                ConditionExpression: '#value = :current',
                ExpressionAttributeNames: { '#value': 'value' },
                ExpressionAttributeValues: { ':current': currentSequence },
              },
            },
            {
              Put: {
                TableName: tableName,
                Item: {
                  ...currentMatchItem(match, input.organizationId),
                  entity: completedMatch,
                },
                ConditionExpression: '#entity.#complete = :false',
                ExpressionAttributeNames: {
                  '#entity': 'entity',
                  '#complete': 'complete',
                },
                ExpressionAttributeValues: { ':false': false },
              },
            },
            ...updatedPeople.map(({ item, person }) => {
              const version = personVersion(item)
              return {
                Put: {
                  TableName: tableName,
                  Item: {
                    ...item,
                    entity: person,
                    version: version + 1,
                  },
                  ConditionExpression: '#version = :version',
                  ExpressionAttributeNames: { '#version': 'version' },
                  ExpressionAttributeValues: { ':version': version },
                },
              }
            }),
          ],
        }),
      )
      return {
        match: completedMatch,
        people: updatedPeople.map(({ person }) => person),
      }
    } catch (error) {
      if (!isTransactionConflict(error) || attempt === 4) {
        if (isTransactionConflict(error))
          throw new Error('Match changed while saving. Try again.')
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 20 * 2 ** attempt))
    }
  }
  throw new Error('Match changed while saving. Try again.')
}

function currentMatchItem(match: Match, organizationId: string) {
  return {
    pk: pk(organizationId),
    sk: matchSk(match.id),
    entity: match,
  }
}
