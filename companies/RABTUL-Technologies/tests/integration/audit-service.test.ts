/**
 * Audit Service Tests
 */

describe('Audit Logging', () => {
  test('logs audit entry', async () => {
    const { logAudit } = await import('../src/services/audit-service');
    const id = await logAudit({
      userId: 'user123',
      action: 'login',
      resource: 'auth',
      service: 'auth-service',
    });
    expect(typeof id).toBe('string');
    expect(id.startsWith('audit_')).toBe(true);
  });

  test('queries audit logs', async () => {
    const { queryAuditLogs, logAudit } = await import('../src/services/audit-service');
    await logAudit({
      userId: 'user123',
      action: 'login',
      resource: 'auth',
      service: 'auth-service',
    });
    const logs = await queryAuditLogs({ userId: 'user123' });
    expect(Array.isArray(logs)).toBe(true);
  });
});
