import mongoose, { Schema, Document } from 'mongoose';
import {
  CrossChannelCampaign,
  CampaignObjective,
  CampaignStatus,
  CampaignFrequency,
  Channel,
  CampaignMetrics,
  BudgetByChannel,
} from '../types';

// Mongoose Sub-schemas
const WhatsAppContentSchema = new Schema({
  template: { type: String, required: true },
  variables: { type: Map, of: String, default: {} },
  headerType: { type: String, enum: ['text', 'image', 'video'] },
  footerText: { type: String },
  buttons: [{
    type: { type: String, enum: ['url', 'quick_reply'] },
    text: { type: String },
    url: { type: String },
  }],
}, { _id: false });

const SMSContentSchema = new Schema({
  message: { type: String, required: true, maxlength: 1600 },
  senderId: { type: String },
}, { _id: false });

const EmailContentSchema = new Schema({
  subject: { type: String, required: true, maxlength: 200 },
  body: { type: String, required: true },
  template: { type: String },
  fromName: { type: String },
  replyTo: { type: String },
  attachments: [{
    filename: { type: String },
    url: { type: String },
    type: { type: String },
  }],
}, { _id: false });

const PushContentSchema = new Schema({
  title: { type: String, required: true, maxlength: 100 },
  body: { type: String, required: true, maxlength: 500 },
  image: { type: String },
  icon: { type: String },
  clickAction: { type: String },
  badge: { type: Number },
  sound: { type: String },
  priority: { type: String, enum: ['high', 'normal', 'low'] },
  data: { type: Map, of: String },
}, { _id: false });

const BudgetByChannelSchema = new Schema({
  whatsapp: { type: Number, default: 0 },
  sms: { type: Number, default: 0 },
  email: { type: Number, default: 0 },
  push: { type: Number, default: 0 },
}, { _id: false });

const CampaignBudgetSchema = new Schema({
  total: { type: Number, required: true },
  byChannel: { type: BudgetByChannelSchema, default: {} },
  spent: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
}, { _id: false });

const TargetingConfigSchema = new Schema({
  audienceIds: [{ type: String }],
  segments: [{ type: String }],
  customAudience: {
    demographics: {
      ageRange: {
        min: { type: Number },
        max: { type: Number },
      },
      gender: [{ type: String }],
      location: [{ type: String }],
      language: [{ type: String }],
    },
    behavior: {
      purchaseHistory: { type: Boolean },
      engagementLevel: [{ type: String, enum: ['high', 'medium', 'low'] }],
      lastActiveDays: { type: Number },
    },
    interests: [{ type: String }],
  },
}, { _id: false });

const SchedulingConfigSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  frequency: { type: String, enum: ['once', 'daily', 'weekly'], default: 'once' },
  optimalTime: { type: String },
  timezone: { type: String, default: 'Asia/Kolkata' },
  dayOfWeek: [{ type: Number, min: 0, max: 6 }],
}, { _id: false });

const CampaignMetricsSchema = new Schema({
  sent: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  opened: { type: Number, default: 0 },
  clicked: { type: Number, default: 0 },
  converted: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  unsubscribed: { type: Number, default: 0 },
  bounced: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  byChannel: {
    whatsapp: { type: CampaignMetricsSchema, default: {} },
    sms: { type: CampaignMetricsSchema, default: {} },
    email: { type: CampaignMetricsSchema, default: {} },
    push: { type: CampaignMetricsSchema, default: {} },
  },
}, { _id: false });

const ABTestVariantSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  content: {
    whatsapp: { type: WhatsAppContentSchema },
    sms: { type: SMSContentSchema },
    email: { type: EmailContentSchema },
    push: { type: PushContentSchema },
  },
  percentage: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const ABTestSchema = new Schema({
  enabled: { type: Boolean, default: false },
  variants: [ABTestVariantSchema],
  winningVariant: { type: String },
}, { _id: false });

