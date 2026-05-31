/**
 * HOJAI Training Pipeline - Type Definitions
 * Learn from: Chat conversations, User actions, Corrections, Feedback loops
 */
import { z } from 'zod';
export declare enum LearningSource {
    CHAT = "chat",
    SIGNAL = "signal",
    EVENT = "event",
    CONVERSION = "conversion",
    CORRECTION = "correction",
    FEEDBACK = "feedback"
}
export declare enum LearningType {
    RESPONSE_PATTERN = "response_pattern",
    INTENT = "intent",
    CONTEXT = "context",
    PREFERENCE = "preference",
    INTEREST = "interest",
    NEED = "need",
    SUCCESS = "success",
    FAILURE = "failure",
    TOPIC = "topic",
    QUALITY = "quality"
}
export declare enum LearningStage {
    SHORT_TERM = "short_term",
    LONG_TERM = "long_term",
    MODEL = "model"
}
export declare enum LearningStatus {
    CAPTURED = "captured",
    PROCESSING = "processing",
    LEARNED = "learned",
    DEPLOYED = "deployed",
    ARCHIVED = "archived"
}
export declare const ChatMessageSchema: z.ZodObject<{
    messageId: z.ZodString;
    conversationId: z.ZodString;
    role: z.ZodEnum<["user", "assistant", "system"]>;
    content: z.ZodString;
    timestamp: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    messageId: string;
    conversationId: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown> | undefined;
}, {
    messageId: string;
    conversationId: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const SignalEventSchema: z.ZodObject<{
    signalId: z.ZodString;
    type: z.ZodEnum<["click", "view", "search", "action", "conversion", "error"]>;
    tenantId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    entityType: z.ZodOptional<z.ZodString>;
    entityId: z.ZodOptional<z.ZodString>;
    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "conversion" | "click" | "view" | "search" | "action" | "error";
    timestamp: string;
    signalId: string;
    tenantId?: string | undefined;
    userId?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    properties?: Record<string, unknown> | undefined;
}, {
    type: "conversion" | "click" | "view" | "search" | "action" | "error";
    timestamp: string;
    signalId: string;
    tenantId?: string | undefined;
    userId?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    properties?: Record<string, unknown> | undefined;
}>;
export declare const CorrectionSchema: z.ZodObject<{
    correctionId: z.ZodString;
    originalContent: z.ZodString;
    correctedContent: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    correctionId: string;
    originalContent: string;
    correctedContent: string;
    context?: Record<string, unknown> | undefined;
    userId?: string | undefined;
    reason?: string | undefined;
}, {
    timestamp: string;
    correctionId: string;
    originalContent: string;
    correctedContent: string;
    context?: Record<string, unknown> | undefined;
    userId?: string | undefined;
    reason?: string | undefined;
}>;
export declare const FeedbackSchema: z.ZodObject<{
    feedbackId: z.ZodString;
    type: z.ZodEnum<["positive", "negative", "rating", "correction"]>;
    score: z.ZodOptional<z.ZodNumber>;
    content: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    itemType: z.ZodOptional<z.ZodString>;
    itemId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "correction" | "positive" | "negative" | "rating";
    timestamp: string;
    feedbackId: string;
    content?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    userId?: string | undefined;
    score?: number | undefined;
    itemType?: string | undefined;
    itemId?: string | undefined;
}, {
    type: "correction" | "positive" | "negative" | "rating";
    timestamp: string;
    feedbackId: string;
    content?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    userId?: string | undefined;
    score?: number | undefined;
    itemType?: string | undefined;
    itemId?: string | undefined;
}>;
export declare const LearningPayloadSchema: z.ZodObject<{
    source: z.ZodNativeEnum<typeof LearningSource>;
    sourceId: z.ZodString;
    type: z.ZodNativeEnum<typeof LearningType>;
    content: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    confidence: z.ZodDefault<z.ZodNumber>;
    tenantId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: LearningType;
    content: Record<string, unknown>;
    source: LearningSource;
    sourceId: string;
    confidence: number;
    timestamp?: string | undefined;
    tenantId?: string | undefined;
    userId?: string | undefined;
    sessionId?: string | undefined;
}, {
    type: LearningType;
    content: Record<string, unknown>;
    source: LearningSource;
    sourceId: string;
    timestamp?: string | undefined;
    tenantId?: string | undefined;
    userId?: string | undefined;
    confidence?: number | undefined;
    sessionId?: string | undefined;
}>;
export declare const QueryLearningSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof LearningType>>;
    source: z.ZodOptional<z.ZodNativeEnum<typeof LearningSource>>;
    stage: z.ZodOptional<z.ZodNativeEnum<typeof LearningStage>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof LearningStatus>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: LearningStatus | undefined;
    type?: LearningType | undefined;
    tenantId?: string | undefined;
    userId?: string | undefined;
    source?: LearningSource | undefined;
    stage?: LearningStage | undefined;
}, {
    status?: LearningStatus | undefined;
    type?: LearningType | undefined;
    tenantId?: string | undefined;
    userId?: string | undefined;
    source?: LearningSource | undefined;
    stage?: LearningStage | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export interface ChatMessage {
    messageId: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    tenantId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
}
export interface SignalEvent {
    signalId: string;
    type: 'click' | 'view' | 'search' | 'action' | 'conversion' | 'error';
    tenantId?: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    properties?: Record<string, unknown>;
    timestamp: string;
}
export interface Correction {
    correctionId: string;
    originalContent: string;
    correctedContent: string;
    reason?: string;
    tenantId?: string;
    userId?: string;
    timestamp: string;
    context?: Record<string, unknown>;
}
export interface Feedback {
    feedbackId: string;
    type: 'positive' | 'negative' | 'rating' | 'correction';
    score?: number;
    content?: string;
    tenantId?: string;
    userId?: string;
    itemType?: string;
    itemId?: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
export interface LearningPayload {
    source: LearningSource;
    sourceId: string;
    type: LearningType;
    content: Record<string, unknown>;
    confidence: number;
    tenantId?: string;
    userId?: string;
    sessionId?: string;
    timestamp?: string;
}
export interface LearnedPattern {
    id: string;
    tenantId?: string;
    userId?: string;
    source: LearningSource;
    type: LearningType;
    stage: LearningStage;
    status: LearningStatus;
    content: Record<string, unknown>;
    confidence: number;
    frequency: number;
    lastUpdated: string;
    createdAt: string;
    expiresAt?: string;
    metadata?: Record<string, unknown>;
}
export interface QueryLearning {
    tenantId?: string;
    userId?: string;
    type?: LearningType;
    source?: LearningSource;
    stage?: LearningStage;
    status?: LearningStatus;
    limit?: number;
    offset?: number;
}
export interface TrainingBatch {
    batchId: string;
    patterns: LearnedPattern[];
    startTime: string;
    endTime: string;
    statistics: BatchStatistics;
}
export interface BatchStatistics {
    totalPatterns: number;
    byType: Partial<Record<LearningType, number>>;
    bySource: Partial<Record<LearningSource, number>>;
    highConfidenceCount: number;
    archivedCount: number;
}
export interface LearningInsights {
    totalPatterns: number;
    byType: Record<LearningType, number>;
    bySource: Record<LearningSource, number>;
    topPatterns: LearnedPattern[];
    recentLearning: LearnedPattern[];
    accuracy: number;
    improvementRate: number;
}
export interface LearningResponse {
    patternId: string;
    status: LearningStatus;
    message: string;
}
export interface BatchResponse {
    batchId: string;
    patternsProcessed: number;
    status: 'completed' | 'failed' | 'partial';
    errors?: string[];
}
export interface TenantContext {
    tenant_id: string;
    namespace: string;
    plan?: 'starter' | 'professional' | 'enterprise';
    roles?: string[];
    permissions?: string[];
}
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: ResponseMeta;
}
export interface ResponseMeta {
    timestamp: string;
    requestId: string;
    tenantId?: string;
    latencyMs?: number;
}
//# sourceMappingURL=index.d.ts.map