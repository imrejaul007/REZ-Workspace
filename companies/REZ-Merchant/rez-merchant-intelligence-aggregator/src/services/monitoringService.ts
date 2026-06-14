/**
 * Monitoring Service
 * Tracks aggregation health, data quality, and alerts
 */

import { MerchantData } from '../models/MerchantData';
import { AggregatedMetrics } from '../models/AggregatedData';
import { logger } from '../config/logger';
import { getRedis } from '../config/redis';

export interface MonitoringMetrics {
  totalMerchants: number;
  optedInMerchants: number;
  aggregatedLocalities: number;
  lastAggregationTime: Date | null;
  dataFreshnessHours: number;
  avgAggregationLatencyMs: number;
  errorCount24h: number;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

export class MonitoringService {
  private redis = getRedis();

  /**
   * Get comprehensive monitoring metrics
   */
  async getMetrics(): Promise<MonitoringMetrics> {
    const [merchants, aggregatedMetrics, lastAggregation, errors] = await Promise.all([
      this.getMerchantStats(),
      this.getAggregatedStats(),
      this.getLastAggregationTime(),
      this.getErrorCount()
    ]);

    const alerts = await this.checkAlerts(merchants, aggregatedMetrics);

    return {
      totalMerchants: merchants.total,
      optedInMerchants: merchants.optedIn,
      aggregatedLocalities: aggregatedMetrics,
      lastAggregationTime: lastAggregation,
      dataFreshnessHours: lastAggregation
        ? (Date.now() - lastAggregation.getTime()) / (1000 * 60 * 60)
        : 999,
      avgAggregationLatencyMs: 0, // TODO: Track this
      errorCount24h: errors,
      alerts
    };
  }

  /**
   * Get merchant statistics
   */
  private async getMerchantStats(): Promise<{ total: number; optedIn: number }> {
    const [total, optedIn] = await Promise.all([
      MerchantData.countDocuments(),
      MerchantData.countDocuments({ dataSharingConsent: true })
    ]);
    return { total, optedIn };
  }

  /**
   * Get aggregated metrics count
   */
  private async getAggregatedStats(): Promise<number> {
    return AggregatedMetrics.countDocuments();
  }

  /**
   * Get last aggregation time
   */
  private async getLastAggregationTime(): Promise<Date | null> {
    const latest = await AggregatedMetrics.findOne()
      .sort({ updatedAt: -1 })
      .select('updatedAt')
      .lean();
    return latest?.updatedAt || null;
  }

  /**
   * Get error count from Redis
   */
  private async getErrorCount(): Promise<number> {
    const count = await this.redis.get('monitoring:errors:24h');
    return parseInt(count || '0');
  }

  /**
   * Check for alerts
   */
  private async checkAlerts(
    merchants: { total: number; optedIn: number },
    aggregatedLocalities: number
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Check merchant participation
    if (merchants.total > 0 && merchants.optedIn < 3) {
      alerts.push({
        id: 'low-participation',
        type: 'warning',
        message: 'Less than 3 merchants opted in. Aggregation requires minimum 3 merchants.',
        timestamp: new Date()
      });
    }

    // Check data freshness
    const latest = await this.getLastAggregationTime();
    if (latest) {
      const hoursSinceUpdate = (Date.now() - latest.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate > 24) {
        alerts.push({
          id: 'stale-data',
          type: 'error',
          message: `Data has not been updated in ${Math.round(hoursSinceUpdate)} hours.`,
          timestamp: new Date()
        });
      }
    }

    // Check coverage
    if (aggregatedLocalities === 0 && merchants.optedIn >= 3) {
      alerts.push({
        id: 'no-aggregation',
        type: 'error',
        message: 'Merchants are opted in but no aggregation has occurred.',
        timestamp: new Date()
      });
    }

    return alerts;
  }

  /**
   * Record an error for monitoring
   */
  async recordError(error: string): Promise<void> {
    const key = `monitoring:error:${Date.now()}`;
    await this.redis.setex(key, 86400, error); // 24h TTL

    const countKey = 'monitoring:errors:24h';
    await this.redis.incr(countKey);
    await this.redis.expire(countKey, 86400);
  }

  /**
   * Get health score (0-100)
   */
  async getHealthScore(): Promise<number> {
    const metrics = await this.getMetrics();

    let score = 100;

    // Deduct for low participation
    if (metrics.optedInMerchants < 10) {
      score -= 20;
    } else if (metrics.optedInMerchants < 50) {
      score -= 10;
    }

    // Deduct for stale data
    if (metrics.dataFreshnessHours > 24) {
      score -= 30;
    } else if (metrics.dataFreshnessHours > 6) {
      score -= 10;
    }

    // Deduct for errors
    if (metrics.errorCount24h > 10) {
      score -= 20;
    } else if (metrics.errorCount24h > 0) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}

// Singleton
export const monitoringService = new MonitoringService();
