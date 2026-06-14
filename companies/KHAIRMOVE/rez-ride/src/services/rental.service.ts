import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import {
  RentalBookingModel,
  RentalBookingDocument,
  RentalStatus,
  VehicleType,
} from '../models/rental.model';
import {
  ValidationError,
  BookingNotFoundError,
  PackageNotFoundError,
  ConflictError,
} from '../common/exceptions';

// ===========================================
// INPUT VALIDATION SCHEMAS
// ===========================================

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const addressSchema = z.object({
  ...coordinatesSchema.shape,
  address: z.string().min(5).max(500),
  time: z.date(),
});

export const CreateRentalBookingSchema = z.object({
  userId: z.string().min(1),
  packageId: z.string().min(1),
  pickup: addressSchema,
});

export type CreateRentalBookingInput = z.infer<typeof CreateRentalBookingSchema>;

// Backward compatibility alias (must be after RentalStatus enum)
export const RENTAL_STATUS = RentalStatus;

export interface RentalPackage {
  id: string;
  name: string;
  duration: number; // hours
  kmIncluded: number;
  excessKmRate: number; // ₹ per km
  price: number;
  vehicleType: 'auto' | 'sedan' | 'suv';
  available: boolean;
}

export interface RentalBooking {
  id: string;
  bookingId: string;
  userId: string;
  driverId: string;
  vehicleType: 'auto' | 'sedan' | 'suv';
  packageId: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
    time: Date;
  };
  drop?: {
    lat: number;
    lng: number;
    address: string;
    time?: Date;
  };
  status: RentalStatus;
  includedKm: number;
  usedKm: number;
  excessKm: number;
  excessKmCharge: number;
  basePrice: number;
  totalPrice: number;
  actualDuration: number;
  waitingTime: number;
  waitingCharge: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface RentalDriver {
  id: string;
  driverId: string;
  name: string;
  phone: string;
  vehicleType: 'auto' | 'sedan' | 'suv';
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  currentLocation: { lat: number; lng: number };
  available: boolean;
}

// Available rental packages
const RENTAL_PACKAGES: RentalPackage[] = [
  // Auto packages
  { id: 'auto_2h', name: 'Auto 2 Hour', duration: 2, kmIncluded: 20, excessKmRate: 8, price: 150, vehicleType: 'auto', available: true },
  { id: 'auto_4h', name: 'Auto 4 Hour', duration: 4, kmIncluded: 40, excessKmRate: 7, price: 280, vehicleType: 'auto', available: true },
  { id: 'auto_8h', name: 'Auto Full Day', duration: 8, kmIncluded: 80, excessKmRate: 6, price: 500, vehicleType: 'auto', available: true },

  // Sedan packages
  { id: 'sedan_2h', name: 'Sedan 2 Hour', duration: 2, kmIncluded: 20, excessKmRate: 12, price: 250, vehicleType: 'sedan', available: true },
  { id: 'sedan_4h', name: 'Sedan 4 Hour', duration: 4, kmIncluded: 40, excessKmRate: 10, price: 450, vehicleType: 'sedan', available: true },
  { id: 'sedan_8h', name: 'Sedan Full Day', duration: 8, kmIncluded: 80, excessKmRate: 8, price: 800, vehicleType: 'sedan', available: true },
  { id: 'sedan_12h', name: 'Sedan 12 Hour', duration: 12, kmIncluded: 120, excessKmRate: 7, price: 1100, vehicleType: 'sedan', available: true },

  // SUV packages
  { id: 'suv_2h', name: 'SUV 2 Hour', duration: 2, kmIncluded: 20, excessKmRate: 15, price: 400, vehicleType: 'suv', available: true },
  { id: 'suv_4h', name: 'SUV 4 Hour', duration: 4, kmIncluded: 40, excessKmRate: 12, price: 700, vehicleType: 'suv', available: true },
  { id: 'suv_8h', name: 'SUV Full Day', duration: 8, kmIncluded: 80, excessKmRate: 10, price: 1200, vehicleType: 'suv', available: true },
  { id: 'suv_12h', name: 'SUV 12 Hour', duration: 12, kmIncluded: 120, excessKmRate: 9, price: 1600, vehicleType: 'suv', available: true },
];

// Mutex lock for driver dispatch (prevents race conditions)
const driverLocks = new Map<string, Promise<void>>();

@Injectable()
export class RentalService {
  private readonly logger = new Logger(RentalService.name);

  constructor(
    @InjectModel(RentalBookingModel.name) private bookingModel: Model<RentalBookingDocument>
  ) {}

  // ===========================================
  // PACKAGES
  // ===========================================

