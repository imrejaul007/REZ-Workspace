import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export interface GeoPoint {
  lat: number;
  lng: number;
  member: string; // driverId
}

export interface GeoSearchResult {
  member: string;
  distance: number;
  coordinates: [number, number]; // [lng, lat]
}

@Injectable()
export class GeoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GeoService.name);
  private redis: Redis;
  private readonly REDIS_HOST: string;
  private readonly REDIS_PORT: number;

  // Keys
  private readonly DRIVER_LOCATIONS_KEY = 'rez:ride:drivers:locations';

  constructor(private configService: ConfigService) {
    this.REDIS_HOST = configService.get('REDIS_HOST', 'localhost');
    this.REDIS_PORT = configService.get('REDIS_PORT', 6379);
  }

  async onModuleInit() {
    this.redis = new Redis({
      host: this.REDIS_HOST,
      port: this.REDIS_PORT,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error('Redis connection failed, using fallback');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * Update driver location
   */
  async updateDriverLocation(
    driverId: string,
    lat: number,
    lng: number
  ): Promise<void> {
    try {
      // Use GEOADD to store driver location
      await this.redis.geoadd(this.DRIVER_LOCATIONS_KEY, lng, lat, driverId);

      // Also store additional metadata
      await this.redis.hset(
        `rez:ride:driver:${driverId}:meta`,
        'lat', lat.toString(),
        'lng', lng.toString(),
        'updatedAt', new Date().toISOString()
      );

      // Set expiry (remove if offline for 1 hour)
      await this.redis.expire(`rez:ride:driver:${driverId}:meta`, 3600);

      this.logger.debug(`Updated location for driver ${driverId}: ${lat}, ${lng}`);
    } catch (error) {
      this.logger.error(`Failed to update driver location: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove driver from geo index (goes offline)
   */
  async removeDriver(driverId: string): Promise<void> {
    try {
      await this.redis.zrem(this.DRIVER_LOCATIONS_KEY, driverId);
      await this.redis.del(`rez:ride:driver:${driverId}:meta`);
      this.logger.debug(`Removed driver ${driverId} from geo index`);
    } catch (error) {
      this.logger.error(`Failed to remove driver: ${error.message}`);
    }
  }

  /**
   * Find nearby drivers
   */
  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
    limit = 10
  ): Promise<GeoSearchResult[]> {
    try {
      // GEORADIUS returns drivers within radius, sorted by distance
      const results = await this.redis.georadius(
        this.DRIVER_LOCATIONS_KEY,
        lng,
        lat,
        radiusKm,
        'km',
        'WITHDIST',
        'WITHCOORD',
        'ASC',
        'COUNT',
        limit
      ) as any[];

      return results.map((result) => ({
        member: result[0],
        distance: parseFloat(result[1]),
        coordinates: result[2],
      }));
    } catch (error) {
      this.logger.error(`Failed to find nearby drivers: ${error.message}`);
      return [];
    }
  }

  /**
   * Find nearby drivers of specific vehicle type
   */
  async findNearbyDriversByType(
    lat: number,
    lng: number,
    radiusKm: number,
    vehicleType: string,
    limit = 10
  ): Promise<GeoSearchResult[]> {
    try {
      // First get all nearby drivers
      const nearby = await this.findNearbyDrivers(lat, lng, radiusKm, 100);

      // Filter by vehicle type from metadata
      const filtered = [];

      for (const driver of nearby) {
        const meta = await this.redis.hgetall(`rez:ride:driver:${driver.member}:meta`);
        if (meta.vehicleType === vehicleType) {
          filtered.push(driver);
          if (filtered.length >= limit) break;
        }
      }

      return filtered;
    } catch (error) {
      this.logger.error(`Failed to find drivers by type: ${error.message}`);
      return [];
    }
  }

  /**
   * Get driver's current location
   */
  async getDriverLocation(driverId: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const position = await this.redis.geopos(this.DRIVER_LOCATIONS_KEY, driverId);

      if (!position || !position[0]) {
        return null;
      }

      return {
        lng: parseFloat(position[0][0]),
        lat: parseFloat(position[0][1]),
      };
    } catch (error) {
      this.logger.error(`Failed to get driver location: ${error.message}`);
      return null;
    }
  }

  /**
   * Get driver metadata
   */
  async getDriverMeta(driverId: string): Promise<Record<string, string>> {
    try {
      return await this.redis.hgetall(`rez:ride:driver:${driverId}:meta`);
    } catch (error) {
      this.logger.error(`Failed to get driver meta: ${error.message}`);
      return {};
    }
  }

  /**
   * Calculate distance between two points
   */
  async getDistance(point1: [number, number], point2: [number, number]): Promise<number> {
    try {
      // Add temporary points
      await this.redis.geoadd('rez:ride:temp', point1[0], point1[1], 'p1');
      await this.redis.geoadd('rez:ride:temp', point2[0], point2[1], 'p2');

      // Get distance
      const distance = await (this.redis as any).geodist('rez:ride:temp', 'p1', 'p2', 'km');

      // Cleanup
      await this.redis.zrem('rez:ride:temp', 'p1', 'p2');

      return parseFloat(distance || '0');
    } catch (error) {
      this.logger.error(`Failed to calculate distance: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get all online drivers
   */
  async getAllOnlineDrivers(): Promise<string[]> {
    try {
      return await this.redis.zrange(this.DRIVER_LOCATIONS_KEY, 0, -1);
    } catch (error) {
      this.logger.error(`Failed to get online drivers: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.redis?.status === 'ready';
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      return {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch {
      return { status: 'unhealthy' };
    }
  }
}
