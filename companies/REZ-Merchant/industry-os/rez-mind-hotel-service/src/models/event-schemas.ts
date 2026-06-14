/**
 * REZ Mind Hotel Service - Models
 *
 * MongoDB schemas for:
 * - Hotel events
 * - User behavior
 * - Analytics
 */

import mongoose, { Schema, Document } from 'mongoose';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface IHotelSearchEvent {
  userId?: string;
  sessionId: string;
  query: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  resultsCount: number;
  selectedHotelId?: string;
  timestamp: Date;
}

export interface IHotelBookingEvent {
  userId: string;
  bookingId: string;
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  totalAmountPaise: number;
  status: 'created' | 'confirmed' | 'cancelled';
  source: 'app' | 'web' | 'ota' | 'pms' | 'stayown';
  timestamp: Date;
}

export interface IRoomQREvent {
  userId: string;
  bookingId: string;
  hotelId: string;
  roomId: string;
  action: 'generated' | 'scanned' | 'used_service' | 'checkout' | 'expired';
  serviceType?: string;
  amountPaise?: number;
  timestamp: Date;
}

export interface IServiceRequestEvent {
  userId: string;
  bookingId: string;
  hotelId: string;
  roomId: string;
  requestType: 'room_service' | 'housekeeping' | 'laundry' | 'concierge' | 'checkout';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  amountPaise?: number;
  responseTimeMs?: number;
  timestamp: Date;
}

