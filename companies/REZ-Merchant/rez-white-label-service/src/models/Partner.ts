import mongoose, { Schema, Document } from 'mongoose';

export type PartnerStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type PlanType = 'starter' | 'professional' | 'enterprise';

export interface IPartner extends Document {
  _id: mongoose.Types.ObjectId;
  partnerName: string;
  partnerEmail: string;
  domain: string;
  brandName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  plan: PlanType;
  status: PartnerStatus;
  config: IPartnerConfig;
  modules: string[];
  apiKeys: IAPIKey[];
  usage: IUsage;
  trialEndsAt?: Date;
  subscribedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPartnerConfig {
  customDomain: boolean;
  customBranding: boolean;
  customPricing: boolean;
  customFeatures: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  webhookSupport: boolean;
  dedicatedSupport: boolean;
  analyticsAccess: boolean;
}

export interface IAPIKey {
  key: string;
  name: string;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
  active: boolean;
}

export interface IUsage {
  apiCalls: number;
  storage: number; // MB
  bandwidth: number; // GB
  users: number;
  transactions: number;
  month: Date;
}

const PartnerConfigSchema = new Schema({
  customDomain: { type: Boolean, default: true },
  customBranding: { type: Boolean, default: true },
  customPricing: { type: Boolean, default: false },
  customFeatures: { type: Boolean, default: false },
  whiteLabel: { type: Boolean, default: true },
  apiAccess: { type: Boolean, default: true },
  webhookSupport: { type: Boolean, default: true },
  dedicatedSupport: { type: Boolean, default: false },
  analyticsAccess: { type: Boolean, default: true }
}, { _id: false });

const APIKeySchema = new Schema({
  key: { type: String, required: true },
  name: { type: String, required: true },
  permissions: [String],
  createdAt: { type: Date, default: Date.now },
  lastUsed: Date,
  active: { type: Boolean, default: true }
}, { _id: false });

const UsageSchema = new Schema({
  apiCalls: { type: Number, default: 0 },
  storage: { type: Number, default: 0 },
  bandwidth: { type: Number, default: 0 },
  users: { type: Number, default: 0 },
  transactions: { type: Number, default: 0 },
  month: { type: Date, default: Date.now }
}, { _id: false });

const PartnerSchema = new Schema({
  partnerName: { type: String, required: true },
  partnerEmail: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  brandName: { type: String, required: true },
  logo: { type: String, default: '' },
  primaryColor: { type: String, default: '#FF5722' },
  secondaryColor: { type: String, default: '#4CAF50' },
  plan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    default: 'starter'
  },
  status: {
    type: String,
    enum: ['trial', 'active', 'suspended', 'cancelled'],
    default: 'trial'
  },
  config: { type: PartnerConfigSchema, default: () => ({}) },
  modules: [String],
  apiKeys: [APIKeySchema],
  usage: { type: UsageSchema, default: () => ({}) },
  trialEndsAt: Date,
  subscribedAt: Date,
  cancelledAt: Date
}, { timestamps: true });

PartnerSchema.index({ domain: 1 }, { unique: true });
PartnerSchema.index({ partnerEmail: 1 });

export const Partner = mongoose.models.Partner ||
  mongoose.model<IPartner>('Partner', PartnerSchema);
