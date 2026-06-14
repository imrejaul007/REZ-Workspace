import mongoose, { Schema, Document } from 'mongoose';

export type CampaignType =
  | 'birthday'
  | 'anniversary'
  | 'reengagement'
  | 'promotional'
  | 'loyalty'
  | 'seasonal'
  | 'winback'
  | 'new_service'
  | 'VIP';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'paused' | 'cancelled';

export interface ISegmentCriteria {
  type: 'all' | 'tier' | 'spend_range' | 'visit_frequency' | 'days_inactive' | 'service_preference' | 'tags' | 'custom';
  tiers?: ('new' | 'regular' | 'vip' | 'at-risk' | 'churned')[];
  minSpend?: number;
  maxSpend?: number;
  minVisits?: number;
  maxVisits?: number;
  minDaysInactive?: number;
  maxDaysInactive?: number;
  services?: string[];
  tags?: string[];
  customQuery?: Record<string, unknown>;
}

export interface ICampaignMetrics {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened?: number;
  clicked?: number;
  converted: number;
  revenue: number;
  optOuts: number;
}

export interface ICampaignSchedule {
  sendAt: Date;
  timezone: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
  };
}

export interface ICampaign extends Document {
  campaignId: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  channel: 'sms' | 'email' | 'both';
  segmentCriteria: ISegmentCriteria;
  content: {
    subject?: string;
    templateId?: string;
    smsBody: string;
    emailHtml?: string;
    emailText?: string;
    variables: Record<string, string>;
  };
  schedule?: ICampaignSchedule;
  metrics: ICampaignMetrics;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  completedAt?: Date;
}

const SegmentCriteriaSchema = new Schema<ISegmentCriteria>(
  {
    type: {
      type: String,
      required: true,
      enum: ['all', 'tier', 'spend_range', 'visit_frequency', 'days_inactive', 'service_preference', 'tags', 'custom'],
    },
    tiers: [String],
    minSpend: Number,
    maxSpend: Number,
    minVisits: Number,
    maxVisits: Number,
    minDaysInactive: Number,
    maxDaysInactive: Number,
    services: [String],
    tags: [String],
    customQuery: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const CampaignMetricsSchema = new Schema<ICampaignMetrics>(
  {
    totalRecipients: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    optOuts: { type: Number, default: 0 },
  },
  { _id: false }
);

const CampaignScheduleSchema = new Schema<ICampaignSchedule>(
  {
    sendAt: { type: Date, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    recurring: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
      endDate: Date,
    },
  },
  { _id: false }
);

const CampaignSchema = new Schema<ICampaign>(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: String,
    type: {
      type: String,
      required: true,
      enum: ['birthday', 'anniversary', 'reengagement', 'promotional', 'loyalty', 'seasonal', 'winback', 'new_service', 'VIP'],
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'scheduled', 'active', 'completed', 'paused', 'cancelled'],
      default: 'draft',
    },
    channel: {
      type: String,
      required: true,
      enum: ['sms', 'email', 'both'],
      default: 'sms',
    },
    segmentCriteria: { type: SegmentCriteriaSchema, required: true },
    content: {
      subject: String,
      templateId: String,
      smsBody: { type: String, required: true },
      emailHtml: String,
      emailText: String,
      variables: { type: Map, of: String, default: {} },
    },
    schedule: CampaignScheduleSchema,
    metrics: { type: CampaignMetricsSchema, default: () => ({}) },
    tags: { type: [String], default: [] },
    createdBy: { type: String, required: true },
    sentAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
CampaignSchema.index({ type: 1, status: 1 });
CampaignSchema.index({ 'schedule.sendAt': 1 });
CampaignSchema.index({ tags: 1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
