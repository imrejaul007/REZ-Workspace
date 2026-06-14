import { v4 as uuidv4 } from 'uuid'
import type {
  Flag,
  Segment,
  CreateFlag,
  UpdateFlag,
  AddVariation,
  AddTargetingRule,
  EvaluateContext,
  EvaluationResult,
  FlagListItem,
  SegmentListItem,
} from './types.js'
import { evaluateFlag, evaluateFlags } from './evaluation.js'

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY STORAGE (Replace with Redis/DB in production)
// ─────────────────────────────────────────────────────────────────────────────

const flags = new Map<string, Flag>()
const segments = new Map<string, Segment>()
const flagHistory = new Map<string, Array<{ action: string; timestamp: string; user?: string }>>()

// Seed with example flags
initializeDefaults()

function initializeDefaults() {
  // Example: New checkout flow
  createFlagInternal({
    key: 'new_checkout_flow',
    name: 'New Checkout Flow',
    description: 'Enable the redesigned checkout experience',
    status: 'inactive',
    variations: [
      { key: 'control', value: false, description: 'Old checkout' },
      { key: 'treatment', value: true, description: 'New checkout' },
    ],
    defaultVariation: 'control',
    tags: ['checkout', 'ux'],
    rolloutPercentage: 0,
  })

  // Example: Pricing tier
  createFlagInternal({
    key: 'premium_pricing',
    name: 'Premium Pricing',
    description: 'Show premium pricing for paid plan users',
    status: 'active',
    variations: [
      { key: 'basic', value: false, description: 'Show basic pricing' },
      { key: 'premium', value: true, description: 'Show premium pricing' },
    ],
    defaultVariation: 'basic',
    tags: ['pricing', 'plans'],
  })

  // Example: Feature toggle
  createFlagInternal({
    key: 'enable_ai_recommendations',
    name: 'AI Recommendations',
    description: 'Show AI-powered product recommendations',
    status: 'active',
    variations: [
      { key: 'off', value: false },
      { key: 'on', value: true },
    ],
    defaultVariation: 'off',
    tags: ['ai', 'recommendations'],
    rolloutPercentage: 50,
  })

  // Example: JSON flag for config
  createFlagInternal({
    key: 'homepage_banner',
    name: 'Homepage Banner Config',
    description: 'JSON config for homepage banner',
    status: 'active',
    variations: [
      {
        key: 'default',
        value: { show: true, text: 'Welcome!', color: '#3B82F6' }
      },
      {
        key: 'promo',
        value: { show: true, text: '50% OFF!', color: '#EF4444' }
      },
    ],
    defaultVariation: 'default',
    tags: ['marketing', 'banner'],
  })
}

