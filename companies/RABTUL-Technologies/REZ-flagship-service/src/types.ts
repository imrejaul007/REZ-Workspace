import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// FLAG SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const FlagStatusSchema = z.enum(['active', 'inactive', 'archived'])
export type FlagStatus = z.infer<typeof FlagStatusSchema>

export const VariationTypeSchema = z.enum(['string', 'number', 'boolean', 'json'])
export type VariationType = z.infer<typeof VariationTypeSchema>

export const OperatorSchema = z.enum([
  'eq',           // equals
  'neq',          // not equals
  'gt',           // greater than
  'gte',          // greater than or equal
  'lt',           // less than
  'lte',          // less than or equal
  'contains',      // string contains
  'in',           // value in array
  'notIn',        // value not in array
  'regex',        // regex match
  'semver_eq',    // semantic version equals
  'semver_gt',    // semantic version greater than
  'semver_lt',    // semantic version less than
])
export type Operator = z.infer<typeof OperatorSchema>

// User segment conditions
export const ConditionSchema = z.object({
  attribute: z.string().min(1), // e.g., "userId", "email", "plan", "country"
  operator: OperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
})
export type Condition = z.infer<typeof ConditionSchema>

export const SegmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  conditions: z.array(ConditionSchema).min(1),
  conditionsOperator: z.enum(['and', 'or']).default('and'),
})
export type Segment = z.infer<typeof SegmentSchema>

// Targeting rules
export const TargetingRuleSchema = z.object({
  id: z.string(),
  priority: z.number().int().min(0),
  segmentId: z.string().optional(),
  conditions: z.array(ConditionSchema).optional(), // Inline conditions (no segment)
  conditionsOperator: z.enum(['and', 'or']).default('and'),
  variation: z.string().min(1), // Variation key
  percentage: z.number().min(0).max(100).optional(), // Gradual rollout %
})
export type TargetingRule = z.infer<typeof TargetingRuleSchema>

// Flag definition
export const FlagSchema = z.object({
  key: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/), // e.g., "new_checkout_flow"
  name: z.string().min(1),
  description: z.string().optional(),
  status: FlagStatusSchema.default('inactive'),
  variations: z.array(z.object({
    key: z.string().min(1),
    value: z.union([z.string(), z.number(), z.boolean()]),
    description: z.string().optional(),
  })).min(2), // Need at least 2 variations
  defaultVariation: z.string().min(1),
  tags: z.array(z.string()).optional(),
  targetingRules: z.array(TargetingRuleSchema).optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(), // Global gradual rollout
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdBy: z.string().optional(),
})
export type Flag = z.infer<typeof FlagSchema>

// ─────────────────────────────────────────────────────────────────────────────
// API REQUEST SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const CreateFlagSchema = FlagSchema.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  key: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
})
export type CreateFlag = z.infer<typeof CreateFlagSchema>

export const UpdateFlagSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: FlagStatusSchema.optional(),
  defaultVariation: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
})
export type UpdateFlag = z.infer<typeof UpdateFlagSchema>

export const AddVariationSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  description: z.string().optional(),
})
export type AddVariation = z.infer<typeof AddVariationSchema>

export const AddTargetingRuleSchema = z.object({
  segmentId: z.string().optional(),
  conditions: z.array(ConditionSchema).optional(),
  conditionsOperator: z.enum(['and', 'or']).default('and'),
  variation: z.string().min(1),
  percentage: z.number().min(0).max(100).optional(),
})
export type AddTargetingRule = z.infer<typeof AddTargetingRuleSchema>

export const EvaluateContextSchema = z.object({
  userId: z.string().optional(),
  anonymousId: z.string().optional(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
})
export type EvaluateContext = z.infer<typeof EvaluateContextSchema>

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface FlagListItem {
  key: string
  name: string
  description?: string
  status: FlagStatus
  variations: Array<{ key: string; value: unknown }>
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface EvaluationResult {
  flagKey: string
  variationKey: string
  value: unknown
  reason: EvaluationReason
  ruleId?: string
}

export type EvaluationReason =
  | 'default'           // Used default variation
  | 'inactive'         // Flag is inactive
  | 'rule_match'       // Matched a targeting rule
  | 'rollout'          // Gradual rollout allocation
  | 'segment_match'    // Matched user segment
  | 'error'           // Error, using default

export interface BatchEvaluationResult {
  results: EvaluationResult[]
  contextId: string
  evaluatedAt: string
}

export interface SegmentListItem {
  id: string
  name: string
  description?: string
  conditionCount: number
  flagCount: number
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK TYPES (for client-side usage)
// ─────────────────────────────────────────────────────────────────────────────

export interface FlagConfig {
  flags: Record<string, {
    variations: Record<string, unknown>
    defaultVariation: string
  }>
}

export interface SDKContext {
  userId?: string
  anonymousId?: string
  ip?: string
  userAgent?: string
  country?: string
  plan?: string
  [key: string]: string | number | boolean | string[] | undefined
}
