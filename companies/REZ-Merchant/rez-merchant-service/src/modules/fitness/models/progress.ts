/**
 * Fitness Progress Tracking Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFitnessProgress extends Document {
  memberId: Types.ObjectId;
  storeId: Types.ObjectId;
  date: Date;
  type: 'measurement' | 'goal' | 'workout';
  weight?: number;
  bodyFat?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  goalTitle?: string;
  targetValue?: number;
  currentValue?: number;
  targetDate?: Date;
  goalStatus?: 'in_progress' | 'achieved' | 'abandoned';
  notes?: string;
  createdAt: Date;
}

const FitnessProgressSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ['measurement', 'goal', 'workout'],
    required: true
  },
  weight: Number,
  bodyFat: Number,
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    arms: Number,
    thighs: Number
  },
  goalTitle: String,
  targetValue: Number,
  currentValue: Number,
  targetDate: Date,
  goalStatus: {
    type: String,
    enum: ['in_progress', 'achieved', 'abandoned']
  },
  notes: String
}, { timestamps: true });

FitnessProgressSchema.index({ memberId: 1, date: -1 });

export const FitnessProgress = mongoose.model<IFitnessProgress>('FitnessProgress', FitnessProgressSchema);
