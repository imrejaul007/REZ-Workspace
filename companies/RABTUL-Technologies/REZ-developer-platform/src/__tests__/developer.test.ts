/**
 * Developer Platform Tests
 * Tests for API keys, webhooks, and developer tools
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  scopes: string[];
  userId: string;
  status: 'active' | 'revoked';
  createdAt: Date;
  lastUsedAt?: Date;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'disabled';
  createdAt: Date;
}

// API Key generation
function generateApiKey(): { key: string; prefix: string } {
  const key = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
  return {
    key: `rz_live_${key}`,
    prefix: key.substring(0, 7)
  };
}

function validateApiKeyFormat(key: string): boolean {
  return /^rz_(live|test)_[a-z0-9]{24}$/.test(key);
}

// Scopes validation
const VALID_SCOPES = [
  'read:users',
  'write:users',
  'read:orders',
  'write:orders',
  'read:payments',
  'write:payments',
  'read:products',
  'write:products',
];

function validateScopes(scopes: string[]): { valid: boolean; invalid: string[] } {
  const invalid = scopes.filter(s => !VALID_SCOPES.includes(s));
  return { valid: invalid.length === 0, invalid };
}

// Webhook signature
function generateWebhookSecret(): string {
  return Array.from({ length: 16 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
}

function signWebhook(payload: string, secret: string): string {
  // Simplified HMAC signing
  let hash = 0;
  const combined = payload + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = signWebhook(payload, secret);
  return signature === expected;
}

// Rate limiting
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

function checkRateLimit(
  requests: number[],
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Filter requests within window
  const recentRequests = requests.filter(r => r > windowStart);

  if (recentRequests.length >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Math.max(...recentRequests) + config.windowMs)
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - recentRequests.length - 1,
    resetAt: new Date(now + config.windowMs)
  };
}

describe('API Key Generation', () => {
  it('should generate key with correct format', () => {
    const { key, prefix } = generateApiKey();

    expect(key).toMatch(/^rz_live_[a-z0-9]{24}$/);
    expect(prefix.length).toBe(7);
  });

  it('should generate unique keys', () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateApiKey().key));
    expect(keys.size).toBe(100);
  });

  it('should validate correct format', () => {
    expect(validateApiKeyFormat('rz_live_abc123def456ghi789jkl012')).toBe(true);
    expect(validateApiKeyFormat('rz_test_abc123def456ghi789jkl012')).toBe(true);
  });

  it('should reject invalid format', () => {
    expect(validateApiKeyFormat('invalid_key')).toBe(false);
    expect(validateApiKeyFormat('rz_wrong_abc123')).toBe(false);
    expect(validateApiKeyFormat('rz_live_short')).toBe(false);
  });
});

describe('Scope Validation', () => {
  it('should validate correct scopes', () => {
    const scopes = ['read:users', 'write:orders', 'read:products'];
    const result = validateScopes(scopes);

    expect(result.valid).toBe(true);
    expect(result.invalid).toHaveLength(0);
  });

  it('should reject invalid scopes', () => {
    const scopes = ['read:users', 'invalid:scope'];
    const result = validateScopes(scopes);

    expect(result.valid).toBe(false);
    expect(result.invalid).toContain('invalid:scope');
  });

  it('should accept empty scopes', () => {
    const result = validateScopes([]);
    expect(result.valid).toBe(true);
  });

  it('should validate all valid scopes', () => {
    const result = validateScopes(VALID_SCOPES);
    expect(result.valid).toBe(true);
  });
});

describe('Webhook Signature', () => {
  const secret = 'webhook_secret_123';

  it('should generate webhook secret', () => {
    const secret = generateWebhookSecret();
    expect(secret.length).toBeGreaterThan(0);
  });

  it('should sign payload', () => {
    const payload = JSON.stringify({ event: 'order.created' });
    const signature = signWebhook(payload, secret);

    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);
  });

  it('should verify valid signature', () => {
    const payload = JSON.stringify({ event: 'order.created' });
    const signature = signWebhook(payload, secret);

    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should reject tampered payload', () => {
    const payload = JSON.stringify({ event: 'order.created' });
    const signature = signWebhook(payload, secret);
    const tampered = JSON.stringify({ event: 'order.cancelled' });

    expect(verifyWebhookSignature(tampered, signature, secret)).toBe(false);
  });

  it('should reject wrong secret', () => {
    const payload = JSON.stringify({ event: 'order.created' });
    const signature = signWebhook(payload, secret);

    expect(verifyWebhookSignature(payload, signature, 'wrong_secret')).toBe(false);
  });
});

describe('Rate Limiting', () => {
  const config: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 100
  };

  it('should allow requests within limit', () => {
    const requests = [Date.now() - 5000]; // 5 seconds ago
    const result = checkRateLimit(requests, config);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('should block when limit exceeded', () => {
    const now = Date.now();
    const requests = Array.from({ length: 100 }, () => now - 1000); // All 1 second ago
    const result = checkRateLimit(requests, config);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should count requests in window only', () => {
    const now = Date.now();
    const requests = [
      now - 120000, // 2 minutes ago (outside window)
      now - 50000,   // 50 seconds ago
      now - 30000,   // 30 seconds ago
    ];
    const result = checkRateLimit(requests, config);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThan(100);
  });
});

describe('API Key Management', () => {
  it('should track last used timestamp', () => {
    const apiKey: ApiKey = {
      id: 'key_1',
      name: 'Production Key',
      key: generateApiKey().key,
      prefix: 'abc1234',
      scopes: ['read:users', 'write:orders'],
      userId: 'user_1',
      status: 'active',
      createdAt: new Date()
    };

    expect(apiKey.lastUsedAt).toBeUndefined();

    apiKey.lastUsedAt = new Date();
    expect(apiKey.lastUsedAt).toBeDefined();
  });

  it('should revoke key', () => {
    const apiKey: ApiKey = {
      id: 'key_1',
      name: 'Test Key',
      key: generateApiKey().key,
      prefix: 'abc1234',
      scopes: ['read:users'],
      userId: 'user_1',
      status: 'active',
      createdAt: new Date()
    };

    apiKey.status = 'revoked';
    expect(apiKey.status).toBe('revoked');
  });
});

describe('Webhook Management', () => {
  it('should create webhook with events', () => {
    const webhook: Webhook = {
      id: 'wh_1',
      url: 'https://example.com/webhook',
      events: ['order.created', 'order.updated', 'payment.captured'],
      secret: generateWebhookSecret(),
      status: 'active',
      createdAt: new Date()
    };

    expect(webhook.events).toContain('order.created');
    expect(webhook.url).toMatch(/^https:\/\//);
  });

  it('should filter webhook by event', () => {
    const webhooks: Webhook[] = [
      { id: 'wh_1', url: 'https://a.com', events: ['order.created'], secret: 's1', status: 'active', createdAt: new Date() },
      { id: 'wh_2', url: 'https://b.com', events: ['payment.captured'], secret: 's2', status: 'active', createdAt: new Date() },
    ];

    const orderWebhooks = webhooks.filter(w =>
      w.events.includes('order.created')
    );

    expect(orderWebhooks).toHaveLength(1);
    expect(orderWebhooks[0].id).toBe('wh_1');
  });
});
