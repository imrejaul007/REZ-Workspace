import mongoose from 'mongoose';
import { AttributionEvent, Conversion, Experiment, Audience, Report, AttributionModel, ExperimentStatus } from '../types/index.js';
export declare const AttributionEventModel: mongoose.Model<{
    type: "impression" | "click" | "conversion";
    channel: string;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    medium?: string | null | undefined;
    value?: number | null | undefined;
    source?: string | null | undefined;
    content?: string | null | undefined;
    sessionId?: string | null | undefined;
    campaign?: string | null | undefined;
    keyword?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
    location?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    type: "impression" | "click" | "conversion";
    channel: string;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    medium?: string | null | undefined;
    value?: number | null | undefined;
    source?: string | null | undefined;
    content?: string | null | undefined;
    sessionId?: string | null | undefined;
    campaign?: string | null | undefined;
    keyword?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
    location?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    type: "impression" | "click" | "conversion";
    channel: string;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    medium?: string | null | undefined;
    value?: number | null | undefined;
    source?: string | null | undefined;
    content?: string | null | undefined;
    sessionId?: string | null | undefined;
    campaign?: string | null | undefined;
    keyword?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
    location?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "impression" | "click" | "conversion";
    channel: string;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    medium?: string | null | undefined;
    value?: number | null | undefined;
    source?: string | null | undefined;
    content?: string | null | undefined;
    sessionId?: string | null | undefined;
    campaign?: string | null | undefined;
    keyword?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
    location?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: "impression" | "click" | "conversion";
    channel: string;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    medium?: string | null | undefined;
    value?: number | null | undefined;
    source?: string | null | undefined;
    content?: string | null | undefined;
    sessionId?: string | null | undefined;
    campaign?: string | null | undefined;
    keyword?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
    location?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    type: "impression" | "click" | "conversion";
    channel: string;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    medium?: string | null | undefined;
    value?: number | null | undefined;
    source?: string | null | undefined;
    content?: string | null | undefined;
    sessionId?: string | null | undefined;
    campaign?: string | null | undefined;
    keyword?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
    location?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ConversionModel: mongoose.Model<{
    value: number;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    conversionType: string;
    currency: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    value: number;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    conversionType: string;
    currency: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    value: number;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    conversionType: string;
    currency: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    value: number;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    conversionType: string;
    currency: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    value: number;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    conversionType: string;
    currency: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    value: number;
    userId: string;
    tenantId: string;
    timestamp: NativeDate;
    conversionType: string;
    currency: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ExperimentModel: mongoose.Model<{
    name: string;
    status: ExperimentStatus;
    tenantId: string;
    hypothesis: string;
    variants: mongoose.Types.DocumentArray<{
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    targeting?: {
        userSegments: string[];
        channels: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    status: ExperimentStatus;
    tenantId: string;
    hypothesis: string;
    variants: mongoose.Types.DocumentArray<{
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    targeting?: {
        userSegments: string[];
        channels: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    status: ExperimentStatus;
    tenantId: string;
    hypothesis: string;
    variants: mongoose.Types.DocumentArray<{
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    targeting?: {
        userSegments: string[];
        channels: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    status: ExperimentStatus;
    tenantId: string;
    hypothesis: string;
    variants: mongoose.Types.DocumentArray<{
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    targeting?: {
        userSegments: string[];
        channels: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    status: ExperimentStatus;
    tenantId: string;
    hypothesis: string;
    variants: mongoose.Types.DocumentArray<{
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    targeting?: {
        userSegments: string[];
        channels: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    status: ExperimentStatus;
    tenantId: string;
    hypothesis: string;
    variants: mongoose.Types.DocumentArray<{
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        name?: string | null | undefined;
        description?: string | null | undefined;
        id?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    targeting?: {
        userSegments: string[];
        channels: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ExperimentVariantModel: mongoose.Model<{
    userId: string;
    tenantId: string;
    experimentId: string;
    variantId: string;
    converted: boolean;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    userId: string;
    tenantId: string;
    experimentId: string;
    variantId: string;
    converted: boolean;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    userId: string;
    tenantId: string;
    experimentId: string;
    variantId: string;
    converted: boolean;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    userId: string;
    tenantId: string;
    experimentId: string;
    variantId: string;
    converted: boolean;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    userId: string;
    tenantId: string;
    experimentId: string;
    variantId: string;
    converted: boolean;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    userId: string;
    tenantId: string;
    experimentId: string;
    variantId: string;
    converted: boolean;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AudienceModel: mongoose.Model<{
    name: string;
    tags: string[];
    active: boolean;
    tenantId: string;
    criteria: mongoose.Types.DocumentArray<{
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
    logic: "AND" | "OR";
    description?: string | null | undefined;
    estimatedSize?: number | null | undefined;
    actualSize?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    tags: string[];
    active: boolean;
    tenantId: string;
    criteria: mongoose.Types.DocumentArray<{
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
    logic: "AND" | "OR";
    description?: string | null | undefined;
    estimatedSize?: number | null | undefined;
    actualSize?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    tags: string[];
    active: boolean;
    tenantId: string;
    criteria: mongoose.Types.DocumentArray<{
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
    logic: "AND" | "OR";
    description?: string | null | undefined;
    estimatedSize?: number | null | undefined;
    actualSize?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    tags: string[];
    active: boolean;
    tenantId: string;
    criteria: mongoose.Types.DocumentArray<{
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
    logic: "AND" | "OR";
    description?: string | null | undefined;
    estimatedSize?: number | null | undefined;
    actualSize?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    tags: string[];
    active: boolean;
    tenantId: string;
    criteria: mongoose.Types.DocumentArray<{
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
    logic: "AND" | "OR";
    description?: string | null | undefined;
    estimatedSize?: number | null | undefined;
    actualSize?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    tags: string[];
    active: boolean;
    tenantId: string;
    criteria: mongoose.Types.DocumentArray<{
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
    logic: "AND" | "OR";
    description?: string | null | undefined;
    estimatedSize?: number | null | undefined;
    actualSize?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ReportModel: mongoose.Model<{
    name: string;
    type: "audience" | "attribution" | "custom" | "experiment";
    tenantId: string;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    type: "audience" | "attribution" | "custom" | "experiment";
    tenantId: string;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    type: "audience" | "attribution" | "custom" | "experiment";
    tenantId: string;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    type: "audience" | "attribution" | "custom" | "experiment";
    tenantId: string;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    type: "audience" | "attribution" | "custom" | "experiment";
    tenantId: string;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    type: "audience" | "attribution" | "custom" | "experiment";
    tenantId: string;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class AnalyticsService {
    trackAttributionEvent(event: Omit<AttributionEvent, 'id'>): Promise<AttributionEvent>;
    trackConversion(conversion: Omit<Conversion, 'id'>): Promise<Conversion>;
    getAttribution(params: {
        tenantId: string;
        model: AttributionModel;
        startDate: Date;
        endDate: Date;
        userId?: string;
    }): Promise<{
        channel: string;
        conversions: number;
        revenue: number;
        attribution: number;
    }[]>;
    createExperiment(experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Experiment>;
    assignVariant(experimentId: string, userId: string): Promise<{
        variantId: string;
        config: Record<string, unknown>;
    }>;
    recordConversion(experimentId: string, userId: string, value?: number): Promise<void>;
    analyzeExperiment(experimentId: string): Promise<Experiment['results']>;
    createAudience(audience: Omit<Audience, 'id' | 'createdAt' | 'updatedAt'>): Promise<Audience>;
    listAudiences(tenantId: string): Promise<Audience[]>;
    createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report>;
    listReports(tenantId: string): Promise<Report[]>;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=attributionService.d.ts.map