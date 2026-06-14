import { z } from 'zod';

export const ScheduleSchema = z.object({
  scheduleId: z.string(),
  gymId: z.string(),
  classId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  trainerId: z.string(),
  room: z.string().optional(),
  maxCapacity: z.number(),
  currentBookings: z.number().default(0),
  isCancelled: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type ISchedule = z.infer<typeof ScheduleSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
