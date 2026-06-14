/**
 * Audit Service Tests
 */

import { describe, it, expect } from 'vitest';

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  timestamp: Date;
}

function createAuditLog(data: Partial<AuditLog>): AuditLog {
  return {
    id: data.id || `audit_${Date.now()}`,
    action: data.action || '',
    userId: data.userId || '',
    resource: data.resource || '',
    resourceId: data.resourceId || '',
    changes: data.changes,
    timestamp: data.timestamp || new Date(),
  };
}

function filterByAction(logs: AuditLog[], action: string): AuditLog[] {
  return logs.filter(l => l.action === action);
}

function filterByUser(logs: AuditLog[], userId: string): AuditLog[] {
  return logs.filter(l => l.userId === userId);
}

describe('Audit Log Creation', () => {
  it('should create audit log', () => {
    const log = createAuditLog({
      action: 'CREATE',
      userId: 'user_1',
      resource: 'order',
      resourceId: 'order_123',
    });

    expect(log.action).toBe('CREATE');
    expect(log.resource).toBe('order');
  });
});

describe('Audit Filtering', () => {
  const logs: AuditLog[] = [
    createAuditLog({ action: 'CREATE', userId: 'u1', resource: 'order', resourceId: 'o1' }),
    createAuditLog({ action: 'UPDATE', userId: 'u1', resource: 'order', resourceId: 'o1' }),
    createAuditLog({ action: 'DELETE', userId: 'u2', resource: 'order', resourceId: 'o1' }),
  ];

  it('should filter by action', () => {
    const createLogs = filterByAction(logs, 'CREATE');
    expect(createLogs).toHaveLength(1);
  });

  it('should filter by user', () => {
    const user1Logs = filterByUser(logs, 'u1');
    expect(user1Logs).toHaveLength(2);
  });
});
