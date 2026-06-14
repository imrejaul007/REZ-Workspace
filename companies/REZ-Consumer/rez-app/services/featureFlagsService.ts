/**
 * FEATURE FLAGS SERVICE
 * Integration with REZ-feature-flags (RABTUL)
 *
 * Service: REZ-feature-flags
 * Port: 4060
 * URL: https://REZ-feature-flags.onrender.com
 *
 * Features:
 * - Real-time feature flag evaluation
 * - User segmentation
 * - Gradual rollouts
 * - A/B testing support
 * - Local caching with background sync
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export type FlagType = 'boolean' | 'string' | 'number' | 'json';

export interface FeatureFlag {
  key: string;
  type: FlagType;
  value: unknown;
  enabled: boolean;
  rules?: FlagRule[];
  rollout?: {
    percentage: number; // 0-100
    userIds?: string[];
    segments?: string[];
  };
  metadata?: {
    description?: string;
    owner?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface FlagRule {
  id: string;
  priority: number;
  conditions: FlagCondition[];
  value: unknown;
  serve: 'value' | 'control';
}

export interface FlagCondition {
  attribute: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'regex';
  value: unknown;
}

export interface UserContext {
  userId: string;
  attributes: Record<string, unknown>;
}

export interface FlagEvaluation {
  flag: FeatureFlag;
  value: unknown;
  matchedRule?: FlagRule;
  reason: 'default' | 'rule_match' | 'rollout' | 'user_override';
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const FLAGS_SERVICE_URL = process.env.EXPO_PUBLIC_FEATURE_FLAGS_URL || 'https://REZ-feature-flags.onrender.com';
const FLAGS_API_VERSION = 'v1';
const FLAGS_BASE_URL = `${FLAGS_SERVICE_URL}/api/${FLAGS_API_VERSION}`;

// Local cache configuration
const CACHE_TTL = 60 * 1000; // 1 minute local cache
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes background sync
let localCache: Map<string, { flags: Map<string, FeatureFlag>; syncedAt: number }> = new Map();
let syncTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

// ============================================================================
// CACHE HELPERS
// ============================================================================

function getCacheKey(userId?: string): string {
  return userId || 'default';
}

function getCachedFlags(userId?: string): Map<string, FeatureFlag> | null {
  const cached = localCache.get(getCacheKey(userId));
  if (cached && Date.now() - cached.syncedAt < CACHE_TTL) {
    return cached.flags;
  }
  return null;
}

function setCachedFlags(userId: string | undefined, flags: Map<string, FeatureFlag>): void {
  localCache.set(getCacheKey(userId), { flags, syncedAt: Date.now() });
}

// ============================================================================
// CORE FLAG EVALUATION
// ============================================================================

/**
 * Evaluate a single feature flag
 */
export function evaluateFlag(
  flag: FeatureFlag,
  context: UserContext
): FlagEvaluation {
  // Check if flag is disabled
  if (!flag.enabled) {
    return {
      flag,
      value: null,
      reason: 'default',
    };
  }

  // Check user override
  if (flag.rollout?.userIds?.includes(context.userId)) {
    return {
      flag,
      value: flag.value,
      reason: 'user_override',
    };
  }

  // Check percentage rollout
  if (flag.rollout && flag.rollout.percentage < 100) {
    const hash = hashUserId(context.userId, flag.key);
    if (hash < flag.rollout.percentage) {
      return {
        flag,
        value: flag.value,
        reason: 'rollout',
      };
    }
    // User not in rollout, return default
    return {
      flag,
      value: null,
      reason: 'default',
    };
  }

  // Check rules
  if (flag.rules && flag.rules.length > 0) {
    const sortedRules = [...flag.rules].sort((a, b) => a.priority - b.priority);
    for (const rule of sortedRules) {
      if (evaluateConditions(rule.conditions, context)) {
        return {
          flag,
          value: rule.value,
          matchedRule: rule,
          reason: 'rule_match',
        };
      }
    }
  }

  // Return default value
  return {
    flag,
    value: flag.value,
    reason: 'default',
  };
}

