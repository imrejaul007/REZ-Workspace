import { Router, Request, Response, NextFunction } from 'express';
import { MetricSnapshot } from '../models/MetricSnapshot.js';
import { performHealthCheck } from '../services/healthCheck.js';
import { MetricsCollector } from '../services/metricsCollector.js';
import { AlertService } from '../services/alertService.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

interface MonitoringDependencies {
  metricsCollector: MetricsCollector;
  alertService: AlertService;
}

// Error handling wrapper
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function createMonitoringRoutes(deps: MonitoringDependencies): Router {
  const router = Router();
  const { metricsCollector, alertService } = deps;

  // GET /health - Aggregated health check
  router.get('/health', asyncHandler(async (req: Request, res: Response) => {
    const health = await performHealthCheck();

    const response = {
      status: health.overallStatus,
      timestamp: health.timestamp,
      services: health.services.map(s => ({
        name: s.name,
        status: s.status,
        responseTime: s.responseTime,
        uptime: s.uptime.toFixed(2) + '%',
        lastChecked: s.lastChecked
      })),
      summary: {
        total: health.services.length,
        healthy: health.services.filter(s => s.status === 'healthy').length,
        degraded: health.services.filter(s => s.status === 'degraded').length,
        unhealthy: health.services.filter(s => s.status === 'unhealthy').length
      }
    };

    const statusCode = health.overallStatus === 'healthy' ? 200 :
                       health.overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json(response);
  }));

  // GET /metrics - Current metrics
  router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
    const metrics = await metricsCollector.collectMetrics();

    res.json({
      timestamp: new Date(),
      metrics: {
        eventsProcessedPerSecond: metrics.eventsProcessedPerSecond,
        decisionLatency: {
          avg: metrics.decisionLatency.avg.toFixed(2) + 'ms',
          p50: metrics.decisionLatency.p50.toFixed(2) + 'ms',
          p95: metrics.decisionLatency.p95.toFixed(2) + 'ms',
          p99: metrics.decisionLatency.p99.toFixed(2) + 'ms'
        },
        errorRates: metrics.errorRates,
        overallErrorRate: metrics.overallErrorRate.toFixed(2) + '%',
        profileCacheHitRate: metrics.profileCacheHitRate.toFixed(2) + '%',
        tierUpgradeRate: metrics.tierUpgradeRate,
        streakMaintenanceRate: metrics.streakMaintenanceRate,
        badgeUnlockRate: metrics.badgeUnlockRate,
        scoreDistribution: metrics.scoreDistribution
      }
    });
  }));

  // GET /metrics/history - Historical metrics
  router.get('/metrics/history', asyncHandler(async (req: Request, res: Response) => {
    const hours = parseInt(req.query.hours as string || '24', 10);
    const limit = parseInt(req.query.limit as string || '100', 10);

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const snapshots = await MetricSnapshot.find({
      timestamp: { $gte: startTime, $lte: endTime }
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('timestamp metrics summary');

    const history = snapshots.map(s => ({
      timestamp: s.timestamp,
      eventsProcessedPerSecond: s.metrics.eventsProcessedPerSecond,
      decisionLatency: s.metrics.decisionLatency,
      overallErrorRate: s.metrics.overallErrorRate,
      profileCacheHitRate: s.metrics.profileCacheHitRate,
      tierUpgradeRate: s.metrics.tierUpgradeRate,
      scoreDistribution: s.metrics.scoreDistribution,
      summary: s.summary
    }));

    res.json({
      startTime,
      endTime,
      hours,
      count: history.length,
      history
    });
  }));

  // GET /alerts - Active alerts
  router.get('/alerts', asyncHandler(async (req: Request, res: Response) => {
    const includeAcknowledged = req.query.includeAcknowledged === 'true';
    const service = req.query.service as string | undefined;

    let alerts;
    if (service) {
      alerts = await alertService.getAlertsByService(service);
    } else {
      alerts = await alertService.getActiveAlerts(includeAcknowledged);
    }

    const stats = await alertService.getAlertStats();

    res.json({
      timestamp: new Date(),
      activeCount: stats.active,
      acknowledgedCount: stats.acknowledged,
      alerts: alerts.map(a => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        status: a.status,
        service: a.service,
        message: a.message,
        threshold: a.threshold,
        currentValue: a.currentValue,
        createdAt: a.createdAt,
        acknowledgedAt: a.acknowledgedAt,
        resolvedAt: a.resolvedAt
      })),
      stats
    });
  }));

  // GET /alerts/:id - Get specific alert
  router.get('/alerts/:id', asyncHandler(async (req: Request, res: Response) => {
    const alert = await alertService.getAlertById(req.params.id);

    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.json({
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        service: alert.service,
        message: alert.message,
        details: alert.details,
        threshold: alert.threshold,
        currentValue: alert.currentValue,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
        acknowledgedAt: alert.acknowledgedAt,
        resolvedAt: alert.resolvedAt
      }
    });
  }));

  // POST /alerts/:id/acknowledge - Acknowledge an alert
  router.post('/alerts/:id/acknowledge', asyncHandler(async (req: Request, res: Response) => {
    const success = await alertService.acknowledgeAlert(req.params.id);

    if (!success) {
      res.status(404).json({ error: 'Alert not found or already resolved' });
      return;
    }

    res.json({ success: true, message: 'Alert acknowledged' });
  }));

  // POST /alerts/:id/resolve - Resolve an alert
  router.post('/alerts/:id/resolve', asyncHandler(async (req: Request, res: Response) => {
    const success = await alertService.resolveAlert(req.params.id);

    if (!success) {
      res.status(404).json({ error: 'Alert not found or already resolved' });
      return;
    }

    res.json({ success: true, message: 'Alert resolved' });
  }));

  // GET /dashboard - Summary for monitoring
  router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
    // Get current health
    const health = await performHealthCheck();

    // Get current metrics
    const metrics = await metricsCollector.collectMetrics();

    // Get active alerts
    const activeAlerts = await alertService.getActiveAlerts(false);

    // Get recent history (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSnapshots = await MetricSnapshot.find({
      timestamp: { $gte: oneHourAgo }
    })
      .sort({ timestamp: -1 })
      .limit(60)
      .select('timestamp metrics.summary');

    // Calculate trends
    const trendData = {
      eventsPerSecond: {
        current: metrics.eventsProcessedPerSecond,
        avg: recentSnapshots.length > 0
          ? recentSnapshots.reduce((sum, s) => sum + s.metrics.eventsProcessedPerSecond, 0) / recentSnapshots.length
          : 0
      },
      errorRate: {
        current: metrics.overallErrorRate,
        avg: recentSnapshots.length > 0
          ? recentSnapshots.reduce((sum) => sum + metrics.overallErrorRate, 0) / recentSnapshots.length
          : 0
      },
      latency: {
        current: metrics.decisionLatency.avg,
        avg: recentSnapshots.length > 0
          ? recentSnapshots.reduce((sum) => sum + metrics.decisionLatency.avg, 0) / recentSnapshots.length
          : 0
      }
    };

    res.json({
      timestamp: new Date(),
      overall: {
        status: health.overallStatus,
        healthyServices: health.services.filter(s => s.status === 'healthy').length,
        totalServices: health.services.length
      },
      metrics: {
        eventsProcessedPerSecond: metrics.eventsProcessedPerSecond.toFixed(2),
        decisionLatency: {
          avg: metrics.decisionLatency.avg.toFixed(2) + 'ms',
          p95: metrics.decisionLatency.p95.toFixed(2) + 'ms'
        },
        errorRate: metrics.overallErrorRate.toFixed(2) + '%',
        cacheHitRate: metrics.profileCacheHitRate.toFixed(2) + '%'
      },
      scoreDistribution: {
        labels: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
        data: [
          metrics.scoreDistribution.bronze,
          metrics.scoreDistribution.silver,
          metrics.scoreDistribution.gold,
          metrics.scoreDistribution.platinum,
          metrics.scoreDistribution.diamond
        ]
      },
      alerts: {
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        warning: activeAlerts.filter(a => a.severity === 'warning').length,
        info: activeAlerts.filter(a => a.severity === 'info').length,
        recent: activeAlerts.slice(0, 5).map(a => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          message: a.message,
          createdAt: a.createdAt
        }))
      },
      services: health.services.map(s => ({
        name: s.name,
        status: s.status,
        responseTime: s.responseTime,
        uptime: s.uptime.toFixed(2) + '%'
      })),
      trends: {
        eventsPerSecond: trendData.eventsPerSecond.current > 0
          ? ((trendData.eventsPerSecond.current - trendData.eventsPerSecond.avg) / trendData.eventsPerSecond.avg * 100).toFixed(1) + '%'
          : '0%',
        errorRate: trendData.errorRate.current > 0
          ? ((trendData.errorRate.current - trendData.errorRate.avg) / trendData.errorRate.avg * 100).toFixed(1) + '%'
          : '0%',
        latency: trendData.latency.current > 0
          ? ((trendData.latency.current - trendData.latency.avg) / trendData.latency.avg * 100).toFixed(1) + '%'
          : '0%'
      }
    });
  }));

  // Error handling middleware
  router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Monitoring route error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  return router;
}

export default createMonitoringRoutes;
