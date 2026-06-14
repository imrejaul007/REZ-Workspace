import mongoose, { Schema } from 'mongoose';
import { IShift, ShiftStatus, IShiftTemplate } from '../types/index.js';

const shiftSchema = new Schema<IShift>(
  {
    tenantId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    breakMinutes: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'absent'],
      default: 'scheduled',
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
  },
  { timestamps: true }
);

shiftSchema.index({ tenantId: 1, employeeId: 1, date: 1 });
shiftSchema.index({ tenantId: 1, date: 1 });
shiftSchema.index({ tenantId: 1, status: 1 });

const shiftTemplateSchema = new Schema<IShiftTemplate>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    breakMinutes: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Shift = mongoose.model<IShift>('Shift', shiftSchema);
export const ShiftTemplate = mongoose.model<IShiftTemplate>('ShiftTemplate', shiftTemplateSchema);
