/**
 * Event Model
 * MongoDB schema for rider events with RSVP, check-ins, and rewards
 * @module models/event
 * @author RiderCircle Team
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * RSVP record for event attendance
 * @interface IRSVP
 */
export interface IRSVP {
  /** Rider's ObjectId */
  riderId: mongoose.Types.ObjectId;
  /** RSVP status */
  status: 'going' | 'maybe' | 'not_going';
  /** When rider responded */
  respondedAt: Date;
  /** Optional note from rider */
  note?: string;
}

/**
 * Check-in record at event
 * @interface ICheckIn
 */
export interface ICheckIn {
  /** Rider's ObjectId */
  riderId: mongoose.Types.ObjectId;
  /** Check-in type */
  type: 'start' | 'checkpoint' | 'end';
  /** Check-in location */
  location?: {
    /** [lng, lat] coordinates */
    coordinates: [number, number];
    /** Address */
    address?: string;
  };
  /** Check-in timestamp */
  timestamp: Date;
  /** Optional photo */
  photo?: string;
}

/**
 * Event - Organized rider event with route, RSVP, and check-ins
 * @interface IEvent
 * @extends Document
 */
export interface IEvent extends Document {
  // Organization
  /** Associated group ObjectId */
  groupId?: mongoose.Types.ObjectId;
  /** Primary organizer */
  organizerId: mongoose.Types.ObjectId;
  /** Co-organizers */
  coOrganizers: mongoose.Types.ObjectId[];

  // Event Info
  /** Event title */
  title: string;
  /** URL-friendly slug (unique) */
  slug: string;
  /** Event description */
  description: string;
  /** Event type */
  type: 'ride' | 'meet' | 'rally' | 'track_day' | 'workshop' | 'rally_event' | 'rally_stage';
  /** Banner image URL */
  banner?: string;
  /** Cover image URL */
  coverImage?: string;

  // Route
  /** Event route details */
  route?: {
    /** Route name */
    name: string;
    /** Start point */
    start: {
      /** Place name */
      name: string;
      /** [lng, lat] coordinates */
      coordinates: [number, number];
      /** Address */
      address?: string;
    };
    /** End point */
    end: {
      /** Place name */
      name: string;
      /** [lng, lat] coordinates */
      coordinates: [number, number];
      /** Address */
      address?: string;
    };
    /** Waypoints along route */
    waypoints: {
      /** Place name */
      name: string;
      /** [lng, lat] coordinates */
      coordinates: [number, number];
      /** Address */
      address?: string;
    }[];
    /** Total distance in km */
    distance: number;
    /** Elevation profile */
    elevation?: { gain: number; loss: number };
    /** Route difficulty */
    difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
    /** Road types along route */
    roadTypes: string[];
  };

  // Timing
  /** Event start time */
  startTime: Date;
  /** Event end time */
  endTime: Date;
  /** Duration in minutes */
  duration: number;
  /** Registration deadline */
  registrationDeadline?: Date;
  /** Cancellation deadline */
  cancellationDeadline?: Date;

  // Location
  /** Primary start location */
  startLocation: {
    /** Place name */
    name: string;
    /** [lng, lat] coordinates */
    coordinates: [number, number];
    /** Address */
    address: string;
    /** Landmark */
    landmark?: string;
  };
  /** End location (optional) */
  endLocation?: {
    /** Place name */
    name: string;
    /** [lng, lat] coordinates */
    coordinates: [number, number];
    /** Address */
    address?: string;
  };

  // Capacity
  /** Maximum participants allowed */
  maxParticipants: number;
  /** Minimum participants required */
  minParticipants?: number;
  /** Current participant count (computed) */
  currentParticipants: number;
  /** RSVP records */
  rsvps: IRSVP[];
  /** Waitlist ObjectIds */
  waitlist: mongoose.Types.ObjectId[];

  // Requirements
  /** Minimum trust score to join */
  minTrustScore: number;
  /** Required gear list */
  requiredGear: string[];
  /** Difficulty level */
  difficulty: string;
  /** Prerequisites for participation */
  prerequisites?: string[];

  // Experience Level
  /** Required experience level */
  experienceLevel: 'beginner' | 'intermediate' | 'expert' | 'all_levels';

  // Check-in
  /** Whether check-ins are enabled */
  checkInEnabled: boolean;
  /** Check-in records */
  checkIns: ICheckIn[];
  /** Geofence radius in meters */
  checkInRadius: number;

  // Fees
  /** Event fees */
  fees: {
    /** Fee amount */
    amount: number;
    /** Currency code */
    currency: string;
    /** What's included */
    includes: string[];
    /** Refund policy */
    refundPolicy: 'full' | 'partial' | 'none';
  };

