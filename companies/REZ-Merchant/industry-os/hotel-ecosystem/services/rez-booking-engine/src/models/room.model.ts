import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  roomId: string;
  hotelId: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  floor: number;
  building?: string;
  view?: string;
  bedType: string;
  capacity: number;
  basePrice: number;
  amenities: { name: string; icon?: string }[];
  images?: string[];
  description?: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_service';
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomAmenitiesSchema = new Schema({
  name: { type: String, required: true },
  icon: String,
});

const RoomSchema = new Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  hotelId: { type: String, required: true, index: true },
  roomNumber: { type: String, required: true },
  roomTypeId: { type: String, required: true, index: true },
  roomTypeName: { type: String, required: true },
  floor: { type: Number, default: 1 },
  building: String,
  view: String,
  bedType: { type: String, default: 'King' },
  capacity: { type: Number, default: 2 },
  basePrice: { type: Number, required: true },
  amenities: [RoomAmenitiesSchema],
  images: [String],
  description: String,
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'cleaning', 'out_of_service'],
    default: 'available',
  },
  features: [String],
}, { timestamps: true });

RoomSchema.index({ hotelId: 1, status: 1 });
RoomSchema.index({ hotelId: 1, roomTypeId: 1 });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
