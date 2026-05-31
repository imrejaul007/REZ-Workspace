import { z } from 'zod';
export declare enum AttributionModel {
    FIRST_TOUCH = "first_touch",
    LAST_TOUCH = "last_touch",
    LINEAR = "linear",
    TIME_DECAY = "time_decay",
    POSITION_BASED = "position_based",
    DATA_DRIVEN = "data_driven"
}
export declare const AttributionEventSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    sessionId: z.ZodOptional<z.ZodString>;
    channel: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    campaign: z.ZodOptional<z.ZodString>;
    medium: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    keyword: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["impression", "click", "conversion"]>;
    timestamp: z.ZodDate;
    value: z.ZodOptional<z.ZodNumber>;
    conversionId: z.ZodOptional<z.ZodString>;
    device: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "conversion" | "click" | "impression";
    tenantId: string;
    userId: string;
    timestamp: Date;
    channel: string;
    keyword?: string | undefined;
    value?: number | undefined;
    content?: string | undefined;
    medium?: string | undefined;
    location?: string | undefined;
    source?: string | undefined;
    campaign?: string | undefined;
    sessionId?: string | undefined;
    conversionId?: string | undefined;
    device?: string | undefined;
}, {
    id: string;
    type: "conversion" | "click" | "impression";
    tenantId: string;
    userId: string;
    timestamp: Date;
    channel: string;
    keyword?: string | undefined;
    value?: number | undefined;
    content?: string | undefined;
    medium?: string | undefined;
    location?: string | undefined;
    source?: string | undefined;
    campaign?: string | undefined;
    sessionId?: string | undefined;
    conversionId?: string | undefined;
    device?: string | undefined;
}>;
export type AttributionEvent = z.infer<typeof AttributionEventSchema>;
export declare const ConversionSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    conversionType: z.ZodString;
    value: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    userId: string;
    currency: string;
    value: number;
    timestamp: Date;
    conversionType: string;
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    tenantId: string;
    userId: string;
    value: number;
    timestamp: Date;
    conversionType: string;
    currency?: string | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export type Conversion = z.infer<typeof ConversionSchema>;
