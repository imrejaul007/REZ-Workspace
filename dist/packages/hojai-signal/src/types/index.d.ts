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
        city?: string | undefined;
        country?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }, {
        city?: string | undefined;
        country?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    tenantId: string;
    category: string;
    timestamp: string;
    userId?: string | undefined;
    channel?: string | undefined;
    metrics?: Record<string, number> | undefined;
    location?: {
        city?: string | undefined;
        country?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    } | undefined;
    source?: string | undefined;
    sessionId?: string | undefined;
    properties?: Record<string, any> | undefined;
    deviceId?: string | undefined;
}, {
    id: string;
    type: string;
    tenantId: string;
    category: string;
    timestamp: string;
    userId?: string | undefined;
    channel?: string | undefined;
    metrics?: Record<string, number> | undefined;
    location?: {
        city?: string | undefined;
        country?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    } | undefined;
    source?: string | undefined;
    sessionId?: string | undefined;
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
        email?: string[] | undefined;
        phone?: string[] | undefined;
        sessionId?: string[] | undefined;
        externalId?: Record<string, string[]> | undefined;
        deviceId?: string[] | undefined;
    }, {
        email?: string[] | undefined;
        phone?: string[] | undefined;
        sessionId?: string[] | undefined;
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
        confidence: number;
        method: "exact" | "probabilistic" | "fuzzy" | "inferred";
        firstSeen: Date;
        lastSeen: Date;
        linkCount: number;
    }, {
        confidence: number;
        method: "exact" | "probabilistic" | "fuzzy" | "inferred";
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
        identityId: string;
        verified: boolean;
        relationship: string;
        strength: number;
    }, {
        identityId: string;
        verified: boolean;
        relationship: string;
        strength: number;
    }>, "many">>;
    status: z.ZodEnum<["active", "merged", "archived", "flagged"]>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "active" | "archived" | "merged" | "flagged";
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    identifiers: {
        email?: string[] | undefined;
        phone?: string[] | undefined;
        sessionId?: string[] | undefined;
        externalId?: Record<string, string[]> | undefined;
        deviceId?: string[] | undefined;
    };
    primaryId: string;
    resolution: {
        confidence: number;
        method: "exact" | "probabilistic" | "fuzzy" | "inferred";
        firstSeen: Date;
        lastSeen: Date;
        linkCount: number;
    };
    graphLinks?: {
        identityId: string;
        verified: boolean;
        relationship: string;
        strength: number;
    }[] | undefined;
}, {
    id: string;
    status: "active" | "archived" | "merged" | "flagged";
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    identifiers: {
        email?: string[] | undefined;
        phone?: string[] | undefined;
        sessionId?: string[] | undefined;
        externalId?: Record<string, string[]> | undefined;
        deviceId?: string[] | undefined;
    };
    primaryId: string;
    resolution: {
        confidence: number;
        method: "exact" | "probabilistic" | "fuzzy" | "inferred";
        firstSeen: Date;
        lastSeen: Date;
        linkCount: number;
    };
    graphLinks?: {
        identityId: string;
        verified: boolean;
        relationship: string;
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
    active: boolean;
    windowMs: number;
    keys: ("type" | "userId" | "sessionId" | "properties" | "deviceId")[];
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    eventTypes: string[];
    strategy: "exact" | "probabilistic" | "fuzzy" | "sliding_window";
    categories?: string[] | undefined;
    fuzzyConfig?: {
        enabled: boolean;
        threshold: number;
        fieldsToCompare: string[];
    } | undefined;
}, {
    id: string;
    keys: ("type" | "userId" | "sessionId" | "properties" | "deviceId")[];
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    eventTypes: string[];
    strategy: "exact" | "probabilistic" | "fuzzy" | "sliding_window";
    active?: boolean | undefined;
    windowMs?: number | undefined;
    categories?: string[] | undefined;
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
    id: string;
    status: "blocked" | "resolved" | "detected" | "investigating" | "false_positive";
    type: "velocity_spike" | "impossible_sequence" | "duplicate_burst" | "schema_drift" | "data_poisoning" | "timing_anomaly" | "geographic_impossible" | "device_anomaly";
    details: Record<string, any>;
    description: string;
    tenantId: string;
    createdAt: Date;
    severity: "info" | "critical" | "low" | "high" | "medium";
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
    id: string;
    status: "blocked" | "resolved" | "detected" | "investigating" | "false_positive";
    type: "velocity_spike" | "impossible_sequence" | "duplicate_burst" | "schema_drift" | "data_poisoning" | "timing_anomaly" | "geographic_impossible" | "device_anomaly";
    details: Record<string, any>;
    description: string;
    tenantId: string;
    createdAt: Date;
    severity: "info" | "critical" | "low" | "high" | "medium";
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
    tenantId: string;
    timestamp: Date;
    issues: {
        identity: number;
        schema: number;
        timing: number;
        duplicates: number;
        malformed: number;
        anomalies: number;
    };
    createdAt: Date;
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
    tenantId: string;
    timestamp: Date;
    issues: {
        identity: number;
        schema: number;
        timing: number;
        duplicates: number;
        malformed: number;
        anomalies: number;
    };
    createdAt: Date;
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