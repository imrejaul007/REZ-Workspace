import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisService } from './redis.service';
import { MemoryCacheService } from './memory-cache.service';
import { CacheConfigService } from './cache-config.service';

export interface CacheHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  type: 'redis' | 'memory' | 'hybrid';
  metrics: {
    hits: number;
    misses: number;
    hitRate: number;
    avgResponseTime: number;
    totalOperations: number;
  };
  redis?: {
    connected: boolean;
    version?: string;
    memory?: string;
    clients?: string;
    uptime?: string;
    keyspace?: string;
    error?: string;
  };
  memory?: {
    size: number;
    maxSize: number;
    hitRatio: number;
    tags: number;
    memoryUsage?: string;
    error?: string;
  };
  performance: {
    p50: number;
    p95: number;
    p99: number;
    errors: number;
    warnings: number;
  };
  recommendations: string[];
}

interface DiagnosticTest {
  name: string;
  status: string;
  duration: number;
  details: string;
}

interface DiagnosticsReport {
  timestamp: string;
  tests: DiagnosticTest[];
}

interface ParsedRedisInfo {
  [key: string]: string;
}

@Injectable()
export class CacheHealthService {
  private readonly logger = new Logger(CacheHealthService.name);
  private performanceHistory: number[] = [];
  private errorCount = 0;
  private warningCount = 0;

  constructor(
    private readonly cacheService: CacheService,
    private readonly redisService: RedisService,
    private readonly memoryCacheService: MemoryCacheService,
    private readonly configService: CacheConfigService,
  ) {}

  async getHealthReport(): Promise<CacheHealthReport> {
    const timestamp = new Date().toISOString();
    const cacheMetrics = this.cacheService.getMetrics();

    const report: CacheHealthReport = {
      status: 'healthy',
      timestamp,
      type: this.configService.isRedisEnabled() ? 'redis' : 'memory',
      metrics: {
        hits: cacheMetrics.hits,
        misses: cacheMetrics.misses,
        hitRate: cacheMetrics.hitRate,
        avgResponseTime: cacheMetrics.avgResponseTime,
        totalOperations: cacheMetrics.hits + cacheMetrics.misses,
      },
      performance: this.getPerformanceMetrics(),
      recommendations: [],
    };

    // Add Redis-specific health data
    if (this.configService.isRedisEnabled()) {
      report.redis = await this.getRedisHealthData();
    } else {
      report.memory = await this.getMemoryHealthData();
    }

    // Determine overall health status
    report.status = this.determineHealthStatus(report);
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  private async getRedisHealthData(): Promise<CacheHealthReport['redis']> {
    try {
      const connectionInfo = this.redisService.getConnectionInfo() as { isConnected: boolean };

      if (!connectionInfo.isConnected) {
        return {
          connected: false,
          error: 'Redis not connected',
        };
      }

      const client = this.redisService.getClient();
      const info = await client.info();
      const parsedInfo = this.parseRedisInfo(info);

      return {
        connected: true,
        version: parsedInfo['redis_version'],
        memory: parsedInfo['used_memory_human'],
        clients: parsedInfo['connected_clients'],
        uptime: parsedInfo['uptime_in_seconds'],
        keyspace: parsedInfo['db0'],
      };
    } catch (error) {
      this.logger.error('Failed to get Redis health data:', error);
      this.errorCount++;
      return {
        connected: false,
        error: (error as Error).message,
      };
    }
  }

  private async getMemoryHealthData(): Promise<CacheHealthReport['memory']> {
    try {
      const stats = this.memoryCacheService.getStats();
      const memoryUsage = this.memoryCacheService.getMemoryUsage();

      return {
        size: stats.size,
        maxSize: stats.maxSize,
        hitRatio: stats.hitRatio,
        tags: stats.tags,
        memoryUsage: memoryUsage.estimated,
      };
    } catch (error) {
      this.logger.error('Failed to get memory cache health data:', error);
      this.errorCount++;
      return {
        size: 0,
        maxSize: 0,
        hitRatio: 0,
        tags: 0,
        error: (error as Error).message,
      };
    }
  }

  private getPerformanceMetrics(): CacheHealthReport['performance'] {
    if (this.performanceHistory.length === 0) {
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        errors: this.errorCount,
        warnings: this.warningCount,
      };
    }

    const sorted = [...this.performanceHistory].sort((a, b) => a - b);
    const length = sorted.length;

    return {
      p50: sorted[Math.floor(length * 0.5)] ?? 0,
      p95: sorted[Math.floor(length * 0.95)] ?? 0,
      p99: sorted[Math.floor(length * 0.99)] ?? 0,
      errors: this.errorCount,
      warnings: this.warningCount,
    };
  }