  // Rewards
  /** Event rewards */
  rewards?: {
    /** Karma points awarded */
    points: number;
    /** Badges awarded */
    badges: string[];
    /** Certificate provided */
    certificate?: boolean;
  };

  // Media
  /** Gallery images */
  gallery: string[];
  /** Event photos */
  photos: string[];

  // Status
  /** Event status */
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  /** Cancellation reason */
  cancellationReason?: string;

  // Stats
  /** Event statistics */
  stats: {
    /** Total check-ins */
    totalCheckIns: number;
    /** Completion rate */
    completionRate: number;
    /** Average rating */
    avgRating?: number;
  };

  // Social
  /** Whether event is featured */
  isFeatured: boolean;
  /** Whether event is public */
  isPublic: boolean;
  /** Shareable link */
  shareableLink?: string;

  // Tags
  /** Event tags for discovery */
  tags: string[];

  /** Document creation timestamp */
  createdAt: Date;
  /** Document update timestamp */
  updatedAt: Date;
}

/**
 * RSVP schema
 * @private
 */
const RSVPSchema = new Schema<IRSVP>({
  riderId: { type: Schema.Types.ObjectId, ref: 'RiderProfile', required: true },
  status: { type: String, enum: ['going', 'maybe', 'not_going'], required: true },
  respondedAt: { type: Date, default: Date.now },
  note: { type: String },
}, { _id: false });

/**
 * Check-in schema
 * @private
 */
const CheckInSchema = new Schema<ICheckIn>({
  riderId: { type: Schema.Types.ObjectId, ref: 'RiderProfile', required: true },
  type: { type: String, enum: ['start', 'checkpoint', 'end'], required: true },
  location: {
    coordinates: { type: [Number] },
    address: { type: String },
  },
  timestamp: { type: Date, default: Date.now },
  photo: { type: String },
}, { _id: false });

/**
 * Main event schema
 * @private
 */
const EventSchema = new Schema<IEvent>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
  organizerId: {
    type: Schema.Types.ObjectId,
    ref: 'RiderProfile',
    required: true,
  },
  coOrganizers: [{ type: Schema.Types.ObjectId, ref: 'RiderProfile' }],

  title: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 2000 },
  type: {
    type: String,
    enum: ['ride', 'meet', 'rally', 'track_day', 'workshop', 'rally_event', 'rally_stage'],
    required: true,
  },
  banner: { type: String },
  coverImage: { type: String },

  route: {
    name: { type: String },
    start: {
      name: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },
    },
    end: {
      name: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },
    },
    waypoints: [{
      name: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },
    }],
    distance: { type: Number },
    elevation: {
      gain: { type: Number },
      loss: { type: Number },
    },
    difficulty: { type: String, enum: ['easy', 'moderate', 'hard', 'extreme'] },
    roadTypes: [{ type: String }],
  },

  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number },
  registrationDeadline: { type: Date },
  cancellationDeadline: { type: Date },

  startLocation: {
    name: { type: String, required: true },
    coordinates: { type: [Number], required: true },
    address: { type: String, required: true },
    landmark: { type: String },
  },
  endLocation: {
    name: { type: String },
    coordinates: { type: [Number] },
    address: { type: String },
  },

  maxParticipants: { type: Number, default: 50 },
  minParticipants: { type: Number },
  currentParticipants: { type: Number, default: 0 },
  rsvps: [RSVPSchema],
  waitlist: [{ type: Schema.Types.ObjectId, ref: 'RiderProfile' }],

  minTrustScore: { type: Number, default: 0 },
  requiredGear: [{ type: String }],
  difficulty: { type: String },
  prerequisites: [{ type: String }],

  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert', 'all_levels'],
    default: 'all_levels',
  },

  checkInEnabled: { type: Boolean, default: true },
  checkIns: [CheckInSchema],
  checkInRadius: { type: Number, default: 100 },

  fees: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    includes: [{ type: String }],
    refundPolicy: { type: String, enum: ['full', 'partial', 'none'], default: 'none' },
  },

  rewards: {
    points: { type: Number },
    badges: [{ type: String }],
    certificate: { type: Boolean },
  },

  gallery: [{ type: String }],
  photos: [{ type: String }],

  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft',
  },
  cancellationReason: { type: String },

  stats: {
    totalCheckIns: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    avgRating: { type: Number },
  },

  isFeatured: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  shareableLink: { type: String },

  tags: [{ type: String }],

}, {
  timestamps: true,
});

