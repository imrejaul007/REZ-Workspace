import { redisClient } from '../config/redis';
import { deliveryService } from './deliveryService';
import { driverService } from './driverService';
import { DeliveryDocument } from '../models/Delivery';
import { GeoLocation, DeliveryStatus, ETACalculation } from '../types';
import { calculateETA } from '../utils/geo';
import config from '../config';

interface TrackedDelivery {
  deliveryId: string;
  driverId: string;
  startTime: Date;
  lastUpdate: Date;
  locationHistory: GeoLocation[];
}

interface TrackingEvent {
  type: 'location_update' | 'status_change' | 'eta_update';
  deliveryId: string;
  driverId: string;
  data;
  timestamp: Date;
}

export class TrackingService {
  private static instance: TrackingService;
  private trackedDeliveries: Map<string, TrackedDelivery> = new Map();
  private eventEmitter: Map<string, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): TrackingService {
    if (!TrackingService.instance) {
      TrackingService.instance = new TrackingService();
    }
    return TrackingService.instance;
  }

  public async startTrackingDelivery(
    deliveryId: string,
    driverId: string
  ): Promise<void> {
    const tracking: TrackedDelivery = {
      deliveryId,
      driverId,
      startTime: new Date(),
      lastUpdate: new Date(),
      locationHistory: []
    };

    this.trackedDeliveries.set(deliveryId, tracking);
    await this.persistTrackingState(deliveryId, tracking);
    await this.publishTrackingEvent({
      type: 'status_change',
      deliveryId,
      driverId,
      data: { status: 'tracking_started' },
      timestamp: new Date()
    });
  }

  public async stopTrackingDelivery(deliveryId: string): Promise<void> {
    const tracking = this.trackedDeliveries.get(deliveryId);
    if (tracking) {
      await this.publishTrackingEvent({
        type: 'status_change',
        deliveryId,
        driverId: tracking.driverId,
        data: { status: 'tracking_stopped', duration: Date.now() - tracking.startTime.getTime() },
        timestamp: new Date()
      });
    }
    this.trackedDeliveries.delete(deliveryId);
    await this.clearTrackingState(deliveryId);
  }

  public async updateLocation(
    deliveryId: string,
    driverId: string,
    location: GeoLocation
  ): Promise<ETACalculation | null> {
    let tracking = this.trackedDeliveries.get(deliveryId);

    if (!tracking) {
      const persisted = await this.getPersistedTrackingState(deliveryId);
      if (persisted) {
        tracking = persisted;
        this.trackedDeliveries.set(deliveryId, tracking);
      } else {
        return null;
      }
    }

    const locationWithTimestamp: GeoLocation = {
      ...location,
      timestamp: new Date()
    };

    tracking.locationHistory.push(locationWithTimestamp);
    tracking.lastUpdate = new Date();

    if (tracking.locationHistory.length > config.tracking.maxHistoryPoints) {
      tracking.locationHistory = tracking.locationHistory.slice(
        -config.tracking.maxHistoryPoints
      );
    }

    await this.persistTrackingState(deliveryId, tracking);

    const delivery = await deliveryService.getDeliveryById(deliveryId);
    if (!delivery) {
      return null;
    }

    const eta = calculateETA(location, delivery.dropoff);
    await this.updateDeliveryEta(deliveryId, eta);

    await this.publishTrackingEvent({
      type: 'location_update',
      deliveryId,
      driverId: tracking.driverId,
      data: {
        location: locationWithTimestamp,
        eta
      },
      timestamp: new Date()
    });

    return eta;
  }

  public async getDeliveryRoute(
    deliveryId: string
  ): Promise<{
    currentLocation: GeoLocation | null;
    destination: GeoLocation | null;
    route: GeoLocation[];
    progress: number;
  } | null> {
    const tracking = this.trackedDeliveries.get(deliveryId);
    if (!tracking) {
      const persisted = await this.getPersistedTrackingState(deliveryId);
      if (!persisted) {
        return null;
      }
      return this.buildRouteInfo(persisted);
    }
    return this.buildRouteInfo(tracking);
  }

  private buildRouteInfo(tracking: TrackedDelivery): {
    currentLocation: GeoLocation | null;
    destination: GeoLocation | null;
    route: GeoLocation[];
    progress: number;
  } | null {
    const delivery = deliveryService.getDeliveryById(tracking.deliveryId);
    if (!delivery) {
      return null;
    }

    const currentLocation = tracking.locationHistory[tracking.locationHistory.length - 1] || null;
    const progress = this.calculateProgress(tracking);

    return {
      currentLocation,
      destination: null,
      route: tracking.locationHistory,
      progress
    };
  }

  private calculateProgress(tracking: TrackedDelivery): number {
    if (tracking.locationHistory.length < 2) {
      return 0;
    }

    const firstLocation = tracking.locationHistory[0];
    const lastLocation = tracking.locationHistory[tracking.locationHistory.length - 1];

    const timeElapsed = lastLocation.timestamp!.getTime() - firstLocation.timestamp!.getTime();
    const totalTime = Date.now() - tracking.startTime.getTime();

    return Math.min(100, Math.round((timeElapsed / totalTime) * 100));
  }

  public async getDeliveryHistory(deliveryId: string): Promise<GeoLocation[]> {
    const tracking = this.trackedDeliveries.get(deliveryId);
    if (tracking) {
      return tracking.locationHistory;
    }

    const persisted = await this.getPersistedTrackingState(deliveryId);
    return persisted?.locationHistory || [];
  }

  public async getActiveDeliveries(): Promise<string[]> {
    return Array.from(this.trackedDeliveries.keys());
  }

  public async getTrackingInfo(deliveryId: string): Promise<TrackedDelivery | null> {
    return this.trackedDeliveries.get(deliveryId) || null;
  }

  public subscribeToDelivery(
    deliveryId: string,
    callback: (event: TrackingEvent) => void
  ): () => void {
    if (!this.eventEmitter.has(deliveryId)) {
      this.eventEmitter.set(deliveryId, []);
    }
    this.eventEmitter.get(deliveryId)!.push(callback);

    return () => {
      const callbacks = this.eventEmitter.get(deliveryId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private async publishTrackingEvent(event: TrackingEvent): Promise<void> {
    const redis = redisClient.getClient();
    const channel = `tracking:${event.deliveryId}`;
    await redis.publish(channel, JSON.stringify(event));

    const callbacks = this.eventEmitter.get(event.deliveryId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          logger.error('Tracking event callback error:', error);
        }
      });
    }
  }

  private async persistTrackingState(
    deliveryId: string,
    tracking: TrackedDelivery
  ): Promise<void> {
    const redis = redisClient.getClient();
    const key = `tracking:${deliveryId}`;
    await redis.set(key, JSON.stringify(tracking), 'EX', 86400);
  }

  private async getPersistedTrackingState(
    deliveryId: string
  ): Promise<TrackedDelivery | null> {
    try {
      const redis = redisClient.getClient();
      const data = await redis.get(`tracking:${deliveryId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Error getting persisted tracking state:', error);
    }
    return null;
  }

  private async clearTrackingState(deliveryId: string): Promise<void> {
    const redis = redisClient.getClient();
    await redis.del(`tracking:${deliveryId}`);
  }

  private async updateDeliveryEta(
    deliveryId: string,
    eta: ETACalculation
  ): Promise<void> {
    const { Delivery } = await import('../models/Delivery');
    await Delivery.findByIdAndUpdate(deliveryId, { eta });
  }

  public async getDriverLiveLocation(driverId: string): Promise<GeoLocation | null> {
    const redis = redisClient.getClient();
    const key = `driver:live:${driverId}`;
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  public async updateDriverLiveLocation(
    driverId: string,
    location: GeoLocation
  ): Promise<void> {
    const redis = redisClient.getClient();
    const key = `driver:live:${driverId}`;
    await redis.set(
      key,
      JSON.stringify({ ...location, timestamp: new Date() }),
      'EX',
      60
    );
  }

  public async getNearbyDrivers(
    location: GeoLocation,
    radiusKm: number
  ): Promise<Array<{ driverId: string; location: GeoLocation; distance: number }>> {
    const availableDrivers = await driverService.getAvailableDrivers(location);
    const { calculateDistance } = await import('../utils/geo');

    const nearbyDrivers = availableDrivers
      .map((driver) => {
        if (!driver.currentLocation) return null;
        const distance = calculateDistance(location, driver.currentLocation);
        if (distance <= radiusKm) {
          return {
            driverId: driver._id?.toString() || '',
            location: driver.currentLocation,
            distance
          };
        }
        return null;
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => a.distance - b.distance);

    return nearbyDrivers;
  }
}

export const trackingService = TrackingService.getInstance();
export default trackingService;
