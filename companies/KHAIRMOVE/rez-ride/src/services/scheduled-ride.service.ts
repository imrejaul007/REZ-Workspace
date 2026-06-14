import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { z } from 'zod';
import { ScheduledRide, ScheduledRideStatus } from '../models/scheduled-ride.model';
import { RideService } from './ride.service';
import { NotificationService } from './notification.service';

// Input validation schema
const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().min(5).max(500),
});

const recurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'weekdays', 'custom']),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  endDate: z.date().optional(),
  maxOccurrences: z.number().positive().max(365).optional(),
});

export const CreateScheduledRideSchema = z.object({
  userId: z.string().min(1),
  pickup: locationSchema,
  drop: locationSchema,
  vehicleType: z.enum(['auto', 'cab', 'suv', 'bike']),
  scheduledAt: z.date(),
  scheduledTimezone: z.string().optional(),
  paymentMethod: z.enum(['wallet', 'upi', 'card', 'cash']).optional(),
  notes: z.string().max(500).optional(),
  recurrence: recurrenceSchema.optional(),
});

export type CreateScheduledRideInput = z.infer<typeof CreateScheduledRideSchema>;

@Injectable()
export class ScheduledRideService {
  private readonly logger = new Logger(ScheduledRideService.name);

  constructor(
    @InjectModel(ScheduledRide.name) private scheduledRideModel: Model<ScheduledRide>,
    private rideService: RideService,
    private notificationService: NotificationService,
  ) {
    // Start dispatch scheduler
    this.startDispatchScheduler();
  }

  /**
   * Create a scheduled ride
   */
  async createScheduledRide(input: CreateScheduledRideInput): Promise<ScheduledRide> {
    // Validate input
    const validationResult = CreateScheduledRideSchema.safeParse(input);
    if (!validationResult.success) {
      throw new BadRequestException(
        `Invalid input: ${validationResult.error.issues.map(i => i.message).join(', ')}`
      );
    }

    const validated = validationResult.data;

    // Validate scheduled time
    const minTime = new Date();
    minTime.setMinutes(minTime.getMinutes() + 15); // At least 15 min in future

    if (validated.scheduledAt < minTime) {
      throw new BadRequestException('Scheduled time must be at least 15 minutes in the future');
    }

    // Check max advance booking (7 days)
    const maxTime = new Date();
    maxTime.setDate(maxTime.getDate() + 7);

    if (validated.scheduledAt > maxTime) {
      throw new BadRequestException('Cannot schedule more than 7 days in advance');
    }

    const scheduledRide = new this.scheduledRideModel({
      userId: validated.userId,
      pickup: validated.pickup,
      drop: validated.drop,
      vehicleType: validated.vehicleType,
      scheduledAt: validated.scheduledAt,
      scheduledTimezone: validated.scheduledTimezone || 'Asia/Kolkata',
      paymentMethod: validated.paymentMethod || 'wallet',
      notes: validated.notes,
      status: ScheduledRideStatus.PENDING,
      isAdvanceBooking: true,
      advanceNoticeMinutes: 30,
      recurrence: validated.recurrence ? {
        ...validated.recurrence,
        occurrencesCount: 0,
      } : undefined,
    });

    await scheduledRide.save();

    this.logger.log(`Scheduled ride created: ${scheduledRide._id}`);

    // Send confirmation
    await this.notificationService.sendSMS(
      'USER_PHONE', // Would get from user model
      `Your ride is scheduled for ${validated.scheduledAt.toLocaleString()}. We'll notify you when a driver is assigned.`
    );

    return scheduledRide;
  }

  /**
   * Get user's scheduled rides
   */
  async getUserScheduledRides(userId: string): Promise<ScheduledRide[]> {
    return this.scheduledRideModel.find({
      userId,
      status: {
        $in: [
          ScheduledRideStatus.PENDING,
          ScheduledRideStatus.DISPATCHED,
          ScheduledRideStatus.IN_PROGRESS,
        ],
      },
    }).sort({ scheduledAt: 1 });
  }

  /**
   * Cancel a scheduled ride
   */
  async cancelScheduledRide(scheduledRideId: string, userId: string, reason?: string): Promise<ScheduledRide> {
    const ride = await this.scheduledRideModel.findOne({
      _id: scheduledRideId,
      userId,
    });

    if (!ride) {
      throw new NotFoundException('Scheduled ride not found');
    }

    if (ride.status !== ScheduledRideStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending scheduled rides');
    }

    (ride as any).cancel(reason || 'User cancelled');
    await ride.save();

    this.logger.log(`Scheduled ride cancelled: ${scheduledRideId}`);

    return ride;
  }

