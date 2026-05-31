/**
 * HOJAI Training Pipeline - Type Definitions
 * Learn from: Chat conversations, User actions, Corrections, Feedback loops
 */
import { z } from 'zod';
// ============================================================================
// ENUMS
// ============================================================================
export var LearningSource;
(function (LearningSource) {
    LearningSource["CHAT"] = "chat";
    LearningSource["SIGNAL"] = "signal";
    LearningSource["EVENT"] = "event";
    LearningSource["CONVERSION"] = "conversion";
    LearningSource["CORRECTION"] = "correction";
    LearningSource["FEEDBACK"] = "feedback";
})(LearningSource || (LearningSource = {}));
export var LearningType;
(function (LearningType) {
    LearningType["RESPONSE_PATTERN"] = "response_pattern";
    LearningType["INTENT"] = "intent";
    LearningType["CONTEXT"] = "context";
    LearningType["PREFERENCE"] = "preference";
    LearningType["INTEREST"] = "interest";
    LearningType["NEED"] = "need";
    LearningType["SUCCESS"] = "success";
    LearningType["FAILURE"] = "failure";
    LearningType["TOPIC"] = "topic";
    LearningType["QUALITY"] = "quality";
})(LearningType || (LearningType = {}));
export var LearningStage;
(function (LearningStage) {
    LearningStage["SHORT_TERM"] = "short_term";
    LearningStage["LONG_TERM"] = "long_term";
    LearningStage["MODEL"] = "model";
})(LearningStage || (LearningStage = {}));
export var LearningStatus;
(function (LearningStatus) {
    LearningStatus["CAPTURED"] = "captured";
    LearningStatus["PROCESSING"] = "processing";
    LearningStatus["LEARNED"] = "learned";
    LearningStatus["DEPLOYED"] = "deployed";
    LearningStatus["ARCHIVED"] = "archived";
})(LearningStatus || (LearningStatus = {}));
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const ChatMessageSchema = z.object({
    messageId: z.string().min(1),
    conversationId: z.string().min(1),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1),
    timestamp: z.string().datetime(),
    metadata: z.record(z.unknown()).optional()
});
export const SignalEventSchema = z.object({
    signalId: z.string().min(1),
    type: z.enum(['click', 'view', 'search', 'action', 'conversion', 'error']),
    tenantId: z.string().optional(),
    userId: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    properties: z.record(z.unknown()).optional(),
    timestamp: z.string().datetime()
});
export const CorrectionSchema = z.object({
    correctionId: z.string().min(1),
    originalContent: z.string().min(1),
    correctedContent: z.string().min(1),
    reason: z.string().optional(),
    userId: z.string().optional(),
    timestamp: z.string().datetime(),
    context: z.record(z.unknown()).optional()
});
export const FeedbackSchema = z.object({
    feedbackId: z.string().min(1),
    type: z.enum(['positive', 'negative', 'rating', 'correction']),
    score: z.number().min(1).max(5).optional(),
    content: z.string().optional(),
    userId: z.string().optional(),
    itemType: z.string().optional(),
    itemId: z.string().optional(),
    timestamp: z.string().datetime(),
    metadata: z.record(z.unknown()).optional()
});
// Learning payload schema
export const LearningPayloadSchema = z.object({
    source: z.nativeEnum(LearningSource),
    sourceId: z.string().min(1),
    type: z.nativeEnum(LearningType),
    content: z.record(z.unknown()),
    confidence: z.number().min(0).max(1).default(0.5),
    tenantId: z.string().optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    timestamp: z.string().datetime().optional()
});
// Query schemas
export const QueryLearningSchema = z.object({
    tenantId: z.string().optional(),
    userId: z.string().optional(),
    type: z.nativeEnum(LearningType).optional(),
    source: z.nativeEnum(LearningSource).optional(),
    stage: z.nativeEnum(LearningStage).optional(),
    status: z.nativeEnum(LearningStatus).optional(),
    limit: z.number().min(1).max(1000).default(100),
    offset: z.number().min(0).default(0)
});
//# sourceMappingURL=index.js.map