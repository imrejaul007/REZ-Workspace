import mongoose, { Schema, Document } from 'mongoose';

export interface IHotel extends Document {
  hotelId: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: { lat: number; lng: number };
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  amenities: string[];
  images: string[];
  rating?: number;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

const HotelSchema = new Schema<IHotel>(
  {
    hotelId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    address: {
      street: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'India' },
      postalCode: { type: String },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    contact: {
      phone: { type: String },
      email: { type: String },
      website: String,
    },
    amenities: [String],
    images: [String],
    rating: Number,
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
  },
  { timestamps: true }
);

HotelSchema.index({ 'address.city': 1, status: 1 });
HotelSchema.index({ status: 1, createdAt: -1 });

export const Hotel = mongoose.model<IHotel>('Hotel', HotelSchema);