  /**
   * Get all rental packages
   */
  async getPackages(vehicleType?: 'auto' | 'sedan' | 'suv'): Promise<RentalPackage[]> {
    if (vehicleType) {
      return RENTAL_PACKAGES.filter(p => p.vehicleType === vehicleType && p.available);
    }
    return RENTAL_PACKAGES.filter(p => p.available);
  }

  /**
   * Get package by ID
   */
  async getPackage(packageId: string): Promise<RentalPackage | null> {
    return RENTAL_PACKAGES.find(p => p.id === packageId) || null;
  }

  /**
   * Get packages for city
   */
  async getPackagesByCity(cityId: string): Promise<RentalPackage[]> {
    // In production, filter by city availability
    return this.getPackages();
  }

  // ===========================================
  // BOOKING
  // ===========================================

  /**
   * Create rental booking
   */
  async createBooking(
    userId: string,
    packageId: string,
    pickup: { lat: number; lng: number; address: string; time: Date }
  ): Promise<RentalBooking> {
    // Validate input
    const validationResult = CreateRentalBookingSchema.safeParse({ userId, packageId, pickup });
    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid booking data',
        validationResult.error.issues.map(i => i.message),
      );
    }

    const pkg = await this.getPackage(packageId);
    if (!pkg) {
      throw new PackageNotFoundError(packageId);
    }

    const bookingId = `RNT_${Date.now()}_${randomBytes(4).toString('hex').toUpperCase()}`;

    // Create booking in MongoDB
    const booking = new this.bookingModel({
      bookingId,
      userId: new Types.ObjectId(userId),
      vehicleType: pkg.vehicleType as VehicleType,
      packageId: pkg.id,
      pickup,
      status: RentalStatus.BOOKED,
      includedKm: pkg.kmIncluded,
      usedKm: 0,
      excessKm: 0,
      excessKmCharge: 0,
      basePrice: pkg.price,
      totalPrice: pkg.price,
      actualDuration: 0,
      waitingTime: 0,
      waitingCharge: 0,
    });

    await booking.save();

    // Dispatch driver (with race condition protection)
    await this.dispatchDriver(bookingId);

    this.logger.log(`Rental booking created: ${bookingId}`);

    return this.toRentalBooking(booking);
  }

  /**
   * Convert MongoDB document to interface
   */
  private toRentalBooking(doc: RentalBookingDocument): RentalBooking {
    return {
      id: doc._id.toString(),
      bookingId: doc.bookingId,
      userId: doc.userId.toString(),
      driverId: doc.driverId?.toString() || '',
      vehicleType: doc.vehicleType,
      packageId: doc.packageId,
      pickup: doc.pickup,
      drop: doc.drop,
      status: doc.status,
      includedKm: doc.includedKm,
      usedKm: doc.usedKm,
      excessKm: doc.excessKm,
      excessKmCharge: doc.excessKmCharge,
      basePrice: doc.basePrice,
      totalPrice: doc.totalPrice,
      actualDuration: doc.actualDuration,
      waitingTime: doc.waitingTime,
      waitingCharge: doc.waitingCharge,
      createdAt: doc.createdAt || new Date(),
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
    };
  }

  /**
   * Dispatch driver to pickup (with mutex lock to prevent race conditions)
   */
  private async dispatchDriver(bookingId: string): Promise<void> {
    const booking = await this.bookingModel.findOne({ bookingId });
    if (!booking) return;

    // Get mutex lock for this vehicle type to prevent double-booking
    const lockKey = `dispatch:${booking.vehicleType}`;
    const releaseLock = await this.acquireLock(lockKey);

    try {
      // Find available driver from Driver collection
      const availableDriver = await this.findAvailableDriver(booking.vehicleType);
      if (!availableDriver) {
        this.logger.warn(`No driver available for rental ${bookingId}`);
        return;
      }

      // Update booking with driver assignment
      await this.bookingModel.findByIdAndUpdate(booking._id, {
        driverId: availableDriver._id,
        status: RentalStatus.DRIVER_DISPATCHED,
      });

      // Mark driver as busy in Driver collection
      // (In production, use DriverService for this)

      this.logger.log(`Driver ${availableDriver.name} dispatched for rental ${bookingId}`);
    } finally {
      releaseLock();
    }
  }

  /**
   * Acquire mutex lock for driver dispatch
   */
  private async acquireLock(key: string): Promise<() => void> {
    // Wait for lock to be available
    while (driverLocks.has(key)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const release = () => {
      driverLocks.delete(key);
    };

    driverLocks.set(key, Promise.resolve());
    return release;
  }

  /**
   * Find available driver for vehicle type
   * In production, query Driver collection with availability status
   */
  private async findAvailableDriver(vehicleType: VehicleType): Promise<{ _id: Types.ObjectId; name: string } | null> {
    // Mock implementation - in production, query Driver collection
    // This would use DriverService or direct Driver model query
    const mockDrivers: Record<VehicleType, { _id: Types.ObjectId; name: string }> = {
      auto: { _id: new Types.ObjectId(), name: 'Rajesh Kumar' },
      sedan: { _id: new Types.ObjectId(), name: 'Priya Sharma' },
      suv: { _id: new Types.ObjectId(), name: 'Amit Patel' },
    };

    return mockDrivers[vehicleType] || null;
  }

  /**
   * Start rental (pickup complete)
   */
  async startRental(bookingId: string, actualKm: number): Promise<RentalBooking> {
    const booking = await this.bookingModel.findOne({ bookingId });
    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    booking.status = RentalStatus.ACTIVE;
    booking.startedAt = new Date();
    booking.usedKm = actualKm;
    await booking.save();

    this.logger.log(`Rental started: ${bookingId}`);

    return this.toRentalBooking(booking);
  }

  /**
   * Update rental km during trip
   */
  async updateRentalKm(bookingId: string, currentKm: number): Promise<void> {
    const booking = await this.bookingModel.findOne({ bookingId });
    if (!booking) return;

    booking.usedKm = currentKm;

    // Calculate excess if any
    if (currentKm > booking.includedKm) {
      const pkg = await this.getPackage(booking.packageId);
      booking.excessKm = currentKm - booking.includedKm;
      booking.excessKmCharge = booking.excessKm * (pkg?.excessKmRate || 10);
    }

    await booking.save();
  }

  /**
   * Add waiting time
   */
  async addWaitingTime(bookingId: string, minutes: number): Promise<void> {
    const booking = await this.bookingModel.findOne({ bookingId });
    if (!booking) return;

    booking.waitingTime += minutes;
    // Waiting charge: ₹2 per minute
    booking.waitingCharge = booking.waitingTime * 2;
    await booking.save();
  }

  /**
   * Complete rental
   */
  async completeRental(
    bookingId: string,
    finalKm: number,
    endTime: Date
  ): Promise<{
    booking: RentalBooking;
    receipt: RentalReceipt;
  }> {
    const booking = await this.bookingModel.findOne({ bookingId });
    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    // Calculate final charges
    const pkg = await this.getPackage(booking.packageId);
    if (!pkg) {
      throw new PackageNotFoundError(booking.packageId);
    }

    booking.usedKm = finalKm;
    booking.completedAt = endTime;
    booking.status = RentalStatus.COMPLETED;

    // Calculate duration
    if (booking.startedAt) {
      booking.actualDuration = Math.round(
        (endTime.getTime() - booking.startedAt.getTime()) / (1000 * 60 * 60)
      );
    }

    // Excess km
    if (finalKm > booking.includedKm) {
      booking.excessKm = finalKm - booking.includedKm;
      booking.excessKmCharge = booking.excessKm * pkg.excessKmRate;
    }

    // Extra time beyond package duration
    let extraTimeCharge = 0;
    if (booking.actualDuration > pkg.duration) {
      const extraHours = booking.actualDuration - pkg.duration;
      // ₹50 per extra hour
      extraTimeCharge = extraHours * 50;
    }

    // Calculate total
    booking.totalPrice = booking.basePrice + booking.excessKmCharge + booking.waitingCharge + extraTimeCharge;
    await booking.save();

    // Generate receipt
    const receipt = this.generateReceipt(this.toRentalBooking(booking), pkg, extraTimeCharge);

    // Free up driver
    if (booking.driverId) {
      // In production, update driver availability via DriverService
      this.logger.log(`Driver freed after rental ${bookingId}`);
    }

    this.logger.log(`Rental completed: ${bookingId}, Total: ₹${booking.totalPrice}`);

    return { booking: this.toRentalBooking(booking), receipt };
  }

  /**
   * Generate receipt
   */
  private generateReceipt(
    booking: RentalBooking,
    pkg: RentalPackage,
    extraTimeCharge: number
  ): RentalReceipt {
    const cgst = Math.round(booking.totalPrice * 0.09);
    const sgst = Math.round(booking.totalPrice * 0.09);

    return {
      receiptId: `RCP_${booking.bookingId}`,
      bookingId: booking.bookingId,
      date: booking.completedAt || new Date(),
      userId: booking.userId,
      driverId: booking.driverId,
      package: pkg.name,
      duration: pkg.duration,
      includedKm: booking.includedKm,
      usedKm: booking.usedKm,
      excessKm: booking.excessKm,
      excessKmRate: pkg.excessKmRate,
      basePrice: booking.basePrice,
      excessKmCharge: booking.excessKmCharge,
      waitingCharge: booking.waitingCharge,
      extraTimeCharge,
      subtotal: booking.basePrice + booking.excessKmCharge + booking.waitingCharge + extraTimeCharge,
      cgst,
      sgst,
      total: booking.totalPrice + cgst + sgst,
      paymentMethod: 'wallet',
      vehicleType: booking.vehicleType,
    };
  }

  /**
   * Cancel rental booking
   */
  async cancelBooking(bookingId: string, reason: string): Promise<{ success: boolean; cancellationFee: number }> {
    const booking = await this.bookingModel.findOne({ bookingId });
    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    // Check if already started
    if (booking.status === RentalStatus.ACTIVE) {
      throw new ConflictError('Cannot cancel active rental');
    }

    booking.status = RentalStatus.CANCELLED;
    booking.cancellationReason = reason;

    // Calculate cancellation fee if within 30 mins of pickup
    const minutesUntilPickup = Math.round(
      (booking.pickup.time.getTime() - Date.now()) / (1000 * 60)
    );

    let cancellationFee = 0;
    if (minutesUntilPickup < 30 && minutesUntilPickup > 0) {
      cancellationFee = 50; // ₹50 cancellation fee
    }
    booking.cancellationFee = cancellationFee;
    await booking.save();

    // Free up driver
    if (booking.driverId) {
      // In production, update driver availability via DriverService
      this.logger.log(`Driver freed after cancellation ${bookingId}`);
    }

    this.logger.log(`Rental cancelled: ${bookingId}, Fee: ₹${cancellationFee}`);

    return { success: true, cancellationFee };
  }

  // ===========================================
  // GETTERS
  // ===========================================

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<RentalBooking | null> {
    const booking = await this.bookingModel.findOne({ bookingId });
    if (!booking) return null;
    return this.toRentalBooking(booking);
  }

  /**
   * Get booking by user
   */
  async getBookingByUser(userId: string): Promise<RentalBooking | null> {
    const booking = await this.bookingModel.findOne({
      userId: new Types.ObjectId(userId),
      status: { $ne: RentalStatus.COMPLETED },
    });
    if (!booking) return null;
    return this.toRentalBooking(booking);
  }

  /**
   * Get user's rental history
   */
  async getUserRentalHistory(userId: string): Promise<RentalBooking[]> {
    const bookings = await this.bookingModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return bookings.map(b => this.toRentalBooking(b));
  }

  /**
   * Get available drivers (mock - in production query Driver collection)
   */
  async getAvailableDrivers(vehicleType?: 'auto' | 'sedan' | 'suv'): Promise<RentalDriver[]> {
    // In production, query Driver collection with availability
    return [];
  }

  /**
   * Get rental stats
   */
  async getRentalStats(): Promise<{
    activeRentals: number;
    completedToday: number;
    avgBookingValue: number;
    popularPackages: { packageId: string; name: string; count: number }[];
  }> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const [activeRentals, todayCompleted, allCompleted] = await Promise.all([
      this.bookingModel.countDocuments({
        status: { $in: [RentalStatus.ACTIVE, RentalStatus.DRIVER_DISPATCHED] },
      }),
      this.bookingModel.countDocuments({
        status: RentalStatus.COMPLETED,
        completedAt: { $gte: now },
      }),
      this.bookingModel.find({ status: RentalStatus.COMPLETED }).exec(),
    ]);

    const completedCount = allCompleted.length;
    const totalValue = allCompleted.reduce((sum, b) => sum + b.totalPrice, 0);

    const packageCounts = new Map<string, number>();
    for (const booking of allCompleted) {
      const count = packageCounts.get(booking.packageId) || 0;
      packageCounts.set(booking.packageId, count + 1);
    }

    const popularPackages = Array.from(packageCounts.entries())
      .map(([packageId, count]) => {
        const pkg = RENTAL_PACKAGES.find(p => p.id === packageId);
        return { packageId, name: pkg?.name || packageId, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      activeRentals,
      completedToday: todayCompleted,
      avgBookingValue: completedCount > 0 ? Math.round(totalValue / completedCount) : 0,
      popularPackages,
    };
  }
}

export interface RentalReceipt {
  receiptId: string;
  bookingId: string;
  date: Date;
  userId: string;
  driverId: string;
  package: string;
  duration: number;
  includedKm: number;
  usedKm: number;
  excessKm: number;
  excessKmRate: number;
  basePrice: number;
  excessKmCharge: number;
  waitingCharge: number;
  extraTimeCharge: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentMethod: string;
  vehicleType: string;
}
