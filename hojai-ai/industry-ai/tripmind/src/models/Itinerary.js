const mongoose = require('mongoose');

const daySchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true,
    min: 1
  },
  date: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  activities: [{
    time: String,
    title: {
      type: String,
      required: true
    },
    description: String,
    location: String,
    duration: String,
    cost: {
      type: Number,
      default: 0,
      min: 0
    },
    category: {
      type: String,
      enum: ['sightseeing', 'dining', 'entertainment', 'transport', 'shopping', 'relaxation', 'adventure', 'other'],
      default: 'sightseeing'
    },
    bookingRequired: {
      type: Boolean,
      default: false
    },
    notes: String
  }],
  meals: {
    breakfast: {
      type: String,
      description: String
    },
    lunch: {
      type: String,
      description: String
    },
    dinner: {
      type: String,
      description: String
    }
  },
  accommodation: {
    name: String,
    address: String,
    checkIn: String,
    checkOut: String
  },
  transport: {
    type: String,
    description: String
  },
  notes: String
}, { _id: false });

const itinerarySchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: [true, 'Booking ID is required'],
    index: true
  },
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    index: true
  },
  destination: {
    type: String,
    required: [true, 'Destination is required']
  },
  title: {
    type: String,
    required: [true, 'Itinerary title is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  days: [daySchema],
  totalDays: {
    type: Number,
    required: true,
    min: 1
  },
  totalCost: {
    type: Number,
    required: [true, 'Total cost is required'],
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    maxlength: 3
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  preferences: {
    travelStyle: {
      type: String,
      enum: ['budget', 'moderate', 'luxury', 'adventure', 'relaxation', 'cultural'],
      default: 'moderate'
    },
    interests: [String],
    dietaryRestrictions: [String],
    accessibilityNeeds: String,
    pace: {
      type: String,
      enum: ['relaxed', 'moderate', 'packed'],
      default: 'moderate'
    }
  },
  metadata: {
    generatedBy: {
      type: String,
      default: 'ai'
    },
    version: {
      type: Number,
      default: 1
    },
    lastModified: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

itinerarySchema.index({ bookingId: 1, destination: 1 });
itinerarySchema.index({ customerId: 1, status: 1 });
itinerarySchema.index({ createdAt: -1 });

itinerarySchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata = this.metadata || {};
    this.metadata.lastModified = new Date();
  }
  if (this.days && this.days.length > 0) {
    this.totalDays = this.days.length;
  }
  next();
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

module.exports = Itinerary;