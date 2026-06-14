// ============================================================================
// SUTAR Gateway - Health Aggregator
// Aggregate health from all registered services
// ============================================================================

import type {
  ServiceInstance,
  ServiceStatus,
  ServiceHealth,
  AggregatedHealth,
  HealthRecommendation,
  ApiResponse,
} from '../types/index.js';
import { serviceRegistry } from './ServiceRegistry.js';

export interface HealthAggregatorConfig {
  refreshInterval: number;
  scoreWeights: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
  };
  thresholds: {
    criticalScore: number;
    warningScore: number;
  };
}

export interface ServiceHealthSnapshot {
  serviceId: string;
  serviceName: string;
  status: ServiceStatus;
  latency: number;
  uptime: number;
  score: number;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
  }>;
  timestamp: string;
}

export class HealthAggregator {
  private config: HealthAggregatorConfig;
  private snapshots: Map<string, ServiceHealthSnapshot> = new Map();
  private listeners: Set<(event: HealthAggregatorEvent) => void> = new Set();
  private refreshTimer?: NodeJS.Timeout;
  private lastAggregation?: AggregatedHealth;

  constructor(config?: Partial<HealthAggregatorConfig>) {
    this.config = {
      refreshInterval: config?.refreshInterval ?? 30000,
      scoreWeights: {
        healthy: config?.scoreWeights?.healthy ?? 100,
        degraded: config?.scoreWeights?.degraded ?? 70,
        unhealthy: config?.scoreWeights?.unhealthy ?? 30,
        unknown: config?.scoreWeights?.unknown ?? 50,
      },
      thresholds: {
        criticalScore: config?.thresholds?.criticalScore ?? 30,
        warningScore: config?.thresholds?.warningScore ?? 60,
      },
    };

    this.startRefreshTask();
  }

  // ---------------------------------------------------------------------------
  // Health Aggregation
  // ---------------------------------------------------------------------------

