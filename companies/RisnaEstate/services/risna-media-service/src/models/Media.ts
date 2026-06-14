import mongoose, { Schema, Document } from 'mongoose';

export enum CampaignType {
  PROPERTY_LISTING = 'property_listing',
  BROKER_BRANDING = 'broker_branding',
  PROJECT_LAUNCH = 'project_launch',
  LEAD_GENERATION = 'lead_generation',
  BRAND_AWARENESS = 'brand_awareness',
  DOOH = 'dooh',
  QR_CAMPAIGN = 'qr_campaign',
  WHATSAPP = 'whatsapp',
  INSTAGRAM = 'instagram'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export enum InfluencerTier {
  MICRO = 'micro',      // 1K-10K followers
  MACRO = 'macro',      // 10K-100K
  MEGA = 'mega',        // 100K-1M
  CELEBRITY = 'celebrity' // 1M+
}

export interface ICampaign extends Document {
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  brokerId?: string;
  propertyId?: string;
  budget: number;
  spent: number;
  targeting: {
    countries?: string[];
    cities?: string[];
    segments?: string[];
    ageMin?: number;
    ageMax?: number;
    interests?: string[];
  };
  creatives: Array<{
    type: 'image' | 'video' | 'carousel';
    url: string;
    headline?: string;
    cta?: string;
  }>;
  startDate: Date;
  endDate?: Date;
  metrics: {
    impressions: number;
    clicks: number;
    leads: number;
    conversions: number;
    ctr: number;
    cpc: number;
    roas: number;
  };
  deletedAt?: Date;
}

export interface IInfluencer extends Document {
  userId: string;
  name: string;
  phone: string;
  email?: string;
  platform: 'instagram' | 'youtube' | 'twitter' | 'linkedin';
  handle: string;
  followers: number;
  tier: InfluencerTier;
  niche: string[];
  location?: string;
  verified: boolean;
  stats: {
    totalCampaigns: number;
    totalLeads: number;
    totalConversions: number;
    avgEngagement: number;
    rating: number;
  };
  payoutRate: number;
  status: 'active' | 'inactive' | 'suspended';
  deletedAt?: Date;
}

export interface IPropertyAd extends Document {
  propertyId: string;
  brokerId: string;
  campaignId?: string;
  type: 'featured' | 'highlight' | 'premium';
  startDate: Date;
  endDate?: Date;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  status: 'active' | 'paused' | 'completed';
  deletedAt?: Date;
}

// Campaign Schema
const CampaignCreativeSchema = new Schema({
  type: { type: String, enum: ['image', 'video', 'carousel'], required: true },
  url: { type: String, required: true },
  headline: String,
  cta: String
}, { _id: false });

const CampaignTargetingSchema = new Schema({
  countries: [String],
  cities: [String],
  segments: [String],
  ageMin: Number,
  ageMax: Number,
  interests: [String]
}, { _id: false });

const CampaignMetricsSchema = new Schema({
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  leads: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },
  roas: { type: Number, default: 0 }
}, { _id: false });

const CampaignSchema = new Schema<ICampaign>({
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(CampaignType), required: true },
  status: { type: String, enum: Object.values(CampaignStatus), default: CampaignStatus.DRAFT },
  brokerId: String,
  propertyId: String,
  budget: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  targeting: { type: CampaignTargetingSchema },
  creatives: [CampaignCreativeSchema],
  startDate: { type: Date, required: true },
  endDate: Date,
  metrics: { type: CampaignMetricsSchema },
  deletedAt: Date
}, { timestamps: true });

CampaignSchema.index({ brokerId: 1, status: 1 });
CampaignSchema.index({ propertyId: 1 });
CampaignSchema.index({ type: 1, status: 1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);

// Influencer Schema
const InfluencerStatsSchema = new Schema({
  totalCampaigns: { type: Number, default: 0 },
  totalLeads: { type: Number, default: 0 },
  totalConversions: { type: Number, default: 0 },
  avgEngagement: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }
}, { _id: false });