function createFlagInternal(flag: Flag): Flag {
  flags.set(flag.key, {
    ...flag,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return flags.get(flag.key)!
}

// ─────────────────────────────────────────────────────────────────────────────
// FLAG CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export class FlagService {
  /**
   * Create a new feature flag
   */
  createFlag(data: CreateFlag, createdBy?: string): Flag {
    if (flags.has(data.key)) {
      throw new Error(`Flag with key "${data.key}" already exists`)
    }

    const flag: Flag = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
    }

    flags.set(flag.key, flag)
    this.logHistory(flag.key, 'created', createdBy)

    return flag
  }

  /**
   * Get a single flag by key
   */
  getFlag(key: string): Flag | null {
    return flags.get(key) || null
  }

  /**
   * List all flags with optional filtering
   */
  listFlags(options?: {
    status?: string
    tags?: string[]
    search?: string
  }): FlagListItem[] {
    let result = Array.from(flags.values())

    if (options?.status) {
      result = result.filter(f => f.status === options.status)
    }

    if (options?.tags && options.tags.length > 0) {
      result = result.filter(f =>
        f.tags?.some(t => options.tags!.includes(t))
      )
    }

    if (options?.search) {
      const search = options.search.toLowerCase()
      result = result.filter(f =>
        f.key.toLowerCase().includes(search) ||
        f.name.toLowerCase().includes(search) ||
        f.description?.toLowerCase().includes(search)
      )
    }

    return result.map(f => ({
      key: f.key,
      name: f.name,
      description: f.description,
      status: f.status,
      variations: f.variations.map(v => ({ key: v.key, value: v.value })),
      tags: f.tags,
      createdAt: f.createdAt || '',
      updatedAt: f.updatedAt || '',
    }))
  }

  /**
   * Update a flag
   */
  updateFlag(key: string, updates: UpdateFlag, updatedBy?: string): Flag {
    const flag = flags.get(key)
    if (!flag) {
      throw new Error(`Flag "${key}" not found`)
    }

    const updated: Flag = {
      ...flag,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    flags.set(key, updated)
    this.logHistory(key, 'updated', updatedBy)

    return updated
  }

  /**
   * Delete/archive a flag
   */
  archiveFlag(key: string, archivedBy?: string): boolean {
    const flag = flags.get(key)
    if (!flag) {
      return false
    }

    flag.status = 'archived'
    flag.updatedAt = new Date().toISOString()
    flags.set(key, flag)
    this.logHistory(key, 'archived', archivedBy)

    return true
  }

  /**
   * Permanently delete a flag
   */
  deleteFlag(key: string): boolean {
    const deleted = flags.delete(key)
    if (deleted) {
      this.logHistory(key, 'deleted')
    }
    return deleted
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VARIATIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add a new variation to a flag
   */
  addVariation(key: string, variation: AddVariation): Flag {
    const flag = flags.get(key)
    if (!flag) {
      throw new Error(`Flag "${key}" not found`)
    }

    if (flag.variations.some(v => v.key === variation.key)) {
      throw new Error(`Variation "${variation.key}" already exists`)
    }

    flag.variations.push(variation)
    flag.updatedAt = new Date().toISOString()
    flags.set(key, flag)
    this.logHistory(key, 'variation_added', undefined, variation.key)

    return flag
  }

  /**
   * Remove a variation from a flag
   */
  removeVariation(key: string, variationKey: string): Flag {
    const flag = flags.get(key)
    if (!flag) {
      throw new Error(`Flag "${key}" not found`)
    }

    if (flag.variations.length <= 2) {
      throw new Error('Cannot remove variation - flag must have at least 2 variations')
    }

    if (flag.defaultVariation === variationKey) {
      throw new Error('Cannot remove default variation')
    }

    flag.variations = flag.variations.filter(v => v.key !== variationKey)
    flag.updatedAt = new Date().toISOString()
    flags.set(key, flag)
    this.logHistory(key, 'variation_removed', undefined, variationKey)

    return flag
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TARGETING RULES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add a targeting rule
   */
  addTargetingRule(key: string, rule: AddTargetingRule): Flag {
    const flag = flags.get(key)
    if (!flag) {
      throw new Error(`Flag "${key}" not found`)
    }

    // Validate variation exists
    if (!flag.variations.some(v => v.key === rule.variation)) {
      throw new Error(`Variation "${rule.variation}" not found`)
    }

    const newRule = {
      ...rule,
      id: uuidv4(),
      priority: flag.targetingRules?.length || 0,
    }

    if (!flag.targetingRules) {
      flag.targetingRules = []
    }

    flag.targetingRules.push(newRule)
    flag.updatedAt = new Date().toISOString()
    flags.set(key, flag)
    this.logHistory(key, 'rule_added', undefined, newRule.id)

    return flag
  }

  /**
   * Update a targeting rule
   */
  updateTargetingRule(key: string, ruleId: string, updates: Partial<AddTargetingRule>): Flag {
    const flag = flags.get(key)
    if (!flag) {
      throw new Error(`Flag "${key}" not found`)
    }

    const ruleIndex = flag.targetingRules?.findIndex(r => r.id === ruleId)
    if (ruleIndex === undefined || ruleIndex < 0) {
      throw new Error(`Rule "${ruleId}" not found`)
    }

    flag.targetingRules![ruleIndex] = {
      ...flag.targetingRules![ruleIndex],
      ...updates,
    }
    flag.updatedAt = new Date().toISOString()
    flags.set(key, flag)
    this.logHistory(key, 'rule_updated', undefined, ruleId)

    return flag
  }

  /**
   * Remove a targeting rule
   */
  removeTargetingRule(key: string, ruleId: string): Flag {
    const flag = flags.get(key)
    if (!flag) {
      throw new Error(`Flag "${key}" not found`)
    }

    if (!flag.targetingRules) {
      throw new Error('No targeting rules found')
    }

    flag.targetingRules = flag.targetingRules.filter(r => r.id !== ruleId)
    flag.updatedAt = new Date().toISOString()
    flags.set(key, flag)
    this.logHistory(key, 'rule_removed', undefined, ruleId)

    return flag
  }

  /**
   * Reorder targeting rules
   */
  reorderTargetingRules(key: string, ruleIds: string[]): Flag {
    const flag = flags.get(key)
    if (!flag) {
      throw new Error(`Flag "${key}" not found`)
    }

    const reorderedRules = ruleIds
      .map((id, index) => {
        const rule = flag.targetingRules?.find(r => r.id === id)
        if (rule) {
          return { ...rule, priority: index }
        }
        return null
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    flag.targetingRules = reorderedRules
    flag.updatedAt = new Date().toISOString()
    flags.set(key, flag)
    this.logHistory(key, 'rules_reordered')

    return flag
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVALUATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Evaluate a single flag
   */
  evaluate(flagKey: string, context: EvaluateContext): EvaluationResult {
    const flag = flags.get(flagKey)

    if (!flag) {
      return {
        flagKey,
        variationKey: '',
        value: null,
        reason: 'error',
      }
    }

    return evaluateFlag(flag, context)
  }

  /**
   * Evaluate multiple flags
   */
  evaluateMany(flagKeys: string[], context: EvaluateContext): EvaluationResult[] {
    return flagKeys.map(key => this.evaluate(key, context))
  }

  /**
   * Evaluate all active flags
   */
  evaluateAll(context: EvaluateContext): EvaluationResult[] {
    const activeFlags = Array.from(flags.values()).filter(f => f.status === 'active')
    return evaluateFlags(activeFlags, context)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEGMENTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a user segment
   */
  createSegment(data: Omit<Segment, 'id'>): Segment {
    const segment: Segment = {
      ...data,
      id: uuidv4(),
    }
    segments.set(segment.id, segment)
    return segment
  }

  /**
   * Get a segment by ID
   */
  getSegment(id: string): Segment | null {
    return segments.get(id) || null
  }

  /**
   * List all segments
   */
  listSegments(): SegmentListItem[] {
    return Array.from(segments.values()).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      conditionCount: s.conditions.length,
      flagCount: Array.from(flags.values()).filter(f =>
        f.targetingRules?.some(r => r.segmentId === s.id)
      ).length,
      createdAt: new Date().toISOString(),
    }))
  }

  /**
   * Delete a segment
   */
  deleteSegment(id: string): boolean {
    return segments.delete(id)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HISTORY / AUDIT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get flag history
   */
  getHistory(key: string, limit = 50): Array<{ action: string; timestamp: string; user?: string; detail?: string }> {
    return flagHistory.get(key)?.slice(-limit) || []
  }

  private logHistory(key: string, action: string, user?: string, detail?: string) {
    if (!flagHistory.has(key)) {
      flagHistory.set(key, [])
    }

    flagHistory.get(key)!.push({
      action,
      timestamp: new Date().toISOString(),
      user,
      detail,
    })

    // Keep last 100 entries
    if (flagHistory.get(key)!.length > 100) {
      flagHistory.set(key, flagHistory.get(key)!.slice(-100))
    }
  }
}

// Singleton instance
export const flagService = new FlagService()
