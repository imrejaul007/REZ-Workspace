/**
 * REZ Assistant - Chat Route
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { chatService } from '../services/chat.js';

export const chatRouter = Router();

const sendMessageSchema = z.object({
  userId: z.string(),
  message: z.string().min(1),
  conversationId: z.string().optional(),
  context: z.record(z.any()).optional(),
});

// In-memory conversation storage
interface StoredConversation {
  id: string;
  userId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const conversations = new Map<string, StoredConversation>();

/**
 * POST /api/chat/message
 * Send a message and get AI response
 */
chatRouter.post('/message', asyncHandler(async (req: Request, res: Response) => {
  const { userId, message, conversationId, context } = sendMessageSchema.parse(req.body);

  logger.info('Chat message', { userId, messageLength: message.length });

  const response = await chatService.processMessage(userId, message, context);

  res.json({
    success: true,
    data: response,
  });
}));

/**
 * GET /api/chat/history/:userId
 * Get chat history
 */
chatRouter.get('/history/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit = '50' } = req.query;

  const history = await chatService.getHistory(userId, parseInt(limit as string, 10));

  res.json({
    success: true,
    data: history,
  });
}));

/**
 * DELETE /api/chat/history/:userId
 * Clear chat history
 */
chatRouter.delete('/history/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  await chatService.clearHistory(userId);

  res.json({
    success: true,
  });
}));

/**
 * POST /api/chat - Send message (alternative endpoint per spec)
 * Send a message and get AI response with conversation tracking
 */
chatRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { userId, message, conversationId } = req.body;

  if (!userId || !message) {
    res.status(400).json({ error: 'userId and message are required' });
    return;
  }

  let conversation: StoredConversation;

  if (conversationId && conversations.has(conversationId)) {
    conversation = conversations.get(conversationId)!;
  } else {
    // Create new conversation
    conversation = {
      id: uuidv4(),
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    conversations.set(conversation.id, conversation);
  }

  // Add user message
  const userMsg = {
    id: uuidv4(),
    role: 'user' as const,
    content: message,
    createdAt: new Date()
  };
  conversation.messages.push(userMsg);

  // Get AI response
  const { assistantMessage } = await chatService.processMessage(userId, message);

  // Add to conversation
  conversation.messages.push(assistantMessage);
  conversation.updatedAt = new Date();

  res.json({
    conversationId: conversation.id,
    message: assistantMessage
  });
}));

/**
 * GET /api/conversations - List all conversations for a user (per spec)
 */
chatRouter.get('/conversations', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'userId query parameter is required' });
    return;
  }

  const userConversations = Array.from(conversations.values())
    .filter(c => c.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map(conv => ({
      id: conv.id,
      userId: conv.userId,
      lastMessage: conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1].content
        : '',
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));

  res.json({ conversations: userConversations });
}));

/**
 * GET /api/conversations/:id - Get a specific conversation (per spec)
 */
chatRouter.get('/conversations/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const conversation = conversations.get(id);

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  res.json({
    id: conversation.id,
    userId: conversation.userId,
    messages: conversation.messages,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  });
}));

export { conversations };