// Main Campaign Schema
export interface CrossChannelCampaignDocument extends Omit<CrossChannelCampaign, 'budget' | 'targeting' | 'scheduling' | 'metrics' | 'content'>, Document {
  budget: mongoose.Types.DocumentArray<BudgetByChannel> extends never ? CampaignBudget : BudgetByChannel;
  targeting: TargetingConfig;
  scheduling: SchedulingConfig;
  metrics: CampaignMetrics;
  content: {
    whatsapp?: WhatsAppContentSchema;
    sms?: SMSContentSchema;
    email?: EmailContentSchema;
    push?: PushContentSchema;
  };
}

const CrossChannelCampaignSchema = new Schema<CrossChannelCampaignDocument>({
  campaignId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  advertiserId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  objective: {
    type: String,
    enum: ['awareness', 'engagement', 'conversion', 'retention'],
    required: true,
    index: true,
  },
  channels: [{
    type: String,
    enum: ['whatsapp', 'sms', 'email', 'push'],
    required: true,
  }],
  budget: {
    type: CampaignBudgetSchema,
    required: true,
  },
  targeting: {
    type: TargetingConfigSchema,
    required: true,
  },
  content: {
    whatsapp: { type: WhatsAppContentSchema },
    sms: { type: SMSContentSchema },
    email: { type: EmailContentSchema },
    push: { type: PushContentSchema },
  },
  scheduling: {
    type: SchedulingConfigSchema,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed'],
    default: 'draft',
    index: true,
  },
  metrics: {
    type: CampaignMetricsSchema,
    default: () => ({}),
  },
  abTest: {
    type: ABTestSchema,
  },
  launchedAt: { type: Date },
  pausedAt: { type: Date },
  completedAt: { type: Date },
}, {
  timestamps: true,
  collection: 'cross_channel_campaigns',
});

// Indexes
CrossChannelCampaignSchema.index({ advertiserId: 1, status: 1 });
CrossChannelCampaignSchema.index({ 'scheduling.startDate': 1, 'scheduling.endDate': 1 });
CrossChannelCampaignSchema.index({ createdAt: -1 });
CrossChannelCampaignSchema.index({ 'metrics.converted': -1 });

// Virtual for campaign duration
CrossChannelCampaignSchema.virtual('duration').get(function() {
  if (this.scheduling?.startDate && this.scheduling?.endDate) {
    return Math.ceil((this.scheduling.endDate.getTime() - this.scheduling.startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for budget utilization
CrossChannelCampaignSchema.virtual('budgetUtilization').get(function() {
  if (this.budget?.total > 0) {
    return (this.budget.spent / this.budget.total) * 100;
  }
  return 0;
});

// Pre-save hook for campaignId generation
CrossChannelCampaignSchema.pre('save', function(next) {
  if (!this.campaignId) {
    this.campaignId = `CCO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Instance methods
CrossChannelCampaignSchema.methods.canLaunch = function(): { canLaunch: boolean; reason?: string } {
  if (this.status !== 'draft' && this.status !== 'scheduled') {
    return { canLaunch: false, reason: `Cannot launch campaign with status: ${this.status}` };
  }
  if (!this.content.whatsapp && !this.content.sms && !this.content.email && !this.content.push) {
    return { canLaunch: false, reason: 'At least one channel content is required' };
  }
  if (this.budget.total <= 0) {
    return { canLaunch: false, reason: 'Budget must be greater than 0' };
  }
  return { canLaunch: true };
};

CrossChannelCampaignSchema.methods.getChannelMetrics = function(channel: Channel): CampaignMetrics | undefined {
  return this.metrics.byChannel?.[channel];
};

// Static methods
CrossChannelCampaignSchema.statics.findByAdvertiser = function(advertiserId: string) {
  return this.find({ advertiserId }).sort({ createdAt: -1 });
};

CrossChannelCampaignSchema.statics.findActiveCampaigns = function() {
  return this.find({ status: 'active' }).sort({ launchedAt: -1 });
};

CrossChannelCampaignSchema.statics.findScheduledCampaigns = function() {
  return this.find({
    status: 'scheduled',
    'scheduling.startDate': { $lte: new Date() },
  });
};

// Export the model
export const CrossChannelCampaignModel = mongoose.model<CrossChannelCampaignDocument>(
  'CrossChannelCampaign',
  CrossChannelCampaignSchema
);

export default CrossChannelCampaignModel;