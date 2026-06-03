import { z } from 'zod';
export declare enum SignalQuality {
    EXCELLENT = "excellent",
    GOOD = "good",
    FAIR = "fair",
    POOR = "poor",
    INVALID = "invalid"
}
export declare enum ValidationAction {
    ACCEPT = "accept",
    REJECT = "reject",
    FLAG = "flag",
    NORMALIZE = "normalize",
    MERGE = "merge",
    SPLIT = "split"
}
export declare const EventSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    deviceId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    type: z.ZodString;
    category: z.ZodString;
    timestamp: z.ZodString;
    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metrics: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    source: z.ZodOptional<z.ZodString>;
    channel: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
        city: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    }, {
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    category: string;
    id: string;
    tenantId: string;
    timestamp: string;
    metrics?: Record<string, number> | undefined;
    source?: string | undefined;
    channel?: string | undefined;
    userId?: string | undefined;
    sessionId?: string | undefined;
    location?: {
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    } | undefined;
    properties?: Record<string, any> | undefined;
    deviceId?: string | undefined;
}, {
    type: string;
    category: string;
    id: string;
    tenantId: string;
    timestamp: string;
    metrics?: Record<string, number> | undefined;
    source?: string | undefined;
    channel?: string | undefined;
    userId?: string | undefined;
    sessionId?: string | undefined;
    location?: {
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    } | undefined;
    properties?: Record<string, any> | undefined;
    deviceId?: string | undefined;
}>;
export type Event = z.infer<typeof EventSchema>;
export declare const ValidatedSignalSchema: z.ZodObject<z.ZodRawShape, "strip", z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export type ValidatedSignal = z.infer<typeof ValidatedSignalSchema>;
export declare const IdentitySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    primaryId: z.ZodString;
    identifiers: z.ZodObject<{
        email: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        phone: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deviceId: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        sessionId: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        externalId: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        sessionId?: string[] | undefined;
        email?: string[] | undefined;
        phone?: string[] | undefined;
        externalId?: Record<string, string[]> | undefined;
        deviceId?: string[] | undefined;
    }, {
        sessionId?: string[] | undefined;
        email?: string[] | undefined;
        phone?: string[] | undefined;
        externalId?: Record<string, string[]> | undefined;
        deviceId?: string[] | undefined;
    }>;
    resolution: z.ZodObject<{
        method: z.ZodEnum<["exact", "fuzzy", "probabilistic", "inferred"]>;
        confidence: z.ZodNumber;
        firstSeen: z.ZodDate;
        lastSeen: z.ZodDate;
        linkCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        method: "exact" | "fuzzy" | "probabilistic" | "inferred";
        confidence: number;
        firstSeen: Date;
        lastSeen: Date;
        linkCount: number;
    }, {
        method: "exact" | "fuzzy" | "probabilistic" | "inferred";
        confidence: number;
        firstSeen: Date;
        lastSeen: Date;
        linkCount: number;
    }>;
    graphLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        identityId: z.ZodString;
        relationship: z.ZodString;
        strength: z.ZodNumber;
        verified: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        verified: boolean;
        relationship: string;
        identityId: string;
        strength: number;
    }, {
        verified: boolean;
        relationship: string;
        identityId: string;
        strength: number;
    }>, "many">>;
    status: z.ZodEnum<["active", "merged", "archived", "flagged"]>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: "active" | "archived" | "merged" | "flagged";
    tenantId: string;
    primaryId: string;
    identifiers: {
        sessionId?: string[] | undefined;
        email?: string[] | undefined;
        phone?: string[] | undefined;
        externalId?: Record<string, string[]> | undefined;
        deviceId?: string[] | undefined;
    };
    resolution: {
        method: "exact" | "fuzzy" | "probabilistic" | "inferred";
        confidence: number;
        firstSeen: Date;
        lastSeen: Date;
        linkCount: number;
    };
    graphLinks?: {
        verified: boolean;
        relationship: string;
        identityId: string;
        strength: number;
    }[] | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: "active" | "archived" | "merged" | "flagged";
    tenantId: string;
    primaryId: string;
    identifiers: {
        sessionId?: string[] | undefined;
        email?: string[] | undefined;
        phone?: string[] | undefined;
        externalId?: Record<string, string[]> | undefined;
        deviceId?: string[] | undefined;
    };
    resolution: {
        method: "exact" | "fuzzy" | "probabilistic" | "inferred";
        confidence: number;
        firstSeen: Date;
        lastSeen: Date;
        linkCount: number;
    };
    graphLinks?: {
        verified: boolean;
        relationship: string;
        identityId: string;
        strength: number;
    }[] | undefined;
}>;
export type Identity = z.infer<typeof IdentitySchema>;
export declare const DeduplicationConfigSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    eventTypes: z.ZodArray<z.ZodString, "many">;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    strategy: z.ZodEnum<["exact", "fuzzy", "sliding_window", "probabilistic"]>;
    keys: z.ZodArray<z.ZodEnum<["userId", "type", "properties", "sessionId", "deviceId"]>, "many">;
    windowMs: z.ZodDefault<z.ZodNumber>;
    fuzzyConfig: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        threshold: z.ZodDefault<z.ZodNumber>;
        fieldsToCompare: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        threshold: number;
        fieldsToCompare: string[];
    }, {
        fieldsToCompare: string[];
        enabled?: boolean | undefined;
        threshold?: number | undefined;
    }>>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    keys: ("type" | "userId" | "sessionId" | "properties" | "deviceId")[];
    active: boolean;
    tenantId: string;
    strategy: "exact" | "fuzzy" | "probabilistic" | "sliding_window";
    eventTypes: string[];
    windowMs: number;
    categories?: string[] | undefined;
    fuzzyConfig?: {
        enabled: boolean;
        threshold: number;
        fieldsToCompare: string[];
    } | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    keys: ("type" | "userId" | "sessionId" | "properties" | "deviceId")[];
    tenantId: string;
    strategy: "exact" | "fuzzy" | "probabilistic" | "sliding_window";
    eventTypes: string[];
    active?: boolean | undefined;
    categories?: string[] | undefined;
    windowMs?: number | undefined;
    fuzzyConfig?: {
        fieldsToCompare: string[];
        enabled?: boolean | undefined;
        threshold?: number | undefined;
    } | undefined;
}>;
export type DeduplicationConfig = z.infer<typeof DeduplicationConfigSchema>;
export declare const AnomalySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    type: z.ZodEnum<["velocity_spike", "impossible_sequence", "duplicate_burst", "schema_drift", "data_poisoning", "timing_anomaly", "geographic_impossible", "device_anomaly"]>;
    severity: z.ZodEnum<["info", "low", "medium", "high", "critical"]>;
    description: z.ZodString;
    affectedEvents: z.ZodArray<z.ZodString, "many">;
    eventCount: z.ZodNumber;
    userId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    details: z.ZodRecord<z.ZodString, z.ZodAny>;
    expectedValue: z.ZodOptional<z.ZodAny>;
    actualValue: z.ZodOptional<z.ZodAny>;
    deviation: z.ZodOptional<z.ZodNumber>;
    status: z.ZodEnum<["detected", "investigating", "resolved", "false_positive", "blocked"]>;
    resolvedAt: z.ZodOptional<z.ZodDate>;
    resolution: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type: "velocity_spike" | "impossible_sequence" | "duplicate_burst" | "schema_drift" | "data_poisoning" | "timing_anomaly" | "geographic_impossible" | "device_anomaly";
    description: string;
    id: string;
    createdAt: Date;
    status: "blocked" | "resolved" | "detected" | "investigating" | "false_positive";
    tenantId: string;
    severity: "low" | "medium" | "high" | "info" | "critical";
    details: Record<string, any>;
    affectedEvents: string[];
    eventCount: number;
    userId?: string | undefined;
    sessionId?: string | undefined;
    resolvedAt?: Date | undefined;
    expectedValue?: any;
    resolution?: string | undefined;
    actualValue?: any;
    deviation?: number | undefined;
}, {
    type: "velocity_spike" | "impossible_sequence" | "duplicate_burst" | "schema_drift" | "data_poisoning" | "timing_anomaly" | "geographic_impossible" | "device_anomaly";
    description: string;
    id: string;
    createdAt: Date;
    status: "blocked" | "resolved" | "detected" | "investigating" | "false_positive";
    tenantId: string;
    severity: "low" | "medium" | "high" | "info" | "critical";
    details: Record<string, any>;
    affectedEvents: string[];
    eventCount: number;
    userId?: string | undefined;
    sessionId?: string | undefined;
    resolvedAt?: Date | undefined;
    expectedValue?: any;
    resolution?: string | undefined;
    actualValue?: any;
    deviation?: number | undefined;
}>;
export type Anomaly = z.infer<typeof AnomalySchema>;
export declare const QualityMetricsSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    timestamp: z.ZodDate;
    totalEvents: z.ZodNumber;
    validEvents: z.ZodNumber;
    invalidEvents: z.ZodNumber;
    flaggedEvents: z.ZodNumber;
    qualityDistribution: z.ZodObject<{
        excellent: z.ZodNumber;
        good: z.ZodNumber;
        fair: z.ZodNumber;
        poor: z.ZodNumber;
        invalid: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        excellent: number;
        good: number;
        poor: number;
        fair: number;
        invalid: number;
    }, {
        excellent: number;
        good: number;
        poor: number;
        fair: number;
        invalid: number;
    }>;
    issues: z.ZodObject<{
        duplicates: z.ZodNumber;
        malformed: z.ZodNumber;
        timing: z.ZodNumber;
        schema: z.ZodNumber;
        identity: z.ZodNumber;
        anomalies: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        identity: number;
        schema: number;
        timing: number;
        duplicates: number;
        malformed: number;
        anomalies: number;
    }, {
        identity: number;
        schema: number;
        timing: number;
        duplicates: number;
        malformed: number;
        anomalies: number;
    }>;
    avgProcessingMs: z.ZodNumber;
    p99ProcessingMs: z.ZodNumber;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    issues: {
        identity: number;
        schema: number;
        timing: number;
        duplicates: number;
        malformed: number;
        anomalies: number;
    };
    tenantId: string;
    timestamp: Date;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    flaggedEvents: number;
    qualityDistribution: {
        excellent: number;
        good: number;
        poor: number;
        fair: number;
        invalid: number;
    };
    avgProcessingMs: number;
    p99ProcessingMs: number;
}, {
    id: string;
    createdAt: Date;
    issues: {
        identity: number;
        schema: number;
        timing: number;
        duplicates: number;
        malformed: number;
        anomalies: number;
    };
    tenantId: string;
    timestamp: Date;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    flaggedEvents: number;
    qualityDistribution: {
        excellent: number;
        good: number;
        poor: number;
        fair: number;
        invalid: number;
    };
    avgProcessingMs: number;
    p99ProcessingMs: number;
}>;
export type QualityMetrics = z.infer<typeof QualityMetricsSchema>;
//# sourceMappingURL=index.d.ts.map