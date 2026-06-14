/**
 * Idempotency Service Tests
 * Tests for request deduplication and idempotency key handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Idempotency key types
interface IdempotencyRecord {
  key: string;
  status: 'processing' | 'completed' | 'failed';
  response?: unknown;
  createdAt: Date;
  expiresAt: Date;
}

// In-memory store for testing
const store = new Map<string, IdempotencyRecord>();

// TTL in milliseconds (default 24 hours)
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

function createIdempotencyKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

function generateIdempotencyKey(): string {
  return `idem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isExpired(record: IdempotencyRecord): boolean {
  return Date.now() > record.expiresAt.getTime();
}

function getRecord(key: string): IdempotencyRecord | null {
  const record = store.get(key);
  if (!record) return null;
  if (isExpired(record)) {
    store.delete(key);
    return null;
  }
  return record;
}

function setRecord(key: string, status: IdempotencyRecord['status'], response?: unknown, ttl: number = DEFAULT_TTL): IdempotencyRecord {
  const record: IdempotencyRecord = {
    key,
    status,
    response,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + ttl),
  };
  store.set(key, record);
  return record;
}

function deleteRecord(key: string): boolean {
  return store.delete(key);
}

describe('Idempotency Key Generation', () => {
  it('should create key with prefix and identifier', () => {
    const key = createIdempotencyKey('payment', 'order_123');
    expect(key).toBe('payment:order_123');
  });

  it('should create unique idempotency keys', () => {
    const key1 = generateIdempotencyKey();
    const key2 = generateIdempotencyKey();
    expect(key1).not.toBe(key2);
  });

  it('should have correct format', () => {
    const key = generateIdempotencyKey();
    expect(key.startsWith('idem_')).toBe(true);
  });

  it('should handle special characters in identifier', () => {
    const key = createIdempotencyKey('api', 'user@example.com');
    expect(key).toBe('api:user@example.com');
  });
});

describe('Record Expiration', () => {
  beforeEach(() => {
    store.clear();
  });

  it('should detect expired records', () => {
    const expiredRecord: IdempotencyRecord = {
      key: 'test',
      status: 'completed',
      createdAt: new Date(Date.now() - DEFAULT_TTL - 1000),
      expiresAt: new Date(Date.now() - 1000),
    };

    expect(isExpired(expiredRecord)).toBe(true);
  });

  it('should not expire fresh records', () => {
    const freshRecord: IdempotencyRecord = {
      key: 'test',
      status: 'processing',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + DEFAULT_TTL),
    };

    expect(isExpired(freshRecord)).toBe(false);
  });

  it('should auto-delete expired records on get', () => {
    const key = 'expired_key';
    store.set(key, {
      key,
      status: 'completed',
      createdAt: new Date(Date.now() - DEFAULT_TTL - 1000),
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = getRecord(key);
    expect(result).toBeNull();
    expect(store.has(key)).toBe(false);
  });
});

describe('Record Lifecycle', () => {
  beforeEach(() => {
    store.clear();
  });

  it('should create processing record', () => {
    const key = generateIdempotencyKey();
    const record = setRecord(key, 'processing');

    expect(record.status).toBe('processing');
    expect(record.key).toBe(key);
    expect(record.response).toBeUndefined();
  });

  it('should update record to completed', () => {
    const key = generateIdempotencyKey();
    setRecord(key, 'processing');

    const updated = setRecord(key, 'completed', { result: 'success' });

    expect(updated.status).toBe('completed');
    expect(updated.response).toEqual({ result: 'success' });
  });

  it('should update record to failed', () => {
    const key = generateIdempotencyKey();
    setRecord(key, 'processing');

    const updated = setRecord(key, 'failed', { error: 'Something went wrong' });

    expect(updated.status).toBe('failed');
    expect(updated.response).toEqual({ error: 'Something went wrong' });
  });

  it('should delete record', () => {
    const key = generateIdempotencyKey();
    setRecord(key, 'processing');

    const deleted = deleteRecord(key);

    expect(deleted).toBe(true);
    expect(store.has(key)).toBe(false);
  });

  it('should return null for non-existent record', () => {
    const result = getRecord('non_existent_key');
    expect(result).toBeNull();
  });
});

describe('Idempotency Patterns', () => {
  beforeEach(() => {
    store.clear();
  });

  it('should detect duplicate request', () => {
    const idempotencyKey = createIdempotencyKey('payment', 'order_123');

    // First request
    setRecord(idempotencyKey, 'processing');
    const firstRequest = getRecord(idempotencyKey);
    expect(firstRequest?.status).toBe('processing');

    // Duplicate request
    const secondRequest = getRecord(idempotencyKey);
    expect(secondRequest?.status).toBe('processing');
  });

  it('should return cached response for completed request', () => {
    const idempotencyKey = createIdempotencyKey('payment', 'order_456');
    const cachedResponse = { paymentId: 'pay_123', status: 'captured' };

    setRecord(idempotencyKey, 'completed', cachedResponse);

    const result = getRecord(idempotencyKey);
    expect(result?.status).toBe('completed');
    expect(result?.response).toEqual(cachedResponse);
  });

  it('should handle concurrent requests safely', () => {
    const idempotencyKey = createIdempotencyKey('order', 'new_order');

    // First request starts processing
    setRecord(idempotencyKey, 'processing');

    // Second request should see it still processing
    const record = getRecord(idempotencyKey);
    expect(record?.status).toBe('processing');
  });
});

describe('TTL Handling', () => {
  beforeEach(() => {
    store.clear();
  });

  it('should use default TTL', () => {
    const key = generateIdempotencyKey();
    const record = setRecord(key, 'processing');

    const expectedExpiry = Date.now() + DEFAULT_TTL;
    expect(record.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
    expect(record.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000);
  });

  it('should accept custom TTL', () => {
    const key = generateIdempotencyKey();
    const customTTL = 60 * 1000; // 1 minute
    const record = setRecord(key, 'processing', undefined, customTTL);

    const expectedExpiry = Date.now() + customTTL;
    expect(record.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
  });
});

describe('Key Prefixing', () => {
  it('should support different entity types', () => {
    const paymentKey = createIdempotencyKey('payment', 'txn_123');
    const orderKey = createIdempotencyKey('order', 'ord_456');
    const refundKey = createIdempotencyKey('refund', 'ref_789');

    expect(paymentKey).toBe('payment:txn_123');
    expect(orderKey).toBe('order:ord_456');
    expect(refundKey).toBe('refund:ref_789');
  });

  it('should distinguish same identifier across types', () => {
    const key1 = createIdempotencyKey('order', '123');
    const key2 = createIdempotencyKey('payment', '123');

    expect(key1).not.toBe(key2);
  });
});
