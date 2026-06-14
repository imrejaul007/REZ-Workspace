import { AuditLog, IAuditLog } from '../models/AuditLog.js';
import { Computation } from '../models/Computation.js';
import { AuditAction } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

export interface AuditEntry {
  computationId: string;
  action: AuditAction;
  actor: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AuditFilter {
  computationId?: string;
  action?: AuditAction;
  actor?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  totalLogs: number;
  actions: Record<string, number>;
  actors: Record<string, number>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class AuditService {
  /**
   * Create audit log entry
   */
  async log(entry: AuditEntry): Promise<IAuditLog> {
    const auditLog = await AuditLog.create({
      computationId: entry.computationId,
      action: entry.action,
      actor: entry.actor,
      details: entry.details || {},
      timestamp: new Date(),
      metadata: entry.metadata || {},
    });

    metrics.auditLogsTotal.labels(entry.action).inc();

    logger.debug('Audit log created', {
      computationId: entry.computationId,
      action: entry.action,
      actor: entry.actor,
    });

    return auditLog;
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filter: AuditFilter): Promise<IAuditLog[]> {
    const query: Record<string, unknown> = {};

    if (filter.computationId) {
      query.computationId = filter.computationId;
    }

    if (filter.action) {
      query.action = filter.action;
    }

    if (filter.actor) {
      query.actor = filter.actor;
    }

    if (filter.startDate || filter.endDate) {
      query.timestamp = {};
      if (filter.startDate) {
        (query.timestamp as Record<string, Date>).$gte = filter.startDate;
      }
      if (filter.endDate) {
        (query.timestamp as Record<string, Date>).$lte = filter.endDate;
      }
    }

    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(filter.offset || 0)
      .limit(filter.limit || 100);
  }

  /**
   * Get audit trail for a computation
   */
  async getAuditTrail(computationId: string): Promise<IAuditLog[]> {
    return AuditLog.find({ computationId })
      .sort({ timestamp: 1 }) // Chronological order
      .limit(1000);
  }

  /**
   * Get audit summary for dashboard
   */
  async getSummary(filter?: AuditFilter): Promise<AuditSummary> {
    const query: Record<string, unknown> = {};

    if (filter?.computationId) {
      query.computationId = filter.computationId;
    }

    if (filter?.action) {
      query.action = filter.action;
    }

    if (filter?.actor) {
      query.actor = filter.actor;
    }

    // Get logs within time range
    if (filter?.startDate || filter?.endDate) {
      query.timestamp = {};
      if (filter.startDate) {
        (query.timestamp as Record<string, Date>).$gte = filter.startDate;
      }
      if (filter.endDate) {
        (query.timestamp as Record<string, Date>).$lte = filter.endDate;
      }
    }

    const logs = await AuditLog.find(query);

    // Count actions and actors
    const actions: Record<string, number> = {};
    const actors: Record<string, number> = {};

    for (const log of logs) {
      actions[log.action] = (actions[log.action] || 0) + 1;
      actors[log.actor] = (actors[log.actor] || 0) + 1;
    }

    const timestamps = logs.map(l => l.timestamp.getTime());

    return {
      totalLogs: logs.length,
      actions,
      actors,
      timeRange: {
        start: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : new Date(),
        end: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date(),
      },
    };
  }

  /**
   * Verify integrity of audit trail
   */
  async verifyIntegrity(computationId: string): Promise<{
    valid: boolean;
    missingEntries: string[];
    integrityScore: number;
  }> {
    const logs = await AuditLog.find({ computationId }).sort({ timestamp: 1 });

    const expectedActions = [
      AuditAction.COMPUTATION_CREATED,
      AuditAction.COMPUTATION_STARTED,
      AuditAction.COMPUTATION_COMPLETED,
    ];

    const presentActions = logs.map(l => l.action);
    const missingEntries = expectedActions.filter(
      a => !presentActions.includes(a)
    );

    // Calculate integrity score
    const integrityScore = (logs.length / Math.max(expectedActions.length, 1)) * 100;

    return {
      valid: missingEntries.length === 0,
      missingEntries,
      integrityScore: Math.min(100, integrityScore),
    };
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const logs = await AuditLog.find({
      timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: -1 });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = [
      'computationId',
      'action',
      'actor',
      'details',
      'timestamp',
    ];

    const rows = logs.map(log => [
      log.computationId,
      log.action,
      log.actor,
      JSON.stringify(log.details),
      log.timestamp.toISOString(),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    logger.info('Cleaned up old audit logs', {
      deletedCount: result.deletedCount,
      cutoffDate,
    });

    return result.deletedCount;
  }

  /**
   * Get computation-related audit logs
   */
  async getComputationAuditTrail(computationId: string): Promise<{
    computation: unknown;
    auditTrail: IAuditLog[];
  }> {
    const computation = await Computation.findOne({ computationId });
    const auditTrail = await this.getAuditTrail(computationId);

    return {
      computation: computation?.toJSON(),
      auditTrail,
    };
  }
}

export const auditService = new AuditService();
export default auditService;