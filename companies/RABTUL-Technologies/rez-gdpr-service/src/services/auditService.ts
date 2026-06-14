import { AuditEntry, PaginationParams, PaginatedResponse } from '../types';

export interface AuditLogInput {
  action: string;
  userId?: string;
  requestId?: string;
  consentId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  errorMessage?: string;
}

export interface AuditQuery {
  userId?: string;
  requestId?: string;
  action?: string;
  result?: 'success' | 'failure';
  dateFrom?: Date;
  dateTo?: Date;
}

class AuditService {
  private logs: Map<string, AuditEntry> = new Map();
  private readonly RETENTION_DAYS = 2555;

  async log(input: AuditLogInput): Promise<AuditEntry> {
    const id = this.generateId();
    const entry: AuditEntry = {
      id,
      timestamp: new Date(),
      action: input.action,
      userId: input.userId,
      requestId: input.requestId,
      consentId: input.consentId,
      details: input.details,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      result: input.result,
      errorMessage: input.errorMessage
    };

    this.logs.set(id, entry);

    this.scheduleCleanup();

    return entry;
  }

  async findById(id: string): Promise<AuditEntry | null> {
    return this.logs.get(id) || null;
  }

  async findByUserId(userId: string): Promise<AuditEntry[]> {
    return Array.from(this.logs.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async findByRequestId(requestId: string): Promise<AuditEntry[]> {
    return Array.from(this.logs.values())
      .filter(entry => entry.requestId === requestId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async query(
    filters: AuditQuery,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<AuditEntry>> {
    let results = Array.from(this.logs.values());

    if (filters.userId) {
      results = results.filter(entry => entry.userId === filters.userId);
    }
    if (filters.requestId) {
      results = results.filter(entry => entry.requestId === filters.requestId);
    }
    if (filters.action) {
      results = results.filter(entry => entry.action === filters.action);
    }
    if (filters.result) {
      results = results.filter(entry => entry.result === filters.result);
    }
    if (filters.dateFrom) {
      results = results.filter(entry => entry.timestamp >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      results = results.filter(entry => entry.timestamp <= filters.dateTo!);
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return this.paginate(results, pagination);
  }

  async getRecentActivity(
    limit: number = 50
  ): Promise<AuditEntry[]> {
    return Array.from(this.logs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getActivityByAction(
    action: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<AuditEntry>> {
    const results = Array.from(this.logs.values())
      .filter(entry => entry.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return this.paginate(results, pagination);
  }

  async getFailedOperations(
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<AuditEntry>> {
    return this.query({ result: 'failure' }, pagination);
  }

  async getComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    byAction: Record<string, number>;
    byResult: Record<string, number>;
    uniqueUsers: number;
    dateRange: { start: Date; end: Date };
  }> {
    const entries = Array.from(this.logs.values())
      .filter(entry => entry.timestamp >= startDate && entry.timestamp <= endDate);

    const byAction: Record<string, number> = {};
    const byResult: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    for (const entry of entries) {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byResult[entry.result] = (byResult[entry.result] || 0) + 1;
      if (entry.userId) {
        uniqueUsers.add(entry.userId);
      }
    }

    return {
      totalOperations: entries.length,
      successfulOperations: entries.filter(e => e.result === 'success').length,
      failedOperations: entries.filter(e => e.result === 'failure').length,
      byAction,
      byResult,
      uniqueUsers: uniqueUsers.size,
      dateRange: { start: startDate, end: endDate }
    };
  }

  async getDataRequestsSummary(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    avgProcessingTime: number;
  }> {
    const entries = Array.from(this.logs.values())
      .filter(entry => entry.action.includes('ERASURE') || entry.action.includes('EXPORT') || entry.action.includes('REQUEST'));

    const erasureRequests = entries.filter(e => e.action.includes('ERASURE'));
    const exportRequests = entries.filter(e => e.action.includes('EXPORT'));

    const byType: Record<string, number> = {
      erasure: erasureRequests.length,
      export: exportRequests.length
    };

    const byStatus: Record<string, number> = {};
    entries.forEach(e => {
      const status = e.details.status as string || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return {
      total: entries.length,
      byType,
      byStatus,
      avgProcessingTime: 0
    };
  }

  async exportLogs(
    format: 'json' | 'csv',
    filters?: AuditQuery
  ): Promise<string> {
    const logs = filters
      ? (await this.query(filters)).data
      : Array.from(this.logs.values());

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    const headers = [
      'id',
      'timestamp',
      'action',
      'userId',
      'requestId',
      'result',
      'ipAddress',
      'details'
    ];

    const rows = logs.map(log =>
      headers.map(h => {
        const value = log[h as keyof AuditEntry];
        if (value === undefined || value === null) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  async cleanup(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    let deletedCount = 0;

    for (const [id, entry] of this.logs.entries()) {
      if (entry.timestamp < cutoffDate) {
        this.logs.delete(id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[AUDIT] Cleaned up ${deletedCount} old audit entries`);
    }

    return deletedCount;
  }

  async getStats(): Promise<{
    totalEntries: number;
    entriesByAction: Record<string, number>;
    entriesByResult: Record<string, number>;
    lastEntryTimestamp: Date | null;
    storageSize: number;
  }> {
    const entries = Array.from(this.logs.values());

    const entriesByAction: Record<string, number> = {};
    const entriesByResult: Record<string, number> = {};

    for (const entry of entries) {
      entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1;
      entriesByResult[entry.result] = (entriesByResult[entry.result] || 0) + 1;
    }

    const sortedEntries = entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const storageSize = Buffer.byteLength(
      JSON.stringify(Array.from(this.logs.values())),
      'utf8'
    );

    return {
      totalEntries: entries.length,
      entriesByAction,
      entriesByResult,
      lastEntryTimestamp: sortedEntries[0]?.timestamp || null,
      storageSize
    };
  }

  private paginate(
    items: AuditEntry[],
    pagination?: PaginationParams
  ): PaginatedResponse<AuditEntry> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private scheduleCleanup(): void {
    const lastCleanup = this.logs.get('_lastCleanup');
    if (!lastCleanup) {
      this.logs.set('_lastCleanup', {} as AuditEntry);
      setInterval(() => this.cleanup(), 24 * 60 * 60 * 1000);
    }
  }
}

export const auditService = new AuditService();
