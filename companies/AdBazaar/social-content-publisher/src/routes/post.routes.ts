import { Router, Response } from 'express';
import { z } from 'zod';
import { postService } from '../services/post.service';
import { queueService } from '../services/queue.service';
import { publishingService } from '../services/publishing.service';
import { asyncHandler, AuthenticatedRequest, internalServiceAuth } from '../middleware';
import {
  createPostSchema,
  updatePostSchema,
  schedulePostSchema,
  submitReviewSchema,
  approvePostSchema,
  rejectPostSchema,
  paginationSchema,
} from '../middleware/validation.middleware';
import { getStartOfWeek, getEndOfWeek } from '../utils';

const router = Router();

// Apply auth middleware to all routes
router.use(internalServiceAuth);

// Create unified post
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validated = createPostSchema.parse(req.body);
    const { userId, companyId } = req.user!;

    const post = await postService.create({
      title: validated.title,
      content: validated.content,
      platforms: validated.platforms,
      scheduledTime: validated.scheduledTime ? new Date(validated.scheduledTime) : undefined,
      userId,
      companyId,
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  })
);

// List all posts
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;
    const pagination = paginationSchema.parse(req.query);

    const result = await postService.findAll(
      {
        companyId,
        status: pagination.status,
        workflowStatus: pagination.workflowStatus,
        startDate: pagination.startDate ? new Date(pagination.startDate) : undefined,
        endDate: pagination.endDate ? new Date(pagination.endDate) : undefined,
      },
      pagination
    );

    res.json({
      success: true,
      ...result,
    });
  })
);

// Get post by ID
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;
    const post = await postService.findByIdAndCompany(req.params.id, companyId);

    res.json({
      success: true,
      data: post,
    });
  })
);

// Update post
router.patch(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, companyId } = req.user!;
    const validated = updatePostSchema.parse(req.body);

    const post = await postService.update(req.params.id, userId, {
      title: validated.title,
      content: validated.content,
      platforms: validated.platforms,
      scheduledTime: validated.scheduledTime ? new Date(validated.scheduledTime) : null,
    });

    res.json({
      success: true,
      data: post,
    });
  })
);

// Delete post
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await postService.delete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  })
);

// Publish now
router.post(
  '/:id/publish',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;

    const post = await postService.findByIdAndCompany(id, companyId);

    // Check workflow approval
    if (post.workflow.status !== 'approved' && post.workflow.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot publish post with workflow status: ${post.workflow.status}`,
      });
    }

    // Publish to all platforms
    const publishResults: any = {};
    for (const platformConfig of post.platforms) {
      if (!platformConfig.enabled) continue;

      const result = await publishingService.publish(platformConfig.platform, {
        text: post.content.text,
        media: post.content.media,
        adaptedContent: platformConfig.adaptedContent,
        accountId: platformConfig.accountId,
        accessToken: '', // Would be fetched from platform service
      });

      publishResults[platformConfig.platform] = result;

      if (result.success && result.publishedId) {
        await queueService.markAsPublished(id, platformConfig.platform);
      }
    }

    res.json({
      success: true,
      data: {
        postId: id,
        results: publishResults,
      },
    });
  })
);

// Schedule post
router.post(
  '/:id/schedule',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;
    const validated = schedulePostSchema.parse(req.body);

    const post = await postService.findByIdAndCompany(id, companyId);
    const scheduledTime = new Date(validated.scheduledTime);

    // Check for conflicts
    const conflicts = await postService.checkConflicts(companyId, scheduledTime, id);
    if (conflicts.hasConflict) {
      return res.status(409).json({
        success: false,
        error: 'Scheduling conflict detected',
        conflictingPosts: conflicts.conflictingPosts,
      });
    }

    // Update post and create queue items
    await postService.update(id, req.user!.userId, { scheduledTime });
    await queueService.createQueueItems(
      id,
      scheduledTime,
      post.platforms.map((p) => p.platform)
    );

    res.json({
      success: true,
      data: {
        postId: id,
        scheduledTime,
      },
    });
  })
);

// Submit for review
router.post(
  '/:id/submit-review',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user!;
    const validated = submitReviewSchema.parse(req.body);

    const post = await postService.submitForReview(id, userId);

    res.json({
      success: true,
      data: post,
    });
  })
);

// Approve post
router.post(
  '/:id/approve',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user!;
    const validated = approvePostSchema.parse(req.body);

    const post = await postService.approve(id, userId, validated.notes);

    res.json({
      success: true,
      data: post,
    });
  })
);

// Reject post
router.post(
  '/:id/reject',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user!;
    const validated = rejectPostSchema.parse(req.body);

    const post = await postService.reject(id, userId, validated.notes);

    res.json({
      success: true,
      data: post,
    });
  })
);

// Get version history
router.get(
  '/:id/history',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;
    await postService.findByIdAndCompany(req.params.id, companyId);

    const history = await postService.getVersionHistory(req.params.id);

    res.json({
      success: true,
      data: history,
    });
  })
);

export default router;