/**
 * Ride Model
 * MongoDB schema for motorcycle rides with GPS tracking, stats, and memory generation
 * @module models/ride
 * @author RiderCircle Team
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Waypoint in a ride route
 * @interface IWaypoint
 */
export interface IWaypoint {
  /** Waypoint name */
  name?: string;
  /** [longitude, latitude] coordinates */
  coordinates: [number, number];
  /** Altitude in meters */
  altitude?: number;
  /** Timestamp when waypoint was reached */
  timestamp?: Date;
  /** Type of waypoint */
  type: 'start' | 'stop' | 'fuel' | 'food' | 'viewpoint' | 'checkpoint' | 'end';
  /** Additional notes */
  notes?: string;
  /** Photos taken at waypoint */
  photos?: string[];
}

/**
 * GPS track point
 * @interface IGPSPoint
 */
export interface IGPSPoint {
  /** [longitude, latitude] coordinates */
  coordinates: [number, number];
  /** Altitude in meters */
  altitude?: number;
  /** Speed in km/h */
  speed?: number;
  /** Heading in degrees */
  heading?: number;
  /** Point timestamp */
  timestamp: Date;
  /** GPS accuracy in meters */
  accuracy?: number;
}

/**
 * Ride statistics computed after completion
 * @interface IRideStats
 */
export interface IRideStats {
  /** Total distance in km */
  distance: number;
  /** Average speed in km/h */
  avgSpeed: number;
  /** Maximum speed in km/h */
  maxSpeed: number;
  /** Average altitude in meters */
  avgAltitude: number;
  /** Maximum altitude in meters */
  maxAltitude: number;
  /** Minimum altitude in meters */
  minAltitude: number;
  /** Total elevation gain in meters */
  totalAscent: number;
  /** Total elevation loss in meters */
  totalDescent: number;
  /** Moving time in minutes */
  movingTime: number;
  /** Stopped time in minutes */
  stoppedTime: number;
  /** Fuel consumed in liters */
  fuelConsumed?: number;
}

/**
 * Ride expenses breakdown
 * @interface IRideExpenses
 */
export interface IRideExpenses {
  /** Fuel expenses */
  fuel: number;
  /** Toll charges */
  tolls: number;
  /** Food expenses */
  food: number;
  /** Accommodation expenses */
  accommodation?: number;
  /** Other expenses */
  other: number;
  /** Total expenses */
  total: number;
}

/**
 * AI-generated ride memory/story
 * @interface IRideMemory
 */
export interface IRideMemory {
  /** Memory title */
  title?: string;
  /** AI-generated story */
  story?: string;
  /** Key highlights */
  highlights?: string[];
  /** Related hashtags */
  hashtags?: string[];
  /** Cover image URL */
  coverImage?: string;
  /** Memory photos */
  photos?: string[];
  /** When memory was generated */
  generatedAt?: Date;
}

/**
 * Ride - Complete motorcycle ride record with tracking and stats
 * @interface IRide
 * @extends Document
 */
export interface IRide extends Document {
  // Ownership
  /** Rider's ObjectId */
  riderId: mongoose.Types.ObjectId;
  /** Bike's ObjectId */
  bikeId: mongoose.Types.ObjectId;

  // Ride Info
  /** Ride title */
  title: string;
  /** Ride description */
  description?: string;
  /** Ride type */
  type: 'solo' | 'group' | 'event';
  /** Group ID if group ride */
  groupId?: mongoose.Types.ObjectId;
  /** Event ID if event ride */
  eventId?: mongoose.Types.ObjectId;

  // Route
  route: {
    /** Route name */
    name?: string;
    /** GPS track points */
    track: IGPSPoint[];
    /** Route waypoints */
    waypoints: IWaypoint[];
    /** Total distance in km */
    distance: number;
    /** Elevation profile */
    elevation: {
      /** Elevation gain in meters */
      gain: number;
      /** Elevation loss in meters */
      loss: number;
    };
    /** Route difficulty */
    difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
    /** Road types (highway, mountain, city) */
    roadTypes: string[];
    /** Start location */
    startLocation: {
      /** Location name */
      name?: string;
      /** [lng, lat] coordinates */
      coordinates: [number, number];
      /** Address */
      address?: string;
    };
    /** End location */
    endLocation?: {
      /** Location name */
      name?: string;
      /** [lng, lat] coordinates */
      coordinates: [number, number];
      /** Address */
      address?: string;
    };
  };

  // Timing
  /** Actual start time */
  startTime: Date;
  /** Actual end time */
  endTime?: Date;
  /** Duration in minutes */
  duration?: number;
  /** Planned start time */
  plannedStartTime?: Date;
  /** Planned end time */
  plannedEndTime?: Date;

  // Stats
  /** Computed ride statistics */
  stats: IRideStats;

  // Companions
  /** Confirmed ride companions */
  companions: mongoose.Types.ObjectId[];
  /** Invited but not confirmed riders */
  invitedRiders: mongoose.Types.ObjectId[];

