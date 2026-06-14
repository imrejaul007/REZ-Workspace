import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { Ride } from '../models/ride.model';
import { Driver } from '../models/driver.model';

/**
 * Event Types for the Pipeline
 */
export enum EventType {
  // Ride Events
  RIDE_REQUESTED = 'ride.requested',
  RIDE_ASSIGNED = 'ride.assigned',
  RIDE_ACCEPTED = 'ride.accepted',
  RIDE_ARRIVED = 'ride.arrived',
  RIDE_STARTED = 'ride.started',
  RIDE_COMPLETED = 'ride.completed',
  RIDE_CANCELLED = 'ride.cancelled',

  // Driver Events
  DRIVER_ONLINE = 'driver.online',
  DRIVER_OFFLINE = 'driver.offline',
  DRIVER_LOCATION = 'driver.location',
  DRIVER_EARNINGS = 'driver.earnings',

  // User Events
  USER_BOOKING = 'user.booking',
  USER_PAYMENT = 'user.payment',
  USER_RATING = 'user.rating',

  // System Events
  SURGE_UPDATED = 'surge.updated',
  DEMAND_SPIKE = 'demand.spike',
  FRAUD_DETECTED = 'fraud.detected',
}

/**
 * Base Event Interface
 */
export interface BaseEvent {
  eventId: string;
  eventType: EventType;
  timestamp: Date;
  source: 'user_app' | 'driver_app' | 'backend' | 'system';
  sessionId?: string;
  userId?: string;
  driverId?: string;
  rideId?: string;
  zoneId?: string;
  location?: { lat: number; lng: number };
  metadata?: Record<string, any>;
}

/**
 * Ride Event
 */
export interface RideEvent extends BaseEvent {
  rideId: string;
  userId: string;
  driverId?: string;
  pickup: { lat: number; lng: number };
  drop: { lat: number; lng: number };
  vehicleType: string;
  fare: number;
  status: string;
}

/**
 * Driver Location Event
 */
export interface DriverLocationEvent extends BaseEvent {
  driverId: string;
  location: { lat: number; lng: number };
  heading?: number;
  speed?: number;
  status: string;
  zoneId?: string;
}

/**
 * Demand Event
 */
export interface DemandEvent extends BaseEvent {
  zoneId: string;
  location: { lat: number; lng: number };
  rideRequests: number;
  availableDrivers: number;
  surgeMultiplier: number;
}

/**
 * Fraud Event
 */
export interface FraudEvent extends BaseEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  driverId?: string;
  description: string;
  actions: string[];
}

@Injectable()
export class EventPipelineService {
  private readonly logger = new Logger(EventPipelineService.name);

  // Event store (in production, use Kafka + Redis)
  private eventStore: Map<string, any[]> = new Map();
  private subscribers: Map<EventType, Function[]> = new Map();

  // Models
  private rideModel: Model<any>;
  private driverModel: Model<any>;

  constructor(rideModel?: Model<any>, driverModel?: Model<any>) {
    this.rideModel = rideModel || mongoose.model('Ride') as Model<any>;
    this.driverModel = driverModel || mongoose.model('Driver') as Model<any>;
    // Initialize subscribers
    this.initializeSubscribers();
  }

  /**
   * Publish an event
   */
  async publish(event: BaseEvent): Promise<void> {
    // Generate event ID if not present
    if (!event.eventId) {
      event.eventId = `EVT_${Date.now()}_${randomBytes(6).toString('hex')}`;
    }

    // Set timestamp
    if (!event.timestamp) {
      event.timestamp = new Date();
    }

    // Store event (in production, publish to Kafka)
    await this.storeEvent(event);

    // Process in real-time
    await this.processEvent(event);

    // Notify subscribers
    await this.notifySubscribers(event);

    this.logger.debug(`Event published: ${event.eventType} - ${event.eventId}`);
  }

  /**
   * Store event for later processing
   */
  private async storeEvent(event: BaseEvent): Promise<void> {
    // Partition by event type for efficient querying
    const partition = this.eventStore.get(event.eventType) || [];
    partition.push(event);

    // Keep last 10,000 events per type (in production, use Kafka retention)
    if (partition.length > 10000) {
      partition.shift();
    }

    this.eventStore.set(event.eventType, partition);
  }

  /**
   * Process event in real-time
   */
  private async processEvent(event: BaseEvent): Promise<void> {
    switch (event.eventType) {
      case EventType.RIDE_REQUESTED:
        await this.handleRideRequested(event as RideEvent);
        break;
      case EventType.RIDE_COMPLETED:
        await this.handleRideCompleted(event as RideEvent);
        break;
      case EventType.DRIVER_LOCATION:
        await this.handleDriverLocation(event as DriverLocationEvent);
        break;
      case EventType.FRAUD_DETECTED:
        await this.handleFraudDetected(event as FraudEvent);
        break;
    }
  }

  /**
   * Handle ride requested
   */
  private async handleRideRequested(event: RideEvent): Promise<void> {
    // Update demand metrics
    await this.updateDemandMetrics(event);

    // Check for surge
    await this.checkSurgeConditions(event);

    // Log for analytics
    this.logger.log(`Ride requested: ${event.rideId} at [${event.pickup.lat}, ${event.pickup.lng}]`);
  }

