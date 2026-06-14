/**
 * Feature Flags Service - Day 22-30
 * Gradual rollouts + A/B testing
 */

import { redis } from './config/redis';

const FLAG_PREFIX = 'flags:';
const FLAG_TTL = 3600; // 1 hour cache

interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout?: number; // 0-100 percentage
  variants?: Record<string, number>; // variant: percentage
  defaultValue?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Get flag value for user
 */
export async function isFlagEnabled(
  flagKey: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const flag = await getFlag(flagKey);
  if (!flag || !flag.enabled) return false;
  if (!flag.rollout) return true;

  // Percentage-based rollout
  const hash = hashUserId(userId || 'anonymous');
  return hash % 100 < flag.rollout;
}

/**
 * Get flag value with variant
 */
export async function getFlagValue<T>(
  flagKey: string,
  defaultValue: T,
  userId?: string
): Promise<T> {
  const flag = await getFlag(flagKey);
  if (!flag) return defaultValue;

  if (flag.variants) {
    const hash = hashUserId(userId || 'anonymous');
    const buckets = Object.entries(flag.variants);
    let cumulative = 0;
    for (const [variant, percentage] of buckets) {
      cumulative += percentage;
      if (hash % 100 < cumulative) {
        return variant as unknown as T;
      }
    }
  }

  return (flag.enabled ? true : defaultValue) as T;
}

/**
 * Set flag
 */
export async function setFlag(key: string, flag: Partial<FeatureFlag>): Promise<void> {
  await redis.setex(`${FLAG_PREFIX}${key}`, FLAG_TTL, JSON.stringify({ key, ...flag, updatedAt: new Date() }));
}

/**
 * Get flag
 */
export async function getFlag(key: string): Promise<FeatureFlag | null> {
  const data = await redis.get(`${FLAG_PREFIX}${key}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Hash user ID for consistent rollout
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i));
    hash = hash & hash;
  }
  return Math.abs(hash);
}
