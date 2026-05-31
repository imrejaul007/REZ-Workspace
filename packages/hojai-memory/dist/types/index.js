"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationMessageSchema = exports.VectorMemorySchema = exports.ProfileSchema = exports.ContextSchema = exports.TimelineEventSchema = exports.MEMORY_TIER_CONFIG = exports.MemoryWithTierSchema = exports.MemorySchema = exports.MemoryConfidence = exports.MemoryType = exports.MemoryTier = void 0;
const zod_1 = require("zod");
// ============================================================================
// MEMORY TYPES
// ============================================================================
/**
 * Memory Tiers - Hojai Flow Memory Architecture
 *
 * L1: Working Memory - Current conversation, immediate context
 * L2: Episodic Memory - Recent events (24h), session history
 * L3: Procedural Memory - How-tos, instructions, learned behaviors
 * L4: Semantic Memory - Facts, preferences, structured knowledge
 * L5: World Knowledge - External knowledge, common sense, general info
 */
var MemoryTier;
(function (MemoryTier) {
    MemoryTier["L1_WORKING"] = "l1_working";
    MemoryTier["L2_EPISODIC"] = "l2_episodic";
    MemoryTier["L3_PROCEDURAL"] = "l3_procedural";
    MemoryTier["L4_SEMANTIC"] = "l4_semantic";
    MemoryTier["L5_WORLD"] = "l5_world"; // External knowledge
})(MemoryTier || (exports.MemoryTier = MemoryTier = {}));
var MemoryType;
(function (MemoryType) {
    MemoryType["INTERACTION"] = "interaction";
    MemoryType["PREFERENCE"] = "preference";
    MemoryType["BEHAVIOR"] = "behavior";
    MemoryType["CONTEXT"] = "context";
    MemoryType["KNOWLEDGE"] = "knowledge";
    MemoryType["CONVERSATION"] = "conversation";
})(MemoryType || (exports.MemoryType = MemoryType = {}));
var MemoryConfidence;
(function (MemoryConfidence) {
    MemoryConfidence[MemoryConfidence["LOW"] = 0.3] = "LOW";
    MemoryConfidence[MemoryConfidence["MEDIUM"] = 0.6] = "MEDIUM";
    MemoryConfidence[MemoryConfidence["HIGH"] = 0.85] = "HIGH";
    MemoryConfidence[MemoryConfidence["CERTAIN"] = 1] = "CERTAIN";
})(MemoryConfidence || (exports.MemoryConfidence = MemoryConfidence = {}));
exports.MemorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Who this memory belongs to
    userId: zod_1.z.string(),
    entityType: zod_1.z.enum(['user', 'merchant', 'product', 'session']),
    entityId: zod_1.z.string(),
    // Memory content
    type: zod_1.z.nativeEnum(MemoryType),
    content: zod_1.z.string(),
    // Structured data
    data: zod_1.z.record(zod_1.z.any()).optional(),
    // Importance and confidence
    importance: zod_1.z.number().min(0).max(10).default(5),
    confidence: zod_1.z.number().min(0).max(1).default(0.7),
    // Source
    source: zod_1.z.string().optional(), // 'event', 'conversation', 'manual'
    eventId: zod_1.z.string().uuid().optional(),
    // Memory Tier (Hojai Flow Architecture)
    tier: zod_1.z.nativeEnum(MemoryTier).default(MemoryTier.L4_SEMANTIC),
    // Context
    context: zod_1.z.object({
        channel: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        time: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional()
    }).optional(),
    // Temporal
    validFrom: zod_1.z.date().optional(),
    validUntil: zod_1.z.date().optional(),
    // Access
    isPrivate: zod_1.z.boolean().default(false),
    sharedWith: zod_1.z.array(zod_1.z.string()).optional(),
    // Timestamps
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    lastAccessedAt: zod_1.z.date().optional(),
    accessCount: zod_1.z.number().default(0)
});
// Add tier field to memory schema
exports.MemoryWithTierSchema = exports.MemorySchema.extend({
    tier: zod_1.z.nativeEnum(MemoryTier).default(MemoryTier.L4_SEMANTIC)
});
exports.MEMORY_TIER_CONFIG = {
    [MemoryTier.L1_WORKING]: {
        tier: MemoryTier.L1_WORKING,
        name: 'Working Memory',
        description: 'Current conversation context',
        ttl: 5 * 60 * 1000, // 5 minutes
        maxItems: 20,
        priority: 1,
        storage: 'memory'
    },
    [MemoryTier.L2_EPISODIC]: {
        tier: MemoryTier.L2_EPISODIC,
        name: 'Episodic Memory',
        description: 'Recent 24h events',
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        maxItems: 100,
        priority: 2,
        storage: 'redis'
    },
    [MemoryTier.L3_PROCEDURAL]: {
        tier: MemoryTier.L3_PROCEDURAL,
        name: 'Procedural Memory',
        description: 'Instructions, how-tos',
        ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
        maxItems: 50,
        priority: 3,
        storage: 'mongodb'
    },
    [MemoryTier.L4_SEMANTIC]: {
        tier: MemoryTier.L4_SEMANTIC,
        name: 'Semantic Memory',
        description: 'Facts, preferences',
        ttl: 365 * 24 * 60 * 60 * 1000, // 1 year
        maxItems: 200,
        priority: 4,
        storage: 'mongodb'
    },
    [MemoryTier.L5_WORLD]: {
        tier: MemoryTier.L5_WORLD,
        name: 'World Knowledge',
        description: 'External knowledge',
        ttl: -1, // Never expires
        maxItems: 500,
        priority: 5,
        storage: 'mongodb'
    }
};
// ============================================================================
// TIMELINE TYPES
// ============================================================================
exports.TimelineEventSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string(),
    // Event data
    type: zod_1.z.string(), // 'order_placed', 'login', 'preference_updated'
    category: zod_1.z.string(),
    timestamp: zod_1.z.date(),
    // Content
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    data: zod_1.z.record(zod_1.z.any()).optional(),
    // Related entities
    entityType: zod_1.z.string().optional(),
    entityId: zod_1.z.string().optional(),
    // Impact
    impact: zod_1.z.enum(['positive', 'negative', 'neutral']).optional(),
    value: zod_1.z.number().optional(), // Monetary value if applicable
    // Memory links
    memoryIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// CONTEXT TYPES
