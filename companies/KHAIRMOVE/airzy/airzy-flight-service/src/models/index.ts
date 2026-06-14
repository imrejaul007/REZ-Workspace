import mongoose, { Schema, Document } from 'mongoose';
import { Booking, PriceAlert } from '../types';

export interface IBooking extends Omit<Booking, 'id'>, Document {}

const PassengerSchema = new Schema({
  type: { type: String, enum: ['adult', 'child', 'infant'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  nationality: { type: String, required: true, minlength: 2, maxlength: 2 },
  passportNumber: String,
  passportExpiry: String,
  email: { type: String, required: true },
  phone: { type: String, required: true }
}, { _id: true });

const FlightSegmentSchema = new Schema({
  segmentId: { type: String, required: true },
  flightNumber: { type: String, required: true },
  airline: {
    code: String,
    name: String,
    logo: String,
    alliance: String
  },
  aircraft: String,
  departure: {
    airport: String,
    terminal: String,
    time: String,
    gate: String
  },
  arrival: {
    airport: String,
    terminal: String,
    time: String,
    gate: String
  },
  duration: String,
  stops: Number,
  baggage: {
    cabin: String,
    checked: String
  }
}, { _id: false });

const BookingSchema = new Schema({
  confirmationCode: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  flights: [FlightSegmentSchema],
  passengers: [PassengerSchema],
  contact: {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    countryCode: { type: String, default: '+91' }
  },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  pnr: { type: String, unique: true, sparse: true },
  itinerarySent: { type: Boolean, default: false },
  cancellation: {
    reason: String,
    refundAmount: Number,
    cancelledAt: Date
  }
}, {
  timestamps: true
});

// Indexes
BookingSchema.index({ 'contact.email': 1 });
BookingSchema.index({ pnr: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ createdAt: -1 });

export const BookingModel = mongoose.model<IBooking>('Booking', BookingSchema);

export interface IPriceAlert extends Omit<PriceAlert, 'id'>, Document {}

const PriceAlertSchema = new Schema({
  userId: String,
  email: { type: String, required: true },
  origin: { type: String, required: true, minlength: 3, maxlength: 3 },
  destination: { type: String, required: true, minlength: 3, maxlength: 3 },
  departureDate: { type: String, required: true },
  returnDate: String,
  maxPrice: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  cabinClass: String,
  passengers: { type: Number, default: 1 },
  frequency: { type: String, enum: ['daily', 'weekly', 'instant'], default: 'instant' },
  active: { type: Boolean, default: true },
  lastChecked: Date,
  lastPrice: Number,
  notifyCount: { type: Number, default: 0 },
  unsubscribed: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes
PriceAlertSchema.index({ email: 1, origin: 1, destination: 1, active: 1 });
PriceAlertSchema.index({ lastChecked: 1 });
PriceAlertSchema.index({ departureDate: 1 });

export const PriceAlertModel = mongoose.model<IPriceAlert>('PriceAlert', PriceAlertSchema);

export default {
  BookingModel,
  PriceAlertModel
};