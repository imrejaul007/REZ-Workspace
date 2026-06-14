import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomInt } from 'crypto';
import { NotFoundError } from '../common/exceptions';

/**
 * Green Rides Service - EV & Sustainability
 * Features:
 * - EV fleet tracking
 * - Carbon footprint tracking
 * - Green rewards
 * - EV charging station finder
 */

export interface EVDriver {
  id: string;
  vehicleId: string;
  vehicleType: 'electric_auto' | 'electric_bike' | 'electric_scooter' | 'electric_car';
  batteryLevel: number;
  range: number; // km
  chargingStation?: string;
  carbonSaved: number; // kg
}

export interface CarbonFootprint {
  userId: string;
  totalRides: number;
  totalDistance: number;
  carbonSaved: number;
  greenScore: number; // 0-100
  treesEquivalent: number;
  rank: string; // Leaf Lover, Tree Planter, Forest Protector, Mountain Guardian
}

export interface GreenLeaderboardEntry {
  rank: number;
  userId: string;
  greenScore: number;
  carbonSaved: number;
  title: string;
}

export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'fast' | 'slow';
  power: number; // kW
  available: boolean;
  pricePerUnit: number; // ₹/kWh
  amenities: string[];
  distance: number;
}

export interface GreenReward {
  id: string;
  type: 'cashback' | 'badge' | 'trees';
  amount: number;
  description: string;
  earnedAt: Date;
}

@Injectable()
export class GreenRidesService {
  private readonly logger = new Logger(GreenRidesService.name);
  private rideModel: Model<any> | null = null;

  // Mock charging stations
  private chargingStations: ChargingStation[] = [
    {
      id: 'CS_001',
      name: 'Tata Power EV Hub',
      address: 'MG Road, Bangalore',
      lat: 12.9716,
      lng: 77.5946,
      type: 'fast',
      power: 50,
      available: true,
      pricePerUnit: 12,
      amenities: ['WC', 'Coffee', 'WiFi'],
      distance: 0.5,
    },
    {
      id: 'CS_002',
      name: 'ChargeZone Station',
      address: 'Koramangala, Bangalore',
      lat: 12.9356,
      lng: 77.6245,
      type: 'fast',
      power: 30,
      available: true,
      pricePerUnit: 15,
      amenities: ['Parking'],
      distance: 1.2,
    },
    {
      id: 'CS_003',
      name: 'Reliance Charge',
      address: 'Indiranagar, Bangalore',
      lat: 12.9784,
      lng: 77.6408,
      type: 'slow',
      power: 15,
      available: false,
      pricePerUnit: 10,
      amenities: ['Cafe'],
      distance: 2.0,
    },
  ];

  // Carbon emission factors (kg CO2 per km)
  private readonly CARBON_FACTORS = {
    petrol_auto: 0.12,
    diesel_auto: 0.10,
    electric_auto: 0.02,
    petrol_bike: 0.08,
    electric_bike: 0.01,
    petrol_car: 0.20,
    electric_car: 0.04,
  };

  constructor(@InjectModel('Ride') rideModel?: Model<any>) {
    this.rideModel = rideModel || null;
  }

  // ===========================================
  // GREEN SCORE
  // ===========================================

  /**
   * Calculate user's green score
   */
  async calculateGreenScore(userId: string): Promise<CarbonFootprint> {
    // Mock data
    const totalRides = randomInt(10, 110);
    const totalDistance = totalRides * 8; // ~8 km avg
    const carbonSaved = totalDistance * 0.05; // 0.05 kg/km saved by using EV

    const greenScore = Math.min(100, Math.round((carbonSaved / 10) * 10 + 30));
    const treesEquivalent = Math.round(carbonSaved / 21); // 21 kg CO2 = 1 tree/year

    let rank: string;
    if (greenScore >= 80) rank = 'Mountain Guardian';
    else if (greenScore >= 60) rank = 'Forest Protector';
    else if (greenScore >= 40) rank = 'Tree Planter';
    else rank = 'Leaf Lover';

    return {
      userId,
      totalRides,
      totalDistance,
      carbonSaved: Math.round(carbonSaved * 100) / 100,
      greenScore,
      treesEquivalent,
      rank,
    };
  }

  /**
   * Update carbon savings after ride
   */
  async recordGreenRide(
    userId: string,
    vehicleType: string,
    distanceKm: number
  ): Promise<{
    carbonSaved: number;
    greenBonus: number;
    newScore: number;
  }> {
    const carbonFactor = this.CARBON_FACTORS[vehicleType as keyof typeof this.CARBON_FACTORS] || 0.05;
    const carbonSaved = distanceKm * carbonFactor;
    const greenBonus = Math.round(carbonSaved * 10); // ₹0.10 per kg saved

    // Calculate new score
    const footprint = await this.calculateGreenScore(userId);
    const newScore = footprint.greenScore;

    return {
      carbonSaved: Math.round(carbonSaved * 100) / 100,
      greenBonus,
      newScore,
    };
  }

