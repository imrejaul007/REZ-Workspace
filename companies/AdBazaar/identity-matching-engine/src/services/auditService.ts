import { MatchAudit } from '../models/matchAudit.js';
import { logger } from '../utils/logger.js';

export interface AuditEntry {
  matchId: string;
  action: 'deterministic_match' | 'probabilistic_match' | 'identity_merge' | 'identity_split' | 'confidence_update';
  data: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  metadata?: Record<string, any>;
}

export async function auditMatch(entry: AuditEntry): Promise<void> {
  try {
    const audit = new MatchAudit({
      matchId: entry.matchId,
      action: entry.action,
      timestamp: new Date(),
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      data: entry.data,
      previousState: entry.previousState,
      newState: entry.newState,
      metadata: entry.metadata || {}
    });

    await audit.save();

    logger.debug('Audit entry created', {
      matchId: entry.matchId,
      action: entry.action
    });
  } catch (error) {
    logger.error('Failed to create audit entry', { error, entry });
    // Don't throw - audit failures shouldn't break the main flow
  }
}

export async function getAuditHistory(
  matchId: string,
  limit: number = 100
): Promise<typeof MatchAudit[]> {
  return await MatchAudit.find({ matchId })
    .sort({ timestamp: -1 })
    .limit(limit);
}

export async function getAuditByAction(
  action: AuditEntry['action'],
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<typeof MatchAudit[]> {
  const query: Record<string, any> = { action };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return await MatchAudit.find(query)
    .sort({ timestamp: -1 })
    .limit(limit);
}

export async function getAuditByUser(
  userId: string,
  limit: number = 100
): Promise<typeof MatchAudit[]> {
  return await MatchAudit.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
}

export async function getRecentAudits(
  limit: number = 100
): Promise<typeof MatchAudit[]> {
  return await MatchAudit.find()
    .sort({ timestamp: -1 })
    .limit(limit);
}

export async function getAuditStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number;
  byAction: Record<string, number>;
  byUser: Record<string, number>;
}> {
  const match: Record<string, any> = {};

  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = startDate;
    if (endDate) match.timestamp.$lte = endDate;
  }

  const audits = await MatchAudit.find(match).lean();

  const stats = {
    total: audits.length,
    byAction: {} as Record<string, number>,
    byUser: {} as Record<string, number>
  };

  for (const audit of audits) {
    stats.byAction[audit.action] = (stats.byAction[audit.action] || 0) + 1;
    if (audit.userId) {
      stats.byUser[audit.userId] = (stats.byUser[audit.userId] || 0) + 1;
    }
  }

  return stats;
}

export async function revertAuditEntry(
  auditId: string
): Promise<{
  success: boolean;
  message: string;
  revertedState?: Record<string, any>;
}> {
  const audit = await MatchAudit.findById(auditId);

  if (!audit) {
    return { success: false, message: 'Audit entry not found' };
  }

  // Check if we can revert (only certain actions are reversible)
  const reversibleActions = ['identity_merge', 'identity_split'];

  if (!reversibleActions.includes(audit.action)) {
    return { success: false, message: `Action ${audit.action} is not reversible` };
  }

  // For now, just log the revert request
  // Full implementation would require restoring previous state
  logger.info('Revert requested', {
    auditId,
    action: audit.action,
    matchId: audit.matchId
  });

  return {
    success: true,
    message: 'Revert request logged',
    revertedState: audit.previousState || {}
  };
}

export async function exportAudits(
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const audits = await MatchAudit.find({
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });

  if (format === 'json') {
    return JSON.stringify(audits, null, 2);
  }

  // CSV format
  const headers = ['matchId', 'action', 'timestamp', 'userId', 'ipAddress'];
  const rows = audits.map(a => [
    a.matchId,
    a.action,
    a.timestamp.toISOString(),
    a.userId || '',
    a.ipAddress || ''
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export async function cleanupOldAudits(daysOld: number = 365): Promise<{
  deleted: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await MatchAudit.deleteMany({
    timestamp: { $lt: cutoffDate }
  });

  logger.info('Cleaned up old audit entries', {
    deleted: result.deletedCount,
    cutoffDate: cutoffDate.toISOString()
  });

  return { deleted: result.deletedCount };
}

export async function getMatchTimeline(
  canonicalId: string
): Promise<{
  events: Array<{
    timestamp: Date;
    action: string;
    description: string;
    userId?: string;
  }>;
}> {
  const audits = await MatchAudit.find({
    $or: [
      { matchId: canonicalId },
      { 'data.canonicalId': canonicalId }
    ]
  }).sort({ timestamp: 1 });

  const events = audits.map(audit => ({
    timestamp: audit.timestamp,
    action: audit.action,
    description: describeAction(audit),
    userId: audit.userId
  }));

  return { events };
}

function describeAction(audit: typeof MatchAudit.prototype): string {
  switch (audit.action) {
    case 'deterministic_match':
      return `Deterministic match with confidence ${audit.data?.confidence || 'unknown'}`;
    case 'probabilistic_match':
      return `Probabilistic match with confidence ${audit.data?.confidence || 'unknown'}`;
    case 'identity_merge':
      return `Merged ${audit.data?.sourceIds?.length || 0} identities into ${audit.data?.targetId || audit.matchId}`;
    case 'identity_split':
      return `Split identity into ${audit.data?.newId || 'new identity'}`;
    case 'confidence_update':
      return `Confidence updated from ${audit.previousState?.confidence || 'unknown'} to ${audit.newState?.confidence || 'unknown'}`;
    default:
      return audit.action;
  }
}

export async function searchAudits(
  query: {
    matchId?: string;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    dataContains?: Record<string, any>;
  },
  page: number = 1,
  pageSize: number = 50
): Promise<{
  results: typeof MatchAudit[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const filter: Record<string, any> = {};

  if (query.matchId) filter.matchId = query.matchId;
  if (query.action) filter.action = query.action;
  if (query.userId) filter.userId = query.userId;
  if (query.startDate || query.endDate) {
    filter.timestamp = {};
    if (query.startDate) filter.timestamp.$gte = query.startDate;
    if (query.endDate) filter.timestamp.$lte = query.endDate;
  }

  const skip = (page - 1) * pageSize;

  const [results, total] = await Promise.all([
    MatchAudit.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pageSize),
    MatchAudit.countDocuments(filter)
  ]);

  return { results, total, page, pageSize };
}