import mongoose, { Schema, Document } from 'mongoose';

export interface IGuestPreferences extends Document {
  guestId: string;
  dietaryRestrictions: string[];
  allergies: string[];
  favoriteItems: string[];
  preferredDeliveryTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GuestPreferencesSchema = new Schema<IGuestPreferences>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    dietaryRestrictions: [{ type: String }],
    allergies: [{ type: String }],
    favoriteItems: [{ type: String }],
    preferredDeliveryTime: String,
  },
  { timestamps: true }
);

export const GuestPreferences = mongoose.model<IGuestPreferences>('GuestPreferences', GuestPreferencesSchema);