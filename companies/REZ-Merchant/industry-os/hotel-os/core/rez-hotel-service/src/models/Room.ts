/**
 * Room Model
 *
 * Represents a hotel room with all its properties
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IRoom, RoomType, RoomStatus } from '../types';

export interface IRoomDocument extends IRoom, Document {}

const RoomSchema = new Schema<IRoomDocument>({
  roomId: { type: String, required: true, unique: true, index: true },
  hotelId: { type: String, required: true, index: true },
  roomNumber: { type: String, required: true },
  floor: { type: Number, required: true },
  type: {
    type: String,
    enum: ['standard', 'deluxe', 'suite', 'presidential'],
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'cleaning', 'maintenance', 'blocked'],
    default: 'available',
    index: true,
  },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  amenities: [{ type: String }],
  maxOccupancy: { type: Number, required: true, min: 1 },
  bedConfiguration: { type: String, required: true },
  size: { type: Number, required: true },
  view: { type: String, default: 'city' },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  collection: 'hotel_rooms',
});

// Compound indexes for common queries
RoomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });
RoomSchema.index({ hotelId: 1, type: 1, status: 1 });
RoomSchema.index({ hotelId: 1, floor: 1 });
RoomSchema.index({ price: 1 });
RoomSchema.index({ type: 1, status: 1 });

export const Room = mongoose.model<IRoomDocument>('Room', RoomSchema);
