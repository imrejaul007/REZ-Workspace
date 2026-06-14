/**
 * Attendance Service
 */

import { Attendance } from '../models/Attendance';
import { QRSession } from '../models/QRSession';

export interface AttendanceStats {
  totalCheckIns: number;
  uniqueMembers: number;
  averageDuration: number;
  peakHour: number;
}

export async function getDailyAttendance(gymId: string, date: string): Promise<Attendance[]> {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  return Attendance.find({
    gymId,
    checkInTime: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ checkInTime: 1 });
}

export async function getAttendanceStats(gymId: string, date: string): Promise<AttendanceStats> {
  const attendance = await getDailyAttendance(gymId, date);

  const uniqueMembers = new Set(attendance.map(a => a.userId)).size;

  let totalDuration = 0;
  let completedCount = 0;

  for (const a of attendance) {
    if (a.checkOutTime) {
      const duration = new Date(a.checkOutTime).getTime() - new Date(a.checkInTime).getTime();
      totalDuration += duration;
      completedCount++;
    }
  }

  const averageDuration = completedCount > 0 ? totalDuration / completedCount / 60000 : 0;

  // Calculate peak hour
  const hourCounts: Record<number, number> = {};
  for (const a of attendance) {
    const hour = new Date(a.checkInTime).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }

  let peakHour = 0;
  let maxCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour);
    }
  }

  return {
    totalCheckIns: attendance.length,
    uniqueMembers,
    averageDuration,
    peakHour,
  };
}

export async function isUserCheckedIn(userId: string, gymId: string): Promise<boolean> {
  const attendance = await Attendance.findOne({
    userId,
    gymId,
    isActive: true,
  });
  return !!attendance;
}

export async function createCheckIn(data: {
  userId: string;
  gymId: string;
  membershipId: string;
  sessionType?: string;
}): Promise<Attendance> {
  const attendanceId = `ATT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const attendance = new Attendance({
    attendanceId,
    ...data,
    checkInTime: new Date().toISOString(),
    source: 'qr',
    isActive: true,
  });

  await attendance.save();
  return attendance;
}

export async function createCheckOut(userId: string, gymId: string): Promise<Attendance | null> {
  return Attendance.findOneAndUpdate(
    { userId, gymId, isActive: true },
    {
      $set: {
        checkOutTime: new Date().toISOString(),
        isActive: false,
      },
    },
    { new: true }
  );
}
