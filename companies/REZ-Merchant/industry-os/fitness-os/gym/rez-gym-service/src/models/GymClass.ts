/**
 * Gym Class Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IGymClass extends Document {
  classId: string;
  gymId: string;
  name: string;
  type: 'yoga' | 'pilates' | 'hiit' | 'spinning' | 'zumba' | 'crossfit' | 'boxing' | 'swimming' | 'personal_training' | 'other';
  description?: string;
  trainerId: string;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  };
  price: number;
  room?: string;
  equipment: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GymClassSchema = new Schema<IGymClass>({
  classId: { type: String, required: true, unique: true, index: true },
  gymId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['yoga', 'pilates', 'hiit', 'spinning', 'zumba', 'crossfit', 'boxing', 'swimming', 'personal_training', 'other'],
    required: true,
  },
  description: String,
  trainerId: { type: String, required: true, index: true },
  duration: { type: Number, required: true },
  maxParticipants: { type: Number, required: true, min: 1 },
  currentParticipants: { type: Number, default: 0 },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all_levels'],
    default: 'all_levels',
  },
  schedule: {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  price: { type: Number, default: 0 },
  room: String,
  equipment: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

GymClassSchema.index({ gymId: 1, type: 1, isActive: 1 });
GymClassSchema.index({ trainerId: 1, isActive: 1 });
GymClassSchema.index({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 });

export const GymClass = mongoose.model<IGymClass>('GymClass', GymClassSchema);
