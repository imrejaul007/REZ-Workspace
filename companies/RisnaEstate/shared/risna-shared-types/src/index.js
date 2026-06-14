"use strict";
/**
 * RisnaEstate Shared Types
 *
 * Common TypeScript types for all RisnaEstate services.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVisaAssessmentSchema = exports.CreateSiteVisitSchema = exports.CreateFollowUpSchema = exports.CreateReferralSchema = exports.CreateLeadSchema = exports.PropertySchema = exports.PropertyMediaSchema = exports.PriceInfoSchema = exports.GeoLocationSchema = exports.RisnaEventType = exports.PayoutTrigger = exports.RewardType = exports.VisaAssessmentStatus = exports.DocumentStatus = exports.SiteVisitStatus = exports.FollowUpStatus = exports.FollowUpPriority = exports.FollowUpType = exports.PaymentCurrency = exports.InvestmentExperience = exports.HNITier = exports.BrokerStatus = exports.TeamRole = exports.BrokerLicenseType = exports.VisaProgramType = exports.ReferralStatus = exports.LeadStatus = exports.LeadSource = exports.LeadSegment = exports.Country = exports.ListingType = exports.PropertyStatus = exports.PropertyType = void 0;
const zod_1 = require("zod");
// ===== ENUMS =====
var PropertyType;
(function (PropertyType) {
    PropertyType["APARTMENT"] = "apartment";
    PropertyType["VILLA"] = "villa";
    PropertyType["PLOT"] = "plot";
    PropertyType["COMMERCIAL"] = "commercial";
    PropertyType["OFFICE"] = "office";
    PropertyType["RETAIL"] = "retail";
    PropertyType["WAREHOUSE"] = "warehouse";
    PropertyType["PENTHOUSE"] = "penthouse";
    PropertyType["TOWNHOUSE"] = "townhouse";
    PropertyType["DUPLEX"] = "duplex";
    PropertyType["STUDIO"] = "studio";
    PropertyType["BUNGALOW"] = "bungalow";
    PropertyType["LAND"] = "land";
    PropertyType["INDUSTRIAL"] = "industrial";
    PropertyType["MIXED_USE"] = "mixed_use";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
var PropertyStatus;
(function (PropertyStatus) {
    PropertyStatus["DRAFT"] = "draft";
    PropertyStatus["ACTIVE"] = "active";
    PropertyStatus["SOLD"] = "sold";
    PropertyStatus["RENTED"] = "rented";
    PropertyStatus["UNDER_OFFER"] = "under_offer";
    PropertyStatus["WITHDRAWN"] = "withdrawn";
    PropertyStatus["EXPIRED"] = "expired";
})(PropertyStatus || (exports.PropertyStatus = PropertyStatus = {}));
var ListingType;
(function (ListingType) {
    ListingType["SALE"] = "sale";
    ListingType["RENT"] = "rent";
    ListingType["LEASE"] = "lease";
    ListingType["PG"] = "pg";
    ListingType["CO_LIVING"] = "co_living";
})(ListingType || (exports.ListingType = ListingType = {}));
var Country;
(function (Country) {
    Country["INDIA"] = "IN";
    Country["UAE"] = "AE";
})(Country || (exports.Country = Country = {}));
var LeadSegment;
(function (LeadSegment) {
    LeadSegment["NRI"] = "nri";
    LeadSegment["HNI"] = "hni";
    LeadSegment["MID_SEGMENT"] = "mid_segment";
    LeadSegment["MASS_MARKET"] = "mass_market";
    LeadSegment["INVESTOR"] = "investor";
    LeadSegment["END_USER"] = "end_user";
})(LeadSegment || (exports.LeadSegment = LeadSegment = {}));
var LeadSource;
(function (LeadSource) {
    LeadSource["WEBSITE"] = "website";
    LeadSource["WHATSAPP"] = "whatsapp";
    LeadSource["REFERRAL"] = "referral";
    LeadSource["SOCIAL"] = "social";
    LeadSource["AGENT"] = "agent";
    LeadSource["PARTNER"] = "partner";
    LeadSource["AD"] = "ad";
    LeadSource["ORGANIC"] = "organic";
})(LeadSource || (exports.LeadSource = LeadSource = {}));
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "new";
    LeadStatus["CONTACTED"] = "contacted";
    LeadStatus["QUALIFIED"] = "qualified";
    LeadStatus["HOT"] = "hot";
    LeadStatus["WARM"] = "warm";
    LeadStatus["COLD"] = "cold";
    LeadStatus["LOST"] = "lost";
    LeadStatus["CONVERTED"] = "converted";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var ReferralStatus;
(function (ReferralStatus) {
    ReferralStatus["PENDING"] = "pending";
    ReferralStatus["REGISTERED"] = "registered";
    ReferralStatus["INTERESTED"] = "interested";
    ReferralStatus["VISITED"] = "visited";
    ReferralStatus["QUALIFIED"] = "qualified";
    ReferralStatus["CONVERTED"] = "converted";
    ReferralStatus["EXPIRED"] = "expired";
    ReferralStatus["CANCELLED"] = "cancelled";
})(ReferralStatus || (exports.ReferralStatus = ReferralStatus = {}));
var VisaProgramType;
(function (VisaProgramType) {
    VisaProgramType["GOLDEN_VISA"] = "golden_visa";
    VisaProgramType["SILVER_VISA"] = "silver_visa";
    VisaProgramType["INVESTOR_VISA"] = "investor_visa";
    VisaProgramType["RETIREMENT_VISA"] = "retirement_visa";
    VisaProgramType["FREELANCER_VISA"] = "freelancer_visa";
})(VisaProgramType || (exports.VisaProgramType = VisaProgramType = {}));
var BrokerLicenseType;
(function (BrokerLicenseType) {
    BrokerLicenseType["BROKER"] = "broker";
    BrokerLicenseType["AGENT"] = "agent";
    BrokerLicenseType["FRANCHISE"] = "franchise";
})(BrokerLicenseType || (exports.BrokerLicenseType = BrokerLicenseType = {}));
var TeamRole;
(function (TeamRole) {
    TeamRole["OWNER"] = "owner";
    TeamRole["MANAGER"] = "manager";
    TeamRole["SENIOR_AGENT"] = "senior_agent";
    TeamRole["AGENT"] = "agent";
    TeamRole["TRAINEE"] = "trainee";
})(TeamRole || (exports.TeamRole = TeamRole = {}));
var BrokerStatus;
(function (BrokerStatus) {
    BrokerStatus["ACTIVE"] = "active";
    BrokerStatus["INACTIVE"] = "inactive";
    BrokerStatus["SUSPENDED"] = "suspended";
    BrokerStatus["PENDING_VERIFICATION"] = "pending_verification";
})(BrokerStatus || (exports.BrokerStatus = BrokerStatus = {}));
var HNITier;
(function (HNITier) {
    HNITier["AFFLUENT"] = "affluent";
    HNITier["HNWI"] = "hnwi";
    HNITier["UHNI"] = "uhni";
    HNITier["ULTRA_UHNI"] = "ultra_uhni";
})(HNITier || (exports.HNITier = HNITier = {}));
var InvestmentExperience;
(function (InvestmentExperience) {
    InvestmentExperience["NONE"] = "none";
    InvestmentExperience["LIMITED"] = "limited";
    InvestmentExperience["MODERATE"] = "moderate";
    InvestmentExperience["EXTENSIVE"] = "extensive";
})(InvestmentExperience || (exports.InvestmentExperience = InvestmentExperience = {}));
var PaymentCurrency;
(function (PaymentCurrency) {
    PaymentCurrency["INR"] = "INR";
    PaymentCurrency["AED"] = "AED";
    PaymentCurrency["USD"] = "USD";
})(PaymentCurrency || (exports.PaymentCurrency = PaymentCurrency = {}));
var FollowUpType;
(function (FollowUpType) {
    FollowUpType["CALL"] = "call";
    FollowUpType["WHATSAPP"] = "whatsapp";
    FollowUpType["SITE_VISIT"] = "site_visit";
    FollowUpType["MEETING"] = "meeting";
    FollowUpType["EMAIL"] = "email";
    FollowUpType["FOLLOW_UP"] = "follow_up";
    FollowUpType["REMINDER"] = "reminder";
})(FollowUpType || (exports.FollowUpType = FollowUpType = {}));
var FollowUpPriority;
(function (FollowUpPriority) {
    FollowUpPriority["LOW"] = "low";
    FollowUpPriority["MEDIUM"] = "medium";
    FollowUpPriority["HIGH"] = "high";
    FollowUpPriority["URGENT"] = "urgent";
})(FollowUpPriority || (exports.FollowUpPriority = FollowUpPriority = {}));
var FollowUpStatus;
(function (FollowUpStatus) {
    FollowUpStatus["PENDING"] = "pending";
    FollowUpStatus["IN_PROGRESS"] = "in_progress";
    FollowUpStatus["COMPLETED"] = "completed";
    FollowUpStatus["SKIPPED"] = "skipped";
    FollowUpStatus["RESCHEDULED"] = "rescheduled";
    FollowUpStatus["NO_ANSWER"] = "no_answer";
})(FollowUpStatus || (exports.FollowUpStatus = FollowUpStatus = {}));
var SiteVisitStatus;
(function (SiteVisitStatus) {
    SiteVisitStatus["SCHEDULED"] = "scheduled";
    SiteVisitStatus["CONFIRMED"] = "confirmed";
    SiteVisitStatus["IN_PROGRESS"] = "in_progress";
    SiteVisitStatus["COMPLETED"] = "completed";
    SiteVisitStatus["CANCELLED"] = "cancelled";
    SiteVisitStatus["NO_SHOW"] = "no_show";
})(SiteVisitStatus || (exports.SiteVisitStatus = SiteVisitStatus = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "pending";
    DocumentStatus["UPLOADED"] = "uploaded";
    DocumentStatus["VERIFIED"] = "verified";
    DocumentStatus["REJECTED"] = "rejected";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var VisaAssessmentStatus;
(function (VisaAssessmentStatus) {
    VisaAssessmentStatus["NOT_STARTED"] = "not_started";
    VisaAssessmentStatus["IN_PROGRESS"] = "in_progress";
    VisaAssessmentStatus["SUBMITTED"] = "submitted";
    VisaAssessmentStatus["APPROVED"] = "approved";
    VisaAssessmentStatus["REJECTED"] = "rejected";
})(VisaAssessmentStatus || (exports.VisaAssessmentStatus = VisaAssessmentStatus = {}));
var RewardType;
(function (RewardType) {
    RewardType["CASH"] = "cash";
    RewardType["COINS"] = "coins";
    RewardType["DISCOUNT"] = "discount";
    RewardType["VOUCHER"] = "voucher";
})(RewardType || (exports.RewardType = RewardType = {}));
var PayoutTrigger;
(function (PayoutTrigger) {
    PayoutTrigger["IMMEDIATE"] = "immediate";
    PayoutTrigger["ON_VISIT"] = "on_visit";
    PayoutTrigger["ON_CONVERSION"] = "on_conversion";
})(PayoutTrigger || (exports.PayoutTrigger = PayoutTrigger = {}));
// ===== EVENT TYPES =====
var RisnaEventType;
(function (RisnaEventType) {
    // Property Events
    RisnaEventType["PROPERTY_CREATED"] = "risna.property.created";
    RisnaEventType["PROPERTY_UPDATED"] = "risna.property.updated";
    RisnaEventType["PROPERTY_PUBLISHED"] = "risna.property.published";
    RisnaEventType["PROPERTY_VIEWED"] = "risna.property.viewed";
    RisnaEventType["PROPERTY_INQUIRED"] = "risna.property.inquired";
    RisnaEventType["PROPERTY_SHORTLISTED"] = "risna.property.shortlisted";
    // Lead Events
    RisnaEventType["LEAD_CREATED"] = "risna.lead.created";
    RisnaEventType["LEAD_UPDATED"] = "risna.lead.updated";
    RisnaEventType["LEAD_SCORED"] = "risna.lead.scored";
    RisnaEventType["LEAD_QUALIFIED"] = "risna.lead.qualified";
    RisnaEventType["LEAD_ASSIGNED"] = "risna.lead.assigned";
    RisnaEventType["LEAD_CONVERTED"] = "risna.lead.converted";
    RisnaEventType["LEAD_INTERACTION"] = "risna.lead.interaction";
    // Site Visit Events
    RisnaEventType["SITE_VISIT_SCHEDULED"] = "risna.sitevisit.scheduled";
    RisnaEventType["SITE_VISIT_STARTED"] = "risna.sitevisit.started";
    RisnaEventType["SITE_VISIT_COMPLETED"] = "risna.sitevisit.completed";
    // Referral Events
    RisnaEventType["REFERRAL_CREATED"] = "risna.referral.created";
    RisnaEventType["REFERRAL_REGISTERED"] = "risna.referral.registered";
    RisnaEventType["REFERRAL_VISITED"] = "risna.referral.visited";
    RisnaEventType["REFERRAL_CONVERTED"] = "risna.referral.converted";
    RisnaEventType["REFERRAL_REWARD_EARNED"] = "risna.referral.reward.earned";
    RisnaEventType["REFERRAL_REWARD_PAID"] = "risna.referral.reward.paid";
    // Visa Events
    RisnaEventType["VISA_ASSESSMENT_STARTED"] = "risna.visa.assessment.started";
    RisnaEventType["VISA_ASSESSMENT_COMPLETED"] = "risna.visa.assessment.completed";
    RisnaEventType["VISA_DOCUMENT_UPLOADED"] = "risna.visa.document.uploaded";
    // Broker Events
    RisnaEventType["BROKER_REGISTERED"] = "risna.broker.registered";
    RisnaEventType["BROKER_VERIFIED"] = "risna.broker.verified";
    RisnaEventType["BROKER_COMMISSION_EARNED"] = "risna.broker.commission.earned";
    RisnaEventType["BROKER_COMMISSION_PAID"] = "risna.broker.commission.paid";
    // CRM Events
    RisnaEventType["FOLLOWUP_CREATED"] = "risna.crm.followup.created";
    RisnaEventType["FOLLOWUP_COMPLETED"] = "risna.crm.followup.completed";
    RisnaEventType["FOLLOWUP_MISSED"] = "risna.crm.followup.missed";
    // AI Events
    RisnaEventType["AI_LEAD_SCORED"] = "risna.ai.lead.scored";
    RisnaEventType["AI_PRICE_RECOMMENDED"] = "risna.ai.price.recommended";
    RisnaEventType["AI_PROPERTY_MATCHED"] = "risna.ai.property.matched";
})(RisnaEventType || (exports.RisnaEventType = RisnaEventType = {}));
// ===== ZOD SCHEMAS =====
exports.GeoLocationSchema = zod_1.z.object({
    type: zod_1.z.literal('Point'),
    coordinates: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()])
});
exports.PriceInfoSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0),
    currency: zod_1.z.nativeEnum(PaymentCurrency),
    displayPrice: zod_1.z.string().optional(),
    pricePerSqFt: zod_1.z.number().optional(),
    totalPlotArea: zod_1.z.number().optional()
});
exports.PropertyMediaSchema = zod_1.z.object({
    type: zod_1.z.enum(['image', 'video', 'virtualTour', 'floorPlan']),
    url: zod_1.z.string().url(),
    thumbnailUrl: zod_1.z.string().url().optional(),
    caption: zod_1.z.string().optional(),
    isPrimary: zod_1.z.boolean().default(false),
    order: zod_1.z.number().default(0)
});
exports.PropertySchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    titleAr: zod_1.z.string().optional(),
    description: zod_1.z.string().min(1),
    descriptionAr: zod_1.z.string().optional(),
    propertyType: zod_1.z.nativeEnum(PropertyType),
    listingType: zod_1.z.nativeEnum(ListingType),
    status: zod_1.z.nativeEnum(PropertyStatus).default(PropertyStatus.DRAFT),
    country: zod_1.z.nativeEnum(Country),
    city: zod_1.z.string().min(1),
    locality: zod_1.z.string().min(1),
    subLocality: zod_1.z.string().optional(),
    price: exports.PriceInfoSchema,
    negotiable: zod_1.z.boolean().default(true),
    bedrooms: zod_1.z.number().optional(),
    bathrooms: zod_1.z.number().optional(),
    carpetArea: zod_1.z.number().optional(),
    furnishedStatus: zod_1.z.enum(['furnished', 'semi-furnished', 'unfurnished']).optional(),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
    virtualTourUrl: zod_1.z.string().url().optional()
});
exports.CreateLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(10),
    whatsapp: zod_1.z.string().optional(),
    source: zod_1.z.nativeEnum(LeadSource),
    segment: zod_1.z.nativeEnum(LeadSegment).optional(),
    preferences: zod_1.z.object({
        propertyTypes: zod_1.z.array(zod_1.z.nativeEnum(PropertyType)).optional(),
        budget: zod_1.z.object({
            min: zod_1.z.number().optional(),
            max: zod_1.z.number().optional(),
            currency: zod_1.z.nativeEnum(PaymentCurrency)
        }).optional(),
        timeline: zod_1.z.enum(['immediate', '1-3months', '3-6months', '6-12months', 'exploring']).optional(),
        purpose: zod_1.z.enum(['buy', 'invest', 'rent', 'pg']).optional()
    }).optional(),
    interestedPropertyIds: zod_1.z.array(zod_1.z.string()).optional()
});
exports.CreateReferralSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    referrerId: zod_1.z.string().min(1),
    referrerPhone: zod_1.z.string().optional(),
    refereePhone: zod_1.z.string().optional(),
    source: zod_1.z.enum(['whatsapp', 'sms', 'email', 'social', 'qr', 'link', 'agent']).optional(),
    propertyId: zod_1.z.string().optional(),
    programId: zod_1.z.string().optional()
});
exports.CreateFollowUpSchema = zod_1.z.object({
    leadId: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(FollowUpType),
    priority: zod_1.z.nativeEnum(FollowUpPriority).default(FollowUpPriority.MEDIUM),
    scheduledAt: zod_1.z.string().datetime(),
    duration: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional()
});
exports.CreateSiteVisitSchema = zod_1.z.object({
    leadId: zod_1.z.string().min(1),
    propertyId: zod_1.z.string().min(1),
    scheduledAt: zod_1.z.string().datetime(),
    estimatedDuration: zod_1.z.number().optional(),
    attendees: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        role: zod_1.z.string().optional()
    })).optional()
});
exports.CreateVisaAssessmentSchema = zod_1.z.object({
    country: zod_1.z.nativeEnum(Country),
    profile: zod_1.z.object({
        nationality: zod_1.z.string().optional(),
        age: zod_1.z.number().min(18).optional(),
        maritalStatus: zod_1.z.string().optional(),
        annualIncome: zod_1.z.number().optional(),
        netWorth: zod_1.z.number().optional()
    }).optional()
});
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
//# sourceMappingURL=index.js.map