  // Safety
  /** Whether live tracking is enabled */
  liveTracking: boolean;
  /** Whether SOS is enabled */
  sosEnabled: boolean;
  /** Live tracking interval in seconds */
  liveTrackingInterval?: number;

  // Expenses
  /** Ride expenses breakdown */
  expenses: IRideExpenses;

  // Weather
  /** Auto-captured weather data */
  weather?: {
    /** Weather condition */
    condition: string;
    /** Temperature in Celsius */
    temperature?: number;
    /** Humidity percentage */
    humidity?: number;
    /** Wind speed in km/h */
    windSpeed?: number;
  };

  // Memory
  /** AI-generated ride memory */
  memory?: IRideMemory;

  // Privacy
  /** Whether ride is private */
  isPrivate: boolean;
  /** Ride tags for discovery */
  tags: string[];

  // Status
  /** Current ride status */
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled' | 'aborted';

  // Checkpoints
  /** Planned checkpoints with geofencing */
  checkpoints: {
    /** Checkpoint name */
    name: string;
    /** [lng, lat] coordinates */
    coordinates: [number, number];
    /** Geofence radius in meters */
    radius: number;
    /** When checkpoint was reached */
    reachedAt?: Date;
  }[];

  // Share
  /** Shareable link */
  shareableLink?: string;
  /** Whether route is public for discovery */
  isPublicRoute: boolean;

  /** Document creation timestamp */
  createdAt: Date;
  /** Document update timestamp */
  updatedAt: Date;
}

/**
 * GPS Point schema
 * @private
 */
const GPSPointSchema = new Schema<IGPSPoint>({
  coordinates: { type: [Number], required: true },
  altitude: { type: Number },
  speed: { type: Number },
  heading: { type: Number },
  timestamp: { type: Date, required: true },
  accuracy: { type: Number },
}, { _id: false });

/**
 * Waypoint schema
 * @private
 */
const WaypointSchema = new Schema<IWaypoint>({
  name: { type: String },
  coordinates: { type: [Number], required: true },
  altitude: { type: Number },
  timestamp: { type: Date },
  type: {
    type: String,
    enum: ['start', 'stop', 'fuel', 'food', 'viewpoint', 'checkpoint', 'end'],
    required: true,
  },
  notes: { type: String },
  photos: [{ type: String }],
}, { _id: false });

/**
 * Ride stats schema
 * @private
 */
const RideStatsSchema = new Schema<IRideStats>({
  distance: { type: Number, default: 0 },
  avgSpeed: { type: Number, default: 0 },
  maxSpeed: { type: Number, default: 0 },
  avgAltitude: { type: Number, default: 0 },
  maxAltitude: { type: Number, default: 0 },
  minAltitude: { type: Number, default: 0 },
  totalAscent: { type: Number, default: 0 },
  totalDescent: { type: Number, default: 0 },
  movingTime: { type: Number, default: 0 },
  stoppedTime: { type: Number, default: 0 },
  fuelConsumed: { type: Number },
}, { _id: false });

/**
 * Ride expenses schema
 * @private
 */
const RideExpensesSchema = new Schema<IRideExpenses>({
  fuel: { type: Number, default: 0 },
  tolls: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  accommodation: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

/**
 * Ride memory schema
 * @private
 */
const RideMemorySchema = new Schema<IRideMemory>({
  title: { type: String },
  story: { type: String },
  highlights: [{ type: String }],
  hashtags: [{ type: String }],
  coverImage: { type: String },
  photos: [{ type: String }],
  generatedAt: { type: Date },
}, { _id: false });

/**
 * Main ride schema
 * @private
 */
const RideSchema = new Schema<IRide>({
  riderId: {
    type: Schema.Types.ObjectId,
    ref: 'RiderProfile',
    required: true,
    index: true,
  },
  bikeId: {
    type: Schema.Types.ObjectId,
    ref: 'BikeDigitalTwin',
    required: true,
  },

  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  type: {
    type: String,
    enum: ['solo', 'group', 'event'],
    default: 'solo',
  },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },

  route: {
    name: { type: String },
    track: [GPSPointSchema],
    waypoints: [WaypointSchema],
    distance: { type: Number, default: 0 },
    elevation: {
      gain: { type: Number, default: 0 },
      loss: { type: Number, default: 0 },
    },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'hard', 'extreme'],
      default: 'moderate',
    },
    roadTypes: [{ type: String }],
    startLocation: {
      name: { type: String },
      coordinates: { type: [Number], required: true },
      address: { type: String },
    },
    endLocation: {
      name: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },
    },
  },

  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number },
  plannedStartTime: { type: Date },
  plannedEndTime: { type: Date },

  stats: {
    type: RideStatsSchema,
    default: () => ({}),
  },

  companions: [{ type: Schema.Types.ObjectId, ref: 'RiderProfile' }],
  invitedRiders: [{ type: Schema.Types.ObjectId, ref: 'RiderProfile' }],

  liveTracking: { type: Boolean, default: false },
  sosEnabled: { type: Boolean, default: true },
  liveTrackingInterval: { type: Number, default: 30 },

  expenses: {
    type: RideExpensesSchema,
    default: () => ({}),
  },

  weather: {
    condition: { type: String },
    temperature: { type: Number },
    humidity: { type: Number },
    windSpeed: { type: Number },
  },

  memory: {
    type: RideMemorySchema,
  },

  isPrivate: { type: Boolean, default: true },
  tags: [{ type: String }],
  isPublicRoute: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['planned', 'active', 'paused', 'completed', 'cancelled', 'aborted'],
    default: 'planned',
    index: true,
  },

  checkpoints: [{
    name: { type: String, required: true },
    coordinates: { type: [Number], required: true },
    radius: { type: Number, default: 100 },
    reachedAt: { type: Date },
  }],

  shareableLink: { type: String, unique: true, sparse: true },

}, {
  timestamps: true,
});

