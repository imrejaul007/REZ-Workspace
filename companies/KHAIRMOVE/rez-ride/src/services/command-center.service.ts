import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { randomInt } from 'crypto';
import { Ride } from '../models/ride.model';
import { Driver } from '../models/driver.model';

/**
 * Command Center Types
 */
export interface DashboardMetrics {
  // Real-time
  activeRides: number;
  activeDrivers: number;
  availableDrivers: number;
  ridesInProgress: number;

  // Today's stats
  todayRides: number;
  todayRevenue: number;
  avgRideValue: number;
  avgETA: number;

  // Demand/Supply
  currentDemand: number;
  currentSupply: number;
  demandSupplyRatio: number;
  activeSurgeZones: number;

  // Performance
  acceptanceRate: number;
  cancellationRate: number;
  completionRate: number;
  avgRating: number;

  // Alerts
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  actionRequired: boolean;
}

export enum AlertType {
  SURGE = 'surge',
  NO_DRIVERS = 'no_drivers',
  HIGH_CANCELLATION = 'high_cancellation',
  FRAUD_DETECTED = 'fraud_detected',
  SYSTEM_ISSUE = 'system_issue',
  WEATHER = 'weather',
  DEMAND_SPIKE = 'demand_spike',
}

export interface HeatMapZone {
  zoneId: string;
  lat: number;
  lng: number;
  intensity: number; // 0-1
  rides: number;
  drivers: number;
  supplyDemand: number; // drivers/rides
}

export interface DriverAllocation {
  zoneId: string;
  zoneName: string;
  currentDrivers: number;
  optimalDrivers: number;
  deficit: number;
  surplus: number;
}

export interface LiveRide {
  rideId: string;
  status: string;
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  driver: { id: string; name: string; lat: number; lng: number };
  eta: number;
  fare: number;
  startedAt: Date;
}

@Injectable()
export class CommandCenterService {
  private readonly logger = new Logger(CommandCenterService.name);

  // Real-time state
  private activeRides: number = 0;
  private activeDrivers: number = 0;
  private alerts: Alert[] = [];

  // Historical data for calculations
  private rideHistory: number[] = [];
  private driverHistory: number[] = [];

  // Models - can be set via setter or constructor
  private rideModel: Model<any>;
  private driverModel: Model<any>;

  constructor(rideModel?: Model<any>, driverModel?: Model<any>) {
    this.rideModel = rideModel || mongoose.model('Ride') as Model<any>;
    this.driverModel = driverModel || mongoose.model('Driver') as Model<any>;
    // Initialize command center
    this.initialize();
  }

  private initialize(): void {
    // Start periodic metrics updates
    setInterval(() => this.updateMetrics(), 5000);
    setInterval(() => this.generateAlerts(), 30000);
  }

  // ===========================================
  // DASHBOARD METRICS
  // ===========================================

  /**
   * Get real-time dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query database for current state
    const [
      totalRides,
      activeRides,
      totalDrivers,
      onlineDrivers,
      completedToday,
      cancelledToday,
    ] = await Promise.all([
      this.rideModel.countDocuments(),
      this.rideModel.countDocuments({ status: { $in: ['assigned', 'accepted', 'arrived', 'in_progress'] } }),
      this.driverModel.countDocuments(),
      this.driverModel.countDocuments({ status: 'online' }),
      this.rideModel.countDocuments({ status: 'completed', requestedAt: { $gte: today } }),
      this.rideModel.countDocuments({ status: 'cancelled', requestedAt: { $gte: today } }),
    ]);

    // Calculate today's revenue
    const todayRides = await this.rideModel.find({
      status: 'completed',
      requestedAt: { $gte: today }
    });
    const todayRevenue = todayRides.reduce((sum, r) => sum + (r.fare?.total || 0), 0);

    // Calculate average ride value
    const avgRideValue = completedToday > 0 ? todayRevenue / completedToday : 0;

    // Get current demand (pending requests)
    const currentDemand = await this.rideModel.countDocuments({
      status: 'requested',
      requestedAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 mins
    });

    // Update state
    this.activeRides = activeRides;
    this.activeDrivers = onlineDrivers;

    // Calculate rates
    const totalAttempts = completedToday + cancelledToday;
    const cancellationRate = totalAttempts > 0 ? cancelledToday / totalAttempts : 0;
    const completionRate = totalAttempts > 0 ? completedToday / totalAttempts : 0;

    // Get average rating
    const drivers = await this.driverModel.find().select('rating');
    const avgRating = drivers.length > 0
      ? drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length
      : 4.5;

    return {
      activeRides,
      activeDrivers: onlineDrivers,
      availableDrivers: onlineDrivers,
      ridesInProgress: activeRides,
      todayRides: completedToday,
      todayRevenue,
      avgRideValue: Math.round(avgRideValue * 100) / 100,
      avgETA: 8, // Mock
      currentDemand,
      currentSupply: onlineDrivers,
      demandSupplyRatio: onlineDrivers > 0 ? currentDemand / onlineDrivers : 0,
      activeSurgeZones: this.countSurgeZones(),
      acceptanceRate: 0.85, // Mock
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      avgRating: Math.round(avgRating * 10) / 10,
      alerts: this.alerts.slice(0, 10),
    };
  }

  // ===========================================
  // HEAT MAP
  // ===========================================

  /**
   * Get driver heat map
   */
  async getDriverHeatMap(): Promise<HeatMapZone[]> {
    // Get all online drivers with locations
    const drivers = await this.driverModel.find({
      status: 'online',
      currentLocation: { $exists: true }
    });

    // Group drivers into grid cells
    const gridCells = new Map<string, HeatMapZone>();

    for (const driver of drivers) {
      if (!driver.currentLocation) continue;

      const zoneId = this.getZoneId(driver.currentLocation.lat, driver.currentLocation.lng);
      const zone = gridCells.get(zoneId) || {
        zoneId,
        lat: driver.currentLocation.lat,
        lng: driver.currentLocation.lng,
        intensity: 0,
        rides: 0,
        drivers: 0,
        supplyDemand: 0,
      };

      zone.drivers++;
      gridCells.set(zoneId, zone);
    }

    // Calculate intensity
    const zones = Array.from(gridCells.values());
    const maxDrivers = Math.max(...zones.map(z => z.drivers), 1);

    for (const zone of zones) {
      zone.intensity = zone.drivers / maxDrivers;
    }

    return zones;
  }

