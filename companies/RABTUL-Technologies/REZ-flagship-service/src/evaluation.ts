import CryptoJS from 'crypto-js'
import type {
  Flag,
  EvaluationResult,
  EvaluationReason,
  EvaluateContext,
  TargetingRule,
  Condition,
  VariationType,
} from './types.js'

// Seeded random for consistent percentage rollouts
function seededRandom(seed: string): number {
  const hash = CryptoJS.MD5(seed).toString()
  const numericHash = parseInt(hash.substring(0, 8), 16)
  return (numericHash % 10000) / 10000
}

// Evaluate a single condition
function evaluateCondition(
  condition: Condition,
  context: EvaluateContext & Record<string, unknown>
): boolean {
  const attributeValue = context[condition.attribute]

  if (attributeValue === undefined) {
    return false
  }

  const { operator, value } = condition

  switch (operator) {
    case 'eq':
      return attributeValue === value

    case 'neq':
      return attributeValue !== value

    case 'gt':
      return typeof attributeValue === 'number' && typeof value === 'number' && attributeValue > value

    case 'gte':
      return typeof attributeValue === 'number' && typeof value === 'number' && attributeValue >= value

    case 'lt':
      return typeof attributeValue === 'number' && typeof value === 'number' && attributeValue < value

    case 'lte':
      return typeof attributeValue === 'number' && typeof value === 'number' && attributeValue <= value

    case 'contains':
      return typeof attributeValue === 'string' && typeof value === 'string' && attributeValue.includes(value)

    case 'in':
      if (Array.isArray(value)) {
        return value.includes(attributeValue as string)
      }
      return false

    case 'notIn':
      if (Array.isArray(value)) {
        return !value.includes(attributeValue as string)
      }
      return true

    case 'regex':
      if (typeof attributeValue === 'string' && typeof value === 'string') {
        try {
          return new RegExp(value).test(attributeValue)
        } catch {
          return false
        }
      }
      return false

    case 'semver_eq':
    case 'semver_gt':
    case 'semver_lt':
      return evaluateSemver(attributeValue as string, value as string, operator.replace('semver_', ''))

    default:
      return false
  }
}

// Semantic version comparison
function evaluateSemver(
  actual: string,
  expected: string,
  operator: 'eq' | 'gt' | 'lt'
): boolean {
  const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0)

  const [a1, a2, a3] = parse(actual)
  const [e1, e2, e3] = parse(expected)

  const actualNum = a1 * 10000 + a2 * 100 + a3
  const expectedNum = e1 * 10000 + e2 * 100 + e3

  if (operator === 'eq') return actualNum === expectedNum
  if (operator === 'gt') return actualNum > expectedNum
  if (operator === 'lt') return actualNum < expectedNum
  return false
}

// Evaluate targeting rule
function evaluateRule(
  rule: TargetingRule,
  context: EvaluateContext & Record<string, unknown>
): boolean {
  // If rule has inline conditions, evaluate them
  if (rule.conditions && rule.conditions.length > 0) {
    const results = rule.conditions.map(c => evaluateCondition(c, context))

    if (rule.conditionsOperator === 'and') {
      return results.every(Boolean)
    } else {
      return results.some(Boolean)
    }
  }

  // If rule has segment, would need segment lookup
  // For now, if no conditions, rule matches
  return true
}

// Check percentage rollout
function checkPercentageRollout(
  userId: string,
  flagKey: string,
  percentage: number
): boolean {
  if (percentage >= 100) return true
  if (percentage <= 0) return false

  const seed = `${flagKey}:${userId}`
  const hash = CryptoJS.MD5(seed).toString()
  const bucket = parseInt(hash.substring(0, 8), 16) % 10000
  const threshold = percentage * 100

  return bucket < threshold
}

// Main evaluation function
export function evaluateFlag(
  flag: Flag,
  context: EvaluateContext
): EvaluationResult {
  // If flag is inactive, return default
  if (flag.status === 'inactive') {
    const defaultVariation = flag.variations.find(v => v.key === flag.defaultVariation)
    return {
      flagKey: flag.key,
      variationKey: flag.defaultVariation,
      value: defaultVariation?.value ?? null,
      reason: 'inactive',
    }
  }

  // Get user identifier for rollout
  const userId = context.userId || context.anonymousId || 'anonymous'

  // Sort rules by priority (lower number = higher priority)
  const sortedRules = [...(flag.targetingRules || [])].sort(
    (a, b) => a.priority - b.priority
  )

  // Evaluate each rule
  for (const rule of sortedRules) {
    // Check conditions first
    if (rule.conditions && rule.conditions.length > 0) {
      const matchesConditions = evaluateRule(rule, context)

      if (!matchesConditions) {
        continue // Move to next rule
      }
    }

    // Check percentage rollout if specified
    if (rule.percentage !== undefined && rule.percentage < 100) {
      const inRollout = checkPercentageRollout(userId, flag.key, rule.percentage)

      if (!inRollout) {
        continue // Move to next rule
      }
    }

    // Find the variation
    const variation = flag.variations.find(v => v.key === rule.variation)

    if (variation) {
      return {
        flagKey: flag.key,
        variationKey: variation.key,
        value: variation.value,
        reason: rule.percentage !== undefined ? 'rollout' : 'rule_match',
        ruleId: rule.id,
      }
    }
  }

  // Check global rollout percentage
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    const inRollout = checkPercentageRollout(userId, flag.key, flag.rolloutPercentage)

    if (inRollout) {
      // Find control or treatment variation based on bucket
      const seed = `${flag.key}:${userId}`
      const hash = CryptoJS.MD5(seed).toString()
      const bucket = parseInt(hash.substring(0, 8), 16) % 10000
      const threshold = flag.rolloutPercentage * 100

      // First variation for rollout group, default for control
      const variation = bucket < threshold
        ? flag.variations[0]
        : flag.variations.find(v => v.key === flag.defaultVariation)

      return {
        flagKey: flag.key,
        variationKey: variation?.key || flag.defaultVariation,
        value: variation?.value ?? null,
        reason: 'rollout',
      }
    }
  }

  // Return default variation
  const defaultVariation = flag.variations.find(v => v.key === flag.defaultVariation)
  return {
    flagKey: flag.key,
    variationKey: flag.defaultVariation,
    value: defaultVariation?.value ?? null,
    reason: 'default',
  }
}

// Batch evaluation
export function evaluateFlags(
  flags: Flag[],
  context: EvaluateContext
): EvaluationResult[] {
  return flags.map(flag => evaluateFlag(flag, context))
}

// Helper to get boolean flag value
export function isFlagEnabled(
  flag: Flag,
  context: EvaluateContext
): boolean {
  const result = evaluateFlag(flag, context)

  if (typeof result.value === 'boolean') {
    return result.value
  }

  // For non-boolean flags, return true if not default
  return result.reason !== 'default'
}

// Helper to get flag value with type safety
export function getFlagValue<T>(
  flag: Flag,
  context: EvaluateContext
): T {
  const result = evaluateFlag(flag, context)
  return result.value as T
}
