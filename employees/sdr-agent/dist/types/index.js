"use strict";
// ============================================
// HOJAI AI - SDR Agent Type Definitions
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupScheduleSchema = exports.OutreachMessageSchema = exports.QualificationSchema = exports.ProspectSearchSchema = exports.CompanySchema = exports.ContactSchema = exports.QualificationStatus = exports.BANTField = exports.FollowupStatus = exports.OutreachStatus = exports.OutreachChannel = exports.LeadScore = exports.LeadSource = exports.LeadStage = void 0;
const zod_1 = require("zod");
// ============================================
// Enums
// ============================================
var LeadStage;
(function (LeadStage) {
    LeadStage["NEW"] = "new";
    LeadStage["CONTACTED"] = "contacted";
    LeadStage["QUALIFIED"] = "qualified";
    LeadStage["PROPOSAL"] = "proposal";
    LeadStage["NEGOTIATION"] = "negotiation";
    LeadStage["CLOSED_WON"] = "closed_won";
    LeadStage["CLOSED_LOST"] = "closed_lost";
})(LeadStage || (exports.LeadStage = LeadStage = {}));
var LeadSource;
(function (LeadSource) {
    LeadSource["COLD_OUTREACH"] = "cold_outreach";
    LeadSource["INBOUND"] = "inbound";
    LeadSource["REFERRAL"] = "referral";
    LeadSource["EVENT"] = "event";
    LeadSource["LINKEDIN"] = "linkedin";
    LeadSource["CAMPAIGN"] = "campaign";
    LeadSource["WEBINAR"] = "webinar";
    LeadSource["PARTNER"] = "partner";
})(LeadSource || (exports.LeadSource = LeadSource = {}));
var LeadScore;
(function (LeadScore) {
    LeadScore["HOT"] = "hot";
    LeadScore["WARM"] = "warm";
    LeadScore["COLD"] = "cold";
    LeadScore["UNQUALIFIED"] = "unqualified";
})(LeadScore || (exports.LeadScore = LeadScore = {}));
var OutreachChannel;
(function (OutreachChannel) {
    OutreachChannel["EMAIL"] = "email";
    OutreachChannel["LINKEDIN"] = "linkedin";
    OutreachChannel["PHONE"] = "phone";
    OutreachChannel["SMS"] = "sms";
    OutreachChannel["WHATSAPP"] = "whatsapp";
})(OutreachChannel || (exports.OutreachChannel = OutreachChannel = {}));
var OutreachStatus;
(function (OutreachStatus) {
    OutreachStatus["PENDING"] = "pending";
    OutreachStatus["SENT"] = "sent";
    OutreachStatus["DELIVERED"] = "delivered";
    OutreachStatus["OPENED"] = "opened";
    OutreachStatus["CLICKED"] = "clicked";
    OutreachStatus["REPLIED"] = "replied";
    OutreachStatus["BOUNCED"] = "bounced";
    OutreachStatus["FAILED"] = "failed";
})(OutreachStatus || (exports.OutreachStatus = OutreachStatus = {}));
var FollowupStatus;
(function (FollowupStatus) {
    FollowupStatus["SCHEDULED"] = "scheduled";
    FollowupStatus["SENT"] = "sent";
    FollowupStatus["COMPLETED"] = "completed";
    FollowupStatus["SKIPPED"] = "skipped";
})(FollowupStatus || (exports.FollowupStatus = FollowupStatus = {}));
var BANTField;
(function (BANTField) {
    BANTField["BUDGET"] = "budget";
    BANTField["AUTHORITY"] = "authority";
    BANTField["NEED"] = "need";
    BANTField["TIMELINE"] = "timeline";
})(BANTField || (exports.BANTField = BANTField = {}));
var QualificationStatus;
(function (QualificationStatus) {
    QualificationStatus["NOT_QUALIFIED"] = "not_qualified";
    QualificationStatus["IN_PROGRESS"] = "in_progress";
    QualificationStatus["QUALIFIED"] = "qualified";
    QualificationStatus["DISQUALIFIED"] = "disqualified";
})(QualificationStatus || (exports.QualificationStatus = QualificationStatus = {}));
// ============================================
// Zod Schemas for Validation
// ============================================
exports.ContactSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(7).max(20).optional(),
    linkedinUrl: zod_1.z.string().url().optional(),
    title: zod_1.z.string().max(200).optional(),
    company: zod_1.z.string().max(200).optional(),
    companySize: zod_1.z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
    industry: zod_1.z.string().max(100).optional(),
    location: zod_1.z.object({
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        country: zod_1.z.string().optional()
    }).optional()
});
exports.CompanySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    domain: zod_1.z.string().url().optional(),
    industry: zod_1.z.string().max(100).optional(),
    size: zod_1.z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
    revenue: zod_1.z.string().optional(),
    location: zod_1.z.object({
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        country: zod_1.z.string().optional()
    }).optional(),
    linkedinUrl: zod_1.z.string().url().optional(),
    crunchbaseUrl: zod_1.z.string().url().optional()
});
exports.ProspectSearchSchema = zod_1.z.object({
    industry: zod_1.z.array(zod_1.z.string()).optional(),
    companySize: zod_1.z.array(zod_1.z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])).optional(),
    location: zod_1.z.object({
        cities: zod_1.z.array(zod_1.z.string()).optional(),
        states: zod_1.z.array(zod_1.z.string()).optional(),
        countries: zod_1.z.array(zod_1.z.string()).optional()
    }).optional(),
    title: zod_1.z.array(zod_1.z.string()).optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    excludeKeywords: zod_1.z.array(zod_1.z.string()).optional(),
    technologies: zod_1.z.array(zod_1.z.string()).optional(),
    fundingStage: zod_1.z.array(zod_1.z.enum(['seed', 'series_a', 'series_b', 'series_c', 'ipo', 'profitable'])).optional(),
    recentlyHired: zod_1.z.boolean().optional(),
    jobChanges: zod_1.z.object({
        titles: zod_1.z.array(zod_1.z.string()).optional(),
        withinDays: zod_1.z.number().min(1).max(365).optional()
    }).optional()
});
exports.QualificationSchema = zod_1.z.object({
    budget: zod_1.z.object({
        hasBudget: zod_1.z.boolean(),
        amount: zod_1.z.number().min(0).optional(),
        currency: zod_1.z.string().default('USD'),
        comments: zod_1.z.string().optional()
    }),
    authority: zod_1.z.object({
        level: zod_1.z.enum(['individual', 'manager', 'director', 'vp', 'cxo', 'unknown']),
        isDecisionMaker: zod_1.z.boolean(),
        involvesOthers: zod_1.z.boolean().optional(),
        comments: zod_1.z.string().optional()
    }),
    need: zod_1.z.object({
        painPoints: zod_1.z.array(zod_1.z.string()),
        priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        businessImpact: zod_1.z.string().optional()
    }),
    timeline: zod_1.z.object({
        targetClose: zod_1.z.string().datetime().optional(),
        buyingStage: zod_1.z.enum(['awareness', 'consideration', 'decision', 'none']),
        urgency: zod_1.z.enum(['low', 'medium', 'high'])
    })
});
exports.OutreachMessageSchema = zod_1.z.object({
    channel: zod_1.z.nativeEnum(OutreachChannel),
    subject: zod_1.z.string().max(500).optional(),
    body: zod_1.z.string().min(1).max(5000),
    templateId: zod_1.z.string().optional(),
    personalization: zod_1.z.record(zod_1.z.string()).optional(),
    attachments: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        url: zod_1.z.string().url()
    })).optional()
});
exports.FollowupScheduleSchema = zod_1.z.object({
    leadId: zod_1.z.string().uuid(),
    channel: zod_1.z.nativeEnum(OutreachChannel),
    scheduledAt: zod_1.z.string().datetime(),
    message: zod_1.z.string().max(5000).optional(),
    reminder: zod_1.z.boolean().default(true)
});
//# sourceMappingURL=index.js.map