  private determineHealthStatus(report: CacheHealthReport): 'healthy' | 'degraded' | 'unhealthy' {
    // Check for critical failures
    if (this.configService.isRedisEnabled() && !report.redis?.connected) {
      return 'unhealthy';
    }

    if (report.performance.errors > 10) {
      return 'unhealthy';
    }

    // Check for performance degradation
    if (report.metrics.avgResponseTime > 1000) { // > 1 second
      return 'degraded';
    }

    if (report.metrics.hitRate < 0.5) { // < 50% hit rate
      return 'degraded';
    }

    if (report.performance.p95 > 500) { // 95th percentile > 500ms
      return 'degraded';
    }

    // Check Redis-specific issues
    if (report.redis) {
      const memoryUsage = this.parseMemoryUsage(report.redis.memory || '0');
      const maxMemory = this.configService.getMaxMemoryUsage();
      const maxBytes = this.parseMemorySize(maxMemory);

      if (memoryUsage > maxBytes * 0.9) { // > 90% memory usage
        return 'degraded';
      }
    }

    // Check memory cache issues
    if (report.memory) {
      if (report.memory.size >= report.memory.maxSize * 0.95) { // > 95% capacity
        return 'degraded';
      }
    }

    return 'healthy';
  }

  private generateRecommendations(report: CacheHealthReport): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (report.metrics.hitRate < 0.7) {
      recommendations.push('Consider increasing cache TTL or reviewing cache key strategies - hit rate is below 70%');
    }

    if (report.metrics.avgResponseTime > 100) {
      recommendations.push('Average response time is high - consider optimizing cache operations or checking network latency');
    }

    // Redis-specific recommendations
    if (report.redis) {
      if (!report.redis.connected) {
        recommendations.push('Redis connection is down - check Redis server status and network connectivity');
      }

      if (report.redis.memory) {
        const memoryUsage = this.parseMemoryUsage(report.redis.memory);
        const maxMemory = this.parseMemorySize(this.configService.getMaxMemoryUsage());

        if (memoryUsage > maxMemory * 0.8) {
          recommendations.push('Redis memory usage is high - consider implementing more aggressive eviction policies');
        }
      }

      if (parseInt(report.redis.clients || '0') > 50) {
        recommendations.push('High number of Redis clients - consider connection pooling optimization');
      }
    }

    // Memory cache recommendations
    if (report.memory) {
      if (report.memory.size >= report.memory.maxSize * 0.9) {
        recommendations.push('Memory cache is nearly full - consider increasing max size or implementing better eviction');
      }

      if (report.memory.hitRatio < 0.7) {
        recommendations.push('Memory cache hit ratio is low - review cache sizing and eviction policies');
      }
    }

    // General performance recommendations
    if (report.performance.p95 > 200) {
      recommendations.push('95th percentile response time is high - investigate slow cache operations');
    }

    if (report.performance.errors > 5) {
      recommendations.push('Multiple cache errors detected - check error logs and system resources');
    }

    if (recommendations.length === 0) {
      recommendations.push('Cache performance is optimal - no immediate action required');
    }

