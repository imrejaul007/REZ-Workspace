/**
 * Group Model
 * MongoDB schema for rider groups/clubs with membership management
 * @module models/group
 * @author RiderCircle Team
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Group member record
 * @interface IGroupMember
 */
export interface IGroupMember {
  /** Rider's ObjectId */
  riderId: mongoose.Types.ObjectId;
  /** Member role in the group */
  role: 'owner' | 'admin' | 'member';
  /** When rider joined the group */
  joinedAt: Date;
  /** Membership status */
  status: 'active' | 'pending' | 'blocked';
}

/**
 * Group statistics
 * @interface IGroupStats
 */
export interface IGroupStats {
  /** Total rides organized by group */
  totalRides: number;
  /** Total distance covered by group */
  totalDistance: number;
  /** Number of upcoming events */
  upcomingEvents: number;
  /** Active member count */
  membersCount: number;
}

/**
 * Group - Rider community/club with membership and social features
 * @interface IGroup
 * @extends Document
 */
export interface IGroup extends Document {
  // Basic Info
  /** Group name */
  name: string;
  /** URL-friendly slug (unique) */
  slug: string;
  /** Group description */
  description: string;
  /** Avatar image URL */
  avatar?: string;
  /** Cover image URL */
  coverImage?: string;

  // Type & Focus
  /** Group type */
  type: 'club' | 'chapter' | 'crew' | 'community' | 'brand';
  /** Focus areas (adventure, touring, sport, etc.) */
  focus: string[];
  /** Associated motorcycle brand */
  brand?: string;

  // Location
  /** City where group is based */
  city: string;
  /** State where group is based */
  state: string;
  /** Country */
  country: string;
  /** GeoJSON location point */
  location?: {
    /** Always 'Point' for GeoJSON */
    type: 'Point';
    /** [longitude, latitude] */
    coordinates: [number, number];
  };
  /** Default meeting point */
  meetingPoint?: {
    /** Place name */
    name: string;
    /** Address */
    address: string;
    /** [lng, lat] coordinates */
    coordinates: [number, number];
  };

  // Membership
  /** List of group members */
  members: IGroupMember[];
  /** Group owner's ObjectId */
  ownerId: mongoose.Types.ObjectId;
  /** Computed member count */
  memberCount: number;

  // Settings
  /** Whether group is invite-only */
  isPrivate: boolean;
  /** Whether new members need approval */
  requiresApproval: boolean;
  /** Minimum trust score to join */
  minTrustScore: number;
  /** Maximum members allowed */
  maxMembers?: number;

  // Stats
  /** Group statistics */
  stats: IGroupStats;

  // Social
  /** Followers (non-members who follow) */
  followers: mongoose.Types.ObjectId[];
  /** Followers count */
  followersCount: number;

  // Featured Routes
  /** Featured route ObjectIds */
  featuredRoutes: mongoose.Types.ObjectId[];

  // Media
  /** Gallery image URLs */
  gallery: string[];

  // Verification
  /** Whether group is verified */
  isVerified: boolean;
  /** Verification timestamp */
  verifiedAt?: Date;

  // Status
  /** Whether group is active */
  isActive: boolean;
  /** Whether group is featured */
  isFeatured: boolean;

  /** Document creation timestamp */
  createdAt: Date;
  /** Document update timestamp */
  updatedAt: Date;
}

/**
 * Group member schema
 * @private
 */
const GroupMemberSchema = new Schema<IGroupMember>({
  riderId: { type: Schema.Types.ObjectId, ref: 'RiderProfile', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'pending', 'blocked'], default: 'active' },
}, { _id: false });

/**
 * Group stats schema
 * @private
 */
const GroupStatsSchema = new Schema<IGroupStats>({
  totalRides: { type: Number, default: 0 },
  totalDistance: { type: Number, default: 0 },
  upcomingEvents: { type: Number, default: 0 },
  membersCount: { type: Number, default: 0 },
}, { _id: false });

/**
 * Main group schema
 * @private
 */
const GroupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  avatar: { type: String },
  coverImage: { type: String },

  // Type & Focus
  type: {
    type: String,
    enum: ['club', 'chapter', 'crew', 'community', 'brand'],
    default: 'club',
  },
  focus: [{
    type: String,
    enum: ['adventure', 'touring', 'sport', 'commuter', 'electric', 'cruiser', 'offroad'],
  }],
  brand: { type: String },

  // Location
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, default: 'India' },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] },
  },
  meetingPoint: {
    name: { type: String },
    address: { type: String },
    coordinates: { type: [Number] },
  },

  // Membership
  members: [GroupMemberSchema],
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'RiderProfile',
    required: true,
  },
  memberCount: { type: Number, default: 0 },

  // Settings
  isPrivate: { type: Boolean, default: false },
  requiresApproval: { type: Boolean, default: false },
  minTrustScore: { type: Number, default: 0, min: 0, max: 100 },
  maxMembers: { type: Number },

  // Stats
  stats: {
    type: GroupStatsSchema,
    default: () => ({}),
  },

  // Social
  followers: [{ type: Schema.Types.ObjectId, ref: 'RiderProfile' }],
  followersCount: { type: Number, default: 0 },

  // Featured Routes
  featuredRoutes: [{ type: Schema.Types.ObjectId, ref: 'Ride' }],

  // Media
  gallery: [{ type: String }],

  // Verification
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },

  // Status
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

}, {
  timestamps: true,
});

