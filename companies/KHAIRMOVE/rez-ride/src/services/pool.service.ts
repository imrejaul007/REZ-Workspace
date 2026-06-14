import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ride } from '../models/ride.model';
import { NotFoundError, AuthorizationError } from '../common/exceptions';

export interface PoolRide {
  id: string;
  poolId: string;
  rideId: string;
  passengerNumber: number; // 1 or 2 (matching)
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  userId: string;
  userName: string;
  status: POOL_STATUS;
  fare: PoolFare;
  seatBookedAt: Date;
}

export interface PoolFare {
  baseFare: number;
  sharedAmount: number; // Split with match
  userPays: number;
  discount: number;
}

export enum POOL_STATUS {
  SEARCHING = 'searching',
  MATCHED = 'matched',
  PICKUP_1 = 'pickup_1',
  PICKUP_2 = 'pickup_2',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface PoolMatch {
  id: string;
  poolRideId: string;
  matchRideId: string;
  compatibilityScore: number;
  routeOverlap: number;
  detourMinutes: number;
  pickup2: { lat: number; lng: number; address: string };
  drop2: { lat: number; lng: number; address: string };
  savedFare: number;
  status: MATCH_STATUS;
  expiresAt: Date;
}

export enum MATCH_STATUS {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface PoolSession {
  id: string;
  driverId: string;
  vehicleType: 'auto' | 'cab' | 'suv';
  maxPassengers: number;
  currentPassengers: number;
  status: SESSION_STATUS;
  pickup1?: PoolRide;
  drop1?: { lat: number; lng: number; address: string };
  pickup2?: PoolRide;
  drop2?: { lat: number; lng: number; address: string };
  route?: string; // Polyline
  createdAt: Date;
}

export enum SESSION_STATUS {
  ACTIVE = 'active',
  PICKUP_SECOND = 'pickup_second',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Injectable()
export class PoolService {
  private readonly logger = new Logger(PoolService.name);

  // In-memory storage (use Redis/DB in production)
  private poolRides: Map<string, PoolRide> = new Map();
  private poolMatches: Map<string, PoolMatch> = new Map();
  private poolSessions: Map<string, PoolSession> = new Map();
  private waitingPool: PoolRide[] = [];

  constructor(
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
  ) {
    // Start matchmaker
    this.startMatchmaker();
  }

  // ===========================================
  // POOL RIDE CREATION
  // ===========================================

  /**
   * Create a pool ride request
   */
  async createPoolRide(
    rideId: string,
    userId: string,
    userName: string,
    pickup: { lat: number; lng: number; address: string },
    drop: { lat: number; lng: number; address: string },
    baseFare: number
  ): Promise<PoolRide> {
    const poolRide: PoolRide = {
      id: `POOL_${Date.now()}`,
      poolId: `POOLID_${rideId}`,
      rideId,
      passengerNumber: 1,
      pickup,
      drop,
      userId,
      userName,
      status: POOL_STATUS.SEARCHING,
      fare: {
        baseFare: baseFare,
        sharedAmount: 0,
        userPays: baseFare,
        discount: 0,
      },
      seatBookedAt: new Date(),
    };

    this.poolRides.set(poolRide.id, poolRide);
    this.waitingPool.push(poolRide);

    // Try to find a match
    await this.findMatch(poolRide);

    this.logger.log(`Pool ride created: ${poolRide.id} for user ${userName}`);

    return poolRide;
  }

  /**
   * Find a match for pool ride
   */
  private async findMatch(poolRide: PoolRide): Promise<PoolMatch | null> {
    const candidates = this.waitingPool.filter(
      (p) =>
        p.id !== poolRide.id &&
        p.status === POOL_STATUS.SEARCHING &&
        this.isCompatible(poolRide, p)
    );

    if (candidates.length === 0) {
      return null;
    }

    // Score and sort candidates
    const scored = candidates.map((candidate) => ({
      candidate,
      score: this.calculateCompatibility(poolRide, candidate),
    }));

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0].candidate;

    // Create match
    const match = await this.createMatch(poolRide, best);

    return match;
  }

