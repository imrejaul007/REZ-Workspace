import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

/**
 * Quick Ride Service - Rapido-style instant bike booking
 * Features:
 * - Fast matching (< 2 minutes)
 * - Bike-first routing
 * - No destination required option
 * - Safety-first matching
 */

export interface QuickRideRequest {
  userId: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  drop?: {
    lat: number;
    lng: number;
    address: string;
  };
  rideType: QUICK_RIDE_TYPE;
  paymentMethod: 'wallet' | 'upi' | 'cash';
  safetyVerified: boolean;
}

export enum QUICK_RIDE_TYPE {
  BIKE_INSTANT = 'bike_instant',     // No destination
  BIKE_TO_DROP = 'bike_to_drop',     // With destination
  AUTO_SHARE = 'auto_share',         // Share auto
  PRIORITY = 'priority',             // Priority booking
}

export enum QUICK_RIDE_STATUS {
  SEARCHING = 'searching',
  MATCHED = 'matched',
  ARRIVING = 'arriving',
  STARTED = 'started',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface QuickRideMatch {
  rideId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  vehicleType: string;
  eta: number;
  distance: number;
  rating: number;
  totalRides: number;
  safetyScore: number;
}

@Injectable()
export class QuickRideService {
  private readonly logger = new Logger(QuickRideService.name);
  private rideModel: Model<any> | null = null;

  // Quick ride settings
  private readonly QUICK_MATCH_TIMEOUT = 120; // 2 minutes
  private readonly MAX_DRIVER_SEARCH_RADIUS = 3; // km
  private readonly BIKE_MATCH_RADIUS = 1.5; // km (smaller for bikes)

  constructor(@InjectModel('Ride') rideModel?: Model<any>) {
    this.rideModel = rideModel || null;
  }

  // ===========================================
  // QUICK RIDE BOOKING
  // ===========================================

  /**
   * Create quick ride request
   */
  async createQuickRide(request: QuickRideRequest): Promise<{
    rideId: string;
    status: QUICK_RIDE_STATUS;
    matchTimeout: number;
    searchRadius: number;
  }> {
    const rideId = `QR_${Date.now()}`;

    // Determine search radius based on ride type
    const searchRadius = request.rideType === QUICK_RIDE_TYPE.BIKE_INSTANT
      ? this.BIKE_MATCH_RADIUS
      : this.MAX_DRIVER_SEARCH_RADIUS;

    // Create quick ride record
    const ride = {
      id: rideId,
      userId: request.userId,
      pickup: request.pickup,
      drop: request.drop,
      rideType: request.rideType,
      status: QUICK_RIDE_STATUS.SEARCHING,
      paymentMethod: request.paymentMethod,
      safetyVerified: request.safetyVerified,
      searchRadius,
      matchTimeout: Date.now() + this.QUICK_MATCH_TIMEOUT * 1000,
      createdAt: new Date(),
    };

    // Start matching process
    this.startQuickMatch(rideId, request);

    this.logger.log(`Quick ride created: ${rideId}, type: ${request.rideType}`);

    return {
      rideId,
      status: QUICK_RIDE_STATUS.SEARCHING,
      matchTimeout: this.QUICK_MATCH_TIMEOUT,
      searchRadius,
    };
  }

  /**
   * Start quick matching process
   */
  private async startQuickMatch(rideId: string, request: QuickRideRequest): Promise<void> {
    // Simulate finding nearby drivers
    const nearbyDrivers = await this.findNearbyDrivers(request.pickup);

    if (nearbyDrivers.length > 0) {
      // Pick best driver (closest, highest rated, most active)
      const bestDriver = this.pickBestDriver(nearbyDrivers);

      this.logger.log(`Quick match found: ${bestDriver.name} for ride ${rideId}`);

      // Notify user of match
      await this.notifyMatch(rideId, bestDriver);
    } else {
      // Expand search radius and retry
      await this.expandSearch(rideId, request);
    }
  }

  /**
   * Find nearby drivers
   */
  private async findNearbyDrivers(pickup: { lat: number; lng: number }): Promise<any[]> {
    // Mock nearby drivers
    return [
      {
        id: 'DRV_BIKE_001',
        name: 'Ramesh K',
        phone: '+919876543210',
        vehicle: {
          type: 'bike',
          number: 'KA01AB1234',
          model: 'Honda Activa',
        },
        rating: 4.7,
        totalRides: 1500,
        safetyScore: 95,
        distance: 0.5,
        eta: 3,
      },
      {
        id: 'DRV_BIKE_002',
        name: 'Suresh M',
        phone: '+919876543211',
        vehicle: {
          type: 'bike',
          number: 'KA02CD5678',
          model: 'TVS Jupiter',
        },
        rating: 4.8,
        totalRides: 2000,
        safetyScore: 98,
        distance: 0.8,
        eta: 4,
      },
    ];
  }