  getAggregatedHealth(): ApiResponse<AggregatedHealth> {
    const services = serviceRegistry.getAllServices();
    const healths: ServiceHealth[] = [];
    const snapshots: ServiceHealthSnapshot[] = [];

    // Summary counters
    const summary = {
      total: services.length,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      unknown: 0,
    };

    // Calculate weighted score
    let totalScore = 0;
    let weightedSum = 0;

    for (const service of services) {
      const health: ServiceHealth = {
        status: service.health.status,
        latency: service.health.latency,
        uptime: service.health.uptime,
        lastCheck: service.health.lastCheck,
        checks: service.health.checks,
        score: service.health.score,
      };

      healths.push(health);

      // Update summary
      summary[service.status]++;

      // Calculate weighted score
      const weight = this.config.scoreWeights[service.status];
      totalScore += weight;
      weightedSum += weight * (service.health.score / 100);

      // Create snapshot
      const snapshot: ServiceHealthSnapshot = {
        serviceId: service.id,
        serviceName: service.name,
        status: service.status,
        latency: service.health.latency,
        uptime: service.health.uptime,
        score: service.health.score,
        checks: service.health.checks,
        timestamp: new Date().toISOString(),
      };

      snapshots.push(snapshot);
      this.snapshots.set(service.id, snapshot);
    }

    // Calculate overall score
    const overallScore = totalScore > 0 ? Math.round((weightedSum / totalScore) * 100) : 0;

    // Determine overall status
    let overall: ServiceStatus = 'healthy';
    if (summary.unhealthy > 0) {
      overall = 'unhealthy';
    } else if (summary.degraded > 0) {
      overall = 'degraded';
    } else if (summary.unknown === summary.total) {
      overall = 'unknown';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(services, summary, overallScore);

    const aggregated: AggregatedHealth = {
      timestamp: new Date().toISOString(),
      overall,
      score: overallScore,
      services: healths,
      summary,
      recommendations,
    };

    this.lastAggregation = aggregated;

    this.emit({
      type: 'health_aggregated',
      overall,
      score: overallScore,
      serviceCount: services.length,
      timestamp: new Date().toISOString(),
    });

    return this.successResponse(aggregated);
  }

  // ---------------------------------------------------------------------------
  // Individual Service Health
  // ---------------------------------------------------------------------------

  getServiceHealth(serviceId: string): ApiResponse<ServiceHealth | null> {
    const services = serviceRegistry.getAllServices();
    const service = services.find(s => s.id === serviceId);

    if (!service) {
      return this.successResponse(null);
    }

    return this.successResponse(service.health);
  }

  getServiceHealthByName(serviceName: string): ApiResponse<ServiceHealth[]> {
    const services = serviceRegistry.getAllServices();
    const matching = services.filter(s => s.name === serviceName);

    return this.successResponse(matching.map(s => s.health));
  }

  // ---------------------------------------------------------------------------
  // Health History
  // ---------------------------------------------------------------------------

  getSnapshot(serviceId: string): ApiResponse<ServiceHealthSnapshot | null> {
    const snapshot = this.snapshots.get(serviceId);
    return this.successResponse(snapshot ?? null);
  }

  getAllSnapshots(): ApiResponse<ServiceHealthSnapshot[]> {
    return this.successResponse(Array.from(this.snapshots.values()));
  }

  getSnapshotsByService(serviceName: string): ApiResponse<ServiceHealthSnapshot[]> {
    const snapshots = Array.from(this.snapshots.values())
      .filter(s => s.serviceName === serviceName);
    return this.successResponse(snapshots);
  }

  // ---------------------------------------------------------------------------
  // Recommendations
  // ---------------------------------------------------------------------------

  private generateRecommendations(
    services: ServiceInstance[],
    summary: AggregatedHealth['summary'],
    overallScore: number
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Critical recommendations
    if (overallScore < this.config.thresholds.criticalScore) {
      recommendations.push({
        severity: 'critical',
        service: 'all',
        message: `Overall health score is critically low: ${overallScore}%`,
        action: 'Immediate attention required. Check all service dependencies and connectivity.',
      });
    }

    // Warning recommendations
    if (overallScore < this.config.thresholds.warningScore) {
      recommendations.push({
        severity: 'warning',
        service: 'all',
        message: `Overall health score is below threshold: ${overallScore}%`,
        action: 'Review service health checks and consider scaling or restarting degraded services.',
      });
    }

    // Individual service recommendations
    for (const service of services) {
      if (service.status === 'unhealthy') {
        recommendations.push({
          severity: 'critical',
          service: service.name,
          message: `Service ${service.name} is unhealthy`,
          action: `Check connectivity to ${service.url}:${service.port} and review recent logs.`,
        });
      }

      if (service.status === 'degraded') {
        recommendations.push({
          severity: 'warning',
          service: service.name,
          message: `Service ${service.name} is degraded with ${service.health.score}% health score`,
          action: `Monitor ${service.name} closely. Consider checking resource usage and dependencies.`,
        });
      }

      // Check for stale heartbeats
      const heartbeatAge = Date.now() - new Date(service.lastHeartbeat).getTime();
      if (heartbeatAge > 60000) {
        recommendations.push({
          severity: 'warning',
          service: service.name,
          message: `Service ${service.name} has not sent a heartbeat in ${Math.round(heartbeatAge / 1000)}s`,
          action: 'Verify the service is still running and able to communicate with the gateway.',
        });
      }

      // Check for slow responses
      if (service.health.latency > 5000) {
        recommendations.push({
          severity: 'warning',
          service: service.name,
          message: `Service ${service.name} has high latency: ${service.health.latency}ms`,
          action: 'Investigate potential network issues or service performance degradation.',
        });
      }

      // Check for failed health checks
      const failedChecks = service.health.checks.filter(c => c.status === 'fail');
      if (failedChecks.length > 0) {
        recommendations.push({
          severity: 'critical',
          service: service.name,
          message: `Service ${service.name} has ${failedChecks.length} failed health check(s)`,
          action: `Failed checks: ${failedChecks.map(c => c.name).join(', ')}`,
        });
      }
    }

    // Summary recommendations
    if (summary.unhealthy > summary.total * 0.5) {
      recommendations.push({
        severity: 'critical',
        service: 'all',
        message: `More than 50% of services are unhealthy (${summary.unhealthy}/${summary.total})`,
        action: 'Consider a broader infrastructure issue. Check network connectivity and shared dependencies.',
      });
    }

    return recommendations;
  }

  // ---------------------------------------------------------------------------
  // Refresh Task
  // ---------------------------------------------------------------------------

  private startRefreshTask(): void {
    this.refreshTimer = setInterval(() => {
      this.getAggregatedHealth();
    }, this.config.refreshInterval);
  }

  stopRefreshTask(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  // ---------------------------------------------------------------------------
  // Event System
  // ---------------------------------------------------------------------------

  onEvent(listener: (event: HealthAggregatorEvent) => void): void {
    this.listeners.add(listener);
  }

  offEvent(listener: (event: HealthAggregatorEvent) => void): void {
    this.listeners.delete(listener);
  }

  private emit(event: HealthAggregatorEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[HealthAggregator] Event listener error:', error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  private errorResponse<T>(error: string): ApiResponse<T> {
    return { success: false, error, timestamp: new Date().toISOString() };
  }

  getLastAggregation(): AggregatedHealth | undefined {
    return this.lastAggregation;
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  updateConfig(config: Partial<HealthAggregatorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      scoreWeights: {
        ...this.config.scoreWeights,
        ...(config.scoreWeights ?? {}),
      },
      thresholds: {
        ...this.config.thresholds,
        ...(config.thresholds ?? {}),
      },
    };
  }

  getConfig(): HealthAggregatorConfig {
    return { ...this.config };
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  destroy(): void {
    this.stopRefreshTask();
    this.snapshots.clear();
    this.listeners.clear();
  }
}

// ============================================================================
// Types and Singleton
// ============================================================================

export interface HealthAggregatorEvent {
  type: 'health_aggregated' | 'recommendation_generated';
  overall?: ServiceStatus;
  score?: number;
  serviceCount?: number;
  timestamp: string;
}

export const healthAggregator = new HealthAggregator();
