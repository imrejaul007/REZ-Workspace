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
        name: string;
        value: string | number;
        importance: number;
    }, {
        name: string;
        value: string | number;
        importance: number;
    }>, "many">>;
    explanation: z.ZodOptional<z.ZodString>;
    recommendations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        action: z.ZodString;
        reason: z.ZodString;
        priority: z.ZodEnum<["high", "medium", "low"]>;
    }, "strip", z.ZodTypeAny, {
        action: string;
        priority: "low" | "high" | "medium";
        reason: string;
    }, {
        action: string;
        priority: "low" | "high" | "medium";
        reason: string;
    }>, "many">>;
    features: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    version: z.ZodOptional<z.ZodString>;
    predictedFor: z.ZodOptional<z.ZodDate>;
    validUntil: z.ZodDate;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: PredictionType;
    tenantId: string;
    userId: string;
    confidence: number;
    value: number;
    createdAt: Date;
    model: string;
    validUntil: Date;
    version?: string | undefined;
    recommendations?: {
        action: string;
        priority: "low" | "high" | "medium";
        reason: string;
    }[] | undefined;
    features?: Record<string, number> | undefined;
    risk?: PredictionRisk | undefined;
    entityType?: "user" | "order" | "product" | "merchant" | undefined;
    entityId?: string | undefined;
    factors?: {
        name: string;
        value: string | number;
        importance: number;
    }[] | undefined;
    explanation?: string | undefined;
    predictedFor?: Date | undefined;
}, {
    id: string;
    type: PredictionType;
    tenantId: string;
    userId: string;
    confidence: number;
    value: number;
    createdAt: Date;
    model: string;
    validUntil: Date;
    version?: string | undefined;
    recommendations?: {
        action: string;
        priority: "low" | "high" | "medium";
        reason: string;
    }[] | undefined;
    features?: Record<string, number> | undefined;
    risk?: PredictionRisk | undefined;
    entityType?: "user" | "order" | "product" | "merchant" | undefined;
    entityId?: string | undefined;
    factors?: {
        name: string;
        value: string | number;
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
        discount?: number | undefined;
        price?: number | undefined;
        imageUrl?: string | undefined;
        rating?: number | undefined;
    }, {
        discount?: number | undefined;
        price?: number | undefined;
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
    id: string;
    type: RecommendationType;
    tenantId: string;
    userId: string;
    category: string;
    confidence: number;
    createdAt: Date;
    reason: string;
    score: number;
    title: string;
    conversions: number;
    entityType: "action" | "content" | "product" | "offer";
    entityId: string;
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
        discount?: number | undefined;
        price?: number | undefined;
        imageUrl?: string | undefined;
        rating?: number | undefined;
    } | undefined;
    validFrom?: Date | undefined;
}, {
    id: string;
    type: RecommendationType;
    tenantId: string;
    userId: string;
    category: string;
    confidence: number;
    createdAt: Date;
    reason: string;
    score: number;
    title: string;
    entityType: "action" | "content" | "product" | "offer";
    entityId: string;
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
        discount?: number | undefined;
        price?: number | undefined;
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
    id: string;
    status: "pending" | "approved" | "rejected" | "manual_review";
    type: DecisionType;
    tenantId: string;
    action: string;
    createdAt: Date;
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
    userId?: string | undefined;
    value?: number | undefined;
    model?: string | undefined;
    risk?: PredictionRisk | undefined;
    fraudScore?: number | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
}, {
    id: string;
    status: "pending" | "approved" | "rejected" | "manual_review";
    type: DecisionType;
    tenantId: string;
    action: string;
    createdAt: Date;
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
    userId?: string | undefined;
    value?: number | undefined;
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
        operator: "contains" | "eq" | "gt" | "neq" | "gte" | "lt" | "lte" | "in";
        value?: any;
    }, {
        field: string;
        operator: "contains" | "eq" | "gt" | "neq" | "gte" | "lt" | "lte" | "in";
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
    type: SegmentType;
    name: string;
    tenantId: string;
    priority: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    criteria: {
        field: string;
        operator: "contains" | "eq" | "gt" | "neq" | "gte" | "lt" | "lte" | "in";
        value?: any;
    }[];
    logic: "AND" | "OR";
    isDynamic: boolean;
    memberCount: number;
    description?: string | undefined;
    memberSample?: string[] | undefined;
}, {
    id: string;
    type: SegmentType;
    name: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    criteria: {
        field: string;
        operator: "contains" | "eq" | "gt" | "neq" | "gte" | "lt" | "lte" | "in";
        value?: any;
    }[];
    description?: string | undefined;
    priority?: number | undefined;
    tags?: string[] | undefined;
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
    version: string;
    status: ModelStatus;
    type: string;
    name: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    features: string[];
    predictionCount: number;
    description?: string | undefined;
    config?: Record<string, any> | undefined;
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
}, {
    id: string;
    status: ModelStatus;
    type: string;
    name: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    features: string[];
    version?: string | undefined;
    description?: string | undefined;
    config?: Record<string, any> | undefined;
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
    segment: string;
    totalOrders: number;
    tier: RFMTier;
    validUntil: Date;
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    rfmScore: number;
    lastOrderDate: Date;
    totalSpent: number;
    averageOrderValue: number;
    computedAt: Date;
}, {
    id: string;
    tenantId: string;
    userId: string;
    segment: string;
    totalOrders: number;
    tier: RFMTier;
    validUntil: Date;
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    rfmScore: number;
    lastOrderDate: Date;
    totalSpent: number;
    averageOrderValue: number;
    computedAt: Date;
}>;
export type RFM = z.infer<typeof RFMSchema>;
export type { Prediction, Recommendation, Decision, Segment, ModelMetadata, RFM };
//# sourceMappingURL=index.d.ts.map