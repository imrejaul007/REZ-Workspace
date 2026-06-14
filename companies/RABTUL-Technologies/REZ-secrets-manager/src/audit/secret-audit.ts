import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as winston from 'winston';

export type AuditAction =
  | 'secret.created'
  | 'secret.read'
  | 'secret.updated'
  | 'secret.deleted'
  | 'secret.access_attempted'
  | 'key.generated'
  | 'key.rotated'
  | 'key.compromised'
  | 'key.retired'
  | 'policy.created'
  | 'policy.updated'
  | 'policy.deleted'
  | 'access.granted'
  | 'access.denied'
  | 'system.started'
  | 'system.stopped'
  | 'config.changed';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  principal: string;
  resource: string;
  resourceId: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  checksum: string;
  previousChecksum?: string;
}

export interface AuditFilter {
  actions?: AuditAction[];
  principal?: string;
  resource?: string;
  resourceId?: string;
  success?: boolean;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  totalEvents: number;
  successCount: number;
  failureCount: number;
  eventsByAction: Record<string, number>;
  eventsByPrincipal: Record<string, number>;
  recentFailures: AuditEntry[];
  securityAlerts: SecurityAlert[];
}

export interface SecurityAlert {
  id: string;
  type: 'brute_force' | 'anomalous_access' | 'privilege_escalation' | 'key_compromise';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedResource: string;
  detectedAt: Date;
  entries: AuditEntry[];
}

export interface AuditConfig {
  storageBackend: AuditStorageBackend;
  retentionDays: number;
  enableRealTimeAlerts: boolean;
  alertThresholds: AlertThresholds;
  enableIntegrityCheck: boolean;
  compressOldLogs: boolean;
}

export interface AlertThresholds {
  failedAttemptsWindow: number;
  failedAttemptsThreshold: number;
  unusualAccessVolumeThreshold: number;
  afterHoursAccessThreshold: number;
}

export interface AuditStorageBackend {
  save(entry: AuditEntry): Promise<void>;
  saveBatch(entries: AuditEntry[]): Promise<void>;
  query(filter: AuditFilter): Promise<AuditEntry[]>;
  count(filter: AuditFilter): Promise<number>;
  deleteOlderThan(date: Date): Promise<number>;
}

export class SecretAudit {
  private config: AuditConfig;
  private logger: winston.Logger;
  private alertRules: Map<string, AlertRule> = new Map();
  private failedAttempts: Map<string, FailedAttemptTracker> = new Map();
  private alerts: SecurityAlert[] = [];

  constructor(config: AuditConfig) {
    this.config = config;
    this.logger = this.createLogger();
    this.initializeAlertRules();
  }

