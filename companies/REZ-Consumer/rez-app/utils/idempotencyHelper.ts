// @ts-nocheck
/**
 * Idempotency Helper
 *
 * Provides idempotency key generation and management for API requests
 * to ensure safe retry semantics across unreliable networks.
 *
 * Phase 0: Uses local idempotency key generation (no @rez/shared dependency).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const IDEMPOTENCY_CACHE_PREFIX = 'idempotency:';
const IDEMPOTENCY_TTL_MS = 86400000; // 24 hours

/**
 * Generate a new idempotency key for an API request
 * Uses the local generator (no @rez/shared dependency needed)
 */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

/**
 * Store an idempotency key result in local cache
 * for deduplication on retries
 */
export async function storeIdempotencyResult(
  key: string,
  result,
): Promise<void> {
  try {
    const cacheKey = `${IDEMPOTENCY_CACHE_PREFIX}${key}`;
    const entry = {
      result,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    logger.error('Failed to store idempotency result:', error as Error | undefined);
  }
}

/**
 * Retrieve cached idempotency result if it exists and is fresh
 */
export async function getIdempotencyResult(key: string): Promise<unknown | null> {
  try {
    const cacheKey = `${IDEMPOTENCY_CACHE_PREFIX}${key}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return null;

    const entry = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;

    // Return null if cache has expired
    if (age > IDEMPOTENCY_TTL_MS) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return entry.result;
  } catch (error) {
    logger.error('Failed to retrieve idempotency result:', error as Error | undefined);
    return null;
  }
}

/**
 * Clear a cached idempotency result
 */
export async function clearIdempotencyResult(key: string): Promise<void> {
  try {
    const cacheKey = `${IDEMPOTENCY_CACHE_PREFIX}${key}`;
    await AsyncStorage.removeItem(cacheKey);
  } catch (error) {
    logger.error('Failed to clear idempotency result:', error as Error | undefined);
  }
}

/**
 * Execute an async operation with idempotency guarantees
 * Returns cached result if operation was recently executed with same key
 */
export async function executeWithIdempotency<T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  // Check for cached result first
  const cached = await getIdempotencyResult(key);
  if (cached !== null) {
    return cached as T;
  }

  // Execute operation
  const result = await operation();

  // Cache the result
  await storeIdempotencyResult(key, result);

  return result;
}
