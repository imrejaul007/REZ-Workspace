/**
 * Attendance Service - Fitness OS
 * Handles member check-in/check-out and attendance tracking
 */

import mongoose, { Types } from 'mongoose';
import { AttendanceRecord, IAttendanceRecord } from '../models/AttendanceRecord';
import { logger } from '../config/logger';

// Attendance statistics interface
export interface AttendanceStats {
  totalCheckIns: number;
  totalCheckOuts: number;
  totalNoShows: number;
  activeMembers: number;
  averageDuration: number; // in minutes
  peakHours: Array<{ hour: number; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
}

/**
 * Service for managing gym/fitness attendance records
 */
export class AttendanceService {
  /**
   * Check in a member
   */
  async checkIn(
    memberId: string,
    storeId: string,
    source: string = 'manual'
  ): Promise<IAttendanceRecord> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingRecord = await AttendanceRecord.findOne({
      memberId: new Types.ObjectId(memberId),
      storeId: new Types.ObjectId(storeId),
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      status: { $ne: 'no_show' },
    });

    if (existingRecord) {
      if (existingRecord.status === 'checked_out') {
        throw new Error('Member has already checked out for today');
      }
      throw new Error('Member is already checked in');
    }

    const attendance = new AttendanceRecord({
      memberId: new Types.ObjectId(memberId),
      memberName: '', // Will be populated if needed from member lookup
      storeId: new Types.ObjectId(storeId),
      date: today,
      checkIn: new Date(),
      status: 'checked_in',
      source: source as 'manual' | 'qr' | 'auto',
    });

    await attendance.save();
    logger.info(`Member ${memberId} checked in at store ${storeId}`);

    return attendance;
  }

  /**
   * Check out a member
   */
  async checkOut(memberId: string, storeId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await AttendanceRecord.findOneAndUpdate(
      {
        memberId: new Types.ObjectId(memberId),
        storeId: new Types.ObjectId(storeId),
        date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        status: 'checked_in',
      },
      {
        $set: {
          checkOut: new Date(),
          status: 'checked_out',
        },
      },
      { new: true }
    );

    if (!attendance) {
      throw new Error('No active check-in found for this member');
    }

    logger.info(`Member ${memberId} checked out at store ${storeId}`);
  }

  /**
   * Get attendance records for a store on a specific date
   */
  async getAttendance(storeId: string, date: Date): Promise<IAttendanceRecord[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return AttendanceRecord.find({
      storeId: new Types.ObjectId(storeId),
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ checkIn: 1 })
      .lean();
  }

  /**
   * Get attendance history for a member within a date range
   */
  async getMemberAttendance(
    memberId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IAttendanceRecord[]> {
    return AttendanceRecord.find({
      memberId: new Types.ObjectId(memberId),
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: -1 })
      .lean();
  }

  /**
   * Get attendance for a specific class
   */
  async getClassAttendance(classId: string, date: Date): Promise<IAttendanceRecord[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return AttendanceRecord.find({
      classId: new Types.ObjectId(classId),
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ checkIn: 1 })
      .lean();
  }

  /**
   * Get attendance statistics for a store in a specific month
   */
  async getAttendanceStats(
    storeId: string,
    month: number,
    year: number
  ): Promise<AttendanceStats> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await AttendanceRecord.find({
      storeId: new Types.ObjectId(storeId),
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    // Calculate statistics
    const totalCheckIns = records.filter((r) => r.status === 'checked_in' || r.status === 'checked_out').length;
    const totalCheckOuts = records.filter((r) => r.status === 'checked_out').length;
    const totalNoShows = records.filter((r) => r.status === 'no_show').length;

    // Count unique active members
    const uniqueMembers = new Set(records.map((r) => r.memberId.toString()));
    const activeMembers = uniqueMembers.size;

    // Calculate average duration
    const durations = records
      .filter((r) => r.checkIn && r.checkOut)
      .map((r) => {
        const checkIn = new Date(r.checkIn!).getTime();
        const checkOut = new Date(r.checkOut!).getTime();
        return (checkOut - checkIn) / (1000 * 60); // duration in minutes
      });

    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    // Calculate peak hours
    const hourCounts: Record<number, number> = {};
    records.forEach((r) => {
      if (r.checkIn) {
        const hour = new Date(r.checkIn).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour, 10), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate daily stats
    const dailyCounts: Record<string, number> = {};
    records.forEach((r) => {
      const dateStr = r.date.toISOString().split('T')[0];
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });

    const dailyStats = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalCheckIns,
      totalCheckOuts,
      totalNoShows,
      activeMembers,
      averageDuration,
      peakHours,
      dailyStats,
    };
  }

  /**
   * Mark a member as no-show
   */
  async markNoShow(attendanceId: string): Promise<void> {
    const attendance = await AttendanceRecord.findByIdAndUpdate(
      attendanceId,
      {
        $set: {
          status: 'no_show',
          checkIn: undefined,
          checkOut: undefined,
        },
      },
      { new: true }
    );

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    logger.info(`Marked attendance ${attendanceId} as no-show`);
  }
}

// Singleton instance
let attendanceServiceInstance: AttendanceService | null = null;

export function createAttendanceService(): AttendanceService {
  if (!attendanceServiceInstance) {
    attendanceServiceInstance = new AttendanceService();
  }
  return attendanceServiceInstance;
}

export const attendanceService = createAttendanceService();
