import mongoose from 'mongoose';
import { AttributionEvent, Conversion, Experiment, Audience, Report, AttributionModel, ExperimentStatus } from '../types/index.js';
export declare const AttributionEventModel: mongoose.Model<{
    type: "conversion" | "click" | "impression";
    tenantId: string;
    userId: string;
    timestamp: NativeDate;
    channel: string;
    keyword?: string | null | undefined;
    value?: number | null | undefined;
    content?: string | null | undefined;
    medium?: string | null | undefined;
    location?: string | null | undefined;
    source?: string | null | undefined;
    campaign?: string | null | undefined;
    sessionId?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    type: "conversion" | "click" | "impression";
    tenantId: string;
    userId: string;
    timestamp: NativeDate;
    channel: string;
    keyword?: string | null | undefined;
    value?: number | null | undefined;
    content?: string | null | undefined;
    medium?: string | null | undefined;
    location?: string | null | undefined;
    source?: string | null | undefined;
    campaign?: string | null | undefined;
    sessionId?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    type: "conversion" | "click" | "impression";
    tenantId: string;
    userId: string;
    timestamp: NativeDate;
    channel: string;
    keyword?: string | null | undefined;
    value?: number | null | undefined;
    content?: string | null | undefined;
    medium?: string | null | undefined;
    location?: string | null | undefined;
    source?: string | null | undefined;
    campaign?: string | null | undefined;
    sessionId?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "conversion" | "click" | "impression";
    tenantId: string;
    userId: string;
    timestamp: NativeDate;
    channel: string;
    keyword?: string | null | undefined;
    value?: number | null | undefined;
    content?: string | null | undefined;
    medium?: string | null | undefined;
    location?: string | null | undefined;
    source?: string | null | undefined;
    campaign?: string | null | undefined;
    sessionId?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: "conversion" | "click" | "impression";
    tenantId: string;
    userId: string;
    timestamp: NativeDate;
    channel: string;
    keyword?: string | null | undefined;
    value?: number | null | undefined;
    content?: string | null | undefined;
    medium?: string | null | undefined;
    location?: string | null | undefined;
    source?: string | null | undefined;
    campaign?: string | null | undefined;
    sessionId?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    type: "conversion" | "click" | "impression";
    tenantId: string;
    userId: string;
    timestamp: NativeDate;
    channel: string;
    keyword?: string | null | undefined;
    value?: number | null | undefined;
    content?: string | null | undefined;
    medium?: string | null | undefined;
    location?: string | null | undefined;
    source?: string | null | undefined;
    campaign?: string | null | undefined;
    sessionId?: string | null | undefined;
    conversionId?: string | null | undefined;
    device?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ConversionModel: mongoose.Model<{
    tenantId: string;
    userId: string;
    currency: string;
    value: number;
    timestamp: NativeDate;
    conversionType: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    userId: string;
    currency: string;
    value: number;
    timestamp: NativeDate;
    conversionType: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    tenantId: string;
    userId: string;
    currency: string;
    value: number;
    timestamp: NativeDate;
    conversionType: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    tenantId: string;
    userId: string;
    currency: string;
    value: number;
    timestamp: NativeDate;
    conversionType: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    userId: string;
    currency: string;
    value: number;
    timestamp: NativeDate;
    conversionType: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    tenantId: string;
    userId: string;
    currency: string;
    value: number;
    timestamp: NativeDate;
    conversionType: string;
    metadata?: Map<string, any> | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ExperimentModel: mongoose.Model<{
    status: ExperimentStatus;
    name: string;
    tenantId: string;
    variants: mongoose.Types.DocumentArray<{
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    hypothesis: string;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
    targeting?: {
        channels: string[];
        userSegments: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: ExperimentStatus;
    name: string;
    tenantId: string;
    variants: mongoose.Types.DocumentArray<{
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    hypothesis: string;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
    targeting?: {
        channels: string[];
        userSegments: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: ExperimentStatus;
    name: string;
    tenantId: string;
    variants: mongoose.Types.DocumentArray<{
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    hypothesis: string;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
    targeting?: {
        channels: string[];
        userSegments: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: ExperimentStatus;
    name: string;
    tenantId: string;
    variants: mongoose.Types.DocumentArray<{
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    hypothesis: string;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
    targeting?: {
        channels: string[];
        userSegments: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: ExperimentStatus;
    name: string;
    tenantId: string;
    variants: mongoose.Types.DocumentArray<{
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    hypothesis: string;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
    targeting?: {
        channels: string[];
        userSegments: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: ExperimentStatus;
    name: string;
    tenantId: string;
    variants: mongoose.Types.DocumentArray<{
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }> & {
        id?: string | null | undefined;
        name?: string | null | undefined;
        description?: string | null | undefined;
        config?: Map<string, any> | null | undefined;
        traffic?: number | null | undefined;
    }>;
    hypothesis: string;
    secondaryMetrics: string[];
    description?: string | null | undefined;
    startDate?: NativeDate | null | undefined;
    endDate?: NativeDate | null | undefined;
    targeting?: {
        channels: string[];
        userSegments: string[];
        minSampleSize?: number | null | undefined;
    } | null | undefined;
    primaryMetric?: string | null | undefined;
    results?: {
        confidence?: number | null | undefined;
        winner?: string | null | undefined;
        pValue?: number | null | undefined;
        variantStats?: Map<string, any> | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ExperimentVariantModel: mongoose.Model<{
    tenantId: string;
    userId: string;
    converted: boolean;
    experimentId: string;
    variantId: string;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    userId: string;
    converted: boolean;
    experimentId: string;
    variantId: string;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    tenantId: string;
    userId: string;
    converted: boolean;
    experimentId: string;
    variantId: string;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    tenantId: string;
    userId: string;
    converted: boolean;
    experimentId: string;
    variantId: string;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    userId: string;
    converted: boolean;
    experimentId: string;
    variantId: string;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    tenantId: string;
    userId: string;
    converted: boolean;
    experimentId: string;
    variantId: string;
    metadata?: Map<string, any> | null | undefined;
    conversionValue?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AudienceModel: mongoose.Model<{
    active: boolean;
    name: string;
    tenantId: string;
    tags: string[];
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
    active: boolean;
    name: string;
    tenantId: string;
    tags: string[];
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
    active: boolean;
    name: string;
    tenantId: string;
    tags: string[];
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
    active: boolean;
    name: string;
    tenantId: string;
    tags: string[];
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
    active: boolean;
    name: string;
    tenantId: string;
    tags: string[];
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
    active: boolean;
    name: string;
    tenantId: string;
    tags: string[];
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
    type: "custom" | "attribution" | "experiment" | "audience";
    name: string;
    tenantId: string;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    type: "custom" | "attribution" | "experiment" | "audience";
    name: string;
    tenantId: string;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    type: "custom" | "attribution" | "experiment" | "audience";
    name: string;
    tenantId: string;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "custom" | "attribution" | "experiment" | "audience";
    name: string;
    tenantId: string;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: "custom" | "attribution" | "experiment" | "audience";
    name: string;
    tenantId: string;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
    lastRunAt?: NativeDate | null | undefined;
    createdBy?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    type: "custom" | "attribution" | "experiment" | "audience";
    name: string;
    tenantId: string;
    schedule?: {
        enabled: boolean;
        recipients: string[];
        frequency?: string | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: Map<string, any> | null | undefined;
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