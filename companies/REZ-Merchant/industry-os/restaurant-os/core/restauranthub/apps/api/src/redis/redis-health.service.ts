import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface RedisHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  connected: boolean;
  latency?: number;
  memoryUsage?: string;
  uptime?: string;
  errors?: string[];
  lastCheck: string;
}

@Injectable()
export class RedisHealthService {
  private readonly logger = new Logger(RedisHealthService.name);
  private lastHealthCheck: RedisHealthStatus | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(private readonly redisService: RedisService) {
    // Start periodic health checks
    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    // Run health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth().catch(error => {
        this.logger.error('Health check failed:', error);
      });
    }, 30000);

    // Initial health check
    this.checkHealth().catch(error => {
      this.logger.error('Initial health check failed:', error);
    });
  }

  async checkHealth(): Promise<RedisHealthStatus> {
    const startTime = Date.now();
    const errors: string[] = [];
    let connected = false;
    let memoryUsage: string | undefined;
    let uptime: string | undefined;

    try {
      // Test basic connectivity
      const client = this.redisService.getClient();

      // Ping test
      const pong = await client.ping();
      connected = pong === 'PONG';

      if (!connected) {
        errors.push('Ping test failed - no PONG response');
      }

      // Test basic operations
      try {
        const testKey = 'health:test';
        const testValue = `test:${Date.now()}`;

        await client.set(testKey, testValue, 'EX', 60);
        const retrievedValue = await client.get(testKey);

        if (retrievedValue !== testValue) {
          errors.push('Set/Get test failed - value mismatch');
        }

        await client.del(testKey);
      } catch (error) {
        errors.push(`Set/Get test failed: ${error instanceof Error ? error.message : error}`);
      }

      // Get Redis info
      try {
        const info = await client.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        if (memoryMatch) {
          memoryUsage = memoryMatch[1].trim();
        }

        const serverInfo = await client.info('server');
        const uptimeMatch = serverInfo.match(/uptime_in_seconds:(\d+)/);
        if (uptimeMatch) {
          const seconds = parseInt(uptimeMatch[1]);
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          uptime = `${hours}h ${minutes}m`;
        }
      } catch (error) {
        errors.push(`Failed to get Redis info: ${error instanceof Error ? error.message : error}`);
      }

    } catch (error) {
      connected = false;
      errors.push(`Connection test failed: ${error instanceof Error ? error.message : error}`);
    }

    const latency = Date.now() - startTime;
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (!connected || errors.length > 0) {
      status = errors.length >= 2 ? 'unhealthy' : 'degraded';
    } else if (latency > 1000) {
      status = 'degraded';
    }

    const healthStatus: RedisHealthStatus = {
      status,
      connected,
      latency,
      memoryUsage,
      uptime,
      errors: errors.length > 0 ? errors : undefined,
      lastCheck: new Date().toISOString(),
    };

    this.lastHealthCheck = healthStatus;

    if (status !== 'healthy') {
      this.logger.warn('Redis health check warning:', healthStatus);
    } else {
      this.logger.debug('Redis health check passed');
    }

    return healthStatus;
  }

  getLastHealthCheck(): RedisHealthStatus | null {
    return this.lastHealthCheck;
  }

  isHealthy(): boolean {
    return this.lastHealthCheck?.status === 'healthy' || false;
  }

  onModuleDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}