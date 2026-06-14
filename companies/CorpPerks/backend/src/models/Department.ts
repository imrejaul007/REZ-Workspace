import mongoose, { Schema } from 'mongoose';
import { IDepartment } from '../types/index.js';

const departmentSchema = new Schema<IDepartment>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true },
    headId: { type: String },
    parentId: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

departmentSchema.index({ tenantId: 1, code: 1 }, { unique: true });
departmentSchema.index({ tenantId: 1, name: 1 });

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