  private createLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'audit.log' }),
      ],
    });
  }

  private initializeAlertRules(): void {
    this.alertRules.set('failed_login', {
      name: 'failed_login',
      condition: (entries) => {
        const recentFailures = entries.filter(
          (e) =>
            e.action === 'access.denied' &&
            new Date(e.timestamp).getTime() > Date.now() - 300000
        );
        return recentFailures.length >= this.config.alertThresholds.failedAttemptsThreshold;
      },
      severity: 'medium',
    });

    this.alertRules.set('unusual_access', {
      name: 'unusual_access',
      condition: (entries) => {
        const recentAccess = entries.filter(
          (e) =>
            e.action === 'secret.read' &&
            new Date(e.timestamp).getTime() > Date.now() - 3600000
        );
        return (
          recentAccess.length > this.config.alertThresholds.unusualAccessVolumeThreshold
        );
      },
      severity: 'high',
    });
  }

  async log(event: {
    action: AuditAction;
    principal: string;
    resource: string;
    resourceId: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditEntry> {
    const previousEntry = await this.getLastEntry();
    const previousChecksum = previousEntry?.checksum;

    const entry: AuditEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      action: event.action,
      principal: event.principal,
      resource: event.resource,
      resourceId: event.resourceId,
      success: event.success,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: event.metadata || {},
      checksum: '',
      previousChecksum,
    };

    entry.checksum = this.calculateChecksum(entry);

    await this.config.storageBackend.save(entry);

    this.logger.info('Audit event', {
      id: entry.id,
      action: entry.action,
      principal: entry.principal,
      success: entry.success,
    });

    if (this.config.enableRealTimeAlerts) {
      await this.checkAlerts(entry);
    }

    return entry;
  }

  async query(filter: AuditFilter): Promise<AuditEntry[]> {
    return this.config.storageBackend.query(filter);
  }

  async getSummary(since?: Date): Promise<AuditSummary> {
    const filter: AuditFilter = {
      since: since || new Date(Date.now() - 24 * 60 * 60 * 1000),
      limit: 10000,
    };

    const entries = await this.query(filter);

    const eventsByAction: Record<string, number> = {};
    const eventsByPrincipal: Record<string, number> = {};
    let successCount = 0;
    let failureCount = 0;
    const recentFailures: AuditEntry[] = [];

    for (const entry of entries) {
      eventsByAction[entry.action] = (eventsByAction[entry.action] || 0) + 1;
      eventsByPrincipal[entry.principal] =
        (eventsByPrincipal[entry.principal] || 0) + 1;

      if (entry.success) {
        successCount++;
      } else {
        failureCount++;
        if (recentFailures.length < 10) {
          recentFailures.push(entry);
        }
      }
    }

    const securityAlerts = await this.detectSecurityAlerts(entries);

    return {
      totalEvents: entries.length,
      successCount,
      failureCount,
      eventsByAction,
      eventsByPrincipal,
      recentFailures,
      securityAlerts,
    };
  }

  async verifyIntegrity(entryId: string): Promise<{
    valid: boolean;
    chainValid: boolean;
    error?: string;
  }> {
    const filter: AuditFilter = { limit: 10000 };
    const entries = await this.query(filter);

    const sortedEntries = entries.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let previousChecksum: string | undefined;

    for (const entry of sortedEntries) {
      if (entry.previousChecksum !== previousChecksum) {
        return {
          valid: false,
          chainValid: false,
          error: `Chain broken at entry ${entry.id}`,
        };
      }

      const calculatedChecksum = this.calculateChecksum(entry);
      if (calculatedChecksum !== entry.checksum) {
        return {
          valid: false,
          chainValid: false,
          error: `Checksum mismatch for entry ${entry.id}`,
        };
      }

      previousChecksum = entry.checksum;
    }

    const targetEntry = entries.find((e) => e.id === entryId);
    if (!targetEntry) {
      return {
        valid: false,
        chainValid: true,
        error: `Entry ${entryId} not found`,
      };
    }

    return {
      valid: true,
      chainValid: true,
    };
  }

  async cleanup(): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000
    );

    const deleted = await this.config.storageBackend.deleteOlderThan(cutoffDate);
    this.logger.info(`Cleaned up ${deleted} audit entries older than ${cutoffDate}`);

    return deleted;
  }

  async exportLogs(options: {
    format: 'json' | 'csv';
    since?: Date;
    until?: Date;
    filter?: AuditFilter;
  }): Promise<string> {
    const filter: AuditFilter = {
      since: options.since,
      until: options.until,
      ...options.filter,
      limit: 100000,
    };

    const entries = await this.query(filter);

    if (options.format === 'json') {
      return JSON.stringify(entries, null, 2);
    }

    return this.entriesToCsv(entries);
  }

  private async getLastEntry(): Promise<AuditEntry | null> {
    const entries = await this.query({ limit: 1 });
    return entries[0] || null;
  }

  private calculateChecksum(entry: AuditEntry): string {
    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      action: entry.action,
      principal: entry.principal,
      resource: entry.resource,
      resourceId: entry.resourceId,
      success: entry.success,
      metadata: entry.metadata,
      previousChecksum: entry.previousChecksum,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async checkAlerts(entry: AuditEntry): Promise<void> {
    if (!entry.success && entry.action === 'access.denied') {
      this.trackFailedAttempt(entry);
    }

    for (const [, rule] of this.alertRules) {
      const recentEntries = await this.query({
        principal: entry.principal,
        since: new Date(Date.now() - 3600000),
        limit: 1000,
      });

      if (rule.condition(recentEntries)) {
        await this.generateAlert(rule, entry);
      }
    }
  }

  private trackFailedAttempt(entry: AuditEntry): void {
    const key = `${entry.principal}:${entry.resourceId}`;

    if (!this.failedAttempts.has(key)) {
      this.failedAttempts.set(key, {
        count: 0,
        firstAttempt: new Date(),
        entries: [],
      });
    }

    const tracker = this.failedAttempts.get(key)!;
    tracker.count++;
    tracker.entries.push(entry);

    if (tracker.count >= this.config.alertThresholds.failedAttemptsThreshold) {
      this.alerts.push({
        id: uuidv4(),
        type: 'brute_force',
        severity: 'high',
        description: `Multiple failed access attempts for ${entry.resourceId}`,
        affectedResource: entry.resourceId,
        detectedAt: new Date(),
        entries: tracker.entries,
      });

      this.failedAttempts.delete(key);
    }
  }

  private async detectSecurityAlerts(entries: AuditEntry[]): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    const failedByPrincipal = new Map<string, number>();
    for (const entry of entries) {
      if (!entry.success) {
        failedByPrincipal.set(
          entry.principal,
          (failedByPrincipal.get(entry.principal) || 0) + 1
        );
      }
    }

    for (const [principal, count] of failedByPrincipal) {
      if (count >= this.config.alertThresholds.failedAttemptsThreshold) {
        alerts.push({
          id: uuidv4(),
          type: 'brute_force',
          severity: 'high',
          description: `Brute force detected for principal ${principal}`,
          affectedResource: 'auth',
          detectedAt: new Date(),
          entries: entries.filter(
            (e) => e.principal === principal && e.action === 'access.denied'
          ),
        });
      }
    }

    const afterHoursEntries = entries.filter((e) => {
      const hour = new Date(e.timestamp).getHours();
      return hour < 6 || hour > 22;
    });

    if (afterHoursEntries.length > this.config.alertThresholds.afterHoursAccessThreshold) {
      alerts.push({
        id: uuidv4(),
        type: 'anomalous_access',
        severity: 'medium',
        description: 'Unusual after-hours access pattern detected',
        affectedResource: 'secrets',
        detectedAt: new Date(),
        entries: afterHoursEntries,
      });
    }

    return alerts;
  }

  private async generateAlert(rule: AlertRule, entry: AuditEntry): Promise<void> {
    const alert: SecurityAlert = {
      id: uuidv4(),
      type: 'anomalous_access',
      severity: rule.severity,
      description: `Alert triggered by rule: ${rule.name}`,
      affectedResource: entry.resourceId,
      detectedAt: new Date(),
      entries: [entry],
    };

    this.alerts.push(alert);
    this.logger.warn('Security alert generated', alert);
  }

  private entriesToCsv(entries: AuditEntry[]): string {
    const headers = [
      'id',
      'timestamp',
      'action',
      'principal',
      'resource',
      'resourceId',
      'success',
      'ipAddress',
    ];

    const rows = entries.map((e) =>
      [
        e.id,
        e.timestamp.toISOString(),
        e.action,
        e.principal,
        e.resource,
        e.resourceId,
        e.success,
        e.ipAddress || '',
      ].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  getAlerts(filter?: {
    severity?: SecurityAlert['severity'];
    type?: SecurityAlert['type'];
    since?: Date;
  }): SecurityAlert[] {
    let result = [...this.alerts];

    if (filter?.severity) {
      result = result.filter((a) => a.severity === filter.severity);
    }
    if (filter?.type) {
      result = result.filter((a) => a.type === filter.type);
    }
    if (filter?.since) {
      result = result.filter(
        (a) => new Date(a.detectedAt).getTime() > filter.since!.getTime()
      );
    }

    return result.sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.metadata = { ...alert.metadata, acknowledgedBy, acknowledgedAt: new Date() };
      return true;
    }
    return false;
  }
}

