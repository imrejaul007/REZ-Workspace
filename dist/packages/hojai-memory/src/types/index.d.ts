import { z } from 'zod';
/**
 * Memory Tiers - Hojai Flow Memory Architecture
 *
 * L1: Working Memory - Current conversation, immediate context
 * L2: Episodic Memory - Recent events (24h), session history
 * L3: Procedural Memory - How-tos, instructions, learned behaviors
 * L4: Semantic Memory - Facts, preferences, structured knowledge
 * L5: World Knowledge - External knowledge, common sense, general info
 */
export declare enum MemoryTier {
    L1_WORKING = "l1_working",// Current conversation context
    L2_EPISODIC = "l2_episodic",// Recent 24h events
    L3_PROCEDURAL = "l3_procedural",// Instructions, how-tos
    L4_SEMANTIC = "l4_semantic",// Facts, preferences
    L5_WORLD = "l5_world"
}
export declare enum MemoryType {
    INTERACTION = "interaction",
    PREFERENCE = "preference",
    BEHAVIOR = "behavior",
    CONTEXT = "context",
    KNOWLEDGE = "knowledge",
    CONVERSATION = "conversation"
}
export declare enum MemoryConfidence {
    LOW = 0.3,
    MEDIUM = 0.6,
    HIGH = 0.85,
    CERTAIN = 1
}
export declare const MemorySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    entityType: z.ZodEnum<["user", "merchant", "product", "session"]>;
    entityId: z.ZodString;
    type: z.ZodNativeEnum<typeof MemoryType>;
    content: z.ZodString;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    importance: z.ZodDefault<z.ZodNumber>;
    confidence: z.ZodDefault<z.ZodNumber>;
    source: z.ZodOptional<z.ZodString>;
    eventId: z.ZodOptional<z.ZodString>;
    tier: z.ZodDefault<z.ZodNativeEnum<typeof MemoryTier>>;
    context: z.ZodOptional<z.ZodObject<{
        channel: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        time: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        channel?: string | undefined;
        tags?: string[] | undefined;
        location?: string | undefined;
        time?: string | undefined;
    }, {
        channel?: string | undefined;
        tags?: string[] | undefined;
        location?: string | undefined;
        time?: string | undefined;
    }>>;
    validFrom: z.ZodOptional<z.ZodDate>;
    validUntil: z.ZodOptional<z.ZodDate>;
    isPrivate: z.ZodDefault<z.ZodBoolean>;
    sharedWith: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    lastAccessedAt: z.ZodOptional<z.ZodDate>;
    accessCount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: MemoryType;
    content: string;
    importance: number;
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    confidence: number;
    entityType: "user" | "product" | "session" | "merchant";
    entityId: string;
    tier: MemoryTier;
    isPrivate: boolean;
    accessCount: number;
    context?: {
        channel?: string | undefined;
        tags?: string[] | undefined;
        location?: string | undefined;
        time?: string | undefined;
    } | undefined;
    source?: string | undefined;
    data?: Record<string, any> | undefined;
    eventId?: string | undefined;
    validUntil?: Date | undefined;
    validFrom?: Date | undefined;
    sharedWith?: string[] | undefined;
    lastAccessedAt?: Date | undefined;
}, {
    type: MemoryType;
    content: string;
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    entityType: "user" | "product" | "session" | "merchant";
    entityId: string;
    context?: {
        channel?: string | undefined;
        tags?: string[] | undefined;
        location?: string | undefined;
        time?: string | undefined;
    } | undefined;
    source?: string | undefined;
    data?: Record<string, any> | undefined;
    importance?: number | undefined;
    confidence?: number | undefined;
    eventId?: string | undefined;
    tier?: MemoryTier | undefined;
    validUntil?: Date | undefined;
    validFrom?: Date | undefined;
    isPrivate?: boolean | undefined;
    sharedWith?: string[] | undefined;
    lastAccessedAt?: Date | undefined;
    accessCount?: number | undefined;
}>;
export type Memory = z.infer<typeof MemorySchema>;
export declare const MemoryWithTierSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    entityType: z.ZodEnum<["user", "merchant", "product", "session"]>;
    entityId: z.ZodString;
    type: z.ZodNativeEnum<typeof MemoryType>;
    content: z.ZodString;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    importance: z.ZodDefault<z.ZodNumber>;
    confidence: z.ZodDefault<z.ZodNumber>;
    source: z.ZodOptional<z.ZodString>;
    eventId: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodObject<{
        channel: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        time: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        channel?: string | undefined;
        tags?: string[] | undefined;
        location?: string | undefined;
        time?: string | undefined;
    }, {
        channel?: string | undefined;
        tags?: string[] | undefined;
        location?: string | undefined;
        time?: string | undefined;
    }>>;
    validFrom: z.ZodOptional<z.ZodDate>;
    validUntil: z.ZodOptional<z.ZodDate>;
    isPrivate: z.ZodDefault<z.ZodBoolean>;
    sharedWith: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    lastAccessedAt: z.ZodOptional<z.ZodDate>;
    accessCount: z.ZodDefault<z.ZodNumber>;
} & {
    tier: z.ZodDefault<z.ZodNativeEnum<typeof MemoryTier>>;
}, "strip", z.ZodTypeAny, {
    type: MemoryType;
    content: string;
    importance: number;
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    confidence: number;
    entityType: "user" | "product" | "session" | "merchant";
    entityId: string;
    tier: MemoryTier;
    isPrivate: boolean;
    accessCount: number;
    context?: {
        channel?: string | undefined;
        tags?: string[] | undefined;
        location?: string | undefined;
        time?: string | undefined;
    } | undefined;
    source?: string | undefined;
    data?: Record<string, any> | undefined;
    eventId?: string | undefined;
    validUntil?: Date | undefined;
    validFrom?: Date | undefined;
    sharedWith?: string[] | undefined;
    lastAccessedAt?: Date | undefined;
}, {
    type: MemoryType;
    content: string;
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    entityType: "user" | "product" | "session" | "merchant";
    entityId: string;
    context?: {
        channel?: string | undefined;
        tags?: string[] | undefined;
        location?: string | undefined;
        time?: string | undefined;
    } | undefined;
    source?: string | undefined;
    data?: Record<string, any> | undefined;
    importance?: number | undefined;
    confidence?: number | undefined;
    eventId?: string | undefined;
    tier?: MemoryTier | undefined;
    validUntil?: Date | undefined;
    validFrom?: Date | undefined;
    isPrivate?: boolean | undefined;
    sharedWith?: string[] | undefined;
    lastAccessedAt?: Date | undefined;
    accessCount?: number | undefined;
}>;
export type MemoryWithTier = z.infer<typeof MemoryWithTierSchema>;
export interface MemoryTierConfig {
    tier: MemoryTier;
    name: string;
    description: string;
    ttl: number;
    maxItems: number;
    priority: number;
    storage: 'memory' | 'redis' | 'mongodb';
}
export declare const MEMORY_TIER_CONFIG: Record<MemoryTier, MemoryTierConfig>;
export declare const TimelineEventSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    type: z.ZodString;
    category: z.ZodString;
    timestamp: z.ZodDate;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    entityType: z.ZodOptional<z.ZodString>;
    entityId: z.ZodOptional<z.ZodString>;
    impact: z.ZodOptional<z.ZodEnum<["positive", "negative", "neutral"]>>;
    value: z.ZodOptional<z.ZodNumber>;
    memoryIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type: string;
    title: string;
    category: string;
    userId: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    timestamp: Date;
    value?: number | undefined;
    data?: Record<string, any> | undefined;
    description?: string | undefined;
    impact?: "positive" | "neutral" | "negative" | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    memoryIds?: string[] | undefined;
}, {
    type: string;
    title: string;
    category: string;
    userId: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    timestamp: Date;
    value?: number | undefined;
    data?: Record<string, any> | undefined;
    description?: string | undefined;
    impact?: "positive" | "neutral" | "negative" | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    memoryIds?: string[] | undefined;
}>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export declare const ContextSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodString;
    sessionId: z.ZodOptional<z.ZodString>;
    channel: z.ZodDefault<z.ZodEnum<["whatsapp", "app", "web", "api", "voice"]>>;
    intent: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
        city: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        timezone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timezone?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    }, {
        timezone?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    }>>;
    time: z.ZodObject<{
        hour: z.ZodNumber;
        dayOfWeek: z.ZodNumber;
        isWeekend: z.ZodBoolean;
        isHoliday: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        hour: number;
        dayOfWeek: number;
        isWeekend: boolean;
        isHoliday?: boolean | undefined;
    }, {
        hour: number;
        dayOfWeek: number;
        isWeekend: boolean;
        isHoliday?: boolean | undefined;
    }>;
    device: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["mobile", "tablet", "desktop", "voice"]>;
        os: z.ZodOptional<z.ZodString>;
        browser: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "voice" | "mobile" | "tablet" | "desktop";
        browser?: string | undefined;
        os?: string | undefined;
    }, {
        type: "voice" | "mobile" | "tablet" | "desktop";
        browser?: string | undefined;
        os?: string | undefined;
    }>>;
    recentEvents: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        timestamp: z.ZodDate;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        timestamp: Date;
        data?: Record<string, any> | undefined;
    }, {
        type: string;
        timestamp: Date;
        data?: Record<string, any> | undefined;
    }>, "many">;
    activePreferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    expiresAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    channel: "api" | "whatsapp" | "app" | "web" | "voice";
    userId: string;
    id: string;
    createdAt: Date;
    expiresAt: Date;
    tenantId: string;
    time: {
        hour: number;
        dayOfWeek: number;
        isWeekend: boolean;
        isHoliday?: boolean | undefined;
    };
    recentEvents: {
        type: string;
        timestamp: Date;
        data?: Record<string, any> | undefined;
    }[];
    sessionId?: string | undefined;
    custom?: Record<string, any> | undefined;
    intent?: string | undefined;
    device?: {
        type: "voice" | "mobile" | "tablet" | "desktop";
        browser?: string | undefined;
        os?: string | undefined;
    } | undefined;
    location?: {
        timezone?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    } | undefined;
    activePreferences?: Record<string, any> | undefined;
}, {
    userId: string;
    id: string;
    createdAt: Date;
    expiresAt: Date;
    tenantId: string;
    time: {
        hour: number;
        dayOfWeek: number;
        isWeekend: boolean;
        isHoliday?: boolean | undefined;
    };
    recentEvents: {
        type: string;
        timestamp: Date;
        data?: Record<string, any> | undefined;
    }[];
    channel?: "api" | "whatsapp" | "app" | "web" | "voice" | undefined;
    sessionId?: string | undefined;
    custom?: Record<string, any> | undefined;
    intent?: string | undefined;
    device?: {
        type: "voice" | "mobile" | "tablet" | "desktop";
        browser?: string | undefined;
        os?: string | undefined;
    } | undefined;
    location?: {
        timezone?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        city?: string | undefined;
        country?: string | undefined;
    } | undefined;
    activePreferences?: Record<string, any> | undefined;
}>;
export type Context = z.infer<typeof ContextSchema>;
export declare const ProfileSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    demographics: z.ZodOptional<z.ZodObject<{
        age: z.ZodOptional<z.ZodNumber>;
        gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>;
        language: z.ZodDefault<z.ZodString>;
        locale: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        locale: string;
        gender?: "other" | "male" | "female" | "prefer_not_to_say" | undefined;
        age?: number | undefined;
    }, {
        language?: string | undefined;
        gender?: "other" | "male" | "female" | "prefer_not_to_say" | undefined;
        locale?: string | undefined;
        age?: number | undefined;
    }>>;
    preferences: z.ZodObject<{
        language: z.ZodOptional<z.ZodString>;
        notifications: z.ZodDefault<z.ZodBoolean>;
        timezone: z.ZodOptional<z.ZodString>;
        currency: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        notifications: boolean;
        language?: string | undefined;
        timezone?: string | undefined;
    }, {
        language?: string | undefined;
        currency?: string | undefined;
        timezone?: string | undefined;
        notifications?: boolean | undefined;
    }>;
    computed: z.ZodObject<{
        loyaltyTier: z.ZodOptional<z.ZodString>;
        lifetimeValue: z.ZodDefault<z.ZodNumber>;
        visitFrequency: z.ZodDefault<z.ZodEnum<["daily", "weekly", "monthly", "rarely"]>>;
        preferredChannel: z.ZodOptional<z.ZodString>;
        lastActiveAt: z.ZodOptional<z.ZodDate>;
        firstSeenAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        lifetimeValue: number;
        visitFrequency: "daily" | "weekly" | "monthly" | "rarely";
        loyaltyTier?: string | undefined;
        preferredChannel?: string | undefined;
        lastActiveAt?: Date | undefined;
        firstSeenAt?: Date | undefined;
    }, {
        loyaltyTier?: string | undefined;
        lifetimeValue?: number | undefined;
        visitFrequency?: "daily" | "weekly" | "monthly" | "rarely" | undefined;
        preferredChannel?: string | undefined;
        lastActiveAt?: Date | undefined;
        firstSeenAt?: Date | undefined;
    }>;
    stats: z.ZodObject<{
        totalOrders: z.ZodDefault<z.ZodNumber>;
        totalSpent: z.ZodDefault<z.ZodNumber>;
        averageOrderValue: z.ZodDefault<z.ZodNumber>;
        ordersThisMonth: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        totalOrders: number;
        totalSpent: number;
        averageOrderValue: number;
        ordersThisMonth: number;
    }, {
        totalOrders?: number | undefined;
        totalSpent?: number | undefined;
        averageOrderValue?: number | undefined;
        ordersThisMonth?: number | undefined;
    }>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    segments: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    consent: z.ZodObject<{
        marketing: z.ZodDefault<z.ZodBoolean>;
        analytics: z.ZodDefault<z.ZodBoolean>;
        dataProcessing: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        marketing: boolean;
        analytics: boolean;
        dataProcessing: boolean;
    }, {
        marketing?: boolean | undefined;
        analytics?: boolean | undefined;
        dataProcessing?: boolean | undefined;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    tags: string[];
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    stats: {
        totalOrders: number;
        totalSpent: number;
        averageOrderValue: number;
        ordersThisMonth: number;
    };
    segments: string[];
    preferences: {
        currency: string;
        notifications: boolean;
        language?: string | undefined;
        timezone?: string | undefined;
    };
    computed: {
        lifetimeValue: number;
        visitFrequency: "daily" | "weekly" | "monthly" | "rarely";
        loyaltyTier?: string | undefined;
        preferredChannel?: string | undefined;
        lastActiveAt?: Date | undefined;
        firstSeenAt?: Date | undefined;
    };
    consent: {
        marketing: boolean;
        analytics: boolean;
        dataProcessing: boolean;
    };
    name?: string | undefined;
    userId?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    demographics?: {
        language: string;
        locale: string;
        gender?: "other" | "male" | "female" | "prefer_not_to_say" | undefined;
        age?: number | undefined;
    } | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    stats: {
        totalOrders?: number | undefined;
        totalSpent?: number | undefined;
        averageOrderValue?: number | undefined;
        ordersThisMonth?: number | undefined;
    };
    preferences: {
        language?: string | undefined;
        currency?: string | undefined;
        timezone?: string | undefined;
        notifications?: boolean | undefined;
    };
    computed: {
        loyaltyTier?: string | undefined;
        lifetimeValue?: number | undefined;
        visitFrequency?: "daily" | "weekly" | "monthly" | "rarely" | undefined;
        preferredChannel?: string | undefined;
        lastActiveAt?: Date | undefined;
        firstSeenAt?: Date | undefined;
    };
    consent: {
        marketing?: boolean | undefined;
        analytics?: boolean | undefined;
        dataProcessing?: boolean | undefined;
    };
    name?: string | undefined;
    tags?: string[] | undefined;
    userId?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    segments?: string[] | undefined;
    demographics?: {
        language?: string | undefined;
        gender?: "other" | "male" | "female" | "prefer_not_to_say" | undefined;
        locale?: string | undefined;
        age?: number | undefined;
    } | undefined;
}>;
export type Profile = z.infer<typeof ProfileSchema>;
export declare const VectorMemorySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    entityType: z.ZodEnum<["user", "merchant", "product", "conversation", "knowledge"]>;
    entityId: z.ZodString;
    vector: z.ZodArray<z.ZodNumber, "many">;
    model: z.ZodDefault<z.ZodString>;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    collection: z.ZodDefault<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    content: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    model: string;
    collection: string;
    entityType: "conversation" | "user" | "product" | "knowledge" | "merchant";
    entityId: string;
    vector: number[];
    metadata?: Record<string, any> | undefined;
}, {
    content: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    entityType: "conversation" | "user" | "product" | "knowledge" | "merchant";
    entityId: string;
    vector: number[];
    metadata?: Record<string, any> | undefined;
    model?: string | undefined;
    collection?: string | undefined;
}>;
export type VectorMemory = z.infer<typeof VectorMemorySchema>;
export declare const ConversationMessageSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodOptional<z.ZodString>;
    conversationId: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["user", "assistant", "system"]>;
    userId: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["image", "document", "link"]>;
        url: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        type: "link" | "image" | "document";
        metadata?: Record<string, any> | undefined;
    }, {
        url: string;
        type: "link" | "image" | "document";
        metadata?: Record<string, any> | undefined;
    }>, "many">>;
    aiMetadata: z.ZodOptional<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        tokens: z.ZodOptional<z.ZodNumber>;
        confidence: z.ZodOptional<z.ZodNumber>;
        intent: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        intent?: string | undefined;
        confidence?: number | undefined;
        tokens?: number | undefined;
    }, {
        model?: string | undefined;
        intent?: string | undefined;
        confidence?: number | undefined;
        tokens?: number | undefined;
    }>>;
    feedback: z.ZodOptional<z.ZodObject<{
        rating: z.ZodOptional<z.ZodNumber>;
        helpful: z.ZodOptional<z.ZodBoolean>;
        corrections: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        corrections?: string | undefined;
        rating?: number | undefined;
        helpful?: boolean | undefined;
    }, {
        corrections?: string | undefined;
        rating?: number | undefined;
        helpful?: boolean | undefined;
    }>>;
    createdAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    role: "user" | "assistant" | "system";
    content: string;
    userId?: string | undefined;
    id?: string | undefined;
    createdAt?: Date | undefined;
    tenantId?: string | undefined;
    conversationId?: string | undefined;
    attachments?: {
        url: string;
        type: "link" | "image" | "document";
        metadata?: Record<string, any> | undefined;
    }[] | undefined;
    aiMetadata?: {
        model?: string | undefined;
        intent?: string | undefined;
        confidence?: number | undefined;
        tokens?: number | undefined;
    } | undefined;
    feedback?: {
        corrections?: string | undefined;
        rating?: number | undefined;
        helpful?: boolean | undefined;
    } | undefined;
}, {
    role: "user" | "assistant" | "system";
    content: string;
    userId?: string | undefined;
    id?: string | undefined;
    createdAt?: Date | undefined;
    tenantId?: string | undefined;
    conversationId?: string | undefined;
    attachments?: {
        url: string;
        type: "link" | "image" | "document";
        metadata?: Record<string, any> | undefined;
    }[] | undefined;
    aiMetadata?: {
        model?: string | undefined;
        intent?: string | undefined;
        confidence?: number | undefined;
        tokens?: number | undefined;
    } | undefined;
    feedback?: {
        corrections?: string | undefined;
        rating?: number | undefined;
        helpful?: boolean | undefined;
    } | undefined;
}>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
//# sourceMappingURL=index.d.ts.map