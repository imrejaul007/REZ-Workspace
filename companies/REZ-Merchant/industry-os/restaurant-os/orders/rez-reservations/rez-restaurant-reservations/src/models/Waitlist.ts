import mongoose, { Document, Schema } from 'mongoose';

export interface IWaitlist extends Document {
  waitlistId: string;
  merchantId: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  quotedWaitTime: number; // in minutes
  status: 'waiting' | 'notified' | 'seated' | 'left' | 'cancelled';
  position: number;
  notifiedAt?: Date;
  seatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const waitlistSchema = new Schema<IWaitlist>({
  waitlistId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  partySize: { type: Number, required: true },
  quotedWaitTime: { type: Number, required: true },
  status: {
    type: String,
    enum: ['waiting', 'notified', 'seated', 'left', 'cancelled'],
    default: 'waiting',
  },
  position: { type: Number, required: true },
  notifiedAt: Date,
  seatedAt: Date,
}, { timestamps: true });

waitlistSchema.index({ restaurantId: 1, status: 1, position: 1 });

export const Waitlist = mongoose.model<IWaitlist>('Waitlist', waitlistSchema);
