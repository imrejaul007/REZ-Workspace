import mongoose, { Schema, Document } from 'mongoose';

export enum LeadSource {
  WEBSITE = 'website',
  WHATSAPP = 'whatsapp',
  REFERRAL = 'referral',
  SOCIAL = 'social',
  AGENT = 'agent',
  PARTNER = 'partner',
  AD = 'ad',
  ORGANIC = 'organic'
}

export enum LeadSegment {
  NRI = 'nri',
  HNI = 'hni',
  MID_SEGMENT = 'mid_segment',
  MASS_MARKET = 'mass_market',
  INVESTOR = 'investor',
  END_USER = 'end_user'
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  HOT = 'hot',
  WARM = 'warm',
  COLD = 'cold',
  LOST = 'lost',
  CONVERTED = 'converted'
}

export enum HNITier {
  AFFLUENT = 'affluent',
  HNWI = 'hnwi',
  UHNI = 'uhni',
  ULTRA_UHNI = 'ultra_uhni'
}

export enum InvestmentExperience {
  NONE = 'none',
  LIMITED = 'limited',
  MODERATE = 'moderate',
  EXTENSIVE = 'extensive'
}

export enum PaymentCurrency {
  INR = 'INR',
  AED = 'AED',
  USD = 'USD'
}

export interface IBudgetRange {
  min?: number;
  max?: number;
  currency: PaymentCurrency;
}

export interface ILeadPreference {
  propertyTypes?: string[];
  locations?: {
    country: string;
    city: string;
    locality?: string;
  }[];
  bedrooms?: number[];
  budget?: IBudgetRange;
  timeline?: 'immediate' | '1-3months' | '3-6months' | '6-12months' | 'exploring';
  purpose?: 'buy' | 'invest' | 'rent' | 'pg';
}

export interface INRIProfile {
  isNRI: boolean;
  countryOfResidence?: string;
  visaType?: string;
  incomeRange?: string;
  overseasAssets?: boolean;
  repatriationNeeded?: boolean;
  nriProfileScore?: number;
}

export interface IHNIProfile {
  isHNI: boolean;
  netWorth?: number;
  liquidAssets?: number;
  annualIncome?: number;
  investmentExperience?: InvestmentExperience;
  preferredInvestments?: string[];
  hniTier?: HNITier;
}

export interface ILeadInteraction {
  type: 'call' | 'whatsapp' | 'email' | 'site_visit' | 'inquiry';
  direction: 'inbound' | 'outbound';
  agentId?: string;
  notes?: string;
  outcome?: string;
  duration?: number;
  recordingUrl?: string;
  createdAt: Date;
}

export interface ILeadScore {
  overall: number;
  intent: number;
  budgetMatch: number;
  timeline: number;
  engagement: number;
  calculatedAt: Date;
  modelVersion?: string;
}

export interface ILeadQualification {
  status: LeadStatus;
  reason?: string;
  qualifiedBy?: string;
  qualifiedAt?: Date;
  lastQualified?: Date;
}

export interface ILeadSourceDetails {
  campaignId?: string;
  adId?: string;
  referralCode?: string;
  partnerId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface ISiteVisitRecord {
  propertyId: string;
  scheduledAt?: Date;
  completedAt?: Date;
  outcome?: string;
  feedback?: string;
  agentId?: string;
}

export interface ILeadConversion {
  converted: boolean;
  convertedAt?: Date;
  convertedPropertyId?: string;
  dealValue?: number;
  commission?: number;
}

export interface ILead extends Document {
  // Contact Info
  name: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  alternatePhone?: string;

  // Source Tracking
  source: LeadSource;
  sourceDetails?: ILeadSourceDetails;

  // Segment Classification
  segment?: LeadSegment;
  nriProfile?: INRIProfile;
  hniProfile?: IHNIProfile;

  // Preferences
  preferences?: ILeadPreference;

  // Property Interest
  interestedPropertyIds?: string[];
  viewedProperties?: {
    propertyId: string;
    viewedAt: Date;
    duration?: number;
  }[];

  // AI Scoring
  aiScore?: ILeadScore;

  // Qualification Status
  qualification?: ILeadQualification;

  // Assignment
  assignedBrokerId?: string;
  assignedAgentId?: string;
  teamId?: string;

  // Interactions
  interactions?: ILeadInteraction[];
  lastInteraction?: Date;
  nextFollowUp?: Date;

  // Site Visits
  siteVisits?: ISiteVisitRecord[];

  // Conversion
  conversion?: ILeadConversion;

  // Tags
  tags?: string[];

  // Company Assignment
  companyId?: string;

