// ============================================================================
// SUTAR Gateway - API Key Manager
// Key generation, validation, and management
// ============================================================================

import { createHmac, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { ApiKey, ApiKeyCreateRequest, ApiResponse } from '../types/index.js';

export interface ApiKeyValidationResult {
  valid: boolean;
  key?: ApiKey;
  error?: string;
  scopes?: string[];
  services?: string[];
}

export interface ApiKeyStats {
  total: number;
  active: number;
  expired: number;
  byService: Record<string, number>;
  byScope: Record<string, number>;
  topKeys: Array<{
    id: string;
    name: string;
    usageCount: number;
    lastUsed?: string;
  }>;
}

export class ApiKeyManager {
  private keys: Map<string, ApiKey> = new Map();
  private keyIndex: Map<string, string> = new Map(); // key hash -> keyId
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private config: {
    keyLength: number;
    prefix: string;
    algorithm: string;
    defaultExpiresIn: number;
    maxKeys: number;
  };

  constructor(config?: Partial<{
    keyLength: number;
    prefix: string;
    algorithm: string;
    defaultExpiresIn: number;
    maxKeys: number;
  }>) {
    this.config = {
      keyLength: config?.keyLength ?? 32,
      prefix: config?.prefix ?? 'sutar_',
      algorithm: config?.algorithm ?? 'sha256',
      defaultExpiresIn: config?.defaultExpiresIn ?? 365 * 24 * 60 * 60 * 1000, // 1 year
      maxKeys: config?.maxKeys ?? 10000,
    };
  }

  // ---------------------------------------------------------------------------
  // Key Generation
  // ---------------------------------------------------------------------------

  generateKey(request: ApiKeyCreateRequest): ApiResponse<ApiKey> {
    // Check max keys limit
    if (this.keys.size >= this.config.maxKeys) {
      return this.errorResponse('Maximum number of API keys reached');
    }

    // Generate random key
    const randomPart = randomBytes(this.config.keyLength).toString('base64url');
    const key = `${this.config.prefix}${randomPart}`;
    const keyHash = this.hashKey(key);

    const apiKey: ApiKey = {
      id: uuidv4(),
      key,
      name: request.name,
      description: request.description,
      scopes: request.scopes ?? ['read'],
      services: request.services ?? [],
      expiresAt: request.expiresIn
        ? new Date(Date.now() + request.expiresIn).toISOString()
        : new Date(Date.now() + this.config.defaultExpiresIn).toISOString(),
      createdAt: new Date().toISOString(),
      lastUsed: undefined,
      usageCount: 0,
      rateLimit: request.rateLimit,
      active: true,
      metadata: request.metadata ?? {},
    };

    this.keys.set(apiKey.id, apiKey);
    this.keyIndex.set(keyHash, apiKey.id);

    // Initialize rate limiter if specified
    if (apiKey.rateLimit) {
      this.rateLimiters.set(apiKey.id, new RateLimiter(apiKey.rateLimit));
    }

    return this.successResponse(apiKey, 'API key generated successfully');
  }

  // ---------------------------------------------------------------------------
  // Key Validation
  // ---------------------------------------------------------------------------

  validateKey(
    key: string,
    requiredScopes?: string[],
    requiredServices?: string[]
  ): ApiKeyValidationResult {
    // Hash the provided key
    const keyHash = this.hashKey(key);

    // Look up the key
    const keyId = this.keyIndex.get(keyHash);
    if (!keyId) {
      return { valid: false, error: 'Invalid API key' };
    }

    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return { valid: false, error: 'API key not found' };
    }

    // Check if key is active
    if (!apiKey.active) {
      return { valid: false, error: 'API key is inactive' };
    }

    // Check expiration
    if (apiKey.expiresAt) {
      const expiresAt = new Date(apiKey.expiresAt).getTime();
      if (Date.now() > expiresAt) {
        return { valid: false, error: 'API key has expired' };
      }
    }

    // Check scopes
    if (requiredScopes && requiredScopes.length > 0) {
      const hasScopes = requiredScopes.every(scope =>
        apiKey.scopes.includes(scope)
      );
      if (!hasScopes) {
        return {
          valid: false,
          error: 'Insufficient scopes',
          key: apiKey,
        };
      }
    }

    // Check services
    if (requiredServices && requiredServices.length > 0) {
      const hasServices = requiredServices.some(service =>
        apiKey.services.includes(service)
      );
      if (!hasServices) {
        return {
          valid: false,
          error: 'Access to requested service not allowed',
          key: apiKey,
        };
      }
    }

    return {
      valid: true,
      key: apiKey,
      scopes: apiKey.scopes,
      services: apiKey.services,
    };
  }

  // ---------------------------------------------------------------------------
  // Rate Limiting
  // ---------------------------------------------------------------------------

  checkRateLimit(keyId: string): { allowed: boolean; remaining: number; resetAt: string } {
    const limiter = this.rateLimiters.get(keyId);
    if (!limiter) {
      return { allowed: true, remaining: -1, resetAt: '' };
    }

    return limiter.check();
  }

  recordUsage(keyId: string): void {
    const apiKey = this.keys.get(keyId);
    if (apiKey) {
      apiKey.usageCount++;
      apiKey.lastUsed = new Date().toISOString();
    }
  }

  // ---------------------------------------------------------------------------
  // Key Management
  // ---------------------------------------------------------------------------

  getKey(keyId: string): ApiResponse<ApiKey | null> {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return this.successResponse(null);
    }
    return this.successResponse(this.sanitizeKey(apiKey));
  }

  listKeys(options?: {
    limit?: number;
    offset?: number;
    service?: string;
    scope?: string;
    active?: boolean;
  }): ApiResponse<{ keys: ApiKey[]; total: number }> {
    let keys = Array.from(this.keys.values());

    // Apply filters
    if (options?.service) {
      keys = keys.filter(k => k.services.includes(options.service!));
    }
    if (options?.scope) {
      keys = keys.filter(k => k.scopes.includes(options.scope!));
    }
    if (options?.active !== undefined) {
      keys = keys.filter(k => k.active === options.active);
    }

    const total = keys.length;

    // Apply pagination
    if (options?.offset !== undefined) {
      keys = keys.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      keys = keys.slice(0, options.limit);
    }

    return this.successResponse({
      keys: keys.map(k => this.sanitizeKey(k)),
      total,
    });
  }

  revokeKey(keyId: string): ApiResponse<{ keyId: string }> {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return this.errorResponse('API key not found');
    }

    apiKey.active = false;
    this.rateLimiters.delete(keyId);

    return this.successResponse({ keyId }, 'API key revoked successfully');
  }

  reactivateKey(keyId: string): ApiResponse<ApiKey> {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return this.errorResponse('API key not found');
    }

    apiKey.active = true;

    return this.successResponse(this.sanitizeKey(apiKey), 'API key reactivated');
  }

  updateKey(
    keyId: string,
    updates: Partial<Pick<ApiKey, 'name' | 'description' | 'scopes' | 'services' | 'rateLimit'>>
  ): ApiResponse<ApiKey> {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return this.errorResponse('API key not found');
    }

    if (updates.name !== undefined) apiKey.name = updates.name;
    if (updates.description !== undefined) apiKey.description = updates.description;
    if (updates.scopes !== undefined) apiKey.scopes = updates.scopes;
    if (updates.services !== undefined) apiKey.services = updates.services;
    if (updates.rateLimit !== undefined) {
      apiKey.rateLimit = updates.rateLimit;
      if (updates.rateLimit) {
        this.rateLimiters.set(keyId, new RateLimiter(updates.rateLimit));
      } else {
        this.rateLimiters.delete(keyId);
      }
    }

    return this.successResponse(this.sanitizeKey(apiKey), 'API key updated');
  }

  deleteKey(keyId: string): ApiResponse<{ keyId: string }> {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return this.errorResponse('API key not found');
    }

    // Remove from indexes
    const keyHash = this.hashKey(apiKey.key);
    this.keyIndex.delete(keyHash);
    this.keys.delete(keyId);
    this.rateLimiters.delete(keyId);

    return this.successResponse({ keyId }, 'API key deleted');
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  getStats(): ApiKeyStats {
    const stats: ApiKeyStats = {
      total: this.keys.size,
      active: 0,
      expired: 0,
      byService: {},
      byScope: {},
      topKeys: [],
    };

    const now = Date.now();

    for (const key of this.keys.values()) {
      if (key.active) {
        stats.active++;
      }

      if (key.expiresAt) {
        const expiresAt = new Date(key.expiresAt).getTime();
        if (now > expiresAt) {
          stats.expired++;
        }
      }

      for (const service of key.services) {
        stats.byService[service] = (stats.byService[service] ?? 0) + 1;
      }

      for (const scope of key.scopes) {
        stats.byScope[scope] = (stats.byScope[scope] ?? 0) + 1;
      }
    }

    // Get top keys by usage
    stats.topKeys = Array.from(this.keys.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(k => ({
        id: k.id,
        name: k.name,
        usageCount: k.usageCount,
        lastUsed: k.lastUsed,
      }));

    return stats;
  }

  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------

  private hashKey(key: string): string {
    return createHmac(this.config.algorithm, 'sutar-gateway')
      .update(key)
      .digest('hex');
  }

  private sanitizeKey(key: ApiKey): ApiKey {
    return {
      ...key,
      key: this.maskKey(key.key),
    };
  }

  private maskKey(key: string): string {
    if (key.length <= 8) {
      return '*'.repeat(key.length);
    }
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  }

  private successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private errorResponse<T>(error: string): ApiResponse<T> {
    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  // Cleanup expired keys
  cleanupExpiredKeys(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, key] of this.keys) {
      if (key.expiresAt) {
        const expiresAt = new Date(key.expiresAt).getTime();
        if (now > expiresAt) {
          const keyHash = this.hashKey(key.key);
          this.keyIndex.delete(keyHash);
          this.keys.delete(id);
          this.rateLimiters.delete(id);
          cleaned++;
        }
      }
    }

    return cleaned;
  }
}

