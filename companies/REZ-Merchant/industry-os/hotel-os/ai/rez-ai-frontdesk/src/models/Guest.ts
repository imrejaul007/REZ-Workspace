/**
 * Guest Model for AI Front Desk Service
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IGuest extends Document {
  name: string;
  phone: string;
  email?: string;
  checkIn: Date;
  checkOut: Date;
  roomNumber: string;
  preferences: string[];
  requests: string[];
  createdAt: Date;
  updatedAt: Date;
}

const GuestSchema = new Schema<IGuest>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    roomNumber: { type: String, required: true, trim: true },
    preferences: { type: [String], default: [] },
    requests: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

// Indexes
GuestSchema.index({ roomNumber: 1 });
GuestSchema.index({ checkIn: 1, checkOut: 1 });
GuestSchema.index({ phone: 1 });
GuestSchema.index({ name: 'text' });

export const Guest = mongoose.models.Guest || mongoose.model<IGuest>('Guest', GuestSchema);

export default Guest;