  /**
   * Get demand heat map
   */
  async getDemandHeatMap(): Promise<HeatMapZone[]> {
    // Get recent ride requests
    const recentRequests = await this.rideModel.find({
      requestedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
    });

    // Group by zone
    const gridCells = new Map<string, HeatMapZone>();

    for (const ride of recentRequests) {
      const zoneId = this.getZoneId(ride.pickup.lat, ride.pickup.lng);
      const zone = gridCells.get(zoneId) || {
        zoneId,
        lat: ride.pickup.lat,
        lng: ride.pickup.lng,
        intensity: 0,
        rides: 0,
        drivers: 0,
        supplyDemand: 0,
      };

      zone.rides++;
      gridCells.set(zoneId, zone);
    }

    // Calculate intensity
    const zones = Array.from(gridCells.values());
    const maxRides = Math.max(...zones.map(z => z.rides), 1);

    for (const zone of zones) {
      zone.intensity = zone.rides / maxRides;
    }

    return zones;
  }

  /**
   * Get combined supply-demand map
   */
  async getSupplyDemandMap(): Promise<HeatMapZone[]> {
    const [supplyMap, demandMap] = await Promise.all([
      this.getDriverHeatMap(),
      this.getDemandHeatMap(),
    ]);

    // Merge maps
    const allZones = new Map<string, HeatMapZone>();

    for (const zone of supplyMap) {
      allZones.set(zone.zoneId, zone);
    }

    for (const zone of demandMap) {
      const existing = allZones.get(zone.zoneId);
      if (existing) {
        existing.rides = zone.rides;
        existing.supplyDemand = existing.drivers > 0 ? zone.rides / existing.drivers : 0;
        existing.intensity = Math.max(existing.intensity, zone.intensity);
      } else {
        zone.supplyDemand = 0;
        allZones.set(zone.zoneId, zone);
      }
    }

    return Array.from(allZones.values());
  }

  // ===========================================
  // LIVE RIDES
  // ===========================================

  /**
   * Get all live rides
   */
  async getLiveRides(): Promise<LiveRide[]> {
    const rides = await this.rideModel.find({
      status: { $in: ['assigned', 'accepted', 'arrived', 'in_progress'] }
    })
      .populate('driverId', 'name currentLocation')
      .limit(100);

    return rides.map(ride => ({
      rideId: ride._id.toString(),
      status: ride.status,
      pickup: ride.pickup,
      drop: ride.drop,
      driver: {
        id: (ride.driverId as any)?._id?.toString() || '',
        name: (ride.driverId as any)?.name || 'Unknown',
        lat: (ride.driverId as any)?.currentLocation?.lat || 0,
        lng: (ride.driverId as any)?.currentLocation?.lng || 0,
      },
      eta: 5, // Mock
      fare: ride.fare?.total || 0,
      startedAt: ride.requestedAt,
    }));
  }

  /**
   * Get ride stream for WebSocket
   */
  async getRideStream(rideId: string): Promise<{
    rideId: string;
    driverLocation: { lat: number; lng: number };
    eta: number;
    status: string;
    timestamp: Date;
  } | null> {
    const ride = await this.rideModel.findById(rideId);
    if (!ride) return null;

    const driver = ride.driverId
      ? await this.driverModel.findById(ride.driverId)
      : null;

    return {
      rideId,
      driverLocation: driver?.currentLocation || { lat: 0, lng: 0 },
      eta: 5,
      status: ride.status,
      timestamp: new Date(),
    };
  }

