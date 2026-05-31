import mongoose from 'mongoose';
import { Event, ValidatedSignal, Identity } from '../types/index.js';
export declare const ValidatedSignalModel: mongoose.Model<{
    tenantId: string;
    issues: string[];
    validationActions: string[];
    confidence?: number | null | undefined;
    processedAt?: NativeDate | null | undefined;
    quality?: string | null | undefined;
    originalEventId?: string | null | undefined;
    normalizedEvent?: any;
    canonicalTimestamp?: NativeDate | null | undefined;
    canonicalUserId?: string | null | undefined;
    resolvedIdentity?: {
        linkedIds: string[];
        confidence?: number | null | undefined;
        primaryId?: string | null | undefined;
    } | null | undefined;
    isDuplicate?: boolean | null | undefined;
    duplicateOf?: string | null | undefined;
    processingDurationMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    issues: string[];
    validationActions: string[];
    confidence?: number | null | undefined;
    processedAt?: NativeDate | null | undefined;
    quality?: string | null | undefined;
    originalEventId?: string | null | undefined;
    normalizedEvent?: any;
    canonicalTimestamp?: NativeDate | null | undefined;
    canonicalUserId?: string | null | undefined;
    resolvedIdentity?: {
        linkedIds: string[];
        confidence?: number | null | undefined;
        primaryId?: string | null | undefined;
    } | null | undefined;
    isDuplicate?: boolean | null | undefined;
    duplicateOf?: string | null | undefined;
    processingDurationMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    tenantId: string;
    issues: string[];
    validationActions: string[];
    confidence?: number | null | undefined;
    processedAt?: NativeDate | null | undefined;
    quality?: string | null | undefined;
    originalEventId?: string | null | undefined;
    normalizedEvent?: any;
    canonicalTimestamp?: NativeDate | null | undefined;
    canonicalUserId?: string | null | undefined;
    resolvedIdentity?: {
        linkedIds: string[];
        confidence?: number | null | undefined;
        primaryId?: string | null | undefined;
    } | null | undefined;
    isDuplicate?: boolean | null | undefined;
    duplicateOf?: string | null | undefined;
    processingDurationMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    tenantId: string;
    issues: string[];
    validationActions: string[];
    confidence?: number | null | undefined;
    processedAt?: NativeDate | null | undefined;
    quality?: string | null | undefined;
    originalEventId?: string | null | undefined;
    normalizedEvent?: any;
    canonicalTimestamp?: NativeDate | null | undefined;
    canonicalUserId?: string | null | undefined;
    resolvedIdentity?: {
        linkedIds: string[];
        confidence?: number | null | undefined;
        primaryId?: string | null | undefined;
    } | null | undefined;
    isDuplicate?: boolean | null | undefined;
    duplicateOf?: string | null | undefined;
    processingDurationMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    issues: string[];
    validationActions: string[];
    confidence?: number | null | undefined;
    processedAt?: NativeDate | null | undefined;
    quality?: string | null | undefined;
    originalEventId?: string | null | undefined;
    normalizedEvent?: any;
    canonicalTimestamp?: NativeDate | null | undefined;
    canonicalUserId?: string | null | undefined;
    resolvedIdentity?: {
        linkedIds: string[];
        confidence?: number | null | undefined;
        primaryId?: string | null | undefined;
    } | null | undefined;
    isDuplicate?: boolean | null | undefined;
    duplicateOf?: string | null | undefined;
    processingDurationMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    tenantId: string;
    issues: string[];
    validationActions: string[];
    confidence?: number | null | undefined;
    processedAt?: NativeDate | null | undefined;
    quality?: string | null | undefined;
    originalEventId?: string | null | undefined;
    normalizedEvent?: any;
    canonicalTimestamp?: NativeDate | null | undefined;
    canonicalUserId?: string | null | undefined;
    resolvedIdentity?: {
        linkedIds: string[];
        confidence?: number | null | undefined;
        primaryId?: string | null | undefined;
    } | null | undefined;
    isDuplicate?: boolean | null | undefined;
    duplicateOf?: string | null | undefined;
    processingDurationMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const IdentityModel: mongoose.Model<{
    status: "active" | "merged" | "flagged" | "archived";
    tenantId: string;
    primaryId: string;
    graphLinks: mongoose.Types.DocumentArray<{
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }> & {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }>;
    identifiers?: {
        email: string[];
        phone: string[];
        sessionId: string[];
        deviceId: string[];
    } | null | undefined;
    resolution?: {
        method?: string | null | undefined;
        confidence?: number | null | undefined;
        firstSeen?: NativeDate | null | undefined;
        lastSeen?: NativeDate | null | undefined;
        linkCount?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: "active" | "merged" | "flagged" | "archived";
    tenantId: string;
    primaryId: string;
    graphLinks: mongoose.Types.DocumentArray<{
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }> & {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }>;
    identifiers?: {
        email: string[];
        phone: string[];
        sessionId: string[];
        deviceId: string[];
    } | null | undefined;
    resolution?: {
        method?: string | null | undefined;
        confidence?: number | null | undefined;
        firstSeen?: NativeDate | null | undefined;
        lastSeen?: NativeDate | null | undefined;
        linkCount?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "active" | "merged" | "flagged" | "archived";
    tenantId: string;
    primaryId: string;
    graphLinks: mongoose.Types.DocumentArray<{
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }> & {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }>;
    identifiers?: {
        email: string[];
        phone: string[];
        sessionId: string[];
        deviceId: string[];
    } | null | undefined;
    resolution?: {
        method?: string | null | undefined;
        confidence?: number | null | undefined;
        firstSeen?: NativeDate | null | undefined;
        lastSeen?: NativeDate | null | undefined;
        linkCount?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "active" | "merged" | "flagged" | "archived";
    tenantId: string;
    primaryId: string;
    graphLinks: mongoose.Types.DocumentArray<{
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }> & {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }>;
    identifiers?: {
        email: string[];
        phone: string[];
        sessionId: string[];
        deviceId: string[];
    } | null | undefined;
    resolution?: {
        method?: string | null | undefined;
        confidence?: number | null | undefined;
        firstSeen?: NativeDate | null | undefined;
        lastSeen?: NativeDate | null | undefined;
        linkCount?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "active" | "merged" | "flagged" | "archived";
    tenantId: string;
    primaryId: string;
    graphLinks: mongoose.Types.DocumentArray<{
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }> & {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }>;
    identifiers?: {
        email: string[];
        phone: string[];
        sessionId: string[];
        deviceId: string[];
    } | null | undefined;
    resolution?: {
        method?: string | null | undefined;
        confidence?: number | null | undefined;
        firstSeen?: NativeDate | null | undefined;
        lastSeen?: NativeDate | null | undefined;
        linkCount?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "active" | "merged" | "flagged" | "archived";
    tenantId: string;
    primaryId: string;
    graphLinks: mongoose.Types.DocumentArray<{
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }> & {
        identityId?: string | null | undefined;
        verified?: boolean | null | undefined;
        relationship?: string | null | undefined;
        strength?: number | null | undefined;
    }>;
    identifiers?: {
        email: string[];
        phone: string[];
        sessionId: string[];
        deviceId: string[];
    } | null | undefined;
    resolution?: {
        method?: string | null | undefined;
        confidence?: number | null | undefined;
        firstSeen?: NativeDate | null | undefined;
        lastSeen?: NativeDate | null | undefined;
        linkCount?: number | null | undefined;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AnomalyModel: mongoose.Model<{
    status: "blocked" | "resolved" | "detected" | "investigating" | "false_positive";
    tenantId: string;
    affectedEvents: string[];
    details?: any;
    type?: string | null | undefined;
    userId?: string | null | undefined;
    sessionId?: string | null | undefined;
    description?: string | null | undefined;
    severity?: string | null | undefined;
    resolvedAt?: NativeDate | null | undefined;
    expectedValue?: any;
    resolution?: string | null | undefined;
    eventCount?: number | null | undefined;
    actualValue?: any;
    deviation?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: "blocked" | "resolved" | "detected" | "investigating" | "false_positive";
    tenantId: string;
    affectedEvents: string[];
    details?: any;
    type?: string | null | undefined;
    userId?: string | null | undefined;
    sessionId?: string | null | undefined;
    description?: string | null | undefined;
    severity?: string | null | undefined;
    resolvedAt?: NativeDate | null | undefined;
    expectedValue?: any;
    resolution?: string | null | undefined;
    eventCount?: number | null | undefined;
    actualValue?: any;
    deviation?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "blocked" | "resolved" | "detected" | "investigating" | "false_positive";
    tenantId: string;
    affectedEvents: string[];
    details?: any;
    type?: string | null | undefined;
    userId?: string | null | undefined;
    sessionId?: string | null | undefined;
    description?: string | null | undefined;
    severity?: string | null | undefined;
    resolvedAt?: NativeDate | null | undefined;
    expectedValue?: any;
    resolution?: string | null | undefined;
    eventCount?: number | null | undefined;
    actualValue?: any;
    deviation?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "blocked" | "resolved" | "detected" | "investigating" | "false_positive";
    tenantId: string;
    affectedEvents: string[];
    details?: any;
    type?: string | null | undefined;
    userId?: string | null | undefined;
    sessionId?: string | null | undefined;
    description?: string | null | undefined;
    severity?: string | null | undefined;
    resolvedAt?: NativeDate | null | undefined;
    expectedValue?: any;
    resolution?: string | null | undefined;
    eventCount?: number | null | undefined;
    actualValue?: any;
    deviation?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "blocked" | "resolved" | "detected" | "investigating" | "false_positive";
    tenantId: string;
    affectedEvents: string[];
    details?: any;
    type?: string | null | undefined;
    userId?: string | null | undefined;
    sessionId?: string | null | undefined;
    description?: string | null | undefined;
    severity?: string | null | undefined;
    resolvedAt?: NativeDate | null | undefined;
    expectedValue?: any;
    resolution?: string | null | undefined;
    eventCount?: number | null | undefined;
    actualValue?: any;
    deviation?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "blocked" | "resolved" | "detected" | "investigating" | "false_positive";
    tenantId: string;
    affectedEvents: string[];
    details?: any;
    type?: string | null | undefined;
    userId?: string | null | undefined;
    sessionId?: string | null | undefined;
    description?: string | null | undefined;
    severity?: string | null | undefined;
    resolvedAt?: NativeDate | null | undefined;
    expectedValue?: any;
    resolution?: string | null | undefined;
    eventCount?: number | null | undefined;
    actualValue?: any;
    deviation?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class SignalService {
    private redis;
    private readonly DEDUP_PREFIX;
    private readonly IDENTITY_PREFIX;
    constructor();
    /**
     * Validate and process incoming event
     */
    processEvent(tenantId: string, event: Event): Promise<ValidatedSignal>;
    /**
     * Validate event schema
     */
    private validateSchema;
    /**
     * Normalize timestamp to canonical format
     */
    private normalizeTimestamp;
    /**
     * Check for duplicate events
     */
    private checkDuplicate;
    /**
     * Resolve identity from multiple identifiers
     */
    resolveIdentity(tenantId: string, event: Event): Promise<Identity['resolvedIdentity'] | undefined>;
    /**
     * Detect anomalies in event stream
     */
    private detectAnomalies;
    /**
     * Normalize event to canonical format
     */
    private normalizeEvent;
    /**
     * Calculate quality score
     */
    private calculateQuality;
    /**
     * Calculate confidence score
     */
    private calculateConfidence;
    /**
     * Create validated signal document
     */
    private createValidatedSignal;
    /**
     * Get quality metrics for tenant
     */
    getQualityMetrics(tenantId: string, period?: 'hour' | 'day' | 'week'): Promise<any>;
    private getDuplicateRate;
    private getAvgProcessingTime;
}
export declare const signalService: SignalService;
//# sourceMappingURL=signalService.d.ts.map