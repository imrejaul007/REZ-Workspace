import logger from './utils/logger';

import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_hotel';
  await mongoose.connect(uri);
  logger.info('Hotel service connected to MongoDB');
}

// Models
export const HotelSchema = new mongoose.Schema({
  externalId: String,
  name: String,
  address: String,
  city: String,
  country: String,
  rating: Number,
  images: [String],
  amenities: [String],
  rooms: [{
    type: String,
    name: String,
    price: Number,
    capacity: Number,
    available: Boolean
  }],
  syncedAt: Date
});

export const BookingSchema = new mongoose.Schema({
  bookingId: String,
  hotelId: String,
  externalBookingId: String,
  guestName: String,
  guestEmail: String,
  checkIn: Date,
  checkOut: Date,
  rooms: Number,
  totalAmount: Number,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

export const Hotel = mongoose.model('Hotel', HotelSchema);
export const Booking = mongoose.model('Booking', BookingSchema);