  /**
   * Handle ride completed
   */
  private async handleRideCompleted(event: RideEvent): Promise<void> {
    // Update ride metrics
    await this.updateRideMetrics(event);

    // Update driver metrics
    await this.updateDriverMetrics(event);

    // Update zone analytics
    await this.updateZoneAnalytics(event);

    // Trigger cross-promotion
    await this.triggerCrossPromotion(event);
  }

  /**
   * Handle driver location update
   */
  private async handleDriverLocation(event: DriverLocationEvent): Promise<void> {
    // Update driver location in DB
    await this.driverModel.findByIdAndUpdate(event.driverId, {
      currentLocation: event.location,
      lastActiveAt: event.timestamp,
    });

    // Update zone assignment
    const zoneId = this.getZoneId(event.location.lat, event.location.lng);
    if (zoneId !== event.zoneId) {
      await this.updateDriverZone(event.driverId, zoneId);
    }
  }

  /**
   * Handle fraud detected
   */
  private async handleFraudDetected(event: FraudEvent): Promise<void> {
    this.logger.warn(`FRAUD DETECTED: ${event.type} - ${event.description}`);

    // Take immediate action based on severity
    if (event.severity === 'high' || event.severity === 'critical') {
      await this.blockUser(event.userId);
      await this.blockDriver(event.driverId);
    }

    // Alert operations team
    await this.alertOperations(event);
  }

  /**
   * Update demand metrics for zone
   */
  private async updateDemandMetrics(event: RideEvent): Promise<void> {
    const zoneId = this.getZoneId(event.pickup.lat, event.pickup.lng);

    // In production, update Redis counters
    this.logger.debug(`Demand updated for zone ${zoneId}`);
  }

  /**
   * Check surge conditions
   */
  private async checkSurgeConditions(event: RideEvent): Promise<void> {
    const zoneId = this.getZoneId(event.pickup.lat, event.pickup.lng);

    // Calculate demand ratio
    const demandRatio = await this.getDemandRatio(zoneId);

    if (demandRatio > 2.0) {
      // Publish surge event
      await this.publish({
        eventId: '',
        eventType: EventType.SURGE_UPDATED,
        timestamp: new Date(),
        source: 'system',
        zoneId,
        metadata: { demandRatio, multiplier: this.calculateSurgeMultiplier(demandRatio) },
      });
    }
  }

  /**
   * Update ride metrics
   */
  private async updateRideMetrics(event: RideEvent): Promise<void> {
    // Update ride model with final metrics
    await this.rideModel.findByIdAndUpdate(event.rideId, {
      completedAt: event.timestamp,
      actualFare: event.fare,
    });
  }

  /**
   * Update driver metrics
   */
  private async updateDriverMetrics(event: RideEvent): Promise<void> {
    if (!event.driverId) return;

    await this.driverModel.findByIdAndUpdate(event.driverId, {
      $inc: {
        totalRides: 1,
        totalEarnings: event.fare,
      },
      lastRideAt: event.timestamp,
    });
  }

  /**
   * Update zone analytics
   */
  private async updateZoneAnalytics(event: RideEvent): Promise<void> {
    const zoneId = this.getZoneId(event.pickup.lat, event.pickup.lng);
    // In production, update analytics DB
    this.logger.debug(`Zone ${zoneId} analytics updated`);
  }

  /**
   * Trigger cross-promotion
   */
  private async triggerCrossPromotion(event: RideEvent): Promise<void> {
    // Check if user visited a merchant location
    // Trigger voucher campaign if applicable
    this.logger.debug(`Cross-promotion check for ride ${event.rideId}`);
  }

  /**
   * Get zone ID from coordinates
   */
  private getZoneId(lat: number, lng: number): string {
    // H3-based zone calculation
    const latHex = Math.floor(lat * 100);
    const lngHex = Math.floor(lng * 100);
    return `zone_${latHex}_${lngHex}`;
  }

  /**
   * Get demand ratio for zone
   */
  private async getDemandRatio(zoneId: string): Promise<number> {
    // In production, calculate from Redis counters
    // Demand = rides requested in last 15 mins
    // Supply = available drivers in zone
    return 1.0 + (randomBytes(4).readUInt32LE(0) / 0xFFFFFFFF); // Placeholder
  }

  /**
   * Calculate surge multiplier
   */
  private calculateSurgeMultiplier(ratio: number): number {
    if (ratio >= 5) return 3.0;
    if (ratio >= 4) return 2.5;
    if (ratio >= 3) return 2.0;
    if (ratio >= 2) return 1.5;
    if (ratio >= 1.5) return 1.25;
    return 1.0;
  }

  /**
   * Update driver zone
   */
  private async updateDriverZone(driverId: string, zoneId: string): Promise<void> {
    // In production, update Redis geo index
    this.logger.debug(`Driver ${driverId} moved to zone ${zoneId}`);
  }

