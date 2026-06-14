import mongoose, { Schema, Document } from 'mongoose';

export interface IRecoveryRequestDocument extends Document {
  userId: string;
  requestId: string;
  method: 'email' | 'sms' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'completed';
  verificationCode?: string;
  expiresAt: Date;
  createdAt: Date;
  completedAt?: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  metadata?: Record<string, unknown>;
}

const RecoveryRequestSchema = new Schema<IRecoveryRequestDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['email', 'sms', 'admin'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired', 'completed'],
      default: 'pending',
    },
    verificationCode: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    verifiedBy: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'recovery_requests',
  }
);

// Index for cleanup and lookup
RecoveryRequestSchema.index({ status: 1, expiresAt: 1 });
RecoveryRequestSchema.index({ userId: 1, createdAt: -1 });

// TTL index - expire completed/expired requests after 24 hours
RecoveryRequestSchema.index(
  { completedAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60, partialFilterExpression: { completedAt: { $exists: true } } }
);

// Static method to clean up expired pending requests
RecoveryRequestSchema.statics.cleanupExpiredRequests = async function (): Promise<number> {
  const result = await this.updateMany(
    { status: 'pending', expiresAt: { $lt: new Date() } },
    { status: 'expired' }
  );
  return result.modifiedCount;
};

export const RecoveryRequest = mongoose.model<IRecoveryRequestDocument>(
  'RecoveryRequest',
  RecoveryRequestSchema
);
