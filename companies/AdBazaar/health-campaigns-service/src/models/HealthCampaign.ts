import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type CampaignType = 'adherence' | 'checkup' | 'vaccination' | 'wellness' | 'preventive';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type ChannelType = 'whatsapp' | 'sms' | 'push' | 'email';
export type IncentiveType = 'points' | 'discount' | 'badge';

export interface IHealthCriteria {
  ageMin?: number;
  ageMax?: number;
  gender?: string[];
  conditions?: string[];
  medications?: string[];
  riskLevel?: ('low' | 'medium' | 'high')[];
  lastVisitDays?: number;
  location?: {
    city?: string[];
    state?: string[];
    pincode?: string[];
  };
}

export interface ICampaignSchedule {
  startDate?: Date;
  endDate?: Date;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    timeOfDay: string; // HH:mm format
  };
}

export interface IIncentive {
  type: IncentiveType;
  amount: number;
  description?: string;
}

export interface ICampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  converted: number;
  failed: number;
}

export interface IHealthCampaign extends Document {
  id: string;
  type: CampaignType;
  title: string;
  description?: string;
  message: string;
  targetCriteria: IHealthCriteria;
  channels: ChannelType[];
  schedule: ICampaignSchedule;
  incentives?: IIncentive;
  status: CampaignStatus;
  metrics: ICampaignMetrics;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

const HealthCriteriaSchema = new Schema<IHealthCriteria>(
  {
    ageMin: { type: Number, min: 0, max: 120 },
    ageMax: { type: Number, min: 0, max: 120 },
    gender: [{ type: String }],
    conditions: [{ type: String }],
    medications: [{ type: String }],
    riskLevel: [{ type: String, enum: ['low', 'medium', 'high'] }],
    lastVisitDays: { type: Number, min: 0 },
    location: {
      city: [{ type: String }],
      state: [{ type: String }],
      pincode: [{ type: String }],
    },
  },
  { _id: false }
);

const CampaignScheduleSchema = new Schema<ICampaignSchedule>(
  {
    startDate: { type: Date },
    endDate: { type: Date },
    recurring: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }],
      daysOfMonth: [{ type: Number, min: 1, max: 31 }],
      timeOfDay: { type: String, default: '09:00' },
    },
  },
  { _id: false }
);

const IncentiveSchema = new Schema<IIncentive>(
  {
    type: { type: String, enum: ['points', 'discount', 'badge'], required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String },
  },
  { _id: false }
);

const CampaignMetricsSchema = new Schema<ICampaignMetrics>(
  {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  { _id: false }
);

const HealthCampaignSchema = new Schema<IHealthCampaign>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `HC-${uuidv4().substring(0, 8).toUpperCase()}`,
    },
    type: {
      type: String,
      enum: ['adherence', 'checkup', 'vaccination', 'wellness', 'preventive'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    message: { type: String, required: true },
    targetCriteria: { type: HealthCriteriaSchema, default: {} },
    channels: [{
      type: String,
      enum: ['whatsapp', 'sms', 'push', 'email'],
      required: true,
    }],
    schedule: { type: CampaignScheduleSchema, default: {} },
    incentives: { type: IncentiveSchema },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed'],
      default: 'draft',
      index: true,
    },
    metrics: { type: CampaignMetricsSchema, default: () => ({}) },
    createdBy: { type: String, required: true },
    sentAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
HealthCampaignSchema.index({ status: 1, createdAt: -1 });
HealthCampaignSchema.index({ type: 1, status: 1 });
HealthCampaignSchema.index({ 'targetCriteria.conditions': 1 });
HealthCampaignSchema.index({ 'targetCriteria.riskLevel': 1 });

export const HealthCampaign = mongoose.model<IHealthCampaign>('HealthCampaign', HealthCampaignSchema);
