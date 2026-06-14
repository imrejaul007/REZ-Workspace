import mongoose, { Document, Schema } from 'mongoose';

export enum RedemptionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum RedemptionType {
  FULL = 'full',
  PARTIAL = 'partial',
  PREPAID = 'prepaid',
  VISIT = 'visit',
}

export interface IRedemption extends Document {
  redemptionId: string;
  membershipId?: string;
  packageId: string;
  userId: string;
  salonId: string;
  branchId?: string;
  type: RedemptionType;
  status: RedemptionStatus;
  services: string[];
  totalValue: number;
  discount: number;
  amountPaid: number;
  prepaidDeduction?: number;
  remainingBalance?: number;
  appointmentId?: string;
  stylistId?: string;
  notes?: string;
  redeemedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RedemptionSchema = new Schema<IRedemption>(
  {
    redemptionId: { type: String, required: true, unique: true, index: true },
    membershipId: { type: String, index: true },
    packageId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    salonId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    type: { type: String, enum: Object.values(RedemptionType), required: true },
    status: { type: String, enum: Object.values(RedemptionStatus), default: RedemptionStatus.PENDING, index: true },
    services: { type: [String], required: true },
    totalValue: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    amountPaid: { type: Number, required: true, min: 0 },
    prepaidDeduction: { type: Number, min: 0 },
    remainingBalance: { type: Number, min: 0 },
    appointmentId: { type: String, index: true },
    stylistId: { type: String },
    notes: { type: String },
    redeemedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

// Indexes
RedemptionSchema.index({ userId: 1, redeemedAt: -1 });
RedemptionSchema.index({ packageId: 1, status: 1 });
RedemptionSchema.index({ membershipId: 1, status: 1 });
RedemptionSchema.index({ redeemedAt: -1 });
RedemptionSchema.index({ salonId: 1, redeemedAt: -1 });

export const Redemption = mongoose.model<IRedemption>('Redemption', RedemptionSchema);
