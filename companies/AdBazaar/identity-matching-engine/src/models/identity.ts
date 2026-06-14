import mongoose, { Document, Schema } from 'mongoose';

export interface IIdentity extends Document {
  canonicalId: string;
  identifiers: {
    email?: string;
    phone?: string;
    deviceId?: string;
    userId?: string;
    cookieId?: string;
    ipAddress?: string;
    browserFingerprint?: string;
    [key: string]: string | undefined;
  };
  sources: string[];
  confidence: number;
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

const IdentitySchema = new Schema<IIdentity>(
  {
    canonicalId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    identifiers: {
      type: Map,
      of: String,
      required: true
    },
    sources: {
      type: [String],
      default: []
    },
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    },
    firstSeen: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
IdentitySchema.index({ 'identifiers.email': 1 });
IdentitySchema.index({ 'identifiers.phone': 1 });
IdentitySchema.index({ 'identifiers.deviceId': 1 });
IdentitySchema.index({ 'identifiers.userId': 1 });
IdentitySchema.index({ 'identifiers.cookieId': 1 });
IdentitySchema.index({ sources: 1 });
IdentitySchema.index({ confidence: -1 });
IdentitySchema.index({ lastSeen: -1 });

export const Identity = mongoose.model<IIdentity>('Identity', IdentitySchema);