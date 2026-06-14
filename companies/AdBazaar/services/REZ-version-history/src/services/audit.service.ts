import { v4 as uuidv4 } from 'uuid';
import { AuditLogEntry, AuditAction } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuditService');

// In-memory storage
const auditLog: Map<string, AuditLogEntry[]> = new Map(); // contentItemId -> entries

export class AuditService {
  log(
    contentItemId: string,
    tenantId: string,
    userId: string,
    action: AuditAction,
    options?: {
      versionId?: string;
      ipAddress?: string;
      userAgent?: string;
      details?: Record<string, unknown>;
    }
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: uuidv4(),
      contentItemId,
      tenantId,
      userId,
      action,
      versionId: options?.versionId,
      timestamp: new Date(),
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      details: options?.details,
    };

    if (!auditLog.has(contentItemId)) {
      auditLog.set(contentItemId, []);
    }

    const entries = auditLog.get(contentItemId)!;
    entries.push(entry);

    // Keep only last 1000 entries per content item
    if (entries.length > 1000) {
      auditLog.set(contentItemId, entries.slice(-1000));
    }

    logger.info('Audit log entry created', {
      entryId: entry.id,
      contentItemId,
      action,
      userId,
    });

    return entry;
  }

  getByContentItem(contentItemId: string, options?: {
    limit?: number;
    since?: Date;
    action?: AuditAction;
  }): AuditLogEntry[] {
    let entries = auditLog.get(contentItemId) || [];

    if (options?.since) {
      entries = entries.filter(e => e.timestamp >= options.since!);
    }

    if (options?.action) {
      entries = entries.filter(e => e.action === options.action);
    }

    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      entries = entries.slice(0, options.limit);
    }

    return entries;
  }

  getByTenant(tenantId: string, options?: {
    limit?: number;
    since?: Date;
    action?: AuditAction;
    contentItemId?: string;
  }): AuditLogEntry[] {
    let entries: AuditLogEntry[] = [];

    if (options?.contentItemId) {
      entries = this.getByContentItem(options.contentItemId, options);
    } else {
      // Search all content items
      for (const [, contentEntries] of auditLog) {
        entries.push(...contentEntries.filter(e => e.tenantId === tenantId));
      }
    }

    if (options?.since) {
      entries = entries.filter(e => e.timestamp >= options.since!);
    }

    if (options?.action) {
      entries = entries.filter(e => e.action === options.action);
    }

    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      entries = entries.slice(0, options.limit);
    }

    return entries;
  }

  getByUser(tenantId: string, userId: string, options?: {
    limit?: number;
    since?: Date;
  }): AuditLogEntry[] {
    const tenantEntries = this.getByTenant(tenantId, { limit: undefined, since: options?.since });
    let userEntries = tenantEntries.filter(e => e.userId === userId);

    if (options?.limit) {
      userEntries = userEntries.slice(0, options.limit);
    }

    return userEntries;
  }

  // Get statistics for a tenant
  getStats(tenantId: string, options?: { since?: Date }): {
    totalActions: number;
    byAction: Record<AuditAction, number>;
    byUser: Record<string, number>;
    recentActivity: number;
  } {
    const entries = this.getByTenant(tenantId, { since: options?.since });

    const byAction: Record<AuditAction, number> = {
      version_created: 0,
      version_restored: 0,
      version_compared: 0,
      content_accessed: 0,
      content_exported: 0,
      collaborator_added: 0,
      collaborator_removed: 0,
    };

    const byUser: Record<string, number> = {};

    for (const entry of entries) {
      byAction[entry.action]++;
      byUser[entry.userId] = (byUser[entry.userId] || 0) + 1;
    }

    // Count recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = entries.filter(e => e.timestamp >= oneDayAgo).length;

    return {
      totalActions: entries.length,
      byAction,
      byUser,
      recentActivity,
    };
  }
}

export const auditService = new AuditService();