    return recommendations;
  }

  async runDiagnostics(): Promise<DiagnosticsReport> {
    const diagnostics: DiagnosticsReport = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    // Test basic cache operations
    const testResults = await this.runBasicCacheTests();
    diagnostics.tests.push(...testResults);

    // Test Redis-specific operations
    if (this.configService.isRedisEnabled()) {
      const redisTests = await this.runRedisSpecificTests();
      diagnostics.tests.push(...redisTests);
    } else {
      const memoryTests = await this.runMemoryCacheTests();
      diagnostics.tests.push(...memoryTests);
    }

    // Performance tests
    const performanceTests = await this.runPerformanceTests();
    diagnostics.tests.push(...performanceTests);

    return diagnostics;
  }

  private async runBasicCacheTests(): Promise<DiagnosticTest[]> {
    const tests: DiagnosticTest[] = [];
    const testKey = `health_test_${Date.now()}`;
    const testValue = { test: 'data', timestamp: Date.now() };

    try {
      // Test SET operation
      const startSet = Date.now();
      await this.cacheService.set(testKey, testValue);
      const setTime = Date.now() - startSet;

      tests.push({
        name: 'cache_set',
        status: 'passed',
        duration: setTime,
        details: 'Basic cache set operation',
      });

      // Test GET operation
      const startGet = Date.now();
      const retrieved = await this.cacheService.get(testKey);
      const getTime = Date.now() - startGet;

      const getStatus = JSON.stringify(retrieved) === JSON.stringify(testValue) ? 'passed' : 'failed';
      tests.push({
        name: 'cache_get',
        status: getStatus,
        duration: getTime,
        details: 'Basic cache get operation',
      });

      // Test DELETE operation
      const startDelete = Date.now();
      await this.cacheService.delete(testKey);
      const deleteTime = Date.now() - startDelete;

      tests.push({
        name: 'cache_delete',
        status: 'passed',
        duration: deleteTime,
        details: 'Basic cache delete operation',
      });

      // Verify deletion
      const deletedValue = await this.cacheService.get(testKey);
      const deleteVerifyStatus = deletedValue === null ? 'passed' : 'failed';

      tests.push({
        name: 'cache_delete_verify',
        status: deleteVerifyStatus,
        duration: 0,
        details: 'Verify cache entry was deleted',
      });

    } catch (error) {
      tests.push({
        name: 'basic_cache_operations',
        status: 'failed',
        duration: 0,
        details: `Basic cache operations failed: ${this.getErrorMessage(error)}`,
      });
    }

    return tests;
  }

  private async runRedisSpecificTests(): Promise<DiagnosticTest[]> {
    const tests: DiagnosticTest[] = [];

    try {
      if (!this.redisService.isConnectionHealthy()) {
        tests.push({
          name: 'redis_connection',
          status: 'failed',
          duration: 0,
          details: 'Redis connection is not healthy',
        });
        return tests;
      }

      // Test Redis ping
      const startPing = Date.now();
      const client = this.redisService.getClient();
      await client.ping();
      const pingTime = Date.now() - startPing;

      tests.push({
        name: 'redis_ping',
        status: 'passed',
        duration: pingTime,
        details: 'Redis ping test',
      });

      // Test Redis pipeline
      const startPipeline = Date.now();
      const pipeline = client.pipeline();
      pipeline.set('pipeline_test_1', 'value1');
      pipeline.set('pipeline_test_2', 'value2');
      pipeline.get('pipeline_test_1');
      pipeline.get('pipeline_test_2');
      const results = await pipeline.exec();
      const pipelineTime = Date.now() - startPipeline;

      const pipelineStatus = results && results.length === 4 ? 'passed' : 'failed';
      tests.push({
        name: 'redis_pipeline',
        status: pipelineStatus,
        duration: pipelineTime,
        details: 'Redis pipeline operations test',
      });

      // Cleanup
      await client.del('pipeline_test_1', 'pipeline_test_2');

    } catch (error) {
      tests.push({
        name: 'redis_operations',
        status: 'failed',
        duration: 0,
        details: `Redis operations failed: ${this.getErrorMessage(error)}`,
      });
    }

    return tests;
  }

  private async runMemoryCacheTests(): Promise<DiagnosticTest[]> {
    const tests: DiagnosticTest[] = [];

    try {
      const healthCheck = await this.memoryCacheService.healthCheck();

      tests.push({
        name: 'memory_cache_health',
        status: healthCheck.status === 'healthy' ? 'passed' : 'failed',
        duration: 0,
        details: JSON.stringify(healthCheck.details),
      });

      // Test memory cache stats
      const stats = this.memoryCacheService.getStats();
      tests.push({
        name: 'memory_cache_stats',
        status: 'passed',
        duration: 0,
        details: `Size: ${stats.size}, Max: ${stats.maxSize}, Hit Ratio: ${stats.hitRatio}`,
      });

    } catch (error) {
      tests.push({
        name: 'memory_cache_operations',
        status: 'failed',
        duration: 0,
        details: `Memory cache operations failed: ${this.getErrorMessage(error)}`,
      });
    }

    return tests;
  }

  private async runPerformanceTests(): Promise<DiagnosticTest[]> {
    const tests: DiagnosticTest[] = [];

    try {
      // Test cache performance under load
      const operations = 100;
      const startTime = Date.now();
      const promises: Array<Promise<void>> = [];

      for (let i = 0; i < operations; i++) {
        promises.push(
          this.cacheService.set(`perf_test_${i}`, { data: `test_data_${i}` })
        );
      }

      await Promise.all(promises);
      const setTime = Date.now() - startTime;

      tests.push({
        name: 'bulk_set_performance',
        status: 'passed',
        duration: setTime,
        details: `${operations} set operations completed in ${setTime}ms`,
      });

      // Test bulk get performance
      const getStartTime = Date.now();
      const getPromises: Array<Promise<unknown>> = [];

      for (let i = 0; i < operations; i++) {
        getPromises.push(this.cacheService.get(`perf_test_${i}`));
      }

      await Promise.all(getPromises);
      const getTime = Date.now() - getStartTime;

      tests.push({
        name: 'bulk_get_performance',
        status: 'passed',
        duration: getTime,
        details: `${operations} get operations completed in ${getTime}ms`,
      });

      // Cleanup performance test data
      await this.cacheService.deletePattern('perf_test_*');

    } catch (error) {
      tests.push({
        name: 'performance_tests',
        status: 'failed',
        duration: 0,
        details: `Performance tests failed: ${this.getErrorMessage(error)}`,
      });
    }

    return tests;
  }

  recordPerformanceMetric(duration: number): void {
    this.performanceHistory.push(duration);

    // Keep only last 1000 measurements
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }

    // Track warnings for slow operations
    if (duration > 500) {
      this.warningCount++;
    }
  }

  recordError(): void {
    this.errorCount++;
  }

  resetCounters(): void {
    this.errorCount = 0;
    this.warningCount = 0;
    this.performanceHistory = [];
  }

  // Utility methods
  private parseRedisInfo(info: string): ParsedRedisInfo {
    const lines = info.split('\r\n');
    const result: ParsedRedisInfo = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }

  private parseMemoryUsage(memoryStr: string): number {
    const match = memoryStr.match(/^([\d.]+)([KMGT]?B)$/i);
    if (!match) return 0;

    const [, amount, unit] = match;
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    };

    return parseFloat(amount) * (multipliers[unit.toUpperCase()] ?? 1);
  }

  private parseMemorySize(sizeStr: string): number {
    const units: Record<string, number> = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);

    if (!match) {
      return 256 * 1024 * 1024; // Default 256MB
    }

    const [, amount, unit] = match;
    return parseFloat(amount) * (units[unit] ?? 1);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
