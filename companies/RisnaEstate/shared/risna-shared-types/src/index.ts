/**
 * RisnaEstate Shared Types
 *
 * Common TypeScript types for all RisnaEstate services.
 */

import { z } from 'zod';

// ===== ENUMS =====

export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  PLOT = 'plot',
  COMMERCIAL = 'commercial',
  OFFICE = 'office',
  RETAIL = 'retail',
  WAREHOUSE = 'warehouse',
  PENTHOUSE = 'penthouse',
  TOWNHOUSE = 'townhouse',
  DUPLEX = 'duplex',
  STUDIO = 'studio',
  BUNGALOW = 'bungalow',
  LAND = 'land',
  INDUSTRIAL = 'industrial',
  MIXED_USE = 'mixed_use'
}

export enum PropertyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SOLD = 'sold',
  RENTED = 'rented',
  UNDER_OFFER = 'under_offer',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired'
}

export enum ListingType {
  SALE = 'sale',
  RENT = 'rent',
  LEASE = 'lease',
  PG = 'pg',
  CO_LIVING = 'co_living'
}

export enum Country {
  INDIA = 'IN',
  UAE = 'AE'
}

export enum LeadSegment {
  NRI = 'nri',
  HNI = 'hni',
  MID_SEGMENT = 'mid_segment',
  MASS_MARKET = 'mass_market',
  INVESTOR = 'investor',
  END_USER = 'end_user'
}

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

export enum ReferralStatus {
  PENDING = 'pending',
  REGISTERED = 'registered',
  INTERESTED = 'interested',
  VISITED = 'visited',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum VisaProgramType {
  GOLDEN_VISA = 'golden_visa',
  SILVER_VISA = 'silver_visa',
  INVESTOR_VISA = 'investor_visa',
  RETIREMENT_VISA = 'retirement_visa',
  FREELANCER_VISA = 'freelancer_visa'
}

export enum BrokerLicenseType {
  BROKER = 'broker',
  AGENT = 'agent',
  FRANCHISE = 'franchise'
}

export enum TeamRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  SENIOR_AGENT = 'senior_agent',
  AGENT = 'agent',
  TRAINEE = 'trainee'
}

export enum BrokerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
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

export enum FollowUpType {
  CALL = 'call',
  WHATSAPP = 'whatsapp',
  SITE_VISIT = 'site_visit',
  MEETING = 'meeting',
  EMAIL = 'email',
  FOLLOW_UP = 'follow_up',
  REMINDER = 'reminder'
}

export enum FollowUpPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum FollowUpStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  RESCHEDULED = 'rescheduled',
  NO_ANSWER = 'no_answer'
}

export enum SiteVisitStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum DocumentStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export enum VisaAssessmentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum RewardType {
  CASH = 'cash',
  COINS = 'coins',
  DISCOUNT = 'discount',
  VOUCHER = 'voucher'
}

export enum PayoutTrigger {
  IMMEDIATE = 'immediate',
  ON_VISIT = 'on_visit',
  ON_CONVERSION = 'on_conversion'
}

// ===== PROPERTY TYPES =====

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface PriceInfo {
  amount: number;
  currency: PaymentCurrency;
  displayPrice?: string;
  pricePerSqFt?: number;
  totalPlotArea?: number;
}

export interface PropertyMedia {
  id: string;
  type: 'image' | 'video' | 'virtualTour' | 'floorPlan';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
}

export interface PropertyAddress {
  line1?: string;
  line2?: string;
  landmark?: string;
  pincode?: string;
  emirate?: string;
}

export interface PropertyFeature {
  category: string;
  items: string[];
}

export interface PropertyAIScore {
  quality: number;
  demand: number;
  investmentPotential: number;
  lastUpdated: Date;
}

export interface PropertyIntentSignal {
  type: string;
  count: number;
  lastSeen: Date;
}

export interface Property {
  _id?: string;
  id?: string;

  // Basic Info
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;

  // Classification
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;

  // Location
  country: Country;
  city: string;
  locality: string;
  subLocality?: string;
  address: PropertyAddress;
  location?: GeoLocation;

  // Pricing
  price: PriceInfo;
  negotiable: boolean;

