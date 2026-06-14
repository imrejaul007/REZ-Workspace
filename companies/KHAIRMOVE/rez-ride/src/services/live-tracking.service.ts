import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server } from 'socket.io';
import { Subject, Observable } from 'rxjs';
import Redis from 'ioredis';

/**
 * Live Tracking Service - Real-time driver location
 *
 * SECURITY: This service handles location data.
 * Locations are broadcasted via Redis Pub/Sub for horizontal scaling.
 */

export interface DriverLocation {
  driverId: string;
  rideId?: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: number;
}

export interface LocationSubscription {
  rideId: string;
  userId: string;
  unsubscribe: () => void;
}

@Injectable()
export class LiveTrackingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LiveTrackingService.name);
  private server: Server | null = null;
  private redisPublisher: Redis | null = null;
  private redisSubscriber: Redis | null = null;

  // In-memory tracking for quick lookups (also backed by Redis)
  private activeSubscriptions = new Map<string, Subject<DriverLocation>>();

  // Location cache (last known location per driver)
  private driverLocations = new Map<string, DriverLocation>();

  private readonly REDIS_KEY_PREFIX = 'ride:tracking:';
  private readonly LOCATION_TTL = 300; // 5 minutes

  onModuleInit() {
    this.initializeRedis();
  }

  onModuleDestroy() {
    this.cleanup();
  }

  /**
   * Initialize Redis connections for Pub/Sub
   */
  private async initializeRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      // Create separate connections for pub/sub (Redis requires separate connections)
      this.redisPublisher = new Redis(redisUrl, {
        lazyConnect: true,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });

      this.redisSubscriber = new Redis(redisUrl, {
        lazyConnect: true,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });

      await this.redisPublisher.connect();
      await this.redisSubscriber.connect();

      this.logger.log('Live tracking Redis connections established');

      // Subscribe to location channels
      await this.subscribeToLocationUpdates();
    } catch (error) {
      this.logger.error(`Failed to initialize Redis: ${error.message}`);
      // Continue with in-memory fallback (for development)
    }
  }

  /**
   * Subscribe to location update channels
   */
  private async subscribeToLocationUpdates(): Promise<void> {
    if (!this.redisSubscriber) return;

    const pattern = `${this.REDIS_KEY_PREFIX}channel:*`;

    this.redisSubscriber.on('pmessage', (_pattern, channel, message) => {
      const rideId = channel.replace(`${this.REDIS_KEY_PREFIX}channel:`, '');
      const location: DriverLocation = JSON.parse(message);

      // Emit to all subscribers for this ride
      const subject = this.activeSubscriptions.get(rideId);
      if (subject && !subject.closed) {
        subject.next(location);

        // Also broadcast to Socket.IO clients if server is available
        if (this.server) {
          this.server.to(`ride:${rideId}`).emit('driver_location', location);
        }
      }

      // Update cache
      this.driverLocations.set(location.driverId, location);
    });

    await this.redisSubscriber.psubscribe(pattern);
    this.logger.log('Subscribed to location updates pattern');
  }

  /**
   * Set Socket.IO server for broadcasting
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Start tracking a driver
   */
  startTracking(driverId: string): void {
    this.logger.log(`Driver ${driverId} tracking started`);
    // Driver is now active - we'll receive location updates
  }

  /**
   * Stop tracking a driver
   */
  stopTracking(driverId: string): void {
    this.driverLocations.delete(driverId);
    this.logger.log(`Driver ${driverId} tracking stopped`);
  }

  /**
   * Get last known location for a driver
   */
  async getLastLocation(driverId: string): Promise<DriverLocation | null> {
    // Check memory first
    const cached = this.driverLocations.get(driverId);
    if (cached) {
      return cached;
    }

    // Check Redis
    if (this.redisPublisher) {
      try {
        const key = `${this.REDIS_KEY_PREFIX}driver:${driverId}`;
        const data = await this.redisPublisher.get(key);
        if (data) {
          const location = JSON.parse(data) as DriverLocation;
          this.driverLocations.set(driverId, location);
          return location;
        }
      } catch (error) {
        this.logger.error(`Failed to get location from Redis: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Update driver location and broadcast
   */
  async updateLocation(
    driverId: string,
    lat: number,
    lng: number,
    rideId?: string,
    metadata?: {
      heading?: number;
      speed?: number;
      accuracy?: number;
    }
  ): Promise<void> {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      this.logger.warn(`Invalid coordinates: ${lat}, ${lng}`);
      return;
    }

    const location: DriverLocation = {
      driverId,
      rideId,
      lat,
      lng,
      heading: metadata?.heading,
      speed: metadata?.speed,
      accuracy: metadata?.accuracy,
      timestamp: Date.now(),
    };

    // Update memory cache
    this.driverLocations.set(driverId, location);

    // Publish to Redis for horizontal scaling
    if (this.redisPublisher) {
      try {
        const channel = rideId
          ? `${this.REDIS_KEY_PREFIX}channel:${rideId}`
          : `${this.REDIS_KEY_PREFIX}channel:driver:${driverId}`;

        const driverKey = `${this.REDIS_KEY_PREFIX}driver:${driverId}`;

        // Publish to channel
        await this.redisPublisher.publish(channel, JSON.stringify(location));

        // Cache location with TTL
        await this.redisPublisher.setex(driverKey, this.LOCATION_TTL, JSON.stringify(location));

        this.logger.debug(`Location updated for driver ${driverId}: ${lat}, ${lng}`);
      } catch (error) {
        this.logger.error(`Failed to publish location: ${error.message}`);
      }
    }

    // Broadcast to Socket.IO clients if server is available
    if (this.server && rideId) {
      this.server.to(`ride:${rideId}`).emit('driver_location', location);
    }
  }

  /**
   * Subscribe to location updates for a ride
   * Returns an Observable that emits driver locations
   */
  subscribe(rideId: string, userId?: string): Observable<DriverLocation> {
    this.logger.log(`User ${userId || 'anonymous'} subscribed to ride ${rideId}`);

    // Check if we already have an active subscription
    let subject = this.activeSubscriptions.get(rideId);
    if (!subject || subject.closed) {
      subject = new Subject<DriverLocation>();
      this.activeSubscriptions.set(rideId, subject);
    }

    // Return observable that cleans up when unsubscribed
    return new Observable<DriverLocation>((subscriber) => {
      const subscription = subject!.subscribe({
        next: (location) => subscriber.next(location),
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });

      // Cleanup when subscriber unsubscribes
      return () => {
        subscription.unsubscribe();
        this.logger.log(`User ${userId || 'anonymous'} unsubscribed from ride ${rideId}`);

        // Check if there are still subscribers
        const currentSubject = this.activeSubscriptions.get(rideId);
        if (currentSubject && currentSubject.closed) {
          this.activeSubscriptions.delete(rideId);
        }
      };
    });
  }

  /**
   * Get ride tracking room name for Socket.IO
   */
  getRideRoom(rideId: string): string {
    return `ride:${rideId}`;
  }

  /**
   * Get all active drivers in a zone
   */
  async getDriversInZone(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<DriverLocation[]> {
    // For now, return cached drivers
    // In production, use Redis GEORADIUS for efficient queries
    const drivers: DriverLocation[] = [];

    for (const location of this.driverLocations.values()) {
      const distance = this.calculateDistance(lat, lng, location.lat, location.lng);
      if (distance <= radiusKm) {
        drivers.push(location);
      }
    }

    return drivers;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.redisSubscriber) {
      this.redisSubscriber.disconnect();
    }
    if (this.redisPublisher) {
      this.redisPublisher.disconnect();
    }

    for (const subject of this.activeSubscriptions.values()) {
      subject.complete();
    }
    this.activeSubscriptions.clear();
    this.driverLocations.clear();

    this.logger.log('Live tracking service cleaned up');
  }
}
