"use strict";
/**
 * Memory Tier Routes - Hojai Flow Architecture
 * Implements L1-L5 memory tiering with local-first priority
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
const router = express_1.default.Router();
// ============================================================================
// MODELS (local to avoid import issues)
// ============================================================================
const MemoryTierSchema = new mongoose_1.default.Schema({
    id: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    entityType: { type: String, enum: ['user', 'merchant', 'product', 'session'], required: true },
    entityId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    tier: { type: String, enum: Object.values(index_js_1.MemoryTier), default: index_js_1.MemoryTier.L4_SEMANTIC },
    content: { type: String, required: true },
    data: mongoose_1.default.Schema.Types.Mixed,
    importance: { type: Number, default: 5 },
    confidence: { type: Number, default: 0.7 },
    source: String,
    eventId: String,
    context: {
        channel: String,
        location: String,
        time: String,
        tags: [String]
    },
    validFrom: Date,
    validUntil: Date,
    isPrivate: Boolean,
    sharedWith: [String],
    lastAccessedAt: Date,
    accessCount: { type: Number, default: 0 }
}, { timestamps: true });
MemoryTierSchema.index({ tenantId: 1, userId: 1, tier: 1 });
const MemoryTierModel = mongoose_1.default.models.MemoryTier || mongoose_1.default.model('MemoryTier', MemoryTierSchema);
// ============================================================================
// SCHEMAS
// ============================================================================
const StoreMemoryWithTierSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    entityId: zod_1.z.string(),
    entityType: zod_1.z.enum(['user', 'merchant', 'product', 'session']),
    type: zod_1.z.string(),
    content: zod_1.z.string(),
    data: zod_1.z.record(zod_1.z.any()).optional(),
    tier: zod_1.z.nativeEnum(index_js_1.MemoryTier).optional(),
    importance: zod_1.z.number().min(0).max(10).optional(),
    confidence: zod_1.z.number().min(0).max(1).optional(),
    source: zod_1.z.string().optional()
});
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Classify content to appropriate tier
 */
