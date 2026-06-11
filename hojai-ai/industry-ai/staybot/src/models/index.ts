import mongoose, { Schema, Document } from 'mongoose';

export interface IGuest extends Document {
  guestId: string;
  name: string;
  phone: string;
  email?: string;
  hotelId: string;
  checkIn: Date;
  checkOut: Date;
  roomNumber: string;
  status: 'checked-in' | 'checked-out' | 'cancelled';
  preferences: string[];
  loyaltyTier: 'standard' | 'silver' | 'gold' | 'platinum';
  createdAt: Date;
  updatedAt: Date;
}

const GuestSchema = new Schema<IGuest>({
  guestId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  hotelId: { type: String, required: true, index: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  roomNumber: { type: String, required: true },
  status: { type: String, enum: ['checked-in', 'checked-out', 'cancelled'], default: 'checked-in' },
  preferences: [String],
  loyaltyTier: { type: String, enum: ['standard', 'silver', 'gold', 'platinum'], default: 'standard' },
}, { timestamps: true });

GuestSchema.index({ hotelId: 1, status: 1 });
GuestSchema.index({ checkIn: 1, checkOut: 1 });

export const Guest = mongoose.model<IGuest>('Guest', GuestSchema);

export interface IRoom extends Document {
  roomId: string;
  hotelId: string;
  roomNumber: string;
  type: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  price: number;
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  roomId: { type: String, required: true, unique: true, index: true },
  hotelId: { type: String, required: true, index: true },
  roomNumber: { type: String, required: true },
  type: { type: String, required: true },
  floor: { type: Number, default: 1 },
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'cleaning'], default: 'available' },
  price: { type: Number, required: true },
  amenities: [String],
}, { timestamps: true });

RoomSchema.index({ hotelId: 1, status: 1 });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);

export interface IComplaint extends Document {
  complaintId: string;
  guestId: string;
  hotelId: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
  complaintId: { type: String, required: true, unique: true, index: true },
  guestId: { type: String, required: true, index: true },
  hotelId: { type: String, required: true, index: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  assignedTo: String,
  resolution: String,
}, { timestamps: true });

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);

export interface IHousekeepingTask extends Document {
  taskId: string;
  roomId: string;
  hotelId: string;
  type: 'cleaning' | 'maintenance' | 'inspection';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HousekeepingTaskSchema = new Schema<IHousekeepingTask>({
  taskId: { type: String, required: true, unique: true, index: true },
  roomId: { type: String, required: true, index: true },
  hotelId: { type: String, required: true, index: true },
  type: { type: String, enum: ['cleaning', 'maintenance', 'inspection'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  assignedTo: String,
  notes: String,
}, { timestamps: true });

export const HousekeepingTask = mongoose.model<IHousekeepingTask>('HousekeepingTask', HousekeepingTaskSchema);

export default { Guest, Room, Complaint, HousekeepingTask };