  /**
   * Block user
   */
  private async blockUser(userId?: string): Promise<void> {
    if (!userId) return;
    this.logger.warn(`User ${userId} blocked`);
  }

  /**
   * Block driver
   */
  private async blockDriver(driverId?: string): Promise<void> {
    if (!driverId) return;
    this.logger.warn(`Driver ${driverId} blocked`);
  }

  /**
   * Alert operations team
   */
  private async alertOperations(event: FraudEvent): Promise<void> {
    // Send to Slack, PagerDuty, etc.
    this.logger.error(`ALERT: ${event.severity.toUpperCase()} - ${event.type}`);
  }

  // ===========================================
  // SUBSCRIPTION SYSTEM
  // ===========================================

  /**
   * Subscribe to event type
   */
  subscribe(eventType: EventType, callback: Function): void {
    const subs = this.subscribers.get(eventType) || [];
    subs.push(callback);
    this.subscribers.set(eventType, subs);
  }

  /**
   * Unsubscribe from event type
   */
  unsubscribe(eventType: EventType, callback: Function): void {
    const subs = this.subscribers.get(eventType) || [];
    const index = subs.indexOf(callback);
    if (index > -1) {
      subs.splice(index, 1);
    }
  }

  /**
   * Notify subscribers
   */
  private async notifySubscribers(event: BaseEvent): Promise<void> {
    const subs = this.subscribers.get(event.eventType) || [];
    for (const callback of subs) {
      try {
        await callback(event);
      } catch (error) {
        this.logger.error(`Subscriber error: ${error.message}`);
      }
    }
  }

  // ===========================================
  // EVENT QUERYING
  // ===========================================

  /**
   * Get events by type
   */
  async getEvents(
    eventType: EventType,
    options?: {
      limit?: number;
      startTime?: Date;
      endTime?: Date;
      userId?: string;
      driverId?: string;
    }
  ): Promise<any[]> {
    let events = this.eventStore.get(eventType) || [];

    // Extract options to avoid TS narrowing issues
    const startTime = options?.startTime;
    const endTime = options?.endTime;
    const userId = options?.userId;
    const driverId = options?.driverId;

    // Filter by time
    if (startTime !== undefined) {
      events = events.filter(e => e.timestamp >= startTime);
    }
    if (endTime !== undefined) {
      events = events.filter(e => e.timestamp <= endTime);
    }

    // Filter by user/driver
    if (options?.userId) {
      events = events.filter(e => e.userId === options.userId);
    }
    if (options?.driverId) {
      events = events.filter(e => e.driverId === options.driverId);
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp - a.timestamp);

    // Limit
    if (options?.limit) {
      events = events.slice(0, options.limit);
    }

    return events;
  }

  /**
   * Get user timeline
   */
  async getUserTimeline(
    userId: string,
    options?: { limit?: number; startTime?: Date }
  ): Promise<any[]> {
    const allEvents: any[] = [];

    // Collect all user events
    for (const [eventType, events] of this.eventStore.entries()) {
      const userEvents = events.filter(e => e.userId === userId);
      allEvents.push(...userEvents);
    }

    // Sort by timestamp
    allEvents.sort((a, b) => b.timestamp - a.timestamp);

    // Limit
    if (options?.limit) {
      return allEvents.slice(0, options.limit);
    }

    return allEvents;
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(): Promise<{
    totalRides: number;
    totalRevenue: number;
    avgRideValue: number;
    peakHour: number;
    topZones: { zoneId: string; rides: number }[];
  }> {
    const rideEvents = this.eventStore.get(EventType.RIDE_COMPLETED) || [];

    const totalRides = rideEvents.length;
    const totalRevenue = rideEvents.reduce((sum, e) => sum + (e.fare || 0), 0);
    const avgRideValue = totalRides > 0 ? totalRevenue / totalRides : 0;

    // Calculate peak hour
    const hourCounts = new Map<number, number>();
    for (const event of rideEvents) {
      const hour = new Date(event.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }
    let peakHour = 9;
    let maxCount = 0;
    for (const [hour, count] of hourCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    }

    // Top zones
    const zoneCounts = new Map<string, number>();
    for (const event of rideEvents) {
      const zoneId = this.getZoneId(event.pickup.lat, event.pickup.lng);
      zoneCounts.set(zoneId, (zoneCounts.get(zoneId) || 0) + 1);
    }
    const topZones = Array.from(zoneCounts.entries())
      .map(([zoneId, rides]) => ({ zoneId, rides }))
      .sort((a, b) => b.rides - a.rides)
      .slice(0, 10);

    return {
      totalRides,
      totalRevenue,
      avgRideValue: Math.round(avgRideValue * 100) / 100,
      peakHour,
      topZones,
    };
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  private initializeSubscribers(): void {
    // Subscribe to high-priority events
    this.subscribe(EventType.FRAUD_DETECTED, async (event: FraudEvent) => {
      await this.handleFraudDetected(event);
    });

    this.subscribe(EventType.RIDE_COMPLETED, async (event: RideEvent) => {
      await this.triggerCrossPromotion(event);
    });
  }
}
