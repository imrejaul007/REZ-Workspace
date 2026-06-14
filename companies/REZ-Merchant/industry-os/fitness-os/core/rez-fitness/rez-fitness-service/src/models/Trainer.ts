import mongoose, { Document, Schema } from 'mongoose';

export const TrainerSpecialization = {
  YOGA: 'yoga',
  PILATES: 'pilates',
  HIIT: 'hiit',
  SPINNING: 'spinning',
  STRENGTH: 'strength',
  CROSSFIT: 'crossfit',
  ZUMBA: 'zumba',
  BOXING: 'boxing',
  SWIMMING: 'swimming',
  NUTRITION: 'nutrition',
  REHABILITATION: 'rehabilitation',
  PERSONAL_TRAINING: 'personal_training'
} as const;

export type TrainerSpecializationType = typeof TrainerSpecialization[keyof typeof TrainerSpecialization];

export interface ITrainer extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specializations: TrainerSpecializationType[];
  certifications: string[];
  yearsOfExperience: number;
  bio: string;
  avatarUrl?: string;
  hourlyRate: number;
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  rating: number;
  totalReviews: number;
  isActive: boolean;
  hireDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const trainerSchema = new Schema<ITrainer>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  specializations: [{
    type: String,
    enum: ['yoga', 'pilates', 'hiit', 'spinning', 'strength', 'crossfit', 'zumba', 'boxing', 'swimming', 'nutrition', 'rehabilitation', 'personal_training']
  }],
  certifications: [{ type: String }],
  yearsOfExperience: { type: Number, default: 0 },
  bio: { type: String, required: true },
  avatarUrl: { type: String },
  hourlyRate: { type: Number, default: 0 },
  availability: [{
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: { type: String },
    endTime: { type: String }
  }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  hireDate: { type: Date, default: Date.now }
}, { timestamps: true });

trainerSchema.index({ email: 1 });
trainerSchema.index({ specializations: 1 });
trainerSchema.index({ isActive: 1 });

export const Trainer = mongoose.model<ITrainer>('Trainer', trainerSchema);
