/**
 * Fitness Trainer Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFitnessTrainer extends Document {
  staffId: Types.ObjectId;
  storeId: Types.ObjectId;
  displayName: string;
  bio?: string;
  profilePhoto?: string;
  specializations: string[];
  phone: string;
  email?: string;
  hourlyRate?: number;
  isActive: boolean;
  totalClasses: number;
  totalMembers: number;
  avgRating: number;
  createdAt: Date;
}

const FitnessTrainerSchema = new Schema({
  staffId: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  displayName: { type: String, required: true },
  bio: String,
  profilePhoto: String,
  specializations: [String],
  phone: { type: String, required: true },
  email: String,
  hourlyRate: Number,
  isActive: { type: Boolean, default: true },
  totalClasses: { type: Number, default: 0 },
  totalMembers: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 }
}, { timestamps: true });

export const FitnessTrainer = mongoose.model<IFitnessTrainer>('FitnessTrainer', FitnessTrainerSchema);
