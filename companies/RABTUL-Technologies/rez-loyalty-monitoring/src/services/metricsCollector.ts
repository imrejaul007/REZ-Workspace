import Redis from 'ioredis';
import { MetricSnapshot } from '../models/MetricSnapshot.js';
import winston from 'winston';
import {
  LatencyMetrics,
  ScoreDistribution,
  IServiceErrorRate
} from '../models/MetricSnapshot.js';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

interface MetricsCollectorConfig {
  redis: Redis;
  collectionIntervalMs: number;
  historyRetentionDays: number;
}

// Redis key prefixes
const KEYS = {
  EVENTS_PROCESSED: 'events:processed',
  EVENTS_PREVIOUS_COUNT: 'events:previous_count',
  DECISION_LATENCY: 'latency:decision',
  ERROR_COUNT: 'errors:count',
  REQUEST_COUNT: 'requests:count',
  CACHE_HITS: 'cache:hits',
  CACHE_MISSES: 'cache:misses',
  TIER_UPGRADES: 'tier:upgrades',
  STREAK_MAINTENANCE: 'streak:maintained',
  BADGE_UNLOCKS: 'badges:unlocked',
  SCORE_BRONZE: 'score:bronze',
  SCORE_SILVER: 'score:silver',
  SCORE_GOLD: 'score:gold',
  SCORE_PLATINUM: 'score:platinum',
  SCORE_DIAMOND: 'score:diamond',
  LATENCY_AVG: 'latency:avg',
  LATENCY_P50: 'latency:p50',
  LATENCY_P95: 'latency:p95',
  LATENCY_P99: 'latency:p99'
};

// Service names for error tracking
const SERVICES = [
  'profile-aggregator',
  'streak-service',
  'cross-merchant',
  'score-service',
  'karma-bridge'
];

class MetricsCollector {
  private redis: Redis;
  private collectionInterval: NodeJS.Timeout | null = null;
  private intervalMs: number;
  private retentionDays: number;
  private lastEventsCount: number = 0;
  private isRunning: boolean = false;

  constructor(config: MetricsCollectorConfig) {
    this.redis = config.redis;
    this.intervalMs = config.collectionIntervalMs;
    this.retentionDays = config.historyRetentionDays;
  }

  // Initialize Redis with default values if needed
  async initialize(): Promise<void> {
    try {
      // Check Redis connection
      await this.redis.ping();

      // Initialize counters if they don't exist
      const exists = await this.redis.exists(KEYS.EVENTS_PROCESSED);
      if (!exists) {
        await this.redis.set(KEYS.EVENTS_PROCESSED, 0);
      }

      // Initialize score distribution counters
      const scoreKeys = [
        KEYS.SCORE_BRONZE, KEYS.SCORE_SILVER, KEYS.SCORE_GOLD,
        KEYS.SCORE_PLATINUM, KEYS.SCORE_DIAMOND
      ];
      for (const key of scoreKeys) {
        if (!(await this.redis.exists(key))) {
          await this.redis.set(key, 0);
        }
      }

      logger.info('MetricsCollector initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MetricsCollector:', error);
      throw error;
    }
  }

  // Start periodic collection
  start(): void {
    if (this.isRunning) {
      logger.warn('MetricsCollector is already running');
      return;
    }

    this.isRunning = true;
    this.collectionInterval = setInterval(() => {
      this.collectAndStore().catch(error => {
        logger.error('Error in metrics collection cycle:', error);
      });
    }, this.intervalMs);

    logger.info(`MetricsCollector started with ${this.intervalMs}ms interval`);
  }