// Indexes for efficient querying
EventSchema.index({ slug: 1 }, { unique: true });
EventSchema.index({ organizerId: 1 });
EventSchema.index({ groupId: 1 });
EventSchema.index({ type: 1, status: 1 });
EventSchema.index({ startTime: 1, status: 1 });
EventSchema.index({ 'startLocation.coordinates': '2dsphere' });
EventSchema.index({ tags: 1 });
EventSchema.index({ isFeatured: 1, status: 1 });
EventSchema.text({ title: 'text', description: 'text' });

/**
 * Pre-save middleware - updates participant count and duration
 * @private
 */
EventSchema.pre('save', function(next) {
  this.currentParticipants = this.rsvps.filter(r => r.status === 'going').length;

  if (this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 60000);
  }

  next();
});

/**
 * RSVP to the event
 * @param {mongoose.Types.ObjectId} riderId - Rider RSVPing
 * @param {'going'|'maybe'|'not_going'} status - RSVP status
 * @returns {Promise<void>}
 * @example
 * await event.rsvp(riderId, 'going');
 */
EventSchema.methods.rsvp = async function(riderId: mongoose.Types.ObjectId, status: 'going' | 'maybe' | 'not_going') {
  const existing = this.rsvps.find(r => r.riderId.toString() === riderId.toString());

  if (existing) {
    existing.status = status;
    existing.respondedAt = new Date();
  } else {
    this.rsvps.push({
      riderId,
      status,
      respondedAt: new Date(),
    });
  }

  await this.save();
};

/**
 * Cancel RSVP for a rider
 * @param {mongoose.Types.ObjectId} riderId - Rider cancelling
 * @returns {Promise<void>}
 */
EventSchema.methods.cancelRsvp = async function(riderId: mongoose.Types.ObjectId) {
  this.rsvps = this.rsvps.filter(r => r.riderId.toString() !== riderId.toString());
  await this.save();
};

/**
 * Check in at a checkpoint
 * @param {mongoose.Types.ObjectId} riderId - Rider checking in
 * @param {'start'|'checkpoint'|'end'} type - Check-in type
 * @param {{coordinates: [number, number]; address?: string}} [location] - Location
 * @returns {Promise<void>}
 */
EventSchema.methods.checkIn = async function(
  riderId: mongoose.Types.ObjectId,
  type: 'start' | 'checkpoint' | 'end',
  location?: { coordinates: [number, number]; address?: string }
) {
  this.checkIns.push({
    riderId,
    type,
    location,
    timestamp: new Date(),
  });
  await this.save();
};

/**
 * Check if rider is organizer
 * @param {mongoose.Types.ObjectId} riderId - Rider to check
 * @returns {boolean}
 */
EventSchema.methods.isOrganizer = function(riderId: mongoose.Types.ObjectId): boolean {
  return this.organizerId.toString() === riderId.toString();
};

/**
 * Get rider's RSVP for this event
 * @param {mongoose.Types.ObjectId} riderId - Rider to check
 * @returns {IRSVP | undefined}
 */
EventSchema.methods.hasRSVP = function(riderId: mongoose.Types.ObjectId): IRSVP | undefined {
  return this.rsvps.find(r => r.riderId.toString() === riderId.toString());
};

/**
 * Find upcoming published events
 * @static
 * @param {number} [limit=20] - Number of events to return
 * @returns {Promise<IEvent[]>}
 */
EventSchema.statics.findUpcoming = function(limit = 20) {
  return this.find({
    status: 'published',
    startTime: { $gte: new Date() },
  })
    .sort({ startTime: 1 })
    .limit(limit)
    .populate('organizerId', 'displayName avatar');
};

/**
 * Find events near a location
 * @static
 * @param {[number, number]} coordinates - [lng, lat]
 * @param {number} radiusKm - Search radius in km
 * @returns {Promise<IEvent[]>}
 */
EventSchema.statics.findNearby = function(coordinates: [number, number], radiusKm: number) {
  return this.find({
    status: 'published',
    startTime: { $gte: new Date() },
    'startLocation.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: radiusKm * 1000,
      },
    },
  });
};

/**
 * Find events by group
 * @static
 * @param {mongoose.Types.ObjectId} groupId - Group ObjectId
 * @returns {Promise<IEvent[]>}
 */
EventSchema.statics.findByGroup = function(groupId: mongoose.Types.ObjectId) {
  return this.find({ groupId })
    .sort({ startTime: -1 });
};

/**
 * Event model for MongoDB
 * @constant
 * @type {mongoose.Model<IEvent>}
 */
export const Event = mongoose.model<IEvent>('Event', EventSchema);
