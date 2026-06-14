/**
 * Developer Portal Tests
 */

import { describe, it, expect } from 'vitest';

interface ApiKey {
  name: string;
  scopes: string[];
  expiresAt?: Date;
}

function validateApiKey(key: Partial<ApiKey>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!key.name || key.name.length < 3) {
    errors.push('name must be at least 3 characters');
  }

  if (!key.scopes || key.scopes.length === 0) {
    errors.push('at least one scope is required');
  }

  return { valid: errors.length === 0, errors };
}

describe('API Key Validation', () => {
  it('should validate complete key', () => {
    const result = validateApiKey({
      name: 'Production Key',
      scopes: ['read:users'],
    });
    expect(result.valid).toBe(true);
  });

  it('should reject short name', () => {
    const result = validateApiKey({
      name: 'AB',
      scopes: ['read:users'],
    });
    expect(result.valid).toBe(false);
  });

  it('should reject empty scopes', () => {
    const result = validateApiKey({
      name: 'Test Key',
      scopes: [],
    });
    expect(result.valid).toBe(false);
  });
});
