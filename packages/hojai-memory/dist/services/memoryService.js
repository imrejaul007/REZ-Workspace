"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryService = exports.MemoryService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
const memoryModel_js_1 = require("../models/memoryModel.js");
// ============================================================================
// MEMORY SERVICE
// ============================================================================
class MemoryService {
    redis;
    CACHE_TTL = 3600; // 1 hour
    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new ioredis_1.default(redisUrl);
    }
    /**
     * Store a new memory
     */
    async storeMemory(tenantId, params) {
        const validUntil = params.validUntil
            ? (typeof params.validUntil === 'string' ? new Date(params.validUntil) : params.validUntil)
            : undefined;
        const memory = new memoryModel_js_1.MemoryModel({
            userId: params.userId,
            entityType: params.entityType,
            entityId: params.entityId,
            type: params.type,
            tier: 'l4_semantic',
            content: params.content,
            data: params.data,
            importance: params.importance ?? 5,
            confidence: params.confidence ?? 0.7,
            source: params.source,
            context: params.context,
            validUntil,
            isPrivate: false,
            id: (0, uuid_1.v4)(),
            tenantId
        });
        await memory.save();
        // Update Redis cache
        await this.cacheMemory(tenantId, memory.id, memory.toObject());
        return memory.toObject();
    }
    /**
     * Get memories for a user
     */
    async getMemories(params) {
        const filter = {
            tenantId: params.tenantId,
            userId: params.userId,
            $or: [
                { validUntil: { $exists: false } },
                { validUntil: null },
                { validUntil: { $gt: new Date() } }
            ]
        };
        if (params.type) {
            filter.type = params.type;
        }
        if (params.since) {
            filter.createdAt = { $gte: params.since };
        }
        const [memories, total] = await Promise.all([
            memoryModel_js_1.MemoryModel.find(filter)
                .sort({ importance: -1, createdAt: -1 })
                .skip(params.offset || 0)
                .limit(params.limit || 50),
            memoryModel_js_1.MemoryModel.countDocuments(filter)
        ]);
        return {
            memories: memories.map(m => m.toObject()),
            total
        };
    }
    /**
     * Search memories by content
     */
    async searchMemories(params) {
        // Simple text search - in production, use vector search
        const memories = await memoryModel_js_1.MemoryModel.find({
            tenantId: params.tenantId,
            userId: params.userId,
            content: { $regex: params.query, $options: 'i' }
        })
            .sort({ importance: -1, createdAt: -1 })
            .limit(params.limit || 10);
        return memories.map(m => m.toObject());
    }
    /**
     * Update memory access
     */
    async accessMemory(tenantId, memoryId) {
        await memoryModel_js_1.MemoryModel.findOneAndUpdate({ _id: memoryId, tenantId }, {
            $set: { lastAccessedAt: new Date() },
            $inc: { accessCount: 1 }
        });
    }
    /**
     * Delete memory
     */
    async deleteMemory(tenantId, memoryId) {
        await memoryModel_js_1.MemoryModel.deleteOne({ _id: memoryId, tenantId });
        await this.redis.del(`memory:${tenantId}:${memoryId}`);
    }
    // ============================================================================
    // TIMELINE METHODS
    // ============================================================================
    /**
     * Add event to timeline
     */
    async addToTimeline(tenantId, event) {
        const timelineEvent = new memoryModel_js_1.TimelineEventModel({
            ...event,
            id: (0, uuid_1.v4)(),
            tenantId
        });
        await timelineEvent.save();
        return timelineEvent.toObject();
    }
    /**
     * Get user timeline
     */
    async getTimeline(params) {
        const filter = {
            tenantId: params.tenantId,
            userId: params.userId
        };
        if (params.types && params.types.length > 0) {
            filter.type = { $in: params.types };
        }
        if (params.startDate || params.endDate) {
            filter.timestamp = {};
            if (params.startDate) {
                filter.timestamp.$gte = params.startDate;
            }
            if (params.endDate) {
                filter.timestamp.$lte = params.endDate;
            }
        }
        const [events, total] = await Promise.all([
            memoryModel_js_1.TimelineEventModel.find(filter)
                .sort({ timestamp: -1 })
                .skip(params.offset || 0)
                .limit(params.limit || 50),
            memoryModel_js_1.TimelineEventModel.countDocuments(filter)
        ]);
        return {
            events: events.map(e => e.toObject()),
            total
        };
    }
    // ============================================================================
    // CONTEXT METHODS
    // ============================================================================
    /**
     * Get or create session context
     */
    async getContext(params) {
        const filter = {
            tenantId: params.tenantId,
            userId: params.userId
        };
        if (params.sessionId) {
            filter.sessionId = params.sessionId;
        }
        const context = await memoryModel_js_1.ContextModel.findOne(filter)
            .sort({ createdAt: -1 });
        return context ? context.toObject() : null;
    }
    /**
     * Update session context
     */
    async updateContext(params) {
        const context = await memoryModel_js_1.ContextModel.findOneAndUpdate({
            tenantId: params.tenantId,
            userId: params.userId,
            sessionId: params.sessionId
        }, {
            $set: {
                ...params.updates,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min TTL
            }
        }, { new: true, upsert: true });
        return context.toObject();
    }
    // ============================================================================
    // PROFILE METHODS
    // ============================================================================
    /**
     * Get or create profile
     */
    async getProfile(tenantId, identifier) {
        const filter = { tenantId };
        if (identifier.userId)
            filter.userId = identifier.userId;
        else if (identifier.email)
            filter.email = identifier.email;
        else if (identifier.phone)
            filter.phone = identifier.phone;
        else
            return null;
        const profile = await memoryModel_js_1.ProfileModel.findOne(filter);
        return profile ? profile.toObject() : null;
    }
    /**
     * Create profile
     */
    async createProfile(params) {
        const profile = new memoryModel_js_1.ProfileModel({
            ...params,
            id: (0, uuid_1.v4)(),
            computed: {
                lastActiveAt: new Date(),
                firstSeenAt: new Date()
            }
        });
        await profile.save();
        return profile.toObject();
    }
    /**
     * Update profile
     */
    async updateProfile(tenantId, identifier, updates) {
        const filter = { tenantId };
        if (identifier.userId)
            filter.userId = identifier.userId;
        else if (identifier.email)
            filter.email = identifier.email;
        else if (identifier.phone)
            filter.phone = identifier.phone;
        else
            return null;
        const profile = await memoryModel_js_1.ProfileModel.findOneAndUpdate(filter, { $set: updates }, { new: true });
        return profile ? profile.toObject() : null;
    }
    // ============================================================================
    // CONVERSATION METHODS
    // ============================================================================
    /**
     * Create or continue conversation
     */
    async getConversation(params) {
        if (params.conversationId) {
            return memoryModel_js_1.ConversationModel.findOne({
                _id: params.conversationId,
                tenantId: params.tenantId
            });
        }
        // Find most recent active conversation
        return memoryModel_js_1.ConversationModel.findOne({
            tenantId: params.tenantId,
            userId: params.userId,
            status: 'active'
        }).sort({ lastMessageAt: -1 });
    }
    /**
     * Add message to conversation
     */
    async addMessage(params) {
        const message = {
            ...params.message,
            id: (0, uuid_1.v4)(),
            createdAt: new Date()
        };
        await memoryModel_js_1.ConversationModel.findByIdAndUpdate(params.conversationId, {
            $push: { messages: message },
            $set: { lastMessageAt: new Date() }
        });
        return message;
    }
    // ============================================================================
    // CACHE METHODS
    // ============================================================================
    async cacheMemory(tenantId, memoryId, memory) {
        const key = `memory:${tenantId}:${memoryId}`;
        await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(memory));
    }
    async getCachedMemory(tenantId, memoryId) {
        const key = `memory:${tenantId}:${memoryId}`;
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    // ============================================================================
    // BATCH OPERATIONS
    // ============================================================================
    /**
     * Store memories from events
     */
    async processEventMemories(tenantId, event) {
        // Extract memory-worthy information from events
        // This would be extended based on event types
        if (event.userId && event.type) {
            // Create timeline event
            await this.addToTimeline(tenantId, {
                userId: event.userId,
                type: event.type,
                category: event.type.split('.')[0],
                timestamp: new Date(),
                title: `Event: ${event.type}`,
                description: JSON.stringify(event.properties || {}),
                data: event.properties,
                entityType: event.entityType,
                entityId: event.entityId,
                impact: 'neutral'
            });
        }
    }
    // ============================================================================
    // MEMORY TIER METHODS (Hojai Flow Architecture)
    // ============================================================================
    /**
     * Get memories by tier - implements local-first priority
     * L1 → L2 → L3 → L4 → L5 (L1 is fastest/most local)
     */
    async getMemoriesByTier(params) {
        const config = index_js_1.MEMORY_TIER_CONFIG[params.tier];
        const limit = params.limit || config.maxItems;
        const filter = {
            tenantId: params.tenantId,
            userId: params.userId,
            tier: params.tier
        };
        if (params.entityId) {
            filter.entityId = params.entityId;
        }
        // Check cache first for L1/L2 tiers
        if (config.storage === 'redis' || config.storage === 'memory') {
            const cached = await this.getCachedMemories(params.tenantId, params.userId, params.tier);
            if (cached && cached.length > 0) {
                return cached.slice(0, limit);
            }
        }
        // Fetch from MongoDB
        const memories = await memoryModel_js_1.MemoryModel.find(filter)
            .sort({ importance: -1, createdAt: -1 })
            .limit(limit);
        const result = memories.map(m => m.toObject());
        // Cache if applicable
        if (config.storage !== 'mongodb') {
            await this.cacheMemories(params.tenantId, params.userId, params.tier, result);
        }
        return result;
    }
    /**
     * Store memory with automatic tier assignment
     */
    async storeMemoryWithTier(params) {
        const memory = new memoryModel_js_1.MemoryModel({
            ...params,
            id: (0, uuid_1.v4)()
        });
        await memory.save();
        // Update cache for fast retrieval
        const config = index_js_1.MEMORY_TIER_CONFIG[params.tier];
        if (config.storage !== 'mongodb') {
            await this.cacheMemories(params.tenantId, params.userId, params.tier, [memory.toObject()]);
        }
        return memory.toObject();
    }
    /**
     * Get full context from all tiers (L1 → L5 priority)
     * This is the main method for Hojai Flow's "Memory Before Models" principle
     */
    async getFullContext(params) {
        const tiers = params.includeTiers || Object.values(index_js_1.MemoryTier);
        const byTier = {};
        const allMemories = [];
        // Fetch from each tier in priority order (L1 first)
        for (const tier of tiers.sort((a, b) => index_js_1.MEMORY_TIER_CONFIG[a].priority - index_js_1.MEMORY_TIER_CONFIG[b].priority)) {
            const memories = await this.getMemoriesByTier({
                tenantId: params.tenantId,
                userId: params.userId,
                entityId: params.entityId,
                tier,
                limit: params.maxItemsPerTier || index_js_1.MEMORY_TIER_CONFIG[tier].maxItems
            });
            byTier[tier] = memories;
            allMemories.push(...memories);
        }
        // Build context string for LLM consumption
        const context = this.buildContextString(byTier);
        return {
            memories: allMemories,
            byTier: byTier,
            context
        };
    }
    /**
     * Build context string from memories (for LLM prompts)
     */
    buildContextString(byTier) {
        const parts = [];
        // Add each tier with header
        for (const tier of Object.values(index_js_1.MemoryTier)) {
            const memories = byTier[tier];
            if (!memories || memories.length === 0)
                continue;
            const config = index_js_1.MEMORY_TIER_CONFIG[tier];
            parts.push(`\n=== ${config.name} (${tier}) ===`);
            parts.push(`Relevance: ${config.description}`);
            for (const memory of memories.slice(0, 10)) {
                parts.push(`- ${memory.content}`);
            }
        }
        return parts.join('\n');
    }
    /**
     * Cache memories by tier
     */
    async cacheMemories(tenantId, userId, tier, memories) {
        const key = `memory:tier:${tenantId}:${userId}:${tier}`;
        const config = index_js_1.MEMORY_TIER_CONFIG[tier];
        const ttl = Math.floor(config.ttl / 1000); // Convert to seconds
        await this.redis.setex(key, ttl, JSON.stringify(memories));
    }
    /**
     * Get cached memories by tier
     */
    async getCachedMemories(tenantId, userId, tier) {
        const key = `memory:tier:${tenantId}:${userId}:${tier}`;
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    /**
     * Auto-classify memory to appropriate tier based on content
     */
    classifyToTier(params) {
        const { type, content, data } = params;
        // L1: Working memory - current conversation, session context
        if (type === index_js_1.MemoryType.CONVERSATION || data?.sessionId) {
            return index_js_1.MemoryTier.L1_WORKING;
        }
        // L2: Episodic memory - recent events, interactions
        if (type === index_js_1.MemoryType.INTERACTION || type === index_js_1.MemoryType.CONTEXT) {
            return index_js_1.MemoryTier.L2_EPISODIC;
        }
        // L3: Procedural memory - instructions, how-tos, behaviors
        if (type === index_js_1.MemoryType.BEHAVIOR || content.toLowerCase().includes('how to') || content.toLowerCase().includes('instruction')) {
            return index_js_1.MemoryTier.L3_PROCEDURAL;
        }
        // L5: World knowledge - facts, external information
        if (content.startsWith('Fact:') || data?.source === 'external') {
            return index_js_1.MemoryTier.L5_WORLD;
        }
        // L4: Semantic memory - preferences, facts (default)
        return index_js_1.MemoryTier.L4_SEMANTIC;
    }
    /**
     * Evict old memories based on tier TTL
     */
    async evictExpiredMemories(tenantId, userId) {
        let evicted = 0;
        for (const tier of Object.values(index_js_1.MemoryTier)) {
            const config = index_js_1.MEMORY_TIER_CONFIG[tier];
            if (config.ttl <= 0)
                continue; // Never expire
            const cutoff = new Date(Date.now() - config.ttl);
            const result = await memoryModel_js_1.MemoryModel.deleteMany({
                tenantId,
                userId,
                tier,
                createdAt: { $lt: cutoff }
            });
            evicted += result.deletedCount;
        }
        return evicted;
    }
}
exports.MemoryService = MemoryService;
exports.memoryService = new MemoryService();
//# sourceMappingURL=memoryService.js.map