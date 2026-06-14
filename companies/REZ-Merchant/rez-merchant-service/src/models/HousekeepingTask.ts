import mongoose, { Schema, Document, Types } from 'mongoose';
import { logger } from '../config/logger';

// Canonical enum values for task types
export const HOUSEKEEPING_TASK_TYPES = ['cleaning', 'maintenance', 'inspection'] as const;
export type HousekeepingTaskType = typeof HOUSEKEEPING_TASK_TYPES[number];

// Canonical enum values for priorities
export const HOUSEKEEPING_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type HousekeepingPriority = typeof HOUSEKEEPING_PRIORITIES[number];

// Canonical enum values for statuses
export const HOUSEKEEPING_STATUSES = ['pending', 'in_progress', 'completed', 'verified'] as const;
export type HousekeepingStatus = typeof HOUSEKEEPING_STATUSES[number];

export interface IHousekeepingTask extends Document {
  storeId: Types.ObjectId;
  roomId: string;
  roomNumber: string;
  taskType: HousekeepingTaskType;
  priority: HousekeepingPriority;
  status: HousekeepingStatus;
  assignedTo?: Types.ObjectId;
  assignedToName?: string;
  notes?: string;
  completedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HousekeepingTaskSchema = new Schema<IHousekeepingTask>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    roomId: { type: String, required: true, index: true },
    roomNumber: { type: String, required: true },
    taskType: {
      type: String,
      enum: HOUSEKEEPING_TASK_TYPES,
      required: true,
      default: 'cleaning',
    },
    priority: {
      type: String,
      enum: HOUSEKEEPING_PRIORITIES,
      required: true,
      default: 'medium',
    },
    status: {
      type: String,
      enum: HOUSEKEEPING_STATUSES,
      required: true,
      default: 'pending',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedToName: { type: String },
    notes: { type: String },
    completedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, strict: true, strictQuery: true },
);

// Compound indexes for common queries
HousekeepingTaskSchema.index({ storeId: 1, status: 1, createdAt: -1 });
HousekeepingTaskSchema.index({ roomId: 1, createdAt: -1 });
HousekeepingTaskSchema.index({ assignedTo: 1, status: 1 });
HousekeepingTaskSchema.index({ storeId: 1, assignedTo: 1, createdAt: -1 });
HousekeepingTaskSchema.index({ storeId: 1, priority: 1, status: 1 });

export const HousekeepingTask = mongoose.model<IHousekeepingTask>('HousekeepingTask', HousekeepingTaskSchema);
