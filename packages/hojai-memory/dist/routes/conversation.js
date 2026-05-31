"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const memoryService_js_1 = require("../services/memoryService.js");
const router = express_1.default.Router();
const AddMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string(),
    role: zod_1.z.enum(['user', 'assistant', 'system']),
    content: zod_1.z.string(),
    attachments: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['image', 'document', 'link']),
        url: zod_1.z.string()
    })).optional(),
    aiMetadata: zod_1.z.object({
        model: zod_1.z.string().optional(),
        tokens: zod_1.z.number().optional(),
        confidence: zod_1.z.number().optional(),
        intent: zod_1.z.string().optional()
    }).optional()
});
/**
 * GET /api/conversations
 * Get conversation
 */
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { userId, conversationId } = req.query;
        const conversation = await memoryService_js_1.memoryService.getConversation({
            tenantId,
            userId: userId,
            conversationId: conversationId
        });
        if (!conversation) {
            res.status(404).json({ success: false, error: 'Conversation not found' });
            return;
        }
        res.json({ success: true, data: conversation });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/conversations/messages
 * Add message to conversation
 */
router.post('/messages', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const validated = AddMessageSchema.parse(req.body);
        const message = await memoryService_js_1.memoryService.addMessage({
            tenantId,
            conversationId: validated.conversationId,
            message: {
                role: validated.role,
                content: validated.content,
                attachments: validated.attachments,
                aiMetadata: validated.aiMetadata
            }
        });
        res.status(201).json({ success: true, data: message });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
            return;
        }
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=conversation.js.map