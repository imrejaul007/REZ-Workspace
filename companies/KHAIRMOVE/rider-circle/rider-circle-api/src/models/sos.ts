/**
 * SOS Event Model
 * MongoDB schema for emergency SOS alerts with responder tracking
 * @module models/sos
 * @author RiderCircle Team
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Responder to an SOS event
 * @interface IResponder
 */
export interface IResponder {
  /** Responder's rider ObjectId */
  riderId: mongoose.Types.ObjectId;
  /** Response status */
  status: 'pending' | 'acknowledged' | 'responding' | 'arrived' | 'declined';
  /** When responder acknowledged */
  respondedAt?: Date;
  /** When responder arrived */
  arrivedAt?: Date;
  /** Estimated time of arrival in minutes */
  eta?: number;
  /** Optional message from responder */
  message?: string;
}

/**
 * SOS Event - Emergency alert with location and responder tracking
 * @interface ISOSEvent
 * @extends Document
 */
export interface ISOSEvent extends Document {
  // Reference
  /** Rider who triggered SOS */
  riderId: mongoose.Types.ObjectId;
  /** Associated ride ObjectId */
  rideId?: mongoose.Types.ObjectId;
  /** Associated bike ObjectId */
  bikeId?: mongoose.Types.ObjectId;

  // Type & Severity
  /** Type of emergency */
  type: 'accident' | 'medical' | 'breakdown' | 'assistance' | 'safety_concern' | 'lost';
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Optional description */
  description?: string;

  // Location
  /** SOS location */
  location: {
    /** [longitude, latitude] coordinates */
    coordinates: [number, number];
    /** Reverse-geocoded address */
    address?: string;
    /** Altitude in meters */
    altitude?: number;
    /** GPS accuracy in meters */
    accuracy?: number;
  };

  // Media
  /** Photos uploaded by rider */
  photos?: string[];
  /** Voice note URL */
  voiceNote?: string;
  /** Video URL */
  video?: string;

  // Response
  /** Responders to this SOS */
  responders: IResponder[];
  /** Current SOS status */
  status: 'triggered' | 'acknowledged' | 'responding' | 'resolved' | 'cancelled' | 'expired';
  /** Resolver's rider ObjectId */
  resolvedBy?: mongoose.Types.ObjectId;
  /** Resolution description */
  resolution?: string;

  // Notifications
  /** Whether emergency contacts were notified */
  notifiedContacts: boolean;
  /** Whether emergency services were contacted */
  emergencyServicesNotified: boolean;
  /** Emergency service case ID */
  emergencyServiceCaseId?: string;

  // Convoy
  /** Convoy/group ride ID if applicable */
  convoyId?: mongoose.Types.ObjectId;
  /** Other convoy members */
  convoyMembers?: mongoose.Types.ObjectId[];

  // Timeline
  /** When SOS was triggered */
  triggeredAt: Date;
  /** When SOS was acknowledged */
  acknowledgedAt?: Date;
  /** When first responder started responding */
  firstResponderAt?: Date;
  /** When SOS was resolved */
  resolvedAt?: Date;
  /** Auto-expiry timestamp */
  expiresAt?: Date;

  // Post-incident
  /** Whether follow-up is required */
  followUpRequired: boolean;
  /** Follow-up notes */
  followUpNotes?: string;
  /** Incident report text */
  incidentReport?: string;

  // Feedback
  /** Rating 1-5 */
  rating?: number;
  /** Feedback text */
  feedback?: string;

  /** Document creation timestamp */
  createdAt: Date;
  /** Document update timestamp */
  updatedAt: Date;
}

/**
 * Responder schema
 * @private
 */
const ResponderSchema = new Schema<IResponder>({
  riderId: { type: Schema.Types.ObjectId, ref: 'RiderProfile', required: true },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'responding', 'arrived', 'declined'],
    default: 'pending',
  },
  respondedAt: { type: Date },
  arrivedAt: { type: Date },
  eta: { type: Number },
  message: { type: String },
}, { _id: false });

/**
 * Main SOS event schema
 * @private
 */
const SOSEventSchema = new Schema<ISOSEvent>({
  riderId: {
    type: Schema.Types.ObjectId,
    ref: 'RiderProfile',
    required: true,
    index: true,
  },
  rideId: { type: Schema.Types.ObjectId, ref: 'Ride' },
  bikeId: { type: Schema.Types.ObjectId, ref: 'BikeDigitalTwin' },

  type: {
    type: String,
    enum: ['accident', 'medical', 'breakdown', 'assistance', 'safety_concern', 'lost'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  description: { type: String },

  location: {
    coordinates: { type: [Number], required: true },
    address: { type: String },
    altitude: { type: Number },
    accuracy: { type: Number },
  },

  photos: [{ type: String }],
  voiceNote: { type: String },
  video: { type: String },

  responders: [ResponderSchema],
  status: {
    type: String,
    enum: ['triggered', 'acknowledged', 'responding', 'resolved', 'cancelled', 'expired'],
    default: 'triggered',
    index: true,
  },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'RiderProfile' },
  resolution: { type: String },

  notifiedContacts: { type: Boolean, default: false },
  emergencyServicesNotified: { type: Boolean, default: false },
  emergencyServiceCaseId: { type: String },

  convoyId: { type: Schema.Types.ObjectId, ref: 'Group' },
  convoyMembers: [{ type: Schema.Types.ObjectId, ref: 'RiderProfile' }],

  triggeredAt: { type: Date, default: Date.now },
  acknowledgedAt: { type: Date },
  firstResponderAt: { type: Date },
  resolvedAt: { type: Date },
  expiresAt: { type: Date },

  followUpRequired: { type: Boolean, default: false },
  followUpNotes: { type: String },
  incidentReport: { type: String },

  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },

}, {
  timestamps: true,
});

