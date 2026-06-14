import mongoose, { Schema, Document } from 'mongoose';

export interface IClassSchedule extends Document {
  merchantId: string;
  storeId: string;
  name: string;
  description?: string;
  instructorName?: string;
  duration: number;
  capacity: number;
  price: number;
  startTime: Date;
  endTime: Date;
  recurring: boolean;
  recurringDays?: number[];
  color: string;
  active: boolean;
  bookedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClassScheduleSchema = new Schema<IClassSchedule>(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    instructorName: String,
    duration: { type: Number, default: 60 },
    capacity: { type: Number, default: 10 },
    price: { type: Number, default: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    recurring: { type: Boolean, default: false },
    recurringDays: [Number],
    color: { type: String, default: '#6366F1' },
    active: { type: Boolean, default: true },
    bookedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for store queries
ClassScheduleSchema.index({ merchantId: 1, storeId: 1 });
ClassScheduleSchema.index({ startTime: 1, active: 1 });

export const ClassSchedule = mongoose.model<IClassSchedule>('ClassSchedule', ClassScheduleSchema);