// Indexes for efficient querying
RideSchema.index({ riderId: 1, status: 1 });
RideSchema.index({ riderId: 1, startTime: -1 });
RideSchema.index({ groupId: 1, status: 1 });
RideSchema.index({ eventId: 1 });
RideSchema.index({ 'route.startLocation.coordinates': '2dsphere' });
RideSchema.index({ 'route.endLocation.coordinates': '2dsphere' });
RideSchema.index({ isPublicRoute: 1, status: 1 });
RideSchema.index({ status: 1, startTime: -1 });
RideSchema.index({ tags: 1 });
RideSchema.text({ title: 'text', description: 'text' });

/**
 * Start the ride - sets status to active and enables live tracking
 * @returns {Promise<void>}
 * @example
 * const ride = await Ride.findById(id);
 * await ride.startRide();
 */
RideSchema.methods.startRide = async function() {
  this.status = 'active';
  this.startTime = new Date();
  this.liveTracking = true;
  await this.save();
};

/**
 * Pause the ride temporarily
 * @returns {Promise<void>}
 */
RideSchema.methods.pauseRide = async function() {
  this.status = 'paused';
  await this.save();
};

/**
 * Resume a paused ride
 * @returns {Promise<void>}
 */
RideSchema.methods.resumeRide = async function() {
  this.status = 'active';
  await this.save();
};

/**
 * Complete the ride and compute final stats
 * @returns {Promise<void>}
 */
RideSchema.methods.completeRide = async function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.liveTracking = false;

  if (this.startTime) {
    this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 60000);
  }

  await this.save();
};

/**
 * Abort the ride (emergency stop)
 * @returns {Promise<void>}
 */
RideSchema.methods.abortRide = async function() {
  this.status = 'aborted';
  this.endTime = new Date();
  this.liveTracking = false;
  await this.save();
};

/**
 * Add a GPS track point to the route
 * @param {IGPSPoint} point - GPS point to add
 * @returns {Promise<void>}
 */
RideSchema.methods.addTrackPoint = async function(point: IGPSPoint) {
  this.route.track.push(point);
  await this.save();
};

/**
 * Add a waypoint to the route
 * @param {IWaypoint} waypoint - Waypoint to add
 * @returns {Promise<void>}
 */
RideSchema.methods.addWaypoint = async function(waypoint: IWaypoint) {
  this.route.waypoints.push(waypoint);
  await this.save();
};

/**
 * Set AI-generated memory/story for the ride
 * @param {IRideMemory} memory - Memory data
 * @returns {Promise<void>}
 */
RideSchema.methods.setMemory = async function(memory: IRideMemory) {
  this.memory = memory;
  await this.save();
};

/**
 * Find all active rides
 * @static
 * @returns {Promise<IRide[]>}
 */
RideSchema.statics.findActiveRides = function() {
  return this.find({ status: 'active' });
};

/**
 * Find rides near a location
 * @static
 * @param {[number, number]} coordinates - [lng, lat]
 * @param {number} radiusKm - Search radius in km
 * @returns {Promise<IRide[]>}
 */
RideSchema.statics.findNearbyRides = function(coordinates: [number, number], radiusKm: number) {
  return this.find({
    status: 'active',
    'route.startLocation.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: radiusKm * 1000,
      },
    },
  });
};

/**
 * Get popular public routes
 * @static
 * @param {number} [limit=20] - Number of routes to return
 * @returns {Promise<IRide[]>}
 */
RideSchema.statics.getPublicRoutes = function(limit = 20) {
  return this.find({ isPublicRoute: true, status: 'completed' })
    .sort({ 'stats.distance': -1, startTime: -1 })
    .limit(limit)
    .populate('riderId', 'displayName avatar');
};

/**
 * Ride model for MongoDB
 * @constant
 * @type {mongoose.Model<IRide>}
 */
export const Ride = mongoose.model<IRide>('Ride', RideSchema);
