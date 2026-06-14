import { Router, Response } from 'express';
import { messageService } from '../services/messageService.js';
import { channelService } from '../services/channelService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, validateRequest } from '../middleware/errorHandler.js';
import { createMessageSchema, addReactionSchema } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Send a message to a channel
 */
router.post(
  '/channels/:channelId/messages',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const messageData = {
      channelId: req.params.channelId,
      senderId: req.user!.userId,
      senderName: req.user!.name,
      senderAvatar: req.user!.avatar,
      content: req.body.content,
      threadId: req.body.threadId,
      messageType: req.body.messageType,
      attachments: req.body.attachments,
      mentions: req.body.mentions,
    };

    const validatedData = validateRequest(createMessageSchema)({
      ...req,
      body: messageData,
    } as any, res, () => {});

    const message = await messageService.sendMessage({
      ...validatedData,
      senderId: req.user!.userId,
      senderName: req.user!.name,
      senderAvatar: req.user!.avatar,
    });

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });
  })
);

/**
 * Get messages for a channel
 */
router.get(
  '/channels/:channelId/messages',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messages, hasMore } = await messageService.getChannelMessages(
      req.params.channelId,
      req.user!.userId,
      {
        before: req.query.before ? new Date(req.query.before as string) : undefined,
        after: req.query.after ? new Date(req.query.after as string) : undefined,
        limit: parseInt(req.query.limit as string) || 50,
      }
    );

    res.json({
      success: true,
      data: {
        items: messages,
        hasMore,
      },
    });
  })
);

/**
 * Get threads for a channel
 */
router.get(
  '/channels/:channelId/threads',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const threads = await messageService.getChannelThreads(
      req.params.channelId,
      req.user!.userId,
      {
        limit: parseInt(req.query.limit as string) || 20,
        before: req.query.before ? new Date(req.query.before as string) : undefined,
      }
    );

    res.json({
      success: true,
      data: threads,
    });
  })
);

/**
 * Get message by ID
 */
router.get(
  '/messages/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const message = await messageService.getMessage(req.params.id);

    res.json({
      success: true,
      data: message,
    });
  })
);

/**
 * Edit a message
 */
router.patch(
  '/messages/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const message = await messageService.editMessage(
      req.params.id,
      req.user!.userId,
      { content: req.body.content }
    );

    res.json({
      success: true,
      data: message,
      message: 'Message updated successfully',
    });
  })
);

/**
 * Delete a message (soft delete)
 */
router.delete(
  '/messages/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await messageService.deleteMessage(req.params.id, req.user!.userId);

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  })
);

/**
 * Add reaction to a message
 */
router.post(
  '/messages/:id/reactions',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = validateRequest(addReactionSchema)(req, res, () => {});

    const message = await messageService.addReaction(
      req.params.id,
      req.user!.userId,
      {
        ...validatedData,
        userId: req.user!.userId,
        userName: req.user!.name,
      }
    );

    res.json({
      success: true,
      data: message,
      message: 'Reaction added',
    });
  })
);

/**
 * Start a thread (reply to a message)
 */
router.post(
  '/messages/:id/thread',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const message = await messageService.startThread(
      req.params.id,
      req.user!.userId,
      req.user!.name,
      req.body.content
    );

    res.status(201).json({
      success: true,
      data: message,
      message: 'Thread reply sent',
    });
  })
);

/**
 * Get thread replies
 */
router.get(
  '/messages/:id/thread',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { messages, hasMore } = await messageService.getThreadReplies(
      req.params.id,
      req.user!.userId,
      {
        before: req.query.before ? new Date(req.query.before as string) : undefined,
        limit: parseInt(req.query.limit as string) || 50,
      }
    );

    res.json({
      success: true,
      data: {
        items: messages,
        hasMore,
      },
    });
  })
);

/**
 * Search messages in a channel
 */
router.get(
  '/channels/:channelId/search',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
      return;
    }

    const messages = await messageService.searchMessages(
      req.params.channelId,
      req.user!.userId,
      query,
      {
        limit: parseInt(req.query.limit as string) || 50,
        skip: parseInt(req.query.skip as string) || 0,
      }
    );

    res.json({
      success: true,
      data: messages,
    });
  })
);

/**
 * Get message stats for a channel
 */
router.get(
  '/channels/:channelId/stats',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Verify user is member
    const isMember = await channelService.isMember(req.params.channelId, req.user!.userId);
    if (!isMember) {
      res.status(403).json({
        success: false,
        error: 'You are not a member of this channel',
      });
      return;
    }

    const stats = await messageService.getChannelStats(req.params.channelId);

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * Get unread count for a channel
 */
router.get(
  '/channels/:channelId/unread',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const count = await messageService.getUnreadCount(req.params.channelId, req.user!.userId);

    res.json({
      success: true,
      data: { count },
    });
  })
);

/**
 * Get messages by sender
 */
router.get(
  '/users/:userId/messages',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Only allow users to see their own messages or if they're an admin
    if (req.params.userId !== req.user!.userId && !['admin', 'superadmin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const messages = await messageService.getMessagesBySender(req.params.userId, {
      limit: parseInt(req.query.limit as string) || 50,
      before: req.query.before ? new Date(req.query.before as string) : undefined,
    });

    res.json({
      success: true,
      data: messages,
    });
  })
);

export default router;