interface AlertRule {
  name: string;
  condition: (entries: AuditEntry[]) => boolean;
  severity: SecurityAlert['severity'];
}

interface FailedAttemptTracker {
  count: number;
  firstAttempt: Date;
  entries: AuditEntry[];
}

export class InMemoryAuditStorage implements AuditStorageBackend {
  private entries: AuditEntry[] = [];

  async save(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }

  async saveBatch(entries: AuditEntry[]): Promise<void> {
    this.entries.push(...entries);
  }

  async query(filter: AuditFilter): Promise<AuditEntry[]> {
    let result = [...this.entries];

    if (filter.actions?.length) {
      result = result.filter((e) => filter.actions!.includes(e.action));
    }
    if (filter.principal) {
      result = result.filter((e) => e.principal === filter.principal);
    }
    if (filter.resource) {
      result = result.filter((e) => e.resource === filter.resource);
    }
    if (filter.resourceId) {
      result = result.filter((e) => e.resourceId === filter.resourceId);
    }
    if (filter.success !== undefined) {
      result = result.filter((e) => e.success === filter.success);
    }
    if (filter.since) {
      result = result.filter(
        (e) => new Date(e.timestamp).getTime() >= filter.since!.getTime()
      );
    }
    if (filter.until) {
      result = result.filter(
        (e) => new Date(e.timestamp).getTime() <= filter.until!.getTime()
      );
    }

    result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (filter.offset) {
      result = result.slice(filter.offset);
    }
    if (filter.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  async count(filter: AuditFilter): Promise<number> {
    const results = await this.query({ ...filter, limit: undefined, offset: undefined });
    return results.length;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const initialCount = this.entries.length;
    this.entries = this.entries.filter(
      (e) => new Date(e.timestamp).getTime() > date.getTime()
    );
    return initialCount - this.entries.length;
  }
}
