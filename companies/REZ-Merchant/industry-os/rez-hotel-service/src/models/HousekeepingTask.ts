/**
 * HousekeepingTask Model
 *
 * Represents a housekeeping task for hotel rooms
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IHousekeepingTask } from '../types';

export interface IHousekeepingTaskDocument extends IHousekeepingTask, Document {}

const HousekeepingTaskSchema = new Schema<IHousekeepingTaskDocument>({
  taskId: { type: String, required: true, unique: true, index: true },
  hotelId: { type: String, required: true, index: true },
  roomId: { type: String, required: true, index: true },
  roomNumber: { type: String, required: true },
  taskType: {
    type: String,
    enum: ['cleaning', 'deep_clean', 'turndown', 'inspection', 'maintenance'],
    required: true,
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  assignedTo: { type: String },
  dueBy: { type: Date, required: true, index: true },
  completedAt: { type: Date },
  notes: { type: String },
}, {
  timestamps: true,
  collection: 'hotel_housekeeping_tasks',
});

// Compound indexes
HousekeepingTaskSchema.index({ hotelId: 1, status: 1, dueBy: 1 });
HousekeepingTaskSchema.index({ hotelId: 1, assignedTo: 1, status: 1 });
HousekeepingTaskSchema.index({ roomId: 1, status: 1 });

export const HousekeepingTask = mongoose.model<IHousekeepingTaskDocument>('HousekeepingTask', HousekeepingTaskSchema);
