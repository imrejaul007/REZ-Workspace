"use strict";
// ============================================
// HOJAI AI - SDR Agent MongoDB Models
// ============================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = exports.Followup = exports.Outreach = exports.Qualification = exports.Lead = exports.Company = exports.Contact = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("../types");
const ContactSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    firstName: { type: String, required: true, maxlength: 100 },
    lastName: { type: String, maxlength: 100 },
    email: { type: String, sparse: true, lowercase: true },
    phone: { type: String },
    linkedinUrl: { type: String },
    title: { type: String, maxlength: 200 },
    company: { type: String, maxlength: 200 },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    industry: { type: String, maxlength: 100 },
    location: {
        city: String,
        state: String,
        country: String
    },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company' }
}, {
    timestamps: true,
    collection: 'sdr_contacts'
});
// Compound index for tenant + email
ContactSchema.index({ tenantId: 1, email: 1 }, { unique: true, sparse: true });
const CompanySchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    domain: { type: String },
    industry: { type: String, maxlength: 100 },
    size: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    revenue: String,
    location: {
        city: String,
        state: String,
        country: String
    },
    linkedinUrl: String,
    crunchbaseUrl: String,
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'sdr_companies'
});
CompanySchema.index({ tenantId: 1, domain: 1 }, { unique: true, sparse: true });
const LeadSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    contactId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Contact', required: true },
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
    stage: {
        type: String,
        enum: Object.values(types_1.LeadStage),
        default: types_1.LeadStage.NEW,
        index: true
    },
    source: {
        type: String,
        enum: Object.values(types_1.LeadSource),
        default: types_1.LeadSource.COLD_OUTREACH
    },
    score: {
        type: String,
        enum: Object.values(types_1.LeadScore),
        default: types_1.LeadScore.COLD
    },
    scoreValue: { type: Number, default: 0, min: 0, max: 100 },
    ownerId: { type: String, required: true },
    assignedTo: String,
    lastContactedAt: Date,
    nextFollowupAt: Date,
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'sdr_leads'
});
LeadSchema.index({ tenantId: 1, stage: 1 });
LeadSchema.index({ tenantId: 1, score: 1 });
LeadSchema.index({ tenantId: 1, assignedTo: 1 });
LeadSchema.index({ tenantId: 1, nextFollowupAt: 1 });
LeadSchema.index({ tenantId: 1, contactId: 1 }, { unique: true });
const QualificationSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    leadId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lead', required: true },
    status: {
        type: String,
        enum: Object.values(types_1.QualificationStatus),
        default: types_1.QualificationStatus.NOT_QUALIFIED
    },
    bant: {
        budget: {
            hasBudget: { type: Boolean, required: true },
            amount: Number,
            currency: { type: String, default: 'USD' },
            comments: String
        },
        authority: {
            level: {
                type: String,
                enum: ['individual', 'manager', 'director', 'vp', 'cxo', 'unknown'],
                default: 'unknown'
            },
            isDecisionMaker: { type: Boolean, required: true },
            involvesOthers: Boolean,
            comments: String
        },
        need: {
            painPoints: { type: [String], default: [] },
            priority: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'medium'
            },
            businessImpact: String
        },
        timeline: {
            targetClose: Date,
            buyingStage: {
                type: String,
                enum: ['awareness', 'consideration', 'decision', 'none'],
                default: 'none'
            },
            urgency: {
                type: String,
                enum: ['low', 'medium', 'high'],
                default: 'low'
            }
        }
    },
    notes: { type: String, default: '' },
    disqualifyReason: String
}, {
    timestamps: true,
    collection: 'sdr_qualifications'
});
QualificationSchema.index({ tenantId: 1, leadId: 1 }, { unique: true });
const OutreachSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    leadId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lead', required: true },
    channel: {
        type: String,
        enum: Object.values(types_1.OutreachChannel),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(types_1.OutreachStatus),
        default: types_1.OutreachStatus.PENDING,
        index: true
    },
    subject: String,
    body: { type: String, required: true },
    templateId: String,
    personalization: { type: mongoose_1.Schema.Types.Mixed },
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    repliedAt: Date,
    errorMessage: String,
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'sdr_outreaches'
});
OutreachSchema.index({ tenantId: 1, leadId: 1 });
OutreachSchema.index({ tenantId: 1, status: 1 });
OutreachSchema.index({ tenantId: 1, sentAt: 1 });
const FollowupSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    leadId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lead', required: true },
    outreachId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Outreach' },
    channel: {
        type: String,
        enum: Object.values(types_1.OutreachChannel),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(types_1.FollowupStatus),
        default: types_1.FollowupStatus.SCHEDULED,
        index: true
    },
    scheduledFor: { type: Date, required: true, index: true },
    message: String,
    sentAt: Date,
    completedAt: Date,
    skippedReason: String,
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'sdr_followups'
});
FollowupSchema.index({ tenantId: 1, leadId: 1 });
FollowupSchema.index({ tenantId: 1, status: 1, scheduledFor: 1 });
const ActivitySchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    leadId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    type: {
        type: String,
        enum: ['stage_change', 'outreach', 'followup', 'note', 'email_opened', 'email_clicked', 'email_replied', 'call', 'meeting'],
        required: true
    },
    description: { type: String, required: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    createdBy: { type: String, required: true }
}, {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'sdr_activities'
});
ActivitySchema.index({ tenantId: 1, leadId: 1, createdAt: -1 });
// ============================================
// Export Models
// ============================================
exports.Contact = mongoose_1.default.model('Contact', ContactSchema);
exports.Company = mongoose_1.default.model('Company', CompanySchema);
exports.Lead = mongoose_1.default.model('Lead', LeadSchema);
exports.Qualification = mongoose_1.default.model('Qualification', QualificationSchema);
exports.Outreach = mongoose_1.default.model('Outreach', OutreachSchema);
exports.Followup = mongoose_1.default.model('Followup', FollowupSchema);
exports.Activity = mongoose_1.default.model('Activity', ActivitySchema);
//# sourceMappingURL=index.js.map