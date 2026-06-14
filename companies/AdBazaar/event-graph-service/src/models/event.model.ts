import mongoose, { Schema, Document, Model } from 'mongoose';
import { EventType, EventStatus, Location } from '../types/index.js';

// Location subdocument schema
const LocationSchema = new Schema<Location>(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  { _id: false }
);

// Event Schema
export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: EventType;
  description?: string;
  date: Date;
  endDate?: Date;
  time?: string;
  expectedFootfall?: number;
  actualFootfall?: number;
  location: Location;
  venue?: string;
  organizer: {
    name: string;
    type: 'individual' | 'organization' | 'government';
    contact?: string;
  };
  status: EventStatus;
  tags: string[];
  budget?: {
    min?: number;
    max?: number;
    currency: string;
  };
  source?: string;
  sourceUrl?: string;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true
    },
    type: {
      type: String,
      enum: ['wedding', 'festival', 'conference', 'sports', 'religious', 'community', 'corporate', 'entertainment', 'political', 'other'],
      required: true,
      index: true
    },
    description: {
      type: String,
      maxlength: 2000
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date
    },
    time: {
      type: String
    },
    expectedFootfall: {
      type: Number,
      min: 0
    },
    actualFootfall: {
      type: Number,
      min: 0
    },
    location: {
      type: LocationSchema,
      required: true,
      index: '2dsphere'
    },
    venue: {
      type: String
    },
    organizer: {
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['individual', 'organization', 'government'],
        required: true
      },
      contact: String
    },
    status: {
      type: String,
      enum: ['planned', 'announced', 'active', 'completed', 'cancelled'],
      default: 'planned',
      index: true
    },
    tags: [String],
    budget: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'INR'
      }
    },
    source: String,
    sourceUrl: String,
    isPublic: {
      type: Boolean,
      default: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound indexes for common queries
EventSchema.index({ type: 1, date: 1 });
EventSchema.index({ type: 1, status: 1 });
EventSchema.index({ 'location.coordinates': '2dsphere' });
EventSchema.index({ status: 1, date: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ 'organizer.name': 1 });

// Static methods
EventSchema.statics.findNearby = function(
  longitude: number,
  latitude: number,
  radiusInMeters: number,
  options: {
    type?: EventType;
    startDate?: Date;
    endDate?: Date;
    status?: EventStatus;
    limit?: number;
    skip?: number;
  } = {}
) {
  const query: Record<string, unknown> = {
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInMeters
      }
    }
  };

  if (options.type) query.type = options.type;
  if (options.status) query.status = options.status;
  if (options.startDate || options.endDate) {
    query.date = {};
    if (options.startDate) (query.date as Record<string, Date>).$gte = options.startDate;
    if (options.endDate) (query.date as Record<string, Date>).$lte = options.endDate;
  }

  return this.find(query)
    .limit(options.limit || 20)
    .skip(options.skip || 0)
    .lean();
};

EventSchema.statics.findByType = function(
  type: EventType,
  options: {
    startDate?: Date;
    endDate?: Date;
    city?: string;
    limit?: number;
  } = {}
) {
  const query: Record<string, unknown> = { type };

  if (options.startDate || options.endDate) {
    query.date = {};
    if (options.startDate) (query.date as Record<string, Date>).$gte = options.startDate;
    if (options.endDate) (query.date as Record<string, Date>).$lte = options.endDate;
  }
  if (options.city) query['location.city'] = options.city;

  return this.find(query)
    .sort({ date: 1 })
    .limit(options.limit || 50)
    .lean();
};

// Instance methods
EventSchema.methods.toPublicJSON = function() {
  return {
    id: this._id.toString(),
    name: this.name,
    type: this.type,
    description: this.description,
    date: this.date.toISOString(),
    endDate: this.endDate?.toISOString(),
    time: this.time,
    expectedFootfall: this.expectedFootfall,
    actualFootfall: this.actualFootfall,
    location: this.location,
    venue: this.venue,
    organizer: this.organizer,
    status: this.status,
    tags: this.tags,
    budget: this.budget,
    isPublic: this.isPublic,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString()
  };
};

// Export model
export const Event: Model<IEvent> = mongoose.model<IEvent>('Event', EventSchema);

// Create indexes on connection
export const createIndexes = async () => {
  try {
    await Event.createIndexes();
    logger.info('Event model indexes created successfully');
  } catch (error) {
    logger.error('Error creating Event model indexes:', error);
  }
};