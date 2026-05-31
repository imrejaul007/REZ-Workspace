"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityMetricsSchema = exports.AnomalySchema = exports.DeduplicationConfigSchema = exports.IdentitySchema = exports.ValidatedSignalSchema = exports.EventSchema = exports.ValidationAction = exports.SignalQuality = void 0;
const zod_1 = require("zod");
// ============================================================================
// SIGNAL VALIDATION TYPES
// ============================================================================
var SignalQuality;
(function (SignalQuality) {
    SignalQuality["EXCELLENT"] = "excellent";
    SignalQuality["GOOD"] = "good";
    SignalQuality["FAIR"] = "fair";
    SignalQuality["POOR"] = "poor";
    SignalQuality["INVALID"] = "invalid";
})(SignalQuality || (exports.SignalQuality = SignalQuality = {}));
var ValidationAction;
(function (ValidationAction) {
    ValidationAction["ACCEPT"] = "accept";
    ValidationAction["REJECT"] = "reject";
    ValidationAction["FLAG"] = "flag";
    ValidationAction["NORMALIZE"] = "normalize";
    ValidationAction["MERGE"] = "merge";
    ValidationAction["SPLIT"] = "split";
})(ValidationAction || (exports.ValidationAction = ValidationAction = {}));
exports.EventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tenantId: zod_1.z.string(),
    userId: zod_1.z.string().optional(),
    deviceId: zod_1.z.string().optional(),
    sessionId: zod_1.z.string().optional(),
    // Core
    type: zod_1.z.string(),
    category: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    // Data
    properties: zod_1.z.record(zod_1.z.any()).optional(),
    metrics: zod_1.z.record(zod_1.z.number()).optional(),
    // Context
    source: zod_1.z.string().optional(),
    channel: zod_1.z.string().optional(),
    location: zod_1.z.object({
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        city: zod_1.z.string().optional(),
        country: zod_1.z.string().optional()
    }).optional()
});
exports.ValidatedSignalSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    originalEventId: zod_1.z.string(),
    tenantId: zod_1.z.string().uuid(),
    // Validation result
    quality: zod_1.z.nativeEnum(SignalQuality),
    confidence: zod_1.z.number().min(0).max(1),
    validationActions: zod_1.z.array(zod_1.z.nativeEnum(ValidationAction)),
    issues: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        severity: zod_1.z.enum(['low', 'medium', 'high']),
        message: zod_1.z.string(),
        field: zod_1.z.string().optional(),
        corrected: zod_1.z.any().optional()
    })).optional(),
    // Normalized data
    normalizedEvent: Event,
    canonicalTimestamp: zod_1.z.date(),
    canonicalUserId: zod_1.z.string().optional(),
    // Identity resolution
    resolvedIdentity: zod_1.z.object({
        primaryId: zod_1.z.string(),
        linkedIds: zod_1.z.array(zod_1.z.string()).optional(),
        confidence: zod_1.z.number()
    }).optional(),
    // Deduplication
    isDuplicate: zod_1.z.boolean().default(false),
    duplicateOf: zod_1.z.string().uuid().optional(),
    // Metadata
    processedAt: zod_1.z.date(),
    processingDurationMs: zod_1.z.number(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// IDENTITY RESOLUTION TYPES
// ============================================================================
exports.IdentitySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Primary identity
    primaryId: zod_1.z.string(),
    // Linked identifiers
    identifiers: zod_1.z.object({
        email: zod_1.z.array(zod_1.z.string()).optional(),
        phone: zod_1.z.array(zod_1.z.string()).optional(),
        deviceId: zod_1.z.array(zod_1.z.string()).optional(),
        sessionId: zod_1.z.array(zod_1.z.string()).optional(),
        externalId: zod_1.z.record(zod_1.z.array(zod_1.z.string())).optional()
    }),
    // Resolution metadata
    resolution: zod_1.z.object({
        method: zod_1.z.enum(['exact', 'fuzzy', 'probabilistic', 'inferred']),
        confidence: zod_1.z.number(),
        firstSeen: zod_1.z.date(),
        lastSeen: zod_1.z.date(),
        linkCount: zod_1.z.number()
    }),
    // Graph connections
    graphLinks: zod_1.z.array(zod_1.z.object({
        identityId: zod_1.z.string().uuid(),
        relationship: zod_1.z.string(),
        strength: zod_1.z.number(),
        verified: zod_1.z.boolean()
    })).optional(),
    // Status
    status: zod_1.z.enum(['active', 'merged', 'archived', 'flagged']),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// DEDUPLICATION TYPES
// ============================================================================
exports.DeduplicationConfigSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Event types to dedupe
    eventTypes: zod_1.z.array(zod_1.z.string()),
    categories: zod_1.z.array(zod_1.z.string()).optional(),
    // Deduplication strategy
    strategy: zod_1.z.enum(['exact', 'fuzzy', 'sliding_window', 'probabilistic']),
    // Keys to consider
    keys: zod_1.z.array(zod_1.z.enum(['userId', 'type', 'properties', 'sessionId', 'deviceId'])),
    // Time window (in ms)
    windowMs: zod_1.z.number().default(5000),
    // Fuzzy matching config
    fuzzyConfig: zod_1.z.object({
        enabled: zod_1.z.boolean().default(false),
        threshold: zod_1.z.number().min(0).max(1).default(0.8),
        fieldsToCompare: zod_1.z.array(zod_1.z.string())
    }).optional(),
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// ANOMALY DETECTION TYPES
// ============================================================================
exports.AnomalySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    type: zod_1.z.enum([
        'velocity_spike',
        'impossible_sequence',
        'duplicate_burst',
        'schema_drift',
        'data_poisoning',
        'timing_anomaly',
        'geographic_impossible',
        'device_anomaly'
    ]),
    severity: zod_1.z.enum(['info', 'low', 'medium', 'high', 'critical']),
    // Detection
    description: zod_1.z.string(),
    affectedEvents: zod_1.z.array(zod_1.z.string()),
    eventCount: zod_1.z.number(),
    userId: zod_1.z.string().optional(),
    sessionId: zod_1.z.string().optional(),
    // Details
    details: zod_1.z.record(zod_1.z.any()),
    expectedValue: zod_1.z.any().optional(),
    actualValue: zod_1.z.any().optional(),
    deviation: zod_1.z.number().optional(),
    // Status
    status: zod_1.z.enum(['detected', 'investigating', 'resolved', 'false_positive', 'blocked']),
    resolvedAt: zod_1.z.date().optional(),
    resolution: zod_1.z.string().optional(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// QUALITY METRICS
// ============================================================================
exports.QualityMetricsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    timestamp: zod_1.z.date(),
    // Volume metrics
    totalEvents: zod_1.z.number(),
    validEvents: zod_1.z.number(),
    invalidEvents: zod_1.z.number(),
    flaggedEvents: zod_1.z.number(),
    // Quality distribution
    qualityDistribution: zod_1.z.object({
        excellent: zod_1.z.number(),
        good: zod_1.z.number(),
        fair: zod_1.z.number(),
        poor: zod_1.z.number(),
        invalid: zod_1.z.number()
    }),
    // Issue breakdown
    issues: zod_1.z.object({
        duplicates: zod_1.z.number(),
        malformed: zod_1.z.number(),
        timing: zod_1.z.number(),
        schema: zod_1.z.number(),
        identity: zod_1.z.number(),
        anomalies: zod_1.z.number()
    }),
    // Latency
    avgProcessingMs: zod_1.z.number(),
    p99ProcessingMs: zod_1.z.number(),
    createdAt: zod_1.z.date()
});