// Indexes for efficient querying
SOSEventSchema.index({ riderId: 1, status: 1 });
SOSEventSchema.index({ status: 1, triggeredAt: -1 });
SOSEventSchema.index({ 'location.coordinates': '2dsphere' });
SOSEventSchema.index({ rideId: 1 });
SOSEventSchema.index({ severity: 1, status: 1 });
// TTL index - auto-expire old resolved events after 30 days
SOSEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Acknowledge the SOS event
 * @returns {Promise<void>}
 */
SOSEventSchema.methods.acknowledge = async function() {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  await this.save();
};

/**
 * Add a responder to the SOS
 * @param {mongoose.Types.ObjectId} riderId - Responder's rider ID
 * @returns {Promise<void>}
 */
SOSEventSchema.methods.addResponder = async function(riderId: mongoose.Types.ObjectId) {
  const exists = this.responders.find(r => r.riderId.toString() === riderId.toString());
  if (!exists) {
    this.responders.push({
      riderId,
      status: 'pending',
    });
    await this.save();
  }
};

/**
 * Update a responder's status
 * @param {mongoose.Types.ObjectId} riderId - Responder's rider ID
 * @param {'acknowledged'|'responding'|'arrived'|'declined'} status - New status
 * @param {string} [message] - Optional message
 * @returns {Promise<void>}
 */
SOSEventSchema.methods.updateResponderStatus = async function(
  riderId: mongoose.Types.ObjectId,
  status: 'acknowledged' | 'responding' | 'arrived' | 'declined',
  message?: string
) {
  const responder = this.responders.find(r => r.riderId.toString() === riderId.toString());
  if (responder) {
    responder.status = status;
    responder.respondedAt = new Date();
    if (message) responder.message = message;
    if (status === 'arrived') {
      responder.arrivedAt = new Date();
    }

    // Update event status if first responder
    if (status === 'responding' && this.status === 'acknowledged') {
      this.status = 'responding';
      if (!this.firstResponderAt) {
        this.firstResponderAt = new Date();
      }
    }

    await this.save();
  }
};

/**
 * Resolve the SOS event
 * @param {mongoose.Types.ObjectId} resolvedBy - Resolver's rider ID
 * @param {string} resolution - Resolution description
 * @returns {Promise<void>}
 * @example
 * await sos.resolve(rescuerId, 'Rider safely assisted, no injuries');
 */
SOSEventSchema.methods.resolve = async function(resolvedBy: mongoose.Types.ObjectId, resolution: string) {
  this.status = 'resolved';
  this.resolvedBy = resolvedBy;
  this.resolution = resolution;
  this.resolvedAt = new Date();
  await this.save();
};

/**
 * Cancel the SOS event
 * @param {string} reason - Cancellation reason
 * @returns {Promise<void>}
 */
SOSEventSchema.methods.cancel = async function(reason: string) {
  this.status = 'cancelled';
  this.resolution = reason;
  this.resolvedAt = new Date();
  await this.save();
};

/**
 * Auto-expire the SOS event (called by TTL index or background job)
 * @returns {Promise<void>}
 */
SOSEventSchema.methods.expire = async function() {
  this.status = 'expired';
  this.resolvedAt = new Date();
  this.resolution = 'Auto-expired: No response within time limit';
  await this.save();
};

/**
 * Find all active SOS events (triggered, acknowledged, or responding)
 * @static
 * @returns {Promise<ISOSEvent[]>}
 */
SOSEventSchema.statics.findActive = function() {
  return this.find({
    status: { $in: ['triggered', 'acknowledged', 'responding'] },
  })
    .sort({ severity: -1, triggeredAt: 1 })
    .populate('riderId', 'displayName phone avatar');
};

/**
 * Find active SOS events near a location
 * @static
 * @param {[number, number]} coordinates - [lng, lat]
 * @param {number} radiusKm - Search radius in km
 * @returns {Promise<ISOSEvent[]>}
 */
SOSEventSchema.statics.findNearbyActive = function(coordinates: [number, number], radiusKm: number) {
  return this.find({
    status: { $in: ['triggered', 'acknowledged', 'responding'] },
    'location.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: radiusKm * 1000,
      },
    },
  });
};

/**
 * Get SOS statistics for a time period
 * @static
 * @param {number} [days=30] - Number of days to analyze
 * @returns {Promise<Object>} Statistics object
 * @example
 * const stats = await SOSEvent.getStats(30);
 * // { total: 45, critical: 5, high: 12, resolved: 40, avgResponseTime: 420000 }
 */
SOSEventSchema.statics.getStats = async function(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const stats = await this.aggregate([
    { $match: { triggeredAt: { $gte: since } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        avgResponseTime: { $avg: { $subtract: ['$firstResponderAt', '$triggeredAt'] } },
      },
    },
  ]);

  return stats[0] || { total: 0, critical: 0, high: 0, resolved: 0, avgResponseTime: 0 };
};

/**
 * SOS Event model for MongoDB
 * @constant
 * @type {mongoose.Model<ISOSEvent>}
 */
export const SOSEvent = mongoose.model<ISOSEvent>('SOSEvent', SOSEventSchema);
