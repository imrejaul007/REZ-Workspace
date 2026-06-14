import mongoose, { Document, Schema } from 'mongoose';

export interface IGymClass extends Document {
  classId: string;
  gymId: string;
  name: string;
  type: string;
  description?: string;
  trainerId: string;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  level: string;
  schedule: { dayOfWeek: number; startTime: string; endTime: string };
  price: number;
  room?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GymClassSchema = new Schema<IGymClass>({
  classId: { type: String, required: true, unique: true, index: true },
  gymId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: String,
  trainerId: { type: String, required: true, index: true },
  duration: { type: Number, required: true },
  maxParticipants: { type: Number, required: true },
  currentParticipants: { type: Number, default: 0 },
  level: { type: String, default: 'all_levels' },
  schedule: {
    dayOfWeek: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  price: { type: Number, default: 0 },
  room: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

GymClassSchema.index({ gymId: 1, isActive: 1 });

export const GymClass = mongoose.model<IGymClass>('GymClass', GymClassSchema);
