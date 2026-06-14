import mongoose, { Schema, Document } from 'mongoose';
import {
  BusinessProfile,
  Capabilities,
  ActiveCampaign,
  MarketingSchedule,
  Recommendation,
  PerformanceReport,
  CampaignType,
  CampaignStatus,
  CampaignPerformance,
  ScheduleItem,
} from '../types';

// Business Profile Embedded Schema
const BusinessProfileSchema = new Schema<BusinessProfile>(
  {
    name: { type: String, required: true, maxlength: 200 },
    category: { type: String, required: true, maxlength: 100 },
    location: { type: String, required: true, maxlength: 500 },
    hours: { type: String, maxlength: 200 },
    priceRange: { type: String, enum: ['budget', 'moderate', 'premium', 'luxury'] },
    competitors: [{ type: String }],
    description: { type: String, maxlength: 2000 },
    website: { type: String },
    phone: { type: String },
    email: { type: String },
    socialMedia: {
      facebook: { type: String },
      instagram: { type: String },
      twitter: { type: String },
      googleBusiness: { type: String },
    },
  },
  { _id: false }
);

// Capabilities Embedded Schema
const CapabilitiesSchema = new Schema<Capabilities>(
  {
    adCreation: { type: Boolean, default: true },
    reviewManagement: { type: Boolean, default: true },
    socialPosting: { type: Boolean, default: true },
    whatsappCampaigns: { type: Boolean, default: true },
    localSEO: { type: Boolean, default: true },
    emailMarketing: { type: Boolean, default: false },
    smsMarketing: { type: Boolean, default: false },
    loyaltyPrograms: { type: Boolean, default: false },
  },
  { _id: false }
);

// Campaign Performance Embedded Schema
const CampaignPerformanceSchema = new Schema<CampaignPerformance>(
  {
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    conversions: { type: Number, default: 0, min: 0 },
    spend: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    reach: { type: Number, default: 0, min: 0 },
    engagement: { type: Number, default: 0, min: 0 },
    ctr: { type: Number, default: 0, min: 0 },
    cpc: { type: Number, default: 0, min: 0 },
    roas: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

// Active Campaign Embedded Schema
const ActiveCampaignSchema = new Schema<ActiveCampaign>(
  {
    campaignId: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['social_post', 'google_ad', 'facebook_ad', 'instagram_ad', 'whatsapp_broadcast', 'review_request', 'email_campaign', 'sms_campaign', 'loyalty_offer'],
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'failed'],
      default: 'draft',
    },
    name: { type: String, required: true },
    startDate: { type: String },
    endDate: { type: String },
    budget: { type: Number, min: 0 },
    performance: { type: CampaignPerformanceSchema, default: () => ({}) },
    content: {
      headline: { type: String },
      body: { type: String },
      imageUrl: { type: String },
      callToAction: { type: String },
    },
  },
  { _id: false }
);

// Schedule Item Embedded Schema
const ScheduleItemSchema = new Schema<ScheduleItem>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['post', 'ad', 'review_request', 'email', 'sms'],
    },
    content: { type: String, required: true },
    scheduledFor: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'sent', 'failed', 'cancelled'],
      default: 'pending',
    },
    platform: { type: String },
  },
  { _id: false }
);

// Marketing Schedule Embedded Schema
const MarketingScheduleSchema = new Schema<MarketingSchedule>(
  {
    recurringPosts: [{ type: ScheduleItemSchema }],
    adSchedules: [{ type: ScheduleItemSchema }],
    reviewRequests: [{ type: ScheduleItemSchema }],
  },
  { _id: false }
);

// Recommendation Embedded Schema
const RecommendationSchema = new Schema<Recommendation>(
  {
    id: { type: String, required: true },
    priority: {
      type: String,
      required: true,
      enum: ['high', 'medium', 'low'],
    },
    category: { type: String, required: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
    expectedImpact: { type: String, required: true },
    estimatedCost: { type: Number },
    estimatedRevenue: { type: Number },
    timeline: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'executed'],
      default: 'pending',
    },
  },
  { _id: false }
);

// Performance Report Embedded Schema
const PerformanceReportSchema = new Schema<PerformanceReport>(
  {
    totalReach: { type: Number, default: 0, min: 0 },
    totalImpressions: { type: Number, default: 0, min: 0 },
    totalEngagement: { type: Number, default: 0, min: 0 },
    totalClicks: { type: Number, default: 0, min: 0 },
    totalConversions: { type: Number, default: 0, min: 0 },
    totalSpend: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    roas: { type: Number, default: 0, min: 0 },
    averageCTR: { type: Number, default: 0, min: 0 },
    averageCPC: { type: Number, default: 0, min: 0 },
    periodStart: { type: String, required: true },
    periodEnd: { type: String, required: true },
  },
  { _id: false }
);

