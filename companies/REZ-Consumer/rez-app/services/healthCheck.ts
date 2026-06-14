// @ts-nocheck
/**
 * Health Check Service
 * Monitor service health and connectivity
 */

import { logger } from '@/utils/logger';
import { retry } from '@/utils/retryWithBackoff';

// ============================================================================
// TYPES
// ============================================================================

export interface HealthStatus {
  healthy: boolean;
  latency: number;
  timestamp: number;
  error?: string;
}

export interface ServiceHealth {
  name: string;
  url: string;
  status: HealthStatus;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  checkedAt: number;
}

// ============================================================================
// SERVICE ENDPOINTS
// ============================================================================

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://rez-api-gateway.onrender.com/api';

const HEALTH_ENDPOINTS: Record<string, string> = {
  api: `${API_BASE}/health`,
  auth: `${process.env.EXPO_PUBLIC_AUTH_SERVICE_URL || API_BASE}/health`,
  wallet: `${process.env.EXPO_PUBLIC_WALLET_SERVICE_URL || API_BASE}/health`,
  payment: `${process.env.EXPO_PUBLIC_PAYMENT_SERVICE_URL || API_BASE}/health`,
  tasteProfile: `${process.env.EXPO_PUBLIC_TASTE_PROFILE_URL || ''}/health`,
  care: `${process.env.EXPO_PUBLIC_CARE_SERVICE_URL || ''}/health`,
  journey: `${process.env.EXPO_PUBLIC_JOURNEY_SERVICE_URL || ''}/health`,
};

// ============================================================================
// HEALTH CHECK SERVICE
// ============================================================================

class HealthCheckService {
  private healthCache: Map<string, HealthStatus> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(health: SystemHealth) => void> = new Set();

  /**
   * Check health of a single service
   */
  async checkService(name: string, url: string): Promise<HealthStatus> {
    if (!url) {
      return {
        healthy: false,
        latency: 0,
        timestamp: Date.now(),
        error: 'URL not configured',
      };
    }

    const start = Date.now();

    try {
      const result = await retry.withRetry(
        async () => {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        },
        {
          maxRetries: 1,
          initialDelay: 0,
          context: `health:${name}`,
        }
      );

      const latency = Date.now() - start;

      return {
        healthy: true,
        latency,
        timestamp: Date.now(),
      };
    } catch (error) {
      const latency = Date.now() - start;

      return {
        healthy: false,
        latency,
        timestamp: Date.now(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check health of all services
   */
  async checkAllServices(): Promise<SystemHealth> {
    const checks = Object.entries(HEALTH_ENDPOINTS).map(async ([name, url]) => {
      const status = await this.checkService(name, url);
      this.healthCache.set(name, status);
      return { name, url, status };
    });

    const services = await Promise.all(checks);

    const healthyCount = services.filter((s) => s.status.healthy).length;
    const totalCount = services.length;

    let overall: SystemHealth['overall'] = 'healthy';
    if (healthyCount === 0) {
      overall = 'unhealthy';
    } else if (healthyCount < totalCount) {
      overall = 'degraded';
    }

    const health: SystemHealth = {
      overall,
      services,
      checkedAt: Date.now(),
    };

    // Notify listeners
    this.listeners.forEach((listener) => listener(health));

    return health;
  }

  /**
   * Get cached health status for a service
   */
  getCachedHealth(name: string): HealthStatus | undefined {
    return this.healthCache.get(name);
  }

  /**
   * Get cached system health
   */
  getCachedSystemHealth(): SystemHealth | undefined {
    const services = Array.from(this.healthCache.entries()).map(
      ([name, status]) => ({
        name,
        url: HEALTH_ENDPOINTS[name] || '',
        status,
      })
    );

    if (services.length === 0) return undefined;

    const healthyCount = services.filter((s) => s.status.healthy).length;
    let overall: SystemHealth['overall'] = 'healthy';
    if (healthyCount === 0) {
      overall = 'unhealthy';
    } else if (healthyCount < services.length) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      checkedAt: Date.now(),
    };
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(intervalMs = 30000): void {
    if (this.checkInterval) return;

    // Initial check
    this.checkAllServices().catch((err) => {
      logger.error('[HealthCheck] Initial check failed', err as Error);
    });

    // Periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllServices().catch((err) => {
        logger.error('[HealthCheck] Periodic check failed', err as Error);
      });
    }, intervalMs);

    logger.debug(`[HealthCheck] Started periodic checks every ${intervalMs}ms`);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.debug('[HealthCheck] Stopped periodic checks');
    }
  }

  /**
   * Add listener for health changes
   */
  addListener(listener: (health: SystemHealth) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check if API is reachable
   */
  async isApiReachable(): Promise<boolean> {
    const status = await this.checkService('api', HEALTH_ENDPOINTS.api);
    return status.healthy;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const healthCheckService = new HealthCheckService();

// ============================================================================
// HOOK
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useHealthCheck(intervalMs = 30000) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await healthCheckService.checkAllServices();
      setHealth(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [refresh, intervalMs]);

  return {
    health,
    loading,
    error,
    refresh,
    isHealthy: health?.overall === 'healthy',
    isDegraded: health?.overall === 'degraded',
    isUnhealthy: health?.overall === 'unhealthy',
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default healthCheckService;
