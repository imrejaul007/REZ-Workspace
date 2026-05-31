"use strict";
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
exports.policyService = exports.PolicyService = exports.ComplianceAuditModel = exports.PolicyRuleModel = exports.DataCategoryModel = exports.RetentionPolicyModel = exports.DataRightModel = exports.ConsentModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
// ============================================================================
// MODELS
// ============================================================================
const ConsentSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(index_js_1.ConsentType), required: true },
    source: { type: String, enum: Object.values(index_js_1.ConsentSource), required: true },
    status: { type: String, enum: Object.values(index_js_1.ConsentStatus), default: index_js_1.ConsentStatus.PENDING },
    version: { type: String, required: true },
    description: { type: String },
    dataCategories: [String],
    scope: {
        scope: { type: String, enum: ['global', 'tenant', 'service', 'specific'], default: 'global' },
        services: [String],
        dataTypes: [String]
    },
    purpose: { type: String },
    purposeDescription: { type: String },
    validFrom: Date,
    validUntil: Date,
    canWithdraw: { type: Boolean, default: true },
    withdrawalMethod: String,
    grantedAt: Date,
    grantedIP: String,
    grantedUserAgent: String,
    withdrawnAt: Date
}, { timestamps: true });
ConsentSchema.index({ tenantId: 1, userId: 1, type: 1 }, { unique: true });
exports.ConsentModel = mongoose_1.default.model('Consent', ConsentSchema);
// ============================================================================
// DATA RIGHTS MODEL
// ============================================================================
const DataRightSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(index_js_1.DataRightType), required: true },
    status: { type: String, enum: Object.values(index_js_1.DataRightStatus), default: index_js_1.DataRightStatus.PENDING },
    description: { type: String },
    requestedData: [String],
    reason: String,
    cascadeDelete: { type: Boolean, default: false },
    retentionOverride: { type: Boolean, default: false },
    objectionTo: String,
    assignedTo: String,
    dueDate: Date,
    responseData: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    responseAt: Date,
    responseBy: String,
    fulfilledAt: Date,
    fulfillmentMethod: String
}, { timestamps: true });
DataRightSchema.index({ tenantId: 1, userId: 1, status: 1 });
exports.DataRightModel = mongoose_1.default.model('DataRight', DataRightSchema);
// ============================================================================
// RETENTION POLICY MODEL
// ============================================================================
const RetentionPolicySchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    dataCategory: { type: String, required: true },
    policy: { type: String, enum: Object.values(index_js_1.RetentionPolicy), required: true },
    retentionDays: Number,
    trigger: String,
    expiryAction: { type: String, enum: ['delete', 'anonymize', 'restrict', 'archive', 'review'] },
    legalBasis: String,
    legalBasisArticle: String,
    active: { type: Boolean, default: true }
}, { timestamps: true });
RetentionPolicySchema.index({ tenantId: 1, dataCategory: 1 });
exports.RetentionPolicyModel = mongoose_1.default.model('RetentionPolicy', RetentionPolicySchema);
// ============================================================================
// DATA CATEGORY MODEL
// ============================================================================
const DataCategorySchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    category: { type: String, enum: Object.values(index_js_1.DataCategory), required: true },
    sensitivityLevel: { type: Number, min: 1, max: 5, default: 1 },
    legalClassification: { type: String, enum: ['public', 'personal', 'sensitive', 'special'] },
    requiredProtections: [String],
    sharingRules: {
        canShareWithProcessors: { type: Boolean, default: true },
        canShareWithThirdParties: { type: Boolean, default: false },
        requiresConsent: { type: Boolean, default: true },
        requiresLegalBasis: { type: Boolean, default: true }
    }
}, { timestamps: true });
exports.DataCategoryModel = mongoose_1.default.model('DataCategory', DataCategorySchema);
// ============================================================================
// POLICY RULES MODEL
// ============================================================================
const PolicyRuleSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    priority: { type: Number, default: 0 },
    conditions: {
        dataCategory: [String],
        consentStatus: [String],
        userSegment: [String],
        processingType: [String]
    },
    action: { type: String, enum: ['allow', 'deny', 'require_consent', 'require_review', 'restrict', 'mask', 'anonymize'] },
    enforcement: {
        immediate: { type: Boolean, default: true },
        gracePeriodDays: { type: Number, default: 0 },
        notificationRequired: { type: Boolean, default: false }
    },
    canOverride: { type: Boolean, default: false },
    overrideRoles: [String],
    active: { type: Boolean, default: true }
}, { timestamps: true });
PolicyRuleSchema.index({ tenantId: 1, priority: -1 });
exports.PolicyRuleModel = mongoose_1.default.model('PolicyRule', PolicyRuleSchema);
// ============================================================================
// COMPLIANCE AUDIT MODEL
// ============================================================================
const ComplianceAuditSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    userId: String,
    event: { type: String, required: true },
    category: { type: String, enum: ['consent', 'data_right', 'retention', 'breach', 'transfer', 'security'], required: true },
    dataCategories: [String],
    action: { type: String, required: true },
    result: { type: String, enum: ['success', 'failure', 'partial'] },
    legalBasis: String,
    gdprArticle: String,
    ip: String,
    userAgent: String,
    requestId: String,
    processedBy: String,
    processingPurpose: String
}, { timestamps: true });
ComplianceAuditSchema.index({ tenantId: 1, createdAt: -1 });
ComplianceAuditSchema.index({ userId: 1, createdAt: -1 });
exports.ComplianceAuditModel = mongoose_1.default.model('ComplianceAudit', ComplianceAuditSchema);
// ============================================================================
// POLICY SERVICE
// ============================================================================
class PolicyService {
    /**
     * Check if processing is allowed
     */
    async canProcess(params) {
        const { tenantId, userId, dataCategories, purpose, processingType } = params;
        // Check consent status
        const consents = await exports.ConsentModel.find({
            tenantId,
            userId,
            status: index_js_1.ConsentStatus.GRANTED,
            validUntil: { $gt: new Date() }
        });
        // Check policy rules
        const rules = await exports.PolicyRuleModel.find({
            tenantId,
            active: true
        }).sort({ priority: -1 });
        // Default allow
        let allowed = true;
        let reason;
        let requiresConsent;
        for (const rule of rules) {
            const conditions = rule.conditions;
            // Check if this rule applies
            const categoryMatch = !conditions.dataCategory?.length ||
                conditions.dataCategory.some(c => dataCategories.includes(c));
            if (!categoryMatch)
                continue;
            // Rule applies
            if (rule.action === 'deny') {
                allowed = false;
                reason = `Policy ${rule.name} denies this processing`;
                break;
            }
            if (rule.action === 'require_consent') {
                allowed = false;
                requiresConsent = [index_js_1.ConsentType.AI_PROCESSING];
                reason = `Consent required for this processing`;
            }
        }
        // Log the check
        await this.logAudit({
            tenantId,
            userId,
            event: 'policy_check',
            category: 'consent',
            dataCategories: dataCategories.map(c => c),
            action: `Check: ${purpose}/${processingType}`,
            result: allowed ? 'success' : 'failure',
            processingPurpose: purpose
        });
        return { allowed, reason, requiresConsent };
    }
    /**
     * Grant consent
     */
    async grantConsent(params) {
        const { tenantId, userId, type, purpose, dataCategories, ip, userAgent } = params;
        // Check existing consent
        const existing = await exports.ConsentModel.findOne({ tenantId, userId, type });
        if (existing) {
            existing.status = index_js_1.ConsentStatus.GRANTED;
            existing.grantedAt = new Date();
            existing.grantedIP = ip;
            existing.grantedUserAgent = userAgent;
            existing.validFrom = new Date();
            existing.purpose = purpose;
            existing.dataCategories = dataCategories;
            await existing.save();
            return existing.toObject();
        }
        // Create new consent
        const consent = new exports.ConsentModel({
            tenantId,
            userId,
            type,
            source: index_js_1.ConsentSource.EXPLICIT,
            status: index_js_1.ConsentStatus.GRANTED,
            version: '1.0',
            purpose,
            purposeDescription: `Consent for ${purpose}`,
            dataCategories,
            validFrom: new Date(),
            grantedAt: new Date(),
            grantedIP: ip,
            grantedUserAgent: userAgent
        });
        await consent.save();
        await this.logAudit({
            tenantId,
            userId,
            event: 'consent_granted',
            category: 'consent',
            dataCategories,
            action: `Grant consent: ${type}`,
            result: 'success'
        });
        return consent.toObject();
    }
    /**
     * Withdraw consent
     */
    async withdrawConsent(params) {
        const { tenantId, userId, type } = params;
        const consent = await exports.ConsentModel.findOne({ tenantId, userId, type });
        if (!consent)
            throw new Error('Consent not found');
        consent.status = index_js_1.ConsentStatus.WITHDRAWN;
        consent.withdrawnAt = new Date();
        await consent.save();
        await this.logAudit({
            tenantId,
            userId,
            event: 'consent_withdrawn',
            category: 'consent',
            action: `Withdraw: ${type}`,
            result: 'success'
        });
    }
    /**
     * Check retention and trigger cleanup
     */
    async checkRetention(tenantId, dataCategory) {
        const policy = await exports.RetentionPolicyModel.findOne({
            tenantId,
            dataCategory,
            active: true
        });
        if (!policy) {
            // Default: review
            return { action: 'review', reason: 'No policy defined' };
        }
        return {
            action: policy.expiryAction,
            reason: `${policy.policy}: ${policy.name}`
        };
    }
    /**
     * Handle data right request
     */
    async handleDataRightRequest(params) {
        const { tenantId, userId, type, description } = params;
        // GDPR requires response within 30 days
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const request = new exports.DataRightModel({
            tenantId,
            userId,
            type,
            status: index_js_1.DataRightStatus.PENDING,
            description,
            dueDate
        });
        await request.save();
        await this.logAudit({
            tenantId,
            userId,
            event: 'data_right_request',
            category: 'data_right',
            action: `Request: ${type}`,
            result: 'success'
        });
        return request.toObject();
    }
    /**
     * Fulfill data right request (e.g., GDPR erasure)
     */
    async fulfillDataRight(params) {
        const request = await exports.DataRightModel.findById(params.requestId);
        if (!request)
            throw new Error('Request not found');
        // Mark as fulfilled
        request.status = index_js_1.DataRightStatus.FULFILLED;
        request.fulfilledAt = new Date();
        request.fulfillmentMethod = params.action;
        request.responseData = params.data || {};
        request.responseAt = new Date();
        await request.save();
        await this.logAudit({
            tenantId: request.tenantId,
            userId: request.userId,
            event: 'data_right_fulfilled',
            category: 'data_right',
            action: `Fulfill: ${request.type}`,
            result: 'success'
        });
    }
    /**
     * Get user consent summary
     */
    async getConsentSummary(tenantId, userId) {
        const consents = await exports.ConsentModel.find({ tenantId, userId });
        const summary = {
            total: consents.length,
            granted: consents.filter(c => c.status === index_js_1.ConsentStatus.GRANTED).length,
            denied: consents.filter(c => c.status === index_js_1.ConsentStatus.DENIED).length,
            pending: consents.filter(c => c.status === index_js_1.ConsentStatus.PENDING).length,
            consents: consents.map(c => c.toObject())
        };
        return summary;
    }
    /**
     * Log compliance audit
     */
    async logAudit(params) {
        await exports.ComplianceAuditModel.create({
            ...params,
            id: (0, uuid_1.v4)()
        });
    }
    /**
     * Export audit logs (for compliance reporting)
     */
    async exportAuditLogs(params) {
        const filter = {
            tenantId: params.tenantId,
            createdAt: { $gte: params.startDate, $lte: params.endDate }
        };
        if (params.category)
            filter.category = params.category;
        const logs = await exports.ComplianceAuditModel.find(filter)
            .sort({ createdAt: -1 })
            .limit(10000);
        return logs.map(l => l.toObject());
    }
}
exports.PolicyService = PolicyService;
exports.policyService = new PolicyService();