// Main AI Marketing Manager Document Schema
export interface IAIMarketingManager extends Document {
  managerId: string;
  merchantId: string;
  businessProfile: BusinessProfile;
  capabilities: Capabilities;
  activeCampaigns: ActiveCampaign[];
  schedule: MarketingSchedule;
  recommendations: Recommendation[];
  performance: PerformanceReport;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const AIMarketingManagerSchema = new Schema<IAIMarketingManager>(
  {
    managerId: { type: String, required: true, unique: true, index: true },
    merchantId: { type: String, required: true, index: true },
    businessProfile: { type: BusinessProfileSchema, required: true },
    capabilities: { type: CapabilitiesSchema, default: () => ({}) },
    activeCampaigns: [{ type: ActiveCampaignSchema }],
    schedule: {
      type: MarketingScheduleSchema,
      default: () => ({
        recurringPosts: [],
        adSchedules: [],
        reviewRequests: [],
      }),
    },
    recommendations: [{ type: RecommendationSchema }],
    performance: {
      type: PerformanceReportSchema,
      default: () => ({
        totalReach: 0,
        totalImpressions: 0,
        totalEngagement: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalSpend: 0,
        totalRevenue: 0,
        roas: 0,
        averageCTR: 0,
        averageCPC: 0,
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
      }),
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    collection: 'ai_marketing_managers',
  }
);

// Indexes
AIMarketingManagerSchema.index({ merchantId: 1 });
AIMarketingManagerSchema.index({ status: 1 });
AIMarketingManagerSchema.index({ 'businessProfile.category': 1 });
AIMarketingManagerSchema.index({ createdAt: -1 });

// Campaign Collection
export interface ICampaign extends Document {
  campaignId: string;
  merchantId: string;
  managerId: string;
  type: CampaignType;
  status: CampaignStatus;
  name: string;
  content: {
    headline: string;
    body: string;
    imageUrl?: string;
    callToAction?: string;
  };
  budget?: number;
  schedule?: {
    startDate?: string;
    endDate?: string;
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  };
  performance: CampaignPerformance;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    merchantId: { type: String, required: true, index: true },
    managerId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['social_post', 'google_ad', 'facebook_ad', 'instagram_ad', 'whatsapp_broadcast', 'review_request', 'email_campaign', 'sms_campaign', 'loyalty_offer'],
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'failed'],
      default: 'draft',
    },
    name: { type: String, required: true, maxlength: 200 },
    content: {
      headline: { type: String, required: true, maxlength: 100 },
      body: { type: String, required: true, maxlength: 2000 },
      imageUrl: { type: String },
      callToAction: { type: String, maxlength: 50 },
    },
    budget: { type: Number, min: 0 },
    schedule: {
      startDate: { type: String },
      endDate: { type: String },
      frequency: { type: String, enum: ['once', 'daily', 'weekly', 'monthly'] },
    },
    performance: { type: CampaignPerformanceSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: 'campaigns',
  }
);

// Indexes
CampaignSchema.index({ merchantId: 1 });
CampaignSchema.index({ managerId: 1 });
CampaignSchema.index({ status: 1 });
CampaignSchema.index({ type: 1 });
CampaignSchema.index({ createdAt: -1 });

// Schedule Event Collection
export interface IScheduleEvent extends Document {
  eventId: string;
  merchantId: string;
  managerId: string;
  campaignId?: string;
  type: 'post' | 'ad' | 'review_request' | 'email' | 'sms';
  content: string;
  scheduledFor: Date;
  platform?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleEventSchema = new Schema<IScheduleEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    merchantId: { type: String, required: true, index: true },
    managerId: { type: String, required: true, index: true },
    campaignId: { type: String, index: true },
    type: {
      type: String,
      required: true,
      enum: ['post', 'ad', 'review_request', 'email', 'sms'],
    },
    content: { type: String, required: true },
    scheduledFor: { type: Date, required: true, index: true },
    platform: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'sent', 'failed', 'cancelled'],
      default: 'pending',
    },
    sentAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'schedule_events',
  }
);

// Indexes
ScheduleEventSchema.index({ merchantId: 1, scheduledFor: 1 });
ScheduleEventSchema.index({ status: 1, scheduledFor: 1 });
ScheduleEventSchema.index({ type: 1 });

// Review Collection
export interface IReview extends Document {
  reviewId: string;
  merchantId: string;
  managerId: string;
  platform: 'google' | 'facebook' | 'yelp' | 'tripadvisor' | 'other';
  rating: number;
  content: string;
  author: string;
  date: Date;
  response?: {
    content: string;
    tone: 'professional' | 'friendly' | 'apologetic' | 'grateful';
    respondedAt: Date;
  };
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewId: { type: String, required: true, unique: true, index: true },
    merchantId: { type: String, required: true, index: true },
    managerId: { type: String, required: true, index: true },
    platform: {
      type: String,
      required: true,
      enum: ['google', 'facebook', 'yelp', 'tripadvisor', 'other'],
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    author: { type: String, required: true },
    date: { type: Date, required: true },
    response: {
      content: { type: String },
      tone: { type: String, enum: ['professional', 'friendly', 'apologetic', 'grateful'] },
      respondedAt: { type: Date },
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
    },
    sentimentScore: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'reviews',
  }
);

// Indexes
ReviewSchema.index({ merchantId: 1 });
ReviewSchema.index({ managerId: 1 });
ReviewSchema.index({ platform: 1, rating: 1 });
ReviewSchema.index({ sentiment: 1 });
ReviewSchema.index({ date: -1 });

// Export models
export const AIMarketingManager = mongoose.model<IAIMarketingManager>('AIMarketingManager', AIMarketingManagerSchema);
export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
export const ScheduleEvent = mongoose.model<IScheduleEvent>('ScheduleEvent', ScheduleEventSchema);
export const Review = mongoose.model<IReview>('Review', ReviewSchema);