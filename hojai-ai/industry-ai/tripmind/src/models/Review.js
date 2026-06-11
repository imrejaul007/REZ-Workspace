const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  destinationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: [true, 'Destination ID is required'],
    index: true
  },
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    index: true
  },
  bookingId: {
    type: String,
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: 2000
  },
  photos: [{
    url: String,
    caption: String
  }],
  categories: {
    overall: {
      type: Number,
      min: 1,
      max: 5,
      default: function() { return this.rating; }
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    location: {
      type: Number,
      min: 1,
      max: 5
    },
    service: {
      type: Number,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    amenities: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  pros: [String],
  cons: [String],
  helpful: {
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    voters: [String]
  },
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved',
    index: true
  },
  response: {
    text: String,
    respondedAt: Date,
    respondedBy: String
  },
  metadata: {
    visitDate: Date,
    travelType: {
      type: String,
      enum: ['solo', 'couple', 'family', 'friends', 'business', 'other'],
      default: 'other'
    },
    source: {
      type: String,
      default: 'direct'
    },
    device: {
      type: String,
      enum: ['web', 'mobile', 'tablet', 'other'],
      default: 'web'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reviewSchema.index({ destinationId: 1, rating: -1 });
reviewSchema.index({ customerId: 1, destinationId: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ 'metadata.travelType': 1 });

reviewSchema.statics.calculateAverageRating = async function(destinationId) {
  const stats = await this.aggregate([
    {
      $match: {
        destinationId: new mongoose.Types.ObjectId(destinationId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$destinationId',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Destination').findByIdAndUpdate(destinationId, {
      rating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].count
    });
  }

  return stats[0] || { averageRating: 0, count: 0 };
};

reviewSchema.post('save', async function() {
  await this.constructor.calculateAverageRating(this.destinationId);
});

reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await this.model.calculateAverageRating(doc.destinationId);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;