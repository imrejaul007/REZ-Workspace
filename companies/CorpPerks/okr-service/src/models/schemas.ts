import { z } from 'zod';

export const ObjectiveTypeSchema = z.enum(['company', 'department', 'individual']);
export const ObjectiveStatusSchema = z.enum(['draft', 'active', 'completed', 'cancelled']);
export const KeyResultStatusSchema = z.enum(['on_track', 'at_risk', 'behind', 'completed']);

export const KeyResultInputSchema = z.object({
  title: z.string().min(1).max(500),
  target: z.number().positive(),
  current: z.number().min(0).default(0),
  unit: z.string().min(1).max(50),
  weight: z.number().min(0.1).max(10).default(1),
  startValue: z.number().min(0).default(0)
});

export const MilestoneInputSchema = z.object({
  title: z.string().min(1).max(500),
  deadline: z.string().datetime().or(z.date()),
  completed: z.boolean().default(false)
});

export const CreateObjectiveSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  quarter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  year: z.number().int().min(2020).max(2100),
  ownerId: z.string().min(1),
  ownerName: z.string().max(200).optional(),
  departmentId: z.string().optional(),
  departmentName: z.string().max(200).optional(),
  type: ObjectiveTypeSchema,
  status: ObjectiveStatusSchema.default('draft'),
  keyResults: z.array(KeyResultInputSchema).min(1).max(10).optional(),
  milestones: z.array(MilestoneInputSchema).max(20).optional()
});

export const UpdateObjectiveSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  status: ObjectiveStatusSchema.optional(),
  ownerId: z.string().min(1).optional(),
  ownerName: z.string().max(200).optional()
});

export const UpdateKeyResultProgressSchema = z.object({
  keyResultId: z.string().min(1),
  current: z.number().min(0),
  notes: z.string().max(1000).optional()
});

export const AddKeyResultSchema = z.object({
  title: z.string().min(1).max(500),
  target: z.number().positive(),
  current: z.number().min(0).default(0),
  unit: z.string().min(1).max(50),
  weight: z.number().min(0.1).max(10).default(1),
  startValue: z.number().min(0).default(0)
});

export const AddMilestoneSchema = z.object({
  keyResultId: z.string().min(1),
  title: z.string().min(1).max(500),
  deadline: z.string().datetime().or(z.date())
});

export const ObjectiveQuerySchema = z.object({
  ownerId: z.string().optional(),
  departmentId: z.string().optional(),
  type: ObjectiveTypeSchema.optional(),
  status: ObjectiveStatusSchema.optional(),
  quarter: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).optional(),
  year: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).optional(),
  page: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).default(1),
  limit: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).default(20)
});

export type CreateObjectiveInput = z.infer<typeof CreateObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof UpdateObjectiveSchema>;
export type UpdateKeyResultProgressInput = z.infer<typeof UpdateKeyResultProgressSchema>;
export type AddKeyResultInput = z.infer<typeof AddKeyResultSchema>;
export type AddMilestoneInput = z.infer<typeof AddMilestoneSchema>;
export type ObjectiveQueryInput = z.infer<typeof ObjectiveQuerySchema>;
