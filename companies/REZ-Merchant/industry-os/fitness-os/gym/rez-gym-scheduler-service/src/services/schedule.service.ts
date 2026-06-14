import { Schedule } from '../models/Schedule';

export async function getWeeklySchedule(gymId: string, startDate: string): Promise<Schedule[]> {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  return Schedule.find({
    gymId,
    date: { $gte: startDate, $lt: endDate.toISOString().split('T')[0] },
    isActive: true,
  }).sort({ date: 1, startTime: 1 });
}

export async function getAvailableSlots(scheduleId: string): Promise<number> {
  const schedule = await Schedule.findOne({ scheduleId });
  if (!schedule) return 0;
  return Math.max(0, schedule.maxCapacity - schedule.currentBookings);
}

export async function bookSlot(scheduleId: string): Promise<Schedule | null> {
  return Schedule.findOneAndUpdate(
    { scheduleId, isActive: true, isCancelled: false, currentBookings: { $lt: '$maxCapacity' } },
    { $inc: { currentBookings: 1 } },
    { new: true }
  );
}

export async function cancelBooking(scheduleId: string): Promise<Schedule | null> {
  return Schedule.findOneAndUpdate(
    { scheduleId, currentBookings: { $gt: 0 } },
    { $inc: { currentBookings: -1 } },
    { new: true }
  );
}
