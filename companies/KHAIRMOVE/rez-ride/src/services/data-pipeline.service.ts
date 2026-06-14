/**
 * ReZ Intelligence - Complete Data Pipeline
 *
 * Sends ALL data continuously to ReZ Intelligence:
 * - User location history
 * - Real-time driver locations
 * - Ride patterns
 * - Demand heatmaps
 * - Route data
 */

import { intelligenceService } from './intelligence.service';
import { Logger } from '@nestjs/common';

export class DataPipelineService {
  private readonly logger = new Logger('DataPipelineService');

  // Event queues
  private eventQueue: any[] = [];
  private locationQueue: LocationData[] = [];
  private driverLocationQueue: DriverLocation[] = [];
  private demandSignals: DemandSignal[] = [];

  // Config
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 3000; // 3 seconds
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushInterval();
    this.logger.log('Data pipeline started - sending ALL data to ReZ Intelligence');
  }

  // ===========================================
  // LOCATION DATA (Real-time)
  // ===========================================

  /**
   * Track user location (from user app GPS)
   */
  trackUserLocation(userId: string, location: {
    lat: number;
    lng: number;
    accuracy: number;
    speed?: number;
    heading?: number;
    timestamp: Date;
  }): void {
    const locationData: LocationData = {
      type: 'user_location',
      userId,
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
      },
      timestamp: location.timestamp,
      metadata: {
        appVersion: '1.0.0',
        platform: 'ios',
      },
    };

    this.locationQueue.push(locationData);

    // Track for demand signals
    this.trackDemandFromLocation(userId, location);
  }

  /**
   * Track driver location (real-time, every 5 seconds)
   */
  trackDriverLocation(driverId: string, location: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    status: 'online' | 'busy' | 'offline';
    timestamp: Date;
  }): void {
    const driverData: DriverLocation = {
      driverId,
      location: {
        lat: location.lat,
        lng: location.lng,
        heading: location.heading,
        speed: location.speed,
      },
      status: location.status,
      isMoving: location.speed > 5,
      timestamp: location.timestamp,
    };

    this.driverLocationQueue.push(driverData);

    // Real-time sync to driver matching
    this.syncDriverLocation(driverId, location).catch(() => {});
  }

  /**
   * Track ride route (complete path)
   */
  trackRoute(rideId: string, data: {
    userId: string;
    driverId: string;
    path: { lat: number; lng: number; timestamp: Date }[];
    distance: number;
    duration: number;
    pickupTime: Date;
    dropTime: Date;
  }): void {
    this.enqueue({
      type: 'route_completed',
      data,
      timestamp: new Date(),
    });
  }

  // ===========================================
  // USER BEHAVIOR DATA
  // ===========================================

  /**
   * Track ride search
   */
  trackSearch(userId: string, data: {
    pickup: { lat: number; lng: number; address: string };
    drop: { lat: number; lng: number; address: string };
    vehicleType: string;
    surge?: number;
  }): void {
    this.enqueue({
      type: 'ride_search',
      userId,
      data,
      timestamp: new Date(),
    });

    // Track demand signal
    this.demandSignals.push({
      type: 'search',
      location: data.pickup,
      vehicleType: data.vehicleType,
      surge: data.surge,
      timestamp: new Date(),
    });
  }

  /**
   * Track ride booking
   */
  trackBooking(userId: string, data: {
    rideId: string;
    pickup: { lat: number; lng: number; address: string };
    drop: { lat: number; lng: number; address: string };
    vehicleType: string;
    fare: number;
    distance: number;
    promoCode?: string;
  }): void {
    this.enqueue({
      type: 'ride_booked',
      userId,
      data,
      timestamp: new Date(),
    });

    // Update LTV immediately
    intelligenceService.updateLTV(userId, {
      fare: data.fare,
      distance: data.distance,
      vehicleType: data.vehicleType,
    }).catch(() => {});
  }

  /**
   * Track ride completion
   */
  trackCompletion(userId: string, data: {
    rideId: string;
    fare: number;
    distance: number;
    duration: number;
    vehicleType: string;
    rating?: number;
    pickup: { lat: number; lng: number };
    drop: { lat: number; lng: number };
    cashback: number;
    driverId: string;
  }): void {
    this.enqueue({
      type: 'ride_completed',
      userId,
      data,
      timestamp: new Date(),
    });

    // Update ML models
    intelligenceService.updateLTV(userId, {
      fare: data.fare,
      distance: data.distance,
      vehicleType: data.vehicleType,
    }).catch(() => {});

    // Check churn
    intelligenceService.predictChurn(userId).then(churn => {
      if (churn.risk !== 'low') {
        intelligenceService.triggerRetention(userId, churn).catch(() => {});
      }
    }).catch(() => {});
  }

  /**
   * Track cancellation
   */
  trackCancellation(userId: string, data: {
    rideId: string;
    reason: string;
    stage: 'before_accept' | 'after_accept' | 'after_arrival';
    driverId?: string;
    estimatedFare?: number;
  }): void {
    this.enqueue({
      type: 'ride_cancelled',
      userId,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Track user rating
   */
  trackRating(userId: string, data: {
    rideId: string;
    rating: number;
    comment?: string;
    driverId: string;
    aspects?: { safety: number; cleanliness: number; driving: number };
  }): void {
    this.enqueue({
      type: 'ride_rated',
      userId,
      data,
      timestamp: new Date(),
    });
  }

  // ===========================================
  // DEMAND/SUPPLY DATA
  // ===========================================

  /**
   * Track demand signal at location
   */
  private trackDemandFromLocation(userId: string, location: { lat: number; lng: number }): void {
    this.demandSignals.push({
      type: 'user_present',
      location,
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Get demand heatmap data
   */
  getDemandHeatmap(): { lat: number; lng: number; intensity: number }[] {
    const grid: Map<string, { count: number; lat: number; lng: number }> = new Map();

    this.demandSignals.forEach(signal => {
      const key = `${signal.location.lat.toFixed(2)},${signal.location.lng.toFixed(2)}`;
      const existing = grid.get(key) || { count: 0, lat: signal.location.lat, lng: signal.location.lng };
      existing.count++;
      grid.set(key, existing);
    });

    return Array.from(grid.values()).map(g => ({
      lat: g.lat,
      lng: g.lng,
      intensity: Math.min(g.count / 10, 1), // Normalize 0-1
    }));
  }

  /**
   * Get supply heatmap (driver locations)
   */
  getSupplyHeatmap(): { lat: number; lng: number; intensity: number }[] {
    const grid: Map<string, { count: number; lat: number; lng: number }> = new Map();

    this.driverLocationQueue.forEach(d => {
      if (d.status !== 'offline') {
        const key = `${d.location.lat.toFixed(2)},${d.location.lng.toFixed(2)}`;
        const existing = grid.get(key) || { count: 0, lat: d.location.lat, lng: d.location.lng };
        existing.count++;
        grid.set(key, existing);
      }
    });

    return Array.from(grid.values()).map(g => ({
      lat: g.lat,
      lng: g.lng,
      intensity: Math.min(g.count / 5, 1),
    }));
  }

  // ===========================================
  // REAL-TIME SYNC
  // ===========================================

  /**
   * Sync driver location to matching service
   */
  private async syncDriverLocation(driverId: string, location: any): Promise<void> {
    try {
      await intelligenceService.trackEvent({
        type: 'driver_location_update',
        userId: driverId,
        data: location,
        timestamp: new Date(),
      });
    } catch (error) {
      // Silently fail - don't block the queue
    }
  }

  /**
   * Get real-time insights for operations
   */
  async getOperationalInsights(): Promise<{
    activeUsers: number;
    activeDrivers: number;
    demandSupplyRatio: number;
    hotSpots: { lat: number; lng: number; score: number }[];
  }> {
    const demand = this.demandSignals.length;
    const supply = this.driverLocationQueue.filter(d => d.status !== 'offline').length;

    return {
      activeUsers: demand,
      activeDrivers: supply,
      demandSupplyRatio: supply > 0 ? demand / supply : 0,
      hotSpots: this.getDemandHeatmap()
        .filter(h => h.intensity > 0.5)
        .map(h => ({ lat: h.lat, lng: h.lng, score: h.intensity })),
    };
  }

  // ===========================================
  // PRIVATE METHODS
  // ===========================================

  private enqueue(event: any): void {
    this.eventQueue.push(event);
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flushAll();
    }, this.FLUSH_INTERVAL_MS);
  }

  private async flushAll(): Promise<void> {
    // Flush user events
    if (this.eventQueue.length > 0) {
      const events = [...this.eventQueue];
      this.eventQueue = [];
      await this.flushEvents(events);
    }

    // Flush location data
    if (this.locationQueue.length > 0) {
      const locations = [...this.locationQueue];
      this.locationQueue = [];
      await this.flushLocations(locations);
    }

    // Flush driver locations
    if (this.driverLocationQueue.length > 0) {
      const drivers = [...this.driverLocationQueue];
      this.driverLocationQueue = [];
      await this.flushDriverLocations(drivers);
    }

    // Flush demand signals
    if (this.demandSignals.length > 0) {
      const signals = [...this.demandSignals];
      this.demandSignals = [];
      await this.flushDemandSignals(signals);
    }
  }

  private async flushEvents(events: any[]): Promise<void> {
    try {
      await Promise.all(events.map(event =>
        intelligenceService.trackEvent({
          ...event,
          timestamp: event.timestamp || new Date(),
        })
      ));
      this.logger.debug(`Flushed ${events.length} events`);
    } catch (error) {
      this.eventQueue = [...events, ...this.eventQueue];
    }
  }

  private async flushLocations(locations: LocationData[]): Promise<void> {
    try {
      await Promise.all(locations.map(loc =>
        intelligenceService.trackEvent({
          type: 'location_update',
          userId: loc.userId,
          data: loc.location,
          timestamp: loc.timestamp,
        })
      ));
    } catch (error) {
      this.locationQueue = [...locations, ...this.locationQueue];
    }
  }

  private async flushDriverLocations(locations: DriverLocation[]): Promise<void> {
    try {
      await Promise.all(locations.map(loc =>
        intelligenceService.trackEvent({
          type: 'driver_location',
          userId: loc.driverId,
          data: loc,
          timestamp: loc.timestamp,
        })
      ));
    } catch (error) {
      this.driverLocationQueue = [...locations, ...this.driverLocationQueue];
    }
  }

  private async flushDemandSignals(signals: DemandSignal[]): Promise<void> {
    try {
      await intelligenceService.trackEvent({
        type: 'demand_batch',
        userId: 'system',
        data: { signals },
        timestamp: new Date(),
      });
    } catch (error) {
      this.demandSignals = [...signals, ...this.demandSignals];
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flushAll();
    this.logger.log('Data pipeline shutdown complete');
  }
}

// Types
interface LocationData {
  type: string;
  userId: string;
  location: {
    lat: number;
    lng: number;
    accuracy: number;
    speed?: number;
    heading?: number;
  };
  timestamp: Date;
  metadata?: Record<string, string>;
}

interface DriverLocation {
  driverId: string;
  location: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
  };
  status: 'online' | 'busy' | 'offline';
  isMoving: boolean;
  timestamp: Date;
}

interface DemandSignal {
  type: 'search' | 'user_present';
  location: { lat: number; lng: number };
  userId?: string;
  vehicleType?: string;
  surge?: number;
  timestamp: Date;
}

export const dataPipelineService = new DataPipelineService();
