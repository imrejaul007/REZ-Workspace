import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  type: 'mobile' | 'tablet' | 'desktop' | 'smart_tv' | 'smart_watch' | 'iot' | 'other';
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web' | 'tvos' | 'other';
  userId?: string;
  householdId?: string;
  identifiers: {
    idfa?: string;
    gaid?: string;
    androidId?: string;
    cookieId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  attributes: {
    screenWidth?: number;
    screenHeight?: number;
    browser?: string;
    osVersion?: string;
    appVersion?: string;
    manufacturer?: string;
    model?: string;
  };
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'smart_tv', 'smart_watch', 'iot', 'other'],
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'windows', 'macos', 'linux', 'web', 'tvos', 'other'],
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    householdId: {
      type: String,
      index: true,
    },
    identifiers: {
      idfa: String,
      gaid: String,
      androidId: String,
      cookieId: String,
      ipAddress: String,
      userAgent: String,
    },
    attributes: {
      screenWidth: Number,
      screenHeight: Number,
      browser: String,
      osVersion: String,
      appVersion: String,
      manufacturer: String,
      model: String,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
DeviceSchema.index({ userId: 1, isActive: 1 });
DeviceSchema.index({ householdId: 1, isActive: 1 });
DeviceSchema.index({ 'identifiers.idfa': 1 });
DeviceSchema.index({ 'identifiers.gaid': 1 });
DeviceSchema.index({ 'identifiers.androidId': 1 });
DeviceSchema.index({ 'identifiers.cookieId': 1 });
DeviceSchema.index({ type: 1, platform: 1 });

// TTL index to auto-remove inactive devices after 1 year
DeviceSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);