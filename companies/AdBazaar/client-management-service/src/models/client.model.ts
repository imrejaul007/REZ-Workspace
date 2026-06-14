import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  _id: mongoose.Types.ObjectId;
  clientId: string;
  name: string;
  industry: string;
  agencyId: string;
  status: 'active' | 'inactive' | 'prospect' | 'churned';
  contacts: mongoose.Types.ObjectId[];
  campaigns: mongoose.Types.ObjectId[];
  budget: {
    monthly: number;
    quarterly: number;
    yearly: number;
    currency: string;
  };
  spending: {
    total: number;
    currentMonth: number;
    lastMonth: number;
    ytd: number;
  };
  performance: {
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    avgCTR: number;
    avgCPC: number;
    avgROAS: number;
  };
  metadata: {
    website?: string;
    logo?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      pincode?: string;
    };
    social?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
    };
  };
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    clientId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    industry: { type: String, required: true, index: true },
    agencyId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'prospect', 'churned'],
      default: 'prospect',
      index: true,
    },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    campaigns: [{ type: Schema.Types.ObjectId, ref: 'ClientCampaign' }],
    budget: {
      monthly: { type: Number, default: 0 },
      quarterly: { type: Number, default: 0 },
      yearly: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    spending: {
      total: { type: Number, default: 0 },
      currentMonth: { type: Number, default: 0 },
      lastMonth: { type: Number, default: 0 },
      ytd: { type: Number, default: 0 },
    },
    performance: {
      totalImpressions: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
      totalConversions: { type: Number, default: 0 },
      avgCTR: { type: Number, default: 0 },
      avgCPC: { type: Number, default: 0 },
      avgROAS: { type: Number, default: 0 },
    },
    metadata: {
      website: { type: String },
      logo: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        pincode: { type: String },
      },
      social: {
        linkedin: { type: String },
        twitter: { type: String },
        facebook: { type: String },
      },
    },
    tags: [{ type: String }],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Indexes
ClientSchema.index({ name: 'text', industry: 'text' });
ClientSchema.index({ 'spending.total': -1 });
ClientSchema.index({ 'performance.avgROAS': -1 });

export const Client = mongoose.model<IClient>('Client', ClientSchema);