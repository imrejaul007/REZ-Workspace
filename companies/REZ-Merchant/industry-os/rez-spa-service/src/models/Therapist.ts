import mongoose, { Schema, Document } from 'mongoose';

export interface ITherapist extends Document {
  therapistId: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  merchantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TherapistSchema = new Schema<ITherapist>(
  {
    therapistId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    specializations: [String],
    merchantId: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TherapistSchema.index({ merchantId: 1, isActive: 1 });

export const Therapist = mongoose.model<ITherapist>('Therapist', TherapistSchema);
