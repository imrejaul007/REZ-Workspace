import logger from './utils/logger';

/**
 * FlagShip SDK Client
 * Easy integration for unknown service
 */

import crypto from 'crypto';

interface FlagConfig {
  variations: Record<string, unknown>
  defaultVariation: string
}

interface EvaluationResult {
  flagKey: string
  variationKey: string
  value: unknown
  reason: string
}

interface SDKContext {
  userId?: string
  anonymousId?: string
  [key: string]: string | number | boolean | string[] | undefined
}

class FlagShipClient {
  private baseUrl: string
  private userId?: string
  private anonymousId?: string
  private attributes: Record<string, unknown> = {}
  private cache: Map<string, { data: unknown; expiry: number }> = new Map()
  private cacheTTL: number = 60_000 // 1 minute default

  constructor(options: {
    baseUrl: string
    userId?: string
    anonymousId?: string
    cacheTTL?: number
  }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.userId = options.userId
    this.anonymousId = options.anonymousId
    this.cacheTTL = options.cacheTTL || 60_000

    // Generate anonymous ID if needed
    if (!this.userId && !this.anonymousId) {
      this.anonymousId = this.getOrCreateAnonymousId()
    }
  }

  private getOrCreateAnonymousId(): string {
    const storageKey = 'rez_flagship_anonymous_id'
    let id = localStorage?.getItem(storageKey)

    if (!id) {
      // Use crypto.randomUUID() for cryptographically secure ID
      id = `anon_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`
      localStorage?.setItem(storageKey, id)
    }

    return id
  }

  /**
   * Set user context
   */
  setUser(userId: string, attributes?: Record<string, unknown>) {
    this.userId = userId
    this.anonymousId = undefined
    this.attributes = attributes || {}
    this.clearCache()
  }

  /**
   * Update attributes without changing user
   */
  setAttributes(attributes: Record<string, unknown>) {
    this.attributes = { ...this.attributes, ...attributes }
    this.clearCache()
  }

  /**
   * Clear cached evaluations
   */
  clearCache() {
    this.cache.clear()
  }

  private getContext(): SDKContext {
    return {
      userId: this.userId,
      anonymousId: this.anonymousId,
      ...this.attributes,
    }
  }

  private getCacheKey(flagKey: string): string {
    const contextId = this.userId || this.anonymousId || 'anonymous'
    return `${flagKey}:${contextId}`
  }

  /**
   * Check if a flag is enabled
   */
  async isEnabled(flagKey: string, defaultValue = false): Promise<boolean> {
    const value = await this.getValue(flagKey, defaultValue)

    if (typeof value === 'boolean') {
      return value
    }

    return Boolean(value)
  }

  /**
   * Get flag value
   */
  async getValue<T = unknown>(flagKey: string, defaultValue?: T): Promise<T> {
    const cacheKey = this.getCacheKey(flagKey)
    const cached = this.cache.get(cacheKey)

    if (cached && cached.expiry > Date.now()) {
      return cached.data as T
    }

    try {
      const params = new URLSearchParams()
      if (this.userId) params.set('userId', this.userId)
      if (this.anonymousId) params.set('anonymousId', this.anonymousId)

      const response = await fetch(
        `${this.baseUrl}/api/sdk/flags/${encodeURIComponent(flagKey)}?${params}`,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (!response.ok) {
        logger.warn(`FlagShip: Failed to fetch flag "${flagKey}"`)
        return defaultValue as T
      }

      const data = await response.json()
      const value = (data._value ?? defaultValue) as T

      // Cache the result
      this.cache.set(cacheKey, {
        data: value,
        expiry: Date.now() + this.cacheTTL,
      })

      return value
    } catch (error) {
      console.error(`FlagShip: Error fetching flag "${flagKey}"`, error)
      return defaultValue as T
    }
  }

  /**
   * Get all flags and their evaluated values
   */
  async getAllFlags(): Promise<Record<string, unknown>> {
    const contextId = this.userId || this.anonymousId || 'anonymous'

    try {
      const params = new URLSearchParams()
      if (this.userId) params.set('userId', this.userId)
      if (this.anonymousId) params.set('anonymousId', this.anonymousId)

      const response = await fetch(
        `${this.baseUrl}/api/sdk/flags?${params}`,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (!response.ok) {
        logger.warn('FlagShip: Failed to fetch flags')
        return {}
      }

      const flags = await response.json()

      // Evaluate and return just the values
      const result: Record<string, unknown> = {}
      for (const [key, config] of Object.entries(flags)) {
        const cfg = config as FlagConfig
        // For now, just return default variation values
        // In production, you'd want to cache the evaluation results
        result[key] = cfg.variations[cfg.defaultVariation]
      }

      return result
    } catch (error) {
      console.error('FlagShip: Error fetching all flags', error)
      return {}
    }
  }

  /**
   * Batch evaluate multiple flags
   */
  async evaluateMany(flagKeys: string[]): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/evaluate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKeys,
          context: this.getContext(),
        }),
      })

      if (!response.ok) {
        logger.warn('FlagShip: Failed to batch evaluate flags')
        return {}
      }

      const data = await response.json()
      const result: Record<string, unknown> = {}

      for (const r of data.data.results) {
        result[r.flagKey] = r.value
      }

      return result
    } catch (error) {
      console.error('FlagShip: Error batch evaluating flags', error)
      return {}
    }
  }

  /**
   * React hook helper - track which flags are used
   */
  trackFlagUsage(flagKey: string) {
    // In production, send analytics event
    logger.debug(`FlagShip: Flag "${flagKey}" evaluated`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// React Hook
// ─────────────────────────────────────────────────────────────────────────────

export function createFlagShipClient(options: {
  baseUrl: string
  userId?: string
  anonymousId?: string
  cacheTTL?: number
}): FlagShipClient {
  return new FlagShipClient(options)
}

// Export types
export type { FlagConfig, EvaluationResult, SDKContext, FlagShipClient }

export default FlagShipClient
