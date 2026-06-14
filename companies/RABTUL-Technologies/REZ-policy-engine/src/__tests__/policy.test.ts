/**
 * Policy Engine Tests
 * Tests for access control, rules evaluation, and policy management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Policy {
  id: string;
  name: string;
  effect: 'allow' | 'deny';
  actions: string[];
  resources: string[];
  conditions?: PolicyCondition[];
}

interface PolicyCondition {
  field: string;
  operator: string;
  value: unknown;
}

interface EvaluationContext {
  subject: {
    id: string;
    roles: string[];
    attributes: Record<string, unknown>;
  };
  action: string;
  resource: string;
  environment?: Record<string, unknown>;
}

// Policy evaluation
function evaluatePolicy(policy: Policy, context: EvaluationContext): boolean {
  // Check if action matches
  const actionMatch = policy.actions.some(a =>
    a === context.action || a === '*'
  );
  if (!actionMatch) return false;

  // Check if resource matches
  const resourceMatch = policy.resources.some(r =>
    matchResource(r, context.resource)
  );
  if (!resourceMatch) return false;

  // Check conditions
  if (policy.conditions) {
    for (const condition of policy.conditions) {
      if (!evaluateCondition(condition, context)) {
        return false;
      }
    }
  }

  return true;
}

function matchResource(pattern: string, resource: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    return resource.startsWith(prefix);
  }
  return pattern === resource;
}

function evaluateCondition(condition: PolicyCondition, context: EvaluationContext): boolean {
  let value: unknown;

  // Extract value from context
  if (condition.field.startsWith('subject.')) {
    const attr = condition.field.replace('subject.', '');
    value = context.subject.attributes[attr];
  } else if (condition.field.startsWith('env.')) {
    const attr = condition.field.replace('env.', '');
    value = context.environment?.[attr];
  } else {
    value = context.subject.attributes[condition.field];
  }

  switch (condition.operator) {
    case 'eq': return value === condition.value;
    case 'neq': return value !== condition.value;
    case 'gt': return Number(value) > Number(condition.value);
    case 'gte': return Number(value) >= Number(condition.value);
    case 'lt': return Number(value) < Number(condition.value);
    case 'lte': return Number(value) <= Number(condition.value);
    case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
    case 'contains': return String(value).includes(String(condition.value));
    case 'regex': return new RegExp(String(condition.value)).test(String(value));
    case 'exists': return value !== undefined && value !== null;
    default: return false;
  }
}

// Multi-policy evaluation
function evaluatePolicies(
  policies: Policy[],
  context: EvaluationContext
): { decision: 'allow' | 'deny'; matchedPolicies: string[] } {
  let decision: 'allow' | 'deny' = 'deny';
  const matchedPolicies: string[] = [];

  for (const policy of policies) {
    if (evaluatePolicy(policy, context)) {
      matchedPolicies.push(policy.id);
      decision = policy.effect;
      if (policy.effect === 'deny') break; // Deny overrides
    }
  }

  return { decision, matchedPolicies };
}

// Role-based access
function hasRole(context: EvaluationContext, role: string): boolean {
  return context.subject.roles.includes(role);
}

function hasAnyRole(context: EvaluationContext, roles: string[]): boolean {
  return roles.some(r => context.subject.roles.includes(r));
}

function hasAllRoles(context: EvaluationContext, roles: string[]): boolean {
  return roles.every(r => context.subject.roles.includes(r));
}

// ABAC evaluation
function evaluateAttributeAccess(
  attributes: Record<string, unknown>,
  rules: { attribute: string; operator: string; value: unknown }[]
): boolean {
  return rules.every(rule => {
    const value = attributes[rule.attribute];
    switch (rule.operator) {
      case 'eq': return value === rule.value;
      case 'gt': return Number(value) > Number(rule.value);
      case 'gte': return Number(value) >= Number(rule.value);
      default: return false;
    }
  });
}

describe('Policy Evaluation', () => {
  const policy: Policy = {
    id: 'policy_1',
    name: 'Read Orders',
    effect: 'allow',
    actions: ['orders:read', 'orders:list'],
    resources: ['orders/*'],
  };

  const context: EvaluationContext = {
    subject: { id: 'user_1', roles: ['customer'], attributes: {} },
    action: 'orders:read',
    resource: 'orders/123',
  };

  it('should allow matching policy', () => {
    expect(evaluatePolicy(policy, context)).toBe(true);
  });

  it('should deny non-matching action', () => {
    const ctx = { ...context, action: 'orders:delete' };
    expect(evaluatePolicy(policy, ctx)).toBe(false);
  });

  it('should deny non-matching resource', () => {
    const ctx = { ...context, resource: 'products/123' };
    expect(evaluatePolicy(policy, ctx)).toBe(false);
  });
});

describe('Resource Pattern Matching', () => {
  it('should match wildcard', () => {
    expect(matchResource('*', 'anything')).toBe(true);
  });

  it('should match prefix with wildcard', () => {
    expect(matchResource('orders/*', 'orders/123')).toBe(true);
    expect(matchResource('orders/*', 'products/123')).toBe(false);
  });

  it('should match exact resource', () => {
    expect(matchResource('orders/123', 'orders/123')).toBe(true);
    expect(matchResource('orders/123', 'orders/456')).toBe(false);
  });
});

describe('Condition Evaluation', () => {
  const context: EvaluationContext = {
    subject: {
      id: 'user_1',
      roles: ['customer'],
      attributes: { tier: 'premium', age: 25 },
    },
    action: 'orders:create',
    resource: 'orders',
    environment: { time: 'business' },
  };

  it('should evaluate subject attribute', () => {
    const condition: PolicyCondition = {
      field: 'subject.tier',
      operator: 'eq',
      value: 'premium',
    };
    expect(evaluateCondition(condition, context)).toBe(true);
  });

  it('should evaluate environment attribute', () => {
    const condition: PolicyCondition = {
      field: 'env.time',
      operator: 'eq',
      value: 'business',
    };
    expect(evaluateCondition(condition, context)).toBe(true);
  });

  it('should evaluate numeric comparison', () => {
    const condition: PolicyCondition = {
      field: 'subject.age',
      operator: 'gte',
      value: 18,
    };
    expect(evaluateCondition(condition, context)).toBe(true);
  });
});

describe('Multi-Policy Evaluation', () => {
  const policies: Policy[] = [
    {
      id: 'allow_customers',
      name: 'Allow Customers',
      effect: 'allow',
      actions: ['orders:read'],
      resources: ['orders/*'],
    },
    {
      id: 'deny_sensitive',
      name: 'Deny Sensitive',
      effect: 'deny',
      actions: ['orders:read'],
      resources: ['orders/sensitive/*'],
    },
  ];

  it('should allow when matching allow policy', () => {
    const context: EvaluationContext = {
      subject: { id: 'user_1', roles: ['customer'], attributes: {} },
      action: 'orders:read',
      resource: 'orders/123',
    };
    const result = evaluatePolicies(policies, context);
    expect(result.decision).toBe('allow');
  });

  it('should deny when matching deny policy', () => {
    const context: EvaluationContext = {
      subject: { id: 'user_1', roles: ['customer'], attributes: {} },
      action: 'orders:read',
      resource: 'orders/sensitive/456',
    };
    const result = evaluatePolicies(policies, context);
    expect(result.decision).toBe('deny');
  });
});

describe('Role-Based Access', () => {
  const context: EvaluationContext = {
    subject: { id: 'user_1', roles: ['admin', 'moderator'], attributes: {} },
    action: 'admin:access',
    resource: 'admin',
  };

  it('should check single role', () => {
    expect(hasRole(context, 'admin')).toBe(true);
    expect(hasRole(context, 'user')).toBe(false);
  });

  it('should check any role', () => {
    expect(hasAnyRole(context, ['admin', 'moderator'])).toBe(true);
    expect(hasAnyRole(context, ['user', 'guest'])).toBe(false);
  });

  it('should check all roles', () => {
    expect(hasAllRoles(context, ['admin'])).toBe(true);
    expect(hasAllRoles(context, ['admin', 'moderator'])).toBe(true);
    expect(hasAllRoles(context, ['admin', 'superuser'])).toBe(false);
  });
});

describe('Attribute-Based Access', () => {
  it('should evaluate attribute rules', () => {
    const attributes = { tier: 'premium', verified: true };
    const rules = [
      { attribute: 'tier', operator: 'eq', value: 'premium' },
      { attribute: 'verified', operator: 'eq', value: true },
    ];
    expect(evaluateAttributeAccess(attributes, rules)).toBe(true);
  });

  it('should fail on mismatch', () => {
    const attributes = { tier: 'basic', verified: true };
    const rules = [
      { attribute: 'tier', operator: 'eq', value: 'premium' },
    ];
    expect(evaluateAttributeAccess(attributes, rules)).toBe(false);
  });
});

describe('Policy Validation', () => {
  function validatePolicy(policy: Partial<Policy>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!policy.id) errors.push('id is required');
    if (!policy.name) errors.push('name is required');
    if (!policy.effect) errors.push('effect is required');
    if (!policy.actions || policy.actions.length === 0) errors.push('at least one action is required');
    if (!policy.resources || policy.resources.length === 0) errors.push('at least one resource is required');

    return { valid: errors.length === 0, errors };
  }

  it('should validate complete policy', () => {
    const policy: Partial<Policy> = {
      id: 'policy_1',
      name: 'Test Policy',
      effect: 'allow',
      actions: ['read'],
      resources: ['resource/*'],
    };
    const result = validatePolicy(policy);
    expect(result.valid).toBe(true);
  });

  it('should reject policy without actions', () => {
    const policy: Partial<Policy> = {
      id: 'policy_1',
      name: 'Test Policy',
      effect: 'allow',
      actions: [],
      resources: ['resource/*'],
    };
    const result = validatePolicy(policy);
    expect(result.valid).toBe(false);
  });
});
