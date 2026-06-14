import mongoose, { Schema, Document } from 'mongoose';

export interface ILaundryPreferences extends Document {
  guestId: string;
  preferredPickupTime?: string;
  fabricSoftener: boolean;
  starchLevel: 'none' | 'light' | 'medium' | 'heavy';
  hangDry: boolean;
  specialCare: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LaundryPreferencesSchema = new Schema<ILaundryPreferences>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    preferredPickupTime: String,
    fabricSoftener: { type: Boolean, default: true },
    starchLevel: { type: String, enum: ['none', 'light', 'medium', 'heavy'], default: 'none' },
    hangDry: { type: Boolean, default: false },
    specialCare: [{ type: String }],
  },
  { timestamps: true }
);

export const LaundryPreferences = mongoose.model<ILaundryPreferences>('LaundryPreferences', LaundryPreferencesSchema);