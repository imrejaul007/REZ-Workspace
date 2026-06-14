import mongoose, { Document, Schema } from 'mongoose';

export const ClassStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const ClassType = {
  YOGA: 'yoga',
  PILATES: 'pilates',
  HIIT: 'hiit',
  SPINNING: 'spinning',
  STRENGTH: 'strength',
  CROSSFIT: 'crossfit',
  ZUMBA: 'zumba',
  BOXING: 'boxing',
  SWIMMING: 'swimming',
  PERSONAL: 'personal',
  OTHER: 'other'
} as const;

export type ClassStatusType = typeof ClassStatus[keyof typeof ClassStatus];
export type ClassTypeValue = typeof ClassType[keyof typeof ClassType];

export interface IClass extends Document {
  name: string;
  description: string;
  classType: ClassTypeValue;
  trainerId: mongoose.Types.ObjectId;
  duration: number; // in minutes
  maxCapacity: number;
  currentEnrollment: number;
  startTime: Date;
  endTime: Date;
  status: ClassStatusType;
  room: string;
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  price: number;
  prerequisites: string[];
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  classType: {
    type: String,
    enum: ['yoga', 'pilates', 'hiit', 'spinning', 'strength', 'crossfit', 'zumba', 'boxing', 'swimming', 'personal', 'other'],
    required: true
  },
  trainerId: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  duration: { type: Number, required: true, min: 15 },
  maxCapacity: { type: Number, required: true, min: 1 },
  currentEnrollment: { type: Number, default: 0 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  room: { type: String, required: true },
  equipment: [{ type: String }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all_levels'],
    default: 'all_levels'
  },
  price: { type: Number, default: 0 },
  prerequisites: [{ type: String }]
}, { timestamps: true });

classSchema.index({ trainerId: 1 });
classSchema.index({ startTime: 1 });
classSchema.index({ classType: 1 });
classSchema.index({ status: 1 });

export const FitnessClass = mongoose.model<IClass>('FitnessClass', classSchema);