  // Stop periodic collection
  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.isRunning = false;
    logger.info('MetricsCollector stopped');
  }

  // Get events processed per second
  async getEventsPerSecond(): Promise<number> {
    try {
      const currentCount = await this.redis.get(KEYS.EVENTS_PROCESSED);
      const current = parseInt(currentCount || '0', 10);

      if (this.lastEventsCount === 0) {
        this.lastEventsCount = current;
        return 0;
      }

      const eventsDiff = current - this.lastEventsCount;
      const eventsPerSecond = eventsDiff / (this.intervalMs / 1000);

      this.lastEventsCount = current;
      return Math.max(0, eventsPerSecond);

    } catch (error) {
      logger.error('Error getting events per second:', error);
      return 0;
    }
  }

  // Get decision latency metrics
  async getLatencyMetrics(): Promise<LatencyMetrics> {
    try {
      const [avg, p50, p95, p99] = await Promise.all([
        this.redis.get(KEYS.LATENCY_AVG),
        this.redis.get(KEYS.LATENCY_P50),
        this.redis.get(KEYS.LATENCY_P95),
        this.redis.get(KEYS.LATENCY_P99)
      ]);

      return {
        avg: parseFloat(avg || '0'),
        p50: parseFloat(p50 || '0'),
        p95: parseFloat(p95 || '0'),
        p99: parseFloat(p99 || '0')
      };
    } catch (error) {
      logger.error('Error getting latency metrics:', error);
      return { avg: 0, p50: 0, p95: 0, p99: 0 };
    }
  }

  // Get error rates by service
  async getErrorRatesByService(): Promise<IServiceErrorRate[]> {
    try {
      const results: IServiceErrorRate[] = [];

      for (const service of SERVICES) {
        const errorCount = await this.redis.get(`${KEYS.ERROR_COUNT}:${service}`);
        const requestCount = await this.redis.get(`${KEYS.REQUEST_COUNT}:${service}`);

        const errors = parseInt(errorCount || '0', 10);
        const requests = parseInt(requestCount || '0', 10);
        const rate = requests > 0 ? (errors / requests) * 100 : 0;

        results.push({
          name: service,
          rate: Math.round(rate * 100) / 100,
          errorCount: errors,
          totalRequests: requests
        });
      }

      return results;
    } catch (error) {
      logger.error('Error getting error rates:', error);
      return SERVICES.map(name => ({
        name,
        rate: 0,
        errorCount: 0,
        totalRequests: 0
      }));
    }
  }

  // Get overall error rate
  async getOverallErrorRate(): Promise<number> {
    try {
      let totalErrors = 0;
      let totalRequests = 0;

      for (const service of SERVICES) {
        const errors = await this.redis.get(`${KEYS.ERROR_COUNT}:${service}`);
        const requests = await this.redis.get(`${KEYS.REQUEST_COUNT}:${service}`);

        totalErrors += parseInt(errors || '0', 10);
        totalRequests += parseInt(requests || '0', 10);
      }

      return totalRequests > 0
        ? Math.round((totalErrors / totalRequests) * 10000) / 100
        : 0;
    } catch (error) {
      logger.error('Error getting overall error rate:', error);
      return 0;
    }
  }

  // Get cache hit rate
  async getCacheHitRate(): Promise<number> {
    try {
      const [hits, misses] = await Promise.all([
        this.redis.get(KEYS.CACHE_HITS),
        this.redis.get(KEYS.CACHE_MISSES)
      ]);

      const hitCount = parseInt(hits || '0', 10);
      const missCount = parseInt(misses || '0', 10);
      const total = hitCount + missCount;

      return total > 0
        ? Math.round((hitCount / total) * 10000) / 100
        : 0;
    } catch (error) {
      logger.error('Error getting cache hit rate:', error);
      return 0;
    }
  }

  // Get cache miss rate
  async getCacheMissRate(): Promise<number> {
    return 100 - await this.getCacheHitRate();
  }

  // Get tier upgrade rate
  async getTierUpgradeRate(): Promise<number> {
    try {
      const upgrades = await this.redis.get(KEYS.TIER_UPGRADES);
      return parseInt(upgrades || '0', 10);
    } catch (error) {
      logger.error('Error getting tier upgrade rate:', error);
      return 0;
    }
  }

  // Get streak maintenance rate
  async getStreakMaintenanceRate(): Promise<number> {
    try {
      const maintained = await this.redis.get(KEYS.STREAK_MAINTENANCE);
      return parseInt(maintained || '0', 10);
    } catch (error) {
      logger.error('Error getting streak maintenance rate:', error);
      return 0;
    }
  }

  // Get badge unlock rate
  async getBadgeUnlockRate(): Promise<number> {
    try {
      const unlocks = await this.redis.get(KEYS.BADGE_UNLOCKS);
      return parseInt(unlocks || '0', 10);
    } catch (error) {
      logger.error('Error getting badge unlock rate:', error);
      return 0;
    }
  }

  // Get ReZ Score distribution
  async getScoreDistribution(): Promise<ScoreDistribution> {
    try {
      const [bronze, silver, gold, platinum, diamond] = await Promise.all([
        this.redis.get(KEYS.SCORE_BRONZE),
        this.redis.get(KEYS.SCORE_SILVER),
        this.redis.get(KEYS.SCORE_GOLD),
        this.redis.get(KEYS.SCORE_PLATINUM),
        this.redis.get(KEYS.SCORE_DIAMOND)
      ]);

      return {
        bronze: parseInt(bronze || '0', 10),
        silver: parseInt(silver || '0', 10),
        gold: parseInt(gold || '0', 10),
        platinum: parseInt(platinum || '0', 10),
        diamond: parseInt(diamond || '0', 10)
      };
    } catch (error) {
      logger.error('Error getting score distribution:', error);
      return { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 };
    }
  }

  // Collect all metrics
  async collectMetrics(): Promise<{
    eventsProcessedPerSecond: number;
    decisionLatency: LatencyMetrics;
    errorRates: IServiceErrorRate[];
    overallErrorRate: number;
    profileCacheHitRate: number;
    tierUpgradeRate: number;
    streakMaintenanceRate: number;
    badgeUnlockRate: number;
    scoreDistribution: ScoreDistribution;
  }> {
    const [
      eventsPerSecond,
      decisionLatency,
      errorRates,
      overallErrorRate,
      profileCacheHitRate,
      tierUpgradeRate,
      streakMaintenanceRate,
      badgeUnlockRate,
      scoreDistribution
    ] = await Promise.all([
      this.getEventsPerSecond(),
      this.getLatencyMetrics(),
      this.getErrorRatesByService(),
      this.getOverallErrorRate(),
      this.getCacheHitRate(),
      this.getTierUpgradeRate(),
      this.getStreakMaintenanceRate(),
      this.getBadgeUnlockRate(),
      this.getScoreDistribution()
    ]);

    return {
      eventsProcessedPerSecond: Math.round(eventsPerSecond * 100) / 100,
      decisionLatency,
      errorRates,
      overallErrorRate,
      profileCacheHitRate,
      tierUpgradeRate,
      streakMaintenanceRate,
      badgeUnlockRate,
      scoreDistribution
    };
  }

  // Collect and store metrics snapshot
  async collectAndStore(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();
      logger.debug('Collected metrics:', metrics);

      // Note: The actual storage with health and alerts is done in index.ts
      // This method is here for the collector to do its periodic work
    } catch (error) {
      logger.error('Error in collectAndStore:', error);
    }
  }

  // Get historical metrics from MongoDB
  async getHistoricalMetrics(
    startTime: Date,
    endTime: Date,
    limit: number = 100
  ): Promise<Array<{
    timestamp: Date;
    metrics: {
      eventsProcessedPerSecond: number;
      decisionLatency: LatencyMetrics;
      overallErrorRate: number;
      profileCacheHitRate: number;
    };
  }>> {
    try {
      const snapshots = await MetricSnapshot.find({
        timestamp: { $gte: startTime, $lte: endTime }
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('timestamp metrics');

      return snapshots.map(s => ({
        timestamp: s.timestamp,
        metrics: {
          eventsProcessedPerSecond: s.metrics.eventsProcessedPerSecond,
          decisionLatency: s.metrics.decisionLatency,
          overallErrorRate: s.metrics.overallErrorRate,
          profileCacheHitRate: s.metrics.profileCacheHitRate
        }
      }));
    } catch (error) {
      logger.error('Error getting historical metrics:', error);
      return [];
    }
  }

  // Record an event (increment counter)
  async recordEvent(): Promise<void> {
    await this.redis.incr(KEYS.EVENTS_PROCESSED);
  }

  // Record a request with error status
  async recordRequest(service: string, isError: boolean): Promise<void> {
    await this.redis.incr(KEYS.REQUEST_COUNT);
    if (isError) {
      await this.redis.incr(`${KEYS.ERROR_COUNT}:${service}`);
    }
  }

  // Record latency
  async recordLatency(latencyMs: number): Promise<void> {
    // Store in a sorted set for percentile calculation
    await this.redis.zadd(KEYS.DECISION_LATENCY, Date.now(), `${Date.now()}-${latencyMs}`);

    // Keep only last 10000 measurements
    await this.redis.zremrangebyrank(KEYS.DECISION_LATENCY, 0, -10001);
  }

  // Record cache hit/miss
  async recordCacheHit(isHit: boolean): Promise<void> {
    if (isHit) {
      await this.redis.incr(KEYS.CACHE_HITS);
    } else {
      await this.redis.incr(KEYS.CACHE_MISSES);
    }
  }
}

// Factory function
export function createMetricsCollector(redis: Redis): MetricsCollector {
  return new MetricsCollector({
    redis,
    collectionIntervalMs: parseInt(process.env.METRICS_COLLECTION_INTERVAL_MS || '10000', 10),
    historyRetentionDays: parseInt(process.env.METRICS_HISTORY_RETENTION_DAYS || '7', 10)
  });
}

export { MetricsCollector };
export default MetricsCollector;
