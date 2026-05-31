"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const tenantManager_js_1 = require("../services/tenant/tenantManager.js");
const rbacService_js_1 = require("../services/rbac/rbacService.js");
const index_js_1 = require("../../types/index.js");
const router = express_1.default.Router();
// ============================================================================
// SCHEMAS
// ============================================================================
const CreateTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    type: zod_1.z.nativeEnum(index_js_1.TenantType),
    tier: zod_1.z.nativeEnum(index_js_1.TenantTier).optional(),
    namespace: zod_1.z.string().regex(/^[a-z0-9-]+$/).optional(),
    features: zod_1.z.object({
        eventIngestion: zod_1.z.boolean().optional(),
        memoryStorage: zod_1.z.boolean().optional(),
        vectorSearch: zod_1.z.boolean().optional(),
        workflowRuntime: zod_1.z.boolean().optional(),
        agentRuntime: zod_1.z.boolean().optional(),
        whatsappAI: zod_1.z.boolean().optional(),
        hyperlocal: zod_1.z.boolean().optional()
    }).optional()
});
const UpdateTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    tier: zod_1.z.nativeEnum(index_js_1.TenantTier).optional(),
    status: zod_1.z.nativeEnum(index_js_1.TenantStatus).optional()
});
// ============================================================================
// TENANT ROUTES
// ============================================================================
/**
 * POST /api/tenants
 * Create a new tenant
 */
router.post('/', async (req, res, next) => {
    try {
        const validated = CreateTenantSchema.parse(req.body);
        const tenant = await tenantManager_js_1.tenantManager.createTenant({
            name: validated.name,
            type: validated.type,
            tier: validated.tier ?? index_js_1.TenantTier.FREE,
            namespace: validated.namespace,
            features: validated.features
        });
        // Initialize RBAC roles for the tenant
        await rbacService_js_1.rbacService.initializeTenantRoles(tenant.id);
        res.status(201).json({
            success: true,
            data: tenant
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
        if (error.message.includes('already exists')) {
            res.status(409).json({
                success: false,
                error: error.message
            });
            return;
        }
        next(error);
    }
});
/**
 * GET /api/tenants
 * List all tenants (admin only)
 */
router.get('/', async (req, res, next) => {
    try {
        const { type, status, tier, limit, offset } = req.query;
        const result = await tenantManager_js_1.tenantManager.listTenants({
            type: type,
            status: status,
            tier: tier,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        });
        res.json({
            success: true,
            data: result.tenants,
            pagination: {
                total: result.total,
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/tenants/:id
 * Get tenant by ID
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenant = await tenantManager_js_1.tenantManager.getTenant(id);
        if (!tenant) {
            res.status(404).json({
                success: false,
                error: 'Tenant not found'
            });
            return;
        }
        // Include namespace map
        const namespaceMap = tenantManager_js_1.tenantManager.buildNamespaceMap(tenant);
        res.json({
            success: true,
            data: {
                ...tenant,
                namespaceMap
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/tenants/namespace/:namespace
 * Get tenant by namespace
 */
router.get('/namespace/:namespace', async (req, res, next) => {
    try {
        const { namespace } = req.params;
        const tenant = await tenantManager_js_1.tenantManager.getTenantByNamespace(namespace);
        if (!tenant) {
            res.status(404).json({
                success: false,
                error: 'Tenant not found'
            });
            return;
        }
        res.json({
            success: true,
            data: tenant
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/tenants/:id
 * Update tenant
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const validated = UpdateTenantSchema.parse(req.body);
        const tenant = await tenantManager_js_1.tenantManager.updateTenant(id, validated);
        if (!tenant) {
            res.status(404).json({
                success: false,
                error: 'Tenant not found'
            });
            return;
        }
        res.json({
            success: true,
            data: tenant
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
 * POST /api/tenants/:id/suspend
 * Suspend tenant
 */
router.post('/:id/suspend', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const tenant = await tenantManager_js_1.tenantManager.suspendTenant(id, reason);
        if (!tenant) {
            res.status(404).json({
                success: false,
                error: 'Tenant not found'
            });
            return;
        }
        res.json({
            success: true,
            data: tenant,
            message: 'Tenant suspended'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/tenants/:id/activate
 * Activate tenant
 */
router.post('/:id/activate', async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenant = await tenantManager_js_1.tenantManager.activateTenant(id);
        if (!tenant) {
            res.status(404).json({
                success: false,
                error: 'Tenant not found'
            });
            return;
        }
        res.json({
            success: true,
            data: tenant,
            message: 'Tenant activated'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/tenants/:id/tier
 * Update tenant tier
 */
router.post('/:id/tier', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tier } = req.body;
        if (!tier || !Object.values(index_js_1.TenantTier).includes(tier)) {
            res.status(400).json({
                success: false,
                error: 'Invalid tier'
            });
            return;
        }
        const tenant = await tenantManager_js_1.tenantManager.updateTier(id, tier);
        if (!tenant) {
            res.status(404).json({
                success: false,
                error: 'Tenant not found'
            });
            return;
        }
        res.json({
            success: true,
            data: tenant,
            message: `Tier updated to ${tier}`
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/tenants/:id/quota
 * Check tenant quota
 */
router.get('/:id/quota/:metric', async (req, res, next) => {
    try {
        const { id, metric } = req.params;
        const { value } = req.query;
        const allowedMetrics = [
            'eventsPerMonth',
            'memoryStorageMB',
            'apiCallsPerDay',
            'workflows',
            'agents',
            'users'
        ];
        if (!allowedMetrics.includes(metric)) {
            res.status(400).json({
                success: false,
                error: `Invalid metric. Allowed: ${allowedMetrics.join(', ')}`
            });
            return;
        }
        const result = await tenantManager_js_1.tenantManager.checkQuota(id, metric, parseInt(value) || 0);
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
//# sourceMappingURL=tenantRoutes.js.map