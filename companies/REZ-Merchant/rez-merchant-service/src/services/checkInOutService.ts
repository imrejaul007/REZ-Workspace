import mongoose, { Types } from 'mongoose';
import { CheckInOut, ICheckInOut } from '../models/CheckInOut';
import { logger } from '../config/logger';

/**
 * CheckInOutService - Handles hotel check-in and check-out operations.
 * Provides scheduling, manual and automated check-in/check-out, and reminder functionality.
 */
export class CheckInOutService {
  /**
   * Schedule a check-in/check-out for a booking
   */
  async scheduleCheckIn(
    bookingId: string,
    checkInDate: Date,
    checkOutDate: Date,
  ): Promise<ICheckInOut> {
    // Check if already exists
    const existing = await CheckInOut.findOne({ bookingId: new Types.ObjectId(bookingId) });
    if (existing) {
      throw new Error('Check-in/out already scheduled for this booking');
    }

    const record = new CheckInOut({
      bookingId: new Types.ObjectId(bookingId),
      checkIn: {
        scheduled: checkInDate,
        status: 'pending',
      },
      checkOut: {
        scheduled: checkOutDate,
        status: 'pending',
      },
      status: 'upcoming',
    });

    await record.save();

    logger.info('[CheckInOut] Check-in/out scheduled', {
      recordId: record._id,
      bookingId,
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
    });

    return record;
  }

  /**
   * Perform manual check-in
   */
  async checkIn(bookingId: string, staffId: string): Promise<ICheckInOut> {
    const record = await CheckInOut.findOne({ bookingId: new Types.ObjectId(bookingId) });
    if (!record) {
      throw new Error('Check-in/out record not found');
    }

    if (record.status === 'checked_in') {
      throw new Error('Guest already checked in');
    }

    if (record.status === 'checked_out') {
      throw new Error('Guest already checked out');
    }

    const now = new Date();
    const scheduledTime = record.checkIn.scheduled;
    const timeDiff = now.getTime() - scheduledTime.getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;

    // Determine status based on timing
    let checkInStatus: 'completed' | 'early' | 'late';
    if (timeDiff < -thirtyMinutesMs) {
      checkInStatus = 'early';
    } else if (timeDiff > thirtyMinutesMs) {
      checkInStatus = 'late';
    } else {
      checkInStatus = 'completed';
    }

    record.checkIn = {
      ...record.checkIn,
      actual: now,
      status: checkInStatus,
      staffId: new Types.ObjectId(staffId),
    };
    record.status = 'checked_in';

    await record.save();

    logger.info('[CheckInOut] Guest checked in', {
      recordId: record._id,
      bookingId,
      staffId,
      status: checkInStatus,
      actualTime: now.toISOString(),
    });

    return record;
  }

  /**
   * Perform manual check-out
   */
  async checkOut(bookingId: string, staffId: string): Promise<ICheckInOut> {
    const record = await CheckInOut.findOne({ bookingId: new Types.ObjectId(bookingId) });
    if (!record) {
      throw new Error('Check-in/out record not found');
    }

    if (record.status !== 'checked_in') {
      throw new Error('Guest must be checked in before checking out');
    }

    if (record.checkOut.status !== 'pending') {
      throw new Error('Guest already checked out');
    }

    const now = new Date();
    const scheduledTime = record.checkOut.scheduled;
    const timeDiff = now.getTime() - scheduledTime.getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;

    // Determine status based on timing
    let checkOutStatus: 'completed' | 'early' | 'late';
    if (timeDiff < -thirtyMinutesMs) {
      checkOutStatus = 'early';
    } else if (timeDiff > thirtyMinutesMs) {
      checkOutStatus = 'late';
    } else {
      checkOutStatus = 'completed';
    }

    record.checkOut = {
      ...record.checkOut,
      actual: now,
      status: checkOutStatus,
      staffId: new Types.ObjectId(staffId),
    };
    record.status = 'checked_out';

    await record.save();

    logger.info('[CheckInOut] Guest checked out', {
      recordId: record._id,
      bookingId,
      staffId,
      status: checkOutStatus,
      actualTime: now.toISOString(),
    });

    return record;
  }

  /**
   * Get upcoming check-ins for a store on a specific date
   */
  async getUpcomingCheckIns(storeId: string, date: Date): Promise<ICheckInOut[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await CheckInOut.find({
      storeId: new Types.ObjectId(storeId),
      'checkIn.scheduled': { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['upcoming', 'checked_in'] },
    })
      .sort({ 'checkIn.scheduled': 1 })
      .lean();

    logger.info('[CheckInOut] Fetched upcoming check-ins', {
      storeId,
      date: date.toISOString(),
      count: records.length,
    });

    return records;
  }

