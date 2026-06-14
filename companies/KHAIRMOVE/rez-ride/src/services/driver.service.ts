import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { Driver, DriverStatus, IDriverLocation } from '../models/driver.model';
import { Ride, RideStatus } from '../models/ride.model';

export interface CreateDriverInput {
  phone: string;
  name: string;
  email?: string;
  vehicle: {
    type: 'auto' | 'cab' | 'suv' | 'bike' | 'bus';
    make: string;
    model: string;
    year?: number;
    color: string;
    plate: string;
    rcNumber: string;
    insuranceNumber?: string;
    insuranceExpiry?: Date;
    permitNumber?: string;
  };
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
    upiId?: string;
  };
}

export interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);

  constructor(
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
  ) {}

  /**
   * Create a new driver
   */
  async createDriver(input: CreateDriverInput): Promise<Driver> {
    // Check if phone already exists
    const existing = await this.driverModel.findOne({ phone: input.phone });
    if (existing) {
      throw new BadRequestException('Phone number already registered');
    }

    // Generate referral code
    const referralCode = this.generateReferralCode();

    const driver = new this.driverModel({
      phone: input.phone,
      name: input.name,
      email: input.email,
      vehicle: input.vehicle,
      bankDetails: input.bankDetails,
      status: DriverStatus.PENDING_VERIFICATION,
      referralCode,
      rating: 5,
      totalRides: 0,
      totalEarnings: 0,
    });

    await driver.save();
    this.logger.log(`Driver created: ${driver._id}`);

    return driver;
  }

  /**
   * Get driver by ID
   */
  async getDriver(driverId: string): Promise<Driver> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return driver;
  }

  /**
   * Get driver by phone
   */
  async getDriverByPhone(phone: string): Promise<Driver | null> {
    return this.driverModel.findOne({ phone });
  }

  /**
   * Update driver location
   */
  async updateLocation(
    driverId: string,
    location: DriverLocation,
  ): Promise<void> {
    await this.driverModel.findByIdAndUpdate(driverId, {
      currentLocation: {
        lat: location.lat,
        lng: location.lng,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.speed ? 5 : undefined,
        updatedAt: new Date(),
      },
      lastActiveAt: new Date(),
    });
  }

  /**
   * Go online
   */
  async goOnline(driverId: string): Promise<Driver> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Check if driver can go online
    if (!driver.isDocumentsVerified) {
      throw new BadRequestException('Documents not verified');
    }

    if (driver.status === DriverStatus.SUSPENDED) {
      throw new BadRequestException('Account suspended');
    }

    driver.goOnline();
    await driver.save();

    this.logger.log(`Driver ${driverId} went online`);

    return driver;
  }

  /**
   * Go offline
   */
  async goOffline(driverId: string): Promise<Driver> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    driver.goOffline();
    await driver.save();

    this.logger.log(`Driver ${driverId} went offline`);

    return driver;
  }

  /**
   * Start a ride (driver status)
   */
  async startRide(driverId: string): Promise<Driver> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    driver.startRide();
    await driver.save();

    return driver;
  }

  /**
   * End a ride (driver status)
   */
  async endRide(driverId: string): Promise<Driver> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    driver.endRide();
    await driver.save();

    return driver;
  }

  /**
   * Get nearby available drivers
   */
  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number = 5,
    vehicleType?: string,
  ): Promise<Driver[]> {
    return (this.driverModel as any).findNearby(lat, lng, radiusKm, vehicleType);
  }

  /**
   * Get driver's earnings
   */
  async getEarnings(
    driverId: string,
    period: 'today' | 'week' | 'month' = 'today',
  ): Promise<{
    total: number;
    rideEarnings: number;
    adRevenue: number;
    bonuses: number;
    rides: number;
    hours: number;
  }> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // For MVP, return denormalized values
    // In production, would query ride collection for accurate stats
    switch (period) {
      case 'today':
        return {
          total: driver.todayEarnings,
          rideEarnings: driver.todayEarnings * 0.9,
          adRevenue: driver.todayEarnings * 0.1,
          bonuses: 0,
          rides: Math.floor(driver.totalRides * 0.1),
          hours: 8,
        };
      case 'week':
        return {
          total: driver.weekEarnings,
          rideEarnings: driver.weekEarnings * 0.9,
          adRevenue: driver.weekEarnings * 0.1,
          bonuses: 0,
          rides: Math.floor(driver.totalRides * 0.7),
          hours: 56,
        };
      case 'month':
        return {
          total: driver.monthEarnings,
          rideEarnings: driver.monthEarnings * 0.9,
          adRevenue: driver.monthEarnings * 0.1,
          bonuses: 0,
          rides: driver.totalRides,
          hours: 240,
        };
    }
  }

  /**
   * Get driver's today's stats
   */
  async getTodayStats(driverId: string): Promise<{
    rides: number;
    earnings: number;
    onlineTime: number;
    acceptanceRate: number;
    rating: number;
  }> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const todayRides = await this.rideModel.countDocuments({
      driverId: new Types.ObjectId(driverId),
      status: RideStatus.COMPLETED,
      completedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    return {
      rides: todayRides,
      earnings: driver.todayEarnings,
      onlineTime: 8, // Would calculate from location updates
      acceptanceRate: driver.acceptanceRate,
      rating: driver.rating,
    };
  }

  /**
   * Update driver documents verification
   */
  async verifyDocuments(
    driverId: string,
    documents: Array<{
      type: string;
      number: string;
      imageUrl: string;
      verified: boolean;
    }>,
  ): Promise<Driver> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Update documents
    documents.forEach((doc) => {
      const existingDoc = driver.documents.find((d) => d.type === doc.type);
      if (existingDoc) {
        existingDoc.number = doc.number;
        existingDoc.imageUrl = doc.imageUrl;
        existingDoc.verified = doc.verified;
        existingDoc.verifiedAt = doc.verified ? new Date() : undefined;
      } else {
        driver.documents.push({
          type: doc.type as any,
          number: doc.number,
          imageUrl: doc.imageUrl,
          verified: doc.verified,
          verifiedAt: doc.verified ? new Date() : undefined,
        });
      }
    });

    // Check if all required docs verified
    const requiredDocTypes = ['dl', 'rc'];
    const allVerified = requiredDocTypes.every((type) =>
      driver.documents.some((d) => d.type === type && d.verified)
    );

    if (allVerified) {
      driver.isDocumentsVerified = true;
      driver.status = DriverStatus.OFFLINE;
    }

    await driver.save();

    return driver;
  }

  /**
   * Update driver bank details
   */
  async updateBankDetails(
    driverId: string,
    bankDetails: {
      accountNumber: string;
      ifsc: string;
      accountHolderName: string;
      upiId?: string;
    },
  ): Promise<Driver> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    driver.bankDetails = bankDetails;
    await driver.save();

    return driver;
  }

  /**
   * Generate referral code
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(6);
    return 'REZDR' + Array.from(bytes).map(b => chars[b % chars.length]).join('');
  }

  /**
   * Add earnings to driver
   */
  async addEarnings(driverId: string, amount: number, rideId: string): Promise<void> {
    await this.driverModel.findByIdAndUpdate(driverId, {
      $inc: {
        walletBalance: amount,
        totalEarnings: amount,
        todayEarnings: amount,
        weekEarnings: amount,
        monthEarnings: amount,
      },
    });
  }
}
