import mongoose, { Document, Schema } from 'mongoose';

export interface IPortalSettings {
  allowCustomDomain: boolean;
  allowSubdomains: boolean;
  maxClients: number;
  maxCampaigns: number;
  features: {
    analytics: boolean;
    reporting: boolean;
    whiteLabelReports: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  limits: {
    impressions: number;
    clicks: number;
    campaigns: number;
  };
}

export interface IWhiteLabelPortal extends Document {
  agencyId: string;
  name: string;
  slug: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: IPortalSettings;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastAccessedAt?: Date;
  };
  stats: {
    totalClients: number;
    activeCampaigns: number;
    totalImpressions: number;
    totalClicks: number;
  };
}

const PortalSettingsSchema = new Schema<IPortalSettings>(
  {
    allowCustomDomain: { type: Boolean, default: true },
    allowSubdomains: { type: Boolean, default: true },
    maxClients: { type: Number, default: 100 },
    maxCampaigns: { type: Number, default: 50 },
    features: {
      analytics: { type: Boolean, default: true },
      reporting: { type: Boolean, default: true },
      whiteLabelReports: { type: Boolean, default: true },
      customBranding: { type: Boolean, default: true },
      apiAccess: { type: Boolean, default: false },
    },
    limits: {
      impressions: { type: Number, default: 1000000 },
      clicks: { type: Number, default: 100000 },
      campaigns: { type: Number, default: 50 },
    },
  },
  { _id: false }
);

const WhiteLabelPortalSchema = new Schema<IWhiteLabelPortal>(
  {
    agencyId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    domain: { type: String, sparse: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    settings: { type: PortalSettingsSchema, default: () => ({}) },
    metadata: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      createdBy: { type: String, required: true },
      lastAccessedAt: { type: Date },
    },
    stats: {
      totalClients: { type: Number, default: 0 },
      activeCampaigns: { type: Number, default: 0 },
      totalImpressions: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
WhiteLabelPortalSchema.index({ agencyId: 1, status: 1 });
WhiteLabelPortalSchema.index({ slug: 1 }, { unique: true });
WhiteLabelPortalSchema.index({ domain: 1 }, { sparse: true });
WhiteLabelPortalSchema.index({ 'metadata.createdAt': -1 });

// Virtual for full URL
WhiteLabelPortalSchema.virtual('portalUrl').get(function () {
  if (this.domain) {
    return `https://${this.domain}`;
  }
  return `https://${this.slug}.portal.adbazaar.io`;
});

export const WhiteLabelPortal = mongoose.model<IWhiteLabelPortal>(
  'WhiteLabelPortal',
  WhiteLabelPortalSchema
);
