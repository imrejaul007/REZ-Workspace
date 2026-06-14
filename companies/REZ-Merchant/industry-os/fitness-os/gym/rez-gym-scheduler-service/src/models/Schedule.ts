import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
  scheduleId: string;
  gymId: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  trainerId: string;
  room?: string;
  maxCapacity: number;
  currentBookings: number;
  isCancelled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>({
  scheduleId: { type: String, required: true, unique: true, index: true },
  gymId: { type: String, required: true, index: true },
  classId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  trainerId: { type: String, required: true, index: true },
  room: String,
  maxCapacity: { type: Number, required: true },
  currentBookings: { type: Number, default: 0 },
  isCancelled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ScheduleSchema.index({ gymId: 1, date: 1, isActive: 1 });
ScheduleSchema.index({ trainerId: 1, date: 1 });

export const Schedule = mongoose.model<ISchedule>('Schedule', ScheduleSchema);
