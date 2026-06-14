import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISSOSession, SSOProvider } from '../types';

export interface SSOSessionDocument extends Omit<ISSOSession, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const SSOSessionSchema = new Schema<SSOSessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'microsoft', 'saml', 'ldap', 'oidc'],
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    idToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'sso_sessions',
  }
);

// Compound indexes
SSOSessionSchema.index({ userId: 1, expiresAt: 1 });
SSOSessionSchema.index({ companyId: 1, expiresAt: 1 });

// TTL index to auto-delete expired sessions (after 7 days)
SSOSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 604800 });

// Static to find active session
SSOSessionSchema.statics.findActiveSession = async function (
  sessionId: string
): Promise<SSOSessionDocument | null> {
  return this.findOne({
    sessionId,
    expiresAt: { $gt: new Date() },
  });
};

// Static to find user sessions
SSOSessionSchema.statics.findUserSessions = async function (
  userId: string
): Promise<SSOSessionDocument[]> {
  return this.find({
    userId,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActivityAt: -1 });
};

// Static to delete user sessions
SSOSessionSchema.statics.deleteUserSessions = async function (
  userId: string
): Promise<number> {
  const result = await this.deleteMany({ userId });
  return result.deletedCount;
};

// Static to cleanup expired sessions
SSOSessionSchema.statics.cleanupExpiredSessions = async function (): Promise<number> {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
};

export const SSOSession: Model<SSOSessionDocument> = mongoose.model<SSOSessionDocument>(
  'SSOSession',
  SSOSessionSchema
);
