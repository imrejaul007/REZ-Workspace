import mongoose, { Document, Schema } from 'mongoose';

export enum CustomerTier {
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
}

export interface ICheckIn extends Document {
  checkInId: string;
  salonId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  timestamp: Date;
  pointsEarned: number;
  tier: CustomerTier;
  isBirthdayBonus: boolean;
  referredBy?: string;
  waitTimeMinutes?: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    checkInId: { type: String, required: true, unique: true, index: true },
    salonId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    pointsEarned: { type: Number, default: 0 },
    tier: { type: String, enum: Object.values(CustomerTier), default: CustomerTier.SILVER },
    isBirthdayBonus: { type: Boolean, default: false },
    referredBy: { type: String },
    waitTimeMinutes: { type: Number },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  },
  { timestamps: true }
);

// Compound index for customer check-in history lookup
CheckInSchema.index({ customerId: 1, timestamp: -1 });
// Index for salon daily check-ins
CheckInSchema.index({ salonId: 1, timestamp: -1 });

export const CheckIn = mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
