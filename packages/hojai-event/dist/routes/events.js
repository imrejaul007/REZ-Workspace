"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const eventBus_js_1 = require("../services/eventBus.js");
const index_js_1 = require("../types/index.js");
const router = express_1.default.Router();
// ============================================================================
// SCHEMAS
// ============================================================================
const PublishEventSchema = zod_1.z.object({
    type: zod_1.z.string(),
    category: zod_1.z.nativeEnum(index_js_1.EventCategory),
    name: zod_1.z.string(),
    userId: zod_1.z.string().optional(),
    entityType: zod_1.z.string().optional(),
    entityId: zod_1.z.string().optional(),
    source: zod_1.z.string().optional(),
    sessionId: zod_1.z.string().optional(),
    channel: zod_1.z.string().optional(),
    location: zod_1.z.object({
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        city: zod_1.z.string().optional(),
        country: zod_1.z.string().optional()
    }).optional(),
    properties: zod_1.z.record(zod_1.z.any()).optional(),
    metrics: zod_1.z.record(zod_1.z.number()).optional(),
    context: zod_1.z.object({
        userAgent: zod_1.z.string().optional(),
        ip: zod_1.z.string().optional(),
        deviceType: zod_1.z.string().optional(),
        browser: zod_1.z.string().optional(),
        os: zod_1.z.string().optional(),
        referrer: zod_1.z.string().optional()
    }).optional()
});
const BatchPublishSchema = zod_1.z.object({
    events: zod_1.z.array(PublishEventSchema).min(1).max(100)
});
// ============================================================================
// EVENT ROUTES
// ============================================================================
/**
 * POST /api/events
 * Publish a single event
 */
router.post('/', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required (x-tenant-id header)'
            });
            return;
        }
        const validated = PublishEventSchema.parse(req.body);
        const event = await eventBus_js_1.eventBusService.publish(tenantId, validated);
        res.status(201).json({
            success: true,
            data: { eventId: event.id }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
            return;
        }
        next(error);
    }
});
/**
 * POST /api/events/batch
 * Publish multiple events in batch
 */
router.post('/batch', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        const validated = BatchPublishSchema.parse(req.body);
        const results = await Promise.allSettled(validated.events.map(event => eventBus_js_1.eventBusService.publish(tenantId, event)));
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        res.status(201).json({
            success: true,
            data: {
                total: validated.events.length,
                successful,
                failed,
                events: results.map((r, i) => ({
                    index: i,
                    success: r.status === 'fulfilled',
                    eventId: r.status === 'fulfilled' ? r.value.id : undefined,
                    error: r.status === 'rejected' ? r.reason?.message : undefined
                }))
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
            return;
        }
        next(error);
    }
});
/**
 * GET /api/events
 * Query historical events
 */
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        const { types, userId, startDate, endDate, limit, offset } = req.query;
        const result = await eventBus_js_1.eventBusService.query({
            tenantId,
            eventTypes: types ? types.split(',') : undefined,
            userId: userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        });
        res.json({
            success: true,
            data: result.events,
            pagination: {
                total: result.total,
                limit: limit ? parseInt(limit) : 100,
                offset: offset ? parseInt(offset) : 0
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/events/stats
 * Get event statistics
 */
router.get('/stats', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        const stats = await eventBus_js_1.eventBusService.getStats(tenantId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/events/types
 * Get all event types and their schemas
 */
router.get('/types', (req, res) => {
    const eventTypes = Object.values(index_js_1.EventType).map(type => ({
        type,
        category: type.split('.')[0]
    }));
    res.json({
        success: true,
        data: {
            categories: Object.values(index_js_1.EventCategory),
            types: eventTypes
        }
    });
});
/**
 * POST /api/events/replay
 * Replay events from a timestamp
 */
router.post('/replay', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        const { startDate, endDate, eventTypes, subscriptionId } = req.body;
        if (!startDate || !subscriptionId) {
            res.status(400).json({
                success: false,
                error: 'startDate and subscriptionId required'
            });
            return;
        }
        const result = await eventBus_js_1.eventBusService.replay({
            tenantId,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
            eventTypes,
            subscriptionId
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=events.js.map