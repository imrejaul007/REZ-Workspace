/**
 * Conversion Record Model for MongoDB
 */
import mongoose from 'mongoose';

export interface IConversionRecord {
  userId: string;
  karmaUserId: string;
  action: 'checkin' | 'donation' | 'share' | 'review' | 'mission' | 'streak';
  karmaPoints: number;
  rezCoins: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  karmaScore: number;
  status: 'pending' | 'completed' | 'failed';
  idempotencyKey: string;
  createdAt: Date;
  completedAt?: Date;
}

const ConversionRecordSchema = new mongoose.Schema<IConversionRecord>(
  {
    userId: { type: String, required: true, index: true },
    karmaUserId: { type: String, required: true },
    action: {
      type: String,
      enum: ['checkin', 'donation', 'share', 'review', 'mission', 'streak'],
      required: true,
    },
    karmaPoints: { type: Number, required: true, min: 0 },
    rezCoins: { type: Number, required: true, min: 0 },
    tier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE',
    },
    karmaScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    idempotencyKey: { type: String, required: true, unique: true },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'conversion_records',
  }
);

// Compound index for user queries
ConversionRecordSchema.index({ userId: 1, createdAt: -1 });
ConversionRecordSchema.index({ status: 1, createdAt: 1 });

export const ConversionRecord = mongoose.model<IConversionRecord>(
  'ConversionRecord',
  ConversionRecordSchema
);
