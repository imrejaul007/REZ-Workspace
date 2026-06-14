import { Alert, IAlert } from '../models/MetricSnapshot.js';
import winston from 'winston';
import {
  AlertSeverity,
  AlertStatus,
  IServiceHealth,
  IServiceErrorRate,
  LatencyMetrics
} from '../models/MetricSnapshot.js';
import { v4 as uuidv4 } from 'uuid';

// Generate UUID without external dependency (simple implementation)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface AlertThresholds {
  errorRate: number;
  latencyAvg: number;
  latencyP95: number;
  cacheMissRate: number;
}

interface AlertServiceConfig {
  errorRateThreshold: number;
  latencyThresholdMs: number;
  cacheMissThreshold: number;
  checkIntervalMs: number;
  retentionDays: number;
}

interface AlertRule {
  type: string;
  severity: AlertSeverity;
  check: (context: AlertContext) => boolean;
  messageBuilder: (context: AlertContext) => string;
}

interface AlertContext {
  services: IServiceHealth[];
  errorRates: IServiceErrorRate[];
  latencyMetrics: LatencyMetrics;
  cacheHitRate: number;
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

class AlertService {
  private thresholds: AlertThresholds;
  private checkInterval: NodeJS.Timeout | null = null;
  private intervalMs: number;
  private retentionDays: number;
  private activeAlerts: Map<string, IAlert> = new Map();
  private alertCheckCallback: ((context: AlertContext) => Promise<void>) | null = null;
  private isRunning: boolean = false;

  constructor(config: AlertServiceConfig) {
    this.thresholds = {
      errorRate: config.errorRateThreshold,
      latencyAvg: config.latencyThresholdMs,
      latencyP95: config.latencyThresholdMs * 2, // P95 can be 2x avg threshold
      cacheMissRate: config.cacheMissThreshold
    };
    this.intervalMs = config.checkIntervalMs;
    this.retentionDays = config.retentionDays;
  }

  // Set callback for alert checks
  setAlertCheckCallback(callback: (context: AlertContext) => Promise<void>): void {
    this.alertCheckCallback = callback;
  }

  // Start periodic alert checks
  start(): void {
    if (this.isRunning) {
      logger.warn('AlertService is already running');
      return;
    }

    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.performAlertCheck().catch(error => {
        logger.error('Error in alert check cycle:', error);
      });
    }, this.intervalMs);

