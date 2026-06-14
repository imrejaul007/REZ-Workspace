import mongoose, { Document, Schema } from 'mongoose';
import { ISchedule } from './Course';

export enum BatchStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentPlan {
  FULL = 'FULL',
  EMI = 'EMI',
  FREE = 'FREE'
}

export interface IBatch extends Document {
  batchId: string;
  courseId: string;
  merchantId: string;
  name: string;
  instructorId?: string;
  startDate: Date;
  endDate: Date;
  schedule: ISchedule[];
  maxStudents: number;
  enrolledStudents: number;
  status: BatchStatus;
  fees: number;
  paymentPlan: PaymentPlan;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>({
  batchId: { type: String, required: true, unique: true, index: true },
  courseId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  instructorId: { type: String, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  schedule: [{
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  }],
  maxStudents: { type: Number, default: 30 },
  enrolledStudents: { type: Number, default: 0 },
  status: { type: String, enum: BatchStatus, default: BatchStatus.UPCOMING, index: true },
  fees: { type: Number, required: true },
  paymentPlan: { type: String, enum: PaymentPlan, default: PaymentPlan.FULL }
}, {
  timestamps: true,
  collection: 'batches'
});

// Compound indexes for common queries
BatchSchema.index({ merchantId: 1, status: 1 });
BatchSchema.index({ courseId: 1, status: 1 });
BatchSchema.index({ merchantId: 1, courseId: 1 });
BatchSchema.index({ startDate: 1, endDate: 1 });

// Virtual for available seats
BatchSchema.virtual('availableSeats').get(function() {
  return this.maxStudents - this.enrolledStudents;
});

// Virtual for is full
BatchSchema.virtual('isFull').get(function() {
  return this.enrolledStudents >= this.maxStudents;
});

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
