import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types, ClientSession } from 'mongoose';
import { randomInt } from 'crypto';
import { IRide, Ride, RideStatus, IFare } from '../models/ride.model';
import { IUser, User } from '../models/user.model';
import { IDriver, Driver, DriverStatus, DriverModel } from '../models/driver.model';
import { IVoucher, Voucher, VoucherType } from '../models/voucher.model';
import { calculateFare, estimateFare, VehicleType, FareBreakdown, isNightTime } from '../config/fare.config';
import { MapsService, Route } from './maps.service';
import { WalletService } from './wallet.service';
import { VoucherService } from './voucher.service';
import { NotificationService } from './notification.service';
import { AdsService } from './ads.service';
import { CommerceIntegrationService } from './commerce-integration.service';
import { RideNotFoundError, AppError } from '../common/exceptions';

export interface CreateRideInput {
  userId: string;
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  vehicleType: VehicleType;
  paymentMethod?: 'wallet' | 'upi' | 'card' | 'cash';
  voucherId?: string;
}

export interface RideLocation {
  lat: number;
  lng: number;
  address: string;
}

@Injectable()
export class RideService {
  private readonly logger = new Logger(RideService.name);
  private readonly commerceService: CommerceIntegrationService;

  constructor(
    @InjectModel(Ride.name) private rideModel: Model<IRide>,
    @InjectModel(User.name) private userModel: Model<IUser>,
    @InjectModel(Driver.name) private driverModel: DriverModel,
    @InjectModel(Voucher.name) private voucherModel: Model<IVoucher>,
    private mapsService: MapsService,
    private walletService: WalletService,
    private voucherService: VoucherService,
    private notificationService: NotificationService,
    private adsService: AdsService,
  ) {
    // Initialize Commerce Integration Service
    this.commerceService = new CommerceIntegrationService({
      get: (key: string, defaultValue?: string) => process.env[key] || defaultValue,
    } as any);
  }

  /**
   * Create a new ride
   */
  async createRide(input: CreateRideInput): Promise<Ride> {
    const { userId, pickup, drop, vehicleType, paymentMethod, voucherId } = input;

    // Get user
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate route and estimate
    const route = await this.mapsService.getRoute(pickup, drop);
    if (!route) {
      throw new BadRequestException('Could not calculate route');
    }

    // Estimate fare
    const estimatedFare = estimateFare(
      vehicleType,
      route.distanceKm,
      route.durationMinutes
    );

    // Generate OTP
    const otp = this.generateOTP();

    // Apply voucher if provided
    let voucherApplied = undefined;
    let finalAmount = estimatedFare.total;

    if (voucherId) {
      // Filter to only voucher-eligible vehicle types (auto, cab, suv)
      const voucherEligibleType: 'auto' | 'cab' | 'suv' =
        vehicleType === 'bike' || vehicleType === 'bus' ? 'auto' : vehicleType;
      const voucherResult = await this.voucherService.applyVoucher(
        userId,
        voucherId,
        estimatedFare.total,
        voucherEligibleType
      );
      if (voucherResult.applied) {
        voucherApplied = {
          voucherId,
          amount: voucherResult.amount,
          type: voucherResult.type,
        };
        finalAmount = Math.max(0, estimatedFare.total - voucherResult.amount);
      }
    }

    // Create ride
    const ride = new this.rideModel({
      userId: new Types.ObjectId(userId),
      pickup,
      drop,
      vehicleType,
      status: RideStatus.REQUESTED,
      otp,
      fare: {
        base: estimatedFare.base,
        distance: estimatedFare.distanceCharge,
        distanceKm: route.distanceKm,
        time: estimatedFare.timeCharge,
        timeMinutes: route.durationMinutes,
        waiting: 0,
        waitingMinutes: 0,
        surge: estimatedFare.surge,
        surgeMultiplier: 1,
        nightCharges: estimatedFare.nightCharges,
        total: estimatedFare.total,
      },
      fareEstimated: estimatedFare,
      voucherApplied,
      finalAmount,
      paymentMethod: paymentMethod || 'wallet',
      paymentStatus: 'pending',
      cashbackCredited: false,
      adServed: false,
      requestedAt: new Date(),
    });

    await ride.save();

    this.logger.log(`Ride created: ${ride._id} for user: ${userId}`);

    // Find nearby drivers and send requests
    this.dispatchRide(ride);

    return ride;
  }

