const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['flight', 'hotel', 'car', 'package', 'activity'],
    required: [true, 'Booking type is required']
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
    default: 'pending',
    index: true
  },
  total: {
    type: Number,
    required: [true, 'Total cost is required'],
    min: [0, 'Total cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    maxlength: 3
  },
  passengers: {
    type: Number,
    default: 1,
    min: 1,
    max: 20
  },
  details: {
    flightNumber: String,
    airline: String,
    hotelName: String,
    roomType: String,
    pickupLocation: String,
    dropoffLocation: String
  },
  metadata: {
    source: {
      type: String,
      default: 'api'
    },
    agent: {
      type: String,
      default: 'system'
    },
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ destination: 1, date: 1 });
bookingSchema.index({ createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;