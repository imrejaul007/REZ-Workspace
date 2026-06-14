/**
 * Gym Service - Business logic for gym operations
 */

import { Membership } from '../models/Membership';
import { GymClass } from '../models/GymClass';
import { logger } from '../config/logger';

export interface GymStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  totalClasses: number;
  upcomingClasses: number;
}

/**
 * Get gym statistics
 */
export async function getGymStats(gymId: string): Promise<GymStats> {
  const [totalMembers, activeMembers, expiredMembers, totalClasses] = await Promise.all([
    Membership.countDocuments({ gymId }),
    Membership.countDocuments({ gymId, status: 'active' }),
    Membership.countDocuments({ gymId, status: 'expired' }),
    GymClass.countDocuments({ gymId, isActive: true }),
  ]);

  return {
    totalMembers,
    activeMembers,
    expiredMembers,
    totalClasses,
    upcomingClasses: totalClasses,
  };
}

/**
 * Get available class slots
 */
export async function getAvailableSlots(classId: string): Promise<number> {
  const gymClass = await GymClass.findOne({ classId });

  if (!gymClass) {
    throw new Error('Class not found');
  }

  return gymClass.maxParticipants - gymClass.currentParticipants;
}

/**
 * Book a class slot
 */
export async function bookClassSlot(classId: string): Promise<void> {
  const gymClass = await GymClass.findOneAndUpdate(
    { classId, currentParticipants: { $lt: '$maxParticipants' } },
    { $inc: { currentParticipants: 1 } },
    { new: true }
  );

  if (!gymClass) {
    throw new Error('Class is full or not found');
  }

  logger.info('Class slot booked', { classId });
}

/**
 * Cancel class booking
 */
export async function cancelClassBooking(classId: string): Promise<void> {
  await GymClass.findOneAndUpdate(
    { classId, currentParticipants: { $gt: 0 } },
    { $inc: { currentParticipants: -1 } }
  );

  logger.info('Class booking cancelled', { classId });
}

/**
 * Get membership by user ID
 */
export async function getMembershipByUserId(userId: string, gymId: string): Promise<Membership | null> {
  return Membership.findOne({
    userId,
    gymId,
    status: { $in: ['active', 'frozen'] },
  });
}

/**
 * Check if user can book a class
 */
export async function canUserBookClass(userId: string, gymId: string): Promise<{ canBook: boolean; reason?: string }> {
  const membership = await getMembershipByUserId(userId, gymId);

  if (!membership) {
    return { canBook: false, reason: 'No active membership' };
  }

  if (membership.status === 'expired') {
    return { canBook: false, reason: 'Membership expired' };
  }

  if (membership.status === 'frozen') {
    return { canBook: false, reason: 'Membership is frozen' };
  }

  return { canBook: true };
}

/**
 * Get weekly class schedule
 */
export async function getWeeklySchedule(gymId: string): Promise<Record<number, GymClass[]>> {
  const classes = await GymClass.find({ gymId, isActive: true });

  const schedule: Record<number, GymClass[]> = {};

  for (let i = 0; i < 7; i++) {
    schedule[i] = [];
  }

  for (const gymClass of classes) {
    const day = gymClass.schedule.dayOfWeek;
    schedule[day].push(gymClass);
  }

  // Sort each day's classes by start time
  for (const day in schedule) {
    schedule[parseInt(day)].sort((a, b) =>
      a.schedule.startTime.localeCompare(b.schedule.startTime)
    );
  }

  return schedule;
}
