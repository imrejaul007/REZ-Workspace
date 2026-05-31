"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const memoryService_js_1 = require("../services/memoryService.js");
const index_js_1 = require("../types/index.js");
const router = express_1.default.Router();
// ============================================================================
// MEMORY SCHEMAS
// ============================================================================
const StoreMemorySchema = zod_1.z.object({
    userId: zod_1.z.string(),
    entityType: zod_1.z.enum(['user', 'merchant', 'product', 'session']),
    entityId: zod_1.z.string(),
    type: zod_1.z.nativeEnum(index_js_1.MemoryType),
    content: zod_1.z.string(),
    data: zod_1.z.record(zod_1.z.any()).optional(),
    importance: zod_1.z.number().min(0).max(10).optional(),
    confidence: zod_1.z.number().min(0).max(1).optional(),
    source: zod_1.z.string().optional(),
    context: zod_1.z.object({
        channel: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        time: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional()
    }).optional(),
    validUntil: zod_1.z.string().datetime().optional()
});
// ============================================================================
// MEMORY ROUTES
// ============================================================================
/**
 * POST /api/memories
 * Store a new memory
 */
router.post('/', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const validated = StoreMemorySchema.parse(req.body);
        const memory = await memoryService_js_1.memoryService.storeMemory(tenantId, validated);
        res.status(201).json({ success: true, data: memory });
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
 * GET /api/memories
 * Get memories for a user
 */
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { userId, type, limit, offset, since } = req.query;
        if (!userId) {
            res.status(400).json({ success: false, error: 'userId required' });
            return;
        }
        const result = await memoryService_js_1.memoryService.getMemories({
            tenantId,
            userId: userId,
            type: type,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            since: since ? new Date(since) : undefined
        });
        res.json({
            success: true,
            data: result.memories,
            pagination: { total: result.total }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/memories/search
 * Search memories by content
 */
router.get('/search', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { userId, q, limit } = req.query;
        if (!userId || !q) {
            res.status(400).json({ success: false, error: 'userId and q required' });
            return;
        }
        const memories = await memoryService_js_1.memoryService.searchMemories({
            tenantId,
            userId: userId,
            query: q,
            limit: limit ? parseInt(limit) : undefined
        });
        res.json({ success: true, data: memories });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/memories/:id
 * Delete a memory
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        await memoryService_js_1.memoryService.deleteMemory(tenantId, req.params.id);
        res.json({ success: true, message: 'Memory deleted' });
    }
    catch (error) {
        next(error);
    }
});
// ============================================================================
// TIMELINE ROUTES
// ============================================================================
const TimelineEventSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    type: zod_1.z.string(),
    category: zod_1.z.string(),
    timestamp: zod_1.z.string().datetime().optional(),
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    data: zod_1.z.record(zod_1.z.any()).optional(),
    entityType: zod_1.z.string().optional(),
    entityId: zod_1.z.string().optional(),
    impact: zod_1.z.enum(['positive', 'negative', 'neutral']).optional(),
    value: zod_1.z.number().optional()
});
router.post('/timeline', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const validated = TimelineEventSchema.parse(req.body);
        const event = await memoryService_js_1.memoryService.addToTimeline(tenantId, {
            ...validated,
            timestamp: validated.timestamp ? new Date(validated.timestamp) : new Date()
        });
        res.status(201).json({ success: true, data: event });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
            return;
        }
        next(error);
    }
});
router.get('/timeline', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { userId, types, startDate, endDate, limit, offset } = req.query;
        const result = await memoryService_js_1.memoryService.getTimeline({
            tenantId,
            userId: userId,
            types: types ? types.split(',') : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        });
        res.json({
            success: true,
            data: result.events,
            pagination: { total: result.total }
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================================================
// MEMORY TIER ROUTES (Hojai Flow Architecture)
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
        const memories = await memoryService_js_1.memoryService.getMemoriesByTier({
            tenantId,
            userId: userId,
            entityId: entityId,
            tier: tier,
            limit: limit ? parseInt(limit) : undefined
        });
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
            : undefined;
        const result = await memoryService_js_1.memoryService.getFullContext({
            tenantId,
            userId: userId,
            entityId: entityId,
            includeTiers,
            maxItemsPerTier: maxItemsPerTier ? parseInt(maxItemsPerTier) : undefined
        });
        res.json({
            success: true,
            data: result,
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
        const { userId, entityId, entityType, type, content, data, tier, importance, confidence, source } = req.body;
        if (!userId || !entityId || !entityType || !type || !content) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, entityId, entityType, type, content'
            });
            return;
        }
        // Auto-assign tier if not provided
        const assignedTier = tier || memoryService_js_1.memoryService.classifyToTier({ type, content, data, source });
        const memory = await memoryService_js_1.memoryService.storeMemoryWithTier({
            tenantId,
            userId,
            entityId,
            entityType,
            type,
            content,
            data,
            tier: assignedTier,
            importance,
            confidence
        });
        res.status(201).json({
            success: true,
            data: memory,
            assignedTier
        });
    }
    catch (error) {
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
    const tier = memoryService_js_1.memoryService.classifyToTier({ type, content, data, source });
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
        const evicted = await memoryService_js_1.memoryService.evictExpiredMemories(tenantId, userId);
        res.json({ success: true, evicted });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=memory.js.map