  // Soft Delete
  deletedAt?: Date;
}

// Schema definitions
const BudgetRangeSchema = new Schema({
  min: Number,
  max: Number,
  currency: { type: String, enum: Object.values(PaymentCurrency), default: PaymentCurrency.INR }
}, { _id: false });

const LeadPreferenceSchema = new Schema({
  propertyTypes: [String],
  locations: [{
    country: String,
    city: String,
    locality: String
  }],
  bedrooms: [Number],
  budget: BudgetRangeSchema,
  timeline: { type: String, enum: ['immediate', '1-3months', '3-6months', '6-12months', 'exploring'] },
  purpose: { type: String, enum: ['buy', 'invest', 'rent', 'pg'] }
}, { _id: false });

const NRIProfileSchema = new Schema({
  isNRI: { type: Boolean, default: false },
  countryOfResidence: String,
  visaType: String,
  incomeRange: String,
  overseasAssets: { type: Boolean, default: false },
  repatriationNeeded: { type: Boolean, default: false },
  nriProfileScore: Number
}, { _id: false });

const HNIProfileSchema = new Schema({
  isHNI: { type: Boolean, default: false },
  netWorth: Number,
  liquidAssets: Number,
  annualIncome: Number,
  investmentExperience: { type: String, enum: Object.values(InvestmentExperience) },
  preferredInvestments: [String],
  hniTier: { type: String, enum: Object.values(HNITier) }
}, { _id: false });

const InteractionSchema = new Schema({
  type: { type: String, enum: ['call', 'whatsapp', 'email', 'site_visit', 'inquiry'] },
  direction: { type: String, enum: ['inbound', 'outbound'] },
  agentId: String,
  notes: String,
  outcome: String,
  duration: Number,
  recordingUrl: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const LeadScoreSchema = new Schema({
  overall: { type: Number, min: 0, max: 100 },
  intent: { type: Number, min: 0, max: 100 },
  budgetMatch: { type: Number, min: 0, max: 100 },
  timeline: { type: Number, min: 0, max: 100 },
  engagement: { type: Number, min: 0, max: 100 },
  calculatedAt: { type: Date, default: Date.now },
  modelVersion: String
}, { _id: false });

const LeadQualificationSchema = new Schema({
  status: { type: String, enum: Object.values(LeadStatus), default: LeadStatus.NEW },
  reason: String,
  qualifiedBy: String,
  qualifiedAt: Date,
  lastQualified: Date
}, { _id: false });

const LeadSourceDetailsSchema = new Schema({
  campaignId: String,
  adId: String,
  referralCode: String,
  partnerId: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String
}, { _id: false });

const SiteVisitRecordSchema = new Schema({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
  scheduledAt: Date,
  completedAt: Date,
  outcome: String,
  feedback: String,
  agentId: String
}, { _id: false });

const LeadConversionSchema = new Schema({
  converted: { type: Boolean, default: false },
  convertedAt: Date,
  convertedPropertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
  dealValue: Number,
  commission: Number
}, { _id: false });

const LeadSchema = new Schema<ILead>({
  // Contact Info
  name: { type: String, required: true },
  email: String,
  phone: { type: String, required: true, index: true },
  whatsapp: String,
  alternatePhone: String,

  // Source Tracking
  source: { type: String, enum: Object.values(LeadSource), required: true },
  sourceDetails: { type: LeadSourceDetailsSchema },

  // Segment Classification
  segment: { type: String, enum: Object.values(LeadSegment), index: true },
  nriProfile: { type: NRIProfileSchema },
  hniProfile: { type: HNIProfileSchema },

  // Preferences
  preferences: { type: LeadPreferenceSchema },

  // Property Interest
  interestedPropertyIds: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
  viewedProperties: [{
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    viewedAt: Date,
    duration: Number
  }],

  // AI Scoring
  aiScore: { type: LeadScoreSchema },

  // Qualification Status
  qualification: { type: LeadQualificationSchema },

  // Assignment
  assignedBrokerId: { type: Schema.Types.ObjectId, ref: 'Broker', index: true },
  assignedAgentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },

  // Interactions
  interactions: [InteractionSchema],
  lastInteraction: Date,
  nextFollowUp: Date,

  // Site Visits
  siteVisits: [SiteVisitRecordSchema],

  // Conversion
  conversion: { type: LeadConversionSchema },

  // Tags
  tags: [String],

  // Company Assignment
  companyId: String,

  // Soft Delete
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
LeadSchema.index({ 'aiScore.overall': -1 });
LeadSchema.index({ 'qualification.status': 1, segment: 1 });
LeadSchema.index({ assignedBrokerId: 1, 'qualification.status': 1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ source: 1, createdAt: -1 });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
