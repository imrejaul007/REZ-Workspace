import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ConversationService, MessageService, SentimentService, SettingsService } from '../services';
import { PlatformConnectorService } from '../services/platform-connector.service';
import { AuthenticatedRequest, Platform, ConversationStatus, Priority } from '../types';
import { authenticate, extractAccountId, asyncHandler } from '../middleware';
import { createModuleLogger } from 'utils/logger.js';
import {
  PaginationSchema,
  ConversationFiltersSchema,
  UpdateConversationSchema,
  SnoozeSchema,
  ReplyToThreadSchema,
  SendMessageSchema,
} from '../utils/validators';

const logger = createModuleLogger('InboxRoutes');

export function createInboxRouter(
  conversationService: ConversationService,
  messageService: MessageService,
  sentimentService: SentimentService,
  settingsService: SettingsService,
  platformConnector: PlatformConnectorService
): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);
  router.use(extractAccountId);

  /**
   * GET /api/inbox
   * Get all conversations (aggregated)
   */
  router.get(
    '/',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const accountId = req.user!.accountId;

      const pagination = PaginationSchema.parse({
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      });

      const filters = ConversationFiltersSchema.parse({
        platform: req.query.platform,
        status: req.query.status,
        priority: req.query.priority,
        assignee: req.query.assignee,
        sentiment: req.query.sentiment,
        search: req.query.search,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      });

      const result = await conversationService.getConversations(accountId, filters, pagination);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    })
  );

  /**
   * GET /api/inbox/:platform
   * Get platform-specific conversations
   */
  router.get(
    '/:platform',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const accountId = req.user!.accountId;
      const platform = req.params.platform as Platform;

      const pagination = PaginationSchema.parse({
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      });

      const result = await conversationService.getConversationsByPlatform(
        accountId,
        platform,
        pagination
      );

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    })
  );

  /**
   * GET /api/inbox/thread/:id
   * Get conversation thread with messages
   */
  router.get(
    '/thread/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const conversationId = req.params.id;

      const conversation = await conversationService.getConversationById(conversationId);
      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      const pagination = PaginationSchema.parse({
        page: req.query.page,
        limit: req.query.limit,
      });

      const messages = await messageService.getThreadMessages(conversationId, pagination);

      res.json({
        success: true,
        data: {
          conversation,
          messages: messages.data,
          pagination: {
            page: messages.page,
            limit: messages.limit,
            total: messages.total,
            totalPages: messages.totalPages,
          },
        },
      });
    })
  );

  /**
   * POST /api/inbox/message
   * Send message (aggregate to platform)
   */
  router.post(
    '/message',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const validated = SendMessageSchema.parse(req.body);

      const message = await messageService.sendMessage({
        platform: validated.platform,
        platformConversationId: validated.platformConversationId,
        content: validated.content,
        mediaUrl: validated.mediaUrl,
        mediaType: validated.mediaType,
        recipientId: validated.recipientId,
        agentId: req.user?.id,
      });

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation:${message.conversationId}`).emit('message:new', {
          conversationId: message.conversationId,
          message,
        });
      }

      res.status(201).json({ success: true, data: message });
    })
  );

  /**
   * POST /api/inbox/reply/:id
   * Reply to thread
   */
  router.post(
    '/reply/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const conversationId = req.params.id;
      const validated = ReplyToThreadSchema.parse(req.body);

      const message = await messageService.replyToThread(conversationId, {
        content: validated.content,
        mediaUrl: validated.mediaUrl,
        mediaType: validated.mediaType,
        agentId: req.user?.id,
      });

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation:${conversationId}`).emit('message:new', {
          conversationId,
          message,
        });
      }

      res.status(201).json({ success: true, data: message });
    })
  );

  /**
   * POST /api/inbox/forward
   * Forward message
   */
  router.post(
    '/forward',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { messageId, targetConversationId } = req.body;

      const message = await messageService.forwardMessage(messageId, targetConversationId);

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation:${targetConversationId}`).emit('message:new', {
          conversationId: targetConversationId,
          message,
        });
      }

      res.status(201).json({ success: true, data: message });
    })
  );

  /**
   * POST /api/inbox/snooze
   * Snooze conversation
   */
  router.post(
    '/snooze',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { conversationId, duration } = req.body;
      const validated = SnoozeSchema.parse({ duration });

      const conversation = await conversationService.snoozeConversation(
        conversationId,
        validated.duration
      );

      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      res.json({ success: true, data: conversation });
    })
  );

  /**
   * POST /api/inbox/unsnooze
   * Unsnooze conversation
   */
  router.post(
    '/unsnooze',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { conversationId } = req.body;

      const conversation = await conversationService.unsnoozeConversation(conversationId);

      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      res.json({ success: true, data: conversation });
    })
  );

  /**
   * PATCH /api/inbox/thread/:id/assign
   * Assign conversation
   */
  router.patch(
    '/thread/:id/assign',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const conversationId = req.params.id;
      const { assignee } = req.body;

      if (!assignee) {
        res.status(400).json({ success: false, error: 'Assignee is required' });
        return;
      }

      const conversation = await conversationService.assignConversation(conversationId, assignee);

      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation:${conversationId}`).emit('conversation:updated', {
          conversation,
        });
      }

      res.json({ success: true, data: conversation });
    })
  );

  /**
   * PATCH /api/inbox/thread/:id/tags
   * Update tags
   */
  router.patch(
    '/thread/:id/tags',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const conversationId = req.params.id;
      const { tags } = req.body;

      if (!Array.isArray(tags)) {
        res.status(400).json({ success: false, error: 'Tags must be an array' });
        return;
      }

      const conversation = await conversationService.updateTags(conversationId, tags);

      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      res.json({ success: true, data: conversation });
    })
  );

  /**
   * PATCH /api/inbox/thread/:id/status
   * Update status (close, reopen)
   */
  router.patch(
    '/thread/:id/status',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const conversationId = req.params.id;
      const { status } = req.body;

      if (!status || !['active', 'closed', 'snoozed'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be: active, closed, or snoozed',
        });
        return;
      }

      const conversation = await conversationService.updateStatus(
        conversationId,
        status as ConversationStatus
      );

      if (!conversation) {
        res.status(404).json({ success: false, error: 'Conversation not found' });
        return;
      }

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation:${conversationId}`).emit('conversation:updated', {
          conversation,
        });
      }

      res.json({ success: true, data: conversation });
    })
  );

  /**
   * GET /api/inbox/stats
   * Get inbox statistics
   */
  router.get(
    '/stats',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const accountId = req.user!.accountId;
      const stats = await conversationService.getInboxStats(accountId);

      res.json({ success: true, data: stats });
    })
  );

  /**
   * POST /api/inbox/webhook/:platform
   * Webhook endpoint for platform events
   */
  router.post(
    '/webhook/:platform',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const platform = req.params.platform as Platform;
      const { body } = req;

      // Verify webhook token
      const verifyToken = req.query['hub.verify_token'] as string;
      if (verifyToken) {
        if (platformConnector.verifyWebhook(platform, verifyToken)) {
          res.send(req.query['hub.challenge']);
          return;
        }
        res.status(403).json({ success: false, error: 'Invalid verify token' });
        return;
      }

      // Parse webhook payload
      const webhookData = platformConnector.parseWebhook(platform, body);
      if (!webhookData) {
        res.status(400).json({ success: false, error: 'Invalid webhook payload' });
        return;
      }

      // Handle different events
      if (webhookData.event === 'message') {
        const data = webhookData.data;

        // Find or create conversation
        let conversation = await conversationService.getConversationByPlatformId(
          platform,
          data.recipientId as string
        );

        if (!conversation) {
          // Get user profile
          const userProfile = await platformConnector.getUserProfile(
            platform,
            data.senderId as string
          );

          conversation = await conversationService.createConversation({
            platform,
            platformConversationId: data.recipientId as string,
            user: {
              platformUserId: data.senderId as string,
              username: userProfile?.username || 'unknown',
              displayName: userProfile?.displayName || 'Unknown User',
              profileImage: userProfile?.profileImage,
              followerCount: userProfile?.followerCount,
            },
            accountId: req.user!.accountId,
          });
        }

        // Create message
        const message = await messageService.createMessage({
          conversationId: conversation._id.toString(),
          platform,
          platformMessageId: data.messageId as string,
          sender: {
            type: 'user',
            platformUserId: data.senderId as string,
          },
          content: (data.text as string) || '',
          timestamp: new Date(data.timestamp as string),
        });

        // Analyze sentiment and update conversation
        const sentiment = sentimentService.analyze(message.content);
        const priority = sentimentService.detectPriority(message.content);
        const tags = sentimentService.extractTags(message.content);

        await conversationService.updateConversation(conversation._id.toString(), {
          sentiment: sentiment.sentiment,
          priority,
          tags: [...new Set([...conversation.tags, ...tags])],
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
          io.to(`account:${req.user!.accountId}`).emit('message:new', {
            conversationId: conversation._id.toString(),
            message,
          });
        }
      }

      res.json({ success: true });
    })
  );

  return router;
}
