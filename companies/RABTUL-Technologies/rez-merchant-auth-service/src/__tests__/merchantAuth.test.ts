/**
 * Merchant Auth Service Tests
 * Tests for merchant authentication, API keys, and permissions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Merchant {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'suspended' | 'deactivated';
  plan: 'starter' | 'pro' | 'enterprise';
  createdAt: Date;
}

interface MerchantApiKey {
  id: string;
  merchantId: string;
  name: string;
  key: string;
  scopes: string[];
  status: 'active' | 'revoked';
  createdAt: Date;
  lastUsedAt?: Date;
}

interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

// Merchant validation
function validateMerchant(merchant: Partial<Merchant>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!merchant.businessName || merchant.businessName.trim().length < 2) {
    errors.push('businessName must be at least 2 characters');
  }

  if (!merchant.email || !isValidEmail(merchant.email)) {
    errors.push('valid email is required');
  }

  if (!merchant.phone || !isValidPhone(merchant.phone)) {
    errors.push('valid phone number is required');
  }

  return { valid: errors.length === 0, errors };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{9,14}$/.test(phone.replace(/[\s-]/g, ''));
}

// API Key management
function generateApiKey(prefix: string): { key: string; hashedKey: string } {
  const key = `${prefix}_${Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('')}`;
  // In production, hash the key
  const hashedKey = Buffer.from(key).toString('base64');
  return { key, hashedKey };
}

function verifyApiKey(key: string, hashedKey: string): boolean {
  const inputHash = Buffer.from(key).toString('base64');
  return inputHash === hashedKey;
}

// Permission checking
function hasPermission(permissions: Permission[], resource: string, action: string): boolean {
  const permission = permissions.find(p => p.resource === resource);
  if (!permission) return false;
  return permission.actions.includes(action as any);
}

function mergePermissions(base: Permission[], override: Permission[]): Permission[] {
  const merged = [...base];

  for (const overridePerm of override) {
    const existing = merged.find(p => p.resource === overridePerm.resource);
    if (existing) {
      // Merge actions, avoiding duplicates
      for (const action of overridePerm.actions) {
        if (!existing.actions.includes(action)) {
          existing.actions.push(action);
        }
      }
    } else {
      merged.push(overridePerm);
    }
  }

  return merged;
}

// Plan permissions
const PLAN_PERMISSIONS: Record<Merchant['plan'], Permission[]> = {
  starter: [
    { resource: 'products', actions: ['create', 'read', 'update'] },
    { resource: 'orders', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
  ],
  pro: [
    { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'orders', actions: ['create', 'read', 'update'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'payments', actions: ['read'] },
  ],
  enterprise: [
    { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'orders', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'analytics', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'payments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'team', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'webhooks', actions: ['create', 'read', 'update', 'delete'] },
  ],
};

function getPlanPermissions(plan: Merchant['plan']): Permission[] {
  return PLAN_PERMISSIONS[plan];
}

// Scopes validation
const VALID_SCOPES = [
  'products:read', 'products:write', 'products:delete',
  'orders:read', 'orders:write',
  'payments:read',
  'analytics:read',
  'team:read', 'team:write',
];

function validateScopes(scopes: string[]): { valid: boolean; invalid: string[] } {
  const invalid = scopes.filter(s => !VALID_SCOPES.includes(s));
  return { valid: invalid.length === 0, invalid };
}

describe('Merchant Validation', () => {
  it('should validate complete merchant', () => {
    const merchant: Partial<Merchant> = {
      businessName: 'Acme Corp',
      email: 'merchant@example.com',
      phone: '+919876543210',
    };
    const result = validateMerchant(merchant);
    expect(result.valid).toBe(true);
  });

  it('should reject short business name', () => {
    const merchant: Partial<Merchant> = {
      businessName: 'A',
      email: 'test@example.com',
      phone: '+919876543210',
    };
    const result = validateMerchant(merchant);
    expect(result.valid).toBe(false);
  });

  it('should reject invalid email', () => {
    const merchant: Partial<Merchant> = {
      businessName: 'Valid Name',
      email: 'not-an-email',
      phone: '+919876543210',
    };
    const result = validateMerchant(merchant);
    expect(result.valid).toBe(false);
  });

  it('should reject invalid phone', () => {
    const merchant: Partial<Merchant> = {
      businessName: 'Valid Name',
      email: 'test@example.com',
      phone: '123',
    };
    const result = validateMerchant(merchant);
    expect(result.valid).toBe(false);
  });
});

describe('API Key Management', () => {
  it('should generate unique API key', () => {
    const { key, hashedKey } = generateApiKey('mk_live');
    expect(key).toMatch(/^mk_live_[a-z0-9]{32}$/);
    expect(hashedKey).toBeTruthy();
  });

  it('should verify correct key', () => {
    const { key, hashedKey } = generateApiKey('mk_test');
    expect(verifyApiKey(key, hashedKey)).toBe(true);
  });

  it('should reject incorrect key', () => {
    const { hashedKey } = generateApiKey('mk_test');
    expect(verifyApiKey('wrong_key', hashedKey)).toBe(false);
  });

  it('should generate different keys', () => {
    const key1 = generateApiKey('mk_live');
    const key2 = generateApiKey('mk_live');
    expect(key1.key).not.toBe(key2.key);
  });
});

describe('Permission Checking', () => {
  const permissions: Permission[] = [
    { resource: 'products', actions: ['create', 'read', 'update'] },
    { resource: 'orders', actions: ['read'] },
  ];

  it('should allow permitted action', () => {
    expect(hasPermission(permissions, 'products', 'read')).toBe(true);
  });

  it('should deny unpermitted action', () => {
    expect(hasPermission(permissions, 'products', 'delete')).toBe(false);
  });

  it('should deny access to unknown resource', () => {
    expect(hasPermission(permissions, 'payments', 'read')).toBe(false);
  });
});

describe('Plan Permissions', () => {
  it('should return correct permissions for starter plan', () => {
    const perms = getPlanPermissions('starter');
    expect(perms.find(p => p.resource === 'products')?.actions).toContain('create');
    expect(perms.find(p => p.resource === 'orders')?.actions).not.toContain('create');
  });

  it('should return correct permissions for pro plan', () => {
    const perms = getPlanPermissions('pro');
    expect(perms.find(p => p.resource === 'payments')).toBeDefined();
  });

  it('should return correct permissions for enterprise plan', () => {
    const perms = getPlanPermissions('enterprise');
    expect(perms.find(p => p.resource === 'team')).toBeDefined();
    expect(perms.find(p => p.resource === 'webhooks')).toBeDefined();
  });
});

describe('Scope Validation', () => {
  it('should validate correct scopes', () => {
    const scopes = ['products:read', 'orders:read', 'analytics:read'];
    const result = validateScopes(scopes);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid scopes', () => {
    const scopes = ['products:read', 'invalid:scope'];
    const result = validateScopes(scopes);
    expect(result.valid).toBe(false);
    expect(result.invalid).toContain('invalid:scope');
  });
});

describe('Permission Merging', () => {
  it('should merge permissions', () => {
    const base: Permission[] = [
      { resource: 'products', actions: ['read'] },
    ];
    const override: Permission[] = [
      { resource: 'products', actions: ['create'] },
      { resource: 'orders', actions: ['read'] },
    ];

    const merged = mergePermissions(base, override);

    expect(merged.find(p => p.resource === 'products')?.actions).toContain('read');
    expect(merged.find(p => p.resource === 'products')?.actions).toContain('create');
    expect(merged.find(p => p.resource === 'orders')).toBeDefined();
  });
});

describe('Merchant Status Transitions', () => {
  const validTransitions: Record<Merchant['status'], Merchant['status'][]> = {
    pending: ['active', 'deactivated'],
    active: ['suspended', 'deactivated'],
    suspended: ['active', 'deactivated'],
    deactivated: [],
  };

  function canTransition(from: Merchant['status'], to: Merchant['status']): boolean {
    return validTransitions[from]?.includes(to) ?? false;
  }

  it('should allow pending to active', () => {
    expect(canTransition('pending', 'active')).toBe(true);
  });

  it('should allow active to suspended', () => {
    expect(canTransition('active', 'suspended')).toBe(true);
  });

  it('should allow suspended to active', () => {
    expect(canTransition('suspended', 'active')).toBe(true);
  });

  it('should not allow deactivated transitions', () => {
    expect(canTransition('deactivated', 'active')).toBe(false);
  });
});

describe('Webhook Signature', () => {
  function signWebhook(payload: string, secret: string): string {
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  it('should sign payload', () => {
    const signature = signWebhook('{"event":"order.created"}', 'secret123');
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);
  });

  it('should produce same signature for same input', () => {
    const sig1 = signWebhook('{"event":"test"}', 'secret');
    const sig2 = signWebhook('{"event":"test"}', 'secret');
    expect(sig1).toBe(sig2);
  });

  it('should produce different signature for different payload', () => {
    const sig1 = signWebhook('{"event":"test1"}', 'secret');
    const sig2 = signWebhook('{"event":"test2"}', 'secret');
    expect(sig1).not.toBe(sig2);
  });
});
