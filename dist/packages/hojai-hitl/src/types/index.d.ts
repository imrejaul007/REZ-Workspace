import { z } from 'zod';
export declare enum ReviewType {
    DECISION = "decision",
    CONTENT = "content",
    ACTION = "action",
    ESCALATION = "escalation",
    EXCEPTION = "exception"
}
export declare enum ReviewStatus {
    PENDING = "pending",
    IN_REVIEW = "in_review",
    APPROVED = "approved",
    REJECTED = "rejected",
    OVERRIDDEN = "overridden",
    ESCALATED = "escalated",
    EXPIRED = "expired"
}
export declare enum ReviewPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare const ReviewRequestSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    type: z.ZodNativeEnum<typeof ReviewType>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof ReviewStatus>>;
    priority: z.ZodDefault<z.ZodNativeEnum<typeof ReviewPriority>>;
    title: z.ZodString;
    description: z.ZodString;
    context: z.ZodRecord<z.ZodString, z.ZodAny>;
    originalAction: z.ZodObject<{
        type: z.ZodString;
        params: z.ZodRecord<z.ZodString, z.ZodAny>;
        result: z.ZodOptional<z.ZodAny>;
        confidence: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        params: Record<string, any>;
        result?: any;
        confidence?: number | undefined;
    }, {
        type: string;
        params: Record<string, any>;
        result?: any;
        confidence?: number | undefined;
    }>;
    aiRecommendation: z.ZodObject<{
        action: z.ZodString;
        confidence: z.ZodNumber;
        reasoning: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        action: string;
        reasoning: string;
    }, {
        confidence: number;
        action: string;
        reasoning: string;
    }>;
    assignedTo: z.ZodOptional<z.ZodString>;
    reviewerRole: z.ZodOptional<z.ZodString>;
    escalatedTo: z.ZodOptional<z.ZodString>;
    slaDeadline: z.ZodDate;
    slaHours: z.ZodDefault<z.ZodNumber>;
    decision: z.ZodOptional<z.ZodEnum<["approve", "reject", "override", "escalate"]>>;
    decisionNote: z.ZodOptional<z.ZodString>;
    decidedBy: z.ZodOptional<z.ZodString>;
    decidedAt: z.ZodOptional<z.ZodDate>;
    overriddenBy: z.ZodOptional<z.ZodString>;
    overrideReason: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: ReviewStatus;
    type: ReviewType;
    context: Record<string, any>;
    description: string;
    tenantId: string;
    priority: ReviewPriority;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    originalAction: {
        type: string;
        params: Record<string, any>;
        result?: any;
        confidence?: number | undefined;
    };
    aiRecommendation: {
        confidence: number;
        action: string;
        reasoning: string;
    };
    slaDeadline: Date;
    slaHours: number;
    decision?: "escalate" | "approve" | "reject" | "override" | undefined;
    assignedTo?: string | undefined;
    reviewerRole?: string | undefined;
    escalatedTo?: string | undefined;
    decisionNote?: string | undefined;
    decidedBy?: string | undefined;
    decidedAt?: Date | undefined;
    overriddenBy?: string | undefined;
    overrideReason?: string | undefined;
}, {
    id: string;
    type: ReviewType;
    context: Record<string, any>;
    description: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    originalAction: {
        type: string;
        params: Record<string, any>;
        result?: any;
        confidence?: number | undefined;
    };
    aiRecommendation: {
        confidence: number;
        action: string;
        reasoning: string;
    };
    slaDeadline: Date;
    status?: ReviewStatus | undefined;
    priority?: ReviewPriority | undefined;
    decision?: "escalate" | "approve" | "reject" | "override" | undefined;
    assignedTo?: string | undefined;
    reviewerRole?: string | undefined;
    escalatedTo?: string | undefined;
    slaHours?: number | undefined;
    decisionNote?: string | undefined;
    decidedBy?: string | undefined;
    decidedAt?: Date | undefined;
    overriddenBy?: string | undefined;
    overrideReason?: string | undefined;
}>;
export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;
export declare const EscalationRuleSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    conditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["equals", "greater_than", "less_than", "in", "contains"]>;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "contains" | "equals" | "in" | "greater_than" | "less_than";
        value?: any;
    }, {
        field: string;
        operator: "contains" | "equals" | "in" | "greater_than" | "less_than";
        value?: any;
    }>, "many">;
    action: z.ZodEnum<["escalate", "block", "require_review", "notify"]>;
    escalateTo: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
    priorityBoost: z.ZodOptional<z.ZodNumber>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    active: boolean;
    name: string;
    description: string;
    tenantId: string;
    action: "escalate" | "notify" | "block" | "require_review";
    createdAt: Date;
    updatedAt: Date;
    conditions: {
        field: string;
        operator: "contains" | "equals" | "in" | "greater_than" | "less_than";
        value?: any;
    }[];
    reason?: string | undefined;
    escalateTo?: string | undefined;
    priorityBoost?: number | undefined;
}, {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    action: "escalate" | "notify" | "block" | "require_review";
    createdAt: Date;
    updatedAt: Date;
    conditions: {
        field: string;
        operator: "contains" | "equals" | "in" | "greater_than" | "less_than";
        value?: any;
    }[];
    active?: boolean | undefined;
    reason?: string | undefined;
    escalateTo?: string | undefined;
    priorityBoost?: number | undefined;
}>;
export type EscalationRule = z.infer<typeof EscalationRuleSchema>;
export declare const ConfidenceThresholdSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    action: z.ZodString;
    category: z.ZodString;
    autoApproveBelow: z.ZodDefault<z.ZodNumber>;
    reviewRequired: z.ZodObject<{
        min: z.ZodDefault<z.ZodNumber>;
        max: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        max: number;
        min: number;
    }, {
        max?: number | undefined;
        min?: number | undefined;
    }>;
    autoApproveAbove: z.ZodDefault<z.ZodNumber>;
    canOverride: z.ZodDefault<z.ZodBoolean>;
    overrideRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    active: boolean;
    tenantId: string;
    category: string;
    action: string;
    autoApproveBelow: number;
    reviewRequired: {
        max: number;
        min: number;
    };
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles?: string[] | undefined;
}, {
    id: string;
    tenantId: string;
    category: string;
    action: string;
    reviewRequired: {
        max?: number | undefined;
        min?: number | undefined;
    };
    active?: boolean | undefined;
    autoApproveBelow?: number | undefined;
    autoApproveAbove?: number | undefined;
    canOverride?: boolean | undefined;
    overrideRoles?: string[] | undefined;
}>;
export type ConfidenceThreshold = z.infer<typeof ConfidenceThresholdSchema>;
export declare const ReviewAuditSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    reviewId: z.ZodString;
    action: z.ZodEnum<["created", "assigned", "decided", "overridden", "escalated", "expired", "commented"]>;
    performedBy: z.ZodString;
    role: z.ZodOptional<z.ZodString>;
    details: z.ZodRecord<z.ZodString, z.ZodAny>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    details: Record<string, any>;
    tenantId: string;
    action: "escalated" | "assigned" | "expired" | "created" | "overridden" | "decided" | "commented";
    createdAt: Date;
    reviewId: string;
    performedBy: string;
    role?: string | undefined;
}, {
    id: string;
    details: Record<string, any>;
    tenantId: string;
    action: "escalated" | "assigned" | "expired" | "created" | "overridden" | "decided" | "commented";
    createdAt: Date;
    reviewId: string;
    performedBy: string;
    role?: string | undefined;
}>;
export type ReviewAudit = z.infer<typeof ReviewAuditSchema>;
//# sourceMappingURL=index.d.ts.map