/**
 * Evaluate conditions against user context
 */
function evaluateConditions(conditions: FlagCondition[], context: UserContext): boolean {
  return conditions.every(condition => evaluateCondition(condition, context));
}

function evaluateCondition(condition: FlagCondition, context: UserContext): boolean {
  const attributeValue = getNestedValue(context.attributes, condition.attribute);

  switch (condition.operator) {
    case 'eq':
      return attributeValue === condition.value;
    case 'neq':
      return attributeValue !== condition.value;
    case 'gt':
      return Number(attributeValue) > Number(condition.value);
    case 'gte':
      return Number(attributeValue) >= Number(condition.value);
    case 'lt':
      return Number(attributeValue) < Number(condition.value);
    case 'lte':
      return Number(attributeValue) <= Number(condition.value);
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(attributeValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(attributeValue);
    case 'contains':
      return String(attributeValue).includes(String(condition.value));
    case 'regex':
      return new RegExp(String(condition.value)).test(String(attributeValue));
    default:
      return false;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Simple hash function for percentage rollouts
 * Ensures consistent hashing per user + flag
 */
function hashUserId(userId: string, flagKey: string): number {
  const str = `${userId}:${flagKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 100);
}

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Get all flags for a user
 */
export async function getFlags(
  context: UserContext,
  options?: { skipCache?: boolean }
): Promise<ApiResponse<Map<string, FlagEvaluation>>> {
  const cacheKey = getCacheKey(context.userId);

  // Check local cache first
  if (!options?.skipCache) {
    const cached = getCachedFlags(context.userId);
    if (cached) {
      const evaluations = new Map<string, FlagEvaluation>();
      cached.forEach((flag, key) => {
        evaluations.set(key, evaluateFlag(flag, context));
      });
      return { success: true, data: evaluations };
    }
  }

  try {
    const response = await apiClient.post(`${FLAGS_BASE_URL}/evaluate`, {
      context: context.attributes,
      userId: context.userId,
    });

    if (response.success && response.data) {
      // Cache the flags
      const flags = new Map<string, FeatureFlag>();
      Object.entries(response.data as Record<string, FeatureFlag>).forEach(([key, flag]) => {
        flags.set(key, flag);
      });
      setCachedFlags(context.userId, flags);

      // Create evaluations
      const evaluations = new Map<string, FlagEvaluation>();
      flags.forEach((flag, key) => {
        evaluations.set(key, evaluateFlag(flag, context));
      });
      return { success: true, data: evaluations };
    }

    return { success: false, error: 'Failed to load flags' };
  } catch (error) {
    logger.error('[FeatureFlags] Failed to get flags:', error);
    return { success: false, error: 'Failed to load feature flags' };
  }
}

/**
 * Get a single flag value
 */
export async function getFlag(
  flagKey: string,
  context: UserContext
): Promise<FlagEvaluation | null> {
  try {
    const response = await apiClient.post(`${FLAGS_BASE_URL}/evaluate/single`, {
      flagKey,
      context: context.attributes,
      userId: context.userId,
    });

    if (response.success && response.data) {
      const flag = response.data as FeatureFlag;
      return evaluateFlag(flag, context);
    }
    return null;
  } catch (error) {
    logger.debug('[FeatureFlags] Flag evaluation failed:', error);
    return null;
  }
}

/**
 * Get boolean flag value (most common use case)
 */
export async function isFeatureEnabled(
  flagKey: string,
  context: UserContext,
  defaultValue = false
): Promise<boolean> {
  const evaluation = await getFlag(flagKey, context);
  if (evaluation) {
    return Boolean(evaluation.value);
  }
  return defaultValue;
}

/**
 * Get string flag value
 */
export async function getFlagValue(
  flagKey: string,
  context: UserContext,
  defaultValue?: string
): Promise<string | undefined> {
  const evaluation = await getFlag(flagKey, context);
  if (evaluation) {
    return String(evaluation.value);
  }
  return defaultValue;
}

/**
 * Get JSON flag value
 */
export async function getFlagConfig<T>(
  flagKey: string,
  context: UserContext,
  defaultValue?: T
): Promise<T | undefined> {
  const evaluation = await getFlag(flagKey, context);
  if (evaluation && typeof evaluation.value === 'object') {
    return evaluation.value as T;
  }
  return defaultValue;
}

/**
 * Force refresh flags (bypass cache)
 */
export async function refreshFlags(context: UserContext): Promise<void> {
  await getFlags(context, { skipCache: true });
}

/**
 * Start background sync for a user
 */
export function startBackgroundSync(
  context: UserContext,
  interval = SYNC_INTERVAL
): void {
  const cacheKey = getCacheKey(context.userId);

  // Clear existing timer
  stopBackgroundSync(context.userId);

  // Start new timer
  const timer = setInterval(async () => {
    await refreshFlags(context);
  }, interval);

  syncTimers.set(cacheKey, timer);
}

/**
 * Stop background sync
 */
export function stopBackgroundSync(userId?: string): void {
  const cacheKey = getCacheKey(userId);
  const timer = syncTimers.get(cacheKey);
  if (timer) {
    clearInterval(timer);
    syncTimers.delete(cacheKey);
  }
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  localCache.clear();
  syncTimers.forEach(timer => clearInterval(timer));
  syncTimers.clear();
}

// ============================================================================
// COMMON FLAGS (Typed accessors)
// ============================================================================

export interface AppFeatureFlags {
  // New features
  enableRezRide: boolean;
  enableVoiceCart: boolean;
  enableARPreview: boolean;
  enableLiveTracking: boolean;
  enableSocialSharing: boolean;

  // Modules
  enableHotels: boolean;
  enableFlights: boolean;
  enableTrains: boolean;
  enableWallet: boolean;
  enableRezPay: boolean;

  // UI/UX
  enableDarkMode: boolean;
  enableAnimations: boolean;
  enableHaptics: boolean;

  // Beta features
  betaAIRecommendations: boolean;
  betaVoiceSearch: boolean;
  betaARTryOn: boolean;

  // Experiments
  checkoutV2: boolean;
  homePageV2: boolean;
  searchAlgorithmV2: boolean;
}

/**
 * Get all app feature flags at once
 */
export async function getAppFeatureFlags(
  context: UserContext
): Promise<AppFeatureFlags> {
  const flags = await getFlags(context);

  const getBool = (key: string): boolean => {
    const eval_ = flags.data?.get(key);
    return eval_ ? Boolean(eval_.value) : false;
  };

  return {
    // New features
    enableRezRide: getBool('enable_rez_ride'),
    enableVoiceCart: getBool('enable_voice_cart'),
    enableARPreview: getBool('enable_ar_preview'),
    enableLiveTracking: getBool('enable_live_tracking'),
    enableSocialSharing: getBool('enable_social_sharing'),

    // Modules
    enableHotels: getBool('enable_hotel_ota'),
    enableFlights: getBool('enable_flights'),
    enableTrains: getBool('enable_trains'),
    enableWallet: getBool('enable_wallet'),
    enableRezPay: getBool('enable_rez_pay'),

    // UI/UX
    enableDarkMode: getBool('enable_dark_mode'),
    enableAnimations: getBool('enable_animations'),
    enableHaptics: getBool('enable_haptics'),

    // Beta features
    betaAIRecommendations: getBool('beta_ai_recommendations'),
    betaVoiceSearch: getBool('beta_voice_search'),
    betaARTryOn: getBool('beta_ar_tryon'),

    // Experiments
    checkoutV2: getBool('checkout_v2'),
    homePageV2: getBool('home_page_v2'),
    searchAlgorithmV2: getBool('search_algorithm_v2'),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const featureFlagsService = {
  // Core
  getFlags,
  getFlag,
  evaluateFlag,

  // Typed getters
  isFeatureEnabled,
  getFlagValue,
  getFlagConfig,

  // Cache management
  refreshFlags,
  startBackgroundSync,
  stopBackgroundSync,
  clearCache,

  // App-level
  getAppFeatureFlags,
};

export default featureFlagsService;
