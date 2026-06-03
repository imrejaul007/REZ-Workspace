import mongoose from 'mongoose';
import { ReviewType, ReviewStatus, ReviewPriority, ReviewRequest } from '../types/index.js';
export declare const ReviewRequestModel: mongoose.Model<{
    type: ReviewType;
    title: string;
    status: ReviewStatus;
    tenantId: string;
    priority: ReviewPriority;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    decision?: string | null | undefined;
    description?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        action?: string | null | undefined;
        confidence?: number | null | undefined;
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
    type: ReviewType;
    title: string;
    status: ReviewStatus;
    tenantId: string;
    priority: ReviewPriority;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    decision?: string | null | undefined;
    description?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        action?: string | null | undefined;
        confidence?: number | null | undefined;
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
    type: ReviewType;
    title: string;
    status: ReviewStatus;
    tenantId: string;
    priority: ReviewPriority;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    decision?: string | null | undefined;
    description?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        action?: string | null | undefined;
        confidence?: number | null | undefined;
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
    type: ReviewType;
    title: string;
    status: ReviewStatus;
    tenantId: string;
    priority: ReviewPriority;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    decision?: string | null | undefined;
    description?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        action?: string | null | undefined;
        confidence?: number | null | undefined;
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
    type: ReviewType;
    title: string;
    status: ReviewStatus;
    tenantId: string;
    priority: ReviewPriority;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    decision?: string | null | undefined;
    description?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        action?: string | null | undefined;
        confidence?: number | null | undefined;
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
    type: ReviewType;
    title: string;
    status: ReviewStatus;
    tenantId: string;
    priority: ReviewPriority;
    slaHours: number;
    context?: Map<string, any> | null | undefined;
    decision?: string | null | undefined;
    description?: string | null | undefined;
    originalAction?: string | null | undefined;
    aiRecommendation?: {
        action?: string | null | undefined;
        confidence?: number | null | undefined;
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
    name: string;
    action: "escalate" | "block" | "require_review" | "notify";
    active: boolean;
    tenantId: string;
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
    name: string;
    action: "escalate" | "block" | "require_review" | "notify";
    active: boolean;
    tenantId: string;
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
    name: string;
    action: "escalate" | "block" | "require_review" | "notify";
    active: boolean;
    tenantId: string;
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
    name: string;
    action: "escalate" | "block" | "require_review" | "notify";
    active: boolean;
    tenantId: string;
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
    name: string;
    action: "escalate" | "block" | "require_review" | "notify";
    active: boolean;
    tenantId: string;
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
    name: string;
    action: "escalate" | "block" | "require_review" | "notify";
    active: boolean;
    tenantId: string;
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
    action: string;
    active: boolean;
    tenantId: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        min: number;
        max: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    action: string;
    active: boolean;
    tenantId: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        min: number;
        max: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    action: string;
    active: boolean;
    tenantId: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        min: number;
        max: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    action: string;
    active: boolean;
    tenantId: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        min: number;
        max: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    action: string;
    active: boolean;
    tenantId: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        min: number;
        max: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    action: string;
    active: boolean;
    tenantId: string;
    autoApproveBelow: number;
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles: string[];
    category?: string | null | undefined;
    reviewRequired?: {
        min: number;
        max: number;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ReviewAuditModel: mongoose.Model<{
    action: string;
    tenantId: string;
    reviewId: string;
    performedBy: string;
    role?: string | null | undefined;
    details?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    action: string;
    tenantId: string;
    reviewId: string;
    performedBy: string;
    role?: string | null | undefined;
    details?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    action: string;
    tenantId: string;
    reviewId: string;
    performedBy: string;
    role?: string | null | undefined;
    details?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    action: string;
    tenantId: string;
    reviewId: string;
    performedBy: string;
    role?: string | null | undefined;
    details?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    action: string;
    tenantId: string;
    reviewId: string;
    performedBy: string;
    role?: string | null | undefined;
    details?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    action: string;
    tenantId: string;
    reviewId: string;
    performedBy: string;
    role?: string | null | undefined;
    details?: Map<string, any> | null | undefined;
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