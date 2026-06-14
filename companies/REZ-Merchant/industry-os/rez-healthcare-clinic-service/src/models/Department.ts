import mongoose, { Schema, Document } from 'mongoose';
import { Department as IDepartment } from '../types';

export interface DepartmentDocument extends Omit<IDepartment, '_id'>, Document {}

const DepartmentSchema = new Schema<DepartmentDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    headDoctor: { type: String },
    doctors: [{ type: String }],
    services: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true }
  },
  { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; } } }
);

DepartmentSchema.index({ name: 'text' });

export const DepartmentModel = mongoose.model<DepartmentDocument>('Department', DepartmentSchema);
