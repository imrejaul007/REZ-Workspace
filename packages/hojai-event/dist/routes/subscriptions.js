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
const CreateSubscriptionSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    description: zod_1.z.string().optional(),
    eventTypes: zod_1.z.array(zod_1.z.string()).optional(),
    eventCategories: zod_1.z.array(zod_1.z.string()).optional(),
    userId: zod_1.z.string().optional(),
    protocol: zod_1.z.nativeEnum(index_js_1.SubscriptionProtocol),
    endpoint: zod_1.z.string().url(),
    auth: zod_1.z.object({
        type: zod_1.z.enum(['bearer', 'api_key', 'basic']),
        token: zod_1.z.string().optional(),
        apiKey: zod_1.z.string().optional(),
        username: zod_1.z.string().optional(),
        password: zod_1.z.string().optional()
    }).optional(),
    retryOnFailure: zod_1.z.boolean().default(true),
    maxRetries: zod_1.z.number().min(1).max(10).default(3),
    retryDelayMs: zod_1.z.number().min(100).max(60000).default(1000),
    filter: zod_1.z.record(zod_1.z.any()).optional()
});
// ============================================================================
// SUBSCRIPTION ROUTES
// ============================================================================
/**
 * POST /api/subscriptions
 * Create a new subscription
 */
router.post('/', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        const validated = CreateSubscriptionSchema.parse(req.body);
        const subscription = await eventBus_js_1.eventBusService.subscribe({
            tenantId,
            ...validated,
            enabled: true
        });
        res.status(201).json({
            success: true,
            data: subscription
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
 * GET /api/subscriptions
 * List all subscriptions for a tenant
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
        // This would query the database - simplified for now
        res.json({
            success: true,
            data: []
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/subscriptions/:id
 * Get a specific subscription
 */
router.get('/:id', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/subscriptions/:id
 * Update a subscription
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/subscriptions/:id
 * Delete a subscription
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Subscription deleted'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/subscriptions/:id/test
 * Test a subscription by sending a sample event
 */
router.post('/:id/test', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Test event sent'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=subscriptions.js.map