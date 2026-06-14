import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceLink extends Document {
  deviceIds: [string, string];
  confidence: number;
  method: 'ip' | 'wifi' | 'cookie' | 'login' | 'fingerprint' | 'behavioral' | 'household' | 'inferred';
  evidence: {
    sharedIp?: boolean;
    sharedWifi?: boolean;
    sharedCookie?: boolean;
    loginTimestamp?: Date;
    fingerprintScore?: number;
    behavioralScore?: number;
  };
  userId?: string;
  householdId?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceLinkSchema = new Schema<IDeviceLink>(
  {
    deviceIds: {
      type: [String],
      required: true,
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    method: {
      type: String,
      enum: ['ip', 'wifi', 'cookie', 'login', 'fingerprint', 'behavioral', 'household', 'inferred'],
      required: true,
      index: true,
    },
    evidence: {
      sharedIp: Boolean,
      sharedWifi: Boolean,
      sharedCookie: Boolean,
      loginTimestamp: Date,
      fingerprintScore: Number,
      behavioralScore: Number,
    },
    userId: {
      type: String,
      index: true,
    },
    householdId: {
      type: String,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
DeviceLinkSchema.index({ deviceIds: 1, method: 1 });
DeviceLinkSchema.index({ userId: 1, confidence: -1 });
DeviceLinkSchema.index({ householdId: 1, confidence: -1 });

// TTL index for expired links
DeviceLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Unique constraint to prevent duplicate links
DeviceLinkSchema.index(
  { deviceIds: 1 },
  { unique: true, partialFilterExpression: { deviceIds: { $exists: true } } }
);

export const DeviceLink = mongoose.model<IDeviceLink>('DeviceLink', DeviceLinkSchema);