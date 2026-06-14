// ============================================================================
// SUTAR Gateway - Load Balancer
// Round-robin, least-connections, weighted, IP hash, and random algorithms
// ============================================================================

import type {
  ServiceInstance,
  LoadBalancerConfig,
  LoadBalancerStats,
  CircuitBreakerState,
} from '../types/index.js';
import { circuitBreakerManager } from './CircuitBreaker.js';

export type LoadBalancingAlgorithm =
  | 'round_robin'
  | 'least_connections'
  | 'weighted'
  | 'ip_hash'
  | 'random';

export interface BalancerTarget {
  serviceId: string;
  url: string;
  weight: number;
  currentConnections: number;
  lastUsed: number;
  healthy: boolean;
}

export class LoadBalancer {
  private algorithm: LoadBalancingAlgorithm;
  private targets: Map<string, BalancerTarget[]> = new Map(); // serviceName -> targets
  private roundRobinCounters: Map<string, number> = new Map(); // serviceName -> counter
  private ipHashIndex: Map<string, string> = new Map(); // ip -> serviceId
  private stats: LoadBalancerStats;
  private config: LoadBalancerConfig;

  constructor(
    algorithm: LoadBalancingAlgorithm = 'round_robin',
    config?: Partial<LoadBalancerConfig>
  ) {
    this.algorithm = algorithm;
    this.config = {
      algorithm,
      healthCheckInterval: config?.healthCheckInterval ?? 30000,
      healthCheckTimeout: config?.healthCheckTimeout ?? 5000,
      healthCheckPath: config?.healthCheckPath ?? '/health',
      maxRetries: config?.maxRetries ?? 3,
      circuitBreakerEnabled: config?.circuitBreakerEnabled ?? true,
    };
    this.stats = {
      algorithm,
      totalRequests: 0,
      activeConnections: 0,
      distribution: {},
    };
  }

  // ---------------------------------------------------------------------------
  // Target Management
  // ---------------------------------------------------------------------------

  addTarget(service: ServiceInstance): void {
    const targets = this.targets.get(service.name) ?? [];
    const existing = targets.find(t => t.serviceId === service.id);

    if (existing) {
      existing.url = `${service.url}:${service.port}`;
      existing.weight = service.weight;
      existing.healthy = service.status === 'healthy' || service.status === 'degraded';
    } else {
      targets.push({
        serviceId: service.id,
        url: `${service.url}:${service.port}`,
        weight: service.weight,
        currentConnections: 0,
        lastUsed: 0,
        healthy: service.status === 'healthy' || service.status === 'degraded',
      });
    }

    this.targets.set(service.name, targets);
    this.updateDistribution();
  }

  removeTarget(serviceId: string, serviceName: string): void {
    const targets = this.targets.get(serviceName);
    if (targets) {
      const index = targets.findIndex(t => t.serviceId === serviceId);
      if (index !== -1) {
        targets.splice(index, 1);
        if (targets.length === 0) {
          this.targets.delete(serviceName);
        }
      }
    }
    this.updateDistribution();
  }

