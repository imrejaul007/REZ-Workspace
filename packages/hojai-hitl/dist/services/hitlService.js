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
exports.hitlService = exports.HITLService = exports.ReviewAuditModel = exports.ConfidenceThresholdModel = exports.EscalationRuleModel = exports.ReviewRequestModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
const ReviewRequestSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(index_js_1.ReviewType), required: true },
    status: { type: String, enum: Object.values(index_js_1.ReviewStatus), default: index_js_1.ReviewStatus.PENDING },
    priority: { type: String, enum: Object.values(index_js_1.ReviewPriority), default: index_js_1.ReviewPriority.MEDIUM },
    title: { type: String, required: true },
    description: String,
    context: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    originalAction: {
        type: String,
        params: { type: Map, of: mongoose_1.Schema.Types.Mixed },
        result: mongoose_1.Schema.Types.Mixed,
        confidence: Number
    },
    aiRecommendation: {
        action: String,
        confidence: Number,
        reasoning: String
    },
    assignedTo: String,
    reviewerRole: String,
    escalatedTo: String,
    slaDeadline: Date,
    slaHours: { type: Number, default: 24 },
    decision: String,
    decisionNote: String,
    decidedBy: String,
    decidedAt: Date,
    overriddenBy: String,
    overrideReason: String
}, { timestamps: true });
ReviewRequestSchema.index({ tenantId: 1, status: 1, priority: -1 });
ReviewRequestSchema.index({ tenantId: 1, assignedTo: 1, status: 1 });
const EscalationRuleSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    conditions: [{
            field: String,
            operator: String,
            value: mongoose_1.Schema.Types.Mixed
        }],
    action: { type: String, enum: ['escalate', 'block', 'require_review', 'notify'], required: true },
    escalateTo: String,
    reason: String,
    priorityBoost: Number,
    active: { type: Boolean, default: true }
}, { timestamps: true });
const ConfidenceThresholdSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    category: String,
    autoApproveBelow: { type: Number, default: 0.3 },
    reviewRequired: {
        min: { type: Number, default: 0.3 },
        max: { type: Number, default: 0.7 }
    },
    autoApproveAbove: { type: Number, default: 0.7 },
    canOverride: { type: Boolean, default: true },
    overrideRoles: [String],
    active: { type: Boolean, default: true }
}, { timestamps: true });
const ReviewAuditSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    reviewId: { type: String, required: true },
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    role: String,
    details: { type: Map, of: mongoose_1.Schema.Types.Mixed }
}, { timestamps: true });
exports.ReviewRequestModel = mongoose_1.default.model('ReviewRequest', ReviewRequestSchema);
exports.EscalationRuleModel = mongoose_1.default.model('EscalationRule', EscalationRuleSchema);
exports.ConfidenceThresholdModel = mongoose_1.default.model('ConfidenceThreshold', ConfidenceThresholdSchema);
exports.ReviewAuditModel = mongoose_1.default.model('ReviewAudit', ReviewAuditSchema);
class HITLService {
    /**
     * Check if action needs human review
     */
    async shouldReview(params) {
        const { tenantId, action, category, confidence } = params;
        const threshold = await exports.ConfidenceThresholdModel.findOne({
            tenantId,
            action,
            category,
            active: true
        });
        if (!threshold) {
            // Default: review if confidence < 0.7
            return {
                needsReview: confidence < 0.7,
                reason: confidence < 0.7 ? 'Confidence below default threshold (0.7)' : 'Confidence acceptable',
                priority: confidence < 0.5 ? index_js_1.ReviewPriority.HIGH : index_js_1.ReviewPriority.MEDIUM
            };
        }
        if (confidence >= threshold.autoApproveAbove) {
            return { needsReview: false, reason: 'Confidence above auto-approve threshold', priority: index_js_1.ReviewPriority.LOW };
        }
        if (confidence < threshold.autoApproveBelow) {
            return { needsReview: false, reason: 'Confidence below review threshold - auto-block', priority: index_js_1.ReviewPriority.HIGH };
        }
        return {
            needsReview: true,
            reason: 'Confidence in review range',
            priority: index_js_1.ReviewPriority.MEDIUM
        };
    }
    /**
     * Create review request
     */
    async createReview(params) {
        const slaDeadline = new Date();
        slaDeadline.setHours(slaDeadline.getHours() + (params.slaHours || 24));
        const review = new exports.ReviewRequestModel({
            ...params,
            id: (0, uuid_1.v4)(),
            slaDeadline,
            priority: params.priority || index_js_1.ReviewPriority.MEDIUM
        });
        await review.save();
        await this.logAudit(review.tenantId, review.id, 'created', 'system', 'Review request created');
        return review.toObject();
    }
    /**
     * Get pending reviews
     */
    async getPendingReviews(tenantId, params) {
        const filter = {
            tenantId,
            status: { $in: [index_js_1.ReviewStatus.PENDING, index_js_1.ReviewStatus.IN_REVIEW] }
        };
        if (params?.assignedTo)
            filter.assignedTo = params.assignedTo;
        if (params?.priority)
            filter.priority = params.priority;
        const reviews = await exports.ReviewRequestModel.find(filter)
            .sort({ priority: -1, slaDeadline: 1 })
            .limit(params?.limit || 50);
        return reviews.map(r => r.toObject());
    }
    /**
     * Make decision on review
     */
    async decide(params) {
        const review = await exports.ReviewRequestModel.findOne({
            _id: params.reviewId,
            tenantId: params.tenantId
        });
        if (!review)
            throw new Error('Review not found');
        if (review.status !== index_js_1.ReviewStatus.PENDING && review.status !== index_js_1.ReviewStatus.IN_REVIEW) {
            throw new Error('Review already decided');
        }
        review.decision = params.decision;
        review.decidedBy = params.decidedBy;
        review.decidedAt = new Date();
        review.decisionNote = params.decisionNote;
        switch (params.decision) {
            case 'approve':
            case 'reject':
                review.status = params.decision === 'approve' ? index_js_1.ReviewStatus.APPROVED : index_js_1.ReviewStatus.REJECTED;
                break;
            case 'override':
                review.status = index_js_1.ReviewStatus.OVERRIDDEN;
                break;
            case 'escalate':
                review.status = index_js_1.ReviewStatus.ESCALATED;
                review.escalatedTo = params.escalatedTo;
                break;
        }
        await review.save();
        await this.logAudit(review.tenantId, review.id, 'decided', params.decidedBy, { decision: params.decision });
        return review.toObject();
    }
    /**
     * Check escalation rules
     */
    async checkEscalation(params) {
        const rules = await exports.EscalationRuleModel.find({
            tenantId: params.tenantId,
            active: true
        });
        for (const rule of rules) {
            let matches = true;
            for (const condition of rule.conditions) {
                const value = params[condition.field];
                switch (condition.operator) {
                    case 'greater_than':
                        if (!(value > condition.value))
                            matches = false;
                        break;
                    case 'less_than':
                        if (!(value < condition.value))
                            matches = false;
                        break;
                    case 'equals':
                        if (value !== condition.value)
                            matches = false;
                        break;
                }
            }
            if (matches) {
                return {
                    shouldEscalate: rule.action === 'escalate' || rule.action === 'require_review',
                    escalateTo: rule.escalateTo,
                    reason: rule.reason
                };
            }
        }
        return { shouldEscalate: false };
    }
    /**
     * Get review statistics
     */
    async getStats(tenantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [pending, todayDecisions, avgResolutionTime] = await Promise.all([
            exports.ReviewRequestModel.countDocuments({ tenantId, status: { $in: [index_js_1.ReviewStatus.PENDING, index_js_1.ReviewStatus.IN_REVIEW] } }),
            exports.ReviewRequestModel.countDocuments({ tenantId, decidedAt: { $gte: today } }),
            this.calculateAvgResolutionTime(tenantId)
        ]);
        return {
            pendingReviews: pending,
            todayDecisions,
            avgResolutionTimeHours: avgResolutionTime,
            urgentOverdue: await exports.ReviewRequestModel.countDocuments({
                tenantId,
                status: index_js_1.ReviewStatus.PENDING,
                priority: index_js_1.ReviewPriority.URGENT,
                slaDeadline: { $lt: new Date() }
            })
        };
    }
    async calculateAvgResolutionTime(tenantId) {
        const reviews = await exports.ReviewRequestModel.find({
            tenantId,
            decidedAt: { $exists: true }
        }).sort({ decidedAt: -1 }).limit(100);
        if (reviews.length === 0)
            return 0;
        const totalMs = reviews.reduce((sum, r) => {
            const created = new Date(r.createdAt).getTime();
            const decided = new Date(r.decidedAt).getTime();
            return sum + (decided - created);
        }, 0);
        return totalMs / reviews.length / (1000 * 60 * 60); // Hours
    }
    async logAudit(tenantId, reviewId, action, performedBy, details) {
        await exports.ReviewAuditModel.create({
            tenantId,
            reviewId,
            action,
            performedBy,
            details
        });
    }
}
exports.HITLService = HITLService;
exports.hitlService = new HITLService();
