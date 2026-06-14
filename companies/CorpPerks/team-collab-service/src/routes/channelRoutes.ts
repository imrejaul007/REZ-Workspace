import { Router, Response } from 'express';
import { channelService } from '../services/channelService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, validateRequest } from '../middleware/errorHandler.js';
import { createChannelSchema, updateChannelSchema } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Create a new channel
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = validateRequest(createChannelSchema)(req, res, () => {});

    const channel = await channelService.createChannel({
      ...validatedData,
      createdBy: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      data: channel,
      message: 'Channel created successfully',
    });
  })
);

/**
 * List channels for company
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.query.companyId as string || req.user!.companyId;
    const { channels, total, page, limit } = await channelService.listChannels(companyId, {
      includeArchived: req.query.includeArchived === 'true',
      type: req.query.type as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    });

    res.json({
      success: true,
      data: {
        items: channels,
        total,
        page,
        limit,
        hasMore: page * limit < total,
      },
    });
  })
);

/**
 * Get channels for current user
 */
router.get(
  '/my',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.query.companyId as string || req.user!.companyId;
    const channels = await channelService.getChannelsForUser(req.user!.userId, companyId, {
      includeArchived: req.query.includeArchived === 'true',
    });

    // Get unread counts
    const unreadCounts = await channelService.getUnreadCounts(req.user!.userId);

    const channelsWithUnread = channels.map((channel) => ({
      ...channel.toObject(),
      unreadCount: unreadCounts[channel.channelId] || 0,
    }));

    res.json({
      success: true,
      data: channelsWithUnread,
    });
  })
);

/**
 * Get channel by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const channel = await channelService.getChannel(req.params.id);

    res.json({
      success: true,
      data: channel,
    });
  })
);

/**
 * Update channel
 */
router.patch(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = validateRequest(updateChannelSchema)(req, res, () => {});

    const channel = await channelService.updateChannel(
      req.params.id,
      req.user!.userId,
      validatedData
    );

    res.json({
      success: true,
      data: channel,
      message: 'Channel updated successfully',
    });
  })
);

/**
 * Archive channel
 */
router.post(
  '/:id/archive',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const channel = await channelService.archiveChannel(req.params.id, req.user!.userId);

    res.json({
      success: true,
      data: channel,
      message: 'Channel archived successfully',
    });
  })
);

/**
 * Restore channel from archive
 */
router.post(
  '/:id/restore',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const channel = await channelService.updateChannel(
      req.params.id,
      req.user!.userId,
      { isArchived: false }
    );

    res.json({
      success: true,
      data: channel,
      message: 'Channel restored successfully',
    });
  })
);

/**
 * Delete channel (hard delete)
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await channelService.deleteChannel(req.params.id, req.user!.userId);

    res.json({
      success: true,
      message: 'Channel deleted successfully',
    });
  })
);

/**
 * Add members to channel
 */
router.post(
  '/:id/members',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'memberIds must be a non-empty array',
      });
      return;
    }

    const channel = await channelService.addMembers(
      req.params.id,
      req.user!.userId,
      memberIds
    );

    res.json({
      success: true,
      data: channel,
      message: `Added ${memberIds.length} member(s) to channel`,
    });
  })
);

/**
 * Remove member from channel
 */
router.delete(
  '/:id/members/:userId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const channel = await channelService.removeMember(
      req.params.id,
      req.user!.userId,
      req.params.userId
    );

    res.json({
      success: true,
      data: channel,
      message: 'Member removed from channel',
    });
  })
);

/**
 * Leave channel
 */
router.post(
  '/:id/leave',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const channel = await channelService.leaveChannel(req.params.id, req.user!.userId);

    res.json({
      success: true,
      data: channel,
      message: 'You have left the channel',
    });
  })
);

/**
 * Add admin to channel
 */
router.post(
  '/:id/admins/:userId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const channel = await channelService.addAdmin(
      req.params.id,
      req.user!.userId,
      req.params.userId
    );

    res.json({
      success: true,
      data: channel,
      message: 'Admin added to channel',
    });
  })
);

/**
 * Remove admin from channel
 */
router.delete(
  '/:id/admins/:userId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const channel = await channelService.removeAdmin(
      req.params.id,
      req.user!.userId,
      req.params.userId
    );

    res.json({
      success: true,
      data: channel,
      message: 'Admin removed from channel',
    });
  })
);

/**
 * Clear unread count
 */
router.post(
  '/:id/read',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await channelService.clearUnread(req.params.id, req.user!.userId);

    res.json({
      success: true,
      message: 'Marked channel as read',
    });
  })
);

/**
 * Get channels for a project
 */
router.get(
  '/project/:projectId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const channels = await channelService.getChannelsForProject(req.params.projectId);

    res.json({
      success: true,
      data: channels,
    });
  })
);

export default router;