  // Property Details
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  carpetArea?: number;
  carpetAreaUnit?: 'sqft' | 'sqm' | 'sqyd';
  superBuiltUpArea?: number;
  totalFloors?: number;
  propertyFloor?: number;
  facingDirection?: string;
  ageOfProperty?: string;
  furnishedStatus?: 'furnished' | 'semi-furnished' | 'unfurnished';

  // Ownership
  ownershipType?: 'freehold' | 'leasehold' | 'co-operative';
  RERARegistered?: boolean;
  reraId?: string;

  // Amenities
  amenities?: string[];
  features?: PropertyFeature[];

  // Media
  media?: PropertyMedia[];
  virtualTourUrl?: string;

  // Broker/Agent
  brokerId?: string;
  agentId?: string;
  ownerId?: string;

  // AI/ML Fields
  aiScore?: PropertyAIScore;
  intentSignals?: PropertyIntentSignal[];

  // SEO
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;

  // Stats
  views?: number;
  inquiries?: number;
  shortlisted?: number;

  // Publish Info
  publishedAt?: Date;
  expiresAt?: Date;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// ===== LEAD TYPES =====

export interface BudgetRange {
  min?: number;
  max?: number;
  currency: PaymentCurrency;
}

export interface LeadPreference {
  propertyTypes: PropertyType[];
  locations: {
    country: Country;
    city: string;
    locality?: string;
  }[];
  bedrooms?: number[];
  budget?: BudgetRange;
  timeline?: 'immediate' | '1-3months' | '3-6months' | '6-12months' | 'exploring';
  purpose?: 'buy' | 'invest' | 'rent' | 'pg';
}

export interface NRIProfile {
  isNRI: boolean;
  countryOfResidence?: string;
  visaType?: string;
  incomeRange?: string;
  overseasAssets?: boolean;
  repatriationNeeded?: boolean;
  nriProfileScore?: number;
}

export interface HNIProfile {
  isHNI: boolean;
  netWorth?: number;
  liquidAssets?: number;
  annualIncome?: number;
  investmentExperience?: InvestmentExperience;
  preferredInvestments?: string[];
  hniTier?: HNITier;
}

export interface LeadInteraction {
  id: string;
  type: 'call' | 'whatsapp' | 'email' | 'site_visit' | 'inquiry';
  direction: 'inbound' | 'outbound';
  agentId?: string;
  notes?: string;
  outcome?: string;
  duration?: number;
  recordingUrl?: string;
  createdAt: Date;
}

export interface LeadScore {
  overall: number;
  intent: number;
  budgetMatch: number;
  timeline: number;
  engagement: number;
  calculatedAt: Date;
  modelVersion?: string;
}

export interface LeadQualification {
  status: LeadStatus;
  reason?: string;
  qualifiedBy?: string;
  qualifiedAt?: Date;
  lastQualified?: Date;
}

export interface LeadSourceDetails {
  campaignId?: string;
  adId?: string;
  referralCode?: string;
  partnerId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface SiteVisitRecord {
  propertyId: string;
  scheduledAt?: Date;
  completedAt?: Date;
  outcome?: string;
  feedback?: string;
  agentId?: string;
}

export interface LeadConversion {
  converted: boolean;
  convertedAt?: Date;
  convertedPropertyId?: string;
  dealValue?: number;
  commission?: number;
}

export interface Lead {
  _id?: string;
  id?: string;

  // Contact Info
  name: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  alternatePhone?: string;

  // Source Tracking
  source: LeadSource;
  sourceDetails?: LeadSourceDetails;

  // Segment Classification
  segment?: LeadSegment;
  nriProfile?: NRIProfile;
  hniProfile?: HNIProfile;

  // Preferences
  preferences?: LeadPreference;

  // Property Interest
  interestedPropertyIds?: string[];
  viewedProperties?: {
    propertyId: string;
    viewedAt: Date;
    duration?: number;
  }[];

  // AI Scoring
  aiScore?: LeadScore;

  // Qualification Status
  qualification?: LeadQualification;

  // Assignment
  assignedBrokerId?: string;
  assignedAgentId?: string;
  teamId?: string;

  // Interactions
  interactions?: LeadInteraction[];
  lastInteraction?: Date;
  nextFollowUp?: Date;

  // Site Visits
  siteVisits?: SiteVisitRecord[];

  // Conversion
  conversion?: LeadConversion;

  // Tags
  tags?: string[];

