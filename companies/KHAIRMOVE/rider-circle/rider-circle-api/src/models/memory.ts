/**
 * Ride Memory Model
 * MongoDB schema for AI-generated ride memories/stories with social features
 * @module models/memory
 * @author RiderCircle Team
 * @version 1.0.0
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Ride memory record with AI-generated content
 * @interface IRideMemory
 */
export interface IRideMemory {
  /** Associated ride ObjectId */
  rideId: Types.ObjectId;
  /** Rider who owns this memory */
  riderId: Types.ObjectId;
  /** Memory title */
  title: string;
  /** AI-generated story */
  story: string;
  /** Key highlights from the ride */
  highlights: string[];
  /** Related hashtags */
  hashtags: string[];
  /** Cover image URL */
  coverImage?: string;
  /** Memory photos */
  photos: string[];
  /** Video URL */
  video?: string;
  /** Ride statistics snapshot */
  stats: {
    /** Distance in km */
    distance: number;
    /** Duration in minutes */
    duration: number;
    /** Maximum speed in km/h */
    maxSpeed: number;
    /** Average speed in km/h */
    avgSpeed: number;
    /** Elevation profile */
    elevation: {
      /** Total gain in meters */
      gain: number;
      /** Total loss in meters */
      loss: number;
    };
    /** Fuel cost in INR */
    fuelCost?: number;
    /** Total trip cost in INR */
    totalCost?: number;
  };
  /** Route snapshot */
  route: {
    /** Route name */
    name?: string;
    /** Start location name */
    startLocation: string;
    /** End location name */
    endLocation?: string;
    /** Number of waypoints */
    waypointsCount: number;
  };
  /** Weather during ride */
  weather?: {
    /** Weather condition */
    condition: string;
    /** Temperature in Celsius */
    temperature?: number;
  };
  /** Ride companions */
  companions: {
    /** Companion's rider ObjectId */
    riderId: Types.ObjectId;
    /** Companion's display name */
    displayName: string;
    /** Companion's avatar URL */
    avatar?: string;
  }[];
  /** Whether memory was AI-generated */
  aiGenerated: boolean;
  /** When AI generated the memory */
  generatedAt: Date;
  /** AI model used for generation */
  modelName?: string;
  /** Whether memory is public */
  isPublic: boolean;
  /** Whether memory is featured */
  isFeatured: boolean;
  /** Shareable link */
  shareableLink?: string;
  /** Share count */
  shareCount: number;
  /** Users who liked this memory */
  likes: Types.ObjectId[];
  /** Likes count */
  likesCount: number;
  /** Comments count */
  commentsCount: number;
  /** Memory tags */
  tags: string[];
  /** Document creation timestamp */
  createdAt: Date;
  /** Document update timestamp */
  updatedAt: Date;
}

/**
 * Ride memory document interface with methods
 * @interface IRideMemoryDocument
 * @extends IRideMemory
 * @extends Document
 */
interface IRideMemoryDocument extends Omit<IRideMemory, '_id'>, Document {
  /** Toggle like for a rider */
  like(riderId: Types.ObjectId): Promise<boolean>;
  /** Increment share count */
  incrementShare(): Promise<void>;
}

/**
 * Main ride memory schema
 * @private
 */
