import { Router, Response } from 'express';
import { z } from 'zod';
import { messagingService } from '../services/MessagingService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

const createConversationSchema = z.object({
  participants: z.array(z.object({
    userId: z.string(),
    role: z.enum(['owner', 'member', 'admin']).optional(),
  })).min(2),
  type: z.enum(['direct', 'group', 'support', 'campaign']),
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1),
  messageType: z.enum(['text', 'image', 'file', 'system', 'action']).optional(),
  metadata: z.record(z.unknown()).optional(),
  attachments: z.array(z.object({
    type: z.enum(['image', 'file']),
    url: z.string(),
    name: z.string(),
    size: z.number(),
  })).optional(),
});

const broadcastSchema = z.object({
  content: z.string().min(1),
  targetUsers: z.array(z.string()).optional(),
  targetRoles: z.array(z.enum(['owner', 'member', 'admin'])).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const notificationSchema = z.object({
  type: z.enum(['message', 'mention', 'system', 'campaign', 'alert']),
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).optional(),
  actionUrl: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

router.post('/conversations', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const conversation = await messagingService.createConversation(parsed.data);
    res.status(201).json(conversation);
  } catch (error) {
    logger.error('Error creating conversation', { error });
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/conversations', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, page = '1', limit = '50' } = req.query;
    const result = await messagingService.getUserConversations(req.userId!, {
      type: type as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.json({
      conversations: result.conversations,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Error fetching conversations', { error });
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversation = await messagingService.getConversation(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json(conversation);
  } catch (error) {
    logger.error('Error fetching conversation', { error });
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.delete('/conversations/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await messagingService.deleteConversation(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting conversation', { error });
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

router.put('/conversations/:id/settings', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notifications, isPinned } = req.body;
    const conversation = await messagingService.updateParticipantSettings(
      req.params.id,
      req.userId!,
      { notifications, isPinned }
    );

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json(conversation);
  } catch (error) {
    logger.error('Error updating conversation settings', { error });
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.post('/messages', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const message = await messagingService.sendMessage({
      ...parsed.data,
      senderId: req.userId!,
    });

    res.status(201).json(message);
  } catch (error) {
    logger.error('Error sending message', { error });
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get('/messages/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const message = await messagingService.getMessage(req.params.id);
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json(message);
  } catch (error) {
    logger.error('Error fetching message', { error });
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

router.get('/messages/conversation/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', before } = req.query;
    const result = await messagingService.getConversationMessages(req.params.id, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      before: before as string,
    });

    res.json({
      messages: result.messages,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Error fetching messages', { error });
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/messages/read', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId, messageIds } = req.body;
    await messagingService.markMessagesAsRead(conversationId, req.userId!, messageIds);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking messages as read', { error });
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

router.post('/messages/broadcast', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = broadcastSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const count = await messagingService.broadcastMessage({
      ...parsed.data,
      senderId: req.userId!,
      senderType: 'system',
    });

    res.json({ message: 'Broadcast sent', conversationsCount: count });
  } catch (error) {
    logger.error('Error broadcasting message', { error });
    res.status(500).json({ error: 'Failed to broadcast message' });
  }
});

router.get('/notifications', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', unreadOnly } = req.query;
    const result = await messagingService.getUserNotifications(req.userId!, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      unreadOnly: unreadOnly === 'true',
    });

    res.json({
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Error fetching notifications', { error });
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/notifications', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = notificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const notification = await messagingService.createNotification(parsed.data);
    res.status(201).json(notification);
  } catch (error) {
    logger.error('Error creating notification', { error });
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

router.put('/notifications/:id/read', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notification = await messagingService.markNotificationAsRead(req.params.id, req.userId!);
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json(notification);
  } catch (error) {
    logger.error('Error marking notification as read', { error });
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.put('/notifications/read-all', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await messagingService.markAllNotificationsAsRead(req.userId!);
    res.json({ success: true, count });
  } catch (error) {
    logger.error('Error marking all notifications as read', { error });
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;