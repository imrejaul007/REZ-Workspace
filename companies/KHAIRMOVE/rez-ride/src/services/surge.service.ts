import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomInt } from 'crypto';
import { Ride } from '../models/ride.model';
import { Driver } from '../models/driver.model';
import { FARE_CONFIG, calculateSurgeMultiplier } from '../config/fare.config';

export interface SurgeZone {
  zoneId: string;
  name: string;
  center: { lat: number; lng: number };
  radiusKm: number;
  currentMultiplier: number;
  demandRatio: number;
  lastUpdated: Date;
}

export interface SurgeConfig {
  enabled: boolean;
  minMultiplier: number;
  maxMultiplier: number;
  updateIntervalMs: number;
  historyHours: number;
}

@Injectable()
export class SurgeService {
  private readonly logger = new Logger(SurgeService.name);

  // H3 hexagon resolution for zones
  private readonly H3_RESOLUTION = 8; // ~5km hexagons

  // In-memory zone cache
  private zones: Map<string, SurgeZone> = new Map();

  // Surge configuration
  private config: SurgeConfig = {
    enabled: true,
    minMultiplier: 1.0,
    maxMultiplier: FARE_CONFIG.SURGE.maxMultiplier,
    updateIntervalMs: 60000, // Update every minute
    historyHours: 1,
  };

  constructor(
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
  ) {
    // Start periodic updates
    this.startSurgeUpdates();
  }

  /**
   * Get surge multiplier for a location
   */
  async getSurgeMultiplier(lat: number, lng: number): Promise<{
    multiplier: number;
    level: 'normal' | 'medium' | 'high' | 'extreme';
    zoneId: string;
    zoneName: string;
  }> {
    const zoneId = this.getZoneId(lat, lng);

    let zone = this.zones.get(zoneId);

    // If zone doesn't exist, calculate it
    if (!zone) {
      zone = await this.calculateZoneSurge(lat, lng);
      this.zones.set(zoneId, zone);
    }

    // Check if zone needs refresh
    const ageMs = Date.now() - zone.lastUpdated.getTime();
    if (ageMs > this.config.updateIntervalMs) {
      // Calculate in background
      this.calculateZoneSurge(lat, lng).then(newZone => {
        this.zones.set(zoneId, newZone);
      });
    }

    return {
      multiplier: zone.currentMultiplier,
      level: this.getSurgeLevel(zone.currentMultiplier),
      zoneId,
      zoneName: zone.name,
    };
  }

