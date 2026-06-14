import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  roomId: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  description: string;
  baseRate: number;
  maxOccupancy: number;
  amenities: string[];
  images: string[];
  status: 'available' | 'maintenance' | 'out-of-service';
  floor: number;
  roomNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    hotelId: { type: String, required: true, index: true },
    hotelName: { type: String, required: true },
    roomType: { type: String, required: true },
    description: { type: String },
    baseRate: { type: Number, required: true },
    maxOccupancy: { type: Number, default: 2 },
    amenities: [String],
    images: [String],
    status: {
      type: String,
      enum: ['available', 'maintenance', 'out-of-service'],
      default: 'available',
      index: true,
    },
    floor: { type: Number, default: 1 },
    roomNumber: { type: String, required: true },
  },
  { timestamps: true }
);

RoomSchema.index({ hotelId: 1, roomType: 1, status: 1 });
RoomSchema.index({ hotelId: 1, status: 1 });
RoomSchema.index({ baseRate: 1 });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
