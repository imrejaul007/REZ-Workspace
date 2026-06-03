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
    type: "impression" | "click" | "conversion";
    channel: string;
    userId: string;
    id: string;
    tenantId: string;
    timestamp: Date;
    medium?: string | undefined;
    value?: number | undefined;
    source?: string | undefined;
    content?: string | undefined;
    sessionId?: string | undefined;
    campaign?: string | undefined;
    keyword?: string | undefined;
    conversionId?: string | undefined;
    device?: string | undefined;
    location?: string | undefined;
}, {
    type: "impression" | "click" | "conversion";
    channel: string;
    userId: string;
    id: string;
    tenantId: string;
    timestamp: Date;
    medium?: string | undefined;
    value?: number | undefined;
    source?: string | undefined;
    content?: string | undefined;
    sessionId?: string | undefined;
    campaign?: string | undefined;
    keyword?: string | undefined;
    conversionId?: string | undefined;
    device?: string | undefined;
    location?: string | undefined;
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
    value: number;
    userId: string;
    id: string;
    tenantId: string;
    timestamp: Date;
    conversionType: string;
    currency: string;
    metadata?: Record<string, any> | undefined;
}, {
    value: number;
    userId: string;
    id: string;
    tenantId: string;
    timestamp: Date;
    conversionType: string;
    metadata?: Record<string, any> | undefined;
    currency?: string | undefined;
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
    channel: string;
    attribution: number;
    cost: number;
    conversions: number;
    revenue: number;
    roas: number;
    touchpoints: {
        value: number;
        channel: string;
        touchpointDate: Date;
    }[];
}, {
    channel: string;
    attribution: number;
    cost: number;
    conversions: number;
    revenue: number;
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
        name: string;
        id: string;
        config: Record<string, any>;
        traffic: number;
        description?: string | undefined;
    }, {
        name: string;
        id: string;
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
        userSegments?: string[] | undefined;
        channels?: string[] | undefined;
    }, {
        userSegments?: string[] | undefined;
        channels?: string[] | undefined;
        minSampleSize?: number | undefined;
    }>>;
    primaryMetric: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["conversion_rate", "revenue", "engagement", "custom"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: "custom" | "revenue" | "conversion_rate" | "engagement";
    }, {
        name: string;
        type: "custom" | "revenue" | "conversion_rate" | "engagement";
    }>;
    secondaryMetrics: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
    }, {
        name: string;
        type: string;
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
            conversions: number;
            revenue: number;
            total: number;
            conversionRate: number;
        }, {
            conversions: number;
            revenue: number;
            total: number;
            conversionRate: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        variantStats: Record<string, {
            conversions: number;
            revenue: number;
            total: number;
            conversionRate: number;
        }>;
        confidence?: number | undefined;
        winner?: string | undefined;
        pValue?: number | undefined;
    }, {
        variantStats: Record<string, {
            conversions: number;
            revenue: number;
            total: number;
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
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: ExperimentStatus;
    tenantId: string;
    hypothesis: string;
    variants: {
        name: string;
        id: string;
        config: Record<string, any>;
        traffic: number;
        description?: string | undefined;
    }[];
    primaryMetric: {
        name: string;
        type: "custom" | "revenue" | "conversion_rate" | "engagement";
    };
    description?: string | undefined;
    targeting?: {
        minSampleSize: number;
        userSegments?: string[] | undefined;
        channels?: string[] | undefined;
    } | undefined;
    secondaryMetrics?: {
        name: string;
        type: string;
    }[] | undefined;
    results?: {
        variantStats: Record<string, {
            conversions: number;
            revenue: number;
            total: number;
            conversionRate: number;
        }>;
        confidence?: number | undefined;
        winner?: string | undefined;
        pValue?: number | undefined;
    } | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
}, {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    hypothesis: string;
    variants: {
        name: string;
        id: string;
        config: Record<string, any>;
        traffic: number;
        description?: string | undefined;
    }[];
    primaryMetric: {
        name: string;
        type: "custom" | "revenue" | "conversion_rate" | "engagement";
    };
    description?: string | undefined;
    status?: ExperimentStatus | undefined;
    targeting?: {
        userSegments?: string[] | undefined;
        channels?: string[] | undefined;
        minSampleSize?: number | undefined;
    } | undefined;
    secondaryMetrics?: {
        name: string;
        type: string;
    }[] | undefined;
    results?: {
        variantStats: Record<string, {
            conversions: number;
            revenue: number;
            total: number;
            conversionRate: number;
        }>;
        confidence?: number | undefined;
        winner?: string | undefined;
        pValue?: number | undefined;
    } | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
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
    userId: string;
    id: string;
    experimentId: string;
    variantId: string;
    assignedAt: Date;
    converted: boolean;
    metadata?: Record<string, any> | undefined;
    conversionValue?: number | undefined;
}, {
    userId: string;
    id: string;
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
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "exists";
        value?: any;
    }, {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "exists";
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
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
    tenantId: string;
    criteria: {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "exists";
        value?: any;
    }[];
    logic: "AND" | "OR";
    description?: string | undefined;
    tags?: string[] | undefined;
    estimatedSize?: number | undefined;
    actualSize?: number | undefined;
}, {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    criteria: {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "exists";
        value?: any;
    }[];
    description?: string | undefined;
    tags?: string[] | undefined;
    active?: boolean | undefined;
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
    name: string;
    type: "audience" | "attribution" | "custom" | "experiment";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    config: Record<string, any>;
    createdBy: string;
    description?: string | undefined;
    schedule?: {
        enabled: boolean;
        frequency: "daily" | "weekly" | "monthly";
        recipients: string[];
    } | undefined;
    lastRunAt?: Date | undefined;
}, {
    name: string;
    type: "audience" | "attribution" | "custom" | "experiment";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    config: Record<string, any>;
    createdBy: string;
    description?: string | undefined;
    schedule?: {
        frequency: "daily" | "weekly" | "monthly";
        recipients: string[];
        enabled?: boolean | undefined;
    } | undefined;
    lastRunAt?: Date | undefined;
}>;
export type Report = z.infer<typeof ReportSchema>;
//# sourceMappingURL=index.d.ts.map