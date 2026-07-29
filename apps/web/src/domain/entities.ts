import { z } from 'zod'

export const organizationIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const entityIdSchema = z.string().uuid()
export const nameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((name) => name.toLowerCase().length <= 100, 'Name is too long.')

export const organizationSchema = z
  .object({
    id: organizationIdSchema,
    name: nameSchema,
    createdAt: z.iso.datetime(),
  })
  .strict()

export const personSchema = z
  .object({
    id: entityIdSchema,
    organizationId: organizationIdSchema,
    name: nameSchema,
    normalizedName: z.string().min(1).max(100),
    elo: z.number().int(),
    createdAt: z.iso.datetime(),
  })
  .strict()

export const teamColorSchema = z.enum(['red', 'blue'])
export const playerRoleSchema = z.enum(['attack', 'defence', 'both'])
export const matchFormatSchema = z.enum(['1v1', '2v1', '1v2', '2v2'])
export const participantSchema = z
  .object({
    personId: entityIdSchema,
    team: teamColorSchema,
    role: playerRoleSchema,
  })
  .strict()
export const eloChangeSchema = z
  .object({
    personId: entityIdSchema,
    change: z.number().int(),
  })
  .strict()
export const scoreSchema = z
  .object({
    red: z.number().int().min(0).max(99),
    blue: z.number().int().min(0).max(99),
  })
  .strict()
export const matchSchema = z
  .object({
    id: entityIdSchema,
    organizationId: organizationIdSchema,
    format: matchFormatSchema,
    participants: z.array(participantSchema).min(2).max(4),
    startedAt: z.iso.datetime(),
    complete: z.boolean(),
    sequence: z.number().int().positive().nullable(),
    completedAt: z.iso.datetime().nullable(),
    score: scoreSchema.nullable(),
    eloChanges: z.array(eloChangeSchema).nullable(),
  })
  .strict()

export const organizationSnapshotSchema = z
  .object({
    organization: organizationSchema,
    people: z.array(personSchema),
    matches: z.array(matchSchema),
  })
  .strict()

export type Organization = z.infer<typeof organizationSchema>
export type Person = z.infer<typeof personSchema>
export type TeamColor = z.infer<typeof teamColorSchema>
export type PlayerRole = z.infer<typeof playerRoleSchema>
export type MatchFormat = z.infer<typeof matchFormatSchema>
export type MatchParticipant = z.infer<typeof participantSchema>
export type EloChange = z.infer<typeof eloChangeSchema>
export type Match = z.infer<typeof matchSchema>
export type Score = z.infer<typeof scoreSchema>
export type OrganizationSnapshot = z.infer<typeof organizationSnapshotSchema>

export const recentOrganizationsInputSchema = z
  .object({
    ids: z.array(organizationIdSchema).max(20),
  })
  .strict()
export const organizationInputSchema = z
  .object({ id: organizationIdSchema })
  .strict()
export const setupOrganizationInputSchema = z
  .object({
    id: organizationIdSchema,
    name: nameSchema,
    playerName: nameSchema,
  })
  .strict()
export const updateOrganizationInputSchema = z
  .object({
    organizationId: organizationIdSchema,
    name: nameSchema,
  })
  .strict()
export const addPersonInputSchema = z
  .object({
    organizationId: organizationIdSchema,
    name: nameSchema,
  })
  .strict()
export const personInputSchema = z
  .object({
    organizationId: organizationIdSchema,
    personId: entityIdSchema,
  })
  .strict()
export const renamePersonInputSchema = personInputSchema.extend({
  name: nameSchema,
})
export const startMatchInputSchema = z
  .object({
    organizationId: organizationIdSchema,
    matchId: entityIdSchema,
    format: matchFormatSchema,
    participants: z.array(participantSchema).min(2).max(4),
  })
  .strict()
export const updatePendingMatchInputSchema = startMatchInputSchema
export const matchInputSchema = z
  .object({
    organizationId: organizationIdSchema,
    matchId: entityIdSchema,
  })
  .strict()
export const completeMatchInputSchema = matchInputSchema.extend({
  score: scoreSchema,
})

export function normalizeName(name: string) {
  return name.trim().toLowerCase()
}