export declare const AttributionResultSchema: z.ZodObject<{
    channel: z.ZodString;
    conversions: z.ZodNumber;
    revenue: z.ZodNumber;
    cost: z.ZodNumber;
    roas: z.ZodNumber;
    attribution: z.ZodNumber;
    touchpoints: z.ZodArray<z.ZodObject<{
        channel: z.ZodString;
        touchpointDate: z.ZodDate;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value: number;
        channel: string;
        touchpointDate: Date;
    }, {
        value: number;
        channel: string;
        touchpointDate: Date;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    revenue: number;
    channel: string;
    cost: number;
    attribution: number;
    conversions: number;
    roas: number;
    touchpoints: {
        value: number;
        channel: string;
        touchpointDate: Date;
    }[];
}, {
    revenue: number;
    channel: string;
    cost: number;
    attribution: number;
    conversions: number;
    roas: number;
    touchpoints: {
        value: number;
        channel: string;
        touchpointDate: Date;
    }[];
}>;
export type AttributionResult = z.infer<typeof AttributionResultSchema>;
export declare enum ExperimentStatus {
    DRAFT = "draft",
    RUNNING = "running",
    PAUSED = "paused",
    COMPLETED = "completed"
}
export declare const ExperimentSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    hypothesis: z.ZodString;
    status: z.ZodDefault<z.ZodNativeEnum<typeof ExperimentStatus>>;
    variants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        traffic: z.ZodNumber;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        config: Record<string, any>;
        traffic: number;
        description?: string | undefined;
    }, {
        id: string;
        name: string;
        config: Record<string, any>;
        traffic: number;
        description?: string | undefined;
    }>, "many">;
    targeting: z.ZodOptional<z.ZodObject<{
        userSegments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        channels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        minSampleSize: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        minSampleSize: number;
        channels?: string[] | undefined;
        userSegments?: string[] | undefined;
    }, {
        channels?: string[] | undefined;
        userSegments?: string[] | undefined;
        minSampleSize?: number | undefined;
    }>>;
    primaryMetric: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["conversion_rate", "revenue", "engagement", "custom"]>;
    }, "strip", z.ZodTypeAny, {
        type: "custom" | "engagement" | "revenue" | "conversion_rate";
        name: string;
    }, {
        type: "custom" | "engagement" | "revenue" | "conversion_rate";
        name: string;
    }>;
    secondaryMetrics: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
    }, {
        type: string;
        name: string;
    }>, "many">>;
    results: z.ZodOptional<z.ZodObject<{
        winner: z.ZodOptional<z.ZodString>;
        confidence: z.ZodOptional<z.ZodNumber>;
        pValue: z.ZodOptional<z.ZodNumber>;
        variantStats: z.ZodRecord<z.ZodString, z.ZodObject<{
            conversions: z.ZodNumber;
            total: z.ZodNumber;
            conversionRate: z.ZodNumber;
            revenue: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            revenue: number;
            total: number;
            conversions: number;
            conversionRate: number;
        }, {
            revenue: number;
            total: number;
            conversions: number;
            conversionRate: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        variantStats: Record<string, {
            revenue: number;
            total: number;
            conversions: number;
            conversionRate: number;
        }>;
        confidence?: number | undefined;
        winner?: string | undefined;
        pValue?: number | undefined;
    }, {
        variantStats: Record<string, {
            revenue: number;
            total: number;
            conversions: number;
            conversionRate: number;
        }>;
        confidence?: number | undefined;
        winner?: string | undefined;
        pValue?: number | undefined;
    }>>;
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: ExperimentStatus;
    name: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    variants: {
        id: string;
        name: string;
        config: Record<string, any>;
        traffic: number;
        description?: string | undefined;
    }[];
    hypothesis: string;
    primaryMetric: {
        type: "custom" | "engagement" | "revenue" | "conversion_rate";
        name: string;
    };
    description?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    targeting?: {
        minSampleSize: number;
        channels?: string[] | undefined;
        userSegments?: string[] | undefined;
    } | undefined;
    secondaryMetrics?: {
        type: string;
        name: string;
    }[] | undefined;
    results?: {
        variantStats: Record<string, {
            revenue: number;
            total: number;
            conversions: number;
            conversionRate: number;
        }>;
        confidence?: number | undefined;
        winner?: string | undefined;
        pValue?: number | undefined;
    } | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    variants: {
        id: string;
        name: string;
        config: Record<string, any>;
        traffic: number;
        description?: string | undefined;
    }[];
    hypothesis: string;
    primaryMetric: {
        type: "custom" | "engagement" | "revenue" | "conversion_rate";
        name: string;
    };
    status?: ExperimentStatus | undefined;
    description?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    targeting?: {
        channels?: string[] | undefined;
        userSegments?: string[] | undefined;
        minSampleSize?: number | undefined;
    } | undefined;
    secondaryMetrics?: {
        type: string;
        name: string;
    }[] | undefined;
    results?: {
        variantStats: Record<string, {
            revenue: number;
            total: number;
            conversions: number;
            conversionRate: number;
        }>;
        confidence?: number | undefined;
        winner?: string | undefined;
        pValue?: number | undefined;
    } | undefined;
}>;
export type Experiment = z.infer<typeof ExperimentSchema>;
export declare const ExperimentVariantSchema: z.ZodObject<{
    id: z.ZodString;
    experimentId: z.ZodString;
    variantId: z.ZodString;
    userId: z.ZodString;
    assignedAt: z.ZodDate;
    converted: z.ZodDefault<z.ZodBoolean>;
    conversionValue: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    converted: boolean;
    experimentId: string;
    variantId: string;
    assignedAt: Date;
    metadata?: Record<string, any> | undefined;
    conversionValue?: number | undefined;
}, {
    id: string;
    userId: string;
    experimentId: string;
    variantId: string;
    assignedAt: Date;
    metadata?: Record<string, any> | undefined;
    converted?: boolean | undefined;
    conversionValue?: number | undefined;
}>;
export type ExperimentVariant = z.infer<typeof ExperimentVariantSchema>;
export declare const AudienceSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    criteria: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains", "exists"]>;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "contains" | "eq" | "gt" | "neq" | "gte" | "lt" | "lte" | "in" | "exists";
        value?: any;
    }, {
        field: string;
        operator: "contains" | "eq" | "gt" | "neq" | "gte" | "lt" | "lte" | "in" | "exists";
        value?: any;
    }>, "many">;
    logic: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
    estimatedSize: z.ZodOptional<z.ZodNumber>;
    actualSize: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    active: boolean;
    name: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    criteria: {
        field: string;
        operator: "contains" | "eq" | "gt" | "neq" | "gte" | "lt" | "lte" | "in" | "exists";
        value?: any;
    }[];
    logic: "AND" | "OR";
    description?: string | undefined;
    tags?: string[] | undefined;
    estimatedSize?: number | undefined;
    actualSize?: number | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    criteria: {
        field: string;
        operator: "contains" | "eq" | "gt" | "neq" | "gte" | "lt" | "lte" | "in" | "exists";
        value?: any;
    }[];
    active?: boolean | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    logic?: "AND" | "OR" | undefined;
    estimatedSize?: number | undefined;
    actualSize?: number | undefined;
}>;
export type Audience = z.infer<typeof AudienceSchema>;
export declare const ReportSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["attribution", "experiment", "audience", "custom"]>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    schedule: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        frequency: z.ZodEnum<["daily", "weekly", "monthly"]>;
        recipients: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        frequency: "daily" | "weekly" | "monthly";
        recipients: string[];
    }, {
        frequency: "daily" | "weekly" | "monthly";
        recipients: string[];
        enabled?: boolean | undefined;
    }>>;
    lastRunAt: z.ZodOptional<z.ZodDate>;
    createdBy: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "custom" | "attribution" | "experiment" | "audience";
    name: string;
    config: Record<string, any>;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    schedule?: {
        enabled: boolean;
        frequency: "daily" | "weekly" | "monthly";
        recipients: string[];
    } | undefined;
    description?: string | undefined;
    lastRunAt?: Date | undefined;
}, {
    id: string;
    type: "custom" | "attribution" | "experiment" | "audience";
    name: string;
    config: Record<string, any>;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    schedule?: {
        frequency: "daily" | "weekly" | "monthly";
        recipients: string[];
        enabled?: boolean | undefined;
    } | undefined;
    description?: string | undefined;
    lastRunAt?: Date | undefined;
}>;
export type Report = z.infer<typeof ReportSchema>;
//# sourceMappingURL=index.d.ts.map