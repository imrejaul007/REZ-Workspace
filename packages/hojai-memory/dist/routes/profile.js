"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const memoryService_js_1 = require("../services/memoryService.js");
const router = express_1.default.Router();
const CreateProfileSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    name: zod_1.z.string().optional()
});
/**
 * GET /api/profiles
 * Get profile by identifier
 */
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { userId, email, phone } = req.query;
        const profile = await memoryService_js_1.memoryService.getProfile(tenantId, {
            userId: userId,
            email: email,
            phone: phone
        });
        if (!profile) {
            res.status(404).json({ success: false, error: 'Profile not found' });
            return;
        }
        res.json({ success: true, data: profile });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/profiles
 * Create a new profile
 */
router.post('/', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const validated = CreateProfileSchema.parse(req.body);
        const profile = await memoryService_js_1.memoryService.createProfile({ tenantId, ...validated });
        res.status(201).json({ success: true, data: profile });
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
 * PATCH /api/profiles
 * Update profile
 */
router.patch('/', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { userId, email, phone, ...updates } = req.body;
        const profile = await memoryService_js_1.memoryService.updateProfile(tenantId, { userId, email, phone }, updates);
        if (!profile) {
            res.status(404).json({ success: false, error: 'Profile not found' });
            return;
        }
        res.json({ success: true, data: profile });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=profile.js.map