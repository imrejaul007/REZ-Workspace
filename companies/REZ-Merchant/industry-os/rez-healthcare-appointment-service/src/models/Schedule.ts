import mongoose, { Schema, Document } from 'mongoose';
import { Schedule as ISchedule } from '../types';

export interface ScheduleDocument extends Omit<ISchedule, '_id'>, Document {}

const ScheduleSchema = new Schema<ScheduleDocument>(
  {
    doctorId: { type: String, required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDuration: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; } } }
);

ScheduleSchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

export const ScheduleModel = mongoose.model<ScheduleDocument>('Schedule', ScheduleSchema);
