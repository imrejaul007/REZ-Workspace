"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dlqModel_js_1 = require("../models/dlqModel.js");
const router = express_1.default.Router();
/**
 * GET /api/dlq
 * List dead letter queue entries
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
        const { status, reason, limit, offset } = req.query;
        const filter = { tenantId };
        if (status)
            filter.status = status;
        if (reason)
            filter.reason = reason;
        const [entries, total] = await Promise.all([
            dlqModel_js_1.DLQModel.find(filter)
                .sort({ failedAt: -1 })
                .skip(offset ? parseInt(offset) : 0)
                .limit(limit ? parseInt(limit) : 50),
            dlqModel_js_1.DLQModel.countDocuments(filter)
        ]);
        res.json({
            success: true,
            data: entries,
            pagination: {
                total,
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
 * POST /api/dlq/:id/retry
 * Retry a failed event
 */
router.post('/:id/retry', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        const entry = await dlqModel_js_1.DLQModel.findOneAndUpdate({ _id: req.params.id, tenantId }, {
            $set: { status: 'retrying' },
            $inc: { retryCount: 1 }
        }, { new: true });
        if (!entry) {
            res.status(404).json({
                success: false,
                error: 'Entry not found'
            });
            return;
        }
        res.json({
            success: true,
            data: entry
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/dlq/:id/resolve
 * Mark a failed event as resolved
 */
router.post('/:id/resolve', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        const entry = await dlqModel_js_1.DLQModel.findOneAndUpdate({ _id: req.params.id, tenantId }, {
            $set: {
                status: 'resolved',
                resolvedAt: new Date(),
                resolvedBy: req.body.resolvedBy || 'manual'
            }
        }, { new: true });
        if (!entry) {
            res.status(404).json({
                success: false,
                error: 'Entry not found'
            });
            return;
        }
        res.json({
            success: true,
            data: entry
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/dlq/retry-all
 * Retry all pending entries
 */
router.post('/retry-all', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({
                success: false,
                error: 'Tenant ID required'
            });
            return;
        }
        const result = await dlqModel_js_1.DLQModel.updateMany({ tenantId, status: 'pending' }, {
            $set: { status: 'retrying' }
        });
        res.json({
            success: true,
            data: {
                updated: result.modifiedCount
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=dlq.js.map