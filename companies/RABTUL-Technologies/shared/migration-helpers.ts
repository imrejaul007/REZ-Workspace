/**
 * Migration Helpers for RABTUL Services
 *
 * Utilities to help migrate services from legacy patterns to production standards.
 *
 * USAGE:
 * ```typescript
 * import { migrateToSecureLogger, migrateToCryptoIds, validateEnvVars } from '@rez/shared/migration';
 *
 * // Validate required environment variables at startup
 * validateEnvVars(['MONGODB_URI', 'REDIS_URL', 'JWT_SECRET']);
 *
 * // Replace Math.random() IDs
 * const secureId = generateSecureId('user');
 * ```
 */

import crypto from 'crypto';
import { maskPII, maskObject } from './telemetry';

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate a cryptographically secure ID with prefix
 * Replaces Math.random() based IDs
 */
export function generateSecureId(prefix: string = ''): string {
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/**
 * Generate a secure booking ID
 */
export function generateBookingId(type: 'hotel' | 'flight' | 'train' | 'bus' | 'cab' = 'hotel'): string {
  const prefix = type.charAt(0).toUpperCase();
  const timestamp = Date.now();
  const random = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `${prefix}${timestamp}-${random}`;
}

/**
 * Generate a secure event ID
 */
export function generateEventId(source: string = 'app'): string {
  return `evt_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
}

/**
 * Generate a secure request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
}

/**
 * Generate a secure token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a numeric code (for OTPs, etc.)
 */
export function generateNumericCode(digits: number = 6): string {
  const max = Math.pow(10, digits);
  return String(crypto.randomInt(max)).padStart(digits, '0');
}

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

export interface EnvVarValidation {
  name: string;
  required: boolean;
  pattern?: RegExp;
  minLength?: number;
}

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: Array<{ name: string; reason: string }>;
}

/**
 * Validate required environment variables
 * Call this at service startup to fail fast
 */
export function validateEnvVars(vars: EnvVarValidation[]): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    invalid: [],
  };

  for (const v of vars) {
    const value = process.env[v.name];

    if (!value) {
      if (v.required) {
        result.valid = false;
        result.missing.push(v.name);
      }
      continue;
    }

    if (v.pattern && !v.pattern.test(value)) {
      result.valid = false;
      result.invalid.push({
        name: v.name,
        reason: `Value does not match pattern: ${v.pattern}`,
      });
    }

    if (v.minLength && value.length < v.minLength) {
      result.valid = false;
      result.invalid.push({
        name: v.name,
        reason: `Value must be at least ${v.minLength} characters`,
      });
    }
  }

  return result;
}

/**
 * Get required env var with fail-fast
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`FATAL: ${name} environment variable is required`);
  }
  return value;
}

/**
 * Get optional env var with default
 */
export function getEnvWithDefault<T extends string | number | boolean>(
  name: string,
  defaultValue: T
): T {
  const value = process.env[name];
  if (!value) return defaultValue;

  if (typeof defaultValue === 'number') {
    const num = Number(value);
    return (isNaN(num) ? defaultValue : num) as T;
  }

  if (typeof defaultValue === 'boolean') {
    return (value === 'true' || value === '1') as unknown as T;
  }

  return value as T;
}

// ============================================
// BACKWARD COMPATIBLE LOGGER
// ============================================

/**
 * Create a backward-compatible logger that wraps console methods
 * but applies PII redaction and structured formatting
 */
export function createBackwardCompatLogger(serviceName: string) {
  const prefix = `[${serviceName}]`;

  return {
    log: (message: string, ...args: unknown[]) => {
      const safeArgs = args.map(arg =>
        typeof arg === 'object' ? maskObject(arg as Record<string, unknown>) : arg
      );
      console.log(prefix, message, ...safeArgs);
    },

    info: (message: string, ...args: unknown[]) => {
      const safeArgs = args.map(arg =>
        typeof arg === 'object' ? maskObject(arg as Record<string, unknown>) : arg
      );
      console.info(prefix, message, ...safeArgs);
    },

    warn: (message: string, ...args: unknown[]) => {
      const safeArgs = args.map(arg =>
        typeof arg === 'object' ? maskObject(arg as Record<string, unknown>) : arg
      );
      console.warn(prefix, message, ...safeArgs);
    },

    error: (message: string | Error, ...args: unknown[]) => {
      const msg = message instanceof Error ? message.message : message;
      const safeArgs = args.map(arg =>
        typeof arg === 'object' ? maskObject(arg as Record<string, unknown>) : arg
      );
      console.error(prefix, msg, ...safeArgs);
    },

    debug: (message: string, ...args: unknown[]) => {
      if (process.env.NODE_ENV !== 'production') {
        const safeArgs = args.map(arg =>
          typeof arg === 'object' ? maskObject(arg as Record<string, unknown>) : arg
        );
        console.debug(prefix, message, ...safeArgs);
      }
    },
  };
}

// ============================================
// CRYPTO HELPERS
// ============================================

/**
 * Hash a value with SHA-256
 */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Create HMAC signature
 */
export function createHmac(secret: string, data: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature in constant time
 */
export function verifyHmac(secret: string, data: string, signature: string): boolean {
  const expected = createHmac(secret, data);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * Encrypt data with AES-256-GCM
 */
export function encryptAes256Gcm(
  plaintext: string,
  key: Buffer
): { ciphertext: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
export function decryptAes256Gcm(
  ciphertext: string,
  iv: string,
  authTag: string,
  key: Buffer
): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================
// PATTERN REPLACEMENTS
// ============================================

/**
 * Regex patterns for common legacy patterns that need migration
 */
export const LEGACY_PATTERNS = {
  // Math.random() based IDs
  MATH_RANDOM_ID: /Math\.random\(\)\.toString\(36\)\.(substring|substr)\(\d+,\s*\d+\)/g,

  // Insecure fallbacks
  INSECURE_FALLBACK: /\|\|\s*['"][^'"]+['"]/g,

  // Console methods
  CONSOLE_LOG: /console\.log\(/g,
  CONSOLE_ERROR: /console\.error\(/g,
  CONSOLE_WARN: /console\.warn\(/g,

  // Hardcoded secrets
  HARDCODED_SECRET: /secret\s*=\s*['"][^'"]+['"]/gi,
};

// ============================================
// SCHEMA HELPERS
// ============================================

/**
 * Add secure ID generation pre-save hook to Mongoose schema
 */
export function addSecureIdHook<T extends { bookingId?: string; id?: string }>(
  schema,
  idField: 'bookingId' | 'id' = 'bookingId',
  prefix?: string
): void {
  schema.pre('save', function (next: () => void) {
    if (!this[idField]) {
      this[idField] = generateBookingId(
        prefix as 'hotel' | 'flight' | 'train' | 'bus' | 'cab' | undefined
      );
    }
    next();
  });
}

/**
 * Add created/updated timestamps
 */
export function addTimestamps(schema): void {
  schema.add({
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

  schema.pre('save', function (next: () => void) {
    this.updatedAt = new Date();
    next();
  });
}

// ============================================
// EXPORTS
// ============================================

export default {
  // ID Generation
  generateSecureId,
  generateBookingId,
  generateEventId,
  generateRequestId,
  generateSecureToken,
  generateNumericCode,

  // Environment
  validateEnvVars,
  getRequiredEnv,
  getEnvWithDefault,

  // Logger
  createBackwardCompatLogger,

  // Crypto
  sha256,
  createHmac,
  verifyHmac,
  encryptAes256Gcm,
  decryptAes256Gcm,

  // Patterns
  LEGACY_PATTERNS,

  // Schema
  addSecureIdHook,
  addTimestamps,

  // Re-exports
  maskPII,
  maskObject,
};
