import mongoose, { Schema, Document } from 'mongoose';

export interface IRatePlan extends Document {
  ratePlanId: string;
  roomId: string;
  hotelId: string;
  name: string;
  rate: number;
  currency: string;
  inclusions: string[];
  cancellationPolicy: string;
  isRefundable: boolean;
  minStay?: number;
  maxStay?: number;
  createdAt: Date;
  updatedAt: Date;
}

const RatePlanSchema = new Schema<IRatePlan>(
  {
    ratePlanId: { type: String, required: true, unique: true, index: true },
    roomId: { type: String, required: true, index: true },
    hotelId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    rate: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    inclusions: [String],
    cancellationPolicy: { type: String },
    isRefundable: { type: Boolean, default: true },
    minStay: Number,
    maxStay: Number,
  },
  { timestamps: true }
);

RatePlanSchema.index({ roomId: 1, rate: 1 });

export const RatePlan = mongoose.model<IRatePlan>('RatePlan', RatePlanSchema);