  // Company Assignment
  companyId?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// ===== REFERRAL TYPES =====

export interface ReferralReward {
  amount: number;
  currency: PaymentCurrency;
  type: RewardType;
  paid: boolean;
  paidAt?: Date;
  transactionId?: string;
}

export interface RefereeBenefits {
  discountPercent?: number;
  waiverAmount?: number;
  freeItems?: string[];
}

export interface ReferralConversion {
  converted: boolean;
  convertedAt?: Date;
  propertyId?: string;
  dealValue?: number;
  commissionEarned?: number;
}

export interface Referral {
  _id?: string;
  id?: string;

  // Referral Code
  code: string;
  shortCode?: string;

  // Referrer
  referrerId: string;
  referrerName?: string;
  referrerPhone?: string;

  // Referee
  refereeId?: string;
  refereeName?: string;
  refereePhone?: string;

  // Program
  programId?: string;
  programName?: string;

  // Level (for MLM)
  level?: number;

  // Source
  source?: 'whatsapp' | 'sms' | 'email' | 'social' | 'qr' | 'link' | 'agent';
  utmSource?: string;

  // Property Interest
  propertyId?: string;
  brokerId?: string;

  // Status
  status: ReferralStatus;

  // Rewards
  rewards?: {
    referrerEarned?: ReferralReward;
    refereeBenefits?: RefereeBenefits;
  };

  // Conversion Tracking
  conversion?: ReferralConversion;

  // Timeline
  registeredAt?: Date;
  firstInterestAt?: Date;
  firstVisitAt?: Date;
  qualifiedAt?: Date;
  convertedAt?: Date;

  // Expiry
  expiresAt?: Date;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface PayoutConfig {
  level: number;
  rewardType: RewardType;
  rewardValue: number;
  currency: PaymentCurrency;
  minPropertyValue?: number;
  maxPayout?: number;
  conditions?: string;
}

export interface QualificationCriteria {
  minPropertyValue?: number;
  currencies: PaymentCurrency[];
  requireSiteVisit: boolean;
  requireRegistration: boolean;
}

export interface PayoutSettings {
  autoPayout: boolean;
  payoutTrigger: PayoutTrigger;
  payoutDelay?: number;
  walletIntegration?: 'rez_wallet' | 'bank' | 'upi' | 'bank_transfer';
}

export interface ReferralProgram {
  _id?: string;
  id?: string;

  name: string;
  description?: string;
  country: Country | 'BOTH';

  // Validity
  validFrom?: Date;
  validUntil?: Date;
  active: boolean;

  // Levels Configuration (MLM)
  levels: PayoutConfig[];
  maxLevels: number;

  // Qualifying Conditions
  qualificationCriteria?: QualificationCriteria;

  // Payout Settings
  payoutSettings?: PayoutSettings;

  // Limits
  maxReferralsPerUser?: number;
  maxPayoutPerUser?: number;
  maxTotalPayout?: number;