// ============================================================================
// Rate Limiter Helper Class
// ============================================================================

class RateLimiter {
  private limit: number;
  private windowMs: number;
  private requests: number[] = [];

  constructor(limit: number, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(): { allowed: boolean; remaining: number; resetAt: string } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(t => t > windowStart);

    if (this.requests.length >= this.limit) {
      const oldestRequest = Math.min(...this.requests);
      const resetAt = new Date(oldestRequest + this.windowMs);

      return {
        allowed: false,
        remaining: 0,
        resetAt: resetAt.toISOString(),
      };
    }

    this.requests.push(now);

    return {
      allowed: true,
      remaining: this.limit - this.requests.length,
      resetAt: new Date(now + this.windowMs).toISOString(),
    };
  }

  reset(): void {
    this.requests = [];
  }
}

// ============================================================================
// Singleton and Helpers
// ============================================================================

export const apiKeyManager = new ApiKeyManager();

// Helper function for quick key validation
export function validateApiKey(
  key: string,
  requiredScopes?: string[],
  requiredServices?: string[]
): ApiKeyValidationResult {
  return apiKeyManager.validateKey(key, requiredScopes, requiredServices);
}

// Helper to format API key for display
export function formatApiKeyResponse(key: ApiKey, includeFullKey: boolean = false): Record<string, unknown> {
  return {
    id: key.id,
    name: key.name,
    key: includeFullKey ? key.key : apiKeyManager['maskKey'](key.key),
    scopes: key.scopes,
    services: key.services,
    expiresAt: key.expiresAt,
    createdAt: key.createdAt,
    lastUsed: key.lastUsed,
    usageCount: key.usageCount,
    active: key.active,
  };
}