  /**
   * Calculate surge for a zone
   */
  private async calculateZoneSurge(lat: number, lng: number): Promise<SurgeZone> {
    const zoneId = this.getZoneId(lat, lng);

    // Get demand (rides requested in zone)
    const demand = await this.getZoneDemand(lat, lng, 5); // 5km radius

    // Get supply (available drivers in zone)
    const supply = await this.getZoneSupply(lat, lng, 5);

    // Calculate ratio
    const ratio = supply > 0 ? demand / supply : demand > 0 ? 10 : 1;

    // Calculate multiplier
    const multiplier = calculateSurgeMultiplier(ratio);

    // Generate zone name from reverse geocoding
    const name = await this.getZoneName(lat, lng);

    return {
      zoneId,
      name,
      center: { lat, lng },
      radiusKm: 5,
      currentMultiplier: multiplier,
      demandRatio: ratio,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get demand in a zone (rides in last hour)
   */
  private async getZoneDemand(lat: number, lng: number, radiusKm: number): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count rides requested in the zone
    const count = await this.rideModel.countDocuments({
      status: { $in: ['requested', 'assigned', 'accepted'] },
      requestedAt: { $gte: oneHourAgo },
      'pickup.lat': {
        $gte: lat - radiusKm / 111,
        $lte: lat + radiusKm / 111,
      },
      'pickup.lng': {
        $gte: lng - radiusKm / (111 * Math.cos(lat * Math.PI / 180)),
        $lte: lng + radiusKm / (111 * Math.cos(lat * Math.PI / 180)),
      },
    });

    return count;
  }

  /**
   * Get supply in a zone (available drivers)
   */
  private async getZoneSupply(lat: number, lng: number, radiusKm: number): Promise<number> {
    const count = await this.driverModel.countDocuments({
      status: 'online',
      'currentLocation.lat': {
        $gte: lat - radiusKm / 111,
        $lte: lat + radiusKm / 111,
      },
      'currentLocation.lng': {
        $gte: lng - radiusKm / (111 * Math.cos(lat * Math.PI / 180)),
        $lte: lng + radiusKm / (111 * Math.cos(lat * Math.PI / 180)),
      },
    });

    return count;
  }

  /**
   * Get surge level
   */
  private getSurgeLevel(multiplier: number): 'normal' | 'medium' | 'high' | 'extreme' {
    if (multiplier >= 2.0) return 'extreme';
    if (multiplier >= 1.5) return 'high';
    if (multiplier >= 1.25) return 'medium';
    return 'normal';
  }

  /**
   * Get H3 zone ID
   */
  private getZoneId(lat: number, lng: number): string {
    // Simplified H3-like zone calculation
    // In production, use the actual H3 library
    const latHex = Math.floor(lat * 100);
    const lngHex = Math.floor(lng * 100);
    return `zone_${latHex}_${lngHex}`;
  }

  /**
   * Get zone name from location
   */
  private async getZoneName(lat: number, lng: number): Promise<string> {
    // In production, reverse geocode to get area name
    // For now, return coordinates
    return `Area ${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }

  /**
   * Get all active surge zones
   */
  async getActiveSurgeZones(): Promise<SurgeZone[]> {
    const zones: SurgeZone[] = [];
    this.zones.forEach(zone => {
      if (zone.currentMultiplier > 1.0) {
        zones.push(zone);
      }
    });
    return zones;
  }

  /**
   * Apply surge to fare calculation
   */
  async applySurgeToFare(
    lat: number,
    lng: number,
    baseFare: number
  ): Promise<{
    originalFare: number;
    surgeMultiplier: number;
    surgeAmount: number;
    finalFare: number;
  }> {
    const { multiplier } = await this.getSurgeMultiplier(lat, lng);

    const surgeAmount = Math.round((multiplier - 1) * baseFare * 100) / 100;
    const finalFare = Math.round((baseFare + surgeAmount) * 100) / 100;

    return {
      originalFare: baseFare,
      surgeMultiplier: multiplier,
      surgeAmount,
      finalFare,
    };
  }

  /**
   * Get surge history for analytics
   */
  async getSurgeHistory(zoneId: string, hours = 24): Promise<{
    zoneId: string;
    history: Array<{
      timestamp: Date;
      multiplier: number;
      demand: number;
      supply: number;
    }>;
  }> {
    // In production, query from time-series data
    // For now, return mock data
    const history = [];
    const now = Date.now();

    for (let i = 0; i < hours; i++) {
      history.push({
        timestamp: new Date(now - i * 60 * 60 * 1000),
        multiplier: 1.0 + (randomInt(0, 50) / 100), // 1.0-1.5
        demand: randomInt(0, 50),
        supply: randomInt(0, 30),
      });
    }

    return { zoneId, history };
  }

  /**
   * Force update surge for a zone
   */
  async forceUpdateZone(lat: number, lng: number): Promise<SurgeZone> {
    const zone = await this.calculateZoneSurge(lat, lng);
    const zoneId = this.getZoneId(lat, lng);
    this.zones.set(zoneId, zone);
    return zone;
  }

  /**
   * Start periodic surge updates
   */
  private startSurgeUpdates(): void {
    setInterval(async () => {
      const zones = Array.from(this.zones.entries());

      for (const [zoneId, zone] of zones) {
        // Update zone if older than interval
        const ageMs = Date.now() - zone.lastUpdated.getTime();
        if (ageMs > this.config.updateIntervalMs) {
          const newZone = await this.calculateZoneSurge(zone.center.lat, zone.center.lng);
          this.zones.set(zoneId, newZone);
        }
      }

      this.logger.debug(`Surge zones updated: ${this.zones.size}`);
    }, this.config.updateIntervalMs);
  }

  /**
   * Get surge configuration
   */
  getConfig(): SurgeConfig {
    return { ...this.config };
  }

  /**
   * Update surge configuration
   */
  updateConfig(config: Partial<SurgeConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log(`Surge config updated: ${JSON.stringify(this.config)}`);
  }
}
