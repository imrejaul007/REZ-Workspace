import mongoose, { Document, Schema } from 'mongoose';

// Consent purpose interface
export interface IConsentPurpose {
  category: 'treatment' | 'billing' | 'research' | 'marketing' | 'third-party' | 'emergency';
  description: string;
  allowed: boolean;
}

// Granted entity interface
export interface IGrantedEntity {
  entityId: string;
  entityType: 'provider' | 'organization' | 'app';
  entityName: string;
  permissions: string[];
  grantedAt: Date;
  expiresAt?: Date;
}

// Consent audit interface
export interface IConsentAudit {
  action: 'granted' | 'revoked' | 'modified' | 'expired' | 'accessed';
  performedBy: string;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

// Healthcare consent document interface
export interface IHealthcareConsent extends Document {
  id: string;
  profileId: string;
  consentType: 'hipaa' | 'general' | 'treatment' | 'privacy' | 'data-sharing' | 'telehealth';
  version: string;
  status: 'active' | 'revoked' | 'expired' | 'pending';
  purposes: IConsentPurpose[];
  grantedEntities: IGrantedEntity[];
  grantedAt?: Date;
  grantedVia?: 'web' | 'mobile' | 'verbal' | 'written' | 'api';
  expiresAt?: Date;
  lastVerifiedAt?: Date;
  verificationFrequency?: number; // days
  ipAddress?: string;
  userAgent?: string;
  signatures: Array<{
    signedBy: string;
    signature: string;
    signedAt: Date;
    method: 'electronic' | 'manual' | 'verbal';
  }>;
  documents: Array<{
    documentId: string;
    documentType: string;
    url?: string;
    hash?: string;
  }>;
  auditLog: IConsentAudit[];
  revokedAt?: Date;
  revocationReason?: string;
  revokedBy?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Healthcare consent schema
const ConsentPurposeSchema = new Schema<IConsentPurpose>({
  category: {
    type: String,
    enum: ['treatment', 'billing', 'research', 'marketing', 'third-party', 'emergency'],
    required: true
  },
  description: { type: String, required: true },
  allowed: { type: Boolean, required: true }
}, { _id: false });

const GrantedEntitySchema = new Schema<IGrantedEntity>({
  entityId: { type: String, required: true },
  entityType: {
    type: String,
    enum: ['provider', 'organization', 'app'],
    required: true
  },
  entityName: { type: String, required: true },
  permissions: [{ type: String }],
  grantedAt: { type: Date, required: true },
  expiresAt: Date
}, { _id: false });

const ConsentAuditSchema = new Schema<IConsentAudit>({
  action: {
    type: String,
    enum: ['granted', 'revoked', 'modified', 'expired', 'accessed'],
    required: true
  },
  performedBy: { type: String, required: true },
  performedAt: { type: Date, required: true },
  ipAddress: String,
  userAgent: String,
  reason: String,
  previousValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed
}, { _id: false });

const HealthcareConsentSchema = new Schema<IHealthcareConsent>(
  {
    id: { type: String, required: true, unique: true, index: true },
    profileId: { type: String, required: true, index: true },
    consentType: {
      type: String,
      enum: ['hipaa', 'general', 'treatment', 'privacy', 'data-sharing', 'telehealth'],
      required: true
    },
    version: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'revoked', 'expired', 'pending'],
      default: 'pending'
    },
    purposes: [ConsentPurposeSchema],
    grantedEntities: [GrantedEntitySchema],
    grantedAt: Date,
    grantedVia: {
      type: String,
      enum: ['web', 'mobile', 'verbal', 'written', 'api']
    },
    expiresAt: Date,
    lastVerifiedAt: Date,
    verificationFrequency: Number,
    ipAddress: String,
    userAgent: String,
    signatures: [{
      signedBy: { type: String, required: true },
      signature: { type: String, required: true },
      signedAt: { type: Date, required: true },
      method: {
        type: String,
        enum: ['electronic', 'manual', 'verbal'],
        default: 'electronic'
      }
    }],
    documents: [{
      documentId: { type: String, required: true },
      documentType: { type: String, required: true },
      url: String,
      hash: String
    }],
    auditLog: [ConsentAuditSchema],
    revokedAt: Date,
    revocationReason: String,
    revokedBy: String,
    metadata: Schema.Types.Mixed
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
HealthcareConsentSchema.index({ profileId: 1, consentType: 1 });
HealthcareConsentSchema.index({ profileId: 1, status: 1 });
HealthcareConsentSchema.index({ 'grantedEntities.entityId': 1 });
HealthcareConsentSchema.index({ expiresAt: 1 });

export const HealthcareConsent = mongoose.model<IHealthcareConsent>(
  'HealthcareConsent',
  HealthcareConsentSchema
);