  // Counters
  totalReferrals?: number;
  totalPayout?: number;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface ReferralEarning {
  _id?: string;
  id?: string;

  referralId: string;
  userId: string;
  level: number;

  // Amount
  amount: number;
  currency: PaymentCurrency;

  // Source of earning
  source?: 'referral_signup' | 'referral_visit' | 'referral_conversion';

  // Status
  status: 'pending' | 'approved' | 'paid' | 'cancelled';

  // Payout
  payoutId?: string;
  paidAt?: Date;
  transactionId?: string;

  // Validation
  validatedAt?: Date;
  validatedBy?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// ===== BROKER TYPES =====

export interface BrokerLicense {
  number?: string;
  type?: BrokerLicenseType;
  state?: string;
  reraNumber?: string;
  validUntil?: Date;
  verified: boolean;
}

export interface BrokerCoverage {
  countries: Country[];
  cities: string[];
  localities?: string[];
}

export interface BrokerStats {
  totalListings: number;
  activeListings: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalDeals: number;
  totalVolume: number;
  avgDealSize: number;
  rating: number;
  reviewCount: number;
}

export interface CustomCommissionRate {
  propertyType?: PropertyType;
  listingType?: ListingType;
  rate: number;
  minCommission?: number;
}

export interface BrokerCommission {
  defaultRate?: number;
  customRates?: CustomCommissionRate[];
  splitWithCompany?: number;
}

export interface BrokerWalletBalance {
  available: number;
  pending: number;
  currency: PaymentCurrency;
}

export interface BrokerVerification {
  documentsSubmitted: boolean;
  documentsVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface Broker {
  _id?: string;
  id?: string;

  // Basic Info
  userId: string;
  name: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  profileImage?: string;

  // Company
  companyName?: string;
  companyLogo?: string;
  dhaLicense?: string;

  // Licensing
  license?: BrokerLicense;

  // Coverage
  coverage?: BrokerCoverage;

  // Specializations
  specializations?: string[];
  languages?: string[];

  // Performance
  stats?: BrokerStats;

  // Commission
  commission?: BrokerCommission;

  // Team
  teamId?: string;
  teamRole?: TeamRole;
  agents?: string[];

  // Hierarchy (for MLM)
  uplineBrokerId?: string;
  downlineBrokers?: string[];

  // Wallet
  walletBalance?: BrokerWalletBalance;

  // Status
  status: BrokerStatus;

  // Verification
  verification?: BrokerVerification;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface TeamStats {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalVolume: number;
}

export interface TeamCommissionPool {
  total: number;
  distributed: number;
}

export interface Team {
  _id?: string;
  id?: string;

  name: string;
  managerId: string;
  parentTeamId?: string;

  // Coverage
  coverage?: {
    countries: Country[];
    cities: string[];
  };

  // Members
  memberCount: number;

  // Performance
  stats?: TeamStats;

  // Commission Pool
  commissionPool?: TeamCommissionPool;

  // Status
  active: boolean;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// ===== VISA TYPES =====

export interface PropertyInvestment {
  propertyId?: string;
  propertyValue?: number;
  currency?: PaymentCurrency;
  ownershipPercentage?: number;
  proofDocument?: string;
}

export interface EligibilityPoints {
  age?: { required: number; earned: number };
  investment?: { required: number; earned: number };
  language?: { required: number; earned: number };
  experience?: { required: number; earned: number };
  education?: { required: number; earned: number };
}

export interface VisaCriteria {
  programType: VisaProgramType;
  country: Country;
  minimumInvestment: number;
  currency: PaymentCurrency;
  investmentTypes?: string[];
  points?: EligibilityPoints;
  totalPoints?: number;
  passingPoints?: number;
  passed?: boolean;
}

export interface VisaDocument {
  id: string;
  type: string;
  name?: string;
  url?: string;
  status: DocumentStatus;
  uploadedAt?: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface VisaApplication {
  submittedAt?: Date;
  applicationId?: string;
  status?: string;
  lastUpdated?: Date;
  nextStep?: string;
  notes?: string;
}

export interface VisaAssessment {
  status: VisaAssessmentStatus;
  eligibilityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedApprovalChance: number;
}

export interface VisaProfile {
  nationality?: string;
  currentVisa?: string;
  age?: number;
  maritalStatus?: string;
  dependents?: number;
  annualIncome?: number;
  incomeCurrency?: PaymentCurrency;
  netWorth?: number;
  employmentStatus?: string;
  educationLevel?: string;
}

export interface VisaEligibility {
  _id?: string;
  id?: string;

  // User Info
  userId: string;
  email?: string;
  phone?: string;

  // Country/Territory
  country: Country;
  emirates?: string[];

  // Assessment
  assessment: VisaAssessment;

  // Profile
  profile?: VisaProfile;

  // Investment Details
  investments?: PropertyInvestment[];
  totalInvestmentValue?: number;

  // Eligibility Criteria
  criteria?: VisaCriteria;

  // Documents
  documents?: VisaDocument[];
  missingDocuments?: string[];

  // Application
  application?: VisaApplication;

  // Agent/Advisor
  assignedAdvisorId?: string;

  // Validity
  visaValidFrom?: Date;
  visaValidUntil?: Date;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// ===== CRM TYPES =====

export interface AISuggestion {
  recommendedAction?: string;
  recommendedTime?: Date;
  bestChannel?: string;
  confidence?: number;
}

export interface FollowUp {
  _id?: string;
  id?: string;

  // References
  leadId: string;
  brokerId: string;
  agentId?: string;

  // Task Details
  type: FollowUpType;
  priority: FollowUpPriority;

  // Scheduling
  scheduledAt: Date;
  duration?: number;
  timezone?: string;

  // Status
  status: FollowUpStatus;

  // Outcome
  outcome?: string;
  notes?: string;
  recordingUrl?: string;

  // AI Features
  aiSuggestion?: AISuggestion;

  // Completion
  completedAt?: Date;
  completedBy?: string;

  // Reschedule
  rescheduledFrom?: Date;
  rescheduleCount: number;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface SiteVisitAttendee {
  name?: string;
  phone?: string;
  role?: string;
}

export interface SiteVisitFeedback {
  rating?: number;
  comments?: string;
  interestedProperties?: string[];
  objections?: string[];
  nextSteps?: string;
}

export interface SiteVisit {
  _id?: string;
  id?: string;

  leadId: string;
  brokerId: string;
  propertyId: string;

  // Scheduling
  scheduledAt: Date;
  estimatedDuration?: number;
  timezone?: string;

  // Location
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  landmark?: string;

  // Status
  status: SiteVisitStatus;

  // Attendees
  attendees?: SiteVisitAttendee[];

  // Agent
  agentId?: string;

  // Outcome
  feedback?: SiteVisitFeedback;

  // Completion
  startedAt?: Date;
  completedAt?: Date;

  // WhatsApp Integration
  reminderSent: boolean;
  reminderSentAt?: Date;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// ===== EVENT TYPES =====

export enum RisnaEventType {
  // Property Events
  PROPERTY_CREATED = 'risna.property.created',
  PROPERTY_UPDATED = 'risna.property.updated',
  PROPERTY_PUBLISHED = 'risna.property.published',
  PROPERTY_VIEWED = 'risna.property.viewed',
  PROPERTY_INQUIRED = 'risna.property.inquired',
  PROPERTY_SHORTLISTED = 'risna.property.shortlisted',

  // Lead Events
  LEAD_CREATED = 'risna.lead.created',
  LEAD_UPDATED = 'risna.lead.updated',
  LEAD_SCORED = 'risna.lead.scored',
  LEAD_QUALIFIED = 'risna.lead.qualified',
  LEAD_ASSIGNED = 'risna.lead.assigned',
  LEAD_CONVERTED = 'risna.lead.converted',
  LEAD_INTERACTION = 'risna.lead.interaction',

  // Site Visit Events
  SITE_VISIT_SCHEDULED = 'risna.sitevisit.scheduled',
  SITE_VISIT_STARTED = 'risna.sitevisit.started',
  SITE_VISIT_COMPLETED = 'risna.sitevisit.completed',

  // Referral Events
  REFERRAL_CREATED = 'risna.referral.created',
  REFERRAL_REGISTERED = 'risna.referral.registered',
  REFERRAL_VISITED = 'risna.referral.visited',
  REFERRAL_CONVERTED = 'risna.referral.converted',
  REFERRAL_REWARD_EARNED = 'risna.referral.reward.earned',
  REFERRAL_REWARD_PAID = 'risna.referral.reward.paid',

  // Visa Events
  VISA_ASSESSMENT_STARTED = 'risna.visa.assessment.started',
  VISA_ASSESSMENT_COMPLETED = 'risna.visa.assessment.completed',
  VISA_DOCUMENT_UPLOADED = 'risna.visa.document.uploaded',

  // Broker Events
  BROKER_REGISTERED = 'risna.broker.registered',
  BROKER_VERIFIED = 'risna.broker.verified',
  BROKER_COMMISSION_EARNED = 'risna.broker.commission.earned',
  BROKER_COMMISSION_PAID = 'risna.broker.commission.paid',

  // CRM Events
  FOLLOWUP_CREATED = 'risna.crm.followup.created',
  FOLLOWUP_COMPLETED = 'risna.crm.followup.completed',
  FOLLOWUP_MISSED = 'risna.crm.followup.missed',

  // AI Events
  AI_LEAD_SCORED = 'risna.ai.lead.scored',
  AI_PRICE_RECOMMENDED = 'risna.ai.price.recommended',
  AI_PROPERTY_MATCHED = 'risna.ai.property.matched'
}

export interface RisnaEvent {
  id: string;
  type: RisnaEventType;
  source: string;
  company: 'RisnaEstate';
  userId?: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: {
    sessionId?: string;
    deviceId?: string;
    ip?: string;
    location?: { lat: number; lng: number };
  };
}

// ===== ZOD SCHEMAS =====

export const GeoLocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()])
});

export const PriceInfoSchema = z.object({
  amount: z.number().min(0),
  currency: z.nativeEnum(PaymentCurrency),
  displayPrice: z.string().optional(),
  pricePerSqFt: z.number().optional(),
  totalPlotArea: z.number().optional()
});

export const PropertyMediaSchema = z.object({
  type: z.enum(['image', 'video', 'virtualTour', 'floorPlan']),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().optional(),
  isPrimary: z.boolean().default(false),
  order: z.number().default(0)
});

export const PropertySchema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  description: z.string().min(1),
  descriptionAr: z.string().optional(),
  propertyType: z.nativeEnum(PropertyType),
  listingType: z.nativeEnum(ListingType),
  status: z.nativeEnum(PropertyStatus).default(PropertyStatus.DRAFT),
  country: z.nativeEnum(Country),
  city: z.string().min(1),
  locality: z.string().min(1),
  subLocality: z.string().optional(),
  price: PriceInfoSchema,
  negotiable: z.boolean().default(true),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  carpetArea: z.number().optional(),
  furnishedStatus: z.enum(['furnished', 'semi-furnished', 'unfurnished']).optional(),
  amenities: z.array(z.string()).optional(),
  virtualTourUrl: z.string().url().optional()
});

export const CreateLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  whatsapp: z.string().optional(),
  source: z.nativeEnum(LeadSource),
  segment: z.nativeEnum(LeadSegment).optional(),
  preferences: z.object({
    propertyTypes: z.array(z.nativeEnum(PropertyType)).optional(),
    budget: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.nativeEnum(PaymentCurrency)
    }).optional(),
    timeline: z.enum(['immediate', '1-3months', '3-6months', '6-12months', 'exploring']).optional(),
    purpose: z.enum(['buy', 'invest', 'rent', 'pg']).optional()
  }).optional(),
  interestedPropertyIds: z.array(z.string()).optional()
});

export const CreateReferralSchema = z.object({
  code: z.string().min(1),
  referrerId: z.string().min(1),
  referrerPhone: z.string().optional(),
  refereePhone: z.string().optional(),
  source: z.enum(['whatsapp', 'sms', 'email', 'social', 'qr', 'link', 'agent']).optional(),
  propertyId: z.string().optional(),
  programId: z.string().optional()
});

export const CreateFollowUpSchema = z.object({
  leadId: z.string().min(1),
  type: z.nativeEnum(FollowUpType),
  priority: z.nativeEnum(FollowUpPriority).default(FollowUpPriority.MEDIUM),
  scheduledAt: z.string().datetime(),
  duration: z.number().optional(),
  notes: z.string().optional()
});

export const CreateSiteVisitSchema = z.object({
  leadId: z.string().min(1),
  propertyId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  estimatedDuration: z.number().optional(),
  attendees: z.array(z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    role: z.string().optional()
  })).optional()
});

export const CreateVisaAssessmentSchema = z.object({
  country: z.nativeEnum(Country),
  profile: z.object({
    nationality: z.string().optional(),
    age: z.number().min(18).optional(),
    maritalStatus: z.string().optional(),
    annualIncome: z.number().optional(),
    netWorth: z.number().optional()
  }).optional()
});

// ===== TYPE EXPORTS =====

export type {
  GeoLocation,
  PriceInfo,
  PropertyMedia,
  PropertyAddress,
  PropertyFeature,
  PropertyAIScore,
  PropertyIntentSignal,
  BudgetRange,
  LeadPreference,
  NRIProfile,
  HNIProfile,
  LeadInteraction,
  LeadScore,
  LeadQualification,
  LeadSourceDetails,
  SiteVisitRecord,
  LeadConversion,
  ReferralReward,
  RefereeBenefits,
  ReferralConversion,
  PayoutConfig,
  QualificationCriteria,
  PayoutSettings,
  ReferralEarning,
  BrokerLicense,
  BrokerCoverage,
  BrokerStats,
  CustomCommissionRate,
  BrokerCommission,
  BrokerWalletBalance,
  BrokerVerification,
  TeamStats,
  TeamCommissionPool,
  PropertyInvestment,
  EligibilityPoints,
  VisaCriteria,
  VisaDocument,
  VisaApplication,
  VisaAssessment,
  VisaProfile,
  AISuggestion,
  SiteVisitAttendee,
  SiteVisitFeedback,
  RisnaEvent
};


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'risna-shared-types',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
