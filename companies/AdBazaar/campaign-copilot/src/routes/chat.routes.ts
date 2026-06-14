import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import {
  processChat,
  getConversation,
  listConversations,
  getProactiveSuggestions,
} from '../services/conversation.service.js';
import { getCampaignContext } from '../services/campaign.service.js';
import { logger } from '../services/logger.js';

const router = Router();

// Validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().uuid().optional(),
  campaignId: z.string().optional(),
});

const suggestRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  triggerType: z.enum(['idle', 'performance_drop', 'budget_alert', 'opportunity']).optional(),
});

/**
 * POST /api/copilot/chat
 * Send a message to the copilot
 */
router.post('/chat', authMiddleware, asyncHandler(async (req, res) => {
  const { message, conversationId, campaignId } = chatRequestSchema.parse(req.body);
  const advertiserId = req.user!.advertiserId;

  logger.info('Chat request received', {
    advertiserId,
    conversationId,
    campaignId,
    messageLength: message.length,
  });

  const result = await processChat(
    { message, conversationId, campaignId },
    advertiserId
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}));

/**
 * GET /api/copilot/conversations/:id
 * Get conversation by ID
 */
router.get('/conversations/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const conversation = await getConversation(id);

  if (!conversation) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found',
    });
    return;
  }

  // Verify ownership
  if (conversation.advertiserId !== req.user!.advertiserId) {
    res.status(403).json({
      success: false,
      error: 'Access denied',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      conversationId: conversation.conversationId,
      advertiserId: conversation.advertiserId,
      campaignId: conversation.campaignId,
      messages: conversation.messages,
      context: conversation.context,
      status: conversation.status,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    },
  });
}));

/**
 * GET /api/copilot/conversations
 * List all conversations for the advertiser
 */
router.get('/conversations', authMiddleware, asyncHandler(async (req, res) => {
  const advertiserId = req.user!.advertiserId;
  const status = req.query.status as 'active' | 'archived' | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await listConversations(advertiserId, status, limit, offset);

  res.status(200).json({
    success: true,
    data: {
      conversations: result.conversations.map(c => ({
        conversationId: c.conversationId,
        advertiserId: c.advertiserId,
        campaignId: c.campaignId,
        messageCount: c.messages.length,
        status: c.status,
        lastMessage: c.messages[c.messages.length - 1]?.content.substring(0, 100),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      total: result.total,
      limit,
      offset,
    },
  });
}));

/**
 * POST /api/copilot/suggest
 * Get proactive suggestions
 */
router.post('/suggest', authMiddleware, asyncHandler(async (req, res) => {
  const { conversationId, triggerType } = suggestRequestSchema.parse(req.body);
  const advertiserId = req.user!.advertiserId;

  // Get advertiserId from conversation if provided
  let targetAdvertiserId = advertiserId;
  if (conversationId) {
    const conversation = await getConversation(conversationId);
    if (conversation && conversation.advertiserId === advertiserId) {
      targetAdvertiserId = conversation.advertiserId;
    }
  }

  const suggestions = await getProactiveSuggestions(
    targetAdvertiserId,
    triggerType || 'idle'
  );

  res.status(200).json({
    success: true,
    data: {
      suggestions,
      conversationId,
      generatedAt: new Date().toISOString(),
    },
  });
}));

/**
 * GET /api/copilot/campaigns/:id/context
 * Get campaign context for copilot
 */
router.get('/campaigns/:id/context', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const advertiserId = req.user!.advertiserId;

  const context = await getCampaignContext(id, advertiserId);

  if (!context) {
    res.status(404).json({
      success: false,
      error: 'Campaign not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: context,
  });
}));

export default router;