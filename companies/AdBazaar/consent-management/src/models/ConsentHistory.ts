import mongoose, { Document, Schema } from 'mongoose';
import { ConsentType, ComplianceFramework } from './Consent';

export interface IConsentHistory extends Document {
  userId: string;
  consentType: ConsentType;
  framework: ComplianceFramework;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  action: 'granted' | 'withdrawn' | 'updated' | 'expired';
  source: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentHistorySchema = new Schema<IConsentHistory>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    consentType: {
      type: String,
      enum: Object.values(ConsentType),
      required: true
    },
    framework: {
      type: String,
      enum: Object.values(ComplianceFramework),
      default: ComplianceFramework.GDPR
    },
    changes: [
      {
        field: { type: String, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed }
      }
    ],
    action: {
      type: String,
      enum: ['granted', 'withdrawn', 'updated', 'expired'],
      required: true
    },
    source: {
      type: String,
      default: 'direct'
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Index for user history queries
ConsentHistorySchema.index({ userId: 1, timestamp: -1 });
ConsentHistorySchema.index({ userId: 1, consentType: 1, timestamp: -1 });

export const ConsentHistory = mongoose.model<IConsentHistory>('ConsentHistory', ConsentHistorySchema);