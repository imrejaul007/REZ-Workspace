/**
 * Shared utilities stub for consumer app
 *
 * This module provides inlined versions of @rez/shared functions used by
 * the consumer app, avoiding the need for the npm package during builds.
 *
 * NOTE: Schema validation (validateResponse) is dark-launch gated behind
 * SCHEMA_VALIDATION_ENABLED which defaults to FALSE. All stubs return
 * no-op/pass-through behavior appropriate for when the feature is off.
 *
 * IMPORTANT: zod is NOT a dependency of the consumer app. Since
 * SCHEMA_VALIDATION_ENABLED is always false, we avoid importing zod here.
 * If/when schema validation is enabled, zod must be added to package.json first.
 */

// ─── Validation Logger ──────────────────────────────────────────────────────

/**
 * Logger interface for redacting sensitive data
 * This stub implementation does nothing (validation is off by default)
 */
interface ValidationLogger {
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

const _noopLogger: ValidationLogger = {
  warn: () => {},
  error: () => {},
};

/**
 * Set the global logger for validation failures.
 * Stub: no-op since SCHEMA_VALIDATION_ENABLED defaults to false.
 */
export function setValidationLogger(_logger: ValidationLogger): void {
  // Validation is off by default; logger is not wired up.
}

// ─── Feature Flags ───────────────────────────────────────────────────────────

type FeatureFlag = 'SCHEMA_VALIDATION_ENABLED';

/**
 * Check if a feature flag is enabled.
 * Stub: always returns false (dark-launch: opt-in).
 * Override via localStorage key `rez_flag_{flag}` in development.
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  _overrides?: Record<FeatureFlag, boolean>
): boolean {
  if (_overrides?.[flag] !== undefined) {
    return _overrides[flag];
  }
  if (typeof process !== 'undefined' && process.env?.REZ_FEATURE_FLAGS) {
    const envFlags = process.env.REZ_FEATURE_FLAGS;
    const match = envFlags.split(',').find(f => f.startsWith(`${flag}:`));
    if (match) {
      return match.split(':')[1] === 'true';
    }
  }
  // Check localStorage (client-side overrides for dev/testing)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(`rez_flag_${flag}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
  } catch {
    // localStorage may not be available
  }
  return false; // dark-launch: default to off
}

// ─── Schema Validation ───────────────────────────────────────────────────────

/**
 * Validate API response against a Zod schema.
 * Dark launch: logs failures but does NOT throw.
 * Stub: always returns data as valid since SCHEMA_VALIDATION_ENABLED defaults to false.
 *
 * NOTE: This stub signature accepts unknown schema type to match the real API.
 * When schema validation is enabled (flag = true), zod must be added to
 * package.json and the implementation updated to use zod.safeParse.
 */
export function validateResponse<T>(
  _schema: unknown,
  data: unknown,
  _endpoint: string
): { data: T; valid: boolean; error?: string } {
  if (!isFeatureEnabled('SCHEMA_VALIDATION_ENABLED')) {
    return { data: data as T, valid: true };
  }
  // When the feature is enabled, zod must be available and the real
  // implementation from @karim4987498/shared should be used instead.
  return { data: data as T, valid: true };
}

// ─── API Contracts / Schemas ─────────────────────────────────────────────────

/**
 * User Profile — canonical shape for GET /user/auth/me responses.
 * Mirrors @karim4987498/shared/src/schemas/apiContracts.ts userProfileSchema.
 * Used only in validateResponse() calls that are guarded by isFeatureEnabled.
 */
export interface UserProfile {
  id: string;
  _id?: string;
  phoneNumber: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    location?: {
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      coordinates?: [number, number];
    };
  };
  preferences?: {
    language?: string;
    currency?: string;
    theme?: 'light' | 'dark';
    notifications?: {
      push?: boolean;
      email?: boolean;
      sms?: boolean;
    };
  };
  statedIdentity?: string;
  featureLevel?: number;
  segment?: string;
  verificationSegment?: string;
  verifications?: Record<string, unknown>;
  activeZones?: string[];
  role: 'user' | 'admin' | 'merchant';
  isVerified: boolean;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment Response — canonical shape for payment endpoints.
 * Mirrors @karim4987498/shared/src/schemas/apiContracts.ts paymentResponseSchema.
 */
export interface PaymentResponse {
  paymentId: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  gateway: string;
  paymentUrl?: string;
  qrCode?: string;
  upiId?: string;
  expiryTime?: string;
  transactionId?: string;
  gatewayResponse?: {
    code?: string;
    message?: string;
    transactionId?: string;
    authCode?: string;
    rrn?: string;
  };
}

/**
 * userProfileSchema — stub Zod-like interface.
 * The real implementation is a zod schema. This stub is compatible with
 * the validateResponse() calls in authApi.ts which are behind the
 * SCHEMA_VALIDATION_ENABLED feature flag (defaults to false).
 */
export const userProfileSchema = {
  safeParse: (data: unknown) => ({ success: true as const, data }),
};

/**
 * paymentResponseSchema — stub Zod-like interface.
 */
export const paymentResponseSchema = {
  safeParse: (data: unknown) => ({ success: true as const, data }),
};
