"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewAuditSchema = exports.ConfidenceThresholdSchema = exports.EscalationRuleSchema = exports.ReviewRequestSchema = exports.ReviewPriority = exports.ReviewStatus = exports.ReviewType = void 0;
const zod_1 = require("zod");
var ReviewType;
(function (ReviewType) {
    ReviewType["DECISION"] = "decision";
    ReviewType["CONTENT"] = "content";
    ReviewType["ACTION"] = "action";
    ReviewType["ESCALATION"] = "escalation";
    ReviewType["EXCEPTION"] = "exception";
})(ReviewType || (exports.ReviewType = ReviewType = {}));
var ReviewStatus;
(function (ReviewStatus) {
    ReviewStatus["PENDING"] = "pending";
    ReviewStatus["IN_REVIEW"] = "in_review";
    ReviewStatus["APPROVED"] = "approved";
    ReviewStatus["REJECTED"] = "rejected";
    ReviewStatus["OVERRIDDEN"] = "overridden";
    ReviewStatus["ESCALATED"] = "escalated";
    ReviewStatus["EXPIRED"] = "expired";
})(ReviewStatus || (exports.ReviewStatus = ReviewStatus = {}));
var ReviewPriority;
(function (ReviewPriority) {
    ReviewPriority["LOW"] = "low";
    ReviewPriority["MEDIUM"] = "medium";
    ReviewPriority["HIGH"] = "high";
    ReviewPriority["URGENT"] = "urgent";
})(ReviewPriority || (exports.ReviewPriority = ReviewPriority = {}));
exports.ReviewRequestSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    type: zod_1.z.nativeEnum(ReviewType),
    status: zod_1.z.nativeEnum(ReviewStatus).default(ReviewStatus.PENDING),
    priority: zod_1.z.nativeEnum(ReviewPriority).default(ReviewPriority.MEDIUM),
    // What needs review
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    context: zod_1.z.record(zod_1.z.any()),
    // Original decision/action
    originalAction: zod_1.z.object({
        type: zod_1.z.string(),
        params: zod_1.z.record(zod_1.z.any()),
        result: zod_1.z.any().optional(),
        confidence: zod_1.z.number().optional()
    }),
    // AI recommendation
    aiRecommendation: zod_1.z.object({
        action: zod_1.z.string(),
        confidence: zod_1.z.number(),
        reasoning: zod_1.z.string()
    }),
    // Reviewers
    assignedTo: zod_1.z.string().optional(),
    reviewerRole: zod_1.z.string().optional(),
    escalatedTo: zod_1.z.string().optional(),
    // SLA
    slaDeadline: zod_1.z.date(),
    slaHours: zod_1.z.number().default(24),
    // Decision
    decision: zod_1.z.enum(['approve', 'reject', 'override', 'escalate']).optional(),
    decisionNote: zod_1.z.string().optional(),
    decidedBy: zod_1.z.string().optional(),
    decidedAt: zod_1.z.date().optional(),
    // Override info
    overriddenBy: zod_1.z.string().optional(),
    overrideReason: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.EscalationRuleSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    // Trigger conditions
    conditions: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        operator: zod_1.z.enum(['equals', 'greater_than', 'less_than', 'in', 'contains']),
        value: zod_1.z.any()
    })),
    // Actions
    action: zod_1.z.enum(['escalate', 'block', 'require_review', 'notify']),
    escalateTo: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
    // Priority boost
    priorityBoost: zod_1.z.number().optional(),
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.ConfidenceThresholdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    action: zod_1.z.string(),
    category: zod_1.z.string(),
    // Thresholds
    autoApproveBelow: zod_1.z.number().default(0.3),
    reviewRequired: zod_1.z.object({
        min: zod_1.z.number().default(0.3),
        max: zod_1.z.number().default(0.7)
    }),
    autoApproveAbove: zod_1.z.number().default(0.7),
    // Override
    canOverride: zod_1.z.boolean().default(true),
    overrideRoles: zod_1.z.array(zod_1.z.string()).optional(),
    active: zod_1.z.boolean().default(true)
});
exports.ReviewAuditSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    reviewId: zod_1.z.string().uuid(),
    action: zod_1.z.enum(['created', 'assigned', 'decided', 'overridden', 'escalated', 'expired', 'commented']),
    performedBy: zod_1.z.string(),
    role: zod_1.z.string().optional(),
    details: zod_1.z.record(zod_1.z.any()),
    createdAt: zod_1.z.date()
});
