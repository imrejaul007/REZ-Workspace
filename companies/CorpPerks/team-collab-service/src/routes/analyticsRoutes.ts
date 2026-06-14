import { Router, Response } from 'express';
import { channelService } from '../services/channelService.js';
import { messageService } from '../services/messageService.js';
import { announcementService } from '../services/announcementService.js';
import { meetingService } from '../services/meetingService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get channel analytics
 */
router.get(
  '/channels',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.query.companyId as string || req.user!.companyId;
    const channels = await channelService.getChannelsForUser(req.user!.userId, companyId);

    const channelStats = await Promise.all(
      channels.map(async (channel) => {
        const stats = await messageService.getChannelStats(channel.channelId);
        return {
          channelId: channel.channelId,
          name: channel.name,
          type: channel.type,
          memberCount: channel.memberCount,
          messageCount: stats.totalMessages,
          messagesByType: stats.messagesByType,
          topSenders: stats.topSenders.slice(0, 5),
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalChannels: channels.length,
        channels: channelStats,
      },
    });
  })
);

/**
 * Get message analytics for a channel
 */
router.get(
  '/channels/:channelId',
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

    const channel = await channelService.getChannel(req.params.channelId);
    const stats = await messageService.getChannelStats(req.params.channelId);

    res.json({
      success: true,
      data: {
        channelId: channel.channelId,
        name: channel.name,
        type: channel.type,
        memberCount: channel.memberCount,
        totalMessages: stats.totalMessages,
        messagesByType: stats.messagesByType,
        topSenders: stats.topSenders,
        period: req.query.period || 'all_time',
      },
    });
  })
);

/**
 * Get announcement analytics
 */
router.get(
  '/announcements',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.query.companyId as string || req.user!.companyId;
    const stats = await announcementService.getStats(companyId);

    res.json({
      success: true,
      data: {
        ...stats,
        period: req.query.period || 'all_time',
      },
    });
  })
);

/**
 * Get meeting analytics
 */
router.get(
  '/meetings',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await meetingService.getStats(
      req.user!.userId,
      req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      req.query.endDate ? new Date(req.query.endDate as string) : undefined
    );

    res.json({
      success: true,
      data: {
        ...stats,
        period: req.query.period || 'all_time',
      },
    });
  })
);

/**
 * Get user activity summary
 */
router.get(
  '/user/:userId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Only allow users to see their own stats or if admin
    if (req.params.userId !== req.user!.userId && !['admin', 'superadmin'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const userId = req.params.userId;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    // Get messages sent by user
    const messages = await messageService.getMessagesBySender(userId, { limit: 1000 });
    const messagesInPeriod = startDate && endDate
      ? messages.filter((m) => m.createdAt >= startDate && m.createdAt <= endDate)
      : messages;

    // Get action items assigned to user
    const actionItems = await meetingService.getActionItemsForUser(userId, { limit: 100 });

    // Calculate stats
    const completedActionItems = actionItems.filter((a) => a.completed);
    const pendingActionItems = actionItems.filter((a) => !a.completed);
    const overdueActionItems = pendingActionItems.filter(
      (a) => a.dueDate && new Date(a.dueDate) < new Date()
    );

    // Get channels user is member of
    const channels = await channelService.getChannelsForUser(userId, req.user!.companyId);

    res.json({
      success: true,
      data: {
        messagesSent: messagesInPeriod.length,
        actionItemsAssigned: actionItems.length,
        actionItemsCompleted: completedActionItems.length,
        actionItemsPending: pendingActionItems.length,
        actionItemsOverdue: overdueActionItems.length,
        channelsActive: channels.length,
        period: startDate && endDate ? { start: startDate, end: endDate } : 'all_time',
      },
    });
  })
);

/**
 * Get real-time activity feed
 */
router.get(
  '/activity',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const channelId = req.query.channelId as string;

    let activity: Array<{
      type: 'message' | 'meeting' | 'announcement';
      data: unknown;
      timestamp: Date;
    }> = [];

    // Get recent messages
    if (channelId) {
      const isMember = await channelService.isMember(channelId, req.user!.userId);
      if (isMember) {
        const messages = await messageService.getChannelMessages(channelId, req.user!.userId, {
          limit,
        });
        activity = messages.messages.map((m) => ({
          type: 'message' as const,
          data: m,
          timestamp: m.createdAt,
        }));
      }
    } else {
      // Get activity across all user's channels
      const channels = await channelService.getChannelsForUser(req.user!.userId, req.user!.companyId);
      const recentMessages = await Promise.all(
        channels.slice(0, 5).map(async (channel) => {
          const { messages } = await messageService.getChannelMessages(channel.channelId, req.user!.userId, {
            limit: 3,
          });
          return messages.map((m) => ({
            type: 'message' as const,
            data: { ...m.toObject(), channelName: channel.name },
            timestamp: m.createdAt,
          }));
        })
      );
      activity = recentMessages.flat().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    res.json({
      success: true,
      data: activity.slice(0, limit),
    });
  })
);

/**
 * Get collaboration score for user
 */
router.get(
  '/score/:userId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.userId;

    // Get user activity
    const messages = await messageService.getMessagesBySender(userId, { limit: 500 });
    const actionItems = await meetingService.getActionItemsForUser(userId, { limit: 100 });
    const channels = await channelService.getChannelsForUser(userId, req.user!.companyId);

    // Calculate scores
    const messageScore = Math.min(messages.length * 2, 100);
    const actionItemScore = actionItems.filter((a) => a.completed).length * 10;
    const engagementScore = channels.length * 5;

    const totalScore = Math.min(messageScore + actionItemScore + engagementScore, 100);

    // Score breakdown
    const breakdown = {
      communication: {
        score: messageScore,
        max: 100,
        label: 'Communication',
        metrics: {
          messagesSent: messages.length,
        },
      },
      accountability: {
        score: Math.min(actionItemScore, 100),
        max: 100,
        label: 'Accountability',
        metrics: {
          actionItemsCompleted: actionItems.filter((a) => a.completed).length,
          totalActionItems: actionItems.length,
        },
      },
      engagement: {
        score: Math.min(engagementScore, 100),
        max: 100,
        label: 'Engagement',
        metrics: {
          channelsJoined: channels.length,
        },
      },
    };

    res.json({
      success: true,
      data: {
        userId,
        totalScore,
        breakdown,
        calculatedAt: new Date(),
      },
    });
  })
);

export default router;
