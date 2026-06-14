import mongoose, { Document, Schema } from 'mongoose';

export interface IAgencySettings {
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  autoReporting: boolean;
  reportingFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface IAgencyBilling {
  billingEmail: string;
  billingAddress?: string;
  paymentTerms: 'prepaid' | 'postpaid';
  creditLimit: number;
  currentBalance: number;
  invoicingCycle: 'monthly' | 'quarterly';
}

export interface IAgency extends Document {
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  industry?: string;
  tier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'inactive';
  settings: IAgencySettings;
  billing: IAgencyBilling;
  stats: {
    totalClients: number;
    activeClients: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpend: number;
    totalRevenue: number;
  };
  apiKeys: Array<{
    key: string;
    name: string;
    permissions: string[];
    createdAt: Date;
    lastUsed?: Date;
  }>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AgencySchema = new Schema<IAgency>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      pincode: String
    },
    industry: { type: String },
    tier: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'starter'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active'
    },
    settings: {
      defaultCurrency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      autoReporting: { type: Boolean, default: true },
      reportingFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      }
    },
    billing: {
      billingEmail: { type: String },
      billingAddress: String,
      paymentTerms: {
        type: String,
        enum: ['prepaid', 'postpaid'],
        default: 'prepaid'
      },
      creditLimit: { type: Number, default: 0 },
      currentBalance: { type: Number, default: 0 },
      invoicingCycle: {
        type: String,
        enum: ['monthly', 'quarterly'],
        default: 'monthly'
      }
    },
    stats: {
      totalClients: { type: Number, default: 0 },
      activeClients: { type: Number, default: 0 },
      totalCampaigns: { type: Number, default: 0 },
      activeCampaigns: { type: Number, default: 0 },
      totalSpend: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 }
    },
    apiKeys: [{
      key: { type: String },
      name: { type: String },
      permissions: [{ type: String }],
      createdAt: { type: Date, default: Date.now },
      lastUsed: Date
    }],
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Indexes
AgencySchema.index({ email: 1 });
AgencySchema.index({ status: 1 });
AgencySchema.index({ tier: 1 });
AgencySchema.index({ 'stats.totalRevenue': -1 });
AgencySchema.index({ createdAt: -1 });

export const Agency = mongoose.model<IAgency>('Agency', AgencySchema);