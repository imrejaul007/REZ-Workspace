/**
 * Message Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { messageService } from '../services/message.service';

const router = Router();

// Validation schemas
const SendMessageSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().min(1),
  recipientType: z.enum(['guest', 'staff', 'hotel', 'system']),
  subject: z.string().max(200).optional(),
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'document', 'system', 'template']).optional(),
  templateId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

const CreateConversationSchema = z.object({
  hotelId: z.string().min(1),
  guestId: z.string().min(1),
  guestName: z.string().min(1),
  guestPhone: z.string().optional(),
  guestEmail: z.string().email().optional(),
  bookingId: z.string().optional(),
  initialMessage: z.string().max(1000).optional(),
  source: z.enum(['pre_stay', 'in_stay', 'post_stay', 'support', 'marketing']).optional(),
});

const BulkMessageSchema = z.object({
  hotelId: z.string().min(1),
  guestIds: z.array(z.string()).min(1).max(1000),
  subject: z.string().max(200).optional(),
  content: z.string().min(1).max(5000),
  type: z.enum(['announcement', 'promotion', 'reminder', 'survey']).optional(),
  scheduleTime: z.string().datetime().optional(),
});

// POST /api/conversations - Create conversation
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const validated = CreateConversationSchema.parse(req.body);
    const conversation = await messageService.createConversation(validated);

    res.status(201).json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create conversation' },
    });
  }
});

// GET /api/conversations - List conversations
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { hotelId, status = 'active', page = '1', limit = '20' } = req.query;

    const conversations = await messageService.getConversations(
      hotelId as string,
      status as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get conversations' },
    });
  }
});

// GET /api/conversations/:conversationId - Get conversation
router.get('/conversations/:conversationId', async (req: Request, res: Response) => {
  try {
    const conversation = await messageService.getConversation(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      });
    }

    res.json({ success: true, data: { conversation } });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get conversation' },
    });
  }
});

// POST /api/messages/send - Send message
router.post('/messages/send', async (req: Request, res: Response) => {
  try {
    const validated = SendMessageSchema.parse(req.body);
    const message = await messageService.sendMessage(validated);

    res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to send message' },
    });
  }
});

// GET /api/messages/conversation/:conversationId - Get messages
router.get('/messages/conversation/:conversationId', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const messages = await messageService.getConversationMessages(
      req.params.conversationId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get messages' },
    });
  }
});

// PUT /api/messages/read - Mark as read
router.put('/messages/read', async (req: Request, res: Response) => {
  try {
    const { messageIds, readBy } = req.body;

    if (!messageIds || !readBy) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'messageIds and readBy are required' },
      });
    }

    await messageService.markMessagesAsRead(messageIds, readBy);

    res.json({
      success: true,
      message: `${messageIds.length} messages marked as read`,
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to mark messages as read' },
    });
  }
});

// POST /api/messages/bulk - Bulk message
router.post('/messages/bulk', async (req: Request, res: Response) => {
  try {
    const validated = BulkMessageSchema.parse(req.body);
    const result = await messageService.sendBulkMessage(validated);

    res.json({
      success: true,
      data: { result },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Bulk message error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to send bulk message' },
    });
  }
});

export default router;
