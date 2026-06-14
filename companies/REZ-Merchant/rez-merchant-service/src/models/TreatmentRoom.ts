import mongoose, { Schema, Document } from 'mongoose';

export interface ITreatmentRoom extends Document {
  merchantId: string;
  storeId: string;
  name: string;
  type: 'treatment_room' | 'chair' | 'station' | 'suite' | 'other';
  capacity: number;
  description?: string;
  active: boolean;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentRoomSchema = new Schema<ITreatmentRoom>(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['treatment_room', 'chair', 'station', 'suite', 'other'],
      default: 'treatment_room',
    },
    capacity: { type: Number, default: 1, min: 1 },
    description: String,
    active: { type: Boolean, default: true },
    color: { type: String, default: '#6366F1' },
  },
  { timestamps: true }
);

// Compound index for store queries
TreatmentRoomSchema.index({ merchantId: 1, storeId: 1 });

export const TreatmentRoom = mongoose.model<ITreatmentRoom>('TreatmentRoom', TreatmentRoomSchema);