  // ===========================================
  // CHARGING STATIONS
  // ===========================================

  /**
   * Find nearby charging stations
   */
  async findChargingStations(
    lat: number,
    lng: number,
    radiusKm: number = 5
  ): Promise<ChargingStation[]> {
    // Calculate distances
    const stations = this.chargingStations.map(station => ({
      ...station,
      distance: this.getDistance(lat, lng, station.lat, station.lng),
    }));

    // Filter by radius and sort by distance
    return stations
      .filter(s => s.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get charging station details
   */
  async getStationDetails(stationId: string): Promise<ChargingStation | null> {
    return this.chargingStations.find(s => s.id === stationId) || null;
  }

  /**
   * Reserve charging slot
   */
  async reserveChargingSlot(
    stationId: string,
    driverId: string,
    durationMinutes: number
  ): Promise<{
    reservationId: string;
    slotTime: Date;
    estimatedCost: number;
  }> {
    const station = await this.getStationDetails(stationId);
    if (!station) {
      throw new NotFoundError('Station', stationId);
    }

    const reservationId = `RSV_${Date.now()}`;
    const estimatedCost = (station.pricePerUnit * station.power * durationMinutes) / 60;

    return {
      reservationId,
      slotTime: new Date(),
      estimatedCost: Math.round(estimatedCost),
    };
  }

  // ===========================================
  // EV DRIVER FEATURES
  // ===========================================

  /**
   * Get EV driver's battery status
   */
  async getBatteryStatus(driverId: string): Promise<EVDriver> {
    // Mock battery data
    return {
      id: driverId,
      vehicleId: 'EV_AUTO_001',
      vehicleType: 'electric_auto',
      batteryLevel: 75,
      range: 120,
      carbonSaved: 45.5,
    };
  }

  /**
   * Find optimal charging stop
   */
  async findOptimalChargingStop(
    driverId: string,
    destination: { lat: number; lng: number }
  ): Promise<{
    station: ChargingStation;
    detourKm: number;
    savings: number;
  } | null> {
    const battery = await this.getBatteryStatus(driverId);

    // Check if charging needed
    if (battery.range > 50) {
      return null; // Enough range
    }

    const nearestStation = this.chargingStations[0];
    const detourKm = nearestStation.distance;

    return {
      station: nearestStation,
      detourKm,
      savings: Math.round(detourKm * 5), // ₹5 saved by early charging
    };
  }

  // ===========================================
  // GREEN REWARDS
  // ===========================================

  /**
   * Get green rewards for user
   */
  async getGreenRewards(userId: string): Promise<GreenReward[]> {
    const footprint = await this.calculateGreenScore(userId);

    const rewards: GreenReward[] = [];

    // Tree planted for every 21 kg CO2 saved
    if (footprint.carbonSaved >= 21) {
      rewards.push({
        id: `TREE_${Date.now()}`,
        type: 'trees',
        amount: footprint.treesEquivalent,
        description: `🌳 ${footprint.treesEquivalent} trees planted equivalent`,
        earnedAt: new Date(),
      });
    }

    // Green badge based on rank
    if (footprint.rank === 'Mountain Guardian') {
      rewards.push({
        id: `BADGE_${Date.now()}`,
        type: 'badge',
        amount: 0,
        description: '🏆 Mountain Guardian Badge Earned!',
        earnedAt: new Date(),
      });
    }

    return rewards;
  }

  /**
   * Claim green bonus
   */
  async claimGreenBonus(userId: string): Promise<{
    claimed: boolean;
    bonus: number;
    message: string;
  }> {
    const footprint = await this.calculateGreenScore(userId);
    const bonus = Math.round(footprint.carbonSaved * 2); // ₹2 per kg

    return {
      claimed: true,
      bonus,
      message: `Claimed ₹${bonus} green bonus!`,
    };
  }

  // ===========================================
  // LEADERBOARD
  // ===========================================

  /**
   * Get green leaderboard
   */
  async getGreenLeaderboard(limit: number = 10): Promise<GreenLeaderboardEntry[]> {
    // Mock leaderboard
    const mockLeaderboard = [
      { userId: 'user_eco_001', greenScore: 98, carbonSaved: 150, title: 'Mountain Guardian' },
      { userId: 'user_eco_002', greenScore: 92, carbonSaved: 120, title: 'Mountain Guardian' },
      { userId: 'user_eco_003', greenScore: 85, carbonSaved: 95, title: 'Forest Protector' },
      { userId: 'user_eco_004', greenScore: 78, carbonSaved: 80, title: 'Forest Protector' },
      { userId: 'user_eco_005', greenScore: 72, carbonSaved: 65, title: 'Tree Planter' },
    ];

    return mockLeaderboard
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        greenScore: entry.greenScore,
        carbonSaved: entry.carbonSaved,
        title: entry.title,
      }));
  }

  // ===========================================
  // HELPERS
  // ===========================================

  private getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}