const InfluencerSchema = new Schema<IInfluencer>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  platform: { type: String, enum: ['instagram', 'youtube', 'twitter', 'linkedin'], required: true },
  handle: { type: String, required: true },
  followers: { type: Number, required: true },
  tier: { type: String, enum: Object.values(InfluencerTier), required: true },
  niche: [String],
  location: String,
  verified: { type: Boolean, default: false },
  stats: { type: InfluencerStatsSchema },
  payoutRate: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  deletedAt: Date
}, { timestamps: true });

InfluencerSchema.index({ tier: 1, status: 1 });
InfluencerSchema.index({ niche: 1 });
InfluencerSchema.index({ platform: 1 });

export const Influencer = mongoose.model<IInfluencer>('Influencer', InfluencerSchema);

// Property Ad Schema
const PropertyAdSchema = new Schema<IPropertyAd>({
  propertyId: { type: String, required: true, index: true },
  brokerId: { type: String, required: true, index: true },
  campaignId: String,
  type: { type: String, enum: ['featured', 'highlight', 'premium'], required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  budget: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  leads: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  deletedAt: Date
}, { timestamps: true });

PropertyAdSchema.index({ status: 1, startDate: 1 });

export const PropertyAd = mongoose.model<IPropertyAd>('PropertyAd', PropertyAdSchema);

// ===== DOOH Screen =====
export enum DOOHScreenType {
  CAB_TABLET = 'cab_tablet',
  RETAIL_KIOSK = 'retail_kiosk',
  ELEVATOR = 'elevator_screen',
  BILLBOARD_LED = 'billboard_led',
  RESTAURANT_ORDER = 'restaurant_order'
}

export interface IDOOH extends Document {
  screenId: string;
  name: string;
  type: DOOHScreenType;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
    zone?: string;
  };
  specs: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    resolution: string;
  };
  ownerId: string;
  ownerName: string;
  hourlyRate: number;
  currency: string;
  available: boolean;
  deletedAt?: Date;
}

const DOOHSchema = new Schema<IDOOH>({
  screenId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(DOOHScreenType), required: true },
  location: {
    address: String,
    city: String,
    country: String,
    coordinates: { lat: Number, lng: Number },
    zone: String
  },
  specs: {
    width: Number,
    height: Number,
    orientation: { type: String, enum: ['portrait', 'landscape'] },
    resolution: String
  },
  ownerId: String,
  ownerName: String,
  hourlyRate: Number,
  currency: { type: String, default: 'AED' },
  available: { type: Boolean, default: true },
  deletedAt: Date
}, { timestamps: true });

export const DOOH = mongoose.model<IDOOH>('DOOH', DOOHSchema);

// ===== QR Campaign =====
export enum QRType {
  PROPERTY = 'property',
  BROKER = 'broker',
  PROJECT = 'project',
  CAMPAIGN = 'campaign'
}

export interface IQRCampaign extends Document {
  name: string;
  type: QRType;
  propertyId?: string;
  brokerId?: string;
  campaignId?: string;
  targetUrl: string;
  shortCode: string;
  qrImage: string;
  scans: number;
  leads: number;
  conversions: number;
  status: 'active' | 'paused' | 'expired';
  validUntil?: Date;
  deletedAt?: Date;
}

const QRSchema = new Schema<IQRCampaign>({
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(QRType), required: true },
  propertyId: String,
  brokerId: String,
  campaignId: String,
  targetUrl: { type: String, required: true },
  shortCode: { type: String, unique: true },
  qrImage: String,
  scans: { type: Number, default: 0 },
  leads: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'paused', 'expired'], default: 'active' },
  validUntil: Date,
  deletedAt: Date
}, { timestamps: true });

QRSchema.index({ shortCode: 1 });
QRSchema.index({ status: 1 });

export const QRCampaign = mongoose.model<IQRCampaign>('QRCampaign', QRSchema);
