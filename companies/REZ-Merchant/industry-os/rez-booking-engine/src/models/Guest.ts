import mongoose, { Schema, Document } from 'mongoose';

export interface IGuest extends Document {
  guestId: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  preferences: string[];
  createdAt: Date;
  updatedAt: Date;
}

const GuestSchema = new Schema<IGuest>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    address: String,
    preferences: [String],
  },
  { timestamps: true }
);

GuestSchema.index({ email: 1 });
GuestSchema.index({ name: 'text', email: 'text', phone: 'text' });

export const Guest = mongoose.model<IGuest>('Guest', GuestSchema);
