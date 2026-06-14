import mongoose, { Schema, Document } from 'mongoose';
import { CampaignType, OutreachChannel } from '../config/constants';

export interface ICampaignTarget {
  segment?: string;
  customerIds?: string[];
  criteria?: {
    minLifetimeValue?: number;
    maxLifetimeValue?: number;
    birthdayThisMonth?: boolean;
    anniversaryThisMonth?: boolean;
    minVisits?: number;
  };
}

export interface ICampaignMessage {
  subject?: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface ICampaignMetrics {
  totalTargeted: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number; // in cents
}

export interface ICampaign extends Document {
  campaignId: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  target: ICampaignTarget;
  message: ICampaignMessage;
  channels: OutreachChannel[];
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  metrics: ICampaignMetrics;
  createdBy: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignTargetSchema = new Schema<ICampaignTarget>(
  {
    segment: {
      type: String,
      enum: ['VIP', 'REGULAR', 'LAPSED', 'NEW', 'ALL'],
    },
    customerIds: {
      type: [String],
      default: [],
    },
    criteria: {
      minLifetimeValue: { type: Number },
      maxLifetimeValue: { type: Number },
      birthdayThisMonth: { type: Boolean },
      anniversaryThisMonth: { type: Boolean },
      minVisits: { type: Number },
    },
  },
  { _id: false }
);

const CampaignMessageSchema = new Schema<ICampaignMessage>(
  {
    subject: { type: String },
    body: { type: String, required: true },
    templateId: { type: String },
    variables: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const CampaignMetricsSchema = new Schema<ICampaignMetrics>(
  {
    totalTargeted: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  { _id: false }
);

const CampaignSchema = new Schema<ICampaign>(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ['birthday', 'anniversary', 'reengagement', 'loyalty_reward', 'new_menu', 'special_offer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
    },
    target: {
      type: CampaignTargetSchema,
      required: true,
    },
    message: {
      type: CampaignMessageSchema,
      required: true,
    },
    channels: {
      type: [String],
      enum: ['whatsapp', 'sms', 'email'],
      required: true,
    },
    scheduledAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    metrics: {
      type: CampaignMetricsSchema,
      default: () => ({
        totalTargeted: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        revenue: 0,
      }),
    },
    createdBy: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CampaignSchema.index({ status: 1, scheduledAt: 1 });
CampaignSchema.index({ type: 1, status: 1 });
CampaignSchema.index({ createdBy: 1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
