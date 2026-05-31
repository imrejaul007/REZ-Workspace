import mongoose from 'mongoose';
import { ReviewType, ReviewStatus, ReviewPriority, ReviewRequest } from '../types/index.js';
export declare const ReviewRequestModel: mongoose.Model<{
    status: ReviewStatus;
    type: ReviewType;
    tenantId: string;
    priority: ReviewPriority;
    title: string;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    description?: string | null | undefined;
    decision?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        confidence?: number | null | undefined;
        action?: string | null | undefined;
        reasoning?: string | null | undefined;
    } | null | undefined;
    assignedTo?: string | null | undefined;
    reviewerRole?: string | null | undefined;
    escalatedTo?: string | null | undefined;
    slaDeadline?: NativeDate | null | undefined;
    decisionNote?: string | null | undefined;
    decidedBy?: string | null | undefined;
    decidedAt?: NativeDate | null | undefined;
    overriddenBy?: string | null | undefined;
    overrideReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: ReviewStatus;
    type: ReviewType;
    tenantId: string;
    priority: ReviewPriority;
    title: string;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    description?: string | null | undefined;
    decision?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        confidence?: number | null | undefined;
        action?: string | null | undefined;
        reasoning?: string | null | undefined;
    } | null | undefined;
    assignedTo?: string | null | undefined;
    reviewerRole?: string | null | undefined;
    escalatedTo?: string | null | undefined;
    slaDeadline?: NativeDate | null | undefined;
    decisionNote?: string | null | undefined;
    decidedBy?: string | null | undefined;
    decidedAt?: NativeDate | null | undefined;
    overriddenBy?: string | null | undefined;
    overrideReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: ReviewStatus;
    type: ReviewType;
    tenantId: string;
    priority: ReviewPriority;
    title: string;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    description?: string | null | undefined;
    decision?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        confidence?: number | null | undefined;
        action?: string | null | undefined;
        reasoning?: string | null | undefined;
    } | null | undefined;
    assignedTo?: string | null | undefined;
    reviewerRole?: string | null | undefined;
    escalatedTo?: string | null | undefined;
    slaDeadline?: NativeDate | null | undefined;
    decisionNote?: string | null | undefined;
    decidedBy?: string | null | undefined;
    decidedAt?: NativeDate | null | undefined;
    overriddenBy?: string | null | undefined;
    overrideReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: ReviewStatus;
    type: ReviewType;
    tenantId: string;
    priority: ReviewPriority;
    title: string;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    description?: string | null | undefined;
    decision?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        confidence?: number | null | undefined;
        action?: string | null | undefined;
        reasoning?: string | null | undefined;
    } | null | undefined;
    assignedTo?: string | null | undefined;
    reviewerRole?: string | null | undefined;
    escalatedTo?: string | null | undefined;
    slaDeadline?: NativeDate | null | undefined;
    decisionNote?: string | null | undefined;
    decidedBy?: string | null | undefined;
    decidedAt?: NativeDate | null | undefined;
    overriddenBy?: string | null | undefined;
    overrideReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: ReviewStatus;
    type: ReviewType;
    tenantId: string;
    priority: ReviewPriority;
    title: string;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    description?: string | null | undefined;
    decision?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        confidence?: number | null | undefined;
        action?: string | null | undefined;
        reasoning?: string | null | undefined;
    } | null | undefined;
    assignedTo?: string | null | undefined;
    reviewerRole?: string | null | undefined;
    escalatedTo?: string | null | undefined;
    slaDeadline?: NativeDate | null | undefined;
    decisionNote?: string | null | undefined;
    decidedBy?: string | null | undefined;
    decidedAt?: NativeDate | null | undefined;
    overriddenBy?: string | null | undefined;
    overrideReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: ReviewStatus;
    type: ReviewType;
    tenantId: string;
    priority: ReviewPriority;
    title: string;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    description?: string | null | undefined;
    decision?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        confidence?: number | null | undefined;
        action?: string | null | undefined;
        reasoning?: string | null | undefined;
    } | null | undefined;
    assignedTo?: string | null | undefined;
    reviewerRole?: string | null | undefined;
    escalatedTo?: string | null | undefined;
    slaDeadline?: NativeDate | null | undefined;
    decisionNote?: string | null | undefined;
    decidedBy?: string | null | undefined;
    decidedAt?: NativeDate | null | undefined;
    overriddenBy?: string | null | undefined;
    overrideReason?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const EscalationRuleModel: mongoose.Model<{
    active: boolean;
    name: string;
    tenantId: string;
    action: "escalate" | "notify" | "block" | "require_review";
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    escalateTo?: string | null | undefined;
    priorityBoost?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    active: boolean;
    name: string;
    tenantId: string;
    action: "escalate" | "notify" | "block" | "require_review";
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    escalateTo?: string | null | undefined;
    priorityBoost?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    active: boolean;
    name: string;
    tenantId: string;
    action: "escalate" | "notify" | "block" | "require_review";
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    escalateTo?: string | null | undefined;
    priorityBoost?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    active: boolean;
    name: string;
    tenantId: string;
    action: "escalate" | "notify" | "block" | "require_review";
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    escalateTo?: string | null | undefined;
    priorityBoost?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    active: boolean;
    name: string;
    tenantId: string;
    action: "escalate" | "notify" | "block" | "require_review";
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    escalateTo?: string | null | undefined;
    priorityBoost?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    active: boolean;
    name: string;
    tenantId: string;
    action: "escalate" | "notify" | "block" | "require_review";
    conditions: mongoose.Types.DocumentArray<{
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }> & {
        value?: any;
        field?: string | null | undefined;
        operator?: string | null | undefined;
    }>;
    description?: string | null | undefined;
    reason?: string | null | undefined;
    escalateTo?: string | null | undefined;
    priorityBoost?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ConfidenceThresholdModel: mongoose.Model<{
    active: boolean;
    tenantId: string;
    action: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        max: number;
        min: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    active: boolean;
    tenantId: string;
    action: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        max: number;
        min: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    active: boolean;
    tenantId: string;
    action: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        max: number;
        min: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    active: boolean;
    tenantId: string;
    action: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        max: number;
        min: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    active: boolean;
    tenantId: string;
    action: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        max: number;
        min: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    active: boolean;
    tenantId: string;
    action: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        max: number;
        min: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ReviewAuditModel: mongoose.Model<{
    tenantId: string;
    action: string;
    reviewId: string;
    performedBy: string;
    details?: Map<string, any> | null | undefined;
    role?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    action: string;
    reviewId: string;
    performedBy: string;
    details?: Map<string, any> | null | undefined;
    role?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    tenantId: string;
    action: string;
    reviewId: string;
    performedBy: string;
    details?: Map<string, any> | null | undefined;
    role?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    tenantId: string;
    action: string;
    reviewId: string;
    performedBy: string;
    details?: Map<string, any> | null | undefined;
    role?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    action: string;
    reviewId: string;
    performedBy: string;
    details?: Map<string, any> | null | undefined;
    role?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    tenantId: string;
    action: string;
    reviewId: string;
    performedBy: string;
    details?: Map<string, any> | null | undefined;
    role?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class HITLService {
    /**
     * Check if action needs human review
     */
    shouldReview(params: {
        tenantId: string;
        action: string;
        category?: string;
        confidence: number;
        value?: number;
        userId?: string;
    }): Promise<{
        needsReview: boolean;
        reason: string;
        priority: ReviewPriority;
    }>;
    /**
     * Create review request
     */
    createReview(params: {
        tenantId: string;
        type: ReviewType;
        title: string;
        description: string;
        context: Record<string, unknown>;
        originalAction: {
            type: string;
            params: Record<string, unknown>;
            result?: unknown;
            confidence?: number;
        };
        aiRecommendation: {
            action: string;
            confidence: number;
            reasoning: string;
        };
        assignedTo?: string;
        reviewerRole?: string;
        priority?: ReviewPriority;
        slaHours?: number;
    }): Promise<ReviewRequest>;
    /**
     * Get pending reviews
     */
    getPendingReviews(tenantId: string, params?: {
        assignedTo?: string;
        priority?: ReviewPriority;
        limit?: number;
    }): Promise<ReviewRequest[]>;
    /**
     * Make decision on review
     */
    decide(params: {
        reviewId: string;
        tenantId: string;
        decision: 'approve' | 'reject' | 'override' | 'escalate';
        decidedBy: string;
        decisionNote?: string;
        escalatedTo?: string;
    }): Promise<ReviewRequest>;
    /**
     * Check escalation rules
     */
    checkEscalation(params: {
        tenantId: string;
        action: string;
        value?: number;
        userId?: string;
        riskScore?: number;
    }): Promise<{
        shouldEscalate: boolean;
        escalateTo?: string;
        reason?: string;
    }>;
    /**
     * Get review statistics
     */
    getStats(tenantId: string): Promise<any>;
    private calculateAvgResolutionTime;
    private logAudit;
}
export declare const hitlService: HITLService;
//# sourceMappingURL=hitlService.d.ts.map