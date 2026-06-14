/**
 * Fitness Class Schedule Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFitnessClass extends Document {
  storeId: Types.ObjectId;
  name: string;
  description?: string;
  trainerId?: Types.ObjectId;
  trainerName?: string;
  type: string;
  duration: number;
  maxCapacity: number;
  currentEnrollment: number;
  waitlistEnabled: boolean;
  waitlistLimit: number;
  startTime: string;
  endTime: string;
  days: number[];
  startDate: Date;
  endDate?: Date;
  price: number;
  isActive: boolean;
  createdAt: Date;
}

const FitnessClassSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  name: { type: String, required: true },
  description: String,
  trainerId: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
  trainerName: String,
  type: { type: String, required: true },
  duration: { type: Number, required: true },
  maxCapacity: { type: Number, default: 20 },
  currentEnrollment: { type: Number, default: 0 },
  waitlistEnabled: { type: Boolean, default: false },
  waitlistLimit: { type: Number, default: 5 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  days: [{ type: Number, enum: [0, 1, 2, 3, 4, 5, 6] }],
  startDate: { type: Date, required: true },
  endDate: Date,
  price: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

FitnessClassSchema.index({ storeId: 1, isActive: 1 });

export const FitnessClass = mongoose.model<IFitnessClass>('FitnessClass', FitnessClassSchema);
