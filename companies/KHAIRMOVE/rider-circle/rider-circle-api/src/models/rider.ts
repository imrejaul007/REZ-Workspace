/**
 * Rider Profile Model
 * MongoDB schema for rider profiles with SafeQR, trust scores, and social features
 *
 * @module models/rider
 */

import mongoose, { Document, Schema } from 'mongoose';

// ============================================================================
// Type Definitions
// ============================================================================

/** Emergency contact information */
export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

/** Badge earned by rider */
export interface IBadge {
  id: string;
  name: string;
  icon: string;
  earnedAt: Date;
  description: string;
}

/** Rider profile document interface */
export interface IRiderProfile extends Document {
  // User reference (from RABTUL Auth)
  userId: string;

  // Basic Info
  displayName: string;
  phone: string;
  email?: string;
  avatar?: string;
  bio?: string;

  // SafeQR Data
  safeQRCode: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalNotes?: string;
  emergencyContacts: IEmergencyContact[];

  // Riding Profile
  bikes: mongoose.Types.ObjectId[];
  ridingStyle: 'commuter' | 'tourer' | 'adventure' | 'sport';
  experience: 'beginner' | 'intermediate' | 'expert';
  totalRides: number;
  totalDistance: number;

  // Trust & Reputation
  trustScore: number;
  verifiedRides: number;
  badges: IBadge[];

  // Location
  homeLocation?: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };

  // Social
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  followersCount: number;
  followingCount: number;

  // Stats
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  /** Increment ride statistics after completing a ride */
  incrementRideStats(distance: number): Promise<void>;

  /** Add a badge to the rider's profile */
  addBadge(badge: IBadge): Promise<void>;
}

// ============================================================================
// Schema Definitions
// ============================================================================

const EmergencyContactSchema = new Schema<IEmergencyContact>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
}, { _id: false });

const BadgeSchema = new Schema<IBadge>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
  description: { type: String },
}, { _id: false });

const RiderProfileSchema = new Schema<IRiderProfile>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  avatar: { type: String },
  bio: { type: String, maxlength: 500 },

  // SafeQR Data
  safeQRCode: { type: String, required: true, unique: true },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  allergies: [{ type: String }],
  medicalNotes: { type: String },
  emergencyContacts: [EmergencyContactSchema],

  // Riding Profile
  bikes: [{ type: Schema.Types.ObjectId, ref: 'Bike' }],
  ridingStyle: {
    type: String,
    enum: ['commuter', 'tourer', 'adventure', 'sport'],
    default: 'tourer',
  },
  experience: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    default: 'beginner',
  },
  totalRides: { type: Number, default: 0 },
  totalDistance: { type: Number, default: 0 },

  // Trust & Reputation
  trustScore: { type: Number, default: 50, min: 0, max: 100 },
  verifiedRides: { type: Number, default: 0 },
  badges: [BadgeSchema],

  // Location
  homeLocation: {
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
  },

  // Social
  followers: [{ type: Schema.Types.ObjectId, ref: 'RiderProfile' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'RiderProfile' }],
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },

}, {
  timestamps: true,
});

// ============================================================================
// Indexes
// ============================================================================

RiderProfileSchema.index({ 'homeLocation.coordinates': '2dsphere' });
RiderProfileSchema.index({ trustScore: -1 });
RiderProfileSchema.index({ totalDistance: -1 });
RiderProfileSchema.index({ displayName: 'text', bio: 'text' });

// ============================================================================
// Pre-save Middleware
// ============================================================================

/**
 * Updates followers and following counts before saving
 */
RiderProfileSchema.pre('save', function(next) {
  this.followersCount = this.followers.length;
  this.followingCount = this.following.length;
  next();
});

// ============================================================================
// Instance Methods
// ============================================================================

/**
 * Increment ride statistics after completing a ride
 * @param distance - Distance covered in kilometers
 */
RiderProfileSchema.methods.incrementRideStats = async function(distance: number) {
  this.totalRides += 1;
  this.totalDistance += distance;
  await this.save();
};

/**
 * Add a badge to the rider's profile (prevents duplicates)
 * @param badge - Badge object to add
 */
RiderProfileSchema.methods.addBadge = async function(badge: IBadge) {
  const exists = this.badges.find(b => b.id === badge.id);
  if (!exists) {
    this.badges.push(badge);
    await this.save();
  }
};

// ============================================================================
// Static Methods
// ============================================================================

/**
 * Find riders near a given location
 * @param coordinates - [longitude, latitude]
 * @param maxDistance - Maximum distance in kilometers
 */
RiderProfileSchema.statics.findNearby = async function(
  coordinates: [number, number],
  maxDistance: number
) {
  return this.find({
    'homeLocation.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates,
        },
        $maxDistance: maxDistance * 1000,
      },
    },
  });
};

// ============================================================================
// Export
// ============================================================================

export const RiderProfile = mongoose.model<IRiderProfile>('RiderProfile', RiderProfileSchema);
