import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
  name: string;
  reportId: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string[];
  format: 'json' | 'csv' | 'pdf' | 'excel';
  filters?: Record<string, any>;
  organizationId: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    name: { type: String, required: true, index: true },
    reportId: { type: String, required: true, index: true },
    frequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      required: true
    },
    time: { type: String },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    recipients: [{ type: String }],
    format: {
      type: String,
      enum: ['json', 'csv', 'pdf', 'excel'],
      default: 'csv'
    },
    filters: { type: Schema.Types.Mixed },
    organizationId: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true },
    lastRun: { type: Date },
    nextRun: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending'
    },
    error: { type: String }
  },
  { timestamps: true }
);

ScheduleSchema.index({ organizationId: 1, isActive: 1 });
ScheduleSchema.index({ nextRun: 1, isActive: 1 });

export const Schedule = mongoose.model<ISchedule>('Schedule', ScheduleSchema);