  /**
   * Dispatch a scheduled ride (create actual ride)
   */
  async dispatchScheduledRide(scheduledRideId: string): Promise<ScheduledRide> {
    const scheduledRide = await this.scheduledRideModel.findById(scheduledRideId);

    if (!scheduledRide) {
      throw new NotFoundException('Scheduled ride not found');
    }

    if (scheduledRide.status !== ScheduledRideStatus.PENDING) {
      throw new BadRequestException('Ride is not in pending status');
    }

    try {
      // Create the actual ride
      const ride = await this.rideService.createRide({
        userId: scheduledRide.userId.toString(),
        pickup: scheduledRide.pickup,
        drop: scheduledRide.drop,
        vehicleType: scheduledRide.vehicleType,
        paymentMethod: scheduledRide.paymentMethod,
      });

      // Update scheduled ride
      scheduledRide.rideId = ride._id;
      scheduledRide.status = ScheduledRideStatus.DISPATCHED;
      scheduledRide.dispatchedAt = new Date();
      await scheduledRide.save();

      this.logger.log(`Scheduled ride ${scheduledRideId} dispatched as ride ${ride._id}`);

      // Notify user
      await this.notificationService.sendSMS(
        'USER_PHONE',
        `Your scheduled ride is now active! Driver is being assigned.`
      );

      return scheduledRide;
    } catch (error: any) {
      this.logger.error(`Failed to dispatch scheduled ride ${scheduledRideId}: ${error.message}`);

      // Mark as no driver available
      (scheduledRide as any).markNoDriver();
      await scheduledRide.save();

      // Notify user
      await this.notificationService.sendSMS(
        'USER_PHONE',
        `We couldn't find a driver for your scheduled ride. Please book a new ride.`
      );

      throw new BadRequestException('Failed to dispatch ride: No driver available');
    }
  }

  /**
   * Start the dispatch scheduler
   */
  private startDispatchScheduler(): void {
    // Check every minute
    setInterval(async () => {
      await this.processPendingSchedules();
    }, 60000);

    this.logger.log('Scheduled ride dispatch scheduler started');
  }

  /**
   * Process pending scheduled rides
   */
  private async processPendingSchedules(): Promise<void> {
    try {
      const pendingRides = await (this.scheduledRideModel as any).findPendingDispatch();

      for (const scheduledRide of pendingRides) {
        if (scheduledRide.canDispatch()) {
          try {
            await this.dispatchScheduledRide(scheduledRide._id.toString());
          } catch (error) {
            this.logger.error(`Failed to dispatch ${scheduledRide._id}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error processing scheduled rides: ${error.message}`);
    }
  }

  /**
   * Handle ride completed - for recurring rides
   */
  async handleRideCompleted(scheduledRideId: string): Promise<ScheduledRide | null> {
    const scheduledRide = await this.scheduledRideModel.findById(scheduledRideId);

    if (!scheduledRide || !scheduledRide.recurrence) {
      return null;
    }

    const recurrence = scheduledRide.recurrence;

    // Check if we should create next occurrence
    if (recurrence.endDate && new Date() > recurrence.endDate) {
      return null; // Recurrence ended
    }

    if (recurrence.maxOccurrences && recurrence.occurrencesCount >= recurrence.maxOccurrences) {
      return null; // Max occurrences reached
    }

    // Calculate next occurrence
    const nextDate = this.calculateNextOccurrence(
      scheduledRide.scheduledAt,
      recurrence
    );

    if (!nextDate) {
      return null;
    }

    // Create next scheduled ride
    const nextRide = await this.createScheduledRide({
      userId: scheduledRide.userId.toString(),
      pickup: scheduledRide.pickup,
      drop: scheduledRide.drop,
      vehicleType: scheduledRide.vehicleType as any,
      scheduledAt: nextDate,
      paymentMethod: scheduledRide.paymentMethod as any,
      recurrence: {
        frequency: recurrence.frequency as any,
        daysOfWeek: recurrence.daysOfWeek,
        endDate: recurrence.endDate,
        maxOccurrences: recurrence.maxOccurrences,
      },
    });

    // Update occurrence count
    recurrence.occurrencesCount++;
    scheduledRide.recurrence = recurrence;
    await scheduledRide.save();

    this.logger.log(`Created recurring ride occurrence: ${nextRide._id}`);

    return nextRide;
  }

  /**
   * Calculate next occurrence date
   */
  private calculateNextOccurrence(
    lastDate: Date,
    recurrence: { frequency: string; daysOfWeek?: number[] }
  ): Date | null {
    const next = new Date(lastDate);

    switch (recurrence.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;

      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;

      case 'weekdays':
        do {
          next.setDate(next.getDate() + 1);
        } while (next.getDay() === 0 || next.getDay() === 6); // Skip weekends
        break;

      case 'custom':
        if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
          // Find next day in the list
          const currentDay = next.getDay();
          const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);

          let nextDay = sortedDays.find(d => d > currentDay);
          if (nextDay === undefined) {
            nextDay = sortedDays[0];
            next.setDate(next.getDate() + (7 - currentDay + nextDay));
          } else {
            next.setDate(next.getDate() + (nextDay - currentDay));
          }
        }
        break;

      default:
        return null;
    }

    // Check if within max advance booking
    const maxTime = new Date();
    maxTime.setDate(maxTime.getDate() + 7);

    if (next > maxTime) {
      return null;
    }

    return next;
  }

  /**
   * Get upcoming scheduled rides for notification
   */
  async getUpcomingForNotification(hoursAhead = 1): Promise<ScheduledRide[]> {
    const now = new Date();
    const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    return this.scheduledRideModel.find({
      status: ScheduledRideStatus.PENDING,
      scheduledAt: { $gte: now, $lte: future },
      reminderSent: false,
    });
  }

  /**
   * Send reminders for upcoming rides
   */
  async sendReminders(): Promise<number> {
    const upcoming = await this.getUpcomingForNotification(1);
    let sent = 0;

    for (const ride of upcoming) {
      // In production, send push notification
      this.logger.log(`Sending reminder for scheduled ride ${ride._id}`);

      ride.reminderSent = true;
      ride.notifiedAt = new Date();
      await ride.save();
      sent++;
    }

    return sent;
  }
}
