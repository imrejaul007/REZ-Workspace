/**
 * Fitness Membership Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFitnessMembership extends Document {
  memberId: Types.ObjectId;
  storeId: Types.ObjectId;
  planId: Types.ObjectId;
  planName: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'paused' | 'expired' | 'cancelled';
  classesRemaining?: number;
  classesPerMonth?: number;
  freezeUntil?: Date;
  createdAt: Date;
}

const FitnessMembershipSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  planId: { type: Schema.Types.ObjectId, required: true },
  planName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'paused', 'expired', 'cancelled'],
    default: 'active'
  },
  classesRemaining: Number,
  classesPerMonth: Number,
  freezeUntil: Date
}, { timestamps: true });

FitnessMembershipSchema.index({ memberId: 1, status: 1 });

export const FitnessMembership = mongoose.model<IFitnessMembership>('FitnessMembership', FitnessMembershipSchema);
