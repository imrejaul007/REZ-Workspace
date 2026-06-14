import { ConsentAudit, IConsentAudit } from '../models/ConsentAudit';
import { Consent } from '../models/Consent';
import { ConsentType, ComplianceFramework } from '../models/Consent';
import { logger } from 'utils/logger.js';

interface AuditQuery {
  userId?: string;
  action?: string;
  consentType?: ConsentType;
  framework?: ComplianceFramework;
  startDate?: Date;
  endDate?: Date;
  actor?: string;
  limit?: number;
  offset?: number;
}

interface AuditSummary {
  totalActions: number;
  byAction: { [key: string]: number };
  byType: { [key: string]: number };
  byActor: { [key: string]: number };
  timeRange: {
    first: Date;
    last: Date;
  };
}

class AuditService {
  /**
   * Record an audit entry
   */
  async recordAudit(audit: Partial<IConsentAudit>): Promise<IConsentAudit> {
    return ConsentAudit.create({
      ...audit,
      timestamp: audit.timestamp || new Date()
    });
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs(query: AuditQuery): Promise<{ data: IConsentAudit[]; total: number }> {
    const { userId, action, consentType, framework, startDate, endDate, actor, limit = 100, offset = 0 } = query;

    const filter: any = {};

    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (consentType) filter.consentType = consentType;
    if (framework) filter.framework = framework;
    if (actor) filter.actor = actor;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }

    logger.info('Querying audit logs', { filter, limit, offset });

    const [data, total] = await Promise.all([
      ConsentAudit.find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit),
      ConsentAudit.countDocuments(filter)
    ]);

    return { data, total };
  }

  /**
   * Get audit summary for a user
   */
  async getUserAuditSummary(userId: string): Promise<AuditSummary> {
    const audits = await ConsentAudit.find({ userId });

    const byAction: { [key: string]: number } = {};
    const byType: { [key: string]: number } = {};
    const byActor: { [key: string]: number } = {};

    let first: Date | null = null;
    let last: Date | null = null;

    for (const audit of audits) {
      byAction[audit.action] = (byAction[audit.action] || 0) + 1;
      byType[audit.consentType] = (byType[audit.consentType] || 0) + 1;
      byActor[audit.actor] = (byActor[audit.actor] || 0) + 1;

      if (!first || audit.timestamp < first) first = audit.timestamp;
      if (!last || audit.timestamp > last) last = audit.timestamp;
    }

    return {
      totalActions: audits.length,
      byAction,
      byType,
      byActor,
      timeRange: {
        first: first || new Date(),
        last: last || new Date()
      }
    };
  }

  /**
   * Generate audit report for compliance
   */
  async generateAuditReport(
    framework: ComplianceFramework,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    logger.info('Generating audit report', { framework, startDate, endDate });

    const filter = {
      framework,
      timestamp: { $gte: startDate, $lte: endDate }
    };

    const audits = await ConsentAudit.find(filter).sort({ timestamp: 1 });

    // Group by day
    const dailyStats: { [key: string]: { granted: number; withdrawn: number; updated: number; accessed: number; exported: number; deleted: number } } = {};

    for (const audit of audits) {
      const day = audit.timestamp.toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { granted: 0, withdrawn: 0, updated: 0, accessed: 0, exported: 0, deleted: 0 };
      }
      if (dailyStats[day][audit.action as keyof typeof dailyStats[string]] !== undefined) {
        dailyStats[day][audit.action as keyof typeof dailyStats[string]]++;
      }
    }

    // User activity summary
    const userActivity = await ConsentAudit.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$userId',
          actionCount: { $sum: 1 },
          actions: { $addToSet: '$action' }
        }
      },
      { $sort: { actionCount: -1 } },
      { $limit: 100 }
    ]);

    // Consent type activity
    const typeActivity = await ConsentAudit.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$consentType',
          count: { $sum: 1 },
          actions: { $addToSet: '$action' }
        }
      }
    ]);

    return {
      framework,
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      totalAudits: audits.length,
      dailyStats,
      topUsers: userActivity,
      typeActivity
    };
  }

  /**
   * Verify consent chain for a user
   */
  async verifyConsentChain(userId: string): Promise<any> {
    const consents = await Consent.find({ userId });
    const audits = await ConsentAudit.find({ userId }).sort({ timestamp: 1 });

    const chainVerification = {
      userId,
      verifiedAt: new Date(),
      isValid: true,
      issues: [] as string[],
      consentRecords: consents.map(consent => ({
        type: consent.type,
        framework: consent.framework,
        granted: consent.granted,
        version: consent.version,
        lastUpdated: consent.updatedAt
      })),
      auditTrail: audits.map(audit => ({
        action: audit.action,
        timestamp: audit.timestamp,
        actor: audit.actor
      }))
    };

    // Verify chain integrity
    for (const consent of consents) {
      const consentAudits = audits.filter(a => a.consentType === consent.type);
      if (consentAudits.length === 0 && consent.granted) {
        chainVerification.issues.push(`No audit trail for granted consent: ${consent.type}`);
        chainVerification.isValid = false;
      }

      if (consent.version !== consentAudits.length + 1) {
        chainVerification.issues.push(
          `Version mismatch for ${consent.type}: expected ${consentAudits.length + 1}, got ${consent.version}`
        );
        chainVerification.isValid = false;
      }
    }

    return chainVerification;
  }

  /**
   * Export audit data for external systems
   */
  async exportAuditData(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string | any[]> {
    const audits = await ConsentAudit.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: -1 });

    if (format === 'csv') {
      const headers = ['userId', 'consentType', 'action', 'actor', 'ip', 'timestamp'];
      const rows = audits.map(a => [
        a.userId,
        a.consentType,
        a.action,
        a.actor,
        a.ip || '',
        a.timestamp.toISOString()
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))];
    }

    return audits;
  }

  /**
   * Get security alerts (suspicious activity)
   */
  async getSecurityAlerts(startDate: Date, endDate: Date): Promise<any[]> {
    const alerts: any[] = [];

    // Check for rapid consent changes
    const rapidChanges = await ConsentAudit.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          action: { $in: ['granted', 'withdrawn'] }
        }
      },
      {
        $group: {
          _id: { userId: '$userId', hour: { $dateToString: { format: '%Y-%m-%d %H', date: '$timestamp' } } },
          count: { $sum: 1 },
          actions: { $addToSet: '$action' }
        }
      },
      { $match: { count: { $gt: 10 } } }
    ]);

    for (const change of rapidChanges) {
      alerts.push({
        type: 'rapid_consent_changes',
        severity: 'medium',
        userId: change._id.userId,
        count: change.count,
        period: change._id.hour,
        description: `User changed consent ${change.count} times in one hour`
      });
    }

    // Check for bulk withdrawals
    const bulkWithdrawals = await Consent.aggregate([
      {
        $match: {
          withdrawnAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$ip',
          count: { $sum: 1 },
          userIds: { $addToSet: '$userId' }
        }
      },
      { $match: { count: { $gt: 5 }, userIds: { $gt: 3 } } }
    ]);

    for (const withdrawal of bulkWithdrawals) {
      alerts.push({
        type: 'potential_bulk_withdrawal',
        severity: 'high',
        ip: withdrawal._id,
        count: withdrawal.count,
        userCount: withdrawal.userIds.length,
        description: `Potential coordinated withdrawal from IP ${withdrawal._id}`
      });
    }

    logger.info('Security alerts generated', { count: alerts.length });

    return alerts;
  }
}

export const auditService = new AuditService();