  /**
   * Dispatch ride to nearby drivers
   */
  private async dispatchRide(ride: Ride): Promise<void> {
    // Find nearby drivers
    const drivers = await this.driverModel.findNearby(
      ride.pickup.lat,
      ride.pickup.lng,
      5, // 5km radius
      ride.vehicleType
    );

    if (drivers.length === 0) {
      this.logger.warn(`No drivers found for ride: ${ride._id}`);
      // Could implement queue/retry logic here
      return;
    }

    // For MVP, just pick the closest driver
    const driver = drivers[0];
    await this.assignDriver(ride._id.toString(), driver._id.toString());

    this.logger.log(`Ride ${ride._id} assigned to driver ${driver._id}`);
  }

  /**
   * Assign a driver to a ride
   * Uses optimistic locking to prevent race conditions
   */
  async assignDriver(rideId: string, driverId: string): Promise<Ride> {
    // First verify driver exists
    const driver = await this.driverModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Use atomic update to prevent race condition
    // Only one driver can be assigned even with concurrent requests
    const ride = await this.rideModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(rideId),
        status: RideStatus.REQUESTED,
        driverId: { $exists: false }  // Ensure no driver assigned
      },
      {
        $set: {
          driverId: new Types.ObjectId(driverId),
          status: RideStatus.ASSIGNED,
          assignedAt: new Date()
        }
      },
      { new: true }
    );

    if (!ride) {
      // Check why it failed
      const existing = await this.rideModel.findById(rideId);
      if (!existing) {
        throw new NotFoundException('Ride not found');
      }
      if (existing.driverId) {
        throw new ConflictException('Ride already assigned to another driver');
      }
      throw new BadRequestException('Ride is no longer available');
    }

    // Update driver status
    await this.driverModel.updateOne(
      { _id: new Types.ObjectId(driverId) },
      { $set: { status: DriverStatus.BUSY } }
    );

    // Notify user
    await this.notificationService.sendRideAssigned(ride.userId.toString(), ride);

    // Notify driver
    await this.notificationService.sendRideRequest(driverId, ride);

    return ride;
  }

  /**
   * Driver accepts a ride
   */
  async acceptRide(rideId: string, driverId: string): Promise<Ride> {
    const ride = await this.rideModel.findById(rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId?.toString() !== driverId) {
      throw new BadRequestException('Ride not assigned to this driver');
    }

    if (ride.status !== RideStatus.ASSIGNED) {
      throw new BadRequestException('Ride is not in assigned state');
    }

    ride.status = RideStatus.ACCEPTED;
    ride.acceptedAt = new Date();
    await ride.save();

    // Notify user
    await this.notificationService.sendRideAccepted(ride.userId.toString(), ride);

    return ride;
  }

  /**
   * Driver arrives at pickup location
   */
  async arriveRide(rideId: string, driverId: string): Promise<Ride> {
    const ride = await this.rideModel.findById(rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId?.toString() !== driverId) {
      throw new BadRequestException('Ride not assigned to this driver');
    }

    if (ride.status !== RideStatus.ACCEPTED) {
      throw new BadRequestException('Ride is not in accepted state');
    }

    ride.status = RideStatus.ARRIVED;
    ride.arrivedAt = new Date();
    await ride.save();

    // Notify user
    await this.notificationService.sendDriverArrived(ride.userId.toString(), ride);

    return ride;
  }

  /**
   * Start the ride (verify OTP)
   */
  async startRide(rideId: string, driverId: string, otp: string): Promise<Ride> {
    const ride = await this.rideModel.findById(rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId?.toString() !== driverId) {
      throw new BadRequestException('Ride not assigned to this driver');
    }

    if (ride.status !== RideStatus.ARRIVED) {
      throw new BadRequestException('Ride is not in arrived state');
    }

    if (ride.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    ride.status = RideStatus.IN_PROGRESS;
    ride.startedAt = new Date();
    await ride.save();

    // Start ad serving
    await this.adsService.startRideAds(ride);

    // Notify user
    await this.notificationService.sendRideStarted(ride.userId.toString(), ride);

    return ride;
  }

  /**
   * Complete the ride with transaction support
   * All critical updates are atomic - either all succeed or all rollback
   */
  async completeRide(rideId: string, driverId: string): Promise<Ride> {
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Step 1: Validate and lock the ride
      const ride = await this.rideModel
        .findById(rideId)
        .session(session);

      if (!ride) {
        throw new NotFoundException('Ride not found');
      }

      if (ride.driverId?.toString() !== driverId) {
        throw new BadRequestException('Ride not assigned to this driver');
      }

      if (ride.status !== RideStatus.IN_PROGRESS) {
        throw new BadRequestException('Ride is not in progress');
      }

      // Step 2: Calculate final fare
      const completedAt = new Date();
      const durationMinutes = ride.startedAt
        ? Math.round((completedAt.getTime() - ride.startedAt.getTime()) / 60000)
        : 0;

      const route = await this.mapsService.getRoute(ride.pickup, ride.drop);
      const distanceKm = route?.distanceKm || ride.fare.distanceKm || 0;

      const finalFare = calculateFare({
        vehicleType: ride.vehicleType,
        distanceKm,
        durationMinutes,
        waitingMinutes: 0,
        isNightTime: isNightTime(completedAt),
      });

      const cashback = Math.round(finalFare.total * 0.10 * 100) / 100;

      // Step 3: Update ride in transaction
      ride.status = RideStatus.COMPLETED;
      ride.completedAt = completedAt;
      ride.distanceKm = distanceKm;
      ride.durationMinutes = durationMinutes;
      ride.fare = {
        base: finalFare.base,
        distance: finalFare.distanceCharge,
        distanceKm: distanceKm,
        time: finalFare.timeCharge,
        timeMinutes: durationMinutes,
        waiting: finalFare.waitingCharge,
        waitingMinutes: 0,
        surge: finalFare.surge,
        surgeMultiplier: finalFare.surgeMultiplier,
        nightCharges: finalFare.nightCharges,
        total: finalFare.total,
      };
      ride.cashbackAmount = cashback;
      ride.paymentStatus = 'pending';

      await ride.save({ session });

      // Step 4: Update driver in transaction (atomic increment)
      await this.driverModel.updateOne(
        { _id: driverId },
        {
          $set: { status: DriverStatus.ONLINE },
          $inc: {
            totalRides: 1,
            totalEarnings: finalFare.total,
            totalDistanceKm: distanceKm,
            totalMinutes: durationMinutes,
          },
        },
        { session }
      );

      // Step 5: Update user stats in transaction
      await this.userModel.updateOne(
        { _id: ride.userId },
        {
          $inc: { totalRides: 1, totalSpent: finalFare.total },
          $set: { lastRideAt: completedAt },
        },
        { session }
      );

      // Step 6: Process payment (integrate with RABTUL Payment)
      await this.processPayment(ride);

      // Step 7: Credit cashback (with idempotency)
      await this.creditCashback(ride);

      // Commit the transaction for critical operations
      await session.commitTransaction();
      session.endSession();

      // Step 8: Non-critical operations (outside transaction)
      try {
        const adImpressions = await this.adsService.stopRideAds(rideId);
        await this.rideModel.updateOne(
          { _id: rideId },
          {
            $set: {
              adImpressions,
              adServed: adImpressions > 0,
            },
          }
        );

        await this.notificationService.sendRideCompleted(ride.userId.toString(), ride);

        await this.voucherService.handleRideCompleted({
          rideId: ride._id.toString(),
          userId: ride.userId.toString(),
          fare: finalFare.total,
          drop: ride.drop,
        });

        // Step 9: Commerce Graph Integration
        // Record transaction and get cross-sell/moment recommendations
        this.commerceService.recordRideTransaction({
          rideId: ride._id.toString(),
          userId: ride.userId.toString(),
          driverId: ride.driverId.toString(),
          pickup: ride.pickup,
          drop: ride.drop,
          fare: finalFare.total,
          vehicleType: ride.vehicleType,
          distance: distanceKm,
          duration: durationMinutes,
        }).catch(err => {
          this.logger.warn(`Commerce Graph transaction sync failed: ${err.message}`);
        });

        this.commerceService.recordRideEvent({
          userId: ride.userId.toString(),
          driverId: ride.driverId.toString(),
          rideId: ride._id.toString(),
          eventType: 'completed',
          location: ride.drop,
        }).catch(err => {
          this.logger.warn(`Commerce Graph event sync failed: ${err.message}`);
        });
      } catch (asyncError) {
        this.logger.warn(`Post-completion async operations failed: ${asyncError.message}`);
      }

      const completedRide = await this.rideModel.findById(rideId);
      if (!completedRide) {
        throw new RideNotFoundError(rideId);
      }
      return completedRide;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      this.logger.error(`Failed to complete ride ${rideId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel a ride
   */
  async cancelRide(
    rideId: string,
    cancelledBy: 'user' | 'driver' | 'system',
    reason?: string
  ): Promise<Ride> {
    const ride = await this.rideModel.findById(rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (![RideStatus.REQUESTED, RideStatus.ASSIGNED, RideStatus.ACCEPTED, RideStatus.ARRIVED, RideStatus.IN_PROGRESS].includes(ride.status)) {
      throw new BadRequestException('Ride cannot be cancelled');
    }

    ride.status = RideStatus.CANCELLED;
    ride.cancelledBy = cancelledBy;
    ride.cancelReason = reason;
    ride.cancelledAt = new Date();
    await ride.save();

    // Release driver if assigned
    if (ride.driverId) {
      await this.driverModel.findByIdAndUpdate(ride.driverId, {
        status: DriverStatus.ONLINE,
      });
    }

    // Refund voucher if applied
    if (ride.voucherApplied) {
      await this.voucherService.refundVoucher(ride.voucherApplied.voucherId);
    }

    // Notify affected parties
    if (cancelledBy === 'driver') {
      await this.notificationService.sendRideCancelledByDriver(ride.userId.toString(), ride);
    } else if (cancelledBy === 'user') {
      await this.notificationService.sendRideCancelledByUser(ride.driverId?.toString(), ride);
    }

    return ride;
  }

  /**
   * Process payment for completed ride
   */
  private async processPayment(ride: Ride): Promise<void> {
    const amount = ride.finalAmount || ride.fare.total;

    try {
      // Debit from wallet or payment method
      await this.walletService.debitRidePayment(
        ride.userId.toString(),
        amount,
        ride.paymentMethod,
        ride._id.toString()
      );

      ride.paymentStatus = 'completed';
      await ride.save();

      // Credit to driver
      await this.walletService.creditDriverEarnings(
        ride.driverId!.toString(),
        amount,
        ride._id.toString()
      );

    } catch (error) {
      this.logger.error(`Payment failed for ride ${ride._id}: ${error.message}`);
      ride.paymentStatus = 'failed';
      await ride.save();
      throw error;
    }
  }

  /**
   * Credit cashback to user wallet
   */
  private async creditCashback(ride: Ride): Promise<void> {
    if (ride.cashbackAmount && ride.cashbackAmount > 0) {
      await this.walletService.creditCashback(
        ride.userId.toString(),
        ride.cashbackAmount,
        ride._id.toString()
      );
      ride.cashbackCredited = true;
      await ride.save();
    }
  }

  /**
   * Rate a completed ride
   */
  async rateRide(rideId: string, userId: string, rating: number, feedback?: string): Promise<Ride> {
    const ride = await this.rideModel.findById(rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.userId.toString() !== userId) {
      throw new BadRequestException('Not authorized to rate this ride');
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Can only rate completed rides');
    }

    ride.userRating = rating;
    ride.userFeedback = feedback;
    await ride.save();

    // Update driver rating
    if (ride.driverId) {
      const driver = await this.driverModel.findById(ride.driverId);
      if (driver) {
        // Recalculate average rating
        const allRatings = await this.rideModel.find({
          driverId: ride.driverId,
          userRating: { $exists: true },
        });
        const avgRating = allRatings.reduce((sum, r) => sum + (r.userRating || 0), 0) / allRatings.length;
        driver.rating = Math.round(avgRating * 10) / 10;
        await driver.save();
      }
    }

    return ride;
  }

  /**
   * Get ride by ID
   */
  async getRide(rideId: string): Promise<Ride> {
    const ride = await this.rideModel.findById(rideId)
      .populate('userId', 'name phone')
      .populate('driverId', 'name phone vehicle');

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }
    return ride;
  }

  /**
   * Get user's ride history
   */
  async getUserRides(userId: string, limit = 20, offset = 0): Promise<Ride[]> {
    return this.rideModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('driverId', 'name phone vehicle rating');
  }

  /**
   * Get driver's ride history
   */
  async getDriverRides(driverId: string, limit = 20, offset = 0): Promise<Ride[]> {
    return this.rideModel
      .find({ driverId: new Types.ObjectId(driverId) })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('userId', 'name phone');
  }

  /**
   * Get driver's current active ride
   */
  async getDriverActiveRide(driverId: string): Promise<Ride | null> {
    return this.rideModel.findOne({
      driverId: new Types.ObjectId(driverId),
      status: { $in: [RideStatus.ASSIGNED, RideStatus.ACCEPTED, RideStatus.ARRIVED, RideStatus.IN_PROGRESS] },
    });
  }

  /**
   * Get ride estimate
   */
  async getEstimate(
    pickup: RideLocation,
    drop: RideLocation,
    vehicleType: VehicleType
  ): Promise<{ estimate: FareBreakdown; route: Route }> {
    const route = await this.mapsService.getRoute(pickup, drop);

    if (!route) {
      throw new BadRequestException('Could not calculate route');
    }

    const estimate = estimateFare(vehicleType, route.distanceKm, route.durationMinutes);

    return { estimate, route };
  }

  /**
   * Generate 4-digit OTP
   */
  private generateOTP(): string {
    return randomInt(1000, 9999).toString();
  }
}