// ============================================================================
exports.ContextSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string(),
    // Session context
    sessionId: zod_1.z.string().optional(),
    channel: zod_1.z.enum(['whatsapp', 'app', 'web', 'api', 'voice']).default('app'),
    intent: zod_1.z.string().optional(),
    // Location context
    location: zod_1.z.object({
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        city: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        timezone: zod_1.z.string().optional()
    }).optional(),
    // Time context
    time: zod_1.z.object({
        hour: zod_1.z.number(),
        dayOfWeek: zod_1.z.number(),
        isWeekend: zod_1.z.boolean(),
        isHoliday: zod_1.z.boolean().optional()
    }),
    // Device context
    device: zod_1.z.object({
        type: zod_1.z.enum(['mobile', 'tablet', 'desktop', 'voice']),
        os: zod_1.z.string().optional(),
        browser: zod_1.z.string().optional()
    }).optional(),
    // Recent history (last N events)
    recentEvents: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        timestamp: zod_1.z.date(),
        data: zod_1.z.record(zod_1.z.any()).optional()
    })).max(50),
    // Active preferences at this moment
    activePreferences: zod_1.z.record(zod_1.z.any()).optional(),
    // Custom context
    custom: zod_1.z.record(zod_1.z.any()).optional(),
    createdAt: zod_1.z.date(),
    expiresAt: zod_1.z.date()
});
// ============================================================================
// PROFILE TYPES
// ============================================================================
exports.ProfileSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Identity
    userId: zod_1.z.string().optional(), // External user ID
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    // Demographics
    demographics: zod_1.z.object({
        age: zod_1.z.number().optional(),
        gender: zod_1.z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
        language: zod_1.z.string().default('en'),
        locale: zod_1.z.string().default('en-US')
    }).optional(),
    // Preferences
    preferences: zod_1.z.object({
        language: zod_1.z.string().optional(),
        notifications: zod_1.z.boolean().default(true),
        timezone: zod_1.z.string().optional(),
        currency: zod_1.z.string().default('INR')
    }),
    // Computed
    computed: zod_1.z.object({
        loyaltyTier: zod_1.z.string().optional(),
        lifetimeValue: zod_1.z.number().default(0),
        visitFrequency: zod_1.z.enum(['daily', 'weekly', 'monthly', 'rarely']).default('monthly'),
        preferredChannel: zod_1.z.string().optional(),
        lastActiveAt: zod_1.z.date().optional(),
        firstSeenAt: zod_1.z.date().optional()
    }),
    // Stats
    stats: zod_1.z.object({
        totalOrders: zod_1.z.number().default(0),
        totalSpent: zod_1.z.number().default(0),
        averageOrderValue: zod_1.z.number().default(0),
        ordersThisMonth: zod_1.z.number().default(0)
    }),
    // Tags
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    segments: zod_1.z.array(zod_1.z.string()).default([]),
    // Privacy
    consent: zod_1.z.object({
        marketing: zod_1.z.boolean().default(false),
        analytics: zod_1.z.boolean().default(true),
        dataProcessing: zod_1.z.boolean().default(true)
    }),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// VECTOR MEMORY TYPES
// ============================================================================
exports.VectorMemorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    // Entity
    entityType: zod_1.z.enum(['user', 'merchant', 'product', 'conversation', 'knowledge']),
    entityId: zod_1.z.string(),
    // Vector
    vector: zod_1.z.array(zod_1.z.number()), // Embedding vector
    model: zod_1.z.string().default('openai'),
    // Content
    content: zod_1.z.string(), // Original text
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    // Index
    collection: zod_1.z.string().default('default'),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// CONVERSATION TYPES
// ============================================================================
exports.ConversationMessageSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    tenantId: zod_1.z.string().uuid().optional(),
    conversationId: zod_1.z.string().uuid().optional(),
    // Who
    role: zod_1.z.enum(['user', 'assistant', 'system']),
    userId: zod_1.z.string().optional(),
    // Content
    content: zod_1.z.string(),
    attachments: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['image', 'document', 'link']),
        url: zod_1.z.string(),
        metadata: zod_1.z.record(zod_1.z.any()).optional()
    })).optional(),
    // AI metadata
    aiMetadata: zod_1.z.object({
        model: zod_1.z.string().optional(),
        tokens: zod_1.z.number().optional(),
        confidence: zod_1.z.number().optional(),
        intent: zod_1.z.string().optional()
    }).optional(),
    // Feedback
    feedback: zod_1.z.object({
        rating: zod_1.z.number().min(1).max(5).optional(),
        helpful: zod_1.z.boolean().optional(),
        corrections: zod_1.z.string().optional()
    }).optional(),
    createdAt: zod_1.z.date().optional()
});
// ============================================================================
// TYPE EXPORTS
// ============================================================================
// MemoryTier, MemoryWithTier, MemoryTierConfig, and MEMORY_TIER_CONFIG are already exported above
//# sourceMappingURL=index.js.map