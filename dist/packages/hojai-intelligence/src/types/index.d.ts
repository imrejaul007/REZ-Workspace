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
        priority: "low" | "medium" | "high";
        reason: string;
    }, {
        action: string;
        priority: "low" | "medium" | "high";
        reason: string;
    }>, "many">>;
    features: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    version: z.ZodOptional<z.ZodString>;
    predictedFor: z.ZodOptional<z.ZodDate>;
    validUntil: z.ZodDate;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    value: number;
    type: PredictionType;
    userId: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    model: string;
    confidence: number;
    validUntil: Date;
    version?: string | undefined;
    risk?: PredictionRisk | undefined;
    features?: Record<string, number> | undefined;
    entityType?: "user" | "product" | "merchant" | "order" | undefined;
    entityId?: string | undefined;
    recommendations?: {
        action: string;
        priority: "low" | "medium" | "high";
        reason: string;
    }[] | undefined;
    factors?: {
        value: string | number;
        name: string;
        importance: number;
    }[] | undefined;
    explanation?: string | undefined;
    predictedFor?: Date | undefined;
}, {
    value: number;
    type: PredictionType;
    userId: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    model: string;
    confidence: number;
    validUntil: Date;
    version?: string | undefined;
    risk?: PredictionRisk | undefined;
    features?: Record<string, number> | undefined;
    entityType?: "user" | "product" | "merchant" | "order" | undefined;
    entityId?: string | undefined;
    recommendations?: {
        action: string;
        priority: "low" | "medium" | "high";
        reason: string;
    }[] | undefined;
    factors?: {
        value: string | number;
        name: string;
        importance: number;
    }[] | undefined;
    explanation?: string | undefined;
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
        position?: number | undefined;
        sourceEntityId?: string | undefined;
    }, {
        trigger?: string | undefined;
        position?: number | undefined;
        sourceEntityId?: string | undefined;
    }>>;
    display: z.ZodOptional<z.ZodObject<{
        imageUrl: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        rating: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        price?: number | undefined;
        discount?: number | undefined;
        imageUrl?: string | undefined;
        rating?: number | undefined;
    }, {
        price?: number | undefined;
        discount?: number | undefined;
        imageUrl?: string | undefined;
        rating?: number | undefined;
    }>>;
    personalization: z.ZodOptional<z.ZodObject<{
        demographics: z.ZodDefault<z.ZodBoolean>;
        behavior: z.ZodDefault<z.ZodBoolean>;
        collaborative: z.ZodDefault<z.ZodBoolean>;
        contextual: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        behavior: boolean;
        demographics: boolean;
        collaborative: boolean;
        contextual: boolean;
    }, {
        behavior?: boolean | undefined;
        demographics?: boolean | undefined;
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
    type: RecommendationType;
    title: string;
    category: string;
    userId: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    confidence: number;
    conversions: number;
    reason: string;
    entityType: "content" | "product" | "action" | "offer";
    entityId: string;
    score: number;
    validUntil: Date;
    impressions: number;
    clicks: number;
    context?: {
        trigger?: string | undefined;
        position?: number | undefined;
        sourceEntityId?: string | undefined;
    } | undefined;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    personalization?: {
        behavior: boolean;
        demographics: boolean;
        collaborative: boolean;
        contextual: boolean;
    } | undefined;
    display?: {
        price?: number | undefined;
        discount?: number | undefined;
        imageUrl?: string | undefined;
        rating?: number | undefined;
    } | undefined;
    validFrom?: Date | undefined;
}, {
    type: RecommendationType;
    title: string;
    category: string;
    userId: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    confidence: number;
    reason: string;
    entityType: "content" | "product" | "action" | "offer";
    entityId: string;
    score: number;
    validUntil: Date;
    context?: {
        trigger?: string | undefined;
        position?: number | undefined;
        sourceEntityId?: string | undefined;
    } | undefined;
    description?: string | undefined;
    metadata?: Record<string, any> | undefined;
    personalization?: {
        behavior?: boolean | undefined;
        demographics?: boolean | undefined;
        collaborative?: boolean | undefined;
        contextual?: boolean | undefined;
    } | undefined;
    conversions?: number | undefined;
    display?: {
        price?: number | undefined;
        discount?: number | undefined;
        imageUrl?: string | undefined;
        rating?: number | undefined;
    } | undefined;
    validFrom?: Date | undefined;
    impressions?: number | undefined;
    clicks?: number | undefined;
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
        channel?: string | undefined;
        sessionId?: string | undefined;
        amount?: number | undefined;
        requestId?: string | undefined;
    }, {
        channel?: string | undefined;
        sessionId?: string | undefined;
        amount?: number | undefined;
        requestId?: string | undefined;
    }>>;
    risk: z.ZodOptional<z.ZodNativeEnum<typeof PredictionRisk>>;
    fraudScore: z.ZodOptional<z.ZodNumber>;
    status: z.ZodEnum<["pending", "approved", "rejected", "manual_review"]>;
    reviewedBy: z.ZodOptional<z.ZodString>;
    reviewedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type: DecisionType;
    id: string;
    createdAt: Date;
    status: "pending" | "approved" | "rejected" | "manual_review";
    action: string;
    tenantId: string;
    reason: string;
    factors: {
        name: string;
        weight: number;
        value?: any;
    }[];
    context?: {
        channel?: string | undefined;
        sessionId?: string | undefined;
        amount?: number | undefined;
        requestId?: string | undefined;
    } | undefined;
    value?: number | undefined;
    userId?: string | undefined;
    model?: string | undefined;
    risk?: PredictionRisk | undefined;
    fraudScore?: number | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
}, {
    type: DecisionType;
    id: string;
    createdAt: Date;
    status: "pending" | "approved" | "rejected" | "manual_review";
    action: string;
    tenantId: string;
    reason: string;
    factors: {
        name: string;
        weight: number;
        value?: any;
    }[];
    context?: {
        channel?: string | undefined;
        sessionId?: string | undefined;
        amount?: number | undefined;
        requestId?: string | undefined;
    } | undefined;
    value?: number | undefined;
    userId?: string | undefined;
    model?: string | undefined;
    risk?: PredictionRisk | undefined;
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
    name: string;
    type: SegmentType;
    tags: string[];
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    priority: number;
    criteria: {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
        value?: any;
    }[];
    logic: "AND" | "OR";
    isDynamic: boolean;
    memberCount: number;
    description?: string | undefined;
    memberSample?: string[] | undefined;
}, {
    name: string;
    type: SegmentType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    criteria: {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
        value?: any;
    }[];
    description?: string | undefined;
    tags?: string[] | undefined;
    priority?: number | undefined;
    logic?: "AND" | "OR" | undefined;
    isDynamic?: boolean | undefined;
    memberCount?: number | undefined;
    memberSample?: string[] | undefined;
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
        recall?: number | undefined;
        accuracy?: number | undefined;
        precision?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
    }, {
        recall?: number | undefined;
        accuracy?: number | undefined;
        precision?: number | undefined;
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
    name: string;
    type: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: ModelStatus;
    version: string;
    tenantId: string;
    features: string[];
    predictionCount: number;
    metrics?: {
        recall?: number | undefined;
        accuracy?: number | undefined;
        precision?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
    } | undefined;
    description?: string | undefined;
    config?: Record<string, any> | undefined;
    trainedAt?: Date | undefined;
    trainingDataSize?: number | undefined;
    trainingDuration?: number | undefined;
    deployedAt?: Date | undefined;
    lastPredictionAt?: Date | undefined;
}, {
    name: string;
    type: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: ModelStatus;
    tenantId: string;
    features: string[];
    metrics?: {
        recall?: number | undefined;
        accuracy?: number | undefined;
        precision?: number | undefined;
        f1?: number | undefined;
        auc?: number | undefined;
        rmse?: number | undefined;
    } | undefined;
    description?: string | undefined;
    version?: string | undefined;
    config?: Record<string, any> | undefined;
    trainedAt?: Date | undefined;
    trainingDataSize?: number | undefined;
    trainingDuration?: number | undefined;
    deployedAt?: Date | undefined;
    lastPredictionAt?: Date | undefined;
    predictionCount?: number | undefined;
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
    userId: string;
    id: string;
    tenantId: string;
    segment: string;
    tier: RFMTier;
    validUntil: Date;
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    rfmScore: number;
    lastOrderDate: Date;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    computedAt: Date;
}, {
    userId: string;
    id: string;
    tenantId: string;
    segment: string;
    tier: RFMTier;
    validUntil: Date;
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    rfmScore: number;
    lastOrderDate: Date;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    computedAt: Date;
}>;
export type RFM = z.infer<typeof RFMSchema>;
export type { Prediction, Recommendation, Decision, Segment, ModelMetadata, RFM };
//# sourceMappingURL=index.d.ts.map