// Indexes for efficient querying
GroupSchema.index({ slug: 1 }, { unique: true });
GroupSchema.index({ city: 1, state: 1 });
GroupSchema.index({ type: 1, focus: 1 });
GroupSchema.index({ 'location.coordinates': '2dsphere' });
GroupSchema.index({ followersCount: -1 });
GroupSchema.index({ isFeatured: 1, isActive: 1 });
GroupSchema.text({ name: 'text', description: 'text' });

/**
 * Pre-save middleware - updates computed counts
 * @private
 */
GroupSchema.pre('save', function(next) {
  this.memberCount = this.members.filter(m => m.status === 'active').length;
  this.followersCount = this.followers.length;
  next();
});

/**
 * Add a member to the group
 * @param {mongoose.Types.ObjectId} riderId - Rider to add
 * @param {('admin'|'member')} [role='member'] - Member role
 * @returns {Promise<void>}
 * @example
 * await group.addMember(riderId, 'admin');
 */
GroupSchema.methods.addMember = async function(riderId: mongoose.Types.ObjectId, role: 'admin' | 'member' = 'member') {
  const exists = this.members.find(m => m.riderId.toString() === riderId.toString());
  if (!exists) {
    this.members.push({
      riderId,
      role,
      joinedAt: new Date(),
      status: this.requiresApproval ? 'pending' : 'active',
    });
    await this.save();
  }
};

/**
 * Remove a member from the group
 * @param {mongoose.Types.ObjectId} riderId - Rider to remove
 * @returns {Promise<void>}
 */
GroupSchema.methods.removeMember = async function(riderId: mongoose.Types.ObjectId) {
  this.members = this.members.filter(m => m.riderId.toString() !== riderId.toString());
  await this.save();
};

/**
 * Update a member's role
 * @param {mongoose.Types.ObjectId} riderId - Rider to update
 * @param {('admin'|'member')} role - New role
 * @returns {Promise<void>}
 */
GroupSchema.methods.updateMemberRole = async function(riderId: mongoose.Types.ObjectId, role: 'admin' | 'member') {
  const member = this.members.find(m => m.riderId.toString() === riderId.toString());
  if (member && role !== 'owner') {
    member.role = role;
    await this.save();
  }
};

/**
 * Approve a pending member
 * @param {mongoose.Types.ObjectId} riderId - Rider to approve
 * @returns {Promise<void>}
 */
GroupSchema.methods.approveMember = async function(riderId: mongoose.Types.ObjectId) {
  const member = this.members.find(m => m.riderId.toString() === riderId.toString());
  if (member) {
    member.status = 'active';
    await this.save();
  }
};

/**
 * Check if a rider is the group owner
 * @param {mongoose.Types.ObjectId} riderId - Rider to check
 * @returns {boolean}
 */
GroupSchema.methods.isOwner = function(riderId: mongoose.Types.ObjectId): boolean {
  return this.ownerId.toString() === riderId.toString();
};

/**
 * Check if a rider is an admin (owner or admin role)
 * @param {mongoose.Types.ObjectId} riderId - Rider to check
 * @returns {boolean}
 */
GroupSchema.methods.isAdmin = function(riderId: mongoose.Types.ObjectId): boolean {
  const member = this.members.find(m => m.riderId.toString() === riderId.toString());
  return member?.role === 'owner' || member?.role === 'admin';
};

/**
 * Check if a rider is an active member
 * @param {mongoose.Types.ObjectId} riderId - Rider to check
 * @returns {boolean}
 */
GroupSchema.methods.isMember = function(riderId: mongoose.Types.ObjectId): boolean {
  const member = this.members.find(m => m.riderId.toString() === riderId.toString());
  return member?.status === 'active';
};

/**
 * Find groups near a location
 * @static
 * @param {[number, number]} coordinates - [lng, lat]
 * @param {number} radiusKm - Search radius in km
 * @returns {Promise<IGroup[]>}
 */
GroupSchema.statics.findNearby = function(coordinates: [number, number], radiusKm: number) {
  return this.find({
    isActive: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: radiusKm * 1000,
      },
    },
  });
};

/**
 * Find groups by focus area
 * @static
 * @param {string} focus - Focus area to search
 * @returns {Promise<IGroup[]>}
 */
GroupSchema.statics.findByFocus = function(focus: string) {
  return this.find({ focus: focus, isActive: true }).sort({ followersCount: -1 });
};

/**
 * Get featured groups
 * @static
 * @param {number} [limit=10] - Number of groups to return
 * @returns {Promise<IGroup[]>}
 */
GroupSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, isActive: true })
    .sort({ followersCount: -1 })
    .limit(limit);
};

/**
 * Group model for MongoDB
 * @constant
 * @type {mongoose.Model<IGroup>}
 */
export const Group = mongoose.model<IGroup>('Group', GroupSchema);
