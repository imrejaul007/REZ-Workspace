import mongoose, { Document, Schema } from 'mongoose';

export interface ITrainer extends Document {
  trainerId: string;
  gymId: string;
  name: string;
  email?: string;
  phone: string;
  specialization: string[];
  certifications: string[];
  bio?: string;
  experience: number;
  rating: number;
  totalClasses: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrainerSchema = new Schema<ITrainer>({
  trainerId: { type: String, required: true, unique: true, index: true },
  gymId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: String,
  phone: { type: String, required: true },
  specialization: [String],
  certifications: [String],
  bio: String,
  experience: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalClasses: { type: Number, default: 0 },
  imageUrl: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

TrainerSchema.index({ gymId: 1, isActive: 1 });

export const Trainer = mongoose.model<ITrainer>('Trainer', TrainerSchema);