    logger.info(`AlertService started with ${this.intervalMs}ms interval`);
  }

  // Stop periodic checks
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    logger.info('AlertService stopped');
  }

  // Generate alert ID
  private generateAlertId(type: string, service?: string): string {
    const base = service ? `${type}:${service}` : type;
    const timestamp = Date.now();
    return `${base}:${timestamp}`;
  }

  // Check if similar alert already exists
  private async findExistingAlert(type: string, service?: string): Promise<IAlert | null> {
    const query: Record<string, unknown> = { type, status: 'active' };
    if (service) {
      query.service = service;
    }
    return await Alert.findOne(query);
  }

  // Create new alert
  async createAlert(
    type: string,
    message: string,
    severity: AlertSeverity,
    service?: string,
    details?: Record<string, unknown>
  ): Promise<IAlert> {
    const alertId = this.generateAlertId(type, service);

    const alert: IAlert = {
      id: alertId,
      type,
      severity,
      status: 'active',
      service,
      message,
      details: details || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    await Alert.create(alert);

    // Track in memory
    this.activeAlerts.set(alertId, alert);

    logger.warn(`Alert created: [${severity}] ${type}${service ? ` (${service})` : ''} - ${message}`);

    return alert;
  }

  // Resolve alert
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = await Alert.findOne({ id: alertId, status: 'active' });
    if (!alert) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.updatedAt = new Date();
    await alert.save();

    this.activeAlerts.delete(alertId);

    logger.info(`Alert resolved: ${alertId}`);

    return true;
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = await Alert.findOne({ id: alertId, status: 'active' });
    if (!alert) {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.updatedAt = new Date();
    await alert.save();

    logger.info(`Alert acknowledged: ${alertId}`);

    return true;
  }

  // Get all active alerts
  async getActiveAlerts(includeAcknowledged: boolean = false): Promise<IAlert[]> {
    const query: Record<string, unknown> = {};
    if (!includeAcknowledged) {
      query.status = 'active';
    } else {
      query.status = { $in: ['active', 'acknowledged'] };
    }

    return await Alert.find(query)
      .sort({ severity: -1, createdAt: -1 });
  }

  // Get alerts by service
  async getAlertsByService(service: string): Promise<IAlert[]> {
    return await Alert.find({ service, status: 'active' })
      .sort({ severity: -1, createdAt: -1 });
  }

  // Get alert by ID
  async getAlertById(alertId: string): Promise<IAlert | null> {
    return await Alert.findOne({ id: alertId });
  }

  // Check for service down alerts
  async checkServiceDown(services: IServiceHealth[]): Promise<void> {
    for (const service of services) {
      if (service.status === 'unhealthy') {
        const existingAlert = await this.findExistingAlert('service_down', service.name);

        if (!existingAlert) {
          await this.createAlert(
            'service_down',
            `Service ${service.name} is unhealthy. Response time: ${service.responseTime}ms. Error: ${service.errorMessage || 'No response'}`,
            'critical',
            service.name,
            {
              responseTime: service.responseTime,
              uptime: service.uptime,
              errorMessage: service.errorMessage
            }
          );
        }
      } else if (service.status === 'healthy' || service.status === 'degraded') {
        // Resolve any existing service_down alert
        const existingAlert = await this.findExistingAlert('service_down', service.name);
        if (existingAlert) {
          await this.resolveAlert(existingAlert.id);
        }
      }
    }
  }

  // Check for high error rate alerts
  async checkErrorRate(errorRates: IServiceErrorRate[]): Promise<void> {
    for (const errorRate of errorRates) {
      if (errorRate.rate > this.thresholds.errorRate) {
        const existingAlert = await this.findExistingAlert('high_error_rate', errorRate.name);

        if (!existingAlert) {
          await this.createAlert(
            'high_error_rate',
            `Service ${errorRate.name} has error rate of ${errorRate.rate}%, exceeding threshold of ${this.thresholds.errorRate}%`,
            'critical',
            errorRate.name,
            {
              errorRate: errorRate.rate,
              threshold: this.thresholds.errorRate,
              errorCount: errorRate.errorCount,
              totalRequests: errorRate.totalRequests
            }
          );
        }
      } else {
        // Resolve any existing high_error_rate alert
        const existingAlert = await this.findExistingAlert('high_error_rate', errorRate.name);
        if (existingAlert) {
          await this.resolveAlert(existingAlert.id);
        }
      }
    }
  }

  // Check for high latency alerts
  async checkLatency(latencyMetrics: LatencyMetrics): Promise<void> {
    // Check average latency
    if (latencyMetrics.avg > this.thresholds.latencyAvg) {
      const existingAlert = await this.findExistingAlert('high_latency_avg');

      if (!existingAlert) {
        await this.createAlert(
          'high_latency_avg',
          `Average decision latency is ${latencyMetrics.avg.toFixed(2)}ms, exceeding threshold of ${this.thresholds.latencyAvg}ms`,
          'warning',
          undefined,
          {
            latency: latencyMetrics.avg,
            threshold: this.thresholds.latencyAvg,
            p50: latencyMetrics.p50,
            p95: latencyMetrics.p95,
            p99: latencyMetrics.p99
          }
        );
      }
    } else {
      const existingAlert = await this.findExistingAlert('high_latency_avg');
      if (existingAlert) {
        await this.resolveAlert(existingAlert.id);
      }
    }

    // Check P95 latency
    if (latencyMetrics.p95 > this.thresholds.latencyP95) {
      const existingAlert = await this.findExistingAlert('high_latency_p95');

      if (!existingAlert) {
        await this.createAlert(
          'high_latency_p95',
          `P95 decision latency is ${latencyMetrics.p95.toFixed(2)}ms, exceeding threshold of ${this.thresholds.latencyP95}ms`,
          'warning',
          undefined,
          {
            latency: latencyMetrics.p95,
            threshold: this.thresholds.latencyP95,
            avg: latencyMetrics.avg,
            p50: latencyMetrics.p50,
            p99: latencyMetrics.p99
          }
        );
      }
    } else {
      const existingAlert = await this.findExistingAlert('high_latency_p95');
      if (existingAlert) {
        await this.resolveAlert(existingAlert.id);
      }
    }
  }

  // Check for high cache miss rate
  async checkCacheMissRate(cacheHitRate: number): Promise<void> {
    const cacheMissRate = 100 - cacheHitRate;

    if (cacheMissRate > this.thresholds.cacheMissRate) {
      const existingAlert = await this.findExistingAlert('high_cache_miss_rate');

      if (!existingAlert) {
        await this.createAlert(
          'high_cache_miss_rate',
          `Cache miss rate is ${cacheMissRate.toFixed(2)}%, exceeding threshold of ${this.thresholds.cacheMissRate}%`,
          'warning',
          undefined,
          {
            cacheMissRate,
            cacheHitRate,
            threshold: this.thresholds.cacheMissRate
          }
        );
      }
    } else {
      const existingAlert = await this.findExistingAlert('high_cache_miss_rate');
      if (existingAlert) {
        await this.resolveAlert(existingAlert.id);
      }
    }
  }

  // Perform all alert checks
  async performAlertCheck(): Promise<void> {
    if (!this.alertCheckCallback) {
      logger.debug('No alert check callback set');
      return;
    }

    try {
      // Get context from callback
      await this.alertCheckCallback({
        services: [],
        errorRates: [],
        latencyMetrics: { avg: 0, p50: 0, p95: 0, p99: 0 },
        cacheHitRate: 100
      });
    } catch (error) {
      logger.error('Error performing alert check:', error);
    }
  }

  // Check alerts with context (called from index.ts)
  async checkAlerts(context: AlertContext): Promise<IAlert[]> {
    const newAlerts: IAlert[] = [];

    // Check service status
    await this.checkServiceDown(context.services);

    // Check error rates
    await this.checkErrorRate(context.errorRates);

    // Check latency
    await this.checkLatency(context.latencyMetrics);

    // Check cache miss rate
    await this.checkCacheMissRate(context.cacheHitRate);

    return newAlerts;
  }

  // Get alert statistics
  async getAlertStats(): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: { critical: number; warning: number; info: number };
    byType: Record<string, number>;
  }> {
    const alerts = await Alert.find({});

    const stats = {
      total: alerts.length,
      active: 0,
      acknowledged: 0,
      resolved: 0,
      bySeverity: { critical: 0, warning: 0, info: 0 },
      byType: {} as Record<string, number>
    };

    for (const alert of alerts) {
      if (alert.status === 'active') stats.active++;
      if (alert.status === 'acknowledged') stats.acknowledged++;
      if (alert.status === 'resolved') stats.resolved++;

      stats.bySeverity[alert.severity]++;
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    }

    return stats;
  }

  // Clean up old alerts
  async cleanupOldAlerts(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const result = await Alert.deleteMany({
      status: 'resolved',
      resolvedAt: { $lt: cutoffDate }
    });

    if (result.deletedCount > 0) {
      logger.info(`Cleaned up ${result.deletedCount} old resolved alerts`);
    }

    return result.deletedCount;
  }
}

// Factory function
export function createAlertService(): AlertService {
  return new AlertService({
    errorRateThreshold: parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD || '5'),
    latencyThresholdMs: parseInt(process.env.ALERT_LATENCY_THRESHOLD_MS || '2000', 10),
    cacheMissThreshold: parseFloat(process.env.ALERT_CACHE_MISS_THRESHOLD || '50'),
    checkIntervalMs: parseInt(process.env.ALERT_CHECK_INTERVAL_MS || '30000', 10),
    retentionDays: parseInt(process.env.ALERT_RETENTION_DAYS || '30', 10)
  });
}

export { AlertService };
export default AlertService;
