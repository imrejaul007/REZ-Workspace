import mongoose, { Schema, Document } from 'mongoose';
import { Clinic as IClinic } from '../types';

export interface ClinicDocument extends Omit<IClinic, '_id'>, Document {}

const OperatingHoursSchema = new Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  open: { type: String, required: true },
  close: { type: String, required: true },
  isOpen: { type: Boolean, default: true }
}, { _id: false });

const ClinicSchema = new Schema<ClinicDocument>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    departments: [{ type: String }],
    operatingHours: [OperatingHoursSchema],
    facilities: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true }
  },
  { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; } } }
);

export const ClinicModel = mongoose.model<ClinicDocument>('Clinic', ClinicSchema);
