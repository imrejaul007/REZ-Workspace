// ReZ Schedule - Audit Log Service
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export type AuditAction =
  | 'booking.created'
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.rescheduled'
  | 'booking.completed'
  | 'booking.no_show'
  | 'booking.reminder_sent'
  | 'booking.payment_initiated'
  | 'booking.payment_completed'
  | 'booking.payment_failed'
  | 'event_type.created'
  | 'event_type.updated'
  | 'event_type.deleted'
  | 'event_type.published'
  | 'event_type.unpublished'
  | 'schedule.created'
  | 'schedule.updated'
  | 'schedule.deleted'
  | 'webhook.created'
  | 'webhook.updated'
  | 'webhook.deleted'
  | 'user.login'
  | 'user.logout'
  | 'user.settings_changed'
  | 'calendar.connected'
  | 'calendar.disconnected'
  | 'calendar.sync_completed';

export type EntityType = 'booking' | 'event_type' | 'schedule' | 'user' | 'webhook' | 'calendar' | 'organization';

export type ActorType = 'user' | 'system' | 'api' | 'webhook';

interface AuditLogEntry {
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  actorType?: ActorType;
  actorId?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          actorType: entry.actorType || 'system',
          actorId: entry.actorId,
          actorEmail: entry.actorEmail,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          changes: entry.changes as object,
          metadata: entry.metadata as object,
        },
      });

      logger.debug(`[Audit] ${entry.action} on ${entry.entityType}:${entry.entityId}`);
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      logger.error(`[Audit] Failed to log:`, error);
    }
  }

  /**
   * Log a booking event
   */
  async logBooking(
    action: AuditAction,
    bookingId: string,
    actor?: { id?: string; email?: string },
    changes?: Record<string, { before: unknown; after: unknown }>,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'booking',
      entityId: bookingId,
      actorType: actor?.id ? 'user' : 'system',
      actorId: actor?.id,
      actorEmail: actor?.email,
      changes,
      ipAddress,
    });
  }

  /**
   * Log an event type change
   */
  async logEventType(
    action: AuditAction,
    eventTypeId: string,
    actor?: { id?: string; email?: string },
    changes?: Record<string, { before: unknown; after: unknown }>,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'event_type',
      entityId: eventTypeId,
      actorType: actor?.id ? 'user' : 'system',
      actorId: actor?.id,
      actorEmail: actor?.email,
      changes,
      ipAddress,
    });
  }

  /**
   * Get audit trail for an entity
   */
  async getEntityAuditTrail(
    entityType: EntityType,
    entityId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset,
    });
  }

  /**
   * Get audit trail for a user
   */
  async getUserAuditTrail(
    actorId: string,
    options: { limit?: number; startDate?: Date; endDate?: Date } = {}
  ) {
    return prisma.auditLog.findMany({
      where: {
        actorId,
        ...(options.startDate || options.endDate ? {
          createdAt: {
            ...(options.startDate ? { gte: options.startDate } : {}),
            ...(options.endDate ? { lte: options.endDate } : {}),
          },
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 100,
    });
  }

  /**
   * Get audit statistics
   */
  async getStats(options: {
    startDate: Date;
    endDate: Date;
    entityType?: EntityType;
    entityId?: string;
  }) {
    const logs = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        createdAt: {
          gte: options.startDate,
          lte: options.endDate,
        },
        ...(options.entityType ? { entityType: options.entityType } : {}),
        ...(options.entityId ? { entityId: options.entityId } : {}),
      },
      _count: { action: true },
    });

    return logs.map(log => ({
      action: log.action,
      count: log._count.action,
    }));
  }

  /**
   * Export audit logs (for compliance)
   */
  async export(
    options: {
      startDate: Date;
      endDate: Date;
      entityTypes?: EntityType[];
      actions?: AuditAction[];
      format?: 'json' | 'csv';
    }
  ) {
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: options.startDate,
          lte: options.endDate,
        },
        ...(options.entityTypes?.length ? { entityType: { in: options.entityTypes } } : {}),
        ...(options.actions?.length ? { action: { in: options.actions } } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    if (options.format === 'csv') {
      // Convert to CSV
      const headers = ['id', 'action', 'entityType', 'entityId', 'actorType', 'actorId', 'actorEmail', 'ipAddress', 'createdAt'];
      const rows = logs.map(log => [
        log.id,
        log.action,
        log.entityType,
        log.entityId,
        log.actorType,
        log.actorId,
        log.actorEmail,
        log.ipAddress,
        log.createdAt.toISOString(),
      ].join(','));
      return [headers.join(','), ...rows].join('\n');
    }

    return logs;
  }

  /**
   * Diff two states for audit
   */
  diff<T extends Record<string, unknown>>(before: T, after: T): Record<string, { before: unknown; after: unknown }> {
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes[key] = {
          before: before[key],
          after: after[key],
        };
      }
    }

    return changes;
  }
}

export const auditService = new AuditService();
export default auditService;
