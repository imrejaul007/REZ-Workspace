import mongoose, { Document, Schema } from 'mongoose';
import { ConsentType, ComplianceFramework } from './Consent';

export interface IConsentAudit extends Document {
  userId: string;
  consentType: ConsentType;
  framework: ComplianceFramework;
  action: 'granted' | 'withdrawn' | 'updated' | 'exported' | 'deleted' | 'accessed';
  actor: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  details?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentAuditSchema = new Schema<IConsentAudit>(
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
    action: {
      type: String,
      enum: ['granted', 'withdrawn', 'updated', 'exported', 'deleted', 'accessed'],
      required: true
    },
    actor: {
      type: String,
      required: true,
      default: 'user'
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    },
    requestId: {
      type: String,
      index: true
    },
    details: {
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

// Indexes for audit queries
ConsentAuditSchema.index({ userId: 1, timestamp: -1 });
ConsentAuditSchema.index({ action: 1, timestamp: -1 });
ConsentAuditSchema.index({ timestamp: -1 });

export const ConsentAudit = mongoose.model<IConsentAudit>('ConsentAudit', ConsentAuditSchema);