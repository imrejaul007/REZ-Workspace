import mongoose, { Schema, Document } from 'mongoose';
import { ILesson } from './Lesson.js';

export interface IModule {
  title: string;
  description?: string;
  lessons: ILesson[];
  order: number;
  estimatedDuration: number;
}

export interface IModuleDocument extends Omit<IModule, '_id'>, Document {}

const moduleSchema = new Schema<IModule>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    lessons: { type: [Schema.Types.Mixed], default: [] },
    order: { type: Number, required: true, default: 0 },
    estimatedDuration: { type: Number, required: true, default: 30 },
  },
  { _id: false }
);

export const Module = mongoose.model<IModule>('Module', moduleSchema);
