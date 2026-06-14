import { Router, Response } from 'express';
import { announcementService } from '../services/announcementService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, validateRequest } from '../middleware/errorHandler.js';
import { createAnnouncementSchema, updateAnnouncementSchema } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Create a new announcement
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = validateRequest(createAnnouncementSchema)(req, res, () => {});

    const announcement = await announcementService.createAnnouncement({
      ...validatedData,
      authorId: req.user!.userId,
      authorName: req.user!.name,
      authorAvatar: req.user!.avatar,
      companyId: req.user!.companyId,
    });

    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully',
    });
  })
);

/**
 * List announcements for company
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.query.companyId as string || req.user!.companyId;
    const { announcements, total, page, limit } = await announcementService.listAnnouncements(companyId, {
      category: req.query.category as any,
      priority: req.query.priority as any,
      departmentId: req.query.departmentId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      includeExpired: req.query.includeExpired === 'true',
    });

    res.json({
      success: true,
      data: {
        items: announcements,
        total,
        page,
        limit,
        hasMore: page * limit < total,
      },
    });
  })
);

/**
 * Get recent announcements
 */
router.get(
  '/recent',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.query.companyId as string || req.user!.companyId;
    const announcements = await announcementService.getRecent(companyId, {
      limit: parseInt(req.query.limit as string) || 10,
    });

    res.json({
      success: true,
      data: announcements,
    });
  })
);

/**
 * Get priority announcements (high/urgent)
 */
router.get(
  '/priority',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.query.companyId as string || req.user!.companyId;
    const announcements = await announcementService.getPriorityAnnouncements(companyId, {
      limit: parseInt(req.query.limit as string) || 5,
    });

    res.json({
      success: true,
      data: announcements,
    });
  })
);

/**
 * Get announcement by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const announcement = await announcementService.getAnnouncement(req.params.id);

    res.json({
      success: true,
      data: announcement,
    });
  })
);

/**
 * Update an announcement
 */
router.patch(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = validateRequest(updateAnnouncementSchema)(req, res, () => {});

    const announcement = await announcementService.updateAnnouncement(
      req.params.id,
      req.user!.userId,
      validatedData
    );

    res.json({
      success: true,
      data: announcement,
      message: 'Announcement updated successfully',
    });
  })
);

/**
 * Delete an announcement
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await announcementService.deleteAnnouncement(req.params.id, req.user!.userId);

    res.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  })
);

/**
 * Track view for an announcement
 */
router.post(
  '/:id/view',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const announcement = await announcementService.trackView(req.params.id, req.user!.userId);

    res.json({
      success: true,
      data: { views: announcement.views },
    });
  })
);

/**
 * Add reaction to an announcement
 */
router.post(
  '/:id/reactions',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { emoji } = req.body;

    if (!emoji) {
      res.status(400).json({
        success: false,
        error: 'Emoji is required',
      });
      return;
    }

    const announcement = await announcementService.addReaction(
      req.params.id,
      req.user!.userId,
      req.user!.name,
      emoji
    );

    res.json({
      success: true,
      data: announcement,
      message: 'Reaction added',
    });
  })
);

/**
 * Get unread announcements count
 */
router.get(
  '/stats/unread',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.query.companyId as string || req.user!.companyId;
    const count = await announcementService.getUnreadCount(companyId, req.user!.userId);

    res.json({
      success: true,
      data: { count },
    });
  })
);

/**
 * Get announcement statistics
 */
router.get(
  '/stats/summary',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.query.companyId as string || req.user!.companyId;
    const stats = await announcementService.getStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * Get announcements by category
 */
router.get(
  '/category/:category',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.query.companyId as string || req.user!.companyId;
    const { announcements, total } = await announcementService.getByCategory(
      companyId,
      req.params.category as any,
      {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      }
    );

    res.json({
      success: true,
      data: {
        items: announcements,
        total,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        hasMore: parseInt(req.query.page as string) * parseInt(req.query.limit as string) < total,
      },
    });
  })
);

/**
 * Publish a scheduled announcement
 */
router.post(
  '/:id/publish',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const announcement = await announcementService.publish(req.params.id);

    res.json({
      success: true,
      data: announcement,
      message: 'Announcement published',
    });
  })
);

export default router;