const RideMemorySchema = new Schema<IRideMemoryDocument>({
  rideId: {
    type: Schema.Types.ObjectId,
    ref: 'Ride',
    required: true,
    unique: true,
    index: true,
  },
  riderId: {
    type: Schema.Types.ObjectId,
    ref: 'RiderProfile',
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  story: { type: String, required: true },
  highlights: [{ type: String }],
  hashtags: [{ type: String }],
  coverImage: { type: String },
  photos: [{ type: String }],
  video: { type: String },
  stats: {
    distance: { type: Number },
    duration: { type: Number },
    maxSpeed: { type: Number },
    avgSpeed: { type: Number },
    elevation: {
      gain: { type: Number },
      loss: { type: Number },
    },
    fuelCost: { type: Number },
    totalCost: { type: Number },
  },
  route: {
    name: { type: String },
    startLocation: { type: String },
    endLocation: { type: String },
    waypointsCount: { type: Number },
  },
  weather: {
    condition: { type: String },
    temperature: { type: Number },
  },
  companions: [{
    riderId: { type: Schema.Types.ObjectId, ref: 'RiderProfile' },
    displayName: { type: String },
    avatar: { type: String },
  }],
  aiGenerated: { type: Boolean, default: true },
  generatedAt: { type: Date },
  modelName: { type: String },
  isPublic: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  shareableLink: { type: String },
  shareCount: { type: Number, default: 0 },
  likes: [{ type: Schema.Types.ObjectId, ref: 'RiderProfile' }],
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  tags: [{ type: String }],
}, {
  timestamps: true,
});

// Indexes for efficient querying
RideMemorySchema.index({ riderId: 1, createdAt: -1 });
RideMemorySchema.index({ isPublic: 1, isFeatured: 1 });
RideMemorySchema.index({ 'route.startLocation': 1 });
RideMemorySchema.index({ tags: 1 });
RideMemorySchema.index({ likesCount: -1 });
RideMemorySchema.text({ title: 'text', story: 'text', hashtags: 'text' });

/**
 * Pre-save middleware - updates computed counts and generates shareable link
 * @private
 */
RideMemorySchema.pre('save', function(next) {
  this.likesCount = this.likes.length;
  if (!this.shareableLink) {
    this.shareableLink = `memory/${this._id}`;
  }
  if (!this.generatedAt && this.aiGenerated) {
    this.generatedAt = new Date();
  }
  next();
});

/**
 * Toggle like for a rider
 * @param {Types.ObjectId} riderId - Rider liking/unliking
 * @returns {Promise<boolean>} True if liked, false if unliked
 * @example
 * const liked = await memory.like(riderId);
 * // liked = true (now liked)
 */
RideMemorySchema.methods.like = async function(riderId: Types.ObjectId): Promise<boolean> {
  const alreadyLiked = this.likes.some(id => id.toString() === riderId.toString());

  if (alreadyLiked) {
    this.likes = this.likes.filter(id => id.toString() !== riderId.toString());
  } else {
    this.likes.push(riderId);
  }

  await this.save();
  return !alreadyLiked;
};

/**
 * Increment share count
 * @returns {Promise<void>}
 */
RideMemorySchema.methods.incrementShare = async function(): Promise<void> {
  this.shareCount += 1;
  await this.save();
};

/**
 * Find memories by rider
 * @static
 * @param {Types.ObjectId} riderId - Rider ObjectId
 * @param {number} [limit=10] - Number of memories to return
 * @returns {Promise<IRideMemoryDocument[]>}
 */
RideMemorySchema.statics.findByRider = function(riderId: Types.ObjectId, limit = 10) {
  return this.find({ riderId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Find public memories
 * @static
 * @param {number} [limit=20] - Number of memories to return
 * @param {number} [offset=0] - Skip count
 * @returns {Promise<IRideMemoryDocument[]>}
 */
RideMemorySchema.statics.findPublic = function(limit = 20, offset = 0) {
  return this.find({ isPublic: true })
    .populate('riderId', 'displayName avatar')
    .sort({ likesCount: -1, createdAt: -1 })
    .skip(offset)
    .limit(limit);
};

/**
 * Find featured memories
 * @static
 * @returns {Promise<IRideMemoryDocument[]>}
 */
RideMemorySchema.statics.findFeatured = function() {
  return this.find({ isPublic: true, isFeatured: true })
    .populate('riderId', 'displayName avatar')
    .sort({ likesCount: -1 })
    .limit(10);
};

/**
 * Find memories by location
 * @static
 * @param {string} location - Location name to search
 * @returns {Promise<IRideMemoryDocument[]>}
 */
RideMemorySchema.statics.findByLocation = function(location: string) {
  return this.find({
    isPublic: true,
    $or: [
      { 'route.startLocation': { $regex: location, $options: 'i' } },
      { 'route.endLocation': { $regex: location, $options: 'i' } },
    ],
  })
    .populate('riderId', 'displayName avatar')
    .sort({ createdAt: -1 })
    .limit(20);
};

/**
 * Find memories by tag
 * @static
 * @param {string} tag - Tag to search
 * @returns {Promise<IRideMemoryDocument[]>}
 */
RideMemorySchema.statics.findByTag = function(tag: string) {
  return this.find({
    isPublic: true,
    tags: tag,
  })
    .populate('riderId', 'displayName avatar')
    .sort({ likesCount: -1 })
    .limit(20);
};

/**
 * Ride Memory model for MongoDB
 * @constant
 * @type {mongoose.Model<IRideMemoryDocument>}
 */
export const RideMemory = mongoose.model<IRideMemoryDocument>('RideMemory', RideMemorySchema);