function classifyToTier(params) {
    const { type, content, data } = params;
    // L1: Working memory - current conversation, session context
    if (type === 'conversation' || data?.sessionId) {
        return index_js_1.MemoryTier.L1_WORKING;
    }
    // L2: Episodic memory - recent events, interactions
    if (type === 'interaction' || type === 'context') {
        return index_js_1.MemoryTier.L2_EPISODIC;
    }
    // L3: Procedural memory - instructions, how-tos, behaviors
    if (type === 'behavior' || content.toLowerCase().includes('how to') || content.toLowerCase().includes('instruction')) {
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
 * Build context string from memories
 */
function buildContextString(memories) {
    const byTier = {};
    for (const m of memories) {
        if (!byTier[m.tier])
            byTier[m.tier] = [];
        byTier[m.tier].push(m.content);
    }
    const parts = [];
    for (const tier of Object.values(index_js_1.MemoryTier)) {
        const config = index_js_1.MEMORY_TIER_CONFIG[tier];
        const contents = byTier[tier];
        if (!contents || contents.length === 0)
            continue;
        parts.push(`\n=== ${config.name} (${tier}) ===`);
        parts.push(`Relevance: ${config.description}`);
        for (const content of contents.slice(0, 10)) {
            parts.push(`- ${content}`);
        }
    }
    return parts.join('\n');
}
// ============================================================================
// ROUTES
// ============================================================================
/**
 * GET /api/memories/tiers
 * Get all available memory tiers
 */
router.get('/tiers', async (req, res) => {
    const tiers = Object.entries(index_js_1.MEMORY_TIER_CONFIG).map(([key, config]) => ({
        tier: key,
        name: config.name,
        description: config.description,
        priority: config.priority,
        storage: config.storage,
        ttl: config.ttl,
        maxItems: config.maxItems
    }));
    res.json({ success: true, data: tiers });
});
/**
 * GET /api/memories/by-tier/:tier
 * Get memories from a specific tier
 */
router.get('/by-tier/:tier', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { tier } = req.params;
        if (!Object.values(index_js_1.MemoryTier).includes(tier)) {
            res.status(400).json({
                success: false,
                error: 'Invalid tier',
                validTiers: Object.values(index_js_1.MemoryTier)
            });
            return;
        }
        const { userId, entityId, limit } = req.query;
        if (!userId) {
            res.status(400).json({ success: false, error: 'userId required' });
            return;
        }
        const filter = {
            tenantId,
            userId: userId,
            tier
        };
        if (entityId) {
            filter.entityId = entityId;
        }
        const memories = await MemoryTierModel.find(filter)
            .sort({ importance: -1, createdAt: -1 })
            .limit(limit ? parseInt(limit) : index_js_1.MEMORY_TIER_CONFIG[tier].maxItems);
        res.json({ success: true, data: memories, tier });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/memories/context
 * Get full context from all tiers (L1 → L5 priority)
 * This implements Hojai Flow's "Memory Before Models" principle
 */
router.get('/context', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { userId, entityId, tiers, maxItemsPerTier } = req.query;
        if (!userId) {
            res.status(400).json({ success: false, error: 'userId required' });
            return;
        }
        const includeTiers = tiers
            ? tiers.split(',').filter(t => Object.values(index_js_1.MemoryTier).includes(t))
            : Object.values(index_js_1.MemoryTier);
        const byTier = {};
        const allMemories = [];
        // Fetch from each tier in priority order (L1 first)
        for (const tier of includeTiers.sort((a, b) => index_js_1.MEMORY_TIER_CONFIG[a].priority - index_js_1.MEMORY_TIER_CONFIG[b].priority)) {
            const filter = { tenantId, userId: userId, tier };
            if (entityId)
                filter.entityId = entityId;
            const memories = await MemoryTierModel.find(filter)
                .sort({ importance: -1, createdAt: -1 })
                .limit(maxItemsPerTier ? parseInt(maxItemsPerTier) : index_js_1.MEMORY_TIER_CONFIG[tier].maxItems);
            byTier[tier] = memories;
            allMemories.push(...memories);
        }
        const context = buildContextString(allMemories);
        res.json({
            success: true,
            data: {
                memories: allMemories,
                byTier,
                context
            },
            priority: 'L1 → L2 → L3 → L4 → L5 (local-first)'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/memories/by-tier
 * Store memory with automatic tier classification
 */
router.post('/by-tier', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const validated = StoreMemoryWithTierSchema.parse(req.body);
        // Auto-assign tier if not provided
        const assignedTier = validated.tier || classifyToTier({
            type: validated.type,
            content: validated.content,
            data: validated.data,
            source: validated.source
        });
        const memory = await MemoryTierModel.create({
            id: (0, uuid_1.v4)(),
            tenantId,
            userId: validated.userId,
            entityId: validated.entityId,
            entityType: validated.entityType,
            type: validated.type,
            tier: assignedTier,
            content: validated.content,
            data: validated.data,
            importance: validated.importance ?? 5,
            confidence: validated.confidence ?? 0.7,
            source: validated.source,
            isPrivate: false
        });
        res.status(201).json({
            success: true,
            data: memory,
            assignedTier
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
            return;
        }
        next(error);
    }
});
/**
 * POST /api/memories/classify-tier
 * Classify content to appropriate tier without storing
 */
router.post('/classify-tier', async (req, res) => {
    const { type, content, data, source } = req.body;
    if (!type || !content) {
        res.status(400).json({ success: false, error: 'type and content required' });
        return;
    }
    const tier = classifyToTier({ type, content, data, source });
    res.json({
        success: true,
        data: {
            tier,
            name: index_js_1.MEMORY_TIER_CONFIG[tier].name,
            description: index_js_1.MEMORY_TIER_CONFIG[tier].description,
            priority: index_js_1.MEMORY_TIER_CONFIG[tier].priority
        }
    });
});
/**
 * POST /api/memories/evict
 * Evict expired memories
 */
router.post('/evict', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ success: false, error: 'userId required' });
            return;
        }
        let evicted = 0;
        for (const tier of Object.values(index_js_1.MemoryTier)) {
            const config = index_js_1.MEMORY_TIER_CONFIG[tier];
            if (config.ttl <= 0)
                continue; // Never expire
            const cutoff = new Date(Date.now() - config.ttl);
            const result = await MemoryTierModel.deleteMany({
                tenantId,
                userId,
                tier,
                createdAt: { $lt: cutoff }
            });
            evicted += result.deletedCount;
        }
        res.json({ success: true, evicted });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=memoryTierRoutes.js.map