  /**
   * Get today's check-outs for a store
   */
  async getTodayCheckOuts(storeId: string): Promise<ICheckInOut[]> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await CheckInOut.find({
      storeId: new Types.ObjectId(storeId),
      'checkOut.scheduled': { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['upcoming', 'checked_in'] },
    })
      .sort({ 'checkOut.scheduled': 1 })
      .lean();

    logger.info('[CheckInOut] Fetched today\'s check-outs', {
      storeId,
      count: records.length,
    });

    return records;
  }

  /**
   * Send a reminder for check-in or check-out
   */
  async sendReminder(bookingId: string, type: 'checkin' | 'checkout'): Promise<void> {
    const record = await CheckInOut.findOne({ bookingId: new Types.ObjectId(bookingId) });
    if (!record) {
      throw new Error('Check-in/out record not found');
    }

    const scheduledTime = type === 'checkin' ? record.checkIn.scheduled : record.checkOut.scheduled;
    const currentStatus = type === 'checkin' ? record.checkIn.status : record.checkOut.status;

    if (currentStatus !== 'pending') {
      logger.info(`[CheckInOut] Skipping ${type} reminder - already ${currentStatus}`, {
        recordId: record._id,
        bookingId,
        type,
      });
      return;
    }

    // In production, this would integrate with notification service (SMS/Email/Push)
    logger.info('[CheckInOut] Sending reminder', {
      recordId: record._id,
      bookingId,
      type,
      guestName: record.guestName,
      guestPhone: record.guestPhone,
      scheduledTime: scheduledTime.toISOString(),
      message: `Reminder: Your ${type === 'checkin' ? 'check-in' : 'check-out'} is scheduled for ${scheduledTime.toLocaleString()}`,
    });
  }

  /**
   * Auto check-in a guest when they arrive (e.g., via kiosk or app)
   */
  async autoCheckIn(bookingId: string): Promise<ICheckInOut> {
    const record = await CheckInOut.findOne({ bookingId: new Types.ObjectId(bookingId) });
    if (!record) {
      throw new Error('Check-in/out record not found');
    }

    if (record.status !== 'upcoming') {
      throw new Error(`Cannot auto check-in: guest is ${record.status}`);
    }

    const now = new Date();
    const scheduledTime = record.checkIn.scheduled;
    const timeDiff = now.getTime() - scheduledTime.getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;

    let checkInStatus: 'completed' | 'early' | 'late';
    if (timeDiff < -thirtyMinutesMs) {
      checkInStatus = 'early';
    } else if (timeDiff > thirtyMinutesMs) {
      checkInStatus = 'late';
    } else {
      checkInStatus = 'completed';
    }

    record.checkIn = {
      ...record.checkIn,
      actual: now,
      status: checkInStatus,
    };
    record.status = 'checked_in';

    await record.save();

    logger.info('[CheckInOut] Auto check-in completed', {
      recordId: record._id,
      bookingId,
      status: checkInStatus,
    });

    return record;
  }

  /**
   * Auto check-out a guest (e.g., via app or scheduled job)
   */
  async autoCheckOut(bookingId: string): Promise<ICheckInOut> {
    const record = await CheckInOut.findOne({ bookingId: new Types.ObjectId(bookingId) });
    if (!record) {
      throw new Error('Check-in/out record not found');
    }

    if (record.status !== 'checked_in') {
      throw new Error(`Cannot auto check-out: guest is ${record.status}`);
    }

    const now = new Date();
    const scheduledTime = record.checkOut.scheduled;
    const timeDiff = now.getTime() - scheduledTime.getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;

    let checkOutStatus: 'completed' | 'early' | 'late';
    if (timeDiff < -thirtyMinutesMs) {
      checkOutStatus = 'early';
    } else if (timeDiff > thirtyMinutesMs) {
      checkOutStatus = 'late';
    } else {
      checkOutStatus = 'completed';
    }

    record.checkOut = {
      ...record.checkOut,
      actual: now,
      status: checkOutStatus,
    };
    record.status = 'checked_out';

    await record.save();

    logger.info('[CheckInOut] Auto check-out completed', {
      recordId: record._id,
      bookingId,
      status: checkOutStatus,
    });

    return record;
  }
}

// Factory function for dependency injection
export function createCheckInOutService(): CheckInOutService {
  return new CheckInOutService();
}
