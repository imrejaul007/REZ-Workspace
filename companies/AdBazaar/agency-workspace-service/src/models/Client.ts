import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClientBudget {
  monthly: number;
  total: number;
  currency: string;
}

export interface IClientContactPerson {
  name: string;
  email: string;
  phone: string;
}

export interface IClientCampaign {
  campaignId: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spend: number;
  startDate: Date;
  endDate?: Date;
}

export interface IClient extends Document {
  agencyId: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  industry?: string;
  contactPerson?: IClientContactPerson;
  budget: IClientBudget;
  spendingLimit: number;
  totalSpend: number;
  campaigns: IClientCampaign[];
  status: 'active' | 'paused' | 'inactive';
  notes?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },
    company: { type: String },
    industry: { type: String },
    contactPerson: {
      name: { type: String },
      email: { type: String },
      phone: { type: String }
    },
    budget: {
      monthly: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' }
    },
    spendingLimit: { type: Number },
    totalSpend: { type: Number, default: 0 },
    campaigns: [{
      campaignId: { type: String },
      name: { type: String },
      status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'completed'],
        default: 'draft'
      },
      budget: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
      startDate: { type: Date },
      endDate: Date
    }],
    status: {
      type: String,
      enum: ['active', 'paused', 'inactive'],
      default: 'active'
    },
    notes: { type: String },
    tags: [{ type: String }],
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Indexes
ClientSchema.index({ agencyId: 1 });
ClientSchema.index({ email: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ company: 1 });
ClientSchema.index({ 'budget.total': -1 });
ClientSchema.index({ totalSpend: -1 });

export const Client = mongoose.model<IClient>('Client', ClientSchema);