  // ===========================================
  // ZONE MANAGEMENT
  // ===========================================

  /**
   * Get driver allocation by zone
   */
  async getDriverAllocation(): Promise<DriverAllocation[]> {
    const heatMap = await this.getSupplyDemandMap();

    return heatMap.map(zone => {
      const optimal = zone.rides > 0 ? zone.rides * 1.5 : 5;
      const deficit = Math.max(0, optimal - zone.drivers);
      const surplus = Math.max(0, zone.drivers - optimal);

      return {
        zoneId: zone.zoneId,
        zoneName: `Zone ${zone.zoneId}`,
        currentDrivers: zone.drivers,
        optimalDrivers: Math.round(optimal),
        deficit: Math.round(deficit),
        surplus: Math.round(surplus),
      };
    });
  }

  /**
   * Request driver redeployment
   */
  async redeployDrivers(
    fromZone: string,
    toZone: string,
    count: number
  ): Promise<{ success: boolean; message: string }> {
    // In production, send push notification to drivers
    this.logger.log(`Redeploying ${count} drivers from ${fromZone} to ${toZone}`);

    return {
      success: true,
      message: `Requested ${count} drivers to move from Zone ${fromZone} to Zone ${toZone}`,
    };
  }

  // ===========================================
  // ALERTS
  // ===========================================

  /**
   * Get active alerts
   */
  async getAlerts(): Promise<Alert[]> {
    return this.alerts;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.actionRequired = false;
    }
  }

  /**
   * Generate alerts
   */
  private async generateAlerts(): Promise<void> {
    const newAlerts: Alert[] = [];

    // Check for surge zones
    const surgeZones = this.countSurgeZones();
    if (surgeZones > 3) {
      newAlerts.push({
        id: `SURGE_${Date.now()}`,
        type: AlertType.SURGE,
        severity: 'warning',
        title: 'High surge activity',
        description: `${surgeZones} zones are experiencing surge pricing`,
        timestamp: new Date(),
        actionRequired: true,
      });
    }

    // Check for no drivers
    if (this.activeDrivers < 10) {
      newAlerts.push({
        id: `NODRIVER_${Date.now()}`,
        type: AlertType.NO_DRIVERS,
        severity: 'critical',
        title: 'Low driver availability',
        description: `Only ${this.activeDrivers} drivers online`,
        timestamp: new Date(),
        actionRequired: true,
      });
    }

    // Check for high cancellation
    const metrics = await this.getDashboardMetrics();
    if (metrics.cancellationRate > 0.2) {
      newAlerts.push({
        id: `CANCEL_${Date.now()}`,
        type: AlertType.HIGH_CANCELLATION,
        severity: 'warning',
        title: 'High cancellation rate',
        description: `${(metrics.cancellationRate * 100).toFixed(0)}% cancellation rate`,
        timestamp: new Date(),
        actionRequired: false,
      });
    }

    // Add new alerts
    this.alerts = [...newAlerts, ...this.alerts].slice(0, 20);
  }

  /**
   * Count active surge zones
   */
  private countSurgeZones(): number {
    return randomInt(0, 5); // Mock
  }

  // ===========================================
  // METRICS UPDATE
  // ===========================================

  /**
   * Update metrics periodically
   */
  private async updateMetrics(): Promise<void> {
    // Update historical data
    this.rideHistory.push(this.activeRides);
    this.driverHistory.push(this.activeDrivers);

    // Keep last 100 data points
    if (this.rideHistory.length > 100) {
      this.rideHistory.shift();
    }
    if (this.driverHistory.length > 100) {
      this.driverHistory.shift();
    }
  }

  /**
   * Get metrics history
   */
  async getMetricsHistory(
    metric: 'rides' | 'drivers',
    duration: '1h' | '24h' | '7d' = '24h'
  ): Promise<{ timestamp: Date; value: number }[]> {
    const history = metric === 'rides' ? this.rideHistory : this.driverHistory;
    const interval = duration === '1h' ? 1 : duration === '24h' ? 5 : 30;

    return history
      .filter((_, i) => i % interval === 0)
      .map((value, i) => ({
        timestamp: new Date(Date.now() - (history.length - i) * 5 * 60 * 1000),
        value,
      }));
  }

  // ===========================================
  // HELPERS
  // ===========================================

  /**
   * Get zone ID from coordinates
   */
  private getZoneId(lat: number, lng: number): string {
    // H3-based zone
    const latHex = Math.floor(lat * 100);
    const lngHex = Math.floor(lng * 100);
    return `zone_${latHex}_${lngHex}`;
  }
}
