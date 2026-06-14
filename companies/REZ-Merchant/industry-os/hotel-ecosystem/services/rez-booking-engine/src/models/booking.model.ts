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

export interface IBooking extends Document {
  bookingId: string;
  confirmationNumber: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomTypeId: string;
  rooms: {
    roomId: string;
    roomNumber: string;
    pricePerNight: number;
  }[];
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalRooms: number;
  adults: number;
  children: number;
  totalGuests: number;
  subtotal: number;
  taxes: {
    cgst: number;
    sgst: number;
    total: number;
  };
  fees: {
    cleaning?: number;
    parking?: number;
    other?: number;
  };
  discounts: {
    code?: string;
    type: 'percentage' | 'fixed';
    amount: number;
  }[];
  total: number;
  paid: number;
  balance: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  specialRequests?: string;
  source: 'direct' | 'booking_com' | 'mMT' | 'goibibo' | 'airbnb' | 'expedia' | 'walkin';
  channelReference?: string;
  roomPlan: 'room_only' | 'bb' | 'hb' | 'fb';
  cancellationPolicy: {
    type: 'free' | 'partial' | 'non_refundable';
    deadline?: Date;
    penalty?: number;
  };
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingRoomSchema = new Schema({
  roomId: { type: String, required: true },
  roomNumber: { type: String, required: true },
  pricePerNight: { type: Number, required: true },
});

const BookingTaxesSchema = new Schema({
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const BookingFeesSchema = new Schema({
  cleaning: Number,
  parking: Number,
  other: Number,
});

const BookingDiscountSchema = new Schema({
  code: String,
  type: { type: String, enum: ['percentage', 'fixed'] },
  amount: { type: Number, default: 0 },
});

const CancellationPolicySchema = new Schema({
  type: { type: String, enum: ['free', 'partial', 'non_refundable'] },
  deadline: Date,
  penalty: Number,
});

const BookingSchema = new Schema({
  bookingId: { type: String, required: true, unique: true, index: true },
  confirmationNumber: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  guestId: String,
  guestName: { type: String, required: true },
  guestEmail: { type: String },
  guestPhone: { type: String, required: true },
  roomTypeId: { type: String, required: true },
  rooms: [BookingRoomSchema],
  checkIn: { type: Date, required: true, index: true },
  checkOut: { type: Date, required: true },
  nights: { type: Number, required: true },
  totalRooms: { type: Number, default: 1 },
  adults: { type: Number, default: 1 },
  children: { type: Number, default: 0 },
  totalGuests: { type: Number, default: 1 },
  subtotal: { type: Number, required: true },
  taxes: { type: BookingTaxesSchema, default: {} },
  fees: { type: BookingFeesSchema, default: {} },
  discounts: [BookingDiscountSchema],
  total: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
    default: 'pending',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending',
  },
  specialRequests: String,
  source: {
    type: String,
    enum: ['direct', 'booking_com', 'mMT', 'goibibo', 'airbnb', 'expedia', 'walkin'],
    default: 'direct',
  },
  channelReference: String,
  roomPlan: {
    type: String,
    enum: ['room_only', 'bb', 'hb', 'fb'],
    default: 'room_only',
  },
  cancellationPolicy: { type: CancellationPolicySchema, default: {} },
  checkedInAt: Date,
  checkedOutAt: Date,
}, { timestamps: true });

BookingSchema.index({ hotelId: 1, checkIn: 1 });
BookingSchema.index({ hotelId: 1, checkOut: 1 });
BookingSchema.index({ guestId: 1 });
BookingSchema.index({ confirmationNumber: 1 });
BookingSchema.index({ status: 1, checkIn: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
