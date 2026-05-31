import { z } from 'zod';
export declare enum PredictionType {
    CHURN = "churn",
    LTV = "ltv",
    REVISIT = "revisit",
    CONVERSION = "conversion",
    NEXT_PURCHASE = "next_purchase",
    DEMAND = "demand",
    FRAUD = "fraud"
}
export declare enum PredictionRisk {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare const PredictionSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    entityType: z.ZodOptional<z.ZodEnum<["user", "merchant", "product", "order"]>>;
    entityId: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof PredictionType>;
    value: z.ZodNumber;
    risk: z.ZodOptional<z.ZodNativeEnum<typeof PredictionRisk>>;
    confidence: z.ZodNumber;
    model: z.ZodString;
    factors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        importance: z.ZodNumber;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    }, "strip", z.ZodTypeAny, {
        value: string | number;
        name: string;
        importance: number;
    }, {
        value: string | number;
        name: string;
        importance: number;
    }>, "many">>;
    explanation: z.ZodOptional<z.ZodString>;
    recommendations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        action: z.ZodString;
        reason: z.ZodString;
        priority: z.ZodEnum<["high", "medium", "low"]>;
    }, "strip", z.ZodTypeAny, {
        action: string;
        reason: string;
        priority: "high" | "medium" | "low";
    }, {
        action: string;
        reason: string;
        priority: "high" | "medium" | "low";
    }>, "many">>;
    features: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    version: z.ZodOptional<z.ZodString>;
    predictedFor: z.ZodOptional<z.ZodDate>;
    validUntil: z.ZodDate;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    userId: string;
    type: PredictionType;
    value: number;
    confidence: number;
    model: string;
    validUntil: Date;
    createdAt: Date;
    entityType?: "user" | "merchant" | "product" | "order" | undefined;
    entityId?: string | undefined;
    risk?: PredictionRisk | undefined;
    factors?: {
        value: string | number;
        name: string;
        importance: number;
    }[] | undefined;
    explanation?: string | undefined;
    recommendations?: {
        action: string;
        reason: string;
        priority: "high" | "medium" | "low";
    }[] | undefined;
    features?: Record<string, number> | undefined;
    version?: string | undefined;
    predictedFor?: Date | undefined;
}, {
    id: string;
    tenantId: string;
    userId: string;
    type: PredictionType;
    value: number;
    confidence: number;
    model: string;
    validUntil: Date;
    createdAt: Date;
    entityType?: "user" | "merchant" | "product" | "order" | undefined;
    entityId?: string | undefined;
    risk?: PredictionRisk | undefined;
    factors?: {
        value: string | number;
        name: string;
        importance: number;
    }[] | undefined;
    explanation?: string | undefined;
    recommendations?: {
        action: string;
        reason: string;
        priority: "high" | "medium" | "low";
    }[] | undefined;
    features?: Record<string, number> | undefined;
    version?: string | undefined;
    predictedFor?: Date | undefined;
}>;
export type Prediction = z.infer<typeof PredictionSchema>;
export declare enum RecommendationType {
    PRODUCT = "product",
    CONTENT = "content",
    OFFER = "offer",
    ACTION = "action",
    NEXT_BEST_ACTION = "next_best_action"
}
export declare const RecommendationSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    type: z.ZodNativeEnum<typeof RecommendationType>;
    category: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    entityType: z.ZodEnum<["product", "content", "offer", "action"]>;
    entityId: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    score: z.ZodNumber;
    confidence: z.ZodNumber;
    reason: z.ZodString;
    context: z.ZodOptional<z.ZodObject<{
        trigger: z.ZodOptional<z.ZodString>;
        sourceEntityId: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        trigger?: string | undefined;
        sourceEntityId?: string | undefined;
        position?: number | undefined;
    }, {
        trigger?: string | undefined;
        sourceEntityId?: string | undefined;
        position?: number | undefined;
    }>>;
    display: z.ZodOptional<z.ZodObject<{
        imageUrl: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        rating: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        imageUrl?: string | undefined;
        price?: number | undefined;
        discount?: number | undefined;
        rating?: number | undefined;
    }, {
        imageUrl?: string | undefined;
        price?: number | undefined;
        discount?: number | undefined;
        rating?: number | undefined;
    }>>;
    personalization: z.ZodOptional<z.ZodObject<{
        demographics: z.ZodDefault<z.ZodBoolean>;
        behavior: z.ZodDefault<z.ZodBoolean>;
        collaborative: z.ZodDefault<z.ZodBoolean>;
        contextual: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        demographics: boolean;
        behavior: boolean;
        collaborative: boolean;
        contextual: boolean;
    }, {
        demographics?: boolean | undefined;
        behavior?: boolean | undefined;
        collaborative?: boolean | undefined;
        contextual?: boolean | undefined;
    }>>;
    validFrom: z.ZodOptional<z.ZodDate>;
    validUntil: z.ZodDate;
    impressions: z.ZodDefault<z.ZodNumber>;
    clicks: z.ZodDefault<z.ZodNumber>;
    conversions: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    userId: string;
    entityType: "product" | "action" | "content" | "offer";
    entityId: string;
    type: RecommendationType;
    confidence: number;
    reason: string;
    validUntil: Date;
    createdAt: Date;
    category: string;
    title: string;
    score: number;
    impressions: number;
    clicks: number;
    conversions: number;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    context?: {
        trigger?: string | undefined;
        sourceEntityId?: string | undefined;
        position?: number | undefined;
    } | undefined;
    display?: {
        imageUrl?: string | undefined;
        price?: number | undefined;
        discount?: number | undefined;
        rating?: number | undefined;
    } | undefined;
    personalization?: {
        demographics: boolean;
        behavior: boolean;
        collaborative: boolean;
        contextual: boolean;
    } | undefined;
    validFrom?: Date | undefined;
}, {
    id: string;
    tenantId: string;
    userId: string;
    entityType: "product" | "action" | "content" | "offer";
    entityId: string;
    type: RecommendationType;
    confidence: number;
    reason: string;
    validUntil: Date;
    createdAt: Date;
    category: string;
    title: string;
    score: number;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    context?: {
        trigger?: string | undefined;
        sourceEntityId?: string | undefined;
        position?: number | undefined;
    } | undefined;
    display?: {
        imageUrl?: string | undefined;
        price?: number | undefined;
        discount?: number | undefined;
        rating?: number | undefined;
    } | undefined;
    personalization?: {
        demographics?: boolean | undefined;
        behavior?: boolean | undefined;
        collaborative?: boolean | undefined;
        contextual?: boolean | undefined;
    } | undefined;
    validFrom?: Date | undefined;
    impressions?: number | undefined;
    clicks?: number | undefined;
    conversions?: number | undefined;
}>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export declare enum DecisionType {
    CASHBACK = "cashback",
    OFFER = "offer",
    TARGETING = "targeting",
    ROUTING = "routing",
    PRICING = "pricing",
    FRAUD = "fraud"
}
export declare const DecisionSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof DecisionType>;
    action: z.ZodString;
    value: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodString;
    factors: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        weight: z.ZodNumber;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        name: string;
        weight: number;
        value?: any;
    }, {
        name: string;
        weight: number;
        value?: any;
    }>, "many">;
    model: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        sessionId: z.ZodOptional<z.ZodString>;
        channel: z.ZodOptional<z.ZodString>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestId?: string | undefined;
        sessionId?: string | undefined;
        channel?: string | undefined;
        amount?: number | undefined;
    }, {
        requestId?: string | undefined;
        sessionId?: string | undefined;
        channel?: string | undefined;
        amount?: number | undefined;
    }>>;
    risk: z.ZodOptional<z.ZodNativeEnum<typeof PredictionRisk>>;
    fraudScore: z.ZodOptional<z.ZodNumber>;
    status: z.ZodEnum<["pending", "approved", "rejected", "manual_review"]>;
    reviewedBy: z.ZodOptional<z.ZodString>;
    reviewedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    type: DecisionType;
    status: "pending" | "approved" | "rejected" | "manual_review";
    factors: {
        name: string;
        weight: number;
        value?: any;
    }[];
    action: string;
    reason: string;
    createdAt: Date;
    userId?: string | undefined;
    value?: number | undefined;
    risk?: PredictionRisk | undefined;
    model?: string | undefined;
    context?: {
        requestId?: string | undefined;
        sessionId?: string | undefined;
        channel?: string | undefined;
        amount?: number | undefined;
    } | undefined;
    fraudScore?: number | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
}, {
    id: string;
    tenantId: string;
    type: DecisionType;
    status: "pending" | "approved" | "rejected" | "manual_review";
    factors: {
        name: string;
        weight: number;
        value?: any;
    }[];
    action: string;
    reason: string;
    createdAt: Date;
    userId?: string | undefined;
    value?: number | undefined;
    risk?: PredictionRisk | undefined;
    model?: string | undefined;
    context?: {
        requestId?: string | undefined;
        sessionId?: string | undefined;
        channel?: string | undefined;
        amount?: number | undefined;
    } | undefined;
    fraudScore?: number | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
}>;
export type Decision = z.infer<typeof DecisionSchema>;
export declare enum SegmentType {
    BEHAVIORAL = "behavioral",
    DEMOGRAPHIC = "demographic",
    PREDICTIVE = "predictive",
    RFM = "rfm",
    CUSTOM = "custom"
}
export declare const SegmentSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    type: z.ZodNativeEnum<typeof SegmentType>;
    description: z.ZodOptional<z.ZodString>;
    criteria: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"]>;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
        value?: any;
    }, {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
        value?: any;
    }>, "many">;
    logic: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
    isDynamic: z.ZodDefault<z.ZodBoolean>;
    memberCount: z.ZodDefault<z.ZodNumber>;
    memberSample: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodDefault<z.ZodNumber>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    type: SegmentType;
    name: string;
    priority: number;
    createdAt: Date;
    criteria: {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
        value?: any;
    }[];
    logic: "AND" | "OR";
    isDynamic: boolean;
    memberCount: number;
    tags: string[];
    updatedAt: Date;
    description?: string | undefined;
    memberSample?: string[] | undefined;
}, {
    id: string;
    tenantId: string;
    type: SegmentType;
    name: string;
    createdAt: Date;
    criteria: {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
        value?: any;
    }[];
    updatedAt: Date;
    priority?: number | undefined;
    description?: string | undefined;
    logic?: "AND" | "OR" | undefined;
    isDynamic?: boolean | undefined;
    memberCount?: number | undefined;
    memberSample?: string[] | undefined;
    tags?: string[] | undefined;
}>;
export type Segment = z.infer<typeof SegmentSchema>;
export declare enum ModelStatus {
    TRAINING = "training",
    DEPLOYED = "deployed",
    ARCHIVED = "archived"
}
export declare const ModelMetadataSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    status: z.ZodNativeEnum<typeof ModelStatus>;
    metrics: z.ZodOptional<z.ZodObject<{
        accuracy: z.ZodOptional<z.ZodNumber>;
        precision: z.ZodOptional<z.ZodNumber>;
        recall: z.ZodOptional<z.ZodNumber>;
        f1: z.ZodOptional<z.ZodNumber>;
        auc: z.ZodOptional<z.ZodNumber>;
        rmse: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        accuracy?: number | undefined;
        precision?: number | undefined;
        recall?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
    }, {
        accuracy?: number | undefined;
        precision?: number | undefined;
        recall?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
    }>>;
    trainedAt: z.ZodOptional<z.ZodDate>;
    trainingDataSize: z.ZodOptional<z.ZodNumber>;
    trainingDuration: z.ZodOptional<z.ZodNumber>;
    deployedAt: z.ZodOptional<z.ZodDate>;
    lastPredictionAt: z.ZodOptional<z.ZodDate>;
    predictionCount: z.ZodDefault<z.ZodNumber>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    features: z.ZodArray<z.ZodString, "many">;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    type: string;
    status: ModelStatus;
    name: string;
    features: string[];
    version: string;
    createdAt: Date;
    updatedAt: Date;
    predictionCount: number;
    description?: string | undefined;
    metrics?: {
        accuracy?: number | undefined;
        precision?: number | undefined;
        recall?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
    } | undefined;
    trainedAt?: Date | undefined;
    trainingDataSize?: number | undefined;
    trainingDuration?: number | undefined;
    deployedAt?: Date | undefined;
    lastPredictionAt?: Date | undefined;
    config?: Record<string, any> | undefined;
}, {
    id: string;
    tenantId: string;
    type: string;
    status: ModelStatus;
    name: string;
    features: string[];
    createdAt: Date;
    updatedAt: Date;
    version?: string | undefined;
    description?: string | undefined;
    metrics?: {
        accuracy?: number | undefined;
        precision?: number | undefined;
        recall?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
    } | undefined;
    trainedAt?: Date | undefined;
    trainingDataSize?: number | undefined;
    trainingDuration?: number | undefined;
    deployedAt?: Date | undefined;
    lastPredictionAt?: Date | undefined;
    predictionCount?: number | undefined;
    config?: Record<string, any> | undefined;
}>;
export type ModelMetadata = z.infer<typeof ModelMetadataSchema>;
export declare enum RFMTier {
    CHAMPIONS = "champions",
    LOYAL = "loyal",
    POTENTIAL = "potential",
    AT_RISK = "at_risk",
    LOST = "lost"
}
export declare const RFMSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    recencyScore: z.ZodNumber;
    frequencyScore: z.ZodNumber;
    monetaryScore: z.ZodNumber;
    rfmScore: z.ZodNumber;
    tier: z.ZodNativeEnum<typeof RFMTier>;
    lastOrderDate: z.ZodDate;
    totalOrders: z.ZodNumber;
    totalSpent: z.ZodNumber;
    averageOrderValue: z.ZodNumber;
    segment: z.ZodString;
    computedAt: z.ZodDate;
    validUntil: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    userId: string;
    validUntil: Date;
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    rfmScore: number;
    tier: RFMTier;
    lastOrderDate: Date;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    segment: string;
    computedAt: Date;
}, {
    id: string;
    tenantId: string;
    userId: string;
    validUntil: Date;
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    rfmScore: number;
    tier: RFMTier;
    lastOrderDate: Date;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    segment: string;
    computedAt: Date;
}>;
export type RFM = z.infer<typeof RFMSchema>;
export type { Prediction, Recommendation, Decision, Segment, ModelMetadata, RFM };
//# sourceMappingURL=index.d.ts.map