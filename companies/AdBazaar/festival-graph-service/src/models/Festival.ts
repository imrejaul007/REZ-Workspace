import mongoose, { Schema, Document } from 'mongoose';

export interface IFestival extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  date: Date;
  endDate?: Date;
  venue: {
    name: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  type: 'music' | 'food' | 'cultural' | 'religious' | 'sports' | 'arts' | 'film' | 'literary' | 'technology' | 'mixed';
  expectedAttendance: number;
  actualAttendance?: number;
  ticketPriceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  organizer?: {
    name: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  tags: string[];
  status: 'planning' | 'announced' | 'on_sale' | 'live' | 'completed' | 'cancelled';
  impactRadius: number; // in km
  estimatedEconomicImpact?: number;
  mediaAssets?: {
    images: string[];
    videos: string[];
    logos: string[];
  };
  socialLinks?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const FestivalSchema = new Schema<IFestival>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    description: {
      type: String,
      maxlength: 5000,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
    },
    venue: {
      name: {
        type: String,
        required: true,
        maxlength: 255,
      },
      address: {
        type: String,
        required: true,
        maxlength: 500,
      },
      city: {
        type: String,
        required: true,
        maxlength: 100,
        index: true,
      },
      state: {
        type: String,
        maxlength: 100,
      },
      country: {
        type: String,
        required: true,
        maxlength: 100,
        default: 'India',
      },
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180,
        },
      },
    },
    type: {
      type: String,
      required: true,
      enum: ['music', 'food', 'cultural', 'religious', 'sports', 'arts', 'film', 'literary', 'technology', 'mixed'],
      index: true,
    },
    expectedAttendance: {
      type: Number,
      required: true,
      min: 1,
    },
    actualAttendance: {
      type: Number,
      min: 0,
    },
    ticketPriceRange: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    organizer: {
      name: {
        type: String,
        maxlength: 255,
      },
      contactEmail: {
        type: String,
        maxlength: 255,
      },
      contactPhone: {
        type: String,
        maxlength: 20,
      },
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    status: {
      type: String,
      enum: ['planning', 'announced', 'on_sale', 'live', 'completed', 'cancelled'],
      default: 'planning',
      index: true,
    },
    impactRadius: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },
    estimatedEconomicImpact: {
      type: Number,
      min: 0,
    },
    mediaAssets: {
      images: [String],
      videos: [String],
      logos: [String],
    },
    socialLinks: {
      website: String,
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
FestivalSchema.index({ 'venue.city': 1, date: 1 });
FestivalSchema.index({ 'venue.coordinates': '2dsphere' });
FestivalSchema.index({ type: 1, status: 1 });
FestivalSchema.index({ date: 1, status: 1 });
FestivalSchema.index({ tags: 1 });

// Virtual for duration in days
FestivalSchema.virtual('duration').get(function () {
  if (this.endDate && this.date) {
    return Math.ceil((this.endDate.getTime() - this.date.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  return 1;
});

// Virtual for isUpcoming
FestivalSchema.virtual('isUpcoming').get(function () {
  return this.date > new Date();
});

export const Festival = mongoose.model<IFestival>('Festival', FestivalSchema);