export interface ICheckoutEvent {
  userId: string;
  bookingId: string;
  hotelId: string;
  totalAmountPaise: number;
  serviceChargesPaise: number;
  roomChargesPaise: number;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

export interface IGuestPreference {
  userId: string;
  hotelId: string;
  preferences: {
    temperature?: number;
    lighting?: 'bright' | 'dim' | 'dark';
    pillowType?: 'soft' | 'firm' | 'extra';
    dietaryRestrictions?: string[];
    transportRequests?: string[];
  };
  lastUpdated: Date;
}

export interface IHotelAnalytics {
  hotelId: string;
  date: Date;
  searches: number;
  bookings: number;
  cancellations: number;
  revenuePaise: number;
  avgResponseTimeMs: number;
  satisfactionScore: number;
  roomOccupancy: number;
}

// ─── Event Calendar Types ─────────────────────────────────────────────────────

export interface ILocalEvent {
  id: string;
  name: string;
  venue: string;
  city: string;
  startDate: Date;
  endDate: Date;
  type: 'festival' | 'conference' | 'concert' | 'sports' | 'exhibition' | 'holiday';
  expectedAttendance: number;
  impact: 'low' | 'medium' | 'high';
  hotelIds: string[];
  source?: string;
  lastUpdated?: Date;
}

// ─── Schemas ───────────────────────────────────────────────────────────────────

const HotelSearchEventSchema = new Schema<IHotelSearchEvent & Document>({
  userId: { type: String, sparse: true, index: true },
  sessionId: { type: String, required: true, index: true },
  query: { type: String, required: true },
  city: { type: String },
  checkIn: { type: String },
  checkOut: { type: String },
  guests: { type: Number },
  resultsCount: { type: Number, required: true },
  selectedHotelId: { type: String, sparse: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

const HotelBookingEventSchema = new Schema<IHotelBookingEvent & Document>({
  userId: { type: String, required: true, index: true },
  bookingId: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  roomTypeId: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  totalAmountPaise: { type: Number, required: true },
  status: { type: String, enum: ['created', 'confirmed', 'cancelled'], required: true },
  source: { type: String, enum: ['app', 'web', 'ota'], default: 'app' },
  timestamp: { type: Date, default: Date.now, index: true },
});

const RoomQREventSchema = new Schema<IRoomQREvent & Document>({
  userId: { type: String, required: true, index: true },
  bookingId: { type: String, required: true, index: true },
  hotelId: { type: String, required: true, index: true },
  roomId: { type: String, required: true },
  action: { type: String, enum: ['generated', 'scanned', 'used_service', 'checkout', 'expired'], required: true },
  serviceType: { type: String },
  amountPaise: { type: Number },
  timestamp: { type: Date, default: Date.now, index: true },
});

const ServiceRequestEventSchema = new Schema<IServiceRequestEvent & Document>({
  userId: { type: String, required: true, index: true },
  bookingId: { type: String, required: true, index: true },
  hotelId: { type: String, required: true, index: true },
  roomId: { type: String, required: true },
  requestType: {
    type: String,
    enum: ['room_service', 'housekeeping', 'laundry', 'concierge', 'checkout'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    required: true
  },
  amountPaise: { type: Number },
  responseTimeMs: { type: Number },
  timestamp: { type: Date, default: Date.now, index: true },
});

const CheckoutEventSchema = new Schema<ICheckoutEvent & Document>({
  userId: { type: String, required: true, index: true },
  bookingId: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  totalAmountPaise: { type: Number, required: true },
  serviceChargesPaise: { type: Number, required: true },
  roomChargesPaise: { type: Number, required: true },
  paymentMethod: { type: String },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    required: true
  },
  timestamp: { type: Date, default: Date.now, index: true },
});

const GuestPreferenceSchema = new Schema<IGuestPreference & Document>({
  userId: { type: String, required: true, unique: true, index: true },
  hotelId: { type: String, required: true },
  preferences: {
    temperature: { type: Number },
    lighting: { type: String },
    pillowType: { type: String },
    dietaryRestrictions: [{ type: String }],
    transportRequests: [{ type: String }],
  },
  lastUpdated: { type: Date, default: Date.now },
});

const HotelAnalyticsSchema = new Schema<IHotelAnalytics & Document>({
  hotelId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  searches: { type: Number, default: 0 },
  bookings: { type: Number, default: 0 },
  cancellations: { type: Number, default: 0 },
  revenuePaise: { type: Number, default: 0 },
  avgResponseTimeMs: { type: Number, default: 0 },
  satisfactionScore: { type: Number, default: 0 },
  roomOccupancy: { type: Number, default: 0 },
});

// ─── Compound Indexes ────────────────────────────────────────────────────────────

HotelSearchEventSchema.index({ hotelId: 1, timestamp: -1 });
HotelBookingEventSchema.index({ hotelId: 1, timestamp: -1 });
RoomQREventSchema.index({ hotelId: 1, action: 1, timestamp: -1 });
ServiceRequestEventSchema.index({ hotelId: 1, requestType: 1, timestamp: -1 });
CheckoutEventSchema.index({ hotelId: 1, timestamp: -1 });
HotelAnalyticsSchema.index({ hotelId: 1, date: -1 }, { unique: true });

// ─── Local Event Schema (Event Calendar) ───────────────────────────────────────

const LocalEventSchema = new Schema<ILocalEvent & Document>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  venue: { type: String, required: true },
  city: { type: String, required: true, index: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  type: {
    type: String,
    enum: ['festival', 'conference', 'concert', 'sports', 'exhibition', 'holiday'],
    required: true,
    index: true,
  },
  expectedAttendance: { type: Number, required: true },
  impact: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
    index: true,
  },
  hotelIds: [{ type: String, index: true }],
  source: { type: String },
  lastUpdated: { type: Date, default: Date.now },
});

// Compound indexes for efficient queries
LocalEventSchema.index({ hotelIds: 1, startDate: 1, endDate: 1 });
LocalEventSchema.index({ city: 1, startDate: 1, endDate: 1 });

// ─── Export Models ──────────────────────────────────────────────────────────────

export const HotelSearchEvent = mongoose.model<IHotelSearchEvent & Document>('HotelSearchEvent', HotelSearchEventSchema);
export const HotelBookingEvent = mongoose.model<IHotelBookingEvent & Document>('HotelBookingEvent', HotelBookingEventSchema);
export const RoomQREvent = mongoose.model<IRoomQREvent & Document>('RoomQREvent', RoomQREventSchema);
export const ServiceRequestEvent = mongoose.model<IServiceRequestEvent & Document>('ServiceRequestEvent', ServiceRequestEventSchema);
export const CheckoutEvent = mongoose.model<ICheckoutEvent & Document>('CheckoutEvent', CheckoutEventSchema);
export const GuestPreference = mongoose.model<IGuestPreference & Document>('GuestPreference', GuestPreferenceSchema);
export const HotelAnalytics = mongoose.model<IHotelAnalytics & Document>('HotelAnalytics', HotelAnalyticsSchema);
export const LocalEvent = mongoose.model<ILocalEvent & Document>('LocalEvent', LocalEventSchema);
