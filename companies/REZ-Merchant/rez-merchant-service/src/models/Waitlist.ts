import mongoose, { Schema, Types } from 'mongoose';

export interface IWaitlistEntry {
  storeId: Types.ObjectId;
  customerId?: string;
  customerName: string;
  phone: string;
  partySize: number;
  quotedTime?: Date;
  actualTime?: Date;
  status: 'waiting' | 'seated' | 'cancelled' | 'no_show';
  position: number;
  notes?: string;
  createdAt: Date;
}

const waitlistSchema = new Schema<IWaitlistEntry>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    customerId: { type: String },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1 },
    quotedTime: { type: Date },
    actualTime: { type: Date },
    status: {
      type: String,
      enum: ['waiting', 'seated', 'cancelled', 'no_show'],
      default: 'waiting',
    },
    position: { type: Number, required: true },
    notes: { type: String },
  },
  { strict: true, strictQuery: true, timestamps: true },
);

// Indexes for efficient queries
waitlistSchema.index({ storeId: 1, status: 1, position: 1 });
waitlistSchema.index({ storeId: 1, phone: 1 });
waitlistSchema.index({ storeId: 1, createdAt: -1 });

export const Waitlist = mongoose.models.Waitlist || mongoose.model<IWaitlistEntry>('Waitlist', waitlistSchema, 'waitlists');
