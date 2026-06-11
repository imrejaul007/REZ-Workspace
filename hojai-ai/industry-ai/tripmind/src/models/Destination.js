const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Destination name is required'],
    trim: true,
    unique: true,
    index: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  attractions: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    ticketPrice: Number,
    recommendedDuration: String,
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
    index: true
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  priceRange: {
    type: String,
    enum: ['budget', 'moderate', 'luxury', 'ultra-luxury'],
    default: 'moderate'
  },
  estimatedDailyCost: {
    type: Number,
    min: 0
  },
  bestTimeToVisit: [{
    month: {
      type: String,
      enum: ['January', 'February', 'March', 'April', 'May', 'June',
             'July', 'August', 'September', 'October', 'November', 'December']
    },
    description: String
  }],
  image: {
    type: String,
    default: null
  },
  images: [{
    url: String,
    caption: String
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  visaRequired: {
    type: Boolean,
    default: false
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  language: {
    type: String,
    default: 'English'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  metadata: {
    popularity: {
      type: Number,
      default: 0
    },
    searchCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

destinationSchema.index({ name: 'text', country: 'text', description: 'text' });
destinationSchema.index({ 'attractions.name': 1 });
destinationSchema.index({ tags: 1 });
destinationSchema.index({ priceRange: 1, rating: -1 });

destinationSchema.pre('save', function(next) {
  if (this.isModified('rating') || this.isModified('reviewCount')) {
    this.metadata = this.metadata || {};
  }
  next();
});

const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination;