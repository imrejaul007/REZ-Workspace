import mongoose, { Schema, Document } from 'mongoose';

export type SlotStatus = 'available' | 'booked' | 'reserved' | 'blocked';

export interface IInventorySlot extends Document {
  slotId: string;
  screenId: string;
  date: Date;
  timeSlot: string;
  status: SlotStatus;
  price: number;
  minDuration: number;
  maxDuration: number;
  bookingId?: string;
  advertiserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySlotSchema = new Schema<IInventorySlot>(
  {
    slotId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    screenId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    timeSlot: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^\d{2}-\d{2}$/.test(v),
        message: 'timeSlot must be in format HH-HH (e.g., 00-01, 13-14)',
      },
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'reserved', 'blocked'],
      default: 'available',
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    minDuration: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    maxDuration: {
      type: Number,
      required: true,
      min: 1,
      default: 24,
    },
    bookingId: {
      type: String,
      index: true,
    },
    advertiserId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
InventorySlotSchema.index({ screenId: 1, date: 1 });
InventorySlotSchema.index({ screenId: 1, date: 1, status: 1 });
InventorySlotSchema.index({ status: 1, date: 1 });

export const InventorySlot = mongoose.model<IInventorySlot>(
  'InventorySlot',
  InventorySlotSchema
);

export default InventorySlot;