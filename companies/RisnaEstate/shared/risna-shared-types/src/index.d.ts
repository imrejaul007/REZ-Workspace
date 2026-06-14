/**
 * RisnaEstate Shared Types
 *
 * Common TypeScript types for all RisnaEstate services.
 */
import { z } from 'zod';
export declare enum PropertyType {
    APARTMENT = "apartment",
    VILLA = "villa",
    PLOT = "plot",
    COMMERCIAL = "commercial",
    OFFICE = "office",
    RETAIL = "retail",
    WAREHOUSE = "warehouse",
    PENTHOUSE = "penthouse",
    TOWNHOUSE = "townhouse",
    DUPLEX = "duplex",
    STUDIO = "studio",
    BUNGALOW = "bungalow",
    LAND = "land",
    INDUSTRIAL = "industrial",
    MIXED_USE = "mixed_use"
}
export declare enum PropertyStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    SOLD = "sold",
    RENTED = "rented",
    UNDER_OFFER = "under_offer",
    WITHDRAWN = "withdrawn",
    EXPIRED = "expired"
}
export declare enum ListingType {
    SALE = "sale",
    RENT = "rent",
    LEASE = "lease",
    PG = "pg",
    CO_LIVING = "co_living"
}
export declare enum Country {
    INDIA = "IN",
    UAE = "AE"
}
export declare enum LeadSegment {
    NRI = "nri",
    HNI = "hni",
    MID_SEGMENT = "mid_segment",
    MASS_MARKET = "mass_market",
    INVESTOR = "investor",
    END_USER = "end_user"
}
export declare enum LeadSource {
    WEBSITE = "website",
    WHATSAPP = "whatsapp",
    REFERRAL = "referral",
    SOCIAL = "social",
    AGENT = "agent",
    PARTNER = "partner",
    AD = "ad",
    ORGANIC = "organic"
}
export declare enum LeadStatus {
    NEW = "new",
    CONTACTED = "contacted",
    QUALIFIED = "qualified",
    HOT = "hot",
    WARM = "warm",
    COLD = "cold",
    LOST = "lost",
    CONVERTED = "converted"
}
export declare enum ReferralStatus {
    PENDING = "pending",
    REGISTERED = "registered",
    INTERESTED = "interested",
    VISITED = "visited",
    QUALIFIED = "qualified",
    CONVERTED = "converted",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare enum VisaProgramType {
    GOLDEN_VISA = "golden_visa",
    SILVER_VISA = "silver_visa",
    INVESTOR_VISA = "investor_visa",
    RETIREMENT_VISA = "retirement_visa",
    FREELANCER_VISA = "freelancer_visa"
}
export declare enum BrokerLicenseType {
    BROKER = "broker",
    AGENT = "agent",
    FRANCHISE = "franchise"
}
export declare enum TeamRole {
    OWNER = "owner",
    MANAGER = "manager",
    SENIOR_AGENT = "senior_agent",
    AGENT = "agent",
    TRAINEE = "trainee"
}
export declare enum BrokerStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING_VERIFICATION = "pending_verification"
}
export declare enum HNITier {
    AFFLUENT = "affluent",
    HNWI = "hnwi",
    UHNI = "uhni",
    ULTRA_UHNI = "ultra_uhni"
}
export declare enum InvestmentExperience {
    NONE = "none",
    LIMITED = "limited",
    MODERATE = "moderate",
    EXTENSIVE = "extensive"
}
export declare enum PaymentCurrency {
    INR = "INR",
    AED = "AED",
    USD = "USD"
}
export declare enum FollowUpType {
    CALL = "call",
    WHATSAPP = "whatsapp",
    SITE_VISIT = "site_visit",
    MEETING = "meeting",
    EMAIL = "email",
    FOLLOW_UP = "follow_up",
    REMINDER = "reminder"
}
export declare enum FollowUpPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum FollowUpStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    SKIPPED = "skipped",
    RESCHEDULED = "rescheduled",
    NO_ANSWER = "no_answer"
}
export declare enum SiteVisitStatus {
    SCHEDULED = "scheduled",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
export declare enum DocumentStatus {
    PENDING = "pending",
    UPLOADED = "uploaded",
    VERIFIED = "verified",
    REJECTED = "rejected"
}
export declare enum VisaAssessmentStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    SUBMITTED = "submitted",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare enum RewardType {
    CASH = "cash",
    COINS = "coins",
    DISCOUNT = "discount",
    VOUCHER = "voucher"
}
export declare enum PayoutTrigger {
    IMMEDIATE = "immediate",
    ON_VISIT = "on_visit",
    ON_CONVERSION = "on_conversion"
}
export interface GeoLocation {
    type: 'Point';
    coordinates: [number, number];
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
    title: string;
    titleAr?: string;
    description: string;
    descriptionAr?: string;
    propertyType: PropertyType;
    listingType: ListingType;
    status: PropertyStatus;
    country: Country;
    city: string;
    locality: string;
    subLocality?: string;
    address: PropertyAddress;
    location?: GeoLocation;
    price: PriceInfo;
    negotiable: boolean;
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
    ownershipType?: 'freehold' | 'leasehold' | 'co-operative';
    RERARegistered?: boolean;
    reraId?: string;
    amenities?: string[];
    features?: PropertyFeature[];
    media?: PropertyMedia[];
    virtualTourUrl?: string;
    brokerId?: string;
    agentId?: string;
    ownerId?: string;
    aiScore?: PropertyAIScore;
    intentSignals?: PropertyIntentSignal[];
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    views?: number;
    inquiries?: number;
    shortlisted?: number;
    publishedAt?: Date;
    expiresAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
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
    name: string;
    email?: string;
    phone: string;
    whatsapp?: string;
    alternatePhone?: string;
    source: LeadSource;
    sourceDetails?: LeadSourceDetails;
    segment?: LeadSegment;
    nriProfile?: NRIProfile;
    hniProfile?: HNIProfile;
    preferences?: LeadPreference;
    interestedPropertyIds?: string[];
    viewedProperties?: {
        propertyId: string;
        viewedAt: Date;
        duration?: number;
    }[];
    aiScore?: LeadScore;
    qualification?: LeadQualification;
    assignedBrokerId?: string;
    assignedAgentId?: string;
    teamId?: string;
    interactions?: LeadInteraction[];
    lastInteraction?: Date;
    nextFollowUp?: Date;
    siteVisits?: SiteVisitRecord[];
    conversion?: LeadConversion;
    tags?: string[];
    companyId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
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
    code: string;
    shortCode?: string;
    referrerId: string;
    referrerName?: string;
    referrerPhone?: string;
    refereeId?: string;
    refereeName?: string;
    refereePhone?: string;
    programId?: string;
    programName?: string;
    level?: number;
    source?: 'whatsapp' | 'sms' | 'email' | 'social' | 'qr' | 'link' | 'agent';
    utmSource?: string;
    propertyId?: string;
    brokerId?: string;
    status: ReferralStatus;
    rewards?: {
        referrerEarned?: ReferralReward;
        refereeBenefits?: RefereeBenefits;
    };
    conversion?: ReferralConversion;
    registeredAt?: Date;
    firstInterestAt?: Date;
    firstVisitAt?: Date;
    qualifiedAt?: Date;
    convertedAt?: Date;
    expiresAt?: Date;
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
    validFrom?: Date;
    validUntil?: Date;
    active: boolean;
    levels: PayoutConfig[];
    maxLevels: number;
    qualificationCriteria?: QualificationCriteria;
    payoutSettings?: PayoutSettings;
    maxReferralsPerUser?: number;
    maxPayoutPerUser?: number;
    maxTotalPayout?: number;
    totalReferrals?: number;
    totalPayout?: number;
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
    amount: number;
    currency: PaymentCurrency;
    source?: 'referral_signup' | 'referral_visit' | 'referral_conversion';
    status: 'pending' | 'approved' | 'paid' | 'cancelled';
    payoutId?: string;
    paidAt?: Date;
    transactionId?: string;
    validatedAt?: Date;
    validatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
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
    userId: string;
    name: string;
    email?: string;
    phone: string;
    whatsapp?: string;
    profileImage?: string;
    companyName?: string;
    companyLogo?: string;
    dhaLicense?: string;
    license?: BrokerLicense;
    coverage?: BrokerCoverage;
    specializations?: string[];
    languages?: string[];
    stats?: BrokerStats;
    commission?: BrokerCommission;
    teamId?: string;
    teamRole?: TeamRole;
    agents?: string[];
    uplineBrokerId?: string;
    downlineBrokers?: string[];
    walletBalance?: BrokerWalletBalance;
    status: BrokerStatus;
    verification?: BrokerVerification;
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
    coverage?: {
        countries: Country[];
        cities: string[];
    };
    memberCount: number;
    stats?: TeamStats;
    commissionPool?: TeamCommissionPool;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
export interface PropertyInvestment {
    propertyId?: string;
    propertyValue?: number;
    currency?: PaymentCurrency;
    ownershipPercentage?: number;
    proofDocument?: string;
}
export interface EligibilityPoints {
    age?: {
        required: number;
        earned: number;
    };
    investment?: {
        required: number;
        earned: number;
    };
    language?: {
        required: number;
        earned: number;
    };
    experience?: {
        required: number;
        earned: number;
    };
    education?: {
        required: number;
        earned: number;
    };
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
    userId: string;
    email?: string;
    phone?: string;
    country: Country;
    emirates?: string[];
    assessment: VisaAssessment;
    profile?: VisaProfile;
    investments?: PropertyInvestment[];
    totalInvestmentValue?: number;
    criteria?: VisaCriteria;
    documents?: VisaDocument[];
    missingDocuments?: string[];
    application?: VisaApplication;
    assignedAdvisorId?: string;
    visaValidFrom?: Date;
    visaValidUntil?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
export interface AISuggestion {
    recommendedAction?: string;
    recommendedTime?: Date;
    bestChannel?: string;
    confidence?: number;
}
export interface FollowUp {
    _id?: string;
    id?: string;
    leadId: string;
    brokerId: string;
    agentId?: string;
    type: FollowUpType;
    priority: FollowUpPriority;
    scheduledAt: Date;
    duration?: number;
    timezone?: string;
    status: FollowUpStatus;
    outcome?: string;
    notes?: string;
    recordingUrl?: string;
    aiSuggestion?: AISuggestion;
    completedAt?: Date;
    completedBy?: string;
    rescheduledFrom?: Date;
    rescheduleCount: number;
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
    scheduledAt: Date;
    estimatedDuration?: number;
    timezone?: string;
    address?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    landmark?: string;
    status: SiteVisitStatus;
    attendees?: SiteVisitAttendee[];
    agentId?: string;
    feedback?: SiteVisitFeedback;
    startedAt?: Date;
    completedAt?: Date;
    reminderSent: boolean;
    reminderSentAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
export declare enum RisnaEventType {
    PROPERTY_CREATED = "risna.property.created",
    PROPERTY_UPDATED = "risna.property.updated",
    PROPERTY_PUBLISHED = "risna.property.published",
    PROPERTY_VIEWED = "risna.property.viewed",
    PROPERTY_INQUIRED = "risna.property.inquired",
    PROPERTY_SHORTLISTED = "risna.property.shortlisted",
    LEAD_CREATED = "risna.lead.created",
    LEAD_UPDATED = "risna.lead.updated",
    LEAD_SCORED = "risna.lead.scored",
    LEAD_QUALIFIED = "risna.lead.qualified",
    LEAD_ASSIGNED = "risna.lead.assigned",
    LEAD_CONVERTED = "risna.lead.converted",
    LEAD_INTERACTION = "risna.lead.interaction",
    SITE_VISIT_SCHEDULED = "risna.sitevisit.scheduled",
    SITE_VISIT_STARTED = "risna.sitevisit.started",
    SITE_VISIT_COMPLETED = "risna.sitevisit.completed",
    REFERRAL_CREATED = "risna.referral.created",
    REFERRAL_REGISTERED = "risna.referral.registered",
    REFERRAL_VISITED = "risna.referral.visited",
    REFERRAL_CONVERTED = "risna.referral.converted",
    REFERRAL_REWARD_EARNED = "risna.referral.reward.earned",
    REFERRAL_REWARD_PAID = "risna.referral.reward.paid",
    VISA_ASSESSMENT_STARTED = "risna.visa.assessment.started",
    VISA_ASSESSMENT_COMPLETED = "risna.visa.assessment.completed",
    VISA_DOCUMENT_UPLOADED = "risna.visa.document.uploaded",
    BROKER_REGISTERED = "risna.broker.registered",
    BROKER_VERIFIED = "risna.broker.verified",
    BROKER_COMMISSION_EARNED = "risna.broker.commission.earned",
    BROKER_COMMISSION_PAID = "risna.broker.commission.paid",
    FOLLOWUP_CREATED = "risna.crm.followup.created",
    FOLLOWUP_COMPLETED = "risna.crm.followup.completed",
    FOLLOWUP_MISSED = "risna.crm.followup.missed",
    AI_LEAD_SCORED = "risna.ai.lead.scored",
    AI_PRICE_RECOMMENDED = "risna.ai.price.recommended",
    AI_PROPERTY_MATCHED = "risna.ai.property.matched"
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
        location?: {
            lat: number;
            lng: number;
        };
    };
}
export declare const GeoLocationSchema: z.ZodObject<{
    type: z.ZodLiteral<"Point">;
    coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
}, "strip", z.ZodTypeAny, {
    type: "Point";
    coordinates: [number, number];
}, {
    type: "Point";
    coordinates: [number, number];
}>;
export declare const PriceInfoSchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodNativeEnum<typeof PaymentCurrency>;
    displayPrice: z.ZodOptional<z.ZodString>;
    pricePerSqFt: z.ZodOptional<z.ZodNumber>;
    totalPlotArea: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    currency: PaymentCurrency;
    displayPrice?: string | undefined;
    pricePerSqFt?: number | undefined;
    totalPlotArea?: number | undefined;
}, {
    amount: number;
    currency: PaymentCurrency;
    displayPrice?: string | undefined;
    pricePerSqFt?: number | undefined;
    totalPlotArea?: number | undefined;
}>;
export declare const PropertyMediaSchema: z.ZodObject<{
    type: z.ZodEnum<["image", "video", "virtualTour", "floorPlan"]>;
    url: z.ZodString;
    thumbnailUrl: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    isPrimary: z.ZodDefault<z.ZodBoolean>;
    order: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    url: string;
    type: "image" | "video" | "virtualTour" | "floorPlan";
    isPrimary: boolean;
    order: number;
    thumbnailUrl?: string | undefined;
    caption?: string | undefined;
}, {
    url: string;
    type: "image" | "video" | "virtualTour" | "floorPlan";
    thumbnailUrl?: string | undefined;
    caption?: string | undefined;
    isPrimary?: boolean | undefined;
    order?: number | undefined;
}>;
export declare const PropertySchema: z.ZodObject<{
    title: z.ZodString;
    titleAr: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    descriptionAr: z.ZodOptional<z.ZodString>;
    propertyType: z.ZodNativeEnum<typeof PropertyType>;
    listingType: z.ZodNativeEnum<typeof ListingType>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof PropertyStatus>>;
    country: z.ZodNativeEnum<typeof Country>;
    city: z.ZodString;
    locality: z.ZodString;
    subLocality: z.ZodOptional<z.ZodString>;
    price: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodNativeEnum<typeof PaymentCurrency>;
        displayPrice: z.ZodOptional<z.ZodString>;
        pricePerSqFt: z.ZodOptional<z.ZodNumber>;
        totalPlotArea: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        currency: PaymentCurrency;
        displayPrice?: string | undefined;
        pricePerSqFt?: number | undefined;
        totalPlotArea?: number | undefined;
    }, {
        amount: number;
        currency: PaymentCurrency;
        displayPrice?: string | undefined;
        pricePerSqFt?: number | undefined;
        totalPlotArea?: number | undefined;
    }>;
    negotiable: z.ZodDefault<z.ZodBoolean>;
    bedrooms: z.ZodOptional<z.ZodNumber>;
    bathrooms: z.ZodOptional<z.ZodNumber>;
    carpetArea: z.ZodOptional<z.ZodNumber>;
    furnishedStatus: z.ZodOptional<z.ZodEnum<["furnished", "semi-furnished", "unfurnished"]>>;
    amenities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    virtualTourUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: PropertyStatus;
    country: Country;
    city: string;
    propertyType: PropertyType;
    listingType: ListingType;
    title: string;
    description: string;
    locality: string;
    price: {
        amount: number;
        currency: PaymentCurrency;
        displayPrice?: string | undefined;
        pricePerSqFt?: number | undefined;
        totalPlotArea?: number | undefined;
    };
    negotiable: boolean;
    titleAr?: string | undefined;
    descriptionAr?: string | undefined;
    subLocality?: string | undefined;
    bedrooms?: number | undefined;
    bathrooms?: number | undefined;
    carpetArea?: number | undefined;
    furnishedStatus?: "furnished" | "semi-furnished" | "unfurnished" | undefined;
    amenities?: string[] | undefined;
    virtualTourUrl?: string | undefined;
}, {
    country: Country;
    city: string;
    propertyType: PropertyType;
    listingType: ListingType;
    title: string;
    description: string;
    locality: string;
    price: {
        amount: number;
        currency: PaymentCurrency;
        displayPrice?: string | undefined;
        pricePerSqFt?: number | undefined;
        totalPlotArea?: number | undefined;
    };
    status?: PropertyStatus | undefined;
    titleAr?: string | undefined;
    descriptionAr?: string | undefined;
    subLocality?: string | undefined;
    negotiable?: boolean | undefined;
    bedrooms?: number | undefined;
    bathrooms?: number | undefined;
    carpetArea?: number | undefined;
    furnishedStatus?: "furnished" | "semi-furnished" | "unfurnished" | undefined;
    amenities?: string[] | undefined;
    virtualTourUrl?: string | undefined;
}>;
export declare const CreateLeadSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodString;
    whatsapp: z.ZodOptional<z.ZodString>;
    source: z.ZodNativeEnum<typeof LeadSource>;
    segment: z.ZodOptional<z.ZodNativeEnum<typeof LeadSegment>>;
    preferences: z.ZodOptional<z.ZodObject<{
        propertyTypes: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof PropertyType>, "many">>;
        budget: z.ZodOptional<z.ZodObject<{
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
            currency: z.ZodNativeEnum<typeof PaymentCurrency>;
        }, "strip", z.ZodTypeAny, {
            currency: PaymentCurrency;
            max?: number | undefined;
            min?: number | undefined;
        }, {
            currency: PaymentCurrency;
            max?: number | undefined;
            min?: number | undefined;
        }>>;
        timeline: z.ZodOptional<z.ZodEnum<["immediate", "1-3months", "3-6months", "6-12months", "exploring"]>>;
        purpose: z.ZodOptional<z.ZodEnum<["buy", "invest", "rent", "pg"]>>;
    }, "strip", z.ZodTypeAny, {
        timeline?: "immediate" | "1-3months" | "3-6months" | "6-12months" | "exploring" | undefined;
        budget?: {
            currency: PaymentCurrency;
            max?: number | undefined;
            min?: number | undefined;
        } | undefined;
        propertyTypes?: PropertyType[] | undefined;
        purpose?: "rent" | "pg" | "buy" | "invest" | undefined;
    }, {
        timeline?: "immediate" | "1-3months" | "3-6months" | "6-12months" | "exploring" | undefined;
        budget?: {
            currency: PaymentCurrency;
            max?: number | undefined;
            min?: number | undefined;
        } | undefined;
        propertyTypes?: PropertyType[] | undefined;
        purpose?: "rent" | "pg" | "buy" | "invest" | undefined;
    }>>;
    interestedPropertyIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    source: LeadSource;
    email?: string | undefined;
    segment?: LeadSegment | undefined;
    whatsapp?: string | undefined;
    preferences?: {
        timeline?: "immediate" | "1-3months" | "3-6months" | "6-12months" | "exploring" | undefined;
        budget?: {
            currency: PaymentCurrency;
            max?: number | undefined;
            min?: number | undefined;
        } | undefined;
        propertyTypes?: PropertyType[] | undefined;
        purpose?: "rent" | "pg" | "buy" | "invest" | undefined;
    } | undefined;
    interestedPropertyIds?: string[] | undefined;
}, {
    name: string;
    phone: string;
    source: LeadSource;
    email?: string | undefined;
    segment?: LeadSegment | undefined;
    whatsapp?: string | undefined;
    preferences?: {
        timeline?: "immediate" | "1-3months" | "3-6months" | "6-12months" | "exploring" | undefined;
        budget?: {
            currency: PaymentCurrency;
            max?: number | undefined;
            min?: number | undefined;
        } | undefined;
        propertyTypes?: PropertyType[] | undefined;
        purpose?: "rent" | "pg" | "buy" | "invest" | undefined;
    } | undefined;
    interestedPropertyIds?: string[] | undefined;
}>;
export declare const CreateReferralSchema: z.ZodObject<{
    code: z.ZodString;
    referrerId: z.ZodString;
    referrerPhone: z.ZodOptional<z.ZodString>;
    refereePhone: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodEnum<["whatsapp", "sms", "email", "social", "qr", "link", "agent"]>>;
    propertyId: z.ZodOptional<z.ZodString>;
    programId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    referrerId: string;
    propertyId?: string | undefined;
    source?: "link" | "email" | "whatsapp" | "social" | "agent" | "sms" | "qr" | undefined;
    referrerPhone?: string | undefined;
    refereePhone?: string | undefined;
    programId?: string | undefined;
}, {
    code: string;
    referrerId: string;
    propertyId?: string | undefined;
    source?: "link" | "email" | "whatsapp" | "social" | "agent" | "sms" | "qr" | undefined;
    referrerPhone?: string | undefined;
    refereePhone?: string | undefined;
    programId?: string | undefined;
}>;
export declare const CreateFollowUpSchema: z.ZodObject<{
    leadId: z.ZodString;
    type: z.ZodNativeEnum<typeof FollowUpType>;
    priority: z.ZodDefault<z.ZodNativeEnum<typeof FollowUpPriority>>;
    scheduledAt: z.ZodString;
    duration: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    leadId: string;
    type: FollowUpType;
    scheduledAt: string;
    priority: FollowUpPriority;
    duration?: number | undefined;
    notes?: string | undefined;
}, {
    leadId: string;
    type: FollowUpType;
    scheduledAt: string;
    priority?: FollowUpPriority | undefined;
    duration?: number | undefined;
    notes?: string | undefined;
}>;
export declare const CreateSiteVisitSchema: z.ZodObject<{
    leadId: z.ZodString;
    propertyId: z.ZodString;
    scheduledAt: z.ZodString;
    estimatedDuration: z.ZodOptional<z.ZodNumber>;
    attendees: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        phone?: string | undefined;
        role?: string | undefined;
    }, {
        name?: string | undefined;
        phone?: string | undefined;
        role?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    leadId: string;
    propertyId: string;
    scheduledAt: string;
    estimatedDuration?: number | undefined;
    attendees?: {
        name?: string | undefined;
        phone?: string | undefined;
        role?: string | undefined;
    }[] | undefined;
}, {
    leadId: string;
    propertyId: string;
    scheduledAt: string;
    estimatedDuration?: number | undefined;
    attendees?: {
        name?: string | undefined;
        phone?: string | undefined;
        role?: string | undefined;
    }[] | undefined;
}>;
export declare const CreateVisaAssessmentSchema: z.ZodObject<{
    country: z.ZodNativeEnum<typeof Country>;
    profile: z.ZodOptional<z.ZodObject<{
        nationality: z.ZodOptional<z.ZodString>;
        age: z.ZodOptional<z.ZodNumber>;
        maritalStatus: z.ZodOptional<z.ZodString>;
        annualIncome: z.ZodOptional<z.ZodNumber>;
        netWorth: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        age?: number | undefined;
        nationality?: string | undefined;
        maritalStatus?: string | undefined;
        annualIncome?: number | undefined;
        netWorth?: number | undefined;
    }, {
        age?: number | undefined;
        nationality?: string | undefined;
        maritalStatus?: string | undefined;
        annualIncome?: number | undefined;
        netWorth?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    country: Country;
    profile?: {
        age?: number | undefined;
        nationality?: string | undefined;
        maritalStatus?: string | undefined;
        annualIncome?: number | undefined;
        netWorth?: number | undefined;
    } | undefined;
}, {
    country: Country;
    profile?: {
        age?: number | undefined;
        nationality?: string | undefined;
        maritalStatus?: string | undefined;
        annualIncome?: number | undefined;
        netWorth?: number | undefined;
    } | undefined;
}>;
export type { GeoLocation, PriceInfo, PropertyMedia, PropertyAddress, PropertyFeature, PropertyAIScore, PropertyIntentSignal, BudgetRange, LeadPreference, NRIProfile, HNIProfile, LeadInteraction, LeadScore, LeadQualification, LeadSourceDetails, SiteVisitRecord, LeadConversion, ReferralReward, RefereeBenefits, ReferralConversion, PayoutConfig, QualificationCriteria, PayoutSettings, ReferralEarning, BrokerLicense, BrokerCoverage, BrokerStats, CustomCommissionRate, BrokerCommission, BrokerWalletBalance, BrokerVerification, TeamStats, TeamCommissionPool, PropertyInvestment, EligibilityPoints, VisaCriteria, VisaDocument, VisaApplication, VisaAssessment, VisaProfile, AISuggestion, SiteVisitAttendee, SiteVisitFeedback, RisnaEvent };
