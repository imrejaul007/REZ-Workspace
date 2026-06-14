/**
 * Cancellation Policy Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICancellationPolicy extends Document {
  storeId: Types.ObjectId;
  serviceType: 'appointment' | 'membership' | 'package';
  rules: {
    hoursBefore: number;
    chargePercent: number;
    refundPercent: number;
  }[];
  noShowPolicy: {
    allowedNoShows: number;
    afterWhichAction: 'warn' | 'charge' | 'block';
    chargePercent: number;
  };
  isActive: boolean;
}

const CancellationPolicySchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  serviceType: {
    type: String,
    enum: ['appointment', 'membership', 'package'],
    required: true
  },
  rules: [{
    hoursBefore: Number,
    chargePercent: Number,
    refundPercent: Number
  }],
  noShowPolicy: {
    allowedNoShows: { type: Number, default: 1 },
    afterWhichAction: {
      type: String,
      enum: ['warn', 'charge', 'block'],
      default: 'warn'
    },
    chargePercent: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

CancellationPolicySchema.index({ storeId: 1, serviceType: 1 });

export const CancellationPolicy = mongoose.model<ICancellationPolicy>('CancellationPolicy', CancellationPolicySchema);