  updateTargetHealth(serviceId: string, serviceName: string, healthy: boolean): void {
    const targets = this.targets.get(serviceName);
    if (targets) {
      const target = targets.find(t => t.serviceId === serviceId);
      if (target) {
        target.healthy = healthy;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Load Balancing Algorithms
  // ---------------------------------------------------------------------------

  selectTarget(serviceName: string, clientIp?: string): BalancerTarget | null {
    const targets = this.targets.get(serviceName);
    if (!targets || targets.length === 0) {
      return null;
    }

    // Filter out unhealthy targets (unless all are unhealthy)
    const healthyTargets = targets.filter(t => t.healthy);
    const targetPool = healthyTargets.length > 0 ? healthyTargets : targets;

    // Check circuit breaker for each target
    const availableTargets = targetPool.filter(t => {
      if (!this.config.circuitBreakerEnabled) return true;
      const state = circuitBreakerManager.getState(t.serviceId);
      return !state || state.state !== 'open';
    });

    const finalPool = availableTargets.length > 0 ? availableTargets : targetPool;

    switch (this.algorithm) {
      case 'round_robin':
        return this.roundRobinSelect(serviceName, finalPool);
      case 'least_connections':
        return this.leastConnectionsSelect(finalPool);
      case 'weighted':
        return this.weightedSelect(finalPool);
      case 'ip_hash':
        return this.ipHashSelect(serviceName, clientIp ?? 'unknown', finalPool);
      case 'random':
        return this.randomSelect(finalPool);
      default:
        return this.roundRobinSelect(serviceName, finalPool);
    }
  }

  private roundRobinSelect(serviceName: string, targets: BalancerTarget[]): BalancerTarget {
    if (targets.length === 1) {
      return targets[0];
    }

    let counter = this.roundRobinCounters.get(serviceName) ?? 0;
    counter = (counter + 1) % targets.length;
    this.roundRobinCounters.set(serviceName, counter);

    return targets[counter];
  }

  private leastConnectionsSelect(targets: BalancerTarget[]): BalancerTarget {
    return targets.reduce((min, target) =>
      target.currentConnections < min.currentConnections ? target : min
    );
  }

  private weightedSelect(targets: BalancerTarget[]): BalancerTarget {
    const totalWeight = targets.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const target of targets) {
      random -= target.weight;
      if (random <= 0) {
        return target;
      }
    }

    return targets[targets.length - 1];
  }

  private ipHashSelect(
    serviceName: string,
    clientIp: string,
    targets: BalancerTarget[]
  ): BalancerTarget {
    if (targets.length === 1) {
      return targets[0];
    }

    // Check if we have a cached mapping for this IP
    const cachedServiceId = this.ipHashIndex.get(clientIp);
    if (cachedServiceId) {
      const cached = targets.find(t => t.serviceId === cachedServiceId);
      if (cached) {
        return cached;
      }
    }

    // Generate new hash
    const hash = this.hashString(clientIp + serviceName);
    const index = hash % targets.length;
    const selected = targets[index];

    // Cache the mapping
    this.ipHashIndex.set(clientIp, selected.serviceId);

    return selected;
  }

  private randomSelect(targets: BalancerTarget[]): BalancerTarget {
    const index = Math.floor(Math.random() * targets.length);
    return targets[index];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  acquireConnection(serviceName: string, clientIp?: string): BalancerTarget | null {
    const target = this.selectTarget(serviceName, clientIp);
    if (target) {
      target.currentConnections++;
      this.stats.activeConnections++;
    }
    return target;
  }

  releaseConnection(serviceId: string, serviceName: string): void {
    const targets = this.targets.get(serviceName);
    if (targets) {
      const target = targets.find(t => t.serviceId === serviceId);
      if (target && target.currentConnections > 0) {
        target.currentConnections--;
        this.stats.activeConnections--;
      }
    }
  }

  recordRequest(serviceId: string, serviceName: string, success: boolean): void {
    this.stats.totalRequests++;

    const targets = this.targets.get(serviceName);
    if (targets) {
      const target = targets.find(t => t.serviceId === serviceId);
      if (target) {
        target.lastUsed = Date.now();
      }
    }

    // Update distribution stats
    const current = this.stats.distribution[serviceName] ?? 0;
    this.stats.distribution[serviceName] = current + 1;
  }

  // ---------------------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------------------

  async performHealthCheck(
    serviceName: string,
    healthCheckPath?: string
  ): Promise<void> {
    const targets = this.targets.get(serviceName);
    if (!targets) return;

    const path = healthCheckPath ?? this.config.healthCheckPath;

    for (const target of targets) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.healthCheckTimeout);

        const response = await fetch(`${target.url}${path}`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeout);
        target.healthy = response.ok;
      } catch {
        target.healthy = false;
      }
    }

    this.updateDistribution();
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  setAlgorithm(algorithm: LoadBalancingAlgorithm): void {
    this.algorithm = algorithm;
    this.stats.algorithm = algorithm;
  }

  getAlgorithm(): LoadBalancingAlgorithm {
    return this.algorithm;
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  getStats(): LoadBalancerStats {
    return {
      ...this.stats,
      distribution: { ...this.stats.distribution },
    };
  }

  getTargetStats(serviceName: string): BalancerTarget[] | null {
    const targets = this.targets.get(serviceName);
    return targets ? [...targets] : null;
  }

  private updateDistribution(): void {
    this.stats.distribution = {};
    for (const [name, targets] of this.targets) {
      this.stats.distribution[name] = targets.length;
    }
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  clearTargets(serviceName: string): void {
    this.targets.delete(serviceName);
    this.roundRobinCounters.delete(serviceName);
    this.updateDistribution();
  }

  reset(): void {
    this.targets.clear();
    this.roundRobinCounters.clear();
    this.ipHashIndex.clear();
    this.stats = {
      algorithm: this.algorithm,
      totalRequests: 0,
      activeConnections: 0,
      distribution: {},
    };
  }
}

// Singleton instance
export const loadBalancer = new LoadBalancer('round_robin');

// Helper function to select a target for proxying
export function selectTarget(
  serviceName: string,
  clientIp?: string
): { url: string; serviceId: string } | null {
  const target = loadBalancer.acquireConnection(serviceName, clientIp);
  if (!target) return null;

  return {
    url: target.url,
    serviceId: target.serviceId,
  };
}

// Helper function to release a connection after proxying
export function releaseTarget(serviceId: string, serviceName: string): void {
  loadBalancer.releaseConnection(serviceId, serviceName);
}

// Helper function to record request outcome
export function recordRequestOutcome(
  serviceId: string,
  serviceName: string,
  success: boolean
): void {
  loadBalancer.recordRequest(serviceId, serviceName, success);
}
