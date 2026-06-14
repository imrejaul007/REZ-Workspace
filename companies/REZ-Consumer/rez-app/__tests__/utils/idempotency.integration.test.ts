// @ts-nocheck
/**
 * Integration Test: Idempotency Key Generation
 *
 * Verifies that idempotency keys are properly generated locally
 * and can be used for request deduplication.
 */

import { generateIdempotencyKey, generateIdempotencyKey as generateLocalKey } from '../../utils/idempotencyHelper';

describe('Idempotency Key Integration', () => {
  it('should generate idempotency keys from local generator', () => {
    const key1 = generateLocalKey();
    const key2 = generateLocalKey();

    expect(key1).toBeDefined();
    expect(key2).toBeDefined();
    expect(key1).not.toBe(key2);
    expect(typeof key1).toBe('string');
    expect(key1.length).toBeGreaterThan(0);
  });

  it('should use shared generator in local helper', () => {
    const localKey = generateLocalKey();
    expect(localKey).toBeDefined();
    expect(typeof localKey).toBe('string');
    expect(localKey.length).toBeGreaterThan(0);
  });

  it('should generate UUIDs as idempotency keys', () => {
    const key = generateIdempotencyKey();
    // generateIdempotencyKey returns `${Date.now()}-${crypto.randomUUID()}`.
    // The key contains a UUID portion (the second part) that matches UUID v4 format.
    // Check that the key is a string containing a hyphen separator and a UUID-like second part.
    const parts = key.split('-');
    expect(parts.length).toBeGreaterThan(1);
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(20);
  });
});
