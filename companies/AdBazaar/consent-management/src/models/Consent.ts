import mongoose, { Document, Schema } from 'mongoose';

// Consent types
export enum ConsentType {
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  PERSONALIZATION = 'personalization',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  DATA_PROCESSING = 'data_processing',
  LOCATION = 'location',
  PROFILING = 'profiling',
  COMMUNICATIONS = 'communications',
  ADVERTISING = 'advertising',
  REMARKETING = 'remarketing'
}

// Compliance frameworks
export enum ComplianceFramework {
  GDPR = 'gdpr',
  CCPA = 'ccpa',
  PDPA = 'pdpa',
  LGPD = 'lgpd'
}

export interface IConsent extends Document {
  userId: string;
  type: ConsentType;
  framework: ComplianceFramework;
  granted: boolean;
  grantedAt: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  source: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentSchema = new Schema<IConsent>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(ConsentType),
      required: true
    },
    framework: {
      type: String,
      enum: Object.values(ComplianceFramework),
      default: ComplianceFramework.GDPR
    },
    granted: {
      type: Boolean,
      required: true,
      default: false
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    withdrawnAt: {
      type: Date
    },
    expiresAt: {
      type: Date
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
    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

// Compound index for unique user+type+framework
ConsentSchema.index({ userId: 1, type: 1, framework: 1 }, { unique: true });

// Index for queries
ConsentSchema.index({ granted: 1, expiresAt: 1 });
ConsentSchema.index({ createdAt: 1 });

export const Consent = mongoose.model<IConsent>('Consent', ConsentSchema);