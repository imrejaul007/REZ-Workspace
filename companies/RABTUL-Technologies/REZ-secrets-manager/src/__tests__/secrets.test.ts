/**
 * Secrets Manager Tests
 * Tests for secret storage, encryption, and rotation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Secret {
  id: string;
  name: string;
  encryptedValue: string;
  version: number;
  createdAt: Date;
  rotatedAt?: Date;
  metadata?: Record<string, string>;
}

// Simple encryption for testing (use proper crypto in production)
function encrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return Buffer.from(result).toString('base64');
}

function decrypt(encrypted: string, key: string): string {
  const text = Buffer.from(encrypted, 'base64').toString();
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

// Secret validation
function validateSecretName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    return { valid: false, error: 'Name must start with letter and contain only alphanumeric, _, -' };
  }
  if (name.length > 64) {
    return { valid: false, error: 'Name must be less than 64 characters' };
  }
  return { valid: true };
}

// Secret storage
const secretStore = new Map<string, Secret[]>();

function storeSecret(name: string, value: string, key: string, metadata?: Record<string, string>): Secret {
  const encrypted = encrypt(value, key);
  const secret: Secret = {
    id: `secret_${Date.now()}`,
    name,
    encryptedValue: encrypted,
    version: 1,
    createdAt: new Date(),
    metadata,
  };

  const existing = secretStore.get(name) || [];
  existing.push(secret);
  secretStore.set(name, existing);

  return secret;
}

function getSecret(name: string, version?: number, key?: string): { secret: Secret; value?: string } | null {
  const secrets = secretStore.get(name);
  if (!secrets || secrets.length === 0) return null;

  const secret = version
    ? secrets.find(s => s.version === version)
    : secrets[secrets.length - 1];

  if (!secret) return null;

  const result: { secret: Secret; value?: string } = { secret };
  if (key) {
    result.value = decrypt(secret.encryptedValue, key);
  }

  return result;
}

// Secret rotation
function rotateSecret(name: string, newValue: string, key: string): Secret | null {
  const secrets = secretStore.get(name);
  if (!secrets || secrets.length === 0) return null;

  const currentSecret = secrets[secrets.length - 1];
  const encrypted = encrypt(newValue, key);

  const newSecret: Secret = {
    id: `secret_${Date.now()}`,
    name,
    encryptedValue: encrypted,
    version: currentSecret.version + 1,
    createdAt: new Date(),
    rotatedAt: new Date(),
  };

  secrets.push(newSecret);
  return newSecret;
}

// Version listing
function listVersions(name: string): { version: number; createdAt: Date; rotatedAt?: Date }[] {
  const secrets = secretStore.get(name);
  if (!secrets) return [];

  return secrets.map(s => ({
    version: s.version,
    createdAt: s.createdAt,
    rotatedAt: s.rotatedAt,
  }));
}

describe('Encryption', () => {
  const key = 'encryption-key-123';

  it('should encrypt and decrypt correctly', () => {
    const original = 'my-secret-value';
    const encrypted = encrypt(original, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted).toBe(original);
  });

  it('should produce different encrypted values', () => {
    const value = 'test-value';
    const enc1 = encrypt(value, key);
    const enc2 = encrypt(value, key);

    // Due to base64 encoding, results might differ slightly
    expect(Buffer.from(enc1, 'base64').toString()).not.toBe(Buffer.from(enc2, 'base64').toString());
  });
});

describe('Secret Name Validation', () => {
  it('should accept valid names', () => {
    expect(validateSecretName('my-secret')).toEqual({ valid: true });
    expect(validateSecretName('MY_SECRET_123')).toEqual({ valid: true });
    expect(validateSecretName('api-key-v2')).toEqual({ valid: true });
  });

  it('should reject empty name', () => {
    const result = validateSecretName('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject name starting with number', () => {
    const result = validateSecretName('123-secret');
    expect(result.valid).toBe(false);
  });

  it('should reject name with special characters', () => {
    const result = validateSecretName('my@secret');
    expect(result.valid).toBe(false);
  });

  it('should reject long names', () => {
    const longName = 'a'.repeat(65);
    const result = validateSecretName(longName);
    expect(result.valid).toBe(false);
  });
});

describe('Secret Storage', () => {
  beforeEach(() => {
    secretStore.clear();
  });

  it('should store secret', () => {
    const key = 'encryption-key';
    const secret = storeSecret('test-secret', 'secret-value', key);

    expect(secret.name).toBe('test-secret');
    expect(secret.version).toBe(1);
    expect(secret.encryptedValue).toBeTruthy();
  });

  it('should store with metadata', () => {
    const key = 'encryption-key';
    const metadata = { environment: 'production', service: 'api' };
    const secret = storeSecret('test-secret', 'value', key, metadata);

    expect(secret.metadata).toEqual(metadata);
  });

  it('should retrieve secret', () => {
    const key = 'encryption-key';
    storeSecret('test-secret', 'my-value', key);
    const result = getSecret('test-secret', undefined, key);

    expect(result).not.toBeNull();
    expect(result?.value).toBe('my-value');
  });

  it('should return null for non-existent secret', () => {
    const result = getSecret('non-existent', undefined, 'key');
    expect(result).toBeNull();
  });
});

describe('Secret Rotation', () => {
  beforeEach(() => {
    secretStore.clear();
  });

  it('should rotate secret', () => {
    const key = 'encryption-key';
    storeSecret('test-secret', 'old-value', key);
    const rotated = rotateSecret('test-secret', 'new-value', key);

    expect(rotated).not.toBeNull();
    expect(rotated?.version).toBe(2);
    expect(rotated?.rotatedAt).toBeDefined();
  });

  it('should keep old version after rotation', () => {
    const key = 'encryption-key';
    storeSecret('test-secret', 'old-value', key);
    rotateSecret('test-secret', 'new-value', key);

    const oldSecret = getSecret('test-secret', 1);
    expect(oldSecret?.secret.version).toBe(1);
  });

  it('should retrieve latest version', () => {
    const key = 'encryption-key';
    storeSecret('test-secret', 'old-value', key);
    rotateSecret('test-secret', 'new-value', key);

    const result = getSecret('test-secret', undefined, key);
    expect(result?.value).toBe('new-value');
  });
});

describe('Version Management', () => {
  beforeEach(() => {
    secretStore.clear();
  });

  it('should list versions', () => {
    const key = 'encryption-key';
    storeSecret('test-secret', 'v1', key);
    rotateSecret('test-secret', 'v2', key);
    rotateSecret('test-secret', 'v3', key);

    const versions = listVersions('test-secret');
    expect(versions).toHaveLength(3);
  });

  it('should get specific version', () => {
    const key = 'encryption-key';
    storeSecret('test-secret', 'v1', key);
    rotateSecret('test-secret', 'v2', key);

    const result = getSecret('test-secret', 1, key);
    expect(result?.value).toBe('v1');
  });
});

describe('Secret Metadata', () => {
  it('should store environment metadata', () => {
    const metadata = {
      environment: 'production',
      region: 'us-east-1',
      owner: 'platform-team',
    };

    const secret = storeSecret('db-password', 'password123', 'key', metadata);
    expect(secret.metadata).toEqual(metadata);
  });
});