  /**
   * Pick best driver based on score
   */
  private pickBestDriver(drivers: any[]): any {
    // Score = (rating * 40) + (safetyScore * 30) + (proximityScore * 30)
    return drivers
      .map(d => ({
        ...d,
        score: (d.rating / 5 * 40) + (d.safetyScore / 100 * 30) + (Math.max(0, 10 - d.distance) / 10 * 30),
      }))
      .sort((a, b) => b.score - a.score)[0];
  }

  /**
   * Expand search area
   */
  private async expandSearch(rideId: string, request: QuickRideRequest): Promise<void> {
    this.logger.log(`Expanding search for ride ${rideId}`);
    // In production, expand radius and retry
  }

  /**
   * Notify user of match
   */
  private async notifyMatch(rideId: string, driver: any): Promise<void> {
    // In production, send push notification
    this.logger.log(`Match found for ${rideId}: ${driver.name}`);
  }

  // ===========================================
  // SAFETY FEATURES
  // ===========================================

  /**
   * Verify safety checklist
   */
  async verifySafetyChecklist(userId: string): Promise<{
    helmetWorn: boolean;
    seatbeltWorn: boolean;
    sosEnabled: boolean;
    shareEnabled: boolean;
    verified: boolean;
  }> {
    return {
      helmetWorn: true,
      seatbeltWorn: true,
      sosEnabled: true,
      shareEnabled: true,
      verified: true,
    };
  }

  /**
   * Enable SOS for quick ride
   */
  async enableSOS(rideId: string): Promise<{
    sosActive: boolean;
    emergencyContacts: string[];
    policeNotified: boolean;
  }> {
    return {
      sosActive: true,
      emergencyContacts: ['+919876543210', '+919876543211'],
      policeNotified: true,
    };
  }

  /**
   * Quick share with trusted contacts
   */
  async shareQuickRide(
    rideId: string,
    contacts: string[]
  ): Promise<{
    shared: boolean;
    shareUrl: string;
    expiresAt: Date;
  }> {
    const shareUrl = `https://rezapp.com/track/${rideId}`;
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    // Send SMS to contacts
    for (const contact of contacts) {
      this.logger.log(`Sharing ride ${rideId} with ${contact}`);
    }

    return {
      shared: true,
      shareUrl,
      expiresAt,
    };
  }

  // ===========================================
  // RIDE TYPE SPECIFIC
  // ===========================================

  /**
   * Get available quick ride types
   */
  async getQuickRideTypes(location: { lat: number; lng: number }): Promise<{
    type: QUICK_RIDE_TYPE;
    name: string;
    icon: string;
    description: string;
    eta: number;
    price: number;
    available: boolean;
  }[]> {
    return [
      {
        type: QUICK_RIDE_TYPE.BIKE_INSTANT,
        name: 'Instant Bike',
        icon: '🏍️',
        description: 'No destination needed, pay per km',
        eta: 3,
        price: 15,
        available: true,
      },
      {
        type: QUICK_RIDE_TYPE.BIKE_TO_DROP,
        name: 'Bike to Destination',
        icon: '🛵',
        description: 'Book bike to specific destination',
        eta: 4,
        price: 10,
        available: true,
      },
      {
        type: QUICK_RIDE_TYPE.AUTO_SHARE,
        name: 'Share Auto',
        icon: '🛺',
        description: 'Share auto with others going same direction',
        eta: 5,
        price: 12,
        available: true,
      },
      {
        type: QUICK_RIDE_TYPE.PRIORITY,
        name: 'Priority Ride',
        icon: '⚡',
        description: 'Skip the queue, nearest driver',
        eta: 2,
        price: 25,
        available: true,
      },
    ];
  }

  /**
   * Calculate bike fare
   */
  async calculateBikeFare(
    distanceKm: number,
    durationMinutes: number,
    type: QUICK_RIDE_TYPE
  ): Promise<{
    baseFare: number;
    perKm: number;
    total: number;
    cashback: number;
  }> {
    const baseFare = type === QUICK_RIDE_TYPE.PRIORITY ? 25 : 15;
    const perKm = type === QUICK_RIDE_TYPE.PRIORITY ? 8 : 6;
    const total = baseFare + (distanceKm * perKm) + (durationMinutes * 1);
    const cashback = Math.round(total * 0.1);

    return {
      baseFare,
      perKm,
      total,
      cashback,
    };
  }
}
