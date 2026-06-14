import mongoose, { Schema, Document } from 'mongoose';
import { Medicine as IMedicine } from '../types';

export interface MedicineDocument extends Omit<IMedicine, '_id'>, Document {}

const MedicineSchema = new Schema<MedicineDocument>(
  {
    name: { type: String, required: true, index: true },
    genericName: { type: String, required: true },
    category: { type: String, required: true, index: true },
    dosage: { type: String, required: true },
    sideEffects: [{ type: String }],
    contraindications: [{ type: String }]
  },
  { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; } } }
);

MedicineSchema.index({ name: 'text', genericName: 'text' });

export const MedicineModel = mongoose.model<MedicineDocument>('Medicine', MedicineSchema);
