/**
 * HousekeepingStaff Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IHousekeepingStaff } from '../types';

export interface IHousekeepingStaffDocument extends IHousekeepingStaff, Document {}

const HousekeepingStaffSchema = new Schema<IHousekeepingStaffDocument>({
  staffId: { type: String, required: true, unique: true, index: true },
  hotelId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  role: {
    type: String,
    enum: ['housekeeper', 'supervisor', 'manager'],
    required: true,
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'night'],
    required: true,
  },
  assignedRooms: [{ type: String }],
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  collection: 'hotel_housekeeping_staff',
});

// Indexes
HousekeepingStaffSchema.index({ hotelId: 1, isActive: 1 });
HousekeepingStaffSchema.index({ hotelId: 1, shift: 1 });
HousekeepingStaffSchema.index({ phone: 1 });
HousekeepingStaffSchema.index({ email: 1 });

export const HousekeepingStaff = mongoose.model<IHousekeepingStaffDocument>('HousekeepingStaff', HousekeepingStaffSchema);
