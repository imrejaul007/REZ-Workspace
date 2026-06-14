import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginAttemptDocument extends Document {
  userId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  method: 'totp' | 'backup_code' | 'sms' | 'recovery';
  city?: string;
  country?: string;
  anomalyDetected: boolean;
  anomalyTypes: string[];
  metadata?: Record<string, unknown>;
}

const LoginAttemptSchema = new Schema<ILoginAttemptDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    method: {
      type: String,
      enum: ['totp', 'backup_code', 'sms', 'recovery'],
      required: true,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    anomalyDetected: {
      type: Boolean,
      default: false,
    },
    anomalyTypes: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: false,
    collection: 'login_attempts',
  }
);

// Compound indexes for efficient queries
LoginAttemptSchema.index({ userId: 1, timestamp: -1 });
LoginAttemptSchema.index({ userId: 1, ipAddress: 1, timestamp: -1 });
LoginAttemptSchema.index({ userId: 1, city: 1, timestamp: -1 });
LoginAttemptSchema.index({ timestamp: -1 }); // For cleanup

// TTL index - automatically delete records older than 90 days
LoginAttemptSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

export const LoginAttempt = mongoose.model<ILoginAttemptDocument>(
  'LoginAttempt',
  LoginAttemptSchema
);
