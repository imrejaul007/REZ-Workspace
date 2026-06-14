import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import {
  AuditEvent,
  AuditEventType,
  AuditActor,
  AuditResource,
  AuditAction,
  AuditQuery,
  AuditSummary,
  ComplianceReport,
  ComplianceFinding,
  AuditLogEntry
} from '../types';

const { combine, timestamp, printf, json, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  return `${timestamp} [${level}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
});

export class AuditLogger {
  private events: AuditEvent[] = [];
  private maxEvents: number;
  private retentionDays: number;

  constructor(maxEvents: number = 100000, retentionDays: number = 90) {
    this.maxEvents = maxEvents;
    this.retentionDays = retentionDays;
  }

  log(event: AuditEvent): void {
    if (!event.id) {
      event.id = uuidv4();
    }
    if (!event.timestamp) {
      event.timestamp = new Date();
    }

    this.events.push(event);

    if (this.events.length > this.maxEvents) {
      this.pruneOldEvents();
    }

    logger.info('Audit event logged', {
      eventId: event.id,
      eventType: event.eventType,
      actorId: event.actor.id,
      resourceType: event.resource.type
    });
  }

  logAuthEvent(
    eventType: AuditEventType,
    actor: AuditActor,
    resource: AuditResource,
    status: 'success' | 'failure',
    metadata?: Record<string, unknown>
  ): void {
    const action: AuditAction = {
      operation: eventType.split('.')[1] || eventType,
      method: 'POST',
      endpoint: `/auth/${eventType.split('.')[1]}`
    };

    this.log({
      id: uuidv4(),
      timestamp: new Date(),
      eventType,
      actor,
      resource,
      action,
      metadata,
      status
    });
  }

  logDataEvent(
    eventType: AuditEventType,
    actor: AuditActor,
    resource: AuditResource,
    action: AuditAction,
    status: 'success' | 'failure',
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      id: uuidv4(),
      timestamp: new Date(),
      eventType,
      actor,
      resource,
      action,
      metadata,
      status
    });
  }

  logSystemEvent(
    eventType: AuditEventType,
    metadata?: Record<string, unknown>
  ): void {
    const systemActor: AuditActor = {
      id: 'system',
      type: 'system',
      name: 'System'
    };

    this.log({
      id: uuidv4(),
      timestamp: new Date(),
      eventType,
      actor: systemActor,
      resource: {
        type: 'system',
        id: 'system'
      },
      action: {
        operation: eventType.split('.')[1] || eventType,
        method: 'SYSTEM'
      },
      metadata,
      status: 'success'
    });
  }

  query(query: AuditQuery): AuditEvent[] {
    let results = [...this.events];

    if (query.startDate) {
      results = results.filter(e => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      results = results.filter(e => e.timestamp <= query.endDate!);
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      results = results.filter(e => query.eventTypes!.includes(e.eventType));
    }

    if (query.actorId) {
      results = results.filter(e => e.actor.id === query.actorId);
    }

    if (query.actorType) {
      results = results.filter(e => e.actor.type === query.actorType);
    }

    if (query.resourceType) {
      results = results.filter(e => e.resource.type === query.resourceType);
    }

    if (query.resourceId) {
      results = results.filter(e => e.resource.id === query.resourceId);
    }

    if (query.action) {
      results = results.filter(e => e.action.operation.includes(query.action!));
    }

    if (query.status) {
      results = results.filter(e => e.status === query.status);
    }

    if (query.correlationId) {
      results = results.filter(e => e.correlationId === query.correlationId);
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const offset = query.offset || 0;
    const limit = query.limit || 100;

    return results.slice(offset, offset + limit);
  }

  getSummary(query: AuditQuery): AuditSummary {
    const events = this.query({ ...query, limit: 100000 });

    const eventsByType: Record<string, number> = {};
    const eventsByActor: Record<string, number> = {};
    const eventsByResource: Record<string, number> = {};
    const timeline: Map<string, number> = new Map();

    let successCount = 0;
    let failureCount = 0;

    events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      eventsByActor[event.actor.id] = (eventsByActor[event.actor.id] || 0) + 1;
      eventsByResource[event.resource.type] = (eventsByResource[event.resource.type] || 0) + 1;

      const dateKey = event.timestamp.toISOString().split('T')[0];
      timeline.set(dateKey, (timeline.get(dateKey) || 0) + 1);

      if (event.status === 'success') {
        successCount++;
      } else {
        failureCount++;
      }
    });

    const timelineArray = Array.from(timeline.entries())
      .map(([date, count]) => ({ timestamp: new Date(date), count }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      totalEvents: events.length,
      successCount,
      failureCount,
      eventsByType,
      eventsByActor,
      eventsByResource,
      timeline: timelineArray
    };
  }

  generateComplianceReport(
    framework: ComplianceReport['framework'],
    startDate: Date,
    endDate: Date
  ): ComplianceReport {
    const events = this.query({ startDate, endDate, limit: 100000 });
    const findings: ComplianceFinding[] = [];

    const policyViolations = events.filter(e =>
      e.eventType.includes('access_denied') ||
      e.status === 'failure' && e.eventType.includes('auth')
    ).length;

    const accessDenials = events.filter(e =>
      e.eventType === 'authz.access_denied'
    ).length;

    const dataExports = events.filter(e =>
      e.eventType === 'data.export' ||
      e.eventType === 'compliance.export'
    ).length;

    if (accessDenials > 10) {
      findings.push({
        id: uuidv4(),
        severity: 'medium',
        category: 'Access Control',
        description: `High number of access denial events: ${accessDenials}`,
        affectedEvents: events
          .filter(e => e.eventType === 'authz.access_denied')
          .slice(0, 5)
          .map(e => e.id),
        recommendation: 'Review access control policies and user permissions'
      });
    }

    if (dataExports > 50) {
      findings.push({
        id: uuidv4(),
        severity: 'low',
        category: 'Data Handling',
        description: `Multiple data export events detected: ${dataExports}`,
        affectedEvents: events
          .filter(e => e.eventType.includes('export'))
          .slice(0, 5)
          .map(e => e.id),
        recommendation: 'Ensure all data exports are authorized and logged'
      });
    }

    return {
      id: uuidv4(),
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      framework,
      summary: {
        totalEvents: events.length,
        policyViolations,
        accessDenials,
        dataExports
      },
      findings
    };
  }

  getEventById(id: string): AuditEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  getRecentEvents(limit: number = 10): AuditEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getEventsForUser(userId: string, limit: number = 100): AuditEvent[] {
    return this.query({ actorId: userId, limit });
  }

  getEventsForResource(resourceType: string, resourceId: string): AuditEvent[] {
    return this.query({ resourceType, resourceId, limit: 1000 });
  }

  private pruneOldEvents(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    this.events = this.events.filter(e => e.timestamp >= cutoffDate);
  }

  clearAllEvents(): void {
    this.events = [];
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

export const auditLogger = new AuditLogger();
export { logger };
