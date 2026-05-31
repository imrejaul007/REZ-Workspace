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
        confidence?: number | undefined;
        result?: any;
    }, {
        type: string;
        params: Record<string, any>;
        confidence?: number | undefined;
        result?: any;
    }>;
    aiRecommendation: z.ZodObject<{
        action: z.ZodString;
        confidence: z.ZodNumber;
        reasoning: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        action: string;
        confidence: number;
        reasoning: string;
    }, {
        action: string;
        confidence: number;
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
    context: Record<string, any>;
    id: string;
    type: ReviewType;
    status: ReviewStatus;
    tenantId: string;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    priority: ReviewPriority;
    originalAction: {
        type: string;
        params: Record<string, any>;
        confidence?: number | undefined;
        result?: any;
    };
    aiRecommendation: {
        action: string;
        confidence: number;
        reasoning: string;
    };
    slaDeadline: Date;
    slaHours: number;
    decision?: "approve" | "reject" | "override" | "escalate" | undefined;
    assignedTo?: string | undefined;
    reviewerRole?: string | undefined;
    escalatedTo?: string | undefined;
    decisionNote?: string | undefined;
    decidedBy?: string | undefined;
    decidedAt?: Date | undefined;
    overriddenBy?: string | undefined;
    overrideReason?: string | undefined;
}, {
    context: Record<string, any>;
    id: string;
    type: ReviewType;
    tenantId: string;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    originalAction: {
        type: string;
        params: Record<string, any>;
        confidence?: number | undefined;
        result?: any;
    };
    aiRecommendation: {
        action: string;
        confidence: number;
        reasoning: string;
    };
    slaDeadline: Date;
    status?: ReviewStatus | undefined;
    priority?: ReviewPriority | undefined;
    decision?: "approve" | "reject" | "override" | "escalate" | undefined;
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
        operator: "contains" | "in" | "equals" | "greater_than" | "less_than";
        value?: any;
    }, {
        field: string;
        operator: "contains" | "in" | "equals" | "greater_than" | "less_than";
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
    active: boolean;
    action: "escalate" | "block" | "require_review" | "notify";
    id: string;
    name: string;
    tenantId: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    conditions: {
        field: string;
        operator: "contains" | "in" | "equals" | "greater_than" | "less_than";
        value?: any;
    }[];
    reason?: string | undefined;
    escalateTo?: string | undefined;
    priorityBoost?: number | undefined;
}, {
    action: "escalate" | "block" | "require_review" | "notify";
    id: string;
    name: string;
    tenantId: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    conditions: {
        field: string;
        operator: "contains" | "in" | "equals" | "greater_than" | "less_than";
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
        min: number;
        max: number;
    }, {
        min?: number | undefined;
        max?: number | undefined;
    }>;
    autoApproveAbove: z.ZodDefault<z.ZodNumber>;
    canOverride: z.ZodDefault<z.ZodBoolean>;
    overrideRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    action: string;
    id: string;
    tenantId: string;
    category: string;
    autoApproveBelow: number;
    reviewRequired: {
        min: number;
        max: number;
    };
    autoApproveAbove: number;
    canOverride: boolean;
    overrideRoles?: string[] | undefined;
}, {
    action: string;
    id: string;
    tenantId: string;
    category: string;
    reviewRequired: {
        min?: number | undefined;
        max?: number | undefined;
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
    action: "escalated" | "expired" | "overridden" | "created" | "assigned" | "decided" | "commented";
    details: Record<string, any>;
    id: string;
    tenantId: string;
    createdAt: Date;
    reviewId: string;
    performedBy: string;
    role?: string | undefined;
}, {
    action: "escalated" | "expired" | "overridden" | "created" | "assigned" | "decided" | "commented";
    details: Record<string, any>;
    id: string;
    tenantId: string;
    createdAt: Date;
    reviewId: string;
    performedBy: string;
    role?: string | undefined;
}>;
export type ReviewAudit = z.infer<typeof ReviewAuditSchema>;
//# sourceMappingURL=index.d.ts.map