  /**
   * Check if two rides are compatible
   */
  private isCompatible(ride1: PoolRide, ride2: PoolRide): boolean {
    // Check direction (should be roughly same)
    const direction1 = this.getDirection(ride1.pickup, ride1.drop);
    const direction2 = this.getDirection(ride2.pickup, ride2.drop);

    // Direction should be within 45 degrees
    const angleDiff = Math.abs(direction1 - direction2);
    if (angleDiff > 45 && angleDiff < 315) {
      return false;
    }

    // Check pickup distance (within 1km)
    const pickupDist = this.getDistance(ride1.pickup, ride2.pickup);
    if (pickupDist > 1) {
      return false;
    }

    // Check drop distance (within 2km)
    const dropDist = this.getDistance(ride1.drop, ride2.drop);
    if (dropDist > 2) {
      return false;
    }

    return true;
  }

  /**
   * Calculate compatibility score
   */
  private calculateCompatibility(ride1: PoolRide, ride2: PoolRide): number {
    let score = 100;

    // Route overlap bonus
    const overlap = this.calculateRouteOverlap(ride1, ride2);
    score += overlap * 30; // Up to 30 points for route overlap

    // Pickup proximity bonus
    const pickupDist = this.getDistance(ride1.pickup, ride2.pickup);
    score -= pickupDist * 20; // Penalty for pickup distance

    // Drop proximity bonus
    const dropDist = this.getDistance(ride1.drop, ride2.drop);
    score -= dropDist * 10; // Penalty for drop distance

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Create a match
   */
  private async createMatch(ride1: PoolRide, ride2: PoolRide): Promise<PoolMatch> {
    const match: PoolMatch = {
      id: `MATCH_${Date.now()}`,
      poolRideId: ride1.id,
      matchRideId: ride2.id,
      compatibilityScore: this.calculateCompatibility(ride1, ride2),
      routeOverlap: this.calculateRouteOverlap(ride1, ride2),
      detourMinutes: this.estimateDetour(ride1, ride2),
      pickup2: ride2.pickup,
      drop2: ride2.drop,
      savedFare: this.calculateSavings(ride1, ride2),
      status: MATCH_STATUS.PENDING,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 min to respond
    };

    this.poolMatches.set(match.id, match);

    // Update both rides
    ride1.status = POOL_STATUS.MATCHED;
    ride2.status = POOL_STATUS.MATCHED;

    this.logger.log(`Match created: ${match.id} between ${ride1.id} and ${ride2.id}`);

    return match;
  }

  /**
   * Calculate route overlap
   */
  private calculateRouteOverlap(ride1: PoolRide, ride2: PoolRide): number {
    // Simplified - in production, use actual route polylines
    const dist1 = this.getDistance(ride1.pickup, ride1.drop);
    const dist2 = this.getDistance(ride2.pickup, ride2.drop);
    const overlap = 1 - Math.abs(dist1 - dist2) / Math.max(dist1, dist2);
    return Math.max(0, overlap);
  }

  /**
   * Estimate detour time
   */
  private estimateDetour(ride1: PoolRide, ride2: PoolRide): number {
    const pickupDist = this.getDistance(ride1.pickup, ride2.pickup);
    return Math.round((pickupDist / 30) * 60); // Assume 30 km/h
  }

  /**
   * Calculate savings for both parties
   */
  private calculateSavings(ride1: PoolRide, ride2: PoolRide): number {
    const totalFare = ride1.fare.baseFare + ride2.fare.baseFare;
    const sharedFare = Math.round(totalFare * 0.7 / 2); // 30% savings, split
    return Math.round((ride1.fare.baseFare - sharedFare) * 100) / 100;
  }

  /**
   * Get direction between points
   */
  private getDirection(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const dLng = to.lng - from.lng;
    const dLat = to.lat - from.lat;
    const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
    return (angle + 360) % 360;
  }

  /**
   * Calculate distance (Haversine)
   */
  private getDistance(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number }
  ): number {
    const R = 6371; // km
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ===========================================
  // MATCH RESPONSE
  // ===========================================

  /**
   * Accept match
   */
  async acceptMatch(matchId: string, userId: string): Promise<{
    success: boolean;
    savings: number;
    pickup2: PoolRide['pickup'];
  }> {
    const match = this.poolMatches.get(matchId);
    if (!match) {
      throw new NotFoundError('Match', matchId);
    }

    if (match.matchRideId !== userId && match.poolRideId !== userId) {
      throw new AuthorizationError();
    }

    match.status = MATCH_STATUS.ACCEPTED;

    // Calculate shared fare
    const poolRide = this.poolRides.get(match.poolRideId)!;
    const matchRide = this.poolRides.get(match.matchRideId)!;
    const sharedFare = Math.round((poolRide.fare.baseFare + matchRide.fare.baseFare) * 0.7 / 2);

    // Update both fares
    poolRide.fare.sharedAmount = sharedFare;
    poolRide.fare.userPays = sharedFare;
    poolRide.fare.discount = poolRide.fare.baseFare - sharedFare;

    matchRide.fare.sharedAmount = sharedFare;
    matchRide.fare.userPays = sharedFare;
    matchRide.fare.discount = matchRide.fare.baseFare - sharedFare;

    // Remove from waiting
    this.waitingPool = this.waitingPool.filter(
      (p) => p.id !== poolRide.id && p.id !== matchRide.id
    );

    this.logger.log(`Match accepted: ${matchId}`);

    return {
      success: true,
      savings: match.savedFare,
      pickup2: match.pickup2,
    };
  }

  /**
   * Reject match
   */
  async rejectMatch(matchId: string, userId: string): Promise<void> {
    const match = this.poolMatches.get(matchId);
    if (!match) {
      throw new NotFoundError('Match', matchId);
    }

    match.status = MATCH_STATUS.REJECTED;

    // Reset ride status
    const poolRide = this.poolRides.get(match.poolRideId);
    if (poolRide) {
      poolRide.status = POOL_STATUS.SEARCHING;
      // Try to find another match
      await this.findMatch(poolRide);
    }
  }

  /**
   * Get match for user
   */
  async getPendingMatch(userId: string): Promise<PoolMatch | null> {
    for (const match of this.poolMatches.values()) {
      if (
        (match.poolRideId === userId || match.matchRideId === userId) &&
        match.status === MATCH_STATUS.PENDING
      ) {
        return match;
      }
    }
    return null;
  }

  // ===========================================
  // POOL SESSION (DRIVER SIDE)
  // ===========================================

  /**
   * Create pool session for driver
   */
  async createPoolSession(
    driverId: string,
    vehicleType: 'auto' | 'cab' | 'suv',
    pickup1: PoolRide['pickup'],
    drop1: PoolRide['drop']
  ): Promise<PoolSession> {
    const session: PoolSession = {
      id: `SESSION_${Date.now()}`,
      driverId,
      vehicleType,
      maxPassengers: vehicleType === 'suv' ? 3 : 2,
      currentPassengers: 1,
      status: SESSION_STATUS.ACTIVE,
      pickup1: undefined,
      drop1,
      createdAt: new Date(),
    };

    this.poolSessions.set(session.id, session);

    this.logger.log(`Pool session created: ${session.id} for driver ${driverId}`);

    return session;
  }

  /**
   * Add second passenger to session
   */
  async addSecondPassenger(
    sessionId: string,
    pickup2: PoolRide['pickup'],
    drop2: PoolRide['drop']
  ): Promise<PoolSession | null> {
    const session = this.poolSessions.get(sessionId);
    if (!session) return null;

    session.pickup2 = {
      id: `POOL2_${Date.now()}`,
      poolId: session.id,
      rideId: '',
      passengerNumber: 2,
      pickup: pickup2,
      drop: drop2,
      userId: '',
      userName: '',
      status: POOL_STATUS.PICKUP_2,
      fare: { baseFare: 0, sharedAmount: 0, userPays: 0, discount: 0 },
      seatBookedAt: new Date(),
    };
    session.drop2 = drop2;
    session.status = SESSION_STATUS.PICKUP_SECOND;

    return session;
  }

  /**
   * Start pool journey
   */
  async startPoolJourney(sessionId: string): Promise<PoolSession | null> {
    const session = this.poolSessions.get(sessionId);
    if (!session) return null;

    session.status = SESSION_STATUS.IN_PROGRESS;
    return session;
  }

  /**
   * Complete pool journey
   */
  async completePoolJourney(sessionId: string): Promise<{
    totalFare: number;
    driverEarnings: number;
    passenger1Fare: number;
    passenger2Fare: number;
  }> {
    const session = this.poolSessions.get(sessionId);
    if (!session) throw new NotFoundError('Session', sessionId);

    session.status = SESSION_STATUS.COMPLETED;

    // Calculate fares
    const baseFare = session.vehicleType === 'auto' ? 25 : session.vehicleType === 'suv' ? 60 : 40;
    const totalFare = baseFare * (session.currentPassengers + (session.pickup2 ? 1 : 0));
    const driverEarnings = totalFare * 0.85; // 85% to driver
    const perPassengerFare = Math.round(baseFare * 0.7); // 30% off for sharing

    return {
      totalFare,
      driverEarnings,
      passenger1Fare: perPassengerFare,
      passenger2Fare: perPassengerFare,
    };
  }

  // ===========================================
  // MATCHMAKER (BACKGROUND)
  // ===========================================

  /**
   * Start background matchmaker
   */
  private startMatchmaker(): void {
    setInterval(async () => {
      for (const poolRide of this.waitingPool) {
        if (poolRide.status === POOL_STATUS.SEARCHING) {
          // Check for match timeout (5 min)
          const waitTime = Date.now() - poolRide.seatBookedAt.getTime();
          if (waitTime > 5 * 60 * 1000) {
            // No match found, upgrade to solo
            poolRide.status = POOL_STATUS.MATCHED;
            poolRide.fare.userPays = poolRide.fare.baseFare;
            poolRide.fare.discount = 0;
            this.waitingPool = this.waitingPool.filter((p) => p.id !== poolRide.id);
            this.logger.log(`Pool ride upgraded to solo: ${poolRide.id}`);
          } else {
            await this.findMatch(poolRide);
          }
        }
      }

      // Check match expiration
      for (const match of this.poolMatches.values()) {
        if (
          match.status === MATCH_STATUS.PENDING &&
          match.expiresAt < new Date()
        ) {
          match.status = MATCH_STATUS.EXPIRED;
          const poolRide = this.poolRides.get(match.poolRideId);
          if (poolRide) {
            poolRide.status = POOL_STATUS.SEARCHING;
            await this.findMatch(poolRide);
          }
        }
      }
    }, 10000); // Every 10 seconds
  }

  // ===========================================
  // UTILITIES
  // ===========================================

  /**
   * Get pool ride by ID
   */
  async getPoolRide(poolRideId: string): Promise<PoolRide | null> {
    return this.poolRides.get(poolRideId) || null;
  }

  /**
   * Get pool ride by user
   */
  async getPoolRideByUser(userId: string): Promise<PoolRide | null> {
    for (const poolRide of this.poolRides.values()) {
      if (poolRide.userId === userId) {
        return poolRide;
      }
    }
    return null;
  }

  /**
   * Cancel pool ride
   */
  async cancelPoolRide(poolRideId: string): Promise<void> {
    const poolRide = this.poolRides.get(poolRideId);
    if (poolRide) {
      poolRide.status = POOL_STATUS.CANCELLED;
      this.waitingPool = this.waitingPool.filter((p) => p.id !== poolRideId);
    }
  }

  /**
   * Get pool statistics
   */
  async getPoolStats(): Promise<{
    activePools: number;
    waitingMatches: number;
    completedToday: number;
    avgSavings: number;
    matchRate: number;
  }> {
    let completedToday = 0;
    let totalSavings = 0;
    let matched = 0;

    for (const poolRide of this.poolRides.values()) {
      if (poolRide.status === POOL_STATUS.COMPLETED) {
        completedToday++;
        totalSavings += poolRide.fare.discount;
        if (poolRide.fare.discount > 0) matched++;
      }
    }

    return {
      activePools: this.poolSessions.size,
      waitingMatches: this.waitingPool.length,
      completedToday,
      avgSavings: completedToday > 0 ? Math.round(totalSavings / completedToday) : 0,
      matchRate: completedToday > 0 ? Math.round((matched / completedToday) * 100